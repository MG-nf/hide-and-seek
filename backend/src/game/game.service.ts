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

  async addPlayerToMatch(client: Socket) {
    let match = this.findMatch();
    if (!match) {
      const newRoomId = `room_${Date.now()}`;
      match = this.createMatch(newRoomId);
    }

    const newPlayer = this.createPlayer(client.id);

    const updatedPlayers = new Map(match.players);
    updatedPlayers.set(newPlayer.socketId, newPlayer);

    const updatedMatch = {
      ...match,
      players: updatedPlayers,
    };

    this.matches.set(match.roomId, updatedMatch);

    await client.join(match.roomId);

    if (updatedMatch.players.size === 2) {
      return this.startMatch(updatedMatch);
    }
    return match;
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
    const players = Array.from(match.players.values());
    const isSeeker = Math.random() < 0.5;

    players[0].role = isSeeker ? 'seeker' : 'hider';
    players[1].role = isSeeker ? 'hider' : 'seeker';

    match.status = 'running';
    console.log('The game has started');

    return match;
  }
}
