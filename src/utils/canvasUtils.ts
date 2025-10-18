import { Position, FlashcardSide, Arrow, CanvasState } from '../types';

export class CanvasUtils {
  static screenToCanvas(
    screenPos: Position,
    canvasState: CanvasState,
    canvasElement: HTMLCanvasElement
  ): Position {
    const rect = canvasElement.getBoundingClientRect();
    return {
      x: (screenPos.x - rect.left - canvasState.panOffset.x) / canvasState.zoom,
      y: (screenPos.y - rect.top - canvasState.panOffset.y) / canvasState.zoom,
    };
  }

  static canvasToScreen(
    canvasPos: Position,
    canvasState: CanvasState
  ): Position {
    return {
      x: canvasPos.x * canvasState.zoom + canvasState.panOffset.x,
      y: canvasPos.y * canvasState.zoom + canvasState.panOffset.y,
    };
  }

  static snapToGrid(position: Position, gridSize: number): Position {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    };
  }

  static isPointInSide(point: Position, side: FlashcardSide): boolean {
    const width = side.width || 100;
    const height = side.height || 60;

    return (
      point.x >= side.position.x &&
      point.x <= side.position.x + width &&
      point.y >= side.position.y &&
      point.y <= side.position.y + height
    );
  }

  static isPointNearArrow(
    point: Position,
    arrow: Arrow,
    sides: FlashcardSide[],
    allArrows: Arrow[],
    tolerance: number = 10
  ): boolean {
    // Get the advanced arrow path (skip collision detection to avoid recursion)
    const pathPoints = this.calculateAdvancedArrowPath(arrow, allArrows, sides, true);

    if (pathPoints.length < 2) return false;

    // Check distance to each line segment in the path
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const distance = this.distanceToLineSegment(point, pathPoints[i], pathPoints[i + 1]);
      if (distance <= tolerance) {
        return true;
      }
    }

    return false;
  }

  static getSideCenter(side: FlashcardSide): Position {
    const width = side.width || 100;
    const height = side.height || 60;

    return {
      x: side.position.x + width / 2,
      y: side.position.y + height / 2,
    };
  }

  static determineEdgeFromVector(fromSide: FlashcardSide, toSide: FlashcardSide): 'top' | 'bottom' | 'left' | 'right' {
    const fromCenter = this.getSideCenter(fromSide);
    const toCenter = this.getSideCenter(toSide);

    const fromWidth = fromSide.width || 100;
    const fromHeight = fromSide.height || 60;

    // Vector from source center to destination center
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;

    // Calculate intersection points with each edge
    const edges = {
      right: { distance: Infinity, edge: 'right' as const },
      left: { distance: Infinity, edge: 'left' as const },
      bottom: { distance: Infinity, edge: 'bottom' as const },
      top: { distance: Infinity, edge: 'top' as const }
    };

    // Right edge intersection
    if (dx > 0) {
      const t = (fromWidth / 2) / dx;
      const intersectY = fromCenter.y + dy * t;
      if (intersectY >= fromSide.position.y && intersectY <= fromSide.position.y + fromHeight) {
        edges.right.distance = Math.sqrt((fromWidth / 2) ** 2 + (dy * t) ** 2);
      }
    }

    // Left edge intersection
    if (dx < 0) {
      const t = (-fromWidth / 2) / dx;
      const intersectY = fromCenter.y + dy * t;
      if (intersectY >= fromSide.position.y && intersectY <= fromSide.position.y + fromHeight) {
        edges.left.distance = Math.sqrt((fromWidth / 2) ** 2 + (dy * t) ** 2);
      }
    }

    // Bottom edge intersection
    if (dy > 0) {
      const t = (fromHeight / 2) / dy;
      const intersectX = fromCenter.x + dx * t;
      if (intersectX >= fromSide.position.x && intersectX <= fromSide.position.x + fromWidth) {
        edges.bottom.distance = Math.sqrt((dx * t) ** 2 + (fromHeight / 2) ** 2);
      }
    }

    // Top edge intersection
    if (dy < 0) {
      const t = (-fromHeight / 2) / dy;
      const intersectX = fromCenter.x + dx * t;
      if (intersectX >= fromSide.position.x && intersectX <= fromSide.position.x + fromWidth) {
        edges.top.distance = Math.sqrt((dx * t) ** 2 + (fromHeight / 2) ** 2);
      }
    }

    // Find the edge with the shortest distance (where vector exits)
    let closestEdge = 'right';
    let minDistance = Infinity;

    Object.values(edges).forEach(({ distance, edge }) => {
      if (distance < minDistance) {
        minDistance = distance;
        closestEdge = edge;
      }
    });

    return closestEdge as 'top' | 'bottom' | 'left' | 'right';
  }


  private static distanceToLineSegment(
    point: Position,
    lineStart: Position,
    lineEnd: Position
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  static calculateAdvancedArrowPath(
    arrow: Arrow,
    allArrows: Arrow[],
    sides: FlashcardSide[],
    skipCollisionDetection: boolean = false
  ): Position[] {
    const sourceSide = sides.find(s => s.id === arrow.sourceId);
    const destSide = sides.find(s => s.id === arrow.destinationId);

    if (!sourceSide || !destSide) return [];

    // Determine which edges the arrow exits and enters
    const sourceEdge = this.determineEdgeFromVector(sourceSide, destSide);
    const destEdge = this.determineEdgeFromVector(destSide, sourceSide);

    // Get connection points from each side
    const sourcePoint = this.getSideEdgeConnectionPoint(sourceSide, sourceEdge, arrow, allArrows, sides);
    const destPoint = this.getSideEdgeConnectionPoint(destSide, destEdge, arrow, allArrows, sides);

    // Calculate path with required travel distance
    const initialPath = this.calculateArrowPathWithTravel(sourcePoint, destPoint, sourceEdge, destEdge, sourceSide, destSide);

    // Apply collision avoidance only if not already in collision detection mode
    if (skipCollisionDetection) {
      return initialPath;
    }

    const path = this.adjustPathForCollisions(initialPath, sides, allArrows, arrow, sourceEdge, destEdge, sourceSide, destSide);

    return path;
  }

  static getSideEdgeConnectionPoint(
    side: FlashcardSide,
    edge: 'top' | 'bottom' | 'left' | 'right',
    currentArrow: Arrow,
    allArrows: Arrow[],
    sides: FlashcardSide[]
  ): Position {
    // Get all arrows that connect to this edge of this side (both inbound and outbound)
    const edgeArrows = allArrows.filter(arrow => {
      const sourceSide = sides.find(s => s.id === arrow.sourceId);
      const destSide = sides.find(s => s.id === arrow.destinationId);

      if (!sourceSide || !destSide) return false;

      // Check if this arrow uses this edge as source (outbound from this side)
      if (sourceSide.id === side.id) {
        return this.determineEdgeFromVector(sourceSide, destSide) === edge;
      }

      // Check if this arrow uses this edge as destination (inbound to this side)
      if (destSide.id === side.id) {
        // For inbound arrows, we need to determine which edge of the destination they connect to
        // This is the opposite edge from where they exit the source
        return this.determineEdgeFromVector(destSide, sourceSide) === edge;
      }

      return false;
    });

    // Sort all arrows on this edge by the position of their "other end"
    const sortedEdgeArrows = edgeArrows.sort((a, b) => {
      // For each arrow, find the "other side" (the side it connects to that's not the current side)
      const aOtherSide = a.sourceId === side.id
        ? sides.find(s => s.id === a.destinationId)
        : sides.find(s => s.id === a.sourceId);

      const bOtherSide = b.sourceId === side.id
        ? sides.find(s => s.id === b.destinationId)
        : sides.find(s => s.id === b.sourceId);

      if (!aOtherSide || !bOtherSide) return 0;

      const aCenter = this.getSideCenter(aOtherSide);
      const bCenter = this.getSideCenter(bOtherSide);

      if (edge === 'top' || edge === 'bottom') {
        // Horizontal edge: sort by X coordinate of the other side
        const xDiff = bCenter.x - aCenter.x;
        if (Math.abs(xDiff) > 5) return xDiff; // 5px tolerance

        // If same other side, sort by source/destination priority
        if (Math.abs(xDiff) <= 5 && aOtherSide.id === bOtherSide.id) {
          const aIsSource = a.sourceId === side.id;
          const bIsSource = b.sourceId === side.id;
          if (aIsSource !== bIsSource) {
            return aIsSource ? 1 : -1; // Source arrows (larger) after destination arrows (smaller)
          }
        }

        return Math.abs(aCenter.y) - Math.abs(bCenter.y);
      } else {
        // Vertical edge: sort by Y coordinate of the other side
        const yDiff = bCenter.y - aCenter.y;
        if (Math.abs(yDiff) > 5) return yDiff; // 5px tolerance

        // If same other side, sort by source/destination priority
        if (Math.abs(yDiff) <= 5 && aOtherSide.id === bOtherSide.id) {
          const aIsSource = a.sourceId === side.id;
          const bIsSource = b.sourceId === side.id;
          if (aIsSource !== bIsSource) {
            return aIsSource ? 1 : -1; // Source arrows (larger) after destination arrows (smaller)
          }
        }

        return Math.abs(aCenter.x) - Math.abs(bCenter.x);
      }
    });

    // Find the position of the current arrow in the sorted list
    const arrowIndex = sortedEdgeArrows.findIndex(a => a.id === currentArrow.id);
    const totalArrows = sortedEdgeArrows.length;

    // Calculate the connection point on this edge
    return this.getArrowEdgePoint(side, edge, arrowIndex, totalArrows);
  }


  static getArrowEdgePoint(
    side: FlashcardSide,
    edge: 'top' | 'bottom' | 'left' | 'right',
    arrowIndex: number,
    totalArrows: number
  ): Position {
    const width = side.width || 100;
    const height = side.height || 60;

    // Distribute arrows in the middle 80% of the edge
    const distribution = totalArrows > 1 ? (arrowIndex / (totalArrows - 1)) : 0.5;
    const adjustedDistribution = 0.1 + distribution * 0.8; // Map to 10%-90% of edge

    switch (edge) {
      case 'top':
        return {
          x: side.position.x + width * adjustedDistribution,
          y: side.position.y
        };
      case 'bottom':
        // Bottom edge: right-to-left placement
        return {
          x: side.position.x + width * (1 - adjustedDistribution),
          y: side.position.y + height
        };
      case 'left':
        return {
          x: side.position.x,
          y: side.position.y + height * adjustedDistribution
        };
      case 'right':
        // Right edge: bottom-to-top placement
        return {
          x: side.position.x + width,
          y: side.position.y + height * (1 - adjustedDistribution)
        };
      default:
        return this.getSideCenter(side);
    }
  }

  static calculateArrowPathWithTravel(
    sourcePoint: Position,
    destPoint: Position,
    sourceEdge: 'top' | 'bottom' | 'left' | 'right',
    _destEdge: 'top' | 'bottom' | 'left' | 'right',
    _sourceSide: FlashcardSide,
    _destSide: FlashcardSide
  ): Position[] {
    const dx = destPoint.x - sourcePoint.x;
    const dy = destPoint.y - sourcePoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Minimum travel distance: 20% of total distance or 40 pixels, whichever is larger
    const minTravel = Math.max(distance * 0.2, 40);

    let firstCorner: Position;
    let secondCorner: Position;

    // Determine path based on source edge
    if (sourceEdge === 'left' || sourceEdge === 'right') {
      // Horizontal travel first
      const travelX = sourceEdge === 'right' ? minTravel : -minTravel;
      firstCorner = {
        x: sourcePoint.x + travelX,
        y: sourcePoint.y
      };

      // Then vertical to align with destination
      secondCorner = {
        x: firstCorner.x,
        y: destPoint.y
      };
    } else {
      // Vertical travel first
      const travelY = sourceEdge === 'bottom' ? minTravel : -minTravel;
      firstCorner = {
        x: sourcePoint.x,
        y: sourcePoint.y + travelY
      };

      // Then horizontal to align with destination
      secondCorner = {
        x: destPoint.x,
        y: firstCorner.y
      };
    }

    return [sourcePoint, firstCorner, secondCorner, destPoint];
  }


  static drawGrid(
    ctx: CanvasRenderingContext2D,
    canvasState: CanvasState,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!canvasState.gridSnapEnabled) return;

    ctx.save();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    const gridSize = canvasState.gridSize * canvasState.zoom;
    const offsetX = canvasState.panOffset.x % gridSize;
    const offsetY = canvasState.panOffset.y % gridSize;

    ctx.beginPath();
    for (let x = offsetX; x < canvasWidth; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
    }
    for (let y = offsetY; y < canvasHeight; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Collision detection utilities
  static lineIntersectsRectangle(
    lineStart: Position,
    lineEnd: Position,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
  ): boolean {
    // Check if line intersects any of the four rectangle edges
    const edges = [
      { start: { x: rectX, y: rectY }, end: { x: rectX + rectWidth, y: rectY } }, // top
      { start: { x: rectX + rectWidth, y: rectY }, end: { x: rectX + rectWidth, y: rectY + rectHeight } }, // right
      { start: { x: rectX + rectWidth, y: rectY + rectHeight }, end: { x: rectX, y: rectY + rectHeight } }, // bottom
      { start: { x: rectX, y: rectY + rectHeight }, end: { x: rectX, y: rectY } } // left
    ];

    return edges.some(edge => this.lineSegmentsIntersect(lineStart, lineEnd, edge.start, edge.end));
  }

  static lineSegmentsIntersect(
    p1: Position,
    p2: Position,
    p3: Position,
    p4: Position
  ): boolean {
    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

    if (denominator === 0) return false; // Lines are parallel

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  static checkMiddleSegmentCollisions(
    path: Position[],
    allSides: FlashcardSide[],
    allArrows: Arrow[],
    currentArrow: Arrow
  ): boolean {
    if (path.length !== 4) return false;

    const middleSegment = { start: path[1], end: path[2] };

    // Check collision with all sides except source and destination
    const sourceSideId = currentArrow.sourceId;
    const destSideId = currentArrow.destinationId;

    for (const side of allSides) {
      if (side.id === sourceSideId || side.id === destSideId) continue;

      const width = side.width || 100;
      const height = side.height || 60;

      if (this.lineIntersectsRectangle(
        middleSegment.start,
        middleSegment.end,
        side.position.x,
        side.position.y,
        width,
        height
      )) {
        return true;
      }
    }

    // Check collision with other arrows
    for (const arrow of allArrows) {
      if (arrow.id === currentArrow.id) continue;

      const otherPath = this.calculateAdvancedArrowPath(arrow, allArrows, allSides, true);
      if (otherPath.length < 2) continue;

      // Check intersection with each segment of the other arrow
      for (let i = 0; i < otherPath.length - 1; i++) {
        if (this.lineSegmentsIntersect(
          middleSegment.start,
          middleSegment.end,
          otherPath[i],
          otherPath[i + 1]
        )) {
          return true;
        }
      }
    }

    return false;
  }

  static adjustPathForCollisions(
    originalPath: Position[],
    allSides: FlashcardSide[],
    allArrows: Arrow[],
    currentArrow: Arrow,
    sourceEdge: 'top' | 'bottom' | 'left' | 'right',
    _destEdge: 'top' | 'bottom' | 'left' | 'right',
    _sourceSide: FlashcardSide,
    _destSide: FlashcardSide
  ): Position[] {
    if (originalPath.length !== 4) return originalPath;

    if (!this.checkMiddleSegmentCollisions(originalPath, allSides, allArrows, currentArrow)) {
      return originalPath; // No collision, return original path
    }

    // Try adjusting the path by expanding the travel distance
    const sourcePoint = originalPath[0];
    const destPoint = originalPath[3];
    const dx = destPoint.x - sourcePoint.x;
    const dy = destPoint.y - sourcePoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Try progressively larger travel distances
    const baseTravelDistance = Math.max(distance * 0.2, 40);
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const travelMultiplier = 1 + (attempt * 0.5); // 1.5x, 2x, 2.5x, 3x, 3.5x
      const adjustedTravel = baseTravelDistance * travelMultiplier;

      let firstCorner: Position;
      let secondCorner: Position;

      // Calculate adjusted path with larger travel distance
      if (sourceEdge === 'left' || sourceEdge === 'right') {
        const travelX = sourceEdge === 'right' ? adjustedTravel : -adjustedTravel;
        firstCorner = {
          x: sourcePoint.x + travelX,
          y: sourcePoint.y
        };
        secondCorner = {
          x: firstCorner.x,
          y: destPoint.y
        };
      } else {
        const travelY = sourceEdge === 'bottom' ? adjustedTravel : -adjustedTravel;
        firstCorner = {
          x: sourcePoint.x,
          y: sourcePoint.y + travelY
        };
        secondCorner = {
          x: destPoint.x,
          y: firstCorner.y
        };
      }

      const adjustedPath = [sourcePoint, firstCorner, secondCorner, destPoint];

      // Check if this adjusted path avoids collisions
      if (!this.checkMiddleSegmentCollisions(adjustedPath, allSides, allArrows, currentArrow)) {
        return adjustedPath;
      }
    }

    // If we still have collisions, try the opposite direction
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const travelMultiplier = 1 + (attempt * 0.5);
      const adjustedTravel = baseTravelDistance * travelMultiplier;

      let firstCorner: Position;
      let secondCorner: Position;

      // Calculate path in opposite direction
      if (sourceEdge === 'left' || sourceEdge === 'right') {
        const travelX = sourceEdge === 'left' ? adjustedTravel : -adjustedTravel; // Opposite direction
        firstCorner = {
          x: sourcePoint.x + travelX,
          y: sourcePoint.y
        };
        secondCorner = {
          x: firstCorner.x,
          y: destPoint.y
        };
      } else {
        const travelY = sourceEdge === 'top' ? adjustedTravel : -adjustedTravel; // Opposite direction
        firstCorner = {
          x: sourcePoint.x,
          y: sourcePoint.y + travelY
        };
        secondCorner = {
          x: destPoint.x,
          y: firstCorner.y
        };
      }

      const adjustedPath = [sourcePoint, firstCorner, secondCorner, destPoint];

      if (!this.checkMiddleSegmentCollisions(adjustedPath, allSides, allArrows, currentArrow)) {
        return adjustedPath;
      }
    }

    // If all attempts fail, return original path (better than no path)
    return originalPath;
  }

  // Arrow label positioning with collision avoidance
  static findOptimalLabelPosition(
    arrowPath: Position[],
    labelWidth: number,
    labelHeight: number,
    allSides: FlashcardSide[],
    allArrows: Arrow[],
    currentArrow: Arrow,
    sides: FlashcardSide[]
  ): Position {
    if (arrowPath.length < 2) {
      return arrowPath[0] || { x: 0, y: 0 };
    }

    // Calculate total path length (for future use if needed)
    // const totalLength = this.calculatePathLength(arrowPath);

    // Try positions from 30% to 70% of the path length
    const startPercent = 0.3;
    const endPercent = 0.7;
    const preferredPercent = 0.5; // Prefer center

    // First try the preferred center position
    const centerPos = this.getPositionAtPercent(arrowPath, preferredPercent);
    if (!this.labelCollidesWithElements(centerPos, labelWidth, labelHeight, allSides, allArrows, currentArrow, sides)) {
      return centerPos;
    }

    // Try positions in increments, alternating around center
    const increment = 0.05; // 5% increments
    for (let offset = increment; offset <= 0.2; offset += increment) {
      // Try position before center
      const beforePercent = preferredPercent - offset;
      if (beforePercent >= startPercent) {
        const beforePos = this.getPositionAtPercent(arrowPath, beforePercent);
        if (!this.labelCollidesWithElements(beforePos, labelWidth, labelHeight, allSides, allArrows, currentArrow, sides)) {
          return beforePos;
        }
      }

      // Try position after center
      const afterPercent = preferredPercent + offset;
      if (afterPercent <= endPercent) {
        const afterPos = this.getPositionAtPercent(arrowPath, afterPercent);
        if (!this.labelCollidesWithElements(afterPos, labelWidth, labelHeight, allSides, allArrows, currentArrow, sides)) {
          return afterPos;
        }
      }
    }

    // If no collision-free position found, find position with least severe collision
    // Prefer colliding with arrows over sides
    let bestPosition = centerPos;
    let bestScore = this.calculateCollisionScore(centerPos, labelWidth, labelHeight, allSides, allArrows, currentArrow, sides);

    for (let percent = startPercent; percent <= endPercent; percent += increment) {
      const pos = this.getPositionAtPercent(arrowPath, percent);
      const score = this.calculateCollisionScore(pos, labelWidth, labelHeight, allSides, allArrows, currentArrow, sides);

      if (score < bestScore) {
        bestScore = score;
        bestPosition = pos;
      }
    }

    return bestPosition;
  }

  static calculatePathLength(path: Position[]): number {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  static getPositionAtPercent(path: Position[], percent: number): Position {
    if (path.length < 2) return path[0] || { x: 0, y: 0 };

    const totalLength = this.calculatePathLength(path);
    const targetLength = totalLength * percent;

    let currentLength = 0;

    for (let i = 1; i < path.length; i++) {
      const segmentStart = path[i - 1];
      const segmentEnd = path[i];

      const dx = segmentEnd.x - segmentStart.x;
      const dy = segmentEnd.y - segmentStart.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      if (currentLength + segmentLength >= targetLength) {
        // Target position is within this segment
        const remainingLength = targetLength - currentLength;
        const segmentPercent = remainingLength / segmentLength;

        return {
          x: segmentStart.x + dx * segmentPercent,
          y: segmentStart.y + dy * segmentPercent
        };
      }

      currentLength += segmentLength;
    }

    // If we get here, return the last position
    return path[path.length - 1];
  }

  static labelCollidesWithElements(
    labelPos: Position,
    labelWidth: number,
    labelHeight: number,
    allSides: FlashcardSide[],
    allArrows: Arrow[],
    currentArrow: Arrow,
    sides: FlashcardSide[]
  ): boolean {
    const labelRect = {
      x: labelPos.x - labelWidth / 2,
      y: labelPos.y - labelHeight / 2,
      width: labelWidth,
      height: labelHeight
    };

    // Check collision with sides (excluding source and destination of current arrow)
    for (const side of allSides) {
      if (side.id === currentArrow.sourceId || side.id === currentArrow.destinationId) continue;

      const sideWidth = side.width || 100;
      const sideHeight = side.height || 60;

      if (this.rectanglesOverlap(
        labelRect.x, labelRect.y, labelRect.width, labelRect.height,
        side.position.x, side.position.y, sideWidth, sideHeight
      )) {
        return true;
      }
    }

    // Check collision with other arrow paths
    for (const arrow of allArrows) {
      if (arrow.id === currentArrow.id) continue;

      const otherPath = this.calculateAdvancedArrowPath(arrow, allArrows, sides, true);
      if (otherPath.length < 2) continue;

      // Check if label overlaps with any segment of the other arrow
      for (let i = 0; i < otherPath.length - 1; i++) {
        if (this.lineIntersectsRectangle(
          otherPath[i],
          otherPath[i + 1],
          labelRect.x,
          labelRect.y,
          labelRect.width,
          labelRect.height
        )) {
          return true;
        }
      }
    }

    return false;
  }

  static calculateCollisionScore(
    labelPos: Position,
    labelWidth: number,
    labelHeight: number,
    allSides: FlashcardSide[],
    allArrows: Arrow[],
    currentArrow: Arrow,
    sides: FlashcardSide[]
  ): number {
    let score = 0;
    const labelRect = {
      x: labelPos.x - labelWidth / 2,
      y: labelPos.y - labelHeight / 2,
      width: labelWidth,
      height: labelHeight
    };

    // Higher penalty for colliding with sides
    for (const side of allSides) {
      if (side.id === currentArrow.sourceId || side.id === currentArrow.destinationId) continue;

      const sideWidth = side.width || 100;
      const sideHeight = side.height || 60;

      if (this.rectanglesOverlap(
        labelRect.x, labelRect.y, labelRect.width, labelRect.height,
        side.position.x, side.position.y, sideWidth, sideHeight
      )) {
        score += 100; // High penalty for side collision
      }
    }

    // Lower penalty for colliding with arrows
    for (const arrow of allArrows) {
      if (arrow.id === currentArrow.id) continue;

      const otherPath = this.calculateAdvancedArrowPath(arrow, allArrows, sides, true);
      if (otherPath.length < 2) continue;

      for (let i = 0; i < otherPath.length - 1; i++) {
        if (this.lineIntersectsRectangle(
          otherPath[i],
          otherPath[i + 1],
          labelRect.x,
          labelRect.y,
          labelRect.width,
          labelRect.height
        )) {
          score += 10; // Lower penalty for arrow collision
        }
      }
    }

    return score;
  }

  static rectanglesOverlap(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
  }
}