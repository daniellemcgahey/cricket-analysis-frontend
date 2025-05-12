import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Accordion, Spinner, Alert, Button, Form, Card } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import DarkModeContext from "../DarkModeContext";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";
import annotationPlugin from 'chartjs-plugin-annotation';


ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend, annotationPlugin);

// X-axis labels (0 to 19)
const overs = Array.from({ length: 20 }, (_, i) => i);

// Team color logic
const getTeamFillColors = (battingTeam) => {
  const team = battingTeam.toLowerCase();
  if (team.includes("brasil")) {
    return {
      border: "#006400",
      positiveFill: "rgba(0, 156, 59, 0.3)",     // green
      negativeFill: "rgba(116, 172, 223, 0.3)"   // argentina blue
    };
  }
  if (team.includes("argentina")) {
    return {
      border: "#005DAA",
      positiveFill: "rgba(116, 172, 223, 0.3)",  // light blue
      negativeFill: "rgba(0, 156, 59, 0.3)"      // brasil green
    };
  }
  return {
    border: "#666",
    positiveFill: "rgba(102, 102, 102, 0.3)",
    negativeFill: "rgba(102, 102, 102, 0.1)"
  };
};

const MatchPressurePage = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const teamCategories = ["Men", "Women", "U19 Men", "U19 Women"];

  useEffect(() => {
    axios.get("http://localhost:8000/tournaments").then(res => setTournaments(res.data));
  }, []);

  useEffect(() => {
    if (selectedTournament && teamCategory) {
      axios.get("http://localhost:8000/matches", {
        params: { teamCategory }
      }).then(res => {
        const filtered = res.data.filter(m => m.tournament === selectedTournament);
        setMatches(filtered);
      });
    }
  }, [selectedTournament, teamCategory]);

  const fetchData = () => {
    if (!selectedMatch) return alert("Please select a match.");
    setLoading(true);
    axios.post("http://localhost:8000/match-momentum", {
      team_category: teamCategory,
      tournament: selectedTournament,
      match_id: selectedMatch
    }).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      alert("Failed to fetch pressure data.");
    });
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Filters */}
        <div className="col-md-3" style={{ marginLeft: "0px" }}>
          <Card className={isDarkMode ? "bg-dark text-white" : ""}>
            <Card.Body>
              <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Filter Options</Accordion.Header>
                  <Accordion.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Team Category</Form.Label>
                      <Form.Select value={teamCategory} onChange={e => setTeamCategory(e.target.value)}>
                        {teamCategories.map((cat, i) => (
                          <option key={i} value={cat}>{cat}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Tournament</Form.Label>
                      <Form.Select value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)}>
                        <option value="">-- Select Tournament --</option>
                        {tournaments.map((t, i) => (
                          <option key={i} value={t}>{t}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Match</Form.Label>
                      <Form.Select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}>
                        <option value="">-- Select Match --</option>
                        {matches.map((m, i) => (
                          <option key={i} value={m.match_id}>
                            {`${new Date(m.match_date).toLocaleDateString()} — ${m.team_a} vs ${m.team_b}`}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Button onClick={fetchData} disabled={loading} className="w-100">
                      {loading ? <Spinner size="sm" animation="border" /> : "Generate Momentum Graphs"}
                    </Button>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card.Body>
          </Card>
        </div>

        {/* Graphs */}
        <div className="col-md-8">
        {data?.momentum?.length > 0 ? (
            data.momentum.map((teamData, idx) => {
                console.log("🧪 Wicket check for", teamData.team, teamData.momentum);
            const batting = Array.from({ length: 20 }, (_, o) => {
                const over = teamData.momentum.find(v => Number(v.over) === o);
                return over?.batting_bpi ?? null;
            });

            const bowling = Array.from({ length: 20 }, (_, o) => {
                const over = teamData.momentum.find(v => Number(v.over) === o);
                return over?.bowling_bpi ?? null;
            });

            const netMomentum = batting.map((b, i) => {
                const bow = bowling[i];
                if (b === null || bow === null) return null;
                return +(bow - b).toFixed(2);
            });

            const totalMomentum = netMomentum.reduce((sum, val) => {
                return sum + (typeof val === 'number' ? val : 0);
            }, 0);

            const roundedTotal = totalMomentum.toFixed(1);
            const momentumColor = totalMomentum >= 0
                ? "rgba(0, 156, 59, 0.8)"   // green
                : "rgba(200, 35, 51, 0.8)"; // red

            const wicketsPerOver = {};
            teamData.momentum.forEach(over => {
                if (typeof over.wickets === 'number') {
                wicketsPerOver[Number(over.over)] = over.wickets;
                }
            });

            const wicketAnnotations = {};

            for (const [overStr, count] of Object.entries(wicketsPerOver)) {
              const over = Number(overStr);
              for (let j = 0; j < count; j++) {
                wicketAnnotations[`wicket_${over}_${j}`] = {
                  type: 'label',
                  xValue: over,
                  yValue: 2 - j * 1.5, // stagger markers vertically
                  content: '❌',
                  font: {
                    size: 14,
                    weight: 'bold'
                  },
                  color: 'red',
                  xAdjust: over === 0 ? 8 : 0,
                  position: { x: 'center', y: 'center' },
                  drawTime: 'afterDatasetsDraw'
                };
              }
            }

            const chartData = {
                labels: overs,
                datasets: [
                {
                    label: "Batting Pressure",
                    data: batting,
                    borderColor: "rgba(0, 123, 255, 0.4)",
                    backgroundColor: "rgba(0, 123, 255, 0.4)",
                    tension: 0.3,
                    fill: false,
                    borderDash: [5, 5],
                    pointRadius: 2
                },
                {
                    label: "Bowling Pressure",
                    data: bowling,
                    borderColor: "rgba(220, 53, 69, 0.4)",
                    backgroundColor: "rgba(220, 53, 69, 0.4)",
                    tension: 0.3,
                    fill: false,
                    borderDash: [5, 5],
                    pointRadius: 2
                },
                {
                    label: "Momentum",
                    data: netMomentum,
                    borderColor: "green",
                    backgroundColor: "green",
                    tension: 0.3,
                    fill: false,
                    pointRadius: 2
                }
                ]
            };

            const chartOptions = {
                responsive: true,
                plugins: {
                legend: {
                    labels: {
                    color: isDarkMode ? "#fff" : "#000"
                    }
                },
                annotation: {
                    annotations: {
                    zeroLine: {
                        type: 'line',
                        yMin: 0,
                        yMax: 0,
                        borderColor: 'white',
                        borderWidth: 2
                    },
                    phaseLine6: {
                        type: 'line',
                        xMin: 5,
                        xMax: 5,
                        borderColor: 'black',
                        borderWidth: 1
                    },
                    phaseLine15: {
                        type: 'line',
                        xMin: 14,
                        xMax: 14,
                        borderColor: 'black',
                        borderWidth: 1
                    },
                    momentumCounter: {
                        type: 'label',
                        xValue: 18.5,
                        yValue: Math.max(...netMomentum.filter(n => n !== null)) + 2 || 0,
                        backgroundColor: momentumColor,
                        borderColor: 'black',
                        borderWidth: 1,
                        cornerRadius: 4,
                        padding: 6,
                        content: [`Total Momentum: ${roundedTotal}`],
                        font: {
                        size: 12,
                        weight: 'bold'
                        },
                        color: '#fff',
                        position: { x: 'end', y: 'start' },
                        drawTime: 'afterDraw'
                    },
                    ...wicketAnnotations // ✅ inject dynamic wicket ❌s
                    }
                }
                },
                scales: {
                x: {
                    title: { display: true, text: "Overs" },
                    ticks: {
                    color: isDarkMode ? "#fff" : "#000",
                    callback: (value, index) => index + 1
                    }
                },
                y: {
                    title: { display: true, text: "Pressure Index" },
                    ticks: { color: isDarkMode ? "#fff" : "#000" },
                    beginAtZero: false
                }
                }
            };

            return (
                <div key={idx} className="mb-5">
                <h5 className="mb-3">{teamData.team} Batting</h5>
                <Line data={chartData} options={chartOptions} />
                </div>
            );
            })
        ) : (
            <Alert variant="info">No momentum data available</Alert>
        )}
        </div>



      </div>
    </div>
  );
};

export default MatchPressurePage;
