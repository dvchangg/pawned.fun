import express from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { insertUserSchema, insertGameSchema, insertGameMoveSchema } from '../shared/schema';

const router = express.Router();

// User routes
router.post('/users', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(userData);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const user = await storage.getUserByWallet(address);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leaderboard/elo', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const players = await storage.getTopPlayersByElo(limit);
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Game routes
router.post('/games', async (req, res) => {
  try {
    const gameData = insertGameSchema.parse(req.body);
    const game = await storage.createGame(gameData);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/games/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const game = await storage.getGame(id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/games/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const game = await storage.updateGame(id, updates);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/games', async (req, res) => {
  try {
    const { status, userId } = req.query;
    
    if (userId) {
      const games = await storage.getUserGames(parseInt(userId as string));
      return res.json(games);
    }
    
    if (status === 'waiting') {
      const games = await storage.getWaitingGames();
      return res.json(games);
    }
    
    if (status === 'active') {
      const games = await storage.getActiveGames();
      return res.json(games);
    }
    
    // Default to waiting games
    const games = await storage.getWaitingGames();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Game moves routes
router.get('/games/:id/moves', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const moves = await storage.getGameMoves(gameId);
    res.json(moves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/games/:id/moves', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const moveData = insertGameMoveSchema.parse({
      ...req.body,
      gameId
    });
    const move = await storage.addGameMove(moveData);
    res.json(move);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export function registerRoutes() {
  return router;
}