use rusqlite::{Connection, Result};
use std::fs::File;
use std::io::Write;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db_path = "../src-tauri/chinese.db";
    let conn = Connection::open(db_path)?;

    println!("=== Generating Definition Review Report ===\n");

    // Query all characters and words
    let mut stmt = conn.prepare(
        "SELECT id, character, simplified, mandarin_pinyin, definition, is_word, frequency_rank
         FROM characters
         ORDER BY frequency_rank ASC"
    )?;

    let items: Vec<(i32, String, String, String, String, bool, i32)> = stmt
        .query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
            ))
        })?
        .collect::<Result<Vec<_>>>()?;

    println!("Analyzing {} items...\n", items.len());

    // Collect items needing review
    let mut review_items = Vec::new();

    for (id, character, _simplified, pinyin, definition, is_word, freq_rank) in items {
        let item_type = if is_word { "word" } else { "char" };
        let mut flags = Vec::new();

        // Check for multiple definitions (separated by / or ;)
        let def_count = definition.matches('/').count() + definition.matches(';').count() + 1;

        // Flag: Multiple definitions
        if def_count > 1 {
            flags.push(format!("{} definitions", def_count));
        }

        // Flag: Very long definition
        if definition.len() > 100 {
            flags.push("Very long".to_string());
        }

        // Flag: Contains surname
        if definition.to_lowercase().contains("surname") {
            flags.push("Contains 'surname'".to_string());
        }

        // Flag: Contains "variant of"
        if definition.to_lowercase().contains("variant of") {
            flags.push("Variant".to_string());
        }

        // Flag: Contains "used in"
        if definition.to_lowercase().contains("used in") {
            flags.push("'Used in' phrase".to_string());
        }

        // Flag: Contains historical terms
        let historical_terms = ["dynasty", "historical", "ancient", "classical", "literary"];
        for term in &historical_terms {
            if definition.to_lowercase().contains(term) {
                flags.push(format!("Contains '{}'", term));
                break;
            }
        }

        // Flag: Empty or very short
        if definition.len() < 3 {
            flags.push("Too short".to_string());
        }

        // Only include items that have at least one flag
        if !flags.is_empty() {
            review_items.push((
                id,
                character,
                pinyin,
                item_type.to_string(),
                freq_rank,
                definition,
                flags.join(", "),
            ));
        }
    }

    println!("Found {} items needing review\n", review_items.len());

    // Write to CSV
    let output_path = "../definition_review.csv";
    let mut file = File::create(output_path)?;

    // Write header
    writeln!(
        file,
        "ID,Character,Pinyin,Type,Frequency Rank,Current Definition,Flags"
    )?;

    // Write data
    for (id, character, pinyin, item_type, freq_rank, definition, flags) in review_items {
        // Escape quotes in definition for CSV
        let escaped_def = definition.replace('"', "\"\"");

        writeln!(
            file,
            r#"{},{},"{}",{},{},"{}"  ,"{}""#,
            id, character, pinyin, item_type, freq_rank, escaped_def, flags
        )?;
    }

    println!("✅ Report generated: {}", output_path);
    println!("\nYou can now:");
    println!("  1. Review the CSV file");
    println!("  2. Manually select the best definition for each character");
    println!("  3. Update the database with improved definitions");

    Ok(())
}
