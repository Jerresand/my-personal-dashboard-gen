import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import TournamentHeader from "./TournamentHeader";
import TournamentSettings from "./TournamentSettings";
import PlayerManagement from "./PlayerManagement";
import { generateMatches } from "@/utils/tournamentUtils";
import { Player, Tournament } from "@/types/tournament";

const TournamentCreator = () => {
  const [tournamentName, setTournamentName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [format, setFormat] = useState<"singles" | "doubles">("singles");
  const [matchesPerTeam, setMatchesPerTeam] = useState("3");
  const [tournamentType, setTournamentType] = useState<"playoffs" | "regular+playoffs">("regular+playoffs");
  const [groups, setGroups] = useState<{ name: string; players: Player[] }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Load groups from localStorage
    const loadGroups = () => {
      const groups = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const players = JSON.parse(value);
              if (Array.isArray(players)) {
                groups.push({ name: key, players });
              }
            } catch (e) {
              console.error("Error parsing group:", e);
            }
          }
        }
      }
      setGroups(groups);
    };
    loadGroups();

    // Check if players were passed from group creation
    if (location.state?.players) {
      setPlayers(location.state.players.map((p: any) => ({
        name: p.name,
        totalCups: 0,
        iced: 0,
        defense: 0
      })));
    }
  }, [location.state]);

  const handleCreateTournament = () => {
    if (players.length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You need at least 2 players to create a tournament",
      });
      return;
    }

    if (format === "doubles" && players.length % 2 !== 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You need an even number of players for doubles",
      });
      return;
    }

    const matches = generateMatches(players, format, parseInt(matchesPerTeam));

    const tournament: Tournament = {
      id: crypto.randomUUID(),
      name: tournamentName || "New Tournament",
      players,
      format,
      matchesPerTeam: parseInt(matchesPerTeam),
      type: tournamentType,
      matches,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existingTournaments = JSON.parse(localStorage.getItem('activeTournaments') || '[]');
    localStorage.setItem('activeTournaments', JSON.stringify([...existingTournaments, tournament]));

    toast({
      title: "Tournament Created! 🎉",
      description: `${tournament.name} has been created with ${players.length} players`,
    });

    // Navigate to the new tournament
    navigate(`/tournament/${tournament.id}`);
  };

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, { name: newPlayerName.trim() }]);
      setNewPlayerName("");
    }
  };

  const handleRemovePlayer = (index: number) => {
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
  };

  const handleGroupSelect = (groupName: string) => {
    const group = groups.find(g => g.name === groupName);
    if (group) {
      // Replace current players with group players instead of adding them
      setPlayers(group.players);
      setSelectedGroup(groupName);
    }
  };

  return (
    <div className="space-y-6 bg-dashboard-card p-6 rounded-lg">
      <div className="space-y-4">
        <TournamentHeader 
          tournamentName={tournamentName}
          setTournamentName={setTournamentName}
        />

        <TournamentSettings
          format={format}
          setFormat={setFormat}
          tournamentType={tournamentType}
          setTournamentType={setTournamentType}
          matchesPerTeam={matchesPerTeam}
          setMatchesPerTeam={setMatchesPerTeam}
        />

        <PlayerManagement
          newPlayerName={newPlayerName}
          setNewPlayerName={setNewPlayerName}
          handleAddPlayer={handleAddPlayer}
          players={players}
          handleRemovePlayer={handleRemovePlayer}
          groups={groups}
          selectedGroup={selectedGroup}
          handleGroupSelect={handleGroupSelect}
        />
      </div>

      <Button
        onClick={handleCreateTournament}
        className="w-full bg-dashboard-accent hover:bg-dashboard-accent/90"
      >
        Create Tournament
      </Button>
    </div>
  );
};

export default TournamentCreator;
