import React, { useState, useEffect, useContext, useRef } from "react";
import api from "../api";
import DarkModeContext from "../DarkModeContext";
import WagonWheelChart from "./WagonWheelChart";
import PitchMapChart from "./PitchMapChart";

import { Accordion, Card, Button, Alert, Row, Col } from "react-bootstrap";

const MatchReportPage = () => {
  const { isDarkMode } = useContext(DarkModeContext);

  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const [teamOptions, setTeamOptions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const [wagonWheelData, setWagonWheelData] = useState([]);
  const [pitchMapData, setPitchMapData] = useState([]);

  const wagonWheelRef = useRef(null);
  const pitchMapRef = useRef(null);


  // Load tournaments when team category changes
  useEffect(() => {
    if (!teamCategory) {
      setTournaments([]);
      setSelectedTournament("");
      setMatches([]);
      setSelectedMatchId(null);
      return;
    }
    api.get("/tournaments", { params: { teamCategory } }) // <-- Fix here!
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

  useEffect(() => {
    if (!selectedPlayerId || !selectedMatchId) {
      setWagonWheelData([]);
      return;
    }

    api.get("/player-wagon-wheel-data", {
      params: { matchId: selectedMatchId, playerId: selectedPlayerId }
    })
    .then(res => {
      // Remap to the expected format
      const remappedData = res.data.map(shot => ({
        x: shot.shot_x,
        y: shot.shot_y,
        runs: shot.runs
      }));
      setWagonWheelData(remappedData);
    })
    .catch(err => {
      console.error("❌ Error fetching wagon wheel data:", err);
      setWagonWheelData([]);
    });
  }, [selectedPlayerId, selectedMatchId]);

  useEffect(() => {
    if (!selectedPlayerId || !selectedMatchId) {
      setPitchMapData([]);
      return;
    }

    api.get("/player-pitch-map-data", {
      params: { matchId: selectedMatchId, playerId: selectedPlayerId }
    })
    .then(res => {
      const remappedData = res.data.map(ball => ({
        x: ball.pitch_x,
        y: ball.pitch_y
      }));
      setPitchMapData(remappedData);
    })
    .catch(err => {
      console.error("❌ Error fetching pitch map data:", err);
      setPitchMapData([]);
    });
  }, [selectedPlayerId, selectedMatchId]);




  const uploadWagonWheel = async (base64Image) => {
    try {
      await api.post("/api/upload-wagon-wheel", { image: base64Image });
      console.log("✅ Wagon wheel image uploaded successfully");
    } catch (error) {
      console.error("❌ Failed to upload wagon wheel image", error);
    }
  };

  const generatePlayerReport = async () => {
    if (!selectedMatchId || !selectedPlayerId) return;

    const canvas = wagonWheelRef.current;
    if (canvas) {
      const base64Image = canvas.toDataURL("image/png");

      try {
        await api.post("/api/upload-wagon-wheel", { image: base64Image });
        console.log("✅ Wagon wheel image uploaded successfully");
      } catch (error) {
        console.error("❌ Error uploading wagon wheel image:", error);
      }
    } else {
      console.warn("⚠️ No wagon wheel canvas found, skipping upload.");
    }

    window.open(
      `${api.defaults.baseURL}/match-report/${selectedMatchId}/player/${selectedPlayerId}`,
      "_blank"
    );
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
      <Row>
        <Col md={4}>
          <Accordion defaultActiveKey="0">
            {/* Team Category */}
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <h5 className="fw-bold m-0">Team Category</h5>
              </Accordion.Header>
              <Accordion.Body>
                <select
                  className="form-select mb-2"
                  value={teamCategory}
                  onChange={e => setTeamCategory(e.target.value)}
                >
                  <option value="">-- Select Team Category --</option>
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                  <option value="U19 Women">U19 Women</option>
                  <option value="U19 Men">U19 Men</option>
                  <option value="Training">Training</option>
                </select>
              </Accordion.Body>
            </Accordion.Item>

            {/* Tournament */}
            <Accordion.Item eventKey="1">
              <Accordion.Header>
                <h5 className="fw-bold m-0">Tournament</h5>
              </Accordion.Header>
              <Accordion.Body>
                <select
                  className="form-select mb-2"
                  value={selectedTournament}
                  onChange={e => setSelectedTournament(e.target.value)}
                  disabled={tournaments.length === 0}
                >
                  <option value="">-- Select Tournament --</option>
                  {tournaments.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {tournaments.length === 0 && (
                  <small className="text-muted">No tournaments available</small>
                )}
              </Accordion.Body>
            </Accordion.Item>

            {/* Match */}
            <Accordion.Item eventKey="2">
              <Accordion.Header>
                <h5 className="fw-bold m-0">Match</h5>
              </Accordion.Header>
              <Accordion.Body>
                <select
                  className="form-select mb-2"
                  value={selectedMatchId || ""}
                  onChange={e => setSelectedMatchId(+e.target.value)}
                  disabled={matches.length === 0}
                >
                  <option value="">-- Select Match --</option>
                  {matches.map(m => (
                    <option key={m.match_id} value={m.match_id}>
                      {m.team_a} vs {m.team_b} ({m.match_date})
                    </option>
                  ))}
                </select>
                {matches.length === 0 && (
                  <small className="text-muted">No matches available</small>
                )}
              </Accordion.Body>
            </Accordion.Item>

            {/* Team */}
            <Accordion.Item eventKey="3">
              <Accordion.Header>
                <h5 className="fw-bold m-0">Country</h5>
              </Accordion.Header>
              <Accordion.Body>
                <select
                  className="form-select mb-2"
                  value={selectedTeam?.id || ""}
                  onChange={e => {
                    const id = +e.target.value;
                    setSelectedTeam(teamOptions.find(t => t.id === id) || null);
                  }}
                  disabled={teamOptions.length === 0}
                >
                  <option value="">-- Select Team --</option>
                  {teamOptions.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {teamOptions.length === 0 && (
                  <small className="text-muted">No teams available</small>
                )}
              </Accordion.Body>
            </Accordion.Item>

            {/* Player */}
            <Accordion.Item eventKey="4">
              <Accordion.Header>
                <h5 className="fw-bold m-0">Player</h5>
              </Accordion.Header>
              <Accordion.Body>
                <select
                  className="form-select mb-2"
                  value={selectedPlayerId || ""}
                  onChange={e => setSelectedPlayerId(+e.target.value)}
                  disabled={players.length === 0}
                >
                  <option value="">-- Select Player --</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {players.length === 0 && (
                  <small className="text-muted">No players available</small>
                )}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

        </Col>

        {/* Action Buttons */}
        <Col md={8} className="d-flex flex-column align-items-center justify-content-center">
          <Card className="p-3 shadow-sm w-100">
            {/* Add heading here! */}
            <h2 className="fw-bold mb-3 text-center">Generate Match Reports</h2>

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

          {/* 🔥 Include your WagonWheelChart here */}
          <div style={{ display: "none" }}>
            <WagonWheelChart
              data={wagonWheelData}
              perspective="Lines"
              canvasRef={wagonWheelRef} // ✅ Pass down ref
            />
          </div>

          {/* 🔥 Include your PitchMapChart here */}
          <div style={{ display: "none" }}>
            <PitchMapChart
              data={pitchMapData}
              canvasRef={pitchMapRef} // ✅ Pass down ref
            />
          </div>
        </Col>

      </Row>
  );
};

export default MatchReportPage;
