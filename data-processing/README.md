# Data Processing Tools

This directory contains Rust binaries for processing Chinese language datasets and building the application database.

## Tools

### 1. download-datasets
Downloads required datasets from their source repositories.

**Usage:**
```bash
cd data-processing
cargo run --bin download-datasets
```

**What it does:**
- Downloads CC-CEDICT dictionary (~4 MB compressed)
- Extracts to `datasets/cedict_ts.u8`
- Displays instructions for SUBTLEX-CH manual download
- Shows license attribution notices

**Output:**
```
datasets/
├── cedict_ts.u8           # CC-CEDICT dictionary (UTF-8, auto-downloaded)
└── SUBTLEX-CH/            # Frequency data (GBK encoding, manual download)
    ├── SUBTLEX-CH-CHR.txt
    └── SUBTLEX-CH-WF_PoS.txt
```

**Important:** SUBTLEX-CH files use GBK (Chinese GB2312) encoding, not UTF-8. This is normal and expected. The parsing scripts will handle both encodings correctly.

### 2. populate-component-characters
Populates the `component_characters` field for all words in the database.

**Usage:**
```bash
cd data-processing
cargo run --bin populate-component-characters
```

**What it does:**
- Reads all single characters from the database
- For each word, extracts its component characters
- Looks up the ID of each component character
- Stores component IDs as comma-separated values
- Updates 106,000+ words with component relationships

**Example:**
- Word: "好" (good) = 女 (woman) + 子 (child)
- Component IDs: "123,456" (IDs of 女 and 子)
- Used for smart word introduction (only after learning components)

**Output:**
```
=== Populating Component Characters ===
Building character lookup map...
  ✓ Loaded 10173 single characters

Processing words...
  ✓ Updated: 106284 words
  ⊗ Skipped: 2017 words (missing components like English letters)
```

### 3. build-database
Builds the SQLite database from parsed data.

## Dependencies

All dependencies are managed in `Cargo.toml`:

- **reqwest**: HTTP client for downloading files
- **tokio**: Async runtime
- **flate2**: Gzip decompression
- **sha2**: File integrity verification
- **rusqlite**: SQLite database interface
- **serde**: Serialization/deserialization
- **csv**: CSV file parsing

## Manual Download: SUBTLEX-CH

SUBTLEX-CH must be downloaded manually due to academic licensing:

1. Visit: https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch
2. Download both files:
   - `SUBTLEX-CH-CHR.zip` (character frequencies)
   - `SUBTLEX-CH-WF_PoS.zip` (word frequencies)
3. Extract to `datasets/SUBTLEX-CH/`

**Required citation:**
```
Cai, Q., & Brysbaert, M. (2010). SUBTLEX-CH: Chinese Word and Character
Frequencies Based on Film Subtitles. PLoS ONE, 5(6), e10729.
https://doi.org/10.1371/journal.pone.0010729
```

## License Compliance

The download script displays license information for each dataset:

- **CC-CEDICT**: CC BY-SA 4.0
- **SUBTLEX-CH**: Free for research/educational use (citation required)

Full license details are in `DATA-LICENSES.md` at the project root.

## Development

**Run tests:**
```bash
cargo test --bin download-datasets
```

**Build release version:**
```bash
cargo build --release --bin download-datasets
```

The release binary will be in `target/release/download-datasets.exe`.

## Troubleshooting

**Issue:** "Connection timeout" when downloading CC-CEDICT

**Solution:**
- Check internet connection
- MDBG server may be temporarily down
- Try again later or download manually from https://www.mdbg.net/chinese/dictionary?page=cedict

**Issue:** SUBTLEX-CH website is unavailable

**Solution:**
- Dataset may need to be requested via email to the authors
- Alternative: Use CC-CEDICT frequency data only (lower quality)

## Next Steps

After downloading datasets:
1. Run `parse-cedict` to convert dictionary to JSON
2. Run `build-database` to create SQLite database
3. Database will be bundled with the application in `src-tauri/`
