// src/pages/IndividualTabs.jsx
import React, { useContext } from "react";
import { Tabs, Tab } from "react-bootstrap";
import DarkModeContext from '../DarkModeContext';
import BackButton from "../components/BackButton"; // <- Add this import
import "./TabStyles.css"; // 🔥 Custom styles here

// Placeholder pages — create real ones later
const BattingPage = () => <div className="p-4">Batting Analysis Coming Soon</div>;
const BowlingPage = () => <div className="p-4">Bowling Analysis Coming Soon</div>;
const FieldingPage = () => <div className="p-4">Fielding Analysis Coming Soon</div>;

const IndividualTabs = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="mb-3 custom-tabs nav-pills">
      <BackButton isDarkMode={isDarkMode} />
        <h2 className="mb-4 text-center">Individual Player Analysis</h2>
        <Tabs defaultActiveKey="batting" className="mb-3" fill variant={isDarkMode ? "dark" : "tabs"}>
          <Tab eventKey="batting" title="Batting">
            <BattingPage />
          </Tab>
          <Tab eventKey="bowling" title="Bowling">
            <BowlingPage />
          </Tab>
          <Tab eventKey="fielding" title="Fielding">
            <FieldingPage />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default IndividualTabs;
