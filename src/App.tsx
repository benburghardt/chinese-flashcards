import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Dashboard from './components/Dashboard/Dashboard';
import IntroductionScreen from './components/Introduction/IntroductionScreen';
import SpacedRepetition from './components/Study/SpacedRepetition';
import SelfStudy from './components/Study/SelfStudy';
import './App.css'

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

type ViewMode = 'dashboard' | 'introduction' | 'initial-srs' | 'srs-session' | 'self-study' | 'dictionary';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [newCharacter, setNewCharacter] = useState<Character | null>(null);
  const [learningBatch, setLearningBatch] = useState<Character[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [skippedCharacterIds, setSkippedCharacterIds] = useState<number[]>([]);

  const handleStartLearnNew = async () => {
    try {
      // Get a batch of unlocked characters (up to 10)
      const batch = await invoke<Character[]>('get_unlocked_characters_batch', { batchSize: 10 });

      if (batch.length === 0) {
        alert('No characters available to learn yet! Keep reviewing to unlock more.');
        return;
      }

      console.log(`Starting learning batch with ${batch.length} characters`);
      setLearningBatch(batch);
      setCurrentBatchIndex(0);
      setSkippedCharacterIds([]); // Reset skipped characters for new batch
      setNewCharacter(batch[0]);
      setViewMode('introduction');
    } catch (error) {
      console.error('Failed to start learning:', error);
    }
  };

  const handleStartSrsSession = () => {
    setViewMode('srs-session');
  };

  const handleStartSelfStudy = () => {
    setViewMode('self-study');
  };

  const handleBrowseDictionary = () => {
    setViewMode('dictionary');
    // Dictionary view will be implemented in later tasks
    alert('Dictionary view coming soon in Task 1.13!');
    setViewMode('dashboard');
  };

  const handleIntroductionComplete = () => {
    // If we're in a learning batch, move to next character or start initial SRS
    if (learningBatch.length > 0) {
      const nextIndex = currentBatchIndex + 1;

      if (nextIndex < learningBatch.length) {
        // More characters to introduce
        setCurrentBatchIndex(nextIndex);
        setNewCharacter(learningBatch[nextIndex]);
        // Stay in introduction mode
      } else {
        // All characters introduced, start initial SRS session
        console.log('All characters introduced. Starting initial SRS session...');
        setNewCharacter(null);
        setViewMode('initial-srs');
      }
    } else {
      // Single character introduction (from SRS unlock)
      setNewCharacter(null);
      setViewMode('dashboard');
    }
  };

  const handleIntroductionSkip = async () => {
    if (!newCharacter) return;

    try {
      // Mark character as introduced and immediately reviewable
      await invoke('introduce_character_immediately_reviewable', {
        characterId: newCharacter.id
      });

      console.log(`Character ${newCharacter.id} skipped and marked as immediately reviewable`);

      // Track this character as skipped (don't include in initial study)
      setSkippedCharacterIds(prev => [...prev, newCharacter.id]);

      // Move to next character or finish
      handleIntroductionComplete();
    } catch (error) {
      console.error('Failed to skip character:', error);
      alert(`Error skipping character: ${error}`);
    }
  };

  const handleSrsComplete = () => {
    setViewMode('dashboard');
  };

  const handleSelfStudyComplete = () => {
    setViewMode('dashboard');
  };

  const handleInitialSrsComplete = async () => {
    try {
      // The SpacedRepetition component now handles marking characters as completed/incomplete
      // We just need to start the 2-day timer for next unlock (if all ready characters are introduced)
      console.log('Initial SRS session complete. Updating unlock timer...');

      try {
        const result = await invoke<string>('mark_all_ready_characters_introduced');
        console.log('Timer update result:', result);
      } catch (timerError) {
        console.error('Failed to update unlock timer:', timerError);
        // Non-critical error, continue anyway
      }

      // Clear batch and return to dashboard
      setLearningBatch([]);
      setCurrentBatchIndex(0);
      setSkippedCharacterIds([]);
      setViewMode('dashboard');
    } catch (error) {
      console.error('Failed to complete initial SRS:', error);
      alert(`Error completing initial SRS: ${error}`);
    }
  };

  // Show initial SRS session (for newly learned batch) - now uses actual study!
  if (viewMode === 'initial-srs') {
    // Filter out skipped characters from initial study
    const characterIdsToStudy = learningBatch
      .filter(c => !skippedCharacterIds.includes(c.id))
      .map(c => c.id);

    return (
      <SpacedRepetition
        onComplete={handleInitialSrsComplete}
        isInitialStudy={true}
        initialStudyCharacterIds={characterIdsToStudy}
      />
    );
  }

  // Show SRS session
  if (viewMode === 'srs-session') {
    return (
      <SpacedRepetition
        onComplete={handleSrsComplete}
      />
    );
  }

  // Show self-study session
  if (viewMode === 'self-study') {
    return (
      <SelfStudy
        onComplete={handleSelfStudyComplete}
      />
    );
  }

  // Show introduction screen
  if (viewMode === 'introduction' && newCharacter) {
    const isLastInBatch = learningBatch.length > 0 && currentBatchIndex === learningBatch.length - 1;
    return (
      <IntroductionScreen
        character={newCharacter}
        onComplete={handleIntroductionComplete}
        onSkip={handleIntroductionSkip}
        totalCharacters={11008}
        currentIndex={currentBatchIndex}
        batchSize={learningBatch.length || 1}
        isLastInBatch={isLastInBatch}
      />
    );
  }

  // Show Dashboard (default view)
  if (viewMode === 'dashboard') {
    return (
      <Dashboard
        onStartLearnNew={handleStartLearnNew}
        onStartSrsSession={handleStartSrsSession}
        onStartSelfStudy={handleStartSelfStudy}
        onBrowseDictionary={handleBrowseDictionary}
      />
    );
  }

  // Fallback (should never reach here)
  return null;
}

export default App;
