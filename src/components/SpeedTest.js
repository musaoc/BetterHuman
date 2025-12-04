import React, { useState, useEffect, useRef } from 'react';
import './SpeedTest.css';

const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet at least once.",
  "Practice makes perfect. The more you type, the faster and more accurate you'll become. Keep pushing your limits!",
  "Technology has revolutionized the way we communicate and work. Typing skills are more important than ever in today's digital world.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep practicing and improving every day.",
  "The journey of a thousand miles begins with a single step. Your typing journey starts with pressing that first key."
];

const DIFFICULTY_SETTINGS = {
  easy: { wordLength: 4, commonWords: true, label: '🟢 Easy' },
  medium: { wordLength: 6, commonWords: true, label: '🟡 Medium' },
  hard: { wordLength: 8, commonWords: false, label: '🔴 Hard' },
  expert: { wordLength: 10, commonWords: false, label: '🔥 Expert' }
};

const WORDS_PER_CHUNK = 100;

function SpeedTest() {
  const [mode, setMode] = useState('practice');
  const [difficulty, setDifficulty] = useState('medium');
  const [testDuration, setTestDuration] = useState(60);
  const [fullText, setFullText] = useState('');
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalWordsTyped, setTotalWordsTyped] = useState(0);
  const [history, setHistory] = useState([]);
  const [bestWpm, setBestWpm] = useState(0);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [showCustomTextModal, setShowCustomTextModal] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('typingHistory');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed);
      if (parsed.length > 0) {
        setBestWpm(Math.max(...parsed.map(h => h.wpm)));
      }
    }

    const savedCustomText = localStorage.getItem('customTypingText');
    if (savedCustomText) {
      setCustomText(savedCustomText);
    }
  }, []);

  // Split text into chunks
  const getTextChunks = (text) => {
    const words = text.split(' ');
    const chunks = [];
    for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
      chunks.push(words.slice(i, i + WORDS_PER_CHUNK).join(' '));
    }
    return chunks;
  };

  const getCurrentChunkText = () => {
    const chunks = getTextChunks(fullText);
    return chunks[currentChunk] || '';
  };

  const getTotalChunks = () => {
    return getTextChunks(fullText).length;
  };

  // Generate random text based on difficulty
  const generateText = () => {
    if (useCustomText && customText.trim()) {
      return customText;
    }

    if (mode === 'practice') {
      return SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    }
    
    const words = [];
    const wordCount = Math.floor((testDuration / 60) * 200);
    
    const commonWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this'];
    const hardWords = ['absolutely', 'necessary', 'throughout', 'development', 'significantly', 'extraordinary', 'understanding', 'communication', 'environment', 'opportunity'];
    
    for (let i = 0; i < wordCount; i++) {
      if (DIFFICULTY_SETTINGS[difficulty].commonWords) {
        words.push(commonWords[Math.floor(Math.random() * commonWords.length)]);
      } else {
        words.push(hardWords[Math.floor(Math.random() * hardWords.length)]);
      }
    }
    
    return words.join(' ');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/plain') {
      try {
        const text = await file.text();
        setCustomText(text);
        setUseCustomText(true);
        localStorage.setItem('customTypingText', text);
        alert('✅ File loaded successfully! Your custom text is ready.');
      } catch (error) {
        alert('❌ Error reading file. Please try again.');
      }
    } else {
      alert('⚠️ Please upload a .txt file');
    }
    e.target.value = '';
  };

  const saveCustomText = () => {
    if (customText.trim()) {
      localStorage.setItem('customTypingText', customText);
      setUseCustomText(true);
      setShowCustomTextModal(false);
      alert('✅ Custom text saved successfully!');
    } else {
      alert('⚠️ Please enter some text first.');
    }
  };

  const clearCustomText = () => {
    setCustomText('');
    setUseCustomText(false);
    localStorage.removeItem('customTypingText');
    setShowCustomTextModal(false);
  };

  const startTest = () => {
    const newText = generateText();
    setFullText(newText);
    setUserInput('');
    setIsStarted(true);
    setIsFinished(false);
    setStartTime(Date.now());
    setTimeLeft(testDuration);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setCurrentChunk(0);
    setTotalWordsTyped(0);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }

    if (mode === 'test') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const endTest = () => {
    clearInterval(timerRef.current);
    setIsFinished(true);
    setIsStarted(false);

    const newEntry = {
      date: new Date().toISOString(),
      wpm,
      accuracy,
      duration: testDuration - timeLeft,
      mode,
      difficulty,
      customText: useCustomText
    };

    const newHistory = [newEntry, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('typingHistory', JSON.stringify(newHistory));

    if (wpm > bestWpm) {
      setBestWpm(wpm);
    }
  };

  const resetTest = () => {
    clearInterval(timerRef.current);
    setFullText('');
    setUserInput('');
    setIsStarted(false);
    setIsFinished(false);
    setTimeLeft(testDuration);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setCurrentChunk(0);
    setTotalWordsTyped(0);
  };

  // Handle chunk completion
  useEffect(() => {
    if (isStarted && userInput.length > 0) {
      const currentChunkText = getCurrentChunkText();
      
      // Check if current chunk is completed
      if (userInput.trim() === currentChunkText.trim()) {
        const totalChunks = getTotalChunks();
        
        if (currentChunk < totalChunks - 1) {
          // Move to next chunk
          setCurrentChunk(prev => prev + 1);
          setTotalWordsTyped(prev => prev + currentChunkText.split(' ').length);
          setUserInput('');
          
          if (inputRef.current) {
            inputRef.current.focus();
          }
        } else {
          // All chunks completed
          if (mode === 'practice') {
            endTest();
          }
        }
      }
    }
  }, [userInput, isStarted, currentChunk]);

  // Calculate WPM and accuracy
  useEffect(() => {
    if (isStarted && userInput.length > 0) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60;
      const wordsTyped = totalWordsTyped + userInput.trim().split(/\s+/).length;
      const calculatedWpm = Math.round(wordsTyped / timeElapsed);
      setWpm(calculatedWpm);

      const currentChunkText = getCurrentChunkText();
      let correctChars = 0;
      let totalChars = 0;
      const textChars = currentChunkText.split('');
      const inputChars = userInput.split('');

      for (let i = 0; i < inputChars.length; i++) {
        totalChars++;
        if (inputChars[i] === textChars[i]) {
          correctChars++;
        }
      }

      const calculatedAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
      setAccuracy(calculatedAccuracy);
      setErrors(totalChars - correctChars);
    }
  }, [userInput, isStarted, startTime, currentChunk, totalWordsTyped]);

  // Keyboard highlight
  useEffect(() => {
    const handleKeyDown = (e) => {
      setActiveKeys(prev => new Set(prev).add(e.key.toLowerCase()));
    };

    const handleKeyUp = (e) => {
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.key.toLowerCase());
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCharClass = (index) => {
    if (index >= userInput.length) return '';
    const currentChunkText = getCurrentChunkText();
    if (userInput[index] === currentChunkText[index]) return 'correct';
    return 'incorrect';
  };

  const renderText = () => {
    const currentChunkText = getCurrentChunkText();
    return currentChunkText.split('').map((char, index) => (
      <span
        key={index}
        className={`char ${getCharClass(index)} ${index === userInput.length ? 'current' : ''}`}
      >
        {char}
      </span>
    ));
  };

  const KEYBOARD_LAYOUT = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  return (
    <div className="speed-test-container">
      <div className="speed-test-header">
        <h1>⚡ Speed Typing Master</h1>
        <p>Test and improve your typing speed and accuracy</p>
      </div>

      {!isStarted && !isFinished && (
        <div className="setup-screen">
          {/* Custom Text Section */}
          <div className="setup-section custom-text-section">
            <h3>📝 Custom Text</h3>
            <div className="custom-text-controls">
              <button
                className={`custom-text-btn ${useCustomText ? 'active' : ''}`}
                onClick={() => setShowCustomTextModal(true)}
              >
                ✏️ Enter Custom Text
                {useCustomText && <span className="badge-active">Active</span>}
              </button>
              
              <button
                className="file-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📎 Upload .txt File
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {useCustomText && (
                <button
                  className="clear-custom-btn"
                  onClick={() => {
                    setUseCustomText(false);
                    setCustomText('');
                  }}
                >
                  ❌ Use Random Text
                </button>
              )}
            </div>

            {useCustomText && customText && (
              <div className="custom-text-preview">
                <p className="preview-label">📄 Preview:</p>
                <p className="preview-text">
                  {customText.substring(0, 150)}
                  {customText.length > 150 ? '...' : ''}
                </p>
                <p className="preview-stats">
                  <span>{customText.split(' ').length} words</span>
                  <span>·</span>
                  <span>{customText.length} characters</span>
                  <span>·</span>
                  <span>{Math.ceil(customText.split(' ').length / WORDS_PER_CHUNK)} chunks of {WORDS_PER_CHUNK} words</span>
                </p>
              </div>
            )}
          </div>

          {/* Mode Selection */}
          <div className="setup-section">
            <h3>📝 Select Mode</h3>
            <div className="mode-buttons">
              <button
                className={`mode-btn ${mode === 'practice' ? 'active' : ''}`}
                onClick={() => setMode('practice')}
              >
                🎯 Practice Mode
                <span className="mode-desc">Type until completion, no timer</span>
              </button>
              <button
                className={`mode-btn ${mode === 'test' ? 'active' : ''}`}
                onClick={() => setMode('test')}
              >
                ⏱️ Timed Test
                <span className="mode-desc">Challenge yourself with a timer</span>
              </button>
            </div>
          </div>

          {/* Difficulty Selection */}
          {!useCustomText && (
            <div className="setup-section">
              <h3>🎚️ Select Difficulty</h3>
              <div className="difficulty-buttons">
                {Object.entries(DIFFICULTY_SETTINGS).map(([key, value]) => (
                  <button
                    key={key}
                    className={`difficulty-btn ${difficulty === key ? 'active' : ''}`}
                    onClick={() => setDifficulty(key)}
                  >
                    {value.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration Selection */}
          {mode === 'test' && (
            <div className="setup-section">
              <h3>⏳ Test Duration</h3>
              <div className="duration-buttons">
                {[30, 60, 120, 300].map(duration => (
                  <button
                    key={duration}
                    className={`duration-btn ${testDuration === duration ? 'active' : ''}`}
                    onClick={() => setTestDuration(duration)}
                  >
                    {duration < 60 ? `${duration}s` : `${duration / 60}m`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          {history.length > 0 && (
            <div className="stats-overview">
              <div className="stat-box">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-value">{bestWpm}</div>
                  <div className="stat-label">Best WPM</div>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{history.length}</div>
                  <div className="stat-label">Tests Completed</div>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {Math.round(history.reduce((acc, h) => acc + h.accuracy, 0) / history.length)}%
                  </div>
                  <div className="stat-label">Avg Accuracy</div>
                </div>
              </div>
            </div>
          )}

          <button className="start-btn" onClick={startTest}>
            🚀 Start {mode === 'test' ? 'Test' : 'Practice'}
          </button>
        </div>
      )}

      {isStarted && (
        <div className="test-screen">
          {/* Chunk Progress Indicator */}
          <div className="chunk-progress">
            <div className="chunk-info">
              <span className="chunk-label">Chunk {currentChunk + 1} of {getTotalChunks()}</span>
              <span className="chunk-words">
                {totalWordsTyped + userInput.trim().split(/\s+/).filter(w => w).length} / {fullText.split(' ').length} words
              </span>
            </div>
            <div className="chunk-progress-bar">
              <div 
                className="chunk-progress-fill"
                style={{ width: `${((currentChunk + (userInput.length / getCurrentChunkText().length)) / getTotalChunks()) * 100}%` }}
              />
            </div>
          </div>

          {/* Live Stats */}
          <div className="live-stats">
            {mode === 'test' && (
              <div className="stat-item">
                <div className="stat-label">⏱️ Time</div>
                <div className="stat-value">{formatTime(timeLeft)}</div>
              </div>
            )}
            <div className="stat-item">
              <div className="stat-label">⚡ WPM</div>
              <div className="stat-value">{wpm}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">🎯 Accuracy</div>
              <div className="stat-value">{accuracy}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">❌ Errors</div>
              <div className="stat-value">{errors}</div>
            </div>
          </div>

          {/* Progress Bar for current chunk */}
          <div className="typing-progress">
            <div 
              className="progress-fill"
              style={{ width: `${(userInput.length / getCurrentChunkText().length) * 100}%` }}
            />
          </div>

          {/* Text Display */}
          <div className="text-display">
            {renderText()}
          </div>

          {/* Input Area */}
          <textarea
            ref={inputRef}
            className="typing-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Start typing here..."
            disabled={!isStarted}
            autoFocus
          />

          {/* Virtual Keyboard */}
          {showKeyboard && (
            <div className="virtual-keyboard">
              <div className="keyboard-toggle">
                <button onClick={() => setShowKeyboard(!showKeyboard)}>
                  {showKeyboard ? '⌨️ Hide Keyboard' : '⌨️ Show Keyboard'}
                </button>
              </div>
              {KEYBOARD_LAYOUT.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                  {row.map(key => {
                    const currentChunkText = getCurrentChunkText();
                    return (
                      <div
                        key={key}
                        className={`key ${activeKeys.has(key) ? 'active' : ''} ${currentChunkText[userInput.length] === key ? 'next' : ''}`}
                      >
                        {key}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="keyboard-row">
                <div className={`key spacebar ${activeKeys.has(' ') ? 'active' : ''}`}>Space</div>
              </div>
            </div>
          )}

          <button className="reset-btn" onClick={resetTest}>
            🔄 Reset
          </button>
        </div>
      )}

      {isFinished && (
        <div className="results-screen">
          <h2>🎉 Test Complete!</h2>
          
          <div className="results-stats">
            <div className="result-card">
              <div className="result-icon">⚡</div>
              <div className="result-value">{wpm}</div>
              <div className="result-label">Words Per Minute</div>
              {wpm > bestWpm && <div className="badge">🏆 New Record!</div>}
            </div>
            
            <div className="result-card">
              <div className="result-icon">🎯</div>
              <div className="result-value">{accuracy}%</div>
              <div className="result-label">Accuracy</div>
            </div>
            
            <div className="result-card">
              <div className="result-icon">❌</div>
              <div className="result-value">{errors}</div>
              <div className="result-label">Errors</div>
            </div>
            
            <div className="result-card">
              <div className="result-icon">📖</div>
              <div className="result-value">{totalWordsTyped + userInput.trim().split(/\s+/).filter(w => w).length}</div>
              <div className="result-label">Words Typed</div>
            </div>
          </div>

          {/* Performance Message */}
          <div className="performance-message">
            {wpm >= 80 && accuracy >= 95 && (
              <div className="message excellent">
                <span className="message-icon">🔥</span>
                <span>Excellent! You're a typing master!</span>
              </div>
            )}
            {wpm >= 60 && wpm < 80 && accuracy >= 90 && (
              <div className="message good">
                <span className="message-icon">👍</span>
                <span>Great job! Keep practicing to improve further!</span>
              </div>
            )}
            {wpm < 60 && (
              <div className="message improve">
                <span className="message-icon">💪</span>
                <span>Keep practicing! You'll improve with time!</span>
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 1 && (
            <div className="history-section">
              <h3>📈 Recent Results</h3>
              <div className="history-list">
                {history.slice(0, 5).map((entry, index) => (
                  <div key={index} className="history-item">
                    <span className="history-date">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <span className="history-wpm">{entry.wpm} WPM</span>
                    <span className="history-accuracy">{entry.accuracy}%</span>
                    <span className="history-difficulty">
                      {entry.customText ? '📝 Custom' : DIFFICULTY_SETTINGS[entry.difficulty].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="results-actions">
            <button className="btn-primary" onClick={startTest}>
              🔄 Try Again
            </button>
            <button className="btn-secondary" onClick={resetTest}>
              ⚙️ Change Settings
            </button>
          </div>
        </div>
      )}

      {/* Custom Text Modal */}
      {showCustomTextModal && (
        <div className="modal-overlay" onClick={() => setShowCustomTextModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Enter Custom Text</h3>
              <button className="modal-close" onClick={() => setShowCustomTextModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <textarea
                className="custom-text-input"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste or type your custom text here... You can practice typing entire books or articles! Text will be shown in chunks of 100 words."
                rows={12}
              />
              
              <div className="custom-text-stats">
                <span>📝 {customText.split(' ').filter(w => w).length} words</span>
                <span>📊 {customText.length} characters</span>
                <span>📚 {Math.ceil(customText.split(' ').filter(w => w).length / WORDS_PER_CHUNK)} chunks</span>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCustomTextModal(false)}>
                Cancel
              </button>
              {customText && (
                <button className="btn-clear" onClick={clearCustomText}>
                  Clear Text
                </button>
              )}
              <button className="btn-save" onClick={saveCustomText}>
                💾 Save & Use
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeedTest;