# Speaking Practice Mode - Bug Fixes

**Date:** 2026-02-15
**Issues Fixed:** Punctuation handling and poor recognition feedback

---

## Issues Identified

### Issue 1: Punctuation Breaking Pinyin Comparison (FIXED)

**Problem:**
- STT returns "我。" (with period) when user says "我"
- Pinyin converter outputs "wo3 。" instead of "wo3"
- Comparison fails: `"wo3。" !== "wo3"` → Marked as incorrect ❌
- User pronounced correctly but system rejects it

**Log Evidence:**
```
Line 134: STT Result: "我。" (final: true)
Line 141: Converted "我。" → "wo3 。"
Line 144: Target pinyin: wo3
Line 146: Normalized: "wo3。" vs "wo3" → false
```

### Issue 2: No Feedback for Poor Recognition (FIXED)

**Problem:**
- When user speaks too quietly, STT returns "Vol。" (non-Chinese text)
- System compares "V o l 。" vs "wo3" and marks as incorrect
- No helpful message telling user to speak louder or check microphone
- User doesn't know if they pronounced incorrectly or if STT didn't hear them

**Log Evidence:**
```
Line 18, 39, 60, 113: STT Result: "Vol。"
Line 25: Converted "Vol。" → "V o l 。"
Line 29: Compare "v o l 。" vs "wo3" → false
```

### Issue 3: Neutral Tone Mismatch (FIXED)

**Problem:**
- Database stores neutral tones as tone 5 (de5, men5, etc.)
- pinyin-pro library returns tone 0 for neutral tones (de0, men0, etc.)
- Comparison fails: `"de0" !== "de5"` → Marked as incorrect ❌
- User pronounced "的" (de) correctly but system rejects it

**Log Evidence:**
```
Line 38: STT returns "的。"
Line 45: Converted "的。" → "的" → "de0"
Line 47: Target pinyin: de5
Line 49: Compare "de0" vs "de5" → false
```

**Root Cause:**
- Both tone 0 and tone 5 represent "neutral tone" (轻声)
- Different conventions in database vs pinyin-pro library
- Need to treat them as equivalent

---

## Solutions Implemented

### Fix 1: Strip Punctuation Before Pinyin Conversion

**File:** `src/utils/pinyinConverter.ts`

**Changes:**
1. Added `stripPunctuation()` helper function
   - Removes Chinese punctuation: 。，！？：；""''（）、·…
   - Removes English punctuation: . , ! ? : ; " ' ( ) -

2. Updated `hanziToPinyin()` to strip punctuation before conversion
   ```typescript
   const cleanedHanzi = stripPunctuation(hanzi);
   const result = pinyin(cleanedHanzi, { ... });
   ```

3. Added `isChineseText()` helper to detect non-Chinese recognition
   - Checks for Chinese characters in Unicode range \u4e00-\u9fff
   - Returns false for "Vol", "ai", etc.

**Result:**
- "我。" → strips "。" → converts "我" → "wo3" ✅
- Comparison now works: `"wo3" === "wo3"` ✅

### Fix 2: Poor Recognition Detection and Feedback

**File:** `src/components/SpeakingPractice/SpeakingPracticeMode.tsx`

**Changes:**
1. Added `poorRecognition` state variable
   ```typescript
   const [poorRecognition, setPoorRecognition] = useState(false);
   ```

2. Updated `handleTranscriptReceived()` to detect non-Chinese text
   ```typescript
   if (!isChineseText(hanzi)) {
     setPoorRecognition(true);
     setShowFeedback(true);
     return;
   }
   ```

3. Updated feedback UI to show helpful message when `poorRecognition === true`
   ```
   ⚠️ Speech Not Recognized
   The system couldn't detect Chinese speech clearly.

   Tips:
   • Speak louder and more clearly
   • Move closer to your microphone
   • Check your microphone is working
   • Click "Hear Example" to hear correct pronunciation
   ```

4. Reset `poorRecognition` in:
   - `handleRetry()` - when user tries again
   - `handleNext()` - when moving to next character

**Result:**
- When STT returns "Vol。", system shows helpful microphone tips
- User knows to speak louder instead of thinking they pronounced incorrectly

### Fix 3: Normalize Neutral Tones

**File:** `src/utils/pinyinConverter.ts`

**Changes:**
Updated `comparePinyin()` to treat tone 0 and tone 5 as equivalent
```typescript
const normalize = (p: string) => {
  const lowercaseNoSpaces = p.toLowerCase().replace(/\s+/g, '');
  // Replace tone 5 with tone 0 (both mean neutral tone)
  return lowercaseNoSpaces.replace(/5/g, '0');
};
```

**How it works:**
- Before comparison, all tone 5s are converted to tone 0s
- "de5" → "de0", "men5" → "men0", "wo3men5" → "wo3men0"
- Now "de0" === "de0" (converted from "de5") ✅

**Result:**
- User says "de" → STT returns "的。" → converts to "de0"
- Database has "de5" → normalized to "de0"
- Comparison succeeds: `"de0" === "de0"` ✅

---

## Test Cases

### Test 1: Punctuation Handling
- **Input:** User says "我" → STT returns "我。"
- **Before Fix:** "wo3。" !== "wo3" → Incorrect ❌
- **After Fix:** Strips "。" → "wo3" === "wo3" → Correct ✅

### Test 2: Poor Recognition Detection
- **Input:** User speaks too quietly → STT returns "Vol。"
- **Before Fix:** Shows "Not Quite Right" (confusing)
- **After Fix:** Shows "⚠️ Speech Not Recognized" with microphone tips

### Test 3: Correct Recognition
- **Input:** User says "我" → STT returns "我"
- **Before Fix:** Works ✅
- **After Fix:** Still works ✅ (backward compatible)

### Test 4: Homophones with Punctuation
- **Input:** User says "shì" → STT returns "事。" (homophone of 是)
- **Before Fix:** "shi4。" !== "shi4" → Incorrect ❌
- **After Fix:** Strips "。" → "shi4" === "shi4" → Correct ✅

### Test 5: Neutral Tone (de)
- **Input:** User says "de" → STT returns "的。"
- **Before Fix:** "de0" !== "de5" → Incorrect ❌
- **After Fix:** Normalizes both → "de0" === "de0" → Correct ✅

### Test 6: Neutral Tone in Multi-Character Word (我们)
- **Input:** User says "wǒ men" → STT returns "我们。"
- **Before Fix:** "wo3men0" !== "wo3men5" → Incorrect ❌
- **After Fix:** Normalizes tone 5→0 → "wo3men0" === "wo3men0" → Correct ✅

---

## Files Modified

1. **`src/utils/pinyinConverter.ts`**
   - Added `stripPunctuation()` function (lines 3-9)
   - Updated `hanziToPinyin()` to strip punctuation (lines 13-42)
   - Added `isChineseText()` function (lines 69-78)

2. **`src/components/SpeakingPractice/SpeakingPracticeMode.tsx`**
   - Added `poorRecognition` state (line 37)
   - Imported `isChineseText` from pinyinConverter (line 5)
   - Updated `handleTranscriptReceived()` with poor recognition check (lines 120-137)
   - Updated `handleRetry()` to reset flag (line 200)
   - Updated `handleNext()` to reset flag (line 211)
   - Updated feedback UI with conditional message (lines 385-446)

---

## Technical Details

### Punctuation Regex
```typescript
/[。，！？：；""''（）、·….,!?:;"'()\-]/g
```
- Chinese: 。，！？：；""''（）、·…
- English: .,!?:;"'()-

### Chinese Character Detection
```typescript
/[\u4e00-\u9fff]/
```
- Matches CJK Unified Ideographs (Chinese characters)
- Returns false for Latin characters, numbers, punctuation

---

## Expected Behavior

### Scenario 1: Clear Speech
1. User speaks clearly: "wǒ"
2. STT returns: "我" or "我。"
3. System strips punctuation → "我"
4. Converts to pinyin → "wo3"
5. Compares: "wo3" === "wo3" → ✅ Correct!

### Scenario 2: Quiet Speech
1. User speaks too quietly
2. STT returns: "Vol。" or empty
3. System detects non-Chinese text
4. Shows: "⚠️ Speech Not Recognized" + microphone tips
5. User increases volume and tries again

### Scenario 3: Homophone
1. User speaks: "shì"
2. STT returns: "事。" (homophone of target 是)
3. System strips "。" → "事"
4. Converts to pinyin → "shi4"
5. Compares: "shi4" === "shi4" → ✅ Correct! (pronunciation matches)

---

## Summary

**Problems Fixed:**
1. ✅ Punctuation from STT breaking comparisons (我。→ wo3。)
2. ✅ Poor recognition with no helpful feedback (Vol → no guidance)
3. ✅ Neutral tone mismatch between database and pinyin-pro (de5 vs de0)

**Solutions:**
1. Strip punctuation before pinyin conversion
2. Detect non-Chinese text and show microphone tips
3. Normalize tone 5 → tone 0 (both = neutral tone)

**Result:** Pronunciation verification now works correctly for:
- ✅ Characters with punctuation (我。, 的。)
- ✅ Homophones (是/事/市 all accept "shì")
- ✅ Neutral tones (的, 我们, etc.)
- ✅ Poor recognition (shows helpful tips)

**Build Status:** ✅ Success (no new TypeScript errors)
**Ready for Testing:** Yes

**Test with:**
- 我 (wǒ) - should accept "wo3"
- 的 (de) - should accept "de0" or "de5" (neutral tone)
- 我们 (wǒ men) - should accept "wo3 men0" or "wo3 men5"
- Any character with homophones (是/事/市 all accept "shì")
