// src/components/TopBar.js

import React from 'react';
import './TopBar.css';

const TopBar = ({ onPanelChange }) => {
  return (
    <div className="top-bar">
      <ul>
        <li><a href="#todo" onClick={() => onPanelChange('todo')}>To-Do List</a></li>
        <li><a href="#typing" onClick={() => onPanelChange('typing')}>Typing Test</a></li>
        <li><a href="#speedreading" onClick={() => onPanelChange('speedreading')}>Speed Reading</a></li>
        <li><a href="#dashboard" onClick={() => onPanelChange('dashboard')}>Dashboard</a></li>
      </ul>
    </div>
  );
};

export default TopBar;
