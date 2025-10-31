import { useRef, useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Stroke, Point } from "./DrawingCanvas";
import { verifyStrokes, parseStrokeMedians, VerificationResult, StrokeMedian } from "../../utils/strokeVerification";
import "./WritingVerificationCanvas.css";

interface WritingVerificationCanvasProps {
  characterId: number;
  size?: number;
  showGrid?: boolean;
  showReference?: boolean;
  tolerance?: number;
  onVerificationComplete?: (result: VerificationResult) => void;
  className?: string;
}

export default function WritingVerificationCanvas({
  characterId,
  size = 400,
  showGrid = true,
  showReference = false,
  tolerance = 0.7,
  onVerificationComplete,
  className = "",
}: WritingVerificationCanvasProps) {
  console.log(`🔵 WritingVerificationCanvas render - size prop: ${size}px`);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [referenceStrokes, setReferenceStrokes] = useState<StrokeMedian[]>([]);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>("");
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Load stroke data for the character
  useEffect(() => {
    const loadStrokeData = async () => {
      try {
        setLoading(true);

        // Get stroke data path from database
        const data: { stroke_data_path: string | null } = await invoke("get_character_stroke_data", {
          characterId,
        });

        if (!data.stroke_data_path) {
          console.error("No stroke data path available for character:", characterId);
          setReferenceStrokes([]);
          setLoading(false);
          return;
        }

        // Read SVG file from disk
        const svgContentData: string = await invoke("read_stroke_svg", {
          svgPath: data.stroke_data_path,
        });

        setSvgContent(svgContentData);

        // Parse median paths from SVG and scale to canvas size (for verification)
        const medians = parseStrokeMedians(svgContentData, size);
        setReferenceStrokes(medians);
        setLoading(false);
      } catch (error) {
        console.error("Error loading stroke data:", error);
        setReferenceStrokes([]);
        setLoading(false);
      }
    };

    loadStrokeData();
  }, [characterId, size]); // Reload when character OR size changes

  // Redraw function - defined before initialization
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas (scale is already applied from initialization)
    ctx.clearRect(0, 0, size, size);

    // Draw grid
    if (showGrid) {
      drawGrid(ctx);
    }

    // Draw reference SVG as shadow (if enabled)
    // This is rendered separately via the svgContainerRef overlay

    // Draw user strokes with feedback colors
    strokes.forEach((stroke, index) => {
      let color = "#2c3e50"; // Default color
      let lineWidth = 3;

      if (verificationResult && verificationResult.strokeResults[index]) {
        const result = verificationResult.strokeResults[index];
        if (result.isCorrect) {
          color = "#28a745"; // Green for correct
        } else {
          color = "#dc3545"; // Red for incorrect
        }
      }

      drawStroke(ctx, stroke.points, color, lineWidth);
    });

    // Draw current stroke
    if (currentStroke.length > 0) {
      drawStroke(ctx, currentStroke, "#3498db", 3);
    }
  }, [strokes, currentStroke, showGrid, showReference, verificationResult, referenceStrokes, size]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("❌ Canvas ref is null during initialization");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("❌ Could not get canvas context");
      return;
    }

    console.log(`🔍 Initializing canvas with size prop: ${size}px`);

    // Get current computed styles BEFORE setting size
    const computedStyle = window.getComputedStyle(canvas);
    console.log(`📏 BEFORE - Computed canvas size: ${computedStyle.width} x ${computedStyle.height}`);
    console.log(`📏 BEFORE - Canvas properties: width=${canvas.width}, height=${canvas.height}`);
    console.log(`📏 BEFORE - Inline styles: ${canvas.style.width} x ${canvas.style.height}`);

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    console.log(`✅ Canvas initialized: ${size}px x ${size}px (DPR: ${dpr})`);
    console.log(`   Physical canvas size: ${canvas.width}px x ${canvas.height}px`);
    console.log(`   Inline style size: ${canvas.style.width} x ${canvas.style.height}`);

    // Check computed style AFTER setting size
    setTimeout(() => {
      const computedStyleAfter = window.getComputedStyle(canvas);
      const rect = canvas.getBoundingClientRect();
      console.log(`📏 AFTER - Computed canvas size: ${computedStyleAfter.width} x ${computedStyleAfter.height}`);
      console.log(`📏 AFTER - BoundingClientRect: ${rect.width}px x ${rect.height}px`);

      if (rect.width !== size || rect.height !== size) {
        console.warn(`⚠️  SIZE MISMATCH DETECTED!`);
        console.warn(`   Expected: ${size}px x ${size}px`);
        console.warn(`   Actual render: ${rect.width}px x ${rect.height}px`);
        console.warn(`   Checking parent containers...`);

        let parent = canvas.parentElement;
        let level = 1;
        while (parent && level <= 3) {
          const parentRect = parent.getBoundingClientRect();
          const parentStyle = window.getComputedStyle(parent);
          console.warn(`   Parent ${level} (${parent.className}): ${parentRect.width}px x ${parentRect.height}px`);
          console.warn(`     Display: ${parentStyle.display}, Overflow: ${parentStyle.overflow}`);
          parent = parent.parentElement;
          level++;
        }
      }
    }, 100);

    // Initial draw
    redrawCanvas();
  }, [size, redrawCanvas]);

  // Redraw when strokes or settings change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Render SVG reference when showReference is enabled
  useEffect(() => {
    if (!svgContainerRef.current || !svgContent) return;

    const container = svgContainerRef.current;

    if (showReference) {
      // Parse and display SVG
      container.innerHTML = svgContent;
      const svg = container.querySelector("svg");

      if (svg) {
        // Apply Make Me a Hanzi coordinate transform (flip Y-axis)
        const g = svg.querySelector("g");
        if (g) {
          g.setAttribute("transform", "scale(1, -1) translate(0, -900)");
        }

        // Set SVG size to match canvas
        svg.setAttribute("width", size.toString());
        svg.setAttribute("height", size.toString());
        svg.setAttribute("viewBox", "0 0 1024 1024");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.pointerEvents = "none";

        // Style all paths as filled gray shadows
        const paths = svg.querySelectorAll("path");
        paths.forEach((path) => {
          path.setAttribute("fill", "#d0d0d0");
          path.setAttribute("stroke", "none");
          path.style.opacity = "0.4";
        });
      }
    } else {
      // Clear SVG when reference is hidden
      container.innerHTML = "";
    }
  }, [showReference, svgContent, size]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;

    ctx.strokeRect(0, 0, size, size);

    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    ctx.strokeStyle = "#f0f0f0";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    ctx.moveTo(size, 0);
    ctx.lineTo(0, size);
    ctx.stroke();
  };

  const drawStroke = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    color: string,
    lineWidth: number
  ) => {
    if (points.length < 2) {
      if (points.length === 1) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
  };

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    setCurrentStroke([point]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    setCurrentStroke((prev) => [...prev, point]);
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    setIsDrawing(false);

    if (currentStroke.length > 0) {
      const newStrokes = [...strokes, { points: currentStroke }];
      setStrokes(newStrokes);
      setCurrentStroke([]);
      setVerificationResult(null); // Clear previous verification
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setVerificationResult(null);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;

    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    setVerificationResult(null);
  };

  const handleVerify = () => {
    if (strokes.length === 0 || referenceStrokes.length === 0) {
      alert("Please draw some strokes first!");
      return;
    }

    console.log("=== Verification Debug ===");
    console.log("User strokes:", strokes);
    console.log("Reference strokes:", referenceStrokes);
    console.log("Canvas size:", size);
    console.log("Tolerance:", tolerance);

    const result = verifyStrokes(strokes, referenceStrokes, tolerance, size);
    console.log("Verification result:", result);

    setVerificationResult(result);

    if (onVerificationComplete) {
      onVerificationComplete(result);
    }
  };

  if (loading) {
    return (
      <div className="writing-verification-loading">
        <div className="loading-spinner"></div>
        <p>Loading stroke data...</p>
      </div>
    );
  }

  if (referenceStrokes.length === 0) {
    return (
      <div className="writing-verification-error">
        <p>No stroke data available for this character.</p>
      </div>
    );
  }

  return (
    <div className={`writing-verification-container ${className}`}>
      <div style={{ position: "relative", width: `${size}px`, height: `${size}px` }}>
        <canvas
          ref={canvasRef}
          className="writing-verification-canvas"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          onTouchCancel={handleEnd}
        />
        <div
          ref={svgContainerRef}
          className="writing-verification-svg-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${size}px`,
            height: `${size}px`,
            pointerEvents: "none",
          }}
        />
      </div>

      <div className="writing-verification-controls">
        <button
          className="btn-undo"
          onClick={handleUndo}
          disabled={strokes.length === 0}
        >
          ↶ Undo
        </button>
        <button
          className="btn-clear"
          onClick={handleClear}
          disabled={strokes.length === 0}
        >
          ✕ Clear
        </button>
        <button
          className="btn-verify"
          onClick={handleVerify}
          disabled={strokes.length === 0}
        >
          ✓ Check
        </button>
        <div className="stroke-count">
          {strokes.length} / {referenceStrokes.length} strokes
        </div>
      </div>

      {verificationResult && (
        <div className={`verification-feedback ${verificationResult.isCorrect ? "correct" : "incorrect"}`}>
          <div className="feedback-icon">
            {verificationResult.isCorrect ? "✓" : "✗"}
          </div>
          <div className="feedback-message">{verificationResult.feedback}</div>
          <div className="feedback-score">
            Score: {(verificationResult.totalScore * 100).toFixed(0)}%
          </div>
        </div>
      )}
    </div>
  );
}
