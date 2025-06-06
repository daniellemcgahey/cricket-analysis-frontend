import React, { useState, useEffect } from "react";
import api from "../api";
import { Accordion, Form, Button, Table, Spinner } from "react-bootstrap";

const TournamentStatsTab = () => {
  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
    const [groundOptions, setGroundOptions] = useState([]);
    const [timeOptions, setTimeOptions] = useState([]);

  useEffect(() => {
    const fetchTournaments = async () => {
      const res = await api.get("/tournaments", {
        params: { team_category: teamCategory },
      });
      setTournaments(res.data);
    };
    fetchTournaments();
  }, [teamCategory]);

  useEffect(() => {
    const fetchCountries = async () => {
      if (!selectedTournament) return;
      const res = await api.get("/countries", {
        params: { team_category: teamCategory, tournament: selectedTournament },
      });
      setCountries(res.data);
    };
    fetchCountries();
  }, [selectedTournament, teamCategory]);

  useEffect(() => {
  const fetchVenues = async () => {
    if (!selectedTournament) return;
    const res = await api.get("/venue-options", {
      params: {
        team_category: teamCategory,
        tournament: selectedTournament
      }
    });
    setGroundOptions(res.data.grounds || []);
    setTimeOptions(res.data.times || []);
  };
  fetchVenues();
}, [selectedTournament, teamCategory]);


  const fetchStats = async () => {
    setLoading(true);
    const res = await api.post("/tournament-stats", {
      team_category: teamCategory,
      tournament: selectedTournament,
      country: selectedCountry,
      venue: selectedVenue,
      time_of_day: selectedTimeOfDay,
    });
    setTableData(res.data);
    setLoading(false);
  };

  return (
    <div className="container mt-3">
      <div className="row">
        {/* Filters Panel */}
        <div className="col-md-4">
          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Filters</Accordion.Header>
              <Accordion.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Team Category</Form.Label>
                  <Form.Select value={teamCategory} onChange={(e) => setTeamCategory(e.target.value)}>
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="U19 Men">U19 Men</option>
                    <option value="U19 Women">U19 Women</option>
                    <option value="Training">Training</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tournament</Form.Label>
                  <Form.Select value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)}>
                    <option value="">Select Tournament</option>
                    {tournaments.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Ground</Form.Label>
                  <Form.Select value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value)}>
                    <option value="">All Grounds</option>
                    {groundOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Time of Day</Form.Label>
                    <Form.Select value={selectedTimeOfDay} onChange={(e) => setSelectedTimeOfDay(e.target.value)}>
                        <option value="">All Times</option>
                        {timeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          <div className="mt-3 d-grid">
            <Button variant="success" onClick={fetchStats}>
              Generate
            </Button>
          </div>
        </div>

        {/* Results Table */}
        <div className="col-md-8">
          {loading ? (
            <div className="text-center mt-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table striped bordered hover className="mt-3">
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Average Bat 1st Score</th>
                  <th>Bat 1st Wins</th>
                  <th>Bat 2nd Wins</th>
                  <th>Total Matches</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length > 0 ? (
                  tableData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.venue}</td>
                      <td>{row.avg_score}</td>
                      <td>{row.bat1_wins}</td>
                      <td>{row.bat2_wins}</td>
                      <td>{row.total_matches}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center">No data available</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentStatsTab;
