import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Form, Accordion, Spinner, Alert, ButtonGroup, Button } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import WagonWheelChart from "./WagonWheelChart";
import PitchMapChart from "./PitchMapChart";

const ScorecardTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [selectedInningsIndex, setSelectedInningsIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [expandedBatterIndex, setExpandedBatterIndex] = useState(null);
  const [batterDetails, setBatterDetails] = useState({});

  const [expandedBowlerIndex, setExpandedBowlerIndex] = useState(null);
  const [bowlerDetails, setBowlerDetails] = useState({});


  useEffect(() => {
    api.get("/tournaments").then(res => {
      setTournaments(res.data);
      setSelectedTournament("");
      setSelectedMatch("");
    });
  }, [teamCategory]);

  useEffect(() => {
    api.get("/matches", { params: { teamCategory } }).then(res => {
      const filtered = selectedTournament
        ? res.data.filter(m => m.tournament === selectedTournament)
        : res.data;
      setMatches(filtered);
      setSelectedMatch("");
    });
  }, [teamCategory, selectedTournament]);

  const handleGenerate = () => {
    if (!selectedMatch) return alert("Please select a match");
    setLoading(true);
    api.post("/match-scorecard", {
      team_category: teamCategory,
      tournament: selectedTournament,
      match_id: selectedMatch,
    }).then(res => {
      setScorecard(res.data);
      setSelectedInningsIndex(0);
      setLoading(false);
      console.log("📦 Full Scorecard:", res.data);
      console.log("📝 Batting Card:", res.data.innings[0]?.batting_card);
    });
  };

const handleBatterClick = (batter, index) => {
  console.log("🔍 Batter clicked:", batter, "Selected Match:", selectedMatch);

  if (!batter?.player_id || selectedMatch === "") {
    console.warn("❌ Invalid click, missing batter.player_id or selectedMatch");
    return;
  }

  if (expandedBatterIndex === index) {
    setExpandedBatterIndex(null);
  } else {
    setExpandedBatterIndex(index);

    if (!batterDetails[batter.player_id]) {
      console.log("📡 Fetching batter detail from backend...");
      api.get("/scorecard-player-detail", {
        params: {
          matchId: selectedMatch,
          playerId: batter.player_id,
        },
      }).then(res => {
        const transformedShots = res.data.shots.map(ball => ({
          x: ball.shot_x,
          y: ball.shot_y,
          runs: ball.runs,
          dismissal_type: ball.dismissal_type
        }));

        const updatedData = {
          ...res.data,
          shots: transformedShots
        };

        setBatterDetails(prev => ({
          ...prev,
          [batter.player_id]: updatedData
        }));
      }).catch(err => {
        console.error("❌ API error fetching batter detail:", err);
      });
    }

  }
};

const handleBowlerClick = (bowler, index) => {
  if (!bowler.player_id || !selectedMatch) {
    console.warn("❌ Invalid click: missing bowler.player_id or selectedMatch");
    return;
  }

  const isCurrentlyExpanded = expandedBowlerIndex === index;
  setExpandedBowlerIndex(isCurrentlyExpanded ? null : index);

  if (!bowlerDetails[bowler.player_id]) {
    console.log("📡 Fetching bowler detail from backend...");
    api.get("/scorecard-bowler-detail", {
      params: {
        matchId: selectedMatch,
        playerId: bowler.player_id,
      },
    }).then(res => {
      setBowlerDetails(prev => ({
        ...prev,
        [bowler.player_id]: res.data
      }));
    }).catch(err => {
      console.error("❌ API error fetching bowler detail:", err);
    });
  }
};






  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />
        <div className="row">
          <div className="col-md-3">
            <Accordion alwaysOpen>
              {/* Team Category */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <h5 className="fw-bold m-0">Team Category</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Select
                      value={teamCategory}
                      onChange={e => setTeamCategory(e.target.value)}
                    >
                      {["Men", "Women", "U19 Men", "U19 Women", "Training"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Accordion.Body>
              </Accordion.Item>

              {/* Tournament */}
              <Accordion.Item eventKey="1">
                <Accordion.Header>
                  <h5 className="fw-bold m-0">Tournament</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Select
                      value={selectedMatch}
                      onChange={e => setSelectedMatch(Number(e.target.value))}  // <-- Convert to number
                      disabled={matches.length === 0}
                    >
                      <option value="">Select Tournament</option>
                      {tournaments.map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                      ))}
                    </Form.Select>
                    {tournaments.length === 0 && (
                      <small className="text-muted">No tournaments available</small>
                    )}
                  </Form.Group>
                </Accordion.Body>
              </Accordion.Item>

              {/* Match */}
              <Accordion.Item eventKey="2">
                <Accordion.Header>
                  <h5 className="fw-bold m-0">Match</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Select
                      value={selectedMatch}
                      onChange={e => setSelectedMatch(e.target.value)}
                      disabled={matches.length === 0}
                    >
                      <option value="">Select Match</option>
                      {matches.map((m, idx) => (
                        <option key={idx} value={m.match_id}>
                          {`${new Date(m.match_date).toLocaleDateString()} — ${m.team_a} vs ${m.team_b} (${m.tournament})`}
                        </option>
                      ))}
                    </Form.Select>
                    {matches.length === 0 && (
                      <small className="text-muted">No matches available</small>
                    )}
                  </Form.Group>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            {/* Generate Button outside accordion */}
            <div className="mt-3">
              <button
                className="btn btn-primary w-100"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" animation="border" /> : "Generate Scorecard"}
              </button>
            </div>
          </div>


          <div className="col-md-8">
            {loading ? (
              <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : scorecard ? (
              <div>
                <div className="text-center mb-3">
                  <ButtonGroup>
                    {[0, 1].map((idx) => (
                      <Button
                        key={idx}
                        variant={selectedInningsIndex === idx ? "success" : isDarkMode ? "outline-light" : "outline-dark"}
                        onClick={() => setSelectedInningsIndex(idx)}
                      >
                        {idx === 0
                          ? `1st Innings — ${scorecard.innings[0]?.team || scorecard.meta?.team1 || "TBD"}`
                          : `2nd Innings — ${scorecard.innings[1]?.team || scorecard.meta?.team2 || "TBD"}`}
                      </Button>
                    ))}
                  </ButtonGroup>
                </div>

                {scorecard.innings.length > selectedInningsIndex ? (
                  <div className="mb-5">
                    <h5 className="text-center mb-3">{scorecard.innings[selectedInningsIndex].team} Innings</h5>

                    <h6>Batting</h6>
                    <table className="table table-striped table-bordered table-sm">
                      <thead>
                      <tr>
                        <th style={{ width: "25%" }}>Batter</th>
                        <th style={{ width: "20%" }}>Fielder</th>
                        <th style={{ width: "20%" }}>Bowler</th>
                        <th>R</th>
                        <th>B</th>
                        <th>4s</th>
                        <th>6s</th>
                        <th>SR</th>
                        </tr>
                      </thead>
                        <tbody>
                          {scorecard.innings[selectedInningsIndex].batting_card.map((b, i) => {
                            const isNotOut = b.fielder_text === "" && b.bowler_text === "";
                            const isExpanded = expandedBatterIndex === i;
                            const detail = batterDetails[b.player_id];

                            return (
                              <React.Fragment key={i}>
                                <tr
                                  className={`${isNotOut ? "table-success fw-bold" : ""} ${isExpanded ? "table-active" : ""}`}
                                  onClick={() => handleBatterClick(b, i)}
                                  style={{ cursor: "pointer" }}
                                >
                                  <td>{b.player}{b.is_captain ? " ©" : ""}{b.is_keeper ? " †" : ""}</td>
                                  <td className={isNotOut ? "fst-italic" : ""}>{b.fielder_text || (isNotOut ? "not out" : "")}</td>
                                  <td className={isNotOut ? "fst-italic" : ""}>{b.bowler_text || ""}</td>
                                  <td>{b.runs}</td><td>{b.balls}</td><td>{b.fours}</td><td>{b.sixes}</td><td>{b.strike_rate}</td>
                                </tr>
                                {isExpanded && detail && (
                                  <tr>
                                    <td colSpan="8" className={isDarkMode ? "bg-dark text-white" : "bg-light text-dark"} style={{ padding: "1rem" }}>
                                      <div className="row">
                                        <div className="col-md-5">
                                          <h6>Run Breakdown</h6>
                                          <ul>
                                            {Object.entries(detail.run_breakdown).map(([runs, count]) => (
                                              <li key={runs}><strong>{runs}:</strong> {count}</li>
                                            ))}
                                            <li><strong>Scoring Shot %:</strong> {detail.scoring_pct}%</li>
                                            <li><strong>Avg Intent:</strong> {detail.avg_intent}</li>
                                          </ul>
                                        </div>
                                        <div className="col-md-7">
                                          <h6>Wagon Wheel</h6>
                                          <WagonWheelChart data={detail.shots} perspective="Lines" />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>


                    </table>

                    <h6>Bowling</h6>
                    <table className="table table-striped table-bordered table-sm">
                      <thead>
                        <tr>
                          <th>Bowler</th>
                          <th>O</th>
                          <th>Dots</th>
                          <th>R</th>
                          <th>W</th>
                          <th>Eco</th>
                          <th>WD</th>
                          <th>NB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scorecard.innings[selectedInningsIndex].bowling_card.map((b, i) => {
                          const isExpanded = expandedBowlerIndex === i;
                          const detail = bowlerDetails[b.player_id];

                          return (
                            <React.Fragment key={i}>
                              <tr
                                className={isExpanded ? "table-active" : ""}
                                onClick={() => handleBowlerClick(b, i)}
                                style={{ cursor: "pointer" }}
                              >
                                <td>{b.bowler}</td>
                                <td>{b.overs}</td>
                                <td>{b.dots}</td>
                                <td>{b.runs}</td>
                                <td>{b.wickets}</td>
                                <td>{b.economy}</td>
                                <td>{b.wides}</td>
                                <td>{b.no_balls}</td>
                              </tr>
                              {isExpanded && detail && (
                                <tr>
                                  <td colSpan="8" className={isDarkMode ? "bg-dark text-white" : "bg-light"}>
                                    <div className="row">
                                      <div className="col-md-5">
                                        <h6>Bowling Summary</h6>
                                        <ul>
                                          <li><strong>Runs Conceded:</strong> {detail.summary.runs_conceded}</li>
                                          <li><strong>Real Runs Conceded:</strong> {detail.summary.real_runs_conceded}</li>
                                          <li><strong>Chances Made:</strong> {detail.summary.chances_made}</li>
                                          <li><strong>Wickets:</strong> {detail.summary.wickets}</li>
                                          <li><strong>Real Wickets:</strong> {detail.summary.real_wickets}</li>
                                          <li><strong>Real Econ:</strong> {detail.summary.real_economy}</li>
                                          <li><strong>Real SR:</strong> {detail.summary.real_strike_rate}</li>
                                        </ul>
                                      </div>
                                      <div className="col-md-7">
                                        <h6>Pitch Map</h6>
                                        <PitchMapChart data={detail.pitch_map} />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}

                      </tbody>
                    </table>

                    <div className="mb-2">
                      <strong>Extras:</strong>{" "}
                      {`W ${scorecard.innings[selectedInningsIndex].extras.wides}, NB ${scorecard.innings[selectedInningsIndex].extras.no_balls}, B ${scorecard.innings[selectedInningsIndex].extras.byes}, LB ${scorecard.innings[selectedInningsIndex].extras.leg_byes}, P ${scorecard.innings[selectedInningsIndex].extras.penalty}`}
                    </div>
                    <div className="mb-2">
                      <strong>Fall of Wickets:</strong><br />
                      {scorecard.innings[selectedInningsIndex].fall_of_wickets.join(", ")}
                    </div>
                    <div className="fw-bold">
                      <strong>Total:</strong> {scorecard.innings[selectedInningsIndex].total} / {scorecard.innings[selectedInningsIndex].fall_of_wickets.length} in {scorecard.innings[selectedInningsIndex].overs} overs
                    </div>
                  </div>
                ) : (
                  <Alert variant="secondary" className="text-center">
                    🕒 {selectedInningsIndex === 1
                      ? `The second innings for ${scorecard.meta?.team2 || "TBD"} has not started yet.`
                      : `The first innings for ${scorecard.meta?.team1 || "TBD"} has not started yet.`}
                  </Alert>
                )}

                <div className="text-center mt-4">
                  <h5 className="bg-success text-white py-2 rounded">{scorecard.result}</h5>
                </div>
              </div>
            ) : (
              <Alert variant="info">No scorecard data</Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScorecardTab;
