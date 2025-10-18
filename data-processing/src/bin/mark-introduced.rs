use rusqlite::{Connection, Result};

fn main() -> Result<()> {
    let db_path = "C:\\Users\\Ben\\Desktop\\Coding\\Visual Studio Code\\Personal_Projects\\chinese-flashcards\\src-tauri\\resources\\chinese.db";
    let conn = Connection::open(db_path)?;

    // Mark first 10 characters as introduced
    conn.execute(
        "UPDATE user_progress SET introduced = 1 WHERE character_id <= 10",
        [],
    )?;

    println!("✓ Marked first 10 characters as introduced");

    // Show status
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress WHERE introduced = 1",
        [],
        |row| row.get(0),
    )?;

    println!("Total introduced characters: {}", count);

    Ok(())
}
