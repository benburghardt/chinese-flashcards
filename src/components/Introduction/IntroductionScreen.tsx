import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertToneNumbersToMarks } from "../../utils/answerVerification";
import StrokeOrderDisplay from "../StrokeOrder/StrokeOrderDisplay";
import { useSpeech } from "../../hooks/useSpeech";
import "./IntroductionScreen.css";

interface Character {
  id: number;
  character: string;
  simplified: string;
  traditional: string | null;
  mandarin_pinyin: string;
  definition: string;
  frequency_rank: number;
  is_word: boolean;
}

interface IntroductionScreenProps {
  character: Character;
  onComplete: () => void;
  onSkip?: () => void;
  onExit?: () => void;
  totalCharacters?: number;
  currentIndex?: number;
  batchSize?: number;
  isLastInBatch?: boolean;
}

function IntroductionScreen({
  character,
  onComplete,
  onSkip,
  onExit,
  totalCharacters: _totalCharacters = 3000,
  currentIndex = 0,
  batchSize = 1,
  isLastInBatch = false,
}: IntroductionScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Text-to-speech hook - available during learning
  const { speak, speaking, supported: ttsSupported, error: ttsError } = useSpeech({
    lang: 'zh-CN',
    rate: 1.0,
  });

  // Reset loading state when character changes
  useEffect(() => {
    setIsLoading(false);
    setError("");
  }, [character.id]);

  const handlePronunciation = () => {
    if (ttsSupported) {
      speak(character.character);
    }
  };

  const handleNext = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Mark character as introduced in the database
      await invoke("introduce_character", {
        characterId: character.id,
      });

      // Call completion callback
      onComplete();

      // Reset loading state after completion
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to proceed: ${err}`);
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!onSkip) return;

    setIsLoading(true);
    setError("");

    try {
      // Mark as introduced immediately (skipping study)
      await invoke("introduce_character", {
        characterId: character.id,
      });

      onSkip();

      // Reset loading state after completion
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to skip: ${err}`);
      setIsLoading(false);
    }
  };

  const buttonText = isLoading ? "Loading..." : isLastInBatch ? "Study New Characters" : "Next";

  return (
    <div className="introduction-screen">
      <div
        className="introduction-container"
        style={{ overflowY: "auto", maxHeight: "90vh", position: "relative", paddingTop: "60px" }}
      >
        {/* Exit button in top right corner - positioned above header */}
        {onExit && (
          <button
            onClick={onExit}
            disabled={isLoading}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              padding: "8px 16px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
              zIndex: 10,
            }}
          >
            Exit
          </button>
        )}

        {/* Header with progress indicator */}
        <div className="introduction-header">
          <div className="progress-indicator">
            Character {currentIndex + 1} of {batchSize} | Rank:{" "}
            <strong>{character.frequency_rank}</strong>
          </div>
          <div className="learning-stage">New Character</div>
        </div>

        {/* Main character display */}
        <div className="character-display">
          <div className="character-large">{character.character}</div>
          {character.traditional && character.traditional !== character.simplified && (
            <div className="character-traditional">Traditional: {character.traditional}</div>
          )}
        </div>

        {/* Pinyin section */}
        <div className="info-card pinyin-card">
          <div className="card-label">Pronunciation</div>
          <div className="card-content pinyin" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{convertToneNumbersToMarks(character.mandarin_pinyin)}</span>
            {ttsSupported && (
              <button
                onClick={handlePronunciation}
                disabled={speaking}
                title="Play pronunciation"
                style={{
                  padding: '8px 12px',
                  background: speaking ? '#9333ea' : '#a855f7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: speaking ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  opacity: speaking ? 0.7 : 1,
                }}
              >
                {speaking ? '🔊' : '🔈'}
              </button>
            )}
          </div>
          {ttsError && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: '#fef2f2',
              color: '#991b1b',
              borderRadius: '4px',
              fontSize: '13px',
            }}>
              {ttsError}
            </div>
          )}
        </div>

        {/* Definition section */}
        <div className="info-card definition-card">
          <div className="card-label">Meaning</div>
          <div className="card-content definition">{character.definition}</div>
        </div>

        {/* Stroke Order section - only show for single characters */}
        {!character.is_word && (
          <div className="stroke-order-section">
            <StrokeOrderDisplay characterId={character.id} autoPlay={true} showControls={true} />
          </div>
        )}

        {/* Error display */}
        {error && <div className="error-message">{error}</div>}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "20px" }}>
          {onSkip && (
            <button
              onClick={handleSkip}
              disabled={isLoading}
              style={{
                flex: "1",
                padding: "16px 24px",
                background: "#999",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                margin: 0,
                height: "52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Skip & Study Later
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isLoading}
            style={{
              flex: "1",
              padding: "16px 24px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
              margin: 0,
              height: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            }}
          >
            {buttonText}
          </button>
        </div>

        {/* Helper text */}
        <div className="helper-text">
          {isLastInBatch
            ? "Ready to practice all new characters!"
            : "Take your time to study this character before moving on."}
        </div>
      </div>
    </div>
  );
}

export default IntroductionScreen;
