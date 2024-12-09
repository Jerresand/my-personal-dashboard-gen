import { Player, Match, TeamPlayer } from "@/types/tournament";

export const generateTeamName = (players: Player[]): string => {
  return `Team ${players.map(p => p.name.slice(0, 3)).join("")}`;
};

export const createTeamPlayer = (player: Player): TeamPlayer => {
  return {
    player,
    cups: 0,
    defense: 0,
    isIcer: false
  };
};

export const generateMatches = (
  players: Player[],
  format: "singles" | "doubles",
  matchesPerTeam: number
): Match[] => {
  const matches: Match[] = [];
  const numPlayers = players.length;

  // For doubles, we need to pair players
  if (format === "doubles") {
    const teams: Player[][] = [];
    for (let i = 0; i < numPlayers; i += 2) {
      if (i + 1 < numPlayers) {
        teams.push([players[i], players[i + 1]]);
      }
    }

    // Generate matches between teams
    for (let round = 0; round < matchesPerTeam; round++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matches.push({
            id: crypto.randomUUID(),
            team1Players: teams[i].map(p => createTeamPlayer(p)),
            team2Players: teams[j].map(p => createTeamPlayer(p)),
            date: new Date(Date.now() + matches.length * 24 * 60 * 60 * 1000).toISOString(),
            isPlayoff: false,
            round: round + 1
          });
        }
      }
    }
  } else {
    // Singles tournament
    for (let round = 0; round < matchesPerTeam; round++) {
      for (let i = 0; i < numPlayers; i++) {
        for (let j = i + 1; j < numPlayers; j++) {
          matches.push({
            id: crypto.randomUUID(),
            team1Players: [createTeamPlayer(players[i])],
            team2Players: [createTeamPlayer(players[j])],
            date: new Date(Date.now() + matches.length * 24 * 60 * 60 * 1000).toISOString(),
            isPlayoff: false,
            round: round + 1
          });
        }
      }
    }
  }

  return matches;
};