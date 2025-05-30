import React, { useContext, useEffect, useRef , useState, useMemo } from "react";
import DarkModeContext from "../DarkModeContext";

const runToColor = (runs) => {
  if (runs === 0) return "gray";
  if (runs === 1) return "white";
  if (runs === 2) return "yellow";
  if (runs === 3) return "orange";
  if (runs === 4) return "blue";
  if (runs === 5) return "pink";
  if (runs === 6) return "red";
  return "purple";
};

const WagonWheelChart = ({ data, perspective }) => {
  const { isDarkMode } = useContext(DarkModeContext);
  const canvasRef = useRef(null);

  const [activeTypes, setActiveTypes] = useState(["0", "1", "2", "3", "4", "5", "6", "Wicket"]);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
  
    return data.filter((ball) => {
      const type = ball.dismissal_type ? "Wicket" : `${ball.runs}`;
      return activeTypes.includes(type);
    });
  }, [data, activeTypes]);
  


  useEffect(() => {
    console.log("📊 Received wagon wheel data:", data);
    if (!filteredData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set background
    ctx.fillStyle = isDarkMode ? "#121212" : "#f8f9fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(cx, cy) * 1;
    const innerRadius = outerRadius * 0.5;

    // Clear previous drawing
    ctx.clearRect(0, 0, width, height);

    // Outer field
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#2e7d32"; // dark green
    ctx.fill();

    // Inner field
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#66bb6a"; // light green
    ctx.fill();

    // Boundary
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius - 15, 0, 2 * Math.PI);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pitch
    const pitchWidth = 30;
    const pitchLength = 110;
    ctx.fillStyle = "#d2b48c";
    ctx.fillRect(cx - pitchWidth / 2, cy - pitchLength / 2, pitchWidth, pitchLength);

    // Creases
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    const creaseLength = 40;
    const poppingCreaseOffset = 15;
    const returnCreaseOffset = pitchWidth / 2 - 2.5;

    ctx.beginPath();
    ctx.moveTo(cx - creaseLength / 2, cy - pitchLength / 2 + poppingCreaseOffset);
    ctx.lineTo(cx + creaseLength / 2, cy - pitchLength / 2 + poppingCreaseOffset);
    ctx.moveTo(cx - creaseLength / 2, cy + pitchLength / 2 - poppingCreaseOffset);
    ctx.lineTo(cx + creaseLength / 2, cy + pitchLength / 2 - poppingCreaseOffset);
    ctx.stroke();

    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - pitchWidth / 2, cy - pitchLength / 2);
    ctx.lineTo(cx + pitchWidth / 2, cy - pitchLength / 2);
    ctx.moveTo(cx - pitchWidth / 2, cy + pitchLength / 2);
    ctx.lineTo(cx + pitchWidth / 2, cy + pitchLength / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(cx - returnCreaseOffset, cy - pitchLength / 2);
    ctx.lineTo(cx - returnCreaseOffset, cy - pitchLength / 2 + poppingCreaseOffset);
    ctx.moveTo(cx + returnCreaseOffset, cy - pitchLength / 2);
    ctx.lineTo(cx + returnCreaseOffset, cy - pitchLength / 2 + poppingCreaseOffset);
    ctx.moveTo(cx - returnCreaseOffset, cy + pitchLength / 2);
    ctx.lineTo(cx - returnCreaseOffset, cy + pitchLength / 2 - poppingCreaseOffset);
    ctx.moveTo(cx + returnCreaseOffset, cy + pitchLength / 2);
    ctx.lineTo(cx + returnCreaseOffset, cy + pitchLength / 2 - poppingCreaseOffset);
    ctx.stroke();

    // Stumps
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1.5;
    [-2.5, 0, 2.5].forEach(offset => {
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy + pitchLength / 2);
      ctx.lineTo(cx + offset, cy + pitchLength / 2 - 8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + offset, cy - pitchLength / 2 + 3);
      ctx.lineTo(cx + offset, cy - pitchLength / 2 - 8);
      ctx.stroke();
    });

    if (perspective === "Lines") {
      // 🔥 First draw all normal (non-highlighted) lines
      filteredData.forEach(({ x, y, runs, highlight }) => {
        if (highlight) return; // Skip highlighted for now

        const endX = cx + x * outerRadius;
        const endY = cy + y * outerRadius;

        ctx.beginPath();
        ctx.moveTo(cx, cy - 40);
        ctx.lineTo(endX, endY - 40);
        ctx.strokeStyle = runToColor(runs);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 🔥 Then draw only the highlighted ball LAST, so it's on top
      filteredData.forEach(({ x, y, runs, highlight }) => {
        if (!highlight) return; // Skip non-highlighted

        const endX = cx + x * outerRadius;
        const endY = cy + y * outerRadius;

        ctx.beginPath();
        ctx.moveTo(cx, cy - 40);
        ctx.lineTo(endX, endY - 40);
        ctx.strokeStyle = "purple";
        ctx.lineWidth = 3.5;
        ctx.stroke();
      });
      
        // Batter dot
        ctx.beginPath();
        ctx.arc(cx, cy - 40, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy - 40, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "black";
      ctx.fill();
    
      if (perspective === "Zones") {
        const zones = [
          { label: "Mid Wicket", start: 0, end: 45 },
          { label: "Mid On", start: 45, end: 90 },
          { label: "Mid Off", start: 90, end: 135 },
          { label: "Cover", start: 135, end: 180 },
          { label: "Backward Point", start: -180, end: -135 },
          { label: "Third", start: -135, end: -90 },
          { label: "Fine Leg", start: -90, end: -45 },
          { label: "Backward Square", start: -45, end: 0 }
        ];
      
        const zoneColors = {
          "Cover": "aqua",
          "Mid Off": "green",
          "Mid On": "yellow",
          "Fine Leg": "blue",
          "Backward Point": "red",
          "Third": "orange",
          "Mid Wicket": "salmon",
          "Backward Square": "purple"
        };
      
        const normalize = (angle) => {
          if (angle < -180) return angle + 360;
          if (angle > 180) return angle - 360;
          return angle;
        };
      
        const findZone = (angle) => {
          for (const zone of zones) {
            const { start, end } = zone;
            if (start > end) {
              if (angle >= start || angle < end) return zone; // wrap-around
            } else {
              if (angle >= start && angle < end) return zone;
            }
          }
          return null;
        };
      
        const getIntersectionWithBoundary = (angleRad, originX, originY, cx, cy, boundaryRadius) => {
          const dx = Math.cos(angleRad);
          const dy = Math.sin(angleRad);
          const a = dx * dx + dy * dy;
          const b = 2 * (dx * (originX - cx) + dy * (originY - cy));
          const c = (originX - cx) ** 2 + (originY - cy) ** 2 - boundaryRadius ** 2;
          const discriminant = b * b - 4 * a * c;
          if (discriminant < 0) return null;
          const t = (-b + Math.sqrt(discriminant)) / (2 * a);
          return {
            x: originX + t * dx,
            y: originY + t * dy
          };
        };
      
        const zoneStats = {};
        for (const { label } of zones) {
          zoneStats[label] = { runs: 0, balls: 0 };
        }
      
        // Process shots
        filteredData.forEach(({ x, y, runs }, i) => {
          const angle = normalize((Math.atan2(y, x) * 180) / Math.PI);
          const zone = findZone(angle);
          if (zone && zoneStats[zone.label]) {
            zoneStats[zone.label].runs += runs;
            zoneStats[zone.label].balls += 1;
          } else {
            console.warn(`❌ Shot #${i + 1} with angle ${angle.toFixed(2)}° did not match any zone.`);
          }
        });
      
        const originX = cx;
        const originY = cy - outerRadius * 0.16;
        const boundaryRadius = outerRadius - 15;
      
        zones.forEach(({ label, start, end }) => {
          const startRad = (Math.PI / 180) * start;
          const endRad = (Math.PI / 180) * end;
          const fillColor = zoneColors[label] || "#888";
      
          // 🔹 Shaded Zone Fill
          ctx.beginPath();
          ctx.moveTo(originX, originY);
          const arcSteps = 40;
          for (let i = 0; i <= arcSteps; i++) {
            const angleDeg = start + (i / arcSteps) * (end - start);
            const angleRad = (Math.PI / 180) * angleDeg;
            const point = getIntersectionWithBoundary(angleRad, originX, originY, cx, cy, boundaryRadius);
            if (point) ctx.lineTo(point.x, point.y);
          }
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.globalAlpha = 0.55;
          ctx.fill();
          ctx.globalAlpha = 1.0;
      
          // 🔸 Divider Lines
          const startPoint = getIntersectionWithBoundary(startRad, originX, originY, cx, cy, boundaryRadius);
          const endPoint = getIntersectionWithBoundary(endRad, originX, originY, cx, cy, boundaryRadius);
      
          ctx.beginPath();
          ctx.moveTo(originX, originY);
          if (startPoint) ctx.lineTo(startPoint.x, startPoint.y);
          ctx.moveTo(originX, originY);
          if (endPoint) ctx.lineTo(endPoint.x, endPoint.y);
          ctx.strokeStyle = "white";
          ctx.lineWidth = 1;
          ctx.stroke();
      
          // 🔹 Text Labels (centered on boundary circle)
          const labelRadius = boundaryRadius * 0.75;
          const midAngle = ((start + end) / 2) * (Math.PI / 180);
          const textX = cx + Math.cos(midAngle) * labelRadius;
          const textY = cy + Math.sin(midAngle) * labelRadius;
      
          const { runs, balls } = zoneStats[label];
      
          ctx.fillStyle = "white";
          ctx.font = "bold 11px Segoe UI";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, textX, textY - 7);              // Line 1: Label
          ctx.fillText(`${runs} (${balls})`, textX, textY + 7); // Line 2: Stats
        });
      }
      
      
    const imageData = canvas.toDataURL("image/png");

    fetch("/api/upload-wagon-wheel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image: imageData, type: "wagon_wheel" })
    })
    .then(res => res.json())
    .then(data => {
      console.log("✅ Wagon wheel image uploaded automatically:", data);
    })
    .catch(err => {
      console.error("❌ Error uploading wagon wheel image:", err);
    });
      

  }, [filteredData, perspective]);

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{ backgroundColor: isDarkMode ? "#212529" : "#f8f9fa" }}
      />

      <div style={{
        marginTop: "12px",
        textAlign: "center",
        fontSize: "14px",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        {["0", "1", "2", "3", "4", "5", "6", "Wicket"].map((label) => {
          const color = runToColor(label === "Wicket" ? 0 : parseInt(label));
          return (
            <span
              key={label}
              onClick={() =>
                setActiveTypes(prev =>
                  prev.includes(label)
                    ? prev.filter(type => type !== label)
                    : [...prev, label]
                )
              }
              style={{
                cursor: "pointer",
                opacity: activeTypes.includes(label) ? 1 : 0.4,
                padding: "2px 6px",
                border: "1px solid black",
                borderRadius: "4px",
                backgroundColor: label === "Wicket" ? "#ffffff" : color,
                color: label === "Wicket" ? "black" : "Black",
                fontWeight: "bold"
              }}
            >
              {label}
            </span>
          );
        })}
      </div>

    </div>
  );
};

export default WagonWheelChart;
