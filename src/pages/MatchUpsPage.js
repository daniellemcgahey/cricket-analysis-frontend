import React, { useEffect, useState } from "react";
import api from "../api";
import { Accordion, Form, Button, Spinner, Table, Alert, Card, Col, Row } from "react-bootstrap";

const MatchUpsPage = () => {
  const [teamCategory, setTeamCategory] = useState("Women");
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [playerDetail, setPlayerDetail] = useState(null);

  const [selectedPlayersForSheet, setSelectedPlayersForSheet] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🟩 New: Brasil bowlers
  const [brasilBowlers, setBrasilBowlers] = useState([]);
  const [selectedBrasilBowlers, setSelectedBrasilBowlers] = useState([]);

  // Load countries
  useEffect(() => {
    api.get("/countries", { params: { teamCategory } })
      .then(res => {
        setCountries(res.data);
        setSelectedCountry("");
        setPlayers([]);
        setSelectedPlayerId(null);
      })
      .catch(console.error);
  }, [teamCategory]);

  // Load players
  useEffect(() => {
    if (!selectedCountry) {
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    api.get("/team-players", { params: { country_name: selectedCountry, team_category: teamCategory } })
      .then(res => setPlayers(res.data))
      .catch(console.error);
  }, [selectedCountry, teamCategory]);

  // Load Brasil bowlers dynamically based on team category
  useEffect(() => {
    const brasilTeamName = `Brasil ${teamCategory === "Women" ? "Women" : teamCategory === "Men" ? "Men" : "Women"}`;
    api.get("/team-players", { params: { country_name: brasilTeamName, team_category: teamCategory } })
      .then(res => {
        console.log("Brasil Bowlers Response:", res.data); // 🟩 Debug
        setBrasilBowlers(res.data.filter(p => p.bowling_style));
      })
      .catch(console.error);
  }, [teamCategory]);

  const fetchPlayerDetails = () => {
    if (!selectedPlayerId) return;
    setLoading(true);
    api.post("/tactical-matchup-detailed", {
      player_id: selectedPlayerId,
      team_category: teamCategory
    })
      .then(res => setPlayerDetail(res.data))
      .finally(() => setLoading(false));
  };

  const generateGamePlanPDF = () => {
    if (selectedPlayersForSheet.length === 0 || selectedBrasilBowlers.length === 0) {
      alert("Select at least one batter and one Brasil bowler!");
      return;
    }
    setLoading(true);
    api.post("/generate-game-plan-pdf", {
      player_ids: selectedPlayersForSheet,
      bowler_ids: selectedBrasilBowlers,
      team_category: teamCategory
    }, { responseType: "blob" })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "game_plan_sheet.pdf");
        document.body.appendChild(link);
        link.click();
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-4">
      <h3 className="mb-4">Tactical Matchups</h3>

      <Row>
        {/* 🔹 Left Column */}
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Team Category</Form.Label>
                <Form.Select value={teamCategory} onChange={e => setTeamCategory(e.target.value)}>
                  {["Women", "Men", "U19 Women", "U19 Men", "Training"].map(cat => (
                    <option key={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Country</Form.Label>
                <Form.Select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
                  <option value="">Select</option>
                  {countries.map(c => <option key={c}>{c}</option>)}
                </Form.Select>
              </Form.Group>

              {selectedCountry && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Individual Player</Form.Label>
                    <Form.Select
                      value={selectedPlayerId || ""}
                      onChange={e => setSelectedPlayerId(e.target.value)}
                    >
                      <option value="">Select</option>
                      {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Form.Select>
                  </Form.Group>

                  <Button variant="primary" onClick={fetchPlayerDetails}>
                    Get Player Detail
                  </Button>

                  {/* 🟩 Select Players for Game Plan Sheet */}
                  <div className="mt-4">
                    <Form.Label>Select Players for Game Plan Sheet</Form.Label>
                    <Form.Check
                      type="checkbox"
                      label="Select All"
                      checked={selectedPlayersForSheet.length === players.length}
                      onChange={e => {
                        setSelectedPlayersForSheet(e.target.checked ? players.map(p => p.id) : []);
                      }}
                    />
                    {players.map(p => (
                      <Form.Check
                        key={p.id}
                        type="checkbox"
                        label={p.name}
                        checked={selectedPlayersForSheet.includes(p.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedPlayersForSheet(prev => [...prev, p.id]);
                          } else {
                            setSelectedPlayersForSheet(prev => prev.filter(id => id !== p.id));
                          }
                        }}
                      />
                    ))}
                  </div>

                  {/* 🟩 Collapsible Brasil Bowler Selection */}
                  <Accordion className="mt-3">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>Brasil Bowlers Selection</Accordion.Header>
                      <Accordion.Body>
                        {brasilBowlers.map(b => (
                          <Form.Check
                            key={b.id}
                            type="checkbox"
                            label={`${b.name} (${b.bowling_arm}) - ${b.bowling_style}`}
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

                  <Button
                    variant="success"
                    className="mt-2"
                    onClick={generateGamePlanPDF}
                  >
                    Generate Game Plan Sheet (PDF)
                  </Button>
                </>
              )}

              {loading && <Spinner animation="border" className="mt-3" />}
            </Card.Body>
          </Card>
        </Col>

        {/* 🔹 Right Column */}
        <Col md={8}>
          {playerDetail && (
            <>
              <Card className="mb-4">
                <Card.Body>
                  <h5>Average Runs Per Ball</h5>
                  <Table size="sm" bordered responsive>
                    <tbody>
                      <tr><td>Pace</td><td>{playerDetail.avg_rpb_pace}</td><td>Medium</td><td>{playerDetail.avg_rpb_medium}</td></tr>
                      <tr><td>Off Spin</td><td>{playerDetail.avg_rpb_off_spin}</td><td>Leg Spin</td><td>{playerDetail.avg_rpb_leg_spin}</td></tr>
                    </tbody>
                  </Table>

                  <h5 className="mt-3">Dismissal Percentage</h5>
                  <Table size="sm" bordered responsive>
                    <tbody>
                      <tr><td>Pace</td><td>{playerDetail.dismissal_pct_pace}%</td><td>Medium</td><td>{playerDetail.dismissal_pct_medium}%</td></tr>
                      <tr><td>Off Spin</td><td>{playerDetail.dismissal_pct_off_spin}%</td><td>Leg Spin</td><td>{playerDetail.dismissal_pct_leg_spin}%</td></tr>
                    </tbody>
                  </Table>

                  <h5 className="mt-3">Dot Ball Percentage</h5>
                  <Table size="sm" bordered responsive>
                    <tbody>
                      <tr><td>Pace</td><td>{playerDetail.dot_pct_pace}%</td><td>Medium</td><td>{playerDetail.dot_pct_medium}%</td></tr>
                      <tr><td>Off Spin</td><td>{playerDetail.dot_pct_off_spin}%</td><td>Leg Spin</td><td>{playerDetail.dot_pct_leg_spin}%</td></tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <Alert variant="info"><strong>Plan:</strong> {playerDetail.summary}</Alert>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default MatchUpsPage;
