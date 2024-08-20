import React, { useState, useEffect, useRef } from 'react';
import './SpeedTest.css';

function App() {
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timer, setTimer] = useState(60);
  const [isFinished, setIsFinished] = useState(false);
  const [mode, setMode] = useState('timed');
  const [targetWordCount, setTargetWordCount] = useState(50);
  const [errors, setErrors] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [highScores, setHighScores] = useState({});
  const [customTime, setCustomTime] = useState(60);
  const inputRef = useRef(null);

  useEffect(() => {
    generateText();
    loadHighScores();
  }, [mode, targetWordCount, difficulty]);

  useEffect(() => {
    let interval;
    if (startTime && mode === 'timed' && timer > 0 && !isFinished) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      handleTestComplete();
    }
    return () => clearInterval(interval);
  }, [startTime, timer, mode, isFinished]);

  const loadHighScores = () => {
    const savedHighScores = localStorage.getItem('typingHighScores');
    if (savedHighScores) {
      setHighScores(JSON.parse(savedHighScores));
    }
  };

  const saveHighScore = () => {
    const newHighScores = {
      ...highScores,
      [difficulty]: Math.max(wpm, highScores[difficulty] || 0)
    };
    setHighScores(newHighScores);
    localStorage.setItem('typingHighScores', JSON.stringify(newHighScores));
  };

  const generateText = () => {
    const easyWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'];
    const mediumWords = ['quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'hello', 'world', 'typing'];
    const hardWords = ['exquisite', 'phenomenal', 'serendipity', 'eloquent', 'ephemeral', 'mellifluous', 'quintessential', 'surreptitious', 'labyrinthine', 'metamorphosis'];

    let words;
    switch (difficulty) {
      case 'easy':
        words = easyWords;
        break;
      case 'hard':
        words = hardWords;
        break;
      default:
        words = mediumWords;
    }

    const numberOfWords = mode === 'timed' ? 100 : targetWordCount;
    const generatedText = Array(numberOfWords).fill().map(() => words[Math.floor(Math.random() * words.length)]).join(' ');
    setText(generatedText);
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setUserInput(inputValue);

    if (!startTime) {
      setStartTime(Date.now());
    }

    const wordCount = inputValue.trim().split(/\s+/).length;
    const charCount = inputValue.length;
    setWordCount(wordCount);
    setCharCount(charCount);

    const timeDiff = (Date.now() - startTime) / 60000; // in minutes
    const wordsPerMinute = Math.round((wordCount / timeDiff) || 0);
    setWpm(wordsPerMinute);

    const newErrors = getErrorCount(inputValue);
    setErrors(newErrors);
    const accuracyPercent = Math.round(((charCount - newErrors) / charCount) * 100) || 100;
    setAccuracy(accuracyPercent);

    if (mode === 'wordCount' && wordCount >= targetWordCount) {
      handleTestComplete();
    }
  };

  const getErrorCount = (input) => {
    return input.split('').reduce((count, char, i) => {
      return text[i] !== char ? count + 1 : count;
    }, 0);
  };

  const handleTestComplete = () => {
    setIsFinished(true);
    inputRef.current.disabled = true;
    saveHighScore();
  };

  const restartTest = () => {
    setUserInput('');
    setStartTime(null);
    setWordCount(0);
    setCharCount(0);
    setWpm(0);
    setAccuracy(100);
    setTimer(mode === 'timed' ? (customTime || 60) : 60);
    setIsFinished(false);
    setErrors(0);
    generateText();
    inputRef.current.disabled = false;
    inputRef.current.focus();
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      let className = '';
      if (index < userInput.length) {
        className = char === userInput[index] ? 'correct' : 'incorrect';
      } else if (index === userInput.length) {
        className = 'current';
      }
      return <span key={index} className={className}>{char}</span>;
    });
  };

  const renderKeyboard = () => {
    const layout = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm']
    ];
    return (
      <div className="keyboard">
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key) => (
              <div key={key} className={`key ${userInput[userInput.length - 1] === key ? 'active' : ''}`}>
                {key}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderProgressBar = () => {
    const progress = mode === 'timed' 
      ? ((customTime || 60) - timer) / (customTime || 60) * 100
      : (wordCount / targetWordCount) * 100;
    return (
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }}></div>
      </div>
    );
  };

  return (
    <div className="App">
      <h1>Advanced Typing Practice</h1>
      <div className="mode-selector">
        <button onClick={() => setMode('timed')} className={mode === 'timed' ? 'active' : ''}>Timed</button>
        <button onClick={() => setMode('wordCount')} className={mode === 'wordCount' ? 'active' : ''}>Word Count</button>
      </div>
      {mode === 'timed' && (
        <div className="time-selector">
          <button onClick={() => setTimer(15)}>15s</button>
          <button onClick={() => setTimer(30)}>30s</button>
          <button onClick={() => setTimer(60)}>60s</button>
          <input 
            type="number" 
            value={customTime} 
            onChange={(e) => setCustomTime(parseInt(e.target.value))} 
            placeholder="Custom time"
          />
          <button onClick={() => setTimer(customTime)}>Set Custom Time</button>
        </div>
      )}
      {mode === 'wordCount' && (
        <input 
          type="number" 
          value={targetWordCount} 
          onChange={(e) => setTargetWordCount(parseInt(e.target.value))} 
          placeholder="Target word count"
        />
      )}
      <div className="difficulty-selector">
        <button onClick={() => setDifficulty('easy')} className={difficulty === 'easy' ? 'active' : ''}>Easy</button>
        <button onClick={() => setDifficulty('medium')} className={difficulty === 'medium' ? 'active' : ''}>Medium</button>
        <button onClick={() => setDifficulty('hard')} className={difficulty === 'hard' ? 'active' : ''}>Hard</button>
      </div>
      <div className="text-display">{renderText()}</div>
      <textarea
        ref={inputRef}
        value={userInput}
        onChange={handleInputChange}
        placeholder="Start typing here..."
        disabled={isFinished}
      />
      {renderProgressBar()}
      <div className="stats">
        <p>WPM: {wpm}</p>
        <p>Accuracy: {accuracy}%</p>
        <p>Errors: {errors}</p>
        {mode === 'timed' && <p>Time left: {timer}s</p>}
        {mode === 'wordCount' && <p>Words: {wordCount}/{targetWordCount}</p>}
        <p>High Score: {highScores[difficulty] || 0} WPM</p>
      </div>
      {renderKeyboard()}
      <button onClick={restartTest}>Restart</button>
      {isFinished && (
        <div className="result">
          <h2>Test Complete!</h2>
          <p>WPM: {wpm}</p>
          <p>Accuracy: {accuracy}%</p>
          <p>Total Errors: {errors}</p>
          {wpm > (highScores[difficulty] || 0) && <p>New High Score!</p>}
        </div>
      )}
    </div>
  );
}

export default App;