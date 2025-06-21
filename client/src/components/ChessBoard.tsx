import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";

interface ChessBoardProps {
  fen: string;
  onMove?: (move: string) => void;
  playerColor?: "white" | "black";
  disabled?: boolean;
}

export function ChessBoard({ fen, onMove, playerColor = "white", disabled = false }: ChessBoardProps) {
  const [chess] = useState(() => new Chess(fen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

  useEffect(() => {
    chess.load(fen);
  }, [fen, chess]);

  const handleSquareClick = (square: string) => {
    if (disabled) return;

    if (selectedSquare) {
      // Try to make a move
      const move = chess.move({
        from: selectedSquare,
        to: square,
        promotion: 'q' // Auto-promote to queen for simplicity
      });

      if (move) {
        onMove?.(move.san);
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else {
        // Select new piece if valid
        const moves = chess.moves({ square: square as any, verbose: true });
        if (moves.length > 0) {
          setSelectedSquare(square);
          setPossibleMoves(moves.map(m => m.to));
        } else {
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      }
    } else {
      // Select piece
      const moves = chess.moves({ square: square as any, verbose: true });
      if (moves.length > 0) {
        setSelectedSquare(square);
        setPossibleMoves(moves.map(m => m.to));
      }
    }
  };

  const renderSquare = (square: string, piece: any) => {
    const isLight = (square.charCodeAt(0) + parseInt(square[1])) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isPossibleMove = possibleMoves.includes(square);
    
    return (
      <div
        key={square}
        className={`
          w-12 h-12 flex items-center justify-center cursor-pointer text-2xl
          ${isLight ? 'bg-amber-100 dark:bg-amber-200' : 'bg-amber-800 dark:bg-amber-900'}
          ${isSelected ? 'ring-4 ring-blue-500' : ''}
          ${isPossibleMove ? 'ring-2 ring-green-500' : ''}
          hover:opacity-80 transition-all
        `}
        onClick={() => handleSquareClick(square)}
      >
        {piece && (
          <span className="text-black dark:text-white">
            {getPieceSymbol(piece)}
          </span>
        )}
      </div>
    );
  };

  const board = chess.board();
  const squares: React.ReactElement[] = [];

  // Render board based on player color
  const files = playerColor === "white" ? "abcdefgh" : "hgfedcba";
  const ranks = playerColor === "white" ? "87654321" : "12345678";

  for (const rank of ranks) {
    for (const file of files) {
      const square = file + rank;
      const piece = board[8 - parseInt(rank)][files.indexOf(file)];
      squares.push(renderSquare(square, piece));
    }
  }

  return (
    <div className="inline-block p-4 bg-amber-900 rounded-lg shadow-lg">
      <div className="grid grid-cols-8 gap-0 border-2 border-amber-700">
        {squares}
      </div>
    </div>
  );
}

function getPieceSymbol(piece: any): string {
  if (!piece) return "";
  
  const symbols = {
    'wk': '♔', 'wq': '♕', 'wr': '♖', 'wb': '♗', 'wn': '♘', 'wp': '♙',
    'bk': '♚', 'bq': '♛', 'br': '♜', 'bb': '♝', 'bn': '♞', 'bp': '♟'
  };
  
  return symbols[`${piece.color}${piece.type}` as keyof typeof symbols] || "";
}