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
  const [selectedTeamLeft, setSelectedTeamLeft] = useState(null);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Right side states (team report)
  const [selectedCategoryRight, setSelectedCategoryRight] = useState("");
  const [tournamentsRight, setTournamentsRight] = useState([]);
  const [selectedTournamentRight, setSelectedTournamentRight] = useState("");
  const [matchesRight, setMatchesRight] = useState([]);
  const [selectedMatchRight, setSelectedMatchRight] = useState(null);
  const [teamsRight, setTeamsRight] = useState([]);
  const [selectedTeamRight, setSelectedTeamRight] = useState(null);

  // ===== LEFT SIDE LOGIC =====

  useEffect(() => {
    if (!selectedCategoryLeft) {
      setTournamentsLeft([]);
      setSelectedTournamentLeft("");
      setMatchesLeft([]);
      setSelectedMatchLeft(null);
      setTeamsLeft([]);
      setSelectedTeamLeft(null);
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
        setSelectedTeamLeft(null);
        setPlayers([]);
        setSelectedPlayer(null);
      })
      .catch(console.error);
  }, [selectedCategoryLeft]);

  useEffect(() => {
    if (!selectedTournamentLeft) {
      setMatchesLeft([]);
      setSelectedMatchLeft(null);
      setTeamsLeft([]);
      setSelectedTeamLeft(null);
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    api.get("/matches", { params: { teamCategory: selectedCategoryLeft, tournament: selectedTournamentLeft }})
      .then(res => {
        setMatchesLeft(res.data);
        setSelectedMatchLeft(null);
        setTeamsLeft([]);
        setSelectedTeamLeft(null);
        setPlayers([]);
        setSelectedPlayer(null);
      })
      .catch(console.error);
  }, [selectedTournamentLeft, selectedCategoryLeft]);

  useEffect(() => {
    if (!selectedMatchLeft) {
      setTeamsLeft([]);
      setSelectedTeamLeft(null);
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    const match = matchesLeft.find(m => m.match_id === selectedMatchLeft);
    if (match) {
      setTeamsLeft([
        { id: match.team_a_id, name: match.team_a },
        { id: match.team_b_id, name: match.team_b }
      ]);
      setSelectedTeamLeft(null);
      setPlayers([]);
      setSelectedPlayer(null);
    }
  }, [selectedMatchLeft, matchesLeft]);

  useEffect(() => {
    if (selectedTeamLeft && !teamsLeft.find(t => t.id === selectedTeamLeft.id)) {
      setSelectedTeamLeft(null);
    }
  }, [teamsLeft]);

  useEffect(() => {
    if (!selectedTeamLeft) {
      setPlayers([]);
      setSelectedPlayer(null);
      return;
    }
    api.get("/team-players", { params: { team_id: selectedTeamLeft.id }})
      .then(res => setPlayers(res.data))
      .catch(console.error);
  }, [selectedTeamLeft]);

  useEffect(() => {
    if (selectedPlayer && !players.find(p => p.id === selectedPlayer.id)) {
      setSelectedPlayer(null);
    }
  }, [players]);

  // ===== RIGHT SIDE LOGIC =====

  useEffect(() => {
    if (!selectedCategoryRight) {
      setTournamentsRight([]);
      setSelectedTournamentRight("");
      setMatchesRight([]);
      setSelectedMatchRight(null);
      setTeamsRight([]);
      setSelectedTeamRight(null);
      return;
    }
    api.get("/tournaments", { params: { teamCategory: selectedCategoryRight }})
      .then(res => {
        setTournamentsRight(res.data);
        setSelectedTournamentRight("");
        setMatchesRight([]);
        setSelectedMatchRight(null);
        setTeamsRight([]);
        setSelectedTeamRight(null);
      })
      .catch(console.error);
  }, [selectedCategoryRight]);

  useEffect(() => {
    if (!selectedTournamentRight) {
      setMatchesRight([]);
      setSelectedMatchRight(null);
      setTeamsRight([]);
      setSelectedTeamRight(null);
      return;
    }
    api.get("/matches", { params: { teamCategory: selectedCategoryRight, tournament: selectedTournamentRight }})
      .then(res => {
        setMatchesRight(res.data);
        setSelectedMatchRight(null);
        setTeamsRight([]);
        setSelectedTeamRight(null);
      })
      .catch(console.error);
  }, [selectedTournamentRight, selectedCategoryRight]);

  useEffect(() => {
    if (!selectedMatchRight) {
      setTeamsRight([]);
      setSelectedTeamRight(null);
      return;
    }
    const match = matchesRight.find(m => m.match_id === selectedMatchRight);
    if (match) {
      setTeamsRight([
        { id: match.team_a_id, name: match.team_a },
        { id: match.team_b_id, name: match.team_b }
      ]);
      setSelectedTeamRight(null);
    }
  }, [selectedMatchRight, matchesRight]);

  useEffect(() => {
    if (selectedTeamRight && !teamsRight.find(t => t.id === selectedTeamRight.id)) {
      setSelectedTeamRight(null);
    }
  }, [teamsRight]);

  // Generate Player Report PDF
  const handleGeneratePlayerReport = () => {
    if (!selectedMatchLeft || !selectedPlayer) return;
    const url = `${api.defaults.baseURL}/match-report/${selectedMatchLeft}/player/${selectedPlayer.id}`;
    window.open(url, "_blank");
  };

  // Generate Team Report PDF
  const handleGenerateTeamReport = () => {
    if (!selectedMatchRight || !selectedTeamRight) return;
    const url = `${api.defaults.baseURL}/team-match-report/${selectedMatchRight}/${selectedTeamRight.id}`;
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
              value={selectedTeamLeft ? selectedTeamLeft.id : ""}
              onChange={e => {
                const id = parseInt(e.target.value);
                const team = teamsLeft.find(t => t.id === id);
                setSelectedTeamLeft(team || null);
              }}
              disabled={!selectedMatchLeft}
            >
              <option value="">-- Select Team --</option>
              {teamsLeft.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Player */}
          <div className="mb-3">
            <label className="form-label">Select Player</label>
            <select
              className="form-select"
              value={selectedPlayer ? selectedPlayer.id : ""}
              onChange={e => {
                const id = parseInt(e.target.value);
                const player = players.find(p => p.id === id);
                setSelectedPlayer(player || null);
              }}
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
              value={selectedTeamRight ? selectedTeamRight.id : ""}
              onChange={e => {
                const id = parseInt(e.target.value);
                const team = teamsRight.find(t => t.id === id);
                setSelectedTeamRight(team || null);
              }}
              disabled={!selectedMatchRight}
            >
              <option value="">-- Select Team --</option>
              {teamsRight.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
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
