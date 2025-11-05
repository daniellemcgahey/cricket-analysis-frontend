import React, { useContext } from "react";
import { Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";

export default function CoachesHub() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const cardVariant = isDarkMode ? "dark" : "light";

  const items = [
    { title: "Pre-game", desc: "Plans, matchups, venue & toss", href: "/coaches/pre" },
    { title: "Post-game", desc: "Team & player reports, KPIs, medals", href: "/coaches/post" },
    { title: "Post-tournament", desc: "Post Tournament analysis", href: "/coaches/tournament" },
    { title: "Training", desc: "Focus & drills (placeholder)", href: "/coaches/training" },
  ];

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />
        <div
          className="comparison-heading-wrapper mb-4 text-center"
          style={{ backgroundColor: "#ffcc29", padding: 5, borderRadius: 10 }}
        >
          <h2 className="fw-bold display-4" style={{ color: "#1b5e20" }}>
            Coaches Hub
          </h2>
        </div>
      </div>
    </div>
  );
}
