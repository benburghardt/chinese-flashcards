import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  listening: boolean;
  supported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

/**
 * Custom hook for Speech Recognition using Web Speech API
 *
 * @param options - Configuration options for speech recognition
 * @returns Object containing speech recognition controls and state
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = 'zh-CN',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    console.log('[STT] Checking browser compatibility...');

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setSupported(true);
      setError(null);
      console.log('[STT] ✅ Speech recognition is supported');

      // Create recognition instance
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = maxAlternatives;

      console.log('[STT] Recognition config:', { lang, continuous, interimResults, maxAlternatives });

      // Set up event handlers
      recognition.onstart = () => {
        console.log('[STT] ✅ Recognition started');
        setListening(true);
        setError(null);
      };

      recognition.onend = () => {
        console.log('[STT] ✅ Recognition ended');
        setListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[STT] ❌ Recognition error:', event.error);
        setListening(false);

        let errorMessage = 'An error occurred during speech recognition.';

        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone permissions.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please connect a microphone.';
            break;
          case 'network':
            errorMessage = 'Network error occurred. Speech recognition requires internet.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service is not allowed.';
            break;
          case 'bad-grammar':
            errorMessage = 'Speech recognition grammar error.';
            break;
          case 'language-not-supported':
            errorMessage = 'The selected language (Mandarin Chinese) is not supported.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        setError(errorMessage);
        console.error('[STT] Error message:', errorMessage);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('[STT] Recognition result received');

        let finalTranscript = '';
        let interimText = '';

        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;

          console.log(`[STT] Result ${i}: "${transcriptText}" (final: ${result.isFinal})`);

          if (result.isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimText += transcriptText;
          }
        }

        if (finalTranscript) {
          console.log('[STT] Final transcript:', finalTranscript);
          setTranscript(prev => prev + finalTranscript);
          setInterimTranscript('');
        } else if (interimText) {
          console.log('[STT] Interim transcript:', interimText);
          setInterimTranscript(interimText);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSupported(false);
      setError('Speech recognition is not supported in this browser.');
      console.error('[STT] ❌ Speech recognition is NOT supported');
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, continuous, interimResults, maxAlternatives]);

  const startListening = useCallback(() => {
    console.log('[STT] startListening() called');

    if (!supported) {
      console.error('[STT] Cannot start - not supported');
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (listening) {
      console.warn('[STT] Already listening');
      return;
    }

    try {
      console.log('[STT] Starting recognition...');
      recognitionRef.current?.start();
    } catch (err) {
      console.error('[STT] ❌ Exception starting recognition:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to start recognition: ${errorMessage}`);
    }
  }, [supported, listening]);

  const stopListening = useCallback(() => {
    console.log('[STT] stopListening() called');

    if (!listening) {
      console.warn('[STT] Not currently listening');
      return;
    }

    try {
      console.log('[STT] Stopping recognition...');
      recognitionRef.current?.stop();
    } catch (err) {
      console.error('[STT] ❌ Exception stopping recognition:', err);
    }
  }, [listening]);

  const resetTranscript = useCallback(() => {
    console.log('[STT] resetTranscript() called');
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript,
    interimTranscript,
    listening,
    supported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

export default useSpeechRecognition;
