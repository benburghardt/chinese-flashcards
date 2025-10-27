use data_processing::parsers::makemeahanzi;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Testing Make Me a Hanzi Parser ===\n");

    // Navigate to project root to find datasets
    let project_root = std::env::current_dir()?
        .parent()
        .ok_or("Cannot find project root")?
        .to_path_buf();

    let mmah_dir = project_root.join("datasets").join("makemeahanzi");

    // Parse dictionary.txt
    println!("📖 Parsing dictionary.txt...");
    let dict_path = mmah_dir.join("dictionary.txt");
    let dictionary = makemeahanzi::parse_dictionary_file(dict_path.to_str().unwrap())?;
    println!("  ✓ Loaded {} dictionary entries\n", dictionary.len());

    // Parse graphics.txt
    println!("🎨 Parsing graphics.txt...");
    let graphics_path = mmah_dir.join("graphics.txt");
    let graphics = makemeahanzi::parse_graphics_file(graphics_path.to_str().unwrap())?;
    println!("  ✓ Loaded {} graphics entries\n", graphics.len());

    // Merge data
    println!("🔗 Merging data...");
    let merged = makemeahanzi::merge_data(dictionary, graphics);
    println!("  ✓ Created {} complete entries\n", merged.len());

    // Show sample data
    println!("📊 Sample entries:");
    let sample_chars = vec!["一", "二", "三", "人", "大", "好"];

    for ch in sample_chars {
        if let Some(entry) = merged.get(ch) {
            println!("\n  Character: {}", entry.character);
            println!("  Definition: {:?}", entry.definition);
            println!("  Pinyin: {:?}", entry.pinyin);
            println!("  Radical: {}", entry.radical);
            println!("  Decomposition: {}", entry.decomposition);
            println!("  Stroke count: {}", entry.stroke_count);
            println!("  First stroke: {}", &entry.strokes[0][..50.min(entry.strokes[0].len())]);
        } else {
            println!("\n  Character: {} - NOT FOUND", ch);
        }
    }

    println!("\n✅ Parser test complete!");

    Ok(())
}
