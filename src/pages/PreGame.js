import React, { useState, useEffect, useMemo, useContext } from "react";
import { Accordion, Form, Spinner, Alert, ButtonGroup, Button, Row, Col } from "react-bootstrap";
import api from "../api";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import CoachPackHeaderRB from "../components/coaches/CoachPackHeaderRB";
import DoDontPanelRB from "../components/coaches/DoDontPanelRB";
import MatchupTableRB from "../components/coaches/MatchupTableRB";
import KpiMedalGridRB from "../components/coaches/KpiMedalGridRB";
import IntentBandChartRB from "../components/coaches/IntentBandChartRB";

export default function PreGame() {
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

  // ⚙️ bootstrap: same loaders you already use
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

  // when a match is chosen, capture team ids (assuming your /matches returns ids)
  useEffect(() => {
    const m = matches.find(x => String(x.match_id) === String(selectedMatch));
    if (m) {
      setOurTeamId(m.team_a_id);       // adjust if your payload uses different keys
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
        context: "pre",
        top_n_matchups: 5,
        min_balls_matchup: 12,
      }),
    })
      .then(r => r.json())
      .then(d => setPack(d))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const intentByPhase = useMemo(() => {
    if (!pack?.intent_bands) return { PP: [], MO: [], DO: [] };
    const by = { PP: [], MO: [], DO: [] };
    for (const r of pack.intent_bands) if (by[r.phase]) by[r.phase].push(r);
    return by;
  }, [pack]);

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />
        <div
          className="comparison-heading-wrapper mb-4 text-center"
          style={{ backgroundColor: "#ffcc29", padding: 5, borderRadius: 10 }}
        >
          <h2 className="fw-bold display-4" style={{ color: "#1b5e20" }}>Pre-game</h2>
        </div>

        <div className="row">
          {/* LEFT: same Accordion filter column */}
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
                  {tournaments.length===0 && <small className="text-muted">No tournaments available</small>}
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
                  {matches.length===0 && <small className="text-muted">No matches available</small>}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            <div className="mt-3">
              <button className="btn btn-primary w-100" onClick={handleBuild} disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : "Build Pre-game Pack"}
              </button>
            </div>
          </div>

          {/* RIGHT: pack output */}
          <div className="col-md-8">
            {loading && <div className="text-center py-4"><Spinner animation="border" /></div>}
            {error && <Alert variant="danger">{error}</Alert>}
            {!loading && !pack && !error && <Alert variant="info">No pre-game data yet</Alert>}

            {pack && (
              <div className="d-flex flex-column gap-3">
                <CoachPackHeaderRB ms={pack.match_summary} isDarkMode={isDarkMode} />
                <DoDontPanelRB dos={pack.three_do} donts={pack.three_dont} isDarkMode={isDarkMode} />

                <Row className="g-3">
                  <Col md={6}><MatchupTableRB title="Our batting (favorable)" rows={pack.favorable_batting} isDarkMode={isDarkMode} /></Col>
                  <Col md={6}><MatchupTableRB title="Our bowling (favorable)" rows={pack.favorable_bowling} isDarkMode={isDarkMode} /></Col>
                </Row>

                <Row className="g-3">
                  <Col md={4}><IntentBandChartRB title="PP Intent vs Outcome" rows={intentByPhase.PP} isDarkMode={isDarkMode} /></Col>
                  <Col md={4}><IntentBandChartRB title="MO Intent vs Outcome" rows={intentByPhase.MO} isDarkMode={isDarkMode} /></Col>
                  <Col md={4}><IntentBandChartRB title="DO Intent vs Outcome" rows={intentByPhase.DO} isDarkMode={isDarkMode} /></Col>
                </Row>

                <KpiMedalGridRB kpis={pack.kpis} isDarkMode={isDarkMode} />

                <div className="text-end">
                  <ButtonGroup>
                    <Button
                      variant="success"
                      onClick={()=>{
                        fetch("/generate-coach-pack-pdf", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            match_id: Number(selectedMatch),
                            our_team_id: ourTeamId,
                            opponent_team_id: opponentTeamId,
                            context: "pre"
                          }),
                        }).then(async (r)=>{
                          const blob = await r.blob();
                          const url = URL.createObjectURL(blob);
                          window.open(url, "_blank");
                        });
                      }}
                    >
                      Print Coach Pack PDF
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
