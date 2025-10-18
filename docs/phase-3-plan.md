# Phase 3: Cantonese Expansion

**Goal:** Add Cantonese support with traditional characters and dual-dialect learning.

**Priority:** Traditional Characters > Cantonese Pronunciation > Cantonese Toggle

**Estimated Tasks:** 9 major tasks

**Phase 3 Features:**
- ✅ CC-Canto data integration
- ✅ Traditional character display
- ✅ Cantonese Jyutping pronunciation
- ✅ Additional flashcard arrows (traditional, Cantonese)
- ✅ Cantonese toggle mode (show both dialects)
- ✅ Azure Speech Services migration (optional)
- ✅ Cantonese TTS/STT with Azure

**Phase 3 Design:**
- Traditional characters linked to simplified
- Cantonese arrows visible when toggle ON
- Both Mandarin and Cantonese arrows shown simultaneously
- No separate Cantonese flashcards (integrated with existing)

---

## Task 3.1: CC-Canto Data Integration

**Deliverable:** CC-Canto data parsed and integrated into database.

**Technical Requirements:**
- Download CC-Canto dataset
- Parse Cantonese Jyutping pronunciations
- Match with traditional characters
- Update database schema (cantonese_jyutping column)
- Verify coverage (8000+ characters)

**Steps:**
1. Add download script for CC-Canto to data-processing
2. Create parser for CC-Canto format (similar to CC-CEDICT)
3. Update database schema - add cantonese_jyutping column
4. Match Cantonese data with characters table by Unicode
5. Update build_database to include Cantonese data
6. Verify data accuracy and coverage

**Success Criteria:**
- ✅ CC-Canto data downloads successfully
- ✅ 8000+ characters have Cantonese pronunciation
- ✅ Jyutping format correct (e.g., "gwong2 dung1")
- ✅ Integration with existing data seamless
- ✅ No data corruption in existing columns

**Acceptance Test:**
1. Run download script - CC-Canto downloads
2. Run parser - no errors
3. Check database - cantonese_jyutping populated for 8000+ characters
4. Verify common characters have Cantonese (的, 一, 是, etc.)
5. Check Jyutping format - correct tone numbers

**Risk Mitigation:**
- **Risk:** CC-Canto format differs from expectations
- **Mitigation:** Flexible parser, manual verification of samples

**EditHistory.md Entry Template:**
```
## [Date] - 3.1 - CC-Canto Integration
**Task:** 3.1 - CC-Canto Data Integration
**Status:** Complete
**Objective:** [Your notes]
**Decisions Made:** [Your decisions]
**Issues Encountered:** [Issues found]
**Solutions Applied:** [How resolved]
**Code Changes:** [Files modified]
**Testing Results:** [Pass/Fail]
**Next Steps:** Task 3.2
```

---

## Task 3.2: Traditional Character Display

**Deliverable:** Traditional characters displayed alongside simplified in UI.

**Technical Requirements:**
- Traditional column already in database (from CC-CEDICT)
- Add traditional character display to flashcards
- Show traditional in character info
- Handle characters where traditional = simplified (no change needed)

**UI Updates:**
- Character display: 学 (學)
- Traditional character as separate flashcard side
- Traditional character in all study modes
- Clear visual distinction (e.g., label "Traditional")

**Steps:**
1. Update Character type to include traditional field
2. Add traditional character display to flashcard components
3. Create traditional character side (if different from simplified)
4. Update all study modes to handle traditional display
5. Style traditional character appropriately
6. Test with various characters

**Success Criteria:**
- ✅ Traditional characters display correctly
- ✅ Characters without traditional don't show empty/duplicate
- ✅ Traditional readable at all sizes
- ✅ Clear indication of traditional vs. simplified
- ✅ No visual clutter

**Acceptance Test:**
1. View character 学 - shows traditional 學
2. View character 的 - traditional same as simplified (no duplicate)
3. Check font rendering - traditional characters clear
4. Test with complex traditional character (e.g., 龜)
5. Verify traditional appears in all relevant study modes

---

## Task 3.3: Flashcard Arrow Addition (Traditional and Cantonese)

**Deliverable:** Add new arrows to character flashcards for Cantonese support.

**New Arrows:**
- `character --[traditional]--> traditional character`
- `traditional character --[simplified]--> character`
- `traditional character --[cantonese]--> Cantonese pronunciation`

**Technical Requirements:**
- Update Character type to include traditional and Cantonese data
- Add new arrow types to flashcard navigation
- Show arrows only when data available
- Integrate with Extended-Flashcards arrow system
- Maintain consistent arrow styling

**Steps:**
1. Update flashcard data structure to include new arrow types
2. Add traditional side to flashcard (if available)
3. Add Cantonese pronunciation side (if available)
4. Update arrow navigation logic to include new arrows
5. Style arrows consistently with existing arrows
6. Conditionally show arrows (only if data exists)
7. Test navigation flow with all arrow types

**Success Criteria:**
- ✅ New arrows appear on characters with data
- ✅ Navigation between sides works smoothly
- ✅ Arrow labels clear ("traditional", "simplified", "cantonese")
- ✅ Consistent with existing arrow design
- ✅ Characters without data don't show empty arrows

**Acceptance Test:**
1. View character 学 - traditional arrow visible
2. Click traditional arrow - shows 學
3. From 學, simplified arrow navigates back to 学
4. From 學, cantonese arrow shows Jyutping
5. Test with character without traditional - no extra arrows
6. Navigate full cycle: character → traditional → cantonese → simplified → character

---

## Task 3.4: Cantonese Toggle Mode

**Deliverable:** Toggle setting to show/hide Cantonese arrows in study modes.

**Technical Requirements:**
- Add toggle setting (on/off)
- Store setting in app_settings table or localStorage
- When ON: show all arrows (Mandarin + Cantonese)
- When OFF: hide Cantonese-specific arrows (traditional, cantonese)
- Default: OFF (Mandarin-only mode)
- Setting persists across app sessions

**UI Implementation:**
- Settings page: "Show Cantonese" toggle switch
- Real-time update (no app restart required)
- Affects all study modes
- Clear indication of current mode

**Behavior:**
**Toggle OFF (Mandarin-only mode):**
- character → definition
- character → pinyin (Mandarin)
- character → strokes

**Toggle ON (Dual-dialect mode):**
- All Mandarin arrows (above)
- character → traditional
- traditional → simplified
- traditional → cantonese (Jyutping)

**Steps:**
1. Add toggle setting to Settings page
2. Create setting storage (database or localStorage)
3. Create global state for toggle (React context or state)
4. Update flashcard component to conditionally show arrows based on toggle
5. Test toggle switching in real-time
6. Verify setting persists after app restart

**Success Criteria:**
- ✅ Toggle setting saves and persists
- ✅ Arrows show/hide correctly based on toggle
- ✅ Both Mandarin and Cantonese arrows visible when ON
- ✅ No conflicts or visual clutter when ON
- ✅ Real-time update (no restart needed)
- ✅ Default is OFF

**Acceptance Test:**
1. Open settings - Cantonese toggle is OFF
2. View flashcard - only Mandarin arrows visible
3. Toggle Cantonese ON - traditional and cantonese arrows appear
4. Navigate Cantonese arrows - works correctly
5. Toggle OFF - Cantonese arrows disappear
6. Restart app - toggle state persists

**Risk Mitigation:**
- **Risk:** Toggle causes UI to overflow with too many arrows
- **Mitigation:** Test UI layout, adjust spacing/design if needed

---

## Task 3.5: Cantonese Pronunciation in Study Modes

**Deliverable:** Cantonese pronunciation testable in study modes when toggle ON.

**Technical Requirements:**
- When Cantonese toggle ON: include Cantonese arrows in random selection
- Study session may test: Mandarin pinyin OR Cantonese Jyutping
- Answer verification for Jyutping format
- Traditional character may appear as prompt
- Clear indication of which dialect is being tested

**Implementation:**
- Update session logic to check Cantonese toggle
- If ON, include traditional→cantonese in arrow pool
- Update answer verification to handle Jyutping
- Display "Mandarin" or "Cantonese" label in question

**Jyutping Answer Verification:**
- Case insensitive
- Whitespace trimmed
- Tone numbers required (e.g., "gwong2")
- Accept if matches expected Jyutping

**Steps:**
1. Update SRS session to include Cantonese arrows when toggle ON
2. Update self-study mode to include Cantonese arrows
3. Modify answer verification to handle Jyutping
4. Add visual indicator of which dialect is being tested
5. Test mixed Mandarin/Cantonese sessions
6. Verify answer verification accurate for Jyutping

**Success Criteria:**
- ✅ Cantonese arrows tested when toggle ON
- ✅ User clearly knows which dialect expected (label shown)
- ✅ Answer verification accurate for Jyutping
- ✅ Mixed Mandarin/Cantonese sessions work smoothly
- ✅ No confusion about which pronunciation to give

**Acceptance Test:**
1. Toggle Cantonese ON
2. Start SRS session - some questions ask for Cantonese
3. Question shows "Cantonese pronunciation" label
4. Type Jyutping - accepted if correct
5. Complete session with mixed dialects - no issues
6. Toggle OFF - only Mandarin questions appear

---

## Task 3.6: Azure Speech Services Integration (Optional)

**Deliverable:** Migrate from Web Speech API to Azure Speech Services for better Cantonese support.

**Technical Requirements:**
- Set up Azure Speech Services account (free tier)
- Obtain API keys (0.5M characters/month free)
- Implement Rust Tauri commands for TTS/STT
- Store API keys securely in Rust backend (never in frontend)
- Replace Web Speech API calls with Azure calls
- Provide fallback to Web Speech if Azure unavailable

**Azure Configuration:**
- Free tier: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/
- Region: Select closest to user
- Neural voices for best quality

**Azure Voices:**
**Mandarin:**
- `zh-CN-XiaoxiaoNeural` (female, clear)
- `zh-CN-YunxiNeural` (male, clear)

**Cantonese:**
- `zh-HK-HiuGaaiNeural` (female, natural)
- `zh-HK-WanLungNeural` (male, natural)

**Implementation:**
**Rust Backend (Tauri commands):**
```rust
// Store API key securely
static AZURE_API_KEY: &str = env!("AZURE_SPEECH_KEY");

#[tauri::command]
async fn azure_text_to_speech(text: String, language: String) -> Result<Vec<u8>, String>

#[tauri::command]
async fn azure_speech_to_text(audio: Vec<u8>, language: String) -> Result<String, String>
```

**Frontend:**
- Replace Web Speech API calls with Tauri commands
- Fallback to Web Speech if Azure fails
- Show user if using Azure or Web Speech

**Steps:**
1. Create Azure account and Speech Services resource
2. Obtain API key and region
3. Add Azure Speech SDK to Rust dependencies
4. Implement Tauri command for TTS (text → audio)
5. Implement Tauri command for STT (audio → text)
6. Secure API key in Rust backend (environment variable)
7. Update frontend to use Azure commands
8. Add fallback to Web Speech API
9. Test both Mandarin and Cantonese

**Success Criteria:**
- ✅ Azure TTS works for Mandarin
- ✅ Azure TTS works for Cantonese
- ✅ Azure STT works for both dialects
- ✅ Quality noticeably better than Web Speech API
- ✅ API keys stored securely (not in frontend code)
- ✅ Fallback to Web Speech if Azure unavailable
- ✅ Free tier limits respected (usage tracking)

**Acceptance Test:**
1. Configure Azure API key in environment
2. Test Mandarin TTS - high quality, natural
3. Test Cantonese TTS - high quality, natural
4. Test Mandarin STT - accurate transcription
5. Test Cantonese STT - accurate transcription
6. Remove API key - fallback to Web Speech works
7. Check usage - within free tier limits

**Risk Mitigation:**
- **Risk:** Free tier limit exceeded
- **Mitigation:** Track usage, warn user at 80%, disable at 100%
- **Risk:** API keys exposed in frontend
- **Mitigation:** Store only in Rust backend, never send to frontend
- **Risk:** Azure service outage
- **Mitigation:** Automatic fallback to Web Speech API

**Note:** This task is OPTIONAL. Web Speech API works for Mandarin. Azure is recommended for high-quality Cantonese support.

---

## Task 3.7: Cantonese TTS/STT in Study Modes

**Deliverable:** Listening and speech practice modes support Cantonese with Azure (or Web Speech).

**Technical Requirements:**
- Update listening practice to support Cantonese
- Update speech practice to recognize Cantonese
- Clearly indicate dialect being tested
- Use appropriate voice/recognition based on dialect
- Handle both Web Speech API and Azure implementations

**Implementation:**
**Listening Practice:**
- If traditional character with Cantonese: use Cantonese voice
- If simplified character with Mandarin: use Mandarin voice
- Show label: "Listen to Mandarin" or "Listen to Cantonese"

**Speech Practice:**
- If testing Cantonese: use Cantonese STT
- If testing Mandarin: use Mandarin STT
- Show label: "Speak in Mandarin" or "Speak in Cantonese"
- Verify against expected dialect

**Steps:**
1. Update listening practice to detect dialect
2. Use appropriate TTS voice based on dialect
3. Update speech practice to detect dialect
4. Use appropriate STT language based on dialect
5. Add dialect labels to UI
6. Test both Mandarin and Cantonese in listening mode
7. Test both Mandarin and Cantonese in speech mode

**Success Criteria:**
- ✅ Cantonese TTS clear and natural (if using Azure)
- ✅ Cantonese STT recognizes speech accurately
- ✅ User clearly knows which dialect expected
- ✅ Both dialects work in same session
- ✅ Correct voice/recognition used automatically

**Acceptance Test:**
1. Start listening practice with Cantonese toggle ON
2. Hear Mandarin pronunciation for simplified character
3. Hear Cantonese pronunciation for traditional character
4. Labels clearly indicate dialect
5. Start speech practice with both dialects
6. Speak Mandarin - recognized correctly
7. Speak Cantonese - recognized correctly

---

## Task 3.8: Phase 3 Integration Testing

**Deliverable:** Comprehensive testing of all Cantonese features.

**Test Scenarios:**

**Scenario 1: Traditional Characters**
1. View flashcard with traditional character
2. Navigate traditional ↔ simplified arrows
3. Verify traditional displays correctly in all contexts
4. Test characters where traditional = simplified
5. Verify no duplicate or empty displays

**Scenario 2: Cantonese Toggle**
1. Verify default is OFF (Mandarin-only)
2. Toggle Cantonese ON in settings
3. Verify new arrows appear on flashcards
4. Test study session with Cantonese arrows
5. Navigate all Cantonese arrows successfully
6. Toggle OFF - verify Cantonese arrows hidden
7. Restart app - verify toggle state persists

**Scenario 3: Dual-Dialect Learning**
1. Toggle Cantonese ON
2. Start SRS session with both Mandarin and Cantonese questions
3. Answer Mandarin pinyin questions correctly
4. Answer Cantonese Jyutping questions correctly
5. Verify answer verification accurate for both
6. Complete mixed session successfully
7. Check progress - both dialects tracked

**Scenario 4: Azure Speech (if implemented)**
1. Test Mandarin TTS with Azure - quality check
2. Test Cantonese TTS with Azure - quality check
3. Test Mandarin STT - accuracy check
4. Test Cantonese STT - accuracy check
5. Compare quality with Web Speech API
6. Test fallback if Azure unavailable
7. Verify API key security (not exposed)

**Scenario 5: Cross-Feature Integration**
1. Learn character in Mandarin (Phase 1)
2. Add stroke order practice (Phase 2)
3. Add traditional character and Cantonese (Phase 3)
4. Verify all features work together
5. No conflicts between features
6. All study modes accessible

**Success Criteria:**
- ✅ All scenarios pass without errors
- ✅ No regressions from Phase 1 or 2
- ✅ Cantonese features work as specified
- ✅ Toggle mode functional and intuitive
- ✅ Azure integration smooth (if implemented)
- ✅ Performance remains acceptable
- ✅ No critical bugs

**Acceptance Test:**
Run all 5 scenarios sequentially, document results in EditHistory.md

**EditHistory.md Entry:**
```
## [Date] - 3.8 - Phase 3 Integration Testing
**Task:** 3.8 - Phase 3 Integration Testing
**Status:** Complete
**Test Results:**
- Scenario 1 (Traditional Characters): [Pass/Fail with notes]
- Scenario 2 (Cantonese Toggle): [Pass/Fail with notes]
- Scenario 3 (Dual-Dialect Learning): [Pass/Fail with notes]
- Scenario 4 (Azure Speech): [Pass/Fail/Not Implemented with notes]
- Scenario 5 (Cross-Feature Integration): [Pass/Fail with notes]
**Issues Found:** [List all bugs/issues]
**Solutions Applied:** [How resolved]
**Remaining Issues:** [Unresolved, if any]
**Performance:** [Acceptable/Needs optimization]
**Next Steps:** Code cleanup (Task 3.9)
```

---

## Task 3.9: Phase 3 Code Cleanup and Documentation

**Deliverable:** Clean Phase 3 code, final documentation updates.

**Cleanup Tasks:**
- Remove all debug code and console.logs
- Format all code (rustfmt, prettier)
- Add documentation comments to new functions
- Update README.md with Cantonese features
- Update CHANGELOG.md with Phase 3 changes
- Final EditHistory.md review
- Create comprehensive user guide

**Documentation Updates:**

**README.md additions:**
- Dual-dialect learning capability
- Cantonese toggle explanation
- Traditional character support
- Azure Speech setup (if implemented)
- Updated screenshots showing Cantonese features

**CHANGELOG.md additions:**
```markdown
## [1.0.0] - Phase 3: Cantonese Expansion - 2025-XX-XX

### Added
- Traditional Chinese character display
- Cantonese Jyutping pronunciation for 8000+ characters
- Dual-dialect learning mode with toggle
- Additional flashcard arrows (traditional, Cantonese)
- Cantonese support in all study modes
- [Optional] Azure Speech Services for high-quality TTS/STT
- Both Mandarin and Cantonese arrows visible simultaneously

### Features
- Toggle between Mandarin-only and dual-dialect mode
- Learn traditional and simplified characters together
- Practice pronunciation in both dialects
- Seamless integration with existing features

### Technical
- CC-Canto database integration
- Azure Speech Services API (optional)
- Enhanced flashcard navigation
- Secure API key management

### License & Attribution
- CC-Canto data: CC BY-SA 4.0
- All other attributions maintained from Phase 1 & 2
```

**Steps:**
1. Run all linters (cargo clippy, eslint)
2. Fix all warnings
3. Run formatters (rustfmt, prettier)
4. Remove all debug code
5. Add JSDoc/TSDoc comments to new code
6. Update README.md comprehensively
7. Update CHANGELOG.md
8. Create user guide for Cantonese features
9. Final EditHistory.md review
10. Git tag v1.0.0-phase3

**Success Criteria:**
- ✅ No linter warnings
- ✅ Code clean and well-documented
- ✅ README comprehensive and accurate
- ✅ CHANGELOG complete
- ✅ User guide clear and helpful
- ✅ Git tagged v1.0.0-phase3

**Acceptance Test:**
1. Run `cargo clippy` - no warnings
2. Run `npm run lint` - no errors
3. Build production version - compiles successfully
4. Read README.md - clear and accurate
5. Read CHANGELOG.md - complete history
6. Review user guide - helpful for new features

---

## Phase 3 Completion Gate

**Phase 3 Complete When:**
- ✅ All tasks 3.1-3.9 success criteria met
- ✅ Integration testing passed (all 5 scenarios)
- ✅ Code cleanup complete
- ✅ All Phase 1 and 2 features still functional
- ✅ Documentation finalized
- ✅ Git tagged v1.0.0-phase3

**Phase 3 Acceptance Criteria:**

**Functional Requirements:**
1. ✅ Traditional characters display correctly for 8000+ characters
2. ✅ Cantonese pronunciations integrated and accurate
3. ✅ New flashcard arrows functional (traditional, cantonese)
4. ✅ Cantonese toggle works smoothly
5. ✅ Both dialects testable in study modes
6. ✅ Azure Speech works (if implemented)
7. ✅ Dual-dialect learning seamless

**Quality Requirements:**
1. ✅ No regressions from Phase 1 or 2
2. ✅ Cantonese features polished and professional
3. ✅ Toggle mode intuitive
4. ✅ Performance remains good (no slowdown)
5. ✅ Documentation comprehensive
6. ✅ Cross-platform compatible

**Phase 3 Completion Checklist:**
- [ ] CC-Canto data integrated (8000+ characters)
- [ ] Traditional characters working
- [ ] Cantonese flashcard arrows implemented
- [ ] Toggle mode functional and persistent
- [ ] Speech features support both dialects
- [ ] Integration testing passed (all scenarios)
- [ ] Code cleanup complete
- [ ] Documentation finalized (README, CHANGELOG, user guide)
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Tagged v1.0.0-phase3

**Output:**
- **Complete Chinese learning application (v1.0.0)**
- Mandarin and Cantonese support
- Traditional and simplified characters
- 7+ study modes
- Stroke order and writing practice
- Listening and speaking practice (both dialects)
- Dual-dialect learning capability
- Professional, production-ready application
- Comprehensive documentation
- Ready for user distribution

---

## Project Complete! 🎉

**Final Application Features:**
- ✅ 100,000+ characters and words
- ✅ Frequency-based learning progression
- ✅ Spaced repetition algorithm (SM-2 based)
- ✅ 7 study modes (SRS, self-study, writing, listening, speech, etc.)
- ✅ Stroke order animations for 9000+ characters
- ✅ Mandarin and Cantonese support
- ✅ Traditional and simplified characters
- ✅ Speech recognition and synthesis
- ✅ Comprehensive progress tracking
- ✅ Cross-platform desktop application

**Version:** 1.0.0  
**Status:** Production Ready  
**License:** MIT (code) + Open data licenses (see DATA-LICENSES.md)

**Estimated Total Development Time:**
- Phase 0: 1-2 days
- Phase 1: 4-6 weeks
- Phase 2: 3-4 weeks
- Phase 3: 2-3 weeks
- **Total:** 10-14 weeks (part-time)

Congratulations on completing the development plan! 🚀