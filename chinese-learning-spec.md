## License Compliance Requirements

### Required Files in Repository

#### 1. License and Attribution Files (Root Directory)
- ✅ `LICENSE.md` - MIT License for your code
- ✅ `DATA-LICENSES.md` - Detailed data source licenses
- ✅ `CREDITS.md` - Acknowledgments and attributions
- ✅ `.gitignore` - Exclude downloaded datasets

#### 2. LICENSES Directory
Create `LICENSES/` directory with full license texts:
```
LICENSES/
├── CC-BY-SA-4.0.txt          # Download from creativecommons.org
├── Arphic-Public-License.txt # Copy from Make Me a Hanzi repo
├── LGPL-2.1.txt              # Download from gnu.org
└── SUBTLEX-CH-Citation.txt   # Create with citation requirements
```

**Where to get license texts:**
- **CC-BY-SA-4.0.txt**: https://creativecommons.org/licenses/by-sa/4.0/legalcode.txt
- **Arphic-Public-License.txt**: https://github.com/skishore/makemeahanzi/blob/master/COPYING
- **LGPL-2.1.txt**: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.txt
- **SUBTLEX-CH-Citation.txt**: Create manually with citation text

#### 3. .gitignore Additions
Add to `.gitignore`:
```gitignore
# Downloaded datasets (DO NOT COMMIT)
datasets/
*.db
data-processing/downloads/

# Extracted data files
cedict*.txt
cedict*.gz
SUBTLEX-CH*/
makemeahanzi/
cc-canto/

# Build outputs
chinese.db
src-tauri/resources/chinese.db
```

#### 4. README.md Updates
Add to README.md:

```markdown
## Data Sources & Licenses

This application uses several open-source Chinese language datasets:

- **CC-CEDICT** (CC BY-SA 4.0) - Chinese-English dictionary
- **SUBTLEX-CH** (Academic use) - Character/word frequency rankings  
- **Make Me a Hanzi** (Arphic/LGPL) - Stroke order data
- **CC-Canto** (CC BY-SA 4.0) - Cantonese pronunciations

⚠️ **Important:** The datasets are NOT included in this repository. You must 
download them separately to build the application.

See [DATA-LICENSES.md](DATA-LICENSES.md) for complete license information and 
[CREDITS.md](CREDITS.md) for acknowledgments.

### Building from Source

#### Prerequisites
- Node.js (v18+)
- Rust (latest stable)
- Tauri CLI

#### Download Datasets
```bash
# Automated download (requires internet)
cd data-processing
cargo run --bin download-datasets

# This will download and extract:
# - CC-CEDICT (~7 MB)
# - SUBTLEX-CH (~12 MB)
# - Make Me a Hanzi (~15 MB)
# - CC-Canto (~10 MB) [Phase 3]
```

#### Build Database
```bash
cargo run --bin build-database
# Creates chinese.db (~300 MB)
```

#### Run Application
```bash
npm install
npm run tauri:dev
```

For detailed setup instructions, see [SETUP.md](SETUP.md).

## License

- **Application code:** MIT License - see [LICENSE.md](LICENSE.md)
- **Chinese data:** Various open licenses - see [DATA-LICENSES.md](DATA-LICENSES.md)

This is a non-commercial, educational project.
```

### Required UI Components

#### 1. About/Credits Screen (REQUIRED)
Create `src/components/AboutScreen.tsx`:

```typescript
import React from 'react';

export const AboutScreen: React.FC = () => {
  return (
    <div className="about-screen">
      <h1>Chinese Learning Tool</h1>
      <p>Version 1.0.0</p>
      
      <section>
        <h2>About This Application</h2>
        <p>
          An open-source desktop application for learning Mandarin Chinese
          through spaced repetition and interactive study methods.
        </p>
        <p>
          This is a non-commercial, educational project built with Tauri, 
          React, and Rust.
        </p>
      </section>

      <section>
        <h2>Data Sources</h2>
        <p>This application uses the following open-source datasets:</p>
        
        <DataSourceCredit
          name="CC-CEDICT"
          description="Chinese-English Dictionary"
          maintainer="MDBG and CC-CEDICT contributors"
          license="CC BY-SA 4.0"
          url="https://cc-cedict.org/"
        />
        
        <DataSourceCredit
          name="SUBTLEX-CH"
          description="Character Frequency Data"
          authors="Cai, Q., & Brysbaert, M. (2010)"
          citation="SUBTLEX-CH: Chinese Word and Character Frequencies Based on Film Subtitles. PLoS ONE, 5(6), e10729."
          license="Free for research and educational purposes"
          url="https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch"
        />
        
        <DataSourceCredit
          name="Make Me a Hanzi"
          description="Stroke Order Graphics"
          creator="Shaunak Kishore"
          license="Arphic Public License / LGPL 2.1+"
          url="https://github.com/skishore/makemeahanzi"
          additionalCredit="Original font data © Arphic Technology"
        />
        
        <DataSourceCredit
          name="CC-Canto"
          description="Cantonese Pronunciations"
          maintainer="CC-Canto contributors"
          license="CC BY-SA 4.0"
          url="https://cantonese.org/"
        />
      </section>

      <section>
        <h2>License</h2>
        <p>
          <strong>Application Code:</strong> MIT License
          <br />
          <strong>Chinese Data:</strong> Various open licenses
        </p>
        <p>
          For complete licensing information, see our{' '}
          <button onClick={openLicenseFile}>DATA-LICENSES.md</button> file
          and <button onClick={openCreditsFile}>CREDITS.md</button>.
        </p>
      </section>

      <section>
        <h2>Source Code</h2>
        <p>
          This project is open source. View the code, report issues, or 
          contribute at:
          <br />
          <a href="https://github.com/[your-username]/chinese-learning-tool" 
             target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
        </p>
      </section>

      <footer>
        <p>
          Built with ❤️ for language learners everywhere.
          <br />
          Thank you to all the open-source contributors who made this possible.
        </p>
      </footer>
    </div>
  );
};

interface DataSourceCreditProps {
  name: string;
  description: string;
  maintainer?: string;
  creator?: string;
  authors?: string;
  citation?: string;
  license: string;
  url: string;
  additionalCredit?: string;
}

const DataSourceCredit: React.FC<DataSourceCreditProps> = ({
  name,
  description,
  maintainer,
  creator,
  authors,
  citation,
  license,
  url,
  additionalCredit,
}) => {
  return (
    <div className="data-source-credit">
      <h3>{name}</h3>
      <p className="description">{description}</p>
      
      {maintainer && <p><strong>Maintained by:</strong> {maintainer}</p>}
      {creator && <p><strong>Created by:</strong> {creator}</p>}
      {authors && <p><strong>Authors:</strong> {authors}</p>}
      {citation && (
        <p className="citation">
          <strong>Citation:</strong> {citation}
        </p>
      )}
      
      <p><strong>License:</strong> {license}</p>
      <p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Visit website →
        </a>
      </p>
      
      {additionalCredit && (
        <p className="additional-credit">{additionalCredit}</p>
      )}
    </div>
  );
};

// Helper functions to open license files
const openLicenseFile = () => {
  // Tauri command to open DATA-LICENSES.md
  window.open('DATA-LICENSES.md', '_blank');
};

const openCreditsFile = () => {
  // Tauri command to open CREDITS.md
  window.open('CREDITS.md', '_blank');
};
```

**Navigation:** Add "About" to main navigation menu:
```typescript
// In Navigation.tsx or App.tsx
<nav>
  <Link to="/">Home</Link>
  <Link to="/study">Study</Link>
  <Link to="/progress">Progress</Link>
  <Link to="/settings">Settings</Link>
  <Link to="/about">About</Link>  {/* REQUIRED */}
</nav>
```

#### 2. First-Run Welcome Screen (OPTIONAL BUT RECOMMENDED)
Show on first app launch:

```typescript
export const WelcomeScreen: React.FC = () => {
  return (
    <div className="welcome-screen">
      <h1>Welcome to Chinese Learning Tool!</h1>
      
      <section>
        <h2>About This Application</h2>
        <p>
          This open-source application helps you learn Mandarin Chinese using
          scientifically-proven spaced repetition techniques.
        </p>
      </section>

      <section>
        <h2>Data Sources</h2>
        <p>
          This application is built using high-quality open-source Chinese
          language datasets from:
        </p>
        <ul>
          <li>CC-CEDICT (dictionary)</li>
          <li>SUBTLEX-CH (frequency data)</li>
          <li>Make Me a Hanzi (stroke order)</li>
        </ul>
        <p>
          We are grateful to the researchers and volunteers who made these
          resources freely available for educational use.
        </p>
      </section>

      <section>
        <h2>Educational Use</h2>
        <p>
          This application is provided free of charge for personal educational
          use. See our About page for complete licensing information.
        </p>
      </section>

      <button onClick={getStarted}>Get Started</button>
      <button onClick={viewAbout}>Learn More</button>
    </div>
  );
};
```

### Tauri Commands for License Display

Add to `src-tauri/src/commands.rs`:

```rust
#[tauri::command]
async fn get_license_info() -> Result<LicenseInfo, String> {
    Ok(LicenseInfo {
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        app_license: "MIT".to_string(),
        data_sources: vec![
            DataSource {
                name: "CC-CEDICT".to_string(),
                license: "CC BY-SA 4.0".to_string(),
                url: "https://cc-cedict.org/".to_string(),
            },
            DataSource {
                name: "SUBTLEX-CH".to_string(),
                license: "Academic/Educational Use".to_string(),
                url: "https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch".to_string(),
            },
            DataSource {
                name: "Make Me a Hanzi".to_string(),
                license: "Arphic / LGPL 2.1+".to_string(),
                url: "https://github.com/skishore/makemeahanzi".to_string(),
            },
        ],
    })
}

#[derive(serde::Serialize)]
struct LicenseInfo {
    app_version: String,
    app_license: String,
    data_sources: Vec<DataSource>,
}

#[derive(serde::Serialize)]
struct DataSource {
    name: String,
    license: String,
    url: String,
}
```

### Distribution Requirements

#### For GitHub Releases
When creating releases, include in the release notes:

```markdown
## Chinese Learning Tool v1.0.0

### Installation
Download the appropriate installer for your platform below.

### Data Sources
This application uses the following open-source datasets:
- CC-CEDICT (CC BY-SA 4.0)
- SUBTLEX-CH (Educational use)
- Make Me a Hanzi (Arphic/LGPL)

See DATA-LICENSES.md in the repository for complete licensing information.

### License
- Application code: MIT License
- Chinese language data: Various open licenses (see above)

This is a non-commercial, educational application.

### Downloads
- Windows: chinese-learning-tool_1.0.0_x64.msi
- macOS: chinese-learning-tool_1.0.0_x64.dmg
- Linux: chinese-learning-tool_1.0.0_amd64.AppImage
```

#### Bundle Database in Release
The built application should include `chinese.db` in the bundle:

In `src-tauri/tauri.conf.json`:
```json
{
  "tauri": {
    "bundle": {
      "resources": [
        "resources/chinese.db",
        "../DATA-LICENSES.md",
        "../CREDITS.md"
      ]
    }
  }
}
```

This ensures users get the pre-built database and license files with the app.

### Compliance Checklist for Release

Before each release, verify:

- [ ] `LICENSE.md` present in repository root
- [ ] `DATA-LICENSES.md` present and up-to-date
- [ ] `CREDITS.md` present with all attributions
- [ ] `LICENSES/` directory contains all license texts:
  - [ ] CC-BY-SA-4.0.txt
  - [ ] Arphic-Public-License.txt
  - [ ] LGPL-2.1.txt
  - [ ] SUBTLEX-CH-Citation.txt
- [ ] `.gitignore` excludes datasets directory
- [ ] README.md includes data sources section
- [ ] README.md states "non-commercial, educational"
- [ ] About screen implemented in application
- [ ] About screen displays all data source credits
- [ ] About screen accessible from main navigation
- [ ] SUBTLEX-CH citation displayed in About screen
- [ ] Database bundled with application
- [ ] Release notes mention data sources and licenses
- [ ] No raw dataset files committed to git
- [ ] Download scripts include attribution notices

### Annual Compliance Review

**Recommended:** Review compliance annually:

1. Check if any dataset licenses have changed
2. Verify all URLs still valid
3. Update license texts if new versions released
4. Review any new legal requirements
5. Update DATA-LICENSES.md with review date

Add to calendar: Review licensing compliance every October

---

## Additional Compliance Notes

### For Future Commercial Use
If you ever want to make this commercial:

1. **MUST obtain permission from SUBTLEX-CH authors:**
   - Email: qing.cai@ugent.be and marc.brysbaert@ugent.be
   - Explain your use case
   - Wait for written permission

2. **CC-CEDICT and CC-Canto:** Already allow commercial use (CC BY-SA 4.0)

3. **Make Me a Hanzi:** Already allows commercial use (LGPL permits this)

### Derivative Works
If someone forks your project:

- They must maintain all attribution
- They must include all license files
- They must comply with CC BY-SA (ShareAlike requirement)
- They cannot add additional restrictions to the data

### User Privacy
Since you're using open datasets:

- No user data is sent to external servers
- All processing happens locally
- Datasets themselves don't contain personal information
- Your privacy policy should mention this

### Attribution in App UI
**Minimum requirement:** About screen with credits (implemented above)

**Optional enhancements:**
- Tooltip on first launch: "Powered by CC-CEDICT and other open datasets"
- Footer in main UI: "Data: CC-CEDICT, SUBTLEX-CH, Make Me a Hanzi"
- Settings > About section

### Open Source Best Practices
Beyond legal requirements:

- ✅ Acknowledge contributors in commit messages
- ✅ Link to original projects in documentation
- ✅ Report bugs you find to upstream projects
- ✅ Consider contributing improvements back
- ✅ Be a good open-source citizen

---

## Summary of Compliance Actions

### Immediate Actions (Before First Commit)
1. Create `LICENSE.md` (MIT for your code)
2. Create `DATA-LICENSES.md` (detailed data licenses)
3. Create `CREDITS.md` (acknowledgments)
4. Create `LICENSES/` directory
5. Download and add license texts to `LICENSES/`
6. Update `.gitignore` to exclude datasets
7. Update `README.md` with data sources section

### During Development
1. Implement About screen with credits
2. Add About to main navigation
3. Implement download-datasets script
4. Add attribution notices to download script output
5. Bundle database and license files in release

### Before Each Release
1. Run compliance checklist
2. Verify all URLs still work
3. Update version numbers
4. Include licensing info in release notes
5. Test that About screen displays correctly

### Ongoing
1. Respect non-commercial restriction
2. Maintain attribution in all distributed versions
3. Keep license files up-to-date
4. Annual compliance review

---

*These compliance requirements ensure that your application respects the generous 
contributions of open-source dataset creators while staying within legal bounds.*# Chinese Learning Tool - Complete Specifications Document

## Project Overview
Desktop application built with Tauri (Rust) + React + TypeScript for learning Mandarin Chinese with Cantonese support. Based on the Extended-Flashcards architecture with spaced repetition as the primary learning method.

---

## Technology Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust (Tauri)
- **Database**: SQLite
- **Target**: Desktop application (Windows, Mac, Linux)
- **Based on**: Extended-Flashcards architecture

---

## Core Concepts

### Flashcard Structure
Each character/word is a flashcard with multiple "sides" connected by labeled arrows (like Extended-Flashcards).

#### Character Flashcards
**Sides:**
1. **Character** (simplified Chinese)
2. **Definition** (English)
3. **Pinyin** (Mandarin pronunciation)
4. **Stroke Order** (animated SVG)
5. **Traditional Character** (Phase 3)
6. **Cantonese Pronunciation** (Phase 3)

**Arrow Connections:**
- `character --[english]--> definition`
- `character --[pinyin]--> pinyin`
- `character --[strokes]--> stroke order`
- `character --[traditional]--> traditional character` (Phase 3)
- `traditional character --[simplified]--> character` (Phase 3)
- `traditional character --[cantonese]--> cantonese pronunciation` (Phase 3)

#### Word Flashcards
**Sides:**
1. **Word** (multi-character word)
2. **Definition** (English)
3. **Pinyin** (Mandarin pronunciation)

**Arrow Connections:**
- `word --[definition]--> definition`
- `word --[pinyin]--> pinyin`

**Note:** Words do NOT have stroke order or traditional character sides.

### Hidden Priority System
- Every character/word has a hidden **frequency rank** from SUBTLEX-CH
- Lower rank = more common = learned earlier
- Users never see this number
- Determines unlock order for new cards

---

## Data Sources

### 1. CC-CEDICT - Primary Dictionary
**Provides:**
- Simplified Chinese characters
- Traditional Chinese characters
- Mandarin pinyin
- English definitions
- Multi-character words

**Download:** https://www.mdbg.net/chinese/dictionary?page=cedict
**License:** CC BY-SA 4.0

### 2. SUBTLEX-CH - Frequency Rankings
**Provides:**
- Character frequency rankings
- Word frequency rankings
- Hidden priority system

**Download:** https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch
**License:** Free for educational use (cite paper)

### 3. Make Me a Hanzi - Stroke Order
**Provides:**
- Stroke order SVG animations
- Character decomposition
- ~9,000 most common characters

**Download:** https://github.com/skishore/makemeahanzi
**License:** Arphic Public License / LGPL

### 4. CC-Canto - Cantonese Pronunciation (Phase 3)
**Provides:**
- Cantonese Jyutping romanization
- Traditional character mappings

**Download:** https://cantonese.org/
**License:** CC BY-SA

### 5. Web Speech API - Speech Features (Phase 1)
**Provides:**
- Text-to-Speech (Mandarin: `zh-CN`)
- Speech-to-Text (Mandarin: `zh-CN`)
- Built into browser/Tauri webview
- Free, no API keys

### 6. Azure Speech Services (Phase 2+)
**Provides:**
- High-quality TTS/STT
- Cantonese support (`zh-HK`)
- Free tier: 0.5M chars/month

---

## Study Methods

### 1. Spaced Repetition (Primary Method)

#### Overview
- Primary learning method using spaced repetition algorithm
- Start with 15 cards (by frequency rank)
- Cards unlock as existing cards mature

#### Initial State
- User begins with the 15 most common characters/words by frequency
- These 15 cards enter the spaced repetition pool

#### Card Unlocking Logic
- When a card reaches **1+ week interval** for the FIRST time, unlock 1 new card
- New card = next highest frequency character/word not yet learned
- This occurs once per card (even if they later get it wrong and drop below 1 week)
- Pool grows: 15 → 16 → 17 → ... as more cards mature

#### Study Session Flow
1. **Session starts:** Show all cards currently due for review
2. **For each card:**
   - System randomly selects an arrow to test (e.g., character → definition)
   - User types answer
   - System checks correctness automatically
3. **If CORRECT:**
   - Mark card as correct
   - Increase interval (e.g., 1 day → 3 days → 1 week → 2 weeks)
   - Remove from current session
4. **If INCORRECT:**
   - Mark card as incorrect
   - Decrease interval to previous interval (e.g., if at 1 week, drop to 3 days)
   - Card reappears later in same session
   - User must answer correctly before session ends
5. **Session ends:** When all cards answered correctly at least once

#### Testing Logic
- Card must be correct on BOTH:
  - Character → Definition (English)
  - Character → Pinyin (Mandarin)
- If either is wrong, entire card is marked incorrect
- System randomly picks which arrow to test first

#### Card Availability Rule
**CRITICAL:** When a card is due in spaced repetition, it is NOT available in other study modes (self-study, multiple choice, flash mode, etc.). It is locked to spaced repetition only.

#### Introduction Phase
- Before a card enters spaced repetition for the first time
- Show the card with all sides visible (introduction screen)
- User can review character, pinyin, definition, stroke order
- Click "Start Learning" to add to SRS pool

---

### 2. Self-Study Mode

#### Overview
- Quiz-style practice for cards NOT currently due in spaced repetition
- Focus on definition and pinyin
- Characters reappear until answered correctly in session
- No effect on spaced repetition intervals

#### Card Selection
- Only cards that are NOT due in spaced repetition
- Prioritize cards not seen recently (longest time since last self-study)
- Include both characters and words

#### Study Session Flow
1. **Session starts:** Load available cards
2. **For each card:**
   - System picks random arrow (character → definition OR character → pinyin)
   - User types answer
   - System checks correctness
3. **If CORRECT:**
   - Mark as completed
   - Move to next card
4. **If INCORRECT:**
   - Show correct answer
   - Card re-enters queue
   - Will reappear later in same session
5. **Session ends:** When all cards answered correctly once

#### Tracking
- Track "last practiced" timestamp
- Track "times practiced" counter
- Does NOT affect spaced repetition scheduling

---

### 3. Multiple Choice Mode

#### Overview
- Quiz-style practice with 4 answer choices
- Tests definition and pinyin
- Uses Extended-Flashcards multiple choice logic

#### Card Selection
- Same as self-study: cards NOT due in spaced repetition
- Prioritize cards not recently practiced

#### Question Generation
1. System randomly picks an arrow to test
2. Generate 4 choices:
   - 1 correct answer
   - 3 incorrect answers (from other cards at similar frequency)
3. Randomize order

#### Arrow Types Tested
- Character → Definition
- Character → Pinyin
- Word → Definition
- Word → Pinyin

#### Study Session Flow
1. Show question with 4 choices
2. User selects answer
3. **If CORRECT:** Move to next question
4. **If INCORRECT:** Show correct answer, card re-enters queue
5. Repeat until all cards answered correctly

---

### 4. Flash Mode

#### Overview
- Traditional flashcard experience using Extended-Flashcards navigation
- User manually navigates between sides using arrows
- Cards NOT due in spaced repetition

#### Interaction
- Display card with visible arrows
- User clicks arrow labels to navigate between sides
- Self-paced learning (no correctness checking)
- User can freely explore all sides

#### Card Selection
- Same pool as self-study/multiple choice
- All cards not currently due in SRS

---

### 5. Listening Practice Mode (Phase 2)

#### Overview
- Separate study mode for pronunciation recognition
- User hears audio → identifies character/word
- Uses cards NOT due in spaced repetition

#### Study Session Flow
1. **System plays audio:** Character/word pronunciation (TTS)
2. **User options:**
   - Type the character/word
   - OR select from multiple choices (4 options)
3. **If INCORRECT:** 
   - Show correct answer
   - User can replay audio
   - Retry question immediately
4. **If CORRECT:** Move to next card
5. **Repeat button:** User can replay audio anytime

#### Audio Controls
- Play button (initial and replay)
- Adjustable speed (0.8x, 1.0x, 1.2x)

---

### 6. Speech Practice Mode (Phase 2)

#### Overview
- Pronunciation practice with speech recognition
- User sees character/word → speaks → system verifies

#### Study Session Flow
1. **Display character/word** with pinyin visible
2. **User clicks microphone button** and speaks
3. **System transcribes** speech using Web Speech API
4. **If CORRECT:** 
   - Show success feedback
   - Play correct pronunciation for comparison
   - Move to next card
5. **If INCORRECT:**
   - Show what was recognized
   - Play correct pronunciation
   - User retries immediately
6. **Retry until correct** before moving on

#### Features
- Visual feedback (waveform/mic active indicator)
- Play correct pronunciation button
- Retry button

---

### 7. Writing Practice Mode (Phase 2)

#### Overview
- Stroke order practice with drawing verification
- User draws character with mouse/touchpad
- Strict stroke order enforcement

#### Study Session Flow
1. **Display definition + pinyin** (character hidden)
2. **User draws character** stroke by stroke
3. **System verifies each stroke:**
   - Correct stroke order?
   - Correct stroke shape?
4. **Partial Credit System:**
   - If stroke is wrong: highlight error
   - Show correct stroke overlay
   - User retries FULL character (from beginning)
5. **If ALL STROKES CORRECT:**
   - Show success animation
   - Move to next card
6. **Retry until perfect** before moving on

#### Drawing Interface
- Canvas with grid guides
- Show stroke count (e.g., "Stroke 3/8")
- Undo last stroke button
- Clear/restart button
- Show stroke order animation (optional hint)

#### Verification Logic
- Must match stroke order exactly
- Must match stroke direction (top→bottom, left→right)
- Allow slight variation in stroke shape (tolerance ~10%)

---

## Database Schema

### Characters Table
```sql
CREATE TABLE characters (
  id INTEGER PRIMARY KEY,
  character TEXT UNIQUE NOT NULL,
  simplified TEXT NOT NULL,
  traditional TEXT,
  mandarin_pinyin TEXT NOT NULL,
  cantonese_jyutping TEXT,
  definition TEXT NOT NULL,
  frequency_rank INTEGER NOT NULL,
  stroke_count INTEGER,
  radical TEXT,
  decomposition TEXT,
  etymology TEXT,
  stroke_data_path TEXT,
  is_word BOOLEAN DEFAULT 0,
  component_characters TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_frequency ON characters(frequency_rank);
CREATE INDEX idx_is_word ON characters(is_word);
```

### User Progress Table (Spaced Repetition)
```sql
CREATE TABLE user_progress (
  id INTEGER PRIMARY KEY,
  character_id INTEGER NOT NULL,
  current_interval_days REAL DEFAULT 1.0,
  next_review_date TIMESTAMP NOT NULL,
  times_reviewed INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  has_reached_week BOOLEAN DEFAULT 0,
  last_reviewed TIMESTAMP,
  introduced BOOLEAN DEFAULT 0,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE INDEX idx_next_review ON user_progress(next_review_date);
CREATE INDEX idx_introduced ON user_progress(introduced);
```

### Practice History Table (Other Modes)
```sql
CREATE TABLE practice_history (
  id INTEGER PRIMARY KEY,
  character_id INTEGER NOT NULL,
  practice_mode TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  practiced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE INDEX idx_practice_mode ON practice_history(practice_mode, practiced_at);
```

### Study Sessions Table
```sql
CREATE TABLE study_sessions (
  id INTEGER PRIMARY KEY,
  mode TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  cards_studied INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  cards_incorrect INTEGER DEFAULT 0
);
```

---

## Spaced Repetition Algorithm

### Interval Calculation (Simplified SM-2)

#### Initial State
- New card: `interval = 1 day`
- `ease_factor = 2.5`

#### On Correct Answer
```
if current_interval < 1 day:
  new_interval = 1 day
else if current_interval < 3 days:
  new_interval = 3 days
else:
  new_interval = current_interval * ease_factor
  ease_factor = ease_factor (unchanged for correct)

next_review_date = today + new_interval
```

#### On Incorrect Answer
```
new_interval = max(previous_interval, 1 day)
ease_factor = max(ease_factor - 0.2, 1.3)
next_review_date = today + new_interval

# Card reappears in current session
```

#### Unlocking Logic
```
if new_interval >= 7 days AND has_reached_week == false:
  has_reached_week = true
  unlock_next_card()
```

### Example Timeline
```
Day 0: Learn card (introduction)
Day 1: Review → Correct → Next review: Day 4
Day 4: Review → Correct → Next review: Day 14
Day 14: Review → Correct → [NEW CARD UNLOCKS] → Next review: Day 49
Day 49: Review → Incorrect → Next review: Day 63 (back to Day 14 interval)
Day 63: Review → Correct → Next review: Day 98 [no new unlock, already triggered]
```

---

## User Interface Structure

### Main Navigation
```
┌─────────────────────────────────────┐
│  Chinese Learning Tool              │
├─────────────────────────────────────┤
│  Home                               │
│  > Spaced Repetition (12 due)      │
│  > Self-Study                       │
│  > Multiple Choice                  │
│  > Flash Mode                       │
│  > Listening Practice  [Phase 2]    │
│  > Speech Practice     [Phase 2]    │
│  > Writing Practice    [Phase 2]    │
│  ─────────────────────────────────  │
│  Progress                           │
│  Settings                           │
└─────────────────────────────────────┘
```

### Home Dashboard
- **Stats:**
  - Total cards learned: X
  - Cards in SRS pool: Y
  - Cards due today: Z
  - Study streak: N days
- **Quick Actions:**
  - Start SRS Session (if cards due)
  - Practice (if no cards due)
- **Progress Graph:**
  - Cards learned over time
  - Review performance trend

### Spaced Repetition Session Screen
```
┌─────────────────────────────────────────┐
│  Spaced Repetition                      │
│  Progress: 8/12 cards completed         │
├─────────────────────────────────────────┤
│                                         │
│           学                            │
│        (character displayed)             │
│                                         │
│  What is the definition?                │
│                                         │
│  [_________________________]            │
│       (text input)                      │
│                                         │
│  [Submit Answer]                        │
│                                         │
└─────────────────────────────────────────┘
```

### Introduction Screen (New Card)
```
┌─────────────────────────────────────────┐
│  New Character                          │
├─────────────────────────────────────────┤
│                                         │
│     Character:  学                      │
│     Pinyin:     xué                     │
│     Definition: to study, to learn      │
│     Strokes:    8                       │
│                                         │
│     [Show Stroke Order Animation]      │
│                                         │
│  Take a moment to learn this character  │
│                                         │
│  [Start Learning]                       │
│                                         │
└─────────────────────────────────────────┘
```

### Flash Mode (Extended-Flashcards Style)
```
┌─────────────────────────────────────────┐
│  Flash Mode                  [3/45]     │
├─────────────────────────────────────────┤
│                                         │
│           学                            │
│            ↓                            │
│        [english]                        │
│            ↓                            │
│      to study, learn                    │
│                                         │
│  ←[strokes]  ←[pinyin]                 │
│                                         │
│  [Previous] [Next] [Shuffle]            │
│                                         │
└─────────────────────────────────────────┘
```

### Writing Practice Screen
```
┌─────────────────────────────────────────┐
│  Writing Practice           [Stroke 3/8]│
├─────────────────────────────────────────┤
│                                         │
│  Definition: to study, learn            │
│  Pinyin: xué                            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │     [Drawing Canvas]            │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Undo] [Clear] [Show Hint]             │
│                                         │
└─────────────────────────────────────────┘
```

---

## Phase Implementation Plan

### Phase 1: Core Mandarin Learning (MVP)
**Timeline:** 4-6 weeks

**Features:**
- ✅ Database setup with CC-CEDICT + SUBTLEX-CH
- ✅ Spaced repetition mode (15 starting cards)
- ✅ Self-study mode
- ✅ Multiple choice mode
- ✅ Flash mode (Extended-Flashcards style)
- ✅ Basic progress tracking
- ✅ Character flashcards with arrows:
  - character → definition
  - character → pinyin

**Data Sources:**
- CC-CEDICT
- SUBTLEX-CH

**Deliverable:** Working SRS app with ~3000 characters, 4 study modes

---

### Phase 2: Enhanced Learning Features
**Timeline:** 3-4 weeks

**Features:**
- ✅ Make Me a Hanzi integration
- ✅ Stroke order animations (character → strokes arrow)
- ✅ Writing practice mode (drawing verification)
- ✅ Web Speech API integration
- ✅ Listening practice mode (TTS)
- ✅ Speech practice mode (STT)
- ✅ Multi-character words (word flashcards)
- ✅ Improved progress analytics

**Data Sources:**
- Make Me a Hanzi
- Web Speech API

**Deliverable:** Complete Mandarin learning tool with 7 study modes

---

### Phase 3: Cantonese Expansion
**Timeline:** 2-3 weeks

**Features:**
- ✅ CC-Canto integration
- ✅ Traditional character display
- ✅ Cantonese toggle mode
- ✅ Additional arrows:
  - character → traditional
  - traditional → simplified
  - traditional → cantonese
- ✅ Both Mandarin and Cantonese arrows visible
- ✅ Azure Speech Services migration (optional)
- ✅ Cantonese TTS/STT support

**Data Sources:**
- CC-Canto
- Azure Speech Services (optional)

**Deliverable:** Dual-dialect learning tool

---

### Phase 4: Advanced Features (Future)
**Timeline:** TBD

**Features:**
- ✅ Character flagging system
- ✅ Custom study lists
- ✅ Example sentences
- ✅ HSK level tracking
- ✅ Advanced statistics
- ✅ Import/export decks
- ✅ Integration with other study modes in SRS

---

## File Structure

```
Chinese-Learning-App/
├── src/                          # React frontend
│   ├── components/
│   │   ├── Flashcard/
│   │   │   ├── FlashcardView.tsx      # Extended-Flashcards style display
│   │   │   ├── ArrowNavigation.tsx    # Arrow-based navigation
│   │   │   └── StrokeOrder.tsx        # SVG stroke animation
│   │   ├── StudyModes/
│   │   │   ├── SpacedRepetition.tsx   # SRS mode
│   │   │   ├── SelfStudy.tsx          # Self-study quiz
│   │   │   ├── MultipleChoice.tsx     # Multiple choice quiz
│   │   │   ├── FlashMode.tsx          # Traditional flashcards
│   │   │   ├── ListeningPractice.tsx  # Audio recognition
│   │   │   ├── SpeechPractice.tsx     # Pronunciation practice
│   │   │   └── WritingPractice.tsx    # Drawing canvas
│   │   ├── Introduction/
│   │   │   └── CardIntroduction.tsx   # New card introduction
│   │   ├── Dashboard/
│   │   │   ├── Home.tsx               # Main dashboard
│   │   │   ├── Progress.tsx           # Stats and graphs
│   │   │   └── Settings.tsx           # App settings
│   │   └── Common/
│   │       ├── AudioPlayer.tsx        # TTS controls
│   │       ├── MicrophoneInput.tsx    # STT controls
│   │       └── DrawingCanvas.tsx      # Writing interface
│   ├── hooks/
│   │   ├── useSpeechAPI.ts            # Web Speech API wrapper
│   │   ├── useDatabase.ts             # Tauri database calls
│   │   ├── useSRS.ts                  # Spaced repetition logic
│   │   └── useFlashcard.ts            # Flashcard state management
│   ├── types/
│   │   ├── flashcard.ts               # Flashcard type definitions
│   │   ├── study-mode.ts              # Study mode types
│   │   └── progress.ts                # Progress tracking types
│   ├── utils/
│   │   ├── srs-algorithm.ts           # Interval calculations
│   │   ├── stroke-verification.ts     # Stroke order checking
│   │   └── audio-utils.ts             # Audio processing
│   ├── App.tsx
│   └── main.tsx
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs                    # Tauri setup
│   │   ├── database/
│   │   │   ├── mod.rs                 # Database module
│   │   │   ├── models.rs              # Data models
│   │   │   ├── queries.rs             # SQL queries
│   │   │   └── migrations.rs          # Schema migrations
│   │   ├── commands/
│   │   │   ├── mod.rs                 # Command module
│   │   │   ├── flashcard.rs           # Flashcard commands
│   │   │   ├── progress.rs            # Progress tracking
│   │   │   └── study_mode.rs          # Study mode logic
│   │   ├── parsers/
│   │   │   ├── cedict.rs              # CC-CEDICT parser
│   │   │   ├── subtlex.rs             # SUBTLEX-CH parser
│   │   │   └── hanzi.rs               # Make Me a Hanzi parser
│   │   └── utils/
│   │       └── srs.rs                 # SRS algorithm (Rust)
│   ├── resources/                     # Bundled data
│   │   ├── chinese.db                 # Pre-built SQLite database
│   │   └── stroke-svgs/               # Make Me a Hanzi SVGs
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── data-processing/              # One-time data setup
│   ├── src/
│   │   ├── download.rs                # Download datasets
│   │   ├── parse_cedict.rs            # Parse CC-CEDICT
│   │   ├── parse_subtlex.rs           # Parse SUBTLEX-CH
│   │   ├── parse_hanzi.rs             # Parse Make Me a Hanzi
│   │   └── build_database.rs          # Create SQLite DB
│   ├── Cargo.toml
│   └── README.md
│
├── datasets/                     # Downloaded data (gitignored)
│   ├── cedict_ts.u8
│   ├── SUBTLEX-CH-CHR/
│   ├── makemeahanzi/
│   └── cc-canto/
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Key Tauri Commands

### Flashcard Commands
```rust
#[tauri::command]
async fn get_flashcard(id: i32) -> Result<Flashcard, String>

#[tauri::command]
async fn get_due_cards() -> Result<Vec<Flashcard>, String>

#[tauri::command]
async fn get_available_for_practice(mode: String) -> Result<Vec<Flashcard>, String>

#[tauri::command]
async fn get_next_unlocked_card() -> Result<Option<Flashcard>, String>
```

### Progress Commands
```rust
#[tauri::command]
async fn record_answer(card_id: i32, correct: bool, mode: String) -> Result<(), String>

#[tauri::command]
async fn update_srs_interval(card_id: i32, correct: bool) -> Result<NextReview, String>

#[tauri::command]
async fn mark_card_introduced(card_id: i32) -> Result<(), String>

#[tauri::command]
async fn get_user_stats() -> Result<UserStats, String>
```

### Study Mode Commands
```rust
#[tauri::command]
async fn start_study_session(mode: String) -> Result<StudySession, String>

#[tauri::command]
async fn end_study_session(session_id: i32, stats: SessionStats) -> Result<(), String>

#[tauri::command]
async fn check_answer(card_id: i32, arrow: String, answer: String) -> Result<bool, String>
```

---

## Testing Requirements

### Unit Tests
- SRS algorithm correctness
- Interval calculations
- Card unlocking logic
- Answer verification

### Integration Tests
- Database queries
- Card selection logic
- Progress tracking
- Session management

### User Testing
- Complete one character through full SRS cycle
- Test all study modes
- Verify stroke order verification
- Test speech recognition accuracy

---

## Performance Requirements

- Database query response: < 50ms
- UI interactions: < 100ms
- Stroke rendering: 60 FPS
- Audio playback latency: < 200ms
- Speech recognition response: < 500ms

---

## Data Processing Pipeline

### One-Time Setup (Before First Run)

1. **Download Datasets**
   ```bash
   cargo run --bin download-datasets
   ```
   
   This script should:
   - Download CC-CEDICT from MDBG
   - Download SUBTLEX-CH from Ghent University
   - Clone Make Me a Hanzi repository
   - Download CC-Canto (Phase 3)
   - Extract compressed files
   - Verify checksums/integrity
   - Place all files in `datasets/` directory

2. **Parse and Normalize**
   ```bash
   cargo run --bin parse-all
   ```

3. **Build Database**
   ```bash
   cargo run --bin build-database
   ```

4. **Verify Data Integrity**
   ```bash
   cargo run --bin verify-database
   ```

### Output
- `chinese.db` - SQLite database (~300 MB)
- Ready to bundle with Tauri app

### Download Script Implementation
Create `data-processing/src/bin/download-datasets.rs`:

```rust
// Download CC-CEDICT
async fn download_cedict() -> Result<()> {
    let url = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz";
    let output = "datasets/cedict_ts.u8.gz";
    
    println!("Downloading CC-CEDICT...");
    download_file(url, output).await?;
    
    println!("Extracting...");
    decompress_gz(output, "datasets/cedict_ts.u8")?;
    
    Ok(())
}

// Similar functions for SUBTLEX-CH, Make Me a Hanzi, CC-Canto
```

**Important:** Add clear console output with attribution:
```
Downloading CC-CEDICT...
Source: https://www.mdbg.net/chinese/dictionary?page=cedict
License: CC BY-SA 4.0
Please review DATA-LICENSES.md for license terms
```

---

## Settings & Configuration

### User Settings
- **Audio:**
  - TTS speed (0.8x - 1.2x)
  - TTS voice selection
  - Auto-play audio on reveal
- **Display:**
  - Font size
  - Show/hide pinyin
  - Cantonese toggle (Phase 3)
- **Study:**
  - Daily review limit
  - Session timer
  - Auto-advance cards
- **Advanced:**
  - SRS algorithm parameters
  - Stroke verification tolerance

---

## Future Enhancements (Post-Phase 4)

### Potential Features
- Offline mode (all data bundled)
- Cloud sync across devices
- Community decks
- Sentence mining
- HSK exam preparation mode
- Character etymology exploration
- Handwriting input (alternative to drawing)
- Voice recording comparison
- Study reminders/notifications
- Mobile app (React Native)
- Web version (deploy Tauri app to web)

---

## Success Metrics

### Phase 1 Success Criteria
- User can learn first 15 characters
- SRS unlocking works correctly
- All 4 study modes functional
- Database queries performant

### Phase 2 Success Criteria
- Stroke order verification accurate (>90%)
- Speech recognition functional (>70% accuracy)
- All 7 study modes integrated
- User can complete full learning cycle

### Phase 3 Success Criteria
- Cantonese toggle working
- Traditional/simplified mapping correct
- Both dialects supported
- No performance degradation

---

## License & Attribution

### Required Citations
```
This application uses the following open source datasets:

CC-CEDICT © 2020 MDBG
Licensed under Creative Commons Attribution-ShareAlike 4.0
https://www.mdbg.net/chinese/dictionary?page=cc-cedict

SUBTLEX-CH:
Cai, Q., & Brysbaert, M. (2010). SUBTLEX-CH: Chinese Word and 
Character Frequencies Based on Film Subtitles. PLoS ONE, 5(6), e10729.

Make Me a Hanzi © 2016 Shaunak Kishore
Dictionary: Arphic Public License | Graphics: LGPL
https://github.com/skishore/makemeahanzi

CC-Canto © 2020
Licensed under Creative Commons Attribution-ShareAlike 4.0
https://cantonese.org/
```

---

## Development Timeline

### Month 1: Foundation
- Week 1-2: Database setup and data processing
- Week 3: Spaced repetition implementation
- Week 4: Self-study and multiple choice modes

### Month 2: Core Features
- Week 5: Flash mode integration
- Week 6: Progress tracking and UI polish
- Week 7: Testing and bug fixes
- Week 8: Phase 1 release

### Month 3: Enhanced Features
- Week 9-10: Stroke order integration
- Week 11: Writing practice mode
- Week 12: Speech API integration

### Month 4: Speech Features
- Week 13: Listening practice mode
- Week 14: Speech practice mode
- Week 15: Testing and refinement
- Week 16: Phase 2 release

### Month 5: Cantonese
- Week 17-18: CC-Canto integration
- Week 19: Cantonese UI implementation
- Week 20: Testing and Phase 3 release

---

## Questions for Ongoing Development

### To Be Determined During Development

1. **SRS Fine-Tuning**
   - Should ease factor adjustments be more aggressive?
   - What's the optimal starting interval?
   - Should there be a "leeches" system for repeatedly failed cards?

2. **UI/UX Decisions**
   - Keyboard shortcuts for all actions?
   - Dark mode support?
   - Accessibility features (screen reader, high contrast)?

3. **Gamification**
   - Achievement system?
   - Study streaks with rewards?
   - Progress milestones?

4. **Data Management**
   - Export study history?
   - Backup/restore functionality?
   - Reset progress option?

---

## Edge Cases & Error Handling

### Card State Edge Cases

**Case 1: All cards due on same day**
- Solution: Process in frequency order (most common first)
- Show batch count in UI

**Case 2: No cards available for practice mode**
- Solution: Show message "All cards are in spaced repetition. Come back after reviews!"
- Offer to jump to SRS mode

**Case 3: User gets same card wrong 10+ times in session**
- Solution: Mark as "difficult", suggest reviewing introduction
- Allow "skip for now" option

**Case 4: New card unlocking during active session**
- Solution: Don't interrupt session, show notification after completion
- New card available in next session

### Speech Recognition Edge Cases

**Case 1: Microphone not available**
- Solution: Show error, fall back to typing mode
- Offer to configure microphone in settings

**Case 2: Speech recognition not supported (browser)**
- Solution: Detect on app start, disable speech modes gracefully
- Show message recommending Chrome/Edge

**Case 3: Background noise interferes**
- Solution: Show confidence score, allow manual retry
- Setting to adjust recognition sensitivity

### Stroke Order Edge Cases

**Case 1: User draws too fast**
- Solution: Verify completed strokes, not intermediate points
- Allow undo of last stroke

**Case 2: Stroke shape close but not exact**
- Solution: Use tolerance threshold (10% deviation)
- Partial credit: show hint overlay

**Case 3: Touchpad vs. mouse precision**
- Solution: Adaptive tolerance based on input device
- Option to increase tolerance in settings

---

## Data Update Strategy

### Updating Datasets

**CC-CEDICT Updates:**
- Check for new version quarterly
- Script to download latest release
- Compare with existing data
- Merge new entries without affecting user progress

**SUBTLEX-CH Updates:**
- Infrequent (dataset is stable)
- Manual review if new version released

**Make Me a Hanzi Updates:**
- Check GitHub for new characters
- Integrate if significant additions

### Database Migration Strategy
```rust
// Version tracking in database
CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Migration functions
fn migrate_v1_to_v2() { ... }
fn migrate_v2_to_v3() { ... }
```

---

## Performance Optimization

### Database Optimization
- Index frequently queried columns (frequency_rank, next_review_date)
- Use prepared statements for repeated queries
- Cache frequently accessed cards in memory
- Lazy load stroke SVGs (don't load until needed)

### UI Optimization
- Virtual scrolling for large card lists
- Lazy load images and SVGs
- Debounce text input in quiz modes
- Preload next card while user reviews current

### Audio Optimization
- Cache TTS audio for common characters
- Preload audio for next card in queue
- Use audio sprites for fast playback

---

## Security & Privacy

### Data Storage
- All data stored locally (no cloud by default)
- SQLite database in user's app data directory
- No telemetry or analytics without consent

### API Keys (Phase 2+, Azure)
- Store Azure keys securely in Rust backend
- Never expose keys to frontend
- Use environment variables for development
- Encrypt keys in production build

### User Privacy
- No personal information collected
- Study statistics stored locally only
- Optional: cloud sync with user consent

---

## Internationalization (i18n)

### UI Languages
- English (default)
- Simplified Chinese (future)
- Traditional Chinese (future)

### Translation Strategy
```typescript
// Use i18next or similar
const translations = {
  en: {
    studyModes: {
      spacedRepetition: "Spaced Repetition",
      selfStudy: "Self-Study",
      // ...
    }
  },
  zh_CN: {
    studyModes: {
      spacedRepetition: "间隔重复",
      selfStudy: "自学",
      // ...
    }
  }
};
```

---

## Accessibility Requirements

### Keyboard Navigation
- Tab through all interactive elements
- Enter to submit answers
- Arrow keys for navigation
- Escape to cancel/go back

### Screen Reader Support
- ARIA labels on all interactive elements
- Announce card changes
- Announce answer correctness
- Describe stroke animations

### Visual Accessibility
- High contrast mode
- Adjustable font sizes
- Color-blind friendly colors
- No color-only indicators

### Audio Accessibility
- Visual feedback for audio cues
- Subtitles/captions option
- Adjustable audio volume

---

## Testing Strategy

### Automated Testing

**Unit Tests:**
```rust
#[test]
fn test_srs_interval_calculation() {
    let interval = calculate_next_interval(1.0, 2.5, true);
    assert_eq!(interval, 3.0);
}

#[test]
fn test_card_unlocking_logic() {
    // Test that card unlocks at 1 week, but only once
}

#[test]
fn test_answer_verification() {
    // Test various answer formats (spacing, case, etc.)
}
```

**Integration Tests:**
```typescript
describe('Spaced Repetition Flow', () => {
  it('should show introduction for new card', async () => {
    // Test introduction screen appears
  });
  
  it('should unlock new card after existing card reaches 1 week', async () => {
    // Simulate card progression
  });
  
  it('should not allow incorrect card to complete session', async () => {
    // Test card cycling behavior
  });
});
```

### Manual Testing Checklist

**Phase 1:**
- [ ] Create fresh database
- [ ] Complete introduction for first card
- [ ] Answer card correctly in SRS
- [ ] Answer card incorrectly, verify it reappears
- [ ] Complete full SRS session
- [ ] Verify interval increases correctly
- [ ] Test self-study mode
- [ ] Test multiple choice mode
- [ ] Test flash mode
- [ ] Verify card availability rules (SRS vs. other modes)

**Phase 2:**
- [ ] View stroke order animation
- [ ] Draw character correctly
- [ ] Draw character incorrectly, verify partial credit
- [ ] Test listening practice with TTS
- [ ] Test speech recognition accuracy
- [ ] Test all 7 study modes together

**Phase 3:**
- [ ] Toggle Cantonese mode
- [ ] Verify both Mandarin and Cantonese arrows appear
- [ ] Test traditional/simplified navigation
- [ ] Verify Cantonese pronunciation

---

## Documentation Requirements

### User Documentation
- **Quick Start Guide**: First 5 minutes with app
- **Study Mode Guide**: How each mode works
- **FAQ**: Common questions and troubleshooting
- **Keyboard Shortcuts**: Complete list

### Developer Documentation
- **Architecture Overview**: System design
- **Database Schema**: Complete table documentation
- **API Reference**: All Tauri commands
- **Data Processing**: How to rebuild database
- **Contributing Guide**: For future contributors

### Code Documentation
- Rust: Comprehensive rustdoc comments
- TypeScript: JSDoc comments for public APIs
- Component props documentation
- Complex algorithm explanations

---

## Deployment & Distribution

### Build Process
```bash
# Development build
npm run tauri:dev

# Production build
npm run tauri:build

# Output locations:
# Windows: src-tauri/target/release/bundle/msi/
# macOS: src-tauri/target/release/bundle/dmg/
# Linux: src-tauri/target/release/bundle/appimage/
```

### Release Strategy
- Semantic versioning (v1.0.0, v1.1.0, etc.)
- Changelog for each release
- GitHub releases with binaries
- Auto-update support (Tauri feature)

### Platform-Specific Considerations

**Windows:**
- Install prerequisites (WebView2)
- Code signing (optional, for trusted installs)
- System tray integration

**macOS:**
- Code signing required for distribution
- Notarization for Gatekeeper
- Menu bar integration

**Linux:**
- AppImage for universal compatibility
- .deb/.rpm for specific distros
- Desktop file for menu integration

---

## Monitoring & Analytics (Optional)

### Metrics to Track (Opt-in)
- Study session duration
- Cards studied per session
- Success rates by study mode
- Most difficult characters
- Learning progress over time

### Privacy-First Analytics
- All metrics stored locally
- Optional export for user review
- No third-party tracking
- User can view/delete all data

---

## Backup & Recovery

### User Data Backup
```typescript
// Export study progress
export_progress() {
  // Creates JSON file with:
  // - All user_progress records
  // - practice_history
  // - study_sessions
  // - User settings
}

// Import study progress
import_progress(file: File) {
  // Validates file structure
  // Merges with existing data
  // Resolves conflicts (take newer timestamps)
}
```

### Database Corruption Recovery
- Validate database integrity on startup
- Keep last 3 backup copies
- Auto-backup before major operations
- Recovery mode to rebuild from backups

---

## Known Limitations

### Phase 1 Limitations
- Mandarin only (no Cantonese)
- No stroke order
- Basic progress tracking
- Web Speech API quality varies by OS

### Phase 2 Limitations
- Stroke verification not perfect (tolerance-based)
- Speech recognition accuracy depends on user's pronunciation
- No offline speech features (requires internet)

### Phase 3 Limitations
- Both Mandarin and Cantonese always visible (no pure Cantonese mode)
- Cantonese TTS/STT requires Azure (not free)

### Technical Limitations
- Single-user only (no multi-profile support)
- Desktop only (no mobile app)
- No cloud sync (local only)
- English UI only (no localization)

---

## Troubleshooting Guide

### Common Issues

**Issue: Audio not playing**
- Check system audio settings
- Verify Web Speech API support
- Try different browser (Chrome recommended)

**Issue: Microphone not working**
- Grant microphone permissions
- Check browser settings
- Verify HTTPS/secure context

**Issue: Stroke drawing not recognized**
- Increase tolerance in settings
- Draw slower and more deliberately
- Check stroke count matches expected

**Issue: Cards not unlocking**
- Verify existing cards reach 1+ week interval
- Check has_reached_week flag in database
- Review SRS algorithm logs

**Issue: Database errors**
- Check database file permissions
- Verify database not corrupted
- Run integrity check
- Restore from backup

---

## Success Criteria (Summary)

### Must Have (Phase 1)
✅ 15 starting cards with frequency-based unlock system  
✅ Spaced repetition with automatic correctness checking  
✅ 4 study modes (SRS, self-study, multiple choice, flash)  
✅ Cards locked to SRS when due  
✅ Character flashcards with definition and pinyin  
✅ Introduction screen for new cards  

### Should Have (Phase 2)
✅ Stroke order animations and writing practice  
✅ Speech recognition for pronunciation practice  
✅ Listening practice with TTS  
✅ Multi-character word support  
✅ 7 total study modes  

### Could Have (Phase 3)
✅ Traditional Chinese characters  
✅ Cantonese pronunciation  
✅ Toggle between dialects  
✅ Azure Speech Services migration  

### Won't Have (Initial Release)
❌ Cloud sync  
❌ Mobile app  
❌ Multi-user profiles  
❌ Community features  
❌ Sentence mining  

---

## Appendix A: Data File Formats

### CC-CEDICT Format
```
# CC-CEDICT
# Community maintained free Chinese-English dictionary.
#
# Published: 2025-10-08
# Entries: 123,994

Traditional Simplified [pin1 yin1] /definition 1/definition 2/classifier info/
一 一 [yi1] /one/1/single/a (article)/as soon as/entire/whole/all/throughout/"one" radical in Chinese characters (Kangxi radical 1)/also pr.[yao1] for greater clarity when spelling out numbers digit by digit/
...
```

### SUBTLEX-CH Format
```
Word,Count,SUBTLWF,Lg10WF,SUBTLCD,Lg10CD,Dom_PoS
的,1234567,12345.67,4.09,8765,3.94,u
一,987654,9876.54,3.99,7654,3.88,m
...
```

### Make Me a Hanzi Format
```json
{"character":"一","definition":"one; a, an; alone","pinyin":["yī"],"decomposition":"⿻一丨","etymology":{"type":"ideographic","hint":"A single line"},"radical":"一","matches":[[0],[1]],"strokes":["M 150 600 Q 250 600 ..."],"medians":[[[150,600],[850,600]]]}
```

---

## Appendix B: Database Queries

### Common Queries

**Get cards due for SRS:**
```sql
SELECT c.* FROM characters c
JOIN user_progress p ON c.id = p.character_id
WHERE p.next_review_date <= CURRENT_TIMESTAMP
  AND p.introduced = 1
ORDER BY p.next_review_date ASC;
```

**Get cards available for practice (not due in SRS):**
```sql
SELECT c.* FROM characters c
JOIN user_progress p ON c.id = p.character_id
WHERE (p.next_review_date > CURRENT_TIMESTAMP OR p.next_review_date IS NULL)
  AND p.introduced = 1
ORDER BY p.last_reviewed ASC NULLS FIRST;
```

**Get next card to unlock:**
```sql
SELECT c.* FROM characters c
LEFT JOIN user_progress p ON c.id = p.character_id
WHERE p.id IS NULL
ORDER BY c.frequency_rank ASC
LIMIT 1;
```

**Check if new card should unlock:**
```sql
SELECT COUNT(*) FROM user_progress
WHERE has_reached_week = 1;

-- If count >= number of cards that should have unlocked new ones,
-- then unlock next card
```

---

## Appendix C: Example User Journey

### Week 1: New User Experience

**Day 1:**
1. Launch app
2. See welcome screen
3. Click "Start Learning"
4. Introduction to first character: 的 (de)
5. Study 15 initial characters (with introductions)
6. Complete first SRS session
7. All 15 cards due tomorrow

**Day 2:**
1. 15 cards due in SRS
2. Complete SRS session (some correct, some incorrect)
3. Correct cards → 3-day interval
4. Incorrect cards → 1-day interval (tomorrow)
5. Try self-study mode (no new cards available yet)

**Day 3:**
1. Incorrect cards from Day 2 due in SRS
2. Complete SRS session
3. Practice with flash mode
4. Try multiple choice mode

**Day 5:**
1. Cards from Day 2 (correct answers) now due
2. Complete SRS session
3. Some advance to 1-week interval
4. Explore stroke order animations

**Day 14:**
1. First card reaches 1-week interval!
2. Complete review successfully
3. 🎉 New card unlocks! (16th character)
4. Introduction to new character
5. Pool now has 16 cards

**Week 2+:**
- Continue daily reviews
- New cards unlock as more reach 1-week
- Pool grows: 16 → 17 → 18 → ...
- User settles into routine
- Try new study modes (writing, speech, listening)

---

## Appendix D: SRS Algorithm Pseudocode

```rust
fn calculate_next_interval(
    current_interval: f32,
    ease_factor: f32,
    correct: bool,
    previous_interval: f32,
) -> (f32, f32) {
    if correct {
        let new_interval = if current_interval < 1.0 {
            1.0
        } else if current_interval < 3.0 {
            3.0
        } else if current_interval < 7.0 {
            7.0
        } else {
            current_interval * ease_factor
        };
        (new_interval, ease_factor)
    } else {
        let new_interval = previous_interval.max(1.0);
        let new_ease = (ease_factor - 0.2).max(1.3);
        (new_interval, new_ease)
    }
}

fn should_unlock_new_card(card: &Card, progress: &Progress) -> bool {
    progress.current_interval >= 7.0 && !progress.has_reached_week
}

fn mark_week_reached(progress: &mut Progress) {
    progress.has_reached_week = true;
    unlock_next_card_by_frequency();
}
```

---

*End of Specifications Document*

---

## Document Revision History

- **v1.0** (2025-10-16): Initial comprehensive specifications
- Based on Extended-Flashcards architecture
- Designed for Tauri + React + TypeScript + Rust stack
- Incorporates CC-CEDICT, SUBTLEX-CH, Make Me a Hanzi, CC-Canto
- 7 study modes planned across 3 development phases