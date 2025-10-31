import { useState } from "react";
import DrawingCanvas, { Stroke } from "./DrawingCanvas";
import "./WritingPracticeDemo.css";

export default function WritingPracticeDemo() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [showGrid, setShowGrid] = useState(true);

  const handleStrokesChange = (newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
    console.log("Strokes updated:", newStrokes);
  };

  return (
    <div className="writing-practice-demo">
      <div className="demo-header">
        <h2>Writing Practice - Drawing Canvas Demo</h2>
        <p className="demo-description">
          Practice writing Chinese characters using your mouse or touch screen.
        </p>
      </div>

      <div className="demo-content">
        <div className="canvas-section">
          <DrawingCanvas
            size={400}
            onStrokesChange={handleStrokesChange}
            showGrid={showGrid}
          />
        </div>

        <div className="demo-controls">
          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              <span>Show grid guides</span>
            </label>
          </div>

          <div className="info-panel">
            <h3>Stroke Data</h3>
            <div className="stroke-info">
              <p>
                <strong>Total Strokes:</strong> {strokes.length}
              </p>
              {strokes.length > 0 && (
                <div className="stroke-details">
                  {strokes.map((stroke, index) => (
                    <div key={index} className="stroke-item">
                      <span>Stroke {index + 1}:</span>
                      <span>{stroke.points.length} points</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="instructions">
            <h3>Instructions</h3>
            <ul>
              <li>Click and drag (or touch and drag) to draw strokes</li>
              <li>Each separate stroke is recorded independently</li>
              <li>Use "Undo" to remove the last stroke</li>
              <li>Use "Clear" to start over</li>
              <li>Grid guides help with alignment and proportion</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
