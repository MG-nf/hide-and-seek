import { PlayerState } from './playerState';

export interface MatchState {
  roomId: string;
  players: Map<string, PlayerState>;
  status: 'waiting' | 'running' | 'finished';
  winnerId: string | undefined;
  winReason: 'caught' | 'time_expired' | undefined;
  timeRemaining: number;
}
