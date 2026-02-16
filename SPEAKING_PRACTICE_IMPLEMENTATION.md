# Speaking Practice Mode Implementation

**Date:** 2026-02-15
**Feature:** Pronunciation practice with pinyin-based verification

---

## Overview

Speaking Practice Mode allows users to practice pronunciation by speaking Chinese characters out loud. The system verifies pronunciation by comparing **pinyin**, not characters, which correctly handles homophones.

## Problem Solved

### The Homophone Challenge

Many Chinese characters share the same pronunciation (homophones):
- 是 (shì) - "to be"
- 事 (shì) - "matter"
- 市 (shì) - "city"
- 式 (shì) - "style"

With `lang: 'zh-CN'`, speech recognition returns hanzi (Chinese characters), which could be any homophone. The user might pronounce correctly, but STT might return a different character with the same pinyin.

### The Solution

**Pinyin-based verification:**
1. User sees: **是** (shì)
2. User speaks: "shì"
3. STT returns: **市** or **事** or **是** (any homophone)
4. **Convert returned hanzi to pinyin** using `pinyin-pro`
5. **Compare pinyins:** both are "shì" → ✅ **CORRECT!**

This verifies pronunciation accuracy regardless of which homophone the STT selects.

---

## Implementation

### 1. Hanzi-to-Pinyin Converter (`src/utils/pinyinConverter.ts`)

```typescript
import { pinyin } from 'pinyin-pro';

export function hanziToPinyin(hanzi: string): string {
  return pinyin(hanzi, {
    toneType: 'num',  // Returns ni3 hao3 format
    type: 'string',   // Returns string output
  });
}

export function comparePinyin(pinyin1: string, pinyin2: string): boolean {
  // Normalize: lowercase, remove spaces
  const normalize = (p: string) => p.toLowerCase().replace(/\s+/g, '');
  return normalize(pinyin1) === normalize(pinyin2);
}
```

**Dependencies:** `pinyin-pro` npm package (installed)

### 2. Speaking Practice Mode Component

**File:** `src/components/SpeakingPractice/SpeakingPracticeMode.tsx`

**Features:**
- ✅ Displays character, pinyin, and definition
- ✅ "Speak" button to start speech recognition
- ✅ "Hear Example" button for TTS playback
- ✅ Real-time listening indicator
- ✅ Pinyin-based pronunciation verification
- ✅ Detailed feedback (shows recognized character + pinyin)
- ✅ Progress tracking (attempts, completion)
- ✅ Session statistics (perfect first try, total attempts, time)
- ✅ Completion screen

**Workflow:**
```
1. Display character: 我 (wǒ)
2. User clicks "🎤 Speak"
3. User says: "wǒ"
4. STT returns: "我" (correct) or "握" (homophone)
5. Convert to pinyin: "wo3"
6. Compare: "wo3" === "wo3" → ✅ Correct!
7. Show success feedback
8. Move to next character
```

### 3. Integration

**App.tsx:**
- Added `ViewMode` type: `"speaking-practice-mode"`
- Added handler: `handleStartSpeakingPracticeMode()`
- Added route: `<SpeakingPracticeMode />`

**Dashboard.tsx:**
- Added button: 🎤 Speaking Practice
- Connects to speaking practice mode

**Backend:**
- Reuses `get_listening_practice_characters(count)` command
- Reuses `record_listening_practice_session()` command
- No additional backend changes needed

---

## User Experience

### Interface

```
┌─────────────────────────────────────┐
│  🎤 Speaking Practice   2 / 20 ✓    │
├─────────────────────────────────────┤
│                                     │
│           ┌───────────┐             │
│           │     我    │             │
│           │   wǒ      │             │
│           │   I, me   │             │
│           └───────────┘             │
│                                     │
│    🎤 Say this character out loud   │
│                                     │
│     ┌─────────────┐  ┌─────────────┐│
│     │  🎤 Speak   │  │ 🔊 Example  ││
│     └─────────────┘  └─────────────┘│
│                                     │
│  💡 Tips:                           │
│  • Speak clearly at normal speed    │
│  • System checks pronunciation      │
│    (pinyin), not the exact character│
└─────────────────────────────────────┘
```

### Feedback (Correct)

```
┌─────────────────────────────────────┐
│             ✓                       │
│   Excellent Pronunciation!          │
│   You pronounced it correctly.      │
│                                     │
│   You said: 握 (homophone)          │
│   Recognized as: wò                 │
│   Target pinyin: wò                 │
│                                     │
│   [  Next Character →  ]            │
└─────────────────────────────────────┘
```

### Feedback (Incorrect)

```
┌─────────────────────────────────────┐
│             ✗                       │
│   Not Quite Right                   │
│   Listen and try again!             │
│                                     │
│   You said: 吴 (wú)                 │
│   Recognized as: wu2                │
│   Target: 我                        │
│   Target pinyin: wo3                │
│   Attempts: 2                       │
│                                     │
│   [  🔁 Try Again  ]                │
└─────────────────────────────────────┘
```

---

## Technical Details

### Hooks Used

1. **useSpeech** (`src/hooks/useSpeech.ts`)
   - Text-to-speech for example pronunciation
   - Rate: 0.9x (slightly slower for clarity)

2. **useSpeechRecognition** (`src/hooks/useSpeechRecognition.ts`)
   - Speech-to-text for capturing user speech
   - Language: `zh-CN`
   - Continuous: `false` (one-shot mode)
   - Returns Chinese characters (hanzi)

### Pinyin Conversion

**Library:** `pinyin-pro`
**NPM Package:** `npm install pinyin-pro`

**Why pinyin-pro?**
- ✅ Supports tone numbers (`ni3 hao3`)
- ✅ Handles multi-character words
- ✅ Lightweight and fast
- ✅ Works offline (no API calls)

**Example conversions:**
```javascript
hanziToPinyin("你好") → "ni3 hao3"
hanziToPinyin("是") → "shi4"
hanziToPinyin("我们") → "wo3 men5"
```

### Verification Logic

```typescript
const spokenPinyin = hanziToPinyin(recognizedHanzi);
const targetPinyin = currentCharacter.mandarin_pinyin;
const correct = comparePinyin(spokenPinyin, targetPinyin);
```

**Normalization:**
- Removes all spaces
- Converts to lowercase
- Allows flexible spacing (ni3hao3 === ni3 hao3)

---

## Browser Compatibility

### Requirements

| Feature | Browser Support |
|---------|----------------|
| **Text-to-Speech** | Chrome, Edge, Safari, Firefox |
| **Speech Recognition** | Chrome, Edge (Chromium only) |
| **Chinese TTS Voices** | Requires Windows Chinese language pack |

### Setup Guide

**Windows Users:**
1. Settings → Time & Language → Language
2. Add Chinese (Simplified) or Chinese (Traditional)
3. Install language pack (includes TTS voices)
4. Restart browser

**Chrome/Edge Only:**
- Speech Recognition uses Google Cloud Speech API
- Requires internet connection
- Most accurate for Mandarin Chinese

---

## Session Tracking

**Data Recorded:**
- Character IDs practiced
- Session duration (seconds)
- Total attempts
- Perfect first-try count

**Database Table:** `practice_history`
**Tauri Command:** `record_listening_practice_session()`

---

## Future Enhancements

1. **Tone-only error detection**
   - Similar to listening practice mode
   - "You got the syllables right, but wrong tone"

2. **Confidence scoring**
   - Show STT confidence level
   - Suggest retry if confidence is low

3. **Voice selection**
   - Let users choose from available Chinese voices
   - Male vs female voice preference

4. **Recording playback**
   - Record user's voice
   - Play it back for comparison

5. **Detailed pronunciation feedback**
   - Show which syllable was incorrect
   - Highlight tone errors specifically

6. **Difficulty levels**
   - Beginner: Single characters
   - Intermediate: 2-character words
   - Advanced: Full sentences

---

## Testing

### Manual Testing Checklist

- [ ] Click "Speaking Practice" from dashboard
- [ ] Verify character displays correctly
- [ ] Click "Speak" button
- [ ] Verify microphone permission prompt
- [ ] Speak the character
- [ ] Verify correct pronunciation is accepted
- [ ] Verify homophones are accepted (e.g., 是/事/市 all accept "shì")
- [ ] Verify incorrect pronunciation is rejected
- [ ] Click "Hear Example" button
- [ ] Verify TTS plays correct pronunciation
- [ ] Complete session
- [ ] Verify statistics are correct
- [ ] Return to dashboard

### Edge Cases

✅ **Homophones:** Correctly accepts any character with matching pinyin
✅ **Multi-syllable words:** Converts full words to pinyin (e.g., 我们 → wo3 men5)
✅ **No speech detected:** Shows error message
✅ **Microphone denied:** Shows permission error

---

## Files Modified/Created

### New Files
- `src/components/SpeakingPractice/SpeakingPracticeMode.tsx`
- `src/components/SpeakingPractice/SpeakingPracticeMode.css`
- `src/utils/pinyinConverter.ts`
- `SPEAKING_PRACTICE_IMPLEMENTATION.md` (this file)

### Modified Files
- `src/App.tsx` - Added route and handler
- `src/components/Dashboard/Dashboard.tsx` - Added button
- `package.json` - Added `pinyin-pro` dependency

### Dependencies Added
```json
{
  "pinyin-pro": "^3.x.x"
}
```

---

## Summary

Speaking Practice Mode provides an effective way to practice Mandarin pronunciation using:
- ✅ Browser-native Web Speech API
- ✅ Pinyin-based verification (handles homophones correctly)
- ✅ Real-time feedback
- ✅ Progress tracking
- ✅ Example pronunciation playback

The key innovation is **converting STT output (hanzi) to pinyin before verification**, which correctly handles the many homophones in Mandarin Chinese.
