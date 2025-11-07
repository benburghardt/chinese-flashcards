import { useState, useEffect } from 'react';
import { openLanguageSettings, getOSPlatform, type OSPlatform } from '../../utils/systemSettings';

interface VoiceSetupPromptProps {
  onDismiss: () => void;
}

interface PlatformInstructions {
  title: string;
  steps: string[];
  buttonText: string;
  canOpenSettings: boolean;
}

/**
 * Component to guide users through installing Chinese TTS voices
 * Shows on first launch if no Chinese voices are detected
 * Platform-aware with OS-specific instructions
 */
export function VoiceSetupPrompt({ onDismiss }: VoiceSetupPromptProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [platform, setPlatform] = useState<OSPlatform>('unknown');

  useEffect(() => {
    setPlatform(getOSPlatform());
  }, []);

  const getPlatformInstructions = (): PlatformInstructions => {
    switch (platform) {
      case 'windows':
        return {
          title: 'Windows Setup',
          steps: [
            'Press Win + I to open Settings',
            'Go to Time & Language → Language & Region',
            'Click "Add a language"',
            'Search for and select "Chinese (Simplified, China)"',
            'Check "Text-to-speech" and click Install',
            'Wait for download (~150 MB), then restart this app'
          ],
          buttonText: 'Open Settings',
          canOpenSettings: true,
        };
      case 'macos':
        return {
          title: 'macOS Setup',
          steps: [
            'Open System Preferences (or System Settings)',
            'Go to Accessibility → Spoken Content',
            'Click "System Voice" dropdown',
            'Select "Customize..."',
            'Find and download Chinese voices (Ting-Ting, Sin-Ji, or Mei-Jia)',
            'Restart this application'
          ],
          buttonText: 'Open Settings',
          canOpenSettings: true,
        };
      case 'linux':
        return {
          title: 'Linux Setup',
          steps: [
            'Open Terminal',
            'Install Chinese voices using your package manager:',
            '  • Ubuntu/Debian: sudo apt install espeak-ng-data-cmn',
            '  • Fedora: sudo dnf install espeak-ng-chinese',
            '  • Arch: sudo pacman -S espeak-ng',
            'Restart this application'
          ],
          buttonText: 'Show Terminal Commands',
          canOpenSettings: false,
        };
      default:
        return {
          title: 'Setup Required',
          steps: [
            'Open your system Settings',
            'Navigate to Language or Accessibility settings',
            'Install Chinese (Simplified) language pack',
            'Enable Text-to-Speech for Chinese',
            'Restart this application'
          ],
          buttonText: 'Show Instructions',
          canOpenSettings: false,
        };
    }
  };

  const instructions = getPlatformInstructions();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ marginTop: 0, color: '#333' }}>
          🔊 Enable Chinese Pronunciation
        </h2>

        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
          To hear Mandarin pronunciation, you need to install Chinese text-to-speech voices on your computer.
        </p>

        <div style={{
          background: '#f0f9ff',
          border: '2px solid #0ea5e9',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <strong style={{ color: '#0369a1' }}>{instructions.title}:</strong>
          <ol style={{ margin: '12px 0 0 0', paddingLeft: '20px', color: '#0c4a6e' }}>
            {instructions.steps.map((step, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {step.includes('Win + I') ? (
                  <>
                    Press <kbd style={{
                      background: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #bae6fd',
                      fontFamily: 'monospace',
                    }}>Win + I</kbd> to open Settings
                  </>
                ) : (
                  step
                )}
              </li>
            ))}
          </ol>
        </div>

        {showDetails && (
          <div style={{
            background: '#fefce8',
            border: '1px solid #fde047',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            fontSize: '14px',
          }}>
            <strong>💡 Why is this needed?</strong>
            <p style={{ marginTop: '8px', marginBottom: 0 }}>
              Windows doesn't include Chinese voices by default. The app uses your system's
              text-to-speech to pronounce Chinese characters, so you need to install the
              Chinese language pack first.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              flex: '1 1 auto',
              minWidth: '150px',
              padding: '12px 24px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            {showDetails ? 'Hide Details' : 'Why is this needed?'}
          </button>
          {instructions.canOpenSettings && (
            <button
              onClick={async () => {
                await openLanguageSettings();
                onDismiss();
              }}
              style={{
                flex: '1 1 auto',
                minWidth: '150px',
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              }}
            >
              {instructions.buttonText}
            </button>
          )}
          <button
            onClick={onDismiss}
            style={{
              flex: '1 1 auto',
              minWidth: '150px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}
          >
            {instructions.canOpenSettings ? 'Skip for Now' : 'Got it!'}
          </button>
        </div>

        <p style={{
          marginTop: '16px',
          marginBottom: 0,
          fontSize: '13px',
          color: '#9ca3af',
          textAlign: 'center',
        }}>
          The app will work without voices, but you won't hear pronunciation
        </p>
      </div>
    </div>
  );
}

export default VoiceSetupPrompt;
