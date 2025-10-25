use rusqlite::Connection;
use std::fs::File;
use std::io::Write;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
struct DefinitionOverride {
    character_id: i32,
    character: String,
    pinyin: String,
    original_definition: String,
    updated_definition: String,
    reason: String,
    updated_at: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Applying Definition Updates ===\n");

    // Read CSV file
    let csv_path = "../definition_review.csv";
    let mut reader = csv::Reader::from_path(csv_path)?;

    let mut updates = Vec::new();
    let mut skipped = 0;

    println!("📖 Reading definition updates from CSV...");

    for result in reader.records() {
        let record = result?;

        // CSV columns: ID, Character, Pinyin, Type, Frequency Rank, Current Definition, Flags, Updated Definition
        let id: i32 = record.get(0).unwrap_or("").parse().unwrap_or(0);
        let character = record.get(1).unwrap_or("").to_string();
        let pinyin = record.get(2).unwrap_or("").to_string();
        let current_def = record.get(5).unwrap_or("").to_string();
        let flags = record.get(6).unwrap_or("").to_string();
        let updated_def = record.get(7).unwrap_or("").trim().to_string();

        // Skip if no update provided
        if updated_def.is_empty() {
            skipped += 1;
            continue;
        }

        // Skip if update is same as current
        if updated_def == current_def {
            skipped += 1;
            continue;
        }

        updates.push((id, character, pinyin, current_def, updated_def, flags));
    }

    println!("  ✓ Found {} definition updates", updates.len());
    println!("  ⊗ Skipped {} items (no changes)", skipped);

    if updates.is_empty() {
        println!("\n⚠️  No updates to apply. Fill in the 'Updated Definition' column in the CSV.");
        return Ok(());
    }

    // Apply updates to database
    println!("\n💾 Applying updates to database...");
    let db_path = "../src-tauri/chinese.db";
    let conn = Connection::open(db_path)?;

    let mut overrides = Vec::new();
    let timestamp = chrono::Utc::now().to_rfc3339();

    for (id, character, pinyin, original_def, updated_def, flags) in updates {
        // Update database
        conn.execute(
            "UPDATE characters SET definition = ?1, updated_at = datetime('now') WHERE id = ?2",
            rusqlite::params![&updated_def, id]
        )?;

        // Track override for version control
        overrides.push(DefinitionOverride {
            character_id: id,
            character: character.clone(),
            pinyin,
            original_definition: original_def,
            updated_definition: updated_def.clone(),
            reason: flags,
            updated_at: timestamp.clone(),
        });

        println!("  ✓ Updated: {} → {}", character, &updated_def[..updated_def.len().min(60)]);
    }

    // Save overrides to JSON file for tracking
    println!("\n📝 Saving override history...");
    let overrides_path = "../definition_overrides.json";

    // Load existing overrides if file exists
    let mut all_overrides: Vec<DefinitionOverride> = if std::path::Path::new(overrides_path).exists() {
        let file_content = std::fs::read_to_string(overrides_path)?;
        serde_json::from_str(&file_content).unwrap_or_else(|_| Vec::new())
    } else {
        Vec::new()
    };

    // Add new overrides
    all_overrides.extend(overrides);

    // Write back to file
    let json = serde_json::to_string_pretty(&all_overrides)?;
    let mut file = File::create(overrides_path)?;
    file.write_all(json.as_bytes())?;

    println!("  ✓ Saved to {}", overrides_path);

    println!("\n✅ Definition updates applied successfully!");
    println!("\nSummary:");
    println!("  - Database updated: {}", db_path);
    println!("  - Override history: {}", overrides_path);
    println!("  - Total overrides tracked: {}", all_overrides.len());
    println!("\n💡 Tip: Commit definition_overrides.json to version control");
    println!("   This tracks all manual changes separate from CEDICT.");

    Ok(())
}
