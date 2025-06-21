import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { GamesList } from '../components/GamesList';
import { CreateGameForm } from '../components/CreateGameForm';
import { Crown, Users, Gamepad2 } from 'lucide-react';

export function HomePage() {
  const { data: waitingGames, isLoading } = useQuery({
    queryKey: ['/api/games'],
    queryFn: () => fetch('/api/games?status=waiting').then(res => res.json()),
  });

  const { data: activeGames } = useQuery({
    queryKey: ['/api/games', 'active'],
    queryFn: () => fetch('/api/games?status=active').then(res => res.json()),
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center text-white">
        <div className="flex justify-center mb-6">
          <Crown className="w-16 h-16 text-yellow-400" />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          ChessLana
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Decentralized chess on Solana blockchain with wagering and competitive play
        </p>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{waitingGames?.length || 0}</div>
            <div className="text-gray-300">Waiting Games</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <Gamepad2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{activeGames?.length || 0}</div>
            <div className="text-gray-300">Active Games</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">1200+</div>
            <div className="text-gray-300">Average ELO</div>
          </div>
        </div>
      </div>

      {/* Create Game Section */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create New Game</h2>
        <CreateGameForm />
      </div>

      {/* Games Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Waiting for Players</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <GamesList games={waitingGames || []} />
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Active Games</h2>
          <GamesList games={activeGames || []} />
        </div>
      </div>
    </div>
  );
}