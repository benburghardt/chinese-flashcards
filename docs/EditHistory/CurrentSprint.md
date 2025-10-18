# Current Sprint - Edit History

**Purpose:** Rolling log of the last 5-10 completed tasks for quick context loading.

**Note:** Older entries are archived to phase-specific files when sprint is complete.

---

## How to Use This File

1. **After completing a task:** Add entry at the top (newest first)
2. **Keep only last 5-10 entries:** Archive older ones to phase files
3. **Provide to Claude Code:** Always include this file at session start
4. **Entry Format:** Use Brief or Detailed template based on complexity

---

## Entry Templates

### Brief Entry (Most Tasks)
```markdown
## [YYYY-MM-DD] - X.X - Task Name
**Status:** Complete/In Progress/Blocked
**Key Decisions:** [1-2 sentence summary]
**Issues:** [Brief description or "None"]
**Files:** [Key files created/modified]
**Tests:** [Pass/Fail with brief result]
**Next:** Task X.X
```

### Detailed Entry (Complex/Problematic Tasks)
```markdown
## [YYYY-MM-DD] - X.X - Task Name [DETAILED]
**Task:** [Full task number and name]
**Status:** Complete/In Progress/Blocked
**Objective:** [What you were trying to accomplish]
**Decisions Made:**
- [Decision 1 with rationale]
- [Decision 2 with rationale]
**Issues Encountered:**
- [Bug/challenge with description]
**Solutions Applied:**
- [How issues were resolved]
**Code Changes:**
- [Files created]
- [Files modified]
- [Key functions/components added]
**Testing Results:**
- [Detailed test outcomes]
**Notes for Future:**
- [Lessons learned]
- [Technical debt incurred]
**Time Spent:** [Optional]
**Next Steps:** [Next task]
```

---

## Current Sprint Entries

## [2025-10-17] - 0.5 - Database Schema Design
**Status:** Complete
**Key Decisions:**
- Single `characters` table for both characters and words (with `is_word` flag)
- Included `previous_interval_days` for undo functionality in spaced repetition
- All foreign keys use `ON DELETE CASCADE` for referential integrity
- Strategic indexes on frequently-queried columns (frequency, review date, character lookup)
- `app_settings` stores JSON values for flexibility
- Schema versioning from the start for future migrations
**Issues:** None
**Files Created:**
- `src-tauri/src/database/schema.sql` (Complete SQL schema for all phases)
- `src-tauri/src/database/README.md` (Schema documentation)
**Schema Tables:**
1. `characters` - Dictionary entries (characters and words)
2. `user_progress` - Spaced repetition tracking
3. `practice_history` - Non-SR practice attempts
4. `study_sessions` - Session statistics
5. `app_settings` - User preferences
6. `schema_version` - Migration tracking
**Design Highlights:**
- Supports all 3 phases (Mandarin MVP, Enhanced Features, Cantonese)
- Optimized indexes for ~120,000 character entries
- Foreign key constraints with CASCADE deletes
- Timestamp-based for time-of-day analytics
- Expected DB size: ~60 MB after 1 year of use
**Next:** Phase 0 Complete! Ready for Phase 1 - Task 1.1

## [2025-10-17] - 0.4 - Set Up License Compliance
**Status:** Complete
**Key Decisions:** All license files were already in place from initial setup. Updated README.md with comprehensive documentation including data sources, licenses, and non-commercial/educational use statement.
**Issues:** None
**Files Verified:**
- `LICENSES/CC-BY-SA-4.0.txt` (CC-CEDICT license)
- `LICENSES/LGPL-2.1.txt` (Make Me a Hanzi license)
- `LICENSES/Arphic-Public-License.txt` (Arphic font license)
- `LICENSES/SUBTLEX-CH-Citation.txt` (Academic citation)
- `LICENSE.md` (MIT license for application code)
- `DATA-LICENSES.md` (Detailed data source attributions)
- `CREDITS.md` (Acknowledgments)
**Files Modified:**
- `README.md` (Added features, data sources, licenses, development setup)
**Tests:**
- ✅ All 4 license texts present in LICENSES/ directory
- ✅ README.md includes data sources section
- ✅ README.md states "non-commercial, educational"
- ✅ All license files committed to git
**Next:** Task 0.5 - Database Schema Design

## [2025-10-17] - 0.3 - Create Project Repository Structure
**Status:** Complete
**Key Decisions:** Copied Extended-Flashcards base structure as foundation. Updated package.json to reflect Chinese Learning Tool identity. User opted not to use Prettier (removed .prettierrc).
**Issues:** Initially missed tsconfig.node.json file - discovered during build test and resolved.
**Files Created:**
- `.gitignore` (excludes datasets, build artifacts, node_modules)
- `data-processing/src/` directory
- `datasets/` directory (gitignored)
**Files Copied from Extended-Flashcards:**
- `src/` (React TypeScript frontend)
- `src-tauri/` (Rust backend)
- `package.json` (updated for this project)
- `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`
**Files Modified:**
- `package.json` (name: chinese-learning-tool, version: 0.1.0, updated description/repo/keywords)
**Tests:**
- ✅ npm install successful (118 packages, 0 vulnerabilities)
- ✅ Project structure verified
- ✅ Tauri dev build successful (Vite + Rust compiled and running)
- ✅ Application launches correctly
**Next:** Task 0.4 - Database Schema Design

## [2025-10-17] - 0.2 - Install Additional Dependencies
**Status:** Complete
**Key Decisions:** Created configuration files for code formatting (EditorConfig, Prettier, rustfmt). Clarified that Rust crates (rusqlite, serde, tokio, csv) are library dependencies to be added to Cargo.toml in future tasks, not global installs.
**Issues:** Initial rustfmt.toml included nightly-only features; removed them for stable Rust compatibility.
**Files Created:**
- `.editorconfig` (cross-editor formatting rules)
- `.prettierrc` (TypeScript/JavaScript formatting)
- `rustfmt.toml` (Rust formatting)
**Tests:**
- ✅ rustfmt successfully formats Rust code
- ✅ Test Rust file compiles and runs correctly
- ✅ Verified access to Rust crate ecosystem (rusqlite, serde, tokio, csv)
**Notes:** IDE extensions (rust-analyzer, ESLint, Prettier) are user-installed in VS Code and cannot be verified programmatically. User should verify these are installed.
**Next:** Task 0.3 - Create Project Repository Structure

## [2025-10-17] - 0.1 - Verify Development Environment
**Status:** Complete
**Key Decisions:** Verified all required tools are installed and working correctly. Tested with Extended-Flashcards reference project.
**Issues:** None - all tools at appropriate versions
**Files:** None created (verification task)
**Tests:** ✅ Extended-Flashcards builds and runs successfully (compiled in 11.67s, 1 minor warning)
**Tool Versions:**
- Node.js: v22.19.0 (exceeds v18+ requirement)
- npm: 11.6.0
- Rust: 1.89.0 (stable)
- Cargo: 1.89.0
- Tauri CLI: 2.8.4
**Next:** Task 0.2 - Install Additional Dependencies

---

## Instructions for Archiving

When CurrentSprint.md has more than 10 entries:
1. Move oldest entries to appropriate phase file (e.g., `Phase1-CoreMVP.md`)
2. Keep most recent 5-10 entries here
3. Update DevSummary.md if any key decisions were made

---

*Sprint Started: 2025-10-17*
