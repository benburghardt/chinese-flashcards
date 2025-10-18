import { StudyMode } from '../../types';

interface StudyModeSelectorProps {
  selectedMode: StudyMode;
  onModeSelect: (mode: StudyMode) => void;
  availableModes?: StudyMode[];
  readyCardsCount?: number;
}

export const StudyModeSelector: React.FC<StudyModeSelectorProps> = ({
  selectedMode,
  onModeSelect,
  availableModes = ['self-test', 'spaced-repetition', 'flash', 'multiple-choice', 'custom-path'],
  readyCardsCount = 0,
}) => {
  const modeDescriptions: Record<StudyMode, string> = {
    'self-test': 'Show one side, recall the connected side',
    'spaced-repetition': 'Algorithm-based review timing for optimal retention',
    'flash': 'Free navigation through flashcard networks',
    'multiple-choice': 'Choose the correct answer from multiple options',
    'custom-path': 'Follow predefined learning paths',
  };

  return (
    <div className="study-mode-selector">
      <h3>Select Study Mode</h3>
      {availableModes.map((mode) => (
        <div
          key={mode}
          className={`study-mode-option ${selectedMode === mode ? 'selected' : ''}`}
          onClick={() => onModeSelect(mode)}
        >
          <div className="study-mode-header">
            <h4>{mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
            {mode === 'spaced-repetition' && readyCardsCount > 0 && (
              <span className="ready-badge">{readyCardsCount}</span>
            )}
          </div>
          <p>{modeDescriptions[mode]}</p>
        </div>
      ))}
    </div>
  );
};