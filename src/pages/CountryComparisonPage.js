// src/pages/CountryComparisonPage.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import "bootstrap/dist/css/bootstrap.min.css";

import ComparisonTable from "./ComparisonTable";
import StatSelector from "./StatSelector";
import AdvancedFilters from "./AdvancedFilters";
import DarkModeContext from '../DarkModeContext';
import { Accordion } from "react-bootstrap";



const CountryComparisonPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);  // ✅ Global dark mode

  // Basic filter state for countries
  const [country1, setCountry1] = useState("");
  const [country2, setCountry2] = useState("");
  const [countries, setCountries] = useState([]);
  const [teamCategory, setTeamCategory] = useState("Women");

  // Advanced Filters
  const [tournamentOptions, setTournamentOptions] = useState([]);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [selectedPhases, setSelectedPhases] = useState(["Powerplay", "Middle Overs", "Death Overs"]);
  const [selectedBowlerTypes, setSelectedBowlerTypes] = useState(["Pace", "Medium", "Spin"]);
  const [selectedBowlingArms, setSelectedBowlingArms] = useState(["Left", "Right"]);

  // Stats to display
  const [selectedStats, setSelectedStats] = useState([]);

  // Backend response
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load countries and tournaments on mount
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

  const handleFetchStats = async () => {
    if (!selectedStats.length) {
      setComparisonData(null); // Reset the data shown
      return;
    }

    const payload = {
      country1,
      country2,
      tournaments: selectedTournaments,
      selected_stats: selectedStats,
      selected_phases: selectedPhases,
      bowler_type: selectedBowlerTypes,
      bowling_arm: selectedBowlingArms,
      teamCategory,
    };

    try {
      setLoading(true);
      const res = await api.post("/compare", payload);
      setComparisonData(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container my-4">
        <div className="row">
          {/* Left Column */}
          <div className="col-md-4">
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
                    {["Men", "Women", "U19 Men", "U19 Women"].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </Accordion.Body>
              </Accordion.Item>




              {/* Country Selection Accordion */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <h5 className="fw-bold m-0 display-7">Country Selection</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <select className="form-select mb-3" value={country1} onChange={(e) => setCountry1(e.target.value)}>
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="form-select" value={country2} onChange={(e) => setCountry2(e.target.value)}>
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
  
            {/* Fetch Button */}
            <button className="btn btn-primary w-100 mt-3" onClick={handleFetchStats}>
              Fetch Stats
            </button>
          </div>
  
          {/* Right Column */}
          <div className="col-md-8">
            {loading && <p>Loading...</p>}
            {comparisonData ? (
              <ComparisonTable data={comparisonData} isDarkMode={isDarkMode} tournament1={selectedTournaments[0] || ""} />
            ) : (
              <div className="alert alert-info">Comparison data will appear here.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
 
};

export default CountryComparisonPage;
