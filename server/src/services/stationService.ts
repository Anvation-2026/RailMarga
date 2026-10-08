import fs from 'fs';
import path from 'path';
import { StationRouter, StationNode, RouteResult } from '../algorithms/router';

export class StationService {
  private baseDir: string;
  public router: StationRouter;
  private platforms: any[] = [];
  private facilities: any[] = [];
  private checkpoints: any[] = [];
  private statusMap: Record<string, string> = {};

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(__dirname, '../../../data');
    this.router = new StationRouter(this.baseDir);
    this.loadStationData();
  }

  private loadStationData(): void {
    const platPath = path.join(this.baseDir, 'station/platforms.json');
    const facPath = path.join(this.baseDir, 'station/facilities.json');
    const cpPath = path.join(this.baseDir, 'simulation/checkpoints.json');
    const statPath = path.join(this.baseDir, 'simulation/status.json');

    if (fs.existsSync(platPath)) this.platforms = JSON.parse(fs.readFileSync(platPath, 'utf-8'));
    if (fs.existsSync(facPath)) this.facilities = JSON.parse(fs.readFileSync(facPath, 'utf-8'));
    if (fs.existsSync(cpPath)) this.checkpoints = JSON.parse(fs.readFileSync(cpPath, 'utf-8'));
    if (fs.existsSync(statPath)) this.statusMap = JSON.parse(fs.readFileSync(statPath, 'utf-8'));
  }

  public getStationOverview() {
    return {
      stationName: "Krantivira Sangolli Rayanna (Bengaluru Railway Station)",
      stationCode: "SBC",
      tagline: "Smart & Accessible Navigation for KSR Bengaluru",
      viewBox: { width: 3456, height: 1728, minX: 0, minY: 0 },
      levels: [
        { level: -1, name: "Subway Level", description: "Majestic passenger subway connecting concourse and platforms" },
        { level: 0, name: "Platform Level", description: "Platforms 1 to 10, Terminal 1, Terminal 2, Terminal 3" },
        { level: 1, name: "Footover Bridge Level", description: "Metro FOB, FOB 1 (Mysuru End), FOB 2 (Okkalpuram End)" }
      ],
      totalPlatforms: this.platforms.length,
      totalFacilities: this.facilities.length,
      totalNodes: this.router.nodes.length,
      totalEdges: this.router.edges.length
    };
  }

  public getPlatforms() {
    return this.platforms;
  }

  public getPlatformById(id: string) {
    const clean = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    return this.platforms.find(p => {
      const pClean = p.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const numMatch = p.number.toString() === clean.replace('platform', '').replace('pf', '');
      return pClean === clean || numMatch || p.id === id;
    }) || null;
  }

  public getFacilities(category?: string, wheelchairOnly: boolean = false) {
    let result = this.facilities;
    if (category) {
      const cat = category.toUpperCase();
      result = result.filter(f => f.type.toUpperCase() === cat);
    }
    if (wheelchairOnly) {
      result = result.filter(f => f.accessibility?.wheelchairAccessible === true);
    }
    // Update live status from statusMap
    return result.map(f => ({
      ...f,
      status: this.statusMap[f.id] || f.status || 'OPEN'
    }));
  }

  public getFacilityById(id: string) {
    const f = this.facilities.find(item => item.id === id);
    if (!f) return null;
    return {
      ...f,
      status: this.statusMap[f.id] || f.status || 'OPEN'
    };
  }

  public getNodes(): StationNode[] {
    return this.router.nodes;
  }

  public getStatus(): Record<string, string> {
    return this.statusMap;
  }

  public setStatus(facilityId: string, status: string): Record<string, string> {
    this.statusMap[facilityId] = status;
    this.router.setStatus(facilityId, status);
    return this.statusMap;
  }

  public resolveCheckpoint(qrCode: string) {
    const cleanCode = qrCode.trim().toUpperCase();
    const cp = this.checkpoints.find(c => c.id.toUpperCase() === cleanCode);
    if (!cp) return null;
    const node = this.router.nodeDict.get(cp.nodeId);
    return {
      checkpoint: cp,
      matchedNode: node || null
    };
  }

  public findNearestFacility(
    startNodeId: string,
    facilityType: string,
    profileId: string = 'first_time'
  ): { facility: any; route: RouteResult | null; distance: number } | null {
    const candidates = this.getFacilities(facilityType, profileId === 'mobility_disabled');
    if (candidates.length === 0) return null;

    let bestFacility: any = null;
    let bestRoute: RouteResult | null = null;
    let minDistance = Infinity;

    for (const cand of candidates) {
      // Find closest node to facility coordinates
      let targetNodeId = '';
      let minPixelDist = Infinity;
      for (const n of this.router.nodes) {
        const dx = n.coordinates.x - cand.coordinates.x;
        const dy = n.coordinates.y - cand.coordinates.y;
        const d = Math.hypot(dx, dy);
        if (d < minPixelDist) {
          minPixelDist = d;
          targetNodeId = n.id;
        }
      }

      if (targetNodeId) {
        const route = this.router.findRoute(startNodeId, targetNodeId, profileId);
        if (route && route.totalDistanceMeters < minDistance) {
          minDistance = route.totalDistanceMeters;
          bestRoute = route;
          bestFacility = cand;
        }
      }
    }

    if (!bestFacility) return null;
    return {
      facility: bestFacility,
      route: bestRoute,
      distance: minDistance
    };
  }

  public searchLocations(query: string) {
    const q = query.toLowerCase().trim();
    const results: Array<{ id: string; name: string; type: string; nodeId: string; coordinates: any }> = [];

    // 1. Search platforms
    for (const p of this.platforms) {
      if (
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        q === `platform ${p.number}` ||
        q === `pf ${p.number}` ||
        q === `pf${p.number}` ||
        q === `p${p.number}` ||
        q === `${p.number}`
      ) {
        results.push({
          id: p.id,
          name: p.name,
          type: 'PLATFORM',
          nodeId: `node_pf${p.number}_center`,
          coordinates: p.center
        });
      }
    }

    // 2. Search facilities
    for (const f of this.facilities) {
      if (
        f.id.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        (q.includes('toilet') && f.type === 'TOILET') ||
        (q.includes('lift') && f.type === 'LIFT') ||
        (q.includes('ramp') && f.type === 'RAMP') ||
        (q.includes('metro') && (f.type === 'METRO' || f.name.toLowerCase().includes('metro'))) ||
        (q.includes('ticket') && (f.type === 'TICKET_COUNTER' || f.name.toLowerCase().includes('ticket'))) ||
        (q.includes('subway') && f.type === 'SUBWAY')
      ) {
        results.push({
          id: f.id,
          name: f.name,
          type: f.type,
          nodeId: f.nearestNode || `node_${f.id}`,
          coordinates: f.coordinates
        });
      }
    }

    return results;
  }
}
