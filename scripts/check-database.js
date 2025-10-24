const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const DB_PATH = path.join(__dirname, '..', 'src-tauri', 'resources', 'chinese.db');
const DATASETS_DIR = path.join(__dirname, '..', 'datasets');
const CEDICT_PATH = path.join(DATASETS_DIR, 'cedict_ts.u8');
const SUBTLEX_DIR = path.join(DATASETS_DIR, 'SUBTLEX-CH');
const DATA_PROCESSING_DIR = path.join(__dirname, '..', 'data-processing');

console.log('\n🔍 Checking database status...\n');

// Check if database exists
if (fs.existsSync(DB_PATH)) {
    // Verify database has data by checking file size
    const stats = fs.statSync(DB_PATH);
    const fileSizeInMB = stats.size / (1024 * 1024);

    if (fileSizeInMB > 1) {
        console.log(`✅ Database exists and appears populated (${fileSizeInMB.toFixed(2)} MB)`);
        console.log(`   Location: ${DB_PATH}\n`);
        process.exit(0);
    } else {
        console.log(`⚠️  Database exists but appears empty (${fileSizeInMB.toFixed(2)} MB)`);
        console.log('   Rebuilding database...\n');
        // Delete empty database
        fs.unlinkSync(DB_PATH);
    }
} else {
    console.log('❌ Database not found');
    console.log(`   Expected location: ${DB_PATH}\n`);
}

// Check if datasets exist
console.log('📦 Checking datasets...\n');

let needsDownload = false;

if (!fs.existsSync(CEDICT_PATH)) {
    console.log('❌ CC-CEDICT not found');
    needsDownload = true;
} else {
    console.log('✅ CC-CEDICT found');
}

if (!fs.existsSync(SUBTLEX_DIR) ||
    !fs.existsSync(path.join(SUBTLEX_DIR, 'SUBTLEX-CH-CHR')) ||
    !fs.existsSync(path.join(SUBTLEX_DIR, 'SUBTLEX-CH-WF_PoS'))) {
    console.log('❌ SUBTLEX-CH not found or incomplete');
    needsDownload = true;
} else {
    console.log('✅ SUBTLEX-CH found');
}

console.log();

// Download datasets if needed
if (needsDownload) {
    console.log('📥 Downloading datasets...\n');
    try {
        execSync('cargo run --bin download-datasets', {
            cwd: DATA_PROCESSING_DIR,
            stdio: 'inherit'
        });
        console.log();
    } catch (error) {
        console.error('❌ Failed to download datasets');
        console.error('\n⚠️  Manual action required:');
        console.error('   1. Download CC-CEDICT from: https://www.mdbg.net/chinese/dictionary?page=cedict');
        console.error('   2. Download SUBTLEX-CH from: https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch');
        console.error('   3. Extract files to datasets/ directory');
        console.error('   4. Run: cd data-processing && cargo run --bin download-datasets\n');
        process.exit(1);
    }

    // Check again after download
    if (!fs.existsSync(path.join(SUBTLEX_DIR, 'SUBTLEX-CH-CHR')) ||
        !fs.existsSync(path.join(SUBTLEX_DIR, 'SUBTLEX-CH-WF_PoS'))) {
        console.error('⚠️  SUBTLEX-CH requires manual download:');
        console.error('   1. Visit: https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch');
        console.error('   2. Download:');
        console.error('      - SUBTLEX-CH-CHR.zip (character frequencies)');
        console.error('      - SUBTLEX-CH-WF_PoS.zip (word frequencies)');
        console.error('   3. Extract both files to: datasets/SUBTLEX-CH/');
        console.error('   4. Ensure files are named:');
        console.error('      - SUBTLEX-CH-CHR (no extension)');
        console.error('      - SUBTLEX-CH-WF_PoS (no extension)');
        console.error('   5. Run: npm run tauri:dev\n');
        process.exit(1);
    }
}

// Build database
console.log('🔨 Building database...\n');
try {
    // Ensure resources directory exists
    const resourcesDir = path.join(__dirname, '..', 'src-tauri', 'resources');
    if (!fs.existsSync(resourcesDir)) {
        fs.mkdirSync(resourcesDir, { recursive: true });
    }

    execSync('cargo run --bin build-database', {
        cwd: DATA_PROCESSING_DIR,
        stdio: 'inherit'
    });
    console.log();
} catch (error) {
    console.error('❌ Failed to build database');
    console.error('   Check the error messages above for details\n');
    process.exit(1);
}

// Verify database was created
if (fs.existsSync(DB_PATH)) {
    const stats = fs.statSync(DB_PATH);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`✅ Database built successfully (${fileSizeInMB.toFixed(2)} MB)`);
    console.log(`   Location: ${DB_PATH}\n`);
} else {
    console.error('❌ Database was not created');
    console.error('   Something went wrong during the build process\n');
    process.exit(1);
}

console.log('🎉 Ready to start application!\n');
