# Changelog

All notable changes to the Chinese Learning Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Phase 1: Core Mandarin Learning - 2025-01-XX

### Added
- Complete data processing pipeline supporting CC-CEDICT and SUBTLEX-CH datasets
- SQLite database with 100,000+ characters and words with frequency rankings
- Spaced repetition system (SM-2 based) with half-hour scheduling precision
- Character introduction system with frequency-based ordering
- SRS study sessions with intelligent answer verification (case-insensitive, pinyin/definition matching)
- Self-study practice mode for additional review without affecting SRS schedules
- Progress dashboard with comprehensive statistics (learned, mastered, due, streak)
- Session history tracking with accurate question-based accuracy calculations
- Character unlocking system (100 characters every 20 days based on queue completion)
- Dictionary/browse functionality with search and frequency sorting
- Definition override system for manual correction of dictionary entries

### Features
- Initial unlock of 100 characters for new users
- Mini-SRS sessions every 5 characters during learning
- Answer verification supporting pinyin (with tone marks and numbers), simplified/traditional Chinese
- Cards cycle until correct within each session
- Professional, clean UI with 1200x800 window size
- Mastery system (9 correct reviews for graduation)
- Review calendar showing upcoming scheduled reviews
- Study streak tracking for consecutive study days

### Technical
- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Rust + Tauri 2.0
- **Database:** SQLite with comprehensive schema
- **Cross-platform:** Windows, macOS, Linux support
- **Database size:** ~300MB with full dataset
- **Code quality:** ESLint + Prettier formatting, cargo clippy clean

### Known Limitations
- Mandarin only (Cantonese support planned for Phase 3)
- No stroke order animations (planned for Phase 2)
- No speech/audio features (planned for Phase 2)
- No multiple choice mode (planned for Phase 2)
- Limited to desktop platform (no mobile support in Phase 1)

### Data Sources & Attribution
- **CC-CEDICT:** Chinese-English dictionary (CC BY-SA 4.0)
- **SUBTLEX-CH:** Character and word frequency rankings (Educational use)
- **Make Me a Hanzi:** Stroke order data (Arphic Public License / LGPL) - prepared for Phase 2

See `DATA-LICENSES.md` for complete licensing information.

### License
- Application code: MIT License
- See `LICENSE.md` for details

## [Unreleased]

### Planned for Phase 2
- Stroke order animations for character learning
- Etymology and radical breakdown information
- Advanced study modes (multiple choice, typing practice)
- Audio pronunciation support
- Character component analysis
- Improved progress visualization

### Planned for Phase 3
- Cantonese language support with Jyutping romanization
- Cantonese-specific vocabulary and phrases
- Dual Mandarin/Cantonese display mode
- Additional Cantonese datasets integration

---

## Version History

- **0.1.0** - Phase 1: Core Mandarin Learning (MVP)
  - SRS system with 100+ character introduction
  - Self-study mode
  - Progress tracking and statistics
  - Dictionary/browse functionality
