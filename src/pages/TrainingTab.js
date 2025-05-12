import React, { useContext } from "react";
import { Tabs, Tab } from "react-bootstrap";
import DarkModeContext from '../DarkModeContext';
import BackButton from "../components/BackButton";
import TrainingBattingTab from "./TrainingBattingTab";
import TrainingBowlingTab from "./TrainingBowlingTab";
import DetailedTrainingBattingTab from "./DetailedTrainingBattingTab";
import TrainingTrendsTab from "./TrainingTrendsTab";

import "./TabStyles.css";

const FieldingTab = () => <div className="p-4">Fielding Analysis Coming Soon</div>;


const TrainingTabs = () => {
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
            Training Analysis
          </h2>
        </div>
        <Tabs defaultActiveKey="batting" className="mb-3" fill variant={isDarkMode ? "dark" : "tabs"}>
          <Tab eventKey="batting" title="Batting">
            <TrainingBattingTab />
          </Tab>
          <Tab eventKey="detailed-batting" title="Detailed Batting">
            <DetailedTrainingBattingTab />
          </Tab>
          <Tab eventKey="bowling" title="Bowling">
            <TrainingBowlingTab />
          </Tab>
          <Tab eventKey="fielding" title="Fielding">
            <FieldingTab />
          </Tab>
          <Tab eventKey="trends" title="Trends & Consistency">
            <TrainingTrendsTab />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default TrainingTabs;
