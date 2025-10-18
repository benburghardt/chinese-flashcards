// Phase 2: Tauri File Service - Implementation complete with web fallback
import { FlashcardSet, FlashcardTemplate, FileMetadata } from '../types';
import { detectEnvironment } from '../utils/environmentDetection';

// Web File API fallback functions
const webFileAPI = {
  async open() {
    return new Promise<{ name: string; content: string }>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              content: reader.result as string
            });
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        } else {
          reject(new Error('No file selected'));
        }
      };
      input.click();
    });
  },

  async save(filename: string, content: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return filename;
  }
};

// Dynamic imports for Tauri APIs with web fallback
const getTauriAPI = async () => {
  const environment = await detectEnvironment();

  if (environment === 'desktop') {
    try {
      const { open, save } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile, writeTextFile, stat } = await import('@tauri-apps/plugin-fs');

      return { open, save, readTextFile, writeTextFile, stat };
    } catch (error) {
      // Even in desktop environment, imports might fail
      console.warn('Failed to load Tauri APIs in desktop environment:', error);
      return null;
    }
  }

  // Web environment - return null immediately without attempting imports
  return null;
};

// Note: Environment detection is now handled by getTauriAPI() directly

export class TauriFileService {
  private static readonly RECENT_FILES_KEY = 'extended-flashcards-recent-files';
  private static readonly MAX_RECENT_FILES = 10;

  static async openFlashcardSet(): Promise<{ set: FlashcardSet; filePath: string } | null> {
    try {
      const tauriAPI = await getTauriAPI();

      if (tauriAPI) {
        // Desktop/Tauri version
        const { open, readTextFile } = tauriAPI;

        const filePath = await open({
          title: 'Open Flashcard Set',
          filters: [{ name: 'Flashcard Sets', extensions: ['json'] }],
        });

        if (!filePath) return null;

        const content = await readTextFile(filePath as string);
        const data = JSON.parse(content);

        if (!this.validateFlashcardSet(data)) {
          throw new Error('Invalid flashcard set file format');
        }

        await this.addToRecentFiles(filePath as string, 'set');
        return { set: data, filePath: filePath as string };
      } else {
        // Web version fallback
        const result = await webFileAPI.open();
        const data = JSON.parse(result.content);

        if (!this.validateFlashcardSet(data)) {
          throw new Error('Invalid flashcard set file format');
        }

        // For web version, use filename as the "path"
        const webFilePath = result.name;
        return { set: data, filePath: webFilePath };
      }
    } catch (error) {
      console.error('Error opening flashcard set:', error);
      throw error;
    }
  }

  static async openFlashcardSetByPath(filePath: string): Promise<FlashcardSet> {
    try {
      const tauriAPI = await getTauriAPI();

      if (tauriAPI) {
        // Desktop/Tauri version
        const { readTextFile } = tauriAPI;
        const content = await readTextFile(filePath);
        const data = JSON.parse(content);

        if (!this.validateFlashcardSet(data)) {
          throw new Error('Invalid flashcard set file format');
        }

        await this.addToRecentFiles(filePath, 'set');
        return data;
      } else {
        // Web version - cannot open by path, throw error
        throw new Error('Opening files by path is not supported in web version. Please use the file dialog.');
      }
    } catch (error) {
      console.error('Error opening flashcard set by path:', error);
      throw error;
    }
  }

  static async saveFlashcardSet(set: FlashcardSet, filePath?: string): Promise<string> {
    try {
      const tauriAPI = await getTauriAPI();

      // Update modified timestamp
      const updatedSet = {
        ...set,
        modifiedAt: new Date()
      };
      const content = JSON.stringify(updatedSet, null, 2);

      if (tauriAPI) {
        // Desktop/Tauri version
        const { save, writeTextFile } = tauriAPI;
        let targetPath = filePath;

        if (!targetPath) {
          const selectedPath = await save({
            title: 'Save Flashcard Set',
            defaultPath: `${set.name}.json`,
            filters: [{ name: 'Flashcard Sets', extensions: ['json'] }],
          });
          targetPath = selectedPath || undefined;
        }

        if (!targetPath) throw new Error('Save cancelled');

        await writeTextFile(targetPath, content);
        await this.addToRecentFiles(targetPath, 'set');
        return targetPath;
      } else {
        // Web version fallback
        const filename = filePath || `${set.name}.json`;
        await webFileAPI.save(filename, content);
        return filename;
      }
    } catch (error) {
      console.error('Error saving flashcard set:', error);
      throw error;
    }
  }

  static async openTemplate(): Promise<FlashcardTemplate | null> {
    try {
      const tauriAPI = await getTauriAPI();

      if (tauriAPI) {
        // Desktop/Tauri version
        const { open, readTextFile } = tauriAPI;

        const filePath = await open({
          title: 'Open Flashcard Template',
          filters: [{ name: 'Flashcard Templates', extensions: ['json'] }],
        });

        if (!filePath) return null;

        const content = await readTextFile(filePath as string);
        const data = JSON.parse(content);

        if (!this.validateTemplate(data)) {
          throw new Error('Invalid template file format');
        }

        await this.addToRecentFiles(filePath as string, 'template');
        return data;
      } else {
        // Web version fallback
        const result = await webFileAPI.open();
        const data = JSON.parse(result.content);

        if (!this.validateTemplate(data)) {
          throw new Error('Invalid template file format');
        }

        return data;
      }
    } catch (error) {
      console.error('Error opening template:', error);
      throw error;
    }
  }

  static async saveTemplate(template: FlashcardTemplate, filePath?: string): Promise<string> {
    try {
      const tauriAPI = await getTauriAPI();

      if (tauriAPI) {
        // Desktop/Tauri version
        const { save, writeTextFile } = tauriAPI;
        let targetPath = filePath;

        if (!targetPath) {
          const selectedPath = await save({
            title: 'Save Flashcard Template',
            defaultPath: `${template.name}.json`,
            filters: [{ name: 'Flashcard Templates', extensions: ['json'] }],
          });
          targetPath = selectedPath || undefined;
        }

        if (!targetPath) throw new Error('Save cancelled');

        const content = JSON.stringify(template, null, 2);
        await writeTextFile(targetPath, content);

        await this.addToRecentFiles(targetPath, 'template');
        return targetPath;
      } else {
        // Web version fallback
        const filename = filePath || `${template.name}.json`;
        const content = JSON.stringify(template, null, 2);
        await webFileAPI.save(filename, content);
        return filename;
      }
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  static async getRecentFiles(): Promise<FileMetadata[]> {
    try {
      const recent = localStorage.getItem(this.RECENT_FILES_KEY);
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      console.error('Error getting recent files:', error);
      return [];
    }
  }

  private static async addToRecentFiles(filePath: string, type: 'set' | 'template'): Promise<void> {
    try {
      const recentFiles = await this.getRecentFiles();
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown';

      // Get file stats for size and last modified
      let fileSize = 0;
      let lastModified = new Date();
      try {
        const tauriAPI = await getTauriAPI();
        if (tauriAPI) {
          const { stat } = tauriAPI;
          const fileStats = await stat(filePath);
          fileSize = fileStats.size || 0;
          lastModified = fileStats.mtime || new Date();
        }
      } catch (statError) {
        // Silently fail for web environment or stat errors
        console.debug('Could not get file stats (likely web environment):', statError);
      }

      const newFile: FileMetadata = {
        name: fileName,
        path: filePath,
        type,
        lastModified,
        size: fileSize,
      };

      // Remove existing entry if it exists
      const filtered = recentFiles.filter(f => f.path !== filePath);

      // Add to beginning and limit to max
      const updated = [newFile, ...filtered].slice(0, this.MAX_RECENT_FILES);

      localStorage.setItem(this.RECENT_FILES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating recent files:', error);
    }
  }

  private static validateFlashcardSet(data: any): data is FlashcardSet {
    try {
      return (
        data &&
        typeof data.id === 'string' &&
        typeof data.name === 'string' &&
        Array.isArray(data.flashcards) &&
        typeof data.version === 'string' &&
        data.createdAt &&
        data.modifiedAt &&
        // Validate flashcards structure
        data.flashcards.every((card: any) =>
          card &&
          typeof card.id === 'string' &&
          Array.isArray(card.sides) &&
          Array.isArray(card.arrows) &&
          // Validate sides
          card.sides.every((side: any) =>
            side &&
            typeof side.id === 'string' &&
            typeof side.value === 'string' &&
            side.position &&
            typeof side.position.x === 'number' &&
            typeof side.position.y === 'number'
          ) &&
          // Validate arrows
          card.arrows.every((arrow: any) =>
            arrow &&
            typeof arrow.id === 'string' &&
            typeof arrow.sourceId === 'string' &&
            typeof arrow.destinationId === 'string' &&
            typeof arrow.label === 'string'
          )
        )
      );
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  private static validateTemplate(data: any): data is FlashcardTemplate {
    try {
      return (
        data &&
        typeof data.id === 'string' &&
        typeof data.name === 'string' &&
        Array.isArray(data.sides) &&
        Array.isArray(data.arrows) &&
        data.createdAt &&
        // Validate sides structure (no id or value in template)
        data.sides.every((side: any) =>
          side &&
          side.position &&
          typeof side.position.x === 'number' &&
          typeof side.position.y === 'number'
        ) &&
        // Validate arrows structure (using indices, not IDs)
        data.arrows.every((arrow: any) =>
          arrow &&
          typeof arrow.sourceIndex === 'number' &&
          arrow.sourceIndex >= 0 &&
          arrow.sourceIndex < data.sides.length &&
          typeof arrow.destinationIndex === 'number' &&
          arrow.destinationIndex >= 0 &&
          arrow.destinationIndex < data.sides.length &&
          typeof arrow.label === 'string'
        )
      );
    } catch (error) {
      console.error('Template validation error:', error);
      return false;
    }
  }

  static createNewSet(name: string = 'New Flashcard Set'): FlashcardSet {
    return {
      id: this.generateId(),
      name,
      description: '',
      flashcards: [],
      version: '1.0.0',
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
  }

  // Phase 4: Template creation is handled by TemplateService.createTemplateFromFlashcard()
  // Use TemplateService for template operations

  private static generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  static async exportToCSV(_set: FlashcardSet): Promise<string> {
    // Phase 3: Implementation for CSV export
    throw new Error('Not implemented - Phase 3 feature');
  }

  static async importFromCSV(_filePath: string): Promise<FlashcardSet> {
    // Phase 3: Implementation for CSV import
    throw new Error('Not implemented - Phase 3 feature');
  }
}