import { useRef, useEffect, useState, useCallback } from "react";
import "./DrawingCanvas.css";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
}

interface DrawingCanvasProps {
  size?: number;
  onStrokesChange?: (strokes: Stroke[]) => void;
  showGrid?: boolean;
  className?: string;
}

export default function DrawingCanvas({
  size = 400,
  onStrokesChange,
  showGrid = true,
  className = "",
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  // Initialize canvas and draw grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // Initial draw
    redrawCanvas();
  }, [size]);

  // Redraw canvas when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [strokes, currentStroke, showGrid]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx);
    }

    // Draw all completed strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke.points, "#2c3e50", 3);
    });

    // Draw current stroke being drawn
    if (currentStroke.length > 0) {
      drawStroke(ctx, currentStroke, "#3498db", 3);
    }
  }, [strokes, currentStroke, showGrid, size]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;

    // Draw border
    ctx.strokeRect(0, 0, size, size);

    // Draw center cross lines
    ctx.beginPath();
    // Vertical center line
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    // Horizontal center line
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Draw diagonal guides (lighter)
    ctx.strokeStyle = "#f0f0f0";
    ctx.beginPath();
    // Top-left to bottom-right
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    // Top-right to bottom-left
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
      // Draw a dot for single point
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
      // Touch event
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
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

    // Add completed stroke to strokes array
    if (currentStroke.length > 0) {
      const newStrokes = [...strokes, { points: currentStroke }];
      setStrokes(newStrokes);
      setCurrentStroke([]);

      // Notify parent of stroke changes
      if (onStrokesChange) {
        onStrokesChange(newStrokes);
      }
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    if (onStrokesChange) {
      onStrokesChange([]);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;

    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);

    if (onStrokesChange) {
      onStrokesChange(newStrokes);
    }
  };

  return (
    <div className={`drawing-canvas-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
      />
      <div className="drawing-controls">
        <button
          className="btn-undo"
          onClick={handleUndo}
          disabled={strokes.length === 0}
          title="Undo last stroke"
        >
          ↶ Undo
        </button>
        <button
          className="btn-clear"
          onClick={handleClear}
          disabled={strokes.length === 0}
          title="Clear all strokes"
        >
          ✕ Clear
        </button>
        <div className="stroke-count">
          Strokes: {strokes.length}
        </div>
      </div>
    </div>
  );
}

export type { Stroke, Point };
