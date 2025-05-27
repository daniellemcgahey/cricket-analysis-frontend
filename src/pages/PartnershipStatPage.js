import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Spinner, Alert, Button, Form, Card } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import DarkModeContext from "../DarkModeContext";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PartnershipStatPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(false);

  const teamCategories = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

  useEffect(() => {
    api.get("/tournaments").then(res => setTournaments(res.data));
  }, []);

  useEffect(() => {
    if (selectedTournament && teamCategory) {
      api.get("/matches", { params: { teamCategory } })
      .then(res => {
        const filtered = res.data.filter(m => m.tournament === selectedTournament);
        setMatches(filtered);
      });

    }
  }, [selectedTournament, teamCategory]);

  const fetchData = () => {
    if (!selectedMatch) return alert("Please select a match.");
    setLoading(true);
    api.post("/match-partnerships", {
      team_category: teamCategory,
      tournament: selectedTournament,
      match_id: selectedMatch
    })
    .then(res => {
      setPartnerships(res.data.partnerships || []);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
      alert("Failed to fetch partnership data.");
    });

  };

  const generateChartData = (partnership) => {
    const isUnbeaten = partnership.unbeaten === 1;

    let leftBatter = {
      name: partnership.batter1_name,
      runs: partnership.batter1_runs,
      balls: partnership.batter1_balls
    };

    let rightBatter = {
      name: partnership.batter2_name,
      runs: partnership.batter2_runs,
      balls: partnership.batter2_balls
    };

    // Flip if needed (ensure unbeaten batter on right)
    if (isUnbeaten && partnership.batter2_runs < partnership.batter1_runs) {
      [leftBatter, rightBatter] = [rightBatter, leftBatter];
    }

    return {
      labels: [""],
      datasets: [
        {
          label: `${leftBatter.name} ${leftBatter.runs}(${leftBatter.balls})${isUnbeaten ? "*" : ""}`,
          data: [-leftBatter.runs],
          backgroundColor: "#4CAF50"
        },
        {
          label: `${rightBatter.name} ${rightBatter.runs}(${rightBatter.balls})${isUnbeaten ? "*" : ""}`,
          data: [rightBatter.runs],
          backgroundColor: "#2196F3"
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${Math.abs(context.raw)} runs`
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        min: -25,
        max: 25,
        ticks: {
          color: isDarkMode ? "#fff" : "#000",
          callback: (value) => Math.abs(value)
        },
        grid: { color: isDarkMode ? "#555" : "#ccc" }
      },
      y: {
        stacked: true,
        ticks: { color: isDarkMode ? "#fff" : "#000" },
        grid: { color: isDarkMode ? "#555" : "#ccc" }
      }
    }
  };

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <div className="row">
          {/* Filters */}
          <div className="col-md-3">
            <Card className={isDarkMode ? "bg-dark text-white" : ""}>
              <Card.Body>
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
                          onChange={e => setTeamCategory(e.target.value)}
                        >
                          {teamCategories.map((cat, i) => (
                            <option key={i} value={cat}>{cat}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Tournament */}
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>
                      <h5 className="fw-bold m-0">Tournament</h5>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Form.Group className="mb-3">
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
                        {tournaments.length === 0 && (
                          <small className="text-muted">No tournaments available</small>
                        )}
                      </Form.Group>
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Match */}
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>
                      <h5 className="fw-bold m-0">Match</h5>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Form.Group className="mb-3">
                        <Form.Select
                          value={selectedMatch}
                          onChange={e => setSelectedMatch(e.target.value)}
                          disabled={matches.length === 0}
                        >
                          <option value="">-- Select Match --</option>
                          {matches.map((m, i) => (
                            <option key={i} value={m.match_id}>
                              {`${new Date(m.match_date).toLocaleDateString()} — ${m.team_a} vs ${m.team_b}`}
                            </option>
                          ))}
                        </Form.Select>
                        {matches.length === 0 && (
                          <small className="text-muted">No matches available</small>
                        )}
                      </Form.Group>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>

                {/* Generate Button outside accordion */}
                <div className="mt-3">
                  <Button
                    onClick={fetchData}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      "Generate Partnerships"
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>


          {/* Graphs */}
          <div className="col-md-9">
            {loading ? (
              <Spinner animation="border" />
            ) : partnerships.length > 0 ? (
                partnerships.map((p, idx) => {
                    const chartData = generateChartData(p);
                    const isUnbeaten = p.unbeaten === 1;
                  
                    // ✅ Full player objects now
                    let leftBatter = {
                      name: p.batter1_name,
                      runs: p.batter1_runs,
                      balls: p.batter1_balls
                    };
                  
                    let rightBatter = {
                      name: p.batter2_name,
                      runs: p.batter2_runs,
                      balls: p.batter2_balls
                    };
                  
                    if (isUnbeaten && p.batter2_runs < p.batter1_runs) {
                      [leftBatter, rightBatter] = [rightBatter, leftBatter];
                    }
                  
                    return (
                      <div key={idx} style={{ marginBottom: "1rem" }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="text-start" style={{ width: "15%" }}>
                            <strong>
                              Wicket {p.start_wicket + 1}
                              {isUnbeaten ? <sup>*</sup> : ""}
                            </strong>
                          </div>
                  
                          <div className="text-end" style={{ width: "28%" }}>
                            <strong>{leftBatter.name}</strong> {leftBatter.runs}({leftBatter.balls})
                          </div>
                  
                          <div className="text-start" style={{ width: "48%" }}>
                            <strong>{rightBatter.name}</strong> {rightBatter.runs}({rightBatter.balls})
                          </div>
                        </div>
                  
                        <div style={{ width: "100%", height: "50px" }}>
                          <Bar data={chartData} options={chartOptions} />
                        </div>
                  
                        <hr style={{ margin: "8px 0", borderColor: isDarkMode ? "#555" : "#ccc" }} />
                      </div>
                    );
                  })
                  
            ) : (
              <Alert variant="info">No partnership data available.</Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipStatPage;
