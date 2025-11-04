// src/pages/PostGame.js
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Row, Col, Card, Form, Button, Spinner, Alert, Badge, Modal, Table, ProgressBar, Tabs, Tab
} from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import api from "../api";

/** ===================== Config ===================== */

const EP_MATCHES_BY_CATEGORY = "/matches"; // GET ?teamCategory=Men|Women|U19 Men|U19 Women|Training

// Category → KPI endpoint (each category can have different KPI sets/targets)
const KPI_ENDPOINT_BY_CATEGORY = {
  "Men":        "/postgame/men/match-kpis",
  "Women":      "/postgame/women/match-kpis",
  "U19 Men":    "/postgame/u19-men/match-kpis",
  "U19 Women":  "/postgame/u19-women/match-kpis",
  "Training":   "/postgame/training/match-kpis",
};

// New endpoints for player summary (adjust to your backend)
const EP_POSTGAME_TEAMS = "/postgame/teams";                // GET ?match_id=
const EP_POSTGAME_PLAYERS = "/postgame/players";            // GET ?match_id=&team_id=
const EP_POSTGAME_PLAYER_SUMMARY = "/postgame/player-summary"; // GET ?match_id=&team_id=&player_id=&team_category=

const CATEGORIES = ["Men", "Women", "U19 Men", "U19 Women", "Training"];
const TAB_KEYS = ["Batting", "Bowling", "Fielding"];
const PHASE_ORDER = ["Powerplay", "Middle Overs", "Death Overs", "Match"];

/** ===================== Helpers (category-safe filtering) ===================== */

const isBrasil = (name) => /bra[sz]il/i.test(name || "");

const parseCategoryTokens = (name) => {
  const s = String(name || "").toLowerCase();
  const u19   = /\bu-?19\b/.test(s) || /\bu19\b/.test(s);
  const women = /\bwomen\b/.test(s);
  const men   = /\bmen\b/.test(s); // 'men' as a word, not the tail of 'women'
  const training = /\btraining\b/.test(s);
  return { u19, women, men, training };
};

const isNameInCategory = (name, category) => {
  const { u19, women, men, training } = parseCategoryTokens(name);
  switch (category) {
    case "Men":        return !u19 && men && !women;
    case "Women":      return !u19 && women;
    case "U19 Men":    return u19 && men && !women;
    case "U19 Women":  return u19 && women;
    case "Training":   return training;
    default:           return false;
  }
};

const matchIsBrasilInCategory = (m, category) => {
  const a = m.team_a || "";
  const b = m.team_b || "";
  if (isBrasil(a)) return isNameInCategory(a, category);
  if (isBrasil(b)) return isNameInCategory(b, category);
  return false;
};

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
  const [kpisData, setKpisData] = useState([]);   // [{key,label,unit,bucket,phase,operator,target,actual,ok?,notes}]
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("Batting");

  // -------- Player Summary Modal --------
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerTeams, setPlayerTeams] = useState([]);          // [{ id, name }]
  const [selectedPlayerTeamId, setSelectedPlayerTeamId] = useState("");
  const [teamPlayers, setTeamPlayers] = useState([]);          // [{ id, name }]
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [playerSummary, setPlayerSummary] = useState(null);    // full summary payload
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [playerActiveTab, setPlayerActiveTab] = useState("Batting");

  // -------- Fetch matches (category + Brasil) --------
  useEffect(() => {
    let mounted = true;
    setError("");
    setLoadingMatches(true);
    setMatches([]);
    setSelectedMatchId("");

    api.get(EP_MATCHES_BY_CATEGORY, { params: { teamCategory: category } })
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : [];

        const filtered = list.filter(m => {
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

    return () => { mounted = false; };
  }, [category]);

  // -------- KPI helpers --------

  // Treat "no data" as N/A
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
        case ">=": return a >= t;
        case ">":  return a >  t;
        case "==": return a === t;
        case "<=": return a <= t;
        case "<":  return a <  t;
        case "!=": return a !== t;
        default:   return a >= t;
      }
    } else {
      switch (operator) {
        case "==": return String(actual) === String(target);
        case "!=": return String(actual) !== String(target);
        default:   return String(actual) === String(target);
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

  // Simple helper for player summary values (NA handling)
  const formatSummaryVal = (v, suffix = "") => {
    if (v === null || v === undefined) return "NA";
    if (typeof v === "number" && suffix === "%") {
      return `${v.toFixed(1)}%`;
    }
    return `${v}${suffix}`;
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

      // Accept either {kpis:[...]} or [...]
      const arr = Array.isArray(res.data?.kpis) ? res.data.kpis
                : Array.isArray(res.data) ? res.data
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

  // -------- Open Player Summary Modal --------
  const openPlayerModal = async () => {
    if (!selectedMatchId) {
      alert("Please select a match that includes Brasil.");
      return;
    }
    setShowPlayerModal(true);
    setPlayerError("");
    setPlayerSummary(null);
    setTeamPlayers([]);
    setSelectedPlayerTeamId("");
    setSelectedPlayerId("");
    setPlayerActiveTab("Batting");
    setPlayerLoading(true);

    try {
      const res = await api.get(EP_POSTGAME_TEAMS, {
        params: { match_id: selectedMatchId }
      });
      const arr = Array.isArray(res.data?.teams) ? res.data.teams : [];
      setPlayerTeams(arr);
    } catch (e) {
      console.error(e);
      setPlayerError("Could not load teams for this match.");
    } finally {
      setPlayerLoading(false);
    }
  };

  const closePlayerModal = () => {
    setShowPlayerModal(false);
    setPlayerError("");
    setPlayerSummary(null);
    setTeamPlayers([]);
    setSelectedPlayerTeamId("");
    setSelectedPlayerId("");
  };

  // -------- Fetch players when team changes (Player Modal) --------
  useEffect(() => {
    if (!showPlayerModal || !selectedPlayerTeamId || !selectedMatchId) return;

    setPlayerError("");
    setTeamPlayers([]);
    setSelectedPlayerId("");
    setPlayerSummary(null);
    setPlayerLoading(true);

    api.get(EP_POSTGAME_PLAYERS, {
      params: { match_id: selectedMatchId, team_id: selectedPlayerTeamId }
    })
      .then(res => {
        const arr = Array.isArray(res.data?.players) ? res.data.players : [];
        setTeamPlayers(arr);
      })
      .catch(e => {
        console.error(e);
        setPlayerError("Could not load players for this team.");
      })
      .finally(() => setPlayerLoading(false));
  }, [showPlayerModal, selectedPlayerTeamId, selectedMatchId]);

  // -------- Fetch player summary when player changes --------
  useEffect(() => {
    if (!showPlayerModal || !selectedPlayerTeamId || !selectedPlayerId || !selectedMatchId) return;

    setPlayerError("");
    setPlayerSummary(null);
    setPlayerLoading(true);

    api.get(EP_POSTGAME_PLAYER_SUMMARY, {
      params: {
        match_id: selectedMatchId,
        team_id: selectedPlayerTeamId,
        player_id: selectedPlayerId,
        team_category: category
      }
    })
      .then(res => {
        setPlayerSummary(res.data || null);
      })
      .catch(e => {
        console.error(e);
        setPlayerError("Could not load player summary.");
      })
      .finally(() => setPlayerLoading(false));
  }, [showPlayerModal, selectedPlayerTeamId, selectedPlayerId, selectedMatchId, category]);

  // -------- Derived KPI views --------
  const withPassFail = useMemo(() => {
    return kpisData.map(k => {
      if (typeof k.ok === "boolean") return k;   // backend already decided
      if (isNA(k.actual)) return { ...k, ok: null };  // do not score N/A rows
      const ok = cmp(k.actual, k.operator || ">=", k.target);
      return { ...k, ok };
    });
  }, [kpisData]);


  const filteredKPIs = useMemo(() => {
    const base = withPassFail;
    return showFailedOnly ? base.filter(k => !k.ok) : base;
  }, [withPassFail, showFailedOnly]);

  // Tab assignment based on KPI bucket
  const kpiToTab = (k) => {
    const b = String(k.bucket || "General").toLowerCase();
    if (b.includes("bat")) return "Batting";
    if (b.includes("bowl")) return "Bowling";
    if (b.includes("field")) return "Fielding";
    // default—non-mapped buckets: put under Match in Batting
    return "Batting";
  };

  // Phase normalization
  const phaseOf = (k) => {
    const p = String(k.phase || "").toLowerCase();
    if (p.startsWith("power")) return "Powerplay";
    if (p.startsWith("middle")) return "Middle Overs";
    if (p.startsWith("death")) return "Death Overs";
    return "Match";
  };

  // Split KPIs into tab → phase → items
  const byTabPhase = useMemo(() => {
    const acc = {
      Batting: { "Powerplay": [], "Middle Overs": [], "Death Overs": [], "Match": [] },
      Bowling: { "Powerplay": [], "Middle Overs": [], "Death Overs": [], "Match": [] },
      Fielding:{ "Powerplay": [], "Middle Overs": [], "Death Overs": [], "Match": [] },
    };
    filteredKPIs.forEach(k => {
      const tab = kpiToTab(k);
      const phase = phaseOf(k);
      acc[tab][phase].push(k);
    });
    return acc;
  }, [filteredKPIs]);

  const summary = useMemo(() => {
    const valid = withPassFail.filter(k => typeof k.ok === "boolean");
    const total = valid.length;
    const passed = valid.filter(k => k.ok).length;
    return { total, passed, pct: total ? Math.round((passed / total) * 100) : 0 };
  }, [withPassFail]);

  const tabSummary = useMemo(() => {
    const out = {};
    TAB_KEYS.forEach(tabKey => {
      const all = PHASE_ORDER
        .flatMap(ph => (byTabPhase[tabKey]?.[ph] || []))
        .filter(Boolean);

      const valid = all.filter(k => typeof k.ok === "boolean");
      const met = valid.filter(k => k.ok).length;
      out[tabKey] = {
        total: valid.length,
        met,
        pct: valid.length ? Math.round((met / valid.length) * 100) : 0
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
              {arr.filter(i => i && i.ok === true).length}/{arr.length} met
            </Badge>
          </div>

          {arr.length === 0 ? (
            <div className="text-muted">No KPIs in this section.</div>
          ) : (
            <Table size="sm" bordered responsive className="mb-0">
              <thead>
                <tr>
                  <th>KPI</th>
                  <th className="text-center" style={{ width: 120 }}>Target</th>
                  <th className="text-center" style={{ width: 120 }}>Result</th>
                  <th className="text-center" style={{ width: 80 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {arr.map(k => (
                  <tr key={k.key}>
                    <td>
                      <div className="fw-semibold">{k.label || k.key}</div>
                      {/* Hide the little phase subtitle for Fielding (match-wide) */}
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

    // Fielding: single match-wide table (merge all phases)
    if (tabKey === "Fielding") {
      const allFielding = PHASE_ORDER
        .flatMap(ph => (byTabPhase.Fielding?.[ph] || []))
        .filter(Boolean);

      return <>{renderPhaseSection("Match", allFielding)}</>;
    }

    // Batting / Bowling: keep phased sections
    const sections = PHASE_ORDER.map(ph => {
      const arr = (byTabPhase[tabKey]?.[ph] || []).filter(Boolean);
      return renderPhaseSection(ph, arr);
    });
    return <>{sections}</>;
  };

  // -------- Player summary tab renderer --------
  const renderPlayerTabBody = (tabKey) => {
    if (!playerSummary) return null;

    const batting = playerSummary.batting || {};
    const bowling = playerSummary.bowling || {};
    const fielding = playerSummary.fielding || {};

    if (tabKey === "Batting") {
      if (!batting.has_data) return <div>Did not bat.</div>;
      return (
        <>
          <div className="d-flex justify-content-between mb-2">
            <div>
              <strong>Runs (Balls)</strong><br />
              {formatSummaryVal(batting.runs)} ({formatSummaryVal(batting.balls)})
            </div>
            <div>
              <strong>Strike Rate</strong><br />
              {formatSummaryVal(batting.strike_rate)}
            </div>
            <div>
              <strong>4s / 6s</strong><br />
              {formatSummaryVal(batting.fours)} / {formatSummaryVal(batting.sixes)}
            </div>
            <div>
              <strong>Position</strong><br />
              {formatSummaryVal(batting.batting_position)}
            </div>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <div>
              <strong>Boundary %</strong><br />
              {formatSummaryVal(batting.boundary_percentage, "%")}
            </div>
            <div>
              <strong>Dot %</strong><br />
              {formatSummaryVal(batting.dot_ball_percentage, "%")}
            </div>
            <div>
              <strong>Intent Score</strong><br />
              {formatSummaryVal(batting.batting_intent_score)}
            </div>
            <div>
              <strong>BPI</strong><br />
              {formatSummaryVal(batting.batting_bpi)}
            </div>
          </div>

          <div className="mb-2">
            <strong>Phase Runs</strong><br />
            PP: {formatSummaryVal(batting.phase_breakdown?.powerplay_runs)} ·{" "}
            MO: {formatSummaryVal(batting.phase_breakdown?.middle_overs_runs)} ·{" "}
            DO: {formatSummaryVal(batting.phase_breakdown?.death_overs_runs)}
          </div>

          <div className="mb-0">
            <strong>Dismissal</strong><br />
            {batting.dismissal || "Not out"}
          </div>
        </>
      );
    }

    if (tabKey === "Bowling") {
      if (!bowling.has_data) return <div>Did not bowl.</div>;
      return (
        <>
          <div className="d-flex justify-content-between mb-2">
            <div>
              <strong>Figures</strong><br />
              {formatSummaryVal(bowling.overs)}–
              {formatSummaryVal(bowling.maidens)}–
              {formatSummaryVal(bowling.runs_conceded)}–
              {formatSummaryVal(bowling.wickets)}
            </div>
            <div>
              <strong>Economy</strong><br />
              {formatSummaryVal(bowling.economy)}
            </div>
            <div>
              <strong>Dot %</strong><br />
              {formatSummaryVal(bowling.dot_ball_percentage, "%")}
            </div>
            <div>
              <strong>Intent Conceded</strong><br />
              {formatSummaryVal(bowling.bowling_intent_conceded)}
            </div>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <div>
              <strong>Boundary Balls</strong><br />
              {formatSummaryVal(bowling.boundary_balls)}
            </div>
            <div>
              <strong>Wides</strong><br />
              {formatSummaryVal(bowling.wides)}
            </div>
            <div>
              <strong>No Balls</strong><br />
              {formatSummaryVal(bowling.no_balls)}
            </div>
            <div>
              <strong>BPI</strong><br />
              {formatSummaryVal(bowling.bowling_bpi)}
            </div>
          </div>

          <div className="mb-0">
            <strong>Phase Overview</strong><br />
            PP: {formatSummaryVal(bowling.phase_breakdown?.powerplay_overs)} ov @{" "}
            {formatSummaryVal(bowling.phase_breakdown?.powerplay_econ)}<br />
            MO: {formatSummaryVal(bowling.phase_breakdown?.middle_overs_overs)} ov @{" "}
            {formatSummaryVal(bowling.phase_breakdown?.middle_overs_econ)}
          </div>
        </>
      );
    }

    if (tabKey === "Fielding") {
      if (!fielding.has_data) return <div>No fielding data.</div>;
      return (
        <>
          <div className="d-flex justify-content-between mb-2">
            <div>
              <strong>Balls Fielded</strong><br />
              {formatSummaryVal(fielding.balls_fielded)}
            </div>
            <div>
              <strong>Clean Hands %</strong><br />
              {formatSummaryVal(fielding.clean_hands_pct, "%")}
            </div>
            <div>
              <strong>Conversion %</strong><br />
              {formatSummaryVal(fielding.conversion_rate, "%")}
            </div>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <div>
              <strong>Catches</strong><br />
              Taken: {formatSummaryVal(fielding.catches_taken)}<br />
              Drops: {formatSummaryVal(fielding.drops)}
            </div>
            <div>
              <strong>Run Outs</strong><br />
              Direct: {formatSummaryVal(fielding.run_outs_direct)}<br />
              Assist: {formatSummaryVal(fielding.run_outs_assist)}
            </div>
            <div>
              <strong>Ground Fielding</strong><br />
              Clean: {formatSummaryVal(fielding.clean_pickups)}<br />
              Fumbles: {formatSummaryVal(fielding.fumbles)}
            </div>
          </div>

          <div className="d-flex justify-content-between">
            <div>
              <strong>WK Catches</strong><br />
              {formatSummaryVal(fielding.wk_catches)}
            </div>
            <div>
              <strong>WK Stumpings</strong><br />
              {formatSummaryVal(fielding.wk_stumpings)}
            </div>
            <div>
              <strong>Overthrows Conceded</strong><br />
              {formatSummaryVal(fielding.overthrows_conceded)}
            </div>
          </div>
        </>
      );
    }

    return null;
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
                  onChange={e => setCategory(e.target.value)}
                  disabled={loadingMatches}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={8}>
                <Form.Label className="fw-bold">Match (Brasil only)</Form.Label>
                <Form.Select
                  value={selectedMatchId}
                  onChange={e => setSelectedMatchId(e.target.value)}
                  disabled={loadingMatches || !matches.length}
                >
                  {matches.length === 0 ? (
                    <option value="">No Brasil matches found</option>
                  ) : (
                    matches.map(m => (
                      <option key={m.match_id} value={m.match_id}>{matchLabel(m)}</option>
                    ))
                  )}
                </Form.Select>
              </Col>

              <Col md={1} className="text-end">
                {loadingMatches && <Spinner animation="border" size="sm" />}
              </Col>
            </Row>
            {error && <Alert className="mt-3" variant="danger">{error}</Alert>}
          </Card.Body>
        </Card>

        {/* Cards grid (start with KPIs + Player Summary) */}
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
                  Quick snapshot of an individual player&apos;s batting, bowling and fielding for this match.
                </Card.Text>
                <Button disabled={!selectedMatchId || loadingMatches} onClick={openPlayerModal}>
                  Open
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Future: add more Post-Game cards here */}
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
          {kpisError && <Alert variant="danger" className="mb-2">{kpisError}</Alert>}

          {/* Global summary + failed-only */}
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
              onChange={e => setShowFailedOnly(e.target.checked)}
            />
          </div>

          {/* Tabs */}
          <Tabs id="kpi-tabs" activeKey={activeTab} onSelect={(key) => setActiveTab(key || "Batting")} className="mb-3" justify>
            {TAB_KEYS.map(tabKey => (
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
          <Button variant="secondary" onClick={closeKpiModal}>Close</Button>
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
          <Modal.Title>
            Individual Player Summary
            {playerSummary?.player_name ? ` — ${playerSummary.player_name}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {playerError && <Alert variant="danger" className="mb-2">{playerError}</Alert>}

          {/* Team & Player selectors */}
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label className="fw-bold">Team</Form.Label>
              <Form.Select
                value={selectedPlayerTeamId}
                onChange={e => setSelectedPlayerTeamId(e.target.value)}
                disabled={playerLoading || !playerTeams.length}
              >
                <option value="">Select team...</option>
                {playerTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label className="fw-bold">Player</Form.Label>
              <Form.Select
                value={selectedPlayerId}
                onChange={e => setSelectedPlayerId(e.target.value)}
                disabled={playerLoading || !selectedPlayerTeamId || !teamPlayers.length}
              >
                <option value="">Select player...</option>
                {teamPlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {playerLoading && (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          )}

          {!playerLoading && selectedPlayerTeamId && selectedPlayerId && !playerSummary && (
            <div>No data found for this player.</div>
          )}

          {!playerLoading && playerSummary && (
            <>
              <Tabs
                id="player-summary-tabs"
                activeKey={playerActiveTab}
                onSelect={key => setPlayerActiveTab(key || "Batting")}
                className="mb-3"
                justify
              >
                {TAB_KEYS.map(tabKey => (
                  <Tab key={tabKey} eventKey={tabKey} title={tabKey}>
                    <Card className={cardVariantClass}>
                      <Card.Body>
                        {renderPlayerTabBody(tabKey)}
                      </Card.Body>
                    </Card>
                  </Tab>
                ))}
              </Tabs>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closePlayerModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
