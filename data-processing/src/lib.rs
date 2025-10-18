pub mod parsers;
pub mod database;

use parsers::cedict::CedictEntry;
use parsers::subtlex::FrequencyData;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct EnrichedEntry {
    pub cedict: CedictEntry,
    pub frequency_rank: Option<i32>,
}

pub fn merge_cedict_with_frequency(
    cedict_entries: Vec<CedictEntry>,
    frequency_map: HashMap<String, FrequencyData>,
) -> Vec<EnrichedEntry> {
    cedict_entries
        .into_iter()
        .map(|entry| {
            let freq_rank = frequency_map
                .get(&entry.simplified)
                .map(|f| f.frequency_rank);

            EnrichedEntry {
                cedict: entry,
                frequency_rank: freq_rank,
            }
        })
        .collect()
}

/// Merge CEDICT entries with frequency data, keeping character and word frequencies separate.
/// Single characters use character frequency ranks, multi-character words use word frequency ranks.
pub fn merge_cedict_with_frequency_separated(
    cedict_entries: Vec<CedictEntry>,
    char_freq: HashMap<String, FrequencyData>,
    word_freq: HashMap<String, FrequencyData>,
) -> Vec<EnrichedEntry> {
    cedict_entries
        .into_iter()
        .map(|entry| {
            // For single characters, prioritize character frequency
            // For multi-character words, use word frequency
            let freq_rank = if entry.simplified.chars().count() == 1 {
                char_freq
                    .get(&entry.simplified)
                    .map(|f| f.frequency_rank)
            } else {
                word_freq
                    .get(&entry.simplified)
                    .map(|f| f.frequency_rank)
            };

            EnrichedEntry {
                cedict: entry,
                frequency_rank: freq_rank,
            }
        })
        .collect()
}
