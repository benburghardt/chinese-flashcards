import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import WritingVerificationCanvas from "./WritingVerificationCanvas";
import { VerificationResult } from "../../utils/strokeVerification";
import "./WritingPracticeMode.css";

interface PracticeCharacter {
  id: number;
  character: string;
  simplified: string | null;
  traditional: string | null;
  mandarin_pinyin: string;
  definition: string;
  stroke_count: number;
}

interface CharacterProgress {
  characterId: number;
  attempts: number;
  completed: boolean;
}

export default function WritingPracticeMode() {
  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<PracticeCharacter[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<Map<number, CharacterProgress>>(new Map());
  const [showReference, setShowReference] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  // Load practice characters on mount
  useEffect(() => {
    loadPracticeCharacters();
  }, []);

  const loadPracticeCharacters = async () => {
    try {
      setLoading(true);

      // Request 20 characters with stroke data for practice
      const result: PracticeCharacter[] = await invoke("get_writing_practice_characters", {
        count: 20,
      });

      console.log("Loaded practice characters:", result);

      if (result.length === 0) {
        alert("No characters with stroke data available. Please ensure stroke data is loaded.");
        return;
      }

      setCharacters(result);

      // Initialize progress tracking
      const initialProgress = new Map<number, CharacterProgress>();
      result.forEach(char => {
        initialProgress.set(char.id, {
          characterId: char.id,
          attempts: 0,
          completed: false,
        });
      });
      setProgress(initialProgress);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load practice characters:", error);
      alert("Failed to load practice characters. Check console for details.");
      setLoading(false);
    }
  };

  const currentCharacter = characters[currentIndex];
  const currentProgress = currentCharacter ? progress.get(currentCharacter.id) : null;

  const handleVerificationComplete = (result: VerificationResult) => {
    setVerificationResult(result);

    if (!currentCharacter || !currentProgress) return;

    // Update attempts
    const updatedProgress = new Map(progress);
    const charProgress = updatedProgress.get(currentCharacter.id)!;
    charProgress.attempts += 1;

    if (result.isCorrect) {
      charProgress.completed = true;
      updatedProgress.set(currentCharacter.id, charProgress);
      setProgress(updatedProgress);

      // Check if all characters completed
      const allCompleted = Array.from(updatedProgress.values()).every(p => p.completed);
      if (allCompleted) {
        setTimeout(() => completeSession(), 1500);
      }
    } else {
      updatedProgress.set(currentCharacter.id, charProgress);
      setProgress(updatedProgress);
    }
  };

  const handleNext = () => {
    if (currentIndex < characters.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setVerificationResult(null);
      setShowReference(false);
    }
  };

  const handleShowAnswer = () => {
    setShowReference(true);
  };

  const handleRetry = () => {
    setVerificationResult(null);
    setShowReference(false);
  };

  const completeSession = async () => {
    setSessionComplete(true);

    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    const totalAttempts = Array.from(progress.values()).reduce((sum, p) => sum + p.attempts, 0);
    const avgAttemptsPerChar = totalAttempts / characters.length;

    try {
      await invoke("record_writing_practice_session", {
        characterIds: characters.map(c => c.id),
        duration: sessionDuration,
        totalAttempts,
      });

      console.log("Practice session recorded successfully");
    } catch (error) {
      console.error("Failed to record practice session:", error);
    }
  };

  const handleReturnToDashboard = () => {
    window.location.reload(); // Simple approach - reload to return to dashboard
  };

  if (loading) {
    return (
      <div className="writing-practice-loading">
        <div className="loading-spinner"></div>
        <p>Loading practice session...</p>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="writing-practice-error">
        <h2>No Characters Available</h2>
        <p>No characters with stroke data found for practice.</p>
        <button onClick={handleReturnToDashboard}>Return to Dashboard</button>
      </div>
    );
  }

  if (sessionComplete) {
    const totalAttempts = Array.from(progress.values()).reduce((sum, p) => sum + p.attempts, 0);
    const perfectCount = Array.from(progress.values()).filter(p => p.attempts === 1).length;
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(sessionDuration / 60);
    const seconds = sessionDuration % 60;

    return (
      <div className="writing-practice-complete">
        <div className="completion-card">
          <h1>🎉 Practice Complete!</h1>
          <div className="completion-stats">
            <div className="stat">
              <span className="stat-value">{characters.length}</span>
              <span className="stat-label">Characters Practiced</span>
            </div>
            <div className="stat">
              <span className="stat-value">{perfectCount}</span>
              <span className="stat-label">Perfect First Try</span>
            </div>
            <div className="stat">
              <span className="stat-value">{totalAttempts}</span>
              <span className="stat-label">Total Attempts</span>
            </div>
            <div className="stat">
              <span className="stat-value">{minutes}:{seconds.toString().padStart(2, '0')}</span>
              <span className="stat-label">Time</span>
            </div>
          </div>
          <button className="btn-return" onClick={handleReturnToDashboard}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const completedCount = Array.from(progress.values()).filter(p => p.completed).length;

  return (
    <div className="writing-practice-mode">
      <div className="practice-header">
        <h2>Writing Practice</h2>
        <div className="progress-indicator">
          {completedCount} / {characters.length} completed
        </div>
      </div>

      <div className="practice-content">
        <div className="character-info">
          <div className="info-row">
            <span className="label">Pinyin:</span>
            <span className="value pinyin">{currentCharacter.mandarin_pinyin}</span>
          </div>
          <div className="info-row">
            <span className="label">Definition:</span>
            <span className="value">{currentCharacter.definition}</span>
          </div>
          <div className="info-row">
            <span className="label">Stroke Count:</span>
            <span className="value">{currentCharacter.stroke_count} strokes</span>
          </div>
          <div className="info-row">
            <span className="label">Attempts:</span>
            <span className="value">{currentProgress?.attempts || 0}</span>
          </div>
        </div>

        <div className="drawing-section">
          <WritingVerificationCanvas
            key={currentCharacter.id}
            characterId={currentCharacter.id}
            size={500}
            showGrid={true}
            showReference={showReference}
            tolerance={0.7}
            onVerificationComplete={handleVerificationComplete}
            className="practice-canvas"
          />
        </div>

        {verificationResult && (
          <div className={`practice-feedback ${verificationResult.isCorrect ? "correct" : "incorrect"}`}>
            {verificationResult.isCorrect ? (
              <>
                <div className="feedback-icon">✓</div>
                <div className="feedback-message">
                  <h3>Perfect!</h3>
                  <p>Your strokes are accurate.</p>
                </div>
                <button className="btn-next" onClick={handleNext}>
                  {currentIndex < characters.length - 1 ? "Next Character →" : "Finish Session"}
                </button>
              </>
            ) : (
              <>
                <div className="feedback-icon">✗</div>
                <div className="feedback-message">
                  <h3>Not Quite Right</h3>
                  <p>{verificationResult.feedback}</p>
                  <p className="score">Score: {(verificationResult.totalScore * 100).toFixed(0)}%</p>
                </div>
                <div className="feedback-actions">
                  {!showReference && (
                    <button className="btn-show-answer" onClick={handleShowAnswer}>
                      Show Answer
                    </button>
                  )}
                  <button className="btn-retry" onClick={handleRetry}>
                    Try Again
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showReference && (
        <div className="reference-hint">
          <p>💡 Reference strokes are now visible in gray. Study them and try again!</p>
        </div>
      )}
    </div>
  );
}
