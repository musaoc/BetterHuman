import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  return (
    <div className="sidebar">
      <ul>
        <li><Link to="/">To-Do List</Link></li>
        <li><Link to="/typing-speed-tester">Typing Speed Tester</Link></li>
        <li><Link to="/speed-reading">Speed Reading</Link></li>
      </ul>
    </div>
  );
}

export default Sidebar;
