import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Accordion, Card, Form, Spinner, Alert, Table, Button } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import LeaderboardFilters from "../components/LeaderboardFilters";

const statCategories = [
  "Most Runs",
  "High Scores",
  "Highest Averages",
  "Highest Strike Rates",
  "Most Fifties and Over",
  "Most Ducks",
  "Most Fours",
  "Most Sixes",
  "Highest Average Intent",
  "Highest Scoring Shot %"
];

const BattingLeadersTab = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";

  const [filters, setFilters] = useState({
    teamCategory: "Women",
    tournaments: [],
    country1: []
  });

  const [leaderboards, setLeaderboards] = useState({});
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (
      filters.teamCategory &&
      filters.tournaments.length > 0 &&
      filters.country1.length > 0
    ) {
      setLoading(true);
      api.post("/tournament-leaders/batting", {
        team_category: filters.teamCategory,
        tournament: filters.tournaments[0],
        countries: filters.country1
      })
        .then((res) => {
          setLeaderboards(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLeaderboards({});
          setLoading(false);
        });
    }
  };

  const renderLeaderboardTable = (players, columns) => (
    <Table striped bordered hover size="sm" className={isDarkMode ? "table-dark" : "table-light"}>
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          {columns.map((col, i) => <th key={i}>{col}</th>)}
        </tr>
      </thead>
      <tbody>
        {players.map((p, idx) => (
          <tr key={idx}>
            <td>{idx + 1}</td>
            <td>{p.name}</td>
            {columns.map((col, i) => (
              <td key={i}>{p[col.toLowerCase().replace(/ /g, "_")]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <div className="row">
          {/* Sidebar Filters */}
          <div className="col-md-3">
            <LeaderboardFilters
              filters={filters}
              setFilters={setFilters}
              onGenerate={handleGenerate}
            />
          </div>

          {/* Right Side Leaderboards */}
          <div className="col-md-9">
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : Object.keys(leaderboards).length > 0 ? (
              <Accordion defaultActiveKey="0" alwaysOpen>
                {statCategories.map((category, idx) => (
                  <Accordion.Item eventKey={idx.toString()} key={category}>
                    <Accordion.Header><strong>{category}</strong></Accordion.Header>
                    <Accordion.Body>
                      {leaderboards[category] && leaderboards[category].length > 0 ? (
                        renderLeaderboardTable(
                          leaderboards[category],
                          Object.keys(leaderboards[category][0]).filter(k => k !== "name")
                        )
                      ) : (
                        <Alert variant="info">No data available.</Alert>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            ) : (
              <Alert variant="info">Select filters to view batting leaderboards.</Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattingLeadersTab;
