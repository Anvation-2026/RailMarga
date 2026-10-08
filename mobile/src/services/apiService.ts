import { localRouter, RouteResult, StationNode } from './localRouter';
import platformsData from '../data/station/platforms.json';
import facilitiesData from '../data/station/facilities.json';
import checkpointsData from '../data/simulation/checkpoints.json';

// Supports USB ADB Reverse (localhost) and Local Wi-Fi IP
const LOCAL_WIFI_IP = '10.0.5.101';
const CANDIDATE_URLS = [
  'http://localhost:3000',
  `http://${LOCAL_WIFI_IP}:3000`,
  'http://10.24.42.26:3000',
  'http://10.0.2.2:3000'
];

export class ApiService {
  private isOnlineState: boolean = false;
  private backendBaseUrl: string = CANDIDATE_URLS[0];

  constructor() {
    this.checkConnectivity();
  }

  public async checkConnectivity(): Promise<boolean> {
    for (const url of CANDIDATE_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600);
        const res = await fetch(`${url}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          this.backendBaseUrl = url;
          this.isOnlineState = true;
          return true;
        }
      } catch {}
    }
    this.isOnlineState = false;
    return false;
  }

  public get isOnline(): boolean {
    return this.isOnlineState;
  }

  public setBackendUrl(url: string) {
    this.backendBaseUrl = url;
  }

  // 1. Station Overview
  public async getStationOverview() {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/station`);
        if (res.ok) return await res.json();
      } catch {}
    }
    return {
      stationName: "Krantivira Sangolli Rayanna (Bengaluru Railway Station)",
      stationCode: "SBC",
      tagline: "Smart & Accessible Navigation for KSR Bengaluru",
      viewBox: { width: 3456, height: 1728, minX: 0, minY: 0 },
      totalPlatforms: platformsData.length,
      totalFacilities: facilitiesData.length,
      totalNodes: localRouter.nodes.length,
      isOffline: !this.isOnlineState
    };
  }

  // 2. Platforms
  public async getPlatforms(): Promise<any[]> {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/platforms`);
        if (res.ok) return await res.json();
      } catch {}
    }
    return platformsData;
  }

  // 3. Facilities
  public async getFacilities(category?: string, wheelchairOnly?: boolean): Promise<any[]> {
    if (this.isOnlineState) {
      try {
        const url = new URL(`${this.backendBaseUrl}/api/facilities`);
        if (category) url.searchParams.set('category', category);
        if (wheelchairOnly) url.searchParams.set('wheelchair', 'true');
        const res = await fetch(url.toString());
        if (res.ok) return await res.json();
      } catch {}
    }
    let res = facilitiesData;
    if (category) {
      res = res.filter((f: any) => f.type.toUpperCase() === category.toUpperCase());
    }
    if (wheelchairOnly) {
      res = res.filter((f: any) => f.accessibility?.wheelchairAccessible === true);
    }
    const currentStatus = localRouter.getStatus();
    return res.map((f: any) => ({
      ...f,
      status: currentStatus[f.id] || f.status || 'OPEN'
    }));
  }

  // 4. Calculate Route (A* with offline fallback)
  public async getRoute(
    startNodeId: string,
    destinationNodeId: string,
    profileId: string = 'first_time',
    blockedIds: string[] = []
  ): Promise<RouteResult | null> {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/route`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startNodeId, destinationNodeId, profileId, blockedIds })
        });
        if (res.ok) return await res.json();
      } catch {}
    }
    // Deterministic Offline Router
    return localRouter.findRoute(startNodeId, destinationNodeId, profileId, blockedIds);
  }

  // 5. Dynamic Reroute
  public async reroute(
    startNodeId: string,
    destinationNodeId: string,
    profileId: string,
    blockedLocationId: string
  ): Promise<RouteResult | null> {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/reroute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startNodeId, destinationNodeId, profileId, blockedLocationId })
        });
        if (res.ok) {
          const data = await res.json();
          return data.route;
        }
      } catch {}
    }
    // Offline local reroute
    const blocked = [blockedLocationId, `${blockedLocationId}_rev`];
    return localRouter.findRoute(startNodeId, destinationNodeId, profileId, blocked);
  }

  // 6. Assistant Query
  public async queryAssistant(
    message: string,
    context: { currentNodeId?: string; profileId?: string; activeRoute?: any } = {}
  ): Promise<{ reply: string; action?: string; route?: RouteResult | null; facility?: any }> {
    if (this.isOnlineState) {
      try {
        const res = await fetch(`${this.backendBaseUrl}/api/assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, ...context })
        });
        if (res.ok) return await res.json();
      } catch {}
    }

    // Deterministic Offline NLP Fallback
    const startNode = context.currentNodeId || 'node_entry_t1_main_east';
    const profile = context.profileId || 'first_time';
    const q = message.toLowerCase();

    // Check platform
    const match = q.match(/(?:platform|pf|plat)\s*(\d{1,2})/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 10) {
        const route = localRouter.findRoute(startNode, `node_pf${num}_center`, profile);
        return {
          reply: `Here is the ${profile === 'mobility_disabled' ? 'accessible ' : ''}route to Platform ${num} (${route?.totalDistanceMeters}m).`,
          action: 'find_route',
          route
        };
      }
    }

    // Nearest toilet
    if (q.includes('toilet') || q.includes('restroom')) {
      const toiletRoute = localRouter.findRoute(startNode, 'node_t1_toilet', profile);
      return {
        reply: `The nearest restroom is Terminal 1 Restroom (${toiletRoute?.totalDistanceMeters}m away).`,
        action: 'find_facility',
        route: toiletRoute
      };
    }

    // Nearest lift
    if (q.includes('lift') || q.includes('elevator')) {
      const liftRoute = localRouter.findRoute(startNode, 'node_t1_lift2_l0', profile);
      return {
        reply: `The nearest lift is Lift 2 in Terminal 1 Concourse (${liftRoute?.totalDistanceMeters}m away).`,
        action: 'find_facility',
        route: liftRoute
      };
    }

    return {
      reply: "RailMarga Offline: You can navigate to Platforms 1 to 10, search restrooms, lifts, or view the station map."
    };
  }

  // 7. Checkpoint Resolution
  public async resolveCheckpoint(qrCode: string) {
    const code = qrCode.trim().toUpperCase();
    const cp = checkpointsData.find((c: any) => c.id.toUpperCase() === code);
    if (!cp) return null;
    const node = localRouter.nodeDict.get(cp.nodeId);
    return { checkpoint: cp, matchedNode: node || null };
  }

  // 8. Update Facility Blockage (Simulation)
  public async updateStatus(facilityId: string, status: string) {
    localRouter.setStatus(facilityId, status);
    if (this.isOnlineState) {
      try {
        await fetch(`${this.backendBaseUrl}/api/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facilityId, status })
        });
      } catch {}
    }
    return localRouter.getStatus();
  }
}

export const apiService = new ApiService();
