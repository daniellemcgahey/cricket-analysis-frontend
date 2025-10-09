import React, { useContext, useMemo, useRef, useState } from "react";
import { Row, Col, Card, Button, Modal, Form, Spinner } from "react-bootstrap";
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";

export default function Training() {
  const { isDarkMode } = useContext(DarkModeContext);
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const cardVariant = isDarkMode ? "dark" : "light";

  const [showField, setShowField] = useState(false);

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />

        <Row className="g-4">
          <Col md={4}>
            <Card
              bg={cardVariant}
              text={isDarkMode ? "light" : "dark"}
              className="h-100 shadow"
            >
              <Card.Body>
                <Card.Title className="fw-bold">Interactive Field</Card.Title>
                <Card.Text className="mb-3">
                  Drag & drop players to set a field. Men/Women, PP/Middle/Death, soft rule checks, and PDF export.
                </Card.Text>
                <Button onClick={() => setShowField(true)}>Open</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Fullscreen self-contained Interactive Field (no routing) */}
      <InteractiveFieldModal
        show={showField}
        onHide={() => setShowField(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

/* -------------------------------------------------------------
   Interactive Field — Fullscreen Modal (self-contained)
------------------------------------------------------------- */

function InteractiveFieldModal({ show, onHide, isDarkMode }) {
  // Canvas geometry
  const CANVAS_SIZE = 720;
  const CENTER = CANVAS_SIZE / 2;
  const BOUNDARY_R = 320;
  const INNER_RING_R = 190;

  // UI state
  const [gender, setGender] = useState("Women");     // "Men" | "Women"
  const [phase, setPhase] = useState("Powerplay");   // "Powerplay" | "Middle" | "Death"
  const [hand, setHand] = useState("RHB");           // "RHB" | "LHB"
  const [bowlerName, setBowlerName] = useState("");

  // Fielders (WK/Bowler pre-placed + 9 fielder chips)
  const START_WK = { id: "wk", label: "WK", x: 0, y: -20, placed: true, role: "WK" };
  const START_B = { id: "bowler", label: "Bowler", x: 0, y: BOUNDARY_R - 20, placed: true, role: "Bowler" };
  const DEFAULT_FIELDERS = Array.from({ length: 9 }).map((_, i) => ({
    id: `f${i + 1}`, label: `F${i + 1}`, x: 0, y: 0, placed: false, role: "Fielder"
  }));

  const [fielders, setFielders] = useState([START_WK, START_B, ...DEFAULT_FIELDERS]);
  const [dragId, setDragId] = useState(null);

  const stageRef = useRef(null);
  const exportRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Helpers
  const clampToCircle = (x, y, r) => {
    const d = Math.hypot(x, y);
    if (d <= r) return { x, y };
    const s = r / d;
    return { x: x * s, y: y * s };
  };
  const isOutsideInner = (x, y) => Math.hypot(x, y) > INNER_RING_R + 0.0001;
  const isOnOffSide = (x, hand_) => (hand_ === "RHB" ? x < 0 : x > 0);
  const isLegSide   = (x, hand_) => !isOnOffSide(x, hand_);
  const isBehindSquare = (y) => y < 0;

  // Drag
  const onPointerDown = (e, id) => {
    setDragId(id);
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragId || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left - CENTER;
    const py = e.clientY - rect.top - CENTER;
    const { x, y } = clampToCircle(px, py, BOUNDARY_R);
    setFielders(prev => prev.map(f => (f.id === dragId ? { ...f, x, y, placed: true } : f)));
  };
  const onPointerUp = () => setDragId(null);

  // Computed counts (excludes WK & Bowler)
  const placedFielders = useMemo(() => fielders.filter(f => f.placed), [fielders]);
  const countingFielders = useMemo(
    () => placedFielders.filter(f => f.role !== "Bowler" && f.role !== "WK"),
    [placedFielders]
  );
  const outsideInnerCount = useMemo(
    () => countingFielders.reduce((acc, f) => acc + (isOutsideInner(f.x, f.y) ? 1 : 0), 0),
    [countingFielders]
  );
  const offSideCount = useMemo(
    () => countingFielders.reduce((acc, f) => acc + (isOnOffSide(f.x, hand) ? 1 : 0), 0),
    [countingFielders, hand]
  );
  const legBehindSquareCount = useMemo(
    () => countingFielders.reduce((acc, f) => acc + (isLegSide(f.x, hand) && isBehindSquare(f.y) ? 1 : 0), 0),
    [countingFielders, hand]
  );

  // Limits (soft)
  const outsideMax = phase === "Powerplay" ? 2 : gender === "Men" ? 5 : 4;
  const warnings = useMemo(() => ([
    { id: "outside", ok: outsideInnerCount <= outsideMax, label: `Outside inner ring: ${outsideInnerCount}/${outsideMax}` },
    { id: "off-min", ok: offSideCount >= 4, label: `Min 4 on off side: ${offSideCount}/4` },
    { id: "leg-behind", ok: legBehindSquareCount <= 2, label: `Max 2 behind square (leg): ${legBehindSquareCount}/2` }
  ]), [outsideInnerCount, outsideMax, offSideCount, legBehindSquareCount]);

  // Save to PDF (lazy import to avoid crashes)
  const savePDF = async () => {
    if (!exportRef.current) return;
    setSaving(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);

      const node = exportRef.current;
      const prevBg = node.style.background;
      node.style.background = isDarkMode ? "#111" : "#fff";

      const canvas = await html2canvas(node, { scale: 2, useCORS: true });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const margin = 36;
      const targetW = pageW - margin * 2;
      const scale = targetW / canvas.width;
      const imgH = canvas.height * scale;

      pdf.setFontSize(14);
      pdf.text(`Interactive Field – ${gender} – ${phase}`, margin, 40);
      pdf.text(`Bowler: ${bowlerName || "(unspecified)"}`, margin, 60);
      pdf.setFontSize(11);
      pdf.text(
        `Snapshot: outside=${outsideInnerCount}/${outsideMax}, off-side=${offSideCount}, leg-behind=${legBehindSquareCount}`,
        margin,
        78
      );
      pdf.addImage(img, "PNG", margin, 96, targetW, imgH);
      pdf.save(`Field_${bowlerName || "bowler"}_${gender}_${phase}.pdf`);

      node.style.background = prevBg;
    } catch (e) {
      console.error(e);
      alert("Could not generate PDF (html2canvas/jspdf missing or failed).");
    } finally {
      setSaving(false);
    }
  };

  const cardClass = isDarkMode ? "bg-secondary text-white border-0" : "bg-white text-dark border";

  // Button variants that are always visible (selected vs unselected)
  const selectedVariant = isDarkMode ? "light" : "dark";
  const unselectedVariant = isDarkMode ? "outline-light" : "outline-dark";

  // Watermark positions — flip for hand
  const offX = hand === "RHB" ? CENTER - 120 : CENTER + 120; // OFF = left for RHB
  const legX = hand === "RHB" ? CENTER + 120 : CENTER - 120; // LEG = right for RHB

  return (
    <Modal show={show} onHide={onHide} fullscreen centered contentClassName={isDarkMode ? "bg-dark text-white" : ""}>
      <Modal.Header closeButton>
        <Modal.Title>Interactive Field</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pb-0">
        {/* Controls */}
        <div className={`p-3 rounded mb-3 ${cardClass}`}>
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Gender */}
            <div className="btn-group" role="group" aria-label="Gender">
              {["Women", "Men"].map(g => (
                <Button
                  key={g}
                  variant={gender === g ? selectedVariant : unselectedVariant}
                  onClick={() => setGender(g)}
                >
                  {g}
                </Button>
              ))}
            </div>

            {/* Phase */}
            <div className="btn-group ms-2" role="group" aria-label="Phase">
              {["Powerplay", "Middle", "Death"].map(p => (
                <Button
                  key={p}
                  variant={phase === p ? selectedVariant : unselectedVariant}
                  onClick={() => setPhase(p)}
                >
                  {p}
                </Button>
              ))}
            </div>

            {/* Batter hand */}
            <div className="btn-group ms-2" role="group" aria-label="Hand">
              {["RHB", "LHB"].map(h => (
                <Button
                  key={h}
                  variant={hand === h ? selectedVariant : unselectedVariant}
                  onClick={() => setHand(h)}
                  title="Affects off/leg side"
                >
                  {h}
                </Button>
              ))}
            </div>

            {/* Bowler */}
            <Form.Control
              className={`ms-2 ${isDarkMode ? "bg-dark text-white border-light" : ""}`}
              style={{ maxWidth: 240 }}
              placeholder="Bowler name"
              value={bowlerName}
              onChange={(e) => setBowlerName(e.target.value)}
            />

            {/* Actions */}
            <Button variant={selectedVariant} className="ms-2" onClick={savePDF} disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : "Save PDF"}
            </Button>
          </div>
        </div>

        {/* Board + Side panel */}
        <div className="row g-3">
          {/* Board */}
          <div className="col-lg-8">
            <div ref={exportRef} className={`rounded p-3 ${cardClass}`}>
              <div
                ref={stageRef}
                className="position-relative mx-auto"
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                {/* Ground */}
                <svg width={CANVAS_SIZE} height={CANVAS_SIZE} className="d-block">
                  <circle cx={CENTER} cy={CENTER} r={BOUNDARY_R + 18} fill={isDarkMode ? "#0e1a12" : "#dff3e3"} stroke="#6c757d" />
                  <circle cx={CENTER} cy={CENTER} r={BOUNDARY_R} fill="none" stroke={isDarkMode ? "#f8f9fa" : "#212529"} strokeWidth="2" />
                  <circle cx={CENTER} cy={CENTER} r={INNER_RING_R} fill="none" stroke={isDarkMode ? "#ced4da" : "#495057"} strokeDasharray="6 6" />
                  <rect x={CENTER - 10} y={CENTER - 35} width="20" height="70" fill={isDarkMode ? "#e9ecef" : "#f8f9fa"} stroke="#6c757d" />

                  {/* Watermarks: OFF SIDE / LEG SIDE (auto-flip with hand) */}
                  <text
                    x={offX}
                    y={CENTER}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      opacity: 0.10,
                      fill: isDarkMode ? "#ffffff" : "#000000",
                      pointerEvents: "none"
                    }}
                    transform={`rotate(-90 ${offX} ${CENTER})`}
                  >
                    OFF SIDE
                  </text>

                  <text
                    x={legX}
                    y={CENTER}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      opacity: 0.08,
                      fill: isDarkMode ? "#ffffff" : "#000000",
                      pointerEvents: "none"
                    }}
                    transform={`rotate(90 ${legX} ${CENTER})`}
                  >
                    LEG SIDE
                  </text>
                </svg>

                {/* Chips */}
                {fielders.map(f => {
                  const left = CENTER + f.x - 16;
                  const top = CENTER + f.y - 16;
                  const placed = f.placed;
                  const chipClass =
                    f.role === "WK"
                      ? "bg-warning text-dark border-warning"
                      : f.role === "Bowler"
                      ? "bg-info text-dark border-info"
                      : placed
                      ? (isDarkMode ? "bg-dark text-white border-light" : "bg-white text-dark border-dark")
                      : (isDarkMode ? "bg-secondary text-white border-0 opacity-75" : "bg-light text-dark border opacity-75");

                  return (
                    <div key={f.id} className="position-absolute user-select-none" style={{ left, top }}>
                      <button
                        onPointerDown={(e) => onPointerDown(e, f.id)}
                        className="d-flex align-items-center justify-content-center rounded-circle border fw-bold"
                        style={{ width: 32, height: 32, fontSize: 11 }}
                        title={f.role || "Fielder"}
                      >
                        <span
                          className={`badge ${chipClass}`}
                          style={{
                            width: 32, height: 32, lineHeight: "20px", display: "inline-flex",
                            alignItems: "center", justifyContent: "center", borderRadius: "50%"
                          }}
                        >
                          {f.label}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="col-lg-4">
            <div className={`p-3 rounded mb-3 ${cardClass}`}>
              <h6 className="mb-3">Drag fielders onto the ground</h6>
              <div className="d-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
                {fielders.filter(f => f.role === "Fielder").map(f => (
                  <Button
                    key={f.id}
                    onPointerDown={(e) => onPointerDown(e, f.id)}
                    variant={f.placed ? (isDarkMode ? "outline-light" : "outline-dark") : (isDarkMode ? "secondary" : "light")}
                    size="sm"
                    className="fw-semibold"
                    title="Drag to place"
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <small className="text-muted d-block mt-2">
                WK and Bowler are pre-placed. All chips are draggable; placement is never blocked.
              </small>
            </div>

            <div className={`p-3 rounded ${cardClass}`}>
              <h6 className="mb-3">Soft Rule Checks</h6>
              <ul className="list-unstyled mb-0">
                {warnings.map(w => (
                  <li key={w.id} className="d-flex align-items-start mb-2">
                    <span className={`badge me-2 ${w.ok ? "bg-success" : "bg-danger"}`} style={{ width: 22 }}>
                      {w.ok ? "✓" : "!"}
                    </span>
                    <span>{w.label}</span>
                  </li>
                ))}
              </ul>
              <small className="text-muted d-block mt-2">
                Informational only — does not block placement.
              </small>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
