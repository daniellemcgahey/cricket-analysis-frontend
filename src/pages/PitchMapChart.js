import React, { useRef, useEffect , useState , useMemo } from "react";
import simpleheat from 'simpleheat';


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

      const bowlingY = metersToY(0);
      const poppingY = metersToY(1.22);

      const tPop = (poppingY - paddingTop + 600) / (height - paddingTop);
      const tBowl = (bowlingY - paddingTop) / (height - paddingTop);
      const popW = topW + (bottomW - topW) * tPop;
      const bowlW = topW + (bottomW - topW) * tBowl;

      const popLeft = centerX - popW / 2;
      const popRight = centerX + popW / 2;
      const bowlLeft = centerX - bowlW / 2;
      const bowlRight = centerX + bowlW / 2;

      ctx.beginPath();
      ctx.moveTo(popLeft, poppingY);
      ctx.lineTo(popRight, poppingY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bowlLeft, bowlingY);
      ctx.lineTo(bowlRight, bowlingY);
      ctx.stroke();

      const returnOffset = popW * 0.275;
      [-1, 1].forEach(dir => {
        const x = centerX + dir * returnOffset;
        const [rx1, ry1] = projectPoint(x, poppingY, width, height, topW, bottomW, paddingTop);
        const [rx2, ry2] = projectPoint(x, poppingY - 50, width, height, topW, bottomW, paddingTop);
        const [rx3, ry3] = projectPoint(240, poppingY - 40, width, height, topW, bottomW, paddingTop);
        const [rx4, ry4] = projectPoint(240, poppingY - 50, width, height, topW, bottomW, paddingTop);
        const [rx5, ry5] = projectPoint(360, poppingY - 40, width, height, topW, bottomW, paddingTop);
        const [rx6, ry6] = projectPoint(360, poppingY - 50, width, height, topW, bottomW, paddingTop);
        const [rx7, ry7] = projectPoint(0, poppingY - 90, width, height, topW, bottomW, paddingTop);
        const [rx8, ry8] = projectPoint(0, poppingY, width, height, topW, bottomW, paddingTop);
        const [rx9, ry9] = projectPoint(600, poppingY - 90, width, height, topW, bottomW, paddingTop);
        const [rx10, ry10] = projectPoint(600, poppingY, width, height, topW, bottomW, paddingTop);
        ctx.beginPath();
        ctx.moveTo(rx1, ry1);
        ctx.lineTo(rx2, ry2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx3, ry3);
        ctx.lineTo(rx4, ry4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx5, ry5);
        ctx.lineTo(rx6, ry6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx7, ry7);
        ctx.lineTo(rx8, ry8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx9, ry9);
        ctx.lineTo(rx10, ry10);
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
    };

    const imageData = canvas.toDataURL("image/png");

    fetch("/api/upload-pitch-map", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image: imageData, type: "pitch_map" })
    })
    .then(res => res.json())
    .then(data => {
      console.log("✅ Pitch map image uploaded automatically:", data);
    })
    .catch(err => {
      console.error("❌ Error uploading pitch map image:", err);
    });


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
