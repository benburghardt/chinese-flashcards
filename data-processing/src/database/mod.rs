use rusqlite::{Connection, Result};
use crate::EnrichedEntry;
use std::path::Path;
use std::collections::HashMap;

pub fn create_database(entries: Vec<EnrichedEntry>, output_path: &str) -> Result<()> {
    // Delete existing database
    if Path::new(output_path).exists() {
        std::fs::remove_file(output_path).ok();
    }

    let mut conn = Connection::open(output_path)?;

    // Load schema
    let schema = include_str!("../../schema.sql");
    conn.execute_batch(schema)?;

    println!("Created database schema");

    // Insert data in transaction
    let tx = conn.transaction()?;

    insert_characters(&tx, entries)?;
    // Note: Initial user progress (first 30 characters) is now initialized
    // by the app on first run, not during database build

    tx.commit()?;

    println!("✅ Database created successfully: {}", output_path);

    Ok(())
}

fn insert_characters(conn: &Connection, entries: Vec<EnrichedEntry>) -> Result<()> {
    let mut stmt = conn.prepare(
        "INSERT OR IGNORE INTO characters (
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

        let rows_affected = stmt.execute(rusqlite::params![
            cedict.simplified,
            cedict.simplified,
            cedict.traditional,
            cedict.pinyin,
            definition,
            freq_rank,
            cedict.is_word,
        ])?;

        if rows_affected > 0 {
            inserted += 1;
        }
    }

    println!("  Inserted {} unique characters/words (out of {} total entries)", inserted, total);
    Ok(())
}

// Note: This function is no longer used - initial user progress is now
// initialized by the app on first run (see src-tauri/src/database/mod.rs)
// Keeping it here for reference in case it's needed later
//
// fn initialize_user_progress(conn: &Connection) -> Result<()> {
//     // Get first 30 characters by frequency
//     let mut stmt = conn.prepare(
//         "SELECT id FROM characters
//          WHERE is_word = 0
//          ORDER BY frequency_rank ASC
//          LIMIT 30"
//     )?;
//
//     let char_ids: Vec<i32> = stmt
//         .query_map([], |row| row.get(0))?
//         .collect::<Result<Vec<_>>>()?;
//
//     println!("  Initializing user progress for {} characters", char_ids.len());
//
//     let mut insert_stmt = conn.prepare(
//         "INSERT INTO user_progress (
//             character_id, current_interval_days, previous_interval_days, next_review_date, introduced
//         ) VALUES (?1, 0.0417, 0.0417, datetime('now'), 0)"
//     )?;
//
//     for char_id in char_ids {
//         insert_stmt.execute([char_id])?;
//     }
//
//     println!("  ✓ First 30 characters ready for learning");
//     Ok(())
// }

/// Populate component_characters field for all words
pub fn populate_component_characters(db_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut conn = Connection::open(db_path)?;

    // Build character lookup map: character -> id
    let char_to_id: HashMap<String, i32> = {
        let mut map = HashMap::new();
        let mut stmt = conn.prepare("SELECT id, character FROM characters WHERE is_word = 0")?;
        let chars: Vec<(i32, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<Result<Vec<_>>>()?;
        for (id, character) in chars {
            map.insert(character, id);
        }
        map
    };

    println!("  ✓ Loaded {} single characters", char_to_id.len());

    // Get all words
    let words: Vec<(i32, String)> = {
        let mut stmt = conn.prepare("SELECT id, character FROM characters WHERE is_word = 1")?;
        let result = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?.collect::<Result<Vec<_>>>()?;
        result
    };

    println!("  Found {} words to process", words.len());

    // Process words and update component_characters
    let tx = conn.transaction()?;

    let mut updated = 0;
    let mut skipped = 0;

    {
        let mut update_stmt = tx.prepare("UPDATE characters SET component_characters = ?1 WHERE id = ?2")?;

        for (i, (word_id, word_char)) in words.iter().enumerate() {
            if i % 10000 == 0 && i > 0 {
                println!("  Processed: {} words...", i);
            }

            // Extract component characters
            let component_ids: Vec<i32> = word_char
                .chars()
                .filter_map(|c| char_to_id.get(&c.to_string()).copied())
                .collect();

            if component_ids.len() == word_char.chars().count() {
                // All components found
                let component_str = component_ids
                    .iter()
                    .map(|id| id.to_string())
                    .collect::<Vec<_>>()
                    .join(",");

                update_stmt.execute(rusqlite::params![&component_str, word_id])?;
                updated += 1;
            } else {
                skipped += 1;
            }
        }
    } // update_stmt dropped here

    tx.commit()?;

    println!("  ✓ Updated: {} words", updated);
    println!("  ⊗ Skipped: {} words (missing component characters)", skipped);

    Ok(())
}

/// Calculate and populate introduction_rank for all characters and words
pub fn populate_introduction_ranks(db_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut conn = Connection::open(db_path)?;

    #[derive(Debug)]
    struct ScoredItem {
        id: i32,
        score: f64,
    }

    // Calculate score for each character/word
    let scored_items: Vec<ScoredItem> = {
        let mut stmt = conn.prepare(
            "SELECT id, frequency_rank, is_word, component_characters FROM characters"
        )?;

        let items: Vec<(i32, i32, bool, Option<String>)> = stmt
            .query_map([], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
            })?
            .collect::<Result<Vec<_>>>()?;

        println!("  Calculating scores for {} items...", items.len());

        let mut scored = Vec::new();

        for (id, freq_rank, is_word, component_chars) in items {
            let score = if is_word {
                // Word scoring: max(component_ranks) + (word_rank × 0.01)
                if let Some(components) = component_chars {
                    let comp_ids: Vec<i32> = components
                        .split(',')
                        .filter_map(|s| s.trim().parse().ok())
                        .collect();

                    if !comp_ids.is_empty() {
                        let mut max_component_rank = 0;
                        for comp_id in comp_ids {
                            if let Ok(rank) = conn.query_row(
                                "SELECT frequency_rank FROM characters WHERE id = ?1",
                                [comp_id],
                                |row| row.get::<_, i32>(0)
                            ) {
                                max_component_rank = max_component_rank.max(rank);
                            }
                        }
                        max_component_rank as f64 + (freq_rank as f64 * 0.01)
                    } else {
                        // No components found
                        100000.0 + freq_rank as f64
                    }
                } else {
                    // No components found
                    100000.0 + freq_rank as f64
                }
            } else {
                // Character scoring: just use frequency rank
                freq_rank as f64
            };

            scored.push(ScoredItem { id, score });
        }

        scored
    };

    // Sort by score to determine rank
    let mut sorted_items = scored_items;
    sorted_items.sort_by(|a, b| a.score.partial_cmp(&b.score).unwrap_or(std::cmp::Ordering::Equal));

    println!("  Assigning introduction ranks...");

    // Update database with ranks
    let tx = conn.transaction()?;

    {
        let mut update_stmt = tx.prepare("UPDATE characters SET introduction_rank = ?1 WHERE id = ?2")?;

        for (rank, item) in sorted_items.iter().enumerate() {
            update_stmt.execute(rusqlite::params![rank + 1, item.id])?;
        }
    } // update_stmt dropped here

    tx.commit()?;

    println!("  ✓ Assigned introduction ranks to {} items", sorted_items.len());

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

    println!("\n=== Database Verification ===");
    println!("Characters: {}", char_count);
    println!("Words: {}", word_count);

    // Show top 30 most common characters (these will be auto-initialized on first app run)
    let mut stmt = conn.prepare(
        "SELECT c.simplified, c.mandarin_pinyin, c.frequency_rank
         FROM characters c
         WHERE c.is_word = 0
         ORDER BY c.frequency_rank ASC
         LIMIT 30"
    )?;

    println!("\n=== Top 30 Characters (Will be auto-initialized on first run) ===");
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
