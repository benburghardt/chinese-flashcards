use rusqlite::{Connection, Result};
use std::fs::File;
use std::io::Write;
use std::collections::{HashMap, HashSet};

/// Remove parenthetical content from a definition for comparison
fn strip_parentheses(s: &str) -> String {
    let mut result = String::new();
    let mut depth: i32 = 0;

    for c in s.chars() {
        match c {
            '(' | '（' => depth += 1,
            ')' | '）' => depth = depth.saturating_sub(1),
            _ => {
                if depth == 0 {
                    result.push(c);
                }
            }
        }
    }

    result.trim().to_string()
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Generating Definition Review Report ===\n");

    // Step 1: Parse CEDICT to find duplicates
    println!("📖 Parsing CEDICT to detect duplicates...");
    let cedict_path = "../datasets/cedict_ts.u8";
    let cedict_entries = data_processing::parsers::cedict::parse_cedict_file(cedict_path)?;

    // Group by simplified character to detect duplicates
    // Use a map of character -> (original_def, stripped_def)
    let mut character_entries: HashMap<String, Vec<(String, String)>> = HashMap::new();
    for entry in &cedict_entries {
        let def = entry.definitions.join("; ");
        let stripped = strip_parentheses(&def);
        character_entries
            .entry(entry.simplified.clone())
            .or_insert_with(Vec::new)
            .push((def, stripped));
    }

    // Find characters with multiple DISTINCT entries (ignoring parenthetical differences)
    let mut duplicates: HashMap<String, Vec<String>> = HashMap::new();
    for (character, defs) in character_entries {
        // Get unique stripped definitions
        let mut seen_stripped = HashSet::new();
        let mut unique_defs = Vec::new();

        for (original, stripped) in defs {
            if !stripped.is_empty() && seen_stripped.insert(stripped) {
                unique_defs.push(original);
            }
        }

        // Only flag if there are multiple DISTINCT definitions
        if unique_defs.len() > 1 {
            duplicates.insert(character, unique_defs);
        }
    }

    println!("  ✓ Found {} characters with multiple CEDICT entries\n", duplicates.len());

    // Step 2: Query database
    let db_path = "../src-tauri/chinese.db";
    let conn = Connection::open(db_path)?;

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

    println!("Analyzing {} items from database...\n", items.len());

    // Collect items needing review
    let mut review_items = Vec::new();

    for (id, character, _simplified, pinyin, definition, is_word, freq_rank) in items {
        // Skip extremely rare items (not useful to learn)
        if freq_rank == 999999 {
            continue;
        }

        let item_type = if is_word { "word" } else { "char" };
        let mut flags = Vec::new();
        let mut all_definitions = definition.clone();

        // Flag: Multiple CEDICT entries (true duplicates)
        if let Some(defs) = duplicates.get(&character) {
            flags.push(format!("Multiple CEDICT entries ({})", defs.len()));
            // Include all definitions for review
            all_definitions = defs.join(" | ");
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

        // Flag: Very long definition (but only if there are other flags too)
        // We track this separately to avoid reporting items where length is the only issue
        let is_very_long = definition.len() > 100;

        // Only include items that have at least one substantive flag
        // "Very long" alone is not enough to warrant review
        if !flags.is_empty() {
            // Add "Very long" flag if applicable and there are other issues
            if is_very_long {
                flags.push("Very long".to_string());
            }

            review_items.push((
                id,
                character,
                pinyin,
                item_type.to_string(),
                freq_rank,
                all_definitions,
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
        "ID,Character,Pinyin,Type,Frequency Rank,Current Definition,Flags,Updated Definition"
    )?;

    // Write data
    for (id, character, pinyin, item_type, freq_rank, definition, flags) in review_items {
        // Escape quotes in definition for CSV
        let escaped_def = definition.replace('"', "\"\"");

        writeln!(
            file,
            r#"{},{},"{}",{},{},"{}","{}",""#,
            id, character, pinyin, item_type, freq_rank, escaped_def, flags
        )?;
    }

    println!("✅ Report generated: {}", output_path);
    println!("\nNext steps:");
    println!("  1. Open {} in your spreadsheet editor", output_path);
    println!("  2. Fill in the 'Updated Definition' column with your chosen definitions");
    println!("  3. Run: cargo run --bin apply-definition-updates");
    println!("\nFor multiple CEDICT entries, pick the best one from the options shown.");
    println!("Leave 'Updated Definition' blank to keep the current definition.");

    Ok(())
}
