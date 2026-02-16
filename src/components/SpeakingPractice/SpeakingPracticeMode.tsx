import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSpeech } from "../../hooks/useSpeech";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { hanziToPinyin, comparePinyin, isChineseText } from "../../utils/pinyinConverter";
import { convertToneNumbersToMarks } from "../../utils/answerVerification";
import { useSettings } from "../../contexts/SettingsContext";
import "./SpeakingPracticeMode.css";

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

export default function SpeakingPracticeMode() {
  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<PracticeCharacter[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<Map<number, CharacterProgress>>(new Map());
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [recognizedHanzi, setRecognizedHanzi] = useState("");
  const [recognizedPinyin, setRecognizedPinyin] = useState("");
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const [poorRecognition, setPoorRecognition] = useState(false);

  // Get settings for TTS
  const { selectedVoice, speechRate } = useSettings();

  // Text-to-speech hook (for playing example pronunciation)
  const { speak, speaking, supported: ttsSupported } = useSpeech({
    lang: 'zh-CN',
    rate: speechRate,
    voiceURI: selectedVoice,
  });

  // Speech recognition hook (for capturing user's speech)
  const {
    transcript,
    listening,
    supported: sttSupported,
    error: sttError,
    startListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: 'zh-CN',
    continuous: false,
    interimResults: false,
  });

  // Load practice characters on mount
  useEffect(() => {
    loadPracticeCharacters();
  }, []);

  // Handle transcript updates from speech recognition
  useEffect(() => {
    if (transcript && !showFeedback) {
      console.log("[SPEAKING] Received transcript:", transcript);
      handleTranscriptReceived(transcript);
    }
  }, [transcript]);

  // Auto-focus prompt when moving to new character
  useEffect(() => {
    if (!loading && currentCharacter && !showFeedback && !hasShownPrompt) {
      setHasShownPrompt(true);
    }
  }, [currentIndex, loading, showFeedback]);

  const loadPracticeCharacters = async () => {
    try {
      setLoading(true);

      // Request 20 characters for speaking practice
      // Reuse the same backend command as listening practice
      const result: PracticeCharacter[] = await invoke("get_listening_practice_characters", {
        count: 20,
      });

      console.log("Loaded speaking practice characters:", result);

      if (result.length === 0) {
        alert("No characters available for speaking practice. Please learn some characters first!");
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

  const handleTranscriptReceived = (hanzi: string) => {
    if (!currentCharacter) return;

    console.log("[SPEAKING] Processing transcript:", hanzi);
    console.log("[SPEAKING] Expected character:", currentCharacter.character);
    console.log("[SPEAKING] Expected pinyin:", currentCharacter.mandarin_pinyin);

    // Check if the recognized text is actually Chinese
    if (!isChineseText(hanzi)) {
      console.log("[SPEAKING] ⚠️ Poor recognition detected (non-Chinese text):", hanzi);
      setPoorRecognition(true);
      setRecognizedHanzi(hanzi);
      setRecognizedPinyin("");
      setIsCorrect(false);
      setShowFeedback(true);
      return;
    }

    // Reset poor recognition flag
    setPoorRecognition(false);

    // Convert recognized hanzi to pinyin
    const spokenPinyin = hanziToPinyin(hanzi);
    const targetPinyin = currentCharacter.mandarin_pinyin;

    console.log("[SPEAKING] Recognized hanzi:", hanzi);
    console.log("[SPEAKING] Recognized pinyin:", spokenPinyin);
    console.log("[SPEAKING] Target pinyin:", targetPinyin);

    // Compare pinyins (not characters!)
    const correct = comparePinyin(spokenPinyin, targetPinyin);

    console.log("[SPEAKING] Pronunciation correct:", correct);

    setRecognizedHanzi(hanzi);
    setRecognizedPinyin(spokenPinyin);
    setIsCorrect(correct);
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

  const handleStartRecording = () => {
    console.log("[SPEAKING] Starting speech recognition...");
    resetTranscript();
    setRecognizedHanzi("");
    setRecognizedPinyin("");
    startListening();
  };

  const handlePlayExample = () => {
    if (ttsSupported && currentCharacter) {
      speak(currentCharacter.character);
    }
  };

  const handleRetry = () => {
    setShowFeedback(false);
    setRecognizedHanzi("");
    setRecognizedPinyin("");
    setPoorRecognition(false);
    resetTranscript();
    setHasShownPrompt(false);
  };

  const handleNext = () => {
    if (currentIndex < characters.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowFeedback(false);
      setRecognizedHanzi("");
      setRecognizedPinyin("");
      setPoorRecognition(false);
      setHasShownPrompt(false);
      resetTranscript();
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

      console.log("Speaking practice session recorded successfully");
    } catch (error) {
      console.error("Failed to record speaking practice session:", error);
      // Non-critical error, continue anyway
    }
  };

  const handleReturnToDashboard = () => {
    window.location.reload(); // Simple approach - reload to return to dashboard
  };

  if (loading) {
    return (
      <div className="speaking-practice-loading">
        <div className="loading-spinner"></div>
        <p>Loading speaking practice session...</p>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="speaking-practice-error">
        <h2>No Characters Available</h2>
        <p>No characters found for speaking practice. Learn some characters first!</p>
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
      <div className="speaking-practice-complete">
        <div className="completion-card">
          <h1>🎉 Speaking Practice Complete!</h1>
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
    <div className="speaking-practice-mode">
      <div className="practice-header">
        <h2>🎤 Speaking Practice</h2>
        <div className="progress-indicator">
          {completedCount} / {characters.length} completed
        </div>
      </div>

      <div className="practice-content">
        {!sttSupported && (
          <div className="stt-warning">
            ⚠️ Speech recognition is not supported in your browser. Please use Chrome or Edge.
          </div>
        )}

        {sttError && (
          <div className="stt-error">
            ⚠️ {sttError}
          </div>
        )}

        <div className="character-display">
          <div className="character-large">
            {currentCharacter.character}
          </div>
          <div className="character-pinyin">
            {convertToneNumbersToMarks(currentCharacter.mandarin_pinyin)}
          </div>
          <div className="character-definition">
            {currentCharacter.definition}
          </div>
        </div>

        <div className="speaking-instruction">
          <p>🎤 Say this character out loud</p>
          {listening && <p className="listening-indicator">🔴 Listening...</p>}
        </div>

        <div className="controls-section">
          <button
            className="btn-record"
            onClick={handleStartRecording}
            disabled={listening || !sttSupported || showFeedback}
          >
            {listening ? "🔴 Listening..." : "🎤 Speak"}
          </button>

          <button
            className="btn-example"
            onClick={handlePlayExample}
            disabled={speaking || !ttsSupported || listening}
          >
            {speaking ? "🔊 Playing..." : "🔊 Hear Example"}
          </button>
        </div>

        {showFeedback && (
          <div className={`practice-feedback ${isCorrect ? "correct" : "incorrect"}`}>
            {isCorrect ? (
              <>
                <div className="feedback-icon">✓</div>
                <div className="feedback-message">
                  <h3>Excellent Pronunciation!</h3>
                  <p>You pronounced it correctly.</p>
                </div>
                <div className="pronunciation-info">
                  <div className="info-row">
                    <span className="label">You said:</span>
                    <span className="value">{recognizedHanzi}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Recognized as:</span>
                    <span className="value">{convertToneNumbersToMarks(recognizedPinyin)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Target pinyin:</span>
                    <span className="value">{convertToneNumbersToMarks(currentCharacter.mandarin_pinyin)}</span>
                  </div>
                </div>
                <button className="btn-next" onClick={handleNext}>
                  {currentIndex < characters.length - 1 ? "Next Character →" : "Finish Session"}
                </button>
              </>
            ) : (
              <>
                <div className="feedback-icon">✗</div>
                <div className="feedback-message">
                  {poorRecognition ? (
                    <>
                      <h3>⚠️ Speech Not Recognized</h3>
                      <p style={{ marginBottom: '10px' }}>The system couldn't detect Chinese speech clearly.</p>
                      <p style={{ fontSize: '14px', color: '#888' }}>
                        <strong>Tips:</strong>
                        <br />• Speak louder and more clearly
                        <br />• Move closer to your microphone
                        <br />• Check your microphone is working
                        <br />• Click "Hear Example" to hear correct pronunciation
                      </p>
                    </>
                  ) : (
                    <>
                      <h3>Not Quite Right</h3>
                      <p>The pronunciation doesn't match. Listen to the example and try again!</p>
                    </>
                  )}
                </div>
                <div className="pronunciation-info">
                  <div className="info-row">
                    <span className="label">You said:</span>
                    <span className="value">{recognizedHanzi || "(nothing detected)"}</span>
                  </div>
                  {!poorRecognition && (
                    <>
                      <div className="info-row">
                        <span className="label">Recognized as:</span>
                        <span className="value">{recognizedPinyin ? convertToneNumbersToMarks(recognizedPinyin) : "(no pinyin)"}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Target:</span>
                        <span className="value character-target">{currentCharacter.character}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Target pinyin:</span>
                        <span className="value">{convertToneNumbersToMarks(currentCharacter.mandarin_pinyin)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Attempts:</span>
                        <span className="value">{currentProgress?.attempts || 0}</span>
                      </div>
                    </>
                  )}
                  {poorRecognition && (
                    <>
                      <div className="info-row">
                        <span className="label">Target:</span>
                        <span className="value character-target">{currentCharacter.character}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Target pinyin:</span>
                        <span className="value">{convertToneNumbersToMarks(currentCharacter.mandarin_pinyin)}</span>
                      </div>
                    </>
                  )}
                </div>
                <button className="btn-retry" onClick={handleRetry}>
                  🔁 Try Again
                </button>
              </>
            )}
          </div>
        )}

        <div className="practice-tips">
          <h4>💡 Tips:</h4>
          <ul>
            <li>Speak clearly and at normal speed</li>
            <li>Make sure your microphone is working</li>
            <li>Click "Hear Example" to hear correct pronunciation</li>
            <li>The system checks your <strong>pronunciation (pinyin)</strong>, not the exact character</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
