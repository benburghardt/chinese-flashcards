# Database Schema Documentation

## Overview

The Chinese Learning Tool uses SQLite for local data storage. The schema supports all three development phases:
- **Phase 1:** Mandarin dictionary and spaced repetition
- **Phase 2:** Enhanced features (stroke order, etymology)
- **Phase 3:** Cantonese support

## Schema Design Decisions

### 1. Single Characters Table for Both Characters and Words

**Decision:** Use one `characters` table with an `is_word` flag instead of separate tables.

**Rationale:**
- Reduces complexity and JOIN operations
- Many words share the same fields (pinyin, definition, frequency)
- Easier to search across both characters and words
- Component tracking via `component_characters` field for words

### 2. Previous Interval Tracking

**Decision:** Include `previous_interval_days` field in `user_progress` table.

**Rationale:**
- Enables undo functionality if user accidentally marks wrong answer
- Useful for debugging spaced repetition algorithm
- Minimal storage overhead (8 bytes per record)
- Critical for user experience (avoid punishing accidental clicks)

### 3. Foreign Key Cascades

**Decision:** Use `ON DELETE CASCADE` for all foreign keys.

**Rationale:**
- Maintains referential integrity automatically
- If a character is deleted, all progress/history should be deleted too
- Prevents orphaned records
- Simplifies application logic

### 4. Index Strategy

**Indexes Created:**
- `idx_frequency`: For showing most common characters first
- `idx_is_word`: For filtering characters vs words
- `idx_character`: For quick character lookup
- `idx_simplified`: For simplified character search
- `idx_next_review`: Critical for spaced repetition queries
- `idx_introduced`: For filtering new vs. learning cards
- `idx_character_progress`: For user progress lookups
- `idx_practice_mode`: For practice analytics queries
- `idx_session_mode`: For session statistics

**Rationale:**
- Every index chosen based on expected query patterns
- Characters will have ~120,000 records - indexes essential
- user_progress queries by date are frequent - indexed
- Minimal write performance impact (batch imports rare)

### 5. Timestamp vs. Date

**Decision:** Use `TIMESTAMP` type for all date/time fields.

**Rationale:**
- Supports time-of-day tracking (useful for analytics)
- SQLite stores as UTC strings, no timezone issues
- Can easily extract just date when needed: `DATE(timestamp)`

### 6. Boolean as INTEGER

**Decision:** Use SQLite's BOOLEAN type (stored as 0/1 INTEGER).

**Rationale:**
- SQLite doesn't have native BOOLEAN, stores as INTEGER
- Using BOOLEAN type makes intent clear in schema
- More readable than INTEGER with comments

### 7. JSON in app_settings.value

**Decision:** Store complex settings as JSON strings in `value` field.

**Rationale:**
- Flexible schema for settings without table changes
- SQLite has JSON functions for querying if needed
- Simple key-value model easy to work with in Rust

### 8. Schema Versioning

**Decision:** Include `schema_version` table from the start.

**Rationale:**
- Anticipate future schema changes
- Enables migrations between versions
- Professional approach to schema management
- Required for production-quality application

## Table Relationships

```
┌─────────────┐
│ characters  │
└──────┬──────┘
       │
       ├─────────┬──────────────────────┐
       │         │                      │
       ▼         ▼                      ▼
┌──────────┐  ┌────────────────┐  ┌───────────┐
│  user_   │  │   practice_    │  │  (future  │
│ progress │  │    history     │  │  tables)  │
└──────────┘  └────────────────┘  └───────────┘
```

All foreign keys use `ON DELETE CASCADE`.

## Field Size Estimates

Based on CC-CEDICT data (~120,000 entries):

- **characters table:** ~120,000 rows, ~50 MB
- **user_progress:** Variable (depends on user), estimate ~5,000 rows, ~500 KB
- **practice_history:** Grows over time, estimate ~50,000 rows/year, ~5 MB/year
- **study_sessions:** ~1,000 rows/year, ~100 KB/year

**Total estimated database size after 1 year:** ~60 MB

## Query Performance Expectations

With proper indexes:
- Character lookup by ID: < 1ms
- Frequency-ranked query (top 1000): < 10ms
- Next cards for review (spaced repetition): < 5ms
- Practice history for character: < 5ms
- Session statistics (last 30 days): < 20ms

## Future Schema Changes

Potential additions for Phase 2/3:
- **audio_files table:** For pronunciation audio paths
- **user_notes table:** For custom notes on characters
- **decks table:** For custom study decks (like Anki)
- **tags table:** For user-defined character tags

These will be added via schema migrations tracked in `schema_version` table.

## Usage in Rust

The schema will be loaded during database initialization:

```rust
// Example usage (to be implemented in Phase 1)
use rusqlite::Connection;

fn init_database(db_path: &str) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // Execute schema
    let schema = include_str!("schema.sql");
    conn.execute_batch(schema)?;

    Ok(conn)
}
```

## Testing

Schema will be tested through:
1. Unit tests in Rust (verify tables created)
2. Integration tests (CRUD operations)
3. Performance tests (query speed with realistic data)

See Phase 1 tasks for database implementation details.
