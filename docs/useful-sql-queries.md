# Useful SQL Queries for Chinese Learning Database

## Viewing Data

### See all characters ready to learn
```sql
SELECT c.character, c.mandarin_pinyin, c.definition, c.frequency_rank
FROM characters c
JOIN user_progress p ON c.id = p.character_id
WHERE p.introduced = 0
ORDER BY c.frequency_rank ASC;
```

### See all introduced characters
```sql
SELECT c.character, c.mandarin_pinyin, p.times_reviewed, p.current_interval_days
FROM characters c
JOIN user_progress p ON c.id = p.character_id
WHERE p.introduced = 1
ORDER BY p.current_interval_days ASC;
```

### Check app settings
```sql
SELECT * FROM app_settings;
```

### See characters due for review
```sql
SELECT c.character, c.mandarin_pinyin, p.next_review_date
FROM characters c
JOIN user_progress p ON c.id = p.character_id
WHERE p.introduced = 1
  AND p.next_review_date <= datetime('now')
ORDER BY p.next_review_date ASC;
```

## Making Edits

### Reset a character's progress
```sql
UPDATE user_progress
SET current_interval_days = 0.0417,
    times_reviewed = 0,
    times_correct = 0,
    times_incorrect = 0,
    next_review_date = datetime('now')
WHERE character_id = (SELECT id FROM characters WHERE character = '你');
```

### Mark character as introduced
```sql
UPDATE user_progress
SET introduced = 1,
    next_review_date = datetime('now', '+1 hour')
WHERE character_id = (SELECT id FROM characters WHERE character = '你');
```

### Change unlock timer (for testing)
```sql
-- Set last unlock to 3 days ago (to test auto-unlock)
UPDATE app_settings
SET value = datetime('now', '-3 days')
WHERE key = 'last_unlock_date';

-- Reset timer to allow immediate unlock
UPDATE app_settings
SET value = ''
WHERE key = 'last_unlock_date';
```

### Reset all progress (start fresh)
```sql
DELETE FROM user_progress;
```

### Add characters to ready-to-learn queue
```sql
-- Add characters 31-40 to queue (for testing)
INSERT INTO user_progress (character_id, current_interval_days, previous_interval_days, next_review_date, introduced)
SELECT c.id, 0.0417, 0.0417, datetime('now'), 0
FROM characters c
WHERE c.is_word = 0
  AND c.frequency_rank BETWEEN 31 AND 40
  AND NOT EXISTS (
    SELECT 1 FROM user_progress p WHERE p.character_id = c.id
  );
```

### Check database statistics
```sql
-- Total characters
SELECT COUNT(*) as total_characters FROM characters WHERE is_word = 0;

-- Characters in progress
SELECT COUNT(*) as in_progress FROM user_progress;

-- Ready to learn
SELECT COUNT(*) as ready_to_learn FROM user_progress WHERE introduced = 0;

-- Currently studying
SELECT COUNT(*) as studying FROM user_progress WHERE introduced = 1;

-- Due for review
SELECT COUNT(*) as due_now FROM user_progress
WHERE introduced = 1 AND next_review_date <= datetime('now');
```

## Testing Time-Based Unlocking

### Simulate 2-day wait completed
```sql
-- Step 1: Make sure all characters are introduced
UPDATE user_progress SET introduced = 1 WHERE introduced = 0;

-- Step 2: Set last unlock date to 3 days ago
UPDATE app_settings
SET value = datetime('now', '-72 hours')
WHERE key = 'last_unlock_date';

-- Step 3: Reload dashboard - should auto-unlock 10 more characters
```

### Check when next unlock will happen
```sql
SELECT
    key,
    value as last_unlock,
    CAST((julianday('now') - julianday(value)) * 24 AS INTEGER) as hours_since_unlock,
    CASE
        WHEN value = '' THEN 'Ready to unlock'
        WHEN (julianday('now') - julianday(value)) * 24 >= 48 THEN 'Ready to unlock'
        ELSE CAST(48 - (julianday('now') - julianday(value)) * 24 AS INTEGER) || ' hours remaining'
    END as status
FROM app_settings
WHERE key = 'last_unlock_date';
```

## Advanced Queries

### Find characters by difficulty (based on review performance)
```sql
SELECT
    c.character,
    c.mandarin_pinyin,
    p.times_reviewed,
    p.times_correct,
    p.times_incorrect,
    CAST(p.times_correct * 100.0 / NULLIF(p.times_reviewed, 0) AS INTEGER) as accuracy_percent
FROM characters c
JOIN user_progress p ON c.id = p.character_id
WHERE p.times_reviewed > 0
ORDER BY accuracy_percent ASC, p.times_reviewed DESC
LIMIT 20;
```

### Check SRS intervals distribution
```sql
SELECT
    CASE
        WHEN current_interval_days < 0.5 THEN '< 12 hours'
        WHEN current_interval_days < 1 THEN '12-24 hours'
        WHEN current_interval_days < 3 THEN '1-3 days'
        WHEN current_interval_days < 7 THEN '3-7 days'
        WHEN current_interval_days < 30 THEN '1-4 weeks'
        ELSE '1+ month'
    END as interval_range,
    COUNT(*) as count
FROM user_progress
WHERE introduced = 1
GROUP BY interval_range
ORDER BY MIN(current_interval_days);
```
