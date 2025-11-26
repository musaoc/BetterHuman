const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

// In-memory rooms store
const rooms = {};

// Small word bank for game
const wordBank = [
  "ability",
  "about",
  "above",
  "accept",
  "according",
  "account",
  "action",
  "activity",
  "actually",
  "address",
  "allow",
  "almost",
  "alone",
  "along",
  "already",
  "also",
  "always",
  "among",
  "amount",
  "analysis",
  "animal",
  "another",
  "answer",
  "anyone",
  "appear",
  "apply",
  "approach",
  "area",
  "argue",
  "around",
  "arrive",
  "article",
  "artist",
  "assume",
  "attack",
  "attention",
  "audience",
  "author",
  "available",
  "avoid",
  "away",
  "baby",
  "back",
  "ball",
  "bank",
  "base",
  "beat",
  "because",
  "become",
  "before",
  "begin",
  "behavior",
  "behind",
  "believe",
  "benefit",
  "best",
  "better",
  "between",
  "beyond",
  "billion",
  "black",
  "blood",
  "blue",
  "board",
  "body",
  "book",
  "both",
  "break",
  "bring",
  "brother",
  "budget",
  "build",
  "building",
  "business",
  "call",
  "camera",
  "campaign",
  "cancer",
  "candidate",
  "capital",
  "card",
  "care",
  "career",
  "carry",
  "case",
  "catch",
  "cause",
  "cell",
  "center",
  "central",
  "certain",
  "chair",
  "challenge",
  "chance",
  "change",
  "character",
  "charge",
  "check",
  "child",
  "choice",
  "choose",
  "church",
  "citizen",
  "city",
  "civil",
  "claim",
  "class",
  "clear",
  "close",
];

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  do {
    code = "";
    for (let i = 0; i < 4; i++)
      code += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms[code]);
  return code;
}

function generateWords(count) {
  const words = [];
  for (let i = 0; i < count; i++)
    words.push(wordBank[Math.floor(Math.random() * wordBank.length)]);
  return words;
}

function calculateScore(player) {
  return Math.round(
    player.wpm * (player.accuracy / 100) * (player.progress / 100)
  );
}

function endGame(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  room.gameState = "finished";
  const leaderboard = room.players.map((p) => ({
    socketId: p.socketId,
    username: p.username,
    emoji: p.emoji,
    wpm: p.wpm,
    accuracy: p.accuracy,
    progress: p.progress,
    score: calculateScore(p),
    finishTime: p.finishTime,
  }));
  leaderboard.sort((a, b) => b.score - a.score);
  io.to(roomCode).emit("gameEnd", { leaderboard });
}

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);

  socket.on("createRoom", (data) => {
    const code = generateRoomCode();
    const player = {
      socketId: socket.id,
      username: data.username,
      emoji: data.emoji,
      ready: false,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      currentWordIndex: 0,
      finished: false,
      finishTime: null,
    };
    rooms[code] = {
      host: socket.id,
      players: [player],
      settings: { gameMode: "time", timeLimit: 300, wordCount: 100 },
      gameState: "lobby",
      words: [],
      startTime: null,
      countdownInterval: null,
      gameInterval: null,
    };
    socket.join(code);
    socket.emit("roomCreated", { roomCode: code, player, isHost: true });
    io.to(code).emit("lobbyUpdate", {
      players: rooms[code].players,
      settings: rooms[code].settings,
    });
  });

  socket.on("joinRoom", (data) => {
    const roomCode = (data.roomCode || "").toUpperCase();
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }
    if (room.gameState !== "lobby") {
      socket.emit("error", { message: "Game already in progress" });
      return;
    }
    const player = {
      socketId: socket.id,
      username: data.username,
      emoji: data.emoji,
      ready: false,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      currentWordIndex: 0,
      finished: false,
      finishTime: null,
    };
    room.players.push(player);
    socket.join(roomCode);
    socket.emit("roomJoined", { roomCode, player, isHost: false });
    io.to(roomCode).emit("lobbyUpdate", {
      players: room.players,
      settings: room.settings,
    });
  });

  socket.on("toggleReady", (data) => {
    const room = rooms[data.roomCode];
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    player.ready = !player.ready;
    io.to(data.roomCode).emit("lobbyUpdate", {
      players: room.players,
      settings: room.settings,
    });
  });

  socket.on("updateSettings", (data) => {
    const room = rooms[data.roomCode];
    if (!room || room.host !== socket.id) return;
    room.settings = { ...room.settings, ...data.settings };
    io.to(data.roomCode).emit("lobbyUpdate", {
      players: room.players,
      settings: room.settings,
    });
  });

  socket.on("startGame", (data) => {
    const room = rooms[data.roomCode];
    if (!room || room.host !== socket.id) return;
    const allReady = room.players.every(
      (p) => p.ready || p.socketId === room.host
    );
    if (!allReady || room.players.length < 1) {
      socket.emit("error", { message: "Not all players ready" });
      return;
    }
    room.gameState = "countdown";
    let count = 5;
    io.to(data.roomCode).emit("countdownStart", { count });
    room.countdownInterval = setInterval(() => {
      count--;
      if (count > 0) io.to(data.roomCode).emit("countdownTick", { count });
      else {
        clearInterval(room.countdownInterval);
        room.countdownInterval = null;
        const wordCount =
          room.settings.gameMode === "words" ? room.settings.wordCount : 200;
        room.words = generateWords(wordCount);
        room.startTime = Date.now();
        room.gameState = "racing";
        io.to(data.roomCode).emit("gameStart", {
          words: room.words,
          settings: room.settings,
          startTime: room.startTime,
        });
        if (room.settings.gameMode === "time") {
          const duration = room.settings.timeLimit;
          let elapsed = 0;
          room.gameInterval = setInterval(() => {
            elapsed++;
            const remaining = duration - elapsed;
            io.to(data.roomCode).emit("timerUpdate", { remaining, elapsed });
            if (remaining <= 0) {
              clearInterval(room.gameInterval);
              room.gameInterval = null;
              endGame(data.roomCode);
            }
          }, 1000);
        }
      }
    }, 1000);
  });

  socket.on("progressUpdate", (data) => {
    const room = rooms[data.roomCode];
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    player.progress = data.progress;
    player.wpm = data.wpm;
    player.accuracy = data.accuracy;
    player.currentWordIndex = data.currentWordIndex;
    if (data.finished) {
      player.finished = true;
      player.finishTime = data.finishTime;
      const allFinished = room.players.every((p) => p.finished);
      if (allFinished) {
        if (room.gameInterval) {
          clearInterval(room.gameInterval);
          room.gameInterval = null;
        }
        endGame(data.roomCode);
      }
    }
    io.to(data.roomCode).emit("playerProgress", {
      socketId: socket.id,
      progress: data.progress,
      wpm: data.wpm,
      accuracy: data.accuracy,
    });
  });

  socket.on("returnToLobby", (data) => {
    const room = rooms[data.roomCode];
    if (!room) return;
    if (room.gameInterval) {
      clearInterval(room.gameInterval);
      room.gameInterval = null;
    }
    if (room.countdownInterval) {
      clearInterval(room.countdownInterval);
      room.countdownInterval = null;
    }
    room.gameState = "lobby";
    room.words = [];
    room.startTime = null;
    room.players.forEach((p) => {
      p.ready = false;
      p.progress = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.currentWordIndex = 0;
      p.finished = false;
      p.finishTime = null;
    });
    io.to(data.roomCode).emit("returnedToLobby", {
      players: room.players,
      settings: room.settings,
    });
  });

  socket.on("restartGame", (data) => {
    const room = rooms[data.roomCode];
    if (!room || room.host !== socket.id) return;
    if (room.gameInterval) {
      clearInterval(room.gameInterval);
      room.gameInterval = null;
    }
    room.gameState = "lobby";
    room.words = [];
    room.startTime = null;
    room.players.forEach((p) => {
      p.ready = false;
      p.progress = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.currentWordIndex = 0;
      p.finished = false;
      p.finishTime = null;
    });
    io.to(data.roomCode).emit("gameRestart", {
      players: room.players,
      settings: room.settings,
    });
  });

  socket.on("disconnect", () => {
    Object.keys(rooms).forEach((roomCode) => {
      const room = rooms[roomCode];
      const idx = room.players.findIndex((p) => p.socketId === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.host === socket.id) {
          if (room.players.length > 0) {
            room.host = room.players[0].socketId;
            io.to(roomCode).emit("hostChanged", { newHost: room.host });
          } else {
            if (room.gameInterval) clearInterval(room.gameInterval);
            if (room.countdownInterval) clearInterval(room.countdownInterval);
            delete rooms[roomCode];
            return;
          }
        }
        io.to(roomCode).emit("lobbyUpdate", {
          players: room.players,
          settings: room.settings,
        });
      }
    });
  });
});

// Serve static React build if available
const clientBuildPath = path.join(__dirname, "..", "build");
if (require("fs").existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send(
      "Server running. React build not found. For dev use react-scripts start on port 3000."
    );
  });
}

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = 3001; // Different port from React dev server

// In-memory storage
const rooms = {};

// Word bank (200+ common words)
const wordBank = [
  "ability",
  "able",
  "about",
  "above",
  "accept",
  "according",
  "account",
  "across",
  "action",
  "activity",
  "actually",
  "address",
  "administration",
  "admit",
  "adult",
  "affect",
  "after",
  "again",
  "against",
  "agency",
  "agent",
  "agree",
  "agreement",
  "ahead",
  "allow",
  "almost",
  "alone",
  "along",
  "already",
  "also",
  "although",
  "always",
  "American",
  "among",
  "amount",
  "analysis",
  "animal",
  "another",
  "answer",
  "anyone",
  "anything",
  "appear",
  "apply",
  "approach",
  "area",
  "argue",
  "around",
  "arrive",
  "article",
  "artist",
  "assume",
  "attack",
  "attention",
  "attorney",
  "audience",
  "author",
  "authority",
  "available",
  "avoid",
  "away",
  "baby",
  "back",
  "ball",
  "bank",
  "base",
  "beat",
  "beautiful",
  "because",
  "become",
  "before",
  "begin",
  "behavior",
  "behind",
  "believe",
  "benefit",
  "best",
  "better",
  "between",
  "beyond",
  "billion",
  "black",
  "blood",
  "blue",
  "board",
  "body",
  "book",
  "born",
  "both",
  "break",
  "bring",
  "brother",
  "budget",
  "build",
  "building",
  "business",
  "call",
  "camera",
  "campaign",
  "cancer",
  "candidate",
  "capital",
  "card",
  "care",
  "career",
  "carry",
  "case",
  "catch",
  "cause",
  "cell",
  "center",
  "central",
  "century",
  "certain",
  "certainly",
  "chair",
  "challenge",
  "chance",
  "change",
  "character",
  "charge",
  "check",
  "child",
  "choice",
  "choose",
  "church",
  "citizen",
  "city",
  "civil",
  "claim",
  "class",
  "clear",
  "clearly",
  "close",
  "coach",
  "cold",
  "collection",
  "college",
  "color",
  "come",
  "commercial",
  "common",
  "community",
  "company",
];

// Helper functions
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  do {
    code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms[code]);
  return code;
}

function generateWords(count) {
  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(wordBank[Math.floor(Math.random() * wordBank.length)]);
  }
  return words;
}

function calculateScore(player) {
  return Math.round(
    player.wpm * (player.accuracy / 100) * (player.progress / 100)
  );
}

function endGame(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  room.gameState = "finished";

  const leaderboard = room.players.map((player) => ({
    socketId: player.socketId,
    username: player.username,
    emoji: player.emoji,
    wpm: player.wpm,
    accuracy: player.accuracy,
    progress: player.progress,
    score: calculateScore(player),
    finishTime: player.finishTime,
  }));

  leaderboard.sort((a, b) => b.score - a.score);

  io.to(roomCode).emit("gameEnd", { leaderboard });
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", (data) => {
    const roomCode = generateRoomCode();

    const player = {
      socketId: socket.id,
      username: data.username,
      emoji: data.emoji,
      ready: false,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      currentWordIndex: 0,
      finished: false,
      finishTime: null,
    };

    rooms[roomCode] = {
      host: socket.id,
      players: [player],
      settings: {
        gameMode: "time",
        timeLimit: 300,
        wordCount: 100,
      },
      gameState: "lobby",
      words: [],
      startTime: null,
      countdownInterval: null,
      gameInterval: null,
    };

    socket.join(roomCode);

    socket.emit("roomCreated", {
      roomCode,
      player,
      isHost: true,
    });

    io.to(roomCode).emit("lobbyUpdate", {
      players: rooms[roomCode].players,
      settings: rooms[roomCode].settings,
    });
  });

  socket.on("joinRoom", (data) => {
    const roomCode = data.roomCode.toUpperCase();
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    if (room.gameState !== "lobby") {
      socket.emit("error", { message: "Game already in progress" });
      return;
    }

    const player = {
      socketId: socket.id,
      username: data.username,
      emoji: data.emoji,
      ready: false,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      currentWordIndex: 0,
      finished: false,
      finishTime: null,
    };

    room.players.push(player);
    socket.join(roomCode);

    socket.emit("roomJoined", {
      roomCode,
      player,
      isHost: false,
    });

    io.to(roomCode).emit("lobbyUpdate", {
      players: room.players,
      settings: room.settings,
    });
  });

  socket.on("toggleReady", (data) => {
    const room = rooms[data.roomCode];
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    player.ready = !player.ready;

    io.to(data.roomCode).emit("lobbyUpdate", {
      players: room.players,
      settings: room.settings,
    });
  });

  socket.on("updateSettings", (data) => {
    const room = rooms[data.roomCode];
    if (!room || room.host !== socket.id) return;

    room.settings = { ...room.settings, ...data.settings };

    io.to(data.roomCode).emit("lobbyUpdate", {
      players: room.players,
      settings: room.settings,
    });
  });

  socket.on("startGame", (data) => {
    const room = rooms[data.roomCode];
    if (!room || room.host !== socket.id) return;

    const allReady = room.players.every(
      (p) => p.ready || p.socketId === room.host
    );
    if (!allReady || room.players.length < 2) {
      socket.emit("error", {
        message: "Not all players ready or need at least 2 players",
      });
      return;
    }

    room.gameState = "countdown";

    let count = 5;
    io.to(data.roomCode).emit("countdownStart", { count });

    room.countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        io.to(data.roomCode).emit("countdownTick", { count });
      } else {
        clearInterval(room.countdownInterval);
        room.countdownInterval = null;

        const wordCount =
          room.settings.gameMode === "words" ? room.settings.wordCount : 200;
        room.words = generateWords(wordCount);
        room.startTime = Date.now();
        room.gameState = "racing";

        io.to(data.roomCode).emit("gameStart", {
          words: room.words,
          settings: room.settings,
          startTime: room.startTime,
        });

        if (room.settings.gameMode === "time") {
          const duration = room.settings.timeLimit;
          let elapsed = 0;

          room.gameInterval = setInterval(() => {
            elapsed++;
            const remaining = duration - elapsed;

            io.to(data.roomCode).emit("timerUpdate", {
              remaining,
              elapsed,
            });

            if (remaining <= 0) {
              clearInterval(room.gameInterval);
              room.gameInterval = null;
              endGame(data.roomCode);
            }
          }, 1000);
        }
      }
    }, 1000);
  });

  socket.on("progressUpdate", (data) => {
    const room = rooms[data.roomCode];
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    player.progress = data.progress;
    player.wpm = data.wpm;
    player.accuracy = data.accuracy;
    player.currentWordIndex = data.currentWordIndex;

    if (data.finished) {
      player.finished = true;
      player.finishTime = data.finishTime;

      const allFinished = room.players.every((p) => p.finished);
      if (allFinished) {
        if (room.gameInterval) {
          clearInterval(room.gameInterval);
          room.gameInterval = null;
        }
        endGame(data.roomCode);
      }
    }

    io.to(data.roomCode).emit("playerProgress", {
      socketId: socket.id,
      progress: data.progress,
      wpm: data.wpm,
      accuracy: data.accuracy,
    });
  });

  socket.on("returnToLobby", (data) => {
    const room = rooms[data.roomCode];
    if (!room) return;

    if (room.gameInterval) {
      clearInterval(room.gameInterval);
      room.gameInterval = null;
    }
    if (room.countdownInterval) {
      clearInterval(room.countdownInterval);
      room.countdownInterval = null;
    }

    room.gameState = "lobby";
    room.words = [];
    room.startTime = null;

    room.players.forEach((p) => {
      p.ready = false;
      p.progress = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.currentWordIndex = 0;
      p.finished = false;
      p.finishTime = null;
    });

    io.to(data.roomCode).emit("returnedToLobby", {
      players: room.players,
      settings: room.settings,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    Object.keys(rooms).forEach((roomCode) => {
      const room = rooms[roomCode];
      const playerIndex = room.players.findIndex(
        (p) => p.socketId === socket.id
      );

      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);

        if (room.host === socket.id) {
          if (room.players.length > 0) {
            room.host = room.players[0].socketId;
            io.to(roomCode).emit("hostChanged", {
              newHost: room.host,
            });
          } else {
            if (room.gameInterval) clearInterval(room.gameInterval);
            if (room.countdownInterval) clearInterval(room.countdownInterval);
            delete rooms[roomCode];
            return;
          }
        }

        io.to(roomCode).emit("lobbyUpdate", {
          players: room.players,
          settings: room.settings,
        });
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
