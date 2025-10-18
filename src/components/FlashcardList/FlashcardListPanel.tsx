import { useState } from 'react';
import { Flashcard } from '../../types';

interface FlashcardListPanelProps {
  flashcards: Flashcard[];
  currentFlashcardId?: string;
  onFlashcardSelect: (flashcard: Flashcard) => void;
  onFlashcardDelete: (flashcardId: string) => void;
  onFlashcardRename: (flashcardId: string, newName: string) => void;
  onFlashcardReorder: (fromIndex: number, toIndex: number) => void;
  onCreateFlashcard: () => void;
  onDuplicateStructure: () => void;
  canDuplicate: boolean;
}

export const FlashcardListPanel: React.FC<FlashcardListPanelProps> = ({
  flashcards,
  currentFlashcardId,
  onFlashcardSelect,
  onFlashcardDelete,
  onFlashcardRename,
  onFlashcardReorder,
  onCreateFlashcard,
  onDuplicateStructure,
  canDuplicate
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleStartEditing = (flashcard: Flashcard) => {
    setEditingId(flashcard.id);
    setEditingName(flashcard.name);
  };

  const handleFinishEditing = (flashcardId: string) => {
    if (editingName.trim() !== '') {
      onFlashcardRename(flashcardId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Visual feedback could be added here
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    onFlashcardReorder(draggedIndex, index);
    setDraggedIndex(null);
  };

  return (
    <div className="flashcard-list-panel">
      <div className="flashcard-list-header">
        <h3>Flashcards</h3>
        <div className="flashcard-list-actions">
          <button
            className="duplicate-structure-panel-button"
            onClick={onDuplicateStructure}
            disabled={!canDuplicate}
            title="Duplicate current flashcard structure"
          >
            Duplicate
          </button>
          <button
            className="new-flashcard-button"
            onClick={onCreateFlashcard}
            title="Create New Flashcard"
          >
            + New
          </button>
        </div>
      </div>

      <div className="flashcard-list">
        {flashcards.length === 0 ? (
          <div className="empty-list-message">
            <p>No flashcards yet</p>
            <p className="hint">Click "+ New" to create one</p>
          </div>
        ) : (
          flashcards.map((flashcard, index) => (
            <div
              key={flashcard.id}
              className={`flashcard-list-item ${currentFlashcardId === flashcard.id ? 'active' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onClick={() => onFlashcardSelect(flashcard)}
            >
              <div className="flashcard-index">{index + 1}</div>

              {editingId === flashcard.id ? (
                <input
                  type="text"
                  className="flashcard-name-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleFinishEditing(flashcard.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleFinishEditing(flashcard.id);
                    } else if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditingName('');
                    }
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div
                  className="flashcard-name"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleStartEditing(flashcard);
                  }}
                >
                  {flashcard.name}
                </div>
              )}

              <button
                className="flashcard-delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFlashcardDelete(flashcard.id);
                }}
                title="Delete Flashcard"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
