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
- Node.js v18+
- Rust (stable toolchain)
- Tauri CLI

### Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

## License

This project's code is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for details.

Data sources have separate licenses - see [DATA-LICENSES.md](DATA-LICENSES.md) for complete information.

## Contributing

This is a personal learning project. While contributions are not currently being accepted, you're welcome to fork and adapt it for your own use in accordance with the licenses.

## Acknowledgments

See [CREDITS.md](CREDITS.md) for a complete list of open-source projects and datasets that make this application possible.
