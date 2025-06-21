import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "../components/WalletProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Link } from "wouter";
import { Plus, Clock, DollarSign, Users } from "lucide-react";
import { Game, User } from "../../../shared/schema";

export function HomePage() {
  const { connected, publicKey } = useWallet();
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [wagerAmount, setWagerAmount] = useState("0");
  const [timeControl, setTimeControl] = useState("600");

  // Fetch waiting games
  const { data: waitingGames = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games"],
    queryFn: () => apiRequest("/api/games?status=waiting"),
  });

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users", publicKey?.toString()],
    queryFn: () => apiRequest(`/api/users/${publicKey?.toString()}`),
    enabled: !!publicKey,
  });

  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: (gameData: any) => apiRequest("/api/games", {
      method: "POST",
      body: JSON.stringify(gameData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      setShowCreateGame(false);
      setWagerAmount("0");
    },
  });

  // Join game mutation
  const joinGameMutation = useMutation({
    mutationFn: ({ gameId, playerId }: { gameId: string; playerId: string }) =>
      apiRequest(`/api/games/${gameId}/join`, {
        method: "POST",
        body: JSON.stringify({ playerId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  const handleCreateGame = () => {
    if (!currentUser) return;
    
    createGameMutation.mutate({
      whitePlayerId: currentUser.id,
      wagerAmount: parseFloat(wagerAmount) > 0 ? wagerAmount : "0",
      isWagered: parseFloat(wagerAmount) > 0,
      timeControl: parseInt(timeControl),
    });
  };

  const handleJoinGame = (game: Game) => {
    if (!currentUser) return;
    joinGameMutation.mutate({ gameId: game.id, playerId: currentUser.id });
  };

  if (!connected) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold mb-8">Welcome to ChessLana</h1>
        <p className="text-xl text-white/70 mb-8">
          Play chess on Solana with optional wagering and compete on the leaderboard
        </p>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
          <p className="mb-4">Connect your Solana wallet to start playing</p>
          <Button className="w-full">Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Chess Games</h1>
        <p className="text-white/70">Join a game or create your own</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Available Games</h2>
        <Button onClick={() => setShowCreateGame(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Game
        </Button>
      </div>

      {showCreateGame && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Game</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Time Control (seconds)
              </label>
              <Input
                type="number"
                value={timeControl}
                onChange={(e) => setTimeControl(e.target.value)}
                min="60"
                max="3600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Wager Amount (SOL)
              </label>
              <Input
                type="number"
                step="0.01"
                value={wagerAmount}
                onChange={(e) => setWagerAmount(e.target.value)}
                min="0"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleCreateGame}
              disabled={createGameMutation.isPending}
            >
              Create Game
            </Button>
            <Button variant="outline" onClick={() => setShowCreateGame(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {gamesLoading ? (
          <div className="text-center py-8">Loading games...</div>
        ) : waitingGames.length === 0 ? (
          <div className="text-center py-8 text-white/70">
            No games available. Create one to get started!
          </div>
        ) : (
          waitingGames.map((game: Game) => (
            <GameCard
              key={game.id}
              game={game}
              onJoin={() => handleJoinGame(game)}
              canJoin={currentUser?.id !== game.whitePlayerId}
              isJoining={joinGameMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface GameCardProps {
  game: Game;
  onJoin: () => void;
  canJoin: boolean;
  isJoining: boolean;
}

function GameCard({ game, onJoin, canJoin, isJoining }: GameCardProps) {
  const { data: whitePlayer } = useQuery({
    queryKey: ["/api/users", game.whitePlayerId],
    queryFn: () => apiRequest(`/api/users/${game.whitePlayerId}`),
  });

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="font-medium">
              {whitePlayer?.username || "Anonymous"} (White)
            </span>
            <span className="text-sm text-white/70">
              ELO: {whitePlayer?.eloRating || 1200}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-white/70">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{Math.floor(game.timeControl / 60)}min</span>
            </div>
            
            {game.isWagered && (
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>{game.wagerAmount} SOL</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-x-2">
          {canJoin ? (
            <Button onClick={onJoin} disabled={isJoining} size="sm">
              Join Game
            </Button>
          ) : (
            <Link href={`/game/${game.id}`}>
              <Button size="sm">View Game</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}