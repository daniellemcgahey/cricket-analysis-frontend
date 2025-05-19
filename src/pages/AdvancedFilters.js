// src/components/AdvancedFilters.jsx
import React, { useState } from "react";
import { Accordion, Form } from "react-bootstrap";

const AdvancedFilters = ({
  tournamentOptions,
  onTournamentChange,
  onPhaseChange,
  onBowlerTypeChange,
  onBowlingArmChange,
  
}) => {
  // Define your options for each category.
  const phaseOptions = ["Powerplay", "Middle Overs", "Death Overs"];
  const bowlerTypeOptions = ["Pace", "Medium", "Leg Spin", "Off Spin"];
  const bowlingArmOptions = ["Left", "Right"];

  // Use default selections where desired.
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [selectedPhases, setSelectedPhases] = useState(phaseOptions); // All phases by default.
  const [selectedBowlerTypes, setSelectedBowlerTypes] = useState(["Pace", "Medium", "Leg Spin", "Off Spin"]); // Pre-selected.
  const [selectedBowlingArms, setSelectedBowlingArms] = useState(bowlingArmOptions); // Both by default.

  // Generic handler for checkbox changes.
  const handleCheckboxChange = (option, currentSelection, setSelection, onChangeCallback) => {
    let updated;
    if (currentSelection.includes(option)) {
      updated = currentSelection.filter((item) => item !== option);
    } else {
      updated = [...currentSelection, option];
    }
    setSelection(updated);
    onChangeCallback(updated);
  };

  // Helper to render a group of checkboxes given an array of options.
  const renderCheckboxes = (optionsArray, currentSelection, setSelection, onChangeCallback) =>
    optionsArray.map((option) => (
      <Form.Check
        key={option}
        type="checkbox"
        id={option}
        label={option}
        checked={currentSelection.includes(option)}
        onChange={() =>
          handleCheckboxChange(option, currentSelection, setSelection, onChangeCallback)
        }
      />
    ));

  return (
    <Accordion defaultActiveKey={null} className="mb-4">
      {/* Tournaments Accordion */}
      <Accordion.Item eventKey="0">
        <Accordion.Header>Tournaments</Accordion.Header>
        <Accordion.Body>
          {tournamentOptions.map((option) => (
            <Form.Check
              key={option}
              type="checkbox"
              id={`tournament-${option}`}
              label={option}
              checked={selectedTournaments.includes(option)}
              onChange={() =>
                handleCheckboxChange(option, selectedTournaments, setSelectedTournaments, onTournamentChange)
              }
            />
          ))}
        </Accordion.Body>
      </Accordion.Item>

      {/* Phases Accordion */}
      <Accordion.Item eventKey="1">
        <Accordion.Header>Game Phases</Accordion.Header>
        <Accordion.Body>
          {renderCheckboxes(
            phaseOptions,
            selectedPhases,
            setSelectedPhases,
            onPhaseChange
          )}
        </Accordion.Body>
      </Accordion.Item>

      {/* Bowling Type Accordion */}
      <Accordion.Item eventKey="2">
        <Accordion.Header>Bowler Type</Accordion.Header>
        <Accordion.Body>
          {renderCheckboxes(
            bowlerTypeOptions,
            selectedBowlerTypes,
            setSelectedBowlerTypes,
            onBowlerTypeChange
          )}
        </Accordion.Body>
      </Accordion.Item>

      {/* Bowling Arm Accordion */}
      <Accordion.Item eventKey="3">
        <Accordion.Header>Bowling Arm</Accordion.Header>
        <Accordion.Body>
          {renderCheckboxes(
            bowlingArmOptions,
            selectedBowlingArms,
            setSelectedBowlingArms,
            onBowlingArmChange
          )}
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default AdvancedFilters;
