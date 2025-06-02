import React, { useEffect, useState } from "react";
import api from "../api";
import { Form, Button, Spinner, Table, Alert, Card, Col, Row } from "react-bootstrap";

const MatchUpsPage = () => {
  const [teamCategory, setTeamCategory] = useState("Women");
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [playerDetail, setPlayerDetail] = useState(null);

  const [selectedPlayersForSheet, setSelectedPlayersForSheet] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load countries when team category changes
  useEffect(() => {
    if (!teamCategory) {
      setCountries([]);
      setSelectedCountry("");
      setTeamOptions([]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    api.get("/countries", { params: { teamCategory } })
      .then(res => {
        setCountries(res.data);
        setSelectedCountry("");
        setTeamOptions([]);
        setSelectedTeam(null);
        setPlayers([]);
        setSelectedPlayerId(null);
      })
      .catch(console.error);
  }, [teamCategory]);

  // Update team options when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setTeamOptions([]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    setTeamOptions([
      { id: selectedCountry, name: selectedCountry } // 🔥 In your app, teams are basically countries for this view
    ]);
    setSelectedTeam(null);
    setPlayers([]);
    setSelectedPlayerId(null);
  }, [selectedCountry]);

  // Load players when team changes
  useEffect(() => {
    if (!selectedTeam) {
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    api.get("/team-players", { params: { country_name: selectedTeam.name } })
      .then(res => setPlayers(res.data))
      .catch(console.error);
  }, [selectedTeam]);

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
                  {["Women", "Men", "U19 Women", "U19 Men"].map(cat => (
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

              {/* 3️⃣ Team */}
              {selectedCountry && (
                <Form.Group className="mb-3">
                  <Form.Label>Team</Form.Label>
                  <Form.Select
                    value={selectedTeam ? selectedTeam.name : ""}
                    onChange={e => {
                      const team = teamOptions.find(t => t.name === e.target.value);
                      setSelectedTeam(team);
                    }}
                  >
                    <option value="">Select</option>
                    {teamOptions.map(t => (
                      <option key={t.id}>{t.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              {/* 4️⃣ Individual Player */}
              {selectedTeam && (
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

              {/* 5️⃣ Multi-Select for Game Plan Sheet */}
              {selectedTeam && (
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
            <Card>
              <Card.Header>{playerDetail.batter}</Card.Header>
              <Card.Body>
                <Table size="sm" bordered responsive>
                  <tbody>
                    <tr>
                      <td>Avg RPB vs Pace</td>
                      <td>{playerDetail.avg_rpb_pace}</td>
                      <td>Avg RPB vs Medium</td>
                      <td>{playerDetail.avg_rpb_medium}</td>
                    </tr>
                    <tr>
                      <td>Avg RPB vs Off-Spin</td>
                      <td>{playerDetail.avg_rpb_off_spin}</td>
                      <td>Avg RPB vs Leg-Spin</td>
                      <td>{playerDetail.avg_rpb_leg_spin}</td>
                    </tr>
                    <tr>
                      <td>Dismissal % vs Pace</td>
                      <td>{playerDetail.dismissal_pct_pace}%</td>
                      <td>vs Medium</td>
                      <td>{playerDetail.dismissal_pct_medium}%</td>
                    </tr>
                    <tr>
                      <td>vs Off-Spin</td>
                      <td>{playerDetail.dismissal_pct_off_spin}%</td>
                      <td>vs Leg-Spin</td>
                      <td>{playerDetail.dismissal_pct_leg_spin}%</td>
                    </tr>
                    <tr>
                      <td>Dot % vs Pace</td>
                      <td>{playerDetail.dot_pct_pace}%</td>
                      <td>vs Medium</td>
                      <td>{playerDetail.dot_pct_medium}%</td>
                    </tr>
                    <tr>
                      <td>vs Off-Spin</td>
                      <td>{playerDetail.dot_pct_off_spin}%</td>
                      <td>vs Leg-Spin</td>
                      <td>{playerDetail.dot_pct_leg_spin}%</td>
                    </tr>
                    <tr>
                      <td>Recommended Bowler Type</td>
                      <td colSpan="3">{playerDetail.recommended_bowler_type}</td>
                    </tr>
                    <tr>
                      <td>Recommended Zones</td>
                      <td colSpan="3">{playerDetail.recommended_zones.length} length & {playerDetail.recommended_zones.line} line</td>
                    </tr>
                  </tbody>
                </Table>
                <Alert variant="info">
                  <strong>Plan:</strong> {playerDetail.summary}
                </Alert>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default MatchUpsPage;
