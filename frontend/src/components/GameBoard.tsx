import { useEffect } from 'react';
import { socket } from '../socket';
import './GameBoard.css';
import type { PlayerRole } from '../types/playerRole';

export const GameBoard = ({
  playerId,
  playerPosition,
  roomId,
  role,
  isGameOver,
  winner,
  winReason,
  time,
}: {
  playerId: string;
  playerPosition: {x: number, y:number};
  roomId: string;
  role: string;
  isGameOver: boolean;
  winner: string;
  winReason: string;
  time: number;
}) => {
  const cells = Array.from({ length: 100 }).map((_, index) => ({
    id: index,
    x: index % 10,
    y: Math.floor(index / 10),
  }));

  const displayRole: PlayerRole = (role as PlayerRole) || "waiting";

  const isSeeker = role === 'seeker' ? true : false;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      let { x, y } = playerPosition;

      switch (event.key) {
        case 'ArrowUp':    y = Math.max(0, y - 1); break;
        case 'ArrowDown':  y = Math.min(9, y + 1); break;
        case 'ArrowLeft':  x = Math.max(0, x - 1); break;
        case 'ArrowRight': x = Math.min(9, x + 1); break;
        default: return;
      }

      socket.emit('movePlayer', { x, y });
    };
    
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };

  }, [playerPosition]);

  useEffect(() => {
    if (isGameOver) {
      alert("Game Over! " + winner + " won (" + winReason + ")!");
    }
  }, [isGameOver, winReason, winner]);

  return (
    <div className="game-container">
      <div className="meta-info">
        <p>
          <strong>Player ID:</strong> {playerId}
        </p>
        <p>
          <strong>Room ID:</strong> {roomId}
        </p>
        <p>
          <strong>Your Role:</strong> {displayRole}
        </p>
        <p>
          <strong>Remaining time:</strong> {time} seconds
        </p>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
      {cells.map((cell) => {
        const isPlayer = cell.x === playerPosition.x && cell.y === playerPosition.y;
        
        return (
          <div key={cell.id} className="grid-cell">
            {isPlayer && (
              <div 
                className="game-token" 
                style={{ 
                  '--color-token': isSeeker ? '#4b7bec' : '#8854d0' 
                } as React.CSSProperties}
              >
                {isSeeker && <div className="search-aura" />}
                <span className="token-emoji">{isSeeker ? '👮' : '🥷'}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
    </div>
  );
};
