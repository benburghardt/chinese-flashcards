use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};

/// Dictionary entry from dictionary.txt
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DictionaryEntry {
    pub character: String,
    #[serde(default)]
    pub definition: Option<String>,
    #[serde(default)]
    pub pinyin: Vec<String>,
    pub decomposition: String,
    pub radical: String,
    #[serde(default)]
    pub matches: Vec<Option<serde_json::Value>>,
}

/// Graphics entry from graphics.txt
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GraphicsEntry {
    pub character: String,
    pub strokes: Vec<String>,
    pub medians: Vec<Vec<Vec<f32>>>,
}

/// Combined entry with both dictionary and graphics data
#[derive(Debug, Clone)]
pub struct MakeMeAHanziEntry {
    pub character: String,
    pub definition: Option<String>,
    pub pinyin: Vec<String>,
    pub decomposition: String,
    pub radical: String,
    pub stroke_count: usize,
    pub strokes: Vec<String>,
    pub medians: Vec<Vec<Vec<f32>>>,
}

/// Parse dictionary.txt file (JSON lines format)
pub fn parse_dictionary_file(
    file_path: &str,
) -> Result<HashMap<String, DictionaryEntry>, Box<dyn std::error::Error>> {
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);
    let mut entries = HashMap::new();

    for (line_num, line) in reader.lines().enumerate() {
        let line = line?;
        if line.trim().is_empty() {
            continue;
        }

        match serde_json::from_str::<DictionaryEntry>(&line) {
            Ok(entry) => {
                entries.insert(entry.character.clone(), entry);
            }
            Err(e) => {
                eprintln!(
                    "Warning: Failed to parse dictionary line {}: {}",
                    line_num + 1,
                    e
                );
                eprintln!("  Line content: {}", &line[..line.len().min(100)]);
            }
        }
    }

    Ok(entries)
}

/// Parse graphics.txt file (JSON lines format)
pub fn parse_graphics_file(
    file_path: &str,
) -> Result<HashMap<String, GraphicsEntry>, Box<dyn std::error::Error>> {
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);
    let mut entries = HashMap::new();

    for (line_num, line) in reader.lines().enumerate() {
        let line = line?;
        if line.trim().is_empty() {
            continue;
        }

        match serde_json::from_str::<GraphicsEntry>(&line) {
            Ok(entry) => {
                entries.insert(entry.character.clone(), entry);
            }
            Err(e) => {
                eprintln!(
                    "Warning: Failed to parse graphics line {}: {}",
                    line_num + 1,
                    e
                );
                eprintln!("  Line content: {}", &line[..line.len().min(100)]);
            }
        }
    }

    Ok(entries)
}

/// Combine dictionary and graphics data
pub fn merge_data(
    dictionary: HashMap<String, DictionaryEntry>,
    graphics: HashMap<String, GraphicsEntry>,
) -> HashMap<String, MakeMeAHanziEntry> {
    let mut merged = HashMap::new();

    for (character, dict_entry) in dictionary {
        if let Some(graphics_entry) = graphics.get(&character) {
            let stroke_count = graphics_entry.strokes.len();

            merged.insert(
                character.clone(),
                MakeMeAHanziEntry {
                    character: character.clone(),
                    definition: dict_entry.definition,
                    pinyin: dict_entry.pinyin,
                    decomposition: dict_entry.decomposition,
                    radical: dict_entry.radical,
                    stroke_count,
                    strokes: graphics_entry.strokes.clone(),
                    medians: graphics_entry.medians.clone(),
                },
            );
        }
    }

    merged
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_dictionary_json() {
        let json = r#"{"character":"⺀","definition":"ice","pinyin":[],"decomposition":"？","radical":"⺀","matches":[null,null]}"#;
        let entry: DictionaryEntry = serde_json::from_str(json).unwrap();
        assert_eq!(entry.character, "⺀");
        assert_eq!(entry.definition, Some("ice".to_string()));
        assert_eq!(entry.decomposition, "？");
    }

    #[test]
    fn test_parse_graphics_json() {
        let json = r#"{"character":"⺀","strokes":["M 323 706"],"medians":[[[336,704]]]}"#;
        let entry: GraphicsEntry = serde_json::from_str(json).unwrap();
        assert_eq!(entry.character, "⺀");
        assert_eq!(entry.strokes.len(), 1);
    }
}
