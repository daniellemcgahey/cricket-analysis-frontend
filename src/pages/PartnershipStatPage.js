import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Spinner, Alert, Button, Form, Card, ButtonGroup, Table, Row, Col } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import WagonWheelChart from "./WagonWheelChart";

const PartnershipStatPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [partnershipsData, setPartnershipsData] = useState([]);
  const [inningsOrder, setInningsOrder] = useState([]);
  const [selectedInningsIndex, setSelectedInningsIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [expandedPartnershipId, setExpandedPartnershipId] = useState(null);
  const [partnershipDetails, setPartnershipDetails] = useState({});

  const teamCategories = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

  useEffect(() => {
    api.get("/tournaments").then(res => setTournaments(res.data));
  }, []);

  useEffect(() => {
    if (selectedTournament && teamCategory) {
      api.get("/matches", { params: { teamCategory } })
        .then(res => {
          const filtered = res.data.filter(m => m.tournament === selectedTournament);
          setMatches(filtered);
        });
    }
  }, [selectedTournament, teamCategory]);

  const fetchData = () => {
    if (!selectedMatch) return alert("Please select a match.");
    setLoading(true);
    api.post("/match-partnerships", {
      team_category: teamCategory,
      tournament: selectedTournament,
      match_id: selectedMatch
    })
      .then(res => {
        const data = res.data.partnerships || [];
        setPartnershipsData(data);

        const uniqueInnings = [...new Set(data.map(p => p.innings_id))];
        setInningsOrder(uniqueInnings);

        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        alert("Failed to fetch partnership data.");
      });
  };

  const partnershipsByInnings = partnershipsData.reduce((acc, p) => {
    if (!acc[p.innings_id]) acc[p.innings_id] = [];
    acc[p.innings_id].push(p);
    return acc;
  }, {});

  const getBattingTeamForInnings = (inningsId) => {
    const firstPartnership = partnershipsData.find(p => p.innings_id === inningsId);
    return firstPartnership ? firstPartnership.batting_team : `Innings ${inningsId}`;
  };

  const currentInningsId = inningsOrder[selectedInningsIndex];
  const partnershipsForInnings = partnershipsByInnings[currentInningsId] || [];

  const handlePartnershipClick = (partnershipId) => {
    if (expandedPartnershipId === partnershipId) {
      setExpandedPartnershipId(null);
    } else {
      setExpandedPartnershipId(partnershipId);
      if (!partnershipDetails[partnershipId]) {
        api.get(`/partnership-details/${partnershipId}`)
          .then(res => {
            setPartnershipDetails(prev => ({ ...prev, [partnershipId]: res.data }));
          });
      }
    }
  };

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <div className="row">
          {/* Filters */}
          <div className="col-md-3">
            <Card className={isDarkMode ? "bg-dark text-white" : ""}>
              <Card.Body>
                <Accordion alwaysOpen>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      <h5 className="fw-bold m-0">Team Category</h5>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Form.Select value={teamCategory} onChange={e => setTeamCategory(e.target.value)}>
                        {teamCategories.map((cat, i) => (
                          <option key={i} value={cat}>{cat}</option>
                        ))}
                      </Form.Select>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>
                      <h5 className="fw-bold m-0">Tournament</h5>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Form.Select
                        value={selectedTournament}
                        onChange={e => setSelectedTournament(e.target.value)}
                        disabled={tournaments.length === 0}
                      >
                        <option value="">-- Select Tournament --</option>
                        {tournaments.map((t, i) => (
                          <option key={i} value={t}>{t}</option>
                        ))}
                      </Form.Select>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>
                      <h5 className="fw-bold m-0">Match</h5>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Form.Select
                        value={selectedMatch}
                        onChange={e => setSelectedMatch(e.target.value)}
                        disabled={matches.length === 0}
                      >
                        <option value="">-- Select Match --</option>
                        {matches.map((m, i) => (
                          <option key={i} value={m.match_id}>
                            {`${new Date(m.match_date).toLocaleDateString()} — ${m.team_a} vs ${m.team_b}`}
                          </option>
                        ))}
                      </Form.Select>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
                <div className="mt-3">
                  <Button onClick={fetchData} disabled={loading} className="w-100">
                    {loading ? <Spinner size="sm" animation="border" /> : "Generate Partnerships"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Partnerships Display */}
          <div className="col-md-9">
            {inningsOrder.length > 0 && (
              <div className="text-center mb-3">
                <ButtonGroup>
                  {inningsOrder.map((inningsId, idx) => (
                    <Button
                      key={inningsId}
                      variant={selectedInningsIndex === idx ? "success" : isDarkMode ? "outline-light" : "outline-dark"}
                      onClick={() => setSelectedInningsIndex(idx)}
                    >
                      {`Innings ${idx + 1} — ${getBattingTeamForInnings(inningsId)}`}
                    </Button>
                  ))}
                </ButtonGroup>
              </div>
            )}

            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
                <Spinner animation="border" />
              </div>
            ) : (
              partnershipsForInnings.length > 0 ? (
                partnershipsForInnings.map((p, idx) => (
                  <Card key={idx} className={`mb-2 ${isDarkMode ? "bg-dark text-white" : ""}`}>
                    <Card.Body onClick={() => handlePartnershipClick(p.partnership_id)} style={{ cursor: "pointer" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <strong>Wicket {p.start_wicket}</strong>
                          <div className="text-muted small">Balls: {p.start_ball} – {p.end_ball}</div>
                        </div>
                        <div className="text-end">
                          <strong>Partnership:</strong> {p.partnership_runs} runs, {p.partnership_legal_balls} balls
                        </div>
                      </div>
                      <div className="d-flex justify-content-between">
                        <div><strong>{p.batter1_name}</strong>: {p.batter1_runs}({p.batter1_legal_balls})</div>
                        <div><strong>{p.batter2_name}</strong>: {p.batter2_runs}({p.batter2_legal_balls})</div>
                      </div>

                      {/* Contribution bar */}
                      <div className="my-2" style={{ height: "8px", width: "100%", backgroundColor: "#ddd", borderRadius: "4px", overflow: "hidden" }}>
                        {(() => {
                          const total = p.partnership_runs || 1;
                          const maxWidth = 150; 
                          const b1Width = Math.max((p.batter1_runs / maxWidth) * 100, 1);
                          const b2Width = Math.max((p.batter2_runs / maxWidth) * 100, 1);
                          const extras = total - (p.batter1_runs + p.batter2_runs);
                          const extrasWidth = Math.max((extras / maxWidth) * 100, 1);

                          return (
                            <div style={{ display: "flex", height: "100%" }}>
                              <div style={{ width: `${b1Width}%`, backgroundColor: "orange" }} />
                              <div style={{ width: `${b2Width}%`, backgroundColor: "blue" }} />
                              <div style={{ width: `${extrasWidth}%`, backgroundColor: "grey" }} />
                            </div>
                          );
                        })()}
                      </div>


                      {expandedPartnershipId === p.partnership_id && partnershipDetails[p.partnership_id] && (
                        <Row className="mt-3">
                          <Col md={5}>
                            <Table bordered size="sm" style={{ minWidth: "300px" }}>
                              <tbody>
                                {Object.entries(partnershipDetails[p.partnership_id].summary).map(([key, val]) => (
                                  <tr key={key}>
                                    <td className="text-capitalize">{key.replace(/_/g, " ")}</td>
                                    <td>{val}</td>
                                  </tr>
                                ))}
                                <tr>
                                  <td>Scoring Shot %</td>
                                  <td>
                                    {(() => {
                                      const s = partnershipDetails[p.partnership_id].summary;
                                      const scoringShots = s.ones + s.twos + s.threes + s.fours + s.sixes;
                                      return s.total_balls > 0
                                        ? ((scoringShots / s.total_balls) * 100).toFixed(1) + "%"
                                        : "0%";
                                    })()}
                                  </td>
                                </tr>
                              </tbody>
                            </Table>
                          </Col>
                          <Col md={7}>
                            <WagonWheelChart data={partnershipDetails[p.partnership_id].wagon_wheel} perspective="Lines" />
                          </Col>
                        </Row>
                      )}
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <Alert variant="info">No partnership data available for this innings.</Alert>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipStatPage;
