import { useEffect, useState } from "react";
import "./App.css";
import { socket } from "./socket";
import { GameBoard } from "./components/GameBoard";

function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [playerId, setPlayerId] = useState<string>('Waiting...');
  const [roomId, setRoomId] = useState<string>('Waiting...');
  const [role, setRole] = useState<string>('Waiting...');
  const [playerPosition, setPlayerPosition] = useState<{x: number, y:number}>({x:0, y:0});
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<string>('');
  const [winReason, setWinReason] = useState<string>('');
  const [time, setTime] = useState<number>(60);

  useEffect(() => {
    if (!connected) {
      socket.connect();
    }

    const onConnect = () => {
      setConnected(true);
      setPlayerId(socket.id!);
      socket.emit('testEvent', 'test');
      socket.emit('joinGame');
    };
    const onTestReply = (data: string) => console.log(data);
    const onJoinRoom = (roomId: string) => setRoomId(roomId);
    const onRoleAssignment = (role: string) => setRole(role);
    const onMove = (position: {x: number, y: number}) => setPlayerPosition(position);
    const onTime = (time: number) => setTime(time);

    socket.on('connect', onConnect)
    socket.on('testReply', onTestReply);
    socket.on('joined', onJoinRoom);
    socket.on('role', onRoleAssignment);
    socket.on('move', onMove);
    socket.on('gameOver', (data: { winnerId: string, message: string }) => {
      setIsGameOver(true);
      setWinner(data.winnerId);
      console.log(data.message);
      const winReason = data.message === 'caught' ? 'The hider has been caught' : 'The time is up';
      console.log(winReason);
      setWinReason(winReason);
    });
    socket.on('time', onTime);

    return () => {
      socket.off('connect', onConnect);
      socket.off('testReply', onTestReply);
      socket.off('joined', onJoinRoom);
      socket.off('role', onRoleAssignment);
      socket.off('move', onMove);
      socket.off('gameOver');
      setConnected(false);
    };
  }, [connected]);

  return (
    <div>
      <h1>Hide and Seek</h1>
      <GameBoard playerId={playerId} playerPosition = {playerPosition} roomId={roomId} role={role} isGameOver={isGameOver} winner={winner} winReason={winReason} time={time} />
    </div>
  );
}

export default App;
