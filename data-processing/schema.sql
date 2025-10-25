-- Chinese Learning Tool Database Schema
-- Version: 1.0
-- Supports: Phase 1 (Mandarin MVP), Phase 2 (Enhanced Features), Phase 3 (Cantonese)

-- =============================================================================
-- CHARACTERS AND WORDS TABLE
-- =============================================================================
-- Stores both individual characters and multi-character words
-- Supports Mandarin (Phase 1) and Cantonese (Phase 3)
CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character TEXT UNIQUE NOT NULL,              -- The actual character(s) or word
    simplified TEXT NOT NULL,                     -- Simplified form
    traditional TEXT,                             -- Traditional form (may be same as simplified)
    mandarin_pinyin TEXT NOT NULL,                -- Mandarin pronunciation (Phase 1)
    cantonese_jyutping TEXT,                      -- Cantonese pronunciation (Phase 3)
    definition TEXT NOT NULL,                     -- English definition(s)
    frequency_rank INTEGER NOT NULL,              -- From SUBTLEX-CH (lower = more common)
    stroke_count INTEGER,                         -- Number of strokes (Phase 2)
    radical TEXT,                                 -- Character radical (Phase 2)
    decomposition TEXT,                           -- Character breakdown (Phase 2)
    etymology TEXT,                               -- Etymology information (Phase 2)
    stroke_data_path TEXT,                        -- Path to stroke order SVG (Phase 2)
    is_word BOOLEAN DEFAULT 0,                    -- 0 = single character, 1 = word (multiple chars)
    component_characters TEXT,                    -- For words: comma-separated character IDs
    introduction_rank INTEGER,                    -- Pre-calculated rank for learning order (lower = earlier)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_frequency ON characters(frequency_rank);
CREATE INDEX idx_is_word ON characters(is_word);
CREATE INDEX idx_character ON characters(character);
CREATE INDEX idx_simplified ON characters(simplified);
CREATE INDEX idx_introduction_rank ON characters(introduction_rank);

-- =============================================================================
-- USER PROGRESS TABLE (SPACED REPETITION)
-- =============================================================================
-- Tracks user's learning progress for spaced repetition algorithm
-- Based on SM-2 algorithm with modifications
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,                -- Reference to character being learned
    current_interval_days REAL DEFAULT 1.0,       -- Current interval before next review
    previous_interval_days REAL DEFAULT 1.0,      -- Previous interval (for undo/rollback)
    next_review_date TIMESTAMP NOT NULL,          -- When to review next
    times_reviewed INTEGER DEFAULT 0,             -- Total review count
    times_correct INTEGER DEFAULT 0,              -- Correct answer count
    times_incorrect INTEGER DEFAULT 0,            -- Incorrect answer count
    ease_factor REAL DEFAULT 2.5,                 -- SM-2 ease factor (difficulty)
    has_reached_week BOOLEAN DEFAULT 0,           -- Progress milestone tracking
    last_reviewed TIMESTAMP,                      -- Last review timestamp
    introduced BOOLEAN DEFAULT 0,                 -- Has user seen this card yet?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Indexes for spaced repetition queries
CREATE INDEX idx_next_review ON user_progress(next_review_date);
CREATE INDEX idx_introduced ON user_progress(introduced);
CREATE INDEX idx_character_progress ON user_progress(character_id);

-- =============================================================================
-- PRACTICE HISTORY TABLE
-- =============================================================================
-- Records all practice attempts outside of spaced repetition
-- Supports multiple practice modes (definition lookup, pinyin practice, etc.)
CREATE TABLE IF NOT EXISTS practice_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    practice_mode TEXT NOT NULL,                  -- Mode: 'lookup', 'pinyin_test', 'writing', etc.
    arrow_tested TEXT,                            -- Which direction tested: 'zh_to_en', 'en_to_zh', 'pinyin_to_zh'
    user_answer TEXT,                             -- What user answered (for analytics)
    is_correct BOOLEAN NOT NULL,                  -- Was answer correct?
    practiced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Indexes for practice analytics
CREATE INDEX idx_practice_mode ON practice_history(practice_mode, practiced_at);
CREATE INDEX idx_character_practice ON practice_history(character_id);

-- =============================================================================
-- STUDY SESSIONS TABLE
-- =============================================================================
-- Tracks study sessions for statistics and progress monitoring
CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,                           -- Session mode: 'spaced_repetition', 'browse', etc.
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    cards_studied INTEGER DEFAULT 0,              -- Number of cards reviewed
    cards_correct INTEGER DEFAULT 0,              -- Correct answers
    cards_incorrect INTEGER DEFAULT 0,            -- Incorrect answers
    duration_seconds INTEGER                      -- Session duration
);

-- Indexes for session analytics
CREATE INDEX idx_session_mode ON study_sessions(mode, started_at);

-- =============================================================================
-- APP SETTINGS TABLE
-- =============================================================================
-- Stores user preferences and application configuration
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,                          -- JSON-encoded value for complex settings
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES
    ('daily_new_cards', '10'),
    ('daily_review_limit', '100'),
    ('show_traditional', 'true'),
    ('default_study_mode', 'spaced_repetition'),
    ('audio_enabled', 'true'),
    ('last_unlock_date', ''),
    ('initial_unlock_completed', 'false');

-- =============================================================================
-- SCHEMA VERSION TABLE
-- =============================================================================
-- Tracks schema migrations for database updates
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Initial schema version
INSERT OR IGNORE INTO schema_version (version, description)
VALUES (1, 'Initial schema - Phase 1/2/3 support');

-- =============================================================================
-- SCHEMA RELATIONSHIPS
-- =============================================================================
-- Relationship diagram:
--
--   characters (1) ----< (many) user_progress
--   characters (1) ----< (many) practice_history
--
-- All foreign keys use ON DELETE CASCADE to maintain referential integrity
-- =============================================================================
