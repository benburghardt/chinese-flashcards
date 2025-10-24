import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { verifyAnswer, convertToneNumbersToMarks } from '../../utils/answerVerification';
import './SelfStudy.css';

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
  id: string;
  character_id: number;
  character: string;
  pinyin: string;
  definition: string;
  questionType: QuestionType;
  answeredCorrectly: boolean | null;
  attemptCount: number; // Track how many times this question has been attempted
}

interface SelfStudyProps {
  onComplete: () => void;
}

function SelfStudy({ onComplete }: SelfStudyProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [totalCards, setTotalCards] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [firstAttemptCorrect, setFirstAttemptCorrect] = useState(0); // Correct on first try
  const [totalQuestions, setTotalQuestions] = useState(0); // Total questions asked
  const [completedCards, setCompletedCards] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Track which cards have been answered correctly (both questions)
  const [cardProgress, setCardProgress] = useState<Map<number, { definition: boolean; pinyin: boolean }>>(new Map());

  useEffect(() => {
    loadSelfStudyCards();
  }, []);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadSelfStudyCards = async () => {
    try {
      setLoading(true);

      // Start session recording
      const newSessionId = await invoke<number>('start_session', { mode: 'self-study' });
      setSessionId(newSessionId);
      console.log('[SELF-STUDY] Started session:', newSessionId);

      const cards = await invoke<DueCard[]>('get_self_study_cards', { limit: 20 });

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

      console.log('[SELF-STUDY] Loaded', cards.length, 'cards for practice');
      setTotalCards(cards.length);

      // Initialize card progress tracking
      const progressMap = new Map<number, { definition: boolean; pinyin: boolean }>();
      cards.forEach(card => {
        progressMap.set(card.character_id, { definition: false, pinyin: false });
      });
      setCardProgress(progressMap);

      // Create question pool
      const questionPool: Question[] = [];
      cards.forEach(card => {
        questionPool.push({
          id: `${card.character_id}-definition`,
          character_id: card.character_id,
          character: card.character,
          pinyin: card.pinyin,
          definition: card.definition,
          questionType: 'definition',
          answeredCorrectly: null,
          attemptCount: 0,
        });

        questionPool.push({
          id: `${card.character_id}-pinyin`,
          character_id: card.character_id,
          character: card.character,
          pinyin: card.pinyin,
          definition: card.definition,
          questionType: 'pinyin',
          answeredCorrectly: null,
          attemptCount: 0,
        });
      });

      const shuffledQuestions = shuffleArray(questionPool);
      setQuestions(shuffledQuestions);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load self-study cards:', error);
      setLoading(false);
    }
  };

  const getCurrentQuestion = () => questions[currentQuestionIndex];

  const checkAnswer = (answer: string, correctAnswer: string, questionType: QuestionType): boolean => {
    return verifyAnswer(answer, correctAnswer, questionType);
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const currentQuestion = getCurrentQuestion();

    if (currentQuestion && currentQuestion.questionType === 'pinyin') {
      const withMarks = convertToneNumbersToMarks(value);
      setUserAnswer(withMarks);
    } else {
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

    const correct = checkAnswer(userAnswer, correctAnswer, currentQuestion.questionType);

    setIsCorrect(correct);
    setShowFeedback(true);
    setSubmitting(true);

    // Record practice in database
    try {
      await invoke('record_practice', {
        characterId: currentQuestion.character_id,
        practiceMode: 'self-study',
        arrowTested: currentQuestion.questionType === 'definition' ? 'zh_to_en' : 'pinyin_to_zh',
        userAnswer: userAnswer,
        isCorrect: correct,
      });
    } catch (error) {
      console.error('Failed to record practice:', error);
    }

    // Update question status
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answeredCorrectly = correct;
    updatedQuestions[currentQuestionIndex].attemptCount += 1;
    setQuestions(updatedQuestions);

    // Update card progress
    const progress = cardProgress.get(currentQuestion.character_id);
    if (progress) {
      if (currentQuestion.questionType === 'definition') {
        progress.definition = correct;
      } else {
        progress.pinyin = correct;
      }
      setCardProgress(new Map(cardProgress.set(currentQuestion.character_id, progress)));
    }

    // Track statistics
    setTotalQuestions(prev => prev + 1); // Increment total questions asked

    if (correct && updatedQuestions[currentQuestionIndex].attemptCount === 1) {
      // Correct on first attempt
      setFirstAttemptCorrect(prev => prev + 1);
    }

    if (correct) {
      setCorrectAnswers(prev => prev + 1);
    } else {
      setIncorrectAnswers(prev => prev + 1);
    }

    setSubmitting(false);
  };

  const handleNext = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // If incorrect, add question back to the end
    if (!isCorrect) {
      const updatedQuestions = [...questions];
      const incorrectQuestion = { ...currentQuestion, answeredCorrectly: null };
      updatedQuestions.push(incorrectQuestion);
      setQuestions(updatedQuestions);

      // Reset progress for this question type
      const progress = cardProgress.get(currentQuestion.character_id);
      if (progress) {
        if (currentQuestion.questionType === 'definition') {
          progress.definition = false;
        } else {
          progress.pinyin = false;
        }
        setCardProgress(new Map(cardProgress.set(currentQuestion.character_id, progress)));
      }
    } else {
      // Check if this card is now fully complete
      const progress = cardProgress.get(currentQuestion.character_id);
      if (progress && progress.definition && progress.pinyin) {
        setCompletedCards(prev => prev + 1);
      }
    }

    // Move to next question
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      setSessionComplete(true);
    } else {
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer('');
      setShowFeedback(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showFeedback) {
      handleSubmit();
    } else if (e.key === 'Enter' && showFeedback) {
      handleNext();
    }
  };

  if (loading) {
    return (
      <div className="self-study-container">
        <div className="self-study-loading">
          <div className="loading-spinner"></div>
          <p>Loading practice session...</p>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="self-study-container">
        <div className="session-complete">
          <div className="complete-icon">🎓</div>
          <h2>Great Practice Session!</h2>
          <div className="stats-summary">
            <div className="stat-item">
              <div className="stat-number">{totalCards}</div>
              <div className="stat-label">Cards Practiced</div>
            </div>
            <div className="stat-item">
              <div className="stat-number correct">{completedCards}</div>
              <div className="stat-label">Mastered</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{correctAnswers}</div>
              <div className="stat-label">Total Correct</div>
            </div>
          </div>
          <div className="encouragement-message">
            {totalCards === 0 ? (
              <p>No cards available for self-study right now. Complete your SRS reviews or learn new characters!</p>
            ) : completedCards === totalCards ? (
              <p>Perfect! You've mastered all the cards in this session. Keep up the excellent work!</p>
            ) : (
              <p>You've completed this practice session! Remember, self-study doesn't affect your SRS schedule - you can practice as much as you want!</p>
            )}
          </div>
          <button className="btn-primary" onClick={async () => {
            // End session recording
            if (sessionId) {
              try {
                await invoke('end_session', {
                  sessionId,
                  cardsStudied: totalQuestions,
                  cardsCorrect: firstAttemptCorrect,
                  cardsIncorrect: totalQuestions - firstAttemptCorrect
                });
                console.log('[SELF-STUDY] Session ended:', sessionId);
              } catch (error) {
                console.error('[SELF-STUDY] Error ending session:', error);
              }
            }
            onComplete();
          }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();

  if (!currentQuestion) {
    if (!sessionComplete) {
      setSessionComplete(true);
    }
    return (
      <div className="self-study-container">
        <div className="self-study-loading">
          <div className="loading-spinner"></div>
          <p>Finalizing session...</p>
        </div>
      </div>
    );
  }

  const progress = questions.length > 0 ? ((currentQuestionIndex / questions.length) * 100) : 0;

  return (
    <div className="self-study-container">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <div className="progress-text">{currentQuestionIndex} / {questions.length}</div>
      </div>

      {/* Session Header */}
      <div className="session-header">
        <div className="session-stats">
          <span className="stat">✅ {correctAnswers}</span>
          <span className="stat">❌ {incorrectAnswers}</span>
        </div>
        <div className="card-counter">
          {completedCards} / {totalCards} cards
        </div>
        <button
          className="btn-exit-study"
          onClick={onComplete}
          title="Exit practice session"
        >
          🚪 Exit
        </button>
      </div>

      {/* Question Card */}
      <div className={`question-card question-type-${currentQuestion.questionType}`}>
        <div className="practice-badge">📖 Self-Study Practice</div>
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
          <div className={`feedback-section ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              {isCorrect ? '✓' : '✗'}
            </div>
            <div className="feedback-message">
              {isCorrect ? 'Excellent! Keep it up!' : 'Not quite - let\'s review this one'}
            </div>
            {!isCorrect && (
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
                <div className="learning-note">
                  💡 <strong>Remember:</strong> This card will come back until you get it right. Take your time!
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

export default SelfStudy;
