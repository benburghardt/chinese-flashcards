# Speech Recognition Testing Guide

## How to Test Speech-to-Text in Tauri

### Quick Start (5 steps):

1. **Start the Tauri development app:**
   ```bash
   npm run tauri dev
   ```

2. **Wait for the app to load** (shows Dashboard)

3. **Click "Speech Recognition" button**
   - Located in the "Study Options" section
   - Has a 🎤 icon and "Test" badge

4. **Grant microphone permission** when prompted by Windows/your browser

5. **Test it!**
   - Click "Start Recording" (green button with 🎤)
   - Speak some Mandarin Chinese (see test phrases below)
   - Click "Stop" (red button) or wait for auto-stop
   - Verify the transcript shows Chinese characters

---

## Detailed Testing Instructions

### Step 1: Launch the App

```bash
# Make sure you're in the project directory
cd C:\Users\Ben\Desktop\Coding\Visual Studio Code\Personal_Projects\chinese-flashcards

# Start Tauri development mode
npm run tauri dev
```

**Expected:** Tauri window opens showing the Dashboard

### Step 2: Navigate to Speech Recognition Test

1. Look for the **"Study Options"** section on the Dashboard
2. Find the button labeled **"Speech Recognition"** with 🎤 icon
3. Click it

**Expected:** You'll see the Speech Recognition Test screen with:
- "Back to Dashboard" button (top right, red)
- Status indicator (showing ✅ Supported or ❌ Not Supported)
- Listening status (⭕ Idle)
- Empty transcript area
- Start/Stop/Clear buttons
- Instructions and test phrases

### Step 3: Grant Microphone Permission

1. Click the **"Start Recording"** button (green, with 🎤 icon)

2. Windows will show a permission prompt:
   - **In browser webview**: "Allow this site to use your microphone?"
   - **Options**: "Allow" or "Block"

3. Click **"Allow"**

**Expected:**
- Listening status changes to "🎤 Recording..."
- Start button becomes disabled (grayed out)
- Stop button becomes enabled (red)

### Step 4: Test Speech Recognition

#### Test Phrases (Speak clearly):

**Easy phrases:**
- **你好** (nǐ hǎo) - "Hello"
- **谢谢** (xiè xie) - "Thank you"
- **再见** (zài jiàn) - "Goodbye"

**Medium phrases:**
- **对不起** (duì bu qǐ) - "Sorry"
- **我爱你** (wǒ ài nǐ) - "I love you"
- **你好吗** (nǐ hǎo ma) - "How are you?"

**Testing procedure:**
1. Click "Start Recording"
2. Wait 1 second (for mic to initialize)
3. Speak **ONE** phrase clearly
4. Click "Stop" immediately after speaking
5. Check the transcript

**Expected Results:**

✅ **Interim Transcript** (while speaking):
- Shows in yellow/italic box
- Updates in real-time as you speak
- May show partial/incorrect text initially

✅ **Final Transcript** (after stopping):
- Shows in white box at top
- Should display Chinese characters (not pinyin)
- Example: Speaking "nǐ hǎo" → Shows "你好"
- Accuracy: 70-90% for clear native speech

### Step 5: Verify Console Logs

Open the Developer Tools to see detailed logging:

**In Tauri webview:**
1. Right-click anywhere in the app
2. Select "Inspect" or "Inspect Element"
3. Go to "Console" tab

**Expected console output:**
```
[STT] Checking browser compatibility...
[STT] ✅ Speech recognition is supported
[STT] Recognition config: {lang: 'zh-CN', continuous: false, interimResults: true, maxAlternatives: 1}
[STT] startListening() called
[STT] Starting recognition...
[STT] ✅ Recognition started
[STT] Recognition result received
[STT] Result 0: "你好" (final: false)
[STT] Interim transcript: 你好
[STT] Result 1: "你好" (final: true)
[STT] Final transcript: 你好
[STT] ✅ Recognition ended
```

---

## Troubleshooting

### Issue: "Speech recognition is not supported"

**Causes:**
- Using Firefox (not supported)
- Old browser version
- Tauri webview issue

**Solutions:**
- ✅ Verify you're using `npm run tauri dev` (not a web browser)
- ✅ Check console for specific error messages
- ✅ Try restarting the Tauri app

---

### Issue: "Microphone access denied"

**Symptoms:**
- Red error box appears
- Says "Microphone access denied"
- Can't start recording

**Solutions:**

**Windows (Tauri App):**
1. Open **Windows Settings** (Win + I)
2. Go to **Privacy & Security → Microphone**
3. Ensure "Microphone access" is **ON**
4. Scroll down and ensure the app has permission
5. Restart Tauri app

**Reset Permission:**
1. Click Settings (⚙️) in browser URL bar
2. Site permissions → Reset permissions
3. Restart app and try again

---

### Issue: "No speech detected"

**Symptoms:**
- Recording starts fine
- No interim transcript appears
- Error: "No speech detected"

**Solutions:**
- ✅ Check microphone is **plugged in** and **working**
- ✅ Test mic in Windows Sound Settings
- ✅ Speak **louder** and **clearer**
- ✅ Reduce **background noise**
- ✅ Try a different microphone
- ✅ Check Windows microphone volume is not muted

**Test microphone:**
1. Windows Settings → System → Sound
2. Input → Test your microphone
3. Speak - you should see the blue bar move

---

### Issue: Incorrect transcription / Chinese not recognized

**Symptoms:**
- Speaks clearly but gets wrong characters
- Gets English instead of Chinese
- Random incorrect output

**Solutions:**
- ✅ Speak **slowly** and **clearly**
- ✅ Use **simple phrases** (2-3 characters)
- ✅ Speak **standard Mandarin** (Putonghua)
- ✅ Reduce background noise
- ✅ Verify microphone quality

**Note:** Speech recognition accuracy varies:
- **Native speakers**: 70-90% accuracy
- **Non-native speakers**: 50-70% accuracy
- **Accents/dialects**: May reduce accuracy

---

### Issue: "Network error"

**Symptoms:**
- Error: "Network error occurred"
- Can't start recognition
- Works offline but fails online

**Cause:** Speech recognition **requires internet** (uses Google Cloud API)

**Solutions:**
- ✅ Check internet connection
- ✅ Verify no firewall blocking
- ✅ Try again when connection stable

---

### Issue: Recognition stops immediately

**Symptoms:**
- Click "Start"
- Immediately shows "Recognition ended"
- No time to speak

**Solutions:**
- ✅ Check console for errors
- ✅ Try clicking Start again
- ✅ Restart Tauri app
- ✅ Grant microphone permission if prompted

---

## Expected Behavior Summary

### ✅ Working correctly if:
1. Status shows "✅ Supported"
2. Microphone permission granted successfully
3. Listening status changes to "🎤 Recording..."
4. Interim transcript appears while speaking (yellow box)
5. Final transcript shows Chinese characters (white box)
6. Console shows [STT] logs without errors
7. Accuracy is reasonable (70%+ for clear speech)

### ❌ Problem if:
1. Status shows "❌ Not Supported"
2. Permission denied errors
3. No interim transcript appears
4. Gets English text instead of Chinese
5. Console shows errors
6. No console logs appear at all

---

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Tauri app launches successfully
- [ ] Dashboard shows "Speech Recognition" button
- [ ] Button opens test screen
- [ ] Status shows "✅ Supported"
- [ ] Click "Start Recording" works
- [ ] Microphone permission prompt appears
- [ ] Permission granted successfully
- [ ] Status changes to "🎤 Recording..."
- [ ] Speak phrase: "你好"
- [ ] Interim transcript appears in real-time
- [ ] Final transcript shows "你好" or similar
- [ ] Console shows [STT] logs
- [ ] Click "Stop" works
- [ ] Click "Clear" clears transcript
- [ ] Try 3-5 different phrases
- [ ] Accuracy seems reasonable (70%+)
- [ ] "Back to Dashboard" returns to main screen

---

## Advanced Testing

### Test Different Phrases

Try these to test variety:
- **Single characters**: 好, 你, 我
- **Two characters**: 你好, 谢谢, 再见
- **Three characters**: 对不起, 你好吗
- **Four characters**: 我爱你们
- **Numbers**: 一二三, 四五六
- **Common words**: 朋友, 学生, 老师

### Test Edge Cases

- [ ] Speak very quietly (should error: "no speech")
- [ ] Speak very loudly (should still work)
- [ ] Background noise (accuracy may drop)
- [ ] Long pause mid-phrase (may auto-stop)
- [ ] Multiple phrases quickly (should accumulate)
- [ ] Click Stop immediately (should stop)

### Test Error Conditions

- [ ] Revoke mic permission → Should show error
- [ ] Disconnect internet → Should show network error
- [ ] Close and reopen app → Should still work
- [ ] Click Start twice → Should handle gracefully

---

## Performance Metrics

### Expected Performance:
- **Latency**: 500ms-1s for interim results
- **Accuracy**: 70-90% for native speakers
- **Accuracy**: 50-70% for non-native speakers
- **Auto-stop**: After 3-5 seconds of silence
- **Startup time**: < 1 second to start recording

---

## Privacy Note

⚠️ **Important**: Speech recognition sends audio to Google Cloud Speech API

- Audio is transmitted over the internet
- Google processes the audio
- Google's privacy policy applies
- No audio is stored locally by our app
- Users should be aware of this before using

Consider adding this notice to the UI before launching pronunciation features.

---

## Next Steps After Testing

Once testing is successful:

1. **Document results** in currentTask.md
2. **Take screenshots** (optional)
3. **Note any issues** encountered
4. **Consider integration** into study modes
5. **Plan pronunciation comparison** logic
6. **Add user-facing documentation**

---

## Support

If you encounter issues not covered here:
1. Check the console for [STT] logs
2. Review `docs/STT_IMPLEMENTATION.md` for technical details
3. Test in a regular Chrome browser (compare behavior)
4. Check Tauri webview compatibility

---

**Good luck testing! 🎤**
