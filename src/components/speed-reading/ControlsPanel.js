import React from 'react';
import { TextField, Button, Box, Slider, MenuItem, Select, Typography } from '@mui/material';

const ControlsPanel = (props) => {
  const {
    customText,
    setCustomText,
    handleCustomTextSubmit,
    handleFileUpload,
    textSize,
    setTextSize,
    fontFamily,
    setFontFamily,
    fontColor,
    setFontColor,
    backgroundColor,
    setBackgroundColor,
    panelColor,
    setPanelColor,
    displayMode,
    toggleDisplayMode,
    numWords,
    handleSliderChange,
    startPage,
    handleStartPageChange,
    endPage,
    handleEndPageChange,
    handleSaveProgress,
    handleLoadProgress
  } = props;

  return (
    <div className="settings-panel">
      <div className="settings-grid">
        <div className="setting-item">
          <Typography variant="h6">Text Input</Typography>
          <form onSubmit={handleCustomTextSubmit}>
            <TextField
              label="Enter custom text"
              variant="outlined"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              fullWidth
              multiline
              rows={4}
            />
            <Button type="submit" variant="contained" color="primary" style={{ marginTop: 16 }}>Set Text</Button>
          </form>
          <input type="file" onChange={handleFileUpload} accept=".pdf, .txt" style={{ marginTop: 16 }} />
        </div>
        <div className="setting-item">
          <Typography variant="h6">Display Settings</Typography>
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
        </div>
        <div className="setting-item">
          <Typography variant="h6">Color Settings</Typography>
          <Typography>Font Color</Typography>
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
          />
          <Typography>Background Color</Typography>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
          />
          <Typography>Panel Color</Typography>
          <input
            type="color"
            value={panelColor}
            onChange={(e) => setPanelColor(e.target.value)}
          />
        </div>
        <div className="setting-item">
          <Typography variant="h6">Reading Mode</Typography>
          <Button variant="contained" color="primary" onClick={toggleDisplayMode}>
            Switch to {displayMode === 'words' ? 'Sentences' : 'Words'}
          </Button>
          <Typography style={{ marginTop: 16 }}>Number of {displayMode === 'words' ? 'Words' : 'Sentences'}</Typography>
          <Slider
            value={numWords}
            onChange={handleSliderChange}
            aria-labelledby="num-words-slider"
            min={1}
            max={10}
            step={1}
            valueLabelDisplay="auto"
          />
        </div>
        <div className="setting-item">
          <Typography variant="h6">PDF Page Selection</Typography>
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
        </div>
        <div className="setting-item">
        <Typography variant="h6">Progress</Typography>
          <Box display="flex" justifyContent="center" marginTop={2}>
            <Button variant="contained" color="primary" onClick={handleSaveProgress} style={{ marginRight: 8 }}>Save</Button>
            <input type="file" onChange={handleLoadProgress} accept=".json" style={{ display: 'none' }} id="load-progress" />
            <label htmlFor="load-progress">
              <Button variant="contained" color="secondary" component="span">Load</Button>
            </label>
          </Box>
        </div>
      </div>
    </div>
  );
};

export default ControlsPanel;
