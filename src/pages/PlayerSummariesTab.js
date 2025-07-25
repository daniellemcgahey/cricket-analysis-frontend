import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Card, Form, Button, Spinner, Alert } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";

const PlayerSummaryTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [teamCategory, setTeamCategory] = useState("Women");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/tournaments", { params: { teamCategory } }).then((res) => setTournaments(res.data));
  }, [teamCategory]);

    useEffect(() => {
    if (teamCategory && selectedTournament) {
        api.get("/countries", { params: { team_category: teamCategory, tournament: selectedTournament } })
        .then((res) => setCountries(res.data));
    }
    }, [teamCategory, selectedTournament]);

    useEffect(() => {
    if (selectedCountry && selectedTournament) {
        api.get("/team-players", {
        params: {
            team_category: teamCategory,
            tournament: selectedTournament,
            country_name: selectedCountry
        }
        }).then((res) => {
            const mapped = res.data.map(p => ({
                player_id: p.id,
                player_name: p.name,
                bowling_arm: p.bowling_arm,
                bowling_style: p.bowling_style
            }));
        setPlayers(mapped);
        });

    }
    }, [selectedCountry, selectedTournament, teamCategory]);

const generateStats = async () => {
    if (!selectedPlayer) return;
    setLoading(true);

    try {
        // Replace this with your actual endpoint
        const res = await api.post("/player-summary", {
        team_category: teamCategory,
        tournament: selectedTournament,
        country: selectedCountry,
        player_id: selectedPlayer
        });

        console.log("✅ Summary Data:", res.data);

        // TODO: Update state with returned data to populate accordion sections
    } catch (err) {
        console.error("❌ Error fetching player summary:", err);
    } finally {
        setLoading(false);
    }
    };


  return (
    <div className={`container-fluid py-3 ${containerClass}`}>
      <div className="row">
        <div className="col-md-3">
          <Card className={isDarkMode ? "bg-dark text-white" : ""}>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Team Category</Form.Label>
                <Form.Select value={teamCategory} onChange={(e) => setTeamCategory(e.target.value)}>
                  <option>Women</option>
                  <option>Men</option>
                  <option>U19 Women</option>
                  <option>U19 Men</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tournament</Form.Label>
                <Form.Select value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)}>
                  <option value="">Select</option>
                  {tournaments.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Country</Form.Label>
                <Form.Select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                  <option value="">Select</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Player</Form.Label>
                <Form.Select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
                  <option value="">Select</option>
                  {players.map((p) => (
                    <option key={p.player_id} value={p.player_id}>{p.player_name}</option>
                  ))}
                </Form.Select>
              </Form.Group>

                <Button
                    className="mt-3 w-100"
                    variant="primary"
                    disabled={!selectedPlayer || !selectedTournament || !selectedCountry}
                    onClick={generateStats}
                    >
                    Generate Stats
                </Button>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-9">
          {loading ? <Spinner animation="border" /> : (
            <Accordion defaultActiveKey="0">
              <Accordion.Item eventKey="0">
                <Accordion.Header>Batting</Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                  <p>Batting summary placeholder...</p>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="1">
                <Accordion.Header>Bowling</Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                  <p>Bowling summary placeholder...</p>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="2">
                <Accordion.Header>Fielding</Accordion.Header>
                <Accordion.Body className={isDarkMode ? "bg-dark text-white" : ""}>
                  <p>Fielding summary placeholder...</p>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerSummaryTab; 
