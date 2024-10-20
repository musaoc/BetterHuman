import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import { Container, TextField, Button, Typography, Box, Slider, MenuItem, Select, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import './SpeedReading.css';

function SpeedReadingPlus() {
  const [text, setText] = useState('');
  const [customText, setCustomText] = useState('Are you strong?');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readingSpeed, setReadingSpeed] = useState(250);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textSize, setTextSize] = useState(150);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [backgroundColor, setBackgroundColor] = useState('#151719');
  const [panelColor, setPanelColor] = useState('#ffffff');
  const [fontColor, setFontColor] = useState('#ffffff');
  const [numWords, setNumWords] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [displayMode, setDisplayMode] = useState('words'); // 'words' or 'sentences'
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);

  const handleStart = () => {
    setIsReading(true);
    setIsPaused(false);
    setCurrentIndex(0);
    setProgress(0);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleRestart = () => {
    setIsReading(true);
    setIsPaused(false);
    setCurrentIndex(0);
    setProgress(0);
  };

  useEffect(() => {
    let interval;
    if (isReading && !isPaused) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const wordsOrSentences = displayMode === 'words' ? text.split(' ') : text.match(/[^.!?]+[.!?]+/g) || [];
          if (prevIndex < wordsOrSentences.length - numWords) {
            setProgress(((prevIndex + numWords) / wordsOrSentences.length) * 100);
            return prevIndex + numWords;
          } else {
            clearInterval(interval);
            setIsReading(false);
            return prevIndex;
          }
        });
      }, 60000 / readingSpeed);
    }
    return () => clearInterval(interval);
  }, [isReading, isPaused, text, readingSpeed, numWords, displayMode]);

  const handleCustomTextSubmit = (e) => {
    e.preventDefault();
    setText(customText);
    setCustomText('Are you strong?');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const typedArray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                let textContent = '';
                
                // Loop through pages
                for (let i = startPage - 1; i < endPage; i++) {
                    const page = await pdf.getPage(i + 1);
                    const text = await page.getTextContent();
                    text.items.forEach((item) => {
                        textContent += `${item.str} `;
                    });
                }
                
                setText(textContent);
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                setText(e.target.result);
            };
            reader.readAsText(file);
        }
    }
};

  const handleSaveProgress = () => {
    const progressData = {
        text,
        currentIndex,
        readingSpeed,
        textSize,
        fontFamily,
        backgroundColor,
        panelColor,
        fontColor,
        numWords,
        totalWords: text.split(' ').length
    };
    
    const jsonData = JSON.stringify(progressData);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reading_progress.json';
    link.click();
};

const handleLoadProgress = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const progressData = JSON.parse(e.target.result);
            setText(progressData.text);
            setCurrentIndex(progressData.currentIndex);
            setReadingSpeed(progressData.readingSpeed);
            setTextSize(progressData.textSize);
            setFontFamily(progressData.fontFamily);
            setBackgroundColor(progressData.backgroundColor);
            setPanelColor(progressData.panelColor);
            setFontColor(progressData.fontColor);
            setNumWords(progressData.numWords);
            setProgress((progressData.currentIndex / progressData.totalWords) * 100);
        };
        reader.readAsText(file);
    }
};

  const handleFullscreenToggle = () => {
    setFullscreen(!fullscreen);
  };

  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === 'words' ? 'sentences' : 'words');
    setNumWords(1); // Reset slider value when switching modes
  };

  const handleSliderChange = (e, newValue) => {
    setNumWords(newValue);
  };

  const handleStartPageChange = (e) => {
    setStartPage(parseInt(e.target.value));
  };

  const handleEndPageChange = (e) => {
    setEndPage(parseInt(e.target.value));
  };
  useEffect(() => {
    const handleKeydown = (e) => {
        switch (e.key) {
            case 'f':
            case 'F':
                handleFullscreenToggle();
                break;
            case ' ':
                e.preventDefault();  // Prevent default spacebar scroll behavior
                if (isReading) {
                    isPaused ? handleResume() : handlePause();
                }
                break;
            case 'ArrowRight':
                // If user presses right arrow, move to the next set of words or sentences
                if (isReading || isPaused) {
                    setCurrentIndex((prevIndex) => prevIndex + numWords);
                }
                break;
            case 'ArrowLeft':
                // If user presses left arrow, move to the previous set of words or sentences
                if (isReading || isPaused && currentIndex > 0) {
                    setCurrentIndex((prevIndex) => Math.max(prevIndex - numWords, 0));
                }
                break;
            default:
                break;
        }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
        window.removeEventListener('keydown', handleKeydown);
    };
}, [isReading, isPaused, currentIndex, numWords, handleFullscreenToggle]);


  return (
    <Container>
      <Typography variant="h4" gutterBottom>Speed Reading Plus</Typography>
      <form onSubmit={handleCustomTextSubmit}>
        <TextField
          label="Enter custom text"
          variant="outlined"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          fullWidth
        />
        <Button type="submit" variant="contained" color="primary" style={{ marginTop: 16 }}>Set Text</Button>
      </form>
      <input type="file" onChange={handleFileUpload} accept=".pdf, .txt" style={{ marginTop: 16 }} />
      <Box marginTop={2}>
        <Typography>Text Size</Typography>
        <Slider
          value={textSize}
          onChange={(e, newValue) => setTextSize(newValue)}
          aria-labelledby="text-size-slider"
          min={10}
          max={200}
          step={10}
          valueLabelDisplay="auto"
        />
      </Box>
      <Box marginTop={2}>
        <Typography>Font Family</Typography>
        <Select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          fullWidth
        >
          <MenuItem value="Arial">Arial</MenuItem>
          <MenuItem value="Courier New">Courier New</MenuItem>
          <MenuItem value="Georgia">Georgia</MenuItem>
          <MenuItem value="Times New Roman">Times New Roman</MenuItem>
          <MenuItem value="Verdana">Verdana</MenuItem>
        </Select>
      </Box>
      <Box marginTop={2}>
        <Typography>Font Color</Typography>
        <input
          type="color"
          value={fontColor}
          onChange={(e) => setFontColor(e.target.value)}
        />
      </Box>
      <Box marginTop={2}>
        <Typography>Background Color</Typography>
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
        />
      </Box>
      <Box marginTop={2}>
        <Typography>Panel Color</Typography>
        <input
          type="color"
          value={panelColor}
          onChange={(e) => setPanelColor(e.target.value)}
        />
      </Box>
      <Box marginTop={2}>
        <Button variant="contained" color="primary" onClick={toggleDisplayMode}>
          Switch to {displayMode === 'words' ? 'Sentences' : 'Words'}
        </Button>
      </Box>
      <Box marginTop={2}>
        <Typography>Number of {displayMode === 'words' ? 'Words' : 'Sentences'}</Typography>
        <Slider
          value={numWords}
          onChange={handleSliderChange}
          aria-labelledby="num-words-slider"
          min={1}
          max={10}
          step={1}
          valueLabelDisplay="auto"
        />
      </Box>
      <Box textAlign="center" marginTop={2} style={{ backgroundColor: panelColor, padding: 20 }}>
        <Typography
          variant="h5"
          style={{ fontSize: textSize, fontFamily: fontFamily, color: fontColor, backgroundColor: backgroundColor }}
        >
          {displayMode === 'words'
            ? text.split(' ').slice(currentIndex, currentIndex + numWords).join(' ')
            : (text.match(/[^.!?]+[.!?]+/g) || []).slice(currentIndex, currentIndex + numWords).join(' ')}
        </Typography>
        <Box display="flex" justifyContent="center" marginTop={2}>
          <Button variant="contained" color="secondary" onClick={handleStart} style={{ marginRight: 8 }}>Start</Button>
          {isReading && !isPaused ? (
            <Button variant="contained" color="warning" onClick={handlePause} style={{ marginRight: 8 }}>Pause</Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleResume} style={{ marginRight: 8 }}>Resume</Button>
          )}
          <Button variant="contained" color="error" onClick={handleRestart}>Restart</Button>
        </Box>
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
            style={{ width: '80%', margin: '0 auto' }}
          />
        </Box>
        <Box marginTop={2}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
        <Box display="flex" justifyContent="flex-end" marginTop={2}>
          <Button variant="outlined" onClick={handleFullscreenToggle}>Toggle Fullscreen Mode</Button>
        </Box>
      </Box>
      <Dialog open={fullscreen} onClose={handleFullscreenToggle} fullScreen style={{ backgroundColor: backgroundColor }}>
        <DialogTitle>Full Screen Mode</DialogTitle>
        <DialogContent style={{ backgroundColor: backgroundColor, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography
            variant="h4"
            style={{ fontSize: textSize, fontFamily: fontFamily, color: fontColor, textAlign: 'center' }}
          >
            {displayMode === 'words'
              ? text.split(' ').slice(currentIndex, currentIndex + numWords).join(' ')
              : (text.match(/[^.!?]+[.!?]+/g) || []).slice(currentIndex, currentIndex + numWords).join(' ')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFullscreenToggle} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Box display="flex" justifyContent="center" marginTop={2}>
        <Button variant="contained" color="primary" onClick={handleSaveProgress} style={{ marginRight: 8 }}>Save for Later</Button>
        <input type="file" onChange={handleLoadProgress} accept=".json" style={{ display: 'none' }} id="load-progress" />
        <label htmlFor="load-progress">
          <Button variant="contained" color="secondary" component="span">Load</Button>
        </label>
      </Box>
      <Box marginTop={2}>
        <TextField
          label="Start Page"
          variant="outlined"
          type="number"
          value={startPage}
          onChange={handleStartPageChange}
        />
        <TextField
          label="End Page"
          variant="outlined"
          type="number"
          value={endPage}
          onChange={handleEndPageChange}
        />
      </Box>
    </Container>
  );
}

export default SpeedReadingPlus;
