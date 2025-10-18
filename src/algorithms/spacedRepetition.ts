// Phase 3: Spaced Repetition Algorithm
import { StudyProgress } from '../types';

export class SpacedRepetitionAlgorithm {
  private static readonly MIN_EASE_FACTOR = 1.3;
  private static readonly INITIAL_EASE_FACTOR = 2.5;
  private static readonly INITIAL_INTERVAL = 1;

  static calculateNextReview(
    progress: StudyProgress,
    isCorrect: boolean,
    difficulty: number = 3 // 0-5 scale where 3 is neutral
  ): StudyProgress {
    const now = new Date();

    let newEaseFactor = progress.easeFactor;
    let newInterval = progress.interval;

    if (isCorrect) {
      // Successful recall
      if (progress.timesStudied === 0) {
        newInterval = 1;
      } else if (progress.timesStudied === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(progress.interval * progress.easeFactor);
      }

      // Adjust ease factor based on difficulty
      newEaseFactor = Math.max(
        this.MIN_EASE_FACTOR,
        progress.easeFactor + (0.1 - (5 - difficulty) * (0.08 + (5 - difficulty) * 0.02))
      );
    } else {
      // Failed recall - reset interval but keep ease factor
      newInterval = 1;
      newEaseFactor = Math.max(this.MIN_EASE_FACTOR, progress.easeFactor - 0.2);
    }

    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + newInterval);

    return {
      ...progress,
      timesStudied: progress.timesStudied + 1,
      timesCorrect: progress.timesCorrect + (isCorrect ? 1 : 0),
      lastStudied: now,
      nextReview,
      easeFactor: newEaseFactor,
      interval: newInterval,
    };
  }

  static initializeProgress(arrowId: string): StudyProgress {
    const now = new Date();
    return {
      arrowId,
      timesStudied: 0,
      timesCorrect: 0,
      lastStudied: now,
      nextReview: now,
      easeFactor: this.INITIAL_EASE_FACTOR,
      interval: this.INITIAL_INTERVAL,
    };
  }

  static getCardsForReview(progressList: StudyProgress[], limit: number = 20): StudyProgress[] {
    const now = new Date();
    return progressList
      .filter(progress => progress.nextReview <= now)
      .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime())
      .slice(0, limit);
  }

  static calculateRetentionRate(progress: StudyProgress): number {
    if (progress.timesStudied === 0) return 0;
    return progress.timesCorrect / progress.timesStudied;
  }
}