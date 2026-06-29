import { useEffect } from "react";
import "./App.css";
import { socket } from "./socket";

function App() {
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected! Socket ID:', socket.id);
      socket.emit('testEvent', 'test');
    });

    const onReply = (data: string) => console.log(data);
    socket.on("testReply", onReply);

    const onJoinRoom = (data: string) => console.log(data);
    socket.on("joined", onJoinRoom);

    const onRoleAssignment = (role: string) => console.log('You are the ' + role);
    socket.on("role", onRoleAssignment);

    socket.emit("joinGame");

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Hide and Seek</h1>
    </div>
  );
}

export default App;
