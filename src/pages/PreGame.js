// src/pages/PreGame.js
import React, { useEffect, useState, useContext } from "react";
import { Row, Col, Card, Form, Button, Spinner, ButtonGroup } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import api from "../api";

const CATEGORIES = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

export default function PreGame() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const cardVariant = isDarkMode ? "dark" : "light";

  const [category, setCategory] = useState("Women"); // match your other pages’ default
  const [countries, setCountries] = useState([]);    // [{country_id, country_name}]
  const [ourTeam, setOurTeam] = useState("");
  const [opponent, setOpponent] = useState("");
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [generating, setGenerating] = useState(false);

  // --- Load countries (simple; no schema change needed) ---
  useEffect(() => {
    let mounted = true;
    setLoadingCountries(true);
    api.get("/countries", { params: { teamCategory: category } }) // backend can ignore filter if N/A
      .then(res => {
        if (!mounted) return;
        const list = res.data || [];
        setCountries(list);

        // pick "Brasil"/"Brazil" by default if present, else first
        const defaultOur = list.find(c => /bra[sz]il/i.test(c.country_name)) || list[0];
        setOurTeam(defaultOur ? defaultOur.country_id : "");
        // default opponent: first not-ourTeam
        const defaultOpp = list.find(c => defaultOur && c.country_id !== defaultOur.country_id) || list[1] || null;
        setOpponent(defaultOpp ? defaultOpp.country_id : "");
      })
      .finally(() => setLoadingCountries(false));
    return () => { mounted = false; };
  }, [category]);

  const ourTeamObj = countries.find(c => c.country_id === (ourTeam || null));
  const oppObj     = countries.find(c => c.country_id === (opponent || null));

  // --- Helpers ---
  const disabled = !ourTeam || !opponent || ourTeam === opponent || loadingCountries;

  const openBlobInNewTab = (blob, filename = "report.pdf") => {
    const url = window.URL.createObjectURL(blob);
    // open a new tab for preview
    window.open(url, "_blank", "noopener,noreferrer");
    // also trigger a download (optional)
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  };

  // --- ACTIONS (wire real endpoints here) ---

  // Uses your existing /generate-game-plan-pdf
  const handleGamePlanPDF = async () => {
    if (disabled) return;
    try {
      setGenerating(true);
      const payload = {
        // Your backend expects GamePlanPayload:
        // opponent_country, player_ids (optional), bowler_ids (optional)
        opponent_country: oppObj?.country_name || "Unknown",
        player_ids: [],   // let backend pick or keep empty
        bowler_ids: []    // let backend pick or keep empty
      };
      const res = await api.post("/generate-game-plan-pdf", payload, { responseType: "blob" });
      openBlobInNewTab(new Blob([res.data], { type: "application/pdf" }), "game_plan_sheet.pdf");
    } catch (err) {
      console.error("Game Plan PDF error", err);
      alert("Could not generate Game Plan PDF yet.");
    } finally {
      setGenerating(false);
    }
  };

  const handleBowlingPlans = async () => {
    // Example: call a JSON endpoint you’ll add, e.g. /pregame/bowling-plans
    // const res = await api.get("/pregame/bowling-plans", { params: { category, our_team_id: ourTeam, opponent_id: opponent } });
    alert("Bowling Plans: hook up your endpoint here.");
  };

  const handleBattingTargets = async () => {
    // Example: /pregame/batting-targets
    alert("Batting Targets: hook up your endpoint here.");
  };

  const handleVenueToss = async () => {
    // Example: /pregame/venue-toss-insights?our_team_id&opponent_id
    alert("Venue & Toss Insights: hook up your endpoint here.");
  };

  const handleStrengthsWeaknesses = async () => {
    // Example: /pregame/opposition-sw
    alert("Opposition Strengths/Weaknesses: hook up your endpoint here.");
  };

  const handleDoDonts = async () => {
    // Example: /pregame/do-donts
    alert("Do & Do Nots: hook up your endpoint here.");
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

        {/* Filters row */}
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
                  onChange={e => setOurTeam(Number(e.target.value))}
                  disabled={loadingCountries || !countries.length}
                >
                  <option value="">Select team</option>
                  {countries.map(cty => (
                    <option key={cty.country_id} value={cty.country_id}>
                      {cty.country_name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4}>
                <Form.Label className="fw-bold">Opposition</Form.Label>
                <Form.Select
                  value={opponent}
                  onChange={e => setOpponent(Number(e.target.value))}
                  disabled={loadingCountries || !countries.length}
                >
                  <option value="">Select opposition</option>
                  {countries
                    .filter(cty => !ourTeam || cty.country_id !== ourTeam)
                    .map(cty => (
                      <option key={cty.country_id} value={cty.country_id}>
                        {cty.country_name}
                      </option>
                    ))}
                </Form.Select>
              </Col>

              <Col md={1} className="text-end">
                {loadingCountries && <Spinner animation="border" size="sm" />}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Main actions grid */}
        <Row className="g-4">
          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Game Plan (PDF)</Card.Title>
                <Card.Text className="mb-3">
                  Auto-compiled game plan sheet combining matchups & recommended zones.
                </Card.Text>
                <Button
                  disabled={disabled || generating}
                  onClick={handleGamePlanPDF}
                >
                  {generating ? <Spinner animation="border" size="sm" /> : "Generate PDF"}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Bowling Plans</Card.Title>
                <Card.Text className="mb-3">Best bowler types & zones vs their batters.</Card.Text>
                <Button disabled={disabled} onClick={handleBowlingPlans}>Open</Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Batting Targets</Card.Title>
                <Card.Text className="mb-3">Phase targets & risk/intent brief.</Card.Text>
                <Button disabled={disabled} onClick={handleBattingTargets}>Open</Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Venue & Toss Insights</Card.Title>
                <Card.Text className="mb-3">Ground trends, chasing bias, toss choices.</Card.Text>
                <Button disabled={disabled} onClick={handleVenueToss}>Open</Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Opposition S/W</Card.Title>
                <Card.Text className="mb-3">Strengths & weaknesses summary.</Card.Text>
                <Button disabled={disabled} onClick={handleStrengthsWeaknesses}>Open</Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Do & Do Nots</Card.Title>
                <Card.Text className="mb-3">One-page actionable rules.</Card.Text>
                <Button disabled={disabled} onClick={handleDoDonts}>Open</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* (Optionally) show current selections */}
        <div className="text-center mt-4 small">
          <ButtonGroup>
            <Button variant="outline-secondary" size="sm" disabled>
              Category: {category}
            </Button>
            <Button variant="outline-secondary" size="sm" disabled>
              Us: {ourTeamObj?.country_name || "—"}
            </Button>
            <Button variant="outline-secondary" size="sm" disabled>
              Opp: {oppObj?.country_name || "—"}
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
}
