import React, { useState, useEffect, useContext } from "react";
import api from "../api"; // your axios/fetch wrapper
import DarkModeContext from '../DarkModeContext';

const MatchReportPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);

  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  // now store teams as objects with id & name
  const [teamOptions, setTeamOptions] = useState([]); 
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  // load all matches
  useEffect(() => {
    api.get("/matches")
      .then(res => setMatches(res.data))
      .catch(console.error);
  }, []);

  // when match changes, build teamOptions from team_a_id/team_b_id
  useEffect(() => {
    if (!selectedMatchId) {
      setTeamOptions([]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    const match = matches.find(m => m.match_id === selectedMatchId);
    if (match) {
      setTeamOptions([
        { id: match.team_a_id, name: match.team_a },
        { id: match.team_b_id, name: match.team_b }
      ]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayerId(null);
    }
  }, [selectedMatchId, matches]);

  // when team changes, fetch players by country_name or country_id
  useEffect(() => {
    if (!selectedTeam) {
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    api.get("/team-players", {
      // if your backend supports team_id, use it; otherwise pass name:
      params: { team_id: selectedTeam.id }
      // or: { country_name: selectedTeam.name }
    })
    .then(res => setPlayers(res.data))
    .catch(console.error);
  }, [selectedTeam]);

  const handleGeneratePlayerReport = () => {
    if (!selectedMatchId || !selectedPlayerId) return;
    const url = `${api.defaults.baseURL}/match-report/${selectedMatchId}/player/${selectedPlayerId}`;
    window.open(url, "_blank");
  };

  const handleGenerateTeamReport = () => {
    if (!selectedMatchId || !selectedTeam) return;
    const url = `${api.defaults.baseURL}/team-match-report/${selectedMatchId}/${selectedTeam.id}`;
    window.open(url, "_blank");
  };

  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh", padding: 20 }}>
      <h2>Generate Match Reports</h2>

      {/* Match Selector */}
      <div className="mb-3">
        <label className="form-label">Select Match</label>
        <select
          className="form-select"
          value={selectedMatchId || ""}
          onChange={e => setSelectedMatchId(parseInt(e.target.value))}
        >
          <option value="">-- Select Match --</option>
          {matches.map(m => (
            <option key={m.match_id} value={m.match_id}>
              {m.tournament} - {m.team_a} vs {m.team_b} ({m.match_date})
            </option>
          ))}
        </select>
      </div>

      {/* Team Selector */}
      {teamOptions.length > 0 && (
        <div className="mb-3">
          <label className="form-label">Select Team</label>
          <select
            className="form-select"
            value={selectedTeam ? selectedTeam.id : ""}
            onChange={e => {
              const id = parseInt(e.target.value);
              setSelectedTeam(teamOptions.find(t => t.id === id) || null);
            }}
          >
            <option value="">-- Select Team --</option>
            {teamOptions.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Player Selector */}
      {players.length > 0 && (
        <div className="mb-3">
          <label className="form-label">Select Player</label>
          <select
            className="form-select"
            value={selectedPlayerId || ""}
            onChange={e => setSelectedPlayerId(parseInt(e.target.value))}
          >
            <option value="">-- Select Player --</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Buttons */}
      <div className="d-flex gap-3">
        <button
          className="btn btn-primary"
          disabled={!selectedMatchId || !selectedPlayerId}
          onClick={handleGeneratePlayerReport}
        >
          Generate Player Report PDF
        </button>

        <button
          className="btn btn-secondary"
          disabled={!selectedMatchId || !selectedTeam}
          onClick={handleGenerateTeamReport}
        >
          Generate Team Report PDF
        </button>
      </div>
    </div>
  );
};

export default MatchReportPage;
