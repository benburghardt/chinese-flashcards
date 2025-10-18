use rusqlite::{Connection, Result};
use std::sync::Mutex;
use crate::srs::{SrsCard, calculate_next_review};

pub struct DbConnection(pub Mutex<Connection>);

pub fn initialize_database() -> Result<DbConnection> {
    // In development, use local file
    // In production, use bundled resource
    let db_path = if cfg!(debug_assertions) {
        "resources/chinese.db"
    } else {
        // Tauri will resolve this to the resources directory
        "chinese.db"
    };

    let conn = Connection::open(db_path)?;
    Ok(DbConnection(Mutex::new(conn)))
}

#[derive(serde::Serialize)]
pub struct Character {
    pub id: i32,
    pub character: String,
    pub simplified: String,
    pub traditional: Option<String>,
    pub mandarin_pinyin: String,
    pub definition: String,
    pub frequency_rank: i32,
    pub is_word: bool,
}

pub fn get_character_by_id(conn: &Connection, id: i32) -> Result<Character> {
    conn.query_row(
        "SELECT id, character, simplified, traditional, mandarin_pinyin,
                definition, frequency_rank, is_word
         FROM characters WHERE id = ?1",
        [id],
        |row| {
            Ok(Character {
                id: row.get(0)?,
                character: row.get(1)?,
                simplified: row.get(2)?,
                traditional: row.get(3)?,
                mandarin_pinyin: row.get(4)?,
                definition: row.get(5)?,
                frequency_rank: row.get(6)?,
                is_word: row.get(7)?,
            })
        }
    )
}

pub fn get_characters_by_frequency(conn: &Connection, limit: usize) -> Result<Vec<Character>> {
    let mut stmt = conn.prepare(
        "SELECT id, character, simplified, traditional, mandarin_pinyin,
                definition, frequency_rank, is_word
         FROM characters
         WHERE is_word = 0
         ORDER BY frequency_rank ASC
         LIMIT ?1"
    )?;

    let chars = stmt.query_map([limit], |row| {
        Ok(Character {
            id: row.get(0)?,
            character: row.get(1)?,
            simplified: row.get(2)?,
            traditional: row.get(3)?,
            mandarin_pinyin: row.get(4)?,
            definition: row.get(5)?,
            frequency_rank: row.get(6)?,
            is_word: row.get(7)?,
        })
    })?;

    chars.collect()
}

// === SRS Functions ===

#[derive(serde::Serialize)]
pub struct DueCard {
    pub character_id: i32,
    pub character: String,
    pub pinyin: String,
    pub definition: String,
    pub current_interval: f32,
    pub times_reviewed: i32,
}

pub fn get_due_cards(conn: &Connection) -> Result<Vec<DueCard>> {
    let mut stmt = conn.prepare(
        "SELECT c.id, c.character, c.mandarin_pinyin, c.definition,
                p.current_interval_days, p.times_reviewed
         FROM characters c
         JOIN user_progress p ON c.id = p.character_id
         WHERE p.introduced = 1
           AND p.next_review_date <= datetime('now')
         ORDER BY p.next_review_date ASC"
    )?;

    let cards = stmt.query_map([], |row| {
        Ok(DueCard {
            character_id: row.get(0)?,
            character: row.get(1)?,
            pinyin: row.get(2)?,
            definition: row.get(3)?,
            current_interval: row.get(4)?,
            times_reviewed: row.get(5)?,
        })
    })?;

    cards.collect()
}

pub fn get_srs_card_state(conn: &Connection, character_id: i32) -> Result<SrsCard> {
    conn.query_row(
        "SELECT character_id, current_interval_days, previous_interval_days,
                ease_factor, times_correct, times_incorrect, has_reached_week
         FROM user_progress
         WHERE character_id = ?1",
        [character_id],
        |row| {
            Ok(SrsCard {
                character_id: row.get(0)?,
                current_interval_days: row.get(1)?,
                previous_interval_days: row.get(2)?,
                ease_factor: row.get(3)?,
                times_correct: row.get(4)?,
                times_incorrect: row.get(5)?,
                has_reached_week: row.get(6)?,
            })
        }
    )
}

pub fn record_srs_answer(
    conn: &Connection,
    character_id: i32,
    correct: bool,
) -> Result<bool> {
    // Get current card state
    let card = get_srs_card_state(conn, character_id)?;

    // Calculate new values
    let update = calculate_next_review(&card, correct);

    // Update database
    conn.execute(
        "UPDATE user_progress
         SET previous_interval_days = current_interval_days,
             current_interval_days = ?1,
             ease_factor = ?2,
             next_review_date = ?3,
             times_reviewed = times_reviewed + 1,
             times_correct = times_correct + ?4,
             times_incorrect = times_incorrect + ?5,
             has_reached_week = has_reached_week OR ?6,
             last_reviewed = datetime('now'),
             updated_at = datetime('now')
         WHERE character_id = ?7",
        rusqlite::params![
            update.new_interval_days,
            update.new_ease_factor,
            update.next_review_date.to_rfc3339(),
            if correct { 1 } else { 0 },
            if correct { 0 } else { 1 },
            update.reached_week_for_first_time,
            character_id,
        ]
    )?;

    Ok(update.reached_week_for_first_time)
}

pub fn unlock_next_character(conn: &Connection) -> Result<Option<Character>> {
    // Get next character by frequency that isn't in user_progress yet
    let result: Result<Character> = conn.query_row(
        "SELECT c.id, c.character, c.simplified, c.traditional,
                c.mandarin_pinyin, c.definition, c.frequency_rank, c.is_word
         FROM characters c
         WHERE c.is_word = 0
           AND NOT EXISTS (
               SELECT 1 FROM user_progress p
               WHERE p.character_id = c.id
           )
         ORDER BY c.frequency_rank ASC
         LIMIT 1",
        [],
        |row| {
            Ok(Character {
                id: row.get(0)?,
                character: row.get(1)?,
                simplified: row.get(2)?,
                traditional: row.get(3)?,
                mandarin_pinyin: row.get(4)?,
                definition: row.get(5)?,
                frequency_rank: row.get(6)?,
                is_word: row.get(7)?,
            })
        }
    );

    match result {
        Ok(character) => {
            // Add to user_progress (not yet introduced)
            // Start with 1 hour interval (0.0417 days)
            conn.execute(
                "INSERT INTO user_progress
                 (character_id, current_interval_days, previous_interval_days, next_review_date, introduced)
                 VALUES (?1, 0.0417, 0.0417, datetime('now'), 0)",
                [character.id]
            )?;

            Ok(Some(character))
        }
        Err(_) => Ok(None), // No more characters to unlock
    }
}

pub fn mark_character_introduced(conn: &Connection, character_id: i32) -> Result<()> {
    conn.execute(
        "UPDATE user_progress
         SET introduced = 1,
             updated_at = datetime('now')
         WHERE character_id = ?1",
        [character_id]
    )?;
    Ok(())
}
