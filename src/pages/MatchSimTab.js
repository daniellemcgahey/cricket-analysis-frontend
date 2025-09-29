// MatchSimTab.jsx
import React, { useState, useEffect, useContext } from "react";
import DarkModeContext from '../DarkModeContext';
import BackButton from "../components/BackButton";
import "./TabStyles.css";
import api from "../api";
import { Form, Button, Row, Col, Spinner, Alert, Table, Collapse } from "react-bootstrap";
import PlayerPicker from "./PlayerPicker";

const MatchSimTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [enteredPassword, setEnteredPassword] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [error, setError] = useState(false);
  const correctPassword = "coachaccess";

  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [allCountries, setAllCountries] = useState([]);
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [teamASelected, setTeamASelected] = useState([]);
  const [teamBSelected, setTeamBSelected] = useState([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [showOversA, setShowOversA] = useState(false);
  const [showOversB, setShowOversB] = useState(false);

  useEffect(() => {
    api.get("/countries", { params: { teamCategory: "Women" } })
      .then(res => setAllCountries(res.data));
  }, []);

  useEffect(() => {
    if (teamA) {
      setLoadingA(true);
      api.get("/team-players", { params: { country_name: teamA, team_category: "Women" } })
        .then(res => setTeamAPlayers(res.data))
        .finally(() => setLoadingA(false));
    } else {
      setTeamAPlayers([]);
      setTeamASelected([]);
    }
  }, [teamA]);

  useEffect(() => {
    if (teamB) {
      setLoadingB(true);
      api.get("/team-players", { params: { country_name: teamB, team_category: "Women" } })
        .then(res => setTeamBPlayers(res.data))
        .finally(() => setLoadingB(false));
    } else {
      setTeamBPlayers([]);
      setTeamBSelected([]);
    }
  }, [teamB]);

  const handleLogin = () => {
    if (enteredPassword === correctPassword) {
      setAccessGranted(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const fetchProbableXI = async (countryName) => {
    // last_games can be 3 or 4; expose as a constant or user control if you want
    const lastGames = 4;
    const { data } = await api.get("/probable-xi", {
      params: { country_name: countryName, team_category: "Women", last_games: lastGames }
    });
    // expecting: { player_ids: [id1, id2, ...] }
    return data?.player_ids ?? [];
  };

  const handleSimulate = () => {
    setSimLoading(true);
    api.post("/simulate-match-v2", {
      team_a_name: teamA,
      team_b_name: teamB,
      team_a_players: teamASelected,
      team_b_players: teamBSelected,
      max_overs: 20,
      team_category: "Women",
      simulations: 100
    }).then(res => {
      // normalize overs keys to UI expectations if needed
      const data = res.data;
      const normalizeOvers = (arr = []) =>
        arr.map(o => ({
          over_number: o.over ?? o.over_number,
          bowler: o.bowler,
          runs: o.runs,
          wickets: o.wickets,
          cumulative_score: o.total_score ?? o.cumulative_score,
          cumulative_wickets: o.total_wickets ?? o.cumulative_wickets,
        }));

      data.team_a.last_sim_overs = normalizeOvers(data.team_a.last_sim_overs);
      data.team_b.last_sim_overs = normalizeOvers(data.team_b.last_sim_overs);

      setSimResult(data);
    }).catch(err => {
      console.error("Simulation error:", err);
    }).finally(() => setSimLoading(false));
  };

  const renderOversTable = (overs = []) => (
    <Table striped bordered hover size="sm" className="mt-3">
      <thead>
        <tr>
          <th>Over</th>
          <th>Bowler</th>
          <th>Runs</th>
          <th>Wickets</th>
          <th>Cumulative Score</th>
          <th>Cumulative Wickets</th>
        </tr>
      </thead>
      <tbody>
        {overs.map((over, idx) => (
          <tr key={idx}>
            <td>{over.over_number}</td>
            <td>{over.bowler}</td>
            <td>{over.runs}</td>
            <td>{over.wickets}</td>
            <td>{over.cumulative_score}</td>
            <td>{over.cumulative_wickets}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="mb-3 custom-tabs nav-pills">
        <BackButton isDarkMode={isDarkMode} />
        <div className="comparison-heading-wrapper mb-4 text-center" style={{ backgroundColor: "#ffcc29", padding: 5, borderRadius: 10 }}>
          <h2 className="fw-bold display-4" style={{ color: "#1b5e20" }}>Match Simulation</h2>
        </div>

        {!accessGranted ? (
          <div className="p-3 rounded border" style={{ maxWidth: 400 }}>
            <Form.Group controlId="password">
              <Form.Label>Enter Access Password</Form.Label>
              <Form.Control type="password" value={enteredPassword} onChange={(e) => setEnteredPassword(e.target.value)} placeholder="Enter password" />
            </Form.Group>
            <Button className="mt-2" variant="primary" onClick={handleLogin}>Unlock</Button>
            {error && <Alert variant="danger" className="mt-2">Incorrect password. Please try again.</Alert>}
          </div>
        ) : (
          <>
            <p>Select two teams, pick playing XIs, or let the app preselect a **probable XI** from recent games.</p>

            <Form className="mb-4">
              <Row>
                <Col md={6} className="mb-3">
                  <PlayerPicker
                    title="Country A"
                    countries={allCountries}
                    valueCountry={teamA}
                    onChangeCountry={setTeamA}
                    loading={loadingA}
                    players={teamAPlayers}
                    selectedIds={teamASelected}
                    setSelectedIds={setTeamASelected}
                    teamCategory="Women"
                    onSelectProbableXI={() => fetchProbableXI(teamA)}
                    max={11}
                  />
                </Col>

                <Col md={6} className="mb-3">
                  <PlayerPicker
                    title="Country B"
                    countries={allCountries}
                    valueCountry={teamB}
                    onChangeCountry={setTeamB}
                    loading={loadingB}
                    players={teamBPlayers}
                    selectedIds={teamBSelected}
                    setSelectedIds={setTeamBSelected}
                    teamCategory="Women"
                    onSelectProbableXI={() => fetchProbableXI(teamB)}
                    max={11}
                  />
                </Col>
              </Row>
            </Form>

            {(teamASelected.length === 11 && teamBSelected.length === 11) && (
              <Button variant="success" onClick={handleSimulate} disabled={simLoading}>
                {simLoading ? "Simulating..." : "Simulate Match (100x)"}
              </Button>
            )}

            {simResult && (
              <div className="mt-4">
                <h4>Simulation Result</h4>
                <p><strong>{simResult.team_a.name}:</strong> {simResult.team_a.average_score} avg score | Win %: {simResult.team_a.win_probability}% | Expected Margin: {simResult.team_a.expected_margin}</p>
                <p><strong>{simResult.team_b.name}:</strong> {simResult.team_b.average_score} avg score | Win %: {simResult.team_b.win_probability}% | Expected Margin: {simResult.team_b.expected_margin}</p>
                <h5 className="mt-3">🏆 Winner: {simResult.winner}</h5>

                <Button variant="info" size="sm" className="me-2" onClick={() => setShowOversA(!showOversA)}>
                  {showOversA ? "Hide" : "Show"} {simResult.team_a.name} Over Breakdown
                </Button>
                <Button variant="info" size="sm" onClick={() => setShowOversB(!showOversB)}>
                  {showOversB ? "Hide" : "Show"} {simResult.team_b.name} Over Breakdown
                </Button>

                <Collapse in={showOversA}><div>{renderOversTable(simResult.team_a.last_sim_overs)}</div></Collapse>
                <Collapse in={showOversB}><div>{renderOversTable(simResult.team_b.last_sim_overs)}</div></Collapse>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MatchSimTab;
