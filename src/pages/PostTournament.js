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
      return;
    }

    let mounted = true;
    setError("");
    setPlayers([]);
    setSelectedPlayerId("");
    setPlayerSummary(null);
    setPlayerSummaryError("");
    setShowPlayerModal(false);

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

  /** -------- Bowling tab renderer (Tournament) -------- */
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

          {/* Team Tournament Summary Card (placeholder for future) */}
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
                  Coming soon: quick high-level team metrics, leaders and
                  trends across the tournament.
                </Card.Text>
                <Button disabled variant="secondary">
                  Coming Soon
                </Button>
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
    </div>
  );
}
