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

    if (match.players.size === 2) {
      for (const player of match.players.values()) {
        this.server.to(player.socketId).emit('role', player.role);
        this.server.to(player.socketId).emit('move', player.position);
      }

      const timer = setInterval(() => {
        const updatedMatch = this.gameService.countDownTimer(match.roomId);

        if (!updatedMatch) {
          clearInterval(timer);
          return;
        }

        this.server
          .to(updatedMatch.roomId)
          .emit('time', updatedMatch.timeRemaining);

        if (updatedMatch.status === 'finished') {
          clearInterval(timer);
          this.server.to(updatedMatch.roomId).emit('gameOver', {
            winnerId: updatedMatch.winnerId,
            reason: updatedMatch.winReason,
          });
        }
      }, 1000);
    }
  }

  @SubscribeMessage('movePlayer')
  handleMove(client: Socket, position: { x: number; y: number }) {
    const match = this.gameService.updatePlayerPosition(client.id, position);

    if (match) {
      this.server.to(client.id).emit('move', position);

      if (match.status === 'finished') {
        this.server.to(match.roomId).emit('gameOver', {
          winnerId: match.winnerId,
          message: match.winReason,
        });
      }
    } else {
      client.emit('moveRejected', 'Invalid move!');
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
      this.server
        .to(remainingPlayer.socketId)
        .emit('move', remainingPlayer.position);
      this.server
        .to(remainingPlayer.socketId)
        .emit('time', match.timeRemaining);
      this.server
        .to(remainingPlayer.socketId)
        .emit('opponentLeft', { message: 'Your opponent has left the match' });
    }
  }
}
