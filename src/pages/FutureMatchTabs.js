// src/pages/FutureMatchesTabs.jsx
import React, { useContext } from "react";
import { Tabs, Tab } from "react-bootstrap";
import DarkModeContext from '../DarkModeContext';
import BackButton from "../components/BackButton"; // <- Add this import
import MatchUpsPage from "./MatchUpsPage";
import "./TabStyles.css"; // 🔥 Custom styles here

// Placeholder content
const StrengthsPage = () => <div className="p-4">Strengths and Weaknesses Coming Soon</div>;

const FutureMatchesTabs = () => {
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
              Future Matches
          </h2>
          </div>
          <Tabs defaultActiveKey="match-ups" className="mb-3" fill variant={isDarkMode ? "dark" : "tabs"}>
            <Tab eventKey="match-ups" title="Match Ups">
              <MatchUpsPage />
            </Tab>
            <Tab eventKey="strengths" title="Strengths & Weaknesses">
              <StrengthsPage />
            </Tab>
          </Tabs>
        </div>
      </div>
    
  );
};

export default FutureMatchesTabs;
