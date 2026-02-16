use encoding_rs::GBK;
use encoding_rs_io::DecodeReaderBytesBuilder;
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};

#[derive(Debug, Clone)]
pub struct FrequencyData {
    pub item: String, // Character or word
    pub frequency_rank: i32,
    pub count: i32,
    pub is_word: bool,
}

pub fn parse_subtlex_character_file(
    path: &str,
) -> Result<HashMap<String, FrequencyData>, Box<dyn std::error::Error>> {
    parse_subtlex_file(path, false)
}

pub fn parse_subtlex_word_file(
    path: &str,
) -> Result<HashMap<String, FrequencyData>, Box<dyn std::error::Error>> {
    parse_subtlex_file(path, true)
}

fn parse_subtlex_file(
    path: &str,
    is_word: bool,
) -> Result<HashMap<String, FrequencyData>, Box<dyn std::error::Error>> {
    // Real SUBTLEX-CH files use GBK encoding
    // We always use GBK decoder which also handles UTF-8 correctly
    let file = File::open(path)?;
    let decoder = DecodeReaderBytesBuilder::new()
        .encoding(Some(GBK))
        .build(file);
    let reader = BufReader::new(decoder);

    // First pass: collect all items with their counts
    let mut items_with_counts: Vec<(String, i32)> = Vec::new();
    let mut lines_skipped = 0;

    for line in reader.lines() {
        let line = line?;

        // Skip first 3 header lines in real SUBTLEX files
        // Line 1: "Total character count: 46,841,097"
        // Line 2: "Context number: 6,243"
        // Line 3: Column headers (Character/Word, Count, etc.)
        if lines_skipped < 3 {
            lines_skipped += 1;
            continue;
        }

        // Skip empty lines
        if line.trim().is_empty() {
            continue;
        }

        // Parse tab-delimited line
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() < 2 {
            continue;
        }

        let item = parts[0].trim().to_string();
        let count = parts[1].trim().parse::<i32>().unwrap_or(0);

        // Skip empty items or items with zero count
        if item.is_empty() || count == 0 {
            continue;
        }

        items_with_counts.push((item, count));
    }

    // Second pass: Sort by count (descending - higher count = more frequent = lower rank)
    items_with_counts.sort_by(|a, b| b.1.cmp(&a.1));

    // Third pass: Assign frequency ranks based on sorted order
    let mut data = HashMap::new();
    for (rank, (item, count)) in items_with_counts.iter().enumerate() {
        let freq_data = FrequencyData {
            item: item.clone(),
            frequency_rank: (rank + 1) as i32, // Rank starts at 1
            count: *count,
            is_word,
        };

        data.insert(item.clone(), freq_data);
    }

    println!(
        "Parsed {} {} from SUBTLEX-CH (sorted by frequency)",
        data.len(),
        if is_word { "words" } else { "characters" }
    );

    // Show top 10 for verification
    let mut sorted_items: Vec<_> = data.values().collect();
    sorted_items.sort_by_key(|x| x.frequency_rank);
    println!("  Top 10 most frequent:");
    for item in sorted_items.iter().take(10) {
        println!("    #{}: {} (count: {})", item.frequency_rank, item.item, item.count);
    }

    Ok(data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_frequency_data_creation() {
        let data = FrequencyData {
            item: "的".to_string(),
            frequency_rank: 1,
            count: 1000000,
            is_word: false,
        };

        assert_eq!(data.item, "的");
        assert_eq!(data.frequency_rank, 1);
        assert!(!data.is_word);
    }

    #[test]
    fn test_frequency_data_word() {
        let data = FrequencyData {
            item: "中国".to_string(),
            frequency_rank: 10,
            count: 50000,
            is_word: true,
        };

        assert_eq!(data.item, "中国");
        assert!(data.is_word);
    }
}
