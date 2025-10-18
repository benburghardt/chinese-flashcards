// Phase 4: Template Management Service
import { Flashcard, FlashcardTemplate, FlashcardSide, Arrow } from '../types';

export class TemplateService {
  /**
   * Create a template from an existing flashcard
   * Extracts the structure (positions, colors, arrow connections) without content
   */
  static createTemplateFromFlashcard(
    flashcard: Flashcard,
    templateName: string,
    templateDescription?: string
  ): FlashcardTemplate {
    // Map sides to template format (without id and value)
    const templateSides = flashcard.sides.map(side => ({
      position: { ...side.position },
      color: side.color,
      fontSize: side.fontSize,
      width: side.width,
      height: side.height,
    }));

    // Map arrows to template format (using indices instead of IDs)
    const templateArrows = flashcard.arrows.map(arrow => {
      const sourceIndex = flashcard.sides.findIndex(s => s.id === arrow.sourceId);
      const destinationIndex = flashcard.sides.findIndex(s => s.id === arrow.destinationId);

      return {
        sourceIndex,
        destinationIndex,
        label: arrow.label,
        color: arrow.color,
        style: arrow.style,
      };
    });

    return {
      id: this.generateTemplateId(),
      name: templateName,
      description: templateDescription,
      sides: templateSides,
      arrows: templateArrows,
      createdAt: new Date(),
    };
  }

  /**
   * Apply a template to create a new flashcard
   * Creates sides and arrows based on template structure
   */
  static applyTemplateToNewFlashcard(
    template: FlashcardTemplate,
    flashcardName: string
  ): Flashcard {
    const now = new Date();

    // Create sides from template with generated IDs
    const sides: FlashcardSide[] = template.sides.map((templateSide) => ({
      id: this.generateId(),
      value: '', // Start with empty values
      position: { ...templateSide.position },
      color: templateSide.color,
      fontSize: templateSide.fontSize,
      width: templateSide.width,
      height: templateSide.height,
    }));

    // Create arrows from template using the new side IDs
    const arrows: Arrow[] = template.arrows.map(templateArrow => ({
      id: this.generateId(),
      sourceId: sides[templateArrow.sourceIndex].id,
      destinationId: sides[templateArrow.destinationIndex].id,
      label: templateArrow.label,
      color: templateArrow.color,
      style: templateArrow.style,
    }));

    return {
      id: this.generateId(),
      name: flashcardName,
      sides,
      arrows,
      createdAt: now,
      modifiedAt: now,
    };
  }

  /**
   * Validate template structure
   * Ensures template has valid indices and structure
   */
  static validateTemplate(template: FlashcardTemplate): boolean {
    try {
      // Check required fields
      if (!template.id || !template.name || !template.sides || !template.arrows) {
        return false;
      }

      // Check sides array
      if (!Array.isArray(template.sides) || template.sides.length === 0) {
        return false;
      }

      // Validate each arrow's indices
      for (const arrow of template.arrows) {
        if (
          arrow.sourceIndex < 0 ||
          arrow.sourceIndex >= template.sides.length ||
          arrow.destinationIndex < 0 ||
          arrow.destinationIndex >= template.sides.length
        ) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Template validation error:', error);
      return false;
    }
  }

  /**
   * Get template preview information
   * Returns summary of template structure for UI display
   */
  static getTemplatePreview(template: FlashcardTemplate): {
    sideCount: number;
    arrowCount: number;
    name: string;
    description?: string;
  } {
    return {
      sideCount: template.sides.length,
      arrowCount: template.arrows.length,
      name: template.name,
      description: template.description,
    };
  }

  /**
   * Duplicate a flashcard as a new flashcard with same structure but empty values
   * This creates a new flashcard from an existing one, preserving positions and arrows
   * but clearing all side values and arrow labels
   */
  static duplicateFlashcardAsTemplate(
    sourceFlashcard: Flashcard,
    newFlashcardName: string
  ): Flashcard {
    const now = new Date();

    // Create a mapping from old IDs to new IDs
    const idMap = new Map<string, string>();
    sourceFlashcard.sides.forEach(side => {
      idMap.set(side.id, this.generateId());
    });

    // Clone sides with empty values but same positions
    const newSides: FlashcardSide[] = sourceFlashcard.sides.map(side => ({
      id: idMap.get(side.id)!,
      value: '', // Empty value
      position: { ...side.position },
      color: side.color,
      fontSize: side.fontSize,
      width: side.width,
      height: side.height,
    }));

    // Clone arrows with empty labels but same relationships
    const newArrows: Arrow[] = sourceFlashcard.arrows.map(arrow => ({
      id: this.generateId(),
      sourceId: idMap.get(arrow.sourceId)!,
      destinationId: idMap.get(arrow.destinationId)!,
      label: '', // Empty label
      color: arrow.color,
      style: arrow.style,
    }));

    return {
      id: this.generateId(),
      name: newFlashcardName,
      sides: newSides,
      arrows: newArrows,
      createdAt: now,
      modifiedAt: now,
    };
  }

  /**
   * Generate a unique ID for flashcards/sides/arrows
   */
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Generate a unique template ID
   */
  private static generateTemplateId(): string {
    return 'template-' + Math.random().toString(36).substring(2, 11);
  }
}
