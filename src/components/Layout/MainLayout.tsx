import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useCanvas } from '../../context/CanvasContext';
import { FlashcardCanvas } from '../Canvas/FlashcardCanvas';
import { CanvasToolbar } from '../Toolbar/CanvasToolbar';
import { FlashcardListPanel } from '../FlashcardList/FlashcardListPanel';
import { StudySetup } from '../Study/StudySetup';
import { StudySession } from '../Study/StudySession';
import { FileManager } from '../FileManager/FileManager';
import { SaveTemplateDialog } from '../Template/SaveTemplateDialog';
import { TemplateSelectionDialog } from '../Template/TemplateSelectionDialog';
import { StudyMode, FlashcardSide, Arrow, Flashcard, StudySession as StudySessionType, FlashcardTemplate } from '../../types';
import { TauriFileService } from '../../services/TauriFileService';
import { ProgressService } from '../../services/ProgressService';
import { TemplateService } from '../../services/TemplateService';
import { HistoryService } from '../../services/HistoryService';

export const MainLayout: React.FC = () => {
  const { state: appState, dispatch: appDispatch } = useApp();
  const { state: canvasState, dispatch: canvasDispatch } = useCanvas();
  const [showFileManager, setShowFileManager] = useState(false);
  const [showStudySetup, setShowStudySetup] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showTemplateSelectionDialog, setShowTemplateSelectionDialog] = useState(false);
  const [selectedStudyMode, setSelectedStudyMode] = useState<StudyMode>('self-test');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string | null>(null);
  const [readyCardsCount, setReadyCardsCount] = useState(0);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase 4.4: Undo/Redo history management
  const historyServiceRef = useRef<HistoryService>(new HistoryService());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const getDisplayName = () => {
    if (!appState.currentSet) return '';

    let name = '';
    if (currentFilePath) {
      // Extract filename from path (handle both Windows and Unix paths)
      const filename = currentFilePath.split(/[/\\]/).pop() || currentFilePath;
      // Remove .json extension if present
      name = filename.replace(/\.json$/, '');
    } else {
      name = appState.currentSet.name;
    }

    // Add asterisk for unsaved changes
    return hasUnsavedChanges ? `${name} *` : name;
  };

  // Track changes to detect unsaved modifications
  const checkForUnsavedChanges = useCallback(() => {
    if (!appState.currentSet) {
      setHasUnsavedChanges(false);
      return;
    }

    const currentState = JSON.stringify({
      set: appState.currentSet,
      flashcard: appState.currentFlashcard
    });

    if (lastSavedState && currentState !== lastSavedState) {
      setHasUnsavedChanges(true);

      // Schedule auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (currentFilePath) {
          handleAutoSave();
        }
      }, 30000); // Auto-save after 30 seconds of inactivity
    } else if (!lastSavedState) {
      // New file, mark as having changes
      setHasUnsavedChanges(true);
    }
  }, [appState.currentSet, appState.currentFlashcard, lastSavedState, currentFilePath]);

  // Save functions - declared early for use in useEffect dependencies
  const handleSave = useCallback(async () => {
    if (!appState.currentSet) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const filePath = await TauriFileService.saveFlashcardSet(appState.currentSet, currentFilePath || undefined);
      setCurrentFilePath(filePath);

      // Update saved state tracking
      const newState = JSON.stringify({
        set: appState.currentSet,
        flashcard: appState.currentFlashcard
      });
      setLastSavedState(newState);
      setHasUnsavedChanges(false);

      // Clear auto-save timeout since we just saved
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      console.log('Flashcard set saved successfully');
    } catch (error) {
      console.error('Error saving flashcard set:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save flashcard set');
    } finally {
      setIsSaving(false);
    }
  }, [appState.currentSet, appState.currentFlashcard, currentFilePath]);

  const handleSaveAs = useCallback(async () => {
    if (!appState.currentSet) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const filePath = await TauriFileService.saveFlashcardSet(appState.currentSet);
      setCurrentFilePath(filePath);

      // Update saved state tracking
      const newState = JSON.stringify({
        set: appState.currentSet,
        flashcard: appState.currentFlashcard
      });
      setLastSavedState(newState);
      setHasUnsavedChanges(false);

      // Clear auto-save timeout since we just saved
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      console.log('Flashcard set saved successfully');
    } catch (error) {
      console.error('Error saving flashcard set:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save flashcard set');
    } finally {
      setIsSaving(false);
    }
  }, [appState.currentSet, appState.currentFlashcard]);

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    if (!appState.currentSet || !currentFilePath || isSaving) return;

    try {
      await TauriFileService.saveFlashcardSet(appState.currentSet, currentFilePath);
      const newState = JSON.stringify({
        set: appState.currentSet,
        flashcard: appState.currentFlashcard
      });
      setLastSavedState(newState);
      setHasUnsavedChanges(false);
      console.log('Auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error for auto-save failures, just log them
    }
  }, [appState.currentSet, appState.currentFlashcard, currentFilePath, isSaving]);

  // Watch for changes
  useEffect(() => {
    checkForUnsavedChanges();
  }, [checkForUnsavedChanges]);

  // Load and calculate ready cards count for spaced repetition
  useEffect(() => {
    const loadReadyCardsCount = async () => {
      if (!appState.currentSet) {
        setReadyCardsCount(0);
        return;
      }

      try {
        const progress = await ProgressService.loadProgress(
          appState.currentSet.id,
          currentFilePath || undefined
        );
        const count = ProgressService.getReadyCardsCount(progress);
        setReadyCardsCount(count);
      } catch (error) {
        console.error('Error loading ready cards count:', error);
        setReadyCardsCount(0);
      }
    };

    loadReadyCardsCount();
  }, [appState.currentSet, currentFilePath]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S (or Cmd+S on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (appState.currentSet) {
          handleSave();
        }
      }

      // Ctrl+Shift+S for Save As
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        if (appState.currentSet) {
          handleSaveAs();
        }
      }

      // Ctrl+O for Open
      if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        setShowFileManager(true);
      }

      // Ctrl+N for New
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        const newSet = TauriFileService.createNewSet();
        appDispatch({ type: 'SET_CURRENT_SET', payload: newSet, filePath: undefined });
        appDispatch({ type: 'SET_EDIT_MODE', payload: 'edit' });
        appDispatch({ type: 'SET_CURRENT_FLASHCARD', payload: null });
        setCurrentFilePath(null);
        setLastSavedState(null);
        setHasUnsavedChanges(true);
      }

      // Phase 4.4: Ctrl+Z for Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          handleUndo();
        }
      }

      // Phase 4.4: Ctrl+Y or Ctrl+Shift+Z for Redo
      if (((event.ctrlKey || event.metaKey) && event.key === 'y') ||
          ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        if (canRedo) {
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState.currentSet, handleSave, handleSaveAs, canUndo, canRedo]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleToolSelect = (tool: string) => {
    appDispatch({ type: 'SET_SELECTED_TOOL', payload: tool as any });
    if (tool === 'add-arrow') {
      canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
    }
  };

  const handleStudyModeSelect = (mode: StudyMode) => {
    // Open study setup dialog with selected mode
    if (appState.currentSet) {
      setSelectedStudyMode(mode);
      setShowStudySetup(true);
    }
  };

  const handleStartStudySession = (session: StudySessionType) => {
    appDispatch({ type: 'START_STUDY_SESSION', payload: session });
    setShowStudySetup(false);
  };

  const handleEndStudySession = () => {
    appDispatch({ type: 'END_STUDY_SESSION' });
  };

  const handleSideSelect = (sideId: string, multiSelect?: boolean) => {
    if (appState.selectedTool === 'add-arrow') {
      if (!canvasState.isCreatingArrow) {
        canvasDispatch({ type: 'START_ARROW_CREATION', payload: sideId });
      }
      return;
    }

    if (sideId === '') {
      canvasDispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    if (multiSelect && canvasState.selectedSideIds.includes(sideId)) {
      canvasDispatch({
        type: 'SELECT_SIDES',
        payload: canvasState.selectedSideIds.filter(id => id !== sideId)
      });
    } else if (multiSelect) {
      canvasDispatch({
        type: 'SELECT_SIDES',
        payload: [...canvasState.selectedSideIds, sideId]
      });
    } else {
      canvasDispatch({
        type: 'SELECT_SIDES',
        payload: [sideId]
      });
    }
  };

  const updateCurrentFlashcard = (updatedFlashcard: Flashcard, skipHistory: boolean = false) => {
    if (!appState.currentSet) return;

    const updatedSet = {
      ...appState.currentSet,
      flashcards: appState.currentSet.flashcards.map(card =>
        card.id === updatedFlashcard.id ? updatedFlashcard : card
      ),
      modifiedAt: new Date()
    };

    appDispatch({ type: 'SET_CURRENT_SET', payload: updatedSet, filePath: currentFilePath || undefined });
    appDispatch({ type: 'UPDATE_FLASHCARD', payload: updatedFlashcard });

    // Push to history (unless this is from undo/redo)
    if (!skipHistory) {
      historyServiceRef.current.pushState(updatedFlashcard);
      updateHistoryButtons();
    }
  };

  // Update undo/redo button states
  const updateHistoryButtons = () => {
    setCanUndo(historyServiceRef.current.canUndo());
    setCanRedo(historyServiceRef.current.canRedo());
  };

  // Phase 4.4: Undo/Redo handlers
  const handleUndo = () => {
    const previousState = historyServiceRef.current.undo();
    if (previousState) {
      updateCurrentFlashcard(previousState, true); // Skip adding to history
      updateHistoryButtons();
    }
  };

  const handleRedo = () => {
    const nextState = historyServiceRef.current.redo();
    if (nextState) {
      updateCurrentFlashcard(nextState, true); // Skip adding to history
      updateHistoryButtons();
    }
  };

  // Initialize history when flashcard changes
  useEffect(() => {
    if (appState.currentFlashcard) {
      // Clear history and push initial state
      historyServiceRef.current.clear();
      historyServiceRef.current.pushState(appState.currentFlashcard);
      updateHistoryButtons();
    }
  }, [appState.currentFlashcard?.id]); // Only when flashcard ID changes

  const handleSideDelete = (sideIds: string[]) => {
    if (!appState.currentFlashcard) return;

    // Remove the sides and all arrows connected to them
    const updatedSides = appState.currentFlashcard.sides.filter(side => !sideIds.includes(side.id));
    const updatedArrows = appState.currentFlashcard.arrows.filter(arrow =>
      !sideIds.includes(arrow.sourceId) && !sideIds.includes(arrow.destinationId)
    );

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      sides: updatedSides,
      arrows: updatedArrows
    };

    updateCurrentFlashcard(updatedFlashcard);

    // Clear selection of deleted sides
    const remainingSideIds = canvasState.selectedSideIds.filter(id => !sideIds.includes(id));
    if (remainingSideIds.length !== canvasState.selectedSideIds.length) {
      canvasDispatch({ type: 'SELECT_SIDES', payload: remainingSideIds });
    }
  };

  const handleArrowDelete = (arrowIds: string[]) => {
    if (!appState.currentFlashcard) return;

    // Remove the arrows
    const updatedArrows = appState.currentFlashcard.arrows.filter(arrow => !arrowIds.includes(arrow.id));

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      arrows: updatedArrows
    };

    updateCurrentFlashcard(updatedFlashcard);

    // Clear selection of deleted arrows
    const remainingArrowIds = canvasState.selectedArrowIds.filter(id => !arrowIds.includes(id));
    if (remainingArrowIds.length !== canvasState.selectedArrowIds.length) {
      canvasDispatch({ type: 'SELECT_ARROWS', payload: remainingArrowIds });
    }
  };

  const handleSideMove = (sideId: string, newPosition: { x: number; y: number }, isComplete?: boolean) => {
    if (!appState.currentFlashcard) return;

    const updatedSides = appState.currentFlashcard.sides.map(side =>
      side.id === sideId ? { ...side, position: newPosition } : side
    );

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      sides: updatedSides,
      modifiedAt: new Date()
    };

    // Only push to history when the move is complete (not intermediate drag positions)
    const skipHistory = !isComplete;
    updateCurrentFlashcard(updatedFlashcard, skipHistory);
  };

  const handleSideTextUpdate = (sideId: string, newText: string) => {
    if (!appState.currentFlashcard) return;

    const updatedSides = appState.currentFlashcard.sides.map(side =>
      side.id === sideId ? { ...side, value: newText } : side
    );

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      sides: updatedSides,
      modifiedAt: new Date()
    };

    updateCurrentFlashcard(updatedFlashcard);
  };

  const handleArrowCreate = (sourceId: string, destinationId: string) => {
    if (!appState.currentFlashcard) return;

    // Check if an arrow already exists between these two sides
    const existingArrow = appState.currentFlashcard.arrows.find(arrow =>
      arrow.sourceId === sourceId && arrow.destinationId === destinationId
    );

    if (existingArrow) {
      // Arrow already exists, just select it and start editing
      canvasDispatch({ type: 'SELECT_ARROWS', payload: [existingArrow.id] });
      setNewArrowForEditing(existingArrow.id);
      canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
      return;
    }

    // Create arrow immediately with empty label
    const newArrow: Arrow = {
      id: generateId(),
      sourceId,
      destinationId,
      label: '', // Start with empty label
      color: '#6c757d'
    };

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      arrows: [...appState.currentFlashcard.arrows, newArrow],
      modifiedAt: new Date()
    };

    updateCurrentFlashcard(updatedFlashcard);

    // Trigger inline editing for the new arrow
    setNewArrowForEditing(newArrow.id);
    canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
  };

  const handleArrowTextUpdate = (arrowId: string, newText: string) => {
    if (!appState.currentFlashcard) return;

    const updatedArrows = appState.currentFlashcard.arrows.map(arrow =>
      arrow.id === arrowId ? { ...arrow, label: newText } : arrow
    );

    const updatedFlashcard = {
      ...appState.currentFlashcard,
      arrows: updatedArrows,
      modifiedAt: new Date()
    };

    updateCurrentFlashcard(updatedFlashcard);
  };

  const handleArrowSelect = (arrowId: string, multiSelect?: boolean) => {
    if (arrowId === '') {
      canvasDispatch({ type: 'CLEAR_SELECTION' });
      return;
    }

    if (multiSelect && canvasState.selectedArrowIds.includes(arrowId)) {
      canvasDispatch({
        type: 'SELECT_ARROWS',
        payload: canvasState.selectedArrowIds.filter(id => id !== arrowId)
      });
    } else if (multiSelect) {
      canvasDispatch({
        type: 'SELECT_ARROWS',
        payload: [...canvasState.selectedArrowIds, arrowId]
      });
    } else {
      canvasDispatch({
        type: 'SELECT_ARROWS',
        payload: [arrowId]
      });
    }
  };

  const [newSideForEditing, setNewSideForEditing] = useState<string | null>(null);
  const [newArrowForEditing, setNewArrowForEditing] = useState<string | null>(null);

  const handleCanvasClick = (position: { x: number; y: number }) => {
    if (appState.selectedTool === 'add-side') {
      if (!appState.currentFlashcard) return;

      const newSide: FlashcardSide = {
        id: generateId(),
        value: '',
        position,
        width: 120,
        height: 80,
        color: '#ffffff',
        fontSize: 14
      };

      const updatedFlashcard = {
        ...appState.currentFlashcard,
        sides: [...appState.currentFlashcard.sides, newSide],
        modifiedAt: new Date()
      };

      updateCurrentFlashcard(updatedFlashcard);

      // Auto-select the new side for immediate editing
      canvasDispatch({ type: 'SELECT_SIDES', payload: [newSide.id] });

      // Trigger immediate text editing
      setNewSideForEditing(newSide.id);
    } else if (appState.selectedTool === 'add-arrow') {
      // Cancel arrow creation
      canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
    }
  };

  const handleCreateFlashcard = () => {
    if (!appState.currentSet) return;

    const newFlashcard: Flashcard = {
      id: generateId(),
      name: `Card ${appState.currentSet.flashcards.length + 1}`,
      sides: [],
      arrows: [],
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    const updatedSet = {
      ...appState.currentSet,
      flashcards: [...appState.currentSet.flashcards, newFlashcard],
      modifiedAt: new Date()
    };

    appDispatch({ type: 'SET_CURRENT_SET', payload: updatedSet, filePath: currentFilePath || undefined });
    appDispatch({ type: 'SET_CURRENT_FLASHCARD', payload: newFlashcard });
    appDispatch({ type: 'SET_EDIT_MODE', payload: 'edit' });
  };

  // Phase 4.5: Duplicate current flashcard as template (same structure, empty values)
  const handleDuplicateAsTemplate = () => {
    if (!appState.currentSet || !appState.currentFlashcard) return;

    // Validate that the flashcard has content to duplicate
    if (appState.currentFlashcard.sides.length === 0) {
      setSaveError('Cannot duplicate empty flashcard. Add at least one side first.');
      return;
    }

    const flashcardName = `Card ${appState.currentSet.flashcards.length + 1}`;
    const newFlashcard = TemplateService.duplicateFlashcardAsTemplate(
      appState.currentFlashcard,
      flashcardName
    );

    // Add flashcard to set
    const updatedSet = {
      ...appState.currentSet,
      flashcards: [...appState.currentSet.flashcards, newFlashcard],
      modifiedAt: new Date()
    };

    appDispatch({ type: 'SET_CURRENT_SET', payload: updatedSet, filePath: currentFilePath || undefined });
    appDispatch({ type: 'SET_CURRENT_FLASHCARD', payload: newFlashcard });
    appDispatch({ type: 'SET_EDIT_MODE', payload: 'edit' });

    console.log('Flashcard duplicated as template:', newFlashcard.name);
  };

  // Phase 4.1: Save current flashcard as template
  const handleSaveAsTemplate = async (templateName: string, description?: string) => {
    if (!appState.currentFlashcard) {
      setSaveError('No flashcard selected to save as template');
      return;
    }

    // Validate that the flashcard has content
    if (appState.currentFlashcard.sides.length === 0) {
      setSaveError('Cannot save empty flashcard as template. Add at least one side first.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Create template from current flashcard
      const template = TemplateService.createTemplateFromFlashcard(
        appState.currentFlashcard,
        templateName,
        description
      );

      // Save template to file
      await TauriFileService.saveTemplate(template);

      // Close dialog
      setShowSaveTemplateDialog(false);

      // Success feedback (you could add a success banner here)
      console.log('Template saved successfully:', template.name);
    } catch (error) {
      console.error('Error saving template:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  // Phase 4.2: Apply template to create new flashcard
  const handleApplyTemplate = (template: FlashcardTemplate) => {
    // Create a new set if one doesn't exist
    let targetSet = appState.currentSet;
    if (!targetSet) {
      targetSet = TauriFileService.createNewSet();
      appDispatch({ type: 'SET_CURRENT_SET', payload: targetSet, filePath: undefined });
      setCurrentFilePath(null);
      setLastSavedState(null);
      setHasUnsavedChanges(true);
    }

    // Apply template to create new flashcard
    const flashcardName = `Card ${targetSet.flashcards.length + 1}`;
    const newFlashcard = TemplateService.applyTemplateToNewFlashcard(
      template,
      flashcardName
    );

    // Add flashcard to set
    const updatedSet = {
      ...targetSet,
      flashcards: [...targetSet.flashcards, newFlashcard],
      modifiedAt: new Date()
    };

    appDispatch({ type: 'SET_CURRENT_SET', payload: updatedSet, filePath: currentFilePath || undefined });
    appDispatch({ type: 'SET_CURRENT_FLASHCARD', payload: newFlashcard });
    appDispatch({ type: 'SET_EDIT_MODE', payload: 'edit' });

    // Close dialogs
    setShowTemplateSelectionDialog(false);
    setShowFileManager(false);

    console.log('Flashcard created from template:', template.name);
  };

  // Flashcard list management handlers
  const handleFlashcardSelect = (flashcard: Flashcard) => {
    appDispatch({ type: 'SET_CURRENT_FLASHCARD', payload: flashcard });
    // Clear canvas selections when switching flashcards
    canvasDispatch({ type: 'CLEAR_SELECTION' });
    canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
  };

  const handleFlashcardDelete = (flashcardId: string) => {
    if (!appState.currentSet) return;

    // Store the current state before deletion for potential undo
    const deletedFlashcard = appState.currentSet.flashcards.find(card => card.id === flashcardId);
    if (!deletedFlashcard) return;

    const deletedIndex = appState.currentSet.flashcards.findIndex(card => card.id === flashcardId);

    const updatedFlashcards = appState.currentSet.flashcards.filter(card => card.id !== flashcardId);
    const updatedSet = {
      ...appState.currentSet,
      flashcards: updatedFlashcards,
      modifiedAt: new Date()
    };

    appDispatch({ type: 'SET_CURRENT_SET', payload: updatedSet, filePath: currentFilePath || undefined });

    // If we deleted the current flashcard, select another one or null
    if (appState.currentFlashcard?.id === flashcardId) {
      const newCurrent = updatedFlashcards.length > 0 ? updatedFlashcards[0] : null;
      appDispatch({ type: 'SET_CURRENT_FLASHCARD', payload: newCurrent });

      // Push the new state to history (or clear if no flashcards remain)
      if (newCurrent) {
        historyServiceRef.current.clear();
        historyServiceRef.current.pushState(newCurrent);
      } else {
        historyServiceRef.current.clear();
      }
      updateHistoryButtons();
    }
  };

  const handleFlashcardRename = (flashcardId: string, newName: string) => {
    if (!appState.currentSet) return;

    const updatedFlashcards = appState.currentSet.flashcards.map(card =>
      card.id === flashcardId ? { ...card, name: newName, modifiedAt: new Date() } : card
    );

    const updatedSet = {
      ...appState.currentSet,
      flashcards: updatedFlashcards,
      modifiedAt: new Date()
    };

    appDispatch({ type: 'SET_CURRENT_SET', payload: updatedSet, filePath: currentFilePath || undefined });

    // Update current flashcard if it's the one being renamed
    if (appState.currentFlashcard?.id === flashcardId) {
      const updatedFlashcard = updatedFlashcards.find(card => card.id === flashcardId);
      if (updatedFlashcard) {
        appDispatch({ type: 'UPDATE_FLASHCARD', payload: updatedFlashcard });
      }
    }
  };

  const handleFlashcardReorder = (fromIndex: number, toIndex: number) => {
    if (!appState.currentSet) return;

    const flashcards = [...appState.currentSet.flashcards];
    const [movedCard] = flashcards.splice(fromIndex, 1);
    flashcards.splice(toIndex, 0, movedCard);

    const updatedSet = {
      ...appState.currentSet,
      flashcards,
      modifiedAt: new Date()
    };

    appDispatch({ type: 'SET_CURRENT_SET', payload: updatedSet, filePath: currentFilePath || undefined });
  };

  const renderMainContent = () => {
    // Debug: console.log('Rendering main content:', { editMode: appState.editMode, hasCurrentSet: !!appState.currentSet });

    if (appState.editMode === 'study' && appState.studySession) {
      return <StudySession onEndSession={handleEndStudySession} flashcardSetFilePath={currentFilePath || undefined} />;
    }

    if (!appState.currentSet) {
      return (
        <div className="welcome-screen">
          <h2>Welcome to Extended Flashcards</h2>
          <p>Create a new flashcard set or open an existing one to get started.</p>
          <button onClick={() => setShowFileManager(true)}>
            Open File Manager
          </button>
        </div>
      );
    }

    if (!appState.currentFlashcard && appState.currentSet.flashcards.length === 0) {
      return (
        <div className="empty-set">
          <h2>{getDisplayName()}</h2>
          <p>This set is empty. Create your first flashcard to get started.</p>
          <button onClick={handleCreateFlashcard}>
            Create First Flashcard
          </button>
        </div>
      );
    }

    return (
      <div className="editor-interface">
        <div className="main-editor-area">
          <div className="toolbar-container">
            <CanvasToolbar
              selectedTool={appState.selectedTool}
              onToolSelect={handleToolSelect}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onZoomIn={() => canvasDispatch({ type: 'SET_ZOOM', payload: Math.min(5, canvasState.zoom + 0.2) })}
              onZoomOut={() => canvasDispatch({ type: 'SET_ZOOM', payload: Math.max(0.1, canvasState.zoom - 0.2) })}
              onZoomReset={() => {
                canvasDispatch({ type: 'SET_ZOOM', payload: 1 });
                canvasDispatch({ type: 'SET_PAN_OFFSET', payload: { x: 0, y: 0 } });
              }}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </div>

          <div className="canvas-container">
            {appState.currentFlashcard && (
              <FlashcardCanvas
                flashcard={appState.currentFlashcard}
                canvasState={canvasState}
                selectedTool={appState.selectedTool}
                onSideSelect={handleSideSelect}
                onSideMove={handleSideMove}
                onSideTextUpdate={handleSideTextUpdate}
                onSideDelete={handleSideDelete}
                onArrowCreate={handleArrowCreate}
                onArrowTextUpdate={handleArrowTextUpdate}
                onArrowSelect={handleArrowSelect}
                onArrowDelete={handleArrowDelete}
                onCanvasClick={handleCanvasClick}
                onZoomChange={(newZoom) => canvasDispatch({ type: 'SET_ZOOM', payload: newZoom })}
                onPanChange={(newOffset) => canvasDispatch({ type: 'SET_PAN_OFFSET', payload: newOffset })}
                newSideForEditing={newSideForEditing}
                newArrowForEditing={newArrowForEditing}
                onEditingComplete={() => {
                  setNewSideForEditing(null);
                  setNewArrowForEditing(null);
                }}
              />
            )}
          </div>
        </div>

        <div className="side-panel">
          <FlashcardListPanel
            flashcards={appState.currentSet.flashcards}
            currentFlashcardId={appState.currentFlashcard?.id}
            onFlashcardSelect={handleFlashcardSelect}
            onFlashcardDelete={handleFlashcardDelete}
            onFlashcardRename={handleFlashcardRename}
            onFlashcardReorder={handleFlashcardReorder}
            onCreateFlashcard={handleCreateFlashcard}
            onDuplicateStructure={handleDuplicateAsTemplate}
            canDuplicate={!!appState.currentFlashcard && appState.currentFlashcard.sides.length > 0}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="main-layout">
      <header className="app-header">
        <h1>Extended Flashcards</h1>
        <div className="header-actions">
          <button onClick={() => setShowFileManager(true)}>
            File Manager
          </button>
          {appState.currentSet && (
            <>
              <button
                onClick={() => {
                  setSelectedStudyMode('self-test');
                  setShowStudySetup(true);
                }}
                disabled={appState.currentSet.flashcards.length === 0}
                className="start-study-button"
                title="Start Study Session"
              >
                Start Study
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="save-button"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleSaveAs}
                disabled={isSaving}
                className="save-as-button"
              >
                Save As...
              </button>
              <button
                onClick={() => setShowSaveTemplateDialog(true)}
                disabled={!appState.currentFlashcard || appState.currentFlashcard.sides.length === 0}
                className="save-template-button"
              >
                Save as Template
              </button>
              <button
                onClick={handleDuplicateAsTemplate}
                disabled={!appState.currentFlashcard || appState.currentFlashcard.sides.length === 0}
                className="duplicate-template-button"
              >
                Duplicate Structure
              </button>
              <span className="current-set">{getDisplayName()}</span>
            </>
          )}
        </div>
      </header>

      {saveError && (
        <div className="error-banner">
          <span>Error saving file: {saveError}</span>
          <button onClick={() => setSaveError(null)}>×</button>
        </div>
      )}

      <main className="app-main">
        {renderMainContent()}
      </main>

      {showFileManager && (
        <FileManager
          onClose={() => setShowFileManager(false)}
          onFileOpened={(filePath, set) => {
            setCurrentFilePath(filePath);
            // Clear canvas selections when opening a new file
            canvasDispatch({ type: 'CLEAR_SELECTION' });
            canvasDispatch({ type: 'FINISH_ARROW_CREATION' });
            // Set saved state when file is opened
            const state = JSON.stringify({
              set,
              flashcard: set.flashcards.length > 0 ? set.flashcards[0] : null
            });
            setLastSavedState(state);
            setHasUnsavedChanges(false);
          }}
          onNewFromTemplate={() => {
            setShowFileManager(false);
            setShowTemplateSelectionDialog(true);
          }}
        />
      )}

      {showStudySetup && appState.currentSet && (
        <div className="modal-overlay">
          <StudySetup
            flashcardSet={appState.currentSet}
            initialMode={selectedStudyMode}
            onStartSession={handleStartStudySession}
            onCancel={() => setShowStudySetup(false)}
            flashcardSetFilePath={currentFilePath || undefined}
          />
        </div>
      )}

      {showSaveTemplateDialog && (
        <SaveTemplateDialog
          onSave={handleSaveAsTemplate}
          onCancel={() => setShowSaveTemplateDialog(false)}
        />
      )}

      {showTemplateSelectionDialog && (
        <TemplateSelectionDialog
          onSelectTemplate={handleApplyTemplate}
          onCancel={() => setShowTemplateSelectionDialog(false)}
        />
      )}

    </div>
  );
};