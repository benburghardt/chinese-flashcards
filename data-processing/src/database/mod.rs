use rusqlite::{Connection, Result};
use crate::EnrichedEntry;
use std::path::Path;

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
    initialize_user_progress(&tx)?;

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
