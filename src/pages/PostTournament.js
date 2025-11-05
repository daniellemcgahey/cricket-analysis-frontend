// src/pages/PostTournament.js
import React, { useContext } from "react";
import { Container } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";

export default function PostTournament() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <Container className="py-4">
        <BackButton isDarkMode={isDarkMode} />
        <h2 className="fw-bold mb-4">Post-Tournament</h2>
        <p>This is a minimal Post-Tournament page placeholder.</p>
      </Container>
    </div>
  );
}
