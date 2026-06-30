import { PlayerState } from './playerState';

export interface MatchState {
  roomId: string;
  players: Map<string, PlayerState>;
  status: 'waiting' | 'running' | 'finished';
  winnerId: string | null;
  winReason: 'caught' | 'time_expired' | null;
  timeRemaining: number;
}
