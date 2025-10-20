use std::path::Path;
use std::process::Command;

fn main() {
    // Check if chinese.db exists in resources/
    let db_path = Path::new("resources/chinese.db");

    if !db_path.exists() {
        println!("cargo:warning=Database not found, building chinese.db...");

        // Run the build-database binary from data-processing
        let status = Command::new("cargo")
            .args(&["run", "--bin", "build-database", "--manifest-path", "../data-processing/Cargo.toml"])
            .status()
            .expect("Failed to execute build-database");

        if !status.success() {
            panic!("Failed to build chinese.db database");
        }

        println!("cargo:warning=Database built successfully");
    }

    // Tell Cargo to rerun this build script if the database is deleted
    println!("cargo:rerun-if-changed=resources/chinese.db");

    tauri_build::build()
}
