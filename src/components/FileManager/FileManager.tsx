import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FileMetadata } from '../../types';
import { TauriFileService } from '../../services/TauriFileService';
import { isWeb } from '../../utils/environmentDetection';

interface FileManagerProps {
  onClose: () => void;
  onFileOpened?: (filePath: string, set: any) => void;
  onNewFromTemplate?: () => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ onClose, onFileOpened, onNewFromTemplate }) => {
  const { dispatch } = useApp();
  const [recentFiles, setRecentFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const loadRecentFiles = async () => {
    try {
      const files = await TauriFileService.getRecentFiles();
      // In web version, don't show recent files since they can't be opened by path
      const isWebEnvironment = await isWeb();
      setRecentFiles(isWebEnvironment ? [] : files);
    } catch (err) {
      console.error('Error loading recent files:', err);
      setError('Failed to load recent files');
    }
  };

  const handleOpenFile = async (specificFilePath?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let set;
      let openedFilePath;

      if (specificFilePath) {
        // Open specific file by path (from recent files)
        set = await TauriFileService.openFlashcardSetByPath(specificFilePath);
        openedFilePath = specificFilePath;
      } else {
        // Open file via dialog
        const result = await TauriFileService.openFlashcardSet();
        if (result) {
          set = result.set;
          openedFilePath = result.filePath;
        }
      }

      if (set) {
        dispatch({ type: 'SET_CURRENT_SET', payload: set, filePath: openedFilePath });
        dispatch({ type: 'SET_EDIT_MODE', payload: 'edit' });

        // Always clear current flashcard first, then set the new one if available
        dispatch({ type: 'SET_CURRENT_FLASHCARD', payload: null });

        if (set.flashcards.length > 0) {
          dispatch({ type: 'SET_CURRENT_FLASHCARD', payload: set.flashcards[0] });
        }

        // Call the onFileOpened callback to update file path and other state
        if (openedFilePath && onFileOpened) {
          onFileOpened(openedFilePath, set);
        }
        onClose();
      }
    } catch (err) {
      console.error('Error opening file:', err);
      setError(err instanceof Error ? err.message : 'Failed to open file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    const newSet = TauriFileService.createNewSet();
    dispatch({ type: 'SET_CURRENT_SET', payload: newSet, filePath: undefined });
    dispatch({ type: 'SET_EDIT_MODE', payload: 'edit' });
    // Clear current flashcard when creating a new set
    dispatch({ type: 'SET_CURRENT_FLASHCARD', payload: null });
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  };

  return (
    <div className="file-manager-overlay">
      <div className="file-manager">
        <header className="file-manager-header">
          <h2>File Manager</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </header>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="file-manager-content">
          <section className="file-actions">
            <button
              className="primary-button"
              onClick={handleCreateNew}
              disabled={isLoading}
            >
              Create New Set
            </button>
            <button
              className="secondary-button"
              onClick={() => handleOpenFile()}
              disabled={isLoading}
            >
              {isLoading ? 'Opening...' : 'Open File...'}
            </button>
            <button
              className="template-button"
              onClick={() => {
                if (onNewFromTemplate) {
                  onNewFromTemplate();
                }
              }}
              disabled={isLoading}
            >
              New from Template...
            </button>
          </section>

          <section className="recent-files">
            <h3>Recent Files</h3>
            {recentFiles.length === 0 ? (
              <p className="empty-state">No recent files</p>
            ) : (
              <div className="file-list">
                {recentFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-details">
                        <span className="file-type">{file.type}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                        <span className="file-date">{formatDate(file.lastModified)}</span>
                      </div>
                    </div>
                    <button
                      className="open-file-button"
                      onClick={() => handleOpenFile(file.path)}
                      disabled={isLoading}
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};