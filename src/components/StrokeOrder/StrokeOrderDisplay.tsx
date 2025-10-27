import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./StrokeOrderDisplay.css";

interface StrokeData {
  id: number;
  character: string;
  stroke_count: number | null;
  radical: string | null;
  decomposition: string | null;
  stroke_data_path: string | null;
}

interface StrokeOrderDisplayProps {
  characterId: number;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
}

export default function StrokeOrderDisplay({
  characterId,
  autoPlay = false,
  showControls = true,
  className = "",
}: StrokeOrderDisplayProps) {
  const [strokeData, setStrokeData] = useState<StrokeData | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [currentStroke, setCurrentStroke] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const animationRef = useRef<number | null>(null);
  const strokePathsRef = useRef<SVGPathElement[]>([]);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Load stroke data when characterId changes
  useEffect(() => {
    loadStrokeData();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [characterId]);

  // Handle autoPlay
  useEffect(() => {
    if (autoPlay && strokeData && svgContent) {
      setIsPlaying(true);
    }
  }, [autoPlay, strokeData, svgContent]);

  const loadStrokeData = async () => {
    setLoading(true);
    setError("");

    try {
      const data: StrokeData = await invoke("get_character_stroke_data", {
        characterId,
      });

      setStrokeData(data);

      if (data.stroke_data_path) {
        const svg: string = await invoke("read_stroke_svg", {
          svgPath: data.stroke_data_path,
        });
        setSvgContent(svg);
      } else {
        setError("No stroke order data available for this character");
      }
    } catch (err) {
      setError(`Failed to load stroke data: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Parse SVG and extract stroke paths
  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;

    const container = svgContainerRef.current;
    container.innerHTML = svgContent;

    const svg = container.querySelector("svg");
    if (!svg) return;

    // Find all stroke paths
    const paths = Array.from(svg.querySelectorAll("path")) as SVGPathElement[];
    strokePathsRef.current = paths;

    // Initially hide all strokes
    paths.forEach((path) => {
      path.style.opacity = "0";
      path.style.strokeDasharray = path.getTotalLength().toString();
      path.style.strokeDashoffset = path.getTotalLength().toString();
    });

    setCurrentStroke(0);
  }, [svgContent]);

  // Animation logic
  useEffect(() => {
    if (!isPlaying || strokePathsRef.current.length === 0) return;

    const paths = strokePathsRef.current;
    const strokeDuration = 1000 / speed; // Base duration per stroke
    let startTime: number | null = null;
    let strokeIndex = currentStroke;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / strokeDuration, 1);

      if (strokeIndex < paths.length) {
        const path = paths[strokeIndex];
        const length = path.getTotalLength();

        // Make current stroke visible and animate
        path.style.opacity = "1";
        path.style.strokeDashoffset = (length * (1 - progress)).toString();

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Move to next stroke
          strokeIndex++;
          setCurrentStroke(strokeIndex);
          startTime = null;

          if (strokeIndex < paths.length) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            // Animation complete
            setIsPlaying(false);
          }
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentStroke, speed]);

  const handlePlay = useCallback(() => {
    if (currentStroke >= strokePathsRef.current.length) {
      // Restart if at the end
      handleRestart();
    } else {
      setIsPlaying(true);
    }
  }, [currentStroke]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleRestart = useCallback(() => {
    // Reset all strokes
    strokePathsRef.current.forEach((path) => {
      path.style.opacity = "0";
      const length = path.getTotalLength();
      path.style.strokeDashoffset = length.toString();
    });

    setCurrentStroke(0);
    setIsPlaying(true);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  if (loading) {
    return (
      <div className={`stroke-order-display ${className}`}>
        <div className="stroke-order-loading">Loading stroke data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`stroke-order-display ${className}`}>
        <div className="stroke-order-error">{error}</div>
      </div>
    );
  }

  if (!strokeData || !strokeData.stroke_data_path) {
    return (
      <div className={`stroke-order-display ${className}`}>
        <div className="stroke-order-error">
          No stroke order data available for this character
        </div>
      </div>
    );
  }

  return (
    <div className={`stroke-order-display ${className}`}>
      <div className="stroke-order-header">
        <h3 className="stroke-order-character">{strokeData.character}</h3>
        <div className="stroke-order-info">
          {strokeData.stroke_count && (
            <span className="stroke-count">
              Strokes: {strokeData.stroke_count}
            </span>
          )}
          {strokeData.radical && (
            <span className="radical">Radical: {strokeData.radical}</span>
          )}
        </div>
      </div>

      <div className="stroke-order-canvas" ref={svgContainerRef}></div>

      {showControls && (
        <div className="stroke-order-controls">
          <div className="playback-controls">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="control-button"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              onClick={handleRestart}
              className="control-button"
              aria-label="Restart"
            >
              ↻
            </button>
          </div>

          <div className="speed-control">
            <label htmlFor="speed-slider">Speed:</label>
            <input
              id="speed-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="speed-slider"
            />
            <span className="speed-value">{speed.toFixed(1)}x</span>
          </div>

          <div className="stroke-progress">
            Stroke: {Math.min(currentStroke + 1, strokeData.stroke_count || 0)} /{" "}
            {strokeData.stroke_count || 0}
          </div>
        </div>
      )}
    </div>
  );
}
