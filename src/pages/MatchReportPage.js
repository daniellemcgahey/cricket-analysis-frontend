import React, { useState, useEffect, useContext } from "react";
import api from "../api";               // your axios or fetch wrapper
import DarkModeContext from '../DarkModeContext';

const MatchReportPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);

  // all matches
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  // teams as {id,name}
  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // players
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  // 1) load matches
  useEffect(() => {
    api.get("/matches")
      .then(res => setMatches(res.data))
      .catch(console.error);
  }, []);

  // 2) when match changes, build the two teams with their IDs
  useEffect(() => {
    if (!selectedMatchId) {
      setTeamOptions([]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    const m = matches.find(x => x.match_id === selectedMatchId);
    if (m) {
      setTeamOptions([
        { id: m.team_a_id, name: m.team_a },
        { id: m.team_b_id, name: m.team_b }
      ]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayerId(null);
    }
  }, [selectedMatchId, matches]);

  // 3) when team changes, fetch players by country_name (your existing API)
  useEffect(() => {
    if (!selectedTeam) {
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    api.get("/team-players", {
      params: { country_name: selectedTeam.name }
    })
    .then(res => setPlayers(res.data))
    .catch(console.error);
  }, [selectedTeam]);

  // open player-report PDF
  const generatePlayerReport = () => {
    if (!selectedMatchId || !selectedPlayerId) return;
    window.open(
      `${api.defaults.baseURL}/match-report/${selectedMatchId}/player/${selectedPlayerId}`,
      "_blank"
    );
  };

  // open team-report PDF – note the `/pdf` suffix
  const generateTeamReport = () => {
    if (!selectedMatchId || !selectedTeam) return;
    window.open(
      `${api.defaults.baseURL}/team-match-report/${selectedMatchId}/${selectedTeam.id}/pdf`,
      "_blank"
    );
  };

  const themeClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={themeClass} style={{ padding:20, minHeight:"100vh" }}>
      <h2>Generate Match Reports</h2>

      {/* 1) Match */}
      <div className="mb-3">
        <label className="form-label">Match</label>
        <select
          className="form-select"
          value={selectedMatchId||""}
          onChange={e=>setSelectedMatchId(+e.target.value)}
        >
          <option value="">-- select match --</option>
          {matches.map(m => (
            <option key={m.match_id} value={m.match_id}>
              {m.tournament} – {m.team_a} vs {m.team_b} ({m.match_date})
            </option>
          ))}
        </select>
      </div>

      {/* 2) Team */}
      {teamOptions.length>0 && (
        <div className="mb-3">
          <label className="form-label">Team</label>
          <select
            className="form-select"
            value={selectedTeam?.id||""}
            onChange={e=>{
              const id = +e.target.value;
              setSelectedTeam(teamOptions.find(t=>t.id===id)||null);
            }}
          >
            <option value="">-- select team --</option>
            {teamOptions.map(t=>(
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* 3) Player */}
      {players.length>0 && (
        <div className="mb-3">
          <label className="form-label">Player</label>
          <select
            className="form-select"
            value={selectedPlayerId||""}
            onChange={e=>setSelectedPlayerId(+e.target.value)}
          >
            <option value="">-- select player --</option>
            {players.map(p=>(
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ACTIONS */}
      <div className="d-flex gap-2">
        <button
          className="btn btn-primary"
          disabled={!selectedMatchId||!selectedPlayerId}
          onClick={generatePlayerReport}
        >
          Player Report
        </button>
        <button
          className="btn btn-secondary"
          disabled={!selectedMatchId||!selectedTeam}
          onClick={generateTeamReport}
        >
          Team Report
        </button>
      </div>
    </div>
  );
};

export default MatchReportPage;
