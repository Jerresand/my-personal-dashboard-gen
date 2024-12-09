import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Match, Player } from '@/types/tournament';

interface MatchScheduleProps {
  matches: Match[];
}

const MatchSchedule = ({ matches }: MatchScheduleProps) => {
  const formatTeamName = (players: { player: Player }[]) => {
    if (!players || !Array.isArray(players)) return '-';
    return players
      .filter(p => p && p.player && p.player.name)
      .map(p => p.player.name)
      .join(' & ') || '-';
  };

  // Ensure matches is an array and group them by round
  const matchesByRound = (matches || []).reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // If there are no matches, show a message
  if (!matches || matches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-dashboard-card p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Tournament Schedule</h3>
          <p className="text-dashboard-text">No matches scheduled yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-dashboard-card p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Tournament Schedule</h3>
        {Object.entries(matchesByRound).map(([round, roundMatches]) => (
          <div key={round} className="mb-8 last:mb-0">
            <h4 className="text-lg font-semibold text-white mb-4">
              {round === '1' ? 'Round 1 - Opening Matches' : `Round ${round}`}
              {roundMatches[0]?.isPlayoff && ' - Playoffs'}
            </h4>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-dashboard-text">Match</TableHead>
                  <TableHead>Team 1</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Team 2</TableHead>
                  <TableHead className="text-dashboard-text">Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roundMatches.map((match, index) => (
                  <TableRow key={match.id} className="hover:bg-muted/5">
                    <TableCell className="text-dashboard-text font-medium">
                      #{index + 1}
                    </TableCell>
                    <TableCell className="text-white">
                      {formatTeamName(match.team1Players)}
                    </TableCell>
                    <TableCell className="text-center text-white">
                      {match.team1Score !== undefined ? match.team1Score : '-'} - {match.team2Score !== undefined ? match.team2Score : '-'}
                    </TableCell>
                    <TableCell className="text-white">
                      {formatTeamName(match.team2Players)}
                    </TableCell>
                    <TableCell className="text-dashboard-text">
                      {formatDateTime(match.date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchSchedule;