import { useEffect } from "react";
import "./App.css";
import { socket } from "./socket";

function App() {
  useEffect(() => {
    socket.connect();
    socket.emit("testEvent", "test");

    const onReply = (data: string) => console.log(data);
    socket.on("testReply", onReply);

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
