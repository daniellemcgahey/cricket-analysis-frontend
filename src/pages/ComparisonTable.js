import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const getComparisonClass = (stat, t1, t2) => {
  const diff = parseFloat(t1) - parseFloat(t2);
  const higherIsBetterMapping = {
    "Strike Rate": true,
    "Dot Ball %": false,
    "Wickets": true,
    "Economy": false,
    "Runs": false,
  };
  const higherIsBetter = higherIsBetterMapping.hasOwnProperty(stat)
    ? higherIsBetterMapping[stat]
    : true;
  const better = higherIsBetter ? diff > 0 : diff < 0;
  return better ? "text-success" : "text-danger";
};

const isStatUnavailable = (value) => {
  return value === null || value === undefined || value === 0 || value === "0.0" || value === "0";
};

// Define stat sets
const battingStats = new Set([
  "Innings", "Runs off Bat", "Batting Extras", "Total Runs", "Balls Faced", "Dot Balls Faced", "1s", "2s", "3s",
  "4s", "6s", "Dismissals", "Strike Rate", "Scoring Shot %", "Batters Average",
  "Attacking Shot %", "Defensive Shot %", "Rotation Shot %", "Avg Intent Score"
]);

const bowlingStats = new Set([
  "Overs", "Runs Conceded", "Wickets", "Dot Balls Bowled", "Extras", "Boundaries Conceded",
  "Economy", "Dot Ball %", "Bowlers Average"
]);

const fieldingStats = new Set([
  "Catch", "Run Out", "Drop Catch", "Boundary Save", "Clean Stop/Pick Up",
  "Direct Hit", "Missed Catch", "Missed Run Out", "Fumble", "Missed Fielding",
  "Overthrow", "Taken Half Chance", "Missed Half Chance", "Total Balls Fielded",
  "Expected Runs", "Actual Runs", "Runs Saved/Allowed", "Conversion Rate",
  "Pressure Score", "Fielding Impact Rating"
]);

const ComparisonTable = ({ data, isDarkMode, tournament1 = "", tournament2 = "" }) => {
  const { country1, country2, selected_stats, country1_stats, country2_stats } = data;

  // Categorize selected stats
  const groupedStats = {
    Batting: selected_stats.filter((stat) => battingStats.has(stat)),
    Bowling: selected_stats.filter((stat) => bowlingStats.has(stat)),
    Fielding: selected_stats.filter((stat) => fieldingStats.has(stat)),
  };

  return (
    <div className="card">
      <div className={`card-header ${isDarkMode ? "bg-dark text-white" : "bg-light text-dark"}`}>
        <h3 className="text-center">
          {country2 && !tournament1
            ? `Comparison Table: ${country1} vs. ${country2}`
            : country2 && tournament1
            ? `Comparison Table: ${country1} vs. ${country2} for ${tournament1}`
            : tournament1 && tournament2
            ? `Comparison Table: ${tournament1} vs. ${tournament2} for ${country1}`
            : `Tournament Comparison for ${country1}`}
        </h3>
      </div>
      <div className="card-body p-0">
        <table className="table table-striped mb-0">
          <thead className={isDarkMode ? "table-dark" : "table-light"}>
            <tr>
              <th>Stat</th>
              <th>
                {tournament1 && tournament2
                  ? tournament1
                  : country1}
              </th>
              <th>
                {tournament1 && tournament2
                  ? tournament2
                  : country2 || ""}
              </th>
              <th>Comparison</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedStats).map(([section, stats]) =>
              stats.length > 0 && (
                <React.Fragment key={section}>
                  {/* Section Header Row */}
                  <tr className={isDarkMode ? "bg-dark text-warning fw-bold" : "bg-warning text-dark fw-bold"}>
                    <td colSpan="4" className="text-uppercase py-2 border-top border-bottom">
                      <i className="bi bi-bar-chart-fill me-2"></i>{section}
                    </td>
                  </tr>

                  {/* Stat Rows */}
                  {stats.map((stat, index) => {
                    const val1 = country1_stats?.batting?.[stat] ?? country1_stats?.bowling?.[stat] ?? country1_stats?.fielding?.[stat];
                    const val2 = country2_stats?.batting?.[stat] ?? country2_stats?.bowling?.[stat] ?? country2_stats?.fielding?.[stat];

                    const hasData = !isStatUnavailable(val1) && !isStatUnavailable(val2);
                    const diff = hasData ? (parseFloat(val1) - parseFloat(val2)).toFixed(2) : null;
                    const arrow = diff > 0 ? "▲" : "▼";
                    const diffDisplay = hasData
                      ? `${arrow} ${Math.abs(diff)}`
                      : <span className="badge bg-secondary">No Data</span>;

                    return (
                      <tr key={section + "-" + index}>
                        <td>{stat}</td>
                        <td>
                          {isStatUnavailable(val1)
                            ? <span className="badge bg-secondary">No Data</span>
                            : val1}
                        </td>
                        <td>
                          {isStatUnavailable(val2)
                            ? <span className="badge bg-secondary">No Data</span>
                            : val2}
                        </td>
                        <td className={hasData ? getComparisonClass(stat, val1, val2) : ""}>
                          {diffDisplay}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
