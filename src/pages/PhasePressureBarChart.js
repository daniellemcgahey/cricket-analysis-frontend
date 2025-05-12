import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import flagColors from "../utils/flagColors";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PhasePressureBarChart = ({ data }) => {
  const phases = ["Powerplay", "Middle Overs", "Death Overs"];

  const renderChart = (title, dataset) => {
    const team1 = dataset?.[0];
    const team2 = dataset?.[1];

    const chartData = {
      labels: phases,
      datasets: [
        {
          label: team1?.team || "Team 1",
          data: team1?.values || [0, 0, 0],
          backgroundColor: flagColors[team1?.team] || "#4caf50",
        },
        {
          label: team2?.team || "Team 2",
          data: team2?.values || [0, 0, 0],
          backgroundColor: flagColors[team2?.team] || "#f44336",
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        title: {
          display: false,
          text: title,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw.toFixed(2)}`;
            },
          },
        },
        legend: {
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Net Pressure",
          },
        },
      },
    };

    return (
      <div style={{ height: "250px" }}>
        <Bar data={chartData} options={options} />
      </div>
    );
  };

  return (
    <div className="d-flex justify-content-center align-items-start flex-wrap gap-4">
      <div style={{ flex: "1 1 45%", minWidth: "300px", maxWidth: "500px", height: "280px" }}>
        <h6 className="text-center fw-bold mb-2">Batting Pressure</h6>
        <div style={{ height: "100%" }}>
          {renderChart("Batting Pressure", data?.batting)}
        </div>
      </div>
  
      <div style={{ flex: "1 1 45%", minWidth: "300px", maxWidth: "500px", height: "280px" }}>
        <h6 className="text-center fw-bold mb-2">Bowling Pressure</h6>
        <div style={{ height: "100%" }}>
          {renderChart("Bowling Pressure", data?.bowling)}
        </div>
      </div>
    </div>
  );
};

export default PhasePressureBarChart;
