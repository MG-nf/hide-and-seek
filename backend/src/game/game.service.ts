import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MatchState } from 'src/types/matchState';
import { PlayerState } from 'src/types/playerState';

@Injectable()
export class GameService {
  private matches: Map<string, MatchState> = new Map();

  createMatch(roomId: string): MatchState {
    const newMatch: MatchState = {
      roomId,
      players: new Map(),
      status: 'waiting',
      timeRemaining: 300,
    };
    this.matches.set(roomId, newMatch);
    return newMatch;
  }

  createPlayer(socketId: string): PlayerState {
    const newPlayer: PlayerState = {
      socketId,
      role: null,
      position: { x: 0, y: 0 },
    };
    return newPlayer;
  }

  getMatch(roomId: string): MatchState | undefined {
    return this.matches.get(roomId);
  }

  async addPlayerToMatch(client: Socket): Promise<MatchState> {
    let match = this.findMatch();
    if (!match) {
      const newRoomId = `room_${Date.now()}`;
      match = this.createMatch(newRoomId);
    }

    const newPlayer = this.createPlayer(client.id);

    const updatedPlayers = new Map(match.players);
    updatedPlayers.set(newPlayer.socketId, newPlayer);

    const updatedMatch: MatchState = {
      ...match,
      players: updatedPlayers,
    };

    this.matches.set(match.roomId, updatedMatch);

    await client.join(match.roomId);

    if (updatedMatch.players.size === 2) {
      return this.startMatch(updatedMatch);
    }

    return updatedMatch;
  }

  removePlayerFromMatch(client: Socket) {
    let targetRoomId: string | null = null;

    for (const [roomId, match] of this.matches.entries()) {
      if (match.players.has(client.id)) {
        targetRoomId = roomId;
        break;
      }
    }

    if (!targetRoomId) return null;

    const match = this.matches.get(targetRoomId)!;
    const newPlayers = new Map(match.players);
    newPlayers.delete(client.id);
    console.log(`Player ${client.id} has left room ${targetRoomId}`);

    if (newPlayers.size === 0) {
      this.matches.delete(targetRoomId);
      console.log(`Room ${targetRoomId} deleted`);
      return null;
    }

    const playerEntries = Array.from(newPlayers.entries());
    if (playerEntries.length > 0) {
      const [remainingSocketId, remainingPlayer] = playerEntries[0];

      newPlayers.set(remainingSocketId, {
        ...remainingPlayer,
        role: null,
      });
    }

    const updatedMatch: MatchState = {
      ...match,
      players: newPlayers,
      status: 'waiting',
    };

    this.matches.set(targetRoomId, updatedMatch);
    return updatedMatch;
  }

  findMatch(): MatchState | null {
    for (const match of this.matches.values()) {
      if (match.status === 'waiting' && match.players.size === 1) {
        return match;
      }
    }
    return null;
  }

  startMatch(match: MatchState) {
    const newPlayers = new Map(match.players);
    const players = Array.from(newPlayers.values());

    const isSeeker = Math.random() < 0.5;

    newPlayers.set(players[0].socketId, {
      ...players[0],
      role: isSeeker ? 'seeker' : 'hider',
    });

    newPlayers.set(players[1].socketId, {
      ...players[1],
      role: isSeeker ? 'hider' : 'seeker',
    });

    const randomPlayer = Math.random() < 0.5 ? players[0] : players[1];

    newPlayers.set(randomPlayer.socketId, {
      ...newPlayers.get(randomPlayer.socketId)!,
      position: { x: 9, y: 9 },
    });

    const updatedMatch: MatchState = {
      ...match,
      players: newPlayers,
      status: 'running',
    };

    this.matches.set(match.roomId, updatedMatch);
    console.log('The game has started');

    return updatedMatch;
  }

  updatePlayerPosition(
    socketId: string,
    newPosition: { x: number; y: number },
  ): MatchState | null {
    let targetRoomId: string | null = null;
    for (const [roomId, match] of this.matches.entries()) {
      if (match.players.has(socketId)) {
        targetRoomId = roomId;
        break;
      }
    }

    if (!targetRoomId) return null;

    const match = this.matches.get(targetRoomId)!;
    const player = match.players.get(socketId)!;

    if (match.status !== 'running') {
      console.log('Move intent rejected: Game is not running.');
      return null;
    }

    const isWithinBounds =
      newPosition.x >= 0 &&
      newPosition.x < 10 &&
      newPosition.y >= 0 &&
      newPosition.y < 10;

    if (!isWithinBounds) {
      console.log('Move intent rejected: Out of bounds.');
      return null;
    }

    const newPlayers = new Map(match.players);
    newPlayers.set(socketId, {
      ...player,
      position: newPosition,
    });

    const updatedMatch: MatchState = {
      ...match,
      players: newPlayers,
    };

    const collision = Array.from(match.players.values()).find(
      (p) =>
        p.socketId !== socketId &&
        p.position.x === newPosition.x &&
        p.position.y === newPosition.y,
    );

    if (collision) {
      updatedMatch.status = 'finished';
    }

    this.matches.set(targetRoomId, updatedMatch);

    return updatedMatch;
  }
}
