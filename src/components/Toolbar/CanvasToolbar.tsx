import { CanvasTool } from '../../types';

interface CanvasToolbarProps {
  selectedTool: CanvasTool;
  onToolSelect: (tool: CanvasTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  selectedTool,
  onToolSelect,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  canUndo,
  canRedo,
}) => {
  const tools: { tool: CanvasTool; label: string; icon: string }[] = [
    { tool: 'select', label: 'Select', icon: '🔗' },
    { tool: 'add-side', label: 'Add Side', icon: '⬜' },
    { tool: 'add-arrow', label: 'Add Arrow', icon: '➡️' },
    { tool: 'pan', label: 'Pan', icon: '✋' },
  ];

  return (
    <div className="canvas-toolbar">
      <div className="tool-group">
        {tools.map(({ tool, label, icon }) => (
          <button
            key={tool}
            className={`tool-button ${selectedTool === tool ? 'active' : ''}`}
            onClick={() => onToolSelect(tool)}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>

      <div className="tool-group">
        <button
          className="tool-button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          ↶
        </button>
        <button
          className="tool-button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          ↷
        </button>
      </div>

      <div className="tool-group">
        <button className="tool-button" onClick={onZoomOut} title="Zoom Out">
          🔍-
        </button>
        <button className="tool-button" onClick={onZoomReset} title="Reset Zoom">
          🔍=
        </button>
        <button className="tool-button" onClick={onZoomIn} title="Zoom In">
          🔍+
        </button>
      </div>
    </div>
  );
};