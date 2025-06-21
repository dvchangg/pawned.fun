import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { LeaderboardEntry, User } from "../../../shared/schema";

type LeaderboardCategory = "elo" | "games_played" | "win_rate" | "total_wagered";

export function LeaderboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>("elo");

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["/api/leaderboard", selectedCategory],
    queryFn: () => apiRequest(`/api/leaderboard/${selectedCategory}?limit=100`),
  });

  const categories = [
    { key: "elo" as const, label: "ELO Rating", icon: Trophy },
    { key: "games_played" as const, label: "Games Played", icon: TrendingUp },
    { key: "win_rate" as const, label: "Win Rate", icon: Award },
    { key: "total_wagered" as const, label: "Total Wagered", icon: Medal },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const formatValue = (value: string, category: LeaderboardCategory) => {
    const num = parseFloat(value);
    switch (category) {
      case "elo":
        return Math.round(num).toString();
      case "games_played":
        return Math.round(num).toString();
      case "win_rate":
        return `${num.toFixed(1)}%`;
      case "total_wagered":
        return `${num.toFixed(4)} SOL`;
      default:
        return value;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Leaderboard</h1>
        <p className="text-white/70">Compete with the best chess players on Solana</p>
      </div>

      {/* Category Selector */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={selectedCategory === key ? "default" : "outline"}
            onClick={() => setSelectedCategory(key)}
            className="flex items-center space-x-2"
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </Button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-2xl font-semibold flex items-center space-x-2">
            {(() => {
              const category = categories.find(c => c.key === selectedCategory);
              const Icon = category?.icon;
              return Icon ? <Icon className="w-6 h-6" /> : null;
            })()}
            <span>{categories.find(c => c.key === selectedCategory)?.label}</span>
          </h2>
        </div>

        <div className="divide-y divide-white/10">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-white/70">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/70">No players found</p>
            </div>
          ) : (
            leaderboard.map((entry: LeaderboardEntry & { user: User }) => (
              <div
                key={entry.id}
                className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${
                  entry.rank <= 3 ? "bg-gradient-to-r from-yellow-500/10 to-transparent" : ""
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold w-16 text-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {entry.user?.username || "Anonymous"}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-white/70">
                      <span>ELO: {entry.user?.eloRating || 1200}</span>
                      <span>Games: {entry.user?.totalGames || 0}</span>
                      <span>
                        W/L: {entry.user?.wins || 0}/{entry.user?.losses || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatValue(entry.value, selectedCategory)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
          <div className="text-2xl font-bold">{leaderboard.length}</div>
          <div className="text-sm text-white/70">Total Players</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold">
            {leaderboard.reduce((sum: number, entry: any) => 
              sum + (entry.user?.totalGames || 0), 0
            )}
          </div>
          <div className="text-sm text-white/70">Total Games</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <Award className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <div className="text-2xl font-bold">
            {leaderboard.length > 0 ? Math.round(
              leaderboard.reduce((sum: number, entry: any) => 
                sum + (entry.user?.eloRating || 1200), 0
              ) / leaderboard.length
            ) : 1200}
          </div>
          <div className="text-sm text-white/70">Avg ELO</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <Medal className="w-6 h-6 mx-auto mb-2 text-purple-400" />
          <div className="text-2xl font-bold">
            {leaderboard.reduce((sum: number, entry: any) => 
              sum + parseFloat(entry.user?.totalWagered || "0"), 0
            ).toFixed(2)}
          </div>
          <div className="text-sm text-white/70">Total SOL Wagered</div>
        </div>
      </div>
    </div>
  );
}