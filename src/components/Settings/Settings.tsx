import { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const {
    // TTS Settings
    selectedVoice,
    setSelectedVoice,
    speechRate,
    setSpeechRate,
    autoPlayTTS,
    setAutoPlayTTS,
    // Unlock Settings
    initialUnlockCount,
    setInitialUnlockCount,
    regularUnlockCount,
    setRegularUnlockCount,
    daysBetweenUnlocks,
    setDaysBetweenUnlocks,
    daysAfterQueueEmptied,
    setDaysAfterQueueEmptied,
    // Practice Settings
    practiceSessionSize,
    setPracticeSessionSize,
    miniSrsFrequency,
    setMiniSrsFrequency,
  } = useSettings();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testSpeaking, setTestSpeaking] = useState(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      // Filter to only show Chinese voices
      const chineseVoices = availableVoices.filter(voice =>
        voice.lang.startsWith('zh')
      );
      setVoices(chineseVoices);
      console.log('[Settings] Loaded Chinese voices:', chineseVoices.length);
    };

    // Load voices immediately
    loadVoices();

    // Also listen for voiceschanged event (voices load asynchronously)
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceURI = event.target.value;
    setSelectedVoice(voiceURI === '' ? null : voiceURI);
  };

  const handleRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(event.target.value);
    setSpeechRate(rate);
  };

  const handleTestVoice = () => {
    if (testSpeaking) return;

    setTestSpeaking(true);
    const utterance = new SpeechSynthesisUtterance('你好，这是语音测试。');
    utterance.lang = 'zh-CN';
    utterance.rate = speechRate;

    // Use selected voice if available
    if (selectedVoice) {
      const voice = voices.find(v => v.voiceURI === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onend = () => setTestSpeaking(false);
    utterance.onerror = () => setTestSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <div className="settings-content">
        {/* Voice Selection */}
        <section className="settings-section">
          <h2>🔊 Text-to-Speech</h2>

          <div className="setting-item">
            <label htmlFor="voice-select">
              <strong>Voice</strong>
              <span className="setting-description">Select a Chinese voice for pronunciation</span>
            </label>
            <select
              id="voice-select"
              value={selectedVoice || ''}
              onChange={handleVoiceChange}
              className="voice-select"
            >
              <option value="">Default (System)</option>
              {voices.map(voice => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                  {voice.localService ? ' - Local' : ' - Online'}
                </option>
              ))}
            </select>
          </div>

          {voices.length === 0 && (
            <div className="settings-warning">
              <p>⚠️ No Chinese voices detected.</p>
              <p>Please install the Chinese language pack in your system settings:</p>
              <ul>
                <li><strong>Windows:</strong> Settings → Time & Language → Language → Add Chinese</li>
                <li><strong>macOS:</strong> System Preferences → Accessibility → Spoken Content → System Voice</li>
              </ul>
            </div>
          )}

          <div className="setting-item">
            <label htmlFor="speech-rate">
              <strong>Speech Rate</strong>
              <span className="setting-description">
                Adjust playback speed: {speechRate.toFixed(2)}x
              </span>
            </label>
            <div className="rate-control">
              <span className="rate-label">Slow (0.5x)</span>
              <input
                id="speech-rate"
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={speechRate}
                onChange={handleRateChange}
                className="rate-slider"
              />
              <span className="rate-label">Fast (1.5x)</span>
            </div>
          </div>

          <div className="setting-item">
            <button
              onClick={handleTestVoice}
              disabled={testSpeaking || voices.length === 0}
              className="btn-test-voice"
            >
              {testSpeaking ? '🔊 Playing...' : '🎵 Test Voice'}
            </button>
          </div>

          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoPlayTTS}
                onChange={(e) => setAutoPlayTTS(e.target.checked)}
              />
              <span>
                <strong>Auto-play pronunciation</strong>
                <span className="setting-description">
                  Automatically play pronunciation when new characters appear
                </span>
              </span>
            </label>
          </div>
        </section>

        {/* Character Unlocking Settings */}
        <section className="settings-section">
          <h2>🔓 Character Unlocking</h2>
          <p className="section-description">
            Control how many characters unlock and how often
          </p>

          <div className="setting-item">
            <label htmlFor="initial-unlock">
              <strong>Initial Unlock Count</strong>
              <span className="setting-description">
                Number of characters unlocked for new users (10-500)
              </span>
            </label>
            <input
              id="initial-unlock"
              type="number"
              min="10"
              max="500"
              value={initialUnlockCount}
              onChange={(e) => setInitialUnlockCount(Number(e.target.value))}
              className="number-input"
            />
          </div>

          <div className="setting-item">
            <label htmlFor="regular-unlock">
              <strong>Regular Unlock Count</strong>
              <span className="setting-description">
                Number of characters unlocked each cycle (10-500)
              </span>
            </label>
            <input
              id="regular-unlock"
              type="number"
              min="10"
              max="500"
              value={regularUnlockCount}
              onChange={(e) => setRegularUnlockCount(Number(e.target.value))}
              className="number-input"
            />
          </div>

          <div className="setting-item">
            <label htmlFor="days-between">
              <strong>Days Between Unlocks</strong>
              <span className="setting-description">
                Minimum days to wait between unlock cycles (1-90)
              </span>
            </label>
            <input
              id="days-between"
              type="number"
              min="1"
              max="90"
              value={daysBetweenUnlocks}
              onChange={(e) => setDaysBetweenUnlocks(Number(e.target.value))}
              className="number-input"
            />
          </div>

          <div className="setting-item">
            <label htmlFor="days-after-empty">
              <strong>Days After Queue Emptied</strong>
              <span className="setting-description">
                Days to wait after finishing all ready-to-learn characters (0-30)
              </span>
            </label>
            <input
              id="days-after-empty"
              type="number"
              min="0"
              max="30"
              value={daysAfterQueueEmptied}
              onChange={(e) => setDaysAfterQueueEmptied(Number(e.target.value))}
              className="number-input"
            />
          </div>
        </section>

        {/* Practice Settings */}
        <section className="settings-section">
          <h2>📝 Practice Sessions</h2>
          <p className="section-description">
            Customize practice session sizes and learning pace
          </p>

          <div className="setting-item">
            <label htmlFor="practice-size">
              <strong>Characters Per Practice Session</strong>
              <span className="setting-description">
                Number of characters in listening/speaking/writing practice (5-50)
              </span>
            </label>
            <input
              id="practice-size"
              type="number"
              min="5"
              max="50"
              value={practiceSessionSize}
              onChange={(e) => setPracticeSessionSize(Number(e.target.value))}
              className="number-input"
            />
          </div>

          <div className="setting-item">
            <label htmlFor="chars-per-session">
              <strong>Characters Per Learn New Session</strong>
              <span className="setting-description">
                How many new characters to introduce before starting a review session (3-20)
              </span>
            </label>
            <input
              id="chars-per-session"
              type="number"
              min="3"
              max="20"
              value={miniSrsFrequency}
              onChange={(e) => setMiniSrsFrequency(Number(e.target.value))}
              className="number-input"
            />
          </div>
        </section>
      </div>

      <div className="settings-footer">
        <button className="btn-done" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
