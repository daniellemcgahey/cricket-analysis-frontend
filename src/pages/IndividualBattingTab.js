import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Card, Button, Accordion, Table, Spinner, Alert } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import BattingPitchMapFilters from "../components/BattingPitchMapFilters"

const IndividualBattingTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [filters, setFilters] = useState({
    teamCategory: "Women",
    country1: "",
    country2: "",  // ✅ Needed by PitchMapFilters even if unused
    tournaments: [],
    selectedPhases: ["Powerplay", "Middle Overs", "Death Overs"],
    selectedBowlingArms: ["Left", "Right"],
    selectedBowlerTypes: ["Pace", "Medium", "Spin"],
    selectedBattingHands: ["Left", "Right"],
    selectedLengths: ["Full Toss", "Yorker", "Full", "Good", "Short"],
    allMatchesSelected: true,
    selectedMatches: [],
  });

  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [battingStats, setBattingStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load players when country changes
  useEffect(() => {
    if (filters.country1) {
      axios.get("http://localhost:8000/team-players", {
        params: { country_name: filters.country1, team_category: filters.teamCategory }
      }).then((res) => setPlayers(res.data));
    }
  }, [filters.country1, filters.teamCategory]);

  const handleGenerate = () => {
    if (!selectedPlayer || filters.tournaments.length === 0) {
      alert("Please select a player and at least one tournament.");
      return;
    }
    setLoading(true);
  
    axios.post("http://localhost:8000/player-batting-analysis", {
      player_id: selectedPlayer,
      team_category: filters.teamCategory,
      tournaments: filters.tournaments,
      bowling_arm: filters.selectedBowlingArms,
      bowling_style: filters.selectedBowlerTypes,
      lengths: filters.selectedLengths,
    })
    .then((res) => {
      setBattingStats(res.data);
      console.log("🎯 Batting Stats (Overall):", res.data.overall);
      setLoading(false);
    })
    .catch(() => {
      setBattingStats(null);
      setLoading(false);
    });
  };

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />

        <div className="row">
          {/* Left - Filters */}
          <div className="col-md-4">
            <BattingPitchMapFilters filters={filters} setFilters={setFilters} />

            <Card className={`mt-3 ${isDarkMode ? "bg-dark text-white" : ""}`}>
              <Card.Body>
                <h5 className="fw-bold">Player Selection</h5>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (filters.country1) {
                      axios.get("http://localhost:8000/team-players", {
                        params: { country_name: filters.country1, team_category: filters.teamCategory }
                      }).then((res) => setPlayers(res.data));
                    }
                  }}
                  className="mb-3"
                >
                  Load Players
                </Button>
                <select
                  className="form-select"
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                >
                  <option value="">Select Player</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <Button
                  variant="success"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-100 mt-3"
                >
                  {loading ? <Spinner size="sm" animation="border" /> : "Generate Detailed Analysis"}
                </Button>
              </Card.Body>
            </Card>

        </div>

          <div className="col-md-8">
            {loading ? (
              <Spinner animation="border" />
            ) : battingStats ? (
              <Accordion
                defaultActiveKey="0"
                alwaysOpen
                className={`mt-4 ${isDarkMode ? "bg-dark text-white" : "bg-light text-dark"}`}
              >
                <Accordion.Item eventKey="0" className={isDarkMode ? "bg-dark text-white" : ""}>
                  <Accordion.Header>Overall Batting Stats</Accordion.Header>
                  <Accordion.Body>
                {battingStats.overall?.length > 0 ? (
                  <Table striped bordered hover size="sm" variant={isDarkMode ? "dark" : "light"}>
                    <thead className="table-secondary text-center">
                      <tr>
                        <th>Tournament</th>
                        <th>Innings</th>
                        <th>Runs</th>
                        <th>Balls</th>
                        <th>Avg</th>
                        <th>SR</th>
                        <th>Dots</th>
                        <th>1s</th>
                        <th>2s</th>
                        <th>3s</th>
                        <th>4s</th>
                        <th>6s</th>                  
                        <th>Scoring %</th>
                        <th>HS</th>
                        <th>Dismissals</th>
                        <th>Avg Intent</th> {/* ✅ New Column */}
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {battingStats.overall.map((row, idx) => {
                        const avg = row.dismissals > 0 ? (row.total_runs / row.dismissals).toFixed(2) : "–";
                        const sr = row.balls_faced > 0 ? ((row.total_runs / row.balls_faced) * 100).toFixed(2) : "–";
                        const scoring = row.balls_faced > 0
                          ? (((row.balls_faced - row.dots) / row.balls_faced) * 100).toFixed(1)
                          : "–";

                        return (
                          <tr key={idx}>
                            <td>{row.tournament_name}</td>
                            <td>{row.innings}</td>
                            <td>{row.total_runs}</td>
                            <td>{row.balls_faced}</td>
                            <td>{avg}</td>
                            <td>{sr}</td>
                            <td>{row.dots}</td>
                            <td>{row.ones}</td>
                            <td>{row.twos}</td>
                            <td>{row.threes}</td>
                            <td>{row.fours}</td>
                            <td>{row.sixes}</td>                           
                            <td>{scoring}%</td>
                            <td>
                              {row.high_score !== null ? (
                                <>
                                  {row.high_score}
                                  {row.high_score_dismissed === 0 && <sup>*</sup>}
                                </>
                              ) : "–"}
                            </td>
                            <td>{row.dismissals}</td>
                            <td>{row.avg_intent?.toFixed(2) || "–"}</td> {/* ✅ New Cell */}
                          </tr>
                        );
                      })}

                      {/* 🧮 Total Row */}
                      <tr className="fw-bold table-dark text-center">
                        <td>Total</td>
                        <td>{battingStats.overall.reduce((a, b) => a + b.innings, 0)}</td>
                        <td>{battingStats.overall.reduce((a, b) => a + b.total_runs, 0)}</td>
                        <td>{battingStats.overall.reduce((a, b) => a + b.balls_faced, 0)}</td>
                        <td>
                          {(() => {
                            const runs = battingStats.overall.reduce((a, b) => a + b.total_runs, 0);
                            const outs = battingStats.overall.reduce((a, b) => a + b.dismissals, 0);
                            return outs > 0 ? (runs / outs).toFixed(2) : "–";
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const runs = battingStats.overall.reduce((a, b) => a + b.total_runs, 0);
                            const balls = battingStats.overall.reduce((a, b) => a + b.balls_faced, 0);
                            return balls > 0 ? ((runs / balls) * 100).toFixed(2) : "–";
                          })()}
                        </td>
                        <td>{battingStats.overall.reduce((a, b) => a + b.dots, 0)}</td>
                        <td>{battingStats.overall.reduce((a, b) => a + b.ones, 0)}</td>
                        <td>{battingStats.overall.reduce((a, b) => a + b.twos, 0)}</td>
                        <td>{battingStats.overall.reduce((a, b) => a + b.threes, 0)}</td>
                        <td>{battingStats.overall.reduce((a, b) => a + b.fours, 0)}</td>
                        <td>{battingStats.overall.reduce((a, b) => a + b.sixes, 0)}</td>
                        <td>
                          {(() => {
                            const balls = battingStats.overall.reduce((a, b) => a + b.balls_faced, 0);
                            const dots = battingStats.overall.reduce((a, b) => a + b.dots, 0);
                            return balls > 0 ? (((balls - dots) / balls) * 100).toFixed(1) + "%" : "–";
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const hsList = battingStats.overall.map(row => ({
                              score: row.high_score || 0,
                              notOut: row.high_score_dismissed === 0,
                            }));
                            const highest = hsList.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), { score: 0, notOut: false });
                            return (
                              <>
                                {highest.score}
                                {highest.notOut && <sup>*</sup>}
                              </>
                            );
                          })()}
                        </td>

                        <td>{battingStats.overall.reduce((a, b) => a + b.dismissals, 0)}</td>
                        <td>
                          {(() => {
                            const totalBalls = battingStats.overall.reduce((a, b) => a + b.balls_faced, 0);
                            const weightedIntent = battingStats.overall.reduce(
                              (a, b) => a + (b.avg_intent * b.balls_faced),
                              0
                            );
                            return totalBalls > 0 ? (weightedIntent / totalBalls).toFixed(2) : "–";
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info">No batting stats available</Alert>
                )}
                  </Accordion.Body>
                </Accordion.Item>



                <Accordion.Item eventKey="1" className={isDarkMode ? "bg-dark text-white" : ""}>
                  <Accordion.Header>Top Partnerships</Accordion.Header>
                    <Accordion.Body>
                {battingStats.partnerships?.length > 0 ? (
                <Table striped bordered hover variant={isDarkMode ? "dark" : "light"}>
                    <thead className="table-secondary text-center">
                    <tr>
                        <th>Wicket</th>
                        <th>Runs (Balls)</th>
                        <th>SR</th>
                        <th>Opponent</th>
                        <th>Tournament</th>
                        <th>Date</th>
                    </tr>
                    </thead>
                    <tbody className="text-center">
                    {battingStats.partnerships.map((p, idx) => {
                        const display = (
                            <>
                              {p.runs}({p.balls}){p.unbeaten ? <sup>*</sup> : null}
                            </>
                          );
                        const sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : "–";
                        const date = p.match_date ? new Date(p.match_date).toLocaleDateString() : "–";
                        return (
                        <tr key={idx}>
                            <td>{p.start_wicket}</td>
                            <td>{display}</td>
                            <td>{sr}</td>
                            <td>{p.opponent || "–"}</td>
                            <td>{p.tournament_name || "–"}</td>
                            <td>{date}</td>
                        </tr>
                        );
                    })}
                    </tbody>
                </Table>
                ) : (
                <Alert variant="info">No partnerships found</Alert>
                )}
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2" className={isDarkMode ? "bg-dark text-white" : ""}>
                  <Accordion.Header>10-Ball Segment Breakdown</Accordion.Header>
                    <Accordion.Body>
                {battingStats.ten_ball?.length > 0 ? (
                <Table striped bordered hover variant={isDarkMode ? "dark" : "light"}>
                    <thead className="table-secondary text-center">
                    <tr>
                        <th>Segment</th>
                        <th>Balls</th>
                        <th>Runs</th>
                        <th>RPB</th>
                        <th>Scoring %</th>
                        <th>Dismissal %</th>
                        <th>Avg Intent</th>
                    </tr>
                    </thead>
                    <tbody className="text-center">
                    {battingStats.ten_ball.map((row, idx) => {
                        const RPB = row["Balls Faced"] > 0 ? (row.Runs / row["Balls Faced"]).toFixed(2) : "–";
                        const scoring = row["Scoring %"] ? `${row["Scoring %"].toFixed(1)}%` : "–";
                        const dismissals = row["Dismissal %"] ? `${row["Dismissal %"].toFixed(1)}%` : "–";

                        return (
                        <tr key={idx}>
                            <td>{row.Segment}</td>
                            <td>{row["Balls Faced"]}</td>
                            <td>{row.Runs}</td>
                            <td>{RPB}</td>
                            <td>{scoring}</td>
                            <td>{dismissals}</td>
                            <td>{row["Avg Intent"]?.toFixed(2) || "–"}</td>
                        </tr>
                        );
                    })}
                    </tbody>
                </Table>
                ) : (
                <Alert variant="info">No 10-ball segment data available</Alert>
                )}
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="3" className={isDarkMode ? "bg-dark text-white" : ""}>
                  <Accordion.Header>Batting by Position</Accordion.Header>
                    <Accordion.Body>
                {battingStats.by_position?.length > 0 ? (
                  <Table striped bordered hover variant={isDarkMode ? "dark" : "light"}>
                    <thead className="table-secondary text-center">
                      <tr>
                        <th>Position</th>
                        <th>Innings</th>
                        <th>Runs</th>
                        <th>Avg</th> 
                        <th>SR</th>
                        <th>Scoring %</th>
                        <th>4s</th>
                        <th>6s</th>
                        <th>HS</th>
                        <th>Intent</th>  
                      </tr>
                    </thead>

                    <tbody className="text-center">
                      {battingStats.by_position.map((row, idx) => {
                        const sr = row.balls_faced > 0 ? ((row.total_runs / row.balls_faced) * 100).toFixed(2) : "–";
                        const position = row.batting_position === 1 ? "Opening" : row.batting_position;

                        return (
                          <tr key={idx}>
                            <td>{position}</td>
                            <td>{row.innings}</td>
                            <td>{row.total_runs}</td>
                            <td>
                              {row.dismissals > 0
                                ? (row.total_runs / row.dismissals).toFixed(2)
                                : "–"}
                            </td>
                            <td>
                              {row.balls_faced > 0
                                ? ((row.total_runs / row.balls_faced) * 100).toFixed(2)
                                : "–"}
                            </td>
                            <td>
                              {row.balls_faced > 0
                                ? ((row.scoring_balls / row.balls_faced) * 100).toFixed(1) + "%"
                                : "–"}
                            </td>
                            <td>{row.fours}</td>
                            <td>{row.sixes}</td>
                            <td>
                              {row.high_score !== null ? (
                                <>
                                  {row.high_score}
                                  {row.high_score_dismissed === 0 && <sup>*</sup>}
                                </>
                              ) : "–"}
                            </td>
                            <td>{row.avg_intent?.toFixed(2) || "–"}</td>


                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info">No batting position data available</Alert>
                )}
                  </Accordion.Body>
                </Accordion.Item>
                </Accordion>
              ) : (
                <Alert variant="info">Please generate a report to view stats.</Alert>
              )}
            </div>

          </div>
        </div>
      </div>
  );
};

export default IndividualBattingTab;
