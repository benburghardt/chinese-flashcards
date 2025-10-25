# Implementation Plan: SRS Mastery System, Word Introduction, and Definition Improvements

## Overview
Three major improvements to the learning system:
1. Mastery system with ease factor 2.25 (max)
2. Half-hour review time rounding and improved calendar display
3. Word introduction logic based on character prerequisites

---

## Task 1: Mastery System & Ease Factor Adjustment

### Timeline to Mastery (Ease Factor 2.25)
```
Introduction:      0 days
1st review ():   +1 hour        = 1 hour total
2nd review ():   +12 hours      = 13 hours total
3rd review ():   +1 day         = 1d 13h total
4th review ():   +3 days        = 4d 13h total
5th review ():   +7 days        = 11d 13h total
6th review ():   +15.75 days    = 27.13 days total
7th review ():   +35.4 days     = 62.53 days total (~2 months)
8th review ():   +79.65 days    = 142.18 days total (~4.7 months)
9th review ():   +179.2 days    = 321.38 days total (~10.6 months)
MASTERED after 9th correct review
```

### Implementation Steps

#### 1.1 Update Schema
**File:** `src-tauri/src/database/schema.sql`

Add field to track mastery:
```sql
ALTER TABLE user_progress ADD COLUMN is_mastered BOOLEAN DEFAULT 0;
```

Create migration in `database/mod.rs`:
```rust
// Migration 3: Add mastery tracking
if version < 3 {
    conn.execute(
        "ALTER TABLE user_progress ADD COLUMN is_mastered BOOLEAN DEFAULT 0",
        []
    )?;
    conn.execute(
        "INSERT INTO schema_version (version, description)
         VALUES (3, 'Add mastery tracking')",
        []
    )?;
}
```

#### 1.2 Update SRS Algorithm
**File:** `src-tauri/src/srs/mod.rs`

Change default ease factor:
```rust
// Line 86 - Change ease factor cap
// OLD: No cap
// NEW: Cap at 2.25
(new_interval, ease.min(2.25))
```

Update schema default:
```sql
-- database/schema.sql
ease_factor REAL DEFAULT 2.25,  -- Changed from 2.5
```

#### 1.3 Implement Mastery Detection
**File:** `src-tauri/src/database/mod.rs`

In `record_srs_answer()` function (around line 278):
```rust
// After calculating SRS update
let update = calculate_next_review(&card, correct);

// Check for mastery (9 correct reviews total)
let is_newly_mastered = correct &&
                        card.times_correct + 1 >= 9 &&
                        !card.has_reached_week; // Reuse this or add is_mastered

// If mastered, mark in database
if is_newly_mastered {
    conn.execute(
        "UPDATE user_progress
         SET is_mastered = 1, next_review_date = NULL
         WHERE character_id = ?1",
        [character_id]
    )?;
    println!("[SRS] Character {} MASTERED after {} correct reviews!",
             character_id, card.times_correct + 1);
}
```

#### 1.4 Exclude Mastered Cards from Reviews
**File:** `src-tauri/src/database/mod.rs`

Update `get_due_cards()` query (line 233):
```sql
SELECT c.id, c.character, c.mandarin_pinyin, c.definition,
       p.current_interval_days, p.times_reviewed
FROM characters c
JOIN user_progress p ON c.id = p.character_id
WHERE p.introduced = 1
  AND p.is_mastered = 0  -- ADD THIS LINE
  AND p.next_review_date <= datetime('now')
ORDER BY p.next_review_date ASC
```

---

## Task 2: Half-Hour Rounding & Calendar Improvements

### 2.1 Implement Half-Hour Rounding
**File:** `src-tauri/src/database/mod.rs`

Add helper function before `record_srs_answer()`:
```rust
use chrono::{DateTime, Utc, Timelike};

fn round_down_to_half_hour(dt: DateTime<Utc>) -> DateTime<Utc> {
    let minute = dt.minute();
    let rounded_minute = if minute < 30 { 0 } else { 30 };

    dt.with_minute(rounded_minute).unwrap()
      .with_second(0).unwrap()
      .with_nanosecond(0).unwrap()
}
```

Apply rounding in `record_srs_answer()` (after line 291):
```rust
let update = calculate_next_review(&card, correct);

// Round to nearest half hour
let next_review_rounded = round_down_to_half_hour(update.next_review_date);

// Convert to SQLite datetime format
let next_review_sqlite = next_review_rounded.format("%Y-%m-%d %H:%M:%S").to_string();
```

### 2.2 Update Calendar Query
**File:** `src-tauri/src/commands/mod.rs`

Update `get_review_calendar()` function (around line 678):
```rust
let mut stmt = conn.prepare(
    "SELECT next_review_date,
            COUNT(*) as cards_due
     FROM user_progress
     WHERE introduced = 1
       AND is_mastered = 0
       AND next_review_date IS NOT NULL
       AND next_review_date > datetime('now')
       AND DATE(next_review_date) <= DATE('now', '+' || ?1 || ' days')
     GROUP BY next_review_date
     ORDER BY next_review_date ASC"
).map_err(|e| e.to_string())?;
```

Update return type:
```rust
#[derive(serde::Serialize)]
pub struct ReviewCalendarEntry {
    pub review_time: String,  // Changed from 'date' - now includes time
    pub cards_due: i32,
}
```

### 2.3 Update Frontend Calendar Display
**File:** `src/components/Dashboard/Dashboard.tsx`

Update calendar rendering (around line 244):
```typescript
{calendar.map((entry) => {
  // Parse full datetime (already in half-hour blocks)
  const reviewTime = new Date(entry.review_time + 'Z'); // UTC
  const isToday = reviewTime.toDateString() === new Date().toDateString();

  // Format as "Today 2:30 PM" or "Oct 25 2:30 PM"
  const dateStr = isToday
    ? 'Today'
    : reviewTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const timeStr = reviewTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div key={entry.review_time} className={`calendar-slot ${isToday ? 'today' : ''}`}>
      <div className="calendar-datetime">
        <span className="date">{dateStr}</span>
        <span className="time">{timeStr}</span>
      </div>
      <div className="calendar-count">{entry.cards_due} cards</div>
    </div>
  );
})}
```

---

## Task 3: Word Introduction System

### 3.1 Component Character Tracking

#### Database Verification
Ensure `component_characters` field exists in characters table:
```sql
-- In schema.sql
component_characters TEXT,  -- For words: comma-separated character IDs
```

#### Populate Component Characters
**File:** Data processing script (to be created)

Parse CC-CEDICT to extract component characters for words:
```rust
// For word entries like "-ý"
// Extract individual characters: -, ý
// Look up their IDs in database
// Store as: "123,456"
```

### 3.2 Word Eligibility Query

**File:** `src-tauri/src/database/mod.rs`

Create new function:
```rust
/// Get words that are eligible for introduction
/// (all component characters have been introduced)
pub fn get_eligible_words(conn: &Connection, limit: usize) -> Result<Vec<Character>> {
    let mut stmt = conn.prepare(
        "SELECT c.id, c.character, c.simplified, c.traditional,
                c.mandarin_pinyin, c.definition, c.frequency_rank, c.is_word,
                c.component_characters
         FROM characters c
         WHERE c.is_word = 1
           AND NOT EXISTS (
               SELECT 1 FROM user_progress p WHERE p.character_id = c.id
           )
           -- All component characters must be introduced
           AND NOT EXISTS (
               -- Parse component_characters and check each
               SELECT 1
               FROM (
                 -- This needs SQLite JSON or custom parsing
                 -- Alternatively, do this check in Rust
               )
           )
         ORDER BY c.frequency_rank ASC
         LIMIT ?1"
    )?;

    // TODO: Implement component character checking in Rust
    // Fetch words and filter based on component_characters
}
```

**Better approach - Check in Rust:**
```rust
pub fn get_eligible_words(conn: &Connection, limit: usize) -> Result<Vec<Character>> {
    // Get all words not yet in user_progress
    let mut stmt = conn.prepare(
        "SELECT c.id, c.character, c.simplified, c.traditional,
                c.mandarin_pinyin, c.definition, c.frequency_rank,
                c.is_word, c.component_characters
         FROM characters c
         WHERE c.is_word = 1
           AND NOT EXISTS (
               SELECT 1 FROM user_progress p WHERE p.character_id = c.id
           )
         ORDER BY c.frequency_rank ASC"
    )?;

    let words: Vec<Character> = stmt.query_map([], |row| {
        Ok(Character {
            id: row.get(0)?,
            character: row.get(1)?,
            simplified: row.get(2)?,
            traditional: row.get(3)?,
            mandarin_pinyin: row.get(4)?,
            definition: row.get(5)?,
            frequency_rank: row.get(6)?,
            is_word: row.get(7)?,
            component_characters: row.get(8)?,
        })
    })?.collect::<Result<Vec<_>>>()?;

    // Filter words where all components are introduced
    let mut eligible_words = Vec::new();

    for word in words {
        if let Some(components) = &word.component_characters {
            let comp_ids: Vec<i32> = components
                .split(',')
                .filter_map(|s| s.trim().parse().ok())
                .collect();

            // Check if all components are introduced
            let all_introduced = comp_ids.iter().all(|comp_id| {
                conn.query_row(
                    "SELECT introduced FROM user_progress WHERE character_id = ?1",
                    [comp_id],
                    |row| row.get::<_, bool>(0)
                ).unwrap_or(false)
            });

            if all_introduced {
                eligible_words.push(word);
                if eligible_words.len() >= limit {
                    break;
                }
            }
        }
    }

    Ok(eligible_words)
}
```

### 3.3 Mixed Character/Word Introduction

**Design Decision: Frequency-Based Weighted Scoring**

Create a unified scoring system:
```rust
fn calculate_introduction_score(item: &Character, conn: &Connection) -> f64 {
    if item.is_word {
        // Word scoring: Average of word frequency and component frequencies
        let word_freq = item.frequency_rank as f64;

        let component_freqs: Vec<f64> = if let Some(components) = &item.component_characters {
            components.split(',')
                .filter_map(|s| s.trim().parse::<i32>().ok())
                .filter_map(|comp_id| {
                    conn.query_row(
                        "SELECT c.frequency_rank
                         FROM characters c WHERE c.id = ?1",
                        [comp_id],
                        |row| row.get::<_, i32>(0)
                    ).ok().map(|f| f as f64)
                })
                .collect()
        } else {
            vec![]
        };

        if component_freqs.is_empty() {
            word_freq
        } else {
            let avg_component_freq = component_freqs.iter().sum::<f64>() / component_freqs.len() as f64;
            // Weighted average: 60% word frequency, 40% component frequency
            (word_freq * 0.6) + (avg_component_freq * 0.4)
        }
    } else {
        // Character scoring: Just use frequency rank
        item.frequency_rank as f64
    }
}
```

**Modified unlock function:**
```rust
pub fn unlock_next_batch_mixed(conn: &Connection, batch_size: usize) -> Result<Vec<Character>> {
    // Get eligible characters
    let eligible_chars = get_eligible_characters(conn, batch_size * 2)?;

    // Get eligible words
    let eligible_words = get_eligible_words(conn, batch_size * 2)?;

    // Combine and score
    let mut all_eligible: Vec<(Character, f64)> = eligible_chars
        .into_iter()
        .chain(eligible_words)
        .map(|item| {
            let score = calculate_introduction_score(&item, conn);
            (item, score)
        })
        .collect();

    // Sort by score (lower is better = more frequent)
    all_eligible.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());

    // Take top N
    let selected: Vec<Character> = all_eligible
        .into_iter()
        .take(batch_size)
        .map(|(item, _)| item)
        .collect();

    Ok(selected)
}
```

### 3.4 Display Order in Dictionary

**File:** `src/components/Dictionary/Dictionary.tsx`

Update browse query to show introduction order:
```typescript
// Sort by the same scoring algorithm
const calculateScore = (char) => {
  if (char.is_word && char.component_characters) {
    // Calculate weighted score as in Rust
    // This ensures dictionary shows same order as introduction
  }
  return char.frequency_rank;
};

characters.sort((a, b) => calculateScore(a) - calculateScore(b));
```

---

## Task 4: Definition Quality Improvements

### 4.1 Definition Filtering Rules

**File:** Data processing / import script

Implement definition cleanup:
```rust
fn clean_definition(raw_definition: &str) -> String {
    let lines: Vec<&str> = raw_definition.split('/').collect();

    let mut cleaned_lines = Vec::new();

    for line in lines {
        let trimmed = line.trim();

        // Skip unwanted definition types
        if trimmed.is_empty() ||
           trimmed.starts_with("surname") ||
           trimmed.starts_with("used in") ||
           trimmed.starts_with("variant of") {
            continue;
        }

        // Prefer primary meanings
        // For : has "Xia dynasty" and "summer"
        // Prefer "summer" (appears later, more common usage)
        cleaned_lines.push(trimmed);

        // Keep only first 3 definitions
        if cleaned_lines.len() >= 3 {
            break;
        }
    }

    cleaned_lines.join("; ")
}
```

### 4.2 Priority Definition Selection

**Special handling for characters with multiple meanings:**

```rust
fn prioritize_definition(char_id: i32, definitions: Vec<&str>) -> String {
    // Deprioritize historical/rare meanings
    let deprioritized = [
        "dynasty",
        "historical",
        "ancient",
        "classical",
        "literary",
    ];

    let prioritized = [
        "summer", "winter", "spring", "autumn",  // Seasons
        "day", "month", "year",  // Time
        "good", "bad", "big", "small",  // Common adjectives
    ];

    // Check for prioritized meanings first
    for def in &definitions {
        for keyword in &prioritized {
            if def.to_lowercase().contains(keyword) {
                return def.to_string();
            }
        }
    }

    // Then exclude deprioritized
    for def in &definitions {
        let is_deprioritized = deprioritized.iter()
            .any(|keyword| def.to_lowercase().contains(keyword));
        if !is_deprioritized {
            return def.to_string();
        }
    }

    // Fallback to first definition
    definitions[0].to_string()
}
```

### 4.3 Manual Review List

Generate report for review:
```rust
// After processing all definitions
let mut review_needed = Vec::new();

for character in all_characters {
    if character.definition.len() > 60 {
        review_needed.push((character.id, character.character, "Too long"));
    }
    if character.definition.contains("surname") {
        review_needed.push((character.id, character.character, "Surname only"));
    }
    // etc...
}

// Write to file for manual review
write_review_list("definition_review.csv", review_needed);
```

---

## Implementation Priority

### Phase 1: Critical (Implement First)
1. Mastery system (Schema + SRS algorithm)
2. Half-hour rounding
3. Calendar improvements

### Phase 2: Word System
4. Component character population (data processing)
5. Word eligibility checking
6. Mixed introduction algorithm

### Phase 3: Quality
7. Definition cleanup
8. Manual review process

---

## Testing Plan

### Test Scenarios

**Mastery System:**
- Create character with 8 correct reviews, verify 9th marks as mastered
- Verify mastered cards don't appear in reviews
- Check dashboard shows mastered count

**Half-Hour Rounding:**
- Review at 2:17 PM ’ next review rounds to 2:00 or 2:30
- Calendar shows grouped time slots
- Multiple cards at same time show combined count

**Word Introduction:**
- Introduce characters - and ý
- Verify -ý becomes eligible
- Check introduction order mixes chars and words by frequency score

**Definitions:**
- Verify  shows "summer" not "Xia dynasty"
- Check no "surname" or "variant of" primary definitions
- Verify max 3 definitions per character

---

## Files to Modify

### Backend (Rust)
- `src-tauri/src/database/schema.sql` - Add is_mastered field
- `src-tauri/src/database/mod.rs` - Migrations, mastery logic, word eligibility
- `src-tauri/src/srs/mod.rs` - Ease factor cap at 2.25
- `src-tauri/src/commands/mod.rs` - Calendar query updates

### Frontend (TypeScript/React)
- `src/components/Dashboard/Dashboard.tsx` - Calendar display by 30-min slots
- `src/components/Dictionary/Dictionary.tsx` - Show introduction order

### Data Processing
- New script: `data-processing/src/bin/clean_definitions.rs`
- Update: `data-processing/src/bin/parse_cedict.rs` - Component character extraction

---

## Notes

- Token limit approaching - continue in new conversation with this plan
- Review cumulative timeline: 321 days to mastery (10.6 months)
- First review is 1 hour after introduction (confirmed)
- Frequency scoring ensures natural mixing of characters and words
- Definition quality critical for learning effectiveness
