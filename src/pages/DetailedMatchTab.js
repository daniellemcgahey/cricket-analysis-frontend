import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Spinner, Alert, Button, Form, Card, ButtonGroup } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";

const DetailedMatchTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [inningsOrder, setInningsOrder] = useState([]);
  const [selectedInningsIndex, setSelectedInningsIndex] = useState(0);
  const [ballByBallData, setBallByBallData] = useState([]);
  const [loading, setLoading] = useState(false);

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

    api.post("/match-ball-by-ball", { match_id: selectedMatch })
      .then(res => {
        const data = res.data.balls || [];
        console.log("✅ Ball-by-ball data:", data);

        setBallByBallData(data);

        const uniqueInnings = [...new Set(data.map(b => b.innings_id))];
        setInningsOrder(uniqueInnings);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching data:", err);
        setLoading(false);
        alert("Failed to fetch ball-by-ball data.");
      });
  };

  const currentInningsId = inningsOrder[selectedInningsIndex];
  const ballsForInnings = Array.isArray(ballByBallData)
    ? ballByBallData.filter(b => b.innings_id === currentInningsId)
    : [];

  const ballsByOver = ballsForInnings.reduce((acc, ball) => {
    if (!acc[ball.over_number]) acc[ball.over_number] = [];
    acc[ball.over_number].push(ball);
    return acc;
  }, {});

  const renderBallDisplay = (ball) => {
    if (ball.wicket) return "W";

    const runsFromBat = ball.runs || 0;
    const wides = ball.wides || 0;
    const noBalls = ball.no_balls || 0;
    const byes = ball.byes || 0;
    const legByes = ball.leg_byes || 0;

    const totalRuns = runsFromBat + wides + noBalls + byes + legByes;

    if (wides > 0) return totalRuns > 0 ? `[Wd+${totalRuns}]` : "[Wd]";
    if (noBalls > 0) {
      if (runsFromBat > 0) return `[NB+${runsFromBat}]`;
      if (byes > 0) return `[NB+${byes}B]`;
      if (legByes > 0) return `[NB+${legByes}LB]`;
      return "[NB]";
    }
    if (byes > 0) return `[${byes}B]`;
    if (legByes > 0) return `[${legByes}LB]`;

    return runsFromBat === 0 ? "." : runsFromBat;
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
                      <Form.Select
                        value={teamCategory}
                        onChange={e => setTeamCategory(e.target.value)}
                      >
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
                  <Button
                    onClick={fetchData}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      "Load Ball-by-Ball"
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Ball-by-ball display */}
          <div className="col-md-9">
            {inningsOrder.length > 0 && (
              <div className="text-center mb-3">
                <ButtonGroup>
                  {inningsOrder.map((inningsId, idx) => {
                    const inningsBalls = ballByBallData.filter(b => b.innings_id === inningsId);
                    const battingTeam = inningsBalls[0]?.batting_team || "Unknown";

                    return (
                      <Button
                        key={inningsId}
                        variant={selectedInningsIndex === idx ? "success" : isDarkMode ? "outline-light" : "outline-dark"}
                        onClick={() => setSelectedInningsIndex(idx)}
                      >
                        {`Innings ${idx + 1} — Batting: ${battingTeam}`}
                      </Button>
                    );
                  })}
                </ButtonGroup>
              </div>
            )}

            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
                <Spinner animation="border" />
              </div>
            ) : (
              Array.isArray(ballsForInnings) && ballsForInnings.length > 0 ? (
                Object.entries(ballsByOver).map(([over, balls], idx) => (
                  <div key={idx} className="mb-2">
                    <div className="fw-bold mb-1">
                      Over {over} — {balls[0]?.bowler_name || "Unknown"}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {balls.map((ball, i) => (
                        <span
                          key={i}
                          className="border rounded px-2 py-1"
                          style={{
                            backgroundColor: isDarkMode ? "#333" : "#e9ecef",
                            fontWeight: "bold"
                          }}
                        >
                          {renderBallDisplay(ball)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <Alert variant="info">No ball-by-ball data available for this innings.</Alert>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedMatchTab;
