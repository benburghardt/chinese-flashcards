// Phase 3: Progress Persistence Service - Separate from flashcard sets for easy sharing
import { StudyProgress } from '../types';
import { detectEnvironment } from '../utils/environmentDetection';

export interface ProgressData {
  flashcardSetId: string;
  flashcardSetName: string;
  progress: Record<string, StudyProgress>; // arrowId -> StudyProgress
  lastUpdated: Date;
  version: string;
}

// Dynamic imports for Tauri APIs with web fallback
const getTauriAPI = async () => {
  const environment = await detectEnvironment();

  if (environment === 'desktop') {
    try {
      const { readTextFile, writeTextFile, exists } = await import('@tauri-apps/plugin-fs');
      const { appDataDir } = await import('@tauri-apps/api/path');

      return { readTextFile, writeTextFile, exists, appDataDir };
    } catch (error) {
      console.warn('Failed to load Tauri APIs in desktop environment:', error);
      return null;
    }
  }

  return null;
};

export class ProgressService {
  private static readonly PROGRESS_VERSION = '1.0.0';
  private static readonly PROGRESS_STORAGE_PREFIX = 'extended-flashcards-progress-';

  /**
   * Load progress for a specific flashcard set
   * @param flashcardSetId - The ID of the flashcard set
   * @param flashcardSetFilePath - The file path of the flashcard set (for desktop version)
   */
  static async loadProgress(
    flashcardSetId: string,
    flashcardSetFilePath?: string
  ): Promise<Record<string, StudyProgress>> {
    try {
      const tauriAPI = await getTauriAPI();

      if (tauriAPI && flashcardSetFilePath) {
        // Desktop version - store progress file alongside flashcard set
        const { readTextFile, exists } = tauriAPI;
        const progressPath = this.getProgressFilePath(flashcardSetFilePath);

        const fileExists = await exists(progressPath);
        if (!fileExists) {
          return {};
        }

        const content = await readTextFile(progressPath);
        const data: ProgressData = JSON.parse(content);

        if (!this.validateProgressData(data)) {
          console.warn('Invalid progress data format, resetting progress');
          return {};
        }

        // Convert date strings back to Date objects
        const progressMap: Record<string, StudyProgress> = {};
        for (const [arrowId, progress] of Object.entries(data.progress)) {
          progressMap[arrowId] = {
            ...progress,
            lastStudied: new Date(progress.lastStudied),
            nextReview: new Date(progress.nextReview),
          };
        }

        return progressMap;
      } else {
        // Web version - use localStorage
        const key = this.PROGRESS_STORAGE_PREFIX + flashcardSetId;
        const stored = localStorage.getItem(key);

        if (!stored) {
          return {};
        }

        const data: ProgressData = JSON.parse(stored);

        if (!this.validateProgressData(data)) {
          console.warn('Invalid progress data format, resetting progress');
          localStorage.removeItem(key);
          return {};
        }

        // Convert date strings back to Date objects
        const progressMap: Record<string, StudyProgress> = {};
        for (const [arrowId, progress] of Object.entries(data.progress)) {
          progressMap[arrowId] = {
            ...progress,
            lastStudied: new Date(progress.lastStudied),
            nextReview: new Date(progress.nextReview),
          };
        }

        return progressMap;
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      return {};
    }
  }

  /**
   * Save progress for a specific flashcard set
   * @param flashcardSetId - The ID of the flashcard set
   * @param flashcardSetName - The name of the flashcard set
   * @param progress - The progress map to save
   * @param flashcardSetFilePath - The file path of the flashcard set (for desktop version)
   */
  static async saveProgress(
    flashcardSetId: string,
    flashcardSetName: string,
    progress: Record<string, StudyProgress>,
    flashcardSetFilePath?: string
  ): Promise<void> {
    try {
      const progressData: ProgressData = {
        flashcardSetId,
        flashcardSetName,
        progress,
        lastUpdated: new Date(),
        version: this.PROGRESS_VERSION,
      };

      const content = JSON.stringify(progressData, null, 2);

      const tauriAPI = await getTauriAPI();

      if (tauriAPI && flashcardSetFilePath) {
        // Desktop version - save progress file alongside flashcard set
        const { writeTextFile } = tauriAPI;
        const progressPath = this.getProgressFilePath(flashcardSetFilePath);

        await writeTextFile(progressPath, content);
      } else {
        // Web version - use localStorage
        const key = this.PROGRESS_STORAGE_PREFIX + flashcardSetId;
        localStorage.setItem(key, content);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  }

  /**
   * Get the count of cards due for review
   * @param progress - The progress map
   * @returns Number of cards due for review
   */
  static getReadyCardsCount(progress: Record<string, StudyProgress>): number {
    const now = new Date();
    return Object.values(progress).filter(p => new Date(p.nextReview) <= now).length;
  }

  /**
   * Filter arrows that are due for review
   * @param arrowIds - All arrow IDs
   * @param progress - The progress map
   * @returns Arrow IDs that are due for review
   */
  static getReadyArrows(
    arrowIds: string[],
    progress: Record<string, StudyProgress>
  ): string[] {
    const now = new Date();
    return arrowIds.filter(arrowId => {
      const arrowProgress = progress[arrowId];
      if (!arrowProgress) return true; // New arrows are always ready
      return new Date(arrowProgress.nextReview) <= now;
    });
  }

  /**
   * Clear all progress for a flashcard set
   * @param flashcardSetId - The ID of the flashcard set
   * @param flashcardSetFilePath - The file path of the flashcard set (for desktop version)
   */
  static async clearProgress(
    flashcardSetId: string,
    flashcardSetFilePath?: string
  ): Promise<void> {
    try {
      const tauriAPI = await getTauriAPI();

      if (tauriAPI && flashcardSetFilePath) {
        // Desktop version - delete progress file
        const { writeTextFile } = tauriAPI;
        const progressPath = this.getProgressFilePath(flashcardSetFilePath);

        // Write empty progress file
        const emptyProgress: ProgressData = {
          flashcardSetId,
          flashcardSetName: '',
          progress: {},
          lastUpdated: new Date(),
          version: this.PROGRESS_VERSION,
        };
        await writeTextFile(progressPath, JSON.stringify(emptyProgress, null, 2));
      } else {
        // Web version - remove from localStorage
        const key = this.PROGRESS_STORAGE_PREFIX + flashcardSetId;
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error clearing progress:', error);
      throw error;
    }
  }

  /**
   * Get progress file path for desktop version
   * Stores progress file in app data directory with flashcard set ID
   */
  private static getProgressFilePath(flashcardSetFilePath: string): string {
    // Extract filename without extension
    const pathParts = flashcardSetFilePath.split(/[/\\]/);
    const filename = pathParts[pathParts.length - 1];
    const nameWithoutExt = filename.replace(/\.json$/, '');

    // Detect the path separator used in the original path
    const separator = flashcardSetFilePath.includes('\\') ? '\\' : '/';

    // Store in same directory as flashcard set
    const directory = pathParts.slice(0, -1).join(separator);
    return `${directory}${separator}${nameWithoutExt}.progress.json`;
  }

  /**
   * Validate progress data structure
   */
  private static validateProgressData(data: any): data is ProgressData {
    try {
      return (
        data &&
        typeof data.flashcardSetId === 'string' &&
        typeof data.version === 'string' &&
        data.progress &&
        typeof data.progress === 'object' &&
        data.lastUpdated &&
        // Validate each progress entry
        Object.entries(data.progress).every(([arrowId, progress]: [string, any]) =>
          typeof arrowId === 'string' &&
          progress &&
          typeof progress.arrowId === 'string' &&
          typeof progress.timesStudied === 'number' &&
          typeof progress.timesCorrect === 'number' &&
          typeof progress.easeFactor === 'number' &&
          typeof progress.interval === 'number' &&
          progress.lastStudied &&
          progress.nextReview
        )
      );
    } catch (error) {
      console.error('Progress validation error:', error);
      return false;
    }
  }
}
