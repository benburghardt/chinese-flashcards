// Phase 4.4: Undo/Redo History Service
import { Flashcard } from '../types';

interface HistoryState {
  flashcard: Flashcard;
  timestamp: number;
}

export class HistoryService {
  private static readonly MAX_HISTORY_SIZE = 50;
  private history: HistoryState[] = [];
  private currentIndex: number = -1;

  /**
   * Push a new state to the history
   * Clears any forward history when a new action is performed
   */
  pushState(flashcard: Flashcard): void {
    // Deep clone the flashcard to avoid reference issues
    const clonedFlashcard = JSON.parse(JSON.stringify(flashcard));

    // Remove any forward history
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push({
      flashcard: clonedFlashcard,
      timestamp: Date.now(),
    });

    // Limit history size
    if (this.history.length > HistoryService.MAX_HISTORY_SIZE) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * Undo to the previous state
   * Returns the previous flashcard state or null if at the beginning
   */
  undo(): Flashcard | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex].flashcard));
  }

  /**
   * Redo to the next state
   * Returns the next flashcard state or null if at the end
   */
  redo(): Flashcard | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex].flashcard));
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current state
   */
  getCurrentState(): Flashcard | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return JSON.parse(JSON.stringify(this.history[this.currentIndex].flashcard));
    }
    return null;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history size for debugging
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Get current index for debugging
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }
}
