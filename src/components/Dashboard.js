import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import UserStats from "./UserStats";
import "../App.css";
import TodoList from "./TodoList";
import SpeedTest from "./SpeedTest";
import SpeedReadingPlus from "./speed-reading";
import Quests from "./Quests";
import MultiplayerTyping from "./MultiplayerTyping";

export default function Dashboard() {
  const [showStats, setShowStats] = useState(false);
  const location = useLocation();
  
  // Show stats panel on main pages
  const showStatsPanel = ['/', '/todo', '/typing', '/speedreading'].includes(location.pathname);

  return (
    <div className="App">
      <TopBar onToggleStats={() => setShowStats(!showStats)} />
      <div className="dashboard-layout">
        {showStatsPanel && showStats && (
          <aside className="stats-sidebar">
            <UserStats />
          </aside>
        )}
        <main className={`main-content ${showStats && showStatsPanel ? 'with-sidebar' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/todo" replace />} />
            <Route path="/todo" element={<TodoList />} />
            <Route path="/typing" element={<SpeedTest />} />
            <Route path="/multiplayer" element={<MultiplayerTyping />} />
            <Route path="/speedreading" element={<SpeedReadingPlus />} />
            <Route path="/quests" element={<Quests />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
