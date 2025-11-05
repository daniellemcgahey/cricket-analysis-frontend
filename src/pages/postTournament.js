import React, { useContext, useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Spinner,
  Alert,
  Tabs,
  Tab,
  ProgressBar,
} from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import api from "../api";


const CATEGORIES = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

// Tournament-level endpoints (you'll wire these up on the backend)
const EP_TOURNAMENTS = "/posttournament/tournaments";          // GET ?teamCategory=
const EP_TOURNAMENT_TEAMS = "/posttournament/teams";           // GET ?tournament_id=
const EP_TOURNAMENT_PLAYERS = "/posttournament/players";       // GET ?tournament_id=&team_id=
const EP_TOURNAMENT_PLAYER_SUMMARY = "/posttournament/player-summary"; // GET ?tournament_id=&team_id=&player_id=&team_category=

// ---------- Small UI helpers ----------

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

// ======================================
// Tournament Player Summary Component
// ======================================

export default function TournamentPlayerSummary() {
  const { isDarkMode } = useContext(DarkModeContext);
  const cardVariant = isDarkMode ? "dark" : "light";

  // Filters
  const [category, setCategory] = useState("Men");
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  const [teamsForTournament, setTeamsForTournament] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const [playersForTeam, setPlayersForTeam] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

  // Data + state
  const [playerSummary, setPlayerSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("Batting");

  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [error, setError] = useState("");

  // ---------- Fetch tournaments when category changes ----------
  useEffect(() => {
    let mounted = true;
    setError("");
    setTournaments([]);
    setSelectedTournamentId("");
    setTeamsForTournament([]);
    setSelectedTeamId("");
    setPlayersForTeam([]);
    setSelectedPlayerId("");
    setPlayerSummary(null);

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
          const firstId = String(list[0].id);
          setSelectedTournamentId(firstId);
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

  // ---------- Fetch teams when tournament changes ----------
  useEffect(() => {
    if (!selectedTournamentId) {
      setTeamsForTournament([]);
      setSelectedTeamId("");
      setPlayersForTeam([]);
      setSelectedPlayerId("");
      setPlayerSummary(null);
      return;
    }

    let mounted = true;
    setLoadingTeams(true);
    setTeamsForTournament([]);
    setSelectedTeamId("");
    setPlayersForTeam([]);
    setSelectedPlayerId("");
    setPlayerSummary(null);
    setError("");

    api
      .get(EP_TOURNAMENT_TEAMS, { params: { tournament_id: selectedTournamentId } })
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res.data?.teams) ? res.data.teams : [];
        setTeamsForTournament(list);
        if (list.length) {
          const firstTeamId = String(list[0].id);
          setSelectedTeamId(firstTeamId);
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

  // ---------- Fetch players when team changes ----------
  useEffect(() => {
    if (!selectedTournamentId || !selectedTeamId) {
      setPlayersForTeam([]);
      setSelectedPlayerId("");
      setPlayerSummary(null);
      return;
    }

    let mounted = true;
    setLoadingPlayers(true);
    setPlayersForTeam([]);
    setSelectedPlayerId("");
    setPlayerSummary(null);
    setError("");

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
        setPlayersForTeam(list);
        if (list.length) {
          const firstPlayerId = String(list[0].id);
          setSelectedPlayerId(firstPlayerId);
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

  // ---------- Fetch player tournament summary when player changes ----------
  useEffect(() => {
    if (!selectedTournamentId || !selectedTeamId || !selectedPlayerId) {
      setPlayerSummary(null);
      return;
    }

    let mounted = true;
    setLoadingSummary(true);
    setPlayerSummary(null);
    setError("");

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
        setError("Could not load player tournament summary.");
      })
      .finally(() => setLoadingSummary(false));

    return () => {
      mounted = false;
    };
  }, [selectedTournamentId, selectedTeamId, selectedPlayerId, category]);

  // ---------- Render helpers: Batting / Bowling / Fielding ----------

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
    const fours = batting.fours ?? null;
    const sixes = batting.sixes ?? null;
    const boundaryPct = batting.boundary_percentage ?? null;
    const dotPct = batting.dot_ball_percentage ?? null;
    const scoringShotPct =
      typeof dotPct === "number" ? Number((100 - dotPct).toFixed(1)) : null;

    const phase = batting.phase_breakdown || {};

    return (
      <>
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
          <MetricRow label="4s / 6s" value={`${fours ?? 0} / ${sixes ?? 0}`} />
        </SectionBlock>

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

          {/* Middle Overs */}
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

          {/* Death Overs */}
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

        {batting.dismissal && (
          <SectionBlock title="Most Recent Dismissal (Tournament)">
            <div>{batting.dismissal}</div>
          </SectionBlock>
        )}
      </>
    );
  };

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

    return (
      <>
        <SectionBlock title="Figures (Tournament)">
          <MetricRow
            label="Overs–Dots–Runs–Wickets"
            value={
              overs != null || dotBallsCount != null || runs != null || wkts != null
                ? `${overs ?? 0}-${dotBallsCount ?? 0}-${runs ?? 0}-${wkts ?? 0}`
                : "—"
            }
          />
          <MetricRow
            label="Economy"
            value={econ != null ? econ.toFixed(2) : "—"}
            sub="Runs conceded per over"
          />
          <MetricRow
            label="Dot Ball %"
            value={dotPct != null ? `${dotPct.toFixed(1)}%` : "—"}
            sub="Dots as % of legal balls"
          />
        </SectionBlock>

        <SectionBlock title="Extras & Boundaries">
          <MetricRow label="Wides" value={bowling.wides ?? 0} />
          <MetricRow label="No Balls" value={bowling.no_balls ?? 0} />
          <MetricRow label="Boundary Balls" value={bowling.boundary_balls ?? 0} />
        </SectionBlock>

        <SectionBlock title="Phases (Tournament)">
          {/* Powerplay */}
          <MetricRow
            label="Powerplay"
            value={
              phase.powerplay_overs != null ||
              phase.powerplay_runs != null ||
              phase.powerplay_wickets != null
                ? `${(phase.powerplay_overs ?? 0).toFixed(1)}-${phase.powerplay_dot_balls ?? 0}-${phase.powerplay_runs ?? 0}-${phase.powerplay_wickets ?? 0}`
                : "—"
            }
            sub={
              phase.powerplay_dot_ball_pct != null
                ? `${phase.powerplay_dot_ball_pct.toFixed(1)}% dot balls`
                : undefined
            }
          />

          {/* Middle overs */}
          <MetricRow
            label="Middle Overs"
            value={
              phase.middle_overs_overs != null ||
              phase.middle_overs_runs != null ||
              phase.middle_overs_wickets != null
                ? `${(phase.middle_overs_overs ?? 0).toFixed(1)}-${phase.middle_overs_dot_balls ?? 0}-${phase.middle_overs_runs ?? 0}-${phase.middle_overs_wickets ?? 0}`
                : "—"
            }
            sub={
              phase.middle_overs_dot_ball_pct != null
                ? `${phase.middle_overs_dot_ball_pct.toFixed(1)}% dot balls`
                : undefined
            }
          />

          {/* Death overs */}
          <MetricRow
            label="Death Overs"
            value={
              phase.death_overs_overs != null ||
              phase.death_overs_runs != null ||
              phase.death_overs_wickets != null
                ? `${(phase.death_overs_overs ?? 0).toFixed(1)}-${phase.death_overs_dot_balls ?? 0}-${phase.death_overs_runs ?? 0}-${phase.death_overs_wickets ?? 0}`
                : "—"
            }
            sub={
              phase.death_overs_dot_ball_pct != null
                ? `${phase.death_overs_dot_ball_pct.toFixed(1)}% dot balls`
                : undefined
            }
          />
        </SectionBlock>
      </>
    );
  };

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
            value={fielding.run_outs_direct != null ? fielding.run_outs_direct : 0}
          />
          <MetricRow
            label="Run Outs (Assist)"
            value={fielding.run_outs_assist != null ? fielding.run_outs_assist : 0}
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

  // ---------- Render main card ----------

  return (
    <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="shadow">
      <Card.Body>
        <Card.Title className="fw-bold mb-3">Post-Tournament Player Summary</Card.Title>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {/* Filters: Category → Tournament → Team → Player */}
        <Row className="g-3 mb-3">
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
              {!tournaments.length && <option value="">No tournaments found</option>}
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
              disabled={loadingTeams || !teamsForTournament.length}
            >
              {!teamsForTournament.length && <option value="">No teams</option>}
              {teamsForTournament.map((t) => (
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
              disabled={loadingPlayers || !playersForTeam.length}
            >
              {!playersForTeam.length && <option value="">No players</option>}
              {playersForTeam.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        {loadingSummary && (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        )}

        {!loadingSummary && playerSummary && (
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
              activeKey={activeTab}
              onSelect={(key) => setActiveTab(key || "Batting")}
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

        {!loadingSummary && !playerSummary && !error && (
          <div className="text-muted">
            Select a tournament, team and player to see their tournament summary.
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
