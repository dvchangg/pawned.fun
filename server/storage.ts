import { User, Game, GameMove, LeaderboardEntry, InsertUser, InsertGame, InsertGameMove, InsertLeaderboardEntry, users, games, gameMoves, leaderboardEntries } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, or, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByWallet(walletAddress: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGameById(id: string): Promise<Game | null>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game>;
  getGamesByPlayer(playerId: string): Promise<Game[]>;
  getActiveGames(): Promise<Game[]>;
  getWaitingGames(): Promise<Game[]>;

  // Game move operations
  createGameMove(move: InsertGameMove): Promise<GameMove>;
  getGameMoves(gameId: string): Promise<GameMove[]>;

  // Leaderboard operations
  updateLeaderboard(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
  getLeaderboard(category: "elo" | "games_played" | "win_rate" | "total_wagered", limit?: number): Promise<LeaderboardEntry[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private games: Map<string, Game> = new Map();
  private gameMoves: Map<string, GameMove[]> = new Map();
  private leaderboard: Map<string, LeaderboardEntry[]> = new Map();

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.generateId();
    const now = new Date();
    const user: User = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    await this.updateUserLeaderboard(user);
    return user;
  }

  async getUserByWallet(walletAddress: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.walletAddress === walletAddress) {
        return user;
      }
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    await this.updateUserLeaderboard(updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createGame(gameData: InsertGame): Promise<Game> {
    const id = this.generateId();
    const now = new Date();
    const game: Game = {
      id,
      ...gameData,
      createdAt: now,
    };
    this.games.set(id, game);
    return game;
  }

  async getGameById(id: string): Promise<Game | null> {
    return this.games.get(id) || null;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game> {
    const game = this.games.get(id);
    if (!game) throw new Error("Game not found");
    
    const updatedGame = { ...game, ...updates };
    if (updates.status === "completed" && !game.completedAt) {
      updatedGame.completedAt = new Date();
    }
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getGamesByPlayer(playerId: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      game => game.whitePlayerId === playerId || game.blackPlayerId === playerId
    );
  }

  async getActiveGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.status === "active");
  }

  async getWaitingGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.status === "waiting");
  }

  async createGameMove(moveData: InsertGameMove): Promise<GameMove> {
    const id = this.generateId();
    const move: GameMove = {
      id,
      ...moveData,
      createdAt: new Date(),
    };
    
    if (!this.gameMoves.has(moveData.gameId)) {
      this.gameMoves.set(moveData.gameId, []);
    }
    this.gameMoves.get(moveData.gameId)!.push(move);
    return move;
  }

  async getGameMoves(gameId: string): Promise<GameMove[]> {
    return this.gameMoves.get(gameId) || [];
  }

  async updateLeaderboard(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const id = this.generateId();
    const leaderboardEntry: LeaderboardEntry = {
      id,
      ...entry,
      updatedAt: new Date(),
    };

    if (!this.leaderboard.has(entry.category)) {
      this.leaderboard.set(entry.category, []);
    }

    const categoryEntries = this.leaderboard.get(entry.category)!;
    const existingIndex = categoryEntries.findIndex(e => e.userId === entry.userId);
    
    if (existingIndex >= 0) {
      categoryEntries[existingIndex] = leaderboardEntry;
    } else {
      categoryEntries.push(leaderboardEntry);
    }

    // Sort and update ranks
    this.sortAndRankLeaderboard(entry.category);
    
    return leaderboardEntry;
  }

  async getLeaderboard(category: "elo" | "games_played" | "win_rate" | "total_wagered", limit = 100): Promise<LeaderboardEntry[]> {
    const entries = this.leaderboard.get(category) || [];
    return entries.slice(0, limit);
  }

  private sortAndRankLeaderboard(category: string) {
    const entries = this.leaderboard.get(category);
    if (!entries) return;

    entries.sort((a, b) => {
      const aValue = parseFloat(a.value);
      const bValue = parseFloat(b.value);
      return bValue - aValue; // Descending order
    });

    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  private async updateUserLeaderboard(user: User) {
    // Update ELO leaderboard
    await this.updateLeaderboard({
      userId: user.id,
      category: "elo",
      value: user.eloRating.toString(),
      rank: 0,
    });

    // Update games played leaderboard
    await this.updateLeaderboard({
      userId: user.id,
      category: "games_played",
      value: user.totalGames.toString(),
      rank: 0,
    });

    // Update win rate leaderboard
    const winRate = user.totalGames > 0 ? (user.wins / user.totalGames) * 100 : 0;
    await this.updateLeaderboard({
      userId: user.id,
      category: "win_rate",
      value: winRate.toFixed(2),
      rank: 0,
    });

    // Update total wagered leaderboard
    await this.updateLeaderboard({
      userId: user.id,
      category: "total_wagered",
      value: user.totalWagered,
      rank: 0,
    });
  }
}

export class DatabaseStorage implements IStorage {
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.generateId();
    const [user] = await db
      .insert(users)
      .values({
        id,
        ...userData,
        avatar: userData.avatar || null,
        eloRating: userData.eloRating || 1200,
        totalGames: userData.totalGames || 0,
        wins: userData.wins || 0,
        losses: userData.losses || 0,
        draws: userData.draws || 0,
        totalWagered: userData.totalWagered || "0",
        totalWon: userData.totalWon || "0",
      })
      .returning();
    return user;
  }

  async getUserByWallet(walletAddress: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createGame(gameData: InsertGame): Promise<Game> {
    const id = this.generateId();
    const [game] = await db
      .insert(games)
      .values({
        id,
        ...gameData,
        blackPlayerId: gameData.blackPlayerId || null,
        status: gameData.status || "waiting",
        result: gameData.result || "ongoing",
        pgn: gameData.pgn || "",
        currentFen: gameData.currentFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        wagerAmount: gameData.wagerAmount || "0",
        wagerToken: gameData.wagerToken || "SOL",
        isWagered: gameData.isWagered || false,
        timeControl: gameData.timeControl || 600,
        whiteTimeLeft: gameData.whiteTimeLeft || 600,
        blackTimeLeft: gameData.blackTimeLeft || 600,
      })
      .returning();
    return game;
  }

  async getGameById(id: string): Promise<Game | null> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || null;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game> {
    const [game] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return game;
  }

  async getGamesByPlayer(playerId: string): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(or(eq(games.whitePlayerId, playerId), eq(games.blackPlayerId, playerId)));
  }

  async getActiveGames(): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.status, "active"));
  }

  async getWaitingGames(): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.status, "waiting"));
  }

  async createGameMove(moveData: InsertGameMove): Promise<GameMove> {
    const id = this.generateId();
    const [move] = await db
      .insert(gameMoves)
      .values({
        id,
        ...moveData,
      })
      .returning();
    return move;
  }

  async getGameMoves(gameId: string): Promise<GameMove[]> {
    return await db
      .select()
      .from(gameMoves)
      .where(eq(gameMoves.gameId, gameId))
      .orderBy(asc(gameMoves.moveNumber));
  }

  async updateLeaderboard(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const id = this.generateId();
    const [leaderboardEntry] = await db
      .insert(leaderboardEntries)
      .values({
        id,
        ...entry,
        rank: entry.rank || 0,
      })
      .returning();
    return leaderboardEntry;
  }

  async getLeaderboard(category: "elo" | "games_played" | "win_rate" | "total_wagered", limit = 100): Promise<LeaderboardEntry[]> {
    return await db
      .select()
      .from(leaderboardEntries)
      .where(eq(leaderboardEntries.category, category))
      .orderBy(asc(leaderboardEntries.rank))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();