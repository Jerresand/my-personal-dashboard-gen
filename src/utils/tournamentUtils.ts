import { Player, Match, Tournament } from "@/types/tournament";

export interface Standing {
  player: Player;
  wins: number;
  losses: number;
  winPercentage: number;
}

export const generateTeamName = (players: Player[]): string => {
  return `Team ${players.map(p => p.name.slice(0, 3)).join("")}`;
};

export const createTeamPlayer = (player: Player) => {
  return {
    player,
    cups: 0,
    defense: 0,
    isIcer: false
  };
};

export const calculateStandings = (tournament: Tournament): Standing[] => {
  const playerStats = new Map<string, Standing>();

  // Initialize standings for all players
  tournament.players.forEach(player => {
    playerStats.set(player.name, {
      player,
      wins: 0,
      losses: 0,
      winPercentage: 0
    });
  });

  // Calculate wins and losses from matches
  tournament.matches.forEach(match => {
    if (match.team1Score === undefined || match.team2Score === undefined) return;

    const team1Won = match.team1Score > match.team2Score;

    match.team1Players.forEach(({ player }) => {
      const stats = playerStats.get(player.name);
      if (stats) {
        if (team1Won) stats.wins += 1;
        else stats.losses += 1;
      }
    });

    match.team2Players.forEach(({ player }) => {
      const stats = playerStats.get(player.name);
      if (stats) {
        if (!team1Won) stats.wins += 1;
        else stats.losses += 1;
      }
    });
  });

  // Calculate win percentages
  playerStats.forEach(stats => {
    const totalGames = stats.wins + stats.losses;
    stats.winPercentage = totalGames > 0 ? stats.wins / totalGames : 0;
  });

  return Array.from(playerStats.values()).sort((a, b) => b.winPercentage - a.winPercentage);
};

export const generateMatches = (
  players: Player[],
  format: "singles" | "doubles",
  matchesPerTeam: number
): Match[] => {
  const matches: Match[] = [];
  const numPlayers = players.length;
  const startDate = new Date();

  if (format === "doubles") {
    // Create teams of two players
    const teams: Player[][] = [];
    for (let i = 0; i < numPlayers; i += 2) {
      if (i + 1 < numPlayers) {
        teams.push([players[i], players[i + 1]]);
      }
    }

    // Generate round-robin matches between teams
    for (let round = 0; round < matchesPerTeam; round++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const matchDate = new Date(startDate);
          matchDate.setHours(startDate.getHours() + matches.length * 2); // 2 hours between matches

          matches.push({
            id: crypto.randomUUID(),
            team1Players: teams[i].map(p => createTeamPlayer(p)),
            team2Players: teams[j].map(p => createTeamPlayer(p)),
            date: matchDate.toISOString(),
            isPlayoff: false,
            round: round + 1,
            series: Math.floor(matches.length / 2) + 1
          });
        }
      }
    }

    // Generate playoff matches if there are enough teams
    if (teams.length >= 4) {
      const numPlayoffRounds = Math.floor(Math.log2(teams.length));
      const playoffStartDate = new Date(matches[matches.length - 1].date);
      playoffStartDate.setDate(playoffStartDate.getDate() + 1); // Playoffs start the next day

      for (let round = 1; round <= numPlayoffRounds; round++) {
        const numMatchesInRound = Math.pow(2, numPlayoffRounds - round);
        for (let match = 0; match < numMatchesInRound; match++) {
          const matchDate = new Date(playoffStartDate);
          matchDate.setHours(matchDate.getHours() + (round - 1) * 4); // 4 hours between playoff matches

          matches.push({
            id: crypto.randomUUID(),
            team1Players: [createTeamPlayer(teams[0][0])], // Placeholder teams
            team2Players: [createTeamPlayer(teams[1][0])], // Will be determined by previous matches
            date: matchDate.toISOString(),
            isPlayoff: true,
            round: round,
            series: match + 1
          });
        }
      }
    }
  } else {
    // Singles tournament format
    for (let round = 0; round < matchesPerTeam; round++) {
      for (let i = 0; i < numPlayers; i++) {
        for (let j = i + 1; j < numPlayers; j++) {
          const matchDate = new Date(startDate);
          matchDate.setHours(startDate.getHours() + matches.length * 1); // 1 hour between matches

          matches.push({
            id: crypto.randomUUID(),
            team1Players: [createTeamPlayer(players[i])],
            team2Players: [createTeamPlayer(players[j])],
            date: matchDate.toISOString(),
            isPlayoff: false,
            round: round + 1,
            series: Math.floor(matches.length / 2) + 1
          });
        }
      }
    }

    // Generate playoff matches for singles if there are enough players
    if (numPlayers >= 4) {
      const numPlayoffRounds = Math.floor(Math.log2(numPlayers));
      const playoffStartDate = new Date(matches[matches.length - 1].date);
      playoffStartDate.setDate(playoffStartDate.getDate() + 1);

      for (let round = 1; round <= numPlayoffRounds; round++) {
        const numMatchesInRound = Math.pow(2, numPlayoffRounds - round);
        for (let match = 0; match < numMatchesInRound; match++) {
          const matchDate = new Date(playoffStartDate);
          matchDate.setHours(matchDate.getHours() + (round - 1) * 2);

          matches.push({
            id: crypto.randomUUID(),
            team1Players: [createTeamPlayer(players[0])], // Placeholder players
            team2Players: [createTeamPlayer(players[1])], // Will be determined by previous matches
            date: matchDate.toISOString(),
            isPlayoff: true,
            round: round,
            series: match + 1
          });
        }
      }
    }
  }

  return matches;
};