import React, { useContext } from "react";
import { Tabs, Tab } from "react-bootstrap";
import DarkModeContext from '../DarkModeContext';
import BackButton from "../components/BackButton";
import BattingLeadersTab from "./BattingLeadersTab";

import "./TabStyles.css";

// Placeholder Components – Replace with actual leaderboard components
const TournamentStatsTab = () => <div className="p-4">Tournament Summary Coming Soon</div>;
const BowlingLeadersTab = () => <div className="p-4">Bowling Leaderboards Coming Soon</div>;
const FieldingLeadersTab = () => <div className="p-4">Fielding Leaderboards Coming Soon</div>;

const TournamentsTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="mb-3 custom-tabs nav-pills">
        <BackButton isDarkMode={isDarkMode} />
        <div
          className="comparison-heading-wrapper mb-4 text-center"
          style={{ backgroundColor: "#ffcc29", padding: "5px", borderRadius: "10px" }}
        >
          <h2 className="fw-bold display-4" style={{ color: "#1b5e20" }}>
            Tournament Overview
          </h2>
        </div>
        <Tabs defaultActiveKey="stats" className="mb-3" fill variant={isDarkMode ? "dark" : "tabs"}>
          <Tab eventKey="stats" title="Tournament Stats">
            <TournamentStatsTab />
          </Tab>
          <Tab eventKey="batting" title="Batting Leaderboards">
            <BattingLeadersTab />
          </Tab>
          <Tab eventKey="bowling" title="Bowling Leaderboards">
            <BowlingLeadersTab />
          </Tab>
          <Tab eventKey="fielding" title="Fielding Leaderboards">
            <FieldingLeadersTab />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default TournamentsTab;
