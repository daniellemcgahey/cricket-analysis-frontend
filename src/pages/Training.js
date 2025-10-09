import React, { useContext } from "react";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import { useNavigate } from "react-router-dom";

export default function Training() {
  const { isDarkMode } = useContext(DarkModeContext);
  const navigate = useNavigate();

  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const cardClass = isDarkMode
    ? "bg-secondary text-white border-0"
    : "bg-white text-dark border";

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />

        <div className="row g-4">
          {/* Coming soon card */}
          <div className="col-lg-6 col-md-12">
            <div className={`p-3 rounded ${cardClass}`}>
              Coming soon: intent green-bands per phase, bowler length adherence,
              and fielding conversion trends.
            </div>
          </div>

          {/* Interactive Field card */}
          <div className="col-lg-6 col-md-12">
            <div
              className={`p-4 rounded shadow-sm d-flex flex-column align-items-start justify-content-between ${cardClass} hover-effect`}
              style={{ cursor: "pointer", minHeight: "140px" }}
              onClick={() => navigate("/training/interactive-field")}
            >
              <div>
                <h5 className="fw-bold mb-2">Interactive Field</h5>
                <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                  Drag and drop players to set custom field placements.
                  Supports Powerplay, Middle, and Death overs, with soft rule
                  validation and PDF export.
                </p>
              </div>
              <div className="mt-3">
                <button
                  className={`btn ${
                    isDarkMode ? "btn-outline-light" : "btn-outline-dark"
                  }`}
                  onClick={() => navigate("/training/interactive-field")}
                >
                  Open Interactive Field →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
