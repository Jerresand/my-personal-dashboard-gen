export interface Player {
  name: string;
  totalCups?: number;
  iced?: number;
  defense?: number;
}

export interface TeamPlayer {
  player: Player;
  cups?: number;
  defense?: number;
  isIcer?: boolean;
}

export interface Match {
  id: string;
  team1Players: TeamPlayer[];
  team2Players: TeamPlayer[];
  team1Score?: number;
  team2Score?: number;
  date: string;
  isPlayoff: boolean;
  round?: number;
  series?: number;
}

export interface Tournament {
  id: string;
  name: string;
  players: Player[];
  format: "singles" | "doubles";
  matchesPerTeam: number;
  type: "playoffs" | "regular+playoffs";
  matches: Match[];
  createdAt: string;
}