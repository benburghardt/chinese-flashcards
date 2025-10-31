import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import WritingVerificationCanvas from "./WritingVerificationCanvas";
import StrokeOrderDisplay from "../StrokeOrder/StrokeOrderDisplay";
import { VerificationResult } from "../../utils/strokeVerification";
import "./WritingPracticeVerificationDemo.css";

interface SampleCharacter {
  id: number;
  character: string;
  pinyin: string;
  definition: string;
}

export default function WritingPracticeVerificationDemo() {
  const [sampleCharacters, setSampleCharacters] = useState<SampleCharacter[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<SampleCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReference, setShowReference] = useState(false);
  const [tolerance, setTolerance] = useState(0.7);
  const [lastResult, setLastResult] = useState<VerificationResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [successCount, setSuccessCount] = useState(0);

  // Load sample characters from database
  useEffect(() => {
    const loadSampleCharacters = async () => {
      try {
        setLoading(true);

        // Query for simple single characters with stroke data
        // Looking for characters like 一, 二, 三, 十, 人, etc.
        const targetCharacters = ["一", "二", "三", "十", "人"];
        const loadedCharacters: SampleCharacter[] = [];

        for (const char of targetCharacters) {
          try {
            const result: any = await invoke("search_characters", {
              query: char,
              limit: 1,
            });

            if (result.length > 0) {
              const dbChar = result[0];
              // Check if character has stroke data
              const strokeData: any = await invoke("get_character_stroke_data", {
                characterId: dbChar.id,
              });

              if (strokeData.stroke_data_path) {
                loadedCharacters.push({
                  id: dbChar.id,
                  character: dbChar.character,
                  pinyin: dbChar.mandarin_pinyin,
                  definition: dbChar.definition,
                });
              }
            }
          } catch (err) {
            console.warn(`Failed to load character ${char}:`, err);
          }
        }

        console.log("Loaded sample characters:", loadedCharacters);
        setSampleCharacters(loadedCharacters);
        if (loadedCharacters.length > 0) {
          setSelectedCharacter(loadedCharacters[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to load sample characters:", error);
        setLoading(false);
      }
    };

    loadSampleCharacters();
  }, []);

  const handleVerificationComplete = (result: VerificationResult) => {
    setLastResult(result);
    setAttempts((prev) => prev + 1);

    if (result.isCorrect) {
      setSuccessCount((prev) => prev + 1);
    }
  };

  const handleCharacterChange = (charId: number) => {
    const char = sampleCharacters.find((c) => c.id === charId);
    if (char) {
      setSelectedCharacter(char);
      setLastResult(null);
    }
  };

  if (loading) {
    return (
      <div className="writing-practice-verification-demo">
        <div className="demo-header">
          <h2>Writing Practice with Stroke Verification</h2>
          <p className="demo-description">Loading sample characters...</p>
        </div>
      </div>
    );
  }

  if (sampleCharacters.length === 0 || !selectedCharacter) {
    return (
      <div className="writing-practice-verification-demo">
        <div className="demo-header">
          <h2>Writing Practice with Stroke Verification</h2>
          <p className="demo-description">
            No sample characters with stroke data available. Please ensure the stroke data is loaded
            in the database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="writing-practice-verification-demo">
      <div className="demo-header">
        <h2>Writing Practice with Stroke Verification</h2>
        <p className="demo-description">
          Practice writing Chinese characters and get real-time feedback on your strokes.
        </p>
      </div>

      <div className="demo-content">
        {/* Left side: Practice canvas */}
        <div className="practice-section">
          <div className="character-display">
            <div className="character-large">{selectedCharacter.character}</div>
            <div className="character-info">
              <span className="pinyin">{selectedCharacter.pinyin}</span>
              <span className="definition">{selectedCharacter.definition}</span>
            </div>
          </div>

          <WritingVerificationCanvas
            key={selectedCharacter.id} // Force re-render when character changes
            characterId={selectedCharacter.id}
            size={400}
            showGrid={true}
            showReference={showReference}
            tolerance={tolerance}
            onVerificationComplete={handleVerificationComplete}
          />

          <div className="practice-stats">
            <div className="stat-item">
              <span className="stat-label">Attempts:</span>
              <span className="stat-value">{attempts}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Success:</span>
              <span className="stat-value success">{successCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Accuracy:</span>
              <span className="stat-value">
                {attempts > 0 ? `${((successCount / attempts) * 100).toFixed(0)}%` : "0%"}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Reference and controls */}
        <div className="reference-section">
          <div className="character-selector">
            <h3>Select Character</h3>
            <div className="character-buttons">
              {sampleCharacters.map((char) => (
                <button
                  key={char.id}
                  className={`char-button ${selectedCharacter.id === char.id ? "selected" : ""}`}
                  onClick={() => handleCharacterChange(char.id)}
                >
                  <span className="char">{char.character}</span>
                  <span className="char-info">{char.pinyin}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="stroke-order-reference">
            <h3>Stroke Order Reference</h3>
            <StrokeOrderDisplay
              characterId={selectedCharacter.id}
              autoPlay={true}
              showControls={true}
            />
          </div>

          <div className="settings-panel">
            <h3>Settings</h3>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showReference}
                  onChange={(e) => setShowReference(e.target.checked)}
                />
                <span>Show reference strokes (ghost overlay)</span>
              </label>
            </div>

            <div className="setting-item">
              <label>
                <span className="setting-label">Tolerance: {(tolerance * 100).toFixed(0)}%</span>
                <input
                  type="range"
                  min="50"
                  max="90"
                  step="5"
                  value={tolerance * 100}
                  onChange={(e) => setTolerance(Number(e.target.value) / 100)}
                  className="tolerance-slider"
                />
                <div className="slider-labels">
                  <span>Strict</span>
                  <span>Lenient</span>
                </div>
              </label>
            </div>
          </div>

          {lastResult && (
            <div className="result-details">
              <h3>Last Result</h3>
              <div className="stroke-results">
                {lastResult.strokeResults.map((strokeResult, index) => (
                  <div
                    key={index}
                    className={`stroke-result-item ${strokeResult.isCorrect ? "correct" : "incorrect"}`}
                  >
                    <span className="stroke-number">Stroke {index + 1}:</span>
                    <span className="stroke-status">
                      {strokeResult.isCorrect ? "✓" : "✗"}
                    </span>
                    <span className="stroke-score">
                      {(strokeResult.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="instructions">
            <h3>How It Works</h3>
            <ul>
              <li>Watch the stroke order animation on the right</li>
              <li>Draw each stroke in the correct order on the canvas</li>
              <li>Click "Check" to verify your writing</li>
              <li>Green = correct stroke, Red = needs improvement</li>
              <li>Adjust tolerance slider to change strictness</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
