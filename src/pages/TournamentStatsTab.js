import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Card, Form, Button, Table, Spinner } from "react-bootstrap";
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

  const [tournamentTable, setTournamentTable] = useState([]);

  const teamCategories = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

  // Load tournaments when team category changes
  useEffect(() => {
    api.get("/tournaments", { params: { team_category: teamCategory } })
      .then(res => setTournaments(res.data));
  }, [teamCategory]);

  // Load countries and venues when both teamCategory and tournament are selected
    useEffect(() => {
    if (teamCategory && selectedTournament) {
        console.log("📤 Fetching matches for:", teamCategory, selectedTournament);

        // 🔎 COUNTRY EXTRACTION FROM MATCHES
        api.get("/matches", { params: { teamCategory } }).then(res => {
        console.log("✅ /matches response:", res.data);

        const filtered = res.data.filter(m => m.tournament === selectedTournament);
        const teams = new Set();
        filtered.forEach(m => {
            teams.add(m.team_a); // Ensure these are country names, not IDs
            teams.add(m.team_b);
        });

        const countryList = Array.from(teams).sort();
        console.log("🟢 Filtered countries:", countryList);

        setCountries(countryList);
        setSelectedCountries(countryList);
        setSelectAllCountries(true);
        });

        // 🔎 VENUE OPTIONS
        api.get("/venue-options", {
        params: { team_category: teamCategory, tournament: selectedTournament }
        }).then(res => {
        console.log("✅ /venue-options response:", res.data);

        setGroundOptions(res.data.grounds || []);
        setTimeOptions(res.data.times || []);
        setSelectedGrounds(res.data.grounds || []);
        setSelectedTimes(res.data.times || []);
        });
        // Fetch standings
        api.post("/tournament-standings", {
          team_category: teamCategory,
          tournament: selectedTournament,
        }).then(res => {
          setTournamentTable(res.data);
        }).catch(err => {
          console.error("❌ Error fetching tournament standings:", err);
          setTournamentTable([]);
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
    console.log("📤 Sending to /tournament-stats:", {
        team_category: teamCategory,
        tournament: selectedTournament,
        country: selectedCountries,
        venue: selectedGrounds,
        time_of_day: selectedTimes,
    });

    try {
        const res = await api.post("/tournament-stats", {
        team_category: teamCategory,
        tournament: selectedTournament,
        country: selectedCountries,
        venue: selectedGrounds,
        time_of_day: selectedTimes,
        });

        console.log("✅ /tournament-stats response:", res.data);

        setTableData(res.data);
    } catch (err) {
        console.error("❌ Error fetching tournament stats:", err);
        setTableData([]);
    } finally {
        setLoading(false);
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

                {/* Grounds */}
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
                  <div className="form-check" style={{ maxHeight: "250px", overflowY: "auto" }}>
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

                {/* Time of Day */}
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
                  <div className="form-check" style={{ maxHeight: "250px", overflowY: "auto" }}>
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

          <div className="col-md-9">
            {/* 🏆 Tournament Table */}
            {selectedTournament && tournamentTable.length > 0 && (
              <div className="mb-4">
                <Table striped bordered hover className={isDarkMode ? "table-dark" : "table-light"}>
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Games Played</th>
                      <th>Wins</th>
                      <th>Losses</th>
                      <th>No Results</th>
                      <th>Points</th>
                      <th>NRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournamentTable.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.team}</td>
                        <td>{row.played}</td>
                        <td>{row.wins}</td>
                        <td>{row.losses}</td>
                        <td>{row.no_results}</td>
                        <td>{row.points}</td>
                        <td>{row.nrr?.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* 📊 Ground/Time Accordion */}
            <div className="accordion" id="accordionGroundTime">
              <div className="accordion-item">
                <h2 className="accordion-header" id="headingOne">
                  <button
                    className={`accordion-button ${!isDarkMode ? "" : "bg-dark text-white"}`}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseGroundTime"
                    aria-expanded="true"
                    aria-controls="collapseGroundTime"
                  >
                    Ground & Time Analysis
                  </button>
                </h2>
                <div id="collapseGroundTime" className="accordion-collapse collapse show" aria-labelledby="headingOne">
                  <div className="accordion-body">
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
          </div>

        </div>
      </div>
    </div>
  );
};

export default TournamentStatsTab;
