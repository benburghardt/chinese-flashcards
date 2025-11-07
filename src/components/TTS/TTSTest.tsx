import { useState } from 'react';
import { useSpeech } from '../../hooks/useSpeech';

/**
 * Simple test component to verify TTS functionality
 * This can be used during development to test the Web Speech API
 */
export function TTSTest() {
  const [testText, setTestText] = useState('你好');
  const { speak, speaking, supported, error, rate, setRate } = useSpeech({
    lang: 'zh-CN',
    rate: 1.0,
  });

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Text-to-Speech Test</h2>

      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {supported ? '✅ Supported' : '❌ Not Supported'}
      </div>

      {error && (
        <div style={{
          padding: '10px',
          background: '#fee',
          color: '#c00',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Test Text (Chinese):
        </label>
        <input
          type="text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Speech Rate: {rate.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.8"
          max="1.2"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <button
        onClick={() => speak(testText)}
        disabled={speaking || !supported}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: speaking ? '#999' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: speaking ? 'not-allowed' : 'pointer'
        }}
      >
        {speaking ? 'Speaking...' : 'Speak'}
      </button>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Test Instructions:</h3>
        <ol>
          <li>Verify that "Supported" shows ✅</li>
          <li>Try speaking different Chinese characters/words</li>
          <li>Test the speech rate adjustment (0.8x - 1.2x)</li>
          <li>Verify clear Mandarin pronunciation</li>
        </ol>
      </div>
    </div>
  );
}

export default TTSTest;
