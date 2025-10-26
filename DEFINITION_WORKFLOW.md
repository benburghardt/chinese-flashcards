# Definition Review and Update Workflow

This document explains how to review and update character/word definitions without modifying the original CEDICT file.

## Overview

The system allows you to:
1. Generate a review list of characters with problematic definitions
2. Manually select the best definitions
3. Apply updates to the database
4. Track all manual changes separately from CEDICT (for attribution)

## Why This Approach?

- **Preserves CEDICT integrity**: Original file stays untouched
- **Tracks changes**: All manual overrides are version-controlled in `definition_overrides.json`
- **Respects copyright**: Changes are separate from source data
- **Reproducible**: Can be reapplied when rebuilding database

---

## Step 1: Generate Review List

```bash
cd data-processing
cargo run --bin generate-definition-review
```

**What it does:**
- Parses CEDICT to find duplicate entries (after filtering)
- Analyzes database for definition issues
- Creates `definition_review.csv` with 1,842 items needing review

**What gets flagged:**
- Multiple CEDICT entries (different meanings to choose from)
- Contains historical terms (dynasty, historical, ancient, classical, literary)
- Too short definitions (< 3 characters)
- Very long (only when combined with other issues)

**What's excluded:**
- Items with frequency_rank = 999999 (not worth learning)
- Items where "very long" is the only issue
- Items already filtered: surname, variant, used in, abbr.

---

## Step 2: Review and Select Definitions

Open `definition_review.csv` in your spreadsheet editor.

### CSV Columns

| Column | Description |
|--------|-------------|
| **ID** | Database ID (don't change) |
| **Character** | The character/word |
| **Pinyin** | Pronunciation |
| **Type** | "char" or "word" |
| **Frequency Rank** | Lower = more common |
| **Current Definition** | What's currently in the database |
| **Flags** | Why this needs review |
| **Updated Definition** | **Fill this in with your choice** |

### For Multiple CEDICT Entries

The "Current Definition" column shows all options separated by ` | `.

**Example:**
```
Character: 它
Current Definition: it (inanimate) | it (for animals)
```

Pick the best one:
```
Updated Definition: it (for inanimate objects and animals)
```

Or pick one of the originals:
```
Updated Definition: it (inanimate)
```

### For Historical Terms

Choose whether to prioritize modern or historical meaning:
```
Character: 夏
Current Definition: Xia dynasty; summer
Updated Definition: summer
```

### Leave Blank to Keep Current

If you don't want to change a definition, leave "Updated Definition" empty.

---

## Step 3: Apply Updates

```bash
cd data-processing
cargo run --bin apply-definition-updates
```

**What it does:**
1. Reads your edits from `definition_review.csv`
   (Handles quotes and special characters properly)
2. Updates database: `src-tauri/chinese.db`
3. Saves override history: `definition_overrides.json`

**Output:**
```
=== Applying Definition Updates ===

📖 Reading definition updates from CSV...
  ✓ Found 42 definition updates
  ⊗ Skipped 1800 items (no changes)

💾 Applying updates to database...
  ✓ Updated: 它 → it (for inanimate objects and animals)
  ✓ Updated: 夏 → summer
  ...

📝 Saving override history...
  ✓ Saved to ../definition_overrides.json

✅ Definition updates applied successfully!
```

**Important:** The app automatically applies all overrides from `definition_overrides.json` on every startup. This means:
- You don't need to manually reapply overrides
- Changes persist even if you rebuild the database
- Simply restart the app after running the apply script to see your changes

---

## Step 4: Version Control

```bash
git add definition_overrides.json
git commit -m "Update definitions for common characters"
```

**Why commit `definition_overrides.json`?**
- Tracks all manual changes separate from CEDICT
- Proper attribution (your edits vs. source data)
- Can be reapplied after rebuilding database
- Transparency for copyright compliance

---

## Override History Format

`definition_overrides.json` contains:

```json
[
  {
    "character_id": 42,
    "character": "它",
    "pinyin": "ta1",
    "original_definition": "it (inanimate) | it (for animals)",
    "updated_definition": "it (for inanimate objects and animals)",
    "reason": "Multiple CEDICT entries (2)",
    "updated_at": "2025-01-15T10:30:00Z"
  }
]
```

This provides a complete audit trail of all manual definition changes.

---

## Rebuilding Database

When you rebuild the database from scratch:

```bash
cd data-processing
cargo run --bin build-database
```

**Your manual definition updates are automatically applied!** The build process:
1. Creates fresh database from CEDICT
2. Populates component characters
3. Calculates introduction ranks
4. **Automatically applies `definition_overrides.json`**
5. Verifies database

No need to manually run `apply-definition-updates` after rebuilding - it's integrated into the build process.

---

## Tips

### Efficient Review

1. **Sort by Frequency Rank** - Review most common characters first
2. **Filter by Flag** - Focus on "Multiple CEDICT entries" first
3. **Batch similar items** - Review all historical terms together

### Definition Guidelines

- **Be concise** - Flashcards need short, clear definitions
- **Prioritize modern usage** - Unless learning classical Chinese
- **Remove parentheticals** - If they're not essential
- **Combine similar meanings** - "big; large" instead of picking one

### Example Edits

```csv
# Multiple meanings - pick the most common
它,ta1,it (inanimate) | it (for animals),it (for objects and animals)

# Historical term - use modern meaning
夏,xia4,Xia dynasty; summer,summer

# Too long - shorten
...,[very long definition],concise version

# Keep original - leave blank
了,le5,modal particle...,
```

---

## Summary

1. `generate-definition-review` → Creates CSV
2. Edit "Updated Definition" column → Your manual review
3. `apply-definition-updates` → Updates database + tracks changes
4. Commit `definition_overrides.json` → Version control

This workflow keeps CEDICT intact while allowing high-quality manual curation that's tracked and reproducible.
