import { Coordinates, RouteStep } from './localRouter';

export interface PathProgress {
  closestIndex: number;
  projectedPoint: Coordinates;
  distanceToPath: number;
  completedGeometry: Coordinates[];
  remainingGeometry: Coordinates[];
  remainingDistanceMeters: number;
  progressFraction: number; // 0 to 1
  suggestedStepIndex: number;
}

/**
 * Standard scale factor: in KSR CAD coordinates (3456x1728), 1 coordinate unit ≈ 0.33 meters.
 */
export const MAP_UNITS_TO_METERS = 0.33;

/**
 * Compute Euclidean distance between two 2D points.
 */
export function pointDistance(a: Coordinates, b: Coordinates): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute total length of a polyline in coordinate units.
 */
export function polylineLength(points: Coordinates[]): number {
  if (!points || points.length < 2) return 0;
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += pointDistance(points[i], points[i + 1]);
  }
  return len;
}

/**
 * Project point P onto line segment AB.
 */
export function projectPointOntoSegment(
  p: Coordinates,
  a: Coordinates,
  b: Coordinates
): { projected: Coordinates; distance: number; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const segLenSq = dx * dx + dy * dy;

  if (segLenSq === 0) {
    return {
      projected: { x: a.x, y: a.y },
      distance: pointDistance(p, a),
      t: 0
    };
  }

  const u = (p.x - a.x) * dx + (p.y - a.y) * dy;
  const t = Math.max(0, Math.min(1, u / segLenSq));

  const projected: Coordinates = {
    x: Math.round(a.x + t * dx),
    y: Math.round(a.y + t * dy)
  };

  return {
    projected,
    distance: pointDistance(p, projected),
    t
  };
}

/**
 * Evaluate location progress along the route geometry.
 * Returns completed geometry, remaining geometry, remaining distance, and step index.
 */
export function evaluateRouteProgress(
  currentPos: Coordinates,
  geometry: Coordinates[],
  steps: RouteStep[]
): PathProgress {
  if (!geometry || geometry.length === 0) {
    return {
      closestIndex: 0,
      projectedPoint: currentPos,
      distanceToPath: 0,
      completedGeometry: [],
      remainingGeometry: [],
      remainingDistanceMeters: 0,
      progressFraction: 0,
      suggestedStepIndex: 0
    };
  }

  if (geometry.length === 1) {
    return {
      closestIndex: 0,
      projectedPoint: geometry[0],
      distanceToPath: pointDistance(currentPos, geometry[0]),
      completedGeometry: [geometry[0]],
      remainingGeometry: [geometry[0]],
      remainingDistanceMeters: 0,
      progressFraction: 1,
      suggestedStepIndex: 0
    };
  }

  let minDistance = Infinity;
  let bestSegIndex = 0;
  let bestProjected = geometry[0];

  for (let i = 0; i < geometry.length - 1; i++) {
    const proj = projectPointOntoSegment(currentPos, geometry[i], geometry[i + 1]);
    if (proj.distance < minDistance) {
      minDistance = proj.distance;
      bestSegIndex = i;
      bestProjected = proj.projected;
    }
  }

  // Construct completed geometry: [P_0, ..., P_best, bestProjected]
  const completed: Coordinates[] = [];
  for (let i = 0; i <= bestSegIndex; i++) {
    completed.push(geometry[i]);
  }
  completed.push(bestProjected);

  // Construct remaining geometry: [bestProjected, P_{best+1}, ..., P_n]
  const remaining: Coordinates[] = [bestProjected];
  for (let i = bestSegIndex + 1; i < geometry.length; i++) {
    remaining.push(geometry[i]);
  }

  const totalLength = polylineLength(geometry);
  const remainingLengthUnits = polylineLength(remaining);
  const remainingDistanceMeters = Math.max(0, Math.round(remainingLengthUnits * MAP_UNITS_TO_METERS));

  const progressFraction = totalLength > 0 ? Math.max(0, Math.min(1, 1 - remainingLengthUnits / totalLength)) : 0;

  // Determine which step this corresponds to based on fraction of steps
  const suggestedStepIndex = steps.length > 0
    ? Math.min(steps.length - 1, Math.floor(progressFraction * steps.length))
    : 0;

  return {
    closestIndex: bestSegIndex,
    projectedPoint: bestProjected,
    distanceToPath: minDistance,
    completedGeometry: completed,
    remainingGeometry: remaining,
    remainingDistanceMeters,
    progressFraction,
    suggestedStepIndex
  };
}
