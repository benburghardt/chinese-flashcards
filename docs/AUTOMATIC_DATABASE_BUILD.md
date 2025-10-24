# Automatic Database Build System

## Overview

The application now automatically checks for and builds the master Chinese character database before running. This eliminates the need to manually build the database and ensures a smooth first-run experience.

## How It Works

When you run `npm run tauri:dev` or `npm run tauri:build`, the following sequence occurs:

### 1. Pre-Build Check (`scripts/check-database.js`)

The script automatically runs and performs these checks:

```
┌─────────────────────────────────────────────────────┐
│  1. Check if database exists                         │
│     Location: src-tauri/resources/chinese.db        │
│     ├─ Exists & > 1 MB → ✅ Continue                │
│     ├─ Exists but empty → Delete and rebuild        │
│     └─ Doesn't exist → Build from datasets          │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│  2. Check if datasets are downloaded                 │
│     ├─ CC-CEDICT (datasets/cedict_ts.u8)            │
│     └─ SUBTLEX-CH (datasets/SUBTLEX-CH/)            │
│                                                      │
│     Missing? → Run download-datasets binary         │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│  3. Build database                                   │
│     Run: cargo run --bin build-database             │
│     ├─ Parse CC-CEDICT (~120,628 entries)           │
│     ├─ Parse SUBTLEX-CH frequency data              │
│     ├─ Merge dictionaries with frequency ranks      │
│     └─ Create SQLite database                       │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│  4. Verify database                                  │
│     ├─ Check file exists                            │
│     ├─ Verify size > 1 MB                           │
│     └─ Ready to start application! 🎉              │
└─────────────────────────────────────────────────────┘
```

## What Gets Created

**Final Database: `src-tauri/resources/chinese.db`**
- Size: ~26 MB
- Characters: 10,173 individual characters
- Words: 108,299 multi-character words
- Total entries: 118,472

**Schema:**
- `characters` table: All characters and words with pinyin, definitions, frequency ranks
- `user_progress` table: Individual user learning progress (initially empty)
- `study_sessions` table: Session history tracking (initially empty)
- `app_settings` table: Application configuration
- `schema_version` table: Database version tracking

## First-Time Setup

### Prerequisites

1. **Install Rust** (for running data-processing tools)
   ```bash
   # Install from https://rustup.rs
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Download datasets**
   ```bash
   cd data-processing
   cargo run --bin download-datasets
   ```

3. **Manual SUBTLEX-CH Download** (required)
   - Visit: https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch
   - Download:
     - `SUBTLEX-CH-CHR.zip` (character frequencies)
     - `SUBTLEX-CH-WF_PoS.zip` (word frequencies)
   - Extract both to: `datasets/SUBTLEX-CH/`
   - Ensure files are named (without .zip extension):
     - `SUBTLEX-CH-CHR`
     - `SUBTLEX-CH-WF_PoS`

### Run Application

```bash
npm run tauri:dev
```

On first run, you'll see:
```
🔍 Checking database status...
❌ Database not found
📦 Checking datasets...
✅ CC-CEDICT found
✅ SUBTLEX-CH found
🔨 Building database...
[build output...]
✅ Database built successfully (25.89 MB)
🎉 Ready to start application!
```

Subsequent runs will detect the existing database:
```
🔍 Checking database status...
✅ Database exists and appears populated (25.89 MB)
```

## Manual Database Rebuild

If you need to rebuild the database (e.g., after dataset updates):

### Option 1: Delete and auto-rebuild
```bash
# Delete the database
rm src-tauri/resources/chinese.db

# Run the app (will rebuild automatically)
npm run tauri:dev
```

### Option 2: Manual build
```bash
cd data-processing
cargo run --bin build-database
```

## Troubleshooting

### Database build fails

**Problem:** `cargo: command not found`

**Solution:** Install Rust toolchain from https://rustup.rs

---

**Problem:** `Failed to parse CC-CEDICT`

**Solution:**
1. Check `datasets/cedict_ts.u8` exists
2. Re-download: `cd data-processing && cargo run --bin download-datasets`

---

**Problem:** `SUBTLEX-CH not found`

**Solution:** Download manually from the UGent website (see First-Time Setup above)

---

**Problem:** Database exists but shows 0 characters

**Solution:**
1. Delete corrupted database: `rm src-tauri/resources/chinese.db`
2. Rebuild: `npm run tauri:dev`

### Checking database state

Use the verification tool:
```bash
cd data-processing
cargo run --bin check-db-state
```

Output:
```
=== Checking Database State ===
Schema version: 1

=== Character Count ===
Total characters: 10173

=== User Progress ===
Characters in user_progress: 0
Introduced characters: 0
Not introduced (ready to learn): 0
```

## Implementation Details

### Files

- **`scripts/check-database.js`**: Main pre-build check script
- **`scripts/README.md`**: Documentation for build scripts
- **`data-processing/src/bin/build-database.rs`**: Database builder
- **`data-processing/src/bin/download-datasets.rs`**: Dataset downloader
- **`data-processing/src/bin/check-db-state.rs`**: Database verification tool

### npm Scripts

**`package.json`:**
```json
{
  "scripts": {
    "check-db": "node scripts/check-database.js",
    "tauri:dev": "npm run check-db && cargo tauri dev",
    "tauri:build": "npm run check-db && cargo tauri build"
  }
}
```

The `check-db` script runs automatically before both dev and build commands.

### Integration with Tauri

The database is bundled with the application in the `resources` directory:

**`src-tauri/tauri.conf.json`:**
```json
{
  "bundle": {
    "resources": [
      "resources/chinese.db"
    ]
  }
}
```

On first application run, the master database is copied from `resources/` to the user's data directory, then user-specific tables (`user_progress`, `study_sessions`) are populated as the user learns.

## Benefits

1. **No manual database build step** - Automated in development workflow
2. **Validates data integrity** - Checks file size to detect corruption
3. **Clear error messages** - Guides user through manual SUBTLEX-CH download if needed
4. **Idempotent** - Safe to run multiple times, only rebuilds when necessary
5. **Fast subsequent runs** - Skips build if database already exists and is valid
