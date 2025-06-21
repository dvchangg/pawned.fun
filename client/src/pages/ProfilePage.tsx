import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "../components/WalletProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { apiRequest, queryClient } from "../lib/queryClient";
import { User, Trophy, GamepadIcon, Target, DollarSign, Calendar } from "lucide-react";

export function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");

  // Fetch current user
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/users", publicKey?.toString()],
    queryFn: () => apiRequest(`/api/users/${publicKey?.toString()}`),
    enabled: !!publicKey,
  });

  // Fetch user's games
  const { data: userGames = [] } = useQuery({
    queryKey: ["/api/games", "player", currentUser?.id],
    queryFn: () => apiRequest(`/api/games?playerId=${currentUser?.id}`),
    enabled: !!currentUser?.id,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest("/api/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditing(false);
    },
  });

  const handleCreateProfile = () => {
    if (!publicKey || !username.trim()) return;
    
    createUserMutation.mutate({
      walletAddress: publicKey.toString(),
      username: username.trim(),
    });
  };

  if (!connected) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 mx-auto mb-4 text-white/50" />
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p className="text-white/70">Connect your wallet to view your profile</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-xl">Loading profile...</p>
      </div>
    );
  }

  // User doesn't exist, show create profile form
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
          <div className="text-center mb-6">
            <User className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h1 className="text-2xl font-bold mb-2">Create Your Profile</h1>
            <p className="text-white/70">Set up your chess profile to start playing</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Wallet Address</label>
              <Input
                value={publicKey?.toString() || ""}
                disabled
                className="text-white/50"
              />
            </div>

            <Button
              onClick={handleCreateProfile}
              disabled={!username.trim() || createUserMutation.isPending}
              className="w-full"
            >
              {createUserMutation.isPending ? "Creating..." : "Create Profile"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const winRate = currentUser.totalGames > 0 
    ? (currentUser.wins / currentUser.totalGames * 100).toFixed(1)
    : "0.0";

  const recentGames = userGames.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Your Profile</h1>
        <p className="text-white/70">Track your chess journey on Solana</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{currentUser.username}</h2>
              <p className="text-white/70 font-mono text-sm">
                {currentUser.walletAddress.slice(0, 8)}...{currentUser.walletAddress.slice(-8)}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Calendar className="w-4 h-4 text-white/50" />
                <span className="text-sm text-white/70">
                  Joined {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="ELO Rating"
          value={currentUser.eloRating.toString()}
          color="yellow"
        />
        <StatCard
          icon={GamepadIcon}
          label="Games Played"
          value={currentUser.totalGames.toString()}
          color="blue"
        />
        <StatCard
          icon={Target}
          label="Win Rate"
          value={`${winRate}%`}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="Total Wagered"
          value={`${parseFloat(currentUser.totalWagered).toFixed(4)} SOL`}
          color="purple"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Game Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Game Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Total Games:</span>
              <span className="font-semibold">{currentUser.totalGames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Wins:</span>
              <span className="font-semibold text-green-400">{currentUser.wins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Losses:</span>
              <span className="font-semibold text-red-400">{currentUser.losses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Draws:</span>
              <span className="font-semibold text-yellow-400">{currentUser.draws}</span>
            </div>
            <div className="border-t border-white/20 pt-3 flex justify-between">
              <span className="text-white/70">Win Rate:</span>
              <span className="font-semibold">{winRate}%</span>
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Wagering Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Total Wagered:</span>
              <span className="font-semibold">{parseFloat(currentUser.totalWagered).toFixed(4)} SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Total Won:</span>
              <span className="font-semibold text-green-400">{parseFloat(currentUser.totalWon).toFixed(4)} SOL</span>
            </div>
            <div className="border-t border-white/20 pt-3 flex justify-between">
              <span className="text-white/70">Net Profit:</span>
              <span className={`font-semibold ${
                parseFloat(currentUser.totalWon) - parseFloat(currentUser.totalWagered) >= 0 
                  ? "text-green-400" : "text-red-400"
              }`}>
                {(parseFloat(currentUser.totalWon) - parseFloat(currentUser.totalWagered)).toFixed(4)} SOL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Games */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Games</h3>
        {recentGames.length === 0 ? (
          <p className="text-white/70 text-center py-8">No games played yet</p>
        ) : (
          <div className="space-y-3">
            {recentGames.map((game: any) => (
              <div key={game.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    game.status === "completed" ? "bg-gray-400" :
                    game.status === "active" ? "bg-green-400" :
                    "bg-yellow-400"
                  }`} />
                  <span className="font-medium">
                    {game.status === "completed" ? "Completed" :
                     game.status === "active" ? "In Progress" :
                     "Waiting"}
                  </span>
                  {game.isWagered && (
                    <span className="text-yellow-400 text-sm">
                      {game.wagerAmount} SOL
                    </span>
                  )}
                </div>
                <div className="text-sm text-white/70">
                  {new Date(game.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: string;
  color: "yellow" | "blue" | "green" | "purple";
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    yellow: "text-yellow-400",
    blue: "text-blue-400", 
    green: "text-green-400",
    purple: "text-purple-400",
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${colorClasses[color]}`} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-white/70">{label}</div>
    </div>
  );
}