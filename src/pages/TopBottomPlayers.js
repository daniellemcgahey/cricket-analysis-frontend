import React from "react";

const getFlagEmoji = (country) => {
  if (!country) return "\u{1F3F3}"; // 🏳️ fallback

  // Normalize: lowercase, remove team category suffix
  const normalized = country
    .toLowerCase()
    .replace(/\s+(men|women|u19 men|u19 women|training)$/, "")
    .replace(/\s+/g, "");

  const flags = {
    argentina: "\u{1F1E6}\u{1F1F7}",
    brasil: "\u{1F1E7}\u{1F1F7}",
    canada: "\u{1F1E8}\u{1F1E6}",
    usa: "\u{1F1FA}\u{1F1F8}",
    england: "\u{1F1EC}\u{1F1E7}",
    india: "\u{1F1EE}\u{1F1F3}",
    australia: "\u{1F1E6}\u{1F1FA}",
    germany: "\u{1F1E9}\u{1F1EA}",
    southafrica: "\u{1F1FF}\u{1F1E6}",
    srilanka: "\u{1F1F1}\u{1F1F0}",
    pakistan: "\u{1F1F5}\u{1F1F0}",
    bangladesh: "\u{1F1E7}\u{1F1E9}",
    nepal: "\u{1F1F3}\u{1F1F5}",
    nigeria: "\u{1F1F3}\u{1F1EC}",
    uganda: "\u{1F1FA}\u{1F1EC}",
    kenya: "\u{1F1F0}\u{1F1EA}",
    zimbabwe: "\u{1F1FF}\u{1F1FC}",
    namibia: "\u{1F1F3}\u{1F1E6}"
  };

  return flags[normalized] || "\u{1F3F3}"; // 🏳️ fallback
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
