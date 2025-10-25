import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Dictionary.css';

interface CharacterWithProgress {
  id: number;
  character: string;
  simplified: string;
  traditional: string | null;
  mandarin_pinyin: string;
  definition: string;
  frequency_rank: number;
  is_word: boolean;
  component_characters: string | null;
  introduction_score: number;
  // Progress fields
  introduced: boolean | null;
  times_reviewed: number | null;
  times_correct: number | null;
  times_incorrect: number | null;
  current_interval_days: number | null;
  next_review_date: string | null;
}

interface DictionaryProps {
  onClose: () => void;
}

function Dictionary({ onClose }: DictionaryProps) {
  const [characters, setCharacters] = useState<CharacterWithProgress[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const PAGE_SIZE = 50;

  useEffect(() => {
    loadTotalCount();
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [currentPage]);

  const loadTotalCount = async () => {
    try {
      const count = await invoke<number>('get_total_items_count');
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to load total count:', error);
    }
  };

  const loadCharacters = async () => {
    try {
      setLoading(true);
      setError('');

      const offset = currentPage * PAGE_SIZE;
      const chars = await invoke<CharacterWithProgress[]>('browse_introduction_order', {
        offset,
        limit: PAGE_SIZE,
      });

      setCharacters(chars);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load characters:', error);
      setError(`Failed to load characters: ${error}`);
      setLoading(false);
    }
  };

  const getProgressStatus = (char: CharacterWithProgress): string => {
    if (!char.introduced) {
      return 'Not Started';
    }
    if (char.times_reviewed === 0) {
      return 'New';
    }
    if (char.times_correct && char.times_reviewed) {
      const accuracy = Math.round((char.times_correct / char.times_reviewed) * 100);
      return `${accuracy}% (${char.times_reviewed} reviews)`;
    }
    return 'Learning';
  };

  const getProgressColor = (char: CharacterWithProgress): string => {
    if (!char.introduced) return '#ccc';
    if (!char.times_correct || !char.times_reviewed) return '#667eea';

    const accuracy = (char.times_correct / char.times_reviewed) * 100;
    if (accuracy >= 80) return '#48bb78';
    if (accuracy >= 60) return '#ecc94b';
    return '#f56565';
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="dictionary-container">
      <div className="dictionary-header">
        <h1 className="dictionary-title">📕 Dictionary (Introduction Order)</h1>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="dictionary-stats">
        <span>Total Items: {totalCount.toLocaleString()} (Characters + Words)</span>
        <span>Page {currentPage + 1} of {totalPages}</span>
      </div>

      {error && (
        <div className="dictionary-error">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="dictionary-loading">
          <div className="loading-spinner"></div>
          <p>Loading characters...</p>
        </div>
      ) : (
        <>
          <div className="characters-list">
            {characters.map((char) => (
              <div key={char.id} className="character-card">
                <div className="character-main">
                  <div className="character-display">{char.character}</div>
                  <div className="character-info">
                    <div className="character-pinyin">{char.mandarin_pinyin}</div>
                    <div className="character-definition">{char.definition}</div>
                    <div className="character-meta">
                      <span className="frequency-badge">
                        {char.is_word ? '📝 Word' : '📖 Character'}
                      </span>
                      <span className="frequency-badge">
                        Rank #{char.frequency_rank}
                      </span>
                      <span className="frequency-badge">
                        Score: {char.introduction_score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="character-progress">
                  <div
                    className="progress-indicator"
                    style={{ backgroundColor: getProgressColor(char) }}
                  >
                    {getProgressStatus(char)}
                  </div>
                  {char.next_review_date && (
                    <div className="next-review">
                      Next: {new Date(char.next_review_date + 'Z').toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Showing {currentPage * PAGE_SIZE + 1} - {Math.min((currentPage + 1) * PAGE_SIZE, totalCount)}
            </span>
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Dictionary;
