# Text-to-Speech Setup Guide for Chinese

## Problem
The Web Speech API is working, but no sound plays because **Windows doesn't have Chinese TTS voices installed**.

Console shows:
```
[TTS] Available voices: 7
[TTS] Chinese voices found: 0
```

## Solution: Install Chinese TTS Voices on Windows

### Method 1: Windows Settings (Recommended)

1. **Open Windows Settings**
   - Press `Win + I`
   - Or search for "Settings" in Start menu

2. **Navigate to Language Settings**
   - Go to **Time & Language** → **Language & Region**
   - Or search for "Language settings"

3. **Add Chinese Language**
   - Click **Add a language**
   - Search for "Chinese (Simplified, China)" or "Chinese (Traditional, Taiwan)"
   - Select **Chinese (Simplified, China)** for Mandarin
   - Click **Next**

4. **Install Language Features**
   - Check the box for **Text-to-speech**
   - Uncheck other features if you don't need them (Handwriting, Speech recognition)
   - Click **Install**

5. **Wait for Download**
   - Windows will download the TTS voice pack (~100-200 MB)
   - This may take a few minutes

6. **Restart Your Application**
   - Close and reopen the Tauri app
   - The console should now show:
     ```
     [TTS] Chinese voices found: 1 (or more)
     [TTS] Voice X: Microsoft Huihui - Chinese (Simplified, PRC) (zh-CN) - Local
     ```

### Method 2: Control Panel (Alternate)

1. Open **Control Panel** → **Clock and Region** → **Language**
2. Click **Add a language**
3. Choose **Chinese (Simplified, PRC)**
4. Click **Options** next to Chinese
5. Under **Download and install language pack**, click **Download**

### Verification

After installation, restart the app and check the console:
- You should see voices like:
  - `Microsoft Huihui - Chinese (Simplified, PRC) (zh-CN)`
  - `Microsoft Kangkang - Chinese (Simplified, PRC) (zh-CN)` (male voice)

### Testing

1. Open the app
2. Go to Introduction or Spaced Repetition screen
3. Click the speaker button 🔈
4. You should now hear Mandarin pronunciation!

## Alternative: Fallback Voice Selection

If you can't install Chinese voices right now, we can modify the code to:
1. Detect when no Chinese voices are available
2. Show a helpful message to the user
3. Still allow the app to work without TTS

Let me know if you'd like me to add this fallback behavior!

## Technical Details

The Web Speech API requires OS-level TTS voices. It cannot:
- Download voices automatically
- Use web-based TTS services without permission
- Synthesize speech without installed voices

The voices are provided by:
- **Windows**: SAPI 5 voices (Microsoft TTS)
- **macOS**: Built-in macOS voices
- **Linux**: espeak or festival (varies by distro)
