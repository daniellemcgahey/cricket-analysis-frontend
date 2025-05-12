import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler,
  Title
} from "chart.js";
import flagColors from "../utils/flagColors";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip, Filler, Title);

const getColorPalette = (index) => {
  const colors = [
    "#4BC0C0", // teal
    "#FF6384", // pink/red
    "#36A2EB", // blue
    "#FFCE56", // yellow
    "#9966FF", // purple
    "#FF9F40", // orange
  ];
  return colors[index % colors.length];
};

const PressureOverLineChart = ({ data }) => {
  if (!data || Object.keys(data).length === 0) return null;

  const overs = Array.from({ length: 20 }, (_, i) => `Over ${i + 1}`);

  const datasets = Object.entries(data).map(([label, pressureData], index) => {
    const country = label.split(" ")[0];
    const role = label.split(" ")[1];
    const color = flagColors[country] || getColorPalette(index);
  
    return {
      label,
      data: pressureData,
      borderColor: color,
      backgroundColor: color + "66", // Add transparency
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.4,
      fill: false,
      borderDash: role === "Bowling" ? [5, 5] : [],
    };
  });

  const chartData = {
    labels: overs,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
            family: "Segoe UI, sans-serif",
          },
          color: "#333"
        }
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw !== null ? ctx.raw.toFixed(2) : "N/A"}`
        }
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Average Pressure",
          font: { size: 14 },
          color: "#333"
        },
        ticks: {
          color: "#333",
          stepSize: 1,
        },
        beginAtZero: true
      },
      x: {
        title: {
          display: true,
          text: "Overs",
          font: { size: 14 },
          color: "#333"
        },
        ticks: {
          color: "#333"
        }
      }
    }
  };

  return (
    <div className="mb-5" style={{ height: "400px" }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PressureOverLineChart;
