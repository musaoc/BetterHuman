// src/components/Quests.js

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Quests.css';

const Quests = () => {
  const { userProfile } = useAuth();
  const stats = userProfile?.stats || {};
  const [selectedTier, setSelectedTier] = useState(null);

  const dailyQuests = [
    {
      id: 1,
      title: 'Complete 3 Tasks',
      description: 'Finish at least 3 tasks from your to-do list',
      xp: 15,
      progress: Math.min((stats.tasksCompleted || 0), 3),
      target: 3,
      icon: '✅'
    },
    {
      id: 2,
      title: 'Speed Reading Session',
      description: 'Read at least 500 words using the speed reader',
      xp: 20,
      progress: Math.min((stats.wordsRead || 0), 500),
      target: 500,
      icon: '📖'
    },
    {
      id: 3,
      title: 'Typing Practice',
      description: 'Complete a typing test with 40+ WPM',
      xp: 15,
      progress: (stats.averageWPM || 0) >= 40 ? 1 : 0,
      target: 1,
      icon: '⌨️'
    },
    {
      id: 4,
      title: 'Daily Journal',
      description: 'Write a journal entry for today',
      xp: 10,
      progress: 0, // Would track today's entries
      target: 1,
      icon: '📝'
    }
  ];

  const weeklyQuests = [
    {
      id: 5,
      title: '7-Day Streak',
      description: 'Maintain a 7-day activity streak',
      xp: 100,
      progress: stats.streakDays || 0,
      target: 7,
      icon: '🔥'
    },
    {
      id: 6,
      title: 'Word Marathon',
      description: 'Read 5,000 words this week',
      xp: 75,
      progress: Math.min((stats.wordsRead || 0), 5000),
      target: 5000,
      icon: '📚'
    },
    {
      id: 7,
      title: 'Task Champion',
      description: 'Complete 20 tasks this week',
      xp: 80,
      progress: Math.min((stats.tasksCompleted || 0), 20),
      target: 20,
      icon: '🏆'
    }
  ];

  const donationTiers = [
    {
      id: 'supporter',
      name: 'Supporter',
      price: '$5/month',
      color: '#10b981',
      icon: '🌱',
      benefits: [
        'Support app development',
        'Early access to features',
        'Supporter badge',
        'Ad-free experience'
      ]
    },
    {
      id: 'champion',
      name: 'Champion',
      price: '$15/month',
      color: '#667eea',
      icon: '⚡',
      popular: true,
      benefits: [
        'All Supporter benefits',
        'Priority feature requests',
        'Champion badge',
        'Exclusive themes',
        'Monthly progress reports'
      ]
    },
    {
      id: 'legend',
      name: 'Legend',
      price: '$30/month',
      color: '#f59e0b',
      icon: '👑',
      benefits: [
        'All Champion benefits',
        'Legend badge',
        'Direct dev contact',
        'Name in credits',
        'Custom profile features',
        'Lifetime updates'
      ]
    }
  ];

  const getQuestProgress = (quest) => {
    return Math.min((quest.progress / quest.target) * 100, 100);
  };

  return (
    <div className="quests-container">
      {/* Hero Section */}
      <div className="quests-hero">
        <div className="hero-content">
          <h1>🎯 Quests & Support</h1>
          <p>Complete quests to earn XP and level up. Support BetterHuman to help us grow.</p>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{stats.xpPoints || 0}</span>
            <span className="hero-stat-label">Total XP</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">Lv.{stats.level || 1}</span>
            <span className="hero-stat-label">Level</span>
          </div>
        </div>
      </div>

      {/* Daily Quests */}
      <section className="quests-section">
        <div className="section-header">
          <h2>📅 Daily Quests</h2>
          <span className="reset-timer">Resets in 12:34:56</span>
        </div>
        <div className="quests-grid">
          {dailyQuests.map(quest => (
            <div key={quest.id} className={`quest-card ${getQuestProgress(quest) >= 100 ? 'completed' : ''}`}>
              <div className="quest-icon">{quest.icon}</div>
              <div className="quest-info">
                <h3>{quest.title}</h3>
                <p>{quest.description}</p>
                <div className="quest-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${getQuestProgress(quest)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {quest.progress} / {quest.target}
                  </span>
                </div>
              </div>
              <div className="quest-reward">
                <span className="xp-badge">+{quest.xp} XP</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Quests */}
      <section className="quests-section">
        <div className="section-header">
          <h2>📆 Weekly Quests</h2>
          <span className="reset-timer">Resets in 3d 12:34:56</span>
        </div>
        <div className="quests-grid">
          {weeklyQuests.map(quest => (
            <div key={quest.id} className={`quest-card weekly ${getQuestProgress(quest) >= 100 ? 'completed' : ''}`}>
              <div className="quest-icon">{quest.icon}</div>
              <div className="quest-info">
                <h3>{quest.title}</h3>
                <p>{quest.description}</p>
                <div className="quest-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${getQuestProgress(quest)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {quest.progress.toLocaleString()} / {quest.target.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="quest-reward">
                <span className="xp-badge weekly">+{quest.xp} XP</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Support Section */}
      <section className="support-section">
        <div className="support-header">
          <h2>💖 Support BetterHuman</h2>
          <p>
            Help us continue building tools that make you better. 
            Your support keeps the servers running and development going strong.
          </p>
        </div>

        <div className="donation-tiers">
          {donationTiers.map(tier => (
            <div 
              key={tier.id} 
              className={`tier-card ${tier.popular ? 'popular' : ''} ${selectedTier === tier.id ? 'selected' : ''}`}
              onClick={() => setSelectedTier(tier.id)}
              style={{ '--tier-color': tier.color }}
            >
              {tier.popular && <span className="popular-badge">Most Popular</span>}
              <div className="tier-icon">{tier.icon}</div>
              <h3 className="tier-name">{tier.name}</h3>
              <div className="tier-price">{tier.price}</div>
              <ul className="tier-benefits">
                {tier.benefits.map((benefit, index) => (
                  <li key={index}>
                    <span className="benefit-check">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <a 
                href="https://www.patreon.com/musaoc/membership" 
                target="_blank" 
                rel="noopener noreferrer"
                className="tier-button"
              >
                Choose {tier.name}
              </a>
            </div>
          ))}
        </div>

        <div className="support-footer">
          <div className="support-message">
            <span className="heart-icon">❤️</span>
            <p>
              Every contribution, big or small, helps us on our mission to help people 
              become better versions of themselves. Thank you for being part of this journey.
            </p>
          </div>
          <div className="support-links">
            <a href="https://www.patreon.com/musaoc/membership" target="_blank" rel="noopener noreferrer" className="patreon-link">
              <span>🎨</span> Join on Patreon
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Quests;
