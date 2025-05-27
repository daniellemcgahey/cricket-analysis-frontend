import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Spinner, Alert, Button, Form, Card } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";

const PartnershipStatPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [partnershipsData, setPartnershipsData] = useState({});
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
      setPartnershipsData(res.data.partnerships_by_innings || {});
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
      alert("Failed to fetch partnership data.");
    });
  };

  const renderPartnershipsForTeam = (teamName, partnerships) => (
    <div key={teamName} className="mb-4">
      <h4 className="fw-bold mb-3">{teamName} Partnerships</h4>
      {partnerships.length > 0 ? (
        partnerships.map((p, idx) => (
          <Card
            key={idx}
            className={`mb-2 ${isDarkMode ? "bg-dark text-white" : ""}`}
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <strong>Wicket {p.start_wicket + 1}{p.unbeaten === 1 && <sup>*</sup>}</strong>
                  <div className="text-muted small">
                    Overs: {p.start_over} – {p.end_over}
                  </div>
                </div>
                <div className="text-end">
                  <strong>Partnership:</strong> {p.partnership_runs} runs, {p.partnership_balls} balls
                </div>
              </div>

              <div className="d-flex justify-content-between">
                <div>
                  <strong>{p.batter1_name}</strong>: {p.batter1_runs}({p.batter1_balls})
                </div>
                <div>
                  <strong>{p.batter2_name}</strong>: {p.batter2_runs}({p.batter2_balls})
                </div>
              </div>
            </Card.Body>
          </Card>
        ))
      ) : (
        <Alert variant="info">No partnership data for {teamName}.</Alert>
      )}
    </div>
  );

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
                      <Form.Select
                        value={teamCategory}
                        onChange={e => setTeamCategory(e.target.value)}
                      >
                        {teamCategories.map((cat, i) => (
                          <option key={i} value={cat}>{cat}</option>
                        ))}
                      </Form.Select>
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Tournament */}
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>
                      <h5 className="fw-bold m-0">Tournament</h5>
                    </Accordion.Header>
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

                  {/* Match */}
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>
                      <h5 className="fw-bold m-0">Match</h5>
                    </Accordion.Header>
                    <Accordion.Body>
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
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>

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

          {/* Partnerships Display */}
          <div className="col-md-9">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
                <Spinner animation="border" />
              </div>
            ) : (
              Object.entries(partnershipsData).map(([teamName, partnerships]) =>
                renderPartnershipsForTeam(teamName, partnerships)
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipStatPage;
