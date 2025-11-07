import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

/**
 * Test component for speech recognition functionality
 * Use this to verify microphone access and Mandarin transcription
 */
export function SpeechRecognitionTest() {
  const {
    transcript,
    interimTranscript,
    listening,
    supported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: 'zh-CN',
    continuous: false,
    interimResults: true,
  });

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Speech Recognition Test</h2>

      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {supported ? '✅ Supported' : '❌ Not Supported'}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Listening:</strong> {listening ? '🎤 Recording...' : '⭕ Idle'}
      </div>

      {error && (
        <div style={{
          padding: '10px',
          background: '#fee',
          color: '#c00',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{
        marginBottom: '20px',
        padding: '16px',
        background: '#f5f5f5',
        borderRadius: '8px',
        minHeight: '100px'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <strong>Final Transcript:</strong>
          <div style={{
            marginTop: '8px',
            padding: '8px',
            background: 'white',
            borderRadius: '4px',
            fontSize: '18px',
            minHeight: '40px'
          }}>
            {transcript || <span style={{ color: '#999' }}>No transcript yet...</span>}
          </div>
        </div>

        {interimTranscript && (
          <div>
            <strong>Interim (Live):</strong>
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: '#fff9e6',
              borderRadius: '4px',
              fontSize: '16px',
              fontStyle: 'italic',
              color: '#666'
            }}>
              {interimTranscript}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={startListening}
          disabled={!supported || listening}
          style={{
            flex: 1,
            padding: '12px 24px',
            fontSize: '16px',
            background: listening ? '#999' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: (!supported || listening) ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '20px' }}>🎤</span>
          <span>Start Recording</span>
        </button>

        <button
          onClick={stopListening}
          disabled={!listening}
          style={{
            flex: 1,
            padding: '12px 24px',
            fontSize: '16px',
            background: !listening ? '#999' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: !listening ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '20px' }}>⏹</span>
          <span>Stop</span>
        </button>

        <button
          onClick={resetTranscript}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ fontSize: '14px', color: '#666' }}>
        <h3 style={{ marginTop: '20px' }}>Test Instructions:</h3>
        <ol>
          <li>Click "Start Recording" and allow microphone access</li>
          <li>Speak some Mandarin Chinese (e.g., "你好", "谢谢")</li>
          <li>Watch the interim transcript update in real-time</li>
          <li>Click "Stop" or wait for auto-stop</li>
          <li>Verify the final transcript is accurate</li>
        </ol>

        <h3 style={{ marginTop: '20px' }}>Common Test Phrases:</h3>
        <ul style={{ fontFamily: 'serif', fontSize: '16px' }}>
          <li>你好 (nǐ hǎo) - Hello</li>
          <li>谢谢 (xiè xie) - Thank you</li>
          <li>再见 (zài jiàn) - Goodbye</li>
          <li>对不起 (duì bu qǐ) - Sorry</li>
          <li>我爱你 (wǒ ài nǐ) - I love you</li>
        </ul>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#fff9e6',
          borderRadius: '6px'
        }}>
          <strong>⚠️ Note:</strong> Speech recognition requires an internet connection
          as it uses Google's cloud-based recognition service.
        </div>
      </div>
    </div>
  );
}

export default SpeechRecognitionTest;
