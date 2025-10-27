use rusqlite::Connection;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Verifying Stroke Data in Database ===\n");

    // Navigate to project root to find database
    let project_root = std::env::current_dir()?
        .parent()
        .ok_or("Cannot find project root")?
        .to_path_buf();

    let db_path = project_root
        .join("src-tauri")
        .join("resources")
        .join("chinese.db");

    let conn = Connection::open(&db_path)?;

    // Get sample characters with stroke data
    let mut stmt = conn.prepare(
        "SELECT character, stroke_count, radical, decomposition, stroke_data_path
         FROM characters
         WHERE character IN ('一', '二', '三', '好', '人', '大', '我', '的', '你')
         ORDER BY frequency_rank",
    )?;

    println!("Sample characters with stroke data:\n");
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, Option<i32>>(1)?,
            row.get::<_, Option<String>>(2)?,
            row.get::<_, Option<String>>(3)?,
            row.get::<_, Option<String>>(4)?,
        ))
    })?;

    for (i, row) in rows.enumerate() {
        let (char, stroke_count, radical, decomposition, svg_path) = row?;
        println!("{}. Character: {}", i + 1, char);
        println!("   Stroke count: {:?}", stroke_count);
        println!("   Radical: {:?}", radical);
        println!("   Decomposition: {:?}", decomposition);
        println!("   SVG path: {:?}\n", svg_path);
    }

    // Count statistics
    let total_chars: i32 = conn.query_row(
        "SELECT COUNT(*) FROM characters WHERE is_word = 0",
        [],
        |row| row.get(0),
    )?;

    let chars_with_stroke_data: i32 = conn.query_row(
        "SELECT COUNT(*) FROM characters WHERE is_word = 0 AND stroke_data_path IS NOT NULL",
        [],
        |row| row.get(0),
    )?;

    let chars_with_radicals: i32 = conn.query_row(
        "SELECT COUNT(*) FROM characters WHERE is_word = 0 AND radical IS NOT NULL",
        [],
        |row| row.get(0),
    )?;

    println!("=== Statistics ===");
    println!("Total characters: {}", total_chars);
    println!("Characters with stroke data: {} ({:.1}%)",
        chars_with_stroke_data,
        (chars_with_stroke_data as f64 / total_chars as f64) * 100.0
    );
    println!("Characters with radicals: {} ({:.1}%)",
        chars_with_radicals,
        (chars_with_radicals as f64 / total_chars as f64) * 100.0
    );

    // Check top 100 most common characters
    let top100_with_data: i32 = conn.query_row(
        "SELECT COUNT(*) FROM characters
         WHERE is_word = 0
         AND frequency_rank <= 100
         AND stroke_data_path IS NOT NULL",
        [],
        |row| row.get(0),
    )?;

    println!("\nTop 100 most common characters with stroke data: {}/100 ({:.1}%)",
        top100_with_data,
        (top100_with_data as f64 / 100.0) * 100.0
    );

    println!("\n✅ Verification complete!");

    Ok(())
}
