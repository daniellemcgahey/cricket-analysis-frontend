import React, { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import WagonWheelChart from "./WagonWheelChart";
import WagonWheelFilters from "../components/WagonWheelFilters";
import WagonWheelStyleToggle from "../components/WagonWheelStyleToggle";
import api from "../api";


const WagonWheelComparisonPage = () => {
  const [filters, setFilters] = useState({
    country1: "",
    country2: "",
    tournaments: [],
    selectedPhases: ["Powerplay", "Middle Overs", "Death Overs"],
    selectedMatches: [],
    allMatchesSelected: true,
    selectedBowlerTypes: ["Pace", "Medium", "Off Spin", "Leg Spin"],
    selectedBowlingArms: ["Left", "Right"],
    selectedBattingHands: ["Left", "Right"],
    teamCategory: "Women",
    selectedLengths: ["Full Toss", "Yorker", "Full", "Good", "Short"],
  });

  const [wagonWheelStyle, setWagonWheelStyle] = useState("Lines");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("🧭 WagonWheelComparisonPage mounted");
  }, []);

  const handleGenerate = () => {
    console.log("🚨 handleGenerate triggered");
    console.log("📦 Sending to backend:", {
      ...filters,
      perspective: wagonWheelStyle
    });
  
    if (!filters.country1 || !filters.country2 || filters.tournaments.length === 0) {
      alert("Please complete all filter sections.");
      return;
    }
  
    // 🧹 Reset chart first
    setChartData(null);
    setLoading(true);
  
    api.post("/wagon-wheel-comparison", {
      ...filters,
      perspective: wagonWheelStyle
    })
      .then((res) => {
        const data = res.data;
        if (data && (data[filters.country1]?.length > 0 || data[filters.country2]?.length > 0)) {
          setChartData(data);
        } else {
          setChartData(null); // Force chart to clear if no results
        }
      })
      .catch((err) => {
        console.error("❌ Error fetching wagon wheel data", err);
        setChartData(null);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="container py-4">
      <div className="row">
        {/* Filters */}
        <div className="col-md-4">
          <WagonWheelStyleToggle selected={wagonWheelStyle} onChange={setWagonWheelStyle} />
          <WagonWheelFilters filters={filters} setFilters={setFilters} />
          <Button className="w-100 mt-3" onClick={handleGenerate}>
            {loading ? <Spinner size="sm" animation="border" /> : "Generate Wagon Wheels"}
          </Button>
        </div>

        {/* Chart */}
        <div className="col-md-8">
          {chartData ? (
            <div className="wagon-wheel-section d-flex flex-column align-items-center">
                {/* Horizontal layout for large screens */}
                <div className="d-flex flex-wrap justify-content-center align-items-start gap-5 flex-lg-row flex-column">
                    {/* Left Wagon Wheel */}
                    <div className="p-3" style={{ minWidth: 320, maxWidth: 500, flex: 1 }}>
                    <h4 className="fw-bold text-center">{filters.country1}</h4>
                    <WagonWheelChart
                        filters={filters}
                        perspective={wagonWheelStyle}
                        data={chartData[filters.country1]}
                    />
                    </div>

                    {/* Right Wagon Wheel */}
                    <div className="p-3" style={{ minWidth: 320, maxWidth: 500, flex: 1 }}>
                    <h4 className="fw-bold text-center">{filters.country2}</h4>
                    <WagonWheelChart
                        filters={filters}
                        perspective={wagonWheelStyle}
                        data={chartData[filters.country2]}
                    />
                    </div>
                </div>

                {/* Run Key below both wheels, only in "Lines" mode */}
                {wagonWheelStyle === "Lines" && (
                    <div className="run-key-box mt-4 text-center d-flex flex-wrap justify-content-center gap-2">
                    <strong className="w-100">Run Key</strong>
                    <span style={{ color: "gray" }}>●</span> Dot Ball
                    <span style={{ color: "white", textShadow: "0 0 2px black" }}>●</span> 1 run
                    <span style={{ color: "yellow" }}>●</span> 2 runs
                    <span style={{ color: "orange" }}>●</span> 3 runs
                    <span style={{ color: "blue" }}>●</span> 4 runs
                    <span style={{ color: "pink" }}>●</span> 5 runs
                    <span style={{ color: "red" }}>●</span> 6 runs
                    <span style={{ color: "purple" }}>●</span> 7+ runs
                    </div>

                    )}
                </div>
          ) : (
            <div className="alert alert-info text-center mt-4">
              Wagon Wheels will appear here once generated.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WagonWheelComparisonPage;
