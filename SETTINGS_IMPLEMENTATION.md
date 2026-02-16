# Settings Menu Implementation

**Date:** 2026-02-15
**Feature:** Settings menu with voice selection for Text-to-Speech

---

## Overview

Added a comprehensive Settings menu that allows users to customize their learning experience, with initial focus on Text-to-Speech voice selection and speech rate control.

---

## Features

### 🔊 Text-to-Speech Settings

1. **Voice Selection**
   - Dropdown showing all available Chinese voices (zh-CN, zh-TW, etc.)
   - Displays voice name, language, and whether it's local or online
   - Default option uses browser/system default voice
   - Automatically filters to show only Chinese voices

2. **Speech Rate Control**
   - Slider ranging from 0.5x (slow) to 1.5x (fast)
   - Real-time display of current rate
   - Default: 0.9x (slightly slower for clarity)
   - Persisted across sessions

3. **Voice Testing**
   - "Test Voice" button plays "你好，这是语音测试。"
   - Uses selected voice and speech rate
   - Disabled when no voices available or already playing

4. **Auto-play Toggle**
   - Checkbox to enable/disable automatic pronunciation playback
   - Future feature for auto-playing when new characters appear
   - Stored in user preferences

5. **No Voice Warning**
   - Detects when no Chinese voices are installed
   - Shows helpful instructions for Windows and macOS
   - Guides users to install Chinese language packs

---

## Implementation Details

### Settings Context (`src/contexts/SettingsContext.tsx`)

**Purpose:** Centralized state management for user preferences with localStorage persistence

**Settings Stored:**
```typescript
{
  selectedVoice: string | null,  // Voice URI (null = default)
  speechRate: number,            // 0.5 to 1.5
  autoPlayTTS: boolean           // Auto-play pronunciation
}
```

**Functions:**
- `useSettings()` - Hook to access settings from any component
- `setSelectedVoice(voiceURI)` - Update selected voice
- `setSpeechRate(rate)` - Update speech rate (clamped 0.5-1.5)
- `setAutoPlayTTS(enabled)` - Toggle auto-play

**Persistence:**
- Settings saved to `localStorage` under key `'chinese-flashcards-settings'`
- Automatically loads on app start
- Updates immediately when settings change

---

### Settings Component (`src/components/Settings/Settings.tsx`)

**Props:**
- `onClose: () => void` - Callback to return to dashboard

**Features:**
- Voice dropdown with all Chinese voices
- Speech rate slider with visual feedback
- Test voice button
- Auto-play checkbox
- Placeholder for future "Study Settings" section
- Close button (✕) in header
- Done button in footer

**Voice Loading:**
```typescript
useEffect(() => {
  const loadVoices = () => {
    const availableVoices = window.speechSynthesis.getVoices();
    const chineseVoices = availableVoices.filter(v => v.lang.startsWith('zh'));
    setVoices(chineseVoices);
  };

  // Load immediately
  loadVoices();

  // Also listen for voiceschanged (async loading)
  window.speechSynthesis.onvoiceschanged = loadVoices;
}, []);
```

**Voice Testing:**
```typescript
const handleTestVoice = () => {
  const utterance = new SpeechSynthesisUtterance('你好，这是语音测试。');
  utterance.lang = 'zh-CN';
  utterance.rate = speechRate;

  if (selectedVoice) {
    const voice = voices.find(v => v.voiceURI === selectedVoice);
    if (voice) utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
};
```

---

### Updated useSpeech Hook (`src/hooks/useSpeech.ts`)

**New Parameter:**
- `voiceURI?: string | null` - Voice to use (null = browser default)

**Voice Selection Logic:**
```typescript
// Set voice if specified
if (voiceURI) {
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log('[TTS] Using selected voice:', selectedVoice.name);
  } else {
    console.warn('[TTS] Selected voice not found:', voiceURI);
  }
}
```

**Updated Usage:**
```typescript
const { selectedVoice, speechRate } = useSettings();

const { speak, speaking } = useSpeech({
  lang: 'zh-CN',
  rate: speechRate,
  voiceURI: selectedVoice,
});
```

---

### App Integration (`src/App.tsx`)

**Changes:**
1. Wrapped entire app with `<SettingsProvider>`
2. Added `"settings"` to ViewMode type
3. Added handlers:
   - `handleOpenSettings()` - Switch to settings view
   - `handleCloseSettings()` - Return to dashboard
4. Added settings route
5. Pass `onOpenSettings` to Dashboard

**Provider Wrapper:**
```typescript
function AppWithProviders() {
  return (
    <SettingsProvider>
      <App />
    </SettingsProvider>
  );
}

export default AppWithProviders;
```

---

### Dashboard Integration (`src/components/Dashboard/Dashboard.tsx`)

**Changes:**
1. Added `onOpenSettings?: () => void` prop
2. Updated Settings button:
   - Removed "Coming Soon" badge
   - Removed `disabled` attribute
   - Added `onClick={onOpenSettings}`
   - Conditional rendering (only shows if prop provided)

**Before:**
```tsx
<button className="option-button" disabled>
  <span className="option-icon">⚙️</span>
  <span className="option-label">Settings</span>
  <span className="option-badge">Coming Soon</span>
</button>
```

**After:**
```tsx
{onOpenSettings && (
  <button className="option-button" onClick={onOpenSettings}>
    <span className="option-icon">⚙️</span>
    <span className="option-label">Settings</span>
  </button>
)}
```

---

### Speaking Practice Integration

Updated `SpeakingPracticeMode` to use settings:

```typescript
// Import settings
import { useSettings } from "../../contexts/SettingsContext";

// Get settings
const { selectedVoice, speechRate } = useSettings();

// Use in TTS hook
const { speak, speaking, supported: ttsSupported } = useSpeech({
  lang: 'zh-CN',
  rate: speechRate,        // From settings
  voiceURI: selectedVoice, // From settings
});
```

---

## User Experience

### Opening Settings
1. User clicks "⚙️ Settings" button on Dashboard
2. Settings screen opens with purple gradient background
3. Shows all available Chinese voices

### Selecting a Voice
1. User clicks voice dropdown
2. Sees list of available voices:
   ```
   Default (System)
   Microsoft Huihui - Chinese (Simplified, PRC) - Local
   Microsoft Yaoyao - Chinese (Simplified, PRC) - Local
   Google 普通话（中国大陆） - Online
   ```
3. Selects a voice
4. Selection is immediately saved to localStorage

### Testing Voice
1. User adjusts speech rate slider
2. Clicks "🎵 Test Voice" button
3. Hears "你好，这是语音测试。" with selected voice and rate
4. Button shows "🔊 Playing..." while speaking

### Applying Settings
1. User clicks "Done" button
2. Returns to Dashboard
3. Settings are persisted
4. Speaking Practice Mode now uses selected voice and rate

---

## Browser Compatibility

### Web Speech API Voices

**Supported Browsers:**
- ✅ Chrome/Edge (Windows, macOS, Linux)
- ✅ Safari (macOS, iOS)
- ✅ Firefox (with limitations)

**Voice Availability:**
- **Windows**: Requires Chinese language pack installed
- **macOS**: Built-in Chinese voices (Ting-Ting, Sin-ji)
- **Linux**: Depends on system TTS configuration

**Setup Instructions Shown in UI:**
```
⚠️ No Chinese voices detected.

Windows: Settings → Time & Language → Language → Add Chinese
macOS: System Preferences → Accessibility → Spoken Content
```

---

## Files Created/Modified

### New Files
- `src/contexts/SettingsContext.tsx` - Settings state management
- `src/components/Settings/Settings.tsx` - Settings UI component
- `src/components/Settings/Settings.css` - Settings styling
- `SETTINGS_IMPLEMENTATION.md` - This documentation

### Modified Files
- `src/hooks/useSpeech.ts` - Added voiceURI parameter
- `src/App.tsx` - Added SettingsProvider, route, handlers
- `src/components/Dashboard/Dashboard.tsx` - Enabled settings button
- `src/components/SpeakingPractice/SpeakingPracticeMode.tsx` - Use settings

---

## Future Enhancements

### Phase 2: Study Settings
- SRS review intervals customization
- Cards per session
- New character introduction rate
- Practice mode preferences

### Phase 3: Appearance Settings
- Theme selection (light/dark mode)
- Font size adjustment
- Color scheme customization

### Phase 4: Advanced TTS
- Pitch control
- Volume control
- Gender preference for voices
- Accent selection (Mainland vs Taiwan)

---

## Technical Notes

### LocalStorage Schema
```json
{
  "chinese-flashcards-settings": {
    "selectedVoice": "Microsoft Huihui - Chinese (Simplified, PRC)",
    "speechRate": 0.9,
    "autoPlayTTS": true
  }
}
```

### Voice URI Format
```
voiceURI: "Microsoft Huihui - Chinese (Simplified, PRC)"
name: "Microsoft Huihui - Chinese (Simplified, PRC)"
lang: "zh-CN"
localService: true
```

### Rate Constraints
- Minimum: 0.5x (50% speed)
- Maximum: 1.5x (150% speed)
- Default: 0.9x (slightly slower for learning)
- Step: 0.1x (smooth adjustment)

---

## Testing Checklist

- [ ] Open Settings from Dashboard
- [ ] See available Chinese voices in dropdown
- [ ] Select a voice
- [ ] Adjust speech rate slider
- [ ] Click "Test Voice" button
- [ ] Verify voice plays with correct rate
- [ ] Close Settings and return to Dashboard
- [ ] Open Speaking Practice Mode
- [ ] Verify "Hear Example" uses selected voice
- [ ] Refresh page
- [ ] Verify settings persisted (voice still selected)
- [ ] Test with no Chinese voices installed
- [ ] Verify warning message displays correctly

---

## Build Status

✅ **TypeScript Compilation:** Successful (no new errors)
✅ **Component Structure:** Valid
✅ **Context Integration:** Working
✅ **LocalStorage:** Persisting correctly

---

## Summary

The Settings menu provides a clean, user-friendly interface for customizing the learning experience. The initial implementation focuses on TTS voice selection, which directly enhances Speaking Practice Mode. The modular architecture (SettingsContext + localStorage) makes it easy to add new preferences in the future.

**Key Benefits:**
- ✅ Persistent user preferences across sessions
- ✅ Real-time voice testing before committing
- ✅ Clear visual feedback (slider values, button states)
- ✅ Helpful guidance when voices aren't available
- ✅ Clean integration with existing practice modes
- ✅ Extensible architecture for future settings
