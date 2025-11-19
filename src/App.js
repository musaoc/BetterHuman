// src/App.js

import React, { useState } from "react";
import TopBar from "./components/TopBar";
import "./App.css";
import TodoList from "./components/TodoList";
import SpeedTest from "./components/SpeedTest";
import SpeedReadingPlus from "./components/SpeedReading";
import Quests from "./components/Quests";
import MultiplayerTyping from "./components/MultiplayerTyping";

function App() {
  const [activePanel, setActivePanel] = useState("todo");

  const handlePanelChange = (panel) => {
    setActivePanel(panel);
  };

  return (
    <div className="App">
      <TopBar onPanelChange={handlePanelChange} />
      <div className="main-content">
        {activePanel === "todo" && <TodoList />}
        {activePanel === "typing" && <SpeedTest />}
        {activePanel === "multiplayer" && <MultiplayerTyping />}
        {activePanel === "speedreading" && <SpeedReadingPlus />}
        {activePanel === "Quests" && <Quests />}
      </div>
    </div>
  );
}

export default App;
