use rusqlite::{Connection, Result};
use std::collections::HashMap;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Path to the database
    let db_path = std::env::args()
        .nth(1)
        .unwrap_or_else(|| {
            // Default to resources directory
            let project_root = std::env::current_dir()
                .unwrap()
                .parent()
                .unwrap()
                .to_path_buf();
            project_root
                .join("src-tauri")
                .join("resources")
                .join("chinese.db")
                .to_string_lossy()
                .to_string()
        });

    println!("=== Populating Component Characters ===");
    println!("Database: {}\n", db_path);

    let mut conn = Connection::open(&db_path)?;

    // First, build a lookup map: character -> id
    println!("Building character lookup map...");
    let char_to_id: HashMap<String, i32> = {
        let mut map = HashMap::new();
        let mut stmt = conn.prepare(
            "SELECT id, character FROM characters WHERE is_word = 0"
        )?;

        let chars: Vec<(i32, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<Result<Vec<_>>>()?;

        for (id, character) in chars {
            map.insert(character, id);
        }
        map
    }; // stmt is dropped here

    println!("  ✓ Loaded {} single characters\n", char_to_id.len());

    // Now, process all words
    println!("Processing words...");
    let words: Vec<(i32, String)> = {
        let mut stmt = conn.prepare(
            "SELECT id, simplified FROM characters WHERE is_word = 1"
        )?;

        let result = stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<Result<Vec<_>>>()?;
        result
    }; // stmt is dropped here

    println!("  Found {} words to process\n", words.len());

    // Begin transaction for updates (now we can borrow mutably)
    let tx = conn.transaction()?;

    let mut updated = 0;
    let mut skipped = 0;
    let mut missing_chars = Vec::new();

    for (word_id, word_text) in words {
        // Extract individual characters from the word
        let chars: Vec<char> = word_text.chars().collect();

        // Look up each character's ID
        let mut component_ids = Vec::new();
        let mut all_found = true;

        for ch in &chars {
            let ch_str = ch.to_string();
            if let Some(&id) = char_to_id.get(&ch_str) {
                component_ids.push(id);
            } else {
                // Character not found in database
                all_found = false;
                if !missing_chars.contains(&ch_str) {
                    missing_chars.push(ch_str.clone());
                }
            }
        }

        if all_found && !component_ids.is_empty() {
            // Join IDs as comma-separated string
            let component_str = component_ids
                .iter()
                .map(|id| id.to_string())
                .collect::<Vec<_>>()
                .join(",");

            // Update the word's component_characters field
            tx.execute(
                "UPDATE characters SET component_characters = ?1 WHERE id = ?2",
                rusqlite::params![component_str, word_id]
            )?;

            updated += 1;
        } else {
            skipped += 1;
        }

        // Progress indicator
        if (updated + skipped) % 10000 == 0 {
            println!("  Processed: {} words...", updated + skipped);
        }
    }

    tx.commit()?;

    println!("\n=== Results ===");
    println!("✓ Updated: {} words", updated);
    println!("⊗ Skipped: {} words (missing component characters)", skipped);

    if !missing_chars.is_empty() {
        println!("\nMissing characters (first 20):");
        for ch in missing_chars.iter().take(20) {
            println!("  - {}", ch);
        }
        if missing_chars.len() > 20 {
            println!("  ... and {} more", missing_chars.len() - 20);
        }
    }

    println!("\n✅ Component character population complete!");

    Ok(())
}
