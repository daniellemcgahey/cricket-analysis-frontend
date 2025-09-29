import React, { useState, useEffect, useContext, useMemo } from "react";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import "./TabStyles.css";
import api from "../api";
import {
  Form,
  Button,
  Row,
  Col,
  Spinner,
  Alert,
  Table,
  Collapse,
  Badge,
  InputGroup,
} from "react-bootstrap";

const MatchSimTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  // Access gate
  const [enteredPassword, setEnteredPassword] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [error, setError] = useState(false);
  const correctPassword = "coachaccess";

  // NEW: Team category
  const [teamCategory, setTeamCategory] = useState("Women"); // "Men" | "Women" | "U19 Men" | "U19 Women"

  // Teams + players
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [allCountries, setAllCountries] = useState([]);
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [teamASelected, setTeamASelected] = useState([]);
  const [teamBSelected, setTeamBSelected] = useState([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  // Sim results
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [showOversA, setShowOversA] = useState(false);
  const [showOversB, setShowOversB] = useState(false);

  // ---------------- Access ----------------
  const handleLogin = () => {
    if (enteredPassword === correctPassword) {
      setAccessGranted(true);
      setError(false);
    } else setError(true);
  };

  // ---------------- Data fetchers ----------------
  useEffect(() => {
    api
      .get("/countries", { params: { teamCategory } })
      .then((res) => setAllCountries(res.data))
      .catch(() => setAllCountries([]));
  }, [teamCategory]);

  useEffect(() => {
    if (teamA) {
      setLoadingA(true);
      api
        .get("/team-players", {
          params: { country_name: teamA, team_category: teamCategory },
        })
        .then((res) => setTeamAPlayers(res.data))
        .finally(() => setLoadingA(false));
    } else {
      setTeamAPlayers([]);
      setTeamASelected([]);
    }
  }, [teamA, teamCategory]);

  useEffect(() => {
    if (teamB) {
      setLoadingB(true);
      api
        .get("/team-players", {
          params: { country_name: teamB, team_category: teamCategory },
        })
        .then((res) => setTeamBPlayers(res.data))
        .finally(() => setLoadingB(false));
    } else {
      setTeamBPlayers([]);
      setTeamBSelected([]);
    }
  }, [teamB, teamCategory]);

  // ---------------- Probable XI ----------------
  const fetchProbableXI = async (countryName) => {
    if (!countryName) return [];
    const lastGames = 4; // tweak if you want a control
    const { data } = await api.get("/probable-xi", {
      params: {
        country_name: countryName,
        team_category: teamCategory,
        last_games: lastGames,
      },
    });
    return data?.player_ids ?? [];
  };

  // ---------------- Simulate ----------------
  const handleSimulate = () => {
    setSimLoading(true);
    api
      .post("/simulate-match-v2", {
        team_a_name: teamA,
        team_b_name: teamB,
        team_a_players: teamASelected,
        team_b_players: teamBSelected,
        max_overs: 20,
        team_category: teamCategory, // now dynamic
        simulations: 100,
      })
      .then((res) => {
        // Normalize overs for the table (supports both old/new backend keys)
        const data = res.data;
        const normalizeOvers = (arr = []) =>
          arr.map((o) => ({
            over_number: o.over ?? o.over_number,
            bowler: o.bowler,
            runs: o.runs,
            wickets: o.wickets,
            cumulative_score: o.total_score ?? o.cumulative_score,
            cumulative_wickets: o.total_wickets ?? o.cumulative_wickets,
          }));
        if (data?.team_a?.last_sim_overs)
          data.team_a.last_sim_overs = normalizeOvers(data.team_a.last_sim_overs);
        if (data?.team_b?.last_sim_overs)
          data.team_b.last_sim_overs = normalizeOvers(data.team_b.last_sim_overs);
        setSimResult(data);
      })
      .catch((err) => {
        console.error("Simulation error:", err);
      })
      .finally(() => setSimLoading(false));
  };

  // ---------------- Small components ----------------
  const PlayerPicker = ({
    title,
    countries,
    valueCountry,
    onChangeCountry,
    loading,
    players,
    selectedIds,
    setSelectedIds,
    onSelectProbableXI,
    max = 11,
  }) => {
    const [filter, setFilter] = useState("");

    const filteredPlayers = useMemo(() => {
      const f = filter.trim().toLowerCase();
      if (!f) return players;
      return players.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(f) ||
          (p.role || "").toLowerCase().includes(f)
      );
    }, [players, filter]);

    const count = selectedIds.length;

    const toggle = (id) => {
      setSelectedIds((prev) =>
        prev.includes(id)
          ? prev.filter((x) => x !== id)
          : prev.length < max
          ? [...prev, id]
          : prev
      );
    };

    const selectNone = () => setSelectedIds([]);
    const selectVisible = () =>
      setSelectedIds(filteredPlayers.map((p) => p.id).slice(0, max));
    const handleProbable = async () => {
      const ids = await onSelectProbableXI?.();
      if (Array.isArray(ids) && ids.length) setSelectedIds(ids.slice(0, max));
    };

    return (
      <div>
        <Form.Group>
          <Form.Label>
            <strong>{title}</strong>
          </Form.Label>
          <Form.Select
            value={valueCountry}
            onChange={(e) => onChangeCountry(e.target.value)}
          >
            <option value="">Select</option>
            {countries.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
          <Badge bg={count === max ? "success" : "secondary"}>
            {count}/{max} selected
          </Badge>
          <Button variant="outline-secondary" size="sm" onClick={selectNone}>
            Deselect all
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={selectVisible}>
            Select visible
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleProbable}
            disabled={!valueCountry}
          >
            Select Probable XI
          </Button>
        </div>

        <InputGroup className="mt-2">
          <Form.Control
            placeholder="Search name or role…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </InputGroup>

        {loading ? (
          <Spinner animation="border" className="mt-3" />
        ) : (
          <div
            style={{
              maxHeight: 280,
              overflowY: "auto",
              border: "1px solid #ccc",
              padding: 10,
              borderRadius: 6,
            }}
            className="mt-2"
          >
            {filteredPlayers.map((p) => (
              <Form.Check
                key={p.id}
                type="checkbox"
                id={String(p.id)}
                label={
                  <span>
                    {p.name}{" "}
                    {p.role && (
                      <Badge bg="info" className="ms-1">
                        {p.role}
                      </Badge>
                    )}
                    {p.form && (
                      <Badge bg="warning" className="ms-1">
                        Form: {p.form}
                      </Badge>
                    )}
                  </span>
                }
                checked={selectedIds.includes(p.id)}
                onChange={() => toggle(p.id)}
              />
            ))}
            {!filteredPlayers.length && (
              <div className="text-muted">No players match your filter.</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ---------------- Tables ----------------
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

  // ---------------- Render ----------------
  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="mb-3 custom-tabs nav-pills">
        <BackButton isDarkMode={isDarkMode} />
        <div
          className="comparison-heading-wrapper mb-4 text-center"
          style={{ backgroundColor: "#ffcc29", padding: 5, borderRadius: 10 }}
        >
          <h2 className="fw-bold display-4" style={{ color: "#1b5e20" }}>
            Match Simulation
          </h2>
        </div>

        {!accessGranted ? (
          <div className="p-3 rounded border" style={{ maxWidth: 400 }}>
            <Form.Group controlId="password">
              <Form.Label>Enter Access Password</Form.Label>
              <Form.Control
                type="password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                placeholder="Enter password"
              />
            </Form.Group>
            <Button className="mt-2" variant="primary" onClick={handleLogin}>
              Unlock
            </Button>
            {error && (
              <Alert variant="danger" className="mt-2">
                Incorrect password. Please try again.
              </Alert>
            )}
          </div>
        ) : (
          <>
            {/* NEW: Team Category */}
            <Form.Group className="mb-3" controlId="teamCategory">
              <Form.Label>
                <strong>Team Category</strong>
              </Form.Label>
              <Form.Select
                value={teamCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setTeamCategory(val);
                  // reset when category changes
                  setTeamA("");
                  setTeamB("");
                  setTeamAPlayers([]);
                  setTeamBPlayers([]);
                  setTeamASelected([]);
                  setTeamBSelected([]);
                  setSimResult(null);
                }}
              >
                <option>Men</option>
                <option>Women</option>
                <option>U19 Men</option>
                <option>U19 Women</option>
              </Form.Select>
            </Form.Group>

            <p>
              Select two teams, pick playing XIs, or let the app preselect a{" "}
              <strong>Probable XI</strong> from recent games.
            </p>

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
                    onSelectProbableXI={() => fetchProbableXI(teamB)}
                    max={11}
                  />
                </Col>
              </Row>
            </Form>

            {teamASelected.length === 11 && teamBSelected.length === 11 && (
              <Button variant="success" onClick={handleSimulate} disabled={simLoading}>
                {simLoading ? "Simulating..." : "Simulate Match (100x)"}
              </Button>
            )}

            {simResult && (
              <div className="mt-4">
                <h4>Simulation Result</h4>
                <p>
                  <strong>{simResult.team_a.name}:</strong>{" "}
                  {simResult.team_a.average_score} avg score | Win %:{" "}
                  {simResult.team_a.win_probability}% | Expected Margin:{" "}
                  {simResult.team_a.expected_margin}
                </p>
                <p>
                  <strong>{simResult.team_b.name}:</strong>{" "}
                  {simResult.team_b.average_score} avg score | Win %:{" "}
                  {simResult.team_b.win_probability}% | Expected Margin:{" "}
                  {simResult.team_b.expected_margin}
                </p>
                <h5 className="mt-3">🏆 Winner: {simResult.winner}</h5>

                <Button
                  variant="info"
                  size="sm"
                  className="me-2"
                  onClick={() => setShowOversA(!showOversA)}
                >
                  {showOversA ? "Hide" : "Show"} {simResult.team_a.name} Over
                  Breakdown
                </Button>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => setShowOversB(!showOversB)}
                >
                  {showOversB ? "Hide" : "Show"} {simResult.team_b.name} Over
                  Breakdown
                </Button>

                <Collapse in={showOversA}>
                  <div>{renderOversTable(simResult.team_a.last_sim_overs)}</div>
                </Collapse>
                <Collapse in={showOversB}>
                  <div>{renderOversTable(simResult.team_b.last_sim_overs)}</div>
                </Collapse>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MatchSimTab;
