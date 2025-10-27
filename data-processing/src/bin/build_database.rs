use data_processing::parsers::{cedict, makemeahanzi, subtlex};
use data_processing::{database, merge_cedict_with_frequency_separated};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Navigate to project root to find datasets
    let project_root = std::env::current_dir()?
        .parent()
        .ok_or("Cannot find project root")?
        .to_path_buf();

    let datasets_dir = project_root.join("datasets");

    // Output to src-tauri/resources/ directory for Tauri bundling
    let output_path = project_root
        .join("src-tauri")
        .join("resources")
        .join("chinese.db");

    // Strokes directory for SVG files
    let strokes_dir = project_root
        .join("src-tauri")
        .join("resources")
        .join("strokes");

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

    // Step 7: Apply definition overrides
    println!("📝 Applying definition overrides...");
    let overrides_path = project_root.join("definition_overrides.json");
    database::apply_definition_overrides(
        output_path.to_str().unwrap(),
        overrides_path.to_str().unwrap(),
    )?;
    println!();

    // Step 8: Parse and integrate Make Me a Hanzi stroke data
    println!("🎨 Parsing Make Me a Hanzi data...");
    let mmah_dir = datasets_dir.join("makemeahanzi");
    let dict_path = mmah_dir.join("dictionary.txt");
    let graphics_path = mmah_dir.join("graphics.txt");

    let dictionary = makemeahanzi::parse_dictionary_file(dict_path.to_str().unwrap())?;
    let graphics = makemeahanzi::parse_graphics_file(graphics_path.to_str().unwrap())?;
    let mmah_data = makemeahanzi::merge_data(dictionary, graphics);

    println!("  ✓ Loaded {} entries with stroke data", mmah_data.len());
    println!();

    println!("🖌️  Populating stroke data...");
    database::populate_stroke_data(
        output_path.to_str().unwrap(),
        mmah_data,
        strokes_dir.to_str().unwrap(),
    )?;
    println!();

    // Step 9: Verify
    println!("✅ Verifying database...");
    database::verify_database(output_path.to_str().unwrap())?;

    println!("\n🎉 Database build complete!");
    println!("   Output: {}", output_path.display());
    println!("   Strokes: {}", strokes_dir.display());
    println!("   Ready to use in application");

    Ok(())
}
