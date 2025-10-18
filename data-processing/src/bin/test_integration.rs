use data_processing::parsers::{cedict, subtlex};
use data_processing::merge_cedict_with_frequency;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Navigate to project root to find datasets
    let project_root = std::env::current_dir()?
        .parent()
        .ok_or("Cannot find project root")?
        .to_path_buf();

    let datasets_dir = project_root.join("datasets");

    println!("=== Data Integration Test ===\n");

    println!("Loading CC-CEDICT...");
    let cedict_path = datasets_dir.join("cedict_ts.u8");
    let cedict_entries = cedict::parse_cedict_file(cedict_path.to_str().unwrap())?;

    println!("Loading SUBTLEX-CH character frequencies...");
    let char_freq_path = datasets_dir.join("SUBTLEX-CH").join("SUBTLEX-CH-CHR");
    let char_freq = subtlex::parse_subtlex_character_file(char_freq_path.to_str().unwrap())?;

    println!("Loading SUBTLEX-CH word frequencies...");
    let word_freq_path = datasets_dir.join("SUBTLEX-CH").join("SUBTLEX-CH-WF_PoS");
    let word_freq = subtlex::parse_subtlex_word_file(word_freq_path.to_str().unwrap())?;

    // Merge frequency data (use character freq for single chars, word freq for words)
    let mut combined_freq = char_freq;
    combined_freq.extend(word_freq);

    println!("Merging data...");
    let enriched = merge_cedict_with_frequency(cedict_entries, combined_freq.clone());

    // Statistics
    let with_freq = enriched.iter().filter(|e| e.frequency_rank.is_some()).count();
    let without_freq = enriched.len() - with_freq;

    println!("\n=== Integration Results ===");
    println!("Total entries: {}", enriched.len());
    println!("With frequency data: {}", with_freq);
    println!("Without frequency data: {}", without_freq);

    // Show top 10 most frequent
    let mut sorted = enriched.clone();
    sorted.sort_by_key(|e| e.frequency_rank.unwrap_or(999999));

    println!("\n=== Top 20 Most Frequent ===");
    for (i, entry) in sorted.iter().take(20).enumerate() {
        if entry.frequency_rank.is_some() {
            println!("{}. {} ({}) - Rank: {} - {}",
                     i + 1,
                     entry.cedict.simplified,
                     entry.cedict.pinyin,
                     entry.frequency_rank.unwrap(),
                     entry.cedict.definitions.first().unwrap_or(&String::from("(no definition)")));
        }
    }

    Ok(())
}
