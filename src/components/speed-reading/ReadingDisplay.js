import React from 'react';
import { Typography, Box, LinearProgress, Slider } from '@mui/material';

const ReadingDisplay = (props) => {
  const {
    displayContent,
    panelColor,
    textSize,
    fontFamily,
    fontColor,
    backgroundColor,
    isReading,
    isPaused,
    handleStart,
    handlePause,
    handleResume,
    handleRestart,
    readingSpeed,
    setReadingSpeed,
    progress,
    handleFullscreenToggle
  } = props;

  const getFocalPointWord = (word) => {
    if (!word) return '';
    const middleIndex = Math.floor(word.length / 2);
    return (
      <>
        {word.substring(0, middleIndex)}
        <span className="focal-point">{word[middleIndex]}</span>
        {word.substring(middleIndex + 1)}
      </>
    );
  };

  return (
    <Box className="reading-display" style={{ backgroundColor: panelColor }}>
      <Typography
        variant="h5"
        className="word-display"
        style={{ fontSize: textSize, fontFamily: fontFamily, color: fontColor, backgroundColor: backgroundColor }}
      >
        {getFocalPointWord(displayContent)}
      </Typography>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <Box marginTop={2}>
        <Typography>Reading Speed: {readingSpeed} WPM</Typography>
        <Slider
          value={readingSpeed}
          onChange={(e, newValue) => setReadingSpeed(newValue)}
          aria-labelledby="reading-speed-slider"
          min={100}
          max={600}
          step={10}
          valueLabelDisplay="auto"
          className="speed-slider"
        />
      </Box>
      <div className="control-buttons">
        <button className="control-button start-button" onClick={handleStart}>Start</button>
        {isReading && !isPaused ? (
          <button className="control-button pause-button" onClick={handlePause}>Pause</button>
        ) : (
          <button className="control-button start-button" onClick={handleResume}>Resume</button>
        )}
        <button className="control-button reset-button" onClick={handleRestart}>Restart</button>
      </div>
      <Box display="flex" justifyContent="flex-end" marginTop={2}>
        <button className="control-button" onClick={handleFullscreenToggle}>Fullscreen</button>
      </Box>
    </Box>
  );
};

export default ReadingDisplay;
