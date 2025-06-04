import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { Accordion, Spinner , Form } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import PressureOverLineChart from "./PressureOverLineChart";
import PhasePressureBarChart from "./PhasePressureBarChart";
import TopBottomPlayers from "./TopBottomPlayers";
import "./TabStyles.css";

const PressureTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [countries, setCountries] = useState([]);
  const [country1, setCountry1] = useState("");
  const [country2, setCountry2] = useState("");

  const [tournaments, setTournaments] = useState([]);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [selectedPhases, setSelectedPhases] = useState(["Powerplay", "Middle Overs", "Death Overs"]);

  const [matches, setMatches] = useState([]);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [selectAllMatches, setSelectAllMatches] = useState(true);
  const [teamCategory, setTeamCategory] = useState("Women");

  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  
  useEffect(() => {
    if (!teamCategory) return;

    api.get("/countries", { params: { teamCategory } })
      .then((res) => setCountries(res.data));

    api.get("/tournaments", { params: { teamCategory } })
      .then((res) => setTournaments(res.data));

    api.get("/matches", { params: { teamCategory } })
      .then((res) => {
        setMatches(res.data);
        if (selectAllMatches) {
          setSelectedMatches(res.data.map(m => m.match_id));
        }
      });
  }, [teamCategory, selectAllMatches]);


  const handleFetchPressureData = () => {
    if (!country1 || !country2 || selectedTournaments.length === 0) {
      alert("Please select both countries and at least one tournament.");
      return;
    }

    setLoading(true);

    const payload = {
      country1,
      country2,
      tournaments: selectedTournaments,
      selectedPhases,
      selectedMatches,
      allMatchesSelected: selectAllMatches,
      teamCategory: teamCategory,
    };

    api.post("/pressure-analysis", payload)
      .then((res) => {
        const flatOverPressure = {};
        const overPressure = res.data.overPressure;

        if (overPressure?.batting) {
          for (const [team, values] of Object.entries(overPressure.batting)) {
            flatOverPressure[`${team} Batting`] = values;
          }
        }

        if (overPressure?.bowling) {
          for (const [team, values] of Object.entries(overPressure.bowling)) {
            flatOverPressure[`${team} Bowling`] = values;
          }
        }

        setGraphData({
          overPressure: flatOverPressure,
          phasePressure: res.data.phasePressure,
          topBottomPlayers: res.data.topBottomPlayers,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch pressure analysis:", err);
        alert("Failed to fetch pressure data. Please check your filters.");
      })
      .finally(() => setLoading(false));
  };


  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid my-4">
        <BackButton isDarkMode={isDarkMode} />
        <h2 className="text-center fw-bold mb-4">Pressure Analysis</h2>

        <div className="row">
          {/* Accordion Filters Column */}
          <div className="col-md-4" style={{ marginLeft: "0px" }}>
            <Accordion defaultActiveKey={null} className="mb-4">
              {/* TEAM CATEGORY FILTER */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <h5 className="fw-bold m-0">Team Category</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <Form.Select
                    value={teamCategory}
                    onChange={(e) => setTeamCategory(e.target.value)}
                  >
                    {["Men", "Women", "U19 Men", "U19 Women", "Training"].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Form.Select>
                </Accordion.Body>
              </Accordion.Item>








              {/* Country Selection */}
              <Accordion.Item eventKey="1">
                <Accordion.Header><h5 className="fw-bold m-0">Country Selection</h5></Accordion.Header>
                <Accordion.Body>
                  <select className="form-select mb-3" value={country1} onChange={(e) => setCountry1(e.target.value)}>
                    <option value="">Select Country 1</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="form-select" value={country2} onChange={(e) => setCountry2(e.target.value)}>
                    <option value="">Select Country 2</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Accordion.Body>
              </Accordion.Item>

              {/* Filters */}
              <Accordion.Item eventKey="2">
                <Accordion.Header><h5 className="fw-bold m-0">Filters</h5></Accordion.Header>
                <Accordion.Body>
                  <Accordion alwaysOpen>
                    {/* Tournaments Accordion */}
                    <Accordion.Item eventKey="2-1">
                      <Accordion.Header><strong>Tournaments</strong></Accordion.Header>
                      <Accordion.Body>
                        {tournaments.map((tournament) => (
                          <div className="form-check" key={tournament}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value={tournament}
                              id={`tournament-${tournament}`}
                              checked={selectedTournaments.includes(tournament)}
                              onChange={(e) => {
                                const value = e.target.value;
                                setSelectedTournaments(prev =>
                                  prev.includes(value)
                                    ? prev.filter(t => t !== value)
                                    : [...prev, value]
                                );
                              }}
                            />
                            <label className="form-check-label" htmlFor={`tournament-${tournament}`}>
                              {tournament}
                            </label>
                          </div>
                        ))}
                      </Accordion.Body>
                    </Accordion.Item>

                    {/* Game Phases Accordion */}
                    <Accordion.Item eventKey="2-2">
                      <Accordion.Header><strong>Game Phases</strong></Accordion.Header>
                      <Accordion.Body>
                        {["Powerplay", "Middle Overs", "Death Overs"].map((phase) => (
                          <div className="form-check" key={phase}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value={phase}
                              id={`phase-${phase}`}
                              checked={selectedPhases.includes(phase)}
                              onChange={(e) => {
                                const value = e.target.value;
                                setSelectedPhases(prev =>
                                  prev.includes(value)
                                    ? prev.filter(p => p !== value)
                                    : [...prev, value]
                                );
                              }}
                            />
                            <label className="form-check-label" htmlFor={`phase-${phase}`}>
                              {phase}
                            </label>
                          </div>
                        ))}
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>

                  {/* Match Selection */}
                  <div className="form-check mt-3 mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectAllMatches}
                      onChange={() => setSelectAllMatches(prev => !prev)}
                      id="matchToggle"
                    />
                    <label className="form-check-label" htmlFor="matchToggle">Select All Matches</label>
                  </div>

                  {!selectAllMatches && (
                    <div className="mt-3">
                      <label className="form-label fw-bold">Select Matches</label>
                      <div className="dropdown border rounded p-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {matches.length === 0 && (
                          <div className="text-muted">No matches available</div>
                        )}
                        {matches.map((m) => {
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
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>


            <button className="btn btn-primary w-100" onClick={handleFetchPressureData}>
              {loading ? <Spinner size="sm" animation="border" /> : "Generate Analysis"}
            </button>
          </div>

          {/* Graphs Column */}
          <div className="col-md-8">
            {graphData ? (
              <Accordion defaultActiveKey="0" alwaysOpen>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    <h6 className="fw-bold m-0">Average Pressure per Over</h6>
                  </Accordion.Header>
                  <Accordion.Body>
                    <PressureOverLineChart data={graphData.overPressure} />
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="1">
                  <Accordion.Header>
                    <h6 className="fw-bold m-0">Net Pressure per Phase</h6>
                  </Accordion.Header>
                  <Accordion.Body>
                    <PhasePressureBarChart data={graphData.phasePressure} />
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2">
                  <Accordion.Header>
                    <h6 className="fw-bold m-0">Top/Bottom Player Pressure Impact</h6>
                  </Accordion.Header>
                  <Accordion.Body>
                    <TopBottomPlayers data={graphData.topBottomPlayers} />
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            ) : (
              <div className="alert alert-info">Generate analysis to view pressure comparisons.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PressureTab;
