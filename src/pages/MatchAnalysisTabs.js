// src/pages/MatchAnalysisTabs.jsx
import React, { useContext } from "react";
import { Tabs, Tab } from "react-bootstrap";
import DarkModeContext from '../DarkModeContext';
import BackButton from "../components/BackButton"; // <- Add this import
import MatchScorecardPage from './MatchScorecardPage';
import MatchPressurePage from './MatchPressurePage';
import PartnershipStatsPage from './PartnershipStatPage';
import "./TabStyles.css"; // 🔥 Custom styles here

// Placeholder content — swap with real pages later
const PlayerStatsPage = () => <div className="p-4">Player Stats Coming Soon</div>;
const InGamePage = () => <div className="p-4">In-Game Analysis Coming Soon</div>;

const MatchAnalysisTabs = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="mb-3 custom-tabs nav-pills">
      <BackButton isDarkMode={isDarkMode} />
        <h2 className="mb-4 text-center fw-bold display-4">Match Analysis</h2>
        <Tabs defaultActiveKey="scorecard" className="mb-3" fill variant={isDarkMode ? "dark" : "tabs"}>
          <Tab eventKey="scorecard" title="Scorecard">
            <MatchScorecardPage />
          </Tab>
          <Tab eventKey="player-stats" title="Player Statistics">
            <PlayerStatsPage />
          </Tab>
          <Tab eventKey="partnership-stats" title="Partnerships">
            <PartnershipStatsPage />
          </Tab>
          <Tab eventKey="pressure" title="Pressure Analysis">
            <MatchPressurePage />
          </Tab>
          <Tab eventKey="in-game" title="In Game">
            <InGamePage />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default MatchAnalysisTabs;
