use rusqlite::{Connection, Result};
use std::io::{self, Write};

fn main() -> Result<()> {
    let db_path = std::env::args()
        .nth(1)
        .unwrap_or_else(|| "../chinese.db".to_string());

    println!("=== SQLite Shell for Chinese Learning Tool ===");
    println!("Database: {}", db_path);
    println!("Type SQL commands (or 'exit' to quit)\n");

    let conn = Connection::open(&db_path)?;

    loop {
        print!("sqlite> ");
        io::stdout().flush().unwrap();

        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        let input = input.trim();

        if input.is_empty() {
            continue;
        }

        if input.eq_ignore_ascii_case("exit") || input.eq_ignore_ascii_case("quit") {
            println!("Goodbye!");
            break;
        }

        // Execute the SQL
        if input.to_uppercase().starts_with("SELECT") {
            // Handle SELECT queries
            match conn.prepare(input) {
                Ok(mut stmt) => {
                    // Get column names
                    let column_count = stmt.column_count();
                    let column_names: Vec<String> = stmt
                        .column_names()
                        .iter()
                        .map(|s| s.to_string())
                        .collect();

                    // Print header
                    println!("{}", column_names.join(" | "));
                    println!("{}", "-".repeat(80));

                    // Print rows
                    let rows = stmt.query_map([], |row| {
                        let mut values = Vec::new();
                        for i in 0..column_count {
                            let value: String = row.get::<_, rusqlite::types::Value>(i)
                                .map(|v| format!("{:?}", v))
                                .unwrap_or_else(|_| "NULL".to_string());
                            values.push(value);
                        }
                        Ok(values)
                    });

                    match rows {
                        Ok(rows) => {
                            let mut count = 0;
                            for row in rows {
                                if let Ok(row) = row {
                                    println!("{}", row.join(" | "));
                                    count += 1;
                                }
                            }
                            println!("\n{} rows", count);
                        }
                        Err(e) => println!("Error: {}", e),
                    }
                }
                Err(e) => println!("Error: {}", e),
            }
        } else {
            // Handle INSERT, UPDATE, DELETE, etc.
            match conn.execute(input, []) {
                Ok(affected) => println!("Query OK, {} rows affected", affected),
                Err(e) => println!("Error: {}", e),
            }
        }
    }

    Ok(())
}
