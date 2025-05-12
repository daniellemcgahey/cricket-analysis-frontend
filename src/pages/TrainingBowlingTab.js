import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Form, Accordion, Table, Spinner, Alert } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import PitchMapChart from "./PitchMapChart";
import BackButton from "../components/BackButton";

const TrainingBowlingTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [bowlingStats, setBowlingStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bowlingPitchMap, setBowlingPitchMap] = useState([]);


  useEffect(() => {
    axios.get("http://localhost:8000/countries", { params: { teamCategory } })
      .then((res) => setCountries(res.data));
    axios.get("http://localhost:8000/tournaments", { params: { teamCategory } })
      .then((res) => setTournaments(res.data));
  }, [teamCategory]);

  useEffect(() => {
    if (selectedCountry) {
      axios.get("http://localhost:8000/team-players", {
        params: { country_name: selectedCountry, team_category: teamCategory }
      }).then((res) => setPlayers(res.data));
    }
  }, [selectedCountry, teamCategory]);

  const handleGenerate = () => {
    if (!selectedPlayer || selectedTournaments.length === 0) {
      alert("Please select a player and at least one tournament.");
      return;
    }
    setLoading(true);
    axios.post("http://localhost:8000/player-bowling-analysis", {
      player_id: selectedPlayer,
      tournaments: selectedTournaments,
      team_category: teamCategory,
    }).then((res) => {
      setBowlingStats(res.data);
      setBowlingPitchMap(res.data.pitch_map); 
      setLoading(false);
    }).catch(() => {
      setBowlingStats(null);
      setBowlingPitchMap(null);
      setLoading(false);
    });
  };

  const renderTable = (title, data, headers, rows, totalRow = null) => (
    <>
      <h5 className="fw-bold mt-4">{title}</h5>
      {data?.length > 0 ? (
      <div style={{ overflowX: "auto" }}>
        <Table striped bordered hover variant={isDarkMode ? "dark" : "light"}>
            <thead className="table-secondary text-center">
            <tr>
              {headers.map((h, idx) => <th key={idx}>{h}</th>)}
            </tr>
          </thead>
          <tbody className="text-center">
            {data.map((row, idx) => (
              <tr key={idx}>{rows(row)}</tr>
            ))}
            {totalRow && (
              <tr className="fw-bold table-dark text-center">
                {totalRow()}
              </tr>
            )}
          </tbody>
          </Table>
        </div>
      ) : (
        <Alert variant="info">No data available</Alert>
      )}
    </>
  );
  

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container py-4">
        <BackButton isDarkMode={isDarkMode} />

        <div className="row">
        <div className="col-md-3">
            <Accordion defaultActiveKey={"0"} className="mb-4">
              <Accordion.Item eventKey="0">
                <Accordion.Header>Filters</Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Team Category</Form.Label>
                    <Form.Select value={teamCategory} onChange={(e) => setTeamCategory(e.target.value)}>
                      {["Men", "Women", "U19 Men", "U19 Women"].map(cat => (
                        <option key={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Form.Select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                      <option value="">Select Country</option>
                      {countries.map(c => <option key={c}>{c}</option>)}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Player</Form.Label>
                    <Form.Select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
                      <option value="">Select Player</option>
                      {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Tournaments</Form.Label>
                    <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
                      {tournaments.map(t => (
                        <Form.Check
                          key={t}
                          type="checkbox"
                          label={t}
                          value={t}
                          checked={selectedTournaments.includes(t)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedTournaments(prev =>
                              prev.includes(val)
                                ? prev.filter(tour => tour !== val)
                                : [...prev, val]
                            );
                          }}
                        />
                      ))}
                    </div>
                  </Form.Group>

                  <button className="btn btn-primary w-100" onClick={handleGenerate}>
                    {loading ? <Spinner size="sm" animation="border" /> : "Generate Analysis"}
                  </button>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>

          <div className="col-md-8">
            {loading ? (
                <Spinner animation="border" />
            ) : bowlingStats ? (
                <Accordion
                defaultActiveKey="0"
                alwaysOpen
                className={`mt-4 ${isDarkMode ? "bg-dark text-white" : "bg-light text-dark"}`}
                >
                <Accordion.Item eventKey="0" className={isDarkMode ? "bg-dark text-white" : ""}>
                    <Accordion.Header>Overall Bowling Stats</Accordion.Header>
                    <Accordion.Body>
                    {renderTable(
                        "Overall Bowling Stats",
                        bowlingStats.overall,
                        ["Tournament", "Innings", "Overs", "Runs", "Wickets", "Econ", "Avg", "SR", "Real Econ", "Real SR", "Best", "Dot Balls", "Wides", "No Balls"],
                        (row) => [
                        <td>{row.tournament_name}</td>,
                        <td>{row.innings}</td>,
                        <td>{row.overs}</td>,
                        <td>{row.runs}</td>,
                        <td>{row.wickets}</td>,
                        <td>{row.econ?.toFixed(2)}</td>,
                          <td>{row.avg !== "–" ? row.avg.toFixed(2) : "–"}</td>,
                          <td>{row.sr !== "–" ? row.sr.toFixed(2) : "–"}</td>,
                          <td>
                            {row.overs > 0 && row.expected_runs !== undefined
                              ? (row.expected_runs / row.overs).toFixed(2)
                              : "–"}
                          </td>,
                          <td>
                            {row.expected_wicket !== undefined && (row.expected_wicket + row.wickets) > 0
                              ? (row.balls / (row.expected_wicket + row.wickets)).toFixed(2)
                              : "–"}
                          </td>,

                        <td>{row.best}</td>,
                        <td>{row.dots}</td>,
                        <td>{row.wides}</td>,
                        <td>{row.no_balls}</td>
                        ],
                        () => {
                        const balls = bowlingStats.overall.reduce((a, b) => a + b.balls, 0);
                        const overs = `${Math.floor(balls / 6)}.${balls % 6}`;
                        const runs = bowlingStats.overall.reduce((a, b) => a + b.runs, 0);
                        const wickets = bowlingStats.overall.reduce((a, b) => a + b.wickets, 0);
                        const econ = balls ? (runs / (balls / 6)).toFixed(2) : "–";
                        const expectedRuns = bowlingStats.overall.reduce((a, b) => a + (b.expected_runs ?? 0), 0);
                        const expectedWickets = bowlingStats.overall.reduce((a, b) => a + (b.expected_wicket ?? 0), 0);
                        const combinedExpectedWickets = wickets + expectedWickets;

                        const expEcon = balls ? (expectedRuns / (balls / 6)).toFixed(2) : "–";
                        const expSR = combinedExpectedWickets > 0 ? (balls / combinedExpectedWickets).toFixed(2) : "–";

                        const avg = wickets ? (runs / wickets).toFixed(2) : "–";
                        const sr = wickets ? (balls / wickets).toFixed(2) : "–";
                        const dots = bowlingStats.overall.reduce((a, b) => a + b.dots, 0);
                        const wides = bowlingStats.overall.reduce((a, b) => a + b.wides, 0);
                        const noBalls = bowlingStats.overall.reduce((a, b) => a + b.no_balls, 0);
                        const best = (() => {
                            const figures = bowlingStats.overall.map(r => r.best).filter(Boolean);
                            if (figures.length === 0) return "–";
                            return figures.sort((a, b) => {
                            const [wA, rA] = a.split("-").map(Number);
                            const [wB, rB] = b.split("-").map(Number);
                            return wB - wA || rA - rB;
                            })[0];
                        })();

                        return [
                            <td>Total</td>,
                            <td>{bowlingStats.overall.reduce((a, b) => a + b.innings, 0)}</td>,
                            <td>{overs}</td>,
                            <td>{runs}</td>,
                            <td>{wickets}</td>,
                            <td>{econ}</td>,
                            <td>{avg}</td>,
                            <td>{sr}</td>,
                            <td>{expEcon}</td>,
                            <td>{expSR}</td>,
                            <td>{best}</td>,
                            <td>{dots}</td>,
                            <td>{wides}</td>,
                            <td>{noBalls}</td>
                        ];
                        }
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="1" className={isDarkMode ? "bg-dark text-white" : ""}>
                    <Accordion.Header>Best Bowling Performances</Accordion.Header>
                    <Accordion.Body>
                    {renderTable(
                        "Best Bowling Performances",
                        bowlingStats.best,
                        ["Overs", "Wickets", "Runs", "Date", "Tournament", "Opponent"],
                        (row) => [
                        <td>{row.overs}</td>,
                        <td>{row.wickets}</td>,
                        <td>{row.runs_conceded}</td>,
                        <td>{new Date(row.match_date).toLocaleDateString()}</td>,
                        <td>{row.tournament_name}</td>,
                        <td>{row.opponent}</td>
                        ]
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2" className={isDarkMode ? "bg-dark text-white" : ""}>
                    <Accordion.Header>Bowling by Phase</Accordion.Header>
                    <Accordion.Body>
                    {renderTable(
                        "Bowling by Phase",
                        Object.entries(bowlingStats.phase || {}).map(([phase, stats]) => ({
                        phase,
                        ...stats
                        })),
                        ["Phase", "Balls", "Runs", "Wickets", "Economy", "Strike Rate", "Average"],
                        (row) => {
                        const econ = row.balls > 0 ? (row.runs / (row.balls / 6)).toFixed(2) : "–";
                        const sr = row.wickets > 0 ? (row.balls / row.wickets).toFixed(1) : "–";
                        const avg = row.wickets > 0 ? (row.runs / row.wickets).toFixed(1) : "–";
                        return [
                            <td>{row.phase}</td>,
                            <td>{row.balls}</td>,
                            <td>{row.runs}</td>,
                            <td>{row.wickets}</td>,
                            <td>{econ}</td>,
                            <td>{sr}</td>,
                            <td>{avg}</td>
                        ];
                        }
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="3" className={isDarkMode ? "bg-dark text-white" : ""}>
                    <Accordion.Header>Bowling by Spell Over</Accordion.Header>
                    <Accordion.Body>
                    {renderTable(
                        "Bowling by Spell Over",
                        bowlingStats.by_spell_position,
                        ["Spell Over", "Overs", "Runs", "Wickets", "Econ", "Strike Rate", "Average"],
                        (row) => [
                        <td>{row.spell_over}</td>,
                        <td>{row.overs}</td>,
                        <td>{row.runs}</td>,
                        <td>{row.wickets}</td>,
                        <td>{row.economy}</td>,
                        <td>{row.strike_rate}</td>,
                        <td>{row.average}</td>
                        ]
                    )}
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="4" className={isDarkMode ? "bg-dark text-white" : ""}>
                <Accordion.Header>Pitch Map</Accordion.Header>
                <Accordion.Body>
                    {bowlingPitchMap?.length > 0 ? (
                    <PitchMapChart data={bowlingPitchMap} viewMode="Dots" />
                    ) : (
                    <Alert variant="info">No pitch map data available.</Alert>
                    )}
                </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="5" className={isDarkMode ? "bg-dark text-white" : ""}>
                <Accordion.Header>Actual vs Expected Performance</Accordion.Header>
                <Accordion.Body>
                  {renderTable(
                    "Actual vs Expected Performance",
                    bowlingStats.overall,
                    ["Tournament", "Runs", "Exp Runs", "Wickets", "Exp Wkts", "Chances", "Econ", "Real Econ", "SR", "Real SR"],
                    (row) => {
                      const balls = row.balls;
                      const overs = balls / 6;
                      const runs = row.runs;
                      const wickets = row.wickets;
                      const expectedWicketsOnly = row.expected_wicket ?? 0;
                      const expectedWickets = wickets + expectedWicketsOnly;
                      const expectedRuns = Math.round(row.expected_runs ?? 0);

                      // 👇 Logic for counting distinct chances
                      const extraChances = expectedWicketsOnly % 1 > 0 ? 1 : 0;
                      const chances = wickets + Math.floor(expectedWicketsOnly) + extraChances;

                      const econ = overs > 0 ? (runs / overs).toFixed(2) : "–";
                      const realEcon = overs > 0 ? (expectedRuns / overs).toFixed(2) : "–";

                      const sr = wickets > 0 ? (balls / wickets).toFixed(1) : "–";
                      const realSR = chances > 0 ? (balls / expectedWickets).toFixed(1) : "–";

                      return [
                        <td>{row.tournament_name}</td>,
                        <td>{runs}</td>,
                        <td>{expectedRuns}</td>,
                        <td>{wickets}</td>,
                        <td>{expectedWickets.toFixed(1)}</td>,
                        <td>{chances}</td>,
                        <td>{econ}</td>,
                        <td>{realEcon}</td>,
                        <td>{sr}</td>,
                        <td>{realSR}</td>
                      ];
                    }
                  )}
                </Accordion.Body>
              </Accordion.Item>

                </Accordion>
            ) : (
                <Alert variant="info">Please generate a report to view stats.</Alert>
            )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default TrainingBowlingTab;