import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Card, Form, Spinner, Alert, Table, Button } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";


const BowlingLeadersTab = () => {
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
      api.post("/tournament-leaders/bowling", {
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

                <Button className="w-100 mt-2" onClick={handleGenerate} disabled={!teamCategory || !selectedTournament || selectedCountries.length === 0}>
                  Generate Leaderboards
                </Button>
              </Card.Body>
            </Card>
          </div>

          {/* Leaderboards Section */}
          <div className="col-md-9">
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : Object.keys(leaderboards).length > 0 ? (
              <Accordion defaultActiveKey="0" alwaysOpen>
                {/* Most Wickets */}
                <Accordion.Item eventKey="0">
                    <Accordion.Header><strong>Most Wickets</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Wickets"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Wickets</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Most Wickets"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.wickets}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Best Bowling Figures in a Match */}
                <Accordion.Item eventKey="1">
                    <Accordion.Header><strong>Best Bowling Figures in a Match</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Best Bowling Figures"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Figures</th>
                            <th>Opponent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Best Bowling Figures"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.figures}</td>
                                <td>{p.opponent}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Best Averages */}
                <Accordion.Item eventKey="2">
                    <Accordion.Header><strong>Best Bowling Averages (Min 4 wickets)</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Best Averages"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Average</th>
                            <th>Wickets</th>
                            <th>Runs Conceded</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Best Averages"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.average}</td>
                                <td>{p.wickets}</td>
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

                {/* Best Economy Rates */}
                <Accordion.Item eventKey="3">
                    <Accordion.Header><strong>Best Economy Rates (Min 5 overs)</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Best Economy Rates"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Economy</th>
                            <th>Balls Bowled</th>
                            <th>Runs Conceded</th>                            
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Best Economy Rates"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.economy}</td>
                                <td>{p.balls}</td>
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

                {/* Best Strike Rates */}
                <Accordion.Item eventKey="4">
                    <Accordion.Header><strong>Best Strike Rates (Min 4 wickets)</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Best Strike Rates"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Strike Rate</th>
                            <th>Wickets</th>
                            <th>Balls Bowled</th>                            
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Best Strike Rates"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.strike_rate}</td>
                                <td>{p.wickets}</td>
                                <td>{p.balls}</td>                                
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Most 3+ Wicket Hauls */}
                <Accordion.Item eventKey="5">
                    <Accordion.Header><strong>Most 3+ Wicket Hauls</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                        {leaderboards["3+ Wicket Hauls"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Player</th>
                                <th>3+ Wicket Hauls</th>
                            </tr>
                            </thead>
                            <tbody>
                            {leaderboards["3+ Wicket Hauls"].map((p, idx) => (
                                <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.hauls}</td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                        ) : (
                        <Alert variant="info">No data available.</Alert>
                        )}
                    </Accordion.Body>
                </Accordion.Item>


                {/* Most Dot Balls */}
                <Accordion.Item eventKey="6">
                    <Accordion.Header><strong>Most Dot Balls</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Dot Balls"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Dot Balls</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Most Dot Balls"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.dots}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Most Wides */}
                <Accordion.Item eventKey="7">
                    <Accordion.Header><strong>Most Wides</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Wides"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Wides</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Most Wides"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.wides}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* Most No Balls */}
                <Accordion.Item eventKey="8">
                    <Accordion.Header><strong>Most No Balls</strong></Accordion.Header>
                    <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most No Balls"]?.length > 0 ? (
                        <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                            <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>No Balls</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboards["Most No Balls"].map((p, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.no_balls}</td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    ) : (
                        <Alert variant="info">No data available.</Alert>
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* False Shot Percentage */}
                <Accordion.Item eventKey="X"> {/* replace X with the next available key */}
                <Accordion.Header><strong>False Shot %</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["False Shot %"]?.length > 0 ? (
                    <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>False Shot %</th>
                            <th>(False Shot/Balls Bowled)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {leaderboards["False Shot %"].map((p, idx) => (
                            <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{p.name}</td>
                            <td>{p.false_shot_percent}%</td>
                            <td>({p.false_shots}/{p.deliveries})</td>
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
              <Alert variant="info">Select filters to view bowling leaderboards.</Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BowlingLeadersTab;
