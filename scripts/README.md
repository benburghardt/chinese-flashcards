# Build Scripts

## check-database.js

Automatically checks for and builds the master Chinese character database before running the application.

### What it does

1. **Checks if database exists** at `src-tauri/resources/chinese.db`
   - If exists and appears populated (> 1 MB): ✅ Continue
   - If exists but empty: Delete and rebuild
   - If doesn't exist: Build from scratch

2. **Checks if datasets are downloaded**
   - CC-CEDICT (`datasets/cedict_ts.u8`)
   - SUBTLEX-CH files (`datasets/SUBTLEX-CH/`)

3. **Downloads datasets if missing**
   - Runs `cargo run --bin download-datasets` from `data-processing/`
   - Auto-downloads CC-CEDICT
   - Prompts for manual SUBTLEX-CH download if needed

4. **Builds database**
   - Runs `cargo run --bin build_database` from `data-processing/`
   - Parses ~28,000+ dictionary entries
   - Merges with frequency data
   - Creates SQLite database at `src-tauri/resources/chinese.db`

5. **Verifies database was created successfully**
   - Checks file exists and has reasonable size (> 1 MB)

### Usage

Automatically runs before `npm run tauri:dev` and `npm run tauri:build`.

You can also run it manually:
```bash
npm run check-db
```

### Manual SUBTLEX-CH Download

If the script prompts for manual SUBTLEX-CH download:

1. Visit: https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch
2. Download both files:
   - `SUBTLEX-CH-CHR.zip` (character frequencies)
   - `SUBTLEX-CH-WF_PoS.zip` (word frequencies)
3. Extract to `datasets/SUBTLEX-CH/`
4. Ensure files are named (no extension):
   - `SUBTLEX-CH-CHR`
   - `SUBTLEX-CH-WF_PoS`
5. Run: `npm run tauri:dev`

### Troubleshooting

**Problem:** Script fails with "cargo: command not found"

**Solution:** Install Rust toolchain from https://rustup.rs

---

**Problem:** Script fails to download CC-CEDICT

**Solution:** Download manually from https://www.mdbg.net/chinese/dictionary?page=cedict and place at `datasets/cedict_ts.u8`

---

**Problem:** Database build fails with parsing errors

**Solution:** Check that dataset files are:
- Not corrupted
- Using correct encoding (CC-CEDICT: UTF-8, SUBTLEX-CH: GBK)
- Named correctly without extra extensions
