import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceURI?: string | null; // Voice to use (null = browser default)
}

interface UseSpeechReturn {
  speak: (text: string) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  speaking: boolean;
  supported: boolean;
  error: string | null;
  rate: number;
  setRate: (rate: number) => void;
}

/**
 * Custom hook for Text-to-Speech using Web Speech API
 *
 * @param options - Configuration options for speech synthesis
 * @returns Object containing speech control functions and state
 */
export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const {
    lang = 'zh-CN',
    rate: initialRate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    voiceURI = null,
  } = options;

  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRateState] = useState(initialRate);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    console.log('[TTS] Checking browser compatibility...');
    console.log('[TTS] window exists:', typeof window !== 'undefined');
    console.log('[TTS] speechSynthesis exists:', typeof window !== 'undefined' && 'speechSynthesis' in window);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      setError(null);
      console.log('[TTS] ✅ Text-to-speech is supported');

      // Log available voices (may need to wait for voiceschanged event)
      const logVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('[TTS] Available voices:', voices.length);
        voices.forEach((voice, i) => {
          console.log(`[TTS] Voice ${i}: ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
        });

        const zhVoices = voices.filter(v => v.lang.startsWith('zh'));
        console.log(`[TTS] Chinese voices found: ${zhVoices.length}`);
      };

      // Log voices immediately
      logVoices();

      // Also log when voices change (they load asynchronously)
      window.speechSynthesis.onvoiceschanged = () => {
        console.log('[TTS] Voices changed event fired');
        logVoices();

        // Check if Chinese voices are available
        const voices = window.speechSynthesis.getVoices();
        const zhVoices = voices.filter(v => v.lang.startsWith('zh'));
        if (zhVoices.length === 0 && voices.length > 0) {
          console.warn('[TTS] ⚠️ No Chinese voices found. User may need to install Chinese language pack.');
          setError('No Chinese voice available. Please install Chinese language pack in Windows settings. (See docs/TTS_SETUP_GUIDE.md)');
        }
      };
    } else {
      setSupported(false);
      setError('Text-to-speech is not supported in this browser.');
      console.error('[TTS] ❌ Text-to-speech is NOT supported');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    console.log('[TTS] speak() called with text:', text);
    console.log('[TTS] supported:', supported);

    if (!supported) {
      console.error('[TTS] Cannot speak - TTS not supported');
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    try {
      console.log('[TTS] Cancelling any ongoing speech...');
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      console.log('[TTS] Creating new utterance...');
      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Set voice if specified
      if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('[TTS] Using selected voice:', selectedVoice.name);
        } else {
          console.warn('[TTS] Selected voice not found:', voiceURI);
        }
      }

      console.log('[TTS] Utterance config:', { lang, rate, pitch, volume, voiceURI });

      // Set up event handlers
      utterance.onstart = () => {
        console.log('[TTS] ✅ Speech started');
        setSpeaking(true);
        setError(null);
      };

      utterance.onend = () => {
        console.log('[TTS] ✅ Speech ended');
        setSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('[TTS] ❌ Speech error event:', event);
        console.error('[TTS] Error type:', event.error);
        setSpeaking(false);

        // Handle specific error types
        let errorMessage = 'An error occurred during speech synthesis.';

        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Speech synthesis is not allowed. Please check browser permissions.';
            break;
          case 'network':
            errorMessage = 'Network error occurred during speech synthesis.';
            break;
          case 'synthesis-unavailable':
            errorMessage = 'Speech synthesis is unavailable.';
            break;
          case 'synthesis-failed':
            errorMessage = 'Speech synthesis failed.';
            break;
          case 'audio-busy':
            errorMessage = 'Audio system is busy.';
            break;
          case 'audio-hardware':
            errorMessage = 'Audio hardware error.';
            break;
          case 'language-unavailable':
            errorMessage = 'The requested language (Mandarin Chinese) is not available.';
            break;
          case 'voice-unavailable':
            errorMessage = 'The requested voice is not available.';
            break;
          default:
            errorMessage = `Speech error: ${event.error}`;
        }

        setError(errorMessage);
        console.error('[TTS] Error message:', errorMessage);
      };

      // Save reference and speak
      utteranceRef.current = utterance;
      console.log('[TTS] Calling speechSynthesis.speak()...');
      console.log('[TTS] speechSynthesis.speaking:', window.speechSynthesis.speaking);
      console.log('[TTS] speechSynthesis.pending:', window.speechSynthesis.pending);
      window.speechSynthesis.speak(utterance);
      console.log('[TTS] speechSynthesis.speak() called');

    } catch (err) {
      console.error('[TTS] ❌ Exception in speak():', err);
      setSpeaking(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to speak: ${errorMessage}`);
      console.error('Speech synthesis exception:', err);
    }
  }, [supported, lang, rate, pitch, volume, voiceURI]);

  const cancel = useCallback(() => {
    if (supported && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  const pause = useCallback(() => {
    if (supported && window.speechSynthesis && speaking) {
      window.speechSynthesis.pause();
    }
  }, [supported, speaking]);

  const resume = useCallback(() => {
    if (supported && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, [supported]);

  const setRate = useCallback((newRate: number) => {
    // Clamp rate between 0.8 and 1.2 as per requirements
    const clampedRate = Math.max(0.8, Math.min(1.2, newRate));
    setRateState(clampedRate);
  }, []);

  return {
    speak,
    cancel,
    pause,
    resume,
    speaking,
    supported,
    error,
    rate,
    setRate,
  };
}

export default useSpeech;
