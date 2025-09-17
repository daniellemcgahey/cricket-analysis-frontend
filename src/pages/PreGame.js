import React, { useEffect, useState, useContext } from "react";
import { Row, Col, Card, Form, Button, Spinner, Accordion, Alert } from "react-bootstrap";
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

  // datasets
  const [opponentPlayers, setOpponentPlayers] = useState([]); // [{id, name, ...}]
  const [brasilBowlers, setBrasilBowlers] = useState([]);     // [{id, name, bowling_arm, bowling_style}]

  // selections
  const [selectedBatters, setSelectedBatters] = useState([]);
  const [selectedBrasilBowlers, setSelectedBrasilBowlers] = useState([]);

  // ui
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // convenience
  const disabledCore = !ourTeam || !opponent || ourTeam === opponent;
  const pickBrazil = (list) => list.find(n => /bra[sz]il/i.test(n)) || null;

  // --- load countries by category (names only) ---
  useEffect(() => {
    let mounted = true;
    setLoadingCountries(true);
    setError("");
    api.get("/countries", { params: { teamCategory: category } })
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? Array.from(new Set(res.data)) : [];
        setCountries(list);

        const defaultOur = pickBrazil(list) || list[0] || "";
        setOurTeam(defaultOur);

        const defaultOpp = list.find(n => n !== defaultOur) || list[1] || "";
        setOpponent(defaultOpp);
      })
      .catch(() => setError("Could not load countries"))
      .finally(() => setLoadingCountries(false));
    return () => { mounted = false; };
  }, [category]);

  // --- load opponent players when opponent changes ---
  useEffect(() => {
    setOpponentPlayers([]);
    setSelectedBatters([]);
    if (!opponent) return;
    setLoadingPlayers(true);
    setError("");
    api.get("/team-players", { params: { country_name: opponent, team_category: category } })
      .then(res => setOpponentPlayers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Could not load opponent players"))
      .finally(() => setLoadingPlayers(false));
  }, [opponent, category]);

  // --- load Brasil bowlers list using the same /team-players endpoint ---
  useEffect(() => {
    setBrasilBowlers([]);
    setSelectedBrasilBowlers([]);
    if (!ourTeam) return;
    setLoadingPlayers(true);
    setError("");
    api.get("/team-players", { params: { country_name: ourTeam, team_category: category } })
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : [];
        const bowlers = all.filter(p => p.bowling_style); // same as your old page
        setBrasilBowlers(bowlers);
      })
      .catch(() => setError("Could not load our bowlers"))
      .finally(() => setLoadingPlayers(false));
  }, [ourTeam, category]);

  const openBlobInNewTab = (blob, filename = "game_plan_sheet.pdf") => {
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  };

  // --- generate pdf with your existing backend endpoint ---
  const handleGenerateGamePlanPDF = async () => {
    if (disabledCore) {
      alert("Please pick category, our team and a different opponent.");
      return;
    }
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
        opponent_country: opponent,      // string (your endpoint already expects this)
        player_ids: selectedBatters,     // array of ids
        bowler_ids: selectedBrasilBowlers, // array of ids
        team_category: category          // included because your older page sent it
      };
      const res = await api.post("/generate-game-plan-pdf", payload, { responseType: "blob" });
      openBlobInNewTab(new Blob([res.data], { type: "application/pdf" }));
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

        {/* Filters */}
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
                  {countries.map(name => (
                    <option key={name} value={name}>{name}</option>
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
                  {countries.filter(n => !ourTeam || n !== ourTeam).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={1} className="text-end">
                {(loadingCountries || loadingPlayers) && <Spinner animation="border" size="sm" />}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Selectors */}
        <Row className="g-4">
          <Col md={6}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Select Opposition Batters</Card.Title>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {opponentPlayers.length === 0 ? (
                    <div className="text-muted">{loadingPlayers ? "Loading..." : "No opponent players yet"}</div>
                  ) : (
                    opponentPlayers.map(p => (
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
                    ))
                  )}
                </div>
                {opponentPlayers.length > 0 && (
                  <div className="mt-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() =>
                        setSelectedBatters(prev => prev.length === opponentPlayers.length ? [] : opponentPlayers.map(p => p.id))
                      }
                    >
                      {selectedBatters.length === opponentPlayers.length ? "Clear All" : "Select All"}
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Select Our Bowlers (Brasil)</Card.Title>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {brasilBowlers.length === 0 ? (
                    <div className="text-muted">{loadingPlayers ? "Loading..." : "No bowlers found"}</div>
                  ) : (
                    brasilBowlers.map(b => (
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
                    ))
                  )}
                </div>
                {brasilBowlers.length > 0 && (
                  <div className="mt-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() =>
                        setSelectedBrasilBowlers(prev => prev.length === brasilBowlers.length ? [] : brasilBowlers.map(p => p.id))
                      }
                    >
                      {selectedBrasilBowlers.length === brasilBowlers.length ? "Clear All" : "Select All"}
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Action */}
        <div className="mt-4">
          <Button
            disabled={disabledCore || generating || selectedBatters.length === 0 || selectedBrasilBowlers.length === 0}
            onClick={handleGenerateGamePlanPDF}
          >
            {generating ? <Spinner animation="border" size="sm" /> : "Generate Game Plan PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
