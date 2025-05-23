import React, { useState, useEffect, useContext } from "react";
import api from "../api"; // your axios or fetch wrapper
import DarkModeContext from '../DarkModeContext';

const MatchReportPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);

  // Left side states (player report)
  const [categories, setCategories] = useState(["Men", "Women", "U19 Men", "U19 Women", "Training"]);
  const [selectedCategoryLeft, setSelectedCategoryLeft] = useState("");
  const [tournamentsLeft, setTournamentsLeft] = useState([]);
  const [selectedTournamentLeft, setSelectedTournamentLeft] = useState("");
  const [matchesLeft, setMatchesLeft] = useState([]);
  const [selectedMatchLeft, setSelectedMatchLeft] = useState(null);
  const [teamsLeft, setTeamsLeft] = useState([]);
  const [selectedTeamLeft, setSelectedTeamLeft] = useState("");
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Right side states (team report)
  const [selectedCategoryRight, setSelectedCategoryRight] = useState("");
  const [tournamentsRight, setTournamentsRight] = useState([]);
  const [selectedTournamentRight, setSelectedTournamentRight] = useState("");
  const [matchesRight, setMatchesRight] = useState([]);
  const [selectedMatchRight, setSelectedMatchRight] = useState(null);
  const [teamsRight, setTeamsRight] = useState([]);
  const [selectedTeamRight, setSelectedTeamRight] = useState("");

  // Fetch tournaments when categoryLeft changes
  useEffect(() => {
    if (!selectedCategoryLeft) {
      setTournamentsLeft([]);
      setSelectedTournamentLeft("");
      setMatchesLeft([]);
      setSelectedMatchLeft(null);
      setTeamsLeft([]);
      setSelectedTeamLeft("");
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    api.get("/tournaments", { params: { teamCategory: selectedCategoryLeft }})
      .then(res => {
        setTournamentsLeft(res.data);
        setSelectedTournamentLeft("");
        setMatchesLeft([]);
        setSelectedMatchLeft(null);
        setTeamsLeft([]);
        setSelectedTeamLeft("");
        setPlayers([]);
        setSelectedPlayer(null);
      })
      .catch(console.error);
  }, [selectedCategoryLeft]);

  // Fetch matches when tournamentLeft changes
  useEffect(() => {
    if (!selectedTournamentLeft) {
      setMatchesLeft([]);
      setSelectedMatchLeft(null);
      setTeamsLeft([]);
      setSelectedTeamLeft("");
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    api.get("/matches", { params: { teamCategory: selectedCategoryLeft, tournament: selectedTournamentLeft }})
      .then(res => {
        setMatchesLeft(res.data);
        setSelectedMatchLeft(null);
        setTeamsLeft([]);
        setSelectedTeamLeft("");
        setPlayers([]);
        setSelectedPlayer(null);
      })
      .catch(console.error);
  }, [selectedTournamentLeft, selectedCategoryLeft]);

  // When matchLeft changes, update teamsLeft list
  useEffect(() => {
    if (!selectedMatchLeft) {
      setTeamsLeft([]);
      setSelectedTeamLeft("");
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    const match = matchesLeft.find(m => m.match_id === selectedMatchLeft);
    if (match) {
      setTeamsLeft([match.team_a, match.team_b]);
      setSelectedTeamLeft("");
      setPlayers([]);
      setSelectedPlayer(null);
    }
  }, [selectedMatchLeft, matchesLeft]);

  // When teamLeft changes, fetch players from that team
  useEffect(() => {
    if (!selectedTeamLeft) {
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    api.get("/team-players", { params: { country_name: selectedTeamLeft }})
      .then(res => setPlayers(res.data))
      .catch(console.error);
  }, [selectedTeamLeft]);

  // ==== Right side logic ====

  // Fetch tournaments when categoryRight changes
  useEffect(() => {
    if (!selectedCategoryRight) {
      setTournamentsRight([]);
      setSelectedTournamentRight("");
      setMatchesRight([]);
      setSelectedMatchRight(null);
      setTeamsRight([]);
      setSelectedTeamRight("");
      return;
    }
    api.get("/tournaments", { params: { teamCategory: selectedCategoryRight }})
      .then(res => {
        setTournamentsRight(res.data);
        setSelectedTournamentRight("");
        setMatchesRight([]);
        setSelectedMatchRight(null);
        setTeamsRight([]);
        setSelectedTeamRight("");
      })
      .catch(console.error);
  }, [selectedCategoryRight]);

  // Fetch matches when tournamentRight changes
  useEffect(() => {
    if (!selectedTournamentRight) {
      setMatchesRight([]);
      setSelectedMatchRight(null);
      setTeamsRight([]);
      setSelectedTeamRight("");
      return;
    }
    api.get("/matches", { params: { teamCategory: selectedCategoryRight, tournament: selectedTournamentRight }})
      .then(res => {
        setMatchesRight(res.data);
        setSelectedMatchRight(null);
        setTeamsRight([]);
        setSelectedTeamRight("");
      })
      .catch(console.error);
  }, [selectedTournamentRight, selectedCategoryRight]);

  // When matchRight changes, update teamsRight list
  useEffect(() => {
    if (!selectedMatchRight) {
      setTeamsRight([]);
      setSelectedTeamRight("");
      return;
    }
    const match = matchesRight.find(m => m.match_id === selectedMatchRight);
    if (match) {
      setTeamsRight([match.team_a, match.team_b]);
      setSelectedTeamRight("");
    }
  }, [selectedMatchRight, matchesRight]);

  // Generate player report PDF by opening in new tab
  const handleGeneratePlayerReport = () => {
    if (!selectedMatchLeft || !selectedPlayer) return;
    const url = `${api.defaults.baseURL}/match-report/${selectedMatchLeft}/player/${selectedPlayer}`;
    window.open(url, "_blank");
  };

  // Generate team report PDF by opening in new tab
  const handleGenerateTeamReport = () => {
    if (!selectedMatchRight || !selectedTeamRight) return;
    // Assuming team names are unique, or else you need team_id
    const url = `${api.defaults.baseURL}/team-match-report/${selectedMatchRight}/${selectedTeamRight}`;
    window.open(url, "_blank");
  };

  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh", padding: 20 }}>
      <h2>Match Reports</h2>
      <div className="row">

        {/* Left Column: Player Report */}
        <div className="col-md-6 border-end pe-4">
          <h4>Player Match Report</h4>
          {/* Category */}
          <div className="mb-3">
            <label className="form-label">Select Category</label>
            <select
              className="form-select"
              value={selectedCategoryLeft}
              onChange={e => setSelectedCategoryLeft(e.target.value)}
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
              value={selectedTournamentLeft}
              onChange={e => setSelectedTournamentLeft(e.target.value)}
              disabled={!selectedCategoryLeft}
            >
              <option value="">-- Select Tournament --</option>
              {tournamentsLeft.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Match */}
          <div className="mb-3">
            <label className="form-label">Select Match</label>
            <select
              className="form-select"
              value={selectedMatchLeft || ""}
              onChange={e => setSelectedMatchLeft(parseInt(e.target.value))}
              disabled={!selectedTournamentLeft}
            >
              <option value="">-- Select Match --</option>
              {matchesLeft.map(m => (
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
              value={selectedTeamLeft}
              onChange={e => setSelectedTeamLeft(e.target.value)}
              disabled={!selectedMatchLeft}
            >
              <option value="">-- Select Team --</option>
              {teamsLeft.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Player */}
          <div className="mb-3">
            <label className="form-label">Select Player</label>
            <select
              className="form-select"
              value={selectedPlayer || ""}
              onChange={e => setSelectedPlayer(parseInt(e.target.value))}
              disabled={!selectedTeamLeft}
            >
              <option value="">-- Select Player --</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            disabled={!selectedMatchLeft || !selectedPlayer}
            onClick={handleGeneratePlayerReport}
          >
            Generate Player Report PDF
          </button>
        </div>

        {/* Right Column: Team Report */}
        <div className="col-md-6 ps-4">
          <h4>Team Match Report</h4>
          {/* Category */}
          <div className="mb-3">
            <label className="form-label">Select Category</label>
            <select
              className="form-select"
              value={selectedCategoryRight}
              onChange={e => setSelectedCategoryRight(e.target.value)}
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
              value={selectedTournamentRight}
              onChange={e => setSelectedTournamentRight(e.target.value)}
              disabled={!selectedCategoryRight}
            >
              <option value="">-- Select Tournament --</option>
              {tournamentsRight.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Match */}
          <div className="mb-3">
            <label className="form-label">Select Match</label>
            <select
              className="form-select"
              value={selectedMatchRight || ""}
              onChange={e => setSelectedMatchRight(parseInt(e.target.value))}
              disabled={!selectedTournamentRight}
            >
              <option value="">-- Select Match --</option>
              {matchesRight.map(m => (
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
              value={selectedTeamRight}
              onChange={e => setSelectedTeamRight(e.target.value)}
              disabled={!selectedMatchRight}
            >
              <option value="">-- Select Team --</option>
              {teamsRight.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <button
            className="btn btn-primary"
            disabled={!selectedMatchRight || !selectedTeamRight}
            onClick={handleGenerateTeamReport}
          >
            Generate Team Report PDF
          </button>
        </div>

      </div>
    </div>
  );
};

export default MatchReportPage;
