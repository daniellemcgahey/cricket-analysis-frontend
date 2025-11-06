// src/pages/PostTournament.js
import React, { useContext, useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  Modal,
  Tabs,
  Tab,
  ProgressBar,
} from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import api from "../api";

/** ===================== Config ===================== */

const CATEGORIES = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

// Tournament-level endpoints
const EP_TOURNAMENTS = "/posttournament/tournaments"; // GET ?teamCategory=
const EP_TOURNAMENT_TEAMS = "/posttournament/teams"; // GET ?tournament_id=
const EP_TOURNAMENT_PLAYERS = "/posttournament/players"; // GET ?tournament_id=&team_id=
const EP_TOURNAMENT_PLAYER_SUMMARY =
  "/posttournament/player-summary"; // GET ?tournament_id=&team_id=&player_id=&team_category=
const EP_TEAM_SUMMARY = "/posttournament/team-summary"; // POST {teamCategory, tournamentId, teamId}

/** ===================== Small UI helpers ===================== */

function MetricRow({ label, value, sub }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-2">
      <div className="me-3">
        <div className="small text-muted text-uppercase">{label}</div>
        {sub && <div className="small text-muted">{sub}</div>}
      </div>
      <div className="fw-semibold text-end" style={{ minWidth: 80 }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function SectionBlock({ title, children }) {
  return (
    <Card className="mb-3">
      <Card.Body>
        <div className="fw-bold mb-2">{title}</div>
        {children}
      </Card.Body>
    </Card>
  );
}

/** ===================== Page ===================== */

export default function PostTournament() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const cardVariant = isDarkMode ? "dark" : "light";

  // -------- Filters --------
  const [category, setCategory] = useState("Men");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

  // -------- Player summary --------
  const [playerSummary, setPlayerSummary] = useState(null);
  const [playerSummaryLoading, setPlayerSummaryLoading] = useState(false);
  const [playerSummaryError, setPlayerSummaryError] = useState("");

  // modal/tab
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerModalTab, setPlayerModalTab] = useState("Batting");

  // -------- Team summary --------
  const [teamSummary, setTeamSummary] = useState(null);
  const [teamSummaryLoading, setTeamSummaryLoading] = useState(false);
  const [teamSummaryError, setTeamSummaryError] = useState("");
  const [showTeamModal, setShowTeamModal] = useState(false);

  // loading for filters / dropdowns
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [error, setError] = useState("");

  /** -------- Load tournaments for category -------- */
  useEffect(() => {
    let mounted = true;
    setError("");
    setTournaments([]);
    setSelectedTournamentId("");
    setTeams([]);
    setSelectedTeamId("");
    setPlayers([]);
    setSelectedPlayerId("");
    setPlayerSummary(null);
    setPlayerSummaryError("");
    setShowPlayerModal(false);
    setTeamSummary(null);
    setTeamSummaryError("");
    setShowTeamModal(false);

    setLoadingTournaments(true);
    api
      .get(EP_TOURNAMENTS, { params: { teamCategory: category } })
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res.data?.tournaments)
          ? res.data.tournaments
          : [];
        setTournaments(list);
        if (list.length) {
          setSelectedTournamentId(String(list[0].id));
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load tournaments for this category.");
      })
      .finally(() => setLoadingTournaments(false));

    return () => {
      mounted = false;
    };
  }, [category]);

  /** -------- Load teams for tournament -------- */
  useEffect(() => {
    if (!selectedTournamentId) {
      setTeams([]);
      setSelectedTeamId("");
      setPlayers([]);
      setSelectedPlayerId("");
      setPlayerSummary(null);
      setPlayerSummaryError("");
      setShowPlayerModal(false);
      setTeamSummary(null);
      setTeamSummaryError("");
      setShowTeamModal(false);
      return;
    }

    let mounted = true;
    setError("");
    setTeams([]);
    setSelectedTeamId("");
    setPlayers([]);
    setSelectedPlayerId("");
    setPlayerSummary(null);
    setPlayerSummaryError("");
    setShowPlayerModal(false);
    setTeamSummary(null);
    setTeamSummaryError("");
    setShowTeamModal(false);

    setLoadingTeams(true);
    api
      .get(EP_TOURNAMENT_TEAMS, { params: { tournament_id: selectedTournamentId } })
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res.data?.teams) ? res.data.teams : [];
        setTeams(list);
        if (list.length) {
          setSelectedTeamId(String(list[0].id));
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load teams for this tournament.");
      })
      .finally(() => setLoadingTeams(false));

    return () => {
      mounted = false;
    };
  }, [selectedTournamentId]);

  /** -------- Load players for team -------- */
  useEffect(() => {
    if (!selectedTournamentId || !selectedTeamId) {
      setPlayers([]);
      setSelectedPlayerId("");
      setPlayerSummary(null);
      setPlayerSummaryError("");
      setShowPlayerModal(false);
      setTeamSummary(null);
      setTeamSummaryError("");
      setShowTeamModal(false);
      return;
    }

    let mounted = true;
    setError("");
    setPlayers([]);
    setSelectedPlayerId("");
    setPlayerSummary(null);
    setPlayerSummaryError("");
    setShowPlayerModal(false);
    setTeamSummary(null);
    setTeamSummaryError("");
    setShowTeamModal(false);

    setLoadingPlayers(true);
    api
      .get(EP_TOURNAMENT_PLAYERS, {
        params: {
          tournament_id: selectedTournamentId,
          team_id: selectedTeamId,
        },
      })
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res.data?.players) ? res.data.players : [];
        setPlayers(list);
        if (list.length) {
          setSelectedPlayerId(String(list[0].id));
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load players for this team.");
      })
      .finally(() => setLoadingPlayers(false));

    return () => {
      mounted = false;
    };
  }, [selectedTournamentId, selectedTeamId]);

  /** -------- Load player tournament summary -------- */
  useEffect(() => {
    if (!selectedTournamentId || !selectedTeamId || !selectedPlayerId) {
      setPlayerSummary(null);
      setPlayerSummaryError("");
      return;
    }

    let mounted = true;
    setPlayerSummary(null);
    setPlayerSummaryError("");
    setPlayerSummaryLoading(true);
    setPlayerModalTab("Batting");

    api
      .get(EP_TOURNAMENT_PLAYER_SUMMARY, {
        params: {
          tournament_id: selectedTournamentId,
          team_id: selectedTeamId,
          player_id: selectedPlayerId,
          team_category: category,
        },
      })
      .then((res) => {
        if (!mounted) return;
        setPlayerSummary(res.data || null);
      })
      .catch((err) => {
        console.error(err);
        setPlayerSummaryError("Could not load player tournament summary.");
      })
      .finally(() => setPlayerSummaryLoading(false));

    return () => {
      mounted = false;
    };
  }, [selectedTournamentId, selectedTeamId, selectedPlayerId, category]);

  /** -------- Fetch team tournament summary -------- */
  const fetchTeamSummary = () => {
    if (!selectedTournamentId || !selectedTeamId) {
      setTeamSummary(null);
      setTeamSummaryError("Select a tournament and team first.");
      return;
    }

    setTeamSummaryLoading(true);
    setTeamSummaryError("");

    api
      .post(EP_TEAM_SUMMARY, {
        teamCategory: category,
        tournamentId: Number(selectedTournamentId),
        teamId: Number(selectedTeamId),
      })
      .then((res) => {
        setTeamSummary(res.data || null);
      })
      .catch((err) => {
        console.error(err);
        setTeamSummaryError("Could not load team tournament summary.");
      })
      .finally(() => {
        setTeamSummaryLoading(false);
      });
  };

  /** -------- Batting tab renderer (Tournament) -------- */
  const renderBattingSummary = () => {
    const batting = playerSummary?.batting;
    if (!batting || !batting.has_data) {
      return (
        <div className="text-muted">
          No batting data for this player in this tournament.
        </div>
      );
    }

    const runs = batting.runs ?? null;
    const balls = batting.balls ?? null;
    const sr = batting.strike_rate ?? null;

    const fours = batting.fours ?? 0;
    const sixes = batting.sixes ?? 0;
    const ones = batting.ones ?? 0;
    const twos = batting.twos ?? 0;
    const threes = batting.threes ?? 0;

    const boundaryPct = batting.boundary_percentage ?? null;
    const dotPct = batting.dot_ball_percentage ?? null;
    const scoringShotPct =
      typeof dotPct === "number" ? Number((100 - dotPct).toFixed(1)) : null;

    const phase = batting.phase_breakdown || {};
    const matchSummaries = Array.isArray(batting.match_summaries)
      ? batting.match_summaries
      : [];

    return (
      <>
        {/* Score (Tournament) */}
        <SectionBlock title="Score (Tournament)">
          <MetricRow
            label="Runs (Balls)"
            value={
              runs != null && balls != null
                ? `${runs} (${balls})`
                : runs != null
                ? runs
                : "—"
            }
          />
          <MetricRow
            label="Strike Rate"
            value={sr != null ? sr.toFixed(1) : "—"}
            sub="Runs per 100 balls"
          />
          <MetricRow label="4s / 6s" value={`${fours} / ${sixes}`} />
          <MetricRow label="1s / 2s / 3s" value={`${ones} / ${twos} / ${threes}`} />
        </SectionBlock>

        {/* Scoring Shots (Tournament) */}
        <SectionBlock title="Scoring Shots">
          <div className="mb-2">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted text-uppercase">
                Scoring Shot %
              </span>
              <span className="fw-semibold">
                {scoringShotPct != null
                  ? `${scoringShotPct.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <ProgressBar
              now={scoringShotPct != null ? scoringShotPct : 0}
              variant={
                scoringShotPct == null
                  ? "secondary"
                  : scoringShotPct >= 60
                  ? "success"
                  : scoringShotPct >= 50
                  ? "warning"
                  : "danger"
              }
            />
          </div>
          <MetricRow
            label="Boundary %"
            value={
              boundaryPct != null ? `${boundaryPct.toFixed(1)}%` : "—"
            }
            sub="4s + 6s as % of balls faced"
          />
        </SectionBlock>

        {/* Phases (Tournament) */}
        <SectionBlock title="Phases (Tournament)">
          {/* Powerplay */}
          <MetricRow
            label="Powerplay"
            value={
              phase.powerplay_runs != null || phase.powerplay_balls != null
                ? `${phase.powerplay_runs ?? 0} runs${
                    phase.powerplay_balls != null
                      ? ` | ${phase.powerplay_balls} balls`
                      : ""
                  }`
                : "—"
            }
            sub={
              phase.powerplay_scoring_shot_pct != null
                ? `${phase.powerplay_scoring_shot_pct.toFixed(
                    1
                  )}% scoring shots`
                : undefined
            }
          />

          {/* Middle overs */}
          <MetricRow
            label="Middle Overs"
            value={
              phase.middle_overs_runs != null ||
              phase.middle_overs_balls != null
                ? `${phase.middle_overs_runs ?? 0} runs${
                    phase.middle_overs_balls != null
                      ? ` | ${phase.middle_overs_balls} balls`
                      : ""
                  }`
                : "—"
            }
            sub={
              phase.middle_overs_scoring_shot_pct != null
                ? `${phase.middle_overs_scoring_shot_pct.toFixed(
                    1
                  )}% scoring shots`
                : undefined
            }
          />

          {/* Death overs */}
          <MetricRow
            label="Death Overs"
            value={
              phase.death_overs_runs != null ||
              phase.death_overs_balls != null
                ? `${phase.death_overs_runs ?? 0} runs${
                    phase.death_overs_balls != null
                      ? ` | ${phase.death_overs_balls} balls`
                      : ""
                  }`
                : "—"
            }
            sub={
              phase.death_overs_scoring_shot_pct != null
                ? `${phase.death_overs_scoring_shot_pct.toFixed(
                    1
                  )}% scoring shots`
                : undefined
            }
          />
        </SectionBlock>

        {/* Match-by-Match Tournament Summary */}
        {matchSummaries.length > 0 && (
          <SectionBlock title="Tournament Summary (Match by Match)">
            {matchSummaries.map((ms) => {
              const ss = ms.scoring_shot_pct;
              const ssDisplay = ss != null ? `${ss.toFixed(1)}%` : "—";

              const barVariant =
                ss == null
                  ? "secondary"
                  : ss >= 60
                  ? "success"
                  : ss >= 50
                  ? "warning"
                  : "danger";

              return (
                <Card key={ms.match_id} className="mb-2">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <div className="small text-muted">vs</div>
                        <div className="fw-semibold">{ms.opponent}</div>
                      </div>
                      <div className="text-end">
                        <div className="small text-muted">
                          {ms.dismissal}
                        </div>
                        <div className="fw-semibold">
                          {ms.runs} from {ms.balls} balls
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small text-muted">
                          Scoring Shot %
                        </span>
                        <span className="fw-semibold">
                          {ssDisplay}
                        </span>
                      </div>
                      <ProgressBar
                        now={ss != null ? ss : 0}
                        variant={barVariant}
                      />
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </SectionBlock>
        )}
      </>
    );
  };

  // -------- Bowling tab renderer (Tournament) --------
  const renderBowlingSummary = () => {
    const bowling = playerSummary?.bowling;
    if (!bowling || !bowling.has_data) {
      return (
        <div className="text-muted">
          No bowling data for this player in this tournament.
        </div>
      );
    }

    const overs = bowling.overs ?? null;
    const runs = bowling.runs_conceded ?? null;
    const wkts = bowling.wickets ?? null;
    const econ = bowling.economy ?? null;
    const dotPct = bowling.dot_ball_percentage ?? null;
    const dotBallsCount = bowling.dot_balls ?? null;

    const phase = bowling.phase_breakdown || {};
    const matchSummaries = Array.isArray(bowling.match_summaries)
      ? bowling.match_summaries
      : [];

    const dotPctDisplay =
      dotPct != null ? `${dotPct.toFixed(1)}%` : "—";

    const dotBarVariant =
      dotPct == null
        ? "secondary"
        : dotPct >= 60
        ? "success"
        : dotPct >= 50
        ? "warning"
        : "danger";

    return (
      <>
        {/* Figures (Tournament) with dot ball progress bar */}
        <SectionBlock title="Figures (Tournament)">
          <MetricRow
            label="Overs–Dots–Runs–Wickets"
            value={
              overs != null ||
              dotBallsCount != null ||
              runs != null ||
              wkts != null
                ? `${overs ?? 0}-${dotBallsCount ?? 0}-${runs ?? 0}-${wkts ?? 0}`
                : "—"
            }
          />
          <MetricRow
            label="Economy"
            value={econ != null ? econ.toFixed(2) : "—"}
            sub="Runs conceded per over"
          />

          <div className="mt-2">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted text-uppercase">
                Dot Ball %
              </span>
              <span className="fw-semibold">{dotPctDisplay}</span>
            </div>
            <ProgressBar
              now={dotPct != null ? dotPct : 0}
              variant={dotBarVariant}
            />
          </div>
        </SectionBlock>

        {/* Extras & Boundaries */}
        <SectionBlock title="Extras & Boundaries">
          <MetricRow label="Wides" value={bowling.wides ?? 0} />
          <MetricRow label="No Balls" value={bowling.no_balls ?? 0} />
          <MetricRow
            label="Boundary Balls"
            value={bowling.boundary_balls ?? 0}
          />
        </SectionBlock>

        {/* Phases (Tournament) – including wickets */}
        <SectionBlock title="Phases (Tournament)">
          {/* Powerplay */}
          <MetricRow
            label="Powerplay"
            value={
              phase.powerplay_overs != null ||
              phase.powerplay_runs != null ||
              phase.powerplay_wickets != null ||
              phase.powerplay_dot_balls != null
                ? `${(phase.powerplay_overs ?? 0).toFixed(1)}-${
                    phase.powerplay_dot_balls ?? 0
                  }-${phase.powerplay_runs ?? 0}-${
                    phase.powerplay_wickets ?? 0
                  }`
                : "—"
            }
            sub={
              phase.powerplay_dot_ball_pct != null
                ? `${phase.powerplay_dot_ball_pct.toFixed(
                    1
                  )}% dot balls`
                : undefined
            }
          />

          {/* Middle overs */}
          <MetricRow
            label="Middle Overs"
            value={
              phase.middle_overs_overs != null ||
              phase.middle_overs_runs != null ||
              phase.middle_overs_wickets != null ||
              phase.middle_overs_dot_balls != null
                ? `${(phase.middle_overs_overs ?? 0).toFixed(1)}-${
                    phase.middle_overs_dot_balls ?? 0
                  }-${phase.middle_overs_runs ?? 0}-${
                    phase.middle_overs_wickets ?? 0
                  }`
                : "—"
            }
            sub={
              phase.middle_overs_dot_ball_pct != null
                ? `${phase.middle_overs_dot_ball_pct.toFixed(
                    1
                  )}% dot balls`
                : undefined
            }
          />

          {/* Death overs */}
          <MetricRow
            label="Death Overs"
            value={
              phase.death_overs_overs != null ||
              phase.death_overs_runs != null ||
              phase.death_overs_wickets != null ||
              phase.death_overs_dot_balls != null
                ? `${(phase.death_overs_overs ?? 0).toFixed(1)}-${
                    phase.death_overs_dot_balls ?? 0
                  }-${phase.death_overs_runs ?? 0}-${
                    phase.death_overs_wickets ?? 0
                  }`
                : "—"
            }
            sub={
              phase.death_overs_dot_ball_pct != null
                ? `${phase.death_overs_dot_ball_pct.toFixed(
                    1
                  )}% dot balls`
                : undefined
            }
          />
        </SectionBlock>

        {/* Match-by-Match Bowling Summary (Tournament) */}
        {matchSummaries.length > 0 && (
          <SectionBlock title="Tournament Summary (Match by Match)">
            {matchSummaries.map((ms) => {
              const dot = ms.dot_ball_pct;
              const dotDisplay =
                dot != null ? `${dot.toFixed(1)}%` : "—";

              const matchBarVariant =
                dot == null
                  ? "secondary"
                  : dot >= 60
                  ? "success"
                  : dot >= 50
                  ? "warning"
                  : "danger";

              const oversVal =
                ms.overs != null ? Number(ms.overs) : 0;
              const oversStr = oversVal.toFixed(1);

              const dotsVal = ms.dot_balls ?? 0;
              const runsVal =
                ms.runs_conceded != null
                  ? ms.runs_conceded
                  : ms.runs ?? 0;
              const wktsVal = ms.wickets ?? 0;

              return (
                <Card key={ms.match_id} className="mb-2">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <div className="small text-muted">vs</div>
                        <div className="fw-semibold">
                          {ms.opponent}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="small text-muted">
                          Figures
                        </div>
                        <div className="fw-semibold">
                          {oversStr}-{dotsVal}-{runsVal}-{wktsVal}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small text-muted">
                          Dot Ball %
                        </span>
                        <span className="fw-semibold">
                          {dotDisplay}
                        </span>
                      </div>
                      <ProgressBar
                        now={dot != null ? dot : 0}
                        variant={matchBarVariant}
                      />
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </SectionBlock>
        )}
      </>
    );
  };

  /** -------- Fielding tab renderer (Tournament) -------- */
  const renderFieldingSummary = () => {
    const fielding = playerSummary?.fielding;
    if (!fielding || !fielding.has_data) {
      return (
        <div className="text-muted">
          No fielding data for this player in this tournament.
        </div>
      );
    }

    return (
      <>
        <SectionBlock title="Involvement (Tournament)">
          <MetricRow label="Balls Fielded" value={fielding.balls_fielded ?? 0} />
          <MetricRow label="Clean Pickups" value={fielding.clean_pickups ?? 0} />
          <MetricRow label="Fumbles" value={fielding.fumbles ?? 0} />
          <MetricRow
            label="Overthrows Conceded"
            value={fielding.overthrows_conceded ?? 0}
          />
        </SectionBlock>

        <SectionBlock title="Catching & Run Outs">
          <MetricRow label="Catches Taken" value={fielding.catches_taken ?? 0} />
          <MetricRow
            label="Drops / Missed Catches"
            value={fielding.missed_catches ?? 0}
          />
          <MetricRow
            label="Run Outs (Direct)"
            value={fielding.run_outs_direct ?? 0}
          />
          <MetricRow
            label="Run Outs (Assist)"
            value={fielding.run_outs_assist ?? 0}
          />
        </SectionBlock>

        <SectionBlock title="Quality">
          <MetricRow
            label="Clean Hands %"
            value={
              fielding.clean_hands_pct != null
                ? `${fielding.clean_hands_pct.toFixed(1)}%`
                : "—"
            }
          />
          <MetricRow
            label="Chance Conversion %"
            value={
              fielding.conversion_rate != null
                ? `${fielding.conversion_rate.toFixed(1)}%`
                : "—"
            }
          />
        </SectionBlock>
      </>
    );
  };

  /** -------- Team Tournament Summary renderer -------- */
  const renderTeamSummary = () => {
    if (!teamSummary) {
      return (
        <div className="text-muted">
          Select a tournament &amp; team, then generate the summary.
        </div>
      );
    }

    const { overview, batting, bowling, fielding, leaders } = teamSummary;

    const clamp100 = (v) => Math.max(0, Math.min(100, v || 0));

    const battingTargets = {
      avg_runs: 130,
      scoring_shot_pct: 55,
      boundary_pct: 18,
    };

    const bowlingTargets = {
      economy: 6.8,
      dot_pct: 55,
      avg_runs_conceded: 120,
    };

    const battingScores = {
      avg_runs: clamp100(
        (batting.avg_runs / battingTargets.avg_runs) * 100
      ),
      scoring_shot_pct: clamp100(
        (batting.scoring_shot_pct / battingTargets.scoring_shot_pct) * 100
      ),
      boundary_pct: clamp100(
        (batting.boundary_pct / battingTargets.boundary_pct) * 100
      ),
    };

    const bowlingScores = {
      economy: clamp100(
        bowling.economy
          ? (bowlingTargets.economy / bowling.economy) * 100
          : 0
      ),
      dot_pct: clamp100(
        (bowling.dot_pct / bowlingTargets.dot_pct) * 100
      ),
      avg_runs_conceded: clamp100(
        bowling.avg_runs_conceded
          ? (bowlingTargets.avg_runs_conceded /
              bowling.avg_runs_conceded) *
              100
          : 0
      ),
    };

    const PHASE_LABELS = {
      PP: "Powerplay",
      MO: "Middle Overs",
      DO: "Death Overs",
    };

    const phaseKeys = ["PP", "MO", "DO"];

    return (
      <>
        {/* Overview */}
        <SectionBlock title="Overview">
          <Row className="text-center mb-3">
            <Col xs={3}>
              <div className="h4 mb-0">
                {overview.matches_played ?? 0}
              </div>
              <small className="text-muted">Matches</small>
            </Col>
            <Col xs={3}>
              <div className="h4 mb-0 text-success">
                {overview.wins ?? 0}
              </div>
              <small className="text-muted">Wins</small>
            </Col>
            <Col xs={3}>
              <div className="h4 mb-0 text-danger">
                {overview.losses ?? 0}
              </div>
              <small className="text-muted">Losses</small>
            </Col>
            <Col xs={3}>
              <div className="h4 mb-0">
                {overview.no_result ?? 0}
              </div>
              <small className="text-muted">No Result</small>
            </Col>
          </Row>
          <Row className="text-center">
            <Col xs={4}>
              <div className="fw-semibold">
                {overview.win_pct != null
                  ? overview.win_pct.toFixed(1)
                  : "—"}
                %
              </div>
              <small className="text-muted">Win %</small>
            </Col>
            <Col xs={4}>
              <div className="fw-semibold">
                {overview.run_rate_for != null
                  ? overview.run_rate_for.toFixed(2)
                  : "—"}
              </div>
              <small className="text-muted">Run Rate For</small>
            </Col>
            <Col xs={4}>
              <div className="fw-semibold">
                {overview.net_run_rate != null
                  ? overview.net_run_rate.toFixed(2)
                  : "—"}
              </div>
              <small className="text-muted">Net Run Rate</small>
            </Col>
          </Row>
        </SectionBlock>

        {/* Team Batting */}
        <SectionBlock title="Team Batting">
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted text-uppercase">
                Average Runs
              </span>
              <span className="fw-semibold">
                {batting.avg_runs != null
                  ? batting.avg_runs.toFixed(1)
                  : "—"}
              </span>
            </div>
            <ProgressBar
              now={battingScores.avg_runs}
              variant={
                batting.avg_runs >= battingTargets.avg_runs
                  ? "success"
                  : batting.avg_runs >= battingTargets.avg_runs * 0.8
                  ? "warning"
                  : "danger"
              }
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted text-uppercase">
                Scoring Shot %
              </span>
              <span className="fw-semibold">
                {batting.scoring_shot_pct != null
                  ? `${batting.scoring_shot_pct.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <ProgressBar
              now={battingScores.scoring_shot_pct}
              variant={
                batting.scoring_shot_pct >= 60
                  ? "success"
                  : batting.scoring_shot_pct >= 50
                  ? "warning"
                  : "danger"
              }
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted text-uppercase">
                Boundary %
              </span>
              <span className="fw-semibold">
                {batting.boundary_pct != null
                  ? `${batting.boundary_pct.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <ProgressBar
              now={battingScores.boundary_pct}
              variant={
                batting.boundary_pct >= battingTargets.boundary_pct
                  ? "success"
                  : batting.boundary_pct >=
                    battingTargets.boundary_pct * 0.7
                  ? "warning"
                  : "danger"
              }
            />
          </div>

          {/* Phase breakdown */}
          <div className="table-responsive">
            <table className="table table-sm table-striped mb-0">
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Runs</th>
                  <th>Overs</th>
                  <th>RR</th>
                  <th>Wickets</th>
                </tr>
              </thead>
              <tbody>
                {phaseKeys.map((p) => {
                  const ph = batting.phase?.[p] || {};
                  return (
                    <tr key={p}>
                      <td>{PHASE_LABELS[p] || p}</td>
                      <td>{ph.runs ?? "—"}</td>
                      <td>
                        {ph.overs != null ? ph.overs.toFixed(1) : "—"}
                      </td>
                      <td>
                        {ph.run_rate != null
                          ? ph.run_rate.toFixed(2)
                          : "—"}
                      </td>
                      <td>{ph.wickets ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionBlock>

        {/* Team Bowling */}
        <SectionBlock title="Team Bowling">
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted text-uppercase">
                Avg Runs Conceded
              </span>
              <span className="fw-semibold">
                {bowling.avg_runs_conceded != null
                  ? bowling.avg_runs_conceded.toFixed(1)
                  : "—"}
              </span>
            </div>
            <ProgressBar
              now={bowlingScores.avg_runs_conceded}
              variant={
                bowling.avg_runs_conceded <=
                bowlingTargets.avg_runs_conceded
                  ? "success"
                  : bowling.avg_runs_conceded <=
                    bowlingTargets.avg_runs_conceded * 1.15
                  ? "warning"
                  : "danger"
              }
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted text-uppercase">
                Economy Rate
              </span>
              <span className="fw-semibold">
                {bowling.economy != null
                  ? bowling.economy.toFixed(2)
                  : "—"}
              </span>
            </div>
            <ProgressBar
              now={bowlingScores.economy}
              variant={
                bowling.economy <= bowlingTargets.economy
                  ? "success"
                  : bowling.economy <= bowlingTargets.economy * 1.15
                  ? "warning"
                  : "danger"
              }
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="small text-muted text-uppercase">
                Dot Ball %
              </span>
              <span className="fw-semibold">
                {bowling.dot_pct != null
                  ? `${bowling.dot_pct.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <ProgressBar
              now={bowlingScores.dot_pct}
              variant={
                bowling.dot_pct >= 60
                  ? "success"
                  : bowling.dot_pct >= 50
                  ? "warning"
                  : "danger"
              }
            />
          </div>

          {/* Phase breakdown */}
          <div className="table-responsive">
            <table className="table table-sm table-striped mb-0">
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Runs</th>
                  <th>Overs</th>
                  <th>Eco</th>
                  <th>Wkts</th>
                </tr>
              </thead>
              <tbody>
                {phaseKeys.map((p) => {
                  const ph = bowling.phase?.[p] || {};
                  return (
                    <tr key={p}>
                      <td>{PHASE_LABELS[p] || p}</td>
                      <td>{ph.runs_conceded ?? "—"}</td>
                      <td>
                        {ph.overs != null ? ph.overs.toFixed(1) : "—"}
                      </td>
                      <td>
                        {ph.economy != null
                          ? ph.economy.toFixed(2)
                          : "—"}
                      </td>
                      <td>{ph.wickets ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionBlock>

        {/* Fielding */}
        <SectionBlock title="Fielding">
          <Row className="text-center mb-3">
            <Col xs={3}>
              <div className="h5 mb-0">
                {fielding.catches ?? 0}
              </div>
              <small className="text-muted">Catches</small>
            </Col>
            <Col xs={3}>
              <div className="h5 mb-0">
                {fielding.run_outs ?? 0}
              </div>
              <small className="text-muted">Run Outs</small>
            </Col>
            <Col xs={3}>
              <div className="h5 mb-0 text-warning">
                {fielding.drop_catches ?? 0}
              </div>
              <small className="text-muted">Drops</small>
            </Col>
            <Col xs={3}>
              <div className="h5 mb-0 text-warning">
                {fielding.missed_run_outs ?? 0}
              </div>
              <small className="text-muted">Missed ROs</small>
            </Col>
          </Row>

          <Row className="text-center mb-3">
            <Col xs={4}>
              <div className="h6 mb-0">
                {fielding.clean_pickups ?? 0}
              </div>
              <small className="text-muted">Clean Pickups</small>
            </Col>
            <Col xs={4}>
              <div className="h6 mb-0 text-warning">
                {fielding.fumbles ?? 0}
              </div>
              <small className="text-muted">Fumbles</small>
            </Col>
            <Col xs={4}>
              <div className="h6 mb-0 text-warning">
                {fielding.overthrows ?? 0}
              </div>
              <small className="text-muted">Overthrows</small>
            </Col>
          </Row>

          <Row className="text-center">
            <Col xs={6}>
              <div className="h6 mb-0 text-warning">
                {fielding.discipline?.wides ?? 0}
              </div>
              <small className="text-muted">Wides</small>
            </Col>
            <Col xs={6}>
              <div className="h6 mb-0 text-warning">
                {fielding.discipline?.no_balls ?? 0}
              </div>
              <small className="text-muted">No Balls</small>
            </Col>
          </Row>
        </SectionBlock>

        <SectionBlock title="Leaders">
          <Row>
            {/* Batting */}
            <Col md={4} className="mb-3">
              <div className="fw-semibold mb-2">Batting</div>
              <ul className="list-group list-group-flush">
                {(leaders.batting || []).map((p) => (
                  <li
                    key={p.player_id}
                    className={
                      "list-group-item " +
                      (isDarkMode ? "bg-dark text-light" : "")
                    }
                  >
                    <div className="fw-semibold">{p.player_name}</div>
                    <small
                      className={isDarkMode ? "text-light" : "text-muted"}
                    >
                      {p.runs} runs
                      {p.strike_rate != null
                        ? ` • SR ${p.strike_rate.toFixed(1)}`
                        : ""}
                    </small>
                  </li>
                ))}
                {(!leaders.batting || !leaders.batting.length) && (
                  <li
                    className={
                      "list-group-item small text-muted " +
                      (isDarkMode ? "bg-dark text-light" : "")
                    }
                  >
                    No batting leaders yet.
                  </li>
                )}
              </ul>
            </Col>

            {/* Bowling */}
            <Col md={4} className="mb-3">
              <div className="fw-semibold mb-2">Bowling</div>
              <ul className="list-group list-group-flush">
                {(leaders.bowling || []).map((p) => (
                  <li
                    key={p.player_id}
                    className={
                      "list-group-item " +
                      (isDarkMode ? "bg-dark text-light" : "")
                    }
                  >
                    <div className="fw-semibold">{p.player_name}</div>
                    <small
                      className={isDarkMode ? "text-light" : "text-muted"}
                    >
                      {p.wickets} wickets
                      {p.economy != null
                        ? ` • Econ ${p.economy.toFixed(2)}`
                        : ""}
                    </small>
                  </li>
                ))}
                {(!leaders.bowling || !leaders.bowling.length) && (
                  <li
                    className={
                      "list-group-item small text-muted " +
                      (isDarkMode ? "bg-dark text-light" : "")
                    }
                  >
                    No bowling leaders yet.
                  </li>
                )}
              </ul>
            </Col>

            {/* Fielding */}
            <Col md={4} className="mb-3">
              <div className="fw-semibold mb-2">Fielding</div>
              <ul className="list-group list-group-flush">
                {(leaders.fielding || []).map((p) => (
                  <li
                    key={p.player_id}
                    className={
                      "list-group-item " +
                      (isDarkMode ? "bg-dark text-light" : "")
                    }
                  >
                    <div className="fw-semibold">{p.player_name}</div>
                    <small
                      className={isDarkMode ? "text-light" : "text-muted"}
                    >
                      {p.catches} catches • {p.run_outs} run outs
                    </small>
                  </li>
                ))}
                {(!leaders.fielding || !leaders.fielding.length) && (
                  <li
                    className={
                      "list-group-item small text-muted " +
                      (isDarkMode ? "bg-dark text-light" : "")
                    }
                  >
                    No fielding leaders yet.
                  </li>
                )}
              </ul>
            </Col>
          </Row>
        </SectionBlock>


      </>
    );
  };

  /** -------- Page layout -------- */
  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />

        {/* Filters */}
        <Card
          bg={cardVariant}
          text={isDarkMode ? "light" : "dark"}
          className="mb-4 shadow-sm"
        >
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label className="fw-bold">Category</Form.Label>
                <Form.Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loadingTournaments}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Label className="fw-bold">Tournament</Form.Label>
                <Form.Select
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  disabled={loadingTournaments || !tournaments.length}
                >
                  {!tournaments.length && (
                    <option value="">No tournaments found</option>
                  )}
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Label className="fw-bold">Team</Form.Label>
                <Form.Select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  disabled={loadingTeams || !teams.length}
                >
                  {!teams.length && <option value="">No teams</option>}
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Label className="fw-bold">Player</Form.Label>
                <Form.Select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  disabled={loadingPlayers || !players.length}
                >
                  {!players.length && <option value="">No players</option>}
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            {(loadingTournaments || loadingTeams || loadingPlayers) && (
              <div className="mt-3">
                <Spinner animation="border" size="sm" />{" "}
                <span className="small">Loading...</span>
              </div>
            )}

            {error && (
              <Alert className="mt-3" variant="danger">
                {error}
              </Alert>
            )}
          </Card.Body>
        </Card>

        {/* Cards grid, to mirror PostGame style */}
        <Row className="g-4">
          {/* Player Tournament Summary Card */}
          <Col md={4}>
            <Card
              bg={cardVariant}
              text={isDarkMode ? "light" : "dark"}
              className="h-100 shadow"
            >
              <Card.Body>
                <Card.Title className="fw-bold">
                  Player Tournament Summary
                </Card.Title>
                <Card.Text className="mb-3">
                  Tournament-long batting, bowling and fielding snapshot for the
                  selected player.
                </Card.Text>
                <Button
                  disabled={
                    !selectedPlayerId ||
                    loadingTournaments ||
                    loadingTeams ||
                    loadingPlayers ||
                    playerSummaryLoading ||
                    !!playerSummaryError
                  }
                  onClick={() => setShowPlayerModal(true)}
                >
                  {playerSummaryLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading…
                    </>
                  ) : (
                    "Open"
                  )}
                </Button>
                {playerSummaryError && (
                  <Alert variant="danger" className="mt-3 mb-0 py-2">
                    {playerSummaryError}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Team Tournament Summary Card */}
          <Col md={4}>
            <Card
              bg={cardVariant}
              text={isDarkMode ? "light" : "dark"}
              className="h-100 shadow"
            >
              <Card.Body>
                <Card.Title className="fw-bold">
                  Team Tournament Summary
                </Card.Title>
                <Card.Text className="mb-3">
                  Tournament-long overview of batting, bowling, fielding and
                  key leaders for the selected team.
                </Card.Text>
                <Button
                  disabled={
                    !selectedTeamId ||
                    loadingTournaments ||
                    loadingTeams ||
                    teamSummaryLoading
                  }
                  onClick={() => {
                    fetchTeamSummary();
                    setShowTeamModal(true);
                  }}
                >
                  {teamSummaryLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading…
                    </>
                  ) : (
                    "Open"
                  )}
                </Button>
                {teamSummaryError && (
                  <Alert variant="danger" className="mt-3 mb-0 py-2">
                    {teamSummaryError}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Player Summary Modal */}
      <Modal
        show={showPlayerModal}
        onHide={() => setShowPlayerModal(false)}
        size="lg"
        centered
        contentClassName={isDarkMode ? "bg-dark text-white" : ""}
      >
        <Modal.Header closeButton>
          <Modal.Title>Player Tournament Summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {playerSummaryError && (
            <Alert variant="danger" className="mb-2">
              {playerSummaryError}
            </Alert>
          )}

          {playerSummaryLoading && (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          )}

          {!playerSummaryLoading && playerSummary && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <div className="small text-muted">Player</div>
                  <div className="fw-bold">{playerSummary.player_name}</div>
                </div>
                <div className="text-end">
                  <div className="small text-muted">Team</div>
                  <div className="fw-bold">{playerSummary.team_name}</div>
                </div>
              </div>

              <Tabs
                id="tournament-player-summary-tabs"
                activeKey={playerModalTab}
                onSelect={(key) => setPlayerModalTab(key || "Batting")}
                className="mb-2"
                justify
              >
                <Tab eventKey="Batting" title="Batting">
                  {renderBattingSummary()}
                </Tab>
                <Tab eventKey="Bowling" title="Bowling">
                  {renderBowlingSummary()}
                </Tab>
                <Tab eventKey="Fielding" title="Fielding">
                  {renderFieldingSummary()}
                </Tab>
              </Tabs>
            </>
          )}

          {!playerSummaryLoading && !playerSummary && !playerSummaryError && (
            <div className="text-muted">
              Select a tournament, team &amp; player above, then open this card
              again to see their tournament summary.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPlayerModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Team Summary Modal */}
      <Modal
        show={showTeamModal}
        onHide={() => setShowTeamModal(false)}
        size="lg"
        centered
        contentClassName={isDarkMode ? "bg-dark text-white" : ""}
      >
        <Modal.Header closeButton>
          <Modal.Title>Team Tournament Summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {teamSummaryError && (
            <Alert variant="danger" className="mb-2">
              {teamSummaryError}
            </Alert>
          )}

          {teamSummaryLoading && (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          )}

          {!teamSummaryLoading && !teamSummary && !teamSummaryError && (
            <div className="text-muted">
              Select a tournament &amp; team above, then open this card again to
              generate the summary.
            </div>
          )}

          {!teamSummaryLoading && teamSummary && renderTeamSummary()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTeamModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
