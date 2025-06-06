import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { Accordion, Form, Button, Card, Spinner } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";

const LeaderboardFilters = ({ teamCategory, setTeamCategory, selectedTournament, setSelectedTournament, selectedCountries, setSelectedCountries, onGenerate }) => {
  const { isDarkMode } = useContext(DarkModeContext);

  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [selectAll, setSelectAll] = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const teamCategories = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

  // Fetch tournaments on load
  useEffect(() => {
    api.get("/tournaments").then(res => setTournaments(res.data));
  }, []);

  // Fetch matches and extract countries after both filters are selected
  useEffect(() => {
    if (teamCategory && selectedTournament) {
      setLoadingCountries(true);
      api.get("/matches", { params: { teamCategory } })
        .then(res => {
          const filtered = res.data.filter(m => m.tournament === selectedTournament);
          setMatches(filtered);

          const teams = new Set();
          filtered.forEach(m => {
            teams.add(m.team_a);
            teams.add(m.team_b);
          });

          const countries = Array.from(teams).sort();
          setCountryOptions(countries);
          setSelectedCountries(countries); // default to all selected
          setSelectAll(true);
          setLoadingCountries(false);
        });
    }
  }, [teamCategory, selectedTournament]);

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCountries([]);
      setSelectAll(false);
    } else {
      setSelectedCountries(countryOptions);
      setSelectAll(true);
    }
  };

  const handleCountryToggle = (country) => {
    if (selectedCountries.includes(country)) {
      const updated = selectedCountries.filter(c => c !== country);
      setSelectedCountries(updated);
      setSelectAll(false);
    } else {
      const updated = [...selectedCountries, country];
      setSelectedCountries(updated);
      if (updated.length === countryOptions.length) setSelectAll(true);
    }
  };

  return (
    <Card className={isDarkMode ? "bg-dark text-white" : ""}>
      <Card.Body>
        <Accordion alwaysOpen>
          <Accordion.Item eventKey="0">
            <Accordion.Header><h5 className="fw-bold m-0">Team Category</h5></Accordion.Header>
            <Accordion.Body>
              <Form.Select value={teamCategory} onChange={e => setTeamCategory(e.target.value)}>
                {teamCategories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header><h5 className="fw-bold m-0">Tournament</h5></Accordion.Header>
            <Accordion.Body>
              <Form.Select
                value={selectedTournament}
                onChange={e => setSelectedTournament(e.target.value)}
                disabled={tournaments.length === 0}
              >
                <option value="">-- Select Tournament --</option>
                {tournaments.map((t, i) => (
                  <option key={i} value={t}>{t}</option>
                ))}
              </Form.Select>
            </Accordion.Body>
          </Accordion.Item>

          {selectedTournament && countryOptions.length > 0 && (
            <Accordion.Item eventKey="2">
              <Accordion.Header><h5 className="fw-bold m-0">Countries</h5></Accordion.Header>
              <Accordion.Body>
                <Button
                  variant={selectAll ? "secondary" : "outline-secondary"}
                  size="sm"
                  onClick={toggleSelectAll}
                  className="mb-2"
                >
                  {selectAll ? "Deselect All" : "Select All"}
                </Button>
                {loadingCountries ? (
                  <div className="text-center py-2"><Spinner animation="border" size="sm" /></div>
                ) : (
                  <div className="form-check" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {countryOptions.map((country, i) => (
                      <div key={i}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`country-${i}`}
                          checked={selectedCountries.includes(country)}
                          onChange={() => handleCountryToggle(country)}
                        />
                        <label className="form-check-label" htmlFor={`country-${i}`}>
                          {country}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </Accordion.Body>
            </Accordion.Item>
          )}
        </Accordion>

        <div className="mt-3">
          <Button
            onClick={onGenerate}
            className="w-100"
            disabled={!teamCategory || !selectedTournament || selectedCountries.length === 0}
          >
            Generate Leaderboards
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default LeaderboardFilters;
