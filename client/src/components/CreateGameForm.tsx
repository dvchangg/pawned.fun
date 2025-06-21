import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, DollarSign } from 'lucide-react';

export function CreateGameForm() {
  const [timeControl, setTimeControl] = useState(600);
  const [wagerAmount, setWagerAmount] = useState('0');
  const [isWagered, setIsWagered] = useState(false);
  const queryClient = useQueryClient();

  const createGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData),
      });
      if (!response.ok) throw new Error('Failed to create game');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      // Reset form
      setTimeControl(600);
      setWagerAmount('0');
      setIsWagered(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For demo purposes, using a mock user ID
    // In a real app, this would come from wallet connection
    const mockUserId = Math.floor(Math.random() * 1000) + 1;
    
    createGameMutation.mutate({
      whitePlayerId: mockUserId,
      timeControl,
      wagerAmount: isWagered ? wagerAmount : '0',
      isWagered,
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Time Control */}
        <div>
          <label className="block text-white font-medium mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Time Control
          </label>
          <select
            value={timeControl}
            onChange={(e) => setTimeControl(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
          >
            <option value={300} className="bg-gray-800">5 minutes</option>
            <option value={600} className="bg-gray-800">10 minutes</option>
            <option value={900} className="bg-gray-800">15 minutes</option>
            <option value={1800} className="bg-gray-800">30 minutes</option>
          </select>
        </div>

        {/* Wager Settings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-white font-medium">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Wager Game
            </label>
            <button
              type="button"
              onClick={() => setIsWagered(!isWagered)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isWagered ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isWagered ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {isWagered && (
            <div className="flex space-x-3">
              <input
                type="number"
                value={wagerAmount}
                onChange={(e) => setWagerAmount(e.target.value)}
                placeholder="Amount"
                min="0"
                step="0.01"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
              <select
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                defaultValue="SOL"
              >
                <option value="SOL" className="bg-gray-800">SOL</option>
                <option value="USDC" className="bg-gray-800">USDC</option>
              </select>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={createGameMutation.isPending}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createGameMutation.isPending ? 'Creating Game...' : 'Create Game'}
        </button>
      </form>
    </div>
  );
}