import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Room } from 'src/types/room';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  private rooms: Map<string, Room> = new Map();

  constructor(private readonly gameService: GameService) {
    console.log('Gateway initialized!');
    console.table(this.rooms);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  /*handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }*/

  @SubscribeMessage('testEvent')
  handleTest(@MessageBody() message: string) {
    console.log(`received testEvent: ${message}`);
    this.server.emit('testReply', 'ok');
  }

  @SubscribeMessage('joinGame')
  handleJoin(client: Socket) {
    // find room with exactly 1 other player
    const targetRoom = Array.from(this.rooms.values()).find(
      (room) => room.players.size === 1,
    );

    if (targetRoom) {
      // add client to room and start the game
      client.join(targetRoom.id);
      targetRoom.players.add(client.id);
      console.log(`player ${client.id} has joined room ${targetRoom.id}`);
      console.table(this.rooms);
      console.log('client has joined a room with another player');
      this.server.to(client.id).emit('joined', targetRoom.id);
      this.startGame(targetRoom);
    } else {
      // create a new room
      const newRoomId = `room_${Date.now()}`;
      client.join(newRoomId);
      this.rooms.set(newRoomId, {
        id: newRoomId,
        players: new Set([client.id]),
        roles: { seeker: null, hider: null },
        gameStarted: false,
      });
      console.log(`player ${client.id} has joined room ${newRoomId}`);
      console.table(this.rooms);
      console.log('client has joined an empty room');
      this.server.to(client.id).emit('joined', newRoomId);
    }
  }

  private startGame(room: Room) {
    const playersArray = Array.from(room.players);
    const isSeeker = Math.random() > 0.5;

    room.roles = {
      seeker: isSeeker ? playersArray[0] : playersArray[1],
      hider: isSeeker ? playersArray[1] : playersArray[0],
    };
    room.gameStarted = true;

    this.server.to(room.roles.seeker!).emit('role', 'seeker');
    this.server.to(room.roles.hider!).emit('role', 'hider');
  }

  handleDisconnect(client: Socket) {
    // cleanup
    for (const [id, room] of this.rooms.entries()) {
      if (room.players.has(client.id)) {
        room.players.delete(client.id);
        console.log(`Player ${client.id} has left the room.`);
        if (room.players.size === 0) {
          this.rooms.delete(id);
          console.log(`Room ${id} has been removed`);
        }
        break;
      }
    }
    console.table(this.rooms);
  }
}
