import React, { useState, useEffect } from "react";
import api from "../api";
import { Accordion, Form, Button, Table, Spinner } from "react-bootstrap";

const TournamentStatsTab = () => {
  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [groundOptions, setGroundOptions] = useState([]);
  const [timeOptions, setTimeOptions] = useState([]);

  const [selectedTournament, setSelectedTournament] = useState("");
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedGrounds, setSelectedGrounds] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      const res = await api.get("/tournaments", {
        params: { team_category: teamCategory },
      });
      setTournaments(res.data);
    };
    fetchTournaments();
  }, [teamCategory]);

  // Fetch countries only when tournament and category selected
  useEffect(() => {
    const fetchCountries = async () => {
      if (!selectedTournament || !teamCategory) return;
      const res = await api.get("/countries", {
        params: { team_category: teamCategory, tournament: selectedTournament },
      });
      setCountries(res.data);
    };
    fetchCountries();
  }, [teamCategory, selectedTournament]);

  // Fetch venue options
  useEffect(() => {
    const fetchVenues = async () => {
      if (!selectedTournament) return;
      const res = await api.get("/venue-options", {
        params: {
          team_category: teamCategory,
          tournament: selectedTournament,
        },
      });
      setGroundOptions(res.data.grounds || []);
      setTimeOptions(res.data.times || []);
    };
    fetchVenues();
  }, [teamCategory, selectedTournament]);

  const toggleSelection = (value, list, setList) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleSelectAll = (allOptions, selected, setSelected) => {
    if (selected.length === allOptions.length) {
      setSelected([]);
    } else {
      setSelected([...allOptions]);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    const res = await api.post("/tournament-stats", {
      team_category: teamCategory,
      tournament: selectedTournament,
      country: selectedCountries,
      venue: selectedGrounds,
      time_of_day: selectedTimes,
    });
    setTableData(res.data);
    setLoading(false);
  };

  return (
    <div className="container mt-3">
      <div className="row">
        {/* Filters */}
        <div className="col-md-4">
          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Filters</Accordion.Header>
              <Accordion.Body>
                {/* Team Category */}
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

                {/* Tournament */}
                <Form.Group className="mb-3">
                  <Form.Label>Tournament</Form.Label>
                  <Form.Select value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)}>
                    <option value="">Select Tournament</option>
                    {tournaments.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Country */}
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Check
                    type="checkbox"
                    label="Select All"
                    checked={selectedCountries.length === countries.length}
                    onChange={() => toggleSelectAll(countries, selectedCountries, setSelectedCountries)}
                  />
                  {countries.map((c) => (
                    <Form.Check
                      key={c}
                      type="checkbox"
                      label={c}
                      checked={selectedCountries.includes(c)}
                      onChange={() => toggleSelection(c, selectedCountries, setSelectedCountries)}
                    />
                  ))}
                </Form.Group>

                {/* Ground */}
                <Form.Group className="mb-3">
                  <Form.Label>Ground</Form.Label>
                  <Form.Check
                    type="checkbox"
                    label="Select All"
                    checked={selectedGrounds.length === groundOptions.length}
                    onChange={() => toggleSelectAll(groundOptions, selectedGrounds, setSelectedGrounds)}
                  />
                  {groundOptions.map((g) => (
                    <Form.Check
                      key={g}
                      type="checkbox"
                      label={g}
                      checked={selectedGrounds.includes(g)}
                      onChange={() => toggleSelection(g, selectedGrounds, setSelectedGrounds)}
                    />
                  ))}
                </Form.Group>

                {/* Time of Day */}
                <Form.Group className="mb-3">
                  <Form.Label>Time of Day</Form.Label>
                  <Form.Check
                    type="checkbox"
                    label="Select All"
                    checked={selectedTimes.length === timeOptions.length}
                    onChange={() => toggleSelectAll(timeOptions, selectedTimes, setSelectedTimes)}
                  />
                  {timeOptions.map((t) => (
                    <Form.Check
                      key={t}
                      type="checkbox"
                      label={t}
                      checked={selectedTimes.includes(t)}
                      onChange={() => toggleSelection(t, selectedTimes, setSelectedTimes)}
                    />
                  ))}
                </Form.Group>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          {/* Generate Button */}
          <div className="mt-3 d-grid">
            <Button variant="success" onClick={fetchStats}>
              Generate
            </Button>
          </div>
        </div>

        {/* Table */}
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
