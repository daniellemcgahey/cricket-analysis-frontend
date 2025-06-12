import React, { useEffect, useState, useContext , useRef} from "react";
import api from "../api";
import { Accordion, Spinner, Form, Alert } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import BattingBowlingToggle from "../components/BattingBowlingToggle";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const TrendsTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const [teamCategory, setTeamCategory] = useState("Women");
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const historyChartRef = useRef(null);
  const intentOverChartRef = useRef(null);
  const matchTrendChartRef = useRef(null);
  const dismissalChartRef = useRef(null);
  const bowlingHistoryRef = useRef(null);
  const bowlingConsistencyRef = useRef(null);
  const bowlingDismissalsRef = useRef(null);
  const [trendMode, setTrendMode] = useState("Batting");
  
  useEffect(() => {
    api.get("/countries", { params: { teamCategory } })
      .then(res => setCountries(res.data))
      .catch(err => console.error("❌ Error fetching countries", err));

    api.get("/tournaments", { params: { teamCategory } })
      .then(res => setTournaments(res.data))
      .catch(err => console.error("❌ Error fetching tournaments", err));
  }, [teamCategory]);

  
    
  useEffect(() => {
    if (selectedCountry) {
      api.get("/team-players", {
        params: { country_name: selectedCountry, team_category: teamCategory }
      }).then(res => setPlayers(res.data));
    }
  }, [selectedCountry, teamCategory]);

  
  const handleGenerate = () => {
    if (!selectedPlayer || selectedTournaments.length === 0) {
      alert("Please select a player and at least one tournament.");
      return;
    }
  
    setLoading(true);
  
        const endpoint = trendMode === "Batting"
    ? "player-trend-analysis"
    : "player-bowling-trend-analysis";

    api.post(`/${endpoint}`, {
      player_id: selectedPlayer,
      tournaments: selectedTournaments,
      team_category: teamCategory,
    }).then(res => {
      console.log("📊 Trend Data:", res.data);
      setTrendData(res.data);
      setLoading(false);
    });

  }
 
  const renderGroupedBarChart = () => {
    if (trendMode !== "Batting" || !trendData?.match_trends || !trendData?.batting_history) {
        return <Alert variant="info">No batting history data available.</Alert>;
      }
    const labels = trendData.match_trends.map(d => {
        const opp = d.opponent ? d.opponent.slice(0, 3).toUpperCase() : "???";
        return `vs ${opp}`;
      });
    const runs = trendData.batting_history.map(d => d.runs);
    const sr = trendData.batting_history.map(d => d.sr);
    const intent = trendData.batting_history.map(d => d.intent);
  
    const maxRuns = Math.max(20, ...runs);
    const maxSR = Math.max(150, ...sr);
  
    const data = {
      labels,
      datasets: [
        {
          label: "Runs",
          data: runs,
          backgroundColor: "#4caf50",
          yAxisID: "y",
        },
        {
          label: "Strike Rate",
          data: sr,
          backgroundColor: "#2196f3",
          yAxisID: "y1",
        },
        {
          label: "Intent",
          data: intent,
          backgroundColor: "#ff9800",
          yAxisID: "y2",
        },
      ],
    };
  
    const options = {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Batting History (Runs, SR, Intent)" },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: maxRuns,
          min: 0, // ensure explicit zero start
          title: {
            display: true,
            text: "Runs",
            color: isDarkMode ? "#ffffff" : "#000000",
          },
          ticks: {
            color: isDarkMode ? "#ffffff" : "#000000",
          },
        },
        y1: {
          position: "right",
          beginAtZero: true,
          min: 0,
          max: maxSR,
          title: {
            display: true,
            text: "Strike Rate",
            color: isDarkMode ? "#ffffff" : "#000000",
          },
          ticks: {
            color: isDarkMode ? "#ffffff" : "#000000",
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        y2: {
          position: "right",
          beginAtZero: true,
          min: 0,
          max: 10,
          title: {
            display: true,
            text: "Intent",
            color: isDarkMode ? "#ffffff" : "#000000",
          },
          ticks: {
            color: isDarkMode ? "#ffffff" : "#000000",
          },
          grid: {
            drawOnChartArea: false,
          },
          offset: false, // 🔥 disables offsetting the axis, aligns 0 with others
        },
        x: {
          ticks: {
            color: isDarkMode ? "#ffffff" : "#000000",
          },
        },
      
      },
    };
  
    return <Bar ref={historyChartRef} data={data} options={options} />;
  };
    
  const renderIntentByOverChart = () => {
    if (!trendData.intent_by_over) return null;
  
    const overs = Array.from({ length: 20 }, (_, i) => i + 1); // 1–20 overs
    const intentMap = new Map(
      trendData.intent_by_over.map(d => [d.over + 1, d.intent]) // 👈 shift +1 for correct display
    );
  
    const labels = overs.map(o => `Over ${o}`);
    const data = overs.map(o => intentMap.get(o) ?? null);
  
    const chartData = {
      labels,
      datasets: [
        {
          label: "Average Intent",
          data,
          fill: false,
          borderColor: "#ff9800",
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  
    const options = {
      responsive: true,
      plugins: {
        title: { display: true, text: "Average Batting Intent by Over" },
        legend: { display: false },
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          title: {
            display: true,
            text: "Intent Score",
            color: isDarkMode ? "#ffffff" : "#000000",
          },
          ticks: {
            color: isDarkMode ? "#ffffff" : "#000000",
          },
        },
        x: {
          ticks: {
            color: isDarkMode ? "#ffffff" : "#000000",
          },
        },
      },
    };
  
    return <Line ref={intentOverChartRef} data={chartData} options={options} />;
  };

  const renderMatchTrendLines = () => {
    if (!trendData?.match_trends || trendData.match_trends.length === 0) {
      return <Alert variant="warning">No trend data available for match-by-match graph.</Alert>;
    }
  
    try {
       
        const labels = trendData.match_trends.map(d => {
            const opp = d.opponent ? d.opponent.slice(0, 3).toUpperCase() : "???";
            return `vs ${opp}`;
          });
      const scoringShotPct = trendData.match_trends.map(d => d.scoring_shot_pct ?? 0);
      const boundaryPct = trendData.match_trends.map(d => d.boundary_pct ?? 0);
      const sr = trendData.match_trends.map(d => d.sr ?? 0);
      const attackingPct = trendData.match_trends.map(d => d.attacking_pct ?? 0);
      const movingAvgRuns = trendData.match_trends.map(d => d.moving_avg_runs ?? 0);
  
      const chartData = {
        labels,
        datasets: [
          {
            label: "Scoring Shot %",
            data: scoringShotPct,
            borderColor: "#4caf50",
            fill: false,
            tension: 0.3,
          },
          {
            label: "% from Boundaries",
            data: boundaryPct,
            borderColor: "#f44336",
            fill: false,
            tension: 0.3,
          },
          {
            label: "Attacking Shot %",
            data: attackingPct,
            borderColor: "#9c27b0",
            fill: false,
            tension: 0.3,
          },
          {
            label: "Strike Rate",
            data: sr,
            borderColor: "#2196f3",
            fill: false,
            tension: 0.3,
            yAxisID: "y2",
          },
          {
            label: "3-Game Avg Runs",
            data: movingAvgRuns,
            borderColor: "#ff9800",
            fill: false,
            borderDash: [6, 3],
            tension: 0.3,
            yAxisID: "y1",
          },
        ],
      };
  
      const options = {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Match-by-Match Performance Trends",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            title: {
              display: true,
              text: "%",
              color: isDarkMode ? "#ffffff" : "#000000",
            },
            ticks: {
              color: isDarkMode ? "#ffffff" : "#000000",
            },
          },
          y1: {
            position: "right",
            beginAtZero: true,
            title: {
              display: true,
              text: "3-Game Avg Runs",
              color: isDarkMode ? "#ffffff" : "#000000",
            },
            ticks: {
              color: isDarkMode ? "#ffffff" : "#000000",
            },
            grid: {
              drawOnChartArea: false,
            },
          },

          y2: {
            position: "right",
            beginAtZero: true,
            min: 0,
            suggestedMax: 200, // or auto-scale with Math.max if needed
            title: {
              display: true,
              text: "Strike Rate",
              color: isDarkMode ? "#ffffff" : "#000000",
            },
            ticks: {
              color: isDarkMode ? "#ffffff" : "#000000",
            },
            grid: {
              drawOnChartArea: false,
            },
          },
          x: {
            ticks: {
              color: isDarkMode ? "#ffffff" : "#000000",
              maxRotation: 60,
              minRotation: 60,
              align: "center",
            },
          },
        },
      };
  
      return <Line ref={matchTrendChartRef} data={chartData} options={options} />;
    } catch (error) {
      console.error("❌ Error rendering match trend chart", error);
      return <Alert variant="danger">Error rendering chart.</Alert>;
    }
  };
  
  const renderDismissalChart = () => {
    if (!trendData?.dismissals || Object.keys(trendData.dismissals).length === 0) {
      return <Alert variant="info">No dismissal data available.</Alert>;
    }
  
    const labels = Object.keys(trendData.dismissals).map(type =>
      type.charAt(0).toUpperCase() + type.slice(1)
    );
    const data = Object.values(trendData.dismissals);
  
    const chartData = {
      labels,
      datasets: [
        {
          label: "Dismissal Count",
          data,
          backgroundColor: "#e53935",
        },
      ],
    };
  
    const options = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Dismissal Type Breakdown",
        },
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: isDarkMode ? "#ffffff" : "#000000",
          },
        },
        x: {
          ticks: {
            color: isDarkMode ? "#ffffff" : "#000000",
          },
        },
      },
    };
  
    return <Bar ref={dismissalChartRef} data={chartData} options={options} />;
  };

  const renderLast5Dismissals = () => {
    if (!trendData?.dismissals_last_5) return null;
  
    const dismissals = trendData.dismissals_last_5;
    const items = Object.entries(dismissals).map(([type, count]) => (
      <li key={type}>
        {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
      </li>
    ));
  
    return (
      <div className="mt-3">
        <h6 className="fw-bold">Last 5 Matches:</h6>
        <ul className="ps-3">{items}</ul>
      </div>
    );
  };

  const renderBowlingHistoryChart = () => {
    if (!trendData?.bowler_history) return null;
  
    const labels = trendData.bowler_history.map(row => {
        const opp = row.opponent ? row.opponent.slice(0, 3).toUpperCase() : "???";
        return `vs ${opp}`;
      });
    
    const wickets = trendData.bowler_history.map(row => row.wickets);
    const runs = trendData.bowler_history.map(row => row.runs);

    const intent = trendData.bowler_history.map(row => row.intent_conceded);
  
    const data = {
      labels,
      datasets: [
        { label: "Wickets", data: wickets, backgroundColor: "#2196f3", yAxisID: "y" },
        { label: "Runs", data: runs, backgroundColor: "#f44336", yAxisID: "y1" },
        { label: "Intent Conceded", data: intent, backgroundColor: "#ff9800", yAxisID: "y2" }
      ]
    };
  
    const options = {
      responsive: true,
      plugins: { legend: { position: "top" } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Wickets" }},
        y1: { position: "right", beginAtZero: true, title: { display: true, text: "Runs" }, grid: { drawOnChartArea: false }},
        y2: { position: "right", beginAtZero: true, max: 10, title: { display: true, text: "Intent" }, grid: { drawOnChartArea: false }}
      }
    };
  
    return <Bar ref={bowlingHistoryRef} data={data} options={options} />;
  };
  
  const renderBowlingConsistencyTrends = () => {
    if (!trendData?.consistency_trends) return null;
  
    const labels = trendData.bowler_history.map(row => {
        const opp = row.opponent ? row.opponent.slice(0, 3).toUpperCase() : "???";
        return `vs ${opp}`;
      });
    const econ = trendData.consistency_trends.map(row => row.econ);
    const dot = trendData.consistency_trends.map(row => row.dot_pct);
    const good = trendData.consistency_trends.map(row => row.good_pct);
    const falseShot = trendData.consistency_trends.map(row => row.false_pct);
    const extras = trendData.consistency_trends.map(row => row.extras);
  
    const data = {
      labels,
      datasets: [
        { label: "Dot Ball %", data: dot, borderColor: "#4caf50", fill: false, yAxisID: "y" },
        { label: "Good Length %", data: good, borderColor: "#ff9800", fill: false, yAxisID: "y" },
        { label: "False Shot %", data: falseShot, borderColor: "#9c27b0", fill: false, yAxisID: "y" },
        { label: "Economy", data: econ, borderColor: "#2196f3", fill: false, yAxisID: "y1" },
        { label: "Extras", data: extras, borderColor: "#e53935", fill: false, yAxisID: "y2" }
      ]
    };
  
    const options = {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: {
          display: true,
          text: "Bowling Consistency Trends"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "%",
            color: "#000"
          },
          ticks: {
            color: isDarkMode ? "#ffffff" : "#000000"
          }
        },
        y1: {
          position: "right",
          beginAtZero: true,
          title: {
            display: true,
            text: "Economy",
            color: "#2196f3"
          },
          ticks: {
            color: "#2196f3"
          },
          grid: { drawOnChartArea: false }
        },
        y2: {
          position: "right",
          beginAtZero: true,
          offset: true, // prevent overlap with y1
          title: {
            display: true,
            text: "Extras",
            color: "#e53935"
          },
          ticks: {
            color: "#e53935"
          },
          grid: { drawOnChartArea: false }
        },
        x: {
          ticks: {
            color: isDarkMode ? "#ffffff" : "#000000"
          }
        }
      }
    };
  
    return <Line ref={bowlingConsistencyRef} data={data} options={options} />;
  };
    
  const renderBowlingDismissals = () => {
    const dismissals = trendData?.dismissal_breakdown ?? {};
    const labels = Object.keys(dismissals).map(
      d => d.charAt(0).toUpperCase() + d.slice(1)
    );
    const values = Object.values(dismissals);
  
    const data = {
      labels,
      datasets: [{ label: "Dismissals", data: values, backgroundColor: "#673ab7" }]
    };
  
    const options = {
      responsive: true,
      plugins: {
        title: { display: true, text: "Dismissal Types" },
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    };
  
    return <Bar ref={bowlingDismissalsRef} data={data} options={options} />;
  };
  
  const renderZoneEffectivenessTable = () => {
    if (!trendData?.zone_effectiveness) return null;
  
    const fixedOrder = ["Full Toss", "Yorker", "Full", "Good", "Short"];
    const defaultRow = {
      balls: 0,
      runs: 0,
      wickets: 0,
      avg_runs_per_ball: 0,
      dot_pct: 0,
      false_shot_pct: 0,
    };
  
    const zones = fixedOrder.map(zone => {
      const found = trendData.zone_effectiveness.find(z => z.zone === zone);
      return { zone, ...(found || defaultRow) };
    });
  
    // Only consider zones with balls > 0 for best/worst
    const valid = zones.filter(z => z.balls > 0);
  
    const best = {
      wickets: Math.max(...valid.map(z => z.wickets)),
      avg_runs_per_ball: Math.min(...valid.map(z => z.avg_runs_per_ball)),
      dot_pct: Math.max(...valid.map(z => z.dot_pct)),
      false_shot_pct: Math.max(...valid.map(z => z.false_shot_pct)),
    };
  
    const worst = {
      wickets: Math.min(...valid.map(z => z.wickets)),
      avg_runs_per_ball: Math.max(...valid.map(z => z.avg_runs_per_ball)),
      dot_pct: Math.min(...valid.map(z => z.dot_pct)),
      false_shot_pct: Math.min(...valid.map(z => z.false_shot_pct)),
    };
  
    const getHighlightClass = (val, bestVal, worstVal, higherIsBetter = true, eligible = true) => {
      if (!eligible) return "";
      if (val === bestVal) return "table-success fw-bold";
      if (val === worstVal) return "table-danger";
      return "";
    };
  
    return (
      <div className="table-responsive">
        <table className="table table-bordered text-center">
          <thead className={isDarkMode ? "table-dark" : "table-light"}>
            <tr>
              <th>Zone</th>
              <th>Balls</th>
              <th>Runs</th>
              <th>Wickets</th>
              <th>Avg Runs/Ball</th>
              <th>Dot %</th>
              <th>False Shot %</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z, idx) => {
              const eligible = z.balls > 0;
              return (
                <tr key={idx}>
                  <td>{z.zone}</td>
                  <td>{z.balls}</td>
                  <td>{z.runs}</td>
                  <td className={getHighlightClass(z.wickets, best.wickets, worst.wickets, true, eligible)}>{z.wickets}</td>
                  <td className={getHighlightClass(z.avg_runs_per_ball, best.avg_runs_per_ball, worst.avg_runs_per_ball, false, eligible)}>{z.avg_runs_per_ball.toFixed(2)}</td>
                  <td className={getHighlightClass(z.dot_pct, best.dot_pct, worst.dot_pct, true, eligible)}>{z.dot_pct.toFixed(2)}%</td>
                  <td className={getHighlightClass(z.false_shot_pct, best.false_shot_pct, worst.false_shot_pct, true, eligible)}>{z.false_shot_pct.toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
    

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />

        <div className="row">
          <div className="col-md-3">
            <BattingBowlingToggle selected={trendMode} onChange={setTrendMode} />
            
            <Accordion alwaysOpen>
              {/* Team Category */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <h5 className="fw-bold m-0">Team Category</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Select
                      value={teamCategory}
                      onChange={(e) => setTeamCategory(e.target.value)}
                    >
                      {["Men", "Women", "U19 Men", "U19 Women", "Training"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Accordion.Body>
              </Accordion.Item>

              {/* Country */}
              <Accordion.Item eventKey="1">
                <Accordion.Header>
                  <h5 className="fw-bold m-0">Country</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      disabled={countries.length === 0}
                    >
                      <option value="">Select Country</option>
                      {countries.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Form.Select>
                    {countries.length === 0 && (
                      <small className="text-muted">No countries available</small>
                    )}
                  </Form.Group>
                </Accordion.Body>
              </Accordion.Item>

              {/* Player */}
              <Accordion.Item eventKey="2">
                <Accordion.Header>
                  <h5 className="fw-bold m-0">Player</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      disabled={players.length === 0}
                    >
                      <option value="">Select Player</option>
                      {players.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Form.Select>
                    {players.length === 0 && (
                      <small className="text-muted">No players available</small>
                    )}
                  </Form.Group>
                </Accordion.Body>
              </Accordion.Item>

              {/* Tournaments */}
              <Accordion.Item eventKey="3">
                <Accordion.Header>
                  <h5 className="fw-bold m-0">Tournaments</h5>
                </Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
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
                              ? prev.filter(item => item !== val)
                              : [...prev, val]
                          );
                        }}
                      />
                    ))}
                    {tournaments.length === 0 && (
                      <small className="text-muted">No tournaments available</small>
                    )}
                  </Form.Group>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            {/* Generate Button outside accordion */}
            <div className="mt-3">
              <button
                className="btn btn-primary w-100"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  "Generate Trends"
                )}
              </button>
            </div>
          </div>

  
          <div className="col-md-8">
            {trendData && (
                <>
                {trendMode === "Batting" && (
                    <Accordion
                    defaultActiveKey="0"
                    alwaysOpen
                    className={`mt-4 ${isDarkMode ? "bg-dark text-white" : "bg-light text-dark"}`}
                    onSelect={(eventKey) => {
                        setTimeout(() => {
                        historyChartRef.current?.resize();
                        intentOverChartRef.current?.resize();
                        matchTrendChartRef.current?.resize();
                        dismissalChartRef.current?.resize();
                        }, 200);
                    }}
                    >
                    <Accordion.Item eventKey="0" className={isDarkMode ? "bg-dark text-white" : ""}>
                        <Accordion.Header>Batting History (Runs, SR, Intent)</Accordion.Header>
                        <Accordion.Body>{renderGroupedBarChart()}</Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="1" className={isDarkMode ? "bg-dark text-white" : ""}>
                        <Accordion.Header>Average Intent by Over</Accordion.Header>
                        <Accordion.Body>{renderIntentByOverChart()}</Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="2" className={isDarkMode ? "bg-dark text-white" : ""}>
                        <Accordion.Header>Match-by-Match Trends</Accordion.Header>
                        <Accordion.Body>{renderMatchTrendLines()}</Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="3" className={isDarkMode ? "bg-dark text-white" : ""}>
                        <Accordion.Header>Dismissal Breakdown</Accordion.Header>
                        <Accordion.Body>
                        <div className="row">
                            <div className="col-md-8">{renderDismissalChart()}</div>
                            <div className="col-md-4">{renderLast5Dismissals()}</div>
                        </div>
                        </Accordion.Body>
                    </Accordion.Item>
                    </Accordion>
                )}

                {trendMode === "Bowling" && (
                <Accordion className="mt-4" defaultActiveKey="0" alwaysOpen>
                <Accordion.Item eventKey="0" className={isDarkMode ? "bg-dark text-white" : ""}>
                  <Accordion.Header>Bowling History (Runs, Econ, Intent Conceded)</Accordion.Header>
                  <Accordion.Body>
                    {renderBowlingHistoryChart()}
                  </Accordion.Body>
                </Accordion.Item>
              
                <Accordion.Item eventKey="1" className={isDarkMode ? "bg-dark text-white" : ""}>
                  <Accordion.Header>Consistency Trends</Accordion.Header>
                  <Accordion.Body>
                    {renderBowlingConsistencyTrends()}
                  </Accordion.Body>
                </Accordion.Item>
              
                <Accordion.Item eventKey="2" className={isDarkMode ? "bg-dark text-white" : ""}>
                  <Accordion.Header>Dismissal Breakdown</Accordion.Header>
                  <Accordion.Body>
                    {renderBowlingDismissals()}
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="3" className={isDarkMode ? "bg-dark text-white" : ""}> 
                  <Accordion.Header>Zone Effectiveness</Accordion.Header>
                  <Accordion.Body>
                    {renderZoneEffectivenessTable()}
                    </Accordion.Body>
                </Accordion.Item>
              </Accordion>
              
                )}
                </>
            )}
            </div>

        </div>
      </div>
    </div>
  );
  
  };
  
  export default TrendsTab;