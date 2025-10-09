import React, { useContext, useMemo, useRef, useState } from "react";
import DarkModeContext from "../DarkModeContext";

// Dependencies: npm i html2canvas jspdf
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function InteractiveField() {
  const { isDarkMode } = useContext(DarkModeContext);

  // --- Config ---
  const CANVAS_SIZE = 720;       // px
  const CENTER = CANVAS_SIZE / 2;
  const BOUNDARY_R = 320;        // px
  const INNER_RING_R = 190;      // px

  // --- Types (in JS comments) ---
  // Phase: "Powerplay" | "Middle" | "Death"
  // Gender: "Men" | "Women"
  // Hand: "RHB" | "LHB"

  // --- State ---
  const [gender, setGender] = useState("Women");
  const [phase, setPhase] = useState("Powerplay");
  const [hand, setHand] = useState("RHB");
  const [bowlerName, setBowlerName] = useState("");

  // Pre-placed WK & Bowler + 9 fielders
  const START_WK = { id: "wk", label: "WK", x: 0, y: -20, placed: true, role: "WK" };
  const START_B = { id: "bowler", label: "Bowler", x: 0, y: BOUNDARY_R - 20, placed: true, role: "Bowler" };
  const DEFAULT_FIELDERS = Array.from({ length: 9 }).map((_, i) => ({
    id: `f${i + 1}`, label: `F${i + 1}`, x: 0, y: 0, placed: false, role: "Fielder"
  }));

  const [fielders, setFielders] = useState([START_WK, START_B, ...DEFAULT_FIELDERS]);
  const [dragId, setDragId] = useState(null);

  const stageRef = useRef(null);
  const exportRef = useRef(null);

  // --- Geometry helpers ---
  const clampToCircle = (x, y, r) => {
    const d = Math.hypot(x, y);
    if (d <= r) return { x, y };
    const s = r / d;
    return { x: x * s, y: y * s };
  };
  const isOutsideInner = (x, y) => Math.hypot(x, y) > INNER_RING_R + 0.0001;
  const isOnOffSide = (x, hand_) => (hand_ === "RHB" ? x > 0 : x < 0);
  const isLegSide = (x, hand_) => !isOnOffSide(x, hand_);
  const isBehindSquare = (y) => y < 0;

  // --- Drag/Drop (pointer events) ---
  const onPointerDown = (e, id) => {
    setDragId(id);
    e.target.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragId) return;
    const rect = stageRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left - CENTER;
    const py = e.clientY - rect.top - CENTER;
    const { x, y } = clampToCircle(px, py, BOUNDARY_R);
    setFielders(prev => prev.map(f => (f.id === dragId ? { ...f, x, y, placed: true } : f)));
  };

  const onPointerUp = () => setDragId(null);

  // --- Computed counts (exclude Bowler & WK from counting rules) ---
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

  // --- Limits (soft) ---
  // PP interpreted as: MAX 2 outside the inner ring (standard law).
  const outsideMax = phase === "Powerplay" ? 2 : gender === "Men" ? 5 : 4;

  const warnings = useMemo(() => {
    return [
      {
        id: "outside",
        ok: outsideInnerCount <= outsideMax,
        label: `Fielders outside inner ring: ${outsideInnerCount}/${outsideMax} allowed`
      },
      {
        id: "off-min",
        ok: offSideCount >= 4,
        label: `Minimum 4 on off side: ${offSideCount}/4`
      },
      {
        id: "leg-behind",
        ok: legBehindSquareCount <= 2,
        label: `Maximum 2 behind square on leg side: ${legBehindSquareCount}/2`
      }
    ];
  }, [outsideInnerCount, outsideMax, offSideCount, legBehindSquareCount]);

  // --- Save to PDF ---
  const savePDF = async () => {
    if (!exportRef.current) return;
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
  };

  // --- Export/Import JSON (optional presets) ---
  const exportJSON = () => {
    const payload = {
      gender, phase, hand, bowlerName,
      fielders: fielders.map(({ id, label, x, y, placed, role }) => ({ id, label, x, y, placed, role })),
      ts: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `field_${bowlerName || "bowler"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.gender) setGender(data.gender);
        if (data.phase) setPhase(data.phase);
        if (data.hand) setHand(data.hand);
        if (typeof data.bowlerName === "string") setBowlerName(data.bowlerName);
        if (Array.isArray(data.fielders)) {
          setFielders(prev =>
            prev.map(f => {
              const found = data.fielders.find(d => d.id === f.id);
              return found
                ? { ...f, x: found.x ?? f.x, y: found.y ?? f.y, placed: !!found.placed }
                : f;
            })
          );
        }
      } catch (e) {
        console.error("Invalid field JSON", e);
      }
    };
    reader.readAsText(file);
  };

  // --- Classes ---
  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const cardClass = isDarkMode ? "bg-secondary text-white border-0" : "bg-white text-dark border";
  const btnOutline = isDarkMode ? "btn-outline-light" : "btn-outline-dark";
  const btnSolid = isDarkMode ? "btn-light text-dark" : "btn-dark";

  // --- Render ---
  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <div className={`p-3 rounded mb-3 ${cardClass}`}>
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Gender */}
            <div className="btn-group" role="group" aria-label="Gender">
              {["Women", "Men"].map(g => (
                <button
                  key={g}
                  className={`btn ${gender === g ? btnSolid : btnOutline}`}
                  onClick={() => setGender(g)}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Phase */}
            <div className="btn-group ms-2" role="group" aria-label="Phase">
              {["Powerplay", "Middle", "Death"].map(p => (
                <button
                  key={p}
                  className={`btn ${phase === p ? btnSolid : btnOutline}`}
                  onClick={() => setPhase(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Batter Hand */}
            <div className="btn-group ms-2" role="group" aria-label="Hand">
              {["RHB", "LHB"].map(h => (
                <button
                  key={h}
                  className={`btn ${hand === h ? btnSolid : btnOutline}`}
                  onClick={() => setHand(h)}
                  title="Batter handedness (affects off/leg definition)"
                >
                  {h}
                </button>
              ))}
            </div>

            {/* Bowler name */}
            <input
              className={`form-control ms-2 ${isDarkMode ? "bg-dark text-white border-light" : ""}`}
              style={{ maxWidth: 220 }}
              placeholder="Bowler name"
              value={bowlerName}
              onChange={(e) => setBowlerName(e.target.value)}
            />

            {/* Actions */}
            <button className={`btn ms-2 ${btnOutline}`} onClick={exportJSON}>Export JSON</button>
            <label className={`btn ms-2 ${btnOutline} mb-0`}>
              Import JSON
              <input
                type="file"
                accept="application/json"
                className="d-none"
                onChange={(e) => e.target.files && importJSON(e.target.files[0])}
              />
            </label>
            <button className={`btn ms-2 ${btnSolid}`} onClick={savePDF}>Save PDF</button>
          </div>
        </div>

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
                {/* SVG ground */}
                <svg width={CANVAS_SIZE} height={CANVAS_SIZE} className="d-block">
                  {/* boundary backdrop */}
                  <circle cx={CENTER} cy={CENTER} r={BOUNDARY_R + 18}
                          fill={isDarkMode ? "#0e1a12" : "#dff3e3"} stroke="#6c757d" />
                  {/* boundary */}
                  <circle cx={CENTER} cy={CENTER} r={BOUNDARY_R} fill="none"
                          stroke={isDarkMode ? "#f8f9fa" : "#212529"} strokeWidth="2" />
                  {/* inner ring */}
                  <circle cx={CENTER} cy={CENTER} r={INNER_RING_R} fill="none"
                          stroke={isDarkMode ? "#ced4da" : "#495057"} strokeDasharray="6 6" />
                  {/* pitch */}
                  <rect x={CENTER - 10} y={CENTER - 35} width="20" height="70"
                        fill={isDarkMode ? "#e9ecef" : "#f8f9fa"} stroke="#6c757d" />
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
                    <div
                      key={f.id}
                      className="position-absolute user-select-none"
                      style={{ left, top }}
                    >
                      <button
                        onPointerDown={(e) => onPointerDown(e, f.id)}
                        className={`d-flex align-items-center justify-content-center rounded-circle border fw-bold`}
                        style={{ width: 32, height: 32, fontSize: 11 }}
                        title={f.role || "Fielder"}
                      >
                        <span className={`badge ${chipClass}`} style={{
                          width: 32, height: 32, lineHeight: "20px", display: "inline-flex",
                          alignItems: "center", justifyContent: "center", borderRadius: "50%"
                        }}>
                          {f.label}
                        </span>
                      </button>
                    </div>
                  );
                })}

                {/* Transparent overlay to reliably capture pointer up/move */}
                <div className="position-absolute top-0 start-0 w-100 h-100"
                     onPointerMove={onPointerMove}
                     onPointerUp={onPointerUp}
                     style={{ pointerEvents: "none" }} />
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="col-lg-4">
            {/* Fielder palette */}
            <div className={`p-3 rounded mb-3 ${cardClass}`}>
              <h6 className="mb-3">Drag fielders onto the ground</h6>
              <div className="d-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
                {fielders.filter(f => f.role === "Fielder").map(f => (
                  <button
                    key={f.id}
                    onPointerDown={(e) => onPointerDown(e, f.id)}
                    className={`btn btn-sm ${f.placed ? btnOutline : (isDarkMode ? "btn-secondary" : "btn-light")} fw-semibold`}
                    title="Drag to place"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <small className="text-muted d-block mt-2">
                WK and Bowler are pre-placed. All chips are draggable; placement is never blocked.
              </small>
            </div>

            {/* Rule checks (soft warnings) */}
            <div className={`p-3 rounded ${cardClass}`}>
              <h6 className="mb-3">Soft Rule Checks</h6>
              <ul className="list-unstyled mb-0">
                {warnings.map(w => (
                  <li key={w.id} className="d-flex align-items-start mb-2">
                    <span
                      className={`badge me-2 ${w.ok ? "bg-success" : "bg-danger"}`}
                      style={{ width: 22 }}
                      title={w.ok ? "OK" : "Check"}
                    >
                      {w.ok ? "✓" : "!"}
                    </span>
                    <span>{w.label}</span>
                  </li>
                ))}
              </ul>
              <small className="text-muted d-block mt-2">
                These are informational only — they do not prevent placement.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
