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

const generateRoundRobinSchedule = (teams: Player[][], matchesPerTeam: number): Match[] => {
  const matches: Match[] = [];
  const startDate = new Date();
  const numTeams = teams.length;
  
  // If odd number of teams, add a "BYE" team
  if (numTeams % 2 !== 0) {
    teams.push([{ name: "BYE" }]);
  }
  
  const totalRounds = teams.length - 1;
  const matchesPerRound = Math.floor(teams.length / 2);

  for (let round = 0; round < totalRounds * matchesPerTeam; round++) {
    const roundTeams = [...teams];
    const roundNumber = Math.floor(round / totalRounds) + 1;
    
    // Rotate teams for each round (keeping first team fixed)
    const firstTeam = roundTeams[0];
    const lastTeam = roundTeams[roundTeams.length - 1];
    
    for (let i = roundTeams.length - 1; i > 1; i--) {
      roundTeams[i] = roundTeams[i - 1];
    }
    roundTeams[1] = lastTeam;
    
    // Create matches for this round
    for (let i = 0; i < matchesPerRound; i++) {
      const team1 = roundTeams[i];
      const team2 = roundTeams[roundTeams.length - 1 - i];
      
      // Skip matches involving BYE team
      if (team1[0].name === "BYE" || team2[0].name === "BYE") continue;

      const matchDate = new Date(startDate);
      matchDate.setHours(startDate.getHours() + matches.length * 2);

      matches.push({
        id: crypto.randomUUID(),
        team1Players: team1.map(p => createTeamPlayer(p)),
        team2Players: team2.map(p => createTeamPlayer(p)),
        date: matchDate.toISOString(),
        isPlayoff: false,
        round: roundNumber,
        series: matches.length + 1
      });
    }
  }
  
  return matches;
};

export const generateMatches = (
  players: Player[],
  format: "singles" | "doubles",
  matchesPerTeam: number
): Match[] => {
  let matches: Match[] = [];
  const numPlayers = players.length;

  if (format === "doubles") {
    // Create teams of two players
    const teams: Player[][] = [];
    for (let i = 0; i < numPlayers; i += 2) {
      if (i + 1 < numPlayers) {
        teams.push([players[i], players[i + 1]]);
      }
    }

    // Generate round-robin schedule for teams
    matches = generateRoundRobinSchedule(teams, matchesPerTeam);

    // Generate playoff matches if there are enough teams
    if (teams.length >= 4) {
      const numPlayoffRounds = Math.floor(Math.log2(teams.length));
      const playoffStartDate = new Date(matches[matches.length - 1].date);
      playoffStartDate.setDate(playoffStartDate.getDate() + 1);

      for (let round = 1; round <= numPlayoffRounds; round++) {
        const numMatchesInRound = Math.pow(2, numPlayoffRounds - round);
        for (let match = 0; match < numMatchesInRound; match++) {
          const matchDate = new Date(playoffStartDate);
          matchDate.setHours(matchDate.getHours() + (round - 1) * 4);

          matches.push({
            id: crypto.randomUUID(),
            team1Players: [createTeamPlayer({ name: `Playoff Team ${match * 2 + 1}` })],
            team2Players: [createTeamPlayer({ name: `Playoff Team ${match * 2 + 2}` })],
            date: matchDate.toISOString(),
            isPlayoff: true,
            round: round,
            series: match + 1
          });
        }
      }
    }
  } else {
    // For singles, treat each player as a team of one
    const singlePlayerTeams = players.map(player => [player]);
    matches = generateRoundRobinSchedule(singlePlayerTeams, matchesPerTeam);

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
            team1Players: [createTeamPlayer({ name: `Playoff Player ${match * 2 + 1}` })],
            team2Players: [createTeamPlayer({ name: `Playoff Player ${match * 2 + 2}` })],
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
