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
      commands::introduce_character_immediately_reviewable,
      commands::get_available_to_learn_count,
      commands::get_unlocked_characters_batch,
      commands::complete_initial_srs_session,
      commands::mark_incomplete_characters_reviewable,
      commands::introduce_multiple_characters,
      commands::get_characters_for_initial_study,
      commands::check_and_unlock_characters,
      commands::get_unlock_status,
      commands::mark_all_ready_characters_introduced,
      commands::get_self_study_cards,
      commands::record_practice,
      commands::get_dashboard_stats,
      commands::get_recent_sessions,
      commands::start_session,
      commands::end_session,
      commands::browse_characters,
      commands::get_total_characters_count,
      commands::get_review_calendar,
      commands::get_database_debug_info,
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
