use rusqlite::{Connection, Result};

fn main() -> Result<()> {
    let db_path = "../src-tauri/resources/chinese.db";

    println!("=== Testing Initialization Logic ===");
    println!("Database: {}", db_path);

    let conn = Connection::open(db_path)?;

    // This mimics the logic from src-tauri/src/database/mod.rs::initialize_new_user_characters

    // 1. Check initial_unlock_completed setting
    let initial_unlock_completed: String = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = 'initial_unlock_completed'",
            [],
            |row| row.get(0)
        )
        .unwrap_or_else(|_| "false".to_string());

    println!("\nStep 1: Check setting");
    println!("  initial_unlock_completed = '{}'", initial_unlock_completed);

    if initial_unlock_completed == "true" {
        println!("  Already initialized, exiting");
        return Ok(());
    }

    // 2. Query for first 30 characters
    println!("\nStep 2: Query first 30 characters");
    let mut stmt = conn.prepare(
        "SELECT c.id
         FROM characters c
         WHERE c.is_word = 0
           AND NOT EXISTS (
               SELECT 1 FROM user_progress p
               WHERE p.character_id = c.id
           )
         ORDER BY c.frequency_rank ASC
         LIMIT 30"
    )?;

    let character_ids: Vec<i32> = stmt.query_map([], |row| row.get(0))?
        .collect::<Result<Vec<i32>>>()?;

    let count = character_ids.len();
    println!("  Found {} characters to initialize", count);
    println!("  IDs: {:?}", &character_ids[0..std::cmp::min(10, count)]);

    if count == 0 {
        println!("  ERROR: No characters found!");
        return Ok(());
    }

    // 3. Insert into user_progress
    println!("\nStep 3: Insert into user_progress");
    for character_id in &character_ids {
        conn.execute(
            "INSERT INTO user_progress
             (character_id, current_interval_days, previous_interval_days, next_review_date, introduced)
             VALUES (?1, 0.0417, 0.0417, datetime('now'), 0)",
            [character_id]
        )?;
    }
    println!("  Inserted {} characters", count);

    // 4. Set initial_unlock_completed to true
    println!("\nStep 4: Mark initialization complete");
    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key, value, updated_at)
         VALUES ('initial_unlock_completed', 'true', datetime('now'))",
        []
    )?;
    println!("  Set initial_unlock_completed = 'true'");

    // 5. Verify
    println!("\nStep 5: Verify results");
    let progress_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress",
        [],
        |row| row.get(0)
    )?;
    println!("  Characters in user_progress: {}", progress_count);

    let not_introduced_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress WHERE introduced = 0",
        [],
        |row| row.get(0)
    )?;
    println!("  Ready to learn: {}", not_introduced_count);

    // Show the characters
    println!("\n=== Initialized Characters ===");
    let mut stmt = conn.prepare(
        "SELECT c.simplified, c.mandarin_pinyin, c.frequency_rank
         FROM user_progress p
         JOIN characters c ON p.character_id = c.id
         ORDER BY c.frequency_rank ASC"
    )?;

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

    println!("\n✅ Initialization test complete!");

    Ok(())
}
