// Phase 4: Save Template Dialog Component
import React, { useState } from 'react';

interface SaveTemplateDialogProps {
  onSave: (templateName: string, description?: string) => void;
  onCancel: () => void;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  onSave,
  onCancel,
}) => {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (templateName.trim()) {
      onSave(templateName.trim(), templateDescription.trim() || undefined);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="template-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="template-dialog-header">
          <h2>Save as Template</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="template-dialog-content">
          <div className="template-form-group">
            <label htmlFor="template-name">Template Name *</label>
            <input
              id="template-name"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Language Translation Card"
              autoFocus
              required
            />
          </div>

          <div className="template-form-group">
            <label htmlFor="template-description">Description (Optional)</label>
            <textarea
              id="template-description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe the structure and purpose of this template..."
              rows={3}
            />
          </div>

          <div className="template-dialog-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="save-template-btn"
              disabled={!templateName.trim()}
            >
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
