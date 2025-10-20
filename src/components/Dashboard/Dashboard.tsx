import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Dashboard.css';

interface DashboardStats {
  total_characters: number;
  introduced_characters: number;
  mastered_characters: number;
  due_for_review: number;
  available_to_learn: number;
  hours_until_next_unlock: number | null;
}

interface DashboardProps {
  onStartLearnNew: () => void;
  onStartSrsSession: () => void;
  onStartSelfStudy: () => void;
  onBrowseDictionary: () => void;
}

function Dashboard({ onStartLearnNew, onStartSrsSession, onStartSelfStudy, onBrowseDictionary }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');

      // Check and unlock characters automatically
      const unlockStatus = await invoke<{
        unlocked_count: number;
        ready_to_learn_count: number;
        hours_until_next_unlock: number | null;
      }>('check_and_unlock_characters');

      // Get SRS statistics
      const dueCards = await invoke<any[]>('get_due_cards_for_review');

      console.log('Unlock status:', unlockStatus);

      // For now, we'll use placeholder data for other stats
      // These will be implemented in Task 1.13
      const stats: DashboardStats = {
        total_characters: 11008,
        introduced_characters: 0, // Will be fetched from DB
        mastered_characters: 0, // Will be calculated based on SRS data
        due_for_review: dueCards.length,
        available_to_learn: unlockStatus.ready_to_learn_count,
        hours_until_next_unlock: unlockStatus.hours_until_next_unlock,
      };

      setStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setError(`Failed to load statistics: ${error}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={loadStats} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">欢迎 Welcome!</h1>
        <p className="dashboard-subtitle">
          Continue your Chinese learning journey
        </p>
      </div>

      {/* Primary Action Cards */}
      <div className="primary-actions">
        <div className="action-card learn-new" onClick={stats?.available_to_learn && stats.available_to_learn > 0 ? onStartLearnNew : undefined}>
          <div className="action-icon">📚</div>
          <h2 className="action-title">Learn New</h2>
          <p className="action-description">
            Introduce new characters and words
          </p>
          <div className="action-stat">
            <span className="stat-number">{stats?.available_to_learn || 0}</span>
            <span className="stat-label">available</span>
          </div>
          {stats?.hours_until_next_unlock !== null && stats?.hours_until_next_unlock !== undefined && stats.available_to_learn === 0 && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#667eea'
            }}>
              {stats.hours_until_next_unlock === 0 ? (
                '✨ New characters available soon!'
              ) : (
                `⏰ Next unlock in ${stats.hours_until_next_unlock}h`
              )}
            </div>
          )}
          <button
            className="action-button"
            disabled={stats?.available_to_learn === 0}
          >
            {stats?.available_to_learn === 0 ? 'No Characters Ready' : 'Start Learning'}
          </button>
        </div>

        <div
          className={`action-card review-srs ${stats?.due_for_review === 0 ? 'disabled' : ''}`}
          onClick={stats?.due_for_review && stats.due_for_review > 0 ? onStartSrsSession : undefined}
        >
          <div className="action-icon">🔄</div>
          <h2 className="action-title">Review</h2>
          <p className="action-description">
            Practice due cards with SRS
          </p>
          <div className="action-stat">
            <span className="stat-number">{stats?.due_for_review || 0}</span>
            <span className="stat-label">due cards</span>
          </div>
          <button
            className="action-button"
            disabled={stats?.due_for_review === 0}
          >
            {stats?.due_for_review === 0 ? 'All Caught Up!' : 'Start Review'}
          </button>
        </div>
      </div>

      {/* Additional Study Options */}
      <div className="additional-options">
        <h3 className="section-title">Additional Study Options</h3>
        <div className="options-grid">
          <button className="option-button" onClick={onStartSelfStudy}>
            <span className="option-icon">📖</span>
            <span className="option-label">Self-Study</span>
          </button>

          <button className="option-button" onClick={onBrowseDictionary}>
            <span className="option-icon">📕</span>
            <span className="option-label">Dictionary</span>
          </button>

          <button className="option-button" disabled>
            <span className="option-icon">⚙️</span>
            <span className="option-label">Settings</span>
            <span className="option-badge">Coming Soon</span>
          </button>
        </div>
      </div>

      {/* Progress Statistics */}
      <div className="progress-section">
        <h3 className="section-title">📊 Your Progress</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.introduced_characters || 0}</div>
              <div className="stat-name">Characters Introduced</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.mastered_characters || 0}</div>
              <div className="stat-name">Mastered</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.total_characters.toLocaleString()}</div>
              <div className="stat-name">Total Available</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-value">0</div>
              <div className="stat-name">Day Streak</div>
            </div>
          </div>
        </div>

        <div className="progress-note">
          <p>📈 Detailed statistics will be available in Task 1.13</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
