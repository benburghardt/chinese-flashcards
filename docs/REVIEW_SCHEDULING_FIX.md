# Review Scheduling Bug Fix

**Date:** October 24, 2025
**Issues Fixed:** Review scheduling and timezone display bugs

## Problem Summary

Two critical bugs were preventing the SRS (Spaced Repetition System) from working correctly:

1. **Cards not returning to review pool** - After completing a review session, cards would not appear in future review sessions even when their review interval had elapsed.
2. **Incorrect timezone display** - Review times in the "Upcoming Reviews" dashboard section showed incorrect times that didn't match the user's local timezone.

## Root Cause Analysis

### Issue 1: Review Calendar Query Logic

**Location:** `src-tauri/src/commands/mod.rs:674-702` (function `get_review_calendar`)

**Problem:** The SQL query for fetching upcoming reviews was not filtering out cards with past or current review dates:

```sql
-- BROKEN QUERY
SELECT DATE(next_review_date) as review_date,
       COUNT(*) as cards_due,
       MIN(next_review_date) as earliest_time
FROM user_progress
WHERE introduced = 1
  AND next_review_date IS NOT NULL
  AND DATE(next_review_date) <= DATE('now', '+' || ?1 || ' days')
GROUP BY review_date
```

**Why this was broken:**
- When cards were reviewed, their `next_review_date` was updated to a future time (e.g., 1 hour from now)
- However, the calendar query would group ALL cards by date, including cards whose review time was in the past
- For cards reviewed today, `MIN(next_review_date)` would return the session start time (when the card became due), not the future review time
- This caused the calendar to display stale data and cards appeared "stuck" at their review time instead of showing their next scheduled review

**The Fix:**
Added `AND next_review_date > datetime('now')` to only include cards with **future** review dates:

```sql
-- FIXED QUERY
SELECT DATE(next_review_date) as review_date,
       COUNT(*) as cards_due,
       MIN(next_review_date) as earliest_time
FROM user_progress
WHERE introduced = 1
  AND next_review_date IS NOT NULL
  AND next_review_date > datetime('now')      -- ✅ NEW: Only future reviews
  AND DATE(next_review_date) <= DATE('now', '+' || ?1 || ' days')
GROUP BY review_date
```

**Impact:**
- Cards now properly disappear from the calendar after being reviewed
- Cards reappear at their correct future review time
- The "Upcoming Reviews" section shows accurate future review schedules
- Cards return to the review pool when their interval elapses

### Issue 2: Timezone Handling

**Location:** `src/components/Dashboard/Dashboard.tsx:250-252`

**Problem:** The SQLite database stores all timestamps in UTC format using `datetime('now')`, which produces strings like `"2025-10-24 17:30:00"` (no timezone indicator). When JavaScript's `new Date()` constructor receives this string, it interprets it as **local time**, not UTC.

**Example of the bug:**
- Database stores: `"2025-10-24 17:30:00"` (UTC)
- User's timezone: PST (UTC-8)
- JavaScript interprets as: `"2025-10-24 17:30:00 PST"`
- Displays: 17:30 PST
- **Should display:** 09:30 PST (17:30 UTC converted to local time)

**The Fix:**
Explicitly append `' UTC'` to the datetime string before parsing:

```typescript
// BEFORE (BROKEN)
const reviewTime = new Date(entry.earliest_review_time);

// AFTER (FIXED)
// Parse SQLite UTC datetime as UTC, then convert to local time
// SQLite format: "YYYY-MM-DD HH:MM:SS" (stored in UTC)
const reviewTime = new Date(entry.earliest_review_time + ' UTC');
```

**Impact:**
- Review times now display correctly in the user's local timezone
- Users see when reviews are actually due in their own time
- Consistent time display across different timezones

## Technical Details

### Database Time Storage

All timestamps in the `user_progress` table are stored in UTC:
- `next_review_date`: When the card should be reviewed next (UTC)
- `last_reviewed`: When the card was last reviewed (UTC)
- `updated_at`: When the record was last modified (UTC)

SQLite's `datetime('now')` returns UTC time in the format `"YYYY-MM-DD HH:MM:SS"`.

### SRS Algorithm Flow

1. **Card is reviewed**: User answers correct/incorrect
2. **Backend calculates next interval**: Using `calculate_next_review()` in `srs/mod.rs`
   - Calculates new interval based on SRS algorithm (1h → 12h → 1d → 3d → 7d → exponential)
   - Returns `next_review_date` as a Rust `DateTime<Utc>`
3. **Database is updated**: `record_srs_answer()` in `database/mod.rs`
   - Converts `DateTime<Utc>` to SQLite format: `next_review_date.format("%Y-%m-%d %H:%M:%S")`
   - Updates `user_progress` table with new UTC timestamp
4. **Frontend queries dashboard**: Calls `get_review_calendar()`
   - Query filters for `next_review_date > datetime('now')` (only future reviews)
   - Groups by date and finds earliest review time per day
5. **Frontend displays time**: Dashboard.tsx
   - Parses UTC string as UTC: `new Date(time + ' UTC')`
   - Browser automatically converts to local timezone for display

### Why This Fix Is Correct

**For Issue 1:**
- The query now correctly represents "upcoming" reviews (future only)
- Previously reviewed cards with updated intervals now properly show their new schedule
- Cards that are currently due (past their review time) are correctly fetched by the separate `get_due_cards()` query

**For Issue 2:**
- JavaScript Date constructor with explicit timezone handles the UTC → local conversion
- No changes needed to database storage (remains UTC)
- No changes needed to backend Rust code (continues using UTC)
- Only the presentation layer (frontend) needed adjustment

## Testing Recommendations

To verify the fixes work correctly:

1. **Test Review Scheduling:**
   ```
   a. Start a review session with cards due
   b. Complete the review (answer all cards)
   c. Check the dashboard - "Upcoming Reviews" should show future times
   d. Cards should NOT appear in "Due Today" count immediately
   e. Wait for interval to elapse (or manually adjust DB to test)
   f. Cards should reappear in "Due Today" count
   ```

2. **Test Timezone Display:**
   ```
   a. Note your system timezone
   b. Review some cards to create future review times
   c. Check "Upcoming Reviews" section
   d. Verify times shown match your local timezone
   e. Calculate expected UTC time and verify it's stored correctly in DB
   ```

3. **Database Verification:**
   ```sql
   -- Check that next_review_date is set to future times
   SELECT character_id,
          next_review_date,
          datetime('now') as current_utc,
          CAST((julianday(next_review_date) - julianday('now')) * 24 AS REAL) as hours_until_due
   FROM user_progress
   WHERE introduced = 1
   ORDER BY next_review_date;
   ```

## Files Modified

1. **`src-tauri/src/commands/mod.rs`** (line 685)
   - Added `AND next_review_date > datetime('now')` filter to `get_review_calendar()`

2. **`src/components/Dashboard/Dashboard.tsx`** (line 252)
   - Changed `new Date(entry.earliest_review_time)` to `new Date(entry.earliest_review_time + ' UTC')`
   - Added explanatory comment about UTC parsing

## Related Documentation

- SRS Algorithm: See `src-tauri/src/srs/mod.rs` for interval calculation logic
- Database Schema: See `src-tauri/src/database/schema.sql` for table definitions
- Dashboard Component: See `src/components/Dashboard/Dashboard.tsx` for UI implementation

## Future Considerations

1. **Consider ISO 8601 format**: SQLite could use ISO 8601 format with timezone indicator (`YYYY-MM-DDTHH:MM:SSZ`) for clearer UTC indication
2. **Add timezone tests**: Unit tests for timezone conversion logic
3. **User timezone preference**: Allow users to explicitly set preferred timezone for display (currently uses system timezone)
4. **Backend timezone validation**: Add assertions to verify all datetime operations use UTC
