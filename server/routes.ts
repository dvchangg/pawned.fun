import express from "express";
import { IStorage } from "./storage.js";
import { 
  insertUserSchema, 
  insertGameSchema, 
  makeMoveSchema, 
  joinGameSchema,
  createGameSchema 
} from "../shared/schema.js";
import { Chess } from "chess.js";

export function createRoutes(storage: IStorage) {
  const router = express.Router();

  // User routes
  router.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByWallet(userData.walletAddress);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/api/users/:walletAddress", async (req, res) => {
    try {
      const user = await storage.getUserByWallet(req.params.walletAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Game routes
  router.post("/api/games", async (req, res) => {
    try {
      const gameData = createGameSchema.parse(req.body);
      const gameToCreate = {
        ...gameData,
        wagerAmount: gameData.wagerAmount || "0",
      };
      const game = await storage.createGame(gameToCreate);
      res.json(game);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGameById(req.params.id);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/api/games", async (req, res) => {
    try {
      const { status, playerId } = req.query;
      
      if (playerId) {
        const games = await storage.getGamesByPlayer(playerId as string);
        return res.json(games);
      }
      
      if (status === "waiting") {
        const games = await storage.getWaitingGames();
        return res.json(games);
      }
      
      if (status === "active") {
        const games = await storage.getActiveGames();
        return res.json(games);
      }
      
      // Return all waiting games by default
      const games = await storage.getWaitingGames();
      res.json(games);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/api/games/:id/join", async (req, res) => {
    try {
      const { gameId } = joinGameSchema.parse({ gameId: req.params.id });
      const { playerId } = req.body;
      
      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      if (game.status !== "waiting") {
        return res.status(400).json({ error: "Game is not available to join" });
      }
      
      if (game.whitePlayerId === playerId) {
        return res.status(400).json({ error: "Cannot join your own game" });
      }
      
      const updatedGame = await storage.updateGame(gameId, {
        blackPlayerId: playerId,
        status: "active",
        lastMoveAt: new Date(),
      });
      
      res.json(updatedGame);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post("/api/games/:id/move", async (req, res) => {
    try {
      const moveData = makeMoveSchema.parse({ ...req.body, gameId: req.params.id });
      
      const game = await storage.getGameById(moveData.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      if (game.status !== "active") {
        return res.status(400).json({ error: "Game is not active" });
      }
      
      // Validate move using chess.js
      const chess = new Chess(game.currentFen);
      
      try {
        const move = chess.move(moveData.move);
        if (!move) {
          return res.status(400).json({ error: "Invalid move" });
        }
      } catch {
        return res.status(400).json({ error: "Invalid move" });
      }
      
      const newFen = chess.fen();
      const pgn = chess.pgn();
      const isGameOver = chess.isGameOver();
      
      let result: "white_wins" | "black_wins" | "draw" | "ongoing" = game.result;
      let status: "waiting" | "active" | "completed" | "cancelled" = game.status;
      
      if (isGameOver) {
        status = "completed";
        if (chess.isCheckmate()) {
          result = chess.turn() === "w" ? "black_wins" : "white_wins";
        } else if (chess.isDraw()) {
          result = "draw";
        }
        
        // Update player stats
        if (result !== "ongoing") {
          await updatePlayerStats(storage, game, result);
        }
      }
      
      // Update game
      const updatedGame = await storage.updateGame(moveData.gameId, {
        currentFen: newFen,
        pgn,
        result,
        status,
        lastMoveAt: new Date(),
        whiteTimeLeft: chess.turn() === "b" ? moveData.timeLeft : game.whiteTimeLeft,
        blackTimeLeft: chess.turn() === "w" ? moveData.timeLeft : game.blackTimeLeft,
      });
      
      // Save move
      const moves = await storage.getGameMoves(moveData.gameId);
      await storage.createGameMove({
        gameId: moveData.gameId,
        moveNumber: moves.length + 1,
        move: moveData.move,
        fen: newFen,
        timeLeft: moveData.timeLeft,
      });
      
      res.json(updatedGame);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/api/games/:id/moves", async (req, res) => {
    try {
      const moves = await storage.getGameMoves(req.params.id);
      res.json(moves);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Leaderboard routes
  router.get("/api/leaderboard/:category", async (req, res) => {
    try {
      const category = req.params.category as "elo" | "games_played" | "win_rate" | "total_wagered";
      const limit = parseInt(req.query.limit as string) || 100;
      
      const leaderboard = await storage.getLeaderboard(category, limit);
      
      // Populate user data
      const enrichedLeaderboard = await Promise.all(
        leaderboard.map(async (entry) => {
          const user = await storage.getUserById(entry.userId);
          return {
            ...entry,
            user,
          };
        })
      );
      
      res.json(enrichedLeaderboard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

async function updatePlayerStats(storage: IStorage, game: any, result: string) {
  const whitePlayer = await storage.getUserById(game.whitePlayerId);
  const blackPlayer = game.blackPlayerId ? await storage.getUserById(game.blackPlayerId) : null;
  
  if (!whitePlayer || !blackPlayer) return;
  
  // Calculate ELO changes
  const K = 32; // ELO K-factor
  const whiteElo = whitePlayer.eloRating;
  const blackElo = blackPlayer.eloRating;
  
  const expectedWhite = 1 / (1 + Math.pow(10, (blackElo - whiteElo) / 400));
  const expectedBlack = 1 / (1 + Math.pow(10, (whiteElo - blackElo) / 400));
  
  let whiteScore = 0.5; // Draw
  let blackScore = 0.5; // Draw
  
  if (result === "white_wins") {
    whiteScore = 1;
    blackScore = 0;
  } else if (result === "black_wins") {
    whiteScore = 0;
    blackScore = 1;
  }
  
  const whiteEloChange = Math.round(K * (whiteScore - expectedWhite));
  const blackEloChange = Math.round(K * (blackScore - expectedBlack));
  
  // Update white player
  await storage.updateUser(whitePlayer.id, {
    eloRating: Math.max(100, whitePlayer.eloRating + whiteEloChange),
    totalGames: whitePlayer.totalGames + 1,
    wins: whitePlayer.wins + (result === "white_wins" ? 1 : 0),
    losses: whitePlayer.losses + (result === "black_wins" ? 1 : 0),
    draws: whitePlayer.draws + (result === "draw" ? 1 : 0),
    totalWagered: (parseFloat(whitePlayer.totalWagered) + parseFloat(game.wagerAmount)).toString(),
    totalWon: result === "white_wins" && game.isWagered ? 
      (parseFloat(whitePlayer.totalWon) + parseFloat(game.wagerAmount) * 2).toString() : 
      whitePlayer.totalWon,
  });
  
  // Update black player
  await storage.updateUser(blackPlayer.id, {
    eloRating: Math.max(100, blackPlayer.eloRating + blackEloChange),
    totalGames: blackPlayer.totalGames + 1,
    wins: blackPlayer.wins + (result === "black_wins" ? 1 : 0),
    losses: blackPlayer.losses + (result === "white_wins" ? 1 : 0),
    draws: blackPlayer.draws + (result === "draw" ? 1 : 0),
    totalWagered: (parseFloat(blackPlayer.totalWagered) + parseFloat(game.wagerAmount)).toString(),
    totalWon: result === "black_wins" && game.isWagered ? 
      (parseFloat(blackPlayer.totalWon) + parseFloat(game.wagerAmount) * 2).toString() : 
      blackPlayer.totalWon,
  });
}