import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CanvasState, Position } from '../types';

interface CanvasContextType {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
}

type CanvasAction =
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN_OFFSET'; payload: Position }
  | { type: 'SELECT_SIDES'; payload: string[] }
  | { type: 'SELECT_ARROWS'; payload: string[] }
  | { type: 'START_ARROW_CREATION'; payload: string }
  | { type: 'FINISH_ARROW_CREATION' }
  | { type: 'TOGGLE_GRID_SNAP' }
  | { type: 'SET_GRID_SIZE'; payload: number }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'RESET_CANVAS' };

const initialState: CanvasState = {
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  selectedSideIds: [],
  selectedArrowIds: [],
  isCreatingArrow: false,
  gridSnapEnabled: true,
  gridSize: 20,
};

function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.payload)) };

    case 'SET_PAN_OFFSET':
      return { ...state, panOffset: action.payload };

    case 'SELECT_SIDES':
      return { ...state, selectedSideIds: action.payload, selectedArrowIds: [] };

    case 'SELECT_ARROWS':
      return { ...state, selectedArrowIds: action.payload, selectedSideIds: [] };

    case 'START_ARROW_CREATION':
      return {
        ...state,
        isCreatingArrow: true,
        arrowSourceId: action.payload,
        selectedSideIds: [],
        selectedArrowIds: [],
      };

    case 'FINISH_ARROW_CREATION':
      return {
        ...state,
        isCreatingArrow: false,
        arrowSourceId: undefined,
      };

    case 'TOGGLE_GRID_SNAP':
      return { ...state, gridSnapEnabled: !state.gridSnapEnabled };

    case 'SET_GRID_SIZE':
      return { ...state, gridSize: Math.max(5, action.payload) };

    case 'CLEAR_SELECTION':
      return { ...state, selectedSideIds: [], selectedArrowIds: [] };

    case 'RESET_CANVAS':
      return initialState;

    default:
      return state;
  }
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  return (
    <CanvasContext.Provider value={{ state, dispatch }}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};