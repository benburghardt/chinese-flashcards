// Phase 3: Study Mode Generator
import { StudyQuestion, Flashcard, Arrow, StudyMode } from '../types';

export class StudyModeGenerator {
  static generateQuestions(
    flashcards: Flashcard[],
    mode: StudyMode,
    count: number = 20
  ): StudyQuestion[] {
    const allArrows = flashcards.flatMap(card =>
      card.arrows.map(arrow => ({ card, arrow }))
    );

    if (allArrows.length === 0) return [];

    const shuffled = this.shuffleArray(allArrows);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map((item, index) =>
      this.createQuestion(item.card, item.arrow, mode, index)
    );
  }

  private static createQuestion(
    flashcard: Flashcard,
    arrow: Arrow,
    mode: StudyMode,
    questionId: number
  ): StudyQuestion {
    const sourceSide = flashcard.sides.find(s => s.id === arrow.sourceId)!;
    const destinationSide = flashcard.sides.find(s => s.id === arrow.destinationId)!;

    const baseQuestion: StudyQuestion = {
      id: `q${questionId}`,
      arrowId: arrow.id,
      flashcardId: flashcard.id,
      sourceValue: sourceSide.value,
      arrowLabel: arrow.label,
      correctAnswer: destinationSide.value,
      mode,
    };

    if (mode === 'multiple-choice') {
      baseQuestion.options = this.generateMultipleChoiceOptions(
        destinationSide.value,
        flashcard,
        arrow.label
      );
    }

    return baseQuestion;
  }

  private static generateMultipleChoiceOptions(
    correctAnswer: string,
    flashcard: Flashcard,
    arrowLabel: string
  ): string[] {
    // Get potential wrong answers from the same flashcard
    const sameLabelArrows = flashcard.arrows.filter(a => a.label === arrowLabel);
    const potentialAnswers = new Set<string>();

    // Add answers from arrows with same label
    sameLabelArrows.forEach(arrow => {
      const destinationSide = flashcard.sides.find(s => s.id === arrow.destinationId);
      if (destinationSide && destinationSide.value !== correctAnswer) {
        potentialAnswers.add(destinationSide.value);
      }
    });

    // If we need more options, add random sides from the flashcard
    if (potentialAnswers.size < 3) {
      flashcard.sides.forEach(side => {
        if (side.value !== correctAnswer && potentialAnswers.size < 3) {
          potentialAnswers.add(side.value);
        }
      });
    }

    const wrongAnswers = Array.from(potentialAnswers).slice(0, 3);
    const allOptions = [correctAnswer, ...wrongAnswers];

    return this.shuffleArray(allOptions);
  }

  static generateCustomPath(
    flashcard: Flashcard,
    startSideId: string,
    maxDepth: number = 5
  ): StudyQuestion[] {
    const visited = new Set<string>();
    const path: StudyQuestion[] = [];

    const traverse = (currentSideId: string, depth: number) => {
      if (depth >= maxDepth || visited.has(currentSideId)) return;

      visited.add(currentSideId);

      const outgoingArrows = flashcard.arrows.filter(a => a.sourceId === currentSideId);

      outgoingArrows.forEach((arrow, index) => {
        const sourceSide = flashcard.sides.find(s => s.id === arrow.sourceId)!;
        const destinationSide = flashcard.sides.find(s => s.id === arrow.destinationId)!;

        path.push({
          id: `path${depth}-${index}`,
          arrowId: arrow.id,
          flashcardId: flashcard.id,
          sourceValue: sourceSide.value,
          arrowLabel: arrow.label,
          correctAnswer: destinationSide.value,
          mode: 'custom-path',
        });

        traverse(arrow.destinationId, depth + 1);
      });
    };

    traverse(startSideId, 0);
    return path;
  }

  /**
   * Find the side with the most arrows (incoming + outgoing)
   * This will be the starting point for the interactive custom path mode
   */
  static findMostConnectedSide(flashcard: Flashcard): string | null {
    if (flashcard.sides.length === 0) return null;

    const connectionCounts = new Map<string, number>();

    // Initialize counts
    flashcard.sides.forEach(side => {
      connectionCounts.set(side.id, 0);
    });

    // Count arrows
    flashcard.arrows.forEach(arrow => {
      connectionCounts.set(arrow.sourceId, (connectionCounts.get(arrow.sourceId) || 0) + 1);
      connectionCounts.set(arrow.destinationId, (connectionCounts.get(arrow.destinationId) || 0) + 1);
    });

    // Find side with most connections
    let maxConnections = 0;
    let mostConnectedSideId: string | null = null;

    connectionCounts.forEach((count, sideId) => {
      if (count > maxConnections) {
        maxConnections = count;
        mostConnectedSideId = sideId;
      }
    });

    // If no arrows, just return first side
    return mostConnectedSideId || flashcard.sides[0].id;
  }

  /**
   * Get all outgoing arrows from a specific side
   */
  static getOutgoingArrows(flashcard: Flashcard, sideId: string): Arrow[] {
    return flashcard.arrows.filter(arrow => arrow.sourceId === sideId);
  }

  static validateAnswer(question: StudyQuestion, userAnswer: string): boolean {
    const normalizedCorrect = this.normalizeAnswer(question.correctAnswer);
    const normalizedUser = this.normalizeAnswer(userAnswer);

    // Exact match after normalization
    if (normalizedCorrect === normalizedUser) return true;

    // Fuzzy matching for minor typos (Levenshtein distance)
    return this.calculateLevenshteinDistance(normalizedCorrect, normalizedUser) <= 2;
  }

  private static normalizeAnswer(answer: string): string {
    return answer.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private static calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static calculateDifficulty(
    timesStudied: number,
    timesCorrect: number,
    averageTime: number
  ): number {
    if (timesStudied === 0) return 3; // Neutral difficulty

    const accuracy = timesCorrect / timesStudied;

    // Base difficulty on accuracy (0-5 scale)
    let difficulty = 5 - (accuracy * 4); // 1.0 accuracy = 1 difficulty, 0.0 accuracy = 5 difficulty

    // Adjust for time (longer time = harder)
    if (averageTime > 10000) difficulty += 0.5; // 10+ seconds
    if (averageTime > 20000) difficulty += 0.5; // 20+ seconds

    return Math.max(1, Math.min(5, difficulty));
  }
}