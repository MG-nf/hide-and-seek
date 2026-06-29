import './GameBoard.css';

export const GameBoard = ({
  playerId,
  roomId,
  role,
}: {
  playerId: string;
  roomId: string;
  role: string;
}) => {
  const cells = Array.from({ length: 100 });

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
      </div>
      <div className="grid">
        {cells.map((_, index) => (
          <div key={index} className="cell"></div>
        ))}
      </div>
    </div>
  );
};
