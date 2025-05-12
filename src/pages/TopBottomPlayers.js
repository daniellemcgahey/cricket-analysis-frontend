import React from "react";

const getFlagEmoji = (country) => {
  console.log("Country name received:", country); // 👈 Add this
  const flags = {
    Argentina: "🇦🇷",
    Brasil: "🇧🇷",
    Canada: "🇨🇦",
    USA: "🇺🇸",
    England: "🏴",
    India: "🇮🇳",
    Australia: "🇦🇺"
    // Add more as needed
  };
  return flags[country] || "🏳️";
};

const TopBottomPlayers = ({ data }) => {
  const renderCategory = (label, players) => {
    const top = players?.top || [];
    const bottom = players?.bottom || [];

    return (
      <div className="mb-4">
        <h6 className="text-center fw-bold">{label}</h6>
        <div className="row">
          <div className="col-md-6">
            <p className="text-success text-center fw-semibold">Top 3</p>
            <ul className="list-group">
              {top.length ? (
                top.map((p, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between">
                    <span>{getFlagEmoji(p.country)} {p.player_name}</span>
                    <span className="fw-bold">{p.net_impact}</span>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-muted text-center">No data</li>
              )}
            </ul>
          </div>
          <div className="col-md-6">
            <p className="text-danger text-center fw-semibold">Bottom 3</p>
            <ul className="list-group">
              {bottom.length ? (
                bottom.map((p, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between">
                    <span>{getFlagEmoji(p.country)} {p.player_name}</span>
                    <span className="fw-bold">{p.net_impact}</span>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-muted text-center">No data</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderCategory("Batting Impact", data.batting)}
      {renderCategory("Bowling Impact", data.bowling)}
      {renderCategory("Fielding Impact", data.fielding)}
      {renderCategory("Total Impact", data.total)}
    </div>
  );
};

export default TopBottomPlayers;
