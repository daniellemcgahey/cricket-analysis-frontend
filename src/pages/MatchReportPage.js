import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import DarkModeContext from '../DarkModeContext';

const MatchReportPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);

  const categories = ["Men", "Women", "U19 Men", "U19 Women", "Training"];
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Fetch tournaments on category change
  useEffect(() => {
    if (!selectedCategory) {
      setTournaments([]);
      setSelectedTournament("");
      setMatches([]);
      setSelectedMatch(null);
      setTeams([]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    api.get("/tournaments", { params: { teamCategory: selectedCategory } })
      .then(res => {
        setTournaments(res.data);
        setSelectedTournament("");
        setMatches([]);
        setSelectedMatch(null);
        setTeams([]);
        setSelectedTeam(null);
        setPlayers([]);
        setSelectedPlayer(null);
      })
      .catch(console.error);
  }, [selectedCategory]);

  // Fetch matches on tournament change
  useEffect(() => {
    if (!selectedTournament) {
      setMatches([]);
      setSelectedMatch(null);
      setTeams([]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    api.get("/matches", { params: { teamCategory: selectedCategory, tournament: selectedTournament } })
      .then(res => {
        setMatches(res.data);
        setSelectedMatch(null);
        setTeams([]);
        setSelectedTeam(null);
        setPlayers([]);
        setSelectedPlayer(null);
      })
      .catch(console.error);
  }, [selectedTournament, selectedCategory]);

  // Update teams when match changes
  useEffect(() => {
    if (!selectedMatch) {
      setTeams([]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    const match = matches.find(m => m.match_id === selectedMatch);
    if (match) {
      setTeams([
        { id: match.team_a_id, name: match.team_a },
        { id: match.team_b_id, name: match.team_b },
      ]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayer(null);
    }
  }, [selectedMatch, matches]);

  // Fetch players when team changes
  useEffect(() => {
    if (!selectedTeam) {
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    api.get("/team-players", { params: { team_id: selectedTeam.id } })
      .then(res => setPlayers(res.data))
      .catch(console.error);
  }, [selectedTeam]);

  // Generate player report
  const handleGeneratePlayerReport = () => {
    if (!selectedMatch || !selectedPlayer) return;
    const url = `${api.defaults.baseURL}/match-report/${selectedMatch}/player/${selectedPlayer}`;
    window.open(url, "_blank");
  };

  // Generate team report
  const handleGenerateTeamReport = () => {
    if (!selectedMatch || !selectedTeam) return;
    const url = `${api.defaults.baseURL}/team-match-report/${selectedMatch}/${selectedTeam.id}`;
    window.open(url, "_blank");
  };

  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh", padding: 20 }}>
      <h2>Match Reports</h2>

      {/* Category */}
      <div className="mb-3">
        <label className="form-label">Select Category</label>
        <select
          className="form-select"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">-- Select Category --</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tournament */}
      <div className="mb-3">
        <label className="form-label">Select Tournament</label>
        <select
          className="form-select"
          value={selectedTournament}
          onChange={e => setSelectedTournament(e.target.value)}
          disabled={!selectedCategory}
        >
          <option value="">-- Select Tournament --</option>
          {tournaments.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Match */}
      <div className="mb-3">
        <label className="form-label">Select Match</label>
        <select
          className="form-select"
          value={selectedMatch || ""}
          onChange={e => setSelectedMatch(parseInt(e.target.value))}
          disabled={!selectedTournament}
        >
          <option value="">-- Select Match --</option>
          {matches.map(m => (
            <option key={m.match_id} value={m.match_id}>
              {m.tournament} - {m.team_a} vs {m.team_b} ({m.match_date})
            </option>
          ))}
        </select>
      </div>

      {/* Team */}
      <div className="mb-3">
        <label className="form-label">Select Team</label>
        <select
          className="form-select"
          value={selectedTeam ? selectedTeam.id : ""}
          onChange={e => {
            const id = parseInt(e.target.value);
            const team = teams.find(t => t.id === id);
            setSelectedTeam(team || null);
          }}
          disabled={!selectedMatch}
        >
          <option value="">-- Select Team --</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Player */}
      <div className="mb-3">
        <label className="form-label">Select Player</label>
        <select
          className="form-select"
          value={selectedPlayer || ""}
          onChange={e => setSelectedPlayer(parseInt(e.target.value))}
          disabled={!selectedTeam}
        >
          <option value="">-- Select Player --</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <button
        className="btn btn-primary me-3"
        disabled={!selectedMatch || !selectedPlayer}
        onClick={handleGeneratePlayerReport}
      >
        Generate Player Report PDF
      </button>

      <button
        className="btn btn-secondary"
        disabled={!selectedMatch || !selectedTeam}
        onClick={handleGenerateTeamReport}
      >
        Generate Team Report PDF
      </button>
    </div>
  );
};

export default MatchReportPage;
