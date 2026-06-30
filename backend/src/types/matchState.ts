import { PlayerState } from './playerState';

export interface MatchState {
  roomId: string;
  players: Map<string, PlayerState>;
  status: 'waiting' | 'running' | 'finished';
  timeRemaining: number;
}
