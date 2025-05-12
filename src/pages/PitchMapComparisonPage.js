import React, { useState , useEffect} from "react";
import PitchMapFilters from "../components/PitchMapFilters";
import PitchMapChart from "./PitchMapChart";
import HeatMapToggle from "../components/HeatMapToggle";
import "./TabStyles.css";
import api from "../api";


const PitchMapComparisonPage = () => {
  const [pitchData, setPitchData] = useState(null);
  const [viewMode, setViewMode] = useState("Dots");
  const [filters, setFilters] = useState({
    teamCategory: "Women",
    country1: "",
    country2: "",
    tournaments: [],
    selectedPhases: ["Powerplay", "Middle Overs", "Death Overs"],
    selectedBowlingArms: ["Left", "Right"],
    selectedBowlerTypes: ["Pace", "Medium", "Spin"],
    selectedBattingHands: ["Left", "Right"],
    allMatchesSelected: true,
    selectedMatches: []
  });

  const handleGenerate = async () => {
    if (!filters) return;

    try {
      const response = await api.post("/pitch-map-comparison", filters);
      setPitchData(response.data);
    } catch (error) {
      console.error("Failed to fetch pitch map data", error);
    }
  };


  if (filters && pitchData) {
    console.log("🎯 Pitch Data:", pitchData);
  }
  

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Left - Filters */}
        <div className="col-md-4">
          <HeatMapToggle selected={viewMode} onChange={setViewMode} /> {/* 🔹 Add toggle here */}
          <PitchMapFilters filters={filters} setFilters={setFilters} />
          <button className="btn btn-primary mt-3" onClick={handleGenerate}>
            Generate Pitch Map
          </button>
          
        </div>

        {/* Right - Graphs */}
        <div className="col-md-8">
          {filters && pitchData ? (
            <div className="row">
              <div className="col-lg-6 col-12 mb-5">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <h5 className="text-center mb-3">{filters.country1}</h5>
                  <PitchMapChart data={pitchData[filters.country1] || []} viewMode={viewMode} /> {/* 🔹 Pass mode */}
                </div>
              </div>
              <div className="col-lg-6 col-12 mb-5">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <h5 className="text-center mb-3">{filters.country2}</h5>
                  <PitchMapChart data={pitchData[filters.country2] || []} viewMode={viewMode} /> {/* 🔹 Pass mode */}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted">Please select filters to view the pitch map.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PitchMapComparisonPage;
