import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Card, Form, Button, Table, Spinner } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";

const TournamentStatsTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

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
  const [selectAllCountries, setSelectAllCountries] = useState(true);

  const teamCategories = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

  useEffect(() => {
    api.get("/tournaments", { params: { team_category: teamCategory } })
      .then(res => setTournaments(res.data));
  }, [teamCategory]);

  useEffect(() => {
    if (selectedTournament && teamCategory) {
      api.get("/countries", {
        params: { team_category: teamCategory, tournament: selectedTournament },
      }).then(res => {
        setCountries(res.data);
        setSelectedCountries(res.data);
        setSelectAllCountries(true);
      });

      api.get("/venue-options", {
        params: { team_category: teamCategory, tournament: selectedTournament },
      }).then(res => {
        setGroundOptions(res.data.grounds || []);
        setTimeOptions(res.data.times || []);
      });
    }
  }, [teamCategory, selectedTournament]);

  const toggleSelection = (value, list, setList) => {
    setList(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleSelectAll = (options, selected, setSelected, setToggleFlag) => {
    if (selected.length === options.length) {
      setSelected([]);
      if (setToggleFlag) setToggleFlag(false);
    } else {
      setSelected([...options]);
      if (setToggleFlag) setToggleFlag(true);
    }
  };

  const handleCountryToggle = (country) => {
    const updated = selectedCountries.includes(country)
      ? selectedCountries.filter(c => c !== country)
      : [...selectedCountries, country];

    setSelectedCountries(updated);
    setSelectAllCountries(updated.length === countries.length);
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
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <div className="row">
          {/* Sidebar Filters */}
          <div className="col-md-3">
            <Card className={isDarkMode ? "bg-dark text-white" : ""}>
              <Card.Body>
                {/* Team Category */}
                <Form.Group className="mb-3">
                  <Form.Label><strong>Team Category</strong></Form.Label>
                  <Form.Select value={teamCategory} onChange={e => setTeamCategory(e.target.value)}>
                    {teamCategories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Tournament */}
                <Form.Group className="mb-3">
                  <Form.Label><strong>Tournament</strong></Form.Label>
                  <Form.Select value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)}>
                    <option value="">-- Select Tournament --</option>
                    {tournaments.map((t, i) => (
                      <option key={i} value={t}>{t}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Countries */}
                {selectedTournament && countries.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Countries</strong></Form.Label>
                    <Button
                      size="sm"
                      variant={selectAllCountries ? "secondary" : "outline-secondary"}
                      onClick={() =>
                        toggleSelectAll(countries, selectedCountries, setSelectedCountries, setSelectAllCountries)
                      }
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

                {/* Ground */}
                {groundOptions.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Ground</strong></Form.Label>
                    <Button
                      size="sm"
                      variant={selectedGrounds.length === groundOptions.length ? "secondary" : "outline-secondary"}
                      onClick={() => toggleSelectAll(groundOptions, selectedGrounds, setSelectedGrounds)}
                      className="mb-2"
                    >
                      {selectedGrounds.length === groundOptions.length ? "Deselect All" : "Select All"}
                    </Button>
                    <div className="form-check" style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {groundOptions.map((g, i) => (
                        <div key={i}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`ground-${i}`}
                            checked={selectedGrounds.includes(g)}
                            onChange={() => toggleSelection(g, selectedGrounds, setSelectedGrounds)}
                          />
                          <label className="form-check-label" htmlFor={`ground-${i}`}>{g}</label>
                        </div>
                      ))}
                    </div>
                  </Form.Group>
                )}

                {/* Time of Day */}
                {timeOptions.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Time of Day</strong></Form.Label>
                    <Button
                      size="sm"
                      variant={selectedTimes.length === timeOptions.length ? "secondary" : "outline-secondary"}
                      onClick={() => toggleSelectAll(timeOptions, selectedTimes, setSelectedTimes)}
                      className="mb-2"
                    >
                      {selectedTimes.length === timeOptions.length ? "Deselect All" : "Select All"}
                    </Button>
                    <div className="form-check" style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {timeOptions.map((t, i) => (
                        <div key={i}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`time-${i}`}
                            checked={selectedTimes.includes(t)}
                            onChange={() => toggleSelection(t, selectedTimes, setSelectedTimes)}
                          />
                          <label className="form-check-label" htmlFor={`time-${i}`}>{t}</label>
                        </div>
                      ))}
                    </div>
                  </Form.Group>
                )}

                <Button
                  className="w-100 mt-2"
                  onClick={fetchStats}
                  disabled={!teamCategory || !selectedTournament || selectedCountries.length === 0}
                >
                  Generate Stats
                </Button>
              </Card.Body>
            </Card>
          </div>

          {/* Table Results */}
          <div className="col-md-9">
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
              <Table striped bordered hover className={isDarkMode ? "table-dark mt-3" : "table-light mt-3"}>
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
    </div>
  );
};

export default TournamentStatsTab;
