// src/components/StatSelector.jsx
import React, { useState } from "react";
import { Accordion, Form, Button } from "react-bootstrap";

const StatSelector = ({ onSelectionChange }) => {
  const battingStats = [
    "Innings", "Runs Off Bat", "Batting Extras", "Total Runs", "Balls Faced", "Strike Rate", "Batters Average",
    "Dot Balls Faced", "Scoring Shot %", "1s", "2s", "3s", "4s", "6s",
    "25+ Partnerships", "Dismissals", "Attacking Shot %", "Defensive Shot %", "Rotation Shot %", "Avg Intent Score"
  ];

  const bowlingStats = [
    "Overs", "Dot Balls Bowled", "Dot Ball %", "Runs Conceded", "Wickets",
    "Economy", "Bowlers Average", "Extras", "Boundaries Conceded"
  ];

  const fieldingStats = [
    "Catch", "Run Out", "Drop Catch", "Boundary Save", "Clean Stop/Pick Up",
    "Direct Hit", "Missed Catch", "Missed Run Out", "Missed Fielding", "Fumble",
    "Overthrow", "Taken Half Chance", "Missed Half Chance", "Total Balls Fielded",
    "Runs Saved/Allowed", "Clean Hands %", "Conversion Rate", "Pressure Score", "Fielding Impact Rating"
  ];

  const allStats = [...battingStats, ...bowlingStats, ...fieldingStats];
  const basicStats = ["Runs Scored", "Wickets", "Strike Rate", "Economy", "Catch", "Run Out"];
  const advancedStats = [
    "Innings", "Dismissals", "Dot Ball %", "Average", "Boundaries Conceded", 
    "Attacking Shot %", "Dot Balls", "Pressure Score", "Fielding Impact Rating"
  ];

  const [selected, setSelected] = useState({});

  const handleCheckboxChange = (stat, checked) => {
    const updated = { ...selected, [stat]: checked };
    setSelected(updated);
    onSelectionChange(Object.keys(updated).filter(key => updated[key]));
  };

  const applyPreset = (presetStats) => {
    const updated = {};
    presetStats.forEach(stat => updated[stat] = true);
    setSelected(updated);
    onSelectionChange(presetStats);
  };

  const renderCheckboxes = (statsArray) =>
    statsArray.map((stat) => (
      <Form.Check
        key={stat}
        type="checkbox"
        id={stat}
        label={stat}
        checked={!!selected[stat]}
        onChange={(e) => handleCheckboxChange(stat, e.target.checked)}
      />
    ));

  const handleClearAll = () => {
    const cleared = {};
    setSelected(cleared);
    onSelectionChange([]);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => applyPreset(basicStats)}>Basic</button>
          <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => applyPreset(advancedStats)}>Advanced</button>
          <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => applyPreset(allStats)}>All</button>
          <button className="btn btn-outline-danger btn-sm" onClick={handleClearAll}>Clear All</button>
        </div>
      </div>

      <Accordion defaultActiveKey={null} className="mb-4">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Batting Stats</Accordion.Header>
          <Accordion.Body>{renderCheckboxes(battingStats)}</Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="1">
          <Accordion.Header>Bowling Stats</Accordion.Header>
          <Accordion.Body>{renderCheckboxes(bowlingStats)}</Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="2">
          <Accordion.Header>Fielding Stats</Accordion.Header>
          <Accordion.Body>{renderCheckboxes(fieldingStats)}</Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </>
  );
};

export default StatSelector;
