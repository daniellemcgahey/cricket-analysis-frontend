import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { Accordion, Table, Spinner, Alert, Card, Button } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import PitchMapChart from "./PitchMapChart";
import BackButton from "../components/BackButton";
import BattingPitchMapFilters from "../components/BattingPitchMapFilters";

const IndividualBowlingTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [filters, setFilters] = useState({
    teamCategory: "Women",
    country1: "",
    country2: "",
    tournaments: [],
    selectedPhases: ["Powerplay", "Middle Overs", "Death Overs"],
    selectedBowlingArms: ["Left", "Right"],
    selectedBowlerTypes: ["Pace", "Medium", "Leg Spin", "Off Spin"],
    selectedBattingHands: ["Left", "Right"],
    selectedLengths: ["Full Toss", "Yorker", "Full", "Good", "Short"],
    allMatchesSelected: true,
    selectedMatches: [],
  });

  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [bowlingStats, setBowlingStats] = useState(null);
  const [bowlingPitchMap, setBowlingPitchMap] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (filters.country1) {
      api.get("/team-players", {
        params: {
          country_name: filters.country1,
          team_category: filters.teamCategory,
        },
      }).then((res) => {
        if (filters.teamCategory.toLowerCase() === "training") {
          const grouped = {};
          res.data.forEach((p) => {
            if (!grouped[p.name]) grouped[p.name] = [];
            grouped[p.name].push(p.id);
          });
          setPlayers(grouped);
        } else {
          setPlayers(res.data);
        }
      });
    }
  }, [filters.country1, filters.teamCategory]);

  const handleGenerate = () => {
    if (!selectedPlayer || filters.tournaments.length === 0) {
      alert("Please select a player and at least one tournament.");
      return;
    }
    setLoading(true);
    const player_ids =
    typeof selectedPlayer === "string"
      ? selectedPlayer.split(",").map(id => parseInt(id))
      : [selectedPlayer];

    api.post("/player-bowling-analysis", {
      player_ids,
      team_category: filters.teamCategory,
      tournaments: filters.tournaments,
      bowling_arm: filters.selectedBowlingArms,
      bowling_style: filters.selectedBowlerTypes,
      lengths: filters.selectedLengths,
    })
      .then((res) => {
        setBowlingStats(res.data);
        setBowlingPitchMap(res.data.pitch_map);
        setLoading(false);
      })
      .catch(() => {
        setBowlingStats(null);
        setBowlingPitchMap([]);
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
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />
        <div className="row">
          {/* Left Column: Filters and Player Selector */}
          <div className="col-md-4">
            <BattingPitchMapFilters filters={filters} setFilters={setFilters} />

            <Card className={`mt-3 ${isDarkMode ? "bg-dark text-white" : ""}`}>
              <Card.Body>
                <h5 className="fw-bold">Player Selection</h5>
                {filters.teamCategory.toLowerCase() === "training" ? (
                  <select
                    className="form-select"
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                  >
                    <option value="">Select Player</option>
                    {Object.entries(players).map(([name, ids]) => (
                      <option key={name} value={ids.join(",")}>
                        {name} ({ids.length > 1 ? `x${ids.length}` : ""})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="form-select"
                    value={String(selectedPlayer)}
                    onChange={(e) => setSelectedPlayer(parseInt(e.target.value))}
                  >
                    <option value="">Select Player</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}

                <Button
                  variant="success"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-100 mt-3"
                >
                  {loading ? <Spinner size="sm" animation="border" /> : "Generate Detailed Analysis"}
                </Button>
              </Card.Body>
            </Card>
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

export default IndividualBowlingTab;