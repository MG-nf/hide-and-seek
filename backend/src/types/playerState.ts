export interface PlayerState {
  socketId: string;
  role: 'seeker' | 'hider' | null;
  position: { x: number; y: number };
}
