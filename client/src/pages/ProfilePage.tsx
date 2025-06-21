import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Trophy, Calendar, DollarSign } from 'lucide-react';

export function ProfilePage() {
  const [userId] = useState(1); // Mock user ID for demonstration

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
    enabled: !!userId,
  });

  const { data: userGames } = useQuery({
    queryKey: ['/api/games', 'user', userId],
    queryFn: () => fetch(`/api/games?userId=${userId}`).then(res => res.json()),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p>Please connect your wallet to view your profile.</p>
      </div>
    );
  }

  const winRate = user.totalGames > 0 ? ((user.wins / user.totalGames) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-8">
      <div className="text-center text-white">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{user.username}</h1>
        <p className="text-gray-300">Player #{user.id}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10 text-center">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-white mb-1">{user.eloRating}</div>
          <div className="text-gray-300">ELO Rating</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10 text-center">
          <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-white mb-1">{user.totalGames}</div>
          <div className="text-gray-300">Total Games</div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">{winRate}%</div>
          <div className="text-gray-300">Win Rate</div>
          <div className="text-sm text-gray-400 mt-1">
            {user.wins}W {user.losses}L {user.draws}D
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10 text-center">
          <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <div className="text-2xl font-bold text-white mb-1">{user.totalWon}</div>
          <div className="text-gray-300">Total Won</div>
        </div>
      </div>

      {/* Recent Games */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Recent Games</h2>
        </div>
        
        <div className="p-6">
          {userGames && userGames.length > 0 ? (
            <div className="space-y-4">
              {userGames.slice(0, 5).map((game: any) => (
                <div key={game.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      game.result === 'white_wins' && game.whitePlayerId === userId ? 'bg-green-400' :
                      game.result === 'black_wins' && game.blackPlayerId === userId ? 'bg-green-400' :
                      game.result === 'draw' ? 'bg-yellow-400' :
                      game.result === 'ongoing' ? 'bg-blue-400' :
                      'bg-red-400'
                    }`}></div>
                    <div>
                      <div className="text-white font-medium">Game #{game.id}</div>
                      <div className="text-sm text-gray-400">
                        vs Player #{game.whitePlayerId === userId ? game.blackPlayerId : game.whitePlayerId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      game.result === 'white_wins' && game.whitePlayerId === userId ? 'text-green-400' :
                      game.result === 'black_wins' && game.blackPlayerId === userId ? 'text-green-400' :
                      game.result === 'draw' ? 'text-yellow-400' :
                      game.result === 'ongoing' ? 'text-blue-400' :
                      'text-red-400'
                    }`}>
                      {game.result === 'white_wins' && game.whitePlayerId === userId ? 'Won' :
                       game.result === 'black_wins' && game.blackPlayerId === userId ? 'Won' :
                       game.result === 'draw' ? 'Draw' :
                       game.result === 'ongoing' ? 'In Progress' :
                       'Lost'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No games played yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}