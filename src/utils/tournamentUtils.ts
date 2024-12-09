import { Player, Match, Tournament } from "@/types/tournament";

export interface Standing {
  player: Player;
  wins: number;
  losses: number;
  winPercentage: number;
}

export const generateTeamName = (players: Player[]): string => {
  return players.map(p => p.name.slice(0, 3)).join("");
};

export const createTeamPlayer = (player: Player) => {
  return {
    player,
    cups: 0,
    defense: 0,
    isIcer: false
  };
};

const generateRoundRobinSchedule = (teams: Player[][], matchesPerTeam: number): Match[] => {
  const matches: Match[] = [];
  const startDate = new Date();
  let numTeams = teams.length;
  
  // If odd number of teams, add a "BYE" team
  if (numTeams % 2 !== 0) {
    teams.push([{ name: "BYE" }]);
    numTeams++;
  }
  
  const totalRounds = numTeams - 1;
  const matchesPerRound = Math.floor(numTeams / 2);

  // Create array of team indices
  let teamIndices = Array.from({ length: numTeams }, (_, i) => i);

  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const team1Index = teamIndices[match];
      const team2Index = teamIndices[numTeams - 1 - match];

      // Skip matches involving BYE team
      if (teams[team1Index][0].name === "BYE" || teams[team2Index][0].name === "BYE") {
        continue;
      }

      const matchDate = new Date(startDate);
      matchDate.setHours(startDate.getHours() + (round * matchesPerRound + match) * 2);

      matches.push({
        id: crypto.randomUUID(),
        team1Players: teams[team1Index].map(p => createTeamPlayer(p)),
        team2Players: teams[team2Index].map(p => createTeamPlayer(p)),
        date: matchDate.toISOString(),
        isPlayoff: false,
        round: round + 1,
        series: matches.length + 1
      });
    }

    // Rotate teams (keeping first team fixed)
    teamIndices = [
      teamIndices[0],
      ...teamIndices.slice(-1),
      ...teamIndices.slice(1, -1)
    ];
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

  } else {
    // For singles, treat each player as a team of one
    const singlePlayerTeams = players.map(player => [player]);
    matches = generateRoundRobinSchedule(singlePlayerTeams, matchesPerTeam);
  }

  // Generate playoff matches if there are enough teams/players
  const minTeamsForPlayoffs = 4;
  const teamsOrPlayers = format === "doubles" ? Math.floor(numPlayers / 2) : numPlayers;

  if (teamsOrPlayers >= minTeamsForPlayoffs) {
    const numPlayoffRounds = Math.floor(Math.log2(teamsOrPlayers));
    const playoffStartDate = new Date(matches[matches.length - 1]?.date || new Date());
    playoffStartDate.setDate(playoffStartDate.getDate() + 1);

    for (let round = 1; round <= numPlayoffRounds; round++) {
      const numMatchesInRound = Math.pow(2, numPlayoffRounds - round);
      for (let match = 0; match < numMatchesInRound; match++) {
        const matchDate = new Date(playoffStartDate);
        matchDate.setHours(matchDate.getHours() + (round - 1) * 4);

        matches.push({
          id: crypto.randomUUID(),
          team1Players: [createTeamPlayer({ name: `Playoff Seed ${match * 2 + 1}` })],
          team2Players: [createTeamPlayer({ name: `Playoff Seed ${match * 2 + 2}` })],
          date: matchDate.toISOString(),
          isPlayoff: true,
          round: round,
          series: match + 1
        });
      }
    }
  }

  return matches;
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
