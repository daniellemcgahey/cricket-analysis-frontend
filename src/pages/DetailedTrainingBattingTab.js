import React, { useState, useContext, useRef , useMemo} from "react";
import api from "../api";
import { Card, Spinner, Alert, Button } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import PitchMapChart from "./PitchMapChart";
import WagonWheelChart from "./WagonWheelChart";
import BattingPitchMapFilters from "../components/BattingPitchMapFilters";
import BackButton from "../components/BackButton";

const DetailedTrainingBattingTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [filters, setFilters] = useState({
    teamCategory: "Women",
    country1: "",
    country2: "",
    tournaments: [],
    selectedPhases: ["Powerplay", "Middle Overs", "Death Overs"],
    selectedBowlingArms: ["Left", "Right"],
    selectedBowlerTypes: ["Pace", "Medium", "Off Spin", "Leg Spin"],
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
  const [intentSummary, setIntentSummary] = useState(null);


  const pitchMapRef = useRef();

  const handleGenerate = () => {
    if (!selectedPlayer) {
      alert("Please select a player.");
      return;
    }
  
    const player_ids = selectedPlayer.split(",").map(id => parseInt(id));
    setLoading(true);
  
    const sharedPayload = {
      player_ids: player_ids,
      tournaments: filters.tournaments,
      team_category: filters.teamCategory,
      bowling_arm: filters.selectedBowlingArms,
      bowling_style: filters.selectedBowlerTypes,
      lengths: filters.selectedLengths,
      match_id: filters.selectedMatches.length === 1 ? filters.selectedMatches[0] : null
    };
  
    Promise.all([
      api.post("/player-detailed-batting", sharedPayload),
      api.post("/player-intent-summary", sharedPayload)
    ])

      .then(([battingRes, intentRes]) => {
        const formattedWagonWheel = battingRes.data.wagon_wheel.map(shot => ({
          x: shot.shot_x,
          y: shot.shot_y,
          runs: shot.runs,
          over: shot.over,
          balls_this_over: shot.balls_this_over
        }));
  
        setPitchMapData(battingRes.data.pitch_map);
        setWagonWheelData(formattedWagonWheel);
        setFullBallData(battingRes.data.full_balls);
        setSelectedBallIndexes([]);
        setIntentSummary(intentRes.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        alert("Failed to fetch detailed batting or intent data.");
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
      setSelectedBallIndexes(prev => {
        if (prev.includes(closestIndex)) {
          // If already selected → deselect it
          return prev.filter(idx => idx !== closestIndex);
        } else {
          // If not selected → add it
          return [...prev, closestIndex];
        }
      });
    } else {
      // Clicked on empty space → clear selection
      setSelectedBallIndexes([]);
    }
  };
  

  const adjustedWagonWheelData = useMemo(() => {
    return wagonWheelData.map((line) => ({
      ...line,
      highlight: selectedBallIndexes.some(
        (idx) => 
          fullBallData[idx] &&
          line.over === fullBallData[idx].over &&
          line.balls_this_over === fullBallData[idx].balls_this_over
      )
    }));
  }, [wagonWheelData, selectedBallIndexes, fullBallData]);
  
  

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />
        <div className="row">

          {/* Left - Filters */}
          <div className="col-md-4">
            <BattingPitchMapFilters filters={filters} setFilters={setFilters} />

            <Card className={`mt-3 ${isDarkMode ? "bg-dark text-white" : ""}`}>
              <Card.Body>
                <h5 className="fw-bold">Player Selection</h5>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (filters.country1) {
                        api.get("/team-players", {
                            params: { country_name: filters.country1, team_category: filters.teamCategory }
                          }).then((res) => {
                            const grouped = {};
                            res.data.forEach((p) => {
                              if (!grouped[p.name]) grouped[p.name] = [];
                              grouped[p.name].push(p.id);
                            });
                          
                            setPlayers(grouped);
                          });
                    }
                  }}
                  className="mb-3"
                >
                  Load Players
                </Button>
                <select
                    className="form-select"
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    >
                    <option value="">Select Player</option>
                    {Object.entries(players).map(([name, ids]) => (
                        <option key={name} value={ids.join(",")}>
                        {name} ({ids.length > 1 ? `x${ids.length}` : ""})
                        </option>
                    ))}
                    </select>

                <Button
                  variant="success"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-100 mt-3"
                >
                  {loading ? <Spinner size="sm" animation="border" /> : "Generate Detailed Analysis"}
                </Button>
                {intentSummary && (
                <Card className={`mt-3 ${isDarkMode ? "bg-dark text-white" : ""}`}>
                    <Card.Body>
                    <h5 className="fw-bold">Batting Summary</h5>
                    <table className="table table-sm table-bordered text-center mb-0">
                        <thead>
                        <tr>
                            <th>Total Runs</th>
                            <th>Total Balls</th>
                            <th>Scoring Shot %</th>
                            <th>Avg Intent</th>
                            <th>Scoring Shot % After Dot</th>
                            <th>Avg Intent After Dot</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{intentSummary.total_runs}</td>
                            <td>{intentSummary.balls_faced}</td>
                            <td>{intentSummary.scoring_shot_pct}%</td>
                            <td>{intentSummary.average_intent}</td>
                            <td>{intentSummary.scoring_shot_pct_after_dot}%</td>
                            <td>{intentSummary.average_intent_after_dot}</td>
                        </tr>
                        </tbody>
                    </table>

                    {intentSummary.dismissals && Object.keys(intentSummary.dismissals).length > 0 && (
                        <div className="mt-4">
                        <h6 className="fw-bold">Dismissals</h6>
                        <table className="table table-sm table-bordered text-center">
                            <thead>
                            <tr>
                                <th>Dismissal Type</th>
                                <th>Total</th>
                                <th>After Dot</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.entries(intentSummary.dismissals).map(([type, total]) => (
                                <tr key={type}>
                                <td>{type}</td>
                                <td>{total}</td>
                                <td>{intentSummary.dismissals_after_dot?.[type] || 0}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    )}

                    {intentSummary.shot_selection && Object.keys(intentSummary.shot_selection).length > 0 && (
                    <div className="mt-4">
                        <h6 className="fw-bold">Shot Selection</h6>
                        <table className="table table-sm table-bordered text-center">
                        <thead>
                            <tr>
                            <th>Shot</th>
                            <th>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(intentSummary.shot_selection).map(([shot, count]) => (
                            <tr key={shot}>
                                <td>{shot}</td>
                                <td>{count}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                    )}

                    </Card.Body>
                </Card>
                )}


              </Card.Body>
            </Card>
          </div>

          {/* Right - Charts */}
          <div className="col-md-8">
            {loading ? (
              <Spinner animation="border" />
            ) : (
              <>
                {pitchMapData.length > 0 && wagonWheelData.length > 0 ? (
                  <>
                    <div className="row">
                      <div
                        className="col-lg-6 col-12 mb-5"
                        onClick={handlePitchMapClick}
                        style={{ cursor: "pointer" }}
                      >
                        <div style={{ width: "100%", maxWidth: "600px", height: "800px", padding: "10px", margin: "0 auto" }}>
                          <h5 className="text-center mb-2">Pitch Map (Balls Faced)</h5>
                          <PitchMapChart
                            data={pitchMapData}
                            viewMode="Dots"
                            innerRef={pitchMapRef}
                            selectedBallIndexes={selectedBallIndexes}
                            setProjectedBalls={setProjectedBalls}
                          />
                        </div>
                      </div>

                      <div className="col-lg-6 col-8 mb-5">
                        <h5 className="text-center mb-3">Wagon Wheel (Shots Played)</h5>
                        <WagonWheelChart
                          data={adjustedWagonWheelData}
                          perspective="Lines"
                        />

                      </div>
                    </div>

                    {selectedBallIndexes.length === 1 && fullBallData[selectedBallIndexes[0]] && (
                    <div
                      style={{
                        position: "absolute",
                        top: "45%",
                        left: "64%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: isDarkMode ? "rgba(33, 37, 41, 0.95)" : "rgba(248, 249, 250, 0.95)",
                        padding: "16px",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        zIndex: 1000,
                        width: "180px",
                        textAlign: "left",
                        fontSize: "10px"
                      }}
                    >
                      <h6 className="fw-bold mb-3 text-center">Ball Details</h6>

                      <p className="mb-1"><strong>Bowler:</strong> {fullBallData[selectedBallIndexes[0]].bowler_name}</p>
                      <p className="mb-1"><strong>Type:</strong> {fullBallData[selectedBallIndexes[0]].bowler_type}</p>
                      <p className="mb-1"><strong>Arm:</strong> {fullBallData[selectedBallIndexes[0]].bowling_arm}</p>
                      <p className="mb-1"><strong>Over:</strong> {fullBallData[selectedBallIndexes[0]].over}.{fullBallData[selectedBallIndexes[0]].balls_this_over}</p>
                      <p className="mb-1"><strong>Shot Type:</strong> {fullBallData[selectedBallIndexes[0]].shot_type}</p>
                      <p className="mb-1"><strong>Footwork:</strong> {fullBallData[selectedBallIndexes[0]].footwork}</p>
                      <p className="mb-1"><strong>Shot:</strong> {fullBallData[selectedBallIndexes[0]].shot_selection}</p>
                      <p className="mb-1"><strong>Delivery:</strong> {fullBallData[selectedBallIndexes[0]].delivery_type}</p>
                      <p className="mb-1"><strong>Runs:</strong> {fullBallData[selectedBallIndexes[0]].runs}</p>
                      <p className="mb-0"><strong>Dismissal:</strong> {fullBallData[selectedBallIndexes[0]].dismissal_type ? "Yes" : "No"}</p>
                    </div>
                  )}

                  </>
                ) : (
                  <Alert variant="info">Please generate a report to view Pitch Map and Wagon Wheel.</Alert>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DetailedTrainingBattingTab;
