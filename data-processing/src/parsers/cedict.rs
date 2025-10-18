use std::fs::File;
use std::io::{BufRead, BufReader};

#[derive(Debug, Clone)]
pub struct CedictEntry {
    pub traditional: String,
    pub simplified: String,
    pub pinyin: String,
    pub definitions: Vec<String>,
    pub is_word: bool,  // true if multi-character
}

pub fn parse_cedict_file(path: &str) -> Result<Vec<CedictEntry>, Box<dyn std::error::Error>> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let mut entries = Vec::new();
    let mut line_number = 0;

    for line in reader.lines() {
        line_number += 1;
        let line = line?;

        // Skip comments and empty lines
        if line.starts_with('#') || line.trim().is_empty() {
            continue;
        }

        match parse_cedict_line(&line) {
            Some(entry) => entries.push(entry),
            None => {
                eprintln!("Warning: Could not parse line {}: {}", line_number, line);
            }
        }
    }

    println!("Parsed {} entries from CC-CEDICT", entries.len());
    Ok(entries)
}

fn parse_cedict_line(line: &str) -> Option<CedictEntry> {
    // Format: Traditional Simplified [pin1 yin1] /def1/def2/

    // Find pinyin section (between [ and ])
    let pinyin_start = line.find('[')?;
    let pinyin_end = line.find(']')?;
    let pinyin = line[pinyin_start + 1..pinyin_end].to_string();

    // Extract traditional and simplified (before [)
    let chars_part = &line[..pinyin_start].trim();
    let chars: Vec<&str> = chars_part.split_whitespace().collect();
    if chars.len() < 2 {
        return None;
    }
    let traditional = chars[0].to_string();
    let simplified = chars[1].to_string();

    // Extract definitions (after ])
    let defs_part = &line[pinyin_end + 1..].trim();
    let definitions: Vec<String> = defs_part
        .split('/')
        .filter(|s| !s.is_empty())
        .map(|s| s.trim().to_string())
        .collect();

    if definitions.is_empty() {
        return None;
    }

    // Determine if word or character
    let is_word = simplified.chars().count() > 1;

    Some(CedictEntry {
        traditional,
        simplified,
        pinyin,
        definitions,
        is_word,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_single_character() {
        let line = "一 一 [yi1] /one/1/single/";
        let entry = parse_cedict_line(line).unwrap();

        assert_eq!(entry.traditional, "一");
        assert_eq!(entry.simplified, "一");
        assert_eq!(entry.pinyin, "yi1");
        assert_eq!(entry.definitions.len(), 3);
        assert_eq!(entry.definitions[0], "one");
        assert!(!entry.is_word);
    }

    #[test]
    fn test_parse_word() {
        let line = "漢字 汉字 [han4 zi4] /Chinese character/";
        let entry = parse_cedict_line(line).unwrap();

        assert_eq!(entry.simplified, "汉字");
        assert_eq!(entry.pinyin, "han4 zi4");
        assert!(entry.is_word);
    }

    #[test]
    fn test_parse_invalid_line() {
        let line = "Invalid line without proper format";
        assert!(parse_cedict_line(line).is_none());
    }
}
