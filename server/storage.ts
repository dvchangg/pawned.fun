import { users, games, gameMoves, type User, type Game, type GameMove, type InsertUser, type InsertGame, type InsertGameMove } from "../shared/schema";
import { db } from "./db";
import { eq, desc, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Game operations
  getGame(id: number): Promise<Game | undefined>;
  getGameWithPlayers(id: number): Promise<any>;
  createGame(insertGame: InsertGame): Promise<Game>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined>;
  getActiveGames(): Promise<Game[]>;
  getWaitingGames(): Promise<Game[]>;
  getUserGames(userId: number): Promise<Game[]>;
  
  // Game move operations
  getGameMoves(gameId: number): Promise<GameMove[]>;
  addGameMove(insertMove: InsertGameMove): Promise<GameMove>;
  
  // Leaderboard operations
  getTopPlayersByElo(limit?: number): Promise<User[]>;
  getTopPlayersByGames(limit?: number): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async getGameWithPlayers(id: number): Promise<any> {
    const result = await db
      .select()
      .from(games)
      .where(eq(games.id, id));
    
    return result[0] || undefined;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    return game;
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return game || undefined;
  }

  async getActiveGames(): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.status, "active"))
      .orderBy(desc(games.createdAt));
  }

  async getWaitingGames(): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.status, "waiting"))
      .orderBy(desc(games.createdAt));
  }

  async getUserGames(userId: number): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(or(eq(games.whitePlayerId, userId), eq(games.blackPlayerId, userId)))
      .orderBy(desc(games.createdAt));
  }

  async getGameMoves(gameId: number): Promise<GameMove[]> {
    return await db
      .select()
      .from(gameMoves)
      .where(eq(gameMoves.gameId, gameId))
      .orderBy(gameMoves.moveNumber);
  }

  async addGameMove(insertMove: InsertGameMove): Promise<GameMove> {
    const [move] = await db
      .insert(gameMoves)
      .values(insertMove)
      .returning();
    return move;
  }

  async getTopPlayersByElo(limit: number = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.eloRating))
      .limit(limit);
  }

  async getTopPlayersByGames(limit: number = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.totalGames))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();