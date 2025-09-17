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

  const [category, setCategory] = useState("Women");
  const [countries, setCountries] = useState([]);       // string[]
  const [ourTeam, setOurTeam] = useState("");           // string country name
  const [opponent, setOpponent] = useState("");         // string country name
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [generating, setGenerating] = useState(false);

  // find a “Brazil/ Brasil” match (case-insensitive)
  const pickBrazil = (list) =>
    list.find(n => /bra[sz]il/i.test(n)) || null;

  useEffect(() => {
    let mounted = true;
    setLoadingCountries(true);
    api.get("/countries", { params: { teamCategory: category } })
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setCountries(list);

        const defaultOur = pickBrazil(list) || list[0] || "";
        setOurTeam(defaultOur);

        const defaultOpp = list.find(n => n !== defaultOur) || list[1] || "";
        setOpponent(defaultOpp);
      })
      .finally(() => setLoadingCountries(false));
    return () => { mounted = false; };
  }, [category]);

  const disabled = !ourTeam || !opponent || ourTeam === opponent || loadingCountries;

  const openBlobInNewTab = (blob, filename = "report.pdf") => {
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 4000);
  };

  // Actions

  const handleGamePlanPDF = async () => {
    if (disabled) return;
    try {
      setGenerating(true);
      const payload = {
        // your backend expects a name here:
        opponent_country: opponent,
        // optional fields; keep empty for now:
        player_ids: [],
        bowler_ids: []
      };
      const res = await api.post("/generate-game-plan-pdf", payload, { responseType: "blob" });
      openBlobInNewTab(new Blob([res.data], { type: "application/pdf" }), "game_plan_sheet.pdf");
    } catch (e) {
      console.error(e);
      alert("Could not generate Game Plan PDF.");
    } finally {
      setGenerating(false);
    }
  };

  const handleBowlingPlans = async () => {
    // Example (adjust your backend to accept names if/when you add this endpoint):
    // await api.get("/pregame/bowling-plans", { params: { category, our_team: ourTeam, opponent } });
    alert(`Bowling Plans for ${ourTeam} vs ${opponent} — wire endpoint here`);
  };

  const handleBattingTargets = async () => {
    alert(`Batting Targets for ${ourTeam} vs ${opponent} — wire endpoint here`);
  };

  const handleVenueToss = async () => {
    alert(`Venue & Toss Insights for ${ourTeam} vs ${opponent} — wire endpoint here`);
  };

  const handleStrengthsWeaknesses = async () => {
    alert(`Opposition S/W for ${opponent} — wire endpoint here`);
  };

  const handleDoDonts = async () => {
    alert(`Do & Do Nots for ${ourTeam} vs ${opponent} — wire endpoint here`);
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
                  {countries
                    .filter(name => !ourTeam || name !== ourTeam)
                    .map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                </Form.Select>
              </Col>

              <Col md={1} className="text-end">
                {loadingCountries && <Spinner animation="border" size="sm" />}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row className="g-4">
          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Game Plan (PDF)</Card.Title>
                <Card.Text className="mb-3">
                  Auto-compiled plan with matchups & recommended zones.
                </Card.Text>
                <Button disabled={disabled || generating} onClick={handleGamePlanPDF}>
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

        <div className="text-center mt-4 small">
          <ButtonGroup>
            <Button variant="outline-secondary" size="sm" disabled>Category: {category}</Button>
            <Button variant="outline-secondary" size="sm" disabled>Us: {ourTeam || "—"}</Button>
            <Button variant="outline-secondary" size="sm" disabled>Opp: {opponent || "—"}</Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
}
