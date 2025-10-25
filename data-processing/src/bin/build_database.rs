use data_processing::parsers::{cedict, subtlex};
use data_processing::{merge_cedict_with_frequency_separated, database};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Navigate to project root to find datasets
    let project_root = std::env::current_dir()?
        .parent()
        .ok_or("Cannot find project root")?
        .to_path_buf();

    let datasets_dir = project_root.join("datasets");

    // Output to src-tauri/resources/ directory for Tauri bundling
    let output_path = project_root.join("src-tauri").join("resources").join("chinese.db");

    println!("=== Building Chinese Learning Database ===\n");

    // Step 1: Parse CC-CEDICT
    println!("📖 Parsing CC-CEDICT...");
    let cedict_path = datasets_dir.join("cedict_ts.u8");
    let cedict_entries = cedict::parse_cedict_file(cedict_path.to_str().unwrap())?;
    println!("  ✓ Loaded {} entries\n", cedict_entries.len());

    // Step 2: Parse SUBTLEX-CH
    println!("📊 Parsing SUBTLEX-CH...");
    let char_freq_path = datasets_dir.join("SUBTLEX-CH").join("SUBTLEX-CH-CHR");
    let char_freq = subtlex::parse_subtlex_character_file(char_freq_path.to_str().unwrap())?;

    let word_freq_path = datasets_dir.join("SUBTLEX-CH").join("SUBTLEX-CH-WF_PoS");
    let word_freq = subtlex::parse_subtlex_word_file(word_freq_path.to_str().unwrap())?;

    println!("  ✓ Loaded {} character frequencies", char_freq.len());
    println!("  ✓ Loaded {} word frequencies\n", word_freq.len());

    // Step 3: Merge data (keeping character and word frequencies separate)
    println!("🔗 Merging data...");
    let enriched = merge_cedict_with_frequency_separated(cedict_entries, char_freq, word_freq);
    println!("  ✓ Created {} enriched entries\n", enriched.len());

    // Step 4: Create database
    println!("💾 Creating SQLite database...");
    database::create_database(enriched, output_path.to_str().unwrap())?;
    println!();

    // Step 5: Populate component characters
    println!("🔗 Populating component characters...");
    database::populate_component_characters(output_path.to_str().unwrap())?;
    println!();

    // Step 6: Calculate and populate introduction ranks
    println!("📊 Calculating introduction ranks...");
    database::populate_introduction_ranks(output_path.to_str().unwrap())?;
    println!();

    // Step 7: Verify
    println!("✅ Verifying database...");
    database::verify_database(output_path.to_str().unwrap())?;

    println!("\n🎉 Database build complete!");
    println!("   Output: {}", output_path.display());
    println!("   Ready to use in application");

    Ok(())
}
