# Introduction Rank Algorithm Improvements

**Date:** 2026-02-15
**Changes:** Improved introduction rank calculation to fix early introduction of rare compound words

---

## Problem Summary

### Issue 1: Rare Compound Words Introduced Too Early ❌

**Example:** 一一 (yī yī "one by one")
- Component character: 一 (rank 1 - very common)
- Word frequency: rank 999,999 (extremely rare)
- **Old algorithm:** score = 1 + (999,999 × 0.01) = **10,000**
- **Result:** Introduced before character #10,000 (way too early for such a rare word!)

### Issue 2: Used Component Frequency Instead of Introduction Rank ❌

The old algorithm looked up components' **frequency ranks**, not their **introduction ranks**. This caused incorrect ordering because:
- Frequency rank ≠ Learning order
- Introduction rank accounts for component dependencies
- Words should come after their components' *introduction position*, not their *frequency position*

---

## Solution: Two-Pass Algorithm ✅

### Pass 1: Rank All Characters
- All characters (is_word = 0) are sorted by frequency
- Assigned introduction ranks 1, 2, 3, ... N
- Example: 一 (most common) → introduction_rank = 1

### Pass 2: Score Words Based on Component Introduction Ranks
- For each word, find the **maximum introduction rank** among its component characters
- Add a weighted frequency penalty using an improved multiplier

**New Formula:**
```rust
word_score = max(component_introduction_ranks) + (word_frequency_rank × 0.1)
```

**Key Change:** Multiplier increased from **0.01** → **0.1** (10x larger)

---

## Example Comparisons

### Common Word: 我们 (wǒmen "we")
- Component 我: frequency rank 10, introduction rank ~10
- Component 们: frequency rank 20, introduction rank ~20
- Word 我们: frequency rank 50
- **Old score:** 20 + (50 × 0.01) = 20.5 → introduced at position ~21
- **New score:** 20 + (50 × 0.1) = 25 → introduced at position ~25
- **Result:** ✅ Still introduced early (common word)

### Rare Word: 一一 (yīyī "one by one")
- Component 一: frequency rank 1, introduction rank 1
- Word 一一: frequency rank 999,999
- **Old score:** 1 + (999,999 × 0.01) = **10,000** 😱
- **New score:** 1 + (999,999 × 0.1) = **100,000** ✅
- **Result:** ✅ Introduced much later (appropriate for rare word)

### Medium Frequency Word: 中国 (zhōngguó "China")
- Max component introduction rank: ~50
- Word frequency rank: 500
- **Old score:** 50 + (500 × 0.01) = 55 → introduced at position ~55
- **New score:** 50 + (500 × 0.1) = 100 → introduced at position ~100
- **Result:** ✅ Still introduced relatively early (common word)

---

## Multiplier Effect Analysis

| Word Frequency | Old Impact (×0.01) | New Impact (×0.1) | Difference |
|----------------|-------------------|-------------------|------------|
| 100 (common)   | +1 positions      | +10 positions     | Small delay |
| 1,000          | +10 positions     | +100 positions    | Moderate delay |
| 10,000         | +100 positions    | +1,000 positions  | Significant delay |
| 100,000        | +1,000 positions  | +10,000 positions | Large delay |
| 999,999 (rare) | +10,000 positions | +100,000 positions| Huge delay ✅ |

**Conclusion:** The new multiplier (0.1) creates better separation between common and rare words while still respecting component dependencies.

---

## Learning Progression Example

With the new algorithm, a learner will experience:

**Positions 1-5,000:** Mostly characters (ordered by frequency)
- 一 (yī "one")
- 的 (de particle)
- 我 (wǒ "I")
- ...

**Positions 5,001-15,000:** Mix of remaining characters + common words
- More characters
- 我们 (wǒmen "we") - common word using learned components
- 中国 (zhōngguó "China") - common word
- ...

**Positions 15,000-50,000:** More words using previously learned characters
- Increasingly complex words
- Less common but still useful vocabulary

**Positions 50,000+:** Rare words and specialized vocabulary
- 一一 (yīyī "one by one") - rare word finally appears here!
- Technical terms
- Literary expressions

---

## Code Changes

**File:** `data-processing/src/database/mod.rs`
**Function:** `populate_introduction_ranks()` (lines 205-388)

### Key Improvements:
1. ✅ Two-pass algorithm: characters first, then words
2. ✅ Uses component **introduction ranks** (not frequency ranks)
3. ✅ Improved multiplier (0.01 → 0.1) for better word spacing
4. ✅ HashMap lookup for O(1) component rank retrieval
5. ✅ Better debugging output showing example rankings
6. ✅ Comprehensive documentation in code comments

---

## How to Apply Changes

### 1. Rebuild the Database
```bash
cd data-processing
cargo run --release --bin build-database
```

This will:
- Parse CC-CEDICT and SUBTLEX-CH
- Build the SQLite database with new introduction ranks
- Show example rankings in the output
- Save to `src-tauri/resources/chinese.db`

### 2. Verify the Changes
Look for the output section "Example introduction order (first 20)" which shows:
```
Example introduction order (first 20):
  #1: 的 (de5) - freq_rank: 2 [char]
  #2: 一 (yi1) - freq_rank: 1 [char]
  #3: 是 (shi4) - freq_rank: 3 [char]
  ...
```

All the first entries should be **characters**, not words.

### 3. Test in the App
```bash
# Delete your existing user database to get the new rankings
# Windows: Delete C:\Users\[YourName]\AppData\Local\chinese-flashcards\chinese.db
# Or just let the app copy the new database on first run

npm run tauri:dev
```

### 4. Browse Introduction Order
Use the "Browse Characters" feature in the app and sort by "Introduction Order" to verify:
- First ~5,000-10,000 entries are all characters
- Words appear after their component characters
- Common words (like 我们) appear relatively early
- Rare words (like 一一) appear much later

---

## Tuning the Multiplier (Optional)

If you want to adjust the character/word mixing ratio, edit this constant:

**File:** `data-processing/src/database/mod.rs` (line ~284)
```rust
const WORD_FREQ_MULTIPLIER: f64 = 0.1;
```

**Recommendations:**
- **0.05:** Tighter mixing (more words earlier, but rare words still come too early)
- **0.1:** Balanced (recommended) - good mix with proper rare word delay
- **0.2:** Looser mixing (learn more characters before words)
- **1.0:** Very loose (learn almost all characters before any words)

After changing, rebuild the database to see the effect.

---

## Definition Updates (Already Working!)

**Good news:** Definition updates are already being applied automatically on app startup!

**How it works:**
1. Edit `definition_review.csv` (if needed, generate it with `cargo run --bin generate-definition-review`)
2. Fill in the "Updated Definition" column
3. Run `cargo run --bin apply-definition-updates` (saves to `definition_overrides.json`)
4. **Start the app** - overrides are applied automatically from `definition_overrides.json`!

No need to rebuild the database for definition changes.

**Code location:** `src-tauri/src/database/mod.rs:1363` - `apply_definition_overrides()`

---

## Summary of Improvements

| Feature | Before | After |
|---------|--------|-------|
| **Definition updates** | ✅ Already auto-applied on startup | ✅ No change needed |
| **Character ranking** | By frequency | ✅ By frequency (unchanged) |
| **Word ranking** | By component freq + 0.01×word_freq | ✅ By component intro_rank + 0.1×word_freq |
| **一一 introduction position** | ~10,000 😱 | ~100,000 ✅ |
| **我们 introduction position** | ~21 ✅ | ~25 ✅ |
| **Learning progression** | Rare words too early ❌ | Natural mixing ✅ |
| **Component prerequisites** | Sometimes violated ❌ | Always respected ✅ |

---

## Testing Checklist

- [ ] Rebuild database: `cd data-processing && cargo run --release --bin build-database`
- [ ] Check console output shows characters ranked first
- [ ] Delete user database to force new rankings
- [ ] Start app: `npm run tauri:dev`
- [ ] Browse characters by introduction order
- [ ] Verify characters come before words
- [ ] Verify common words (我们, 中国) appear relatively early
- [ ] Verify rare words (一一) appear much later
- [ ] Check that word components are always introduced before the word itself

---

## Questions or Issues?

If you notice any words appearing too early or too late, we can adjust the `WORD_FREQ_MULTIPLIER` constant. The current value (0.1) is a good starting point but can be tuned based on your learning preferences.
