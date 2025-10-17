**Version:** 1.0.0  
**Status:** Production Ready  
**License:** MIT (code) + Open data licenses (see DATA-LICENSES.md)

---

## EditHistory.md Logging Guidelines

**Purpose:** EditHistory.md serves as a comprehensive development journal tracking all major decisions, bugs, and solutions.

### When to Log

**Log After:**
- Completing each task
- Making significant technical decisions
- Encountering and solving bugs
- Discovering important learnings
- Making architectural changes
- Completing integration testing
- Phase completion gates

### Entry Template

```markdown
## [YYYY-MM-DD] - [Task Number] - [Brief Title]

**Task:** [Full task number and name]

**Status:** [Complete / In Progress / Blocked]

**Objective:** 
[What you were trying to accomplish]

**Decisions Made:**
- [Key technical or design decision 1]
- [Key technical or design decision 2]
- [Rationale for each decision]

**Issues Encountered:**
- [Bug 1: Description]
- [Bug 2: Description]
- [Challenge 1: Description]

**Solutions Applied:**
- [How Bug 1 was resolved]
- [How Bug 2 was resolved]
- [Alternative approaches considered]

**Code Changes:**
- [Files created]
- [Files modified]
- [Key functions/components added]
- [Dependencies added]

**Testing Results:**
- [Pass/Fail for each acceptance criterion]
- [What was tested]
- [Edge cases discovered]

**Notes for Future:**
- [Lessons learned]
- [Technical debt incurred]
- [Areas for improvement]
- [Things to remember for similar tasks]

**Time Spent:** [Optional: Hours or days invested]

**Next Steps:**
[What task comes next]
```

### Example Entry

```markdown
## [2025-10-20] - 1.2 - CC-CEDICT Parser Implementation

**Task:** 1.2 - Data Processing - CC-CEDICT Parser

**Status:** Complete

**Objective:** 
Create a Rust parser to convert CC-CEDICT text format into structured data for database insertion.

**Decisions Made:**
- Used regex-free parsing (split/find) instead of regex for better performance
- Decided to separate characters from words using char count (>1 = word)
- Stored multiple definitions as Vec<String> for flexibility
- Used Option types for optional fields (traditional characters)

**Issues Encountered:**
- Some lines had irregular spacing between fields
- Classifier information (CL:) embedded in definitions caused confusion
- A few lines had malformed pinyin (missing closing bracket)

**Solutions Applied:**
- Added robust whitespace trimming and normalization
- Decided to keep classifier info in definitions (can parse later if needed)
- Added error handling to skip malformed lines (logged as warnings)
- Validated parser output with manual inspection of first 100 entries

**Code Changes:**
- Created data-processing/src/parsers/cedict.rs
- Implemented CedictEntry struct with all fields
- Added parse_cedict_file function (reads entire file)
- Added parse_cedict_line function (parses single line)
- Added 3 comprehensive unit tests
- Created test_parser binary for manual verification

**Testing Results:**
- Pass: All unit tests passed
- Pass: Parsed 123,524 entries from full CC-CEDICT file
- Pass: Correctly identified 15,432 characters and 108,092 words
- Pass: No panics or crashes
- Warning: 47 lines could not be parsed (logged to console)

**Notes for Future:**
- Parser is flexible enough to handle minor format variations
- May need to revisit classifier parsing if users want that data separately
- Consider adding caching for large files (though 120k entries load in <1 second)
- The 47 unparseable lines were mostly comments or special entries, acceptable loss

**Time Spent:** 4 hours (including testing and debugging)

**Next Steps:** 
Parse SUBTLEX-CH frequency data (Task 1.3)
```

### Best Practices

**Do:**
- ✅ Log immediately after completing task
- ✅ Be specific about bugs and solutions
- ✅ Include code file paths
- ✅ Note time spent (helps estimate future tasks# Chinese Learning Tool - Development Plan

## Document Purpose

This document provides a comprehensive, task-based development plan for building the Chinese Learning Tool. It includes:

- Detailed task breakdown for all development phases
- Specific deliverables and success criteria for each task
- Technical requirements and acceptance criteria
- Risk mitigation strategies
- Quality gates between phases
- EditHistory.md logging guidelines

**Development Approach:**
- Task-based progression (no deadlines)
- Vertical slicing (complete features before moving to next)
- Professional quality from the start
- Clean architecture with comprehensive logging
- Cross-platform compatibility (Windows primary, Mac/Linux compatible)

**Developer Profile:**
- Very experienced: SQL, JavaScript, C++
- Beginner: Rust, React, TypeScript, Tauri
- Development Environment: Windows
- Assistant: Claude Code

---

## Table of Contents

1. [Development Environment Setup](#phase-0-development-environment-setup)
2. [Phase 1: Core Mandarin Learning (MVP)](#phase-1-core-mandarin-learning-mvp)
3. [Phase 2: Enhanced Learning Features](#phase-2-enhanced-learning-features)
4. [Phase 3: Cantonese Expansion](#phase-3-cantonese-expansion)
5. [EditHistory.md Guidelines](#edithistorymd-logging-guidelines)
6. [Quality Gates & Phase Transitions](#quality-gates--phase-transitions)
7. [Risk Management](#risk-management-strategies)
8. [Resources & Learning](#resources--learning-materials)

---

## Phase 0: Development Environment Setup

**Goal:** Establish a complete, verified development environment ready for Chinese Learning Tool development.

**Prerequisites:** Rust, Node.js, Tauri CLI available from Extended-Flashcards project.

### Task 0.1: Verify Development Environment

**Deliverable:** Confirmed working development environment with all tools at correct versions.

**Steps:**
1. Verify Node.js installation
   ```bash
   node --version  # Should be v18+
   npm --version
   ```

2. Verify Rust installation
   ```bash
   rustc --version  # Should be latest stable
   cargo --version
   ```

3. Verify Tauri CLI
   ```bash
   cargo tauri --version  # Should be latest
   ```

4. Test basic Tauri build (using Extended-Flashcards)
   ```bash
   cd Extended-Flashcards
   npm install
   npm run tauri:dev
   ```

**Success Criteria:**
- ✅ Node.js v18+ installed and working
- ✅ Rust stable toolchain installed and working
- ✅ Tauri CLI installed and working
- ✅ Extended-Flashcards builds and runs successfully
- ✅ Hot reload works in dev mode
- ✅ No build errors or warnings

**Acceptance Test:**
- Extended-Flashcards app launches
- Can create a basic flashcard
- Frontend changes hot-reload
- Rust backend compiles without errors

**EditHistory.md Entry Template:**
```
## [Date] - Environment Setup Verification
**Task:** 0.1 - Verify Development Environment
**Status:** Complete/Blocked
**Tool Versions:**
- Node: X.X.X
- Rust: X.X.X
- Tauri: X.X.X
**Issues Found:** [None / List issues]
**Solutions Applied:** [N/A / Solutions]
**Next Steps:** Proceed to Task 0.2
```

---

### Task 0.2: Install Additional Dependencies

**Deliverable:** All project-specific dependencies installed and verified.

**Steps:**
1. Install SQLite development libraries (for Rust)
   ```bash
   # Windows (if needed)
   # Usually included with Rust, but verify with test build
   ```

2. Install Rust dependencies for data processing
   ```bash
   cargo install csv
   cargo install serde
   cargo install tokio
   ```

3. Set up VS Code (or preferred IDE) with extensions:
   - rust-analyzer (Rust language support)
   - Tauri (Tauri development tools)
   - ESLint (TypeScript linting)
   - Prettier (Code formatting)

4. Configure code formatting
   - Create `.editorconfig`
   - Set up Prettier config
   - Set up rustfmt config

**Success Criteria:**
- ✅ All Rust crates install successfully
- ✅ IDE extensions installed and working
- ✅ Code formatting works (Ctrl+Shift+F)
- ✅ Rust analyzer provides autocomplete
- ✅ No extension conflicts or errors

**Acceptance Test:**
- Create a test Rust file, verify rust-analyzer works
- Create a test TypeScript file, verify ESLint works
- Format code with Prettier, verify consistent formatting

**Risk Mitigation:**
- **Risk:** SQLite dependencies missing on Windows
- **Mitigation:** Document specific Windows installation steps if issues arise

---

### Task 0.3: Create Project Repository Structure

**Deliverable:** Clean repository initialized from Extended-Flashcards with Chinese Learning Tool structure.

**Steps:**
1. Create new repository
   ```bash
   mkdir Chinese-Learning-Tool
   cd Chinese-Learning-Tool
   git init
   ```

2. Copy Extended-Flashcards base structure
   ```bash
   # Copy core files
   cp -r ../Extended-Flashcards/src ./src
   cp -r ../Extended-Flashcards/src-tauri ./src-tauri
   cp ../Extended-Flashcards/package.json ./
   cp ../Extended-Flashcards/vite.config.ts ./
   cp ../Extended-Flashcards/tsconfig.json ./
   ```

3. Create additional directories
   ```bash
   mkdir data-processing
   mkdir datasets
   mkdir LICENSES
   mkdir docs
   ```

4. Create required license and documentation files
   - Copy LICENSE.md (from artifacts)
   - Copy CREDITS.md (from artifacts)
   - Copy DATA-LICENSES.md (from artifacts)
   - Create EditHistory.md (see template below)
   - Copy DEVELOPMENT_PLAN.md (this document)
   - Copy specifications document

5. Update package.json
   - Change project name to "chinese-learning-tool"
   - Update description
   - Update version to 0.1.0

6. Create .gitignore
   ```gitignore
   # Dependencies
   node_modules/
   
   # Build outputs
   dist/
   src-tauri/target/
   
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
   
   # IDE
   .vscode/
   .idea/
   *.swp
   *.swo
   
   # OS
   .DS_Store
   Thumbs.db
   
   # Logs
   *.log
   ```

7. Create EditHistory.md template
   ```markdown
   # Development History Log
   
   ## Purpose
   This file tracks all major development decisions, bugs encountered, and solutions applied during the development of the Chinese Learning Tool.
   
   ## Entry Template
   ```
   ## [Date] - [Task Number] - [Brief Description]
   **Task:** [Task Number and Name]
   **Status:** [Complete/In Progress/Blocked]
   **Objective:** [What was trying to be accomplished]
   **Decisions Made:** [Key technical or design decisions]
   **Issues Encountered:** [Bugs, blockers, challenges]
   **Solutions Applied:** [How issues were resolved]
   **Code Changes:** [Files modified, key changes]
   **Testing Results:** [Pass/Fail, what was tested]
   **Notes for Future:** [Lessons learned, future considerations]
   **Time Spent:** [Optional: Hours/days on this task]
   **Next Steps:** [What comes next]
   ```
   
   ---
   
   ## Development Log Entries
   
   [Entries will be added here as development progresses]
   ```

8. Initialize git and make first commit
   ```bash
   git add .
   git commit -m "Initial project setup from Extended-Flashcards base"
   ```

**Success Criteria:**
- ✅ Repository created with clean structure
- ✅ All required directories present
- ✅ All license files in place
- ✅ .gitignore configured correctly
- ✅ EditHistory.md template ready
- ✅ Initial commit made
- ✅ No Extended-Flashcards specific code remaining

**Acceptance Test:**
- Run `npm install` - should complete without errors
- Run `npm run tauri:dev` - app should launch (even if empty)
- Verify datasets/ is gitignored
- All license files readable

**EditHistory.md Entry:**
```
## [Date] - 0.3 - Repository Initialization
**Task:** 0.3 - Create Project Repository Structure
**Status:** Complete
**Objective:** Set up clean repository structure based on Extended-Flashcards
**Decisions Made:**
- Used Extended-Flashcards as base to save setup time
- Created separate data-processing directory for build scripts
- Excluded datasets from git for licensing compliance
**Issues Encountered:** None
**Solutions Applied:** N/A
**Code Changes:**
- Copied base structure from Extended-Flashcards
- Created additional directories for Chinese learning features
- Set up .gitignore to exclude datasets
**Testing Results:** Pass - npm install and tauri:dev work
**Notes for Future:** Keep EditHistory.md updated after every task
**Next Steps:** Download license texts (Task 0.4)
```

---

### Task 0.4: Set Up License Compliance

**Deliverable:** Complete license compliance with all required files in place.

**Steps:**
1. Download license texts to LICENSES/ directory
   - CC-BY-SA-4.0.txt from https://creativecommons.org/licenses/by-sa/4.0/legalcode.txt
   - Arphic-Public-License.txt from https://github.com/skishore/makemeahanzi/blob/master/COPYING
   - LGPL-2.1.txt from https://www.gnu.org/licenses/old-licenses/lgpl-2.1.txt

2. Create LICENSES/SUBTLEX-CH-Citation.txt
   ```
   SUBTLEX-CH: Chinese Word and Character Frequencies
   
   License: Free for research and educational purposes
   
   Required Citation:
   Cai, Q., & Brysbaert, M. (2010). SUBTLEX-CH: Chinese Word and Character 
   Frequencies Based on Film Subtitles. PLoS ONE, 5(6), e10729.
   https://doi.org/10.1371/journal.pone.0010729
   
   For commercial use, contact the authors at Ghent University.
   ```

3. Update README.md with data sources section (from specifications)

4. Verify all license files are readable and complete

5. Commit license files
   ```bash
   git add LICENSES/ LICENSE.md DATA-LICENSES.md CREDITS.md README.md
   git commit -m "Add license compliance files"
   ```

**Success Criteria:**
- ✅ All 4 license texts in LICENSES/ directory
- ✅ LICENSE.md present with MIT license
- ✅ DATA-LICENSES.md present with detailed attributions
- ✅ CREDITS.md present with acknowledgments
- ✅ README.md includes data sources section
- ✅ All files committed to git

**Acceptance Test:**
- Open each file and verify readable
- Check that all URLs in license files are valid
- Verify README.md renders correctly on GitHub

**Risk Mitigation:**
- **Risk:** License URLs become invalid
- **Mitigation:** Store full license texts locally (already doing this)

---

### Task 0.5: Database Schema Design

**Deliverable:** Complete SQL schema for all phases (1-3), ready for implementation.

**Steps:**
1. Review specifications document database schema section

2. Create `src-tauri/src/database/schema.sql` with complete schema:
   ```sql
   -- Characters and Words Table
   CREATE TABLE IF NOT EXISTS characters (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
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
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX idx_frequency ON characters(frequency_rank);
   CREATE INDEX idx_is_word ON characters(is_word);
   CREATE INDEX idx_character ON characters(character);

   -- User Progress (Spaced Repetition)
   CREATE TABLE IF NOT EXISTS user_progress (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     character_id INTEGER NOT NULL,
     current_interval_days REAL DEFAULT 1.0,
     previous_interval_days REAL DEFAULT 1.0,
     next_review_date TIMESTAMP NOT NULL,
     times_reviewed INTEGER DEFAULT 0,
     times_correct INTEGER DEFAULT 0,
     times_incorrect INTEGER DEFAULT 0,
     ease_factor REAL DEFAULT 2.5,
     has_reached_week BOOLEAN DEFAULT 0,
     last_reviewed TIMESTAMP,
     introduced BOOLEAN DEFAULT 0,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
   );

   CREATE INDEX idx_next_review ON user_progress(next_review_date);
   CREATE INDEX idx_introduced ON user_progress(introduced);
   CREATE INDEX idx_character_progress ON user_progress(character_id);

   -- Practice History (Other Modes)
   CREATE TABLE IF NOT EXISTS practice_history (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     character_id INTEGER NOT NULL,
     practice_mode TEXT NOT NULL,
     arrow_tested TEXT,
     user_answer TEXT,
     is_correct BOOLEAN NOT NULL,
     practiced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
   );

   CREATE INDEX idx_practice_mode ON practice_history(practice_mode, practiced_at);
   CREATE INDEX idx_character_practice ON practice_history(character_id);

   -- Study Sessions
   CREATE TABLE IF NOT EXISTS study_sessions (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     mode TEXT NOT NULL,
     started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     ended_at TIMESTAMP,
     cards_studied INTEGER DEFAULT 0,
     cards_correct INTEGER DEFAULT 0,
     cards_incorrect INTEGER DEFAULT 0,
     duration_seconds INTEGER
   );

   CREATE INDEX idx_session_mode ON study_sessions(mode, started_at);

   -- App Settings
   CREATE TABLE IF NOT EXISTS app_settings (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Schema Version Tracking
   CREATE TABLE IF NOT EXISTS schema_version (
     version INTEGER PRIMARY KEY,
     applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     description TEXT
   );

   INSERT INTO schema_version (version, description) VALUES (1, 'Initial schema');
   ```

3. Document schema design decisions in EditHistory.md:
   - Why certain indexes were chosen
   - Rationale for previous_interval_days field
   - Foreign key constraints and CASCADE behavior

4. Create schema diagram (can be text-based)
   ```
   characters (1) ----< (many) user_progress
   characters (1) ----< (many) practice_history
   ```

5. Review schema with SQL expertise:
   - All necessary indexes present?
   - Appropriate data types?
   - Missing any constraints?

**Success Criteria:**
- ✅ Complete schema covering all 3 phases
- ✅ Appropriate indexes for query performance
- ✅ Foreign key constraints with CASCADE deletes
- ✅ Schema versioning table included
- ✅ No obvious normalization issues
- ✅ Schema documented in EditHistory.md

**Acceptance Test:**
- Load schema.sql into SQLite browser - should execute without errors
- Verify all tables created
- Verify all indexes created
- Check foreign key relationships

**Risk Mitigation:**
- **Risk:** Schema changes needed during development
- **Mitigation:** Use migrations system (schema_version table) to track changes

---

### Phase 0 Completion Gate

**Phase 0 Complete When:**
- ✅ All Task 0.1-0.5 success criteria met
- ✅ Development environment fully functional
- ✅ Repository properly structured
- ✅ License compliance complete
- ✅ Database schema designed and validated
- ✅ EditHistory.md has entries for all tasks

**Acceptance Criteria:**
1. Can build and run Extended-Flashcards base successfully
2. All tools and dependencies installed
3. Repository has clean structure with all required files
4. All license files in place and correct
5. Database schema ready for implementation
6. EditHistory.md has detailed entries for Phase 0

**Phase 0 Review Checklist:**
- [ ] Run full environment test (build, run, hot reload)
- [ ] Verify all license files present and correct
- [ ] Review database schema for completeness
- [ ] Confirm .gitignore excludes datasets
- [ ] Check EditHistory.md entries are complete
- [ ] No deprecated Extended-Flashcards code remaining

**Output:**
- Working development environment
- Clean, professional repository structure
- Complete license compliance
- Validated database schema
- Ready to begin Phase 1 development

---

## Phase 1: Core Mandarin Learning (MVP)

**Goal:** Create a working Chinese learning application with spaced repetition, self-study, and progress tracking.

**Priority:** Spaced Repetition > Self-Study > Progress Tracking

**Estimated Tasks:** 15-20 major tasks

**Phase 1 Features:**
- ✅ Data processing pipeline (CC-CEDICT, SUBTLEX-CH)
- ✅ SQLite database with initial 3000+ characters
- ✅ Spaced repetition study mode (primary feature)
- ✅ Self-study quiz mode
- ✅ Basic progress tracking dashboard
- ✅ Character flashcards (character → definition, character → pinyin arrows)

**Not in Phase 1:**
- ❌ Stroke order
- ❌ Multiple choice mode
- ❌ Flash mode
- ❌ Speech features
- ❌ Writing practice
- ❌ Traditional characters
- ❌ Cantonese

---

### Task 1.1: Data Processing - Download Scripts

**Deliverable:** Automated scripts to download all required datasets.

**Technical Requirements:**
- Rust binary in `data-processing/` directory
- Downloads CC-CEDICT and SUBTLEX-CH
- Verifies file integrity
- Displays license attribution during download

**Steps:**
1. Create `data-processing/Cargo.toml`:
   ```toml
   [package]
   name = "data-processing"
   version = "0.1.0"
   edition = "2021"

   [[bin]]
   name = "download-datasets"
   path = "src/bin/download.rs"

   [dependencies]
   reqwest = { version = "0.11", features = ["blocking"] }
   tokio = { version = "1", features = ["full"] }
   flate2 = "1.0"
   sha2 = "0.10"
   ```

2. Create `data-processing/src/bin/download.rs`:
   ```rust
   use std::fs::{self, File};
   use std::io::{self, Write};
   use std::path::Path;

   #[tokio::main]
   async fn main() -> Result<(), Box<dyn std::error::Error>> {
       println!("=== Chinese Learning Tool - Dataset Downloader ===\n");
       
       // Create datasets directory
       fs::create_dir_all("datasets")?;
       
       // Download CC-CEDICT
       download_cedict().await?;
       
       // Download SUBTLEX-CH
       download_subtlex().await?;
       
       println!("\n✅ All datasets downloaded successfully!");
       println!("⚠️  Please review DATA-LICENSES.md for license terms");
       
       Ok(())
   }

   async fn download_cedict() -> Result<(), Box<dyn std::error::Error>> {
       println!("📥 Downloading CC-CEDICT...");
       println!("   Source: https://www.mdbg.net/chinese/dictionary?page=cedict");
       println!("   License: CC BY-SA 4.0\n");
       
       let url = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz";
       let output_gz = "datasets/cedict_ts.u8.gz";
       let output_txt = "datasets/cedict_ts.u8";
       
       // Download
       let response = reqwest::get(url).await?;
       let bytes = response.bytes().await?;
       
       // Save compressed file
       let mut file = File::create(output_gz)?;
       file.write_all(&bytes)?;
       
       println!("   ✓ Downloaded ({} KB)", bytes.len() / 1024);
       
       // Decompress
       println!("   Decompressing...");
       decompress_gz(output_gz, output_txt)?;
       
       println!("   ✓ Extracted to {}\n", output_txt);
       
       Ok(())
   }

   async fn download_subtlex() -> Result<(), Box<dyn std::error::Error>> {
       println!("📥 Downloading SUBTLEX-CH...");
       println!("   Source: https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch");
       println!("   License: Free for research and educational purposes");
       println!("   Citation Required: Cai & Brysbaert (2010)\n");
       
       // Note: SUBTLEX-CH may require manual download from website
       // This is a placeholder - implement based on actual download method
       
       println!("   ⚠️  SUBTLEX-CH may require manual download");
       println!("   Please visit the website and download:");
       println!("   - SUBTLEX-CH-CHR.zip (character frequencies)");
       println!("   - SUBTLEX-CH-WF_PoS.zip (word frequencies)");
       println!("   Extract to: datasets/SUBTLEX-CH/\n");
       
       Ok(())
   }

   fn decompress_gz(input: &str, output: &str) -> io::Result<()> {
       use flate2::read::GzDecoder;
       use std::io::Read;
       
       let file = File::open(input)?;
       let mut decoder = GzDecoder::new(file);
       let mut output_file = File::create(output)?;
       
       io::copy(&mut decoder, &mut output_file)?;
       
       Ok(())
   }
   ```

3. Test download script:
   ```bash
   cd data-processing
   cargo run --bin download-datasets
   ```

4. Verify downloads:
   - Check `datasets/cedict_ts.u8` exists and is readable
   - Check file sizes are reasonable
   - Open files in text editor to verify format

**Success Criteria:**
- ✅ download-datasets binary compiles without errors
- ✅ CC-CEDICT downloads automatically
- ✅ CC-CEDICT decompresses successfully
- ✅ License attributions displayed during download
- ✅ SUBTLEX-CH download instructions provided
- ✅ All files saved to datasets/ directory
- ✅ Files are not committed to git

**Acceptance Test:**
1. Delete datasets/ directory
2. Run `cargo run --bin download-datasets`
3. Verify datasets/ directory created
4. Verify cedict_ts.u8 file exists and >10MB
5. Verify license messages displayed in console
6. Run `git status` - datasets/ should not appear

**Risk Mitigation:**
- **Risk:** CC-CEDICT download URL changes
- **Mitigation:** Document manual download steps in comments
- **Risk:** SUBTLEX-CH requires authentication
- **Mitigation:** Provide clear manual download instructions

**EditHistory.md Entry:**
```
## [Date] - 1.1 - Dataset Download Scripts
**Task:** 1.1 - Data Processing - Download Scripts
**Status:** Complete
**Objective:** Create automated scripts to download CC-CEDICT and SUBTLEX-CH
**Decisions Made:**
- Used reqwest for HTTP downloads
- Included license attribution in console output
- Made SUBTLEX-CH manual download (website may require registration)
**Issues Encountered:** 
- [List any download issues, URL problems, etc.]
**Solutions Applied:**
- [Solutions to above issues]
**Code Changes:**
- Created data-processing/Cargo.toml
- Created data-processing/src/bin/download.rs
- Implemented CC-CEDICT download and decompression
**Testing Results:** Pass - CC-CEDICT downloads and extracts successfully
**Notes for Future:** 
- Consider adding checksum verification
- May need to update URLs if sources change
**Next Steps:** Parse CC-CEDICT format (Task 1.2)
```

---

### Task 1.2: Data Processing - CC-CEDICT Parser

**Deliverable:** Rust module that parses CC-CEDICT format into structured data.

**Technical Requirements:**
- Parse CC-CEDICT line format
- Handle both characters and multi-character words
- Extract traditional, simplified, pinyin, definitions
- Error handling for malformed lines
- Unit tests for parser

**Steps:**
1. Create `data-processing/src/parsers/mod.rs`:
   ```rust
   pub mod cedict;
   pub mod subtlex;
   ```

2. Create `data-processing/src/parsers/cedict.rs`:
   ```rust
   use std::fs::File;
   use std::io::{BufRead, BufReader};

   #[derive(Debug, Clone)]
   pub struct CedictEntry {
       pub traditional: String,
       pub simplified: String,
       pub pinyin: String,
       pub definitions: Vec<String>,
       pub is_word: bool,  // true if multi-character
   }

   pub fn parse_cedict_file(path: &str) -> Result<Vec<CedictEntry>, Box<dyn std::error::Error>> {
       let file = File::open(path)?;
       let reader = BufReader::new(file);
       let mut entries = Vec::new();
       let mut line_number = 0;

       for line in reader.lines() {
           line_number += 1;
           let line = line?;
           
           // Skip comments and empty lines
           if line.starts_with('#') || line.trim().is_empty() {
               continue;
           }

           match parse_cedict_line(&line) {
               Some(entry) => entries.push(entry),
               None => {
                   eprintln!("Warning: Could not parse line {}: {}", line_number, line);
               }
           }
       }

       println!("Parsed {} entries from CC-CEDICT", entries.len());
       Ok(entries)
   }

   fn parse_cedict_line(line: &str) -> Option<CedictEntry> {
       // Format: Traditional Simplified [pin1 yin1] /def1/def2/
       
       // Find pinyin section (between [ and ])
       let pinyin_start = line.find('[')?;
       let pinyin_end = line.find(']')?;
       let pinyin = line[pinyin_start + 1..pinyin_end].to_string();
       
       // Extract traditional and simplified (before [)
       let chars_part = &line[..pinyin_start].trim();
       let chars: Vec<&str> = chars_part.split_whitespace().collect();
       if chars.len() < 2 {
           return None;
       }
       let traditional = chars[0].to_string();
       let simplified = chars[1].to_string();
       
       // Extract definitions (after ])
       let defs_part = &line[pinyin_end + 1..].trim();
       let definitions: Vec<String> = defs_part
           .split('/')
           .filter(|s| !s.is_empty())
           .map(|s| s.trim().to_string())
           .collect();
       
       if definitions.is_empty() {
           return None;
       }
       
       // Determine if word or character
       let is_word = simplified.chars().count() > 1;
       
       Some(CedictEntry {
           traditional,
           simplified,
           pinyin,
           definitions,
           is_word,
       })
   }

   #[cfg(test)]
   mod tests {
       use super::*;

       #[test]
       fn test_parse_single_character() {
           let line = "一 一 [yi1] /one/1/single/";
           let entry = parse_cedict_line(line).unwrap();
           
           assert_eq!(entry.traditional, "一");
           assert_eq!(entry.simplified, "一");
           assert_eq!(entry.pinyin, "yi1");
           assert_eq!(entry.definitions.len(), 3);
           assert_eq!(entry.definitions[0], "one");
           assert!(!entry.is_word);
       }

       #[test]
       fn test_parse_word() {
           let line = "漢字 汉字 [han4 zi4] /Chinese character/";
           let entry = parse_cedict_line(line).unwrap();
           
           assert_eq!(entry.simplified, "汉字");
           assert_eq!(entry.pinyin, "han4 zi4");
           assert!(entry.is_word);
       }

       #[test]
       fn test_parse_invalid_line() {
           let line = "Invalid line without proper format";
           assert!(parse_cedict_line(line).is_none());
       }
   }
   ```

3. Add parser module to data-processing:
   ```rust
   // In data-processing/src/lib.rs (create this file)
   pub mod parsers;
   ```

4. Create test binary to verify parser:
   ```rust
   // data-processing/src/bin/test_parser.rs
   use data_processing::parsers::cedict;

   fn main() -> Result<(), Box<dyn std::error::Error>> {
       let entries = cedict::parse_cedict_file("datasets/cedict_ts.u8")?;
       
       println!("Total entries: {}", entries.len());
       println!("\nFirst 5 entries:");
       for entry in entries.iter().take(5) {
           println!("{:?}", entry);
       }
       
       let characters: Vec<_> = entries.iter().filter(|e| !e.is_word).collect();
       let words: Vec<_> = entries.iter().filter(|e| e.is_word).collect();
       
       println!("\nCharacters: {}", characters.len());
       println!("Words: {}", words.len());
       
       Ok(())
   }
   ```

5. Run tests:
   ```bash
   cargo test
   cargo run --bin test_parser
   ```

**Success Criteria:**
- ✅ Parser compiles without errors
- ✅ All unit tests pass
- ✅ Parses entire CC-CEDICT file without panicking
- ✅ Correctly identifies characters vs. words
- ✅ Extracts all fields (traditional, simplified, pinyin, definitions)
- ✅ Handles malformed lines gracefully
- ✅ Logs warnings for unparseable lines

**Acceptance Test:**
1. Run `cargo test` - all tests pass
2. Run test_parser binary
3. Verify output shows ~120,000+ entries
4. Check character/word counts are reasonable
5. Inspect first 5 entries - should be readable and correct

**Risk Mitigation:**
- **Risk:** CC-CEDICT format changes
- **Mitigation:** Unit tests will catch format changes; regex can be adjusted
- **Risk:** Unicode handling issues
- **Mitigation:** Rust's String type handles UTF-8 natively; tested with Chinese characters

**EditHistory.md Entry:**
```
## [Date] - 1.2 - CC-CEDICT Parser Implementation
**Task:** 1.2 - Data Processing - CC-CEDICT Parser
**Status:** Complete
**Objective:** Parse CC-CEDICT format into structured Rust data
**Decisions Made:**
- Used regex-free parsing (split/find) for better performance
- Separated characters from words using char count
- Stored multiple definitions as Vec<String>
**Issues Encountered:**
- [e.g., Some lines had unusual spacing, adjusted whitespace handling]
**Solutions Applied:**
- [Solutions to parsing issues]
**Code Changes:**
- Created data-processing/src/parsers/cedict.rs
- Implemented CedictEntry struct
- Added parse_cedict_file and parse_cedict_line functions
- Added comprehensive unit tests
**Testing Results:** Pass - Parsed 120,000+ entries successfully
**Notes for Future:**
- Parser is flexible enough to handle format variations
- May need to handle classifier info (CL:) in definitions later
**Next Steps:** Parse SUBTLEX-CH (Task 1.3)
```

---

### Task 1.3: Data Processing - SUBTLEX-CH Parser

**Deliverable:** Parser for SUBTLEX-CH frequency data with integration into character entries.

**Technical Requirements:**
- Parse CSV format from SUBTLEX-CH
- Extract character/word and frequency rank
- Handle both character and word frequency files
- Merge frequency data with CC-CEDICT entries

**Steps:**
1. Create `data-processing/src/parsers/subtlex.rs`:
   ```rust
   use std::collections::HashMap;
   use std::fs::File;
   use std::io::{BufRead, BufReader};

   #[derive(Debug, Clone)]
   pub struct FrequencyData {
       pub item: String,  // Character or word
       pub frequency_rank: i32,
       pub count: i32,
       pub is_word: bool,
   }

   pub fn parse_subtlex_character_file(path: &str) -> Result<HashMap<String, FrequencyData>, Box<dyn std::error::Error>> {
       parse_subtlex_file(path, false)
   }

   pub fn parse_subtlex_word_file(path: &str) -> Result<HashMap<String, FrequencyData>, Box<dyn std::error::Error>> {
       parse_subtlex_file(path, true)
   }

   fn parse_subtlex_file(path: &str, is_word: bool) -> Result<HashMap<String, FrequencyData>, Box<dyn std::error::Error>> {
       let file = File::open(path)?;
       let reader = BufReader::new(file);
       let mut data = HashMap::new();
       let mut rank = 1;
       let mut header_skipped = false;

       for line in reader.lines() {
           let line = line?;
           
           // Skip header line
           if !header_skipped {
               header_skipped = true;
               continue;
           }

           // Parse CSV line
           let parts: Vec<&str> = line.split('\t').collect();
           if parts.len() < 2 {
               continue;
           }

           let item = parts[0].trim().to_string();
           let count = parts[1].trim().parse::<i32>().unwrap_or(0);

           let freq_data = FrequencyData {
               item: item.clone(),
               frequency_rank: rank,
               count,
               is_word,
           };

           data.insert(item, freq_data);
           rank += 1;
       }

       println!("Parsed {} {} from SUBTLEX-CH", 
                data.len(), 
                if is_word { "words" } else { "characters" });
       Ok(data)
   }

   #[cfg(test)]
   mod tests {
       use super::*;

       #[test]
       fn test_frequency_data_creation() {
           let data = FrequencyData {
               item: "的".to_string(),
               frequency_rank: 1,
               count: 1000000,
               is_word: false,
           };
           
           assert_eq!(data.item, "的");
           assert_eq!(data.frequency_rank, 1);
           assert!(!data.is_word);
       }
   }
   ```

2. Create integration function in `data-processing/src/lib.rs`:
   ```rust
   use parsers::cedict::CedictEntry;
   use parsers::subtlex::FrequencyData;
   use std::collections::HashMap;

   #[derive(Debug, Clone)]
   pub struct EnrichedEntry {
       pub cedict: CedictEntry,
       pub frequency_rank: Option<i32>,
   }

   pub fn merge_cedict_with_frequency(
       cedict_entries: Vec<CedictEntry>,
       frequency_map: HashMap<String, FrequencyData>,
   ) -> Vec<EnrichedEntry> {
       cedict_entries
           .into_iter()
           .map(|entry| {
               let freq_rank = frequency_map
                   .get(&entry.simplified)
                   .map(|f| f.frequency_rank);
               
               EnrichedEntry {
                   cedict: entry,
                   frequency_rank: freq_rank,
               }
           })
           .collect()
   }
   ```

3. Create test binary to verify integration:
   ```rust
   // data-processing/src/bin/test_integration.rs
   use data_processing::parsers::{cedict, subtlex};
   use data_processing::merge_cedict_with_frequency;

   fn main() -> Result<(), Box<dyn std::error::Error>> {
       println!("Loading CC-CEDICT...");
       let cedict_entries = cedict::parse_cedict_file("datasets/cedict_ts.u8")?;
       
       println!("Loading SUBTLEX-CH character frequencies...");
       let char_freq = subtlex::parse_subtlex_character_file(
           "datasets/SUBTLEX-CH/SUBTLEX_CH_CHR.txt"
       )?;
       
       println!("Loading SUBTLEX-CH word frequencies...");
       let word_freq = subtlex::parse_subtlex_word_file(
           "datasets/SUBTLEX-CH/SUBTLEX_CH_WF.txt"
       )?;
       
       // Merge frequency data (use character freq for single chars, word freq for words)
       let mut combined_freq = char_freq;
       combined_freq.extend(word_freq);
       
       println!("Merging data...");
       let enriched = merge_cedict_with_frequency(cedict_entries, combined_freq);
       
       // Statistics
       let with_freq = enriched.iter().filter(|e| e.frequency_rank.is_some()).count();
       let without_freq = enriched.len() - with_freq;
       
       println!("\n=== Integration Results ===");
       println!("Total entries: {}", enriched.len());
       println!("With frequency data: {}", with_freq);
       println!("Without frequency data: {}", without_freq);
       
       // Show top 10 most frequent
       let mut sorted = enriched.clone();
       sorted.sort_by_key(|e| e.frequency_rank.unwrap_or(999999));
       
       println!("\n=== Top 10 Most Frequent ===");
       for entry in sorted.iter().take(10) {
           println!("{} ({}) - Rank: {:?} - {}", 
                    entry.cedict.simplified,
                    entry.cedict.pinyin,
                    entry.frequency_rank,
                    entry.cedict.definitions.join(", "));
       }
       
       Ok(())
   }
   ```

4. Run integration test:
   ```bash
   cargo run --bin test_integration
   ```

**Success Criteria:**
- ✅ SUBTLEX-CH parser compiles without errors
- ✅ Parses character frequency file successfully
- ✅ Parses word frequency file successfully
- ✅ Frequency ranks assigned correctly (1, 2, 3...)
- ✅ Integration merges data correctly
- ✅ Top 10 most frequent characters look reasonable (的, 一, 是, etc.)
- ✅ Statistics show good coverage (80%+ entries have frequency)

**Acceptance Test:**
1. Run test_integration binary
2. Verify output shows 100,000+ total entries
3. Check that 80,000+ have frequency data
4. Inspect top 10 - should be very common characters
5. Verify frequency ranks are sequential (1, 2, 3...)

**Risk Mitigation:**
- **Risk:** SUBTLEX-CH file format varies (tab vs comma separated)
- **Mitigation:** Try both delimiters, document actual format found
- **Risk:** Some CC-CEDICT entries don't have frequency data
- **Mitigation:** This is expected; make frequency_rank optional

**EditHistory.md Entry:**
```
## [Date] - 1.3 - SUBTLEX-CH Parser and Integration
**Task:** 1.3 - Data Processing - SUBTLEX-CH Parser
**Status:** Complete
**Objective:** Parse frequency data and merge with CC-CEDICT
**Decisions Made:**
- Used HashMap for O(1) frequency lookups during merge
- Made frequency_rank optional (not all entries have it)
- Processed characters and words separately, then combined
**Issues Encountered:**
- [e.g., File delimiter was tab, not comma]
**Solutions Applied:**
- [Adjusted parser to use tab delimiter]
**Code Changes:**
- Created data-processing/src/parsers/subtlex.rs
- Added merge_cedict_with_frequency function
- Created test_integration binary
**Testing Results:** Pass - Merged 120,000+ entries, 80%+ have frequency
**Notes for Future:**
- Entries without frequency will be sorted last
- May want to manually assign frequency to common entries without data
**Next Steps:** Build SQLite database (Task 1.4)
```

---

### Task 1.4: Data Processing - Database Builder

**Deliverable:** Rust binary that creates SQLite database from parsed data.

**Technical Requirements:**
- Create database using schema from Task 0.5
- Insert all enriched entries into characters table
- Initialize first 15 characters in user_progress
- Validate data integrity
- Transaction support for atomicity

**Steps:**
1. Add SQLite dependency to `data-processing/Cargo.toml`:
   ```toml
   [dependencies]
   rusqlite = { version = "0.31", features = ["bundled"] }
   ```

2. Create `data-processing/src/database/mod.rs`:
   ```rust
   use rusqlite::{Connection, Result};
   use crate::EnrichedEntry;
   use std::path::Path;

   pub fn create_database(entries: Vec<EnrichedEntry>, output_path: &str) -> Result<()> {
       // Delete existing database
       if Path::new(output_path).exists() {
           std::fs::remove_file(output_path).ok();
       }

       let conn = Connection::open(output_path)?;
       
       // Load schema
       let schema = include_str!("../../schema.sql");
       conn.execute_batch(schema)?;
       
       println!("Created database schema");
       
       // Insert data in transaction
       let tx = conn.transaction()?;
       
       insert_characters(&tx, entries)?;
       initialize_user_progress(&tx)?;
       
       tx.commit()?;
       
       println!("✅ Database created successfully: {}", output_path);
       
       Ok(())
   }

   fn insert_characters(conn: &Connection, entries: Vec<EnrichedEntry>) -> Result<()> {
       let mut stmt = conn.prepare(
           "INSERT INTO characters (
               character, simplified, traditional, mandarin_pinyin,
               definition, frequency_rank, is_word
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
       )?;

       let mut inserted = 0;
       let total = entries.len();

       for (i, entry) in entries.iter().enumerate() {
           if i % 10000 == 0 {
               println!("  Inserting... {}/{}", i, total);
           }

           let cedict = &entry.cedict;
           let definition = cedict.definitions.join("; ");
           
           // Use frequency rank or assign very high number if missing
           let freq_rank = entry.frequency_rank.unwrap_or(999999);

           stmt.execute(rusqlite::params![
               cedict.simplified,
               cedict.simplified,
               cedict.traditional,
               cedict.pinyin,
               definition,
               freq_rank,
               cedict.is_word,
           ])?;

           inserted += 1;
       }

       println!("  Inserted {} characters/words", inserted);
       Ok(())
   }

   fn initialize_user_progress(conn: &Connection) -> Result<()> {
       // Get first 15 characters by frequency
       let mut stmt = conn.prepare(
           "SELECT id FROM characters 
            WHERE is_word = 0 
            ORDER BY frequency_rank ASC 
            LIMIT 15"
       )?;

       let char_ids: Vec<i32> = stmt
           .query_map([], |row| row.get(0))?
           .collect::<Result<Vec<_>>>()?;

       println!("  Initializing user progress for {} characters", char_ids.len());

       let mut insert_stmt = conn.prepare(
           "INSERT INTO user_progress (
               character_id, current_interval_days, next_review_date, introduced
           ) VALUES (?1, 1.0, datetime('now'), 0)"
       )?;

       for char_id in char_ids {
           insert_stmt.execute([char_id])?;
       }

       println!("  ✓ First 15 characters ready for learning");
       Ok(())
   }

   pub fn verify_database(path: &str) -> Result<()> {
       let conn = Connection::open(path)?;
       
       let char_count: i32 = conn.query_row(
           "SELECT COUNT(*) FROM characters WHERE is_word = 0",
           [],
           |row| row.get(0)
       )?;

       let word_count: i32 = conn.query_row(
           "SELECT COUNT(*) FROM characters WHERE is_word = 1",
           [],
           |row| row.get(0)
       )?;

       let progress_count: i32 = conn.query_row(
           "SELECT COUNT(*) FROM user_progress",
           [],
           |row| row.get(0)
       )?;

       println!("\n=== Database Verification ===");
       println!("Characters: {}", char_count);
       println!("Words: {}", word_count);
       println!("Initial progress entries: {}", progress_count);

       // Verify top 15
       let mut stmt = conn.prepare(
           "SELECT c.simplified, c.mandarin_pinyin, c.frequency_rank
            FROM characters c
            JOIN user_progress p ON c.id = p.character_id
            ORDER BY c.frequency_rank ASC"
       )?;

       println!("\n=== First 15 Characters (Ready to Learn) ===");
       let rows = stmt.query_map([], |row| {
           Ok((
               row.get::<_, String>(0)?,
               row.get::<_, String>(1)?,
               row.get::<_, i32>(2)?,
           ))
       })?;

       for (i, row) in rows.enumerate() {
           let (char, pinyin, rank) = row?;
           println!("{}. {} ({}) - Rank: {}", i + 1, char, pinyin, rank);
       }

       Ok(())
   }
   ```

3. Copy schema.sql to data-processing:
   ```bash
   cp ../specifications/schema.sql data-processing/schema.sql
   ```

4. Create build-database binary:
   ```rust
   // data-processing/src/bin/build_database.rs
   use data_processing::parsers::{cedict, subtlex};
   use data_processing::{merge_cedict_with_frequency, database};

   fn main() -> Result<(), Box<dyn std::error::Error>> {
       println!("=== Building Chinese Learning Database ===\n");
       
       // Step 1: Parse CC-CEDICT
       println!("📖 Parsing CC-CEDICT...");
       let cedict_entries = cedict::parse_cedict_file("datasets/cedict_ts.u8")?;
       println!("  ✓ Loaded {} entries\n", cedict_entries.len());
       
       // Step 2: Parse SUBTLEX-CH
       println!("📊 Parsing SUBTLEX-CH...");
       let char_freq = subtlex::parse_subtlex_character_file(
           "datasets/SUBTLEX-CH/SUBTLEX_CH_CHR.txt"
       )?;
       let word_freq = subtlex::parse_subtlex_word_file(
           "datasets/SUBTLEX-CH/SUBTLEX_CH_WF.txt"
       )?;
       
       let mut combined_freq = char_freq;
       combined_freq.extend(word_freq);
       println!("  ✓ Loaded frequency data for {} items\n", combined_freq.len());
       
       // Step 3: Merge data
       println!("🔗 Merging data...");
       let enriched = merge_cedict_with_frequency(cedict_entries, combined_freq);
       println!("  ✓ Created {} enriched entries\n", enriched.len());
       
       // Step 4: Create database
       println!("💾 Creating SQLite database...");
       database::create_database(enriched, "chinese.db")?;
       println!();
       
       // Step 5: Verify
       println!("✅ Verifying database...");
       database::verify_database("chinese.db")?;
       
       println!("\n🎉 Database build complete!");
       println!("   Output: chinese.db");
       println!("   Ready to use in application");
       
       Ok(())
   }
   ```

5. Build and run:
   ```bash
   cd data-processing
   cargo run --bin build_database
   ```

6. Verify database manually:
   ```bash
   sqlite3 chinese.db
   .tables
   SELECT COUNT(*) FROM characters;
   SELECT * FROM characters ORDER BY frequency_rank LIMIT 10;
   SELECT COUNT(*) FROM user_progress;
   .quit
   ```

**Success Criteria:**
- ✅ build_database binary compiles without errors
- ✅ Database created at chinese.db
- ✅ All tables from schema present
- ✅ 100,000+ characters/words inserted
- ✅ First 15 characters initialized in user_progress
- ✅ Frequency ranks are correct (的 should be #1 or very low)
- ✅ No duplicate entries
- ✅ All foreign keys valid

**Acceptance Test:**
1. Run `cargo run --bin build_database`
2. Check console output - should show progress and success
3. Verify chinese.db file exists and is ~50-100 MB
4. Open in SQLite browser - verify data looks correct
5. Run verification queries - counts match expectations
6. Check first 15 characters - should be very common ones

**Risk Mitigation:**
- **Risk:** Database build fails partway through
- **Mitigation:** Use transactions (rollback on error)
- **Risk:** Out of memory with large dataset
- **Mitigation:** Process in batches if needed (not expected for 100k entries)
- **Risk:** Duplicate entries cause constraint violations
- **Mitigation:** UNIQUE constraint on character field will prevent this

**EditHistory.md Entry:**
```
## [Date] - 1.4 - Database Builder
**Task:** 1.4 - Data Processing - Database Builder
**Status:** Complete
**Objective:** Create SQLite database from parsed CC-CEDICT and SUBTLEX-CH data
**Decisions Made:**
- Used transactions for atomicity (all-or-nothing insert)
- Initialized first 15 characters in user_progress for immediate learning
- Assigned very high frequency rank (999999) to entries without frequency data
**Issues Encountered:**
- [e.g., Schema file path resolution, adjusted to use include_str!]
**Solutions Applied:**
- [Solutions]
**Code Changes:**
- Created data-processing/src/database/mod.rs
- Implemented create_database and verify_database functions
- Created build_database binary
- Added rusqlite dependency
**Testing Results:** Pass - Created database with 120,000+ entries, verified integrity
**Notes for Future:**
- Database build takes ~30 seconds on modern hardware
- First 15 characters (的,一,是,了,我,不,在,人,们,中,大,来,上,国,个) ready
**Next Steps:** Move database to Tauri resources (Task 1.5)
```

---

### Task 1.5: Integrate Database into Tauri Application

**Deliverable:** Database accessible from Tauri backend with basic query commands.

**Technical Requirements:**
- Copy chinese.db to Tauri resources
- Configure Tauri to bundle database
- Create Rust database module in src-tauri
- Implement basic Tauri commands for database queries
- Test database access from frontend

**Steps:**
1. Copy database to Tauri resources:
   ```bash
   mkdir -p src-tauri/resources
   cp data-processing/chinese.db src-tauri/resources/
   ```

2. Configure Tauri to bundle database in `src-tauri/tauri.conf.json`:
   ```json
   {
     "tauri": {
       "bundle": {
         "resources": [
           "resources/chinese.db"
         ]
       }
     }
   }
   ```

3. Add rusqlite to Tauri dependencies in `src-tauri/Cargo.toml`:
   ```toml
   [dependencies]
   rusqlite = { version = "0.31", features = ["bundled"] }
   ```

4. Create `src-tauri/src/database/mod.rs`:
   ```rust
   use rusqlite::{Connection, Result};
   use std::sync::Mutex;
   use tauri::State;

   pub struct DbConnection(pub Mutex<Connection>);

   pub fn initialize_database() -> Result<DbConnection> {
       // In development, use local file
       // In production, use bundled resource
       let db_path = if cfg!(debug_assertions) {
           "resources/chinese.db"
       } else {
           // Tauri will resolve this to the resources directory
           "chinese.db"
       };

       let conn = Connection::open(db_path)?;
       Ok(DbConnection(Mutex::new(conn)))
   }

   #[derive(serde::Serialize)]
   pub struct Character {
       pub id: i32,
       pub character: String,
       pub simplified: String,
       pub traditional: Option<String>,
       pub mandarin_pinyin: String,
       pub definition: String,
       pub frequency_rank: i32,
       pub is_word: bool,
   }

   pub fn get_character_by_id(conn: &Connection, id: i32) -> Result<Character> {
       conn.query_row(
           "SELECT id, character, simplified, traditional, mandarin_pinyin,
                   definition, frequency_rank, is_word
            FROM characters WHERE id = ?1",
           [id],
           |row| {
               Ok(Character {
                   id: row.get(0)?,
                   character: row.get(1)?,
                   simplified: row.get(2)?,
                   traditional: row.get(3)?,
                   mandarin_pinyin: row.get(4)?,
                   definition: row.get(5)?,
                   frequency_rank: row.get(6)?,
                   is_word: row.get(7)?,
               })
           }
       )
   }

   pub fn get_characters_by_frequency(conn: &Connection, limit: usize) -> Result<Vec<Character>> {
       let mut stmt = conn.prepare(
           "SELECT id, character, simplified, traditional, mandarin_pinyin,
                   definition, frequency_rank, is_word
            FROM characters 
            WHERE is_word = 0
            ORDER BY frequency_rank ASC 
            LIMIT ?1"
       )?;

       let chars = stmt.query_map([limit], |row| {
           Ok(Character {
               id: row.get(0)?,
               character: row.get(1)?,
               simplified: row.get(2)?,
               traditional: row.get(3)?,
               mandarin_pinyin: row.get(4)?,
               definition: row.get(5)?,
               frequency_rank: row.get(6)?,
               is_word: row.get(7)?,
           })
       })?;

       chars.collect()
   }
   ```

5. Create `src-tauri/src/commands/mod.rs`:
   ```rust
   use crate::database::{DbConnection, Character};
   use tauri::State;

   #[tauri::command]
   pub fn get_character(db: State<DbConnection>, id: i32) -> Result<Character, String> {
       let conn = db.0.lock().unwrap();
       crate::database::get_character_by_id(&conn, id)
           .map_err(|e| e.to_string())
   }

   #[tauri::command]
   pub fn get_top_characters(db: State<DbConnection>, limit: usize) -> Result<Vec<Character>, String> {
       let conn = db.0.lock().unwrap();
       crate::database::get_characters_by_frequency(&conn, limit)
           .map_err(|e| e.to_string())
   }

   #[tauri::command]
   pub fn test_database_connection(db: State<DbConnection>) -> Result<String, String> {
       let conn = db.0.lock().unwrap();
       let count: i32 = conn.query_row(
           "SELECT COUNT(*) FROM characters",
           [],
           |row| row.get(0)
       ).map_err(|e| e.to_string())?;

       Ok(format!("Database connected! {} characters available", count))
   }
   ```

6. Update `src-tauri/src/main.rs`:
   ```rust
   // Don't show console window on Windows in release
   #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

   mod database;
   mod commands;

   use database::initialize_database;

   fn main() {
       // Initialize database
       let db = initialize_database().expect("Failed to initialize database");

       tauri::Builder::default()
           .manage(db)
           .invoke_handler(tauri::generate_handler![
               commands::test_database_connection,
               commands::get_character,
               commands::get_top_characters,
           ])
           .run(tauri::generate_context!())
           .expect("error while running tauri application");
   }
   ```

7. Test from frontend - create `src/App.tsx` test:
   ```typescript
   import { useEffect, useState } from 'react';
   import { invoke } from '@tauri-apps/api/tauri';

   interface Character {
     id: number;
     character: string;
     simplified: string;
     mandarin_pinyin: string;
     definition: string;
     frequency_rank: number;
   }

   function App() {
     const [dbStatus, setDbStatus] = useState<string>('Testing...');
     const [topChars, setTopChars] = useState<Character[]>([]);

     useEffect(() => {
       testDatabase();
     }, []);

     const testDatabase = async () => {
       try {
         const status = await invoke<string>('test_database_connection');
         setDbStatus(status);

         const chars = await invoke<Character[]>('get_top_characters', { limit: 10 });
         setTopChars(chars);
       } catch (error) {
         setDbStatus(`Error: ${error}`);
       }
     };

     return (
       <div style={{ padding: '20px' }}>
         <h1>Chinese Learning Tool - Database Test</h1>
         <p><strong>Status:</strong> {dbStatus}</p>

         <h2>Top 10 Most Frequent Characters</h2>
         <table>
           <thead>
             <tr>
               <th>Rank</th>
               <th>Character</th>
               <th>Pinyin</th>
               <th>Definition</th>
             </tr>
           </thead>
           <tbody>
             {topChars.map((char) => (
               <tr key={char.id}>
                 <td>{char.frequency_rank}</td>
                 <td style={{ fontSize: '24px' }}>{char.character}</td>
                 <td>{char.mandarin_pinyin}</td>
                 <td>{char.definition}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     );
   }

   export default App;
   ```

8. Run application:
   ```bash
   npm run tauri:dev
   ```

**Success Criteria:**
- ✅ Database bundled in Tauri resources
- ✅ Tauri backend initializes database connection
- ✅ All Tauri commands compile without errors
- ✅ Frontend can invoke database commands
- ✅ Test page displays "Database connected!" message
- ✅ Top 10 characters display correctly
- ✅ No CORS or connection errors

**Acceptance Test:**
1. Run `npm run tauri:dev`
2. App launches without errors
3. Test page displays database status
4. Top 10 characters table populated
5. Characters are correct (的, 一, 是, etc.)
6. Hot reload still works

**Risk Mitigation:**
- **Risk:** Database path incorrect in production build
- **Mitigation:** Use cfg!(debug_assertions) to handle dev vs prod paths
- **Risk:** Database locked by multiple threads
- **Mitigation:** Use Mutex<Connection> for thread-safe access
- **Risk:** Database not bundled in release build
- **Mitigation:** Verify tauri.conf.json resources configuration

**EditHistory.md Entry:**
```
## [Date] - 1.5 - Integrate Database into Tauri
**Task:** 1.5 - Integrate Database into Tauri Application
**Status:** Complete
**Objective:** Make SQLite database accessible from Tauri backend
**Decisions Made:**
- Used Mutex<Connection> for thread-safe database access
- Separated dev and prod database paths using cfg!(debug_assertions)
- Created reusable Character struct with serde serialization
**Issues Encountered:**
- [e.g., Database path resolution differences between dev/prod]
**Solutions Applied:**
- [Used conditional compilation for path resolution]
**Code Changes:**
- Created src-tauri/src/database/mod.rs
- Created src-tauri/src/commands/mod.rs
- Updated src-tauri/src/main.rs to initialize database
- Added test UI in src/App.tsx
- Configured tauri.conf.json to bundle database
**Testing Results:** Pass - Database accessible, top 10 characters display correctly
**Notes for Future:**
- Database connection is singleton (managed by Tauri State)
- Consider connection pooling if performance issues arise
**Next Steps:** Implement SRS algorithm (Task 1.6)
```

---

### Phase 1 Milestone: Data Pipeline Complete

**Milestone Achieved:** Complete data processing pipeline from raw datasets to accessible database.

**Deliverables Completed:**
- ✅ Download scripts for CC-CEDICT and SUBTLEX-CH
- ✅ Parsers for both datasets
- ✅ Data integration and enrichment
- ✅ SQLite database creation
- ✅ Tauri integration with database access
- ✅ Basic query commands functional

**Verification Checklist:**
- [ ] Can download datasets from scratch
- [ ] Can rebuild database from datasets
- [ ] Database contains 100,000+ entries
- [ ] Tauri app can query database
- [ ] Top 10 characters are correct and common
- [ ] First 15 characters initialized in user_progress

**Next Phase:** Implement core learning features (SRS, UI components)

---

### Task 1.6: Implement SRS Algorithm (Rust)

**Deliverable:** Complete spaced repetition algorithm in Rust backend.

**Technical Requirements:**
- Implement interval calculation based on specifications
- Handle correct and incorrect answers
- Track previous interval for backtracking
- Detect when card reaches 1-week interval
- Unlock new cards based on maturity
- All logic unit tested

**Steps:**
1. Create `src-tauri/src/srs/mod.rs`:
   ```rust
   use chrono::{DateTime, Duration, Utc};

   #[derive(Debug, Clone)]
   pub struct SrsCard {
       pub character_id: i32,
       pub current_interval_days: f32,
       pub previous_interval_days: f32,
       pub ease_factor: f32,
       pub times_correct: i32,
       pub times_incorrect: i32,
       pub has_reached_week: bool,
   }

   #[derive(Debug)]
   pub struct SrsUpdate {
       pub new_interval_days: f32,
       pub new_ease_factor: f32,
       pub next_review_date: DateTime<Utc>,
       pub reached_week_for_first_time: bool,
   }

   pub fn calculate_next_review(
       card: &SrsCard,
       correct: bool,
   ) -> SrsUpdate {
       let (new_interval, new_ease) = if correct {
           calculate_interval_correct(card)
       } else {
           calculate_interval_incorrect(card)
       };

       let next_review_date = Utc::now() + Duration::days(new_interval.ceil() as i64);
       
       // Check if reaching 1 week for first time
       let reached_week_for_first_time = 
           !card.has_reached_week && new_interval >= 7.0;

       SrsUpdate {
           new_interval_days: new_interval,
           new_ease_factor: new_ease,
           next_review_date,
           reached_week_for_first_time,
       }
   }

   fn calculate_interval_correct(card: &SrsCard) -> (f32, f32) {
       let current = card.current_interval_days;
       let ease = card.ease_factor;

       let new_interval = if current < 1.0 {
           1.0
       } else if current < 3.0 {
           3.0
       } else if current < 7.0 {
           7.0
       } else {
           current * ease
       };

       (new_interval, ease) // Ease factor unchanged on correct
   }

   fn calculate_interval_incorrect(card: &SrsCard) -> (f32, f32) {
       let new_interval = card.previous_interval_days.max(1.0);
       let new_ease = (card.ease_factor - 0.2).max(1.3);

       (new_interval, new_ease)
   }

   #[cfg(test)]
   mod tests {
       use super::*;

       #[test]
       fn test_first_correct_answer() {
           let card = SrsCard {
               character_id: 1,
               current_interval_days: 1.0,
               previous_interval_days: 1.0,
               ease_factor: 2.5,
               times_correct: 0,
               times_incorrect: 0,
               has_reached_week: false,
           };

           let update = calculate_next_review(&card, true);
           assert_eq!(update.new_interval_days, 3.0);
           assert_eq!(update.new_ease_factor, 2.5);
           assert!(!update.reached_week_for_first_time);
       }

       #[test]
       fn test_reaching_one_week() {
           let card = SrsCard {
               character_id: 1,
               current_interval_days: 3.0,
               previous_interval_days: 1.0,
               ease_factor: 2.5,
               times_correct: 1,
               times_incorrect: 0,
               has_reached_week: false,
           };

           let update = calculate_next_review(&card, true);
           assert_eq!(update.new_interval_days, 7.0);
           assert!(update.reached_week_for_first_time);
       }

       #[test]
       fn test_incorrect_answer_backs_to_previous() {
           let card = SrsCard {
               character_id: 1,
               current_interval_days: 7.0,
               previous_interval_days: 3.0,
               ease_factor: 2.5,
               times_correct: 2,
               times_incorrect: 0,
               has_reached_week: true,
           };

           let update = calculate_next_review(&card, false);
           assert_eq!(update.new_interval_days, 3.0); // Back to previous
           assert_eq!(update.new_ease_factor, 2.3); // Decreased by 0.2
           assert!(!update.reached_week_for_first_time); // Already reached
       }

       #[test]
       fn test_ease_factor_floor() {
           let card = SrsCard {
               character_id: 1,
               current_interval_days: 7.0,
               previous_interval_days: 3.0,
               ease_factor: 1.4,
               times_correct: 0,
               times_incorrect: 5,
               has_reached_week: true,
           };

           let update = calculate_next_review(&card, false);
           assert_eq!(update.new_ease_factor, 1.3); // Floor at 1.3
       }

       #[test]
       fn test_progression_sequence() {
           let mut card = SrsCard {
               character_id: 1,
               current_interval_days: 1.0,
               previous_interval_days: 1.0,
               ease_factor: 2.5,
               times_correct: 0,
               times_incorrect: 0,
               has_reached_week: false,
           };

           // Day 1 -> 3
           let update = calculate_next_review(&card, true);
           assert_eq!(update.new_interval_days, 3.0);

           card.previous_interval_days = card.current_interval_days;
           card.current_interval_days = update.new_interval_days;

           // Day 3 -> 7
           let update = calculate_next_review(&card, true);
           assert_eq!(update.new_interval_days, 7.0);
           assert!(update.reached_week_for_first_time);

           card.previous_interval_days = card.current_interval_days;
           card.current_interval_days = update.new_interval_days;
           card.has_reached_week = true;

           // Day 7 -> 17.5 (7 * 2.5)
           let update = calculate_next_review(&card, true);
           assert_eq!(update.new_interval_days, 17.5);
       }
   }
   ```

2. Add chrono dependency to `src-tauri/Cargo.toml`:
   ```toml
   [dependencies]
   chrono = "0.4"
   ```

3. Update `src-tauri/src/main.rs` to include srs module:
   ```rust
   mod srs;
   ```

4. Run tests:
   ```bash
   cd src-tauri
   cargo test srs
   ```

**Success Criteria:**
- ✅ SRS algorithm compiles without errors
- ✅ All unit tests pass
- ✅ Correct answer increases interval (1→3→7→17.5...)
- ✅ Incorrect answer returns to previous interval
- ✅ Ease factor decreases on incorrect (with floor at 1.3)
- ✅ Detects reaching 1 week for first time
- ✅ Already-reached-week flag prevents re-triggering

**Acceptance Test:**
1. Run `cargo test srs` - all tests pass
2. Review test cases - cover all scenarios
3. Manually trace through example progression
4. Verify matches specifications document

**Risk Mitigation:**
- **Risk:** Floating point precision issues
- **Mitigation:** Use f32 which is sufficient; round up for days using ceil()
- **Risk:** Date calculation errors
- **Mitigation:** Use chrono library (well-tested)

**EditHistory.md Entry:**
```
## [Date] - 1.6 - SRS Algorithm Implementation
**Task:** 1.6 - Implement SRS Algorithm (Rust)
**Status:** Complete
**Objective:** Implement spaced repetition interval calculation
**Decisions Made:**
- Used f32 for interval precision (sufficient for day-level precision)
- Separated correct/incorrect logic into separate functions
- Tracked previous_interval_days for backtracking on incorrect
- Used chrono for reliable date arithmetic
**Issues Encountered:** None
**Solutions Applied:** N/A
**Code Changes:**
- Created src-tauri/src/srs/mod.rs
- Implemented calculate_next_review function
- Added comprehensive unit tests (6 test cases)
- Added chrono dependency
**Testing Results:** Pass - All 6 unit tests pass
**Notes for Future:**
- Algorithm matches specifications exactly
- Consider adding more granular intervals later (hours for very new cards)
**Next Steps:** Database queries for SRS (Task 1.7)
```

---

### Task 1.7: SRS Database Queries and Commands

**Deliverable:** Tauri commands for all SRS operations (get due cards, record answer, unlock cards).

**Technical Requirements:**
- Query cards due for review
- Update card progress after answer
- Unlock new card when eligible
- Handle session state
- Transaction support for consistency

**Steps:**
1. Add SRS functions to `src-tauri/src/database/mod.rs`:
   ```rust
   use crate::srs::{SrsCard, calculate_next_review};
   use chrono::{DateTime, Utc};

   #[derive(serde::Serialize)]
   pub struct DueCard {
       pub character_id: i32,
       pub character: String,
       pub pinyin: String,
       pub definition: String,
       pub current_interval: f32,
       pub times_reviewed: i32,
   }

   pub fn get_due_cards(conn: &Connection) -> Result<Vec<DueCard>> {
       let mut stmt = conn.prepare(
           "SELECT c.id, c.character, c.mandarin_pinyin, c.definition,
                   p.current_interval_days, p.times_reviewed
            FROM characters c
            JOIN user_progress p ON c.id = p.character_id
            WHERE p.introduced = 1 
              AND p.next_review_date <= datetime('now')
            ORDER BY p.next_review_date ASC"
       )?;

       let cards = stmt.query_map([], |row| {
           Ok(DueCard {
               character_id: row.get(0)?,
               character: row.get(1)?,
               pinyin: row.get(2)?,
               definition: row.get(3)?,
               current_interval: row.get(4)?,
               times_reviewed: row.get(5)?,
           })
       })?;

       cards.collect()
   }

   pub fn get_srs_card_state(conn: &Connection, character_id: i32) -> Result<SrsCard> {
       conn.query_row(
           "SELECT character_id, current_interval_days, previous_interval_days,
                   ease_factor, times_correct, times_incorrect, has_reached_week
            FROM user_progress
            WHERE character_id = ?1",
           [character_id],
           |row| {
               Ok(crate::srs::SrsCard {
                   character_id: row.get(0)?,
                   current_interval_days: row.get(1)?,
                   previous_interval_days: row.get(2)?,
                   ease_factor: row.get(3)?,
                   times_correct: row.get(4)?,
                   times_incorrect: row.get(5)?,
                   has_reached_week: row.get(6)?,
               })
           }
       )
   }

   pub fn record_srs_answer(
       conn: &Connection,
       character_id: i32,
       correct: bool,
   ) -> Result<bool> {
       // Get current card state
       let card = get_srs_card_state(conn, character_id)?;
       
       // Calculate new values
       let update = calculate_next_review(&card, correct);
       
       // Update database
       conn.execute(
           "UPDATE user_progress
            SET previous_interval_days = current_interval_days,
                current_interval_days = ?1,
                ease_factor = ?2,
                next_review_date = ?3,
                times_reviewed = times_reviewed + 1,
                times_correct = times_correct + ?4,
                times_incorrect = times_incorrect + ?5,
                has_reached_week = has_reached_week OR ?6,
                last_reviewed = datetime('now'),
                updated_at = datetime('now')
            WHERE character_id = ?7",
           rusqlite::params![
               update.new_interval_days,
               update.new_ease_factor,
               update.next_review_date.to_rfc3339(),
               if correct { 1 } else { 0 },
               if correct { 0 } else { 1 },
               update.reached_week_for_first_time,
               character_id,
           ]
       )?;

       Ok(update.reached_week_for_first_time)
   }

   pub fn unlock_next_character(conn: &Connection) -> Result<Option<Character>> {
       // Get next character by frequency that isn't in user_progress yet
       let result: Result<Character> = conn.query_row(
           "SELECT c.id, c.character, c.simplified, c.traditional, 
                   c.mandarin_pinyin, c.definition, c.frequency_rank, c.is_word
            FROM characters c
            WHERE c.is_word = 0
              AND NOT EXISTS (
                  SELECT 1 FROM user_progress p 
                  WHERE p.character_id = c.id
              )
            ORDER BY c.frequency_rank ASC
            LIMIT 1",
           [],
           |row| {
               Ok(Character {
                   id: row.get(0)?,
                   character: row.get(1)?,
                   simplified: row.get(2)?,
                   traditional: row.get(3)?,
                   mandarin_pinyin: row.get(4)?,
                   definition: row.get(5)?,
                   frequency_rank: row.get(6)?,
                   is_word: row.get(7)?,
               })
           }
       );

       match result {
           Ok(character) => {
               // Add to user_progress (not yet introduced)
               conn.execute(
                   "INSERT INTO user_progress 
                    (character_id, current_interval_days, next_review_date, introduced)
                    VALUES (?1, 1.0, datetime('now'), 0)",
                   [character.id]
               )?;

               Ok(Some(character))
           }
           Err(_) => Ok(None), // No more characters to unlock
       }
   }

   pub fn mark_character_introduced(conn: &Connection, character_id: i32) -> Result<()> {
       conn.execute(
           "UPDATE user_progress
            SET introduced = 1,
                updated_at = datetime('now')
            WHERE character_id = ?1",
           [character_id]
       )?;
       Ok(())
   }
   ```

2. Add SRS commands to `src-tauri/src/commands/mod.rs`:
   ```rust
   use crate::database::DueCard;

   #[tauri::command]
   pub fn get_due_cards_for_review(db: State<DbConnection>) -> Result<Vec<DueCard>, String> {
       let conn = db.0.lock().unwrap();
       crate::database::get_due_cards(&conn)
           .map_err(|e| e.to_string())
   }

   #[tauri::command]
   pub fn submit_srs_answer(
       db: State<DbConnection>,
       character_id: i32,
       correct: bool,
   ) -> Result<bool, String> {
       let conn = db.0.lock().unwrap();
       crate::database::record_srs_answer(&conn, character_id, correct)
           .map_err(|e| e.to_string())
   }

   #[tauri::command]
   pub fn unlock_new_character(db: State<DbConnection>) -> Result<Option<Character>, String> {
       let conn = db.0.lock().unwrap();
       crate::database::unlock_next_character(&conn)
           .map_err(|e| e.to_string())
   }

   #[tauri::command]
   pub fn introduce_character(
       db: State<DbConnection>,
       character_id: i32,
   ) -> Result<(), String> {
       let conn = db.0.lock().unwrap();
       crate::database::mark_character_introduced(&conn, character_id)
           .map_err(|e| e.to_string())
   }
   ```

3. Register commands in `src-tauri/src/main.rs`:
   ```rust
   .invoke_handler(tauri::generate_handler![
       commands::test_database_connection,
       commands::get_character,
       commands::get_top_characters,
       commands::get_due_cards_for_review,
       commands::submit_srs_answer,
       commands::unlock_new_character,
       commands::introduce_character,
   ])
   ```

4. Test commands from frontend - add to `src/App.tsx`:
   ```typescript
   const testSrsCommands = async () => {
     try {
       // Get due cards
       const dueCards = await invoke<any[]>('get_due_cards_for_review');
       console.log('Due cards:', dueCards);

       if (dueCards.length > 0) {
         // Submit correct answer for first card
         const firstCard = dueCards[0];
         const unlockedNew = await invoke<boolean>('submit_srs_answer', {
           characterId: firstCard.character_id,
           correct: true,
         });
         console.log('Unlocked new character:', unlockedNew);

         if (unlockedNew) {
           const newChar = await invoke('unlock_new_character');
           console.log('New character:', newChar);
         }
       }
     } catch (error) {
       console.error('SRS test error:', error);
     }
   };
   ```

**Success Criteria:**
- ✅ All SRS commands compile without errors
- ✅ get_due_cards returns first 15 characters
- ✅ submit_srs_answer updates database correctly
- ✅ Interval increases on correct answer
- ✅ unlock_new_character returns 16th character when triggered
- ✅ mark_character_introduced sets introduced flag
- ✅ No SQL errors or constraint violations

**Acceptance Test:**
1. Run app with test code
2. Check console - due cards should be 15 characters
3. Submit correct answer - verify in database interval increased
4. Keep answering until one reaches 1 week
5. Verify 16th character unlocked
6. Check database - user_progress should have 16 entries

**Risk Mitigation:**
- **Risk:** Concurrent access to database during SRS update
- **Mitigation:** Mutex ensures single-threaded access
- **Risk:** Card unlocking happens multiple times
- **Mitigation:** Check has_reached_week flag in SQL query

**EditHistory.md Entry:**
```
## [Date] - 1.7 - SRS Database Queries
**Task:** 1.7 - SRS Database Queries and Commands
**Status:** Complete
**Objective:** Implement Tauri commands for SRS operations
**Decisions Made:**
- Stored next_review_date as ISO8601 string (SQLite datetime compatible)
- Used transactions implicitly (each command is atomic)
- Separated character unlocking into two steps (unlock + introduce)
**Issues Encountered:**
- [e.g., DateTime serialization format, used to_rfc3339()]
**Solutions Applied:**
- [Used chrono's RFC3339 format for datetime storage]
**Code Changes:**
- Added SRS functions to database/mod.rs
- Added SRS commands to commands/mod.rs
- Registered commands in main.rs
- Added frontend test code
**Testing Results:** Pass - All commands work, unlocking triggers correctly
**Notes for Future:**
- Consider batch operations for better performance
- May want to add "undo" functionality later
**Next Steps:** Build SRS UI components (Task 1.8)
```

---

**Development Plan continues with Tasks 1.8-1.15 covering:**
- Task 1.8: Character Introduction Screen UI
- Task 1.9: Spaced Repetition Study Session UI
- Task 1.10: Answer Verification Logic
- Task 1.11: Session Management
- Task 1.12: Self-Study Mode Implementation
- Task 1.13: Progress Dashboard
- Task 1.14: Phase 1 Integration Testing
- Task 1.15: Phase 1 Code Cleanup

---

### Task 1.8: Character Introduction Screen UI

**Deliverable:** Professional introduction screen for new characters before they enter SRS.

**Technical Requirements:**
- Display character, pinyin, definition
- Show frequency rank position visually
- "Start Learning" button to mark introduced
- Accessible from SRS session when new card appears
- Responsive design, cross-platform compatible

**UI Components Needed:**
- `IntroductionScreen.tsx` - main component
- Character display (large, centered)
- Info cards for pinyin and definition
- Visual indicator of learning progress (e.g., "Character 16 of 3000+")
- Navigation buttons

**Key Design Decisions:**
- Use card-based layout (Material Design or similar)
- Large character display (72px+) for readability
- Clear visual hierarchy (character → pinyin → definition)
- Consistent with Extended-Flashcards design language

**Steps:**
1. Create `src/components/Introduction/IntroductionScreen.tsx`
2. Implement character display component
3. Add pinyin pronunciation display
4. Add definition section
5. Implement "Start Learning" button with Tauri command call
6. Add basic CSS styling (professional, clean)
7. Test with first 15 characters

**Success Criteria:**
- ✅ Screen displays character data correctly
- ✅ All text is readable and properly sized
- ✅ "Start Learning" button calls introduce_character command
- ✅ After clicking, character appears in SRS due list
- ✅ Layout responsive on different window sizes
- ✅ Professional appearance (clean, uncluttered)

**Acceptance Test:**
1. Launch app, trigger introduction screen
2. Verify character displays clearly
3. Verify pinyin shows with tone marks
4. Verify definition is readable
5. Click "Start Learning" - should mark as introduced
6. Return to SRS - character should appear in due list

**Risk Mitigation:**
- **Risk:** Chinese characters don't render correctly
- **Mitigation:** Test with system fonts, include fallback font stack
- **Risk:** Pinyin tone marks display incorrectly
- **Mitigation:** Use Unicode combining characters, test on Windows/Mac/Linux

---

### Task 1.9: Spaced Repetition Study Session UI

**Deliverable:** Complete SRS study interface with question display and answer input.

**Technical Requirements:**
- Load and display due cards from Tauri backend
- Show question based on arrow type (character → definition OR character → pinyin)
- Text input for user answer
- Submit answer and show immediate feedback
- Progress indicator (X of Y cards completed)
- Handle card cycling (incorrect cards reappear)

**UI Components Needed:**
- `SpacedRepetition.tsx` - main study session component
- `QuestionCard.tsx` - displays question
- `AnswerInput.tsx` - text input with submit
- `SessionProgress.tsx` - progress bar/counter
- `FeedbackDisplay.tsx` - correct/incorrect feedback

**Session Flow:**
1. Fetch due cards on component mount
2. Randomly select arrow to test (definition OR pinyin)
3. Display question (show character, ask for definition/pinyin)
4. User types answer
5. Submit → backend verifies correctness
6. Show feedback (correct/incorrect with correct answer)
7. If incorrect, add back to session queue
8. Continue until all cards answered correctly at least once
9. Show session complete screen

**Key Design Decisions:**
- One question at a time (focus, no distractions)
- Clear visual feedback (green for correct, red for incorrect)
- Incorrect cards cycle to end of queue (not immediate repeat)
- Session state managed in React (not persisted between app closes)

**Steps:**
1. Create SRS session component structure
2. Implement due cards fetching
3. Build question display logic (randomly pick arrow type)
4. Implement answer input and submission
5. Add answer verification (call backend command)
6. Implement feedback display
7. Handle card cycling for incorrect answers
8. Add session progress tracking
9. Implement session completion screen

**Success Criteria:**
- ✅ Session loads 15 due cards initially
- ✅ Questions alternate between definition and pinyin
- ✅ User can type and submit answers
- ✅ Correct answers show green feedback and advance
- ✅ Incorrect answers show red feedback with correct answer
- ✅ Incorrect cards reappear later in session
- ✅ Session completes when all cards correct
- ✅ Progress indicator updates correctly

**Acceptance Test:**
1. Start SRS session - 15 cards load
2. Answer first card correctly - advances to next
3. Answer second card incorrectly - shows correct answer
4. Continue through session - incorrect card reappears
5. Complete session - all cards answered correctly
6. Check database - intervals increased for correct answers

**Risk Mitigation:**
- **Risk:** Session state lost on accidental close
- **Mitigation:** Phase 1 - accept data loss; Phase 2 - add session persistence
- **Risk:** Network/database lag causes UI freeze
- **Mitigation:** Add loading states, async/await properly

---

### Task 1.10: Answer Verification Logic

**Deliverable:** Robust answer checking that handles common input variations.

**Technical Requirements:**
- Compare user answer to correct answer
- Handle case insensitivity
- Trim whitespace
- Handle pinyin tone number variations (ma1 vs mā)
- Allow semicolon or comma separated definitions
- Return boolean (correct/incorrect) to UI

**Implementation Location:**
- Frontend: `src/utils/answerVerification.ts`
- OR Backend: `src-tauri/src/commands/verify.rs`

**Decision:** Implement in frontend for faster feedback, backend can validate if needed

**Verification Rules:**
**For Pinyin:**
- Case insensitive (ma1 = Ma1 = MA1)
- Whitespace trimmed
- Tone numbers (ma1) and tone marks (mā) both accepted
- Multiple pronunciations: accept any valid one (逢 can be feng2 or pang2)

**For Definitions:**
- Case insensitive
- Whitespace trimmed
- Accept if answer contains any keyword from definition
- OR accept if answer matches any synonym
- Example: "学" definition is "to study; to learn" → accept "study" or "learn"

**Steps:**
1. Create answer verification utility module
2. Implement pinyin normalization function
3. Implement definition keyword matching
4. Add unit tests for edge cases
5. Integrate with SRS session UI
6. Test with real character data

**Success Criteria:**
- ✅ Correctly accepts valid answers with variations
- ✅ Correctly rejects clearly wrong answers
- ✅ Handles empty/whitespace-only input
- ✅ All unit tests pass
- ✅ User feedback is accurate (no false positives/negatives)

**Acceptance Test:**
1. Test pinyin: "ma1", "mā", "MA1" all accepted for 妈
2. Test definition: "study", "learn", "Study" all accepted for 学
3. Test rejection: "dog" rejected for 学
4. Test edge cases: empty string, only spaces
5. Verify with 50+ real examples

**Risk Mitigation:**
- **Risk:** Too lenient (accepts wrong answers)
- **Mitigation:** Start strict, relax based on user feedback
- **Risk:** Too strict (rejects valid answers)
- **Mitigation:** Comprehensive testing with real usage patterns

---

### Task 1.11: Session Management and State

**Deliverable:** Robust session state management for SRS and other study modes.

**Technical Requirements:**
- Track current session state (active, paused, completed)
- Manage card queue (remaining, completed, incorrect)
- Handle session start/pause/resume/complete
- Track session statistics (correct/incorrect counts, time)
- Persist critical state to prevent data loss

**State Structure:**
```typescript
interface SessionState {
  mode: 'srs' | 'self-study' | 'multiple-choice';
  status: 'active' | 'paused' | 'completed';
  cards: Card[];
  currentCardIndex: number;
  completedCards: number[];
  incorrectCards: number[];
  stats: {
    totalCards: number;
    cardsCorrect: number;
    cardsIncorrect: number;
    startTime: Date;
    endTime?: Date;
  };
}
```

**Key Features:**
- Session timer (track study duration)
- Card queue management (add incorrect cards to end)
- Session persistence (localStorage backup)
- Statistics tracking for progress dashboard

**Steps:**
1. Create session state management hook (`useStudySession.ts`)
2. Implement session initialization
3. Add card queue management functions
4. Implement session statistics tracking
5. Add localStorage persistence
6. Create session complete handler (save to database)
7. Test session flow end-to-end

**Success Criteria:**
- ✅ Session initializes with correct card list
- ✅ Card queue updates correctly as user progresses
- ✅ Incorrect cards cycle to end of queue
- ✅ Statistics track accurately
- ✅ Session persists across page refresh (Phase 2)
- ✅ Session completion saves to database

**Acceptance Test:**
1. Start session - verify initial state
2. Answer cards - verify queue updates
3. Get one wrong - verify it cycles to end
4. Refresh page - verify session restores (Phase 2)
5. Complete session - verify stats saved to database
6. Check study_sessions table - entry created

**Risk Mitigation:**
- **Risk:** State desynchronization between frontend and backend
- **Mitigation:** Backend is source of truth, frontend caches temporarily
- **Risk:** localStorage quota exceeded
- **Mitigation:** Only persist essential state, clear old sessions

---

### Task 1.12: Self-Study Mode Implementation

**Deliverable:** Self-study quiz mode for cards not currently due in SRS.

**Technical Requirements:**
- Query cards NOT currently due in SRS
- Prioritize cards not recently practiced
- Quiz-style interface (show question, user answers, immediate feedback)
- Cards cycle until answered correctly in session
- No effect on SRS scheduling
- Track practice history in database

**Database Query:**
```sql
SELECT c.* FROM characters c
JOIN user_progress p ON c.id = p.character_id
WHERE p.next_review_date > datetime('now')
  AND p.introduced = 1
ORDER BY 
  COALESCE(
    (SELECT MAX(practiced_at) FROM practice_history 
     WHERE character_id = c.id AND practice_mode = 'self-study'),
    datetime('1970-01-01')
  ) ASC
LIMIT 20
```

**UI Components:**
- `SelfStudy.tsx` - main component (similar to SRS session)
- Reuse question/answer components from SRS
- Different feedback styling (educational, not performance-focused)

**Key Differences from SRS:**
- Cards don't advance SRS intervals
- Can practice same card multiple times
- More forgiving (show hints if struggling)
- Educational tone (learning, not testing)

**Steps:**
1. Create backend command to fetch self-study cards
2. Create self-study session component
3. Implement question/answer flow (similar to SRS)
4. Add practice history recording
5. Implement card cycling for incorrect answers
6. Add completion screen with encouragement
7. Test with various card states

**Success Criteria:**
- ✅ Fetches cards not currently due in SRS
- ✅ Prioritizes least recently practiced
- ✅ Quiz interface functional
- ✅ Incorrect cards cycle until correct
- ✅ Practice recorded in database
- ✅ No effect on SRS intervals
- ✅ Session can be repeated immediately

**Acceptance Test:**
1. Complete SRS session (no cards due)
2. Start self-study - loads 20 cards
3. Answer some cards correctly, some incorrectly
4. Verify incorrect cards cycle back
5. Complete session
6. Check practice_history table - entries recorded
7. Check user_progress table - SRS intervals unchanged

**Risk Mitigation:**
- **Risk:** Self-study conflicts with SRS due dates
- **Mitigation:** SQL query explicitly excludes due cards
- **Risk:** Users rely too much on self-study, neglect SRS
- **Mitigation:** Prominent SRS reminder on home screen

---

### Task 1.13: Progress Dashboard

**Deliverable:** Home dashboard showing user progress and study statistics.

**Technical Requirements:**
- Display total characters learned
- Show cards in SRS pool
- Display cards due today
- Show study streak (consecutive days)
- Display session history (recent 10 sessions)
- Quick action buttons (Start SRS, Start Self-Study)

**Database Queries Needed:**
```sql
-- Total learned
SELECT COUNT(*) FROM user_progress WHERE introduced = 1;

-- Cards in SRS pool
SELECT COUNT(*) FROM user_progress;

-- Cards due today
SELECT COUNT(*) FROM user_progress 
WHERE introduced = 1 AND next_review_date <= datetime('now');

-- Recent sessions
SELECT * FROM study_sessions 
ORDER BY started_at DESC LIMIT 10;

-- Study streak (consecutive days with sessions)
-- Complex query or frontend calculation
```

**UI Components:**
- `Dashboard.tsx` - main dashboard
- `StatsCard.tsx` - individual stat displays
- `SessionHistory.tsx` - recent sessions list
- `QuickActions.tsx` - action buttons

**Key Metrics to Display:**
1. **Learning Progress**
   - Total characters learned: X
   - Characters in SRS pool: Y
   - Next unlock at: Z characters to 1-week

2. **Today's Status**
   - Cards due today: N
   - Study streak: M days
   - Time studied today: H hours

3. **Recent Activity**
   - Last 10 sessions (date, mode, cards studied, accuracy)

4. **Quick Actions**
   - [Start SRS Session] (if cards due)
   - [Self-Study Practice]
   - [View Progress Details]

**Steps:**
1. Create backend commands for all stats queries
2. Create dashboard layout component
3. Implement stats cards with real data
4. Add session history display
5. Implement quick action buttons
6. Add simple data visualization (progress bars)
7. Style professionally
8. Test with various data states (new user, active user)

**Success Criteria:**
- ✅ All statistics display correctly
- ✅ Stats update in real-time after sessions
- ✅ Session history shows recent activity
- ✅ Quick actions navigate to correct modes
- ✅ Dashboard loads quickly (<500ms)
- ✅ Handles edge cases (no data, fresh user)

**Acceptance Test:**
1. Launch app - dashboard displays
2. Verify stats match database values
3. Complete SRS session - stats update
4. Check session history - new entry appears
5. Test quick actions - navigate correctly
6. Test with fresh user - shows "Get started" message

**Risk Mitigation:**
- **Risk:** Stats queries slow down dashboard load
- **Mitigation:** Use indexed queries, cache results
- **Risk:** Complex streak calculation
- **Mitigation:** Store last_study_date, calculate streak on backend

---

### Task 1.14: Phase 1 Integration Testing

**Deliverable:** Comprehensive integration tests verifying all Phase 1 features work together.

**Testing Scope:**
- Complete user journey from first launch to 20+ characters learned
- All study modes functional and interconnected
- Database integrity throughout usage
- Cross-platform compatibility (Windows primary, Mac/Linux if available)

**Test Scenarios:**

**Scenario 1: New User Onboarding**
1. Launch app for first time
2. See dashboard with 0 progress
3. Click "Start Learning"
4. View introduction for first 15 characters
5. Mark all as introduced
6. Verify SRS session shows 15 due cards

**Scenario 2: First SRS Session**
1. Start SRS session with 15 cards
2. Answer all correctly
3. Verify intervals updated (1→3 days)
4. Check dashboard - 15 cards learned
5. Verify no cards due

**Scenario 3: Multi-Day Progression**
1. Simulate 3 days passing (manually set next_review_date)
2. Verify due cards appear
3. Complete session - some correct, some incorrect
4. Verify correct cards advance (3→7 days)
5. Verify incorrect cards regress (3→1 day)

**Scenario 4: Card Unlocking**
1. Continue studying until first card reaches 7 days
2. Answer correctly
3. Verify has_reached_week flag set
4. Verify 16th character unlocked
5. View introduction for new character
6. Verify 16 cards now in SRS pool

**Scenario 5: Self-Study Mode**
1. Complete SRS (no cards due)
2. Start self-study
3. Verify loads cards not in SRS due list
4. Complete self-study session
5. Verify practice_history recorded
6. Verify SRS intervals unchanged

**Scenario 6: Progress Tracking**
1. Complete multiple sessions across modes
2. Check dashboard statistics
3. Verify session history accurate
4. Verify study streak calculates correctly
5. Check all database tables for consistency

**Integration Test Checklist:**
- [ ] Fresh database install works
- [ ] First 15 characters accessible
- [ ] Introduction screen functional
- [ ] SRS session completes successfully
- [ ] Incorrect cards cycle properly
- [ ] Answer verification accurate
- [ ] Intervals calculate correctly
- [ ] Card unlocking triggers at 1 week
- [ ] New cards add to pool correctly
- [ ] Self-study doesn't affect SRS
- [ ] Dashboard displays accurate stats
- [ ] Session history records properly
- [ ] No database constraint violations
- [ ] No frontend errors in console
- [ ] Cross-platform compatibility verified

**Success Criteria:**
- ✅ All test scenarios pass without errors
- ✅ Database integrity maintained throughout
- ✅ No data loss or corruption
- ✅ UI responsive and professional
- ✅ No console errors or warnings
- ✅ Performance acceptable (no lag)
- ✅ Works on Windows (primary), Mac/Linux if possible

**Acceptance Test:**
1. Run all 6 test scenarios sequentially
2. Verify each step completes as expected
3. Check database after each scenario
4. Review EditHistory.md - document all issues found
5. Fix critical bugs before Phase 1 completion

**Risk Mitigation:**
- **Risk:** Integration reveals architectural issues
- **Mitigation:** Fix immediately, refactor if needed
- **Risk:** Edge cases cause crashes
- **Mitigation:** Add error handling, graceful degradation

**EditHistory.md Entry:**
```
## [Date] - 1.14 - Phase 1 Integration Testing
**Task:** 1.14 - Phase 1 Integration Testing
**Status:** Complete
**Objective:** Verify all Phase 1 features work together correctly
**Test Results:**
- Scenario 1 (New User): [Pass/Fail with notes]
- Scenario 2 (First SRS): [Pass/Fail with notes]
- Scenario 3 (Multi-Day): [Pass/Fail with notes]
- Scenario 4 (Unlocking): [Pass/Fail with notes]
- Scenario 5 (Self-Study): [Pass/Fail with notes]
- Scenario 6 (Progress): [Pass/Fail with notes]
**Issues Found:**
- [List all bugs/issues discovered]
**Solutions Applied:**
- [How each issue was resolved]
**Remaining Issues:**
- [Any unresolved issues, marked for Phase 2]
**Database Integrity:** [Verified/Issues found]
**Performance:** [Acceptable/Needs optimization]
**Notes for Future:**
- [Key learnings from integration testing]
**Next Steps:** Code cleanup (Task 1.15)
```

---

### Task 1.15: Phase 1 Code Cleanup and Documentation

**Deliverable:** Clean, documented, production-ready Phase 1 codebase.

**Cleanup Scope:**
- Remove debug code and console.logs
- Remove unused imports and dependencies
- Standardize code formatting
- Add TSDoc/JSDoc comments to public APIs
- Update README.md with Phase 1 features
- Verify all files have proper headers
- Remove TODO comments (move to issues)

**Documentation Tasks:**

**1. Code Documentation**
- Add function/component descriptions
- Document complex algorithms (SRS)
- Add prop type documentation (TypeScript interfaces)
- Document database schema in code comments

**2. User Documentation**
- Update README.md with current features
- Add "How to Use" section
- Document study modes
- Add screenshots/GIFs of UI

**3. Developer Documentation**
- Update architecture notes
- Document API (Tauri commands)
- Add contribution guidelines
- Document build/test process

**Formatting Standards:**
- Rust: rustfmt with default settings
- TypeScript: Prettier with 2-space indent
- SQL: Consistent capitalization (keywords uppercase)

**Steps:**
1. Run linters on all code (cargo clippy, eslint)
2. Fix all linter warnings
3. Run formatters (rustfmt, prettier)
4. Remove debug code and unused imports
5. Add missing documentation comments
6. Update README.md
7. Create CHANGELOG.md for Phase 1
8. Review EditHistory.md for completeness
9. Tag Phase 1 release in git

**Success Criteria:**
- ✅ No linter warnings
- ✅ All code formatted consistently
- ✅ No debug console.logs in production code
- ✅ Public APIs documented
- ✅ README.md reflects current state
- ✅ CHANGELOG.md created
- ✅ Git history clean and organized

**Acceptance Test:**
1. Run `cargo clippy` - no warnings
2. Run `npm run lint` - no errors
3. Build production version - compiles successfully
4. Review code - no obvious issues
5. Read README.md - accurate and helpful
6. Check CHANGELOG.md - complete

**Cleanup Checklist:**
- [ ] All Rust code: cargo fmt, cargo clippy
- [ ] All TypeScript: prettier, eslint
- [ ] Remove all console.log debug statements
- [ ] Remove unused imports
- [ ] Remove commented-out code
- [ ] Add JSDoc to all exported functions
- [ ] Add TSDoc to all React components
- [ ] Update README.md
- [ ] Create CHANGELOG.md
- [ ] Review EditHistory.md
- [ ] Create git tag "v0.1.0-phase1"

**CHANGELOG.md Template:**
```markdown
# Changelog

## [0.1.0] - Phase 1: Core Mandarin Learning - 2025-XX-XX

### Added
- Complete data processing pipeline (CC-CEDICT, SUBTLEX-CH)
- SQLite database with 100,000+ characters and words
- Spaced repetition algorithm (SM-2 based)
- Character introduction screen
- SRS study session with answer verification
- Self-study practice mode
- Progress dashboard with statistics
- Session history tracking

### Features
- 15 starting characters, unlock as you progress
- Frequency-based learning (learn most common first)
- Answer verification (case-insensitive, pinyin/definition)
- Cards cycle until correct in session
- Professional, clean UI

### Technical
- Tauri + Rust + React + TypeScript
- SQLite for data storage
- Cross-platform (Windows, Mac, Linux)
- ~300MB database size

### Known Limitations
- Mandarin only (no Cantonese yet)
- No stroke order (Phase 2)
- No speech features (Phase 2)
- No multiple choice mode (Phase 2)

### License & Attribution
- Application code: MIT License
- Data sources: CC-CEDICT (CC BY-SA), SUBTLEX-CH (Educational), Make Me a Hanzi (Arphic/LGPL)
- See DATA-LICENSES.md for details
```

**EditHistory.md Entry:**
```
## [Date] - 1.15 - Phase 1 Code Cleanup
**Task:** 1.15 - Phase 1 Code Cleanup and Documentation
**Status:** Complete
**Objective:** Clean and document Phase 1 codebase for production
**Actions Taken:**
- Ran cargo clippy and fixed all warnings
- Ran eslint and fixed all errors
- Formatted all code (rustfmt, prettier)
- Removed debug code
- Added documentation comments
- Updated README.md
- Created CHANGELOG.md
**Code Quality:**
- Linter warnings: 0
- Test coverage: [X%]
- Documentation: [Complete/Partial]
**Documentation Updates:**
- README.md: Updated with Phase 1 features
- CHANGELOG.md: Created
- Code comments: Added to all public APIs
**Git Status:**
- Tagged: v0.1.0-phase1
- All changes committed
**Notes for Future:**
- Maintain code quality standards in Phase 2
- Keep CHANGELOG.md updated
**Next Steps:** Phase 1 completion gate, then Phase 2 planning
```

---

## Phase 1 Completion Gate

**Phase 1 Complete When:**
- ✅ All tasks 1.1-1.15 success criteria met
- ✅ Integration testing passed (Task 1.14)
- ✅ Code cleanup complete (Task 1.15)
- ✅ All EditHistory.md entries complete
- ✅ README.md and CHANGELOG.md up to date
- ✅ Git tagged v0.1.0-phase1

**Phase 1 Acceptance Criteria:**

**Functional Requirements:**
1. ✅ User can download and build database from datasets
2. ✅ Application launches without errors
3. ✅ First 15 characters available for learning
4. ✅ Character introductions work correctly
5. ✅ SRS session functional (questions, answers, feedback)
6. ✅ Answer verification accurate
7. ✅ Card unlocking triggers at 1-week interval
8. ✅ Self-study mode accessible and functional
9. ✅ Dashboard displays accurate statistics
10. ✅ All database operations complete successfully

**Technical Requirements:**
1. ✅ No compiler errors or warnings
2. ✅ No runtime errors in normal usage
3. ✅ Database integrity maintained
4. ✅ Cross-platform compatible (Windows verified)
5. ✅ Performance acceptable (<1 second for queries)
6. ✅ Code formatted and documented
7. ✅ License compliance complete

**Quality Requirements:**
1. ✅ Professional UI appearance
2. ✅ Consistent user experience
3. ✅ No data loss during normal operation
4. ✅ Helpful error messages
5. ✅ Documentation clear and accurate

**Phase 1 Review Process:**

**1. Code Review (Self)**
- Review all code for quality
- Check for potential bugs
- Verify best practices followed
- Ensure consistent style

**2. Testing Review**
- Re-run all acceptance tests
- Verify integration tests pass
- Test edge cases
- Test on fresh database

**3. Documentation Review**
- README.md accurate
- CHANGELOG.md complete
- EditHistory.md has all entries
- License files present

**4. Reverification**
- Build from scratch (clean install)
- Download datasets
- Build database
- Run application
- Complete full user journey
- Verify all features work

**Phase 1 Completion Checklist:**
- [ ] All 15 tasks completed
- [ ] All success criteria met
- [ ] Integration testing passed
- [ ] Code cleanup complete
- [ ] Documentation updated
- [ ] No critical bugs remaining
- [ ] Performance acceptable
- [ ] License compliance verified
- [ ] Git repository clean
- [ ] Tagged v0.1.0-phase1

**Graduation to Phase 2:**
Once all checklist items are complete:
1. Create backup of Phase 1 codebase
2. Document Phase 1 learnings in EditHistory.md
3. Review specifications for Phase 2
4. Plan Phase 2 first tasks
5. Begin Phase 2 development

**Output:**
- Working Chinese learning application (MVP)
- Spaced repetition with 3000+ characters
- Self-study practice mode
- Progress tracking
- Professional quality codebase
- Complete documentation
- Ready for Phase 2 enhancements

---

*Phase 1 complete! User can now learn Mandarin Chinese using spaced repetition with frequency-prioritized characters.*