import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, FlashcardSet, Flashcard, CanvasTool, StudySession } from '../types';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

type AppAction =
  | { type: 'SET_CURRENT_SET'; payload: FlashcardSet; filePath?: string }
  | { type: 'SET_CURRENT_FLASHCARD'; payload: Flashcard | null }
  | { type: 'SET_EDIT_MODE'; payload: 'view' | 'edit' | 'study' }
  | { type: 'SET_SELECTED_TOOL'; payload: CanvasTool }
  | { type: 'START_STUDY_SESSION'; payload: StudySession }
  | { type: 'END_STUDY_SESSION' }
  | { type: 'UPDATE_FLASHCARD'; payload: Flashcard }
  | { type: 'RESET_APP' };

const initialState: AppState = {
  editMode: 'view',
  selectedTool: 'select',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_SET':
      return { ...state, currentSet: action.payload, currentSetFilePath: action.filePath };

    case 'SET_CURRENT_FLASHCARD':
      return { ...state, currentFlashcard: action.payload };

    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };

    case 'SET_SELECTED_TOOL':
      return { ...state, selectedTool: action.payload };

    case 'START_STUDY_SESSION':
      return { ...state, studySession: action.payload, editMode: 'study' };

    case 'END_STUDY_SESSION':
      return { ...state, studySession: undefined, editMode: 'view' };

    case 'UPDATE_FLASHCARD':
      if (!state.currentSet) return state;

      const updatedFlashcards = state.currentSet.flashcards.map(card =>
        card.id === action.payload.id ? action.payload : card
      );

      return {
        ...state,
        currentSet: { ...state.currentSet, flashcards: updatedFlashcards },
        currentFlashcard: action.payload,
      };

    case 'RESET_APP':
      return initialState;

    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};