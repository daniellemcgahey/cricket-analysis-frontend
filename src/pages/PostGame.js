// src/pages/PostGame.js
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  Badge,
  Modal,
  Table,
  ProgressBar,
  Tabs,
  Tab,
} from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import api from "../api";

/** ===================== Config ===================== */

const EP_MATCHES_BY_CATEGORY = "/matches"; // GET ?teamCategory=Men|Women|U19 Men|U19 Women|Training

// Category → KPI endpoint (each category can have different KPI sets/targets)
const KPI_ENDPOINT_BY_CATEGORY = {
  Men: "/postgame/men/match-kpis",
  Women: "/postgame/women/match-kpis",
  "U19 Men": "/postgame/u19-men/match-kpis",
  "U19 Women": "/postgame/u19-women/match-kpis",
  Training: "/postgame/training/match-kpis",
};

// Player summary endpoints
const EP_POSTGAME_TEAMS = "/postgame/teams";
const EP_POSTGAME_PLAYERS = "/postgame/players";
const EP_POSTGAME_PLAYER_SUMMARY = "/postgame/player-summary";

const CATEGORIES = ["Men", "Women", "U19 Men", "U19 Women", "Training"];
const TAB_KEYS = ["Batting", "Bowling", "Fielding"];
const PHASE_ORDER = ["Powerplay", "Middle Overs", "Death Overs", "Match"];

/** ===================== Helpers (category-safe filtering) ===================== */

const isBrasil = (name) => /bra[sz]il/i.test(name || "");

const parseCategoryTokens = (name) => {
  const s = String(name || "").toLowerCase();
  const u19 = /\bu-?19\b/.test(s) || /\bu19\b/.test(s);
  const women = /\bwomen\b/.test(s);
  const men = /\bmen\b/.test(s);
  const training = /\btraining\b/.test(s);
  return { u19, women, men, training };
};

const isNameInCategory = (name, category) => {
  const { u19, women, men, training } = parseCategoryTokens(name);
  switch (category) {
    case "Men":
      return !u19 && men && !women;
    case "Women":
      return !u19 && women;
    case "U19 Men":
      return u19 && men && !women;
    case "U19 Women":
      return u19 && women;
    case "Training":
      return training;
    default:
      return false;
  }
};

const matchIsBrasilInCategory = (m, category) => {
  const a = m.team_a || "";
  const b = m.team_b || "";
  if (isBrasil(a)) return isNameInCategory(a, category);
  if (isBrasil(b)) return isNameInCategory(b, category);
  return false;
};

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

export default function PostGame() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const cardVariant = isDarkMode ? "dark" : "light";
  const cardVariantClass = isDarkMode ? "bg-secondary text-white border-0" : "";

  // -------- Filters --------
  const [category, setCategory] = useState("Men");
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");

  // Loading / errors
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState("");

  // -------- KPI Modal --------
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpisError, setKpisError] = useState("");
  const [kpisData, setKpisData] = useState([]);
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("Batting");

  // -------- Player Summary Modal --------
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerModalTab, setPlayerModalTab] = useState("Batting");
  const [teamsForMatch, setTeamsForMatch] = useState([]);
  const [playersForTeam, setPlayersForTeam] = useState([]);
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [playerSummary, setPlayerSummary] = useState(null);
  const [playerSummaryLoading, setPlayerSummaryLoading] = useState(false);
  const [playerSummaryError, setPlayerSummaryError] = useState("");

  // -------- Fetch matches (category + Brasil) --------
  useEffect(() => {
    let mounted = true;
    setError("");
    setLoadingMatches(true);
    setMatches([]);
    setSelectedMatchId("");

    api
      .get(EP_MATCHES_BY_CATEGORY, { params: { teamCategory: category } })
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : [];

        const filtered = list.filter((m) => {
          const hasBrasil = isBrasil(m.team_a) || isBrasil(m.team_b);
          return hasBrasil && matchIsBrasilInCategory(m, category);
        });

        filtered.sort((a, b) => {
          const da = new Date(a.match_date || 0).getTime();
          const db = new Date(b.match_date || 0).getTime();
          return db - da;
        });

        setMatches(filtered);
        setSelectedMatchId(filtered[0]?.match_id || "");
      })
      .catch(() => setError("Could not load matches"))
      .finally(() => setLoadingMatches(false));

    return () => {
      mounted = false;
    };
  }, [category]);

  // -------- KPI helpers --------

  const isNA = (v) =>
    v === null ||
    v === undefined ||
    (typeof v === "string" && ["na", "n/a", "not applicable"].includes(v.trim().toLowerCase()));

  const coerceNum = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));
  const cmp = (actual, operator, target) => {
    const aNum = !Number.isNaN(coerceNum(actual));
    const tNum = !Number.isNaN(coerceNum(target));

    if (aNum && tNum) {
      const a = Number(actual);
      const t = Number(target);
      switch (operator) {
        case ">=":
          return a >= t;
        case ">":
          return a > t;
        case "==":
          return a === t;
        case "<=":
          return a <= t;
        case "<":
          return a < t;
        case "!=":
          return a !== t;
        default:
          return a >= t;
      }
    } else {
      switch (operator) {
        case "==":
          return String(actual) === String(target);
        case "!=":
          return String(actual) !== String(target);
        default:
          return String(actual) === String(target);
      }
    }
  };

  const formatVal = (v, unit) => {
    if (isNA(v)) return "N/A";
    if (v === "") return "—";
    if (typeof v === "number" && unit === "%") return `${v.toFixed(1)}%`;
    if (typeof v === "number") return String(v);
    return unit ? `${v} ${unit}` : String(v);
  };

  // -------- Open modal & load KPIs --------
  const openKpiModal = async () => {
    if (!selectedMatchId) {
      alert("Please select a match that includes Brasil.");
      return;
    }
    setActiveTab("Batting");
    setShowKpiModal(true);
    setKpisError("");
    setKpisData([]);
    setKpisLoading(true);
    try {
      const EP_MATCH_KPIS = KPI_ENDPOINT_BY_CATEGORY[category];
      if (!EP_MATCH_KPIS) throw new Error(`No KPI endpoint mapped for ${category}`);

      const res = await api.get(EP_MATCH_KPIS, { params: { match_id: selectedMatchId } });

      const arr = Array.isArray(res.data?.kpis)
        ? res.data.kpis
        : Array.isArray(res.data)
        ? res.data
        : [];

      setKpisData(arr);
    } catch (e) {
      console.error(e);
      setKpisError("Failed to load KPIs for this match.");
    } finally {
      setKpisLoading(false);
    }
  };
  const closeKpiModal = () => setShowKpiModal(false);

  // -------- Derived KPI views --------
  const withPassFail = useMemo(() => {
    return kpisData.map((k) => {
      if (typeof k.ok === "boolean") return k;
      if (isNA(k.actual)) return { ...k, ok: null };
      const ok = cmp(k.actual, k.operator || ">=", k.target);
      return { ...k, ok };
    });
  }, [kpisData]);

  const filteredKPIs = useMemo(() => {
    const base = withPassFail;
    return showFailedOnly ? base.filter((k) => !k.ok) : base;
  }, [withPassFail, showFailedOnly]);

  const kpiToTab = (k) => {
    const b = String(k.bucket || "General").toLowerCase();
    if (b.includes("bat")) return "Batting";
    if (b.includes("bowl")) return "Bowling";
    if (b.includes("field")) return "Fielding";
    return "Batting";
  };

  const phaseOf = (k) => {
    const p = String(k.phase || "").toLowerCase();
    if (p.startsWith("power")) return "Powerplay";
    if (p.startsWith("middle")) return "Middle Overs";
    if (p.startsWith("death")) return "Death Overs";
    return "Match";
  };

  const byTabPhase = useMemo(() => {
    const acc = {
      Batting: { Powerplay: [], "Middle Overs": [], "Death Overs": [], Match: [] },
      Bowling: { Powerplay: [], "Middle Overs": [], "Death Overs": [], Match: [] },
      Fielding: { Powerplay: [], "Middle Overs": [], "Death Overs": [], Match: [] },
    };
    filteredKPIs.forEach((k) => {
      const tab = kpiToTab(k);
      const phase = phaseOf(k);
      acc[tab][phase].push(k);
    });
    return acc;
  }, [filteredKPIs]);

  const summary = useMemo(() => {
    const valid = withPassFail.filter((k) => typeof k.ok === "boolean");
    const total = valid.length;
    const passed = valid.filter((k) => k.ok).length;
    return { total, passed, pct: total ? Math.round((passed / total) * 100) : 0 };
  }, [withPassFail]);

  const tabSummary = useMemo(() => {
    const out = {};
    TAB_KEYS.forEach((tabKey) => {
      const all = PHASE_ORDER.flatMap((ph) => byTabPhase[tabKey]?.[ph] || []).filter(Boolean);
      const valid = all.filter((k) => typeof k.ok === "boolean");
      const met = valid.filter((k) => k.ok).length;
      out[tabKey] = {
        total: valid.length,
        met,
        pct: valid.length ? Math.round((met / valid.length) * 100) : 0,
      };
    });
    return out;
  }, [byTabPhase]);

  // -------- UI helpers --------
  const matchLabel = (m) => {
    const when = m.match_date ? new Date(m.match_date).toLocaleDateString() : "";
    const tour = m.tournament ? ` • ${m.tournament}` : "";
    return `${m.team_a} vs ${m.team_b}${tour}${when ? " — " + when : ""}`;
  };

  const renderPhaseSection = (phaseKey, itemsRaw) => {
    const arr = Array.isArray(itemsRaw) ? itemsRaw.filter(Boolean) : [];

    return (
      <Card key={phaseKey} className={`mb-3 ${cardVariantClass}`}>
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between">
            <h6 className="fw-bold mb-2">{phaseKey}</h6>
            <Badge bg="secondary">
              {arr.filter((i) => i && i.ok === true).length}/{arr.length} met
            </Badge>
          </div>

          {arr.length === 0 ? (
            <div className="text-muted">No KPIs in this section.</div>
          ) : (
            <Table size="sm" bordered responsive className="mb-0">
              <thead>
                <tr>
                  <th>KPI</th>
                  <th className="text-center" style={{ width: 120 }}>
                    Target
                  </th>
                  <th className="text-center" style={{ width: 120 }}>
                    Result
                  </th>
                  <th className="text-center" style={{ width: 80 }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {arr.map((k) => (
                  <tr key={k.key}>
                    <td>
                      <div className="fw-semibold">{k.label || k.key}</div>
                      {k.bucket !== "Fielding" && k.phase && (
                        <div className="small text-muted">{k.phase}</div>
                      )}
                    </td>
                    <td className="text-center">{formatVal(k.target, k.unit)}</td>
                    <td className="text-center">{formatVal(k.actual, k.unit)}</td>
                    <td className="text-center">
                      {k.ok === true && <Badge bg="success">Met</Badge>}
                      {k.ok === false && <Badge bg="danger">Missed</Badge>}
                      {k.ok == null && <Badge bg="secondary">N/A</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderTabBody = (tabKey) => {
    if (kpisLoading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      );
    }

    if (tabKey === "Fielding") {
      const allFielding = PHASE_ORDER.flatMap((ph) => byTabPhase.Fielding?.[ph] || []).filter(
        Boolean
      );
      return <>{renderPhaseSection("Match", allFielding)}</>;
    }

    const sections = PHASE_ORDER.map((ph) => {
      const arr = (byTabPhase[tabKey]?.[ph] || []).filter(Boolean);
      return renderPhaseSection(ph, arr);
    });
    return <>{sections}</>;
  };

  // -------- Player Summary logic --------

  const openPlayerModal = async () => {
    if (!selectedMatchId) {
      alert("Please select a match first.");
      return;
    }
    setShowPlayerModal(true);
    setPlayerModalTab("Batting");
    setTeamsForMatch([]);
    setPlayersForTeam([]);
    setSelectedTeamForPlayer("");
    setSelectedPlayerId("");
    setPlayerSummary(null);
    setPlayerSummaryError("");

    try {
      const resTeams = await api.get(EP_POSTGAME_TEAMS, { params: { match_id: selectedMatchId } });
      const teams = Array.isArray(resTeams.data?.teams) ? resTeams.data.teams : [];
      setTeamsForMatch(teams);
      if (teams.length) {
        const firstTeamId = teams[0].id;
        setSelectedTeamForPlayer(String(firstTeamId));
        await loadPlayersForTeam(firstTeamId, true);
      }
    } catch (err) {
      console.error(err);
      setPlayerSummaryError("Failed to load teams for this match.");
    }
  };

  const closePlayerModal = () => setShowPlayerModal(false);

  const loadPlayersForTeam = async (teamId, autoSelectFirst = false) => {
    setPlayersForTeam([]);
    setSelectedPlayerId("");
    setPlayerSummary(null);
    setPlayerSummaryError("");
    if (!teamId) return;

    try {
      const resPlayers = await api.get(EP_POSTGAME_PLAYERS, {
        params: { match_id: selectedMatchId, team_id: teamId },
      });
      const players = Array.isArray(resPlayers.data?.players) ? resPlayers.data.players : [];
      setPlayersForTeam(players);

      if (autoSelectFirst && players.length) {
        const firstPlayerId = players[0].id;
        setSelectedPlayerId(String(firstPlayerId));
        await loadPlayerSummary(teamId, firstPlayerId);
      }
    } catch (err) {
      console.error(err);
      setPlayerSummaryError("Failed to load players for this team.");
    }
  };

  const loadPlayerSummary = async (teamId, playerId) => {
    if (!teamId || !playerId) return;
    setPlayerSummaryLoading(true);
    setPlayerSummaryError("");
    setPlayerSummary(null);
    try {
      const res = await api.get(EP_POSTGAME_PLAYER_SUMMARY, {
        params: {
          match_id: selectedMatchId,
          team_id: teamId,
          player_id: playerId,
          team_category: category,
        },
      });
      setPlayerSummary(res.data || null);
    } catch (err) {
      console.error(err);
      setPlayerSummaryError("Failed to load player summary.");
    } finally {
      setPlayerSummaryLoading(false);
    }
  };

  const handleTeamChange = async (e) => {
    const newTeamId = Number(e.target.value || "");
    setSelectedTeamForPlayer(e.target.value);
    await loadPlayersForTeam(newTeamId, true);
  };

  const handlePlayerChange = async (e) => {
    const newPlayerId = Number(e.target.value || "");
    setSelectedPlayerId(e.target.value);
    await loadPlayerSummary(Number(selectedTeamForPlayer), newPlayerId);
  };

  // --- Player Summary Tab renderers ---

  const renderBattingSummary = () => {
    const batting = playerSummary?.batting;
    if (!batting || !batting.has_data) {
      return <div className="text-muted">No batting data for this player in this match.</div>;
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
        <SectionBlock title="Score">
          <MetricRow
            label="Runs (Balls)"
            value={
              runs != null && balls != null ? `${runs} (${balls})` : runs != null ? runs : "—"
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
              <span className="small text-muted text-uppercase">Scoring Shot %</span>
              <span className="fw-semibold">
                {scoringShotPct != null ? `${scoringShotPct.toFixed(1)}%` : "—"}
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
            value={boundaryPct != null ? `${boundaryPct.toFixed(1)}%` : "—"}
            sub="4s + 6s as % of balls faced"
          />
        </SectionBlock>

        <SectionBlock title="Phases">
          <MetricRow label="Powerplay Runs" value={phase.powerplay_runs ?? "—"} />
          <MetricRow label="Middle Overs Runs" value={phase.middle_overs_runs ?? "—"} />
          <MetricRow label="Death Overs Runs" value={phase.death_overs_runs ?? "—"} />
        </SectionBlock>

        {batting.dismissal && (
          <SectionBlock title="Dismissal">
            <div>{batting.dismissal}</div>
          </SectionBlock>
        )}
      </>
    );
  };

  const renderBowlingSummary = () => {
    const bowling = playerSummary?.bowling;
    if (!bowling || !bowling.has_data) {
      return <div className="text-muted">No bowling data for this player in this match.</div>;
    }

    const overs = bowling.overs ?? null;
    const maidens = bowling.maidens ?? null;
    const runs = bowling.runs_conceded ?? null;
    const wkts = bowling.wickets ?? null;
    const econ = bowling.economy ?? null;
    const dotPct = bowling.dot_ball_percentage ?? null;

    const phase = bowling.phase_breakdown || {};

    return (
      <>
        <SectionBlock title="Figures">
          <MetricRow
            label="Overs–Maidens–Runs–Wickets"
            value={
              overs != null || maidens != null || runs != null || wkts != null
                ? `${overs ?? 0}-${maidens ?? 0}-${runs ?? 0}-${wkts ?? 0}`
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

        <SectionBlock title="Phases">
          <MetricRow
            label="Powerplay"
            value={
              phase.powerplay_overs != null || phase.powerplay_econ != null
                ? `${phase.powerplay_overs ?? 0} ov @ ${phase.powerplay_econ ?? "—"}`
                : "—"
            }
          />
          <MetricRow
            label="Middle Overs"
            value={
              phase.middle_overs_overs != null || phase.middle_overs_econ != null
                ? `${phase.middle_overs_overs ?? 0} ov @ ${phase.middle_overs_econ ?? "—"}`
                : "—"
            }
          />
        </SectionBlock>
      </>
    );
  };

  const renderFieldingSummary = () => {
    const fielding = playerSummary?.fielding;
    if (!fielding || !fielding.has_data) {
      return <div className="text-muted">No fielding data for this player in this match.</div>;
    }

    return (
      <>
        <SectionBlock title="Involvement">
          <MetricRow label="Balls Fielded" value={fielding.balls_fielded ?? 0} />
          <MetricRow label="Clean Pickups" value={fielding.clean_pickups ?? 0} />
          <MetricRow label="Fumbles" value={fielding.fumbles ?? 0} />
          <MetricRow label="Overthrows Conceded" value={fielding.overthrows_conceded ?? 0} />
        </SectionBlock>

        <SectionBlock title="Catching & Run Outs">
          <MetricRow label="Catches Taken" value={fielding.catches_taken ?? 0} />
          <MetricRow label="Drops / Missed Catches" value={fielding.missed_catches ?? 0} />
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
              fielding.clean_hands_pct != null ? `${fielding.clean_hands_pct.toFixed(1)}%` : "—"
            }
          />
          <MetricRow
            label="Chance Conversion %"
            value={
              fielding.conversion_rate != null ? `${fielding.conversion_rate.toFixed(1)}%` : "—"
            }
          />
        </SectionBlock>
      </>
    );
  };

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />

        {/* Filters */}
        <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label className="fw-bold">Category</Form.Label>
                <Form.Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loadingMatches}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={8}>
                <Form.Label className="fw-bold">Match (Brasil only)</Form.Label>
                <Form.Select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  disabled={loadingMatches || !matches.length}
                >
                  {matches.length === 0 ? (
                    <option value="">No Brasil matches found</option>
                  ) : (
                    matches.map((m) => (
                      <option key={m.match_id} value={m.match_id}>
                        {matchLabel(m)}
                      </option>
                    ))
                  )}
                </Form.Select>
              </Col>

              <Col md={1} className="text-end">
                {loadingMatches && <Spinner animation="border" size="sm" />}
              </Col>
            </Row>
            {error && (
              <Alert className="mt-3" variant="danger">
                {error}
              </Alert>
            )}
          </Card.Body>
        </Card>

        {/* Cards grid */}
        <Row className="g-4">
          {/* KPI Card */}
          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Match KPIs</Card.Title>
                <Card.Text className="mb-3">
                  Batting, Bowling, Fielding — split by Powerplay, Middle, Death, and Match.
                </Card.Text>
                <Button disabled={!selectedMatchId || loadingMatches} onClick={openKpiModal}>
                  Open
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Player Summary Card */}
          <Col md={4}>
            <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="h-100 shadow">
              <Card.Body>
                <Card.Title className="fw-bold">Player Summary</Card.Title>
                <Card.Text className="mb-3">
                  Quick batting, bowling and fielding snapshot for any player in this match.
                </Card.Text>
                <Button disabled={!selectedMatchId || loadingMatches} onClick={openPlayerModal}>
                  Open
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Future: more Post-Game cards here */}
        </Row>
      </div>

      {/* KPI Modal */}
      <Modal
        show={showKpiModal}
        onHide={closeKpiModal}
        size="lg"
        centered
        contentClassName={isDarkMode ? "bg-dark text-white" : ""}
      >
        <Modal.Header closeButton>
          <Modal.Title>KPIs — Targets vs Results</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {kpisError && (
            <Alert variant="danger" className="mb-2">
              {kpisError}
            </Alert>
          )}

          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-3">
              <div>
                <div className="small text-muted">KPIs Met</div>
                <div className="fw-bold">{summary.pct}%</div>
              </div>
              <div style={{ width: 220 }}>
                <ProgressBar
                  now={summary.pct}
                  variant={summary.pct >= 70 ? "success" : summary.pct >= 50 ? "warning" : "danger"}
                />
              </div>
            </div>

            <Form.Check
              type="switch"
              id="failed-only"
              label="Show failed only"
              checked={showFailedOnly}
              onChange={(e) => setShowFailedOnly(e.target.checked)}
            />
          </div>

          <Tabs
            id="kpi-tabs"
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key || "Batting")}
            className="mb-3"
            justify
          >
            {TAB_KEYS.map((tabKey) => (
              <Tab
                key={tabKey}
                eventKey={tabKey}
                title={
                  <span className="d-inline-flex align-items-center gap-2">
                    {tabKey}
                    {tabSummary[tabKey]?.total > 0 && (
                      <Badge
                        bg={
                          tabSummary[tabKey].pct >= 70
                            ? "success"
                            : tabSummary[tabKey].pct >= 50
                            ? "warning"
                            : "danger"
                        }
                      >
                        {tabSummary[tabKey].pct}%
                      </Badge>
                    )}
                  </span>
                }
              >
                {renderTabBody(tabKey)}
              </Tab>
            ))}
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeKpiModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Player Summary Modal */}
      <Modal
        show={showPlayerModal}
        onHide={closePlayerModal}
        size="lg"
        centered
        contentClassName={isDarkMode ? "bg-dark text-white" : ""}
      >
        <Modal.Header closeButton>
          <Modal.Title>Player Summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {playerSummaryError && (
            <Alert variant="danger" className="mb-2">
              {playerSummaryError}
            </Alert>
          )}

          {/* Team & Player selectors – vertical alignment */}
          <Form className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Team</Form.Label>
              <Form.Select
                value={selectedTeamForPlayer}
                onChange={handleTeamChange}
                disabled={!teamsForMatch.length}
              >
                {!teamsForMatch.length && <option value="">No teams found</option>}
                {teamsForMatch.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-bold">Player</Form.Label>
              <Form.Select
                value={selectedPlayerId}
                onChange={handlePlayerChange}
                disabled={!playersForTeam.length}
              >
                {!playersForTeam.length && <option value="">No players found</option>}
                {playersForTeam.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>

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
                id="player-summary-tabs"
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
            <div className="text-muted">Select a team and player to see their summary.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closePlayerModal}>
            Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
