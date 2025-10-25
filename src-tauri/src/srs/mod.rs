use chrono::{DateTime, Duration, Utc};

#[derive(Debug, Clone)]
pub struct SrsCard {
    pub character_id: i32,
    pub current_interval_days: f32,
    pub previous_interval_days: f32,
    pub ease_factor: f32,
    pub times_correct: i32,
    pub times_incorrect: i32,
    pub has_reached_week: bool,
}

#[derive(Debug)]
pub struct SrsUpdate {
    pub new_interval_days: f32,
    pub new_ease_factor: f32,
    pub next_review_date: DateTime<Utc>,
    pub reached_week_for_first_time: bool,
}

pub fn calculate_next_review(
    card: &SrsCard,
    correct: bool,
) -> SrsUpdate {
    let (new_interval, new_ease) = if correct {
        calculate_interval_correct(card)
    } else {
        calculate_interval_incorrect(card)
    };

    // Convert interval from days to minutes for precise calculation
    // This ensures sub-day intervals (like 1 hour = 0.0417 days) work correctly
    let interval_minutes = (new_interval * 24.0 * 60.0) as i64;
    let next_review_date = Utc::now() + Duration::minutes(interval_minutes);

    // Check if reaching 1 week for first time
    let reached_week_for_first_time =
        !card.has_reached_week && new_interval >= 7.0;

    SrsUpdate {
        new_interval_days: new_interval,
        new_ease_factor: new_ease,
        next_review_date,
        reached_week_for_first_time,
    }
}

fn calculate_interval_correct(card: &SrsCard) -> (f32, f32) {
    let current = card.current_interval_days;
    let ease = card.ease_factor;

    // Progression: 1 hour → 12 hours → 1 day → 3 days → 7 days → exponential
    let new_interval = if current < 0.0417 {
        // Less than 1 hour → 1 hour
        0.0417 // 1 hour = 1/24 days
    } else if current <= 0.0417 {
        // At 1 hour → 12 hours
        0.5 // 12 hours = 0.5 days
    } else if current < 0.5 {
        // Less than 12 hours → 12 hours
        0.5 // 12 hours = 0.5 days
    } else if current <= 0.5 {
        // At 12 hours → 1 day
        1.0
    } else if current < 1.0 {
        // Less than 1 day → 1 day
        1.0
    } else if current <= 1.0 {
        // At 1 day → 3 days
        3.0
    } else if current < 3.0 {
        // Less than 3 days → 3 days
        3.0
    } else if current <= 3.0 {
        // At 3 days → 7 days
        7.0
    } else if current < 7.0 {
        // Less than 7 days → 7 days
        7.0
    } else {
        // After 7 days, use exponential growth
        current * ease
    };

    // Cap ease factor at 2.25 to prevent runaway intervals
    let new_ease = ease.min(2.25);

    (new_interval, new_ease)
}

fn calculate_interval_incorrect(card: &SrsCard) -> (f32, f32) {
    // Return to previous interval, but minimum is 1 hour (not 1 day)
    let new_interval = card.previous_interval_days.max(0.0417); // 1 hour minimum
    let new_ease = (card.ease_factor - 0.2).max(1.3);

    (new_interval, new_ease)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_first_correct_answer() {
        let card = SrsCard {
            character_id: 1,
            current_interval_days: 0.0417, // Start at 1 hour
            previous_interval_days: 0.0417,
            ease_factor: 2.25,
            times_correct: 0,
            times_incorrect: 0,
            has_reached_week: false,
        };

        let update = calculate_next_review(&card, true);
        assert_eq!(update.new_interval_days, 0.5); // 1 hour (at 0.0417) → 12 hours
        assert_eq!(update.new_ease_factor, 2.25); // Capped at 2.25
        assert!(!update.reached_week_for_first_time);
    }

    #[test]
    fn test_reaching_one_week() {
        let card = SrsCard {
            character_id: 1,
            current_interval_days: 3.0,
            previous_interval_days: 1.0,
            ease_factor: 2.25,
            times_correct: 1,
            times_incorrect: 0,
            has_reached_week: false,
        };

        let update = calculate_next_review(&card, true);
        assert_eq!(update.new_interval_days, 7.0);
        assert!(update.reached_week_for_first_time);
    }

    #[test]
    fn test_incorrect_answer_backs_to_previous() {
        let card = SrsCard {
            character_id: 1,
            current_interval_days: 7.0,
            previous_interval_days: 3.0,
            ease_factor: 2.25,
            times_correct: 2,
            times_incorrect: 0,
            has_reached_week: true,
        };

        let update = calculate_next_review(&card, false);
        assert_eq!(update.new_interval_days, 3.0); // Back to previous
        assert_eq!(update.new_ease_factor, 2.05); // Decreased by 0.2 from 2.25
        assert!(!update.reached_week_for_first_time); // Already reached
    }

    #[test]
    fn test_incorrect_answer_minimum_interval() {
        // Test that incorrect answers have a minimum of 1 hour, not 1 day
        let card = SrsCard {
            character_id: 1,
            current_interval_days: 0.5, // 12 hours
            previous_interval_days: 0.0417, // 1 hour
            ease_factor: 2.25,
            times_correct: 1,
            times_incorrect: 0,
            has_reached_week: false,
        };

        let update = calculate_next_review(&card, false);
        assert_eq!(update.new_interval_days, 0.0417); // Back to 1 hour
        assert_eq!(update.new_ease_factor, 2.05); // Decreased by 0.2 from 2.25
    }

    #[test]
    fn test_ease_factor_floor() {
        let card = SrsCard {
            character_id: 1,
            current_interval_days: 7.0,
            previous_interval_days: 3.0,
            ease_factor: 1.4,
            times_correct: 0,
            times_incorrect: 5,
            has_reached_week: true,
        };

        let update = calculate_next_review(&card, false);
        assert_eq!(update.new_ease_factor, 1.3); // Floor at 1.3
    }

    #[test]
    fn test_progression_sequence() {
        let mut card = SrsCard {
            character_id: 1,
            current_interval_days: 0.0417, // 1 hour
            previous_interval_days: 0.0417,
            ease_factor: 2.25,
            times_correct: 0,
            times_incorrect: 0,
            has_reached_week: false,
        };

        // 1 hour -> 12 hours
        let update = calculate_next_review(&card, true);
        assert_eq!(update.new_interval_days, 0.5);

        card.previous_interval_days = card.current_interval_days;
        card.current_interval_days = update.new_interval_days;
        card.ease_factor = update.new_ease_factor;

        // 12 hours -> 1 day
        let update = calculate_next_review(&card, true);
        assert_eq!(update.new_interval_days, 1.0);

        card.previous_interval_days = card.current_interval_days;
        card.current_interval_days = update.new_interval_days;
        card.ease_factor = update.new_ease_factor;

        // 1 day -> 3 days
        let update = calculate_next_review(&card, true);
        assert_eq!(update.new_interval_days, 3.0);

        card.previous_interval_days = card.current_interval_days;
        card.current_interval_days = update.new_interval_days;
        card.ease_factor = update.new_ease_factor;

        // 3 days -> 7 days (5th correct - reaches week!)
        let update = calculate_next_review(&card, true);
        assert_eq!(update.new_interval_days, 7.0);
        assert!(update.reached_week_for_first_time);

        card.previous_interval_days = card.current_interval_days;
        card.current_interval_days = update.new_interval_days;
        card.has_reached_week = true;
        card.ease_factor = update.new_ease_factor;

        // 7 days -> 15.75 days (7 * 2.25)
        let update = calculate_next_review(&card, true);
        assert_eq!(update.new_interval_days, 15.75);
    }
}
