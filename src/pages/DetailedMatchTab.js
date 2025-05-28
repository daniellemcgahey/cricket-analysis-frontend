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
        console.error(err);
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

  const getBallStyle = (ball, isMaxStreak) => {
    const outcome = ball.outcome;
    let baseStyle = {
      backgroundColor: isDarkMode ? "#333" : "#e9ecef",
      fontWeight: "bold",
      border: "1px solid #ccc",
      borderRadius: "4px",
      padding: "2px 6px",
    };

    if (outcome === "W") baseStyle = { ...baseStyle, backgroundColor: "red", color: "white" };
    else if (outcome === "4" || outcome === "6") baseStyle = { ...baseStyle, backgroundColor: "yellow", color: "black" };
    else if (outcome.includes("[") && outcome.includes("]")) baseStyle = { ...baseStyle, backgroundColor: "blue", color: "white" };

    if (isMaxStreak) baseStyle = { ...baseStyle, border: "2px solid purple" };

    return baseStyle;
  };

  const getInningsDotOneStreaks = (balls) => {
    const streaks = [];
    let currentStreak = 0;
    let streakStartIndex = 0;

    balls.forEach((ball, idx) => {
      const outcome = ball.outcome;
      if (outcome === "W" || outcome === "0" || outcome === "1" || outcome === "[1LB]") {
        if (currentStreak === 0) streakStartIndex = idx;
        currentStreak += 1;
      } else {
        const isExtra = outcome.includes("[");
        const runVal = parseInt(outcome);
        if (isExtra || (!isNaN(runVal) && runVal > 1)) {
          if (currentStreak > 0) streaks.push({ length: currentStreak, start: streakStartIndex, end: idx - 1 });
          currentStreak = 0;
        } else {
          currentStreak += 1;
        }
      }
    });

    if (currentStreak > 0) streaks.push({ length: currentStreak, start: streakStartIndex, end: balls.length - 1 });

    streaks.sort((a, b) => b.length - a.length);
    return streaks.slice(0, 3);
  };

  const inningsStreaks = getInningsDotOneStreaks(ballsForInnings);

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-md-3">
            <Card className={isDarkMode ? "bg-dark text-white" : ""}>
              <Card.Body>
                <Accordion alwaysOpen>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header><h5 className="fw-bold m-0">Team Category</h5></Accordion.Header>
                    <Accordion.Body>
                      <Form.Select value={teamCategory} onChange={e => setTeamCategory(e.target.value)}>
                        {teamCategories.map((cat, i) => (<option key={i} value={cat}>{cat}</option>))}
                      </Form.Select>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="1">
                    <Accordion.Header><h5 className="fw-bold m-0">Tournament</h5></Accordion.Header>
                    <Accordion.Body>
                      <Form.Select value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)} disabled={tournaments.length === 0}>
                        <option value="">-- Select Tournament --</option>
                        {tournaments.map((t, i) => (<option key={i} value={t}>{t}</option>))}
                      </Form.Select>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="2">
                    <Accordion.Header><h5 className="fw-bold m-0">Match</h5></Accordion.Header>
                    <Accordion.Body>
                      <Form.Select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)} disabled={matches.length === 0}>
                        <option value="">-- Select Match --</option>
                        {matches.map((m, i) => (<option key={i} value={m.match_id}>{`${new Date(m.match_date).toLocaleDateString()} — ${m.team_a} vs ${m.team_b}`}</option>))}
                      </Form.Select>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
                <div className="mt-3">
                  <Button onClick={fetchData} disabled={loading} className="w-100">
                    {loading ? <Spinner size="sm" animation="border" /> : "Load Ball-by-Ball"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="col-md-9 d-flex">
            <div className="flex-grow-1 me-3">
              {inningsOrder.length > 0 && (
                <div className="text-center mb-3">
                  <ButtonGroup>
                    {inningsOrder.map((inningsId, idx) => {
                      const inningsBalls = ballByBallData.filter(b => b.innings_id === inningsId);
                      const battingTeam = inningsBalls[0]?.batting_team || "Unknown";
                      return (
                        <Button key={inningsId} variant={selectedInningsIndex === idx ? "success" : isDarkMode ? "outline-light" : "outline-dark"} onClick={() => setSelectedInningsIndex(idx)}>
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
                ballsForInnings.length > 0 ? (
                  Object.entries(ballsByOver).map(([over, balls], idx) => (
                    <div key={idx} className="mb-2">
                      <div className="fw-bold mb-1">Over {over} — {balls[0]?.bowler_name || "Unknown"}</div>
                      <div className="d-flex flex-wrap gap-2">
                        {balls.map((ball, i) => {
                          const globalIndex = ballsForInnings.findIndex(b => b === ball);
                          const isMaxStreak = inningsStreaks[0] && globalIndex >= inningsStreaks[0].start && globalIndex <= inningsStreaks[0].end;
                          return (
                            <span key={i} style={getBallStyle(ball, isMaxStreak)}>
                              {ball.outcome}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <Alert variant="info">No ball-by-ball data available for this innings.</Alert>
                )
              )}
            </div>

            {ballsForInnings.length > 0 && (
              <div style={{ minWidth: "200px" }}>
                <h6 className="fw-bold">Top Dot and One Streaks</h6>
                <table className={`table table-sm ${isDarkMode ? "table-dark" : "table-light"} mb-2`}>
                  <thead><tr><th>Rank</th><th>Length</th></tr></thead>
                  <tbody>
                    <tr><td>Maximum</td><td>{inningsStreaks[0]?.length || 0}</td></tr>
                    <tr><td>Second</td><td>{inningsStreaks[1]?.length || 0}</td></tr>
                    <tr><td>Third</td><td>{inningsStreaks[2]?.length || 0}</td></tr>
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
