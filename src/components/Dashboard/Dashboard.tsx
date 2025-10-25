import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Dashboard.css';

interface DashboardStats {
  total_characters_learned: number;
  characters_in_srs: number;
  cards_due_today: number;
  mastered_characters: number;
  study_streak_days: number;
}

interface StudySession {
  id: number;
  mode: string;
  started_at: string;
  ended_at: string | null;
  cards_studied: number;
  cards_correct: number;
  cards_incorrect: number;
  duration_seconds: number | null;
}

interface ReviewCalendarEntry {
  review_time: string; // Full datetime in half-hour blocks (YYYY-MM-DD HH:MM:SS)
  cards_due: number;
}


interface DashboardProps {
  onStartLearnNew: () => void;
  onStartSrsSession: () => void;
  onStartSelfStudy: () => void;
  onBrowseDictionary: () => void;
}

function Dashboard({ onStartLearnNew, onStartSrsSession, onStartSelfStudy, onBrowseDictionary }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [unlockStatus, setUnlockStatus] = useState<{
    ready_to_learn_count: number;
    hours_until_next_unlock: number | null;
  } | null>(null);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [calendar, setCalendar] = useState<ReviewCalendarEntry[]>([]);
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

      // Get dashboard statistics
      const dashboardStats = await invoke<DashboardStats>('get_dashboard_stats');

      // Get recent study sessions
      const sessions = await invoke<StudySession[]>('get_recent_sessions', { limit: 10 });

      // Get review calendar (next 7 days)
      const calendarData = await invoke<ReviewCalendarEntry[]>('get_review_calendar', { days: 7 });

      console.log('Dashboard stats:', dashboardStats);
      console.log('Recent sessions:', sessions);
      console.log('Review calendar:', calendarData);
      console.log('Unlock status:', unlockStatus);

      setStats(dashboardStats);
      setUnlockStatus(unlockStatus);
      setRecentSessions(sessions);
      setCalendar(calendarData);
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
        <div className="action-card learn-new" onClick={unlockStatus?.ready_to_learn_count && unlockStatus.ready_to_learn_count > 0 ? onStartLearnNew : undefined}>
          <div className="action-icon">📚</div>
          <h2 className="action-title">Learn New</h2>
          <p className="action-description">
            Introduce new characters and words
          </p>
          <div className="action-stat">
            <span className="stat-number">{unlockStatus?.ready_to_learn_count || 0}</span>
            <span className="stat-label">available</span>
          </div>
          {unlockStatus?.hours_until_next_unlock !== null && unlockStatus?.hours_until_next_unlock !== undefined && unlockStatus.ready_to_learn_count === 0 && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#667eea'
            }}>
              {unlockStatus.hours_until_next_unlock === 0 ? (
                '✨ New characters available soon!'
              ) : (
                `⏰ Next unlock in ${unlockStatus.hours_until_next_unlock}h`
              )}
            </div>
          )}
          <button
            className="action-button"
            disabled={unlockStatus?.ready_to_learn_count === 0}
          >
            {unlockStatus?.ready_to_learn_count === 0 ? 'No Characters Ready' : 'Start Learning'}
          </button>
        </div>

        <div
          className={`action-card review-srs ${stats?.cards_due_today === 0 ? 'disabled' : ''}`}
          onClick={stats?.cards_due_today && stats.cards_due_today > 0 ? onStartSrsSession : undefined}
        >
          <div className="action-icon">🔄</div>
          <h2 className="action-title">Review</h2>
          <p className="action-description">
            Practice due cards with SRS
          </p>
          <div className="action-stat">
            <span className="stat-number">{stats?.cards_due_today || 0}</span>
            <span className="stat-label">due cards</span>
          </div>
          <button
            className="action-button"
            disabled={stats?.cards_due_today === 0}
          >
            {stats?.cards_due_today === 0 ? 'All Caught Up!' : 'Start Review'}
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
              <div className="stat-value">{stats?.total_characters_learned || 0}</div>
              <div className="stat-name">Characters Learned</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.characters_in_srs || 0}</div>
              <div className="stat-name">In SRS Pool</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.cards_due_today || 0}</div>
              <div className="stat-name">Due Today</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.study_streak_days || 0}</div>
              <div className="stat-name">Day Streak</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.mastered_characters || 0}</div>
              <div className="stat-name">Mastered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Calendar */}
      {calendar.length > 0 && (
        <div className="calendar-section">
          <h3 className="section-title">📅 Upcoming Reviews (Next 7 Days)</h3>
          <div className="calendar-grid">
            {calendar.map((entry) => {
              // Parse SQLite UTC datetime as UTC (already in half-hour blocks from backend)
              // SQLite format: "YYYY-MM-DD HH:MM:SS" (stored in UTC)
              const reviewTime = new Date(entry.review_time + 'Z'); // Add 'Z' to explicitly mark as UTC

              const isToday = reviewTime.toDateString() === new Date().toDateString();

              // Format time in 12-hour format with AM/PM in user's local timezone
              // Now includes minutes (will be :00 or :30 due to backend rounding)
              const timeString = reviewTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });

              return (
                <div key={entry.review_time} className={`calendar-day ${isToday ? 'today' : ''}`}>
                  <div className="calendar-date">
                    {reviewTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="calendar-time">{timeString}</div>
                  <div className="calendar-count">{entry.cards_due}</div>
                  <div className="calendar-label">cards</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Study Sessions */}
      {recentSessions.length > 0 && (
        <div className="sessions-section">
          <h3 className="section-title">📖 Recent Study Sessions</h3>
          <div className="sessions-list">
            {recentSessions.map((session) => {
              // Parse SQLite UTC datetime as UTC by adding 'Z' suffix
              const startedAtUTC = new Date(session.started_at + 'Z');

              return (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <span className="session-mode">
                      {session.mode === 'spaced_repetition' ? '🔄 SRS Review' :
                       session.mode === 'self-study' ? '📖 Self-Study' :
                       `📚 ${session.mode}`}
                    </span>
                    <span className="session-date">
                      {startedAtUTC.toLocaleDateString()} {startedAtUTC.toLocaleTimeString()}
                    </span>
                  </div>
                <div className="session-stats">
                  <span className="session-stat">
                    {session.cards_studied} cards
                  </span>
                  <span className="session-stat session-accuracy">
                    {session.cards_studied > 0
                      ? Math.round((session.cards_correct / session.cards_studied) * 100)
                      : 0}% accuracy
                  </span>
                  {session.duration_seconds && (
                    <span className="session-stat">
                      {Math.round(session.duration_seconds / 60)} min
                    </span>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
