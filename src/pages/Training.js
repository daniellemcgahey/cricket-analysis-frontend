import React, { useContext } from "react";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";

export default function Training() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />
        <div
          className="comparison-heading-wrapper mb-4 text-center"
          style={{ backgroundColor: "#ffcc29", padding: 5, borderRadius: 10 }}
        >
          <h2 className="fw-bold display-4" style={{ color: "#1b5e20" }}>Training</h2>
        </div>
        <div className={`p-3 rounded ${isDarkMode ? "bg-secondary text-white" : "bg-white border text-dark"}`}>
          Coming soon: intent green-bands per phase, bowler length adherence, and fielding conversion trends.
        </div>
      </div>
    </div>
  );
}
