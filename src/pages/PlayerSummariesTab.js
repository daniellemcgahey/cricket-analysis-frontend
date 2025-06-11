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
      api.get("/countries", { params: { teamCategory, tournament: selectedTournament } })
        .then((res) => setCountries(res.data));
    }
  }, [teamCategory, selectedTournament]);

  useEffect(() => {
    if (selectedCountry && selectedTournament) {
      api.get("/team-players", {
        params: {
            teamCategory,
            tournament: selectedTournament,
            country: selectedCountry
        }
        }).then((res) => setPlayers(res.data));
    }
  }, [selectedCountry, selectedTournament]);

  return (
    <div className={`container-fluid py-3 ${containerClass}`}>
      <div className="row">
        <div className="col-md-3">
          <Card className="mb-3">
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
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-9">
          {loading ? <Spinner animation="border" /> : (
            <Accordion defaultActiveKey="0">
              <Accordion.Item eventKey="0">
                <Accordion.Header>Batting</Accordion.Header>
                <Accordion.Body>
                  <p>Batting summary placeholder...</p>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="1">
                <Accordion.Header>Bowling</Accordion.Header>
                <Accordion.Body>
                  <p>Bowling summary placeholder...</p>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="2">
                <Accordion.Header>Fielding</Accordion.Header>
                <Accordion.Body>
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
