import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import DarkModeContext from "../DarkModeContext";
import { Accordion, Card, Button, Alert, Row, Col } from "react-bootstrap";

const MatchReportPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);

  const [teamCategory, setTeamCategory] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  // Load tournaments when team category changes
  useEffect(() => {
    if (!teamCategory) {
      setTournaments([]);
      setSelectedTournament("");
      setMatches([]);
      setSelectedMatchId(null);
      return;
    }
    api.get("/tournaments", { params: { team_category: teamCategory } })
      .then(res => {
        setTournaments(res.data);
        setSelectedTournament("");
        setMatches([]);
        setSelectedMatchId(null);
      })
      .catch(console.error);
  }, [teamCategory]);

  // Load matches when team category or tournament changes
  useEffect(() => {
    if (!teamCategory || !selectedTournament) {
      setMatches([]);
      setSelectedMatchId(null);
      return;
    }
    api.get("/matches", { params: { teamCategory, tournament: selectedTournament } })
      .then(res => {
        setMatches(res.data);
        setSelectedMatchId(null);
      })
      .catch(console.error);
  }, [teamCategory, selectedTournament]);

  // Update teams when match changes
  useEffect(() => {
    if (!selectedMatchId) {
      setTeamOptions([]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    const match = matches.find(m => m.match_id === selectedMatchId);
    if (match) {
      setTeamOptions([
        { id: match.team_a_id, name: match.team_a },
        { id: match.team_b_id, name: match.team_b }
      ]);
      setSelectedTeam(null);
      setPlayers([]);
      setSelectedPlayerId(null);
    }
  }, [selectedMatchId, matches]);

  // Load players when team changes
  useEffect(() => {
    if (!selectedTeam) {
      setPlayers([]);
      setSelectedPlayerId(null);
      return;
    }
    api.get("/team-players", { params: { country_name: selectedTeam.name } })
      .then(res => setPlayers(res.data))
      .catch(console.error);
  }, [selectedTeam]);

  const generatePlayerReport = () => {
    if (selectedMatchId && selectedPlayerId) {
      window.open(
        `${api.defaults.baseURL}/match-report/${selectedMatchId}/player/${selectedPlayerId}`,
        "_blank"
      );
    }
  };

  const generateTeamReport = () => {
    if (selectedMatchId && selectedTeam) {
      window.open(
        `${api.defaults.baseURL}/team-match-report/${selectedMatchId}/${selectedTeam.id}/pdf`,
        "_blank"
      );
    }
  };

  const themeClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={`${themeClass} p-4`} style={{ minHeight: "100vh" }}>
      <h2 className="mb-4">Generate Match Reports</h2>

      <Row>
        <Col md={4}>
          <Accordion defaultActiveKey="0">
            {/* Team Category */}
            <Accordion.Item eventKey="0">
              <Accordion.Header>Team Category</Accordion.Header>
              <Accordion.Body>
                <select
                  className="form-select mb-2"
                  value={teamCategory}
                  onChange={e => setTeamCategory(e.target.value)}
                >
                  <option value="">-- Select Team Category --</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="U19 Men">U19 Men</option>
                  <option value="U19 Women">U19 Women</option>
                  {/* Add any others */}
                </select>
              </Accordion.Body>
            </Accordion.Item>

            {/* Tournament */}
            {tournaments.length > 0 && (
              <Accordion.Item eventKey="1">
                <Accordion.Header>Tournament</Accordion.Header>
                <Accordion.Body>
                  <select
                    className="form-select mb-2"
                    value={selectedTournament}
                    onChange={e => setSelectedTournament(e.target.value)}
                  >
                    <option value="">-- Select Tournament --</option>
                    {tournaments.map(t => (
                      <option key={t.tournament_id} value={t.tournament_name}>
                        {t.tournament_name}
                      </option>
                    ))}
                  </select>
                  {tournaments.length === 0 && (
                    <Alert variant="warning">No tournaments available</Alert>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            )}

            {/* Match */}
            {matches.length > 0 && (
              <Accordion.Item eventKey="2">
                <Accordion.Header>Match</Accordion.Header>
                <Accordion.Body>
                  <select
                    className="form-select mb-2"
                    value={selectedMatchId || ""}
                    onChange={e => setSelectedMatchId(+e.target.value)}
                  >
                    <option value="">-- Select Match --</option>
                    {matches.map(m => (
                      <option key={m.match_id} value={m.match_id}>
                        {m.team_a} vs {m.team_b} ({m.match_date})
                      </option>
                    ))}
                  </select>
                </Accordion.Body>
              </Accordion.Item>
            )}

            {/* Team */}
            {teamOptions.length > 0 && (
              <Accordion.Item eventKey="3">
                <Accordion.Header>Team</Accordion.Header>
                <Accordion.Body>
                  <select
                    className="form-select mb-2"
                    value={selectedTeam?.id || ""}
                    onChange={e => {
                      const id = +e.target.value;
                      setSelectedTeam(teamOptions.find(t => t.id === id) || null);
                    }}
                  >
                    <option value="">-- Select Team --</option>
                    {teamOptions.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </Accordion.Body>
              </Accordion.Item>
            )}

            {/* Player */}
            {players.length > 0 && (
              <Accordion.Item eventKey="4">
                <Accordion.Header>Player</Accordion.Header>
                <Accordion.Body>
                  <select
                    className="form-select mb-2"
                    value={selectedPlayerId || ""}
                    onChange={e => setSelectedPlayerId(+e.target.value)}
                  >
                    <option value="">-- Select Player --</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Accordion.Body>
              </Accordion.Item>
            )}
          </Accordion>
        </Col>

        {/* Action Buttons */}
        <Col md={8} className="d-flex flex-column align-items-center justify-content-center">
          <Card className="p-3 shadow-sm w-100">
            <h5 className="mb-3">Actions</h5>
            <div className="d-flex gap-3 justify-content-center">
              <Button
                variant="primary"
                disabled={!selectedMatchId || !selectedPlayerId}
                onClick={generatePlayerReport}
              >
                Player Report
              </Button>
              <Button
                variant="secondary"
                disabled={!selectedMatchId || !selectedTeam}
                onClick={generateTeamReport}
              >
                Team Report
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MatchReportPage;
