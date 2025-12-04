import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import { Container, Grid, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { recordReadingSession } from '../../services/userService';
import ControlsPanel from './ControlsPanel';
import ReadingDisplay from './ReadingDisplay';
import './SpeedReading.css';

function SpeedReadingPlus() {
  const { currentUser } = useAuth();
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
  const [panelColor, setPanelColor] = useState('#1a1d23');
  const [fontColor, setFontColor] = useState('#ffffff');
  const [numWords, setNumWords] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [displayMode, setDisplayMode] = useState('words');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [wordsReadInSession, setWordsReadInSession] = useState(0);

  const handleStart = () => {
    setIsReading(true);
    setIsPaused(false);
    setCurrentIndex(0);
    setProgress(0);
    setSessionStartTime(Date.now());
    setWordsReadInSession(0);
  };

  const handlePause = async () => {
    setIsPaused(true);
    // Save progress when pausing
    if (currentUser && sessionStartTime) {
      const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
      await recordReadingSession(currentUser.uid, wordsReadInSession, timeSpent);
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    setSessionStartTime(Date.now());
  };

  const handleRestart = () => {
    setIsReading(true);
    setIsPaused(false);
    setCurrentIndex(0);
    setProgress(0);
    setSessionStartTime(Date.now());
    setWordsReadInSession(0);
  };

  useEffect(() => {
    let interval;
    if (isReading && !isPaused) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const wordsOrSentences = displayMode === 'words' ? text.split(' ') : text.match(/[^.!?]+[.!?]+/g) || [];
          if (prevIndex < wordsOrSentences.length - numWords) {
            setProgress(((prevIndex + numWords) / wordsOrSentences.length) * 100);
            setWordsReadInSession(prev => prev + numWords);
            return prevIndex + numWords;
          } else {
            clearInterval(interval);
            setIsReading(false);
            // Save session on completion
            if (currentUser && sessionStartTime) {
              const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
              recordReadingSession(currentUser.uid, wordsReadInSession + numWords, timeSpent);
            }
            return prevIndex;
          }
        });
      }, 60000 / readingSpeed);
    }
    return () => clearInterval(interval);
  }, [isReading, isPaused, text, readingSpeed, numWords, displayMode, currentUser, sessionStartTime, wordsReadInSession]);

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
    setNumWords(1);
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
                e.preventDefault();
                if (isReading) {
                    isPaused ? handleResume() : handlePause();
                }
                break;
            case 'ArrowRight':
                if (isReading || isPaused) {
                    setCurrentIndex((prevIndex) => prevIndex + numWords);
                }
                break;
            case 'ArrowLeft':
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

  const words = text.split(' ');
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const displayContent = displayMode === 'words' ? words.slice(currentIndex, currentIndex + numWords).join(' ') : sentences.slice(currentIndex, currentIndex + numWords).join(' ');

  return (
    <div className="speed-reading-container">
      <div className="reading-header">
        <h1 className="reading-title">📖 Speed Reading Plus</h1>
        <p className="reading-subtitle">Train your brain to read faster and comprehend better</p>
      </div>
      
      <div className="speed-reading-layout">
        <div className="controls-column">
          <ControlsPanel
            customText={customText}
            setCustomText={setCustomText}
            handleCustomTextSubmit={handleCustomTextSubmit}
            handleFileUpload={handleFileUpload}
            textSize={textSize}
            setTextSize={setTextSize}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontColor={fontColor}
            setFontColor={setFontColor}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            panelColor={panelColor}
            setPanelColor={setPanelColor}
            displayMode={displayMode}
            toggleDisplayMode={toggleDisplayMode}
            numWords={numWords}
            handleSliderChange={handleSliderChange}
            startPage={startPage}
            handleStartPageChange={handleStartPageChange}
            endPage={endPage}
            handleEndPageChange={handleEndPageChange}
            handleSaveProgress={handleSaveProgress}
            handleLoadProgress={handleLoadProgress}
          />
        </div>
        
        <div className="display-column">
          <ReadingDisplay
            displayContent={displayContent}
            panelColor={panelColor}
            textSize={textSize}
            fontFamily={fontFamily}
            fontColor={fontColor}
            backgroundColor={backgroundColor}
            isReading={isReading}
            isPaused={isPaused}
            handleStart={handleStart}
            handlePause={handlePause}
            handleResume={handleResume}
            handleRestart={handleRestart}
            readingSpeed={readingSpeed}
            setReadingSpeed={setReadingSpeed}
            progress={progress}
            handleFullscreenToggle={handleFullscreenToggle}
            wordsRead={wordsReadInSession}
            totalWords={words.length}
          />
        </div>
      </div>
      
      <Dialog 
        open={fullscreen} 
        onClose={handleFullscreenToggle} 
        fullScreen 
        PaperProps={{
          style: { backgroundColor: backgroundColor }
        }}
      >
        <DialogContent 
          style={{ 
            backgroundColor: backgroundColor, 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            padding: '2rem'
          }}
        >
          <div className="fullscreen-progress">
            <div className="fullscreen-progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <Typography
            variant="h4"
            style={{ 
              fontSize: textSize, 
              fontFamily: fontFamily, 
              color: fontColor, 
              textAlign: 'center',
              maxWidth: '80%',
              lineHeight: 1.4
            }}
          >
            {displayContent || 'Ready to read...'}
          </Typography>
          <div className="fullscreen-controls">
            <span className="speed-indicator">{readingSpeed} WPM</span>
            <span className="words-indicator">{wordsReadInSession} words read</span>
          </div>
        </DialogContent>
        <DialogActions style={{ backgroundColor: backgroundColor, justifyContent: 'center', padding: '1rem' }}>
          <Button 
            onClick={handleFullscreenToggle} 
            variant="contained"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '10px 30px'
            }}
          >
            Exit Fullscreen
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default SpeedReadingPlus;
