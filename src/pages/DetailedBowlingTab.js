import React, { useState, useContext, useRef, useMemo } from "react";
import api from "../api";
import { Card, Spinner, Alert, Button } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import PitchMapChart from "./PitchMapChart";
import WagonWheelChart from "./WagonWheelChart";
import BattingPitchMapFilters from "../components/BattingPitchMapFilters";
import BackButton from "../components/BackButton";

const DetailedBowlingTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [filters, setFilters] = useState({
    teamCategory: "Women",
    country1: "",
    country2: "",
    tournaments: [],
    selectedPhases: ["Powerplay", "Middle Overs", "Death Overs"],
    selectedBowlingArms: ["Left", "Right"],
    selectedBowlerTypes: ["Pace", "Medium", "Spin"],
    selectedBattingHands: ["Left", "Right"],
    selectedLengths: ["Full Toss", "Yorker", "Full", "Good", "Short"],
    allMatchesSelected: true,
    selectedMatches: [],
  });

  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [loading, setLoading] = useState(false);

  const [pitchMapData, setPitchMapData] = useState([]);
  const [wagonWheelData, setWagonWheelData] = useState([]);
  const [fullBallData, setFullBallData] = useState([]);
  const [selectedBallIndexes, setSelectedBallIndexes] = useState([]);
  const [projectedBalls, setProjectedBalls] = useState([]);

  const pitchMapRef = useRef();

const handleGenerate = () => {
  if (!selectedPlayer) {
    alert("Please select a player.");
    return;
  }

  setLoading(true);

  const payload = {
    player_id: [selectedPlayer],
    tournaments: filters.tournaments,
    team_category: filters.teamCategory,
    batting_hand: filters.selectedBattingHands,
    match_id: filters.selectedMatches.length === 1 ? filters.selectedMatches[0] : null
  };

  console.log("📤 Sending payload to /player-detailed-bowling:", payload);

  api.post("/player-detailed-bowling", payload)
    .then((res) => {
      console.log("✅ Received response:", res.data);

      const formattedWagonWheel = res.data.wagon_wheel.map(shot => ({
        x: shot.shot_x,
        y: shot.shot_y,
        runs: shot.runs,
        over: shot.over,
        balls_this_over: shot.balls_this_over
      }));

      setPitchMapData(res.data.pitch_map);
      setWagonWheelData(formattedWagonWheel);
      setFullBallData(res.data.full_balls);
      setSelectedBallIndexes([]);
      setLoading(false);
    })
    .catch((err) => {
      console.error("❌ Failed to fetch detailed bowling data:", err.response?.data || err.message);
      setLoading(false);
      alert("Failed to fetch detailed bowling data.");
    });
};


  const handlePitchMapClick = (e) => {
    if (!pitchMapRef.current || !projectedBalls.length) return;
    const rect = pitchMapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    let minDist = Infinity;
    let closestIndex = null;
    projectedBalls.forEach((ball, idx) => {
      const dist = Math.hypot(clickX - ball.x, clickY - ball.y);
      if (dist < 10 && dist < minDist) {
        minDist = dist;
        closestIndex = idx;
      }
    });
    if (closestIndex !== null) {
      setSelectedBallIndexes(prev =>
        prev.includes(closestIndex) ? prev.filter(i => i !== closestIndex) : [...prev, closestIndex]
      );
    } else {
      setSelectedBallIndexes([]);
    }
  };

  const adjustedWagonWheelData = useMemo(() => {
    return wagonWheelData.map(line => ({
      ...line,
      highlight: selectedBallIndexes.some(
        idx => fullBallData[idx] && line.over === fullBallData[idx].over && line.balls_this_over === fullBallData[idx].balls_this_over
      )
    }));
  }, [wagonWheelData, selectedBallIndexes, fullBallData]);

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />
        <div className="row">
          <div className="col-md-4">
            <BattingPitchMapFilters filters={filters} setFilters={setFilters} />
            <Card className={`mt-3 ${isDarkMode ? "bg-dark text-white" : ""}`}>
              <Card.Body>
                <h5 className="fw-bold">Bowler Selection</h5>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (filters.country1) {
                      api.get("/team-players", {
                        params: { country_name: filters.country1, team_category: filters.teamCategory }
                      }).then(res => setPlayers(res.data));
                    }
                  }}
                  className="mb-3"
                >
                  Load Players
                </Button>
                <select
                  className="form-select"
                  value={String(selectedPlayer)}
                  onChange={(e) => setSelectedPlayer(parseInt(e.target.value))}
                >
                  <option value="">Select Player</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

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
            ) : (
              pitchMapData.length > 0 && wagonWheelData.length > 0 ? (
                <div className="row">
                  <div className="col-lg-6 col-12 mb-5" onClick={handlePitchMapClick} style={{ cursor: "pointer" }}>
                    <div style={{ width: "100%", maxWidth: "600px", height: "800px", padding: "10px", margin: "0 auto" }}>
                      <h5 className="text-center mb-2">Pitch Map (Balls Bowled)</h5>
                      <PitchMapChart
                        data={pitchMapData}
                        viewMode="Dots"
                        innerRef={pitchMapRef}
                        selectedBallIndexes={selectedBallIndexes}
                        setProjectedBalls={setProjectedBalls}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-12 mb-5">
                    <h5 className="text-center mb-3">Wagon Wheel (Runs Conceded)</h5>
                    <WagonWheelChart
                      data={adjustedWagonWheelData}
                      perspective="Lines"
                    />
                  </div>
                </div>
              ) : (
                <Alert variant="info">Please generate a report to view Pitch Map and Wagon Wheel.</Alert>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedBowlingTab;
