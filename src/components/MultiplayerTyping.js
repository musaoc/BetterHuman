import React, { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import "./MultiplayerTyping.css";

const EMOJIS = ["🏎️", "🚗", "🚙", "🚕", "🚓", "🚑", "🚒", "🚐"];

function MultiplayerTyping() {
  // Connection
  const [socket, setSocket] = useState(null);

  // User state
  const [username, setUsername] = useState("");
  const [emoji, setEmoji] = useState("🏎️");
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [mySocketId, setMySocketId] = useState("");

  // Room state
  const [players, setPlayers] = useState([]);
  const [settings, setSettings] = useState({
    gameMode: "time",
    timeLimit: 300,
    wordCount: 100,
  });

  // Game state
  const [gameState, setGameState] = useState("join"); // join, lobby, countdown, racing, finished
  const [countdown, setCountdown] = useState(5);

  // Typing state
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [wordStatuses, setWordStatuses] = useState([]);

  // Timing
  const [startTime, setStartTime] = useState(null);
  const [typingStarted, setTypingStarted] = useState(false);
  const [personalStartTime, setPersonalStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Stats
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const statsIntervalRef = useRef(null);
  const usernameInputRef = useRef(null);
  const roomCodeInputRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setMySocketId(newSocket.id);
      console.log("Connected to server");
    });

    return () => newSocket.close();
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on("roomCreated", (data) => {
      setRoomCode(data.roomCode);
      setIsHost(data.isHost);
      setGameState("lobby");
    });

    socket.on("roomJoined", (data) => {
      setRoomCode(data.roomCode);
      setIsHost(data.isHost);
      setGameState("lobby");
    });

    socket.on("lobbyUpdate", (data) => {
      setPlayers(data.players);
      setSettings(data.settings);
    });

    socket.on("countdownStart", (data) => {
      setGameState("countdown");
      setCountdown(data.count);
    });

    socket.on("countdownTick", (data) => {
      setCountdown(data.count);
    });

    socket.on("gameStart", (data) => {
      setWords(data.words);
      setStartTime(data.startTime);
      setGameState("racing");
      setCurrentWordIndex(0);
      setCurrentCharIndex(0);
      setCorrectChars(0);
      setTotalChars(0);
      setWordStatuses([]);
      setTypingStarted(false);
      setTimeRemaining(data.settings.timeLimit || 0);
    });

    socket.on("timerUpdate", (data) => {
      setTimeRemaining(data.remaining);
    });

    socket.on("playerProgress", (data) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.socketId === data.socketId
            ? {
                ...p,
                progress: data.progress,
                wpm: data.wpm,
                accuracy: data.accuracy,
              }
            : p
        )
      );
    });

    socket.on("gameEnd", (data) => {
      setLeaderboard(data.leaderboard);
      setGameState("finished");
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    });

    socket.on("returnedToLobby", (data) => {
      setPlayers(data.players);
      setSettings(data.settings);
      setGameState("lobby");
    });

    socket.on("error", (data) => {
      alert(data.message);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("lobbyUpdate");
      socket.off("countdownStart");
      socket.off("countdownTick");
      socket.off("gameStart");
      socket.off("timerUpdate");
      socket.off("playerProgress");
      socket.off("gameEnd");
      socket.off("returnedToLobby");
      socket.off("error");
    };
  }, [socket]);

  // Update stats during race
  useEffect(() => {
    if (gameState === "racing" && typingStarted) {
      statsIntervalRef.current = setInterval(() => {
        updatePersonalStats();
      }, 100);
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [
    gameState,
    typingStarted,
    correctChars,
    totalChars,
    personalStartTime,
    currentWordIndex,
    words.length,
  ]);

  const updatePersonalStats = useCallback(() => {
    if (!typingStarted || !personalStartTime) return;

    const timeElapsed = (Date.now() - personalStartTime) / 1000 / 60;
    const newWpm = Math.round(correctChars / 5 / timeElapsed) || 0;
    const newAccuracy =
      totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
    const newProgress = Math.round((currentWordIndex / words.length) * 100);

    setWpm(newWpm);
    setAccuracy(newAccuracy);
    setProgress(newProgress);
  }, [
    typingStarted,
    personalStartTime,
    correctChars,
    totalChars,
    currentWordIndex,
    words.length,
  ]);

  // Keyboard handler for typing
  useEffect(() => {
    if (gameState !== "racing") return;

    const handleTyping = (e) => {
      const key = e.key;
      const currentWord = words[currentWordIndex];

      if (!currentWord) return;

      if (!typingStarted) {
        setTypingStarted(true);
        setPersonalStartTime(Date.now());
      }

      if (key === "Backspace") {
        e.preventDefault();
        if (currentCharIndex > 0) {
          setCurrentCharIndex((prev) => prev - 1);
          setWordStatuses((prev) => {
            const newStatuses = [...prev];
            if (newStatuses[currentWordIndex]) {
              newStatuses[currentWordIndex] = newStatuses[
                currentWordIndex
              ].slice(0, -1);
            }
            return newStatuses;
          });
          setTotalChars((prev) => Math.max(0, prev - 1));
          if (wordStatuses[currentWordIndex]?.[currentCharIndex - 1]) {
            setCorrectChars((prev) => Math.max(0, prev - 1));
          }
        }
      } else if (key === " ") {
        e.preventDefault();

        if (currentCharIndex === currentWord.length) {
          const nextIndex = currentWordIndex + 1;
          setCurrentWordIndex(nextIndex);
          setCurrentCharIndex(0);

          if (nextIndex >= words.length) {
            handleRaceComplete();
            return;
          }

          sendProgressUpdate(nextIndex);
        }
      } else if (key.length === 1) {
        e.preventDefault();

        const expectedChar = currentWord[currentCharIndex];
        const isCorrect = key === expectedChar;

        setWordStatuses((prev) => {
          const newStatuses = [...prev];
          if (!newStatuses[currentWordIndex]) {
            newStatuses[currentWordIndex] = [];
          }
          newStatuses[currentWordIndex][currentCharIndex] = isCorrect;
          return newStatuses;
        });

        setTotalChars((prev) => prev + 1);
        if (isCorrect) setCorrectChars((prev) => prev + 1);
        setCurrentCharIndex((prev) => prev + 1);
      }
    };

    document.addEventListener("keydown", handleTyping);
    return () => document.removeEventListener("keydown", handleTyping);
  }, [
    gameState,
    words,
    currentWordIndex,
    currentCharIndex,
    typingStarted,
    wordStatuses,
  ]);

  const sendProgressUpdate = (wordIndex = currentWordIndex) => {
    const newProgress = Math.round((wordIndex / words.length) * 100);
    const timeElapsed = typingStarted
      ? (Date.now() - personalStartTime) / 1000 / 60
      : 0;
    const newWpm = Math.round(correctChars / 5 / timeElapsed) || 0;
    const newAccuracy =
      totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

    socket.emit("progressUpdate", {
      roomCode,
      progress: newProgress,
      wpm: newWpm,
      accuracy: newAccuracy,
      currentWordIndex: wordIndex,
    });
  };

  const handleRaceComplete = () => {
    socket.emit("progressUpdate", {
      roomCode,
      progress: 100,
      wpm,
      accuracy,
      currentWordIndex: words.length,
      finished: true,
      finishTime: Date.now(),
    });
  };

  const handleCreateRoom = () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }
    socket.emit("createRoom", { username: username.trim(), emoji });
  };

  const handleJoinRoom = () => {
    if (!username.trim() || !roomCode.trim()) {
      alert("Please enter username and room code");
      return;
    }
    socket.emit("joinRoom", {
      username: username.trim(),
      emoji,
      roomCode: roomCode.trim().toUpperCase(),
    });
  };

  const handleToggleReady = () => {
    socket.emit("toggleReady", { roomCode });
  };

  const handleStartGame = () => {
    if (!isHost) return;
    socket.emit("startGame", { roomCode });
  };

  const handleSettingChange = (key, value) => {
    if (!isHost) return;
    socket.emit("updateSettings", {
      roomCode,
      settings: { ...settings, [key]: value },
    });
  };

  const handleReturnToLobby = () => {
    socket.emit("returnToLobby", { roomCode });
  };

  // Render functions
  const renderWords = () => {
    const startIdx = Math.max(0, currentWordIndex - 2);
    const endIdx = Math.min(words.length, startIdx + 10);

    return words.slice(startIdx, endIdx).map((word, idx) => {
      const wordIdx = startIdx + idx;
      let className = "word";

      if (wordIdx === currentWordIndex) {
        className += " current";
      } else if (wordIdx < currentWordIndex) {
        const statuses = wordStatuses[wordIdx] || [];
        const allCorrect = statuses.every((status) => status === true);
        className += allCorrect ? " correct" : " incorrect";
      }

      return (
        <span key={wordIdx} className={className}>
          {word}
        </span>
      );
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Screen renders
  if (gameState === "join") {
    return (
      <div className="multiplayer-typing">
        <div className="join-screen">
          <h1>🏁 Multiplayer Typing Race</h1>
          <div className="user-setup">
            <h2>Setup Your Profile</h2>
            <div className="input-group">
              <label>Username:</label>
              <input
                ref={usernameInputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>
            <div className="input-group">
              <label>Select Emoji:</label>
              <div className="emoji-grid">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    className={`emoji-btn ${emoji === e ? "selected" : ""}`}
                    onClick={() => setEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="selected-emoji">Selected: {emoji}</div>
            </div>
          </div>
          <div className="room-actions">
            <button className="btn btn-primary" onClick={handleCreateRoom}>
              Create New Room
            </button>
            <div className="join-room">
              <input
                ref={roomCodeInputRef}
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Room Code"
                maxLength={4}
              />
              <button className="btn btn-secondary" onClick={handleJoinRoom}>
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "lobby") {
    return (
      <div className="multiplayer-typing">
        <div className="lobby-screen">
          <h1>Room: {roomCode}</h1>
          <div className="lobby-content">
            <div className="players-section">
              <h2>Players</h2>
              <div className="players-list">
                {players.map((player) => (
                  <div key={player.socketId} className="player-item">
                    <span className="player-emoji">{player.emoji}</span>
                    <span className="player-name">
                      {player.socketId ===
                        players.find((p) => p.socketId === mySocketId)
                          ?.socketId && isHost
                        ? "👑 "
                        : ""}
                      {player.username}
                    </span>
                    <span className="player-status">
                      {player.ready ? "✅" : "⏳"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="settings-section">
              <h2>Game Settings {!isHost && "(Host Only)"}</h2>
              <div className="settings-panel">
                <div className="setting-group">
                  <label>Game Mode:</label>
                  <select
                    value={settings.gameMode}
                    onChange={(e) =>
                      handleSettingChange("gameMode", e.target.value)
                    }
                    disabled={!isHost}
                  >
                    <option value="time">Time Limit</option>
                    <option value="words">Word Count</option>
                  </select>
                </div>
                {settings.gameMode === "time" && (
                  <div className="setting-group">
                    <label>Time Limit:</label>
                    <select
                      value={settings.timeLimit}
                      onChange={(e) =>
                        handleSettingChange(
                          "timeLimit",
                          parseInt(e.target.value)
                        )
                      }
                      disabled={!isHost}
                    >
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={180}>3 minutes</option>
                      <option value={300}>5 minutes</option>
                    </select>
                  </div>
                )}
                {settings.gameMode === "words" && (
                  <div className="setting-group">
                    <label>Word Count:</label>
                    <select
                      value={settings.wordCount}
                      onChange={(e) =>
                        handleSettingChange(
                          "wordCount",
                          parseInt(e.target.value)
                        )
                      }
                      disabled={!isHost}
                    >
                      <option value={50}>50 words</option>
                      <option value={100}>100 words</option>
                      <option value={150}>150 words</option>
                      <option value={200}>200 words</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lobby-actions">
            <button className="btn btn-secondary" onClick={handleToggleReady}>
              {players.find((p) => p.socketId === mySocketId)?.ready
                ? "Not Ready"
                : "I'm Ready!"}
            </button>
            {isHost && (
              <button className="btn btn-primary" onClick={handleStartGame}>
                Start Game
              </button>
            )}
            <button
              className="btn btn-danger"
              onClick={() => setGameState("join")}
            >
              Leave Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "countdown") {
    return (
      <div className="multiplayer-typing">
        <div className="countdown-screen">
          <div className="countdown-number">{countdown}</div>
        </div>
      </div>
    );
  }

  if (gameState === "racing") {
    return (
      <div className="multiplayer-typing">
        <div className="race-screen">
          <div className="race-header">
            {settings.gameMode === "time" && (
              <div className="timer-display">{formatTime(timeRemaining)}</div>
            )}
            <div className="stats-bar">
              {players.map((player) => (
                <div key={player.socketId} className="stat-item">
                  <span className="stat-emoji">{player.emoji}</span>
                  <span className="stat-name">{player.username}</span>
                  <span className="stat-wpm">{player.wpm} WPM</span>
                  <span className="stat-accuracy">{player.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="progress-track">
            {players.map((player) => (
              <div
                key={player.socketId}
                className="racer"
                style={{ left: `${player.progress}%` }}
              >
                {player.emoji}
              </div>
            ))}
          </div>
          <div className="typing-container">
            <div className="words-display">{renderWords()}</div>
          </div>
          <div className="personal-stats">
            <div className="stat">{wpm} WPM</div>
            <div className="stat">{accuracy}% Accuracy</div>
            <div className="stat">{progress}% Complete</div>
          </div>
          <button className="btn btn-secondary" onClick={handleReturnToLobby}>
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (gameState === "finished") {
    return (
      <div className="multiplayer-typing">
        <div className="results-screen">
          <h1>🏆 Race Results</h1>
          <div className="leaderboard">
            {leaderboard.map((player, index) => (
              <div key={player.socketId} className="leaderboard-item">
                <span className="rank">
                  {index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : `#${index + 1}`}
                </span>
                <span className="player-emoji">{player.emoji}</span>
                <span className="player-name">{player.username}</span>
                <span className="player-wpm">{player.wpm} WPM</span>
                <span className="player-accuracy">{player.accuracy}%</span>
                <span className="player-score">{player.score} pts</span>
              </div>
            ))}
          </div>
          <div className="results-actions">
            <button className="btn btn-primary" onClick={handleReturnToLobby}>
              Play Again
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              New Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default MultiplayerTyping;
