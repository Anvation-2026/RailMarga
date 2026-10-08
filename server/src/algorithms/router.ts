import fs from 'fs';
import path from 'path';

export interface Coordinates {
  x: number;
  y: number;
}

export interface StationNode {
  id: string;
  name: string;
  type: string;
  coordinates: Coordinates;
  level: number;
  layer?: string;
  accessible: boolean;
  wheelchairAccessible: boolean;
  elderlyFriendly: boolean;
  visualLandmark?: string;
  qrCheckpointId?: string;
  status: string;
}

export interface StationEdge {
  id: string;
  from: string;
  to: string;
  distance: number;
  estimatedTimeSeconds: number;
  pathType: 'WALKWAY' | 'LIFT' | 'RAMP' | 'STAIRS' | 'ESCALATOR' | 'FOB' | 'SUBWAY';
  level: number;
  accessible: boolean;
  wheelchairAccessible: boolean;
  elderlyFriendly: boolean;
  visualGuidanceAvailable: boolean;
  status: string;
  geometry?: Coordinates[];
}

export interface RouteStep {
  stepNumber: number;
  fromNode: string;
  toNode: string;
  instruction: string;
  voiceText: string;
  distance: number;
  pathType: string;
  landmark: string;
}

export interface RouteResult {
  start: StationNode;
  destination: StationNode;
  profile: string;
  totalDistanceMeters: number;
  estimatedTimeMinutes: number;
  nodeSequence: string[];
  steps: RouteStep[];
  pathGeometry: Coordinates[];
  accessibility: {
    wheelchairAccessible: boolean;
    stepFree: boolean;
    liftsUsed: string[];
    rampsUsed: string[];
    stairsUsed: string[];
  };
  warnings: string[];
  blockedSegments: string[];
}

export interface ProfileWeights {
  walkway: number;
  ramp: number;
  lift: number;
  stairs: number;
  escalator: number;
  turnPenalty: number;
  stairAvoidance: boolean;
}

export class StationRouter {
  public nodes: StationNode[] = [];
  public edges: StationEdge[] = [];
  public nodeDict: Map<string, StationNode> = new Map();
  public adj: Map<string, StationEdge[]> = new Map();
  public profiles: Map<string, { id: string; name: string; weights: ProfileWeights }> = new Map();
  public status: Record<string, string> = {};
  public config: any = {};

  constructor(dataBasePath?: string) {
    const base = dataBasePath || path.resolve(__dirname, '../../../data');
    this.loadData(base);
  }

  public loadData(base: string): void {
    const nodesPath = path.join(base, 'station/nodes.json');
    const edgesPath = path.join(base, 'station/edges.json');
    const profilesPath = path.join(base, 'accessibility/profiles.json');
    const configPath = path.join(base, 'accessibility/routingConfig.json');
    const statusPath = path.join(base, 'simulation/status.json');

    if (fs.existsSync(nodesPath)) {
      this.nodes = JSON.parse(fs.readFileSync(nodesPath, 'utf-8'));
      this.nodeDict.clear();
      this.adj.clear();
      for (const n of this.nodes) {
        this.nodeDict.set(n.id, n);
        this.adj.set(n.id, []);
      }
    }

    if (fs.existsSync(edgesPath)) {
      this.edges = JSON.parse(fs.readFileSync(edgesPath, 'utf-8'));
      for (const e of this.edges) {
        const list = this.adj.get(e.from) || [];
        list.push(e);
        this.adj.set(e.from, list);
      }
    }

    if (fs.existsSync(profilesPath)) {
      const pList = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
      this.profiles.clear();
      for (const p of pList) {
        this.profiles.set(p.id, p);
      }
    }

    if (fs.existsSync(configPath)) {
      this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    if (fs.existsSync(statusPath)) {
      this.status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    }
  }

  public setStatus(facilityId: string, status: string): void {
    this.status[facilityId] = status;
  }

  public heuristic(nodeAId: string, nodeBId: string): number {
    const na = this.nodeDict.get(nodeAId);
    const nb = this.nodeDict.get(nodeBId);
    if (!na || !nb) return 0;
    const dx = na.coordinates.x - nb.coordinates.x;
    const dy = na.coordinates.y - nb.coordinates.y;
    return Math.sqrt(dx * dx + dy * dy) * 0.25;
  }

  public computeEdgeCost(edge: StationEdge, profileId: string, prevEdge?: StationEdge): number {
    const prof = this.profiles.get(profileId) || this.profiles.get('first_time');
    const weights = prof ? prof.weights : { walkway: 1, ramp: 1, lift: 1, stairs: 1.5, escalator: 1.5, turnPenalty: 5, stairAvoidance: false };
    const pt = edge.pathType.toLowerCase();

    // Wheelchair / mobility restriction
    if (weights.stairAvoidance && (!edge.wheelchairAccessible || pt === 'stairs' || pt === 'escalator')) {
      return Infinity;
    }

    let multiplier = weights.walkway || 1.0;
    if (pt === 'ramp') multiplier = weights.ramp;
    else if (pt === 'lift') multiplier = weights.lift;
    else if (pt === 'stairs') multiplier = weights.stairs;
    else if (pt === 'escalator') multiplier = weights.escalator;

    let cost = edge.distance * multiplier;

    // Turn penalty
    if (prevEdge) {
      const pFrom = this.nodeDict.get(prevEdge.from)?.coordinates;
      const pTo = this.nodeDict.get(prevEdge.to)?.coordinates;
      const cTo = this.nodeDict.get(edge.to)?.coordinates;
      if (pFrom && pTo && cTo) {
        const v1x = pTo.x - pFrom.x;
        const v1y = pTo.y - pFrom.y;
        const v2x = cTo.x - pTo.x;
        const v2y = cTo.y - pTo.y;
        const mag1 = Math.hypot(v1x, v1y);
        const mag2 = Math.hypot(v2x, v2y);
        if (mag1 > 0 && mag2 > 0) {
          const dot = (v1x * v2x + v1y * v2y) / (mag1 * mag2);
          const clamped = Math.max(-1.0, Math.min(1.0, dot));
          const angleDeg = Math.acos(clamped) * (180 / Math.PI);
          if (angleDeg > (this.config.turnAngleThresholdDegrees || 30.0)) {
            cost += weights.turnPenalty || 5.0;
          }
        }
      }
    }

    return cost;
  }

  public findRoute(
    startId: string,
    destId: string,
    profileId: string = 'first_time',
    blockedIds: string[] = []
  ): RouteResult | null {
    const startNode = this.nodeDict.get(startId);
    const destNode = this.nodeDict.get(destId);
    if (!startNode || !destNode) return null;

    const blockedSet = new Set(blockedIds);
    // Combine with current facility status
    for (const [k, v] of Object.entries(this.status)) {
      if (v === 'BLOCKED') {
        blockedSet.add(k);
      }
    }

    // Min-Priority Queue items: { f: number, g: number, curr: string, pathEdges: StationEdge[] }
    const pq: Array<{ f: number; g: number; curr: string; pathEdges: StationEdge[] }> = [
      { f: 0, g: 0, curr: startId, pathEdges: [] }
    ];
    const bestG = new Map<string, number>();
    bestG.set(startId, 0);
    const visited = new Set<string>();

    while (pq.length > 0) {
      // Find min element
      let minIdx = 0;
      for (let i = 1; i < pq.length; i++) {
        if (pq[i].f < pq[minIdx].f) minIdx = i;
      }
      const { g, curr, pathEdges } = pq.splice(minIdx, 1)[0];

      if (curr === destId) {
        return this.buildRouteResult(startNode, destNode, profileId, pathEdges, Array.from(blockedSet));
      }

      if (visited.has(curr) && g > (bestG.get(curr) ?? Infinity)) {
        continue;
      }
      visited.add(curr);

      const prevEdge = pathEdges.length > 0 ? pathEdges[pathEdges.length - 1] : undefined;
      const neighbors = this.adj.get(curr) || [];

      for (const edge of neighbors) {
        // Blockage check
        if (blockedSet.has(edge.id) || blockedSet.has(`${edge.id}_rev`)) continue;
        if (edge.status === 'BLOCKED') continue;

        const cost = this.computeEdgeCost(edge, profileId, prevEdge);
        if (!isFinite(cost)) continue;

        const nxt = edge.to;
        const newG = g + cost;
        if (newG < (bestG.get(nxt) ?? Infinity)) {
          bestG.set(nxt, newG);
          const h = this.heuristic(nxt, destId);
          pq.push({
            f: newG + h,
            g: newG,
            curr: nxt,
            pathEdges: [...pathEdges, edge]
          });
        }
      }
    }

    return null;
  }

  private buildRouteResult(
    startNode: StationNode,
    destNode: StationNode,
    profileId: string,
    pathEdges: StationEdge[],
    blockedList: string[]
  ): RouteResult {
    const totalDist = pathEdges.reduce((sum, e) => sum + e.distance, 0);
    const totalTime = pathEdges.reduce((sum, e) => sum + e.estimatedTimeSeconds, 0);
    const nodeSequence = [startNode.id, ...pathEdges.map((e) => e.to)];

    const steps: RouteStep[] = [];
    const pathGeometry: Coordinates[] = [];
    const liftsUsed: string[] = [];
    const rampsUsed: string[] = [];
    const stairsUsed: string[] = [];

    pathEdges.forEach((edge, idx) => {
      const u = this.nodeDict.get(edge.from)!;
      const v = this.nodeDict.get(edge.to)!;
      const pt = edge.pathType;

      if (pt === 'LIFT') liftsUsed.push(v.name);
      else if (pt === 'RAMP') rampsUsed.push(v.name);
      else if (pt === 'STAIRS') stairsUsed.push(v.name);

      const [inst, voice] = this.generateInstruction(idx + 1, u, v, edge, profileId);
      steps.push({
        stepNumber: idx + 1,
        fromNode: u.name,
        toNode: v.name,
        instruction: inst,
        voiceText: voice,
        distance: edge.distance,
        pathType: pt,
        landmark: v.visualLandmark || v.name
      });

      const geom = edge.geometry || [u.coordinates, v.coordinates];
      if (idx === 0) {
        pathGeometry.push(...geom);
      } else {
        pathGeometry.push(...geom.slice(1));
      }
    });

    const warnings: string[] = [];
    if (stairsUsed.length > 0 && profileId === 'mobility_disabled') {
      warnings.push('Warning: Route includes stairs; not wheelchair accessible.');
    }

    return {
      start: startNode,
      destination: destNode,
      profile: profileId,
      totalDistanceMeters: Math.round(totalDist * 10) / 10,
      estimatedTimeMinutes: Math.max(1, Math.round(totalTime / 60)),
      nodeSequence,
      steps,
      pathGeometry,
      accessibility: {
        wheelchairAccessible: stairsUsed.length === 0,
        stepFree: stairsUsed.length === 0,
        liftsUsed,
        rampsUsed,
        stairsUsed
      },
      warnings,
      blockedSegments: blockedList
    };
  }

  private generateInstruction(
    stepNum: number,
    u: StationNode,
    v: StationNode,
    edge: StationEdge,
    profileId: string
  ): [string, string] {
    const pt = edge.pathType;
    const dist = Math.round(edge.distance);
    const landmark = v.visualLandmark || v.name;

    if (profileId === 'child') {
      if (pt === 'LIFT') return [`Take the elevator to ${v.name}`, `Take the elevator to ${v.name}.`];
      if (pt === 'RAMP') return [`Walk up the ramp towards ${landmark}`, `Walk up the ramp towards ${landmark}.`];
      return [`Walk straight for ${dist}m towards ${landmark}`, `Walk forward towards ${landmark}.`];
    }

    if (profileId === 'visually_impaired') {
      if (pt === 'LIFT') return [`Elevator ahead. Enter and proceed to ${v.name}`, `Elevator ahead. Enter and proceed to ${v.name}.`];
      if (pt === 'RAMP') return [`Ramp ahead. Walk up for ${dist}m towards ${landmark}`, `Ramp ahead. Walk up for ${dist} meters towards ${landmark}.`];
      return [`Walk straight for ${dist}m along tactile paving towards ${landmark}`, `Walk forward ${dist} meters towards ${landmark}.`];
    }

    if (pt === 'LIFT') return [`Take Lift to ${v.name}`, `Take the lift to ${v.name}.`];
    if (pt === 'RAMP') return [`Proceed along accessible ramp (${dist}m) to ${v.name}`, `Follow the ramp for ${dist} meters to ${v.name}.`];
    if (pt === 'STAIRS') return [`Take staircase (${dist}m) up to ${v.name}`, `Take the stairs up to ${v.name}.`];
    if (pt === 'FOB') return [`Cross Footover Bridge for ${dist}m towards ${v.name}`, `Continue along the footover bridge for ${dist} meters.`];

    return [`Walk ${dist}m towards ${landmark}`, `Walk ${dist} meters towards ${landmark}.`];
  }
}
