import React from 'react';
import { Link } from 'wouter';
import { Clock, DollarSign, User } from 'lucide-react';
import type { Game } from '../../../shared/schema';

interface GamesListProps {
  games: Game[];
}

export function GamesList({ games }: GamesListProps) {
  if (!games || games.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-2">No games available</div>
        <div className="text-sm text-gray-500">Be the first to create a game!</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <Link
          key={game.id}
          href={`/game/${game.id}`}
          className="block bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors border border-white/10 hover:border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-white font-medium">
                Player #{game.whitePlayerId}
              </span>
              {game.blackPlayerId && (
                <>
                  <span className="text-gray-400">vs</span>
                  <span className="text-white font-medium">
                    Player #{game.blackPlayerId}
                  </span>
                </>
              )}
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              game.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
              game.status === 'active' ? 'bg-green-500/20 text-green-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {game.status}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{Math.floor(game.timeControl / 60)}min</span>
              </div>
              {game.isWagered && (
                <div className="flex items-center space-x-1 text-green-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{game.wagerAmount} {game.wagerToken}</span>
                </div>
              )}
            </div>
            <div className="text-gray-400">
              {new Date(game.createdAt).toLocaleDateString()}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}