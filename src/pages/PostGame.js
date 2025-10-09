import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Row, Col, Card, Form, Button, Spinner, Alert, Badge, Modal, Table, ProgressBar
} from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";
import api from "../api";

/** ====== Endpoint names (tweak here if needed) ====== */
const EP_MATCHES = "/matches";           // GET params: { teamCategory }
const EP_MATCH_KPIS = "/match-kpis";     // GET params: { match_id, team_category }

const CATEGORIES = ["Men", "Women", "U19 Men", "U19 Women", "Training"];

/**
 * Expected KPI item shape (server response):
 * {
 *   key: "pp_dot_pct",
 *   label: "Powerplay Dot %",
 *   unit: "%",
 *   target: 55,                   // numeric or string if categorical
 *   operator: ">=",               // ">= | > | == | <= | < | !="
 *   actual: 52.1,                 // numeric or string
 *   phase: "Powerplay",           // optional grouping
 *   bucket: "Batting",            // (Batting/Bowling/Fielding/Discipline/etc.)
 *   notes: "Stretch goal for this venue" // optional
 * }
 */

export default function PostGame() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const cardVariant = isDarkMode ? "dark" : "light";

  // -------- Core selectors --------
  const [category, setCategory] = useState("Men");
  const [matches, setMatches] = useState([]);          // [{id, home, away, date, venue, ...}]
  const [selectedMatchId, setSelectedMatchId] = useState("");

  // Loading & errors
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState("");

  // -------- KPI Modal --------
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpisError, setKpisError] = useState("");
  const [kpisData, setKpisData] = useState([]);        // array of KPIs
  const [showFailedOnly, setShowFailedOnly] = useState(false);

  // -------- Load matches for the category (Brasil only) --------
  useEffect(() => {
    let mounted = true;
    setError("");
    setLoadingMatches(true);
    setMatches([]);
    setSelectedMatchId("");

    api.get(EP_MATCHES, { params: { teamCategory: category } })
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        // Keep only matches where Brasil is involved (case-insensitive, handles Bra/BraZil)
        const brasilRegex = /bra[sz]il/i;
        const filtered = list.filter(m =>
          brasilRegex.test(`${m.home || m.team_a || ""}`) ||
          brasilRegex.test(`${m.away || m.team_b || ""}`)
        );

        // Sort by most recent first if we have a date
        filtered.sort((a, b) => {
          const da = new Date(a.date || a.start_time || 0).getTime();
          const db = new Date(b.date || b.start_time || 0).getTime();
          return db - da;
        });

        setMatches(filtered);
        setSelectedMatchId(filtered[0]?.id || "");
      })
      .catch(() => setError("Could not load matches"))
      .finally(() => setLoadingMatches(false));

    return () => { mounted = false; };
  }, [category]);

  // -------- Helpers: KPI evaluation & formatting --------
  const coerceNum = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));
  const cmp = (actual, operator, target) => {
    // numeric if both parse; otherwise string compare for ==/!=
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
        default:   return a >= t; // sensible default
      }
    } else {
      // fallback to string compare for categorical targets
      switch (operator) {
        case "==": return String(actual) === String(target);
        case "!=": return String(actual) !== String(target);
        default:   return String(actual) === String(target);
      }
    }
  };

  const formatVal = (v, unit) => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "number" && unit === "%") return `${(v).toFixed(1)}%`;
    if (typeof v === "number") return String(v);
    // string
    return unit ? `${v} ${unit}` : String(v);
  };

  // -------- KPI modal handlers --------
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
      const res = await api.get(EP_MATCH_KPIS, {
        params: { match_id: selectedMatchId, team_category: category }
      });
      const arr = Array.isArray(res.data?.kpis) ? res.data.kpis : Array.isArray(res.data) ? res.data : [];
      setKpisData(arr);
    } catch (e) {
      console.error(e);
      setKpisError("Failed to load KPIs for this match.");
    } finally {
      setKpisLoading(false);
    }
  };

  const closeKpiModal = () => setShowKpiModal(false);

  // -------- Derived summary --------
  const withPassFail = useMemo(() => {
    return kpisData.map(k => {
      const ok = cmp(k.actual, k.operator || ">=", k.target);
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
    const home = m.home || m.team_a || "—";
    const away = m.away || m.team_b || "—";
    const when = m.date || m.start_time || "";
    const venue = m.venue ? ` • ${m.venue}` : "";
    return `${home} vs ${away}${venue} ${when ? " — " + new Date(when).toLocaleDateString() : ""}`;
  };

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />

        {/* Filters card */}
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
                      <option key={m.id} value={m.id}>{matchLabel(m)}</option>
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
                  View targets vs outcomes for this match. Filter to failed KPIs in the modal.
                </Card.Text>
                <Button disabled={!selectedMatchId || loadingMatches} onClick={openKpiModal}>
                  Open
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* (Future) More post-game cards can go here: Wagon Wheel Review, Bowler Plans vs Reality, Phase Report, Fielding Summary, etc. */}
        </Row>
      </div>

      {/* -------------- KPI Modal -------------- */}
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
              <div style={{ width: 200 }}>
                <ProgressBar now={summary.pct} variant={summary.pct >= 70 ? "success" : summary.pct >= 50 ? "warning" : "danger"} />
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
                          <th style={{ width: 220 }}>Notes</th>
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
