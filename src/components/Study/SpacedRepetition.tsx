import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { verifyAnswer, convertToneNumbersToMarks, hasCorrectSyllablesButWrongTones } from '../../utils/answerVerification';
import './SpacedRepetition.css';

interface DueCard {
  character_id: number;
  character: string;
  pinyin: string;
  definition: string;
  current_interval: number;
  times_reviewed: number;
}

type QuestionType = 'definition' | 'pinyin';

interface Question {
  id: string; // Unique ID for this question
  character_id: number;
  character: string;
  pinyin: string;
  definition: string;
  questionType: QuestionType;
  answeredCorrectly: boolean | null; // null = not answered, true/false = result
}

interface CharacterProgress {
  character_id: number;
  character: string;
  pinyin: string;
  definition: string;
  definitionCorrect: boolean;
  pinyinCorrect: boolean;
  submitted: boolean; // Has this been submitted to backend?
  hadIncorrectAnswer: boolean; // Track if this card ever had an incorrect answer
}

interface SpacedRepetitionProps {
  onComplete: () => void;
  isInitialStudy?: boolean;
  initialStudyCharacterIds?: number[];
}

function SpacedRepetition({ onComplete, isInitialStudy = false, initialStudyCharacterIds = [] }: SpacedRepetitionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [characterProgress, setCharacterProgress] = useState<Map<number, CharacterProgress>>(new Map());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [stats, setStats] = useState({
    cardsCorrect: 0, // Cards that were fully answered correctly
    cardsIncorrect: 0, // Cards that received at least one incorrect answer
  });
  const [completedCharacters, setCompletedCharacters] = useState(0); // Number of characters fully completed
  const [successfulAnswers, setSuccessfulAnswers] = useState(0); // Number of questions answered correctly (for progress bar)
  const [totalRequiredAnswers, setTotalRequiredAnswers] = useState(0); // Total answers needed (cards * 2)
  const [showExitConfirmation, setShowExitConfirmation] = useState(false); // Show exit confirmation modal
  const [isExiting, setIsExiting] = useState(false); // Track if user is exiting study
  const [sessionId, setSessionId] = useState<number | null>(null); // Session ID for recording
  const [sessionEnded, setSessionEnded] = useState(false); // Track if session has been ended
  const [isRetryAttempt, setIsRetryAttempt] = useState(false); // Track if user is retrying after wrong tones
  const [wrongTonesOnly, setWrongTonesOnly] = useState(false); // Track if user had correct syllables but wrong tones

  // Load due cards on mount
  useEffect(() => {
    loadDueCards();
  }, []);

  // Global keyboard handler for Enter key
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (showFeedback && wrongTonesOnly) {
          // For wrong tones, Enter key triggers retry
          handleRetry();
        } else if (showFeedback) {
          handleNext();
        } else if (!submitting && userAnswer.trim()) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyPress);
    return () => window.removeEventListener('keydown', handleGlobalKeyPress);
  }, [showFeedback, submitting, userAnswer, wrongTonesOnly]);

  // End session when naturally completed
  useEffect(() => {
    if (sessionComplete && sessionId && !isExiting && !sessionEnded) {
      const endSession = async () => {
        try {
          await invoke('end_session', {
            sessionId,
            cardsStudied: totalCharacters,
            cardsCorrect: stats.cardsCorrect,
            cardsIncorrect: stats.cardsIncorrect
          });
          console.log('[SRS] Session naturally completed and ended:', sessionId);
          setSessionEnded(true); // Mark as ended to prevent duplicate calls
        } catch (error) {
          console.error('[SRS] Error ending completed session:', error);
        }
      };
      endSession();
    }
  }, [sessionComplete, sessionId, isExiting, sessionEnded, stats, totalCharacters]);

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadDueCards = async () => {
    try {
      setLoading(true);

      // Start session recording
      const mode = isInitialStudy ? 'initial_study' : 'spaced_repetition';
      const newSessionId = await invoke<number>('start_session', { mode });
      setSessionId(newSessionId);
      console.log('[SRS] Started session:', newSessionId);

      let cards: DueCard[];
      if (isInitialStudy && initialStudyCharacterIds.length > 0) {
        // For initial study, fetch the specific characters
        console.log('[SRS] Loading initial study cards:', initialStudyCharacterIds);
        cards = await invoke<DueCard[]>('get_characters_for_initial_study', {
          characterIds: initialStudyCharacterIds
        });
      } else {
        // Regular review session
        cards = await invoke<DueCard[]>('get_due_cards_for_review');
      }

      if (cards.length === 0) {
        setSessionComplete(true);
        setLoading(false);
        // End session with 0 cards
        if (newSessionId) {
          await invoke('end_session', {
            sessionId: newSessionId,
            cardsStudied: 0,
            cardsCorrect: 0,
            cardsIncorrect: 0
          });
        }
        return;
      }

      console.log('[SRS] Loaded', cards.length, isInitialStudy ? 'initial study cards' : 'due cards');
      setTotalCharacters(cards.length);
      setTotalRequiredAnswers(cards.length * 2); // Each card needs 2 answers (definition + pinyin)

      // Initialize character progress tracking
      const progressMap = new Map<number, CharacterProgress>();
      cards.forEach(card => {
        progressMap.set(card.character_id, {
          character_id: card.character_id,
          character: card.character,
          pinyin: card.pinyin,
          definition: card.definition,
          definitionCorrect: false,
          pinyinCorrect: false,
          submitted: false,
          hadIncorrectAnswer: false,
        });
      });
      setCharacterProgress(progressMap);

      // Create question pool: 2 questions per card (definition + pinyin)
      const questionPool: Question[] = [];
      cards.forEach(card => {
        // Definition question
        questionPool.push({
          id: `${card.character_id}-definition`,
          character_id: card.character_id,
          character: card.character,
          pinyin: card.pinyin,
          definition: card.definition,
          questionType: 'definition',
          answeredCorrectly: null,
        });

        // Pinyin question
        questionPool.push({
          id: `${card.character_id}-pinyin`,
          character_id: card.character_id,
          character: card.character,
          pinyin: card.pinyin,
          definition: card.definition,
          questionType: 'pinyin',
          answeredCorrectly: null,
        });
      });

      // Shuffle the question pool for completely random order
      const shuffledQuestions = shuffleArray(questionPool);
      console.log('[SRS] Created and shuffled', shuffledQuestions.length, 'questions');

      setQuestions(shuffledQuestions);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load due cards:', error);
      setLoading(false);
    }
  };

  const getCurrentQuestion = () => questions[currentQuestionIndex];

  // Use the new robust answer verification system
  const checkAnswer = (answer: string, correctAnswer: string, questionType: QuestionType): boolean => {
    return verifyAnswer(answer, correctAnswer, questionType);
  };

  // Handle input changes with real-time pinyin tone mark conversion
  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const currentQuestion = getCurrentQuestion();

    // For pinyin questions, convert tone numbers to marks in real-time
    if (currentQuestion && currentQuestion.questionType === 'pinyin') {
      // Convert tone numbers to marks (ma1 -> mā)
      const withMarks = convertToneNumbersToMarks(value);
      setUserAnswer(withMarks);
    } else {
      // For definition questions, use value as-is
      setUserAnswer(value);
    }
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim() || submitting) return;

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    const correctAnswer = currentQuestion.questionType === 'definition'
      ? currentQuestion.definition
      : currentQuestion.pinyin;

    // Debug logging
    if (currentQuestion.questionType === 'pinyin') {
      console.log('[VERIFY] User answer:', userAnswer);
      console.log('[VERIFY] Correct answer:', correctAnswer);
    }

    const correct = checkAnswer(userAnswer, correctAnswer, currentQuestion.questionType);

    if (currentQuestion.questionType === 'pinyin') {
      console.log('[VERIFY] Result:', correct);
    }

    // For pinyin questions, check if syllables are correct but tones are wrong
    let wrongTones = false;
    if (currentQuestion.questionType === 'pinyin' && !correct && !isRetryAttempt) {
      wrongTones = hasCorrectSyllablesButWrongTones(userAnswer, correctAnswer);
      console.log('[VERIFY] Wrong tones only:', wrongTones);
    }

    setIsCorrect(correct);
    setWrongTonesOnly(wrongTones);
    setShowFeedback(true);
    setSubmitting(true);

    // If wrong tones only, give user a second chance - don't update progress yet
    if (wrongTones) {
      setIsRetryAttempt(true);
      setSubmitting(false);
      return; // Don't update question status or character progress yet
    }

    // Update question status
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answeredCorrectly = correct;
    setQuestions(updatedQuestions);

    // Update character progress
    const progress = characterProgress.get(currentQuestion.character_id);
    if (progress) {
      const wasAlreadyCorrect = currentQuestion.questionType === 'definition'
        ? progress.definitionCorrect
        : progress.pinyinCorrect;

      if (currentQuestion.questionType === 'definition') {
        progress.definitionCorrect = correct;
      } else {
        progress.pinyinCorrect = correct;
      }
      setCharacterProgress(new Map(characterProgress.set(currentQuestion.character_id, progress)));

      // Track successful answers for progress bar (only increment if newly correct)
      if (correct && !wasAlreadyCorrect) {
        setSuccessfulAnswers(prev => prev + 1);
      }
    }

    // Reset retry state for next question
    setIsRetryAttempt(false);
    setSubmitting(false);
  };

  const handleRetry = () => {
    // User is retrying after wrong tones - clear feedback and let them try again
    setShowFeedback(false);
    setUserAnswer('');
    setWrongTonesOnly(false);
    // Keep isRetryAttempt = true so we know this is the second attempt
  };

  const handleNext = async () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    console.log('[SRS] Moving to next question. Current:', currentQuestionIndex, 'Total:', questions.length);

    // Track incorrect answers at the card level
    if (!isCorrect) {
      const progress = characterProgress.get(currentQuestion.character_id);
      if (progress && !progress.hadIncorrectAnswer) {
        // First time this card has been answered incorrectly
        progress.hadIncorrectAnswer = true;
        setCharacterProgress(new Map(characterProgress.set(currentQuestion.character_id, progress)));

        // Increment incorrect card counter
        setStats(prev => ({
          ...prev,
          cardsIncorrect: prev.cardsIncorrect + 1,
        }));
      }

      // If incorrect, add this question back to the end of the queue
      const updatedQuestions = [...questions];
      const incorrectQuestion = { ...currentQuestion, answeredCorrectly: null };
      updatedQuestions.push(incorrectQuestion);
      setQuestions(updatedQuestions);
      console.log('[SRS] Added incorrect question back to queue. Total questions:', updatedQuestions.length);

      // Reset character progress for this question type
      if (progress) {
        if (currentQuestion.questionType === 'definition') {
          progress.definitionCorrect = false;
        } else {
          progress.pinyinCorrect = false;
        }
        setCharacterProgress(new Map(characterProgress.set(currentQuestion.character_id, progress)));
      }
    }

    // Move to next question
    const nextIndex = currentQuestionIndex + 1;

    // Check if this character is now fully complete (both questions correct)
    const progress = characterProgress.get(currentQuestion.character_id);
    if (progress && progress.definitionCorrect && progress.pinyinCorrect && !progress.submitted) {
      // For initial study, don't submit to backend yet - will be handled by processInitialStudyCompletion
      // For regular review, submit to backend immediately
      if (!isInitialStudy) {
        // Submit to backend
        try {
          setSubmitting(true);
          console.log('[SRS] Character fully answered. Submitting:', currentQuestion.character_id);

          const reachedWeek = await invoke<boolean>('submit_srs_answer', {
            characterId: currentQuestion.character_id,
            correct: true,
          });

          console.log('[SRS] Answer submitted. Reached week:', reachedWeek);

          // Mark as submitted
          progress.submitted = true;
          setCharacterProgress(new Map(characterProgress.set(currentQuestion.character_id, progress)));

          // Character reached week milestone (tracked for analytics)
          if (reachedWeek) {
            console.log('[SRS] Character reached week milestone (mastery tracked)');
          }

          setSubmitting(false);
        } catch (error) {
          console.error('[SRS] CRITICAL ERROR during answer submission:', error);
          alert(`Error submitting answer: ${error}. Please check the console.`);
          setSubmitting(false);
        }
      } else {
        // For initial study, just mark as completed (will be submitted at end)
        console.log('[SRS] Initial study: Character fully answered:', currentQuestion.character_id);
      }

      // Update stats: increment completed characters counter
      setCompletedCharacters(prev => prev + 1);

      // Update correct card counter only if this card never had an incorrect answer
      if (!progress.hadIncorrectAnswer) {
        setStats(prev => ({
          ...prev,
          cardsCorrect: prev.cardsCorrect + 1,
        }));
      }
    }

    // Check if session complete
    if (nextIndex >= questions.length) {
      console.log('[SRS] Session complete!');

      // Process all characters for initial study mode
      if (isInitialStudy) {
        await processInitialStudyCompletion();
      }

      setSessionComplete(true);
    } else {
      // Move to next question
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer('');
      setShowFeedback(false);
      console.log('[SRS] Moving to question', nextIndex);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showFeedback) {
      handleSubmit();
    } else if (e.key === 'Enter' && showFeedback) {
      handleNext();
    }
  };

  // Helper function to process all characters at end of initial study
  const processInitialStudyCompletion = async () => {
    if (!isInitialStudy) return;

    const completedCharactersList: number[] = [];
    const incompleteCharactersList: number[] = [];

    characterProgress.forEach((progress) => {
      if (progress.submitted || (progress.definitionCorrect && progress.pinyinCorrect)) {
        // Fully completed - already submitted during session
        completedCharactersList.push(progress.character_id);
      } else {
        // Incomplete (not answered at all, or only partially answered)
        incompleteCharactersList.push(progress.character_id);
      }
    });

    console.log('[SRS] Initial study completion:', completedCharactersList.length, 'completed,', incompleteCharactersList.length, 'incomplete');

    // Mark completed characters with 1-hour interval (if not already submitted)
    const notYetSubmitted = completedCharactersList.filter(id => {
      const progress = characterProgress.get(id);
      return progress && !progress.submitted;
    });

    if (notYetSubmitted.length > 0) {
      try {
        await invoke('complete_initial_srs_session', {
          characterIds: notYetSubmitted
        });
        console.log('[SRS] Marked', notYetSubmitted.length, 'completed characters (1-hour interval)');
      } catch (error) {
        console.error('[SRS] Error marking completed characters:', error);
      }
    }

    // Mark incomplete characters as immediately reviewable
    if (incompleteCharactersList.length > 0) {
      try {
        await invoke('mark_incomplete_characters_reviewable', {
          characterIds: incompleteCharactersList
        });
        console.log('[SRS] Marked', incompleteCharactersList.length, 'incomplete characters as immediately reviewable');
      } catch (error) {
        console.error('[SRS] Error marking incomplete characters:', error);
      }
    }
  };

  const handleExitStudy = () => {
    // Show confirmation modal
    setShowExitConfirmation(true);
  };

  const handleCancelExit = () => {
    // Hide confirmation modal
    setShowExitConfirmation(false);
  };

  const handleConfirmExit = async () => {
    setShowExitConfirmation(false);
    setIsExiting(true);

    try {
      console.log('[SRS] Exiting study session early. Processing character states...');

      // For initial study mode, process all characters
      if (isInitialStudy) {
        await processInitialStudyCompletion();
      } else {
        // Regular review session - existing logic
        const completedCharactersList: number[] = [];
        const incorrectCharactersList: number[] = [];

        characterProgress.forEach((progress) => {
          if (progress.submitted) {
            // Already submitted during session
            completedCharactersList.push(progress.character_id);
          } else if (progress.definitionCorrect && progress.pinyinCorrect) {
            // Fully completed but not yet submitted
            completedCharactersList.push(progress.character_id);
          } else if (progress.hadIncorrectAnswer) {
            // Had at least one incorrect answer
            incorrectCharactersList.push(progress.character_id);
          }
        });

        console.log('[SRS] Submitting', completedCharactersList.length, 'completed characters');
        console.log('[SRS] Submitting', incorrectCharactersList.length, 'incorrect characters');

        // Submit completed characters
        for (const characterId of completedCharactersList) {
          if (!characterProgress.get(characterId)?.submitted) {
            try {
              await invoke('submit_srs_answer', {
                characterId,
                correct: true,
              });
              console.log('[SRS] Submitted completed character:', characterId);
            } catch (error) {
              console.error('[SRS] Error submitting completed character:', characterId, error);
            }
          }
        }

        // Submit incorrect characters
        for (const characterId of incorrectCharactersList) {
          try {
            await invoke('submit_srs_answer', {
              characterId,
              correct: false,
            });
            console.log('[SRS] Submitted incorrect character:', characterId);
          } catch (error) {
            console.error('[SRS] Error submitting incorrect character:', characterId, error);
          }
        }
      }

      // End session recording
      if (sessionId && !sessionEnded) {
        try {
          await invoke('end_session', {
            sessionId,
            cardsStudied: totalCharacters,
            cardsCorrect: stats.cardsCorrect,
            cardsIncorrect: stats.cardsIncorrect
          });
          console.log('[SRS] Session ended:', sessionId);
          setSessionEnded(true); // Mark as ended to prevent duplicate calls
        } catch (error) {
          console.error('[SRS] Error ending session:', error);
        }
      }

      console.log('[SRS] Exit complete. Returning to dashboard.');
      onComplete();
    } catch (error) {
      console.error('[SRS] Error during exit:', error);
      alert(`Error saving progress: ${error}`);
      setIsExiting(false);
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
    return (
      <div className="srs-container">
        <div className="session-complete">
          <div className="complete-icon">🎉</div>
          <h2>Session Complete!</h2>
          <div className="stats-summary">
            <div className="stat-item">
              <div className="stat-number">{totalCharacters}</div>
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
            {totalCharacters === 0
              ? "No cards due for review. Great job staying on top of your studies!"
              : "Great work! Your next review session will be ready when cards become due."}
          </p>
          <button className="btn-primary" onClick={onComplete}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();

  // Safety check: if no current question, session must be complete
  if (!currentQuestion) {
    console.log('[SRS] No current question available, marking session complete');
    if (!sessionComplete) {
      setSessionComplete(true);
    }
    return (
      <div className="srs-container">
        <div className="srs-loading">
          <div className="loading-spinner"></div>
          <p>Finalizing session...</p>
        </div>
      </div>
    );
  }

  // Calculate progress based on successful answers vs total required
  const progress = totalRequiredAnswers > 0 ? (successfulAnswers / totalRequiredAnswers) * 100 : 0;

  return (
    <div className="srs-container">
      {/* Exit Confirmation Modal */}
      {showExitConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">⚠️</div>
            <h2 className="modal-title">Exit Study Session?</h2>
            <p className="modal-message">
              Your progress on completed characters will be saved.
            </p>
            <div className="modal-stats">
              <div className="modal-stat-item">
                <span className="modal-stat-label">Completed:</span>
                <span className="modal-stat-value">{completedCharacters} / {totalCharacters}</span>
              </div>
              <div className="modal-stat-item">
                <span className="modal-stat-label">Successful answers:</span>
                <span className="modal-stat-value">{successfulAnswers} / {totalRequiredAnswers}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={handleCancelExit}>
                Continue Studying
              </button>
              <button className="btn-modal-confirm" onClick={handleConfirmExit}>
                Exit Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <div className="progress-text">{successfulAnswers} / {totalRequiredAnswers}</div>
      </div>

      {/* Session Header */}
      <div className="session-header">
        <div className="session-stats">
          <span className="stat">✅ {stats.cardsCorrect}</span>
          <span className="stat">❌ {stats.cardsIncorrect}</span>
        </div>
        <div className="card-counter">
          {completedCharacters} / {totalCharacters}
        </div>
        <button
          className="btn-exit-study"
          onClick={handleExitStudy}
          disabled={isExiting}
          title="Exit study session"
        >
          {isExiting ? 'Exiting...' : '🚪 Exit'}
        </button>
      </div>

      {/* Question Card */}
      <div className={`question-card question-type-${currentQuestion.questionType}`}>
        <div className="question-label">
          {currentQuestion.questionType === 'definition' ? '📖 What does this mean?' : '🔊 How do you pronounce this?'}
        </div>

        <div className="character-display-large">
          {currentQuestion.character}
        </div>

        {!showFeedback ? (
          <div className="answer-section">
            <input
              type="text"
              className="answer-input"
              value={userAnswer}
              onChange={handleAnswerChange}
              onKeyPress={handleKeyPress}
              placeholder={currentQuestion.questionType === 'definition' ? 'Type the meaning...' : 'Type the pinyin...'}
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
          <div className={`feedback-section ${isCorrect ? 'correct' : wrongTonesOnly ? 'partial' : 'incorrect'}`}>
            <div className="feedback-icon">
              {isCorrect ? '✓' : wrongTonesOnly ? '⚠' : '✗'}
            </div>
            <div className="feedback-message">
              {isCorrect ? 'Correct!' : wrongTonesOnly ? 'Wrong Tones!' : 'Incorrect'}
            </div>
            {wrongTonesOnly && (
              <>
                <div className="partial-feedback">
                  <p><strong>Close!</strong> You have the right syllables, but the tones are incorrect.</p>
                  <p>Try again and pay attention to the tone marks!</p>
                </div>
                <button className="btn-retry" onClick={handleRetry}>
                  Try Again
                </button>
              </>
            )}
            {!isCorrect && !wrongTonesOnly && (
              <>
                <div className="user-answer">
                  <strong>Your answer:</strong> {userAnswer}
                </div>
                <div className="correct-answer">
                  <strong>Correct answer:</strong> {
                    currentQuestion.questionType === 'definition'
                      ? currentQuestion.definition
                      : convertToneNumbersToMarks(currentQuestion.pinyin)
                  }
                </div>
                <div className="card-info">
                  <div className="info-row">
                    <span className="label">Character:</span>
                    <span className="value">{currentQuestion.character}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Pinyin:</span>
                    <span className="value">{convertToneNumbersToMarks(currentQuestion.pinyin)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Meaning:</span>
                    <span className="value">{currentQuestion.definition}</span>
                  </div>
                </div>
              </>
            )}
            {!wrongTonesOnly && (
              <button className="btn-next" onClick={handleNext}>
                Continue →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SpacedRepetition;
