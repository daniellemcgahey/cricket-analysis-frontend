import React, { useEffect, useState } from "react";
import axios from "axios";
import { Accordion, Form } from "react-bootstrap";

const ComparisonFilters = ({ onFilterChange }) => {
  const [countries, setCountries] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);

  const [country1, setCountry1] = useState("");
  const [country2, setCountry2] = useState("");
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [selectedPhases, setSelectedPhases] = useState(["Powerplay", "Middle Overs", "Death Overs"]);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [selectAllMatches, setSelectAllMatches] = useState(true);

  // Load dropdowns
  useEffect(() => {
    axios.get("http://localhost:8000/countries").then(res => setCountries(res.data));
    axios.get("http://localhost:8000/tournaments").then(res => setTournaments(res.data));
    axios.get("http://localhost:8000/matches").then(res => setMatches(res.data));
  }, []);

  // Auto-select matches when select all is toggled
  useEffect(() => {
    if (selectAllMatches) {
      setSelectedMatches(matches.map(m => m.match_id));
    }
  }, [matches, selectAllMatches]);

  // Send filters up to parent
  useEffect(() => {
    if (country1 && country2 && selectedTournaments.length > 0) {
      onFilterChange({
        country1,
        country2,
        selectedTournaments,
        selectedPhases,
        selectedMatches,
        allMatchesSelected: selectAllMatches,
      });
    }
  }, [country1, country2, selectedTournaments, selectedPhases, selectedMatches, selectAllMatches, onFilterChange]);

  return (
    <Accordion defaultActiveKey="0">
      {/* Country Selection */}
      <Accordion.Item eventKey="0">
        <Accordion.Header>Country Selection</Accordion.Header>
        <Accordion.Body>
          <Form.Select className="mb-3" value={country1} onChange={(e) => setCountry1(e.target.value)}>
            <option value="">Select Country 1</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </Form.Select>
          <Form.Select value={country2} onChange={(e) => setCountry2(e.target.value)}>
            <option value="">Select Country 2</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </Form.Select>
        </Accordion.Body>
      </Accordion.Item>

      {/* Filters */}
      <Accordion.Item eventKey="1">
        <Accordion.Header>Filters</Accordion.Header>
        <Accordion.Body>
          <label className="fw-bold">Tournaments</label>
          {tournaments.map(t => (
            <Form.Check
              key={t}
              type="checkbox"
              label={t}
              checked={selectedTournaments.includes(t)}
              onChange={() =>
                setSelectedTournaments(prev =>
                  prev.includes(t) ? prev.filter(item => item !== t) : [...prev, t]
                )
              }
            />
          ))}

          <hr />

          <label className="fw-bold">Game Phases</label>
          {["Powerplay", "Middle Overs", "Death Overs"].map(phase => (
            <Form.Check
              key={phase}
              type="checkbox"
              label={phase}
              checked={selectedPhases.includes(phase)}
              onChange={() =>
                setSelectedPhases(prev =>
                  prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase]
                )
              }
            />
          ))}
        </Accordion.Body>
      </Accordion.Item>

      {/* Match Selector */}
      <Accordion.Item eventKey="2">
        <Accordion.Header>Matches</Accordion.Header>
        <Accordion.Body>
          <Form.Check
            type="checkbox"
            label="Select All Matches"
            checked={selectAllMatches}
            onChange={() => setSelectAllMatches(prev => !prev)}
          />
          {!selectAllMatches && (
            <Form.Select multiple value={selectedMatches} onChange={(e) =>
              setSelectedMatches(Array.from(e.target.selectedOptions, opt => parseInt(opt.value)))
            }>
              {matches.map(m => (
                <option key={m.match_id} value={m.match_id}>
                  {m.tournament}: {m.team_a} vs {m.team_b} ({m.match_date})
                </option>
              ))}
            </Form.Select>
          )}
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default ComparisonFilters;
