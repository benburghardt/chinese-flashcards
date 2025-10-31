import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Dashboard from "./components/Dashboard/Dashboard";
import IntroductionScreen from "./components/Introduction/IntroductionScreen";
import SpacedRepetition from "./components/Study/SpacedRepetition";
import SelfStudy from "./components/Study/SelfStudy";
import Dictionary from "./components/Dictionary/Dictionary";
import WritingPracticeDemo from "./components/WritingPractice/WritingPracticeDemo";
import WritingPracticeVerificationDemo from "./components/WritingPractice/WritingPracticeVerificationDemo";
import WritingPracticeMode from "./components/WritingPractice/WritingPracticeMode";
import "./App.css";

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

type ViewMode =
  | "dashboard"
  | "introduction"
  | "initial-srs"
  | "mini-srs"
  | "srs-session"
  | "self-study"
  | "dictionary"
  | "writing-practice-demo"
  | "writing-practice-verification-demo"
  | "writing-practice-mode";

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [newCharacter, setNewCharacter] = useState<Character | null>(null);
  const [learningBatch, setLearningBatch] = useState<Character[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [skippedCharacterIds, setSkippedCharacterIds] = useState<number[]>([]);
  const [introducedSinceLastSrs, setIntroducedSinceLastSrs] = useState<number[]>([]);

  const handleStartLearnNew = async () => {
    try {
      // Get a batch of unlocked characters (up to 100)
      const batch = await invoke<Character[]>("get_unlocked_characters_batch", { batchSize: 100 });

      if (batch.length === 0) {
        alert("No characters available to learn yet! Keep reviewing to unlock more.");
        return;
      }

      console.log(`Starting learning batch with ${batch.length} characters`);
      setLearningBatch(batch);
      setCurrentBatchIndex(0);
      setSkippedCharacterIds([]); // Reset skipped characters for new batch
      setIntroducedSinceLastSrs([]); // Reset mini-batch tracker
      setNewCharacter(batch[0]);
      setViewMode("introduction");
    } catch (error) {
      console.error("Failed to start learning:", error);
    }
  };

  const handleStartSrsSession = () => {
    setViewMode("srs-session");
  };

  const handleStartSelfStudy = () => {
    setViewMode("self-study");
  };

  const handleBrowseDictionary = () => {
    setViewMode("dictionary");
  };

  const handleDictionaryClose = () => {
    setViewMode("dashboard");
  };

  const handleStartWritingPracticeDemo = () => {
    setViewMode("writing-practice-demo");
  };

  const handleWritingPracticeDemoClose = () => {
    setViewMode("dashboard");
  };

  const handleStartWritingPracticeVerificationDemo = () => {
    setViewMode("writing-practice-verification-demo");
  };

  const handleWritingPracticeVerificationDemoClose = () => {
    setViewMode("dashboard");
  };

  const handleStartWritingPracticeMode = () => {
    setViewMode("writing-practice-mode");
  };

  const handleWritingPracticeModeClose = () => {
    setViewMode("dashboard");
  };

  const handleIntroductionComplete = () => {
    // If we're in a learning batch, move to next character or start SRS session
    if (learningBatch.length > 0) {
      // Track this character as introduced (if not skipped)
      const currentCharId = learningBatch[currentBatchIndex].id;
      const updatedIntroduced = [...introducedSinceLastSrs, currentCharId];
      setIntroducedSinceLastSrs(updatedIntroduced);

      const nextIndex = currentBatchIndex + 1;

      // Check if we've introduced 5 characters (trigger mini SRS session)
      if (updatedIntroduced.length === 5 && nextIndex < learningBatch.length) {
        console.log("5 characters introduced. Starting mini SRS session...");
        setNewCharacter(null);
        setViewMode("mini-srs");
      } else if (nextIndex < learningBatch.length) {
        // More characters to introduce (haven't hit 5 yet)
        setCurrentBatchIndex(nextIndex);
        setNewCharacter(learningBatch[nextIndex]);
        // Stay in introduction mode
      } else {
        // All characters introduced, start final SRS session
        console.log("All characters introduced. Starting final SRS session...");
        setNewCharacter(null);
        setViewMode("initial-srs");
      }
    } else {
      // Single character introduction (from SRS unlock)
      setNewCharacter(null);
      setViewMode("dashboard");
    }
  };

  const handleIntroductionSkip = async () => {
    if (!newCharacter) return;

    try {
      // Mark character as introduced and immediately reviewable
      await invoke("introduce_character_immediately_reviewable", {
        characterId: newCharacter.id,
      });

      console.log(`Character ${newCharacter.id} skipped and marked as immediately reviewable`);

      // Track this character as skipped (don't include in initial study)
      setSkippedCharacterIds((prev) => [...prev, newCharacter.id]);

      // Move to next character or finish
      handleIntroductionComplete();
    } catch (error) {
      console.error("Failed to skip character:", error);
      alert(`Error skipping character: ${error}`);
    }
  };

  const handleIntroductionExit = () => {
    // User wants to exit introduction early
    console.log("Exiting introduction early. Progress saved.");

    // Clear batch state
    setLearningBatch([]);
    setCurrentBatchIndex(0);
    setSkippedCharacterIds([]);
    setIntroducedSinceLastSrs([]);
    setNewCharacter(null);

    // Return to dashboard
    setViewMode("dashboard");
  };

  const handleSrsComplete = () => {
    setViewMode("dashboard");
  };

  const handleSelfStudyComplete = () => {
    setViewMode("dashboard");
  };

  const handleMiniSrsComplete = async () => {
    // Mini SRS session complete, continue with next batch of characters
    console.log("Mini SRS session complete. Continuing with next characters...");

    // Reset the mini-batch counter
    setIntroducedSinceLastSrs([]);

    // Move to next character
    const nextIndex = currentBatchIndex + 1;
    if (nextIndex < learningBatch.length) {
      setCurrentBatchIndex(nextIndex);
      setNewCharacter(learningBatch[nextIndex]);
      setViewMode("introduction");
    } else {
      // This shouldn't happen (we should have gone to initial-srs instead)
      // But just in case, return to dashboard
      setLearningBatch([]);
      setCurrentBatchIndex(0);
      setSkippedCharacterIds([]);
      setViewMode("dashboard");
    }
  };

  const handleInitialSrsComplete = async () => {
    try {
      // The SpacedRepetition component now handles marking characters as completed/incomplete
      // We just need to start the 2-day timer for next unlock (if all ready characters are introduced)
      console.log("Initial SRS session complete. Updating unlock timer...");

      try {
        const result = await invoke<string>("mark_all_ready_characters_introduced");
        console.log("Timer update result:", result);
      } catch (timerError) {
        console.error("Failed to update unlock timer:", timerError);
        // Non-critical error, continue anyway
      }

      // Clear batch and return to dashboard
      setLearningBatch([]);
      setCurrentBatchIndex(0);
      setSkippedCharacterIds([]);
      setIntroducedSinceLastSrs([]);
      setViewMode("dashboard");
    } catch (error) {
      console.error("Failed to complete initial SRS:", error);
      alert(`Error completing initial SRS: ${error}`);
    }
  };

  // Show mini SRS session (every 5 characters)
  if (viewMode === "mini-srs") {
    // Study only the characters introduced since last SRS (should be 5)
    const characterIdsToStudy = introducedSinceLastSrs.filter(
      (id) => !skippedCharacterIds.includes(id)
    );

    return (
      <SpacedRepetition
        onComplete={handleMiniSrsComplete}
        isInitialStudy={true}
        initialStudyCharacterIds={characterIdsToStudy}
      />
    );
  }

  // Show initial SRS session (for newly learned batch) - now uses actual study!
  if (viewMode === "initial-srs") {
    // Filter out skipped characters from initial study
    const characterIdsToStudy = learningBatch
      .filter((c) => !skippedCharacterIds.includes(c.id))
      .map((c) => c.id);

    return (
      <SpacedRepetition
        onComplete={handleInitialSrsComplete}
        isInitialStudy={true}
        initialStudyCharacterIds={characterIdsToStudy}
      />
    );
  }

  // Show SRS session
  if (viewMode === "srs-session") {
    return <SpacedRepetition onComplete={handleSrsComplete} />;
  }

  // Show self-study session
  if (viewMode === "self-study") {
    return <SelfStudy onComplete={handleSelfStudyComplete} />;
  }

  // Show dictionary
  if (viewMode === "dictionary") {
    return <Dictionary onClose={handleDictionaryClose} />;
  }

  // Show introduction screen
  if (viewMode === "introduction" && newCharacter) {
    // Check if this is the last character before an SRS session (every 5th or the actual last)
    const isLastBeforeSrs =
      learningBatch.length > 0 &&
      (currentBatchIndex === learningBatch.length - 1 || // Last character overall
        (introducedSinceLastSrs.length + 1) % 5 === 0); // Every 5th character

    return (
      <IntroductionScreen
        character={newCharacter}
        onComplete={handleIntroductionComplete}
        onSkip={handleIntroductionSkip}
        onExit={handleIntroductionExit}
        totalCharacters={11008}
        currentIndex={currentBatchIndex}
        batchSize={learningBatch.length || 1}
        isLastInBatch={isLastBeforeSrs}
      />
    );
  }

  // Show Writing Practice Demo
  if (viewMode === "writing-practice-demo") {
    return (
      <div className="app-container">
        <div className="back-button-container">
          <button className="btn-back" onClick={handleWritingPracticeDemoClose}>
            ← Back to Dashboard
          </button>
        </div>
        <WritingPracticeDemo />
      </div>
    );
  }

  // Show Writing Practice Verification Demo
  if (viewMode === "writing-practice-verification-demo") {
    return (
      <div className="app-container">
        <div className="back-button-container">
          <button className="btn-back" onClick={handleWritingPracticeVerificationDemoClose}>
            ← Back to Dashboard
          </button>
        </div>
        <WritingPracticeVerificationDemo />
      </div>
    );
  }

  // Show Writing Practice Mode (full study session)
  if (viewMode === "writing-practice-mode") {
    return <WritingPracticeMode />;
  }

  // Show Dashboard (default view)
  if (viewMode === "dashboard") {
    return (
      <Dashboard
        onStartLearnNew={handleStartLearnNew}
        onStartSrsSession={handleStartSrsSession}
        onStartSelfStudy={handleStartSelfStudy}
        onBrowseDictionary={handleBrowseDictionary}
        onStartWritingPracticeDemo={handleStartWritingPracticeDemo}
        onStartWritingPracticeVerificationDemo={handleStartWritingPracticeVerificationDemo}
        onStartWritingPracticeMode={handleStartWritingPracticeMode}
      />
    );
  }

  // Fallback (should never reach here)
  return null;
}

export default App;
