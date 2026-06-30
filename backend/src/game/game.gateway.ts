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

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly gameService: GameService) {
    console.log('Gateway initialized!');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('testEvent')
  handleTest(@MessageBody() message: string) {
    console.log(`received testEvent: ${message}`);
    this.server.emit('testReply', 'ok');
  }

  @SubscribeMessage('joinGame')
  async handleJoin(client: Socket) {
    const match = await this.gameService.addPlayerToMatch(client);
    this.server.to(client.id).emit('joined', match.roomId);

    console.log(match.players.size);

    if (match.players.size === 2) {
      for (const player of match.players.values()) {
        this.server.to(player.socketId).emit('role', player.role);
      }
    }
  }

  handleDisconnect(client: Socket) {
    const match = this.gameService.removePlayerFromMatch(client);
    if (match) {
      const players = Array.from(match.players.values());
      const remainingPlayer = players[0];
      this.server
        .to(remainingPlayer.socketId)
        .emit('role', remainingPlayer.role);
    }
  }
}
