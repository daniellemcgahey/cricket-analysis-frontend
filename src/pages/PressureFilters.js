import React, { useEffect, useState } from "react";
import axios from "axios";
import { Form } from "react-bootstrap";

const phases = ["Powerplay", "Middle Overs", "Death Overs"];

const PressureFilters = ({ filters, setFilters }) => {
  const [countries, setCountries] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/countries").then((res) => setCountries(res.data));
    axios.get("http://localhost:8000/tournaments").then((res) => setTournaments(res.data));
    axios.get("http://localhost:8000/matches").then((res) => setMatches(res.data));
  }, []);

  const handleChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const toggleMatchSelection = (matchId) => {
    let updatedMatches = filters.selectedMatches.includes(matchId)
      ? filters.selectedMatches.filter((id) => id !== matchId)
      : [...filters.selectedMatches, matchId];
    setFilters({ ...filters, selectedMatches: updatedMatches });
  };

  return (
    <Form>
      {/* Country 1 */}
      <Form.Group className="mb-3">
        <Form.Label>Country 1</Form.Label>
        <Form.Select
          value={filters.country1}
          onChange={(e) => handleChange("country1", e.target.value)}
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Country 2 */}
      <Form.Group className="mb-3">
        <Form.Label>Country 2</Form.Label>
        <Form.Select
          value={filters.country2}
          onChange={(e) => handleChange("country2", e.target.value)}
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Tournaments */}
      <Form.Group className="mb-3">
        <Form.Label>Tournaments</Form.Label>
        <Form.Select
          multiple
          value={filters.tournaments}
          onChange={(e) =>
            handleChange("tournaments", Array.from(e.target.selectedOptions, (o) => o.value))
          }
        >
          {tournaments.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Phases */}
      <Form.Group className="mb-3">
        <Form.Label>Game Phases</Form.Label>
        <Form.Select
          multiple
          value={filters.selectedPhases}
          onChange={(e) =>
            handleChange("selectedPhases", Array.from(e.target.selectedOptions, (o) => o.value))
          }
        >
          {phases.map((phase) => (
            <option key={phase} value={phase}>{phase}</option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Match Selection */}
      <Form.Group className="mb-2">
        <Form.Check
          type="checkbox"
          label="Select All Matches"
          checked={filters.allMatchesSelected}
          onChange={(e) =>
            setFilters({ ...filters, allMatchesSelected: e.target.checked, selectedMatches: [] })
          }
        />
      </Form.Group>

      {!filters.allMatchesSelected && (
        <div className="mb-3" style={{ maxHeight: "150px", overflowY: "scroll" }}>
          {matches.map((match) => (
            <Form.Check
              key={match.match_id}
              type="checkbox"
              label={`${match.tournament}: ${match.team_a} vs ${match.team_b} (${match.match_date})`}
              checked={filters.selectedMatches.includes(match.match_id)}
              onChange={() => toggleMatchSelection(match.match_id)}
            />
          ))}
        </div>
      )}
    </Form>
  );
};

export default PressureFilters;
