// src/App.js
import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Pages for section routes
import ComparisonTabs from './pages/ComparisonTabs';
import IndividualTabs from './pages/IndividualTabs';
import MatchAnalysisTabs from './pages/MatchAnalysisTabs';
import FutureMatchTabs from './pages/FutureMatchTabs';
import MatchSimTab from './pages/MatchSimTab';

// Optional: global dark mode context
import DarkModeContext from './DarkModeContext';


function AnalysisHub() {
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext); // inside your component
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  return (
    <div className={`${containerClass} min-vh-100`}>
      <div className="container text-center pt-5">
        {/* Toggle Button */}
        <div className="text-end mb-4">
          <Button variant={isDarkMode ? "secondary" : "dark"} onClick={toggleDarkMode}>
            Switch to {isDarkMode ? "Light" : "Dark"} Mode
          </Button>
        </div>
        <h1 className="mb-4 fw-bold display-4">Cricket Analysis Hub</h1>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Link to="/compare">
            <Button variant="info">Comparison</Button>
          </Link>
          <Link to="/individual">
            <Button variant="info">Individual</Button>
          </Link>
          <Link to="/match-analysis">
            <Button variant="info">Match Analysis</Button>
          </Link>
          <Link to="/future-matches">
            <Button variant="info">Future Matches</Button>
          </Link>
          <Link to="/match-sims">
            <Button variant="info">Match Sim</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <Router>
        <Routes>
          <Route path="/" element={<AnalysisHub />} />
          <Route path="/compare" element={<ComparisonTabs />} />
          <Route path="/individual" element={<IndividualTabs />} />
          <Route path="/match-analysis" element={<MatchAnalysisTabs />} />
          <Route path="/future-matches" element={<FutureMatchTabs />} />
          <Route path="/match-sims" element={<MatchSimTab />} />
        </Routes>
      </Router>
    </DarkModeContext.Provider>
  );
}

export default App;
