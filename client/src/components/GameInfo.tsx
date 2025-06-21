import { DollarSign, Clock, Calendar } from 'lucide-react';
import type { Game } from '../../../shared/schema';

interface GameInfoProps {
  game: Game;
}

export function GameInfo({ game }: GameInfoProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">Game Information</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            game.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
            game.status === 'active' ? 'bg-green-500/20 text-green-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {game.status}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Result:</span>
          <span className="text-white">
            {game.result === 'ongoing' ? 'In Progress' : 
             game.result === 'white_wins' ? 'White Wins' :
             game.result === 'black_wins' ? 'Black Wins' :
             game.result === 'draw' ? 'Draw' : 'Ongoing'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">
            <Clock className="w-4 h-4 inline mr-1" />
            Time Control:
          </span>
          <span className="text-white">
            {Math.floor(game.timeControl / 60)} minutes
          </span>
        </div>

        {game.isWagered && (
          <div className="flex items-center justify-between">
            <span className="text-gray-300">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Wager:
            </span>
            <span className="text-green-400 font-medium">
              {game.wagerAmount} {game.wagerToken}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-gray-300">
            <Calendar className="w-4 h-4 inline mr-1" />
            Created:
          </span>
          <span className="text-white">
            {new Date(game.createdAt).toLocaleDateString()}
          </span>
        </div>

        {game.completedAt && (
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Completed:</span>
            <span className="text-white">
              {new Date(game.completedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}