import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "../components/WalletProvider";
import { ChessBoard } from "../components/ChessBoard";
import { Button } from "../components/ui/button";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useRoute } from "wouter";
import { Clock, Trophy, Users, DollarSign } from "lucide-react";
import { Game, GameMove, User } from "../../../shared/schema";

export function GamePage() {
  const [, params] = useRoute("/game/:id");
  const { connected, publicKey } = useWallet();
  const [timeLeft, setTimeLeft] = useState(600);
  
  const gameId = params?.id;

  // Fetch game data
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["/api/games", gameId],
    queryFn: () => apiRequest(`/api/games/${gameId}`),
    enabled: !!gameId,
    refetchInterval: 2000,
  });

  // Fetch game moves
  const { data: moves = [] } = useQuery({
    queryKey: ["/api/games", gameId, "moves"],
    queryFn: () => apiRequest(`/api/games/${gameId}/moves`),
    enabled: !!gameId,
  });

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users", publicKey?.toString()],
    queryFn: () => apiRequest(`/api/users/${publicKey?.toString()}`),
    enabled: !!publicKey,
  });

  // Fetch players
  const { data: whitePlayer } = useQuery({
    queryKey: ["/api/users", game?.whitePlayerId],
    queryFn: () => apiRequest(`/api/users/${game?.whitePlayerId}`),
    enabled: !!game?.whitePlayerId,
  });

  const { data: blackPlayer } = useQuery({
    queryKey: ["/api/users", game?.blackPlayerId],
    queryFn: () => apiRequest(`/api/users/${game?.blackPlayerId}`),
    enabled: !!game?.blackPlayerId,
  });

  // Make move mutation
  const makeMoveM = useMutation({
    mutationFn: (moveData: { move: string; timeLeft: number }) =>
      apiRequest(`/api/games/${gameId}/move`, {
        method: "POST",
        body: JSON.stringify(moveData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "moves"] });
    },
  });

  // Timer effect
  useEffect(() => {
    if (!game || game.status !== "active") return;

    const isMyTurn = (game.currentFen.includes(" w ") && currentUser?.id === game.whitePlayerId) ||
                     (game.currentFen.includes(" b ") && currentUser?.id === game.blackPlayerId);

    if (!isMyTurn) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - could implement auto-resignation here
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [game, currentUser]);

  // Update time left when game updates
  useEffect(() => {
    if (game) {
      const isWhitePlayer = currentUser?.id === game.whitePlayerId;
      setTimeLeft(isWhitePlayer ? game.whiteTimeLeft : game.blackTimeLeft);
    }
  }, [game, currentUser]);

  const handleMove = (move: string) => {
    if (!game || !currentUser) return;

    const isMyTurn = (game.currentFen.includes(" w ") && currentUser.id === game.whitePlayerId) ||
                     (game.currentFen.includes(" b ") && currentUser.id === game.blackPlayerId);

    if (!isMyTurn) return;

    makeMoveM.mutate({ move, timeLeft });
  };

  const getPlayerColor = (): "white" | "black" => {
    if (!game || !currentUser) return "white";
    return currentUser.id === game.whitePlayerId ? "white" : "black";
  };

  const isMyTurn = (): boolean => {
    if (!game || !currentUser) return false;
    return (game.currentFen.includes(" w ") && currentUser.id === game.whitePlayerId) ||
           (game.currentFen.includes(" b ") && currentUser.id === game.blackPlayerId);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!connected) {
    return (
      <div className="text-center py-20">
        <p className="text-xl">Connect your wallet to view the game</p>
      </div>
    );
  }

  if (gameLoading || !game) {
    return (
      <div className="text-center py-20">
        <p className="text-xl">Loading game...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game Board */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Chess Game</h1>
              <div className="flex items-center space-x-4">
                {game.isWagered && (
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <DollarSign className="w-4 h-4" />
                    <span>{game.wagerAmount} SOL</span>
                  </div>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  game.status === "active" ? "bg-green-500/20 text-green-400" :
                  game.status === "completed" ? "bg-gray-500/20 text-gray-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <ChessBoard
                fen={game.currentFen}
                onMove={handleMove}
                playerColor={getPlayerColor()}
                disabled={!isMyTurn() || game.status !== "active"}
              />
            </div>

            {game.status === "active" && (
              <div className="mt-6 text-center">
                <p className="text-lg">
                  {isMyTurn() ? (
                    <span className="text-green-400">Your turn</span>
                  ) : (
                    <span className="text-white/70">Opponent's turn</span>
                  )}
                </p>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xl font-mono">{formatTime(timeLeft)}</span>
                </div>
              </div>
            )}

            {game.status === "completed" && (
              <div className="mt-6 text-center">
                <div className="bg-white/10 rounded-lg p-4">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                  <p className="text-lg font-semibold">
                    {game.result === "white_wins" ? "White wins!" :
                     game.result === "black_wins" ? "Black wins!" :
                     "Draw!"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Game Info Sidebar */}
        <div className="space-y-6">
          {/* Players */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Players</h3>
            <div className="space-y-4">
              <PlayerCard 
                player={whitePlayer} 
                color="white" 
                isCurrentPlayer={currentUser?.id === game.whitePlayerId}
                timeLeft={game.whiteTimeLeft}
              />
              <PlayerCard 
                player={blackPlayer} 
                color="black" 
                isCurrentPlayer={currentUser?.id === game.blackPlayerId}
                timeLeft={game.blackTimeLeft}
              />
            </div>
          </div>

          {/* Game Moves */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Moves</h3>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {moves.length === 0 ? (
                <p className="text-white/70 text-sm">No moves yet</p>
              ) : (
                moves.map((move: GameMove, index: number) => (
                  <div key={move.id} className="flex justify-between text-sm">
                    <span className="text-white/70">{Math.floor(index / 2) + 1}.</span>
                    <span>{move.move}</span>
                    <span className="text-white/50">{formatTime(move.timeLeft)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlayerCardProps {
  player: User | undefined;
  color: "white" | "black";
  isCurrentPlayer: boolean;
  timeLeft: number;
}

function PlayerCard({ player, color, isCurrentPlayer, timeLeft }: PlayerCardProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-3 rounded-lg border ${
      isCurrentPlayer ? "border-blue-400 bg-blue-500/10" : "border-white/20"
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              color === "white" ? "bg-white" : "bg-gray-800 border border-white"
            }`} />
            <span className="font-medium">
              {player?.username || "Waiting..."}
              {isCurrentPlayer && " (You)"}
            </span>
          </div>
          {player && (
            <p className="text-sm text-white/70">ELO: {player.eloRating}</p>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span className="text-sm font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}