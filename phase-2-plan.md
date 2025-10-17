# Phase 2: Enhanced Learning Features

**Goal:** Add stroke order, writing practice, and speech features to create a comprehensive learning tool.

**Priority:** Stroke Order > Writing Practice > Speech Features

**Estimated Tasks:** 14 major tasks

**Phase 2 Features:**
- ✅ Make Me a Hanzi integration (stroke order data)
- ✅ Stroke order animations
- ✅ Writing practice mode with drawing verification
- ✅ Web Speech API integration (TTS/STT)
- ✅ Listening practice mode
- ✅ Speech practice mode
- ✅ Multi-character words learning
- ✅ Improved progress analytics

---

## Task 2.1: Make Me a Hanzi Data Integration

**Deliverable:** Make Me a Hanzi data parsed and integrated into database.

**Technical Requirements:**
- Download Make Me a Hanzi repository
- Parse dictionary.txt (JSON lines format)
- Parse graphics.txt (stroke order SVG data)
- Match with existing characters by Unicode
- Update characters table with stroke data
- Store SVG paths as files in resources/strokes/

**Steps:**
1. Add download script for Make Me a Hanzi to data-processing
2. Create parser for dictionary.txt (JSON lines)
3. Create parser for graphics.txt (SVG paths)
4. Update database schema (add stroke_data_path, decomposition, etymology columns)
5. Create matching algorithm (Unicode → Make Me a Hanzi entry)
6. Update build_database to include stroke data
7. Verify 9000+ characters have stroke order

**Success Criteria:**
- ✅ Make Me a Hanzi data downloads successfully
- ✅ Parser handles all 9000+ characters
- ✅ Stroke data linked to characters table
- ✅ SVG files organized and accessible
- ✅ No missing data for common characters (top 3000)

**Acceptance Test:**
1. Run download script - Make Me a Hanzi clones successfully
2. Run parser - no errors
3. Check database - stroke_data_path populated for 9000+ characters
4. Verify top 100 characters all have stroke data
5. Open sample SVG file - renders correctly

**Risk Mitigation:**
- **Risk:** Make Me a Hanzi format changes
- **Mitigation:** Parser handles JSON flexibly, log parsing errors

---

## Task 2.2: Stroke Order Display Component

**Deliverable:** React component that displays animated stroke order.

**Technical Requirements:**
- Load SVG stroke data from backend
- Animate strokes sequentially
- Control playback (play, pause, restart)
- Adjustable speed (0.5x to 2x)
- Show stroke count
- Highlight current stroke

**UI Components:**
- `StrokeOrderDisplay.tsx` - main component
- SVG canvas with viewBox transformation
- Playback controls
- Speed slider

**Success Criteria:**
- ✅ SVG renders correctly at any size
- ✅ Animation smooth (60fps)
- ✅ Controls responsive
- ✅ Works with all characters that have stroke data
- ✅ Speed adjustment functional

**Acceptance Test:**
1. Display stroke order for 学 - animates correctly
2. Test controls - play, pause, restart all work
3. Adjust speed - animation speeds up/slows down
4. Resize window - SVG scales properly
5. Test with complex character (20+ strokes) - smooth

---

## Task 2.3: Flashcard Arrow Addition (Stroke Order)

**Deliverable:** Add "strokes" arrow to character flashcards.

**Technical Requirements:**
- Add new arrow: character --[strokes]--> stroke order
- Integrate StrokeOrderDisplay component
- Update flashcard navigation
- Only show arrow if stroke data available

**Success Criteria:**
- ✅ Stroke arrow appears on characters with data
- ✅ Arrow navigates to stroke order display
- ✅ Animation plays when side loads
- ✅ Consistent with other arrow navigation
- ✅ Characters without stroke data don't show arrow

---

## Task 2.4: Writing Practice Mode - Drawing Canvas

**Deliverable:** Touch/mouse drawing canvas for character writing.

**Technical Requirements:**
- HTML5 canvas for drawing (300x300px or larger)
- Capture touch and mouse events
- Stroke recording (array of points)
- Clear/undo functionality
- Grid guides for alignment

**Success Criteria:**
- ✅ Drawing responsive and smooth
- ✅ Works with mouse and touch
- ✅ Grid guides helpful but not distracting
- ✅ Undo/clear functions work correctly
- ✅ Stroke data captured accurately

---

## Task 2.5: Writing Practice Mode - Stroke Verification

**Deliverable:** Algorithm to verify user-drawn strokes match correct stroke order.

**Technical Requirements:**
- Compare user strokes to Make Me a Hanzi median data
- Check stroke count (must match exactly)
- Check stroke order (sequence)
- Check stroke shape (~10% tolerance)
- Provide feedback (correct/incorrect per stroke)

**Partial Credit Logic:**
- Show which strokes are correct (green)
- Show which strokes are incorrect (red with overlay)
- User retries full character (not individual strokes)

**Success Criteria:**
- ✅ Correctly accepts well-drawn characters
- ✅ Correctly rejects wrong stroke order
- ✅ Tolerant of minor shape variations
- ✅ Clear feedback on what's wrong
- ✅ Not too strict or too lenient

**Risk Mitigation:**
- **Risk:** Too strict/lenient
- **Mitigation:** Adjustable tolerance setting, iterative tuning

---

## Task 2.6: Writing Practice Mode - Complete Flow

**Deliverable:** Full writing practice study mode from start to finish.

**Study Flow:**
1. Load 20 characters with stroke data
2. For each character:
   - Show pinyin + definition (character hidden)
   - Show stroke count hint
   - User draws character
   - Verify → If correct, next character
   - If incorrect, show correct strokes, retry
3. Complete when all characters drawn correctly

**Success Criteria:**
- ✅ Practice session loads correctly
- ✅ Drawing verification works accurately
- ✅ Feedback clear and helpful
- ✅ Session completes successfully
- ✅ Practice recorded in database

---

## Task 2.7: Web Speech API - Text-to-Speech

**Deliverable:** Text-to-speech functionality for character pronunciation.

**Technical Requirements:**
- Use Web Speech API (SpeechSynthesisUtterance)
- Support Mandarin Chinese (zh-CN)
- Play character or word pronunciation
- Adjustable speech rate (0.8x - 1.2x)
- Error handling if TTS unavailable

**Implementation:**
- Create `useSpeech.ts` hook
- Wrap Web Speech API
- Handle browser compatibility
- Provide fallback message if unsupported

**Success Criteria:**
- ✅ TTS works in Tauri webview
- ✅ Mandarin pronunciation clear
- ✅ Rate adjustment works
- ✅ Graceful fallback if unavailable

---

## Task 2.8: Web Speech API - Speech-to-Text

**Deliverable:** Speech recognition for pronunciation practice.

**Technical Requirements:**
- Use Web Speech API (SpeechRecognition)
- Support Mandarin Chinese (zh-CN)
- Capture user speech
- Transcribe to text
- Handle microphone permissions

**Implementation:**
- Create `useSpeechRecognition.ts` hook
- Request microphone permissions
- Display recording state
- Return transcription

**Success Criteria:**
- ✅ Microphone access works
- ✅ Recognition transcribes Mandarin
- ✅ Accuracy reasonable (70%+)
- ✅ Clear user feedback
- ✅ Handles permission denial gracefully

---

## Task 2.9: Listening Practice Mode

**Deliverable:** Study mode where user hears audio and identifies character/word.

**Study Flow:**
1. Load 20 characters
2. For each:
   - Play audio (TTS)
   - User types answer
   - Verify answer
   - If wrong, show correct + replay
   - Retry until correct
3. Complete session

**Success Criteria:**
- ✅ Audio plays clearly
- ✅ User can replay unlimited times
- ✅ Answer verification works
- ✅ Practice recorded in database

---

## Task 2.10: Speech Practice Mode

**Deliverable:** Study mode where user practices pronunciation with feedback.

**Study Flow:**
1. Load 20 characters
2. For each:
   - Show character + pinyin
   - Play correct pronunciation
   - User speaks into microphone
   - Transcribe and compare (fuzzy match)
   - If close enough, mark correct
   - If not, show what was heard, retry
3. Complete session

**Comparison Logic:**
- Convert to lowercase
- Remove tone marks for comparison
- Allow minor variations
- Score: exact = 100%, close = 70%+

**Success Criteria:**
- ✅ Speech recognition works reliably
- ✅ Comparison logic fair and accurate
- ✅ Feedback helps user improve
- ✅ Practice recorded in database

---

## Task 2.11: Multi-Character Words Learning

**Deliverable:** Support for learning multi-character words (phrases).

**Technical Requirements:**
- Words already in database (is_word = 1)
- Update UI to handle words in study modes
- Words don't have stroke order or traditional arrows
- Word flashcards: word → definition, word → pinyin only

**Success Criteria:**
- ✅ Words appear in SRS sessions
- ✅ Words display correctly (no stroke arrows)
- ✅ Word learning follows same SRS rules
- ✅ Mixed sessions (characters + words) work

---

## Task 2.12: Enhanced Progress Analytics

**Deliverable:** Improved dashboard with graphs and detailed statistics.

**New Metrics:**
- Characters learned per day (line graph)
- Accuracy rate by mode (bar chart)
- Most difficult characters (list)
- Study time per day
- Estimated days to milestone

**Visualization:**
- Use chart library (recharts)
- Line graph: learning progress over time
- Bar chart: accuracy by mode
- List: top 10 difficult characters

**Success Criteria:**
- ✅ Charts render correctly
- ✅ Data accurate and up-to-date
- ✅ Visualization helps user understand progress
- ✅ Dashboard still loads quickly

---

## Task 2.13: Phase 2 Integration Testing

**Test Scenarios:**

**Scenario 1: Stroke Order**
- View character with stroke order
- Verify animation plays correctly
- Test controls

**Scenario 2: Writing Practice**
- Complete full writing practice session
- Test verification accuracy

**Scenario 3: Speech Features**
- Test TTS and STT
- Complete listening and speech practice sessions

**Scenario 4: Multi-Character Words**
- Learn words in SRS
- Verify words display correctly

**Scenario 5: Enhanced Analytics**
- View analytics dashboard
- Verify data accuracy

**Success Criteria:**
- ✅ All scenarios pass
- ✅ No regressions from Phase 1
- ✅ Performance acceptable
- ✅ No critical bugs

---

## Task 2.14: Phase 2 Code Cleanup

**Deliverable:** Clean Phase 2 code, updated documentation.

**Cleanup Tasks:**
- Remove debug code
- Format all code (rustfmt, prettier)
- Add documentation comments
- Update README.md with Phase 2 features
- Update CHANGELOG.md
- Git tag v0.2.0-phase2

**Success Criteria:**
- ✅ No linter warnings
- ✅ Code documented
- ✅ README accurate
- ✅ Tagged v0.2.0-phase2

---

## Phase 2 Completion Gate

**Phase 2 Complete When:**
- ✅ All tasks 2.1-2.14 success criteria met
- ✅ Integration testing passed
- ✅ Code cleanup complete
- ✅ All Phase 1 features still functional
- ✅ Documentation updated

**Output:**
- Complete Mandarin learning tool
- 7 study modes functional
- Stroke order and writing practice
- Listening and speaking practice
- Enhanced progress tracking
- Ready for Phase 3 (Cantonese)