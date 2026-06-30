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
    const onGameOver = () => setIsGameOver(true);

    socket.on('connect', onConnect)
    socket.on('testReply', onTestReply);
    socket.on('joined', onJoinRoom);
    socket.on('role', onRoleAssignment);
    socket.on('move', onMove);
    socket.on('gameOver', onGameOver);

    return () => {
      socket.off('connect', onConnect);
      socket.off('testReply', onTestReply);
      socket.off('joined', onJoinRoom);
      socket.off('role', onRoleAssignment);
      socket.off('move', onMove);
      socket.off('gameOver', onGameOver);
      setConnected(false);
    };
  }, [connected]);

  return (
    <div>
      <h1>Hide and Seek</h1>
      <GameBoard playerId={playerId} playerPosition = {playerPosition} roomId={roomId} role={role} isGameOver={isGameOver} />
    </div>
  );
}

export default App;
