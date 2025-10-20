use crate::database::{DbConnection, Character, DueCard};
use tauri::State;

#[tauri::command]
pub fn get_character(db: State<DbConnection>, id: i32) -> Result<Character, String> {
    let conn = db.0.lock().unwrap();
    crate::database::get_character_by_id(&conn, id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_top_characters(db: State<DbConnection>, limit: usize) -> Result<Vec<Character>, String> {
    let conn = db.0.lock().unwrap();
    crate::database::get_characters_by_frequency(&conn, limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn test_database_connection(db: State<DbConnection>) -> Result<String, String> {
    let conn = db.0.lock().unwrap();
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM characters",
        [],
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    Ok(format!("Database connected! {} characters available", count))
}

// === SRS Commands ===

#[tauri::command]
pub fn get_due_cards_for_review(db: State<DbConnection>) -> Result<Vec<DueCard>, String> {
    let conn = db.0.lock().unwrap();
    crate::database::get_due_cards(&conn)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn submit_srs_answer(
    db: State<DbConnection>,
    character_id: i32,
    correct: bool,
) -> Result<bool, String> {
    println!("[RUST] submit_srs_answer called: char_id={}, correct={}", character_id, correct);
    let conn = db.0.lock().unwrap();
    let result = crate::database::record_srs_answer(&conn, character_id, correct)
        .map_err(|e| {
            eprintln!("[RUST] ERROR in record_srs_answer: {}", e);
            e.to_string()
        });
    println!("[RUST] submit_srs_answer result: {:?}", result);
    result
}

#[tauri::command]
pub fn unlock_new_character(db: State<DbConnection>) -> Result<Option<Character>, String> {
    println!("[RUST] unlock_new_character called");
    let conn = db.0.lock().unwrap();
    let result = crate::database::unlock_next_character(&conn)
        .map_err(|e| {
            eprintln!("[RUST] ERROR in unlock_new_character: {}", e);
            e.to_string()
        });
    println!("[RUST] unlock_new_character result: {:?}", result.as_ref().map(|opt| opt.as_ref().map(|c| &c.character)));
    result
}

#[tauri::command]
pub fn introduce_character(
    db: State<DbConnection>,
    character_id: i32,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    crate::database::mark_character_introduced(&conn, character_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn introduce_character_immediately_reviewable(
    db: State<DbConnection>,
    character_id: i32,
) -> Result<(), String> {
    println!("[RUST] introduce_character_immediately_reviewable called for char_id={}", character_id);
    let conn = db.0.lock().unwrap();

    // Mark character as introduced and set next review to now (immediately reviewable)
    // Use '-1 second' to ensure the review date is definitely in the past
    conn.execute(
        "UPDATE user_progress
         SET introduced = 1,
             current_interval_days = 0.04167,
             next_review_date = datetime('now', '-1 second'),
             updated_at = datetime('now')
         WHERE character_id = ?1",
        [character_id]
    ).map_err(|e| {
        eprintln!("[RUST] Error updating character {}: {}", character_id, e);
        e.to_string()
    })?;

    println!("[RUST] Marked character {} as introduced and immediately reviewable", character_id);
    Ok(())
}

#[tauri::command]
pub fn get_available_to_learn_count(db: State<DbConnection>) -> Result<i32, String> {
    let conn = db.0.lock().unwrap();

    // Count characters that have been unlocked but not yet introduced
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_progress p
         WHERE p.introduced = 0",
        [],
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    Ok(count)
}

#[tauri::command]
pub fn get_unlocked_characters_batch(
    db: State<DbConnection>,
    batch_size: i32,
) -> Result<Vec<Character>, String> {
    let conn = db.0.lock().unwrap();

    // Get characters that have been unlocked but not yet introduced
    let mut stmt = conn.prepare(
        "SELECT c.id, c.character, c.simplified, c.traditional,
                c.mandarin_pinyin, c.definition, c.frequency_rank, c.is_word
         FROM characters c
         INNER JOIN user_progress p ON c.id = p.character_id
         WHERE p.introduced = 0
         ORDER BY c.frequency_rank ASC
         LIMIT ?1"
    ).map_err(|e| e.to_string())?;

    let characters = stmt.query_map([batch_size], |row| {
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
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    Ok(characters)
}

#[tauri::command]
pub fn complete_initial_srs_session(
    db: State<DbConnection>,
    character_ids: Vec<i32>,
) -> Result<String, String> {
    println!("[RUST] complete_initial_srs_session called with {} characters", character_ids.len());
    let conn = db.0.lock().unwrap();

    for char_id in &character_ids {
        // Mark character as introduced and set next review to 1 hour from now
        conn.execute(
            "UPDATE user_progress
             SET introduced = 1,
                 current_interval_days = 0.04167,
                 next_review_date = datetime('now', '+1 hour'),
                 updated_at = datetime('now')
             WHERE character_id = ?1",
            [char_id]
        ).map_err(|e| {
            eprintln!("[RUST] Error updating character {}: {}", char_id, e);
            e.to_string()
        })?;

        println!("[RUST] Marked character {} as introduced with 1-hour interval", char_id);
    }

    let result = format!("Completed initial SRS for {} characters", character_ids.len());
    println!("[RUST] {}", result);
    Ok(result)
}

#[tauri::command]
pub fn mark_incomplete_characters_reviewable(
    db: State<DbConnection>,
    character_ids: Vec<i32>,
) -> Result<String, String> {
    println!("[RUST] mark_incomplete_characters_reviewable called with {} characters", character_ids.len());
    let conn = db.0.lock().unwrap();

    for char_id in &character_ids {
        // Mark character as introduced and immediately reviewable
        // Use '-1 second' to ensure the review date is definitely in the past
        conn.execute(
            "UPDATE user_progress
             SET introduced = 1,
                 current_interval_days = 0.04167,
                 next_review_date = datetime('now', '-1 second'),
                 updated_at = datetime('now')
             WHERE character_id = ?1",
            [char_id]
        ).map_err(|e| {
            eprintln!("[RUST] Error updating character {}: {}", char_id, e);
            e.to_string()
        })?;

        println!("[RUST] Marked incomplete character {} as immediately reviewable", char_id);
    }

    let result = format!("Marked {} incomplete characters as immediately reviewable", character_ids.len());
    println!("[RUST] {}", result);
    Ok(result)
}

#[tauri::command]
pub fn introduce_multiple_characters(
    db: State<DbConnection>,
    count: i32,
) -> Result<String, String> {
    println!("[RUST] introduce_multiple_characters called with count={}", count);
    let conn = db.0.lock().unwrap();

    // Get 'count' most frequent characters that are NOT yet in user_progress
    let mut stmt = conn.prepare(
        "SELECT c.id FROM characters c
         WHERE c.is_word = 0
           AND NOT EXISTS (
               SELECT 1 FROM user_progress p
               WHERE p.character_id = c.id
           )
         ORDER BY c.frequency_rank ASC
         LIMIT ?1"
    ).map_err(|e| {
        eprintln!("[RUST] Error preparing query: {}", e);
        e.to_string()
    })?;

    let char_ids: Vec<i32> = stmt.query_map([count], |row| row.get(0))
        .map_err(|e| {
            eprintln!("[RUST] Error executing query: {}", e);
            e.to_string()
        })?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| {
            eprintln!("[RUST] Error collecting results: {}", e);
            e.to_string()
        })?;

    println!("[RUST] Found {} characters to introduce: {:?}", char_ids.len(), char_ids);

    // For each character, add to user_progress and mark as introduced
    for char_id in &char_ids {
        println!("[RUST] Adding character {} to user_progress", char_id);

        // Insert into user_progress with initial SRS values
        conn.execute(
            "INSERT INTO user_progress
             (character_id, current_interval_days, previous_interval_days,
              next_review_date, introduced)
             VALUES (?1, 0.0417, 0.0417, datetime('now'), 1)",
            [char_id]
        ).map_err(|e| {
            eprintln!("[RUST] Error inserting character {}: {}", char_id, e);
            e.to_string()
        })?;
    }

    let result = format!("Introduced {} new characters (IDs: {:?})", char_ids.len(), char_ids);
    println!("[RUST] {}", result);
    Ok(result)
}

#[tauri::command]
pub fn get_characters_for_initial_study(
    db: State<DbConnection>,
    character_ids: Vec<i32>,
) -> Result<Vec<DueCard>, String> {
    let conn = db.0.lock().unwrap();

    let mut cards = Vec::new();
    for char_id in character_ids {
        let card: Result<DueCard, rusqlite::Error> = conn.query_row(
            "SELECT c.id, c.character, c.mandarin_pinyin, c.definition,
                    p.current_interval_days, p.times_reviewed
             FROM characters c
             JOIN user_progress p ON c.id = p.character_id
             WHERE c.id = ?1",
            [char_id],
            |row| {
                Ok(DueCard {
                    character_id: row.get(0)?,
                    character: row.get(1)?,
                    pinyin: row.get(2)?,
                    definition: row.get(3)?,
                    current_interval: row.get(4)?,
                    times_reviewed: row.get(5)?,
                })
            }
        );

        if let Ok(card) = card {
            cards.push(card);
        }
    }

    Ok(cards)
}

// === Time-Based Character Introduction Commands ===

#[derive(serde::Serialize)]
pub struct UnlockStatus {
    pub unlocked_count: usize,
    pub ready_to_learn_count: usize,
    pub hours_until_next_unlock: Option<i64>,
}

#[tauri::command]
pub fn check_and_unlock_characters(db: State<DbConnection>) -> Result<UnlockStatus, String> {
    println!("[RUST] check_and_unlock_characters called");
    let conn = db.0.lock().unwrap();

    let (unlocked_count, _) = crate::database::check_and_unlock_characters(&conn)
        .map_err(|e| {
            eprintln!("[RUST] ERROR in check_and_unlock_characters: {}", e);
            e.to_string()
        })?;

    let ready_to_learn_count = crate::database::get_ready_to_learn_count(&conn)
        .map_err(|e| e.to_string())?;

    let hours_until_next_unlock = crate::database::get_hours_until_next_unlock(&conn)
        .map_err(|e| e.to_string())?;

    println!("[RUST] Unlock status: unlocked={}, ready={}, hours_until={:?}",
        unlocked_count, ready_to_learn_count, hours_until_next_unlock);

    Ok(UnlockStatus {
        unlocked_count,
        ready_to_learn_count,
        hours_until_next_unlock,
    })
}

#[tauri::command]
pub fn get_unlock_status(db: State<DbConnection>) -> Result<UnlockStatus, String> {
    let conn = db.0.lock().unwrap();

    let ready_to_learn_count = crate::database::get_ready_to_learn_count(&conn)
        .map_err(|e| e.to_string())?;

    let hours_until_next_unlock = crate::database::get_hours_until_next_unlock(&conn)
        .map_err(|e| e.to_string())?;

    Ok(UnlockStatus {
        unlocked_count: 0,
        ready_to_learn_count,
        hours_until_next_unlock,
    })
}

#[tauri::command]
pub fn mark_all_ready_characters_introduced(db: State<DbConnection>) -> Result<String, String> {
    println!("[RUST] mark_all_ready_characters_introduced called");
    let conn = db.0.lock().unwrap();

    // This triggers the 2-day timer to start
    // We update last_unlock_date when all ready-to-learn characters are introduced
    let ready_count = crate::database::get_ready_to_learn_count(&conn)
        .map_err(|e| e.to_string())?;

    if ready_count == 0 {
        // All characters have been introduced, set the timer
        use chrono::Utc;
        let now = Utc::now();
        crate::database::set_setting(&conn, "last_unlock_date", &now.to_rfc3339())
            .map_err(|e| e.to_string())?;

        println!("[RUST] All characters introduced. Timer set to: {}", now.to_rfc3339());
        Ok(format!("Timer set. Next unlock in 48 hours."))
    } else {
        Ok(format!("Still {} characters to introduce", ready_count))
    }
}

// === Self-Study Commands ===

#[tauri::command]
pub fn get_self_study_cards(db: State<DbConnection>, limit: usize) -> Result<Vec<DueCard>, String> {
    println!("[RUST] get_self_study_cards called with limit={}", limit);
    let conn = db.0.lock().unwrap();
    crate::database::get_self_study_cards(&conn, limit)
        .map_err(|e| {
            eprintln!("[RUST] ERROR in get_self_study_cards: {}", e);
            e.to_string()
        })
}

#[tauri::command]
pub fn record_practice(
    db: State<DbConnection>,
    character_id: i32,
    practice_mode: String,
    arrow_tested: String,
    user_answer: String,
    is_correct: bool,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    crate::database::record_practice_history(
        &conn,
        character_id,
        &practice_mode,
        &arrow_tested,
        &user_answer,
        is_correct,
    )
    .map_err(|e| e.to_string())
}
