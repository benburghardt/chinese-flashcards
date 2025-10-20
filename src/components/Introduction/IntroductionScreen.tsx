import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { convertToneNumbersToMarks } from '../../utils/answerVerification';
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
  onSkip?: () => void;
  totalCharacters?: number;
  currentIndex?: number;
  batchSize?: number;
  isLastInBatch?: boolean;
}

function IntroductionScreen({
  character,
  onComplete,
  onSkip,
  totalCharacters = 3000,
  currentIndex = 0,
  batchSize = 1,
  isLastInBatch = false
}: IntroductionScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset loading state when character changes
  useEffect(() => {
    setIsLoading(false);
    setError('');
  }, [character.id]);

  const handleNext = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Mark character as introduced in the database
      await invoke('introduce_character', {
        characterId: character.id
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
    setError('');

    try {
      // Mark as introduced immediately (skipping study)
      await invoke('introduce_character', {
        characterId: character.id
      });

      onSkip();

      // Reset loading state after completion
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to skip: ${err}`);
      setIsLoading(false);
    }
  };

  const buttonText = isLoading
    ? 'Loading...'
    : isLastInBatch
    ? 'Study New Characters'
    : 'Next';

  return (
    <div className="introduction-screen">
      <div className="introduction-container" style={{ overflowY: 'auto', maxHeight: '90vh' }}>
        {/* Header with progress indicator */}
        <div className="introduction-header">
          <div className="progress-indicator">
            Character {currentIndex + 1} of {batchSize} | Rank: <strong>{character.frequency_rank}</strong>
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
          <div className="card-content pinyin">{convertToneNumbersToMarks(character.mandarin_pinyin)}</div>
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

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '20px' }}>
          {onSkip && (
            <button
              className="skip-button"
              onClick={handleSkip}
              disabled={isLoading}
              style={{
                flex: '0 0 auto',
                padding: '12px 24px',
                background: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Skip & Study Later
            </button>
          )}
          <button
            className="start-learning-button"
            onClick={handleNext}
            disabled={isLoading}
            style={{ flex: '1' }}
          >
            {buttonText}
          </button>
        </div>

        {/* Helper text */}
        <div className="helper-text">
          {isLastInBatch
            ? 'Ready to practice all new characters!'
            : 'Take your time to study this character before moving on.'}
        </div>
      </div>
    </div>
  );
}

export default IntroductionScreen;
