import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './SpacedRepetition.css';

interface DueCard {
  character_id: number;
  character: string;
  pinyin: string;
  definition: string;
  current_interval: number;
  times_reviewed: number;
}

interface SessionCard extends DueCard {
  answeredDefinition?: boolean;
  answeredPinyin?: boolean;
  fullyAnswered?: boolean;
}

type QuestionType = 'definition' | 'pinyin';

interface SpacedRepetitionProps {
  onComplete: () => void;
  onNewCharacterUnlocked?: (character: any) => void;
}

function SpacedRepetition({ onComplete, onNewCharacterUnlocked }: SpacedRepetitionProps) {
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionType, setQuestionType] = useState<QuestionType>('definition');
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({
    totalCards: 0,
    cardsCorrect: 0,
    cardsIncorrect: 0,
  });
  const [unlockedCharacters, setUnlockedCharacters] = useState<any[]>([]);

  // Load due cards on mount
  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    try {
      setLoading(true);
      const cards = await invoke<DueCard[]>('get_due_cards_for_review');

      if (cards.length === 0) {
        setSessionComplete(true);
        setLoading(false);
        return;
      }

      setSessionCards(cards);
      setStats(prev => ({ ...prev, totalCards: cards.length }));
      selectRandomQuestionType();
      setLoading(false);
    } catch (error) {
      console.error('Failed to load due cards:', error);
      setLoading(false);
    }
  };

  const selectRandomQuestionType = () => {
    setQuestionType(Math.random() < 0.5 ? 'definition' : 'pinyin');
  };

  const selectNextQuestionType = (card: SessionCard) => {
    // Check what hasn't been answered yet for this card
    const needsDefinition = !card.answeredDefinition;
    const needsPinyin = !card.answeredPinyin;

    if (needsDefinition && needsPinyin) {
      // Neither answered - pick randomly
      selectRandomQuestionType();
    } else if (needsDefinition) {
      // Only need definition
      setQuestionType('definition');
    } else if (needsPinyin) {
      // Only need pinyin
      setQuestionType('pinyin');
    } else {
      // Both answered (shouldn't happen in normal flow)
      selectRandomQuestionType();
    }
  };

  const getCurrentCard = () => sessionCards[currentIndex];

  const checkAnswer = (answer: string, correctAnswer: string): boolean => {
    const normalized = answer.toLowerCase().trim();
    const correct = correctAnswer.toLowerCase().trim();

    // For pinyin: exact match (case insensitive)
    if (questionType === 'pinyin') {
      return normalized === correct;
    }

    // For definition: check if answer contains any keyword or matches any part
    const keywords = correct.split(/[;,]/).map(k => k.trim());
    return keywords.some(keyword =>
      normalized.includes(keyword) || keyword.includes(normalized)
    );
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim() || submitting) return;

    const currentCard = getCurrentCard();
    const correctAnswer = questionType === 'definition'
      ? currentCard.definition
      : currentCard.pinyin;

    const correct = checkAnswer(userAnswer, correctAnswer);
    setIsCorrect(correct);
    setShowFeedback(true);
    setSubmitting(true);

    // Update card status locally (don't submit to backend yet)
    const updatedCards = [...sessionCards];
    if (questionType === 'definition') {
      updatedCards[currentIndex].answeredDefinition = correct;
    } else {
      updatedCards[currentIndex].answeredPinyin = correct;
    }
    setSessionCards(updatedCards);

    setSubmitting(false);
  };

  const handleNext = async () => {
    const currentCard = getCurrentCard();
    const updatedCards = [...sessionCards];

    // Check if both questions have been answered for this card
    const bothAnswered = currentCard.answeredDefinition !== undefined &&
                        currentCard.answeredPinyin !== undefined;
    const bothCorrect = currentCard.answeredDefinition === true &&
                       currentCard.answeredPinyin === true;

    if (!isCorrect) {
      // Update stats for incorrect answer
      setStats(prev => ({
        ...prev,
        cardsIncorrect: prev.cardsIncorrect + 1,
      }));

      // If incorrect answer, reset the current question type and move card to end
      if (questionType === 'definition') {
        updatedCards[currentIndex].answeredDefinition = undefined;
      } else {
        updatedCards[currentIndex].answeredPinyin = undefined;
      }
      const incorrectCard = updatedCards.splice(currentIndex, 1)[0];
      incorrectCard.answeredDefinition = undefined;
      incorrectCard.answeredPinyin = undefined;
      updatedCards.push(incorrectCard);
      setSessionCards(updatedCards);

      // Reset for next question
      setUserAnswer('');
      setShowFeedback(false);
      selectNextQuestionType(updatedCards[currentIndex] || updatedCards[0]);
    } else if (bothAnswered && bothCorrect) {
      // Both questions answered correctly - submit to backend and mark as fully answered
      try {
        setSubmitting(true);

        const reachedWeek = await invoke<boolean>('submit_srs_answer', {
          characterId: currentCard.character_id,
          correct: true,
        });

        // Update stats
        setStats(prev => ({
          ...prev,
          cardsCorrect: prev.cardsCorrect + 1,
        }));

        // If reached week, save for later (after session completes)
        if (reachedWeek) {
          const newChar = await invoke('unlock_new_character');
          if (newChar) {
            setUnlockedCharacters(prev => [...prev, newChar]);
          }
        }

        updatedCards[currentIndex].fullyAnswered = true;
        setSessionCards(updatedCards);

        // Move to next card
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);

        // Check if session complete
        const remainingCards = updatedCards.filter((card, idx) =>
          idx >= newIndex && !card.fullyAnswered
        );

        if (remainingCards.length === 0) {
          setSessionComplete(true);
        } else {
          // Reset for next card
          setUserAnswer('');
          setShowFeedback(false);
          const nextCard = updatedCards[newIndex];
          if (nextCard) {
            selectNextQuestionType(nextCard);
          } else {
            // Fallback: session complete if no next card
            setSessionComplete(true);
          }
        }

        setSubmitting(false);
      } catch (error) {
        console.error('Failed to submit answer:', error);
        setSubmitting(false);
      }
    } else {
      // One question answered correctly, ask the other question type
      setUserAnswer('');
      setShowFeedback(false);
      selectNextQuestionType(currentCard);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showFeedback) {
      handleSubmit();
    } else if (e.key === 'Enter' && showFeedback) {
      handleNext();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="srs-container">
        <div className="srs-loading">
          <div className="loading-spinner"></div>
          <p>Loading your review session...</p>
        </div>
      </div>
    );
  }

  // Session complete
  if (sessionComplete) {
    // Handle unlocked characters before returning to dashboard
    const handleComplete = () => {
      if (unlockedCharacters.length > 0 && onNewCharacterUnlocked) {
        // Show first unlocked character
        onNewCharacterUnlocked(unlockedCharacters[0]);
      } else {
        onComplete();
      }
    };

    return (
      <div className="srs-container">
        <div className="session-complete">
          <div className="complete-icon">🎉</div>
          <h2>Session Complete!</h2>
          <div className="stats-summary">
            <div className="stat-item">
              <div className="stat-number">{stats.totalCards}</div>
              <div className="stat-label">Cards Reviewed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number correct">{stats.cardsCorrect}</div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="stat-item">
              <div className="stat-number incorrect">{stats.cardsIncorrect}</div>
              <div className="stat-label">Incorrect</div>
            </div>
          </div>
          <p className="complete-message">
            {stats.totalCards === 0
              ? "No cards due for review. Great job staying on top of your studies!"
              : "Great work! Your next review session will be ready when cards become due."}
          </p>
          {unlockedCharacters.length > 0 && (
            <p className="complete-message" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
              🎊 You unlocked {unlockedCharacters.length} new character{unlockedCharacters.length > 1 ? 's' : ''}!
            </p>
          )}
          <button className="btn-primary" onClick={handleComplete}>
            {unlockedCharacters.length > 0 ? 'View New Characters' : 'Return to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  const currentCard = getCurrentCard();
  const progress = ((currentIndex + 1) / sessionCards.length) * 100;

  return (
    <div className="srs-container">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Session Header */}
      <div className="session-header">
        <div className="session-stats">
          <span className="stat">✅ {stats.cardsCorrect}</span>
          <span className="stat">❌ {stats.cardsIncorrect}</span>
        </div>
        <div className="card-counter">
          {currentIndex + 1} / {sessionCards.length}
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card">
        <div className="question-label">
          {questionType === 'definition' ? 'What does this mean?' : 'How do you pronounce this?'}
        </div>

        <div className="character-display-large">
          {currentCard.character}
        </div>

        {!showFeedback ? (
          <div className="answer-section">
            <input
              type="text"
              className="answer-input"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={questionType === 'definition' ? 'Type the meaning...' : 'Type the pinyin...'}
              autoFocus
              disabled={submitting}
            />
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || submitting}
            >
              {submitting ? 'Checking...' : 'Submit'}
            </button>
          </div>
        ) : (
          <div className={`feedback-section ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              {isCorrect ? '✓' : '✗'}
            </div>
            <div className="feedback-message">
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
            {!isCorrect && (
              <>
                <div className="correct-answer">
                  <strong>Correct answer:</strong> {questionType === 'definition' ? currentCard.definition : currentCard.pinyin}
                </div>
                <div className="card-info">
                  <div className="info-row">
                    <span className="label">Character:</span>
                    <span className="value">{currentCard.character}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Pinyin:</span>
                    <span className="value">{currentCard.pinyin}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Meaning:</span>
                    <span className="value">{currentCard.definition}</span>
                  </div>
                </div>
              </>
            )}
            <button className="btn-next" onClick={handleNext}>
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpacedRepetition;
