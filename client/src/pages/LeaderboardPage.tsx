import { useQuery } from '@tanstack/react-query';
import { Trophy, Crown, Star, TrendingUp } from 'lucide-react';

export function LeaderboardPage() {
  const { data: topPlayers, isLoading } = useQuery({
    queryKey: ['/api/leaderboard/elo'],
    queryFn: () => fetch('/api/leaderboard/elo?limit=20').then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center text-white">
        <div className="flex justify-center mb-6">
          <Trophy className="w-16 h-16 text-yellow-400" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Leaderboard</h1>
        <p className="text-xl text-gray-300">
          Top players ranked by ELO rating
        </p>
      </div>

      {/* Top 3 Players */}
      {topPlayers && topPlayers.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {topPlayers.slice(0, 3).map((player: any, index: number) => {
            const position = index + 1;
            const icons = [Crown, Trophy, Star];
            const colors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];
            const bgColors = ['bg-yellow-400/10', 'bg-gray-400/10', 'bg-amber-600/10'];
            const Icon = icons[index];

            return (
              <div
                key={player.id}
                className={`${bgColors[index]} backdrop-blur-sm rounded-lg p-6 border border-white/10 text-center`}
              >
                <Icon className={`w-12 h-12 ${colors[index]} mx-auto mb-4`} />
                <div className="text-3xl font-bold text-white mb-2">#{position}</div>
                <div className="text-lg font-semibold text-white mb-2">
                  {player.username}
                </div>
                <div className="text-2xl font-bold text-yellow-400 mb-2">
                  {player.eloRating}
                </div>
                <div className="text-sm text-gray-300">
                  {player.totalGames} games • {player.wins}W {player.losses}L {player.draws}D
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Full Rankings
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-left">
                  <th className="px-6 py-3 text-gray-300 font-medium">Rank</th>
                  <th className="px-6 py-3 text-gray-300 font-medium">Player</th>
                  <th className="px-6 py-3 text-gray-300 font-medium">ELO</th>
                  <th className="px-6 py-3 text-gray-300 font-medium">Games</th>
                  <th className="px-6 py-3 text-gray-300 font-medium">W/L/D</th>
                  <th className="px-6 py-3 text-gray-300 font-medium">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {topPlayers?.map((player: any, index: number) => {
                  const winRate = player.totalGames > 0 
                    ? ((player.wins / player.totalGames) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={player.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-white font-medium">#{index + 1}</span>
                          {index < 3 && (
                            <Crown className="w-4 h-4 text-yellow-400 ml-2" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{player.username}</div>
                        <div className="text-sm text-gray-400">ID: {player.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-yellow-400 font-bold text-lg">
                          {player.eloRating}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {player.totalGames}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="text-green-400">{player.wins}W</span>
                          <span className="text-red-400 ml-1">{player.losses}L</span>
                          <span className="text-gray-400 ml-1">{player.draws}D</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {winRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {(!topPlayers || topPlayers.length === 0) && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Players Yet</h3>
            <p className="text-gray-400">Be the first to play and claim the top spot!</p>
          </div>
        )}
      </div>
    </div>
  );
}