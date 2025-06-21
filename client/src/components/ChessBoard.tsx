import { useState } from 'react';
import type { Game, GameMove } from '../../../shared/schema';

interface ChessBoardProps {
  game: Game;
  moves: GameMove[];
}

export function ChessBoard({ game, moves }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Simple chess board representation
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Initial piece positions
  const initialPieces: Record<string, string> = {
    'a8': '♜', 'b8': '♞', 'c8': '♝', 'd8': '♛', 'e8': '♚', 'f8': '♝', 'g8': '♞', 'h8': '♜',
    'a7': '♟', 'b7': '♟', 'c7': '♟', 'd7': '♟', 'e7': '♟', 'f7': '♟', 'g7': '♟', 'h7': '♟',
    'a2': '♙', 'b2': '♙', 'c2': '♙', 'd2': '♙', 'e2': '♙', 'f2': '♙', 'g2': '♙', 'h2': '♙',
    'a1': '♖', 'b1': '♘', 'c1': '♗', 'd1': '♕', 'e1': '♔', 'f1': '♗', 'g1': '♘', 'h1': '♖',
  };

  const handleSquareClick = (square: string) => {
    if (game.status !== 'active') return;
    setSelectedSquare(selectedSquare === square ? null : square);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="grid grid-cols-8 gap-0 border-2 border-gray-600 rounded-lg overflow-hidden">
        {ranks.map((rank) =>
          files.map((file) => {
            const square = file + rank;
            const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0;
            const isSelected = selectedSquare === square;
            const piece = initialPieces[square];

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                className={`
                  w-12 h-12 flex items-center justify-center text-2xl cursor-pointer relative
                  ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
                  ${isSelected ? 'ring-4 ring-blue-400' : ''}
                  hover:bg-opacity-80 transition-colors
                `}
              >
                {piece && (
                  <span className="select-none">
                    {piece}
                  </span>
                )}
                <div className="absolute bottom-0 left-0 text-xs text-gray-600 leading-none">
                  {square}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Move history */}
      {moves.length > 0 && (
        <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Move History</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {moves.map((move) => (
              <div key={move.id} className="flex justify-between text-sm">
                <span className="text-gray-300">
                  {move.moveNumber}. {move.move}
                </span>
                <span className="text-gray-400">
                  {Math.floor(move.timeLeft / 60)}:{(move.timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}