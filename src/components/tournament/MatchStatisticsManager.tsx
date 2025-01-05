import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TeamStatsSection from './TeamStatsSection';
import { 
  Match, 
  Team, 
  Player, 
  Tournament,
  MatchPlayerStats
} from '@/types/tournament';

interface MatchStatisticsManagerProps {
  match: Match;
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    updatedMatch: Match,
    updatedTeams: Team[],
    updatedPlayers: Player[]
  ) => void;
}

interface TeamInputSection {
  teamId: string;
  score: number;
  playerStats: MatchPlayerStats[];
}

const MatchStatisticsManager = ({
  match,
  tournament,
  isOpen,
  onClose,
  onSave,
}: MatchStatisticsManagerProps) => {
  const { toast } = useToast();
  
  const team1 = tournament.teams.find(t => t.id === match.team1Id)!;
  const team2 = tournament.teams.find(t => t.id === match.team2Id)!;

  const [team1Section, setTeam1Section] = useState<TeamInputSection>({
    teamId: team1.id,
    score: match.team1Score,
    playerStats: match.team1PlayerStats?.length > 0 
      ? match.team1PlayerStats 
      : team1.players.map(p => ({
          playerId: p.id,
          cups: 0,
          ices: 0,
          defense: 0
        }))
  });

  const [team2Section, setTeam2Section] = useState<TeamInputSection>({
    teamId: team2.id,
    score: match.team2Score,
    playerStats: match.team2PlayerStats?.length > 0 
      ? match.team2PlayerStats 
      : team2.players.map(p => ({
          playerId: p.id,
          cups: 0,
          ices: 0,
          defense: 0
        }))
  });

  const handleSave = () => {
    if (team1Section.score === team2Section.score) {
      toast({
        title: "Invalid Score",
        description: "Games cannot end in a tie.",
        variant: "destructive"
      });
      return;
    }

    const winner = team1Section.score > team2Section.score ? team1 : team2;
    const loser = team1Section.score > team2Section.score ? team2 : team1;

    // Update team stats
    const updatedTeams = tournament.teams.map(team => {
      if (team.id === winner.id) {
        return {
          ...team,
          stats: {
            wins: (team.stats?.wins || 0) + 1,
            losses: team.stats?.losses || 0,
            gamesPlayed: (team.stats?.gamesPlayed || 0) + 1
          }
        };
      }
      if (team.id === loser.id) {
        return {
          ...team,
          stats: {
            wins: team.stats?.wins || 0,
            losses: (team.stats?.losses || 0) + 1,
            gamesPlayed: (team.stats?.gamesPlayed || 0) + 1
          }
        };
      }
      return team;
    });

    // Update player stats
    const updatedPlayers = tournament.players.map(player => {
      const team1Stats = team1Section.playerStats.find(ps => ps.playerId === player.id);
      const team2Stats = team2Section.playerStats.find(ps => ps.playerId === player.id);
      const matchStats = team1Stats || team2Stats;

      if (matchStats) {
        return {
          ...player,
          stats: {
            gamesPlayed: (player.stats?.gamesPlayed || 0) + 1,
            totalCups: (player.stats?.totalCups || 0) + matchStats.cups,
            totalIces: (player.stats?.totalIces || 0) + matchStats.ices,
            totalDefenses: (player.stats?.totalDefenses || 0) + matchStats.defense
          }
        };
      }
      return player;
    });

    // Create updated match
    const updatedMatch: Match = {
      ...match,
      team1Score: team1Section.score,
      team2Score: team2Section.score,
      team1PlayerStats: team1Section.playerStats,
      team2PlayerStats: team2Section.playerStats,
      isComplete: true
    };

    onSave(updatedMatch, updatedTeams, updatedPlayers);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dashboard-background text-dashboard-text max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-dashboard-text">Match Statistics</DialogTitle>
          <DialogDescription className="text-dashboard-muted">
            Enter match statistics for both teams
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <TeamStatsSection
            team={team1}
            score={team1Section.score}
            playerStats={team1Section.playerStats}
            onScoreChange={(score) => setTeam1Section({ ...team1Section, score })}
            onPlayerStatChange={(playerIndex, field, value) => {
              const newStats = [...team1Section.playerStats];
              newStats[playerIndex] = { ...newStats[playerIndex], [field]: value };
              setTeam1Section({ ...team1Section, playerStats: newStats });
            }}
          />
          <div className="border-t border-dashboard-muted" />
          <TeamStatsSection
            team={team2}
            score={team2Section.score}
            playerStats={team2Section.playerStats}
            onScoreChange={(score) => setTeam2Section({ ...team2Section, score })}
            onPlayerStatChange={(playerIndex, field, value) => {
              const newStats = [...team2Section.playerStats];
              newStats[playerIndex] = { ...newStats[playerIndex], [field]: value };
              setTeam2Section({ ...team2Section, playerStats: newStats });
            }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-dashboard-muted">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-dashboard-background text-dashboard-text hover:bg-dashboard-muted"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-dashboard-accent text-black hover:bg-dashboard-highlight"
          >
            Save Match
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchStatisticsManager;