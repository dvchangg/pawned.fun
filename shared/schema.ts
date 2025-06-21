import { z } from "zod";
import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Database enums
export const gameStatusEnum = pgEnum("game_status", ["waiting", "active", "completed", "cancelled"]);
export const gameResultEnum = pgEnum("game_result", ["white_wins", "black_wins", "draw", "ongoing"]);

// Database tables
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username").notNull().unique(),
  avatar: text("avatar"),
  eloRating: integer("elo_rating").notNull().default(1200),
  totalGames: integer("total_games").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  totalWagered: text("total_wagered").notNull().default("0"),
  totalWon: text("total_won").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  whitePlayerId: integer("white_player_id").references(() => users.id).notNull(),
  blackPlayerId: integer("black_player_id").references(() => users.id),
  status: gameStatusEnum("status").notNull().default("waiting"),
  result: gameResultEnum("result").notNull().default("ongoing"),
  pgn: text("pgn").notNull().default(""),
  currentFen: text("current_fen").notNull().default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
  wagerAmount: text("wager_amount").notNull().default("0"),
  wagerToken: text("wager_token").notNull().default("SOL"),
  isWagered: boolean("is_wagered").notNull().default(false),
  transactionSignature: text("transaction_signature"),
  timeControl: integer("time_control").notNull().default(600),
  whiteTimeLeft: integer("white_time_left").notNull().default(600),
  blackTimeLeft: integer("black_time_left").notNull().default(600),
  lastMoveAt: timestamp("last_move_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const gameMoves = pgTable("game_moves", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  moveNumber: integer("move_number").notNull(),
  move: text("move").notNull(),
  fen: text("fen").notNull(),
  timeLeft: integer("time_left").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  whiteGames: many(games, { relationName: "whitePlayer" }),
  blackGames: many(games, { relationName: "blackPlayer" }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  whitePlayer: one(users, {
    fields: [games.whitePlayerId],
    references: [users.id],
    relationName: "whitePlayer",
  }),
  blackPlayer: one(users, {
    fields: [games.blackPlayerId],
    references: [users.id],
    relationName: "blackPlayer",
  }),
  moves: many(gameMoves),
}));

export const gameMovesRelations = relations(gameMoves, ({ one }) => ({
  game: one(games, {
    fields: [gameMoves.gameId],
    references: [games.id],
  }),
}));

// Types inferred from the schema
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GameMove = typeof gameMoves.$inferSelect;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  lastMoveAt: true,
});

export const insertGameMoveSchema = createInsertSchema(gameMoves).omit({
  id: true,
  createdAt: true,
});

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGameMove = z.infer<typeof insertGameMoveSchema>;