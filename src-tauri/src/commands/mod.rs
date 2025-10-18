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
    let conn = db.0.lock().unwrap();
    crate::database::record_srs_answer(&conn, character_id, correct)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unlock_new_character(db: State<DbConnection>) -> Result<Option<Character>, String> {
    let conn = db.0.lock().unwrap();
    crate::database::unlock_next_character(&conn)
        .map_err(|e| e.to_string())
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
pub fn introduce_multiple_characters(
    db: State<DbConnection>,
    count: i32,
) -> Result<String, String> {
    let conn = db.0.lock().unwrap();

    // Get the first 'count' character IDs from user_progress
    let mut stmt = conn.prepare(
        "SELECT character_id FROM user_progress ORDER BY character_id LIMIT ?1"
    ).map_err(|e| e.to_string())?;

    let char_ids: Vec<i32> = stmt.query_map([count], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Mark each as introduced
    for char_id in &char_ids {
        crate::database::mark_character_introduced(&conn, *char_id)
            .map_err(|e| e.to_string())?;
    }

    Ok(format!("Introduced {} characters (IDs: {:?})", char_ids.len(), char_ids))
}
