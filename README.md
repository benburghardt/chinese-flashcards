# Chinese Learning Tool

A desktop application for learning Mandarin and Cantonese Chinese with integrated dictionary, flashcards, and spaced repetition.

## Features

### Phase 1: Core Mandarin Learning (MVP)
- Integrated Chinese-English dictionary (CC-CEDICT)
- Frequency-ranked vocabulary (SUBTLEX-CH)
- Spaced repetition flashcard system
- Pinyin pronunciation guide
- Character and word lookup

### Phase 2: Enhanced Learning Features (Planned)
- Stroke order animations
- Etymology and radical information
- Advanced study modes
- Progress tracking and statistics

### Phase 3: Cantonese Expansion (Planned)
- Cantonese pronunciation (Jyutping)
- Cantonese-specific vocabulary
- Dual Mandarin/Cantonese support

## Data Sources & Licenses

This application uses several open-source Chinese language datasets:

- **CC-CEDICT** (CC BY-SA 4.0) - Chinese-English dictionary
- **SUBTLEX-CH** (Academic use) - Character/word frequency rankings
- **Make Me a Hanzi** (Arphic/LGPL) - Stroke order data
- **CC-Canto** (CC BY-SA 4.0) - Cantonese pronunciations

See [DATA-LICENSES.md](DATA-LICENSES.md) and [CREDITS.md](CREDITS.md) for detailed attribution and license information.

**Note:** This is a non-commercial, educational application. All data sources are used in accordance with their respective licenses.

## Technology Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Rust (Tauri)
- **Database:** SQLite
- **Platform:** Desktop (Windows, macOS, Linux)

## Development

This project is built with Tauri for cross-platform desktop support.

### Prerequisites

You'll need the following tools installed:
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Rust** stable toolchain ([Install via rustup](https://rustup.rs/))
- **Tauri Prerequisites** (varies by platform - see [Tauri Prerequisites Guide](https://tauri.app/v1/guides/getting-started/prerequisites))

For Windows specifically:
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10+)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/benburghardt/chinese-flashcards.git
   cd chinese-flashcards
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Build the database** (Required for first-time setup)

   The application requires a SQLite database with Chinese character data. You have two options:

   **Option A: Build from source** (Recommended for development)
   ```bash
   cd data-processing

   # Download source datasets (CC-CEDICT + SUBTLEX-CH)
   cargo run --bin download-datasets

   # Build the SQLite database
   cargo run --bin build-database

   cd ..
   ```

   This creates `resources/chinese.db` (~27MB) with 120,273 characters/words.

   **Option B: Use pre-built database** (If available)
   ```bash
   # Download pre-built chinese.db from releases
   # Place in: resources/chinese.db
   ```

4. **Verify setup**
   ```bash
   # Test the database connection
   npm run tauri:dev
   ```

   The app should launch and display the dashboard with available characters.

### Development Commands

```bash
# Run development server with hot-reload
npm run tauri:dev

# Build production bundle
npm run tauri:build

# Rebuild database (if data sources change)
cd data-processing
cargo run --bin build-database
```

### Project Structure

```
chinese-flashcards/
├── src/                          # React frontend
│   ├── components/              # UI components
│   │   ├── Dashboard/          # Main dashboard
│   │   ├── Introduction/       # Character learning
│   │   └── Study/              # SRS study session
│   └── utils/                  # Utility functions
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── commands/           # Tauri command handlers
│   │   ├── database/           # SQLite query functions
│   │   └── srs/                # Spaced repetition algorithm
│   └── tauri.conf.json         # Tauri configuration
├── data-processing/             # Database build scripts
│   ├── src/
│   │   ├── bin/                # CLI tools
│   │   ├── parsers/            # Dataset parsers
│   │   └── database/           # Database builder
│   └── datasets/               # Downloaded source data
├── resources/                   # Application resources
│   └── chinese.db              # SQLite database (generated)
└── docs/                        # Documentation
    ├── DevSummary.md           # Development progress
    ├── currentTask.md          # Current task tracking
    └── chinese-learning-spec.md # Full specification
```

### Troubleshooting

**Database not found error:**
- Ensure `resources/chinese.db` exists
- Run the database build process (see Initial Setup step 3)

**Tauri build fails:**
- Check Tauri prerequisites for your platform
- On Windows: Verify Visual Studio C++ Build Tools are installed
- On macOS: Install Xcode Command Line Tools
- On Linux: Install required system libraries (webkit2gtk, etc.)

**Hot-reload not working:**
- Try `npm run tauri:dev -- --no-watch`
- Clear cache: `rm -rf target/` and rebuild

For more help, see [docs/support-sections.md](docs/support-sections.md)

## License

This project's code is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for details.

Data sources have separate licenses - see [DATA-LICENSES.md](DATA-LICENSES.md) for complete information.

## Contributing

This is a personal learning project. While contributions are not currently being accepted, you're welcome to fork and adapt it for your own use in accordance with the licenses.

## Acknowledgments

See [CREDITS.md](CREDITS.md) for a complete list of open-source projects and datasets that make this application possible.
