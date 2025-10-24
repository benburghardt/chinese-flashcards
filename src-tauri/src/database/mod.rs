use rusqlite::{Connection, Result};
use std::sync::Mutex;
use std::path::PathBuf;
use std::fs;
use crate::srs::{SrsCard, calculate_next_review};
use std::collections::HashMap;

pub struct DbConnection(pub Mutex<Connection>);

pub fn initialize_database() -> Result<DbConnection> {
    // Get the app data directory
    let app_data_dir = if cfg!(debug_assertions) {
        // In development, use a local directory
        PathBuf::from(".")
    } else {
        // In production, use the system's app data directory
        dirs::data_local_dir()
            .expect("Failed to get app data directory")
            .join("chinese-flashcards")
    };

    // Create the app data directory if it doesn't exist
    fs::create_dir_all(&app_data_dir)
        .expect("Failed to create app data directory");

    // Path to the user's database (writable)
    let user_db_path = app_data_dir.join("chinese.db");

    // Path to the master database (read-only, in resources)
    let master_db_path = if cfg!(debug_assertions) {
        // Try resources first, then project root
        let resources_path = PathBuf::from("resources/chinese.db");
        if resources_path.exists() {
            resources_path
        } else {
            PathBuf::from("chinese.db")
        }
    } else {
        PathBuf::from("chinese.db") // Tauri will resolve this
    };

    // If user database doesn't exist, copy from master or build it
    if !user_db_path.exists() {
        if master_db_path.exists() {
            println!("[DB] First run detected. Copying master database to user data directory...");
            println!("[DB] Source: {:?}", master_db_path);
            println!("[DB] Destination: {:?}", user_db_path);

            fs::copy(&master_db_path, &user_db_path)
                .expect("Failed to copy database to app data directory");

            println!("[DB] Database copied successfully");
        } else {
            // No master database exists, build it automatically
            println!("[DB] No master database found. Building database automatically...");
            println!("[DB] This may take a minute on first run...");

            match build_database_if_needed() {
                Ok(db_path) => {
                    println!("[DB] Database built successfully at: {:?}", db_path);

                    // Copy to user directory
                    fs::copy(&db_path, &user_db_path)
                        .expect("Failed to copy built database to app data directory");

                    println!("[DB] Database copied to user directory");
                }
                Err(e) => {
                    panic!("Failed to build database automatically: {}. Please ensure datasets are in the 'datasets' folder.", e);
                }
            }
        }
    } else {
        println!("[DB] Using existing database at {:?}", user_db_path);
    }

    // Open the user database (not the resources one!)
    println!("[DB] Opening database at {:?}", user_db_path);
    let conn = Connection::open(&user_db_path)?;
    println!("[DB] Database opened successfully");

    // Run migrations
    run_migrations(&conn)?;

    // Initialize new user with first 30 characters if this is a new database
    println!("[DB] Checking if initial unlock completed...");
    let initial_unlock_completed = get_setting(&conn, "initial_unlock_completed")
        .unwrap_or_else(|e| {
            println!("[DB] Error getting initial_unlock_completed setting: {}", e);
            "false".to_string()
        });

    println!("[DB] initial_unlock_completed = {}", initial_unlock_completed);

    if initial_unlock_completed == "false" {
        println!("[DB] New user detected. Initializing with first 100 characters...");
        match initialize_new_user_characters(&conn) {
            Ok(count) => println!("[DB] Successfully initialized {} characters for new user", count),
            Err(e) => {
                eprintln!("[DB] ERROR: Failed to initialize new user characters: {}", e);
                eprintln!("[DB] This means no characters will be available to learn!");
            }
        }
    } else {
        println!("[DB] User already initialized (initial_unlock_completed = true)");
    }

    Ok(DbConnection(Mutex::new(conn)))
}

fn run_migrations(conn: &Connection) -> Result<()> {
    // Get current schema version
    let version: i32 = conn
        .query_row("SELECT MAX(version) FROM schema_version", [], |row| row.get(0))
        .unwrap_or_else(|e| {
            println!("[DB] Warning: Could not read schema_version, assuming version 0: {}", e);
            0
        });

    println!("[DB] Current schema version: {}", version);

    // Migration 2: Add time-based character introduction settings
    if version < 2 {
        println!("[DB] Running migration 2: Time-based character introduction");

        let result = conn.execute(
            "INSERT OR IGNORE INTO app_settings (key, value) VALUES
             ('last_unlock_date', ''),
             ('initial_unlock_completed', 'false')",
            []
        );

        match result {
            Ok(rows) => println!("[DB] Migration 2: Inserted {} app_settings rows", rows),
            Err(e) => println!("[DB] Migration 2 warning: Error inserting app_settings: {}", e),
        }

        conn.execute(
            "INSERT INTO schema_version (version, description) VALUES (2, 'Time-based character introduction')",
            []
        )?;

        println!("[DB] Migration 2 completed");
    }

    Ok(())
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

    // Convert to SQLite datetime format (YYYY-MM-DD HH:MM:SS)
    // SQLite's datetime() function uses this format, and we need to match it for comparisons
    let next_review_sqlite = update.next_review_date.format("%Y-%m-%d %H:%M:%S").to_string();

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
            next_review_sqlite,
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

// === Self-Study Functions ===

/// Get cards for self-study (not currently due in SRS)
/// Prioritizes least recently practiced cards
pub fn get_self_study_cards(conn: &Connection, limit: usize) -> Result<Vec<DueCard>> {
    let mut stmt = conn.prepare(
        "SELECT c.id, c.character, c.mandarin_pinyin, c.definition,
                p.current_interval_days, p.times_reviewed
         FROM characters c
         JOIN user_progress p ON c.id = p.character_id
         WHERE p.next_review_date > datetime('now')
           AND p.introduced = 1
         ORDER BY
           COALESCE(
             (SELECT MAX(practiced_at) FROM practice_history
              WHERE character_id = c.id AND practice_mode = 'self-study'),
             datetime('1970-01-01')
           ) ASC
         LIMIT ?1"
    )?;

    let cards = stmt.query_map([limit], |row| {
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

/// Record a practice attempt in the practice_history table
pub fn record_practice_history(
    conn: &Connection,
    character_id: i32,
    practice_mode: &str,
    arrow_tested: &str,
    user_answer: &str,
    is_correct: bool,
) -> Result<()> {
    conn.execute(
        "INSERT INTO practice_history
         (character_id, practice_mode, arrow_tested, user_answer, is_correct, practiced_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))",
        rusqlite::params![
            character_id,
            practice_mode,
            arrow_tested,
            user_answer,
            is_correct,
        ]
    )?;
    Ok(())
}

// === App Settings Functions ===

pub fn get_setting(conn: &Connection, key: &str) -> Result<String> {
    conn.query_row(
        "SELECT value FROM app_settings WHERE key = ?1",
        [key],
        |row| row.get(0)
    )
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key, value, updated_at)
         VALUES (?1, ?2, datetime('now'))",
        rusqlite::params![key, value]
    )?;
    Ok(())
}

// === Time-Based Character Introduction Functions ===

/// Get count of characters ready to learn (unlocked but not introduced)
pub fn get_ready_to_learn_count(conn: &Connection) -> Result<usize> {
    let count: usize = conn.query_row(
        "SELECT COUNT(*) FROM user_progress WHERE introduced = 0",
        [],
        |row| row.get(0)
    )?;
    Ok(count)
}

/// Get count of all introduced characters
pub fn get_introduced_count(conn: &Connection) -> Result<usize> {
    let count: usize = conn.query_row(
        "SELECT COUNT(*) FROM user_progress WHERE introduced = 1",
        [],
        |row| row.get(0)
    )?;
    Ok(count)
}

/// Initialize new user with first 30 characters
pub fn initialize_new_user_characters(conn: &Connection) -> Result<usize> {
    // Check if already initialized
    let initial_unlock_completed = get_setting(conn, "initial_unlock_completed")
        .unwrap_or_else(|_| "false".to_string());

    if initial_unlock_completed == "true" {
        println!("[DB] Initial characters already unlocked");
        return Ok(0);
    }

    println!("[DB] Initializing new user with first 30 characters");

    // Get first 30 characters by frequency that aren't in user_progress
    let mut stmt = conn.prepare(
        "SELECT c.id
         FROM characters c
         WHERE c.is_word = 0
           AND NOT EXISTS (
               SELECT 1 FROM user_progress p
               WHERE p.character_id = c.id
           )
         ORDER BY c.frequency_rank ASC
         LIMIT 100"
    )?;

    let character_ids: Vec<i32> = stmt.query_map([], |row| row.get(0))?
        .collect::<Result<Vec<i32>>>()?;

    let count = character_ids.len();

    // Insert all 30 into user_progress with introduced = 0
    for character_id in character_ids {
        conn.execute(
            "INSERT INTO user_progress
             (character_id, current_interval_days, previous_interval_days, next_review_date, introduced)
             VALUES (?1, 0.0417, 0.0417, datetime('now'), 0)",
            [character_id]
        )?;
    }

    // Mark initial unlock as completed
    set_setting(conn, "initial_unlock_completed", "true")?;

    println!("[DB] Unlocked {} initial characters", count);
    Ok(count)
}

/// Unlock next batch of characters (10) if conditions are met
/// Returns: (number_unlocked, can_unlock_more)
pub fn check_and_unlock_characters(conn: &Connection) -> Result<(usize, bool)> {
    use chrono::{DateTime, Utc, Duration};

    // Check if initial unlock is done
    let initial_unlock_completed = get_setting(conn, "initial_unlock_completed")
        .unwrap_or_else(|_| "false".to_string());

    if initial_unlock_completed != "true" {
        // Initialize new user
        let count = initialize_new_user_characters(conn)?;
        return Ok((count, false)); // Don't unlock more until 2 days after intro
    }

    // Check if ready-to-learn queue is empty
    let ready_to_learn = get_ready_to_learn_count(conn)?;
    if ready_to_learn > 0 {
        println!("[DB] Still have {} characters ready to learn. Not unlocking more.", ready_to_learn);
        return Ok((0, false));
    }

    // Check if 2 days have passed since last unlock
    let last_unlock_str = get_setting(conn, "last_unlock_date")
        .unwrap_or_else(|_| "".to_string());

    let can_unlock = if last_unlock_str.is_empty() {
        // First unlock after initial batch - allow it
        true
    } else {
        // Parse last unlock date from SQLite datetime format (YYYY-MM-DD HH:MM:SS)
        use chrono::NaiveDateTime;
        if let Ok(naive_dt) = NaiveDateTime::parse_from_str(&last_unlock_str, "%Y-%m-%d %H:%M:%S") {
            let last_unlock = DateTime::<Utc>::from_naive_utc_and_offset(naive_dt, Utc);
            let now = Utc::now();
            let elapsed = now.signed_duration_since(last_unlock);

            println!("[DB] Last unlock was {} hours ago", elapsed.num_hours());

            // Must wait 2 days (48 hours)
            elapsed >= Duration::hours(48)
        } else {
            // Invalid date format, allow unlock
            println!("[DB] Invalid last_unlock_date format: {}", last_unlock_str);
            true
        }
    };

    if !can_unlock {
        println!("[DB] Haven't waited 2 days since last unlock yet");
        return Ok((0, false));
    }

    // Unlock next 10 characters
    println!("[DB] Unlocking next 10 characters");

    let mut stmt = conn.prepare(
        "SELECT c.id
         FROM characters c
         WHERE c.is_word = 0
           AND NOT EXISTS (
               SELECT 1 FROM user_progress p
               WHERE p.character_id = c.id
           )
         ORDER BY c.frequency_rank ASC
         LIMIT 10"
    )?;

    let character_ids: Vec<i32> = stmt.query_map([], |row| row.get(0))?
        .collect::<Result<Vec<i32>>>()?;

    let count = character_ids.len();

    if count == 0 {
        println!("[DB] No more characters to unlock!");
        return Ok((0, false));
    }

    // Insert into user_progress
    for character_id in character_ids {
        conn.execute(
            "INSERT INTO user_progress
             (character_id, current_interval_days, previous_interval_days, next_review_date, introduced)
             VALUES (?1, 0.0417, 0.0417, datetime('now'), 0)",
            [character_id]
        )?;
    }

    // Update last unlock date (use SQLite datetime format)
    let now = Utc::now();
    let now_sqlite = now.format("%Y-%m-%d %H:%M:%S").to_string();
    set_setting(conn, "last_unlock_date", &now_sqlite)?;

    println!("[DB] Unlocked {} characters", count);
    Ok((count, true))
}

/// Get time until next unlock is available (in hours)
/// Returns None if queue is not empty or characters can be unlocked now
pub fn get_hours_until_next_unlock(conn: &Connection) -> Result<Option<i64>> {
    use chrono::{DateTime, Utc};

    // Check if ready-to-learn queue is empty
    let ready_to_learn = get_ready_to_learn_count(conn)?;
    if ready_to_learn > 0 {
        return Ok(None); // Queue not empty
    }

    // Check last unlock date
    let last_unlock_str = get_setting(conn, "last_unlock_date")
        .unwrap_or_else(|_| "".to_string());

    if last_unlock_str.is_empty() {
        return Ok(Some(0)); // Can unlock now
    }

    // Parse from SQLite datetime format (YYYY-MM-DD HH:MM:SS)
    use chrono::NaiveDateTime;
    if let Ok(naive_dt) = NaiveDateTime::parse_from_str(&last_unlock_str, "%Y-%m-%d %H:%M:%S") {
        let last_unlock = DateTime::<Utc>::from_naive_utc_and_offset(naive_dt, Utc);
        let now = Utc::now();
        let elapsed = now.signed_duration_since(last_unlock);
        let hours_elapsed = elapsed.num_hours();

        if hours_elapsed >= 48 {
            Ok(Some(0)) // Can unlock now
        } else {
            Ok(Some(48 - hours_elapsed)) // Hours remaining
        }
    } else {
        Ok(Some(0)) // Invalid date, can unlock now
    }
}

/// Start a new study session and return the session ID
pub fn start_study_session(conn: &Connection, mode: &str) -> Result<i32> {
    conn.execute(
        "INSERT INTO study_sessions (mode, started_at)
         VALUES (?1, datetime('now'))",
        [mode]
    )?;

    let session_id = conn.last_insert_rowid() as i32;
    Ok(session_id)
}

/// End a study session with final statistics
pub fn end_study_session(
    conn: &Connection,
    session_id: i32,
    cards_studied: i32,
    cards_correct: i32,
    cards_incorrect: i32,
) -> Result<()> {
    conn.execute(
        "UPDATE study_sessions
         SET ended_at = datetime('now'),
             cards_studied = ?1,
             cards_correct = ?2,
             cards_incorrect = ?3,
             duration_seconds = CAST((julianday(datetime('now')) - julianday(started_at)) * 86400 AS INTEGER)
         WHERE id = ?4",
        rusqlite::params![cards_studied, cards_correct, cards_incorrect, session_id]
    )?;
    Ok(())
}

/// Calculate study streak (consecutive days with study sessions)
pub fn calculate_study_streak(conn: &Connection) -> Result<i32> {
    use chrono::{NaiveDate, Utc, Duration};

    // Get all unique study dates, ordered by date descending
    let mut stmt = conn.prepare(
        "SELECT DISTINCT DATE(started_at) as study_date
         FROM study_sessions
         WHERE started_at IS NOT NULL
         ORDER BY study_date DESC"
    )?;

    let dates: Vec<NaiveDate> = stmt.query_map([], |row| {
        let date_str: String = row.get(0)?;
        // Parse SQLite date format (YYYY-MM-DD)
        NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))
    })?
    .collect::<Result<Vec<_>>>()?;

    if dates.is_empty() {
        return Ok(0);
    }

    // Check if user studied today or yesterday (streak is still active)
    let today = Utc::now().date_naive();
    let yesterday = today - Duration::days(1);

    let most_recent_date = dates[0];

    // Streak is broken if last study was more than 1 day ago
    if most_recent_date < yesterday {
        return Ok(0);
    }

    // Count consecutive days
    let mut streak = 1;
    let mut expected_date = most_recent_date - Duration::days(1);

    for date in dates.iter().skip(1) {
        if *date == expected_date {
            streak += 1;
            expected_date = expected_date - Duration::days(1);
        } else {
            // Gap found, streak broken
            break;
        }
    }

    Ok(streak)
}

/// Build the database automatically from dataset files
fn build_database_if_needed() -> std::result::Result<PathBuf, Box<dyn std::error::Error>> {
    use data_processing::parsers::{cedict, subtlex};
    use data_processing::{merge_cedict_with_frequency_separated, database as db_builder};

    // Get project root and datasets directory
    let project_root = if cfg!(debug_assertions) {
        PathBuf::from(".")
    } else {
        std::env::current_exe()?
            .parent()
            .ok_or("Cannot find executable directory")?
            .to_path_buf()
    };

    let datasets_dir = project_root.join("datasets");
    let output_path = project_root.join("chinese.db");

    // Check if datasets exist
    if !datasets_dir.exists() {
        return Err(format!("Datasets directory not found at: {:?}", datasets_dir).into());
    }

    println!("[DB BUILD] Parsing CC-CEDICT...");
    let cedict_path = datasets_dir.join("cedict_ts.u8");
    if !cedict_path.exists() {
        return Err(format!("CC-CEDICT file not found at: {:?}", cedict_path).into());
    }
    let cedict_entries = cedict::parse_cedict_file(cedict_path.to_str().unwrap())?;
    println!("[DB BUILD] Loaded {} CEDICT entries", cedict_entries.len());

    println!("[DB BUILD] Parsing SUBTLEX-CH...");
    let char_freq_path = datasets_dir.join("SUBTLEX-CH").join("SUBTLEX-CH-CHR");
    if !char_freq_path.exists() {
        return Err(format!("SUBTLEX-CH character file not found at: {:?}", char_freq_path).into());
    }
    let char_freq = subtlex::parse_subtlex_character_file(char_freq_path.to_str().unwrap())?;

    let word_freq_path = datasets_dir.join("SUBTLEX-CH").join("SUBTLEX-CH-WF_PoS");
    if !word_freq_path.exists() {
        return Err(format!("SUBTLEX-CH word file not found at: {:?}", word_freq_path).into());
    }
    let word_freq = subtlex::parse_subtlex_word_file(word_freq_path.to_str().unwrap())?;

    println!("[DB BUILD] Loaded {} character frequencies and {} word frequencies",
        char_freq.len(), word_freq.len());

    println!("[DB BUILD] Merging data...");
    let enriched = merge_cedict_with_frequency_separated(cedict_entries, char_freq, word_freq);
    println!("[DB BUILD] Created {} enriched entries", enriched.len());

    println!("[DB BUILD] Creating SQLite database...");
    db_builder::create_database(enriched, output_path.to_str().unwrap())?;

    println!("[DB BUILD] Database created successfully!");

    Ok(output_path)
}
