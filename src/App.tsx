import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import IntroductionScreen from './components/Introduction/IntroductionScreen';
import SpacedRepetition from './components/Study/SpacedRepetition';
import './App.css'

interface Character {
  id: number;
  character: string;
  simplified: string;
  traditional: string | null;
  mandarin_pinyin: string;
  definition: string;
  frequency_rank: number;
  is_word: boolean;
}

interface DueCard {
  character_id: number;
  character: string;
  pinyin: string;
  definition: string;
  current_interval: number;
  times_reviewed: number;
}

function App() {
  const [dbStatus, setDbStatus] = useState<string>('Testing...');
  const [topChars, setTopChars] = useState<Character[]>([]);
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [srsStatus, setSrsStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [newCharacter, setNewCharacter] = useState<Character | null>(null);
  const [showSrsSession, setShowSrsSession] = useState(false);

  useEffect(() => {
    testDatabase();
    testSrsCommands();
  }, []);

  const testDatabase = async () => {
    try {
      setError('');
      const status = await invoke<string>('test_database_connection');
      setDbStatus(status);

      const chars = await invoke<Character[]>('get_top_characters', { limit: 10 });
      setTopChars(chars);
    } catch (error) {
      const errorMsg = `Error: ${error}`;
      setDbStatus('Connection failed');
      setError(errorMsg);
      console.error(errorMsg);
    }
  };

  const testSrsCommands = async () => {
    try {
      // Get due cards
      const cards = await invoke<DueCard[]>('get_due_cards_for_review');
      setDueCards(cards);
      setSrsStatus(`Found ${cards.length} cards due for review`);
      console.log('Due cards:', cards);
    } catch (error) {
      setSrsStatus(`SRS Error: ${error}`);
      console.error('SRS test error:', error);
    }
  };

  const submitAnswer = async (characterId: number, correct: boolean) => {
    try {
      const unlockedNew = await invoke<boolean>('submit_srs_answer', {
        characterId,
        correct,
      });

      if (unlockedNew) {
        const newChar = await invoke<Character>('unlock_new_character');
        console.log('Unlocked new character:', newChar);

        if (newChar) {
          setNewCharacter(newChar);
          setShowIntroduction(true);
          setSrsStatus(`Reached 1 week! New character unlocked`);
        }
      } else {
        setSrsStatus(`Answer ${correct ? 'correct' : 'incorrect'} - updated interval`);
      }

      // Refresh due cards
      testSrsCommands();
    } catch (error) {
      setSrsStatus(`Error submitting answer: ${error}`);
    }
  };

  const testIntroductionScreen = async () => {
    try {
      // Get a character to test introduction with
      const char = await invoke<Character>('get_character', { id: 1 });
      setNewCharacter(char);
      setShowIntroduction(true);
    } catch (error) {
      console.error('Failed to load test character:', error);
    }
  };

  const handleIntroductionComplete = () => {
    setShowIntroduction(false);
    setNewCharacter(null);
    setSrsStatus('Character introduced! Now available for review.');
    testSrsCommands(); // Refresh due cards
  };

  const startSrsSession = () => {
    setShowSrsSession(true);
  };

  const handleSrsComplete = () => {
    setShowSrsSession(false);
    setSrsStatus('SRS session completed!');
    testSrsCommands(); // Refresh due cards
  };

  const handleNewCharacterUnlocked = (char: Character) => {
    setNewCharacter(char);
    setShowSrsSession(false);
    setShowIntroduction(true);
  };

  const introduceMultiple = async () => {
    try {
      const result = await invoke<string>('introduce_multiple_characters', { count: 10 });
      setSrsStatus(result);
      testSrsCommands(); // Refresh due cards
    } catch (error) {
      setSrsStatus(`Error: ${error}`);
    }
  };

  // Show SRS session if active
  if (showSrsSession) {
    return (
      <SpacedRepetition
        onComplete={handleSrsComplete}
        onNewCharacterUnlocked={handleNewCharacterUnlocked}
      />
    );
  }

  // Show introduction screen if active
  if (showIntroduction && newCharacter) {
    return (
      <IntroductionScreen
        character={newCharacter}
        onComplete={handleIntroductionComplete}
        totalCharacters={11008}
      />
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Chinese Learning Tool - Database Test</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={testIntroductionScreen}
          style={{
            padding: '12px 24px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          🎯 Test Introduction Screen
        </button>
        <button
          onClick={startSrsSession}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          📚 Start SRS Session
        </button>
        <button
          onClick={introduceMultiple}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          ⚡ Introduce 10 Characters
        </button>
      </div>

      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: error ? '#ffe6e6' : '#e6ffe6',
        borderRadius: '5px',
        border: `1px solid ${error ? '#ffcccc' : '#ccffcc'}`
      }}>
        <p style={{ margin: 0 }}>
          <strong>Status:</strong> {dbStatus}
        </p>
        {error && (
          <p style={{ margin: '10px 0 0 0', color: '#cc0000' }}>
            {error}
          </p>
        )}
      </div>

      <h2>Top 10 Most Frequent Characters</h2>

      {topChars.length > 0 ? (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #ddd'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Rank</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Character</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Pinyin</th>
              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Definition</th>
            </tr>
          </thead>
          <tbody>
            {topChars.map((char) => (
              <tr key={char.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{char.frequency_rank}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '24px', fontWeight: 'bold' }}>
                  {char.character}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{char.mandarin_pinyin}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{char.definition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Loading characters...</p>
      )}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
        <h3>Database Integration Test</h3>
        <ul style={{ textAlign: 'left' }}>
          <li>{dbStatus.includes('connected') ? '✅' : '⏳'} Database connection established</li>
          <li>{topChars.length === 10 ? '✅' : '⏳'} Top 10 characters loaded</li>
          <li>{topChars.length > 0 && topChars[0].character ? '✅' : '⏳'} Character data populated</li>
          <li>{!error ? '✅' : '❌'} No errors</li>
        </ul>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e6f3ff', borderRadius: '5px' }}>
        <h2>SRS System Test</h2>
        <p><strong>Status:</strong> {srsStatus}</p>

        <h3>Cards Due for Review ({dueCards.length})</h3>
        {dueCards.length > 0 ? (
          <div>
            {dueCards.slice(0, 5).map((card) => (
              <div key={card.character_id} style={{
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: 'white',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {card.character}
                </div>
                <div><strong>Pinyin:</strong> {card.pinyin}</div>
                <div><strong>Definition:</strong> {card.definition}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Interval: {card.current_interval.toFixed(4)} days | Reviewed: {card.times_reviewed} times
                </div>
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => submitAnswer(card.character_id, true)}
                    style={{
                      padding: '8px 16px',
                      marginRight: '10px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Correct
                  </button>
                  <button
                    onClick={() => submitAnswer(card.character_id, false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ✗ Incorrect
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No cards due for review. All caught up!</p>
        )}
      </div>
    </div>
  );
}

export default App;
