import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Card, Form, Spinner, Alert, Table, Button } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";

const BattingLeadersTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [countries, setCountries] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectAllCountries, setSelectAllCountries] = useState(true);
  const [leaderboards, setLeaderboards] = useState({});
  const [loading, setLoading] = useState(false);

  const teamCategories = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

  useEffect(() => {
    api.get("/tournaments").then(res => setTournaments(res.data));
  }, []);

  useEffect(() => {
    if (teamCategory && selectedTournament) {
      api.get("/matches", { params: { teamCategory } })
        .then(res => {
          const filtered = res.data.filter(m => m.tournament === selectedTournament);
          const teams = new Set();
          filtered.forEach(m => {
            teams.add(m.team_a);
            teams.add(m.team_b);
          });
          const countryList = Array.from(teams).sort();
          setCountries(countryList);
          setSelectedCountries(countryList);
          setSelectAllCountries(true);
        });
    }
  }, [teamCategory, selectedTournament]);

  const handleGenerate = () => {
    if (teamCategory && selectedTournament && selectedCountries.length > 0) {
      setLoading(true);
      api.post("/tournament-leaders/batting", {
        team_category: teamCategory,
        tournament: selectedTournament,
        countries: selectedCountries
      })
        .then(res => {
          setLeaderboards(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLeaderboards({});
          setLoading(false);
        });
    }
  };

  const toggleSelectAll = () => {
    if (selectAllCountries) {
      setSelectedCountries([]);
      setSelectAllCountries(false);
    } else {
      setSelectedCountries(countries);
      setSelectAllCountries(true);
    }
  };

  const handleCountryToggle = (country) => {
    if (selectedCountries.includes(country)) {
      const updated = selectedCountries.filter(c => c !== country);
      setSelectedCountries(updated);
      setSelectAllCountries(false);
    } else {
      const updated = [...selectedCountries, country];
      setSelectedCountries(updated);
      if (updated.length === countries.length) setSelectAllCountries(true);
    }
  };


  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <div className="row">
          {/* Sidebar Filters */}
          <div className="col-md-3">
            <Card className={isDarkMode ? "bg-dark text-white" : ""}>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Team Category</strong></Form.Label>
                  <Form.Select value={teamCategory} onChange={e => setTeamCategory(e.target.value)}>
                    {teamCategories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label><strong>Tournament</strong></Form.Label>
                  <Form.Select value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)}>
                    <option value="">-- Select Tournament --</option>
                    {tournaments.map((t, i) => (
                      <option key={i} value={t}>{t}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {selectedTournament && countries.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Countries</strong></Form.Label>
                    <Button
                      size="sm"
                      variant={selectAllCountries ? "secondary" : "outline-secondary"}
                      onClick={toggleSelectAll}
                      className="mb-2"
                    >
                      {selectAllCountries ? "Deselect All" : "Select All"}
                    </Button>
                    <div className="form-check" style={{ maxHeight: "250px", overflowY: "auto" }}>
                      {countries.map((c, i) => (
                        <div key={i}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`country-${i}`}
                            checked={selectedCountries.includes(c)}
                            onChange={() => handleCountryToggle(c)}
                          />
                          <label className="form-check-label" htmlFor={`country-${i}`}>{c}</label>
                        </div>
                      ))}
                    </div>
                  </Form.Group>
                )}

                <Button
                  className="w-100 mt-2"
                  onClick={handleGenerate}
                  disabled={!teamCategory || !selectedTournament || selectedCountries.length === 0}
                >
                  Generate Leaderboards
                </Button>
              </Card.Body>
            </Card>
          </div>

          {/* Right Side Leaderboards */}
          <div className="col-md-9">
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : Object.keys(leaderboards).length > 0 ? (
                <Accordion defaultActiveKey="0" alwaysOpen>

                {/* Most Runs */}
                <Accordion.Item eventKey="0">
                    <Accordion.Header><strong>Most Runs</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Runs"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Matches</th>
                            <th>Innings</th>
                            <th>Runs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Most Runs"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.matches}</td>
                                <td>{p.innings}</td>
                                <td>{p.runs}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* High Scores */}
                <Accordion.Item eventKey="1">
                    <Accordion.Header><strong>High Scores</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["High Scores"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>High Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["High Scores"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.high_score}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Highest Averages */}
                <Accordion.Item eventKey="2">
                    <Accordion.Header><strong>Highest Averages</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Highest Averages"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Average</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Highest Averages"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.average}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Highest Strike Rates */}
                <Accordion.Item eventKey="3">
                    <Accordion.Header><strong>Highest Strike Rates (min 30 balls)</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Highest Strike Rates"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Balls Faced</th>
                            <th>Strike Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Highest Strike Rates"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.balls_faced}</td>
                                <td>{p.strike_rate}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Most Fifties and Over */}
                <Accordion.Item eventKey="4">
                    <Accordion.Header><strong>Most Fifties and Over</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Fifties and Over"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>50+</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Most Fifties and Over"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.fifties}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Most Ducks */}
                <Accordion.Item eventKey="5">
                    <Accordion.Header><strong>Most Ducks</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Ducks"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Ducks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Most Ducks"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.ducks}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Most Fours */}
                <Accordion.Item eventKey="6">
                    <Accordion.Header><strong>Most Fours</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Fours"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Fours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Most Fours"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.fours}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Most Sixes */}
                <Accordion.Item eventKey="7">
                    <Accordion.Header><strong>Most Sixes</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Sixes"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Sixes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Most Sixes"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.sixes}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Highest Average Intent */}
                <Accordion.Item eventKey="8">
                    <Accordion.Header><strong>Highest Average Intent (min 30 balls)</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Highest Average Intent"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Intent Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Highest Average Intent"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.average_intent}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Highest Scoring Shot % */}
                <Accordion.Item eventKey="9">
                    <Accordion.Header><strong>Highest Scoring Shot % (min 30 balls)</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Highest Scoring Shot %"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Scoring Shot %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Highest Scoring Shot %"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.scoring_shot_percentage}%</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                </Accordion>

            ) : (
              <Alert variant="info">Select filters to view batting leaderboards.</Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattingLeadersTab;
