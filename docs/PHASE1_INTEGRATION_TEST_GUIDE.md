# Phase 1 Integration Testing Guide

## Pre-Test Setup

### 1. Database Reset (if needed for clean test)
If you want to start with a fresh database:
- Close the app
- Delete `chinese.db` from the app data directory
- On Windows: `C:\Users\<YourName>\AppData\Local\chinese-flashcards\chinese.db`
- App will rebuild the database on next launch

### 2. Launch the Application
```bash
npm run tauri dev
```

## Test Execution

### ✅ Scenario 1: New User Onboarding

**Steps:**
1. Launch app for first time (or with fresh database)
2. Verify dashboard shows:
   - 100 characters available to learn (changed from 15)
   - 0 progress
   - Window size is 1200x800 (noticeably larger)
3. Click "Start Learning" button
4. Go through introduction for first 5 characters
   - Verify pinyin displays with accent marks (mā, hǎo) not numbers (ma1, hao3)
   - On the 5th character, button should say "Study New Characters" instead of "Next"
5. Complete the mini-SRS session for those 5 characters
6. Verify you return to introduction for character 6-10
7. After 10th character, another mini-SRS session should trigger
8. Continue until all 100 characters are introduced

**Expected Results:**
- ✅ Dashboard starts with 0 progress
- ✅ 100 characters available (not 15)
- ✅ Window is 1200x800
- ✅ Pinyin shows accent marks throughout
- ✅ Mini-SRS sessions trigger every 5 characters
- ✅ Final SRS session shows all introduced characters

**Notes:**
_Record any issues here_

---

### ✅ Scenario 2: First SRS Session

**Steps:**
1. After completing introduction, start an SRS session
2. Answer all cards correctly
3. Verify intervals updated properly
4. Check dashboard statistics
5. Verify no cards are currently due

**Expected Results:**
- ✅ All cards show in SRS session
- ✅ Correct answers advance intervals
- ✅ Dashboard shows characters learned
- ✅ No duplicate session entries in "Recent Study Sessions"
- ✅ Session history shows correct stats (not 0 cards, 0%)

**Notes:**
_Record any issues here_

---

### ✅ Scenario 3: Multi-Day Progression

**Manual Time Simulation:**
Since we can't wait 3 days, manually update the database:

```sql
-- Open the database
-- Update next_review_date to be in the past
UPDATE user_progress
SET next_review_date = datetime('now', '-3 days')
WHERE introduced = 1
LIMIT 10;
```

**Steps:**
1. Simulate 3 days passing using SQL above
2. Restart the app
3. Verify due cards appear on dashboard
4. Complete session with mixed results:
   - Answer some correctly
   - Answer some incorrectly
5. Check that:
   - Correct cards advance (intervals increase)
   - Incorrect cards regress (intervals decrease)

**Expected Results:**
- ✅ Due cards detected after time simulation
- ✅ Correct cards advance intervals
- ✅ Incorrect cards regress intervals
- ✅ Dashboard updates accurately

**Notes:**
_Record any issues here_

---

### ✅ Scenario 4: Character Unlocking

**Note:** This has been significantly changed from the original spec!

**New Unlock Cycle:**
- 100 characters unlock every 20 days
- Unlock requires: `max(20 days since last unlock, 2 days after queue emptied)`
- Initial batch of 100 given immediately

**Steps:**
1. Complete learning all 100 initial characters
2. Verify dashboard shows "Next unlock in Xd" (days, not hours, since >24h)
3. Cannot manually test 20-day wait, but verify:
   - Message displays correctly
   - No characters available until condition met

**Expected Results:**
- ✅ Unlock timer displays in days when > 24 hours
- ✅ Queue empties after all 100 characters learned
- ✅ Next unlock shows as "Xd" not "Xh"

**Notes:**
_Record any issues here_

---

### ✅ Scenario 5: Self-Study Mode

**Steps:**
1. Complete SRS session (no cards due)
2. Click "Self-Study" button
3. Verify:
   - Loads cards not currently due in SRS
   - Can practice without affecting SRS intervals
4. Complete self-study session
5. Verify:
   - Practice history recorded
   - SRS intervals unchanged
   - Session appears in "Recent Study Sessions"
   - No duplicate entries

**Expected Results:**
- ✅ Self-study loads non-due cards
- ✅ Practice recorded in history
- ✅ SRS intervals not affected
- ✅ Session shows correctly (not 0 cards, 0%)

**Notes:**
_Record any issues here_

---

### ✅ Scenario 6: Progress Tracking & Dictionary

**Steps:**
1. Complete multiple sessions across modes
2. Check dashboard statistics:
   - Characters learned count
   - In SRS pool count
   - Due today count
   - Study streak
   - Mastered characters
3. Open Dictionary (Browse button)
4. Verify:
   - Pinyin shows with accent marks (not numbers)
   - Characters display in introduction order
   - Progress indicators accurate
5. Check session history:
   - All sessions show correct stats
   - No duplicates with 0 cards
   - Timestamps accurate

**Expected Results:**
- ✅ Dashboard stats accurate
- ✅ Dictionary pinyin uses accents
- ✅ Progress tracking correct
- ✅ Session history clean (no duplicates)
- ✅ Study streak calculates properly

**Notes:**
_Record any issues here_

---

## Integration Checklist

### Core Functionality
- [ ] Fresh database install works
- [ ] First 100 characters accessible (not 15)
- [ ] Window opens at 1200x800
- [ ] Introduction screen functional
- [ ] Pinyin shows accent marks everywhere
- [ ] Mini-SRS triggers every 5 characters during learning
- [ ] Final SRS session completes successfully
- [ ] Incorrect cards cycle properly
- [ ] Answer verification accurate
- [ ] Intervals calculate correctly

### New Features (from alterations)
- [ ] Unlock cycle shows 100 chars (not 10)
- [ ] Unlock timer shows days when > 24h (e.g., "19d" not "456h")
- [ ] Queue-based unlock logic works
- [ ] Mini-SRS sessions every 5 characters
- [ ] Batch size is 100 for learning

### Bug Fixes
- [ ] No duplicate sessions in history
- [ ] All sessions show correct stats (not 0 cards, 0%)
- [ ] Pinyin displays correctly in all locations

### Cross-Platform
- [ ] Works on Windows (primary platform)
- [ ] (Optional) Works on Mac if available
- [ ] (Optional) Works on Linux if available

### Data Integrity
- [ ] No database constraint violations
- [ ] No data loss or corruption
- [ ] Sessions recorded properly
- [ ] Progress saves correctly

### UI/UX
- [ ] No frontend errors in console
- [ ] UI responsive and professional
- [ ] No lag or performance issues
- [ ] Larger window improves usability

---

## Success Criteria

**Phase 1 is complete when:**
- ✅ All 6 test scenarios pass
- ✅ All items in integration checklist pass
- ✅ No critical bugs remain
- ✅ Database integrity maintained
- ✅ Performance acceptable

---

## Issue Tracking

### Critical Issues (Must Fix)
_Issues that prevent core functionality_

1.

### Non-Critical Issues (Phase 2)
_Issues that don't block Phase 1 completion_

1.

---

## Next Steps After Testing

1. Document all findings in EditHistory.md
2. Fix critical bugs immediately
3. Move non-critical issues to Phase 2 backlog
4. If all tests pass: Mark Task 1.14 complete
5. Begin Task 1.15 (Code Cleanup) or prepare for Phase 2
