import React, { useState, useEffect } from 'react';
import './SpeedReading.css';

const sampleText = "The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.";

function SpeedReading() {
  const [text, setText] = useState(sampleText);
  const [wpm, setWpm] = useState(300);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    let interval = null;
    if (reading) {
      interval = setInterval(() => {
        setCurrentWordIndex((prevIndex) => {
          if (prevIndex < text.split(' ').length - 1) {
            return prevIndex + 1;
          } else {
            clearInterval(interval);
            setReading(false);
            return prevIndex;
          }
        });
      }, (60 / wpm) * 1000);
    } else if (!reading && currentWordIndex !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [reading, currentWordIndex, wpm, text]);

  const handleStart = () => {
    setReading(true);
  };

  const handlePause = () => {
    setReading(false);
  };

  const handleReset = () => {
    setReading(false);
    setCurrentWordIndex(0);
  };

  const progress = (currentWordIndex / text.split(' ').length) * 100;

  return (
    <div className="speed-reading">
      <h1>Speed Reading</h1>
      <div>
        <label>Reading Speed (WPM): </label>
        <input
          type="number"
          value={wpm}
          onChange={(e) => setWpm(e.target.value)}
          min="1"
        />
      </div>
      <div>
        <label>Enter Text: </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="reading-area">
        <p>{text.split(' ')[currentWordIndex]}</p>
      </div>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }}></div>
      </div>
      <div>
        <button onClick={handleStart} disabled={reading}>Start</button>
        <button onClick={handlePause} disabled={!reading}>Pause</button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}

export default SpeedReading;
