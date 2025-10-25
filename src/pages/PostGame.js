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
    if (v === null || v === undefined || v === "") return "—";
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

      // Accept either {kpis:[...]} or [...]
      const arr = Array.isArray(res.data?.kpis) ? res.data.kpis
                : Array.isArray(res.data) ? res.data
                : [];

      // (Optional) If backend hasn't returned the KPI yet, you can hardcode a placeholder here while testing:
      // arr.push({
      //   key: "bat_pp_scoring_shot_pct",
      //   label: "Scoring Shot % (Batting • Powerplay)",
      //   unit: "%", bucket: "Batting", phase: "Powerplay",
      //   operator: ">=", target: 45, actual: 48.7, notes: "Includes byes/leg-byes as scoring shots"
      // });

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
    return kpisData.map(k => {
      const ok = typeof k.ok === "boolean" ? k.ok : cmp(k.actual, k.operator || ">=", k.target);
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
      Fielding: ["Match"],
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
      const all = PHASE_ORDER.flatMap(ph => byTabPhase[tabKey][ph]);
      const valid = all.filter(k => typeof k.ok === "boolean");
      const met = valid.filter(k => k.ok).length;
      out[tabKey] = { total: valid.length, met, pct: valid.length ? Math.round((met / valid.length) * 100) : 0 };
    });
    return out;
  }, [byTabPhase]);

  // -------- UI helpers --------
  const matchLabel = (m) => {
    const when = m.match_date ? new Date(m.match_date).toLocaleDateString() : "";
    const tour = m.tournament ? ` • ${m.tournament}` : "";
    return `${m.team_a} vs ${m.team_b}${tour}${when ? " — " + when : ""}`;
  };

const renderPhaseSection = (phaseLabel, itemsRaw) => {
  const items = Array.isArray(itemsRaw) ? itemsRaw.filter(Boolean) : [];

  return (
    <Row className="g-3" key={phaseLabel}>
      <Col md={12}>
        <Card bg={cardVariant} text={isDarkMode ? "light" : "dark"} className="shadow-sm">
          <Card.Header className="fw-bold">{phaseLabel}</Card.Header>
          <Card.Body>
            {items.length === 0 ? (
              <div className="text-muted">No KPIs.</div>
            ) : (
              <Table size="sm" bordered responsive>
                <thead>
                  <tr>
                    <th>KPI</th>
                    <th className="text-center" style={{ width: 120 }}>Target</th>
                    <th className="text-center" style={{ width: 120 }}>Result</th>
                    <th className="text-center" style={{ width: 80 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((k) => (
                    <tr key={k.key}>
                      <td>
                        <div className="fw-semibold">{k.label || k.key}</div>
                        {k.bucket === "Fielding" ? null : (k.phase && <div className="small text-muted">{k.phase}</div>)}
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
      </Col>
    </Row>
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

  // Fielding: single match-wide section
  if (tabKey === "Fielding") {
    const allFielding = PHASE_ORDER
      .flatMap(ph => (byTabPhase.Fielding?.[ph] || []))
      .filter(Boolean); // drop undefined/null items

    return <>{renderPhaseSection("Match", allFielding)}</>;
  }

  // Batting / Bowling: phased sections
  const sections = PHASE_ORDER.map(ph => {
    const arr = (byTabPhase[tabKey]?.[ph] || []).filter(Boolean);
    return renderPhaseSection(ph, arr);
  });
  return <>{sections}</>;
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

        {/* Cards grid (start with KPIs) */}
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
          <Tabs id="kpi-tabs" activeKey={activeTab} onSelect={(key) => setActiveTab(key)} className="mb-3" justify>
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
    </div>
  );

}
