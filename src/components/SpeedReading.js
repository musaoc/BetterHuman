import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
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
          const buffer = e.target.result;
          const pdfDoc = await PDFDocument.load(buffer);
          let textContent = '';
          for (let i = startPage - 1; i < endPage; i++) {
            const page = pdfDoc.getPages()[i];
            const pageText = await page.getTextContent();
            textContent += pageText.items.map(item => item.str).join(' ') + ' ';
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
      numWords
    };
    const csvContent = `data:text/csv;charset=utf-8,${Object.keys(progressData).join(',')}\n${Object.values(progressData).join(',')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'reading_progress.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadProgress = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target.result.split('\n')[1].split(',');
        setText(csvData[0]);
        setCurrentIndex(Number(csvData[1]));
        setReadingSpeed(Number(csvData[2]));
        setTextSize(Number(csvData[3]));
        setFontFamily(csvData[4]);
        setBackgroundColor(csvData[5]);
        setPanelColor(csvData[6]);
        setFontColor(csvData[7]);
        setNumWords(Number(csvData[8]));
        setProgress((Number(csvData[1]) / csvData[0].split(' ').length) * 100);
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
        <input type="file" onChange={handleLoadProgress} accept=".csv" style={{ display: 'none' }} id="load-progress" />
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
