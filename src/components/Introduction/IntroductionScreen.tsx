import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './IntroductionScreen.css';

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
  totalCharacters?: number;
}

function IntroductionScreen({ character, onComplete, totalCharacters = 3000 }: IntroductionScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleStartLearning = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Mark character as introduced in the database
      await invoke('introduce_character', {
        characterId: character.id
      });

      // Call completion callback
      onComplete();
    } catch (err) {
      setError(`Failed to start learning: ${err}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="introduction-screen">
      <div className="introduction-container">
        {/* Header with progress indicator */}
        <div className="introduction-header">
          <div className="progress-indicator">
            Character <strong>{character.frequency_rank}</strong> of {totalCharacters}+
          </div>
          <div className="learning-stage">New Character</div>
        </div>

        {/* Main character display */}
        <div className="character-display">
          <div className="character-large">{character.character}</div>
          {character.traditional && character.traditional !== character.simplified && (
            <div className="character-traditional">
              Traditional: {character.traditional}
            </div>
          )}
        </div>

        {/* Pinyin section */}
        <div className="info-card pinyin-card">
          <div className="card-label">Pronunciation</div>
          <div className="card-content pinyin">{character.mandarin_pinyin}</div>
        </div>

        {/* Definition section */}
        <div className="info-card definition-card">
          <div className="card-label">Meaning</div>
          <div className="card-content definition">{character.definition}</div>
        </div>

        {/* Error display */}
        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Action button */}
        <button
          className="start-learning-button"
          onClick={handleStartLearning}
          disabled={isLoading}
        >
          {isLoading ? 'Starting...' : 'Start Learning'}
        </button>

        {/* Helper text */}
        <div className="helper-text">
          This character will be added to your review queue with a 1-hour review interval.
        </div>
      </div>
    </div>
  );
}

export default IntroductionScreen;
