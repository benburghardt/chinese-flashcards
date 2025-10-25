use rusqlite::{Connection, Result};
use std::collections::HashMap;

#[derive(Debug)]
struct ScoredItem {
    id: i32,
    character: String,
    frequency_rank: i32,
    is_word: bool,
    score: f64,
    component_characters: Option<String>,
    component_info: Option<String>,
}

fn main() -> Result<()> {
    let db_path = "../src-tauri/chinese.db";
    let conn = Connection::open(db_path)?;

    println!("=== Analyzing Introduction Scores ===\n");

    // Get all characters (limit to top 1000 by frequency)
    let mut char_stmt = conn.prepare(
        "SELECT id, character, frequency_rank
         FROM characters
         WHERE is_word = 0
         ORDER BY frequency_rank ASC
         LIMIT 1000"
    )?;

    let chars: Vec<ScoredItem> = char_stmt.query_map([], |row| {
        let freq_rank: i32 = row.get(2)?;
        Ok(ScoredItem {
            id: row.get(0)?,
            character: row.get(1)?,
            frequency_rank: freq_rank,
            is_word: false,
            score: freq_rank as f64,
            component_characters: None,
            component_info: None,
        })
    })?.collect::<Result<Vec<_>>>()?;

    println!("Loaded {} characters", chars.len());

    // Get all words (limit to top 5000 by frequency)
    let mut word_stmt = conn.prepare(
        "SELECT id, character, frequency_rank, component_characters
         FROM characters
         WHERE is_word = 1
         ORDER BY frequency_rank ASC
         LIMIT 5000"
    )?;

    let words: Vec<(i32, String, i32, Option<String>)> = word_stmt
        .query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
        })?
        .collect::<Result<Vec<_>>>()?;

    println!("Loaded {} words\n", words.len());

    // Score each word
    let mut scored_words = Vec::new();
    let mut words_with_scores = 0;

    for (id, character, word_freq, component_chars) in words {
        if let Some(components) = &component_chars {
            let comp_ids: Vec<i32> = components
                .split(',')
                .filter_map(|s| s.trim().parse().ok())
                .collect();

            if !comp_ids.is_empty() {
                let mut component_ranks = Vec::new();
                let mut comp_chars = Vec::new();

                for comp_id in &comp_ids {
                    if let Ok(rank) = conn.query_row(
                        "SELECT frequency_rank, character FROM characters WHERE id = ?1",
                        [comp_id],
                        |row| Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?))
                    ) {
                        component_ranks.push(rank.0);
                        comp_chars.push(format!("{}({})", rank.1, rank.0));
                    }
                }

                if !component_ranks.is_empty() {
                    let max_component_rank = *component_ranks.iter().max().unwrap();
                    let score = max_component_rank as f64 + (word_freq as f64 * 0.01);

                    scored_words.push(ScoredItem {
                        id,
                        character: character.clone(),
                        frequency_rank: word_freq,
                        is_word: true,
                        score,
                        component_characters: Some(components.clone()),
                        component_info: Some(comp_chars.join(", ")),
                    });
                    words_with_scores += 1;
                }
            }
        }
    }

    println!("Scored {} words with valid components\n", words_with_scores);

    // Combine all items
    let mut all_items: Vec<ScoredItem> = chars.into_iter()
        .chain(scored_words.into_iter())
        .collect();

    // Sort by score
    all_items.sort_by(|a, b| a.score.partial_cmp(&b.score).unwrap_or(std::cmp::Ordering::Equal));

    // Display first 100 items
    println!("=== FIRST 100 INTRODUCTIONS (by score) ===\n");
    println!("{:<4} {:<8} {:<6} {:<10} {:<10} {}",
             "Rank", "Type", "Char", "FreqRank", "Score", "Components");
    println!("{}", "=".repeat(80));

    for (i, item) in all_items.iter().take(100).enumerate() {
        let item_type = if item.is_word { "WORD" } else { "CHAR" };
        let comp_info = item.component_info.as_deref().unwrap_or("-");

        println!("{:<4} {:<8} {:<6} {:<10} {:<10.2} {}",
                 i + 1,
                 item_type,
                 item.character,
                 item.frequency_rank,
                 item.score,
                 comp_info);
    }

    // Count words in first 50
    let words_in_first_50 = all_items.iter().take(50).filter(|i| i.is_word).count();
    let words_in_first_100 = all_items.iter().take(100).filter(|i| i.is_word).count();

    println!("\n=== SUMMARY ===");
    println!("Words in first 50: {}", words_in_first_50);
    println!("Words in first 100: {}", words_in_first_100);

    Ok(())
}
