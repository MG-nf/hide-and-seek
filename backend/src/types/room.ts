export interface Room {
  id: string;
  players: Set<string>;
  roles: {
    seeker: string | null;
    hider: string | null;
  };
  gameStarted: boolean;
}
