import React from 'react';
import { Tournament } from '@/types/tournament';

interface TeamViewProps {
  tournament: Tournament;
}

const TeamView: React.FC<TeamViewProps> = ({ tournament }) => {
  return (
    <div className="bg-dashboard-card p-6 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">Teams</h3>
      <ul>
        {tournament.players.map((player) => (
          <li key={player.name} className="text-white">
            {player.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeamView;
