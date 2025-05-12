import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Form, Accordion, Spinner, Alert, ButtonGroup, Button } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";

const ScorecardTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [scorecard, setScorecard] = useState(null);
  const [selectedInningsIndex, setSelectedInningsIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:8000/tournaments").then(res => {
      setTournaments(res.data);
      setSelectedTournament("");
      setSelectedMatch("");
    });
  }, [teamCategory]);

  useEffect(() => {
    axios.get("http://localhost:8000/matches", { params: { teamCategory } }).then(res => {
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
    axios.post("http://localhost:8000/match-scorecard", {
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

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container py-4">
        <BackButton isDarkMode={isDarkMode} />
        <div className="row">
          <div className="col-md-4">
            <Accordion defaultActiveKey="0">
              <Accordion.Item eventKey="0">
                <Accordion.Header>Filters</Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Team Category</Form.Label>
                    <Form.Select value={teamCategory} onChange={e => setTeamCategory(e.target.value)}>
                      {["Men", "Women", "U19 Men", "U19 Women"].map(cat => (
                        <option key={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Tournament</Form.Label>
                    <Form.Select value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)}>
                      <option value="">Select Tournament</option>
                      {tournaments.map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Match</Form.Label>
                    <Form.Select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}>
                      <option value="">Select Match</option>
                      {matches.map((m, idx) => (
                        <option key={idx} value={m.match_id}>
                          {`${new Date(m.match_date).toLocaleDateString()} — ${m.team_a} vs ${m.team_b} (${m.tournament})`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <button className="btn btn-primary w-100" onClick={handleGenerate}>
                    {loading ? <Spinner size="sm" animation="border" /> : "Generate Scorecard"}
                  </button>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
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
                                // Determine if this player is still not out
                                const isNotOut = b.fielder_text === "" && b.bowler_text === "";

                                return (
                                <tr key={i} className={isNotOut ? "table-success fw-bold" : ""}>
                                    <td>
                                    {b.player}
                                    {b.is_captain ? " ©" : ""}
                                    {b.is_keeper ? " †" : ""}
                                    </td>
                                    <td className={isNotOut ? "fst-italic" : ""}>{b.fielder_text || (isNotOut ? "not out" : "")}</td>
                                    <td className={isNotOut ? "fst-italic" : ""}>{b.bowler_text || ""}</td>
                                    <td>{b.runs}</td>
                                    <td>{b.balls}</td>
                                    <td>{b.fours}</td>
                                    <td>{b.sixes}</td>
                                    <td>{b.strike_rate}</td>
                                </tr>
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
                        {scorecard.innings[selectedInningsIndex].bowling_card.map((b, i) => (
                          <tr key={i}>
                            <td>{b.bowler}</td>
                            <td>{b.overs}</td>
                            <td>{b.dots}</td>
                            <td>{b.runs}</td>
                            <td>{b.wickets}</td>
                            <td>{b.economy}</td>
                            <td>{b.wides}</td>
                            <td>{b.no_balls}</td>
                          </tr>
                        ))}
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
