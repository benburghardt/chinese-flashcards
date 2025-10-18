export interface Position {
  x: number;
  y: number;
}

export interface FlashcardSide {
  id: string;
  value: string;
  position: Position;
  color?: string;
  fontSize?: number;
  width?: number;
  height?: number;
}

export interface Arrow {
  id: string;
  sourceId: string;
  destinationId: string;
  label: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface Flashcard {
  id: string;
  name: string;
  sides: FlashcardSide[];
  arrows: Arrow[];
  createdAt: Date;
  modifiedAt: Date;
}

// FlashcardTemplate - Reserved for Phase 4 (Templates)
export interface FlashcardTemplate {
  id: string;
  name: string;
  description?: string;
  sides: Omit<FlashcardSide, 'id' | 'value'>[];
  arrows: (Omit<Arrow, 'id' | 'sourceId' | 'destinationId'> & {
    sourceIndex: number;
    destinationIndex: number;
  })[];
  createdAt: Date;
}

export interface FlashcardSet {
  id: string;
  name: string;
  description?: string;
  flashcards: Flashcard[];
  createdAt: Date;
  modifiedAt: Date;
  version: string;
}

// Study-related interfaces - Reserved for Phase 3 (Study System)
export interface StudyProgress {
  arrowId: string;
  timesStudied: number;
  timesCorrect: number;
  lastStudied: Date;
  nextReview: Date;
  easeFactor: number;
  interval: number;
}

export interface StudySession {
  mode: StudyMode;
  questions: StudyQuestion[];
  currentQuestionIndex: number;
  score: number;
  startTime: Date;
  endTime?: Date;
  progressMap?: Record<string, StudyProgress>;
}

export type StudyMode = 'self-test' | 'spaced-repetition' | 'flash' | 'multiple-choice' | 'custom-path';

export interface StudyQuestion {
  id: string;
  arrowId: string;
  flashcardId: string;
  sourceValue: string;
  arrowLabel: string;
  correctAnswer: string;
  mode: StudyMode;
  options?: string[];
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
}

export interface AppState {
  currentSet?: FlashcardSet;
  currentSetFilePath?: string;
  currentFlashcard?: Flashcard | null;
  editMode: 'view' | 'edit' | 'study';
  selectedTool: CanvasTool;
  studySession?: StudySession;
}

export type CanvasTool = 'select' | 'add-side' | 'add-arrow' | 'pan';

export interface CanvasState {
  zoom: number;
  panOffset: Position;
  selectedSideIds: string[];
  selectedArrowIds: string[];
  isCreatingArrow: boolean;
  arrowSourceId?: string;
  gridSnapEnabled: boolean;
  gridSize: number;
}

// FileMetadata - Reserved for Phase 2 (File System Integration)
export interface FileMetadata {
  name: string;
  path: string;
  type: 'set' | 'template';
  lastModified: Date;
  size: number;
}