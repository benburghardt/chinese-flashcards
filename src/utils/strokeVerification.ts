import { Point, Stroke } from "../components/WritingPractice/DrawingCanvas";

interface MedianPoint {
  x: number;
  y: number;
}

interface StrokeMedian {
  points: MedianPoint[];
}

interface CharacterGeometry {
  center: MedianPoint;
  strokes: StrokeMedian[];
}

interface VerificationResult {
  isCorrect: boolean;
  strokeResults: StrokeResult[];
  totalScore: number;
  feedback: string;
}

interface StrokeResult {
  strokeIndex: number;
  isCorrect: boolean;
  score: number; // 0-1, where 1 is perfect match
  feedback: "correct" | "wrong_order" | "wrong_shape" | "missing" | "extra";
}

/**
 * Normalize points to a 0-1 range based on bounding box
 */
function normalizePoints(points: Point[]): Point[] {
  if (points.length === 0) return [];

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;

  return points.map((p) => ({
    x: (p.x - minX) / width,
    y: (p.y - minY) / height,
  }));
}

/**
 * Resample a stroke to have a specific number of points
 * Uses linear interpolation between points
 */
function resampleStroke(points: Point[], targetCount: number): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(targetCount).fill(points[0]);
  if (targetCount === 1) return [points[0]];

  // Calculate total path length
  const segments: number[] = [];
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const length = Math.sqrt(dx * dx + dy * dy);
    segments.push(length);
    totalLength += length;
  }

  if (totalLength === 0) return Array(targetCount).fill(points[0]);

  const resampled: Point[] = [];
  const step = totalLength / (targetCount - 1);

  resampled.push({ ...points[0] });

  let currentDistance = 0;
  let currentSegment = 0;
  let segmentProgress = 0;

  for (let i = 1; i < targetCount - 1; i++) {
    const targetDistance = i * step;

    while (currentDistance + segments[currentSegment] - segmentProgress < targetDistance) {
      currentDistance += segments[currentSegment] - segmentProgress;
      segmentProgress = 0;
      currentSegment++;

      if (currentSegment >= segments.length) {
        // Ran out of segments - fill remaining points with the last point
        console.warn(`Ran out of segments at i=${i}, filling ${targetCount - 1 - i} remaining points with last point`);
        while (resampled.length < targetCount - 1) {
          resampled.push({ ...points[points.length - 1] });
        }
        resampled.push({ ...points[points.length - 1] });
        return resampled;
      }
    }

    const remainingDistance = targetDistance - currentDistance;
    const t = (segmentProgress + remainingDistance) / segments[currentSegment];

    const p1 = points[currentSegment];
    const p2 = points[currentSegment + 1];

    resampled.push({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
    });

    segmentProgress += remainingDistance;
  }

  resampled.push({ ...points[points.length - 1] });

  return resampled;
}

/**
 * Calculate the average distance between two sets of points
 * Points must have the same length
 */
function calculateAverageDistance(points1: Point[], points2: Point[]): number {
  if (points1.length !== points2.length || points1.length === 0) {
    return Infinity;
  }

  let totalDistance = 0;
  for (let i = 0; i < points1.length; i++) {
    const dx = points1[i].x - points2[i].x;
    const dy = points1[i].y - points2[i].y;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }

  return totalDistance / points1.length;
}

/**
 * Calculate Hausdorff distance between two sets of points
 * This gives the maximum distance from any point in one set to the nearest point in the other
 */
function calculateHausdorffDistance(points1: Point[], points2: Point[]): number {
  if (points1.length === 0 || points2.length === 0) return Infinity;

  const directed1to2 = Math.max(
    ...points1.map((p1) =>
      Math.min(
        ...points2.map((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          return Math.sqrt(dx * dx + dy * dy);
        })
      )
    )
  );

  const directed2to1 = Math.max(
    ...points2.map((p2) =>
      Math.min(
        ...points1.map((p1) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          return Math.sqrt(dx * dx + dy * dy);
        })
      )
    )
  );

  return Math.max(directed1to2, directed2to1);
}

/**
 * Calculate a directional vector from a point along a stroke
 * Sample points at percentage intervals to capture stroke shape
 */
function getDirectionalVectors(points: Point[], sampleCount: number = 5): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ x: 0, y: 0 }];

  const vectors: Point[] = [];

  console.log(`    Getting vectors from ${points.length} points, sampling ${sampleCount} times`);

  for (let i = 0; i < sampleCount - 1; i++) {
    const startPct = i / (sampleCount - 1);
    const endPct = (i + 1) / (sampleCount - 1);

    const startIdx = Math.floor(startPct * (points.length - 1));
    const endIdx = Math.floor(endPct * (points.length - 1));

    const start = points[startIdx];
    const end = points[endIdx];

    console.log(`      Segment ${i}: [${startIdx}] (${start.x.toFixed(1)}, ${start.y.toFixed(1)}) -> [${endIdx}] (${end.x.toFixed(1)}, ${end.y.toFixed(1)})`);

    // Create unit vector (normalized direction)
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      const vec = {
        x: dx / length,
        y: dy / length
      };
      vectors.push(vec);
      console.log(`      -> vector: (${vec.x.toFixed(3)}, ${vec.y.toFixed(3)})`);
    } else {
      vectors.push({ x: 0, y: 0 });
      console.log(`      -> zero vector (same point)`);
    }
  }

  return vectors;
}

/**
 * Calculate the distance between start and end points of a stroke
 */
function getStrokeLength(points: Point[]): number {
  if (points.length === 0) return 0;
  const start = points[0];
  const end = points[points.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compare two strokes using only shape similarity (directional vectors)
 * Position and scale are handled at the multi-stroke level
 */
function compareStrokeShape(userStroke: Point[], referenceStroke: Point[]): number {
  if (userStroke.length === 0 || referenceStroke.length === 0) return 0;

  console.log("  Comparing stroke shape:");
  console.log("    User stroke: ", userStroke.length, "points");
  console.log("    Reference stroke:", referenceStroke.length, "points");

  // Use directional vectors to compare shape (scale and position invariant)
  const sampleCount = 5;
  const userVectors = getDirectionalVectors(userStroke, sampleCount);
  const refVectors = getDirectionalVectors(referenceStroke, sampleCount);

  if (userVectors.length !== refVectors.length) return 0;

  let totalSimilarity = 0;
  for (let i = 0; i < userVectors.length; i++) {
    const dotProduct = userVectors[i].x * refVectors[i].x + userVectors[i].y * refVectors[i].y;
    // Map dot product to 0-1 range
    let similarity = (dotProduct + 1) / 2;

    // Apply power curve to be more forgiving of small angle differences
    // Power of 0.5 (square root) makes the curve more lenient
    // This gives more partial credit for angles that are "close enough"
    similarity = Math.pow(similarity, 0.5);

    totalSimilarity += similarity;
  }

  const shapeScore = totalSimilarity / userVectors.length;
  console.log("    Shape score:", shapeScore);

  return shapeScore;
}

/**
 * Calculate the geometric center of a character from all its strokes
 * Uses bounding box center to avoid bias from strokes with more points
 */
function calculateCharacterCenter(strokes: StrokeMedian[]): MedianPoint {
  if (strokes.length === 0) return { x: 0, y: 0 };

  // Find bounding box of all strokes
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    for (const point of stroke.points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
  }

  // Return center of bounding box
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
}

/**
 * Verify user-drawn strokes against reference stroke data using center-point-based positioning
 *
 * Algorithm:
 * 1. First stroke establishes scale via start-to-end distance
 * 2. Calculate character center based on first stroke geometry + scale
 * 3. Verify subsequent strokes relative to center point
 */
export function verifyStrokes(
  userStrokes: Stroke[],
  referenceStrokes: StrokeMedian[],
  tolerance: number = 0.7, // Score threshold for accepting a stroke (0-1)
  canvasSize: number = 400 // Canvas size for position/scale normalization
): VerificationResult {
  const strokeResults: StrokeResult[] = [];

  // Check stroke count
  if (userStrokes.length !== referenceStrokes.length) {
    const feedback =
      userStrokes.length < referenceStrokes.length
        ? `Too few strokes: expected ${referenceStrokes.length}, got ${userStrokes.length}`
        : `Too many strokes: expected ${referenceStrokes.length}, got ${userStrokes.length}`;

    // Mark all strokes as incorrect if count doesn't match
    for (let i = 0; i < Math.max(userStrokes.length, referenceStrokes.length); i++) {
      strokeResults.push({
        strokeIndex: i,
        isCorrect: false,
        score: 0,
        feedback: i < userStrokes.length ? "extra" : "missing",
      });
    }

    return {
      isCorrect: false,
      strokeResults,
      totalScore: 0,
      feedback,
    };
  }

  // Step 1: Calculate scale from first stroke (start to end distance)
  const userFirstStart = userStrokes[0].points[0];
  const userFirstEnd = userStrokes[0].points[userStrokes[0].points.length - 1];
  const userFirstLength = Math.sqrt(
    Math.pow(userFirstEnd.x - userFirstStart.x, 2) +
    Math.pow(userFirstEnd.y - userFirstStart.y, 2)
  );

  const refFirstStart = referenceStrokes[0].points[0];
  const refFirstEnd = referenceStrokes[0].points[referenceStrokes[0].points.length - 1];
  const refFirstLength = Math.sqrt(
    Math.pow(refFirstEnd.x - refFirstStart.x, 2) +
    Math.pow(refFirstEnd.y - refFirstStart.y, 2)
  );

  const scaleFactor = userFirstLength > 0 && refFirstLength > 0 ? userFirstLength / refFirstLength : 1;

  console.log("=== CENTER-BASED VERIFICATION ===");
  console.log("Step 1: Scale calculation from first stroke");
  console.log(`  User first stroke: (${userFirstStart.x.toFixed(1)}, ${userFirstStart.y.toFixed(1)}) -> (${userFirstEnd.x.toFixed(1)}, ${userFirstEnd.y.toFixed(1)})`);
  console.log(`  Length: ${userFirstLength.toFixed(1)}px`);
  console.log(`  Reference first stroke: (${refFirstStart.x.toFixed(1)}, ${refFirstStart.y.toFixed(1)}) -> (${refFirstEnd.x.toFixed(1)}, ${refFirstEnd.y.toFixed(1)})`);
  console.log(`  Length: ${refFirstLength.toFixed(1)}px`);
  console.log(`  Scale factor: ${scaleFactor.toFixed(3)}`);

  // Step 2: Calculate character centers
  const refCenter = calculateCharacterCenter(referenceStrokes);

  // Calculate user's center based on reference geometry + scale + first stroke position
  // The triangle: userFirstStart, userFirstEnd, userCenter
  // We know the reference triangle: refFirstStart, refFirstEnd, refCenter
  // Calculate the offset from reference first stroke to reference center, then scale and apply
  const refCenterOffsetX = refCenter.x - refFirstStart.x;
  const refCenterOffsetY = refCenter.y - refFirstStart.y;
  const userCenter: MedianPoint = {
    x: userFirstStart.x + refCenterOffsetX * scaleFactor,
    y: userFirstStart.y + refCenterOffsetY * scaleFactor,
  };

  console.log("\nStep 2: Center point calculation");
  console.log(`  Reference center: (${refCenter.x.toFixed(1)}, ${refCenter.y.toFixed(1)})`);
  console.log(`  Reference center offset from first stroke: (${refCenterOffsetX.toFixed(1)}, ${refCenterOffsetY.toFixed(1)})`);
  console.log(`  User center: (${userCenter.x.toFixed(1)}, ${userCenter.y.toFixed(1)})`);

  // Verify each stroke
  let totalScore = 0;
  const positionTolerance = 120; // Base tolerance in pixels (very generous to account for varied drawing styles)

  for (let i = 0; i < userStrokes.length; i++) {
    const userPoints = userStrokes[i].points;
    const referencePoints = referenceStrokes[i].points;

    console.log(`\n=== Stroke ${i + 1} ===`);

    // A. Shape similarity (directional path matching) - 70% weight
    const shapeScore = compareStrokeShape(userPoints, referencePoints);

    // B. Position verification relative to center - 20% weight
    let positionScore = 1.0;
    if (i > 0) {
      const userStrokeStart = userPoints[0];
      const refStrokeStart = referencePoints[0];

      // Calculate expected position: userCenter + scaled offset from reference center
      const refOffsetX = refStrokeStart.x - refCenter.x;
      const refOffsetY = refStrokeStart.y - refCenter.y;
      const expectedX = userCenter.x + refOffsetX * scaleFactor;
      const expectedY = userCenter.y + refOffsetY * scaleFactor;

      const distance = Math.sqrt(
        Math.pow(userStrokeStart.x - expectedX, 2) +
        Math.pow(userStrokeStart.y - expectedY, 2)
      );

      const maxAllowedDistance = positionTolerance * scaleFactor;
      positionScore = Math.max(0, 1 - distance / maxAllowedDistance);

      console.log(`  Position check (relative to center):`);
      console.log(`    Reference offset from center: (${refOffsetX.toFixed(1)}, ${refOffsetY.toFixed(1)})`);
      console.log(`    Expected position: (${expectedX.toFixed(1)}, ${expectedY.toFixed(1)})`);
      console.log(`    Actual position: (${userStrokeStart.x.toFixed(1)}, ${userStrokeStart.y.toFixed(1)})`);
      console.log(`    Distance: ${distance.toFixed(1)}px (max: ${maxAllowedDistance.toFixed(1)}px)`);
      console.log(`    Position score: ${positionScore.toFixed(3)}`);
    } else {
      console.log(`  First stroke - position score: 1.0 (establishes anchor)`);
    }

    // C. Stroke length verification (relative scale consistency) - 10% weight
    let lengthScore = 1.0;
    const userStrokeLength = getStrokeLength(userPoints);
    const refStrokeLength = getStrokeLength(referencePoints);
    const expectedLength = refStrokeLength * scaleFactor;
    const lengthRatio = userStrokeLength / expectedLength;

    // Accept if length is within 50% to 150% of expected (quite generous)
    if (lengthRatio < 0.5 || lengthRatio > 1.5) {
      lengthScore = 0;
    } else if (lengthRatio < 0.7 || lengthRatio > 1.3) {
      // Partial credit between 0.5-0.7 and 1.3-1.5
      lengthScore = lengthRatio < 0.7
        ? (lengthRatio - 0.5) / 0.2  // Map 0.5-0.7 to 0-1
        : (1.5 - lengthRatio) / 0.2; // Map 1.3-1.5 to 1-0
    }

    console.log(`  Length check:`);
    console.log(`    User length: ${userStrokeLength.toFixed(1)}px`);
    console.log(`    Expected length: ${expectedLength.toFixed(1)}px (ref: ${refStrokeLength.toFixed(1)}px × ${scaleFactor.toFixed(3)})`);
    console.log(`    Ratio: ${lengthRatio.toFixed(3)}`);
    console.log(`    Length score: ${lengthScore.toFixed(3)}`);

    // Combine scores: Shape 70%, Position 20%, Length 10%
    const finalScore = shapeScore * 0.7 + positionScore * 0.2 + lengthScore * 0.1;
    const isCorrect = finalScore >= tolerance;

    console.log(`  Final score: ${finalScore.toFixed(3)} (threshold: ${tolerance}) - ${isCorrect ? "PASS" : "FAIL"}`);

    // Detailed failure logging
    if (!isCorrect) {
      console.log(`  ❌ STROKE ${i + 1} FAILED:`);
      console.log(`     Shape: ${shapeScore.toFixed(3)} × 0.7 = ${(shapeScore * 0.7).toFixed(3)}`);
      console.log(`     Position: ${positionScore.toFixed(3)} × 0.2 = ${(positionScore * 0.2).toFixed(3)}`);
      console.log(`     Length: ${lengthScore.toFixed(3)} × 0.1 = ${(lengthScore * 0.1).toFixed(3)}`);
      console.log(`     Total: ${finalScore.toFixed(3)} < ${tolerance} (need ${(tolerance - finalScore).toFixed(3)} more)`);

      if (shapeScore < 0.7) {
        console.log(`     → Main issue: SHAPE - stroke path doesn't match reference direction`);
      }
      if (positionScore < 0.5 && i > 0) {
        console.log(`     → Issue: POSITION - stroke starts too far from expected location`);
      }
      if (lengthScore < 0.5) {
        console.log(`     → Issue: LENGTH - stroke is ${lengthRatio < 1 ? "too short" : "too long"} (ratio: ${lengthRatio.toFixed(2)})`);
      }
    }

    strokeResults.push({
      strokeIndex: i,
      isCorrect,
      score: finalScore,
      feedback: isCorrect ? "correct" : "wrong_shape",
    });

    totalScore += finalScore;
  }

  const averageScore = totalScore / userStrokes.length;
  const allCorrect = strokeResults.every((r) => r.isCorrect);

  let feedback = "";
  if (allCorrect) {
    feedback = "Perfect! All strokes correct.";
  } else {
    const incorrectCount = strokeResults.filter((r) => !r.isCorrect).length;
    feedback = `${incorrectCount} stroke(s) need adjustment`;
  }

  return {
    isCorrect: allCorrect,
    strokeResults,
    totalScore: averageScore,
    feedback,
  };
}

/**
 * Parse Make Me a Hanzi median data from SVG and scale to canvas size
 * The median data is stored in data-median attributes as comma-separated coordinates
 * Example: data-median="121,393 193,372 417,402 827,434 920,401"
 */
export function parseStrokeMedians(svgContent: string, canvasSize: number = 500): StrokeMedian[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, "image/svg+xml");
  const strokes: StrokeMedian[] = [];

  // Make Me a Hanzi SVGs are typically 1024x1024
  const SVG_SIZE = 1024;

  // Find all path elements with data-median attributes
  const pathsWithMedian = doc.querySelectorAll('path[data-median]');
  console.log(`Found ${pathsWithMedian.length} paths with median data in SVG`);

  pathsWithMedian.forEach((path, index) => {
    const medianAttr = path.getAttribute('data-median');
    if (!medianAttr) return;

    try {
      // Parse the median attribute: "121,393 193,372 417,402 827,434 920,401"
      // Split by spaces to get coordinate pairs
      const coordinatePairs = medianAttr.trim().split(/\s+/);
      const points: MedianPoint[] = [];

      for (const pair of coordinatePairs) {
        const [x, y] = pair.split(',').map(Number);
        if (!isNaN(x) && !isNaN(y)) {
          // Make Me a Hanzi uses inverted Y coordinates:
          // - SVG origin (0,0) is at BOTTOM-LEFT
          // - Y increases UPWARD (0 at bottom, 900 at top)
          // Canvas coordinate system has origin at TOP-LEFT with Y increasing downward
          // So we need to flip Y: newY = SVG_SIZE - y
          const flippedY = SVG_SIZE - y;

          // Then scale both to canvas size
          const scaledX = (x / SVG_SIZE) * canvasSize;
          const scaledY = (flippedY / SVG_SIZE) * canvasSize;

          points.push({ x: scaledX, y: scaledY });
        }
      }

      if (points.length > 0) {
        strokes.push({ points });
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        console.log(`Parsed stroke ${index + 1}: ${points.length} median points (scaled to ${canvasSize}px)`);
        console.log(`  Start: (${firstPoint.x.toFixed(1)}, ${firstPoint.y.toFixed(1)}) → End: (${lastPoint.x.toFixed(1)}, ${lastPoint.y.toFixed(1)})`);
      }
    } catch (err) {
      console.error(`Error parsing median data for stroke ${index + 1}:`, err);
    }
  });

  console.log(`Total strokes parsed: ${strokes.length} (scaled from ${SVG_SIZE}x${SVG_SIZE} to ${canvasSize}x${canvasSize})`);
  return strokes;
}

export type { VerificationResult, StrokeResult, StrokeMedian };
