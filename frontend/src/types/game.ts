export interface Room {
  room_id: number;
  creator: string;
  current_round: number; // 0=lobby, 1-3=active, 4=finished
  challenge_seed: number;
  player_count: number;
  max_players: number;
  prompts_submitted: number;
  is_scored: boolean;
}

export interface RoomPlayer {
  index: number;
  address: string;
  prompt: string;
  round_score: number;
  total_score: number;
  has_submitted: boolean;
  rounds_participated: number;
}

export interface LeaderboardEntry {
  address: string;
  xp: number;
}

export type GamePhase =
  | "lobby"
  | "prompting"
  | "waiting_submissions"
  | "scoring"
  | "results"
  | "finished";

export function getGamePhase(room: Room): GamePhase {
  if (room.current_round === 0) return "lobby";
  if (room.current_round > 3) return "finished";
  if (room.is_scored) return "results";
  // Ready to score when all players have submitted
  if (room.prompts_submitted >= room.player_count) return "scoring";
  // Still waiting for submissions
  return "prompting";
}
