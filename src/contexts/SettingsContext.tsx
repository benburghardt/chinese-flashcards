import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  // TTS Settings
  selectedVoice: string | null;
  setSelectedVoice: (voiceURI: string | null) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  autoPlayTTS: boolean;
  setAutoPlayTTS: (enabled: boolean) => void;

  // Character Unlocking Settings
  initialUnlockCount: number;
  setInitialUnlockCount: (count: number) => void;
  regularUnlockCount: number;
  setRegularUnlockCount: (count: number) => void;
  daysBetweenUnlocks: number;
  setDaysBetweenUnlocks: (days: number) => void;
  daysAfterQueueEmptied: number;
  setDaysAfterQueueEmptied: (days: number) => void;

  // Practice Settings
  practiceSessionSize: number;
  setPracticeSessionSize: (size: number) => void;
  miniSrsFrequency: number;
  setMiniSrsFrequency: (count: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'chinese-flashcards-settings';

interface Settings {
  // TTS Settings
  selectedVoice: string | null;
  speechRate: number;
  autoPlayTTS: boolean;

  // Character Unlocking Settings
  initialUnlockCount: number;
  regularUnlockCount: number;
  daysBetweenUnlocks: number;
  daysAfterQueueEmptied: number;

  // Practice Settings
  practiceSessionSize: number;
  miniSrsFrequency: number;
}

const DEFAULT_SETTINGS: Settings = {
  // TTS Settings
  selectedVoice: null, // null = use browser default
  speechRate: 0.9,
  autoPlayTTS: true,

  // Character Unlocking Settings
  initialUnlockCount: 100,        // First unlock for new users
  regularUnlockCount: 100,        // Subsequent unlocks
  daysBetweenUnlocks: 20,         // Days between unlock cycles
  daysAfterQueueEmptied: 2,       // Days to wait after clearing ready-to-learn

  // Practice Settings
  practiceSessionSize: 20,        // Characters per practice session
  miniSrsFrequency: 5,            // Characters per Learn New session (before review)
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Failed to parse settings from localStorage:', e);
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setSelectedVoice = (voiceURI: string | null) => {
    setSettings(prev => ({ ...prev, selectedVoice: voiceURI }));
  };

  const setSpeechRate = (rate: number) => {
    // Clamp between 0.5 and 1.5
    const clampedRate = Math.max(0.5, Math.min(1.5, rate));
    setSettings(prev => ({ ...prev, speechRate: clampedRate }));
  };

  const setAutoPlayTTS = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, autoPlayTTS: enabled }));
  };

  const setInitialUnlockCount = (count: number) => {
    const clampedCount = Math.max(10, Math.min(500, count));
    setSettings(prev => ({ ...prev, initialUnlockCount: clampedCount }));
  };

  const setRegularUnlockCount = (count: number) => {
    const clampedCount = Math.max(10, Math.min(500, count));
    setSettings(prev => ({ ...prev, regularUnlockCount: clampedCount }));
  };

  const setDaysBetweenUnlocks = (days: number) => {
    const clampedDays = Math.max(1, Math.min(90, days));
    setSettings(prev => ({ ...prev, daysBetweenUnlocks: clampedDays }));
  };

  const setDaysAfterQueueEmptied = (days: number) => {
    const clampedDays = Math.max(0, Math.min(30, days));
    setSettings(prev => ({ ...prev, daysAfterQueueEmptied: clampedDays }));
  };

  const setPracticeSessionSize = (size: number) => {
    const clampedSize = Math.max(5, Math.min(50, size));
    setSettings(prev => ({ ...prev, practiceSessionSize: clampedSize }));
  };

  const setMiniSrsFrequency = (count: number) => {
    const clampedCount = Math.max(3, Math.min(20, count));
    setSettings(prev => ({ ...prev, miniSrsFrequency: clampedCount }));
  };

  return (
    <SettingsContext.Provider
      value={{
        selectedVoice: settings.selectedVoice,
        setSelectedVoice,
        speechRate: settings.speechRate,
        setSpeechRate,
        autoPlayTTS: settings.autoPlayTTS,
        setAutoPlayTTS,
        initialUnlockCount: settings.initialUnlockCount,
        setInitialUnlockCount,
        regularUnlockCount: settings.regularUnlockCount,
        setRegularUnlockCount,
        daysBetweenUnlocks: settings.daysBetweenUnlocks,
        setDaysBetweenUnlocks,
        daysAfterQueueEmptied: settings.daysAfterQueueEmptied,
        setDaysAfterQueueEmptied,
        practiceSessionSize: settings.practiceSessionSize,
        setPracticeSessionSize,
        miniSrsFrequency: settings.miniSrsFrequency,
        setMiniSrsFrequency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
