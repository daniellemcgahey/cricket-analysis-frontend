import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Row, Col, Card, Form, Button, Spinner, Alert, Badge, Modal, Table, ProgressBar
} from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import api from "../api";

/** ===================== Config ===================== */

// Your backend endpoint for matches
const EP_MATCHES_BY_CATEGORY = "/matches"; // GET ?teamCategory=Men|Women|U19 Men|U19 Women|Training

// Category → KPI endpoint (lets Men/Women/U19 have distinct KPI sets/targets)
const KPI_ENDPOINT_BY_CATEGORY = {
  "Men":        "/postgame/men/match-kpis",
  "Women":      "/postgame/women/match-kpis",
  "U19 Men":    "/postgame/u19-men/match-kpis",
  "U19 Women":  "/postgame/u19-women/match-kpis",
  "Training":   "/postgame/training/match-kpis",
};

const CATEGORIES = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

/** ===================== Helpers (category-safe filtering) ===================== */

const isBrasil = (name) => /bra[sz]il/i.test(name || "");

// Extract tokens from the team name to classify the category correctly.
// e.g., "Brazil U19 Women" -> { u19: true, women: true, men: false }
const parseCategoryTokens = (name) => {
  const s = String(name || "").toLowerCase();
  const u19   = /\bu-?19\b/.test(s) || /\bu19\b/.test(s);
  const women = /\bwomen\b/.test(s);
  const men   = /\bmen\b/.test(s); // the word "men" (not the 'men' inside 'women')
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

// Check a match: (1) Brasil is one of the teams, and (2) the Brasil team name matches the selected category
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

  // -------- Filters --------
  const [category, setCategory] = useState("Men");
  const [matches, setMatches] = useState([]);          // backend shape
  const [selectedMatchId, setSelectedMatchId] = useState("");

  // Loading / errors
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState("");

  // -------- KPI Modal --------
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpisError, setKpisError] = useState("");
  const [kpisData, setKpisData] = useState([]);        // array of KPIs
  const [showFailedOnly, setShowFailedOnly] = useState(false);

  // -------- Fetch matches (category + Brasil + correct tokenization) --------
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

        // Keep only matches that (1) include Brasil and (2) Brasil is in the selected category
        const filtered = list.filter(m => {
          const hasBrasil = isBrasil(m.team_a) || isBrasil(m.team_b);
          return hasBrasil && matchIsBrasilInCategory(m, category);
        });

        // Sort newest first (server already orders, but just in case)
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
        default:   return a >= t; // sane default
      }
    } else {
      // categorical fallback
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

  const buckets = useMemo(() => {
    const map = new Map();
    filteredKPIs.forEach(k => {
      const b = k.bucket || "General";
      if (!map.has(b)) map.set(b, []);
      map.get(b).push(k);
    });
    return Array.from(map.entries()); // [ [bucket, items], ...]
  }, [filteredKPIs]);

  const summary = useMemo(() => {
    const total = withPassFail.length;
    const passed = withPassFail.filter(k => k.ok).length;
    return { total, passed, pct: total ? Math.round((passed / total) * 100) : 0 };
  }, [withPassFail]);

  // -------- UI helpers --------
  const matchLabel = (m) => {
    const when = m.match_date ? new Date(m.match_date).toLocaleDateString() : "";
    const tour = m.tournament ? ` • ${m.tournament}` : "";
    return `${m.team_a} vs ${m.team_b}${tour}${when ? " — " + when : ""}`;
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
                <Card.Title className="fw-bold d-flex align-items-center justify-content-between">
                  <span>Match KPIs</span>
                  {!!withPassFail.length && (
                    <Badge bg={summary.pct >= 70 ? "success" : summary.pct >= 50 ? "warning" : "danger"}>
                      {summary.pct}% met
                    </Badge>
                  )}
                </Card.Title>
                <Card.Text className="mb-3">
                  Targets vs results by bucket and phase, with pass/fail and a quick summary.
                </Card.Text>
                <Button disabled={!selectedMatchId || loadingMatches} onClick={openKpiModal}>
                  Open
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Future: add more Post-Game cards here */}
          {/* <Col md={4}>…</Col> */}
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

          {kpisLoading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : filteredKPIs.length === 0 ? (
            <div className="text-muted">No KPIs found for this match.</div>
          ) : (
            <>
              {buckets.map(([bucket, items]) => (
                <Card key={bucket} className={`mb-3 ${isDarkMode ? "bg-secondary text-white border-0" : ""}`}>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <h6 className="fw-bold mb-2">{bucket}</h6>
                      <Badge bg="secondary">{items.filter(i => i.ok).length}/{items.length} met</Badge>
                    </div>
                    <Table size="sm" bordered responsive className="mb-0">
                      <thead>
                        <tr>
                          <th>KPI</th>
                          <th className="text-center" style={{ width: 120 }}>Target</th>
                          <th className="text-center" style={{ width: 120 }}>Result</th>
                          <th className="text-center" style={{ width: 80 }}>Status</th>
                          <th style={{ width: 240 }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(k => (
                          <tr key={k.key}>
                            <td>
                              <div className="fw-semibold">{k.label || k.key}</div>
                              {k.phase && <div className="small text-muted">{k.phase}</div>}
                            </td>
                            <td className="text-center">{formatVal(k.target, k.unit)}</td>
                            <td className="text-center">{formatVal(k.actual, k.unit)}</td>
                            <td className="text-center">
                              <Badge bg={k.ok ? "success" : "danger"}>{k.ok ? "Met" : "Missed"}</Badge>
                            </td>
                            <td className="small">{k.notes || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              ))}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeKpiModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
