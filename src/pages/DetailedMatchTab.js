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
  const ballsForInnings = ballByBallData.filter(b => b.innings_id === currentInningsId);

  const ballsByOver = ballsForInnings.reduce((acc, ball) => {
    if (!acc[ball.over_number]) acc[ball.over_number] = [];
    acc[ball.over_number].push(ball);
    return acc;
  }, {});

  const getBallStyle = (ball) => {
    const outcome = ball.outcome;

    if (outcome === "W") {
      return { backgroundColor: "red", color: "white", fontWeight: "bold" };
    }

    if (outcome === "4" || outcome === "6") {
      return { backgroundColor: "yellow", color: "black", fontWeight: "bold" };
    }

    if (outcome.includes("[") && outcome.includes("]")) {
      return { backgroundColor: "blue", color: "white", fontWeight: "bold" };
    }

    return {
      backgroundColor: isDarkMode ? "#333" : "#e9ecef",
      fontWeight: "bold"
    };
  };

  const getInningsDotOneStreaks = (balls) => {
    const streaks = [];
    let currentStreak = 0;

    for (const ball of balls) {
      const outcome = ball.outcome;

      if (outcome === "W" || outcome === "0" || outcome === "1" || outcome === "[1LB]") {
        currentStreak += 1;
      } else {
        const isExtra = outcome.includes("[");
        const runVal = parseInt(outcome);

        if (isExtra || (!isNaN(runVal) && runVal > 1)) {
          if (currentStreak > 0) streaks.push(currentStreak);
          currentStreak = 0;
        } else {
          currentStreak += 1;
        }
      }
    }

    if (currentStreak > 0) streaks.push(currentStreak);

    streaks.sort((a, b) => b - a);
    return streaks.slice(0, 3);
  };

  const inningsStreaks = getInningsDotOneStreaks(ballsForInnings);

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

          {/* Data and Streak Table */}
          <div className="col-md-9 d-flex">
            {/* Ball-by-ball data (left) */}
            <div className="flex-grow-1 me-3">
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
                            style={getBallStyle(ball)}
                          >
                            {ball.outcome}
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

            {/* Streak table (right) */}
            {ballsForInnings.length > 0 && (
              <div style={{ minWidth: "200px" }}>
                <h6 className="fw-bold">Top Dot and One Streaks (Innings)</h6>
                <table className={`table table-sm ${isDarkMode ? "table-dark" : "table-light"} mb-2`}>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Maximum</td>
                      <td>{inningsStreaks[0] || 0}</td>
                    </tr>
                    <tr>
                      <td>Second</td>
                      <td>{inningsStreaks[1] || 0}</td>
                    </tr>
                    <tr>
                      <td>Third</td>
                      <td>{inningsStreaks[2] || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedMatchTab;
