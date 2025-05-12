import React, { useContext } from "react";
import { Tabs, Tab } from "react-bootstrap";
import DarkModeContext from '../DarkModeContext';
import BackButton from "../components/BackButton";
import IndividualBattingTab from "./IndividualBattingTab";
import IndividualBowlingTab from "./IndividualBowlingTab";
import DetailedBattingTab from "./DetailedBattingTab";
import DetailedBowlingTab from "./DetailedBowlingTab";
import TrendsTab from "./TrendsTab";

import "./TabStyles.css";

const FieldingTab = () => <div className="p-4">Fielding Analysis Coming Soon</div>;
const ImpactTab = () => <div className="p-4">Player Impact Analysis Coming Soon</div>;


const IndividualTabs = () => {
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
            Individual Analysis
          </h2>
        </div>
        <Tabs defaultActiveKey="batting" className="mb-3" fill variant={isDarkMode ? "dark" : "tabs"}>
          <Tab eventKey="batting" title="Batting">
            <IndividualBattingTab />
          </Tab>
          <Tab eventKey="detailed-batting" title="Detailed Batting">
            <DetailedBattingTab />
          </Tab>
          <Tab eventKey="bowling" title="Bowling">
            <IndividualBowlingTab />
          </Tab>
          <Tab eventKey="detailed-bowling" title="Detailed Bowling">
            <DetailedBowlingTab />
          </Tab>
          <Tab eventKey="fielding" title="Fielding">
            <FieldingTab />
          </Tab>
          <Tab eventKey="impact" title="Player Impact">
            <ImpactTab />
          </Tab>
          <Tab eventKey="trends" title="Trends & Consistency">
            <TrendsTab />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default IndividualTabs;
