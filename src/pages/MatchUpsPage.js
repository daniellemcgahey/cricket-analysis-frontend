import React, { useEffect, useState } from "react";
import api from "../api";
import { Form, Button, Table, Spinner } from "react-bootstrap";

const MatchUpsPage = () => {
  const [battingTeam, setBattingTeam] = useState("");
  const [bowlingTeam, setBowlingTeam] = useState("");
  const [selectedPhases, setSelectedPhases] = useState(["Powerplay"]);
  const [teamCategory, setTeamCategory] = useState("Women");

  const [countries, setCountries] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("my_batting"); // "my_batting" or "opposition_batting"


  useEffect(() => {
    api.get("/countries", { params: { teamCategory: "Women" } }).then(res => setCountries(res.data));
  }, []);


  const fetchMatchups = () => {
    if (!battingTeam || !bowlingTeam || !selectedPhases) {
      alert("Please select all filters");
      return;
    }

    setLoading(true);
    api.post("/tactical-matchups", {
      batting_team: battingTeam,
      bowling_team: bowlingTeam,
      selected_phases: selectedPhases,
      team_category: teamCategory,
      analyze_role: viewMode === "opposition_batting" ? "opposition_batting" : "batting"
    })
    .then(res => setMatchups(res.data.matchups || []))
    .finally(() => setLoading(false));

  };

  return (
    <div className="p-4">
      <h3 className="mb-4">Tactical Matchups</h3>

      <div className="mb-3 d-flex gap-3">
        <Button
            variant={viewMode === "my_batting" ? "success" : "outline-secondary"}
            onClick={() => setViewMode("my_batting")}
        >
            Us Batting
        </Button>
        <Button
            variant={viewMode === "opposition_batting" ? "danger" : "outline-secondary"}
            onClick={() => setViewMode("opposition_batting")}
        >
            Opposition Batting
        </Button>
    </div>

      <Form className="row g-3 mb-4">
        <Form.Group className="col-md-3">
          <Form.Label>Country A</Form.Label>
          <Form.Select value={battingTeam} onChange={e => setBattingTeam(e.target.value)}>
            <option value="">Select</option>
            {countries.map(c => <option key={c}>{c}</option>)}
          </Form.Select>
        </Form.Group>

        <Form.Group className="col-md-3">
          <Form.Label>Country B</Form.Label>
          <Form.Select value={bowlingTeam} onChange={e => setBowlingTeam(e.target.value)}>
            <option value="">Select</option>
            {countries.map(c => <option key={c}>{c}</option>)}
          </Form.Select>
        </Form.Group>

        <Form.Group className="col-md-3">
            <Form.Label>Game Phase</Form.Label>
            <div>
                {["Powerplay", "Middle Overs", "Death Overs"].map(phase => (
                <Form.Check
                    inline
                    key={phase}
                    type="checkbox"
                    label={phase}
                    checked={selectedPhases.includes(phase)}
                    onChange={() => {
                    setSelectedPhases(prev =>
                        prev.includes(phase)
                        ? prev.filter(p => p !== phase)
                        : [...prev, phase]
                    );
                    }}
                />
                ))}
            </div>
        </Form.Group>

        <Form.Group className="col-md-1 d-flex align-items-end">
          <Button variant="success" onClick={fetchMatchups}>Go</Button>
        </Form.Group>
      </Form>

      {loading && <Spinner animation="border" />}

        {!loading && matchups.length === 0 && (
        <div className="alert alert-warning">
            No inferred matchups found — not enough historical data for this team, tournament, or phase.
        </div>
        )}

        {matchups.length > 0 && (
        <Table striped bordered hover responsive>
            <thead>
            <tr>
                <th>Batter</th>
                <th>Bowler Type</th>
                <th>Arm</th>
                <th>Balls</th>
                <th>Avg RPB</th>
                <th>Dot %</th>
                <th>Dismissal %</th>
                <th>Grade</th>
            </tr>
            </thead>
            <tbody>
            {matchups.map((m, idx) => (
                <tr key={idx} className={
                m.grade === "Favorable" ? "table-success" :
                m.grade === "Unfavorable" ? "table-danger" : ""
                }>
                <td>{m.batter}</td>
                <td>{m.bowler_type}</td>
                <td>{m.bowling_arm}</td>
                <td>{m.balls_faced}</td>
                <td>{m.avg_runs_per_ball}</td>
                <td>{m.dot_rate}%</td>
                <td>{m.dismissal_rate}%</td>
                <td><strong>{m.grade}</strong></td>
                </tr>
            ))}
            </tbody>
        </Table>
        )}
    </div>
  );
};

export default MatchUpsPage;
