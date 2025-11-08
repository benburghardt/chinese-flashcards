import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSpeech } from "../../hooks/useSpeech";
import { convertToneNumbersToMarks, verifyAnswer, hasCorrectSyllablesButWrongTones } from "../../utils/answerVerification";
import "./ListeningPracticeMode.css";

interface PracticeCharacter {
  id: number;
  character: string;
  simplified: string | null;
  traditional: string | null;
  mandarin_pinyin: string;
  definition: string;
  is_word: boolean;
}

interface CharacterProgress {
  characterId: number;
  attempts: number;
  completed: boolean;
}

export default function ListeningPracticeMode() {
  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<PracticeCharacter[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<Map<number, CharacterProgress>>(new Map());
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongTonesOnly, setWrongTonesOnly] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);

  // Ref for input field auto-focus
  const inputRef = useRef<HTMLInputElement>(null);

  // Text-to-speech hook
  const { speak, speaking, supported: ttsSupported, error: ttsError } = useSpeech({
    lang: 'zh-CN',
    rate: 0.9, // Slightly slower for listening practice
  });

  // Load practice characters on mount
  useEffect(() => {
    loadPracticeCharacters();
  }, []);

  // Auto-play audio when moving to a new character
  useEffect(() => {
    if (!loading && currentCharacter && !showFeedback && !hasPlayedAudio) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        handlePlayAudio();
        setHasPlayedAudio(true);
        // Auto-focus the input field
        inputRef.current?.focus();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, loading, showFeedback]);

  // Global keyboard handler for Enter key when feedback is showing
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && showFeedback) {
        if (isCorrect) {
          handleNext();
        } else {
          handleRetry();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyPress);
    return () => window.removeEventListener("keydown", handleGlobalKeyPress);
  }, [showFeedback, isCorrect, currentIndex, characters.length]);

  const loadPracticeCharacters = async () => {
    try {
      setLoading(true);

      // Request 20 characters for listening practice
      // We'll use a simple query to get characters the user has learned
      const result: PracticeCharacter[] = await invoke("get_listening_practice_characters", {
        count: 20,
      });

      console.log("Loaded listening practice characters:", result);

      if (result.length === 0) {
        alert("No characters available for listening practice. Please learn some characters first!");
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

  const handlePlayAudio = () => {
    if (ttsSupported && currentCharacter) {
      speak(currentCharacter.character);
    }
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert tone numbers to marks in real-time (same as review mode)
    const withMarks = convertToneNumbersToMarks(value);
    setUserAnswer(withMarks);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showFeedback) {
        if (isCorrect) {
          handleNext();
        } else {
          handleRetry();
        }
      } else if (userAnswer.trim()) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || !currentCharacter) return;

    // Use the same pinyin verification as the review mode
    const correct = verifyAnswer(userAnswer, currentCharacter.mandarin_pinyin, "pinyin");

    // Check if only tones are wrong
    const onlyTonesWrong = !correct && hasCorrectSyllablesButWrongTones(userAnswer, currentCharacter.mandarin_pinyin);

    console.log("[LISTENING] User answer:", userAnswer);
    console.log("[LISTENING] Correct pinyin:", currentCharacter.mandarin_pinyin);
    console.log("[LISTENING] Verification result:", correct);
    console.log("[LISTENING] Wrong tones only:", onlyTonesWrong);

    setIsCorrect(correct);
    setWrongTonesOnly(onlyTonesWrong);
    setShowFeedback(true);

    // Update progress
    if (currentProgress) {
      const updatedProgress = new Map(progress);
      const charProgress = updatedProgress.get(currentCharacter.id)!;
      charProgress.attempts += 1;

      if (correct) {
        charProgress.completed = true;
      }

      updatedProgress.set(currentCharacter.id, charProgress);
      setProgress(updatedProgress);

      // Check if all characters completed
      if (correct) {
        const allCompleted = Array.from(updatedProgress.values()).every(p => p.completed);
        if (allCompleted) {
          setTimeout(() => completeSession(), 1500);
        }
      }
    }
  };

  const handleRetry = () => {
    setShowFeedback(false);
    setUserAnswer("");
    setWrongTonesOnly(false);
    setHasPlayedAudio(false); // Allow audio to play again
    // Focus the input field after a short delay to let the UI update
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleNext = () => {
    if (currentIndex < characters.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowFeedback(false);
      setUserAnswer("");
      setHasPlayedAudio(false); // Reset for next character
    }
  };

  const completeSession = async () => {
    setSessionComplete(true);

    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    const totalAttempts = Array.from(progress.values()).reduce((sum, p) => sum + p.attempts, 0);

    try {
      await invoke("record_listening_practice_session", {
        characterIds: characters.map(c => c.id),
        duration: sessionDuration,
        totalAttempts,
      });

      console.log("Listening practice session recorded successfully");
    } catch (error) {
      console.error("Failed to record listening practice session:", error);
      // Non-critical error, continue anyway
    }
  };

  const handleReturnToDashboard = () => {
    window.location.reload(); // Simple approach - reload to return to dashboard
  };

  if (loading) {
    return (
      <div className="listening-practice-loading">
        <div className="loading-spinner"></div>
        <p>Loading listening practice session...</p>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="listening-practice-error">
        <h2>No Characters Available</h2>
        <p>No characters found for listening practice. Learn some characters first!</p>
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
      <div className="listening-practice-complete">
        <div className="completion-card">
          <h1>🎉 Listening Practice Complete!</h1>
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
    <div className="listening-practice-mode">
      <div className="practice-header">
        <h2>🎧 Listening Practice</h2>
        <div className="progress-indicator">
          {completedCount} / {characters.length} completed
        </div>
      </div>

      <div className="practice-content">
        {!ttsSupported && (
          <div className="tts-warning">
            ⚠️ Text-to-speech is not supported in your browser. Please use a modern browser like Chrome or Edge.
          </div>
        )}

        {ttsError && (
          <div className="tts-error">
            ⚠️ {ttsError}
          </div>
        )}

        <div className="audio-section">
          <div className="audio-icon">
            {speaking ? "🔊" : "🔈"}
          </div>
          {showFeedback && isCorrect && (
            <div className="revealed-character">
              {currentCharacter.character}
            </div>
          )}
          <button
            className="btn-play-audio"
            onClick={handlePlayAudio}
            disabled={speaking || !ttsSupported}
          >
            {speaking ? "Playing..." : "🔁 Play Again"}
          </button>
          <p className="listening-instruction">
            Listen to the audio and type the pinyin
          </p>
        </div>

        <div className="answer-section">
          <input
            ref={inputRef}
            type="text"
            className="answer-input"
            value={userAnswer}
            onChange={handleAnswerChange}
            onKeyPress={handleKeyPress}
            placeholder="Type the pinyin (e.g., ni3 or nǐ)..."
            autoFocus
            disabled={showFeedback}
          />
          {!showFeedback && (
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
            >
              Submit
            </button>
          )}
        </div>

        {showFeedback && (
          <div className={`practice-feedback ${isCorrect ? "correct" : wrongTonesOnly ? "wrong-tones" : "incorrect"}`}>
            {isCorrect ? (
              <>
                <div className="feedback-icon">✓</div>
                <div className="feedback-message">
                  <h3>Correct!</h3>
                  <p>You identified the pinyin correctly.</p>
                </div>
                <div className="character-info">
                  <div className="info-row">
                    <span className="label">Character:</span>
                    <span className="value character-large">{currentCharacter.character}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Pinyin:</span>
                    <span className="value pinyin">
                      {convertToneNumbersToMarks(currentCharacter.mandarin_pinyin)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Meaning:</span>
                    <span className="value">{currentCharacter.definition}</span>
                  </div>
                </div>
                <button className="btn-next" onClick={handleNext}>
                  {currentIndex < characters.length - 1 ? "Next Character → (or press Enter)" : "Finish Session (or press Enter)"}
                </button>
              </>
            ) : (
              <>
                <div className="feedback-icon">✗</div>
                <div className="feedback-message">
                  <h3>{wrongTonesOnly ? "Wrong Tones" : "Not Quite Right"}</h3>
                  <p>{wrongTonesOnly ? "You got the syllables right, but the tones are wrong. Listen carefully and try again!" : "Listen again and try once more!"}</p>
                </div>
                {!wrongTonesOnly && (
                  <>
                    <div className="answer-comparison">
                      <div className="answer-item">
                        <span className="answer-label">Your answer:</span>
                        <span className="answer-value">{userAnswer}</span>
                      </div>
                      <div className="answer-item">
                        <span className="answer-label">Correct pinyin:</span>
                        <span className="answer-value">{convertToneNumbersToMarks(currentCharacter.mandarin_pinyin)}</span>
                      </div>
                    </div>
                    <div className="character-info">
                      <div className="info-row">
                        <span className="label">Character:</span>
                        <span className="value character-large">{currentCharacter.character}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Pinyin:</span>
                        <span className="value pinyin">
                          {convertToneNumbersToMarks(currentCharacter.mandarin_pinyin)}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Meaning:</span>
                        <span className="value">{currentCharacter.definition}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Attempts:</span>
                        <span className="value">{currentProgress?.attempts || 0}</span>
                      </div>
                    </div>
                  </>
                )}
                <button className="btn-retry" onClick={handleRetry}>
                  🔁 Try Again (or press Enter)
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
