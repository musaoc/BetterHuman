import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './Sidebar';
import TodoList from './TodoList';
import TypingSpeedTester from './TypingSpeedTester';
import SpeedReading from './SpeedReading';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<TodoList />} />
            <Route path="/typing-speed-tester" element={<TypingSpeedTester />} />
            <Route path="/speed-reading" element={<SpeedReading />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
