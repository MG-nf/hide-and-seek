import { useEffect, useState } from "react";
import "./App.css";
import { socket } from "./socket";
import { GameBoard } from "./components/GameBoard";

function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [playerId, setPlayerId] = useState<string>('Waiting...');
  const [roomId, setRoomId] = useState<string>('Waiting...');
  const [role, setRole] = useState<string>('Waiting...');
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

    socket.on('connect', onConnect)
    socket.on('testReply', onTestReply);
    socket.on('joined', onJoinRoom);
    socket.on('role', onRoleAssignment);

    return () => {
      socket.off('connect', onConnect);
      socket.off('joined', onJoinRoom);
      socket.off('role', onRoleAssignment);
      setConnected(false);
    };
  }, [connected]);

  return (
    <div>
      <h1>Hide and Seek</h1>
      <GameBoard playerId={playerId} roomId={roomId} role={role} />
    </div>
  );
}

export default App;
