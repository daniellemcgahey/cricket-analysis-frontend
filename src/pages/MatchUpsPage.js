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

  // Load countries when team category changes
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

  // Load players when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    api.get("/team-players", { params: { country_name: selectedCountry } })
      .then(res => setPlayers(res.data))
      .catch(console.error);
  }, [selectedCountry]);

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
    if (selectedPlayersForSheet.length === 0) {
      alert("Select at least one player!");
      return;
    }
    setLoading(true);
    api.post("/generate-game-plan-pdf", {
      player_ids: selectedPlayersForSheet,
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
        {/* 🔹 Left Column: Filters and Multi-Select */}
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              {/* 1️⃣ Team Category */}
              <Form.Group className="mb-3">
                <Form.Label>Team Category</Form.Label>
                <Form.Select value={teamCategory} onChange={e => setTeamCategory(e.target.value)}>
                  {["Women", "Men", "U19 Women", "U19 Men", "Training"].map(cat => (
                    <option key={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* 2️⃣ Country */}
              <Form.Group className="mb-3">
                <Form.Label>Country</Form.Label>
                <Form.Select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
                  <option value="">Select</option>
                  {countries.map(c => <option key={c}>{c}</option>)}
                </Form.Select>
              </Form.Group>

              {/* 3️⃣ Individual Player */}
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
                </>
              )}

              {/* 4️⃣ Multi-Select for Game Plan Sheet */}
              {selectedCountry && (
                <div className="mt-4">
                  <Form.Label>Select Players for Game Plan Sheet</Form.Label>
                  <Form.Check
                    type="checkbox"
                    label="Select All"
                    checked={selectedPlayersForSheet.length === players.length}
                    onChange={e => {
                      setSelectedPlayersForSheet(
                        e.target.checked ? players.map(p => p.id) : []
                      );
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
                          setSelectedPlayersForSheet(prev =>
                            prev.filter(id => id !== p.id)
                          );
                        }
                      }}
                    />
                  ))}
                  <Button
                    variant="success"
                    className="mt-2"
                    onClick={generateGamePlanPDF}
                  >
                    Generate Game Plan Sheet (PDF)
                  </Button>
                </div>
              )}

              {loading && <Spinner animation="border" className="mt-3" />}
            </Card.Body>
          </Card>
        </Col>

        {/* 🔹 Right Column: Player Detailed Stats */}
        <Col md={8}>
          {playerDetail && (
            <>
              {/* 🟩 1️⃣ Player Stats */}
              <Card className="mb-4">
                <Card.Body>
                  {/* Average RPB */}
                  <h5 className="mb-2">Average Runs Per Ball</h5>
                  <Table size="sm" bordered responsive>
                    <tbody>
                      <tr>
                        <td>Pace</td>
                        <td>{playerDetail.avg_rpb_pace}</td>
                        <td>Medium</td>
                        <td>{playerDetail.avg_rpb_medium}</td>
                      </tr>
                      <tr>
                        <td>Off Spin</td>
                        <td>{playerDetail.avg_rpb_off_spin}</td>
                        <td>Leg Spin</td>
                        <td>{playerDetail.avg_rpb_leg_spin}</td>
                      </tr>
                    </tbody>
                  </Table>

                  {/* Dismissal Percentage */}
                  <h5 className="mb-2 mt-3">Dismissal Percentage</h5>
                  <Table size="sm" bordered responsive>
                    <tbody>
                      <tr>
                        <td>Pace</td>
                        <td>{playerDetail.dismissal_pct_pace}%</td>
                        <td>Medium</td>
                        <td>{playerDetail.dismissal_pct_medium}%</td>
                      </tr>
                      <tr>
                        <td>Off Spin</td>
                        <td>{playerDetail.dismissal_pct_off_spin}%</td>
                        <td>Leg Spin</td>
                        <td>{playerDetail.dismissal_pct_leg_spin}%</td>
                      </tr>
                    </tbody>
                  </Table>

                  {/* Dot Ball Percentage */}
                  <h5 className="mb-2 mt-3">Dot Ball Percentage</h5>
                  <Table size="sm" bordered responsive>
                    <tbody>
                      <tr>
                        <td>Pace</td>
                        <td>{playerDetail.dot_pct_pace}%</td>
                        <td>Medium</td>
                        <td>{playerDetail.dot_pct_medium}%</td>
                      </tr>
                      <tr>
                        <td>Off Spin</td>
                        <td>{playerDetail.dot_pct_off_spin}%</td>
                        <td>Leg Spin</td>
                        <td>{playerDetail.dot_pct_leg_spin}%</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* Plan */}
              <Alert variant="info">
                <strong>Plan:</strong> {playerDetail.summary}
              </Alert>

              {/* 🟩 2️⃣ Zone Effectiveness Grid */}
              <Accordion className="mt-3">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Zone Effectiveness Grid</Accordion.Header>
                  <Accordion.Body>
                    <div className="zone-grid">
                      {/* Header Line Labels */}
                      <div className="grid-row header-row">
                        <div className="grid-cell"></div>
                        {["Wide Outside Off", "Outside Off", "Straight", "Leg"].map(line => (
                          <div key={line} className="grid-cell header-cell">{line}</div>
                        ))}
                      </div>

                      {/* Zone Rows */}
                      {["Full Toss", "Yorker", "Full", "Good", "Short"].map(length => (
                        <div key={length} className="grid-row">
                          <div className="grid-cell header-cell">{length}</div>
                          {["Wide Outside Off", "Outside Off", "Straight", "Leg"].map(line => {
                            const zone = playerDetail.zone_data.find(z => z.length === length && z.line === line);
                            const score = zone ? (zone.dismissal_pct / 100) + (1 / Math.max(zone.avg_rpb, 0.1)) : 0;

                            // Determine cell color
                            let cellStyle = { backgroundColor: "#ccc" }; // default grey
                            if (zone) {
                              if (score === playerDetail.best_zone_score) cellStyle.backgroundColor = "#4caf50"; // green
                              else if (score === playerDetail.worst_zone_score) cellStyle.backgroundColor = "#f44336"; // red
                              else cellStyle.backgroundColor = "#ffeb3b"; // yellow for mid
                            }

                            return (
                              <div key={line} className="grid-cell" style={{ ...cellStyle, padding: "4px", fontSize: "0.7em" }}>
                                {zone ? (
                                  <>
                                    <div>RPB: {zone.avg_rpb}</div>
                                    <div>Dis: {zone.dismissal_pct}%</div>
                                    <div>Dot: {zone.dot_pct}%</div>
                                  </>
                                ) : (
                                  <div style={{ color: "#666" }}>No Data</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </>
          )}
        </Col>

      </Row>
    </div>
  );
};

export default MatchUpsPage;
