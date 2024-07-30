// src/components/SpeedTest.js

import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';

function SpeedTest() {
  const [customText, setCustomText] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [typedText, setTypedText] = useState('');

  const handleStartTest = () => {
    setDisplayText(customText);
    setTypedText('');
    setStartTime(Date.now());
  };

  const handleInputChange = (e) => {
    setTypedText(e.target.value);
    if (e.target.value === displayText) {
      const timeTaken = (Date.now() - startTime) / 1000;
      alert(`Completed in ${timeTaken} seconds!`);
      setTypedText('');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Typing Speed Test</Typography>
      <TextField
        label="Custom Text"
        variant="outlined"
        value={customText}
        onChange={(e) => setCustomText(e.target.value)}
        fullWidth
      />
      <Button onClick={handleStartTest} variant="contained" color="primary" style={{ marginTop: 16 }}>Start Test</Button>
      <Box marginTop={2}>
        <Typography variant="h5">{displayText}</Typography>
        <TextField
          label="Type here"
          variant="outlined"
          value={typedText}
          onChange={handleInputChange}
          fullWidth
        />
      </Box>
    </Box>
  );
}

export default SpeedTest;
