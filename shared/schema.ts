import { z } from "zod";

// In-memory storage schemas since we're using MemStorage
export interface User {
  id: string;
  walletAddress: string;
  username: string;
  avatar?: string;
  eloRating: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  totalWagered: string;
  totalWon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  whitePlayerId: string;
  blackPlayerId?: string;
  status: "waiting" | "active" | "completed" | "cancelled";
  result: "white_wins" | "black_wins" | "draw" | "ongoing";
  pgn: string;
  currentFen: string;
  wagerAmount: string;
  wagerToken: string;
  isWagered: boolean;
  transactionSignature?: string;
  timeControl: number;
  whiteTimeLeft: number;
  blackTimeLeft: number;
  lastMoveAt?: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface GameMove {
  id: string;
  gameId: string;
  moveNumber: number;
  move: string;
  fen: string;
  timeLeft: number;
  createdAt: Date;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  rank: number;
  category: "elo" | "games_played" | "win_rate" | "total_wagered";
  value: string;
  updatedAt: Date;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  walletAddress: z.string(),
  username: z.string().min(3).max(20),
  avatar: z.string().optional(),
  eloRating: z.number().default(1200),
  totalGames: z.number().default(0),
  wins: z.number().default(0),
  losses: z.number().default(0),
  draws: z.number().default(0),
  totalWagered: z.string().default("0"),
  totalWon: z.string().default("0"),
});

export const insertGameSchema = z.object({
  whitePlayerId: z.string(),
  blackPlayerId: z.string().optional(),
  status: z.enum(["waiting", "active", "completed", "cancelled"]).default("waiting"),
  result: z.enum(["white_wins", "black_wins", "draw", "ongoing"]).default("ongoing"),
  pgn: z.string().default(""),
  currentFen: z.string().default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
  wagerAmount: z.string().default("0"),
  wagerToken: z.string().default("SOL"),
  isWagered: z.boolean().default(false),
  transactionSignature: z.string().optional(),
  timeControl: z.number().default(600),
  whiteTimeLeft: z.number().default(600),
  blackTimeLeft: z.number().default(600),
});

export const insertGameMoveSchema = z.object({
  gameId: z.string(),
  moveNumber: z.number(),
  move: z.string(),
  fen: z.string(),
  timeLeft: z.number(),
});

export const insertLeaderboardSchema = z.object({
  userId: z.string(),
  rank: z.number().default(0),
  category: z.enum(["elo", "games_played", "win_rate", "total_wagered"]),
  value: z.string(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGameMove = z.infer<typeof insertGameMoveSchema>;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardSchema>;

// Additional validation schemas
export const createGameSchema = insertGameSchema.extend({
  wagerAmount: z.string().optional(),
  timeControl: z.number().min(60).max(3600),
});

export const makeMoveSchema = z.object({
  gameId: z.string(),
  move: z.string(),
  timeLeft: z.number().min(0),
});

export const joinGameSchema = z.object({
  gameId: z.string(),
});

export type CreateGameRequest = z.infer<typeof createGameSchema>;
export type MakeMoveRequest = z.infer<typeof makeMoveSchema>;
export type JoinGameRequest = z.infer<typeof joinGameSchema>;