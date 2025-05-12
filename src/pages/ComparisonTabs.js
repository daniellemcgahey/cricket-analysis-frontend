// src/pages/ComparisonTabs.jsx
import React, { useContext } from "react";
import { Tabs, Tab } from "react-bootstrap";
import CountryComparisonPage from "./CountryComparisonPage";
import CountryOverTournamentPage from "./CountryOverTournamentPage";
import PlayerComparisonPage from "./PlayerComparisonPage";
import PlayerOverTournamentPage from "./PlayerOverTournamentPage";
import PressureTab from "./PressureTab";
import WagonWheelComparisonPage from "./WagonWheelComparisonPage"
import PitchMapComparisonPage from "./PitchMapComparisonPage"
import DarkModeContext from '../DarkModeContext';
import BackButton from "../components/BackButton"; // <- Add this import
import "./TabStyles.css"; // 🔥 Custom styles here

const ComparisonTabs = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="mb-3 custom-tabs nav-pills">
      <BackButton isDarkMode={isDarkMode} />
        <div
        className="comparison-heading-wrapper mb-4 text-center"
        style={{
            backgroundColor: "#ffcc29", // Light teal
            padding: "5px",
            borderRadius: "10px"
        }}
        >
        <h2 className="fw-bold display-4" style={{ color: "#1b5e20" }}>
            Comparison Analysis
        </h2>
        </div>
        <Tabs defaultActiveKey="country" className="mb-3" fill variant={isDarkMode ? "dark" : "tabs"}>
          <Tab eventKey="country" title="Country vs Country">
            <CountryComparisonPage />
          </Tab>
          <Tab eventKey="country-tournament" title="Country Over Tournaments">
            <CountryOverTournamentPage />
          </Tab>
          <Tab eventKey="player" title="Player vs Player">
            <PlayerComparisonPage />
          </Tab>
          <Tab eventKey="player-tournament" title="Player Over Tournaments">
            <PlayerOverTournamentPage />
          </Tab>
          <Tab eventKey="pressure" title="Pressure Analysis">
            <PressureTab />
          </Tab>
          <Tab eventKey="wagon-wheel" title="Wagon Wheel">
            <WagonWheelComparisonPage />
          </Tab>
          <Tab eventKey="pitch-map" title="Pitch Map">
            <PitchMapComparisonPage />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default ComparisonTabs;
