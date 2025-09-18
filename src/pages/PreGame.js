// src/pages/PreGame.js
import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  Row, Col, Card, Badge, Form, Button, Spinner, Alert, Modal, Accordion, Table,
} from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import api from "../api";

const CATEGORIES = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

export default function PreGame() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const cardVariant = isDarkMode ? "dark" : "light";

  // -------- Core selectors --------
  const [category, setCategory] = useState("Women");
  const [countries, setCountries] = useState([]); // string[]
  const [ourTeam, setOurTeam] = useState("");
  const [opponent, setOpponent] = useState("");

  // Data for squads
  const [opponentPlayers, setOpponentPlayers] = useState([]); // [{id,name,...}]
  const [brasilBowlers, setBrasilBowlers] = useState([]);     // [{id,name,bowling_arm,bowling_style}]

  // Loading & errors
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingSquads, setLoadingSquads] = useState(false);
  const [error, setError] = useState("");

  // -------- Game Plan Modal --------
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedBatters, setSelectedBatters] = useState([]);            // ids
  const [selectedBrasilBowlers, setSelectedBrasilBowlers] = useState([]);// ids
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // -------- Venue Modal --------
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venueOptions, setVenueOptions] = useState({ grounds: [], times: [] });
  const [selectedGround, setSelectedGround] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [venueLoading, setVenueLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [venueError, setVenueError] = useState("");
  const [venueInsights, setVenueInsights] = useState(null);

  const [showKeyOppModal, setShowKeyOppModal] = useState(false);
  const [keyOppLoading, setKeyOppLoading] = useState(false);
  const [keyOppError, setKeyOppError] = useState("");
  const [keyOppData, setKeyOppData] = useState({ batters: [], bowlers: [] });


  const [showOppSW, setShowOppSW] = useState(false);
  const [swLoading, setSwLoading] = useState(false);
  const [swData, setSwData] = useState(null);
  const [swErr, setSwErr] = useState("");

  // -------- Batting Targets Modal --------
const [showTargetsModal, setShowTargetsModal] = useState(false);
const [targetsLoading, setTargetsLoading] = useState(false);
const [targetsError, setTargetsError] = useState("");
const [targetsData, setTargetsData] = useState(null);

const [targetsVenueOptions, setTargetsVenueOptions] = useState({ grounds: [], times: [] });
const [targetsGround, setTargetsGround] = useState("");
const [targetsTime, setTargetsTime] = useState("");
const [targetsVenueLoading, setTargetsVenueLoading] = useState(false);

// optional knobs
const [includeRain, setIncludeRain] = useState(false);
const [recencyDays, setRecencyDays] = useState(720);

// ✅ Do & Don’ts modal state
const [showDoDont, setShowDoDont] = useState(false);
const [ddLoading, setDdLoading] = useState(false);
const [ddErr, setDdErr] = useState("");
const [ddData, setDdData] = useState(null);

// optional: venue scoping inside the modal
const [ddGround, setDdGround] = useState("");
const [ddTime, setDdTime] = useState("");
const [ddVenueOptions, setDdVenueOptions] = useState({ grounds: [], times: [] });
const [ddVenueLoading, setDdVenueLoading] = useState(false);

// thresholds (tweak if you like)
const [ddMinBallsStyle, setDdMinBallsStyle] = useState(120);
const [ddMinBallsDeath, setDdMinBallsDeath] = useState(60);

  // -------- Helpers --------
  const pickBrazil = (list) => list.find(n => /bra[sz]il/i.test(n)) || null;
  const disabledCore = !ourTeam || !opponent || ourTeam === opponent;

  const allOpponentIds = useMemo(() => opponentPlayers.map(p => p.id), [opponentPlayers]);
  const allBrasilBowlerIds = useMemo(() => brasilBowlers.map(b => b.id), [brasilBowlers]);

  // -------- Load countries when category changes --------
  useEffect(() => {
    let mounted = true;
    setError("");
    setLoadingCountries(true);

    api.get("/countries", { params: { teamCategory: category } })
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? Array.from(new Set(res.data)) : [];
        setCountries(list);

        // sensible defaults
        const defOur = pickBrazil(list) || list[0] || "";
        setOurTeam(defOur);
        const defOpp = list.find(n => n !== defOur) || list[1] || "";
        setOpponent(defOpp);
      })
      .catch(() => setError("Could not load countries"))
      .finally(() => setLoadingCountries(false));

    return () => { mounted = false; };
  }, [category]);

  // -------- Load opponent players when opponent changes --------
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

  // -------- Load Brasil bowlers when our team changes --------
  useEffect(() => {
    setBrasilBowlers([]);
    if (!ourTeam) return;

    setError("");
    setLoadingSquads(true);

    api.get("/team-players", { params: { country_name: ourTeam, team_category: category } })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setBrasilBowlers(list.filter(p => p.bowling_style)); // bowlers have bowling_style
      })
      .catch(() => setError("Could not load our bowlers"))
      .finally(() => setLoadingSquads(false));
  }, [ourTeam, category]);

  // -------- Game Plan Modal handlers --------
  const openPlanModal = () => {
    if (disabledCore) {
      alert("Please choose category, our team, and a different opponent.");
      return;
    }
    setSelectedBatters(allOpponentIds.slice(0, 6));  // default top 6
    setSelectedBrasilBowlers(allBrasilBowlerIds);    // default all bowlers
    setShowPlanModal(true);
  };
  const closePlanModal = () => setShowPlanModal(false);

    // helper for pill labels
    const PhasePill = ({ text }) => (
    <Badge bg="secondary" className="ms-2">{text}</Badge>
    );

  const generateGamePlanPDF = async () => {
    if (selectedBatters.length === 0) {
      alert("Select at least one opposition batter.");
      return;
    }
    if (selectedBrasilBowlers.length === 0) {
      alert("Select at least one of our bowlers.");
      return;
    }
    try {
      setGeneratingPDF(true);
      const payload = {
        opponent_country: opponent,
        player_ids: selectedBatters,
        bowler_ids: selectedBrasilBowlers,
        team_category: category,
      };
      const res = await api.post("/generate-game-plan-pdf", payload, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      setShowPlanModal(false);
    } catch (e) {
      console.error(e);
      alert("Could not generate Game Plan PDF.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // -------- Venue Modal handlers --------
  const openVenueModal = async () => {
    setShowVenueModal(true);
    setVenueError("");
    setVenueInsights(null);
    setVenueLoading(true);
    try {
      // pass tournament if you later add a tournament selector on this page
      const res = await api.get("/venue-options");
      const opts = res.data || { grounds: [], times: [] };
      setVenueOptions(opts);
      setSelectedGround(opts.grounds[0] || "");
      setSelectedTime(opts.times[0] || "");
    } catch (e) {
      console.error(e);
      setVenueError("Failed to load venues.");
    } finally {
      setVenueLoading(false);
    }
  };
  const closeVenueModal = () => setShowVenueModal(false);

  const fetchVenueInsights = async () => {
    if (!selectedGround) {
      alert("Please select a ground.");
      return;
    }
    setInsightsLoading(true);
    setVenueError("");
    setVenueInsights(null);
    try {
      const params = {
        ground: selectedGround,
        team_category: category || undefined,
        // tournament: selectedTournament || undefined, // add when you wire a tournament filter here
      };
      if (selectedTime) params.time_of_day = selectedTime;

      const res = await api.get("/venue-insights", { params });
      setVenueInsights(res.data);
    } catch (e) {
      console.error(e);
      setVenueError("Failed to load insights.");
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchKeyOppositionPlayers = async () => {
    setKeyOppError("");
    setKeyOppLoading(true);
    try {
        const res = await api.post("/opposition-key-players", {
        team_category: category,
        opponent_country: opponent,
        // min_balls: 60,
        // min_overs: 10
        });
        setKeyOppData(res.data || { batters: [], bowlers: [] });
    } catch (e) {
        console.error(e);
        setKeyOppError("Failed to load key opposition players.");
    } finally {
        setKeyOppLoading(false);
    }
    };

    const loadOppSW = async () => {
        setSwErr(""); setSwLoading(true);
        try {
            const res = await api.post("/opposition-strengths", {
            team_category: category,
            opponent_country: opponent,
            // min_balls_style: 60, min_balls_phase: 60, min_balls_bowling: 120
            });
            setSwData(res.data);
        } catch (e) {
            setSwErr("Failed to load strengths & weaknesses.");
        } finally {
            setSwLoading(false);
        }
    };

    const openTargetsModal = async () => {
  if (disabledCore) {
    alert("Please choose category, our team, and a different opponent.");
    return;
  }
  setShowTargetsModal(true);
  setTargetsError("");
  setTargetsData(null);
  setTargetsVenueLoading(true);
  try {
    const res = await api.get("/venue-options"); // you can pass ?tournament= later
    const opts = res.data || { grounds: [], times: [] };
    setTargetsVenueOptions(opts);
    setTargetsGround(opts.grounds[0] || "");
    setTargetsTime(""); // default “Any”
  } catch (e) {
    setTargetsError("Failed to load venues.");
  } finally {
    setTargetsVenueLoading(false);
  }
};

const closeTargetsModal = () => setShowTargetsModal(false);

const fetchBattingTargets = async () => {
  if (!targetsGround) {
    alert("Please select a ground.");
    return;
  }
  setTargetsLoading(true);
  setTargetsError("");
  setTargetsData(null);
  try {
    const res = await api.get("/batting-targets-advanced", {
      params: {
        team_category: category,
        our_team: ourTeam,
        opponent_country: opponent,
        ground: targetsGround,
        time_of_day: targetsTime || undefined,
        recency_days: recencyDays,
        include_rain: includeRain
      }
    });
    setTargetsData(res.data);
  } catch (e) {
    console.error(e);
    setTargetsError("Could not compute batting targets.");
  } finally {
    setTargetsLoading(false);
  }
};

const openDoDontModal = async () => {
  if (!ourTeam || !opponent || ourTeam === opponent) {
    alert("Select category, our team, and a different opponent first.");
    return;
  }
  setShowDoDont(true);
  setDdErr("");
  setDdData(null);

  // pull venue options for optional scoping
  try {
    setDdVenueLoading(true);
    const res = await api.get("/venue-options"); // optional tournament param if you wire it
    const opts = res.data || { grounds: [], times: [] };
    setDdVenueOptions(opts);
    if (!ddGround && opts.grounds?.length) setDdGround(opts.grounds[0]);
    if (!ddTime && opts.times?.length) setDdTime(""); // default to Any
  } catch {
    // silent fail is ok; venue scoping is optional
  } finally {
    setDdVenueLoading(false);
  }

  // initial fetch
  fetchDoDonts({ ground: ddGround, time_of_day: ddTime });
};

const fetchDoDonts = async ({ ground, time_of_day } = {}) => {
  setDdLoading(true);
  setDdErr("");
  setDdData(null);
  try {
    const payload = {
      team_category: category,
      our_team: ourTeam,
      opponent_country: opponent,
      min_balls_by_style: ddMinBallsStyle,
      min_balls_death_phase: ddMinBallsDeath,
      // optional venue scope:
      ground: ground || undefined,
      time_of_day: time_of_day || undefined,
    };
    const res = await api.post("/do-donts", payload);
    setDdData(res.data);
  } catch (e) {
    console.error(e);
    setDdErr("Failed to load Do & Don’ts.");
  } finally {
    setDdLoading(false);
  }
};

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />

        {/* Filters card (matches your style) */}
        <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label className="fw-bold">Category</Form.Label>
                <Form.Select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  disabled={loadingCountries}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
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
                  {countries.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
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
                  {countries
                    .filter(n => !ourTeam || n !== ourTeam)
                    .map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                </Form.Select>
              </Col>

              <Col md={1} className="text-end">
                {(loadingCountries || loadingSquads) && (
                  <Spinner animation="border" size="sm" />
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Six cards grid */}
        <Row className="g-4">
          {/* Game Plan */}
          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Game Plan (PDF)</Card.Title>
                <Card.Text className="mb-3">
                  Auto-compiled matchups & recommended zones.
                </Card.Text>
                <Button disabled={disabledCore || loadingSquads} onClick={openPlanModal}>
                  Select Lineups & Generate
                </Button>
              </Card.Body>
            </Card>
          </Col>

            {/* Key Opposition Players */}
            <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
                <Card.Body>
                <Card.Title className="fw-bold">Key Opposition Players</Card.Title>
                <Card.Text className="mb-3">
                    Top 3 with the bat (SR/Avg) & ball (Wkts/Econ).
                </Card.Text>
                <Button disabled={disabledCore || loadingSquads} onClick={() => setShowKeyOppModal(true)}>
                    Show Players
                </Button>
                </Card.Body>
            </Card>
            </Col>

          {/* Batting Targets */}
          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Batting Targets</Card.Title>
                <Card.Text className="mb-3">
                  Phase targets & risk/intent brief.
                </Card.Text>
                <Button disabled={disabledCore} onClick={openTargetsModal}>Open</Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Venue & Toss Insights */}
          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Venue & Toss Insights</Card.Title>
                <Card.Text className="mb-3">
                  Ground trends, 1st-innings averages, toss tendencies.
                </Card.Text>
                <Button disabled={disabledCore} onClick={openVenueModal}>Open</Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Opposition Strengths / Weaknesses */}
            <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
                <Card.Body>
                <Card.Title className="fw-bold">Opposition Strengths & Weaknesses</Card.Title>
                <Card.Text className="mb-3">By phase and bowler type.</Card.Text>
                <Button disabled={disabledCore} onClick={() => setShowOppSW(true)}>Open</Button>
                </Card.Body>
            </Card>
            </Col>

          {/* Do & Do Nots */}
            <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
                <Card.Body>
                <Card.Title className="fw-bold">Do & Don’ts</Card.Title>
                <Card.Text className="mb-3">
                    Data-driven coaching cues tailored to opponent & venue.
                </Card.Text>
                <Button disabled={!ourTeam || !opponent || ourTeam === opponent} onClick={openDoDontModal}>
                    Open
                </Button>
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* ---------------- Game Plan Modal ---------------- */}
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
                    <div className="text-muted">
                      {loadingSquads ? "Loading..." : "No players"}
                    </div>
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
                    <div className="text-muted">
                      {loadingSquads ? "Loading..." : "No bowlers"}
                    </div>
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
            <Button
              onClick={generateGamePlanPDF}
              disabled={generatingPDF || selectedBatters.length === 0 || selectedBrasilBowlers.length === 0}
            >
              {generatingPDF ? <Spinner animation="border" size="sm" /> : "Generate PDF"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* ---------------- Venue & Toss Insights Modal ---------------- */}
        <Modal show={showVenueModal} onHide={closeVenueModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Venue & Toss Insights</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {venueError && <Alert variant="danger" className="mb-2">{venueError}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Ground</Form.Label>
              {venueLoading ? (
                <div><Spinner animation="border" size="sm" /></div>
              ) : (
                <Form.Select
                  value={selectedGround}
                  onChange={e => setSelectedGround(e.target.value)}
                >
                  {venueOptions.grounds.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Time of Day (optional)</Form.Label>
              <Form.Select
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
              >
                <option value="">Any</option>
                {venueOptions.times.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button onClick={fetchVenueInsights} disabled={venueLoading || insightsLoading || !selectedGround}>
                {insightsLoading ? <Spinner size="sm" animation="border" /> : "Show Insights"}
              </Button>
            </div>

            {venueInsights && (
              <Card className="mt-3">
                <Card.Body>
                  <h6 className="fw-bold mb-3">
                    {venueInsights.ground}{venueInsights.time_of_day ? `, ${venueInsights.time_of_day}` : ""}
                  </h6>
                  <Table size="sm" bordered responsive>
                    <tbody>
                      <tr>
                        <td><strong>Avg 1st-innings score</strong></td>
                        <td>{venueInsights.avg_first_innings ?? "—"}</td>
                      </tr>
                      <tr>
                        <td><strong>Win rate batting first</strong></td>
                        <td>
                          {venueInsights.bat_first_win_rate_pct != null
                            ? `${venueInsights.bat_first_win_rate_pct}%`
                            : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Most common toss decision</strong></td>
                        <td>{venueInsights.most_common_toss_decision || "—"}</td>
                      </tr>
                    </tbody>
                  </Table>
                  {venueInsights.toss_distribution && (
                    <div className="small text-muted">
                      Toss decisions:&nbsp;
                      {Object.entries(venueInsights.toss_distribution)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" • ")}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeVenueModal}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Modal
            show={showKeyOppModal}
            onShow={fetchKeyOppositionPlayers}
            onHide={() => setShowKeyOppModal(false)}
            size="lg"
            centered
            >
            <Modal.Header closeButton>
                <Modal.Title>Key Opposition Players</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {keyOppError && <Alert variant="danger" className="mb-2">{keyOppError}</Alert>}

                {keyOppLoading ? (
                <div className="d-flex justify-content-center"><Spinner animation="border" /></div>
                ) : (
                <>
                    <h6 className="fw-bold mb-2">Top Batters (Strike Rate • Average)</h6>
                    <Table size="sm" bordered responsive className="mb-4">
                    <thead>
                        <tr>
                        <th>Player</th>
                        <th>Runs</th>
                        <th>Balls</th>
                        <th>SR</th>
                        <th>Avg</th>
                        </tr>
                    </thead>
                    <tbody>
                        {keyOppData.batters.map(b => (
                        <tr key={b.player_id}>
                            <td>{b.player_name}</td>
                            <td>{b.runs}</td>
                            <td>{b.balls_faced}</td>
                            <td>{b.strike_rate ?? "—"}</td>
                            <td>{b.average ?? "—"}</td>
                        </tr>
                        ))}
                        {keyOppData.batters.length === 0 && (
                        <tr><td colSpan="5" className="text-muted text-center">No qualified batters</td></tr>
                        )}
                    </tbody>
                    </Table>

                    <h6 className="fw-bold mb-2">Top Bowlers (Wickets • Economy)</h6>
                    <Table size="sm" bordered responsive>
                    <thead>
                        <tr>
                        <th>Player</th>
                        <th>Overs</th>
                        <th>Runs</th>
                        <th>Wkts</th>
                        <th>Eco</th>
                        </tr>
                    </thead>
                    <tbody>
                        {keyOppData.bowlers.map(bw => (
                        <tr key={bw.player_id}>
                            <td>{bw.player_name}</td>
                            <td>{bw.overs}</td>
                            <td>{bw.runs_conceded}</td>
                            <td>{bw.wickets}</td>
                            <td>{bw.economy ?? "—"}</td>
                        </tr>
                        ))}
                        {keyOppData.bowlers.length === 0 && (
                        <tr><td colSpan="5" className="text-muted text-center">No qualified bowlers</td></tr>
                        )}
                    </tbody>
                    </Table>
                </>
                )}
            </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowKeyOppModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showOppSW} onShow={loadOppSW} onHide={() => setShowOppSW(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>Opposition Strengths & Weaknesses</Modal.Title></Modal.Header>
                <Modal.Body>
                    {swErr && <Alert variant="danger">{swErr}</Alert>}
                    {swLoading || !swData ? (
                    <div className="text-center"><Spinner animation="border" /></div>
                    ) : (
                    <>
                        <h6 className="fw-bold">Batting – Key Strengths</h6>
                        <ul>{swData.batting.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        <h6 className="fw-bold mt-3">Batting – Key Weaknesses</h6>
                        <ul>{swData.batting.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>

                        <h6 className="fw-bold mt-4">Bowling – Key Strengths</h6>
                        <ul>{swData.bowling.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        <h6 className="fw-bold mt-3">Bowling – Key Weaknesses</h6>
                        <ul>{swData.bowling.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>

                        <hr className="my-3" />
                        <h6 className="fw-bold">Detail – Batting by Bowler Type</h6>
                        <Table size="sm" bordered responsive>
                        <thead><tr><th>Type</th><th>Balls</th><th>SR</th><th>Dot%</th><th>Boundary%</th><th>Outs/ball</th></tr></thead>
                        <tbody>
                            {swData.batting.by_style.map(r => (
                            <tr key={r.style_norm}>
                                <td>{r.style_norm}</td><td>{r.balls}</td><td>{r.strike_rate}</td>
                                <td>{r.dot_pct}</td><td>{r.boundary_pct}</td><td>{r.outs_perc_ball}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>

                        <h6 className="fw-bold mt-3">Detail – Batting by Phase</h6>
                        <Table size="sm" bordered responsive>
                        <thead><tr><th>Phase</th><th>Balls</th><th>SR</th><th>Dot%</th><th>Boundary%</th></tr></thead>
                        <tbody>
                            {swData.batting.by_phase.map(r => (
                            <tr key={r.phase}>
                                <td>{r.phase}</td><td>{r.balls}</td><td>{r.strike_rate}</td><td>{r.dot_pct}</td><td>{r.boundary_pct}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>

                        <h6 className="fw-bold mt-3">Detail – Bowling by Phase</h6>
                        <Table size="sm" bordered responsive>
                        <thead><tr><th>Phase</th><th>Overs</th><th>Econ</th><th>Dot%</th><th>Wkts/ball</th><th>Boundary%</th></tr></thead>
                        <tbody>
                            {swData.bowling.by_phase.map(r => (
                            <tr key={r.phase}>
                                <td>{r.phase}</td><td>{r.overs}</td><td>{r.economy ?? "—"}</td>
                                <td>{r.dot_pct}</td><td>{r.wickets_perc_ball}</td><td>{r.boundary_pct}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>

                        <h6 className="fw-bold mt-3">Detail – Bowling by Type</h6>
                        <Table size="sm" bordered responsive>
                        <thead><tr><th>Type</th><th>Overs</th><th>Econ</th><th>Dot%</th><th>Wkts/ball</th><th>Boundary%</th></tr></thead>
                        <tbody>
                            {swData.bowling.by_style.map(r => (
                            <tr key={r.style_norm}>
                                <td>{r.style_norm}</td><td>{r.overs}</td><td>{r.economy ?? "—"}</td>
                                <td>{r.dot_pct}</td><td>{r.wickets_perc_ball}</td><td>{r.boundary_pct}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    </>
                    )}
                </Modal.Body>
                    <Modal.Footer><Button variant="secondary" onClick={() => setShowOppSW(false)}>Close</Button></Modal.Footer>
                </Modal>

                <Modal show={showTargetsModal} onHide={closeTargetsModal} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Batting Targets — Venue & Opponent Adjusted</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {targetsError && <Alert variant="danger" className="mb-2">{targetsError}</Alert>}

                        {/* Venue pickers */}
                        <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Ground</Form.Label>
                        {targetsVenueLoading ? (
                            <div><Spinner animation="border" size="sm" /></div>
                        ) : (
                            <Form.Select
                            value={targetsGround}
                            onChange={e => setTargetsGround(e.target.value)}
                            >
                            {targetsVenueOptions.grounds.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                            </Form.Select>
                        )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Time of Day (optional)</Form.Label>
                        <Form.Select
                            value={targetsTime}
                            onChange={e => setTargetsTime(e.target.value)}
                        >
                            <option value="">Any</option>
                            {targetsVenueOptions.times.map(t => (
                            <option key={t} value={t}>{t}</option>
                            ))}
                        </Form.Select>
                        </Form.Group>

                        {/* Optional knobs */}
                        <Row className="g-2">
                        <Col md={6}>
                            <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Recency Window (days)</Form.Label>
                            <Form.Control
                                type="number"
                                min={90}
                                step={30}
                                value={recencyDays}
                                onChange={e => setRecencyDays(Number(e.target.value))}
                            />
                            </Form.Group>
                        </Col>
                        <Col md={6} className="d-flex align-items-end">
                            <Form.Check
                            type="switch"
                            id="include-rain"
                            label="Include rain/DLS"
                            checked={includeRain}
                            onChange={e => setIncludeRain(e.target.checked)}
                            />
                        </Col>
                        </Row>

                        <div className="d-flex justify-content-end">
                        <Button onClick={fetchBattingTargets} disabled={targetsVenueLoading || targetsLoading || !targetsGround}>
                            {targetsLoading ? <Spinner size="sm" animation="border" /> : "Compute Targets"}
                        </Button>
                        </div>

                        {/* Results */}
                        {targetsData && (
                        <Card className="mt-3">
                            <Card.Body>
                            <h6 className="fw-bold mb-2">
                                {targetsData.venue.ground}{targetsData.venue.time_of_day ? `, ${targetsData.venue.time_of_day}` : ""}
                            </h6>

                            <Table size="sm" bordered responsive className="mb-3">
                                <tbody>
                                <tr>
                                    <td><strong>Venue par (eq. 20 overs)</strong></td>
                                    <td>{targetsData.par.venue_par ?? "—"}</td>
                                </tr>
                                <tr>
                                    <td><strong>Adjusted par (opponent & us)</strong></td>
                                    <td>{targetsData.par.adjusted_par}</td>
                                </tr>
                                <tr>
                                    <td><strong>Target total (+10% buffer)</strong></td>
                                    <td className="fw-bold">{targetsData.par.target_total}</td>
                                </tr>
                                </tbody>
                            </Table>

                            <h6 className="fw-bold">Phase Targets</h6>
                            <Table size="sm" bordered responsive>
                                <thead>
                                <tr>
                                    <th>Phase</th>
                                    <th>Overs</th>
                                    <th>Runs</th>
                                    <th>RPO</th>
                                </tr>
                                </thead>
                                <tbody>
                                {targetsData.phases.map(p => (
                                    <tr key={p.phase}>
                                    <td>{p.phase}</td>
                                    <td>{p.overs}</td>
                                    <td>{p.runs}</td>
                                    <td>{p.rpo}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>

                            {!!(targetsData.notes && targetsData.notes.length) && (
                                <div className="small text-muted mt-2">
                                {targetsData.notes.map((n,i) => <div key={i}>• {n}</div>)}
                                </div>
                            )}
                            </Card.Body>
                        </Card>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeTargetsModal}>Close</Button>
                    </Modal.Footer>
                    </Modal>

                    <Modal show={showDoDont} onHide={() => setShowDoDont(false)} size="lg" centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Do & Don’ts</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {/* Optional scoping controls */}
                            <Card className="mb-3">
                            <Card.Body>
                                <Row className="g-3 align-items-end">
                                <Col md={5}>
                                    <Form.Label className="fw-bold">Ground (optional)</Form.Label>
                                    {ddVenueLoading ? (
                                    <div><Spinner size="sm" animation="border" /></div>
                                    ) : (
                                    <Form.Select value={ddGround} onChange={e => setDdGround(e.target.value)}>
                                        <option value="">Any</option>
                                        {ddVenueOptions.grounds?.map(g => <option key={g} value={g}>{g}</option>)}
                                    </Form.Select>
                                    )}
                                </Col>
                                <Col md={4}>
                                    <Form.Label className="fw-bold">Time of Day (optional)</Form.Label>
                                    <Form.Select value={ddTime} onChange={e => setDdTime(e.target.value)}>
                                    <option value="">Any</option>
                                    {ddVenueOptions.times?.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Form.Select>
                                </Col>
                                <Col md={3} className="text-end">
                                    <Button
                                    variant="outline-primary"
                                    onClick={() => fetchDoDonts({ ground: ddGround, time_of_day: ddTime })}
                                    disabled={ddLoading}
                                    >
                                    {ddLoading ? <Spinner size="sm" animation="border" /> : "Refresh"}
                                    </Button>
                                </Col>
                                </Row>

                                <Row className="g-3 mt-2">
                                <Col md={6}>
                                    <Form.Label className="fw-bold">Min balls vs style (batting)</Form.Label>
                                    <Form.Control
                                    type="number"
                                    min={0}
                                    value={ddMinBallsStyle}
                                    onChange={e => setDdMinBallsStyle(Number(e.target.value) || 0)}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Form.Label className="fw-bold">Min balls at death (bowling)</Form.Label>
                                    <Form.Control
                                    type="number"
                                    min={0}
                                    value={ddMinBallsDeath}
                                    onChange={e => setDdMinBallsDeath(Number(e.target.value) || 0)}
                                    />
                                </Col>
                                </Row>
                            </Card.Body>
                            </Card>

                            {ddErr && <Alert variant="danger" className="mb-3">{ddErr}</Alert>}

                            {ddLoading || !ddData ? (
                            <div className="text-center"><Spinner animation="border" /></div>
                            ) : (
                            <>
                                {/* Quick context */}
                                <div className="mb-3">
                                <Badge bg="info" className="me-2">{category}</Badge>
                                <Badge bg="success" className="me-2">{ourTeam}</Badge>
                                <Badge bg="danger">{opponent}</Badge>
                                {ddData.context?.ground && (
                                    <Badge bg="secondary" className="ms-2">
                                    {ddData.context.ground}{ddData.context.time_of_day ? `, ${ddData.context.time_of_day}` : ""}
                                    </Badge>
                                )}
                                </div>

                                {/* Batting Do & Don’ts */}
                                <Row className="g-3">
                                <Col md={6}>
                                    <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"}>
                                    <Card.Body>
                                        <h6 className="fw-bold">Batting – Do</h6>
                                        <ul className="mb-0">
                                        {ddData.batting?.do?.length
                                            ? ddData.batting.do.map((d, i) => (
                                                <li key={i}>
                                                {d.text}
                                                {d.phase && <PhasePill text={d.phase} />}
                                                {d.evidence && <div className="small text-muted">{d.evidence}</div>}
                                                </li>
                                            ))
                                            : <li className="text-muted">No items</li>}
                                        </ul>
                                    </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"}>
                                    <Card.Body>
                                        <h6 className="fw-bold">Batting – Don’t</h6>
                                        <ul className="mb-0">
                                        {ddData.batting?.dont?.length
                                            ? ddData.batting.dont.map((d, i) => (
                                                <li key={i}>
                                                {d.text}
                                                {d.phase && <PhasePill text={d.phase} />}
                                                {d.evidence && <div className="small text-muted">{d.evidence}</div>}
                                                </li>
                                            ))
                                            : <li className="text-muted">No items</li>}
                                        </ul>
                                    </Card.Body>
                                    </Card>
                                </Col>
                                </Row>

                                {/* Bowling Do & Don’ts */}
                                <Row className="g-3 mt-3">
                                <Col md={6}>
                                    <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"}>
                                    <Card.Body>
                                        <h6 className="fw-bold">Bowling – Do</h6>
                                        <ul className="mb-0">
                                        {ddData.bowling?.do?.length
                                            ? ddData.bowling.do.map((d, i) => (
                                                <li key={i}>
                                                {d.text}
                                                {d.phase && <PhasePill text={d.phase} />}
                                                {d.evidence && <div className="small text-muted">{d.evidence}</div>}
                                                </li>
                                            ))
                                            : <li className="text-muted">No items</li>}
                                        </ul>
                                    </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"}>
                                    <Card.Body>
                                        <h6 className="fw-bold">Bowling – Don’t</h6>
                                        <ul className="mb-0">
                                        {ddData.bowling?.dont?.length
                                            ? ddData.bowling.dont.map((d, i) => (
                                                <li key={i}>
                                                {d.text}
                                                {d.phase && <PhasePill text={d.phase} />}
                                                {d.evidence && <div className="small text-muted">{d.evidence}</div>}
                                                </li>
                                            ))
                                            : <li className="text-muted">No items</li>}
                                        </ul>
                                    </Card.Body>
                                    </Card>
                                </Col>
                                </Row>

                                {/* Optional: matchup highlights */}
                                {ddData.matchups && (
                                <Card className="mt-3" bg={cardVariant} text={isDarkMode ? "light" : "dark"}>
                                    <Card.Body>
                                    <h6 className="fw-bold">Highlighted Matchups</h6>
                                    <Row className="g-3">
                                        <Col md={6}>
                                        <div className="fw-bold mb-2">Favourable</div>
                                        <ul className="mb-0">
                                            {ddData.matchups.favourable?.length
                                            ? ddData.matchups.favourable.slice(0, 5).map((m, i) => (
                                                <li key={i}>
                                                    {m.text}
                                                    {m.evidence && <div className="small text-muted">{m.evidence}</div>}
                                                </li>
                                                ))
                                            : <li className="text-muted">—</li>}
                                        </ul>
                                        </Col>
                                        <Col md={6}>
                                        <div className="fw-bold mb-2">Unfavourable</div>
                                        <ul className="mb-0">
                                            {ddData.matchups.unfavourable?.length
                                            ? ddData.matchups.unfavourable.slice(0, 5).map((m, i) => (
                                                <li key={i}>
                                                    {m.text}
                                                    {m.evidence && <div className="small text-muted">{m.evidence}</div>}
                                                </li>
                                                ))
                                            : <li className="text-muted">—</li>}
                                        </ul>
                                        </Col>
                                    </Row>
                                    </Card.Body>
                                </Card>
                                )}
                            </>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowDoDont(false)}>Close</Button>
                        </Modal.Footer>
                        </Modal>
      </div>

      {/* Floating action for Venue modal hook (wired to card button) */}
      {/* We keep the handler but don't render a separate button here */}
    </div>
  );
}
