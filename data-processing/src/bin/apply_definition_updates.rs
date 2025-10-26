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

/// Apply definition updates from CSV or JSON override file
pub fn apply_definition_updates_from_csv(csv_path: &str, db_path: &str) -> Result<Vec<DefinitionOverride>, Box<dyn std::error::Error>> {
    if !std::path::Path::new(csv_path).exists() {
        println!("  ⊗ CSV file not found: {}", csv_path);
        return Ok(Vec::new());
    }

    let mut reader = csv::ReaderBuilder::new()
        .flexible(true)  // Handle variable column counts
        .from_path(csv_path)?;

    let mut updates = Vec::new();
    let mut skipped = 0;

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
    if skipped > 0 {
        println!("  ⊗ Skipped {} items (no changes)", skipped);
    }

    if updates.is_empty() {
        return Ok(Vec::new());
    }

    // Apply updates to database
    let conn = Connection::open(db_path)?;
    let mut overrides = Vec::new();
    let timestamp = chrono::Utc::now().to_rfc3339();

    for (id, character, pinyin, original_def, updated_def, flags) in updates {
        // Update database
        conn.execute(
            "UPDATE characters SET definition = ?1, updated_at = datetime('now') WHERE id = ?2",
            rusqlite::params![&updated_def, id]
        )?;

        // Track override
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

    Ok(overrides)
}

/// Apply definition overrides from JSON file
pub fn apply_definition_overrides_from_json(json_path: &str, db_path: &str) -> Result<usize, Box<dyn std::error::Error>> {
    if !std::path::Path::new(json_path).exists() {
        println!("  ⊗ Override file not found: {}", json_path);
        return Ok(0);
    }

    let file_content = std::fs::read_to_string(json_path)?;
    let overrides: Vec<DefinitionOverride> = serde_json::from_str(&file_content)?;

    if overrides.is_empty() {
        return Ok(0);
    }

    let conn = Connection::open(db_path)?;
    let mut applied = 0;

    for override_item in &overrides {
        match conn.execute(
            "UPDATE characters SET definition = ?1, updated_at = datetime('now') WHERE id = ?2",
            rusqlite::params![&override_item.updated_definition, override_item.character_id]
        ) {
            Ok(rows) if rows > 0 => {
                applied += 1;
                println!("  ✓ Applied: {} → {}",
                    override_item.character,
                    &override_item.updated_definition[..override_item.updated_definition.len().min(60)]
                );
            },
            Ok(_) => {
                println!("  ⚠ Skipped: {} (ID {} not found)", override_item.character, override_item.character_id);
            },
            Err(e) => {
                println!("  ✗ Error updating {}: {}", override_item.character, e);
            }
        }
    }

    Ok(applied)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Applying Definition Updates ===\n");

    let csv_path = "../definition_review.csv";
    let db_path = "../src-tauri/chinese.db";

    println!("📖 Reading definition updates from CSV...");
    let new_overrides = apply_definition_updates_from_csv(csv_path, db_path)?;

    if new_overrides.is_empty() {
        println!("\n⚠️  No updates to apply. Fill in the 'Updated Definition' column in the CSV.");
        return Ok(());
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
    all_overrides.extend(new_overrides);

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
