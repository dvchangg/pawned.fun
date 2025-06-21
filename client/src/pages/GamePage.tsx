import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChessBoard } from '../components/ChessBoard';
import { GameInfo } from '../components/GameInfo';
import { Clock, Users } from 'lucide-react';

export function GamePage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: game, isLoading } = useQuery({
    queryKey: ['/api/games', id],
    queryFn: () => fetch(`/api/games/${id}`).then(res => res.json()),
    enabled: !!id,
  });

  const { data: moves } = useQuery({
    queryKey: ['/api/games', id, 'moves'],
    queryFn: () => fetch(`/api/games/${id}/moves`).then(res => res.json()),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
        <p>The game you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Chess Board */}
      <div className="lg:col-span-2">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Game #{game.id}</h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              game.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
              game.status === 'active' ? 'bg-green-500/20 text-green-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {game.status}
            </div>
          </div>
          <ChessBoard game={game} moves={moves || []} />
        </div>
      </div>

      {/* Game Information */}
      <div className="space-y-6">
        <GameInfo game={game} />
        
        {/* Player Information */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Players</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-white">White</span>
              </div>
              <span className="text-gray-300">Player #{game.whitePlayerId}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-800 rounded-full border border-white/20"></div>
                <span className="text-white">Black</span>
              </div>
              <span className="text-gray-300">
                {game.blackPlayerId ? `Player #${game.blackPlayerId}` : 'Waiting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Time Control */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            <Clock className="w-5 h-5 inline mr-2" />
            Time Control
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">White Time:</span>
              <span className="text-white font-mono">
                {Math.floor(game.whiteTimeLeft / 60)}:{(game.whiteTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Black Time:</span>
              <span className="text-white font-mono">
                {Math.floor(game.blackTimeLeft / 60)}:{(game.blackTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Join Game Button */}
        {game.status === 'waiting' && !game.blackPlayerId && (
          <button className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors">
            <Users className="w-5 h-5 inline mr-2" />
            Join Game
          </button>
        )}
      </div>
    </div>
  );
}