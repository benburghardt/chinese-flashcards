// Phase 4.5: Template History Service
// Tracks recently used templates for quick access

import { FlashcardTemplate } from '../types';

interface TemplateHistoryEntry {
  template: FlashcardTemplate;
  lastUsed: Date;
  filePath?: string;
}

export class TemplateHistoryService {
  private static readonly MAX_HISTORY_SIZE = 10;
  private static readonly STORAGE_KEY = 'extended-flashcards-template-history';

  /**
   * Add a template to the history
   * Updates if template already exists, otherwise adds to front
   */
  static addToHistory(template: FlashcardTemplate, filePath?: string): void {
    try {
      const history = this.getHistory();

      // Remove existing entry for this template if it exists
      const filteredHistory = history.filter(entry => entry.template.id !== template.id);

      // Add to front of history
      const newEntry: TemplateHistoryEntry = {
        template,
        lastUsed: new Date(),
        filePath
      };

      filteredHistory.unshift(newEntry);

      // Limit size
      const limitedHistory = filteredHistory.slice(0, this.MAX_HISTORY_SIZE);

      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error adding template to history:', error);
    }
  }

  /**
   * Get template history, sorted by most recently used
   */
  static getHistory(): TemplateHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const history: TemplateHistoryEntry[] = JSON.parse(stored);

      // Convert date strings back to Date objects
      return history.map(entry => ({
        ...entry,
        lastUsed: new Date(entry.lastUsed)
      }));
    } catch (error) {
      console.error('Error loading template history:', error);
      return [];
    }
  }

  /**
   * Get recent templates (template objects only)
   */
  static getRecentTemplates(): FlashcardTemplate[] {
    return this.getHistory().map(entry => entry.template);
  }

  /**
   * Clear all history
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing template history:', error);
    }
  }

  /**
   * Remove a specific template from history
   */
  static removeFromHistory(templateId: string): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter(entry => entry.template.id !== templateId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing template from history:', error);
    }
  }
}
