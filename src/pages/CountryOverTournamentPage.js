// src/pages/CountryComparisonPage.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../api"; // ✅ replaces axios
import "bootstrap/dist/css/bootstrap.min.css";

import ComparisonTable from "./ComparisonTable";
import StatSelector from "./StatSelector";
import AdvancedFilters from "./AdvancedFilters";
import DarkModeContext from '../DarkModeContext';
import { Accordion } from "react-bootstrap";

const CountryOverTournamentPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);

  const [country, setCountry1] = useState("");
  const [countries, setCountries] = useState([]);
  const [teamCategory, setTeamCategory] = useState("Women");

  const [tournamentOptions, setTournamentOptions] = useState([]);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [tournament1, tournament2] = selectedTournaments;
  const [selectedPhases, setSelectedPhases] = useState(["Powerplay", "Middle Overs", "Death Overs"]);
  const [selectedBowlerTypes, setSelectedBowlerTypes] = useState(["Pace", "Medium", "Leg Spin" ,"Off Spin"]);
  const [selectedBowlingArms, setSelectedBowlingArms] = useState(["Left", "Right"]);

  const [selectedStats, setSelectedStats] = useState([]);
  const [statsByTournament, setStatsByTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matchOptions, setMatchOptions] = useState([]);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [selectAllMatches, setSelectAllMatches] = useState(true);

  useEffect(() => {
    if (!teamCategory) return;

    api.get("/countries", {
      params: { teamCategory }
    }).then((res) => setCountries(res.data));

    api.get("/tournaments", {
      params: { teamCategory }
    }).then((res) => {
      setTournamentOptions(res.data);
      setSelectedTournaments(res.data);
    });
  }, [teamCategory]);

  useEffect(() => {
    if (!country || !selectedTournaments.length) {
      setMatchOptions([]);
      setSelectedMatches([]);
      setSelectAllMatches(true);
      return;
    }

    api.get("/matches", {
      params: {
        country_name: country,
        tournaments: selectedTournaments,
        teamCategory,
      }
    })
    .then(res => {
      setMatchOptions(res.data);
      setSelectAllMatches(true);
      // If selectAllMatches is true, select all match IDs automatically
      setSelectedMatches(res.data.map(m => m.match_id));
    })
    .catch(() => {
      setMatchOptions([]);
      setSelectedMatches([]);
      setSelectAllMatches(true);
    });
  }, [country, selectedTournaments, teamCategory]);



  const handleFetchStats = async () => {
    if (!selectedStats.length) {
      setStatsByTournament(null);
      return;
    }

    const payload = {
      country,
      tournaments: selectedTournaments,
      selected_stats: selectedStats,
      selected_phases: selectedPhases,
      bowler_type: selectedBowlerTypes,
      bowling_arm: selectedBowlingArms,
      teamCategory,
      selectedMatches,
    };

    try {
      setLoading(true);
      const res = await api.post("/compare_over_tournament", payload);
      setStatsByTournament(res.data.stats_by_tournament);
    } catch (err) {
      console.error("Error fetching stats:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };


  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid my-4">
        <div className="row">
          {/* Left Column */}
          <div className="col-md-4" style={{ marginLeft: "0px" }}>
            <Accordion defaultActiveKey={null} className="mb-4">
              <Accordion.Item eventKey="-1">
                <Accordion.Header>
                  <h5 className="fw-bold m-0 display-7">Team Category</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <select
                    className="form-select"
                    value={teamCategory}
                    onChange={(e) => setTeamCategory(e.target.value)}
                  >
                    {["Men", "Women", "U19 Men", "U19 Women", "Training"].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </Accordion.Body>
              </Accordion.Item>
              {/* Country Selection Accordion */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <h5 className="fw-bold m-0 display-7">Select Country</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <select className="form-select mb-3" value={country} onChange={(e) => setCountry1(e.target.value)}>
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Accordion.Body>
              </Accordion.Item>
  
              {/* Filters Accordion */}
              <Accordion.Item eventKey="1">
                <Accordion.Header>
                  <h5 className="fw-bold m-0 display-7">Filters</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <AdvancedFilters
                    tournamentOptions={tournamentOptions}
                    onTournamentChange={setSelectedTournaments}
                    onPhaseChange={setSelectedPhases}
                    onBowlerTypeChange={setSelectedBowlerTypes}
                    onBowlingArmChange={setSelectedBowlingArms}
                  />
                </Accordion.Body>
              </Accordion.Item>
  
              {/* Stats Accordion */}
              <Accordion.Item eventKey="2">
                <Accordion.Header>
                  <h5 className="fw-bold m-0 display-7">Statistic Selection</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <StatSelector onSelectionChange={setSelectedStats} />
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            {/* Match Selection */}
            <div className="form-check mt-3 mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                checked={selectAllMatches}
                id="matchToggle"
                onChange={() => {
                  setSelectAllMatches(prev => {
                    const newVal = !prev;
                    if (newVal) {
                      // Select all matches
                      setSelectedMatches(matchOptions.map(m => m.match_id));
                    } else {
                      // Clear all matches
                      setSelectedMatches([]);
                    }
                    return newVal;
                  });
                }}
              />
              <label className="form-check-label" htmlFor="matchToggle">
                Select All Matches
              </label>
            </div>

            {!selectAllMatches && (
              <div className="mt-3">
                <label className="form-label fw-bold">Select Matches</label>
                <div
                  className="dropdown border rounded p-2"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  {matchOptions.length === 0 && (
                    <div className="text-muted">No matches available</div>
                  )}
                  {matchOptions.map(m => {
                    const matchLabel = `${m.tournament}: ${m.team_a} vs ${m.team_b} (${m.match_date})`;
                    return (
                      <div className="form-check" key={m.match_id}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`match-${m.match_id}`}
                          value={m.match_id}
                          checked={selectedMatches.includes(m.match_id)}
                          onChange={() => {
                            setSelectedMatches(prev =>
                              prev.includes(m.match_id)
                                ? prev.filter(id => id !== m.match_id)
                                : [...prev, m.match_id]
                            );
                          }}
                        />
                        <label className="form-check-label" htmlFor={`match-${m.match_id}`}>
                          {matchLabel}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


  
            {/* Fetch Button */}
            <button className="btn btn-primary w-100 mt-3" onClick={handleFetchStats}>
              Fetch Stats
            </button>
          </div>
  
          {/* Comparison Output */}
          <div className="col-md-8">
            {loading && <p>Loading...</p>}
            {!statsByTournament ? (
              <div className="alert alert-info">Comparison data will appear here.</div>
            ) : selectedTournaments.length === 2 ? (
              <ComparisonTable
                data={{
                  country1: selectedTournaments[0],
                  country2: selectedTournaments[1],
                  selected_stats: selectedStats,
                  country1_stats: statsByTournament[selectedTournaments[0]] || {},
                  country2_stats: statsByTournament[selectedTournaments[1]] || {},
                  tournament1: selectedTournaments[0],
                  tournament2: selectedTournaments[1],
                }}
                isDarkMode={isDarkMode}
              />
            ) : selectedTournaments.length === 1 ? (
              <ComparisonTable
                data={{
                  country1: selectedTournaments[0],
                  country2: null,
                  selected_stats: selectedStats,
                  country1_stats: statsByTournament[selectedTournaments[0]] || {},
                  country2_stats: {},
                  tournament1: selectedTournaments[0],
                  tournament2: null,
                }}
                isDarkMode={isDarkMode}
              />
            ) : (
              <div className="alert alert-info">Comparison data will appear here.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CountryOverTournamentPage;
