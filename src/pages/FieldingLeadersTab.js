import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Card, Form, Spinner, Alert, Table, Button } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";

const FieldingLeadersTab = () => {
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
      api.get("/matches", { params: { teamCategory } }).then(res => {
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
      api.post("/tournament-leaders/fielding", {
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

          <div className="col-md-9">
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : Object.keys(leaderboards).length > 0 ? (
              <Accordion defaultActiveKey="0">
                {/* Most Catches */}
                <Accordion.Item eventKey="0">
                <Accordion.Header><strong>Most Catches</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Catches"]?.length > 0 ? (
                    <Table striped bordered hover variant={isDarkMode ? "dark" : "light"} size="sm">
                        <thead>
                        <tr><th>#</th><th>Player</th><th>Catches</th></tr>
                        </thead>
                        <tbody>
                        {leaderboards["Most Catches"].map((p, i) => (
                            <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.value}</td></tr>
                        ))}
                        </tbody>
                    </Table>
                    ) : <Alert variant="secondary">No data available.</Alert>}
                </Accordion.Body>
                </Accordion.Item>

                {/* Most Run Outs */}
                <Accordion.Item eventKey="1">
                <Accordion.Header><strong>Most Run Outs</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Run Outs"]?.length > 0 ? (
                    <Table striped bordered hover variant={isDarkMode ? "dark" : "light"} size="sm">
                        <thead>
                        <tr><th>#</th><th>Player</th><th>Run Outs</th></tr>
                        </thead>
                        <tbody>
                        {leaderboards["Most Run Outs"].map((p, i) => (
                            <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.value}</td></tr>
                        ))}
                        </tbody>
                    </Table>
                    ) : <Alert variant="secondary">No data available.</Alert>}
                </Accordion.Body>
                </Accordion.Item>

                {/* Most Dismissals */}
                <Accordion.Item eventKey="2">
                <Accordion.Header><strong>Most Dismissals</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Most Dismissals"]?.length > 0 ? (
                    <Table striped bordered hover variant={isDarkMode ? "dark" : "light"} size="sm">
                        <thead>
                        <tr><th>#</th><th>Player</th><th>Total Dismissals</th></tr>
                        </thead>
                        <tbody>
                        {leaderboards["Most Dismissals"].map((p, i) => (
                            <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.value}</td></tr>
                        ))}
                        </tbody>
                    </Table>
                    ) : <Alert variant="secondary">No data available.</Alert>}
                </Accordion.Body>
                </Accordion.Item>

                {/* Best Conversion Rate */}
                <Accordion.Item eventKey="3">
                <Accordion.Header><strong>Best Conversion Rate</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Best Conversion Rate"]?.length > 0 ? (
                    <Table striped bordered hover variant={isDarkMode ? "dark" : "light"} size="sm">
                        <thead>
                        <tr><th>#</th><th>Player</th><th>Conversion %</th></tr>
                        </thead>
                        <tbody>
                        {leaderboards["Best Conversion Rate"].map((p, i) => (
                            <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.value.toFixed(1)}%</td></tr>
                        ))}
                        </tbody>
                    </Table>
                    ) : <Alert variant="secondary">No data available.</Alert>}
                </Accordion.Body>
                </Accordion.Item>

                {/* Cleanest Hands */}
                <Accordion.Item eventKey="4">
                <Accordion.Header><strong>Cleanest Hands</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Cleanest Hands"]?.length > 0 ? (
                    <Table striped bordered hover variant={isDarkMode ? "dark" : "light"} size="sm">
                        <thead>
                        <tr><th>#</th><th>Player</th><th>Clean Hands %</th></tr>
                        </thead>
                        <tbody>
                        {leaderboards["Cleanest Hands"].map((p, i) => (
                            <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.value.toFixed(1)}%</td></tr>
                        ))}
                        </tbody>
                    </Table>
                    ) : <Alert variant="secondary">No data available.</Alert>}
                </Accordion.Body>
                </Accordion.Item>

                {/* WK Catches */}
                <Accordion.Item eventKey="5">
                <Accordion.Header><strong>WK Catches</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["WK Catches"]?.length > 0 ? (
                    <Table striped bordered hover variant={isDarkMode ? "dark" : "light"} size="sm">
                        <thead>
                        <tr><th>#</th><th>Player</th><th>Catches</th></tr>
                        </thead>
                        <tbody>
                        {leaderboards["WK Catches"].map((p, i) => (
                            <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.value}</td></tr>
                        ))}
                        </tbody>
                    </Table>
                    ) : <Alert variant="secondary">No data available.</Alert>}
                </Accordion.Body>
                </Accordion.Item>

                {/* WK Stumpings */}
                <Accordion.Item eventKey="6">
                <Accordion.Header><strong>WK Stumpings</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["WK Stumpings"]?.length > 0 ? (
                    <Table striped bordered hover variant={isDarkMode ? "dark" : "light"} size="sm">
                        <thead>
                        <tr><th>#</th><th>Player</th><th>Stumpings</th></tr>
                        </thead>
                        <tbody>
                        {leaderboards["WK Stumpings"].map((p, i) => (
                            <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.value}</td></tr>
                        ))}
                        </tbody>
                    </Table>
                    ) : <Alert variant="secondary">No data available.</Alert>}
                </Accordion.Body>
                </Accordion.Item>

                {/* WK Dismissals */}
                <Accordion.Item eventKey="7">
                <Accordion.Header><strong>WK Dismissals</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["WK Dismissals"]?.length > 0 ? (
                    <Table striped bordered hover variant={isDarkMode ? "dark" : "light"} size="sm">
                        <thead>
                        <tr><th>#</th><th>Player</th><th>Total Dimissals</th></tr>
                        </thead>
                        <tbody>
                        {leaderboards["WK Dismissals"].map((p, i) => (
                            <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.value}</td></tr>
                        ))}
                        </tbody>
                    </Table>
                    ) : <Alert variant="secondary">No data available.</Alert>}
                </Accordion.Body>
                </Accordion.Item>

                {/* Best WK Conversion Rate */}
                <Accordion.Item eventKey="8">
                <Accordion.Header><strong>Best WK Conversion Rate</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["Best WK Conversion Rate"]?.length > 0 ? (
                    <Table striped bordered hover variant={isDarkMode ? "dark" : "light"} size="sm">
                        <thead>
                        <tr><th>#</th><th>Player</th><th>Conversion %</th></tr>
                        </thead>
                        <tbody>
                        {leaderboards["Best WK Conversion Rate"].map((p, i) => (
                            <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.value.toFixed(1)}%</td></tr>
                        ))}
                        </tbody>
                    </Table>
                    ) : <Alert variant="secondary">No data available.</Alert>}
                </Accordion.Body>
                </Accordion.Item>

                {/* WK Cleanest Hands */}
                <Accordion.Item eventKey="9">
                <Accordion.Header><strong>WK Cleanest Hands</strong></Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                    {leaderboards["WK Cleanest Hands"]?.length > 0 ? (
                    <Table striped bordered hover variant={isDarkMode ? "dark" : "light"} size="sm">
                        <thead>
                        <tr><th>#</th><th>Player</th><th>Clean Hands %</th></tr>
                        </thead>
                        <tbody>
                        {leaderboards["WK Cleanest Hands"].map((p, i) => (
                            <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.value.toFixed(1)}%</td></tr>
                        ))}
                        </tbody>
                    </Table>
                    ) : <Alert variant="secondary">No data available.</Alert>}
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

export default FieldingLeadersTab;
