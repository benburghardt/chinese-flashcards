use rusqlite::{Connection, Result};

fn main() -> Result<()> {
    let db_path = "C:\\Users\\Ben\\Desktop\\Coding\\Visual Studio Code\\Personal_Projects\\chinese-flashcards\\src-tauri\\resources\\chinese.db";
    let conn = Connection::open(db_path)?;

    println!("Setting up test cards for SRS session...\n");

    // First, check current state
    let total: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress",
        [],
        |row| row.get(0),
    )?;
    println!("Total characters in user_progress: {}", total);

    let introduced_before: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress WHERE introduced = 1",
        [],
        |row| row.get(0),
    )?;
    println!("Currently introduced: {}", introduced_before);

    // Mark first 10 characters as introduced AND set their review date to the past
    conn.execute(
        "UPDATE user_progress
         SET introduced = 1,
             next_review_date = datetime('now', '-1 hour')
         WHERE character_id <= 10",
        [],
    )?;

    println!("\n✓ Updated first 10 characters:");
    println!("  - Marked as introduced");
    println!("  - Set review date to 1 hour ago (due now)");

    // Verify the change
    let introduced_after: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress WHERE introduced = 1",
        [],
        |row| row.get(0),
    )?;
    println!("\nTotal introduced characters: {}", introduced_after);

    // Check how many are due
    let due: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress
         WHERE introduced = 1 AND next_review_date <= datetime('now')",
        [],
        |row| row.get(0),
    )?;
    println!("Cards due for review: {}", due);

    // Show the due cards
    println!("\nDue cards:");
    let mut stmt = conn.prepare(
        "SELECT up.character_id, c.character, c.mandarin_pinyin, c.definition
         FROM user_progress up
         JOIN characters c ON up.character_id = c.id
         WHERE up.introduced = 1 AND up.next_review_date <= datetime('now')
         ORDER BY c.frequency_rank
         LIMIT 10"
    )?;

    let cards = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i32>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
        ))
    })?;

    for (i, card) in cards.enumerate() {
        let (id, character, pinyin, definition) = card?;
        println!("  {}. {} ({}) - {} [ID: {}]", i + 1, character, pinyin, definition, id);
    }

    println!("\n✓ Ready for SRS testing! Reload the app to see due cards.");

    Ok(())
}
