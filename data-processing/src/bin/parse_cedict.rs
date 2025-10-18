use data_processing::parsers::cedict;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Navigate to project root to find datasets
    let project_root = std::env::current_dir()?
        .parent()
        .ok_or("Cannot find project root")?
        .to_path_buf();

    let cedict_path = project_root.join("datasets").join("cedict_ts.u8");

    println!("=== CC-CEDICT Parser Test ===\n");
    println!("Reading from: {:?}\n", cedict_path);

    let entries = cedict::parse_cedict_file(cedict_path.to_str().unwrap())?;

    println!("\nTotal entries: {}", entries.len());
    println!("\nFirst 5 entries:");
    for entry in entries.iter().take(5) {
        println!("{:?}", entry);
    }

    let characters: Vec<_> = entries.iter().filter(|e| !e.is_word).collect();
    let words: Vec<_> = entries.iter().filter(|e| e.is_word).collect();

    println!("\n=== Statistics ===");
    println!("Characters: {}", characters.len());
    println!("Words: {}", words.len());

    Ok(())
}
