import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Card, Form, Spinner, Alert, Table, Button } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";

const statCategories = [
  "Most Runs",
  "High Scores",
  "Highest Averages",
  "Highest Strike Rates",
  "Most Fifties and Over",
  "Most Ducks",
  "Most Fours",
  "Most Sixes",
  "Highest Average Intent",
  "Highest Scoring Shot %"
];

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

  const renderLeaderboardTable = (players, columns) => (
    <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          {columns.map((col, i) => <th key={i}>{col}</th>)}
        </tr>
      </thead>
      <tbody>
        {players.map((p, idx) => (
          <tr key={idx}>
            <td>{idx + 1}</td>
            <td>{p.name}</td>
            {columns.map((col, i) => (
              <td key={i}>{p[col.toLowerCase().replace(/ /g, "_")]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );

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
                    <div className="form-check" style={{ maxHeight: "200px", overflowY: "auto" }}>
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
                {statCategories.map((category, idx) => (
                  <Accordion.Item eventKey={idx.toString()} key={category}>
                    <Accordion.Header><strong>{category}</strong></Accordion.Header>
                    <Accordion.Body>
                      {leaderboards[category] && leaderboards[category].length > 0 ? (
                        renderLeaderboardTable(
                          leaderboards[category],
                          Object.keys(leaderboards[category][0]).filter(k => k !== "name")
                        )
                      ) : (
                        <Alert variant="info">No data available.</Alert>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
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
