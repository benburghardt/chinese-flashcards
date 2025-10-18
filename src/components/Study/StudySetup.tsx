import React, { useState, useMemo } from 'react';
import { StudyModeSelector } from './StudyModeSelector';
import { StudyMode, FlashcardSet, StudySession, StudyProgress } from '../../types';
import { StudyModeGenerator } from '../../algorithms/studyModes';
import { SpacedRepetitionAlgorithm } from '../../algorithms/spacedRepetition';
import { ProgressService } from '../../services/ProgressService';

interface StudySetupProps {
  flashcardSet: FlashcardSet;
  initialMode?: StudyMode;
  onStartSession: (session: StudySession) => void;
  onCancel: () => void;
  flashcardSetFilePath?: string;
}

export const StudySetup: React.FC<StudySetupProps> = ({
  flashcardSet,
  initialMode = 'self-test',
  onStartSession,
  onCancel,
  flashcardSetFilePath,
}) => {
  const [selectedMode, setSelectedMode] = useState<StudyMode>(initialMode);
  const [questionCount, setQuestionCount] = useState(20);
  const [selectedFlashcardId, setSelectedFlashcardId] = useState<string | null>(null);

  // Calculate total available arrows for study
  const totalArrows = useMemo(() => {
    return flashcardSet.flashcards.reduce(
      (sum, card) => sum + card.arrows.length,
      0
    );
  }, [flashcardSet]);

  const handleStartSession = async () => {
    let questions;

    if (selectedMode === 'custom-path' && selectedFlashcardId) {
      // Custom path mode - requires a starting flashcard and side
      const flashcard = flashcardSet.flashcards.find(f => f.id === selectedFlashcardId);
      if (flashcard && flashcard.sides.length > 0) {
        // Find the most connected side as the starting point
        const startSideId = StudyModeGenerator.findMostConnectedSide(flashcard);
        if (startSideId) {
          questions = StudyModeGenerator.generateCustomPath(
            flashcard,
            startSideId,
            questionCount
          );
        } else {
          alert('Please select a flashcard with at least one side for custom path mode');
          return;
        }
      } else {
        alert('Please select a flashcard with at least one side for custom path mode');
        return;
      }
    } else {
      // Generate questions for other modes
      questions = StudyModeGenerator.generateQuestions(
        flashcardSet.flashcards,
        selectedMode,
        questionCount
      );
    }

    if (!questions || questions.length === 0) {
      alert('No questions could be generated. Make sure your flashcards have arrows connecting sides.');
      return;
    }

    // Initialize progress map for spaced repetition
    let progressMap: Record<string, StudyProgress> | undefined = undefined;
    if (selectedMode === 'spaced-repetition') {
      // Load existing progress
      const existingProgress = await ProgressService.loadProgress(
        flashcardSet.id,
        flashcardSetFilePath
      );

      progressMap = {};

      // Initialize progress for all questions, using existing progress if available
      questions.forEach(q => {
        if (existingProgress[q.arrowId]) {
          progressMap![q.arrowId] = existingProgress[q.arrowId];
        } else {
          progressMap![q.arrowId] = SpacedRepetitionAlgorithm.initializeProgress(q.arrowId);
        }
      });
    }

    const session: StudySession = {
      mode: selectedMode,
      questions,
      currentQuestionIndex: 0,
      score: 0,
      startTime: new Date(),
      progressMap,
    };

    onStartSession(session);
  };

  const getAvailableModes = (): StudyMode[] => {
    const modes: StudyMode[] = ['self-test', 'multiple-choice', 'flash'];

    // Always show spaced repetition if there are any arrows
    if (totalArrows > 0) {
      modes.push('spaced-repetition');
    }

    // Only show custom path if there's at least one flashcard
    if (flashcardSet.flashcards.length > 0) {
      modes.push('custom-path');
    }

    return modes;
  };

  return (
    <div className="study-setup">
      <div className="study-setup-header">
        <h2>Start Study Session</h2>
        <button className="close-btn" onClick={onCancel}>×</button>
      </div>

      <div className="study-setup-content">
        <div className="flashcard-set-info">
          <h3>{flashcardSet.name || 'Untitled Set'}</h3>
          <p>{flashcardSet.flashcards.length} flashcard(s)</p>
          <p>{totalArrows} relationship(s) to study</p>
        </div>

        <StudyModeSelector
          selectedMode={selectedMode}
          onModeSelect={setSelectedMode}
          availableModes={getAvailableModes()}
        />

        <div className="study-options">
          <div className="option-group">
            <label htmlFor="question-count">Number of Questions:</label>
            <input
              id="question-count"
              type="number"
              min="1"
              max={Math.max(totalArrows, 100)}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <span className="option-hint">
              (Max available: {totalArrows})
            </span>
          </div>

          {selectedMode === 'custom-path' && (
            <div className="option-group">
              <label htmlFor="flashcard-select">Starting Flashcard:</label>
              <select
                id="flashcard-select"
                value={selectedFlashcardId || ''}
                onChange={(e) => setSelectedFlashcardId(e.target.value)}
              >
                <option value="">Select a flashcard...</option>
                {flashcardSet.flashcards.map((card, index) => (
                  <option key={card.id} value={card.id}>
                    Flashcard {index + 1} ({card.sides.length} sides, {card.arrows.length} arrows)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedMode === 'spaced-repetition' && (
            <div className="spaced-rep-info">
              <p><strong>Spaced Repetition Mode</strong></p>
              <p>This mode uses the SM-2 algorithm to optimize your review schedule based on performance.</p>
              <p>Cards you struggle with will appear more frequently, while mastered cards will appear less often.</p>
            </div>
          )}
        </div>

        <div className="study-setup-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="start-session-btn"
            onClick={handleStartSession}
            disabled={totalArrows === 0 || (selectedMode === 'custom-path' && !selectedFlashcardId)}
          >
            Start Study Session
          </button>
        </div>
      </div>
    </div>
  );
};
