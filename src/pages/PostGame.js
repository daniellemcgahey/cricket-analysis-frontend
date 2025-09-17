import React, { useState, useEffect, useContext } from "react";
import { Accordion, Form, Spinner, Alert } from "react-bootstrap";
import api from "../api";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import CoachPackHeaderRB from "../components/coaches/CoachPackHeaderRB";
import KpiMedalGridRB from "../components/coaches/KpiMedalGridRB";
import DoDontPanelRB from "../components/coaches/DoDontPanelRB";
import MatchupTableRB from "../components/coaches/MatchupTableRB";

export default function PostGame() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [ourTeamId, setOurTeamId] = useState(null);
  const [opponentTeamId, setOpponentTeamId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/tournaments").then(res => {
      setTournaments(res.data || []);
      setSelectedTournament("");
      setSelectedMatch("");
    });
  }, [teamCategory]);

  useEffect(() => {
    api.get("/matches", { params: { teamCategory } }).then(res => {
      const filtered = selectedTournament
        ? (res.data || []).filter(m => m.tournament === selectedTournament)
        : (res.data || []);
      setMatches(filtered);
      setSelectedMatch("");
    });
  }, [teamCategory, selectedTournament]);

  useEffect(() => {
    const m = matches.find(x => String(x.match_id) === String(selectedMatch));
    if (m) {
      setOurTeamId(m.team_a_id);
      setOpponentTeamId(m.team_b_id);
    } else {
      setOurTeamId(null);
      setOpponentTeamId(null);
    }
  }, [selectedMatch, matches]);

  const handleBuild = () => {
    if (!selectedMatch || !ourTeamId || !opponentTeamId) {
      alert("Please select match");
      return;
    }
    setLoading(true);
    setError(null);
    fetch("/coach-pack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match_id: Number(selectedMatch),
        our_team_id: ourTeamId,
        opponent_team_id: opponentTeamId,
        context: "post",
        top_n_matchups: 5,
        min_balls_matchup: 12,
      }),
    })
      .then(r => r.json())
      .then(d => setPack(d))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />
        <div
          className="comparison-heading-wrapper mb-4 text-center"
          style={{ backgroundColor: "#ffcc29", padding: 5, borderRadius: 10 }}
        >
          <h2 className="fw-bold display-4" style={{ color: "#1b5e20" }}>Post-game</h2>
        </div>

        <div className="row">
          <div className="col-md-3">
            <Accordion alwaysOpen>
              <Accordion.Item eventKey="0">
                <Accordion.Header><h5 className="fw-bold m-0">Team Category</h5></Accordion.Header>
                <Accordion.Body>
                  <Form.Select value={teamCategory} onChange={(e)=>setTeamCategory(e.target.value)}>
                    {["Men","Women","U19 Men","U19 Women","Training"].map(cat=>(
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="1">
                <Accordion.Header><h5 className="fw-bold m-0">Tournament</h5></Accordion.Header>
                <Accordion.Body>
                  <Form.Select value={selectedTournament} onChange={(e)=>setSelectedTournament(e.target.value)} disabled={tournaments.length===0}>
                    <option value="">Select Tournament</option>
                    {tournaments.map((t,idx)=><option key={idx} value={t}>{t}</option>)}
                  </Form.Select>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="2">
                <Accordion.Header><h5 className="fw-bold m-0">Match</h5></Accordion.Header>
                <Accordion.Body>
                  <Form.Select value={selectedMatch} onChange={(e)=>setSelectedMatch(e.target.value)} disabled={matches.length===0}>
                    <option value="">Select Match</option>
                    {matches.map((m,idx)=>(
                      <option key={idx} value={m.match_id}>
                        {`${m.match_date} — ${m.team_a} vs ${m.team_b} (${m.tournament})`}
                      </option>
                    ))}
                  </Form.Select>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            <div className="mt-3">
              <button className="btn btn-primary w-100" onClick={handleBuild} disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : "Build Post-game Pack"}
              </button>
            </div>
          </div>

          <div className="col-md-8">
            {loading && <div className="text-center py-4"><Spinner animation="border" /></div>}
            {error && <Alert variant="danger">{error}</Alert>}
            {!loading && !pack && !error && <Alert variant="info">No post-game data yet</Alert>}

            {pack && (
              <div className="d-flex flex-column gap-3">
                <CoachPackHeaderRB ms={pack.match_summary} isDarkMode={isDarkMode} />
                <KpiMedalGridRB kpis={pack.kpis} isDarkMode={isDarkMode} />
                <div className="row g-3">
                  <div className="col-md-6">
                    <MatchupTableRB title="Batting review (top interactions)" rows={pack.favorable_batting} isDarkMode={isDarkMode} />
                  </div>
                  <div className="col-md-6">
                    <MatchupTableRB title="Bowling review (top interactions)" rows={pack.favorable_bowling} isDarkMode={isDarkMode} />
                  </div>
                </div>
                <DoDontPanelRB dos={pack.three_do} donts={pack.three_dont} isDarkMode={isDarkMode} />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
