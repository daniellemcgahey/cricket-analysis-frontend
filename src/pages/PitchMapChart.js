import React, { useRef, useEffect , useState , useMemo } from "react";
import simpleheat from 'simpleheat';
import api from "../api";


const createZones = () => [
  { label: "Full Toss", start: -1, end: 0.4, color: "#f6c7b6", balls: 0, runs: 0, wickets: 0 },
  { label: "Yorker", start: 0.4, end: 1.8, color: "#f9e79f", balls: 0, runs: 0, wickets: 0 },
  { label: "Full", start: 1.8, end: 3.5, color: "#a3c86d", balls: 0, runs: 0, wickets: 0 },
  { label: "Good", start: 3.5, end: 6.0, color: "#f4b860", balls: 0, runs: 0, wickets: 0 },
  { label: "Short", start: 6.0, end: 10.0, color: "#9b89b8", balls: 0, runs: 0, wickets: 0 }
];

const PITCH_Y_MULTIPLIER = 1.0;


const PitchMapChart = ({ data, viewMode, selectedBallId = null, innerRef = null, setProjectedBalls = () => {} }) => {

  const fallbackCanvasRef = useRef();
  const canvasRef = innerRef ? innerRef : fallbackCanvasRef;

  const [activeTypes, setActiveTypes] = useState([
    "0s", "1s", "2s", "3s", "4s", "5s", "6s", "Wides", "No Balls", "Wicket"
  ]);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
  
    return data.filter((ball) => {
      const run = ball.runs;
      const isWide = ball.extra_type === "Wide";
      const isNoBall = ball.extra_type === "No Ball";
      const isWicket = !!ball.dismissal_type;
  
      const runKey = `${run}s`;
  
      const matchRun = run !== undefined && activeTypes.includes(runKey);
      const matchWide = isWide && activeTypes.includes("Wides");
      const matchNoBall = isNoBall && activeTypes.includes("No Balls");
      const matchWicket = isWicket && activeTypes.includes("Wicket");
  
      return matchRun || matchWide || matchNoBall || matchWicket;
    });
  }, [data, activeTypes]);
  

  const projectPoint = (x, y, canvasWidth, canvasHeight, topW, bottomW, paddingTop) => {
    const t = (y - paddingTop) / (canvasHeight - paddingTop);
    const width = topW + (bottomW - topW) * t;
    const centerX = canvasWidth / 2;
    const projectedX = centerX + (x - centerX) * (width / bottomW);
    return [projectedX, y];
  };

  const drawZoneLabels = (ctx, width, height, zones) => {
    const paddingTop = 150;
    const visibleLength = 11.0;
    const topW = 360;
    const bottomW = 600;
    const centerX = width / 2;
  
    const metersToY = (m) => paddingTop + (m / visibleLength) * (height - paddingTop);
  
    zones.forEach((zone) => {
      const y1 = metersToY(zone.start);
      const y2 = metersToY(zone.end);
      const t = (y1 - paddingTop) / (height - paddingTop);
      const w = topW + (bottomW - topW) * t;
      const labelX = centerX - w / 2 + 25;
      const labelY = (y1 + y2) / 2;
  
      ctx.fillStyle = "black";
      ctx.font = "bold 16px Arial";
      ctx.fillText(zone.label, labelX - 25, labelY - 10);
  
      ctx.font = "bold 10px Arial";
      ctx.fillText(`${zone.runs} (${zone.balls})`, labelX - 28, labelY + 5);  // Line 2: Runs (Balls)
      ctx.fillText(`${zone.wickets} Wicket${zone.wickets === 1 ? "" : "s"}`, labelX -30, labelY + 20);  // Line 3: Wickets
    });
  };
  

  const drawPitch = (ctx, width, height, zones) => {
    const paddingTop = 150;
    const visibleLength = 11.0;
    const topW = 360; // fixed width top
    const bottomW = 600; // fixed width bottom
    const centerX = width / 2;

    const metersToY = (m) => paddingTop + (m / visibleLength) * (height - paddingTop);

    const drawProjectedQuad = (yStart, yEnd, color, label, zone) => {
      const tStart = (yStart - paddingTop) / (height - paddingTop);
      const tEnd = (yEnd - paddingTop) / (height - paddingTop);

      const wStart = topW + (bottomW - topW) * tStart;
      const wEnd = topW + (bottomW - topW) * tEnd;

      const left1 = centerX - wStart / 2;
      const right1 = centerX + wStart / 2;
      const left2 = centerX - wEnd / 2;
      const right2 = centerX + wEnd / 2;

      ctx.beginPath();
      ctx.moveTo(left1, yStart);
      ctx.lineTo(right1, yStart);
      ctx.lineTo(right2, yEnd);
      ctx.lineTo(left2, yEnd);
      ctx.closePath();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    ctx.fillStyle = "#6c8d57";
    ctx.fillRect(0, 0, width, height);

    const pitchTopY = paddingTop;
    const pitchBottomY = height;
    const tTop = (pitchTopY - paddingTop) / (height - paddingTop);
    const tBottom = (pitchBottomY - paddingTop) / (height - paddingTop);
    const pitchTopWidth = topW + (bottomW - topW) * tTop;
    const pitchBottomWidth = topW + (bottomW - topW) * tBottom;
    const pitchLeftTop = centerX - pitchTopWidth / 2;
    const pitchRightTop = centerX + pitchTopWidth / 2;
    const pitchLeftBottom = centerX - pitchBottomWidth / 2;
    const pitchRightBottom = centerX + pitchBottomWidth / 2;

    ctx.beginPath();
    ctx.moveTo(pitchLeftTop, pitchTopY);
    ctx.lineTo(pitchRightTop, pitchTopY);
    ctx.lineTo(pitchRightBottom, pitchBottomY);
    ctx.lineTo(pitchLeftBottom, pitchBottomY);
    ctx.closePath();
    ctx.fillStyle = "#e0c08d";
    ctx.fill();

    const drawProjectedRectangle = (startM, endM, widthRatio = 0.4, color = "#000000", alpha = 0.2) => {
        const y1 = metersToY(startM);
        const y2 = metersToY(endM);
      
        const t1 = (y1 - paddingTop) / (height - paddingTop);
        const t2 = (y2 - paddingTop) / (height - paddingTop);
      
        const w1 = topW + (bottomW - topW) * t1;
        const w2 = topW + (bottomW - topW) * t2;
      
        const rectW1 = w1 * widthRatio;
        const rectW2 = w2 * widthRatio;
      
        const left1 = centerX - rectW1 / 2;
        const right1 = centerX + rectW1 / 2;
        const left2 = centerX - rectW2 / 2;
        const right2 = centerX + rectW2 / 2;
      
        ctx.beginPath();
        ctx.moveTo(left1, y1);
        ctx.lineTo(right1, y1);
        ctx.lineTo(right2, y2);
        ctx.lineTo(left2, y2);
        ctx.closePath();
      
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      };

      const drawMeterMarkers = () => {
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.lineWidth = 1;
      
        for (let m = 0; m <= 10; m += 2) {
          const y = metersToY(m);
          const t = (y - paddingTop) / (height - paddingTop);
          const w = topW + (bottomW - topW) * t;
      
          const xTick = centerX + w / 2; // right side of the pitch + margin
          const xLabel = xTick + 4;
      
          // Tick line
          ctx.beginPath();
          ctx.moveTo(xTick, y);
          ctx.lineTo(xTick + 6, y);
          ctx.stroke();
      
          // Text label
          ctx.fillText(`${m}m`, xLabel - 40, y + 4);
        }
      };


    zones.forEach((zone) => {
      const y1 = metersToY(zone.start);
      const y2 = metersToY(zone.end);
      drawProjectedQuad(y1, y2, zone.color, zone.label, zone);

    });

    const drawCreases = () => {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;

      // Calculate Y positions for bowling and popping creases (in meters)
      const bowlingM = 0;
      const poppingM = 1.22;

      const bowlingY = metersToY(bowlingM);
      const poppingY = metersToY(poppingM);

      // Utility: project an X offset at a given Y
      const projectXOffset = (offset, y) => {
        const t = (y - paddingTop) / (height - paddingTop);
        const w = topW + (bottomW - topW) * t;
        return centerX + offset * (w / 2); // 🟢 direction fix: no sign flip here
      };

      // 1️⃣ Bowling crease
      ctx.beginPath();
      ctx.moveTo(projectXOffset(-1, bowlingY), bowlingY);
      ctx.lineTo(projectXOffset(1, bowlingY), bowlingY);
      ctx.stroke();

      // 2️⃣ Popping crease
      ctx.beginPath();
      ctx.moveTo(projectXOffset(-1, poppingY), poppingY);
      ctx.lineTo(projectXOffset(1, poppingY), poppingY);
      ctx.stroke();

      // 3️⃣ Return creases (0.6m offset) – use sign flip to keep inwards
      const returnOffset = 0.6;
      [-1, 1].forEach(dir => {
        const x = projectXOffset(-dir * returnOffset, poppingY); // 🔄 sign flip
        const yTop = poppingY - 0.5 * (height / visibleLength);
        const yBottom = poppingY;

        ctx.beginPath();
        ctx.moveTo(x, yTop);
        ctx.lineTo(x, yBottom);
        ctx.stroke();
      });

      // 4️⃣ Wide lines (0.45m offset)
      const wideOffset = 0.45;
      [-1, 1].forEach(dir => {
        const x = projectXOffset(-dir * wideOffset, poppingY); // 🔄 sign flip
        const yTop = bowlingY - 0.2 * (height / visibleLength);
        const yBottom = bowlingY + 0.3 * (height / visibleLength);

        ctx.beginPath();
        ctx.moveTo(x, yTop);
        ctx.lineTo(x, yBottom);
        ctx.stroke();
      });
    };




    drawCreases();

    drawProjectedRectangle(0, 11, 0.12, "blue", 0.15);

    drawMeterMarkers();

    const creaseY = metersToY(0);
    const stumpSpacing = topW / 22;
    ctx.lineWidth = 6;
    for (let i = -1; i <= 1; i++) {
      const x = centerX + i * stumpSpacing;
      const y1 = creaseY;
      const y2 = creaseY - 85;

      ctx.beginPath();
      ctx.strokeStyle = "black";
      ctx.fillStyle = "#0077ff";
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y2, 0.8, Math.PI, 0);  // semicircle (left to right)
      ctx.fill();
      ctx.stroke();

    }

  };

  const drawBalls = (ctx, canvasWidth, canvasHeight, balls, zones) => {
    const paddingTop = 150;
    const visibleLength = 11.0;
    const topW = 360;
    const bottomW = 600;
    const centerX = canvasWidth / 2;

    const metersToY = (m) => paddingTop + (m / visibleLength) * (canvasHeight - paddingTop);

    const newProjectedBalls = [];

    balls.forEach((ball, index) => {
      const { pitch_x, pitch_y, runs, dismissal_type } = ball;
      const adjustedY = pitch_y * PITCH_Y_MULTIPLIER;

      zones.forEach(zone => {
        if (adjustedY * visibleLength >= zone.start && adjustedY * visibleLength < zone.end) {
          zone.balls += 1;
          zone.runs += runs;
          if (dismissal_type) zone.wickets += 1;
        }
      });

      let color = "black";
      if (dismissal_type) color = "#ffffff";
      else if (runs === 0) color = "#ff3333";
      else if (runs >= 4) color = "#3498db";
      else color = "#2ecc71";

      if (ball.ball_id === selectedBallId) {
        color = "purple";
      }

      const metersToCanvasY = metersToY(adjustedY * visibleLength);
      const flatX = centerX + (pitch_x - 0.5) * bottomW;
      const [x, y] = projectPoint(flatX, metersToCanvasY, canvasWidth, canvasHeight, topW, bottomW, paddingTop);

      ctx.beginPath();
      ctx.arc(x, y, ball.ball_id === selectedBallId ? 7 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // 🆕 Set thin line BEFORE stroke
      ctx.lineWidth = 2;
      ctx.strokeStyle = "black";
      ctx.fill();
      ctx.stroke();

      newProjectedBalls.push({ x, y });
    });

    setProjectedBalls(newProjectedBalls); // 🆕 save for clicking
  };

  const updateZoneStats = (balls, zones) => {
    const visibleLength = 11.0;
  
    balls.forEach(ball => {
      const { pitch_y, runs, dismissal_type } = ball;
      const adjustedY = pitch_y * PITCH_Y_MULTIPLIER;
      zones.forEach(zone => {
        if (adjustedY * visibleLength >= zone.start && adjustedY * visibleLength < zone.end) {
          zone.balls += 1;
          zone.runs += runs;
          if (dismissal_type) zone.wickets += 1;
        }
      });
    });
  };
  

  const drawHeatMap = (ctx, canvasWidth, canvasHeight, balls) => {
    const paddingTop = 150;
    const visibleLength = 11.0;
    const topW = 360;
    const bottomW = 600;
    const centerX = canvasWidth / 2;
  
    const metersToY = (m) => paddingTop + (m / visibleLength) * (canvasHeight - paddingTop);
  
    const heatCanvas = document.createElement("canvas");
    heatCanvas.width = canvasWidth;
    heatCanvas.height = canvasHeight;
    const heatCtx = heatCanvas.getContext("2d");
  
    const heat = simpleheat(heatCanvas);
  
    const heatPoints = balls.map(ball => {
      const adjustedY = ball.pitch_y * PITCH_Y_MULTIPLIER;
      const flatX = centerX + (ball.pitch_x - 0.5) * bottomW;
      const flatY = metersToY(adjustedY * visibleLength);
      const [x, y] = projectPoint(flatX, flatY, canvasWidth, canvasHeight, topW, bottomW, paddingTop);
      return [x, y, 1]; // x, y, intensity
    });
  
    heat.data(heatPoints);
    heat.radius(25, 25); // radius, blur
    heat.max(10);         // maximum intensity scaling
    heat.draw(0.2);      // opacity
  
    // Copy heatCanvas to main canvas
    ctx.drawImage(heatCanvas, 0, 0);
  };
  
  



  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // ✅ prevent crash if canvas is not ready
    const ctx = canvas.getContext("2d");

    const resize = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const zones = createZones(); 
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
      drawPitch(ctx, width, height, zones);
    
      if (filteredData?.length) {
        if (viewMode === "Heat") {
          updateZoneStats(filteredData, zones); // ✅ Only update here
          drawHeatMap(ctx, width, height, filteredData);
        } else {
          drawBalls(ctx, width, height, filteredData, zones); // ✅ let it update zones here
        }
      }
    
      drawZoneLabels(ctx, width, height, zones); 

      
      const imageData = canvas.toDataURL("image/png");

      api.post("/api/upload-pitch-map", {
        image: imageData,
        type: "pitch_map"
      })
      .then(res => {
        console.log("✅ Pitch map image uploaded automatically:", res.data);
      })
      .catch(err => {
        console.error("❌ Error uploading pitch map image:", err);
      });
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
}, [filteredData, viewMode, selectedBallId]);


  if (!Array.isArray(data)) return null;

  return (
    <div>
      {/* ✅ Canvas element for pitch map */}
      <div style={{ maxWidth: "600px", width: "100%", height: "600px", margin: "0 auto" }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "20px",
            background: "transparent",
          }}
        />
      </div>
  
      {/* ✅ Run type filter legend */}
      <div
        style={{
          marginTop: "12px",
          textAlign: "center",
          fontSize: "14px",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        {[
          { label: "0s", color: "#ff3333" },
          { label: "1s", color: "#2ecc71" },
          { label: "2s", color: "#58d68d" },
          { label: "3s", color: "#27ae60" },
          { label: "4s", color: "#3498db" },
          { label: "5s", color: "#1f618d" },
          { label: "6s", color: "#2e86c1" },
          { label: "Wides", color: "#f1c40f" },
          { label: "No Balls", color: "#f39c12" },
          { label: "Wicket", color: "#ffffff" }
        ].map(({ label, color }) => (
          <span
            key={label}
            onClick={() =>
              setActiveTypes((prev) =>
                prev.includes(label)
                  ? prev.filter((type) => type !== label)
                  : [...prev, label]
              )
            }
            style={{
              cursor: "pointer",
              opacity: activeTypes.includes(label) ? 1 : 0.4,
              padding: "2px 6px",
              border: "1px solid black",
              borderRadius: "4px",
              backgroundColor: color,
              color: label === "Wides" || label === "No Balls" ? "black" : "black",
              fontWeight: "bold"
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PitchMapChart;
