mod database;
mod commands;
mod srs;

use database::initialize_database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Initialize database
  let db = initialize_database().expect("Failed to initialize database");

  tauri::Builder::default()
    .manage(db)
    .invoke_handler(tauri::generate_handler![
      commands::test_database_connection,
      commands::get_character,
      commands::get_top_characters,
      commands::get_due_cards_for_review,
      commands::submit_srs_answer,
      commands::unlock_new_character,
      commands::introduce_character,
      commands::introduce_multiple_characters,
    ])
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .on_window_event(|window, event| {
      match event {
        tauri::WindowEvent::CloseRequested { .. } => {
          // Properly close the window and exit the app
          window.close().unwrap();
          // Exit the process cleanly to free up ports
          std::process::exit(0);
        }
        _ => {}
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
