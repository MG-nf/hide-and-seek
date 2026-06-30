import { useEffect } from 'react';
import { socket } from '../socket';
import './GameBoard.css';

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
  const cells = Array.from({ length: 100 });

  if(!role) {
    role = "Waiting...";
  }
 
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
          <strong>Your Role:</strong> {role}
        </p>
        <p>
          <strong>Remaining time:</strong> {time} seconds
        </p>
      </div>
      <div className="grid">
        {cells.map((_, index) => {
          const x = index % 10;
          const y = Math.floor(index / 10);

          const isPlayerHere = playerPosition.x === x && playerPosition.y === y;

          return (
            <div key={index} className="cell">
              {isPlayerHere ? 'X' : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};
