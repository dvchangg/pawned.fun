const express = require('express');
const cors = require('cors');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client/dist'));

// In-memory storage
let users = new Map();
let games = new Map();
let gameCounter = 0;
let userCounter = 0;

// Helper functions
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function createUser(walletAddress, username) {
  const id = generateId();
  const user = {
    id,
    walletAddress,
    username,
    eloRating: 1200,
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalWagered: "0",
    totalWon: "0",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  users.set(id, user);
  return user;
}

function createGame(whitePlayerId, wagerAmount = "0", timeControl = 600) {
  const id = generateId();
  const game = {
    id,
    whitePlayerId,
    blackPlayerId: null,
    status: "waiting",
    result: "ongoing",
    pgn: "",
    currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    wagerAmount,
    wagerToken: "SOL",
    isWagered: parseFloat(wagerAmount) > 0,
    timeControl,
    whiteTimeLeft: timeControl,
    blackTimeLeft: timeControl,
    createdAt: new Date()
  };
  games.set(id, game);
  return game;
}

// API Routes
app.post('/api/users', (req, res) => {
  try {
    const { walletAddress, username } = req.body;
    
    // Check if user exists
    for (const user of users.values()) {
      if (user.walletAddress === walletAddress) {
        return res.status(409).json({ error: "User already exists" });
      }
    }
    
    const user = createUser(walletAddress, username);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/:walletAddress', (req, res) => {
  try {
    for (const user of users.values()) {
      if (user.walletAddress === req.params.walletAddress) {
        return res.json(user);
      }
    }
    res.status(404).json({ error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/games', (req, res) => {
  try {
    const { whitePlayerId, wagerAmount, timeControl } = req.body;
    const game = createGame(whitePlayerId, wagerAmount, timeControl);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/games', (req, res) => {
  try {
    const { status } = req.query;
    let gameList = Array.from(games.values());
    
    if (status === "waiting") {
      gameList = gameList.filter(game => game.status === "waiting");
    }
    
    res.json(gameList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/games/:id', (req, res) => {
  try {
    const game = games.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/games/:id/join', (req, res) => {
  try {
    const { playerId } = req.body;
    const game = games.get(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    if (game.status !== "waiting") {
      return res.status(400).json({ error: "Game is not available to join" });
    }
    
    game.blackPlayerId = playerId;
    game.status = "active";
    games.set(game.id, game);
    
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/games/:id/move', (req, res) => {
  try {
    const { move, timeLeft } = req.body;
    const game = games.get(req.params.id);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    if (game.status !== "active") {
      return res.status(400).json({ error: "Game is not active" });
    }
    
    const chess = new Chess(game.currentFen);
    const moveResult = chess.move(move);
    
    if (!moveResult) {
      return res.status(400).json({ error: "Invalid move" });
    }
    
    game.currentFen = chess.fen();
    game.pgn = chess.pgn();
    
    if (chess.isGameOver()) {
      game.status = "completed";
      if (chess.isCheckmate()) {
        game.result = chess.turn() === "w" ? "black_wins" : "white_wins";
      } else {
        game.result = "draw";
      }
    }
    
    games.set(game.id, game);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/leaderboard/:category', (req, res) => {
  try {
    const userList = Array.from(users.values());
    const { category } = req.params;
    
    let sortedUsers = [];
    
    switch (category) {
      case 'elo':
        sortedUsers = userList.sort((a, b) => b.eloRating - a.eloRating);
        break;
      case 'games_played':
        sortedUsers = userList.sort((a, b) => b.totalGames - a.totalGames);
        break;
      case 'win_rate':
        sortedUsers = userList.sort((a, b) => {
          const aRate = a.totalGames > 0 ? (a.wins / a.totalGames) : 0;
          const bRate = b.totalGames > 0 ? (b.wins / b.totalGames) : 0;
          return bRate - aRate;
        });
        break;
      case 'total_wagered':
        sortedUsers = userList.sort((a, b) => parseFloat(b.totalWagered) - parseFloat(a.totalWagered));
        break;
      default:
        sortedUsers = userList;
    }
    
    const leaderboard = sortedUsers.map((user, index) => ({
      id: generateId(),
      userId: user.id,
      rank: index + 1,
      category,
      value: category === 'elo' ? user.eloRating.toString() :
             category === 'games_played' ? user.totalGames.toString() :
             category === 'win_rate' ? (user.totalGames > 0 ? ((user.wins / user.totalGames) * 100).toFixed(1) : "0.0") :
             user.totalWagered,
      user,
      updatedAt: new Date()
    }));
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ChessLana server running on port ${port}`);
  console.log(`Access the app at: http://localhost:${port}`);
});