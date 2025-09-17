import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  Row, Col, Card, Form, Button, Spinner, Alert, Modal, Accordion,
} from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import api from "../api";

const CATEGORIES = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

export default function PreGame() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const cardVariant = isDarkMode ? "dark" : "light";

  // filters
  const [category, setCategory] = useState("Women");
  const [countries, setCountries] = useState([]); // string[]
  const [ourTeam, setOurTeam] = useState("");
  const [opponent, setOpponent] = useState("");

  // data
  const [opponentPlayers, setOpponentPlayers] = useState([]); // [{id,name,...}]
  const [brasilBowlers, setBrasilBowlers] = useState([]);     // [{id,name,bowling_arm,bowling_style}]

  // ui state
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingSquads, setLoadingSquads] = useState(false);
  const [error, setError] = useState("");

  // modal state (only for Game Plan)
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedBatters, setSelectedBatters] = useState([]);
  const [selectedBrasilBowlers, setSelectedBrasilBowlers] = useState([]);
  const [generating, setGenerating] = useState(false);

  const pickBrazil = (list) => list.find(n => /bra[sz]il/i.test(n)) || null;
  const disabledCore = !ourTeam || !opponent || ourTeam === opponent;

  // countries by category
  useEffect(() => {
    let mounted = true;
    setError("");
    setLoadingCountries(true);
    api.get("/countries", { params: { teamCategory: category } })
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? Array.from(new Set(res.data)) : [];
        setCountries(list);
        const defOur = pickBrazil(list) || list[0] || "";
        setOurTeam(defOur);
        const defOpp = list.find(n => n !== defOur) || list[1] || "";
        setOpponent(defOpp);
      })
      .catch(() => setError("Could not load countries"))
      .finally(() => setLoadingCountries(false));
    return () => { mounted = false; };
  }, [category]);

  // load opponent players when opponent changes
  useEffect(() => {
    setOpponentPlayers([]);
    if (!opponent) return;
    setError("");
    setLoadingSquads(true);
    api.get("/team-players", { params: { country_name: opponent, team_category: category } })
      .then(res => setOpponentPlayers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Could not load opponent players"))
      .finally(() => setLoadingSquads(false));
  }, [opponent, category]);

  // load Brasil bowlers (our team)
  useEffect(() => {
    setBrasilBowlers([]);
    if (!ourTeam) return;
    setError("");
    setLoadingSquads(true);
    api.get("/team-players", { params: { country_name: ourTeam, team_category: category } })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setBrasilBowlers(list.filter(p => p.bowling_style)); // treat as bowlers if they have a style
      })
      .catch(() => setError("Could not load our bowlers"))
      .finally(() => setLoadingSquads(false));
  }, [ourTeam, category]);

  // helpers
  const allOpponentIds = useMemo(() => opponentPlayers.map(p => p.id), [opponentPlayers]);
  const allBrasilBowlerIds = useMemo(() => brasilBowlers.map(b => b.id), [brasilBowlers]);

  const openBlobInNewTab = (blob, filename = "game_plan_sheet.pdf") => {
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  };

  // modal open: preload sensible defaults (top 6 batters if available)
  const openPlanModal = () => {
    if (disabledCore) {
      alert("Please choose category, our team, and a different opponent.");
      return;
    }
    // default select first 6 opponent players (or all if <6)
    const defaultBatters = allOpponentIds.slice(0, 6);
    setSelectedBatters(defaultBatters);
    // default select all our bowlers (easy to uncheck)
    setSelectedBrasilBowlers(allBrasilBowlerIds);
    setShowPlanModal(true);
  };

  const closePlanModal = () => {
    setShowPlanModal(false);
  };

  const confirmPlanPDF = async () => {
    if (selectedBatters.length === 0) {
      alert("Select at least one opposition batter.");
      return;
    }
    if (selectedBrasilBowlers.length === 0) {
      alert("Select at least one of our bowlers.");
      return;
    }
    try {
      setGenerating(true);
      const payload = {
        opponent_country: opponent,
        player_ids: selectedBatters,
        bowler_ids: selectedBrasilBowlers,
        team_category: category,
      };
      const res = await api.post("/generate-game-plan-pdf", payload, { responseType: "blob" });
      openBlobInNewTab(new Blob([res.data], { type: "application/pdf" }));
      setShowPlanModal(false);
    } catch (e) {
      console.error(e);
      alert("Could not generate Game Plan PDF.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />

        <div
          className="comparison-heading-wrapper mb-4 text-center"
          style={{ backgroundColor: "#ffcc29", padding: 5, borderRadius: 10 }}
        >
          <h2 className="fw-bold display-4" style={{ color: "#1b5e20" }}>
            Pre-game
          </h2>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Filters (unchanged look) */}
        <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label className="fw-bold">Category</Form.Label>
                <Form.Select value={category} onChange={e => setCategory(e.target.value)} disabled={loadingCountries}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="fw-bold">Our Team</Form.Label>
                <Form.Select
                  value={ourTeam}
                  onChange={e => setOurTeam(e.target.value)}
                  disabled={loadingCountries || !countries.length}
                >
                  <option value="">Select team</option>
                  {countries.map(n => <option key={n} value={n}>{n}</option>)}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="fw-bold">Opposition</Form.Label>
                <Form.Select
                  value={opponent}
                  onChange={e => setOpponent(e.target.value)}
                  disabled={loadingCountries || !countries.length}
                >
                  <option value="">Select opposition</option>
                  {countries.filter(n => !ourTeam || n !== ourTeam).map(n => <option key={n} value={n}>{n}</option>)}
                </Form.Select>
              </Col>
              <Col md={1} className="text-end">
                {(loadingCountries || loadingSquads) && <Spinner animation="border" size="sm" />}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Six sleek cards (unchanged style) */}
        <Row className="g-4">
          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Game Plan (PDF)</Card.Title>
                <Card.Text className="mb-3">
                  Auto-compiled plan with matchups & recommended zones.
                </Card.Text>
                <Button disabled={disabledCore || loadingSquads} onClick={openPlanModal}>
                  Select Lineups & Generate
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Bowling Plans</Card.Title>
                <Card.Text className="mb-3">Best bowler types & zones vs their batters.</Card.Text>
                <Button disabled={disabledCore}>Open</Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Batting Targets</Card.Title>
                <Card.Text className="mb-3">Phase targets & risk/intent brief.</Card.Text>
                <Button disabled={disabledCore}>Open</Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Venue & Toss Insights</Card.Title>
                <Card.Text className="mb-3">Ground trends, chasing bias, toss choices.</Card.Text>
                <Button disabled={disabledCore}>Open</Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Opposition S/W</Card.Title>
                <Card.Text className="mb-3">Strengths & weaknesses summary.</Card.Text>
                <Button disabled={disabledCore}>Open</Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Do & Do Nots</Card.Title>
                <Card.Text className="mb-3">One-page actionable rules.</Card.Text>
                <Button disabled={disabledCore}>Open</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* PLAN MODAL */}
        <Modal show={showPlanModal} onHide={closePlanModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Game Plan — Select Lineups</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <h6 className="fw-bold">Opposition Batters</h6>
                <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid rgba(0,0,0,.125)", borderRadius: 6, padding: 8 }}>
                  {opponentPlayers.length === 0 ? (
                    <div className="text-muted">{loadingSquads ? "Loading..." : "No players"}</div>
                  ) : (
                    <>
                      <Form.Check
                        className="mb-2"
                        type="checkbox"
                        label="Select Top 6"
                        checked={selectedBatters.length === Math.min(6, opponentPlayers.length)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedBatters(opponentPlayers.slice(0, 6).map(p => p.id));
                          } else {
                            setSelectedBatters([]);
                          }
                        }}
                      />
                      <Form.Check
                        className="mb-2"
                        type="checkbox"
                        label="Select All"
                        checked={selectedBatters.length === opponentPlayers.length && opponentPlayers.length > 0}
                        onChange={e => {
                          setSelectedBatters(e.target.checked ? opponentPlayers.map(p => p.id) : []);
                        }}
                      />
                      <Accordion alwaysOpen>
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>Batters</Accordion.Header>
                          <Accordion.Body>
                            {opponentPlayers.map(p => (
                              <Form.Check
                                key={p.id}
                                type="checkbox"
                                label={p.name}
                                checked={selectedBatters.includes(p.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedBatters(prev => [...prev, p.id]);
                                  } else {
                                    setSelectedBatters(prev => prev.filter(id => id !== p.id));
                                  }
                                }}
                              />
                            ))}
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                    </>
                  )}
                </div>
              </Col>

              <Col md={6}>
                <h6 className="fw-bold">Our Bowlers (Brasil)</h6>
                <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid rgba(0,0,0,.125)", borderRadius: 6, padding: 8 }}>
                  {brasilBowlers.length === 0 ? (
                    <div className="text-muted">{loadingSquads ? "Loading..." : "No bowlers"}</div>
                  ) : (
                    <>
                      <Form.Check
                        className="mb-2"
                        type="checkbox"
                        label="Select All"
                        checked={selectedBrasilBowlers.length === brasilBowlers.length && brasilBowlers.length > 0}
                        onChange={e => {
                          setSelectedBrasilBowlers(e.target.checked ? brasilBowlers.map(b => b.id) : []);
                        }}
                      />
                      <Accordion alwaysOpen>
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>Bowlers</Accordion.Header>
                          <Accordion.Body>
                            {brasilBowlers.map(b => (
                              <Form.Check
                                key={b.id}
                                type="checkbox"
                                label={`${b.name}${b.bowling_style ? ` — ${b.bowling_style} (${b.bowling_arm})` : ""}`}
                                checked={selectedBrasilBowlers.includes(b.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedBrasilBowlers(prev => [...prev, b.id]);
                                  } else {
                                    setSelectedBrasilBowlers(prev => prev.filter(id => id !== b.id));
                                  }
                                }}
                              />
                            ))}
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                    </>
                  )}
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closePlanModal}>Cancel</Button>
            <Button onClick={confirmPlanPDF} disabled={generating || selectedBatters.length === 0 || selectedBrasilBowlers.length === 0}>
              {generating ? <Spinner animation="border" size="sm" /> : "Generate PDF"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}
