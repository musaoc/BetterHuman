import React, { useState, useEffect } from 'react';
import './TypingSpeedTester.css';

const sampleText = "Are you strong";

function TypingSpeedTester() {
  const [text, setText] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (value.length === 1) {
      setStartTime(new Date().getTime());
    }

    if (value === sampleText) {
      setEndTime(new Date().getTime());
    }
  };

  const getTypingSpeed = () => {
    if (startTime && endTime) {
      const timeTaken = (endTime - startTime) / 1000; // time in seconds
      const wordsPerMinute = (sampleText.split(" ").length / timeTaken) * 60;
      return Math.round(wordsPerMinute);
    }
    return 0;
  };

  return (
    <div className="typing-speed-tester">
      <h1>Typing Speed Tester</h1>
      <p>Type the following text as quickly and accurately as you can:</p>
      <p className="sample-text">{sampleText}</p>
      <textarea value={text} onChange={handleChange} />
      {endTime && (
        <div className="result">
          <p>Your typing speed is: {getTypingSpeed()} words per minute</p>
        </div>
      )}
    </div>
  );
}

export default TypingSpeedTester;
