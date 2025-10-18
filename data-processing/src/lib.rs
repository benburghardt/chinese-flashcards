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
