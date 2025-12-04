import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserStats.css';

const UserStats = () => {
  const { userProfile, currentUser } = useAuth();
  const stats = userProfile?.stats || {};

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getXPProgress = () => {
    const xp = stats.xpPoints || 0;
    const currentLevelXP = ((stats.level || 1) - 1) * 100;
    const nextLevelXP = (stats.level || 1) * 100;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getLevelTitle = (level) => {
    if (level >= 50) return 'Master';
    if (level >= 30) return 'Expert';
    if (level >= 20) return 'Advanced';
    if (level >= 10) return 'Intermediate';
    if (level >= 5) return 'Beginner';
    return 'Novice';
  };

  return (
    <div className="user-stats-container">
      {/* User Profile Header */}
      <div className="stats-header">
        <div className="user-avatar">
          <div className="avatar-circle">
            {currentUser?.displayName?.charAt(0)?.toUpperCase() || 
             currentUser?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="level-badge">Lv.{stats.level || 1}</div>
        </div>
        <div className="user-info">
          <h2>{userProfile?.displayName || currentUser?.email?.split('@')[0] || 'User'}</h2>
          <p className="level-title">{getLevelTitle(stats.level || 1)}</p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="xp-section">
        <div className="xp-header">
          <span className="xp-label">Experience Points</span>
          <span className="xp-value">{stats.xpPoints || 0} XP</span>
        </div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${getXPProgress()}%` }}></div>
        </div>
        <p className="xp-next">
          {100 - ((stats.xpPoints || 0) % 100)} XP until Level {(stats.level || 1) + 1}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card streak">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.streakDays || 0}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>

        <div className="stat-card tasks">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.tasksCompleted || 0}</div>
            <div className="stat-label">Tasks Done</div>
          </div>
        </div>

        <div className="stat-card typing">
          <div className="stat-icon">⌨️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageWPM || 0}</div>
            <div className="stat-label">Avg WPM</div>
          </div>
        </div>

        <div className="stat-card reading">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{(stats.wordsRead || 0).toLocaleString()}</div>
            <div className="stat-label">Words Read</div>
          </div>
        </div>

        <div className="stat-card time">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{formatTime(stats.readingTime || 0)}</div>
            <div className="stat-label">Reading Time</div>
          </div>
        </div>

        <div className="stat-card journal">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalJournalEntries || 0}</div>
            <div className="stat-label">Journal Entries</div>
          </div>
        </div>
      </div>

      {/* Achievements Preview */}
      <div className="achievements-section">
        <h3>Recent Achievements</h3>
        <div className="achievements-grid">
          {(stats.streakDays || 0) >= 7 && (
            <div className="achievement unlocked">
              <span className="achievement-icon">🏆</span>
              <span className="achievement-name">Week Warrior</span>
            </div>
          )}
          {(stats.tasksCompleted || 0) >= 10 && (
            <div className="achievement unlocked">
              <span className="achievement-icon">⭐</span>
              <span className="achievement-name">Task Master</span>
            </div>
          )}
          {(stats.averageWPM || 0) >= 60 && (
            <div className="achievement unlocked">
              <span className="achievement-icon">⚡</span>
              <span className="achievement-name">Speed Demon</span>
            </div>
          )}
          {(stats.wordsRead || 0) >= 1000 && (
            <div className="achievement unlocked">
              <span className="achievement-icon">📖</span>
              <span className="achievement-name">Bookworm</span>
            </div>
          )}
          {(stats.totalJournalEntries || 0) >= 5 && (
            <div className="achievement unlocked">
              <span className="achievement-icon">✍️</span>
              <span className="achievement-name">Journaler</span>
            </div>
          )}
          {/* Locked achievements placeholder */}
          {(stats.streakDays || 0) < 7 && (
            <div className="achievement locked">
              <span className="achievement-icon">🔒</span>
              <span className="achievement-name">Week Warrior</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStats;
