import React, { useState, useEffect, useContext } from "react";
import api from "../api"; // your axios or fetch wrapper
import DarkModeContext from '../DarkModeContext';

const MatchReportPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);

  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  // Fetch matches on mount
  useEffect(() => {
    api.get("/matches")
      .then(res => setMatches(res.data))
      .catch(console.error);
  }, []);

  // When match changes, update teams list
  useEffect(() => {
    if (!selectedMatchId) {
      setTeamOptions([]);
      setSelectedTeam("");
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    const match = matches.find(m => m.match_id === selectedMatchId);
    if (match) {
      setTeamOptions([match.team_a, match.team_b]);
      setSelectedTeam("");
      setPlayers([]);
      setSelectedPlayerId(null);
    }
  }, [selectedMatchId, matches]);

  // When team changes, fetch players from that team
  useEffect(() => {
    if (!selectedTeam) {
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    api.get("/team-players", {
      params: { country_name: selectedTeam }
    })
    .then(res => setPlayers(res.data))
    .catch(console.error);
  }, [selectedTeam]);

  // Generate player report PDF by opening in new tab
  const handleGeneratePlayerReport = () => {
    if (!selectedMatchId || !selectedPlayerId) return;
    const url = `${api.defaults.baseURL}/match-report/${selectedMatchId}/player/${selectedPlayerId}`;
    window.open(url, "_blank");
  };

  // Generate team report PDF by opening in new tab
  const handleGenerateTeamReport = () => {
    if (!selectedMatchId || !selectedTeam) return;
    // Assuming team names are unique identifiers in the backend URL param
    const url = `${api.defaults.baseURL}/team-match-report/${selectedMatchId}/${encodeURIComponent(selectedTeam)}`;
    window.open(url, "_blank");
  };

  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh", padding: 20 }}>
      <h2>Generate Player & Team Match Reports</h2>

      {/* Match Selector */}
      <div className="mb-3">
        <label className="form-label">Select Match</label>
        <select
          className="form-select"
          value={selectedMatchId || ""}
          onChange={(e) => setSelectedMatchId(parseInt(e.target.value))}
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
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">-- Select Team --</option>
            {teamOptions.map(team => (
              <option key={team} value={team}>{team}</option>
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
            onChange={(e) => setSelectedPlayerId(parseInt(e.target.value))}
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
