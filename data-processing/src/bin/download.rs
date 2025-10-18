use flate2::read::GzDecoder;
use std::fs::{self, File};
use std::io::{self, copy, Write};
use std::path::Path;

/// Main entry point for dataset downloader
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Chinese Learning Tool - Dataset Downloader ===\n");

    // Create datasets directory
    fs::create_dir_all("datasets")?;

    // Download CC-CEDICT
    download_cedict().await?;

    // Instructions for SUBTLEX-CH (requires manual download)
    show_subtlex_instructions();

    println!("\n✅ Download process complete!");
    println!("⚠️  Please review DATA-LICENSES.md for license terms\n");

    Ok(())
}

/// Download and extract CC-CEDICT dictionary
async fn download_cedict() -> Result<(), Box<dyn std::error::Error>> {
    println!("📥 Downloading CC-CEDICT...");
    println!("   Source: https://www.mdbg.net/chinese/dictionary?page=cedict");
    println!("   License: CC BY-SA 4.0\n");

    let url = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz";
    let output_gz = "datasets/cedict_ts.u8.gz";
    let output_txt = "datasets/cedict_ts.u8";

    // Check if already downloaded
    if Path::new(output_txt).exists() {
        println!("   ✓ CC-CEDICT already exists at {}", output_txt);
        println!("   Skipping download.\n");
        return Ok(());
    }

    // Download
    println!("   Downloading from MDBG...");
    let response = reqwest::get(url).await?;
    let bytes = response.bytes().await?;

    // Save compressed file
    let mut file = File::create(output_gz)?;
    file.write_all(&bytes)?;

    println!("   ✓ Downloaded ({} KB)", bytes.len() / 1024);

    // Decompress
    println!("   Decompressing...");
    decompress_gz(output_gz, output_txt)?;

    println!("   ✓ Extracted to {}", output_txt);

    // Clean up compressed file
    fs::remove_file(output_gz)?;
    println!("   ✓ Cleaned up .gz file\n");

    Ok(())
}

/// Show instructions for manual SUBTLEX-CH download
fn show_subtlex_instructions() {
    println!("📥 SUBTLEX-CH Download Instructions");
    println!("   Source: https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch");
    println!("   License: Free for research and educational purposes");
    println!("   Citation Required: Cai & Brysbaert (2010)\n");

    println!("   ⚠️  SUBTLEX-CH requires manual download:");
    println!("   1. Visit: https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch");
    println!("   2. Download:");
    println!("      - SUBTLEX-CH-CHR.zip (character frequencies)");
    println!("      - SUBTLEX-CH-WF_PoS.zip (word frequencies)");
    println!("   3. Extract both to: datasets/SUBTLEX-CH/");
    println!("   4. You should have:");
    println!("      - datasets/SUBTLEX-CH/SUBTLEX-CH-CHR.txt");
    println!("      - datasets/SUBTLEX-CH/SUBTLEX-CH-WF_PoS.txt\n");
}

/// Decompress a .gz file to output path
fn decompress_gz(input: &str, output: &str) -> io::Result<()> {
    let input_file = File::open(input)?;
    let mut decoder = GzDecoder::new(input_file);
    let mut output_file = File::create(output)?;

    copy(&mut decoder, &mut output_file)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_decompress_gz() {
        use flate2::write::GzEncoder;
        use flate2::Compression;

        // Create test data
        let test_data = b"Hello, this is test data!";
        let test_gz = "test_data.txt.gz";
        let test_output = "test_data.txt";

        // Compress test data
        let file = File::create(test_gz).unwrap();
        let mut encoder = GzEncoder::new(file, Compression::default());
        encoder.write_all(test_data).unwrap();
        encoder.finish().unwrap();

        // Test decompression
        let result = decompress_gz(test_gz, test_output);
        assert!(result.is_ok());

        // Verify decompressed content
        let content = fs::read_to_string(test_output).unwrap();
        assert_eq!(content.as_bytes(), test_data);

        // Cleanup
        fs::remove_file(test_gz).unwrap();
        fs::remove_file(test_output).unwrap();
    }

    #[test]
    fn test_datasets_directory_creation() {
        // This would normally be tested in integration tests
        // Unit test just verifies the directory creation logic works
        let test_dir = "test_datasets";
        let result = fs::create_dir_all(test_dir);
        assert!(result.is_ok());

        // Cleanup
        fs::remove_dir(test_dir).unwrap();
    }
}
