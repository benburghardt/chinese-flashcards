import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StudyModeGenerator } from '../../algorithms/studyModes';
import { SpacedRepetitionAlgorithm } from '../../algorithms/spacedRepetition';
import { ProgressService } from '../../services/ProgressService';

interface StudySessionProps {
  onEndSession: () => void;
  flashcardSetFilePath?: string;
}

export const StudySession: React.FC<StudySessionProps> = ({ onEndSession, flashcardSetFilePath }) => {
  const { state } = useApp();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [flashAnswerRevealed, setFlashAnswerRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    startTime: new Date(),
  });

  // Custom path mode state - for interactive network browsing
  const [customPathCurrentSideId, setCustomPathCurrentSideId] = useState<string | null>(null);

  const studySession = state.studySession;

  if (!studySession) {
    return <div className="study-session-error">No active study session</div>;
  }

  const currentQuestion = studySession.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === studySession.questions.length - 1;

  // Initialize custom path mode
  useEffect(() => {
    if (studySession.mode === 'custom-path' && state.currentSet && currentQuestion) {
      // Find the flashcard
      const flashcard = state.currentSet.flashcards.find(f => f.id === currentQuestion.flashcardId);
      if (flashcard && !customPathCurrentSideId) {
        // Find the most connected side as starting point
        const startingSideId = StudyModeGenerator.findMostConnectedSide(flashcard);
        setCustomPathCurrentSideId(startingSideId);
      }
    }
  }, [studySession.mode, state.currentSet, currentQuestion, customPathCurrentSideId]);

  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion) return;

    let correct = false;

    if (currentQuestion.mode === 'multiple-choice') {
      correct = userAnswer === currentQuestion.correctAnswer;
    } else {
      correct = StudyModeGenerator.validateAnswer(currentQuestion, userAnswer);
    }

    setIsCorrect(correct);
    setShowFeedback(true);
    setSessionStats(prev => ({
      ...prev,
      total: prev.total + 1,
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }));

    // Update progress if using spaced repetition
    if (studySession.mode === 'spaced-repetition') {
      updateProgress(currentQuestion.arrowId, correct);
    }
  }, [currentQuestion, userAnswer, studySession.mode]);

  const updateProgress = async (arrowId: string, correct: boolean) => {
    if (!studySession.progressMap || !state.currentSet) return;

    const existingProgress = studySession.progressMap[arrowId];

    if (existingProgress) {
      const updatedProgress = SpacedRepetitionAlgorithm.calculateNextReview(
        existingProgress,
        correct,
        3 // Default difficulty, can be calculated from performance
      );

      // Update the progress map in the session
      studySession.progressMap[arrowId] = updatedProgress;

      // Save progress immediately after each answer
      try {
        await ProgressService.saveProgress(
          state.currentSet.id,
          state.currentSet.name,
          studySession.progressMap,
          flashcardSetFilePath
        );
      } catch (error) {
        console.error('Failed to save progress after answer:', error);
      }
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      handleEndSession();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
      setFlashAnswerRevealed(false);
    }
  };

  const handleEndSession = async () => {
    // Save progress if using spaced repetition
    if (studySession.mode === 'spaced-repetition' && studySession.progressMap && state.currentSet) {
      try {
        await ProgressService.saveProgress(
          state.currentSet.id,
          state.currentSet.name,
          studySession.progressMap,
          flashcardSetFilePath
        );
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }

    onEndSession();
  };

  const handleMultipleChoiceSelect = (option: string) => {
    if (!showFeedback) {
      setUserAnswer(option);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showFeedback) {
      handleSubmitAnswer();
    }
  };

  if (!currentQuestion) {
    return (
      <div className="study-session">
        <div className="study-complete">
          <h2>Study Session Complete!</h2>
          <div className="final-stats">
            <p>Questions Answered: {sessionStats.total}</p>
            <p>Correct: {sessionStats.correct}</p>
            <p>Incorrect: {sessionStats.incorrect}</p>
            <p>Accuracy: {sessionStats.total > 0
              ? ((sessionStats.correct / sessionStats.total) * 100).toFixed(1)
              : 0}%</p>
          </div>
          <button onClick={onEndSession}>Return to Flashcards</button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-session">
      <div className="study-header">
        {studySession.mode !== 'custom-path' && (
          <>
            <div className="study-progress">
              Question {currentQuestionIndex + 1} of {studySession.questions.length}
            </div>
            <div className="study-stats">
              Correct: {sessionStats.correct} | Incorrect: {sessionStats.incorrect}
            </div>
          </>
        )}
        {studySession.mode === 'custom-path' && (
          <div className="custom-path-title">
            <h3>Network Explorer</h3>
          </div>
        )}
        <button className="end-session-btn" onClick={handleEndSession}>
          End Session
        </button>
      </div>

      <div className="study-content">
        <div className="question-card">
          {studySession.mode !== 'custom-path' && (
            <div className="question-prompt">
              <h3>{currentQuestion.sourceValue}</h3>
              <p className="arrow-label-question">
                {currentQuestion.arrowLabel}?
              </p>
            </div>
          )}

          {studySession.mode === 'custom-path' && state.currentSet && customPathCurrentSideId ? (() => {
            // Custom path mode - interactive network browser
            const flashcard = state.currentSet.flashcards.find(f => f.id === currentQuestion?.flashcardId);
            if (!flashcard) return null;

            const currentSide = flashcard.sides.find(s => s.id === customPathCurrentSideId);
            if (!currentSide) return null;

            const outgoingArrows = StudyModeGenerator.getOutgoingArrows(flashcard, customPathCurrentSideId);
            // Get incoming arrows (for back navigation)
            const incomingArrows = flashcard.arrows.filter(arrow => arrow.destinationId === customPathCurrentSideId);

            // Calculate positions for arrows around the center
            const allArrows = [...outgoingArrows.map(a => ({ ...a, isOutgoing: true })), ...incomingArrows.map(a => ({ ...a, isOutgoing: false }))];
            const angleStep = (2 * Math.PI) / Math.max(allArrows.length, 1);

            return (
              <div className="custom-path-browser">
                <div className="network-container">
                  {/* Central side */}
                  <div className="central-side">
                    <h2>{currentSide.value}</h2>
                    <p className="side-info">{allArrows.length} connection(s)</p>
                  </div>

                  {/* Arrows positioned around the center */}
                  {allArrows.map((arrow, index) => {
                    const angle = index * angleStep - Math.PI / 2; // Start from top
                    const radius = 250; // Distance from center
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    const targetSide = flashcard.sides.find(s =>
                      s.id === (arrow.isOutgoing ? arrow.destinationId : arrow.sourceId)
                    );
                    if (!targetSide) return null;

                    return (
                      <div
                        key={arrow.id}
                        className="arrow-node"
                        style={{
                          transform: `translate(${x}px, ${y}px)`
                        }}
                      >
                        <button
                          className={`arrow-button ${arrow.isOutgoing ? 'outgoing' : 'incoming'}`}
                          onClick={() => setCustomPathCurrentSideId(arrow.isOutgoing ? arrow.destinationId : arrow.sourceId)}
                        >
                          <div className="arrow-content">
                            {!arrow.isOutgoing && <span className="arrow-icon incoming-icon">←</span>}
                            <span className="arrow-label-text">{arrow.label}</span>
                            {arrow.isOutgoing && <span className="arrow-icon outgoing-icon">→</span>}
                          </div>
                        </button>
                      </div>
                    );
                  })}

                  {allArrows.length === 0 && (
                    <div className="no-connections">
                      <p>No connections from this side</p>
                      <button
                        className="reset-path-btn"
                        onClick={() => {
                          const startingSideId = StudyModeGenerator.findMostConnectedSide(flashcard);
                          setCustomPathCurrentSideId(startingSideId);
                        }}
                      >
                        Return to Start
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })() : studySession.mode === 'multiple-choice' ? (
            <div className="multiple-choice-options">
              {currentQuestion.options?.map((option: string, index: number) => (
                <button
                  key={index}
                  className={`choice-option ${
                    userAnswer === option ? 'selected' : ''
                  } ${
                    showFeedback
                      ? option === currentQuestion.correctAnswer
                        ? 'correct'
                        : userAnswer === option
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleMultipleChoiceSelect(option)}
                  disabled={showFeedback}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : studySession.mode === 'flash' ? (
            <div className="flash-mode">
              {flashAnswerRevealed ? (
                <>
                  <div className="answer-reveal revealed">
                    <h3>{currentQuestion.correctAnswer}</h3>
                  </div>
                  <div className="flash-controls">
                    <button onClick={() => handleNextQuestion()}>
                      {isLastQuestion ? 'Complete Session' : 'Next Card'}
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="answer-reveal hidden"
                  onClick={() => setFlashAnswerRevealed(true)}
                >
                  <p>Click to reveal answer</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-input-mode">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer..."
                disabled={showFeedback}
                autoFocus
                className="answer-input"
              />
            </div>
          )}

          {!showFeedback && studySession.mode !== 'flash' && studySession.mode !== 'custom-path' && (
            <button
              className="submit-answer-btn"
              onClick={handleSubmitAnswer}
              disabled={!userAnswer.trim()}
            >
              Submit Answer
            </button>
          )}

          {showFeedback && studySession.mode !== 'flash' && studySession.mode !== 'custom-path' && (
            <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
              <h4>{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</h4>
              {!isCorrect && (
                <p>
                  The correct answer was: <strong>{currentQuestion.correctAnswer}</strong>
                </p>
              )}
              <button className="next-question-btn" onClick={handleNextQuestion}>
                {isLastQuestion ? 'Complete Session' : 'Next Question'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
