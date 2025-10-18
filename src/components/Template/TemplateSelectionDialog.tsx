// Phase 4.2: Template Selection Dialog Component
import React, { useState, useEffect } from 'react';
import { FlashcardTemplate } from '../../types';
import { TauriFileService } from '../../services/TauriFileService';
import { TemplateService } from '../../services/TemplateService';
import { TemplateHistoryService } from '../../services/TemplateHistoryService';

interface TemplateSelectionDialogProps {
  onSelectTemplate: (template: FlashcardTemplate) => void;
  onCancel: () => void;
}

export const TemplateSelectionDialog: React.FC<TemplateSelectionDialogProps> = ({
  onSelectTemplate,
  onCancel,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<FlashcardTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentTemplates, setRecentTemplates] = useState<FlashcardTemplate[]>([]);

  // Load recent templates on mount
  useEffect(() => {
    const templates = TemplateHistoryService.getRecentTemplates();
    setRecentTemplates(templates);
  }, []);

  const handleBrowseTemplate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const template = await TauriFileService.openTemplate();

      if (template) {
        // Validate template
        if (!TemplateService.validateTemplate(template)) {
          setError('Invalid template file format');
          return;
        }

        setSelectedTemplate(template);
      }
    } catch (err) {
      console.error('Error loading template:', err);
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      // Add to history before applying
      TemplateHistoryService.addToHistory(selectedTemplate);
      onSelectTemplate(selectedTemplate);
    }
  };

  const handleSelectRecentTemplate = (template: FlashcardTemplate) => {
    setSelectedTemplate(template);
    setError(null);
  };

  const getPreview = () => {
    if (!selectedTemplate) return null;
    return TemplateService.getTemplatePreview(selectedTemplate);
  };

  const preview = getPreview();

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="template-selection-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="template-selection-header">
          <h2>Select Template</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="template-selection-content">
          <div className="template-selection-info">
            <p>Choose a template to create a new flashcard with a predefined structure.</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {recentTemplates.length > 0 && (
            <div className="recent-templates-section">
              <h3>Recent Templates</h3>
              <div className="recent-templates-list">
                {recentTemplates.map((template) => {
                  const preview = TemplateService.getTemplatePreview(template);
                  const isSelected = selectedTemplate?.id === template.id;
                  return (
                    <div
                      key={template.id}
                      className={`recent-template-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectRecentTemplate(template)}
                    >
                      <div className="recent-template-name">{preview.name}</div>
                      <div className="recent-template-stats">
                        {preview.sideCount} sides, {preview.arrowCount} arrows
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="template-browser">
            <button
              onClick={handleBrowseTemplate}
              disabled={isLoading}
              className="browse-template-btn"
            >
              {isLoading ? 'Loading...' : 'Browse for Template...'}
            </button>
          </div>

          {selectedTemplate && preview && (
            <div className="template-preview">
              <h3>Selected Template</h3>
              <div className="template-preview-card">
                <div className="template-preview-header">
                  <strong>{preview.name}</strong>
                </div>
                {preview.description && (
                  <p className="template-description">{preview.description}</p>
                )}
                <div className="template-stats">
                  <span className="template-stat">
                    <strong>{preview.sideCount}</strong> {preview.sideCount === 1 ? 'side' : 'sides'}
                  </span>
                  <span className="template-stat">
                    <strong>{preview.arrowCount}</strong> {preview.arrowCount === 1 ? 'arrow' : 'arrows'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="template-selection-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="apply-template-btn"
            onClick={handleConfirm}
            disabled={!selectedTemplate}
          >
            Create from Template
          </button>
        </div>
      </div>
    </div>
  );
};
