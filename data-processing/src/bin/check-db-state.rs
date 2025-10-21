use rusqlite::{Connection, Result};

fn main() -> Result<()> {
    let db_path = "../src-tauri/resources/chinese.db";

    println!("=== Checking Database State ===");
    println!("Database: {}", db_path);

    let conn = Connection::open(db_path)?;

    // Check schema version
    let version: i32 = conn
        .query_row("SELECT MAX(version) FROM schema_version", [], |row| row.get(0))
        .unwrap_or(0);
    println!("\nSchema version: {}", version);

    // Check app_settings
    println!("\n=== App Settings ===");
    let mut stmt = conn.prepare("SELECT key, value FROM app_settings ORDER BY key")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;

    for row in rows {
        let (key, value) = row?;
        println!("{}: {}", key, value);
    }

    // Check character count
    let char_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM characters WHERE is_word = 0",
        [],
        |row| row.get(0)
    )?;
    println!("\n=== Character Count ===");
    println!("Total characters: {}", char_count);

    // Check user_progress count
    let progress_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress",
        [],
        |row| row.get(0)
    )?;
    println!("\n=== User Progress ===");
    println!("Characters in user_progress: {}", progress_count);

    // Check introduced count
    let introduced_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress WHERE introduced = 1",
        [],
        |row| row.get(0)
    )?;
    println!("Introduced characters: {}", introduced_count);

    // Check not introduced count
    let not_introduced_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress WHERE introduced = 0",
        [],
        |row| row.get(0)
    )?;
    println!("Not introduced (ready to learn): {}", not_introduced_count);

    // Show some characters in user_progress
    if progress_count > 0 {
        println!("\n=== Characters in User Progress ===");
        let mut stmt = conn.prepare(
            "SELECT c.simplified, c.mandarin_pinyin, p.introduced
             FROM user_progress p
             JOIN characters c ON p.character_id = c.id
             ORDER BY c.frequency_rank ASC
             LIMIT 30"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i32>(2)?,
            ))
        })?;

        for (i, row) in rows.enumerate() {
            let (char, pinyin, introduced) = row?;
            let status = if introduced == 1 { "introduced" } else { "ready" };
            println!("{}. {} ({}) - {}", i + 1, char, pinyin, status);
        }
    }

    Ok(())
}
