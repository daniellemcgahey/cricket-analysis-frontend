import React from "react";

// 🔁 Flag lookup helper
const getFlagEmoji = (country) => {
  const flags = {
    Argentina: "🇦🇷",
    Brasil: "🇧🇷",
    Brazil: "🇧🇷", // support both spellings
    Canada: "🇨🇦",
    USA: "🇺🇸",
    England: "🇬🇧",
    India: "🇮🇳",
    Australia: "🇦🇺",
    Germany: "🇩🇪",
    SouthAfrica: "🇿🇦",
    SriLanka: "🇱🇰",
    Pakistan: "🇵🇰",
    Bangladesh: "🇧🇩",
    Nepal: "🇳🇵",
    Nigeria: "🇳🇬",
    Uganda: "🇺🇬",
    Kenya: "🇰🇪",
    Zimbabwe: "🇿🇼",
    Namibia: "🇳🇦"
    // Add more as needed
  };

  if (!country) return "🏳️";
  const trimmed = country.trim();
  return flags[trimmed] || "🏳️";
};

const TopBottomPlayers = ({ data }) => {
  const renderCategory = (label, players) => {
    const top = players?.top || [];
    const bottom = players?.bottom || [];

    return (
      <div className="mb-4">
        <h6 className="text-center fw-bold">{label}</h6>
        <div className="row">
          {/* Top 3 */}
          <div className="col-md-6">
            <p className="text-success text-center fw-semibold">Top 3</p>
            <ul className="list-group">
              {top.length ? (
                top.map((p, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between">
                    <span>
                      {getFlagEmoji(p.country)} {p.player_name}
                      <small className="text-muted ms-2">({p.country})</small>
                    </span>
                    <span className="fw-bold">{p.net_impact}</span>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-muted text-center">No data</li>
              )}
            </ul>
          </div>

          {/* Bottom 3 */}
          <div className="col-md-6">
            <p className="text-danger text-center fw-semibold">Bottom 3</p>
            <ul className="list-group">
              {bottom.length ? (
                bottom.map((p, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between">
                    <span>
                      {getFlagEmoji(p.country)} {p.player_name}
                      <small className="text-muted ms-2">({p.country})</small>
                    </span>
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
