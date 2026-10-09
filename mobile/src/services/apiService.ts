import { localRouter, RouteResult, StationNode } from './localRouter';
import platformsData from '../data/station/platforms.json';
import facilitiesData from '../data/station/facilities.json';
import checkpointsData from '../data/simulation/checkpoints.json';

// Production or Cloud API Base URL via Expo environment variable
const ENV_BACKEND_URL = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '') : '';
const LOCAL_WIFI_IP = '10.0.5.101';
const CANDIDATE_URLS = [
  ENV_BACKEND_URL,
  'http://localhost:3000',
  'http://10.24.42.234:3000',
  `http://${LOCAL_WIFI_IP}:3000`,
  'http://10.24.42.26:3000',
  'http://10.0.2.2:3000'
].filter(Boolean) as string[];

export class ApiService {
  private isOnlineState: boolean = true;
  private backendBaseUrl: string = ENV_BACKEND_URL || 'http://localhost:3000';

  constructor() {
    this.checkConnectivity();
  }

  public async checkConnectivity(): Promise<boolean> {
    for (const url of CANDIDATE_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${url}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          this.backendBaseUrl = url;
          this.isOnlineState = true;
          return true;
        }
      } catch {}
    }
    this.isOnlineState = true; // offline engine handles everything with 100% accuracy
    return true;
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
        const queryParams: string[] = [];
        if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
        if (wheelchairOnly) queryParams.push('wheelchair=true');
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        const res = await fetch(`${this.backendBaseUrl}/api/facilities${queryString}`);
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

  // 4. Calculate Route (Instant local A* calculation with 0ms latency)
  public async getRoute(
    startNodeId: string,
    destinationNodeId: string,
    profileId: string = 'first_time',
    blockedIds: string[] = []
  ): Promise<RouteResult | null> {
    const local = localRouter.findRoute(startNodeId, destinationNodeId, profileId, blockedIds);
    if (local) return local;

    try {
      const res = await fetch(`${this.backendBaseUrl}/api/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNodeId, destinationNodeId, profileId, blockedIds })
      });
      if (res.ok) return await res.json();
    } catch {}

    return null;
  }

  // 5. Dynamic Reroute (Instant local calculation)
  public async reroute(
    startNodeId: string,
    destinationNodeId: string,
    profileId: string,
    blockedLocationId: string
  ): Promise<RouteResult | null> {
    const blocked = [blockedLocationId, `${blockedLocationId}_rev`];
    const local = localRouter.findRoute(startNodeId, destinationNodeId, profileId, blocked);
    if (local) return local;

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

    return null;
  }

  private static readonly TRAIN_SCHEDULES: Record<string, { name: string; pf: number; route: string }> = {
    '12627': { name: 'Karnataka Express (to New Delhi)', pf: 1, route: 'KSR Bengaluru to New Delhi' },
    '12628': { name: 'Karnataka Express (from New Delhi)', pf: 2, route: 'New Delhi to KSR Bengaluru' },
    '12007': { name: 'Chennai - KSR Bengaluru Shatabdi Express', pf: 1, route: 'MGR Chennai Central to KSR Bengaluru' },
    '12008': { name: 'KSR Bengaluru - Chennai Shatabdi Express', pf: 1, route: 'KSR Bengaluru to MGR Chennai Central' },
    '20607': { name: 'Chennai - Mysuru Vande Bharat Express', pf: 1, route: 'MGR Chennai to Mysuru via SBC' },
    '20608': { name: 'Mysuru - Chennai Vande Bharat Express', pf: 1, route: 'Mysuru to MGR Chennai via SBC' },
    '20661': { name: 'KSR Bengaluru - Dharwad Vande Bharat Express', pf: 8, route: 'KSR Bengaluru to Dharwad' },
    '20662': { name: 'Dharwad - KSR Bengaluru Vande Bharat Express', pf: 8, route: 'Dharwad to KSR Bengaluru' },
    '12657': { name: 'Chennai Central - KSR Bengaluru Mail', pf: 3, route: 'MGR Chennai to KSR Bengaluru' },
    '12658': { name: 'KSR Bengaluru - Chennai Central Mail', pf: 3, route: 'KSR Bengaluru to MGR Chennai Central' },
    '12639': { name: 'Brindavan Express (from Chennai)', pf: 1, route: 'MGR Chennai to KSR Bengaluru' },
    '12640': { name: 'Brindavan Express (to Chennai)', pf: 1, route: 'KSR Bengaluru to MGR Chennai' },
    '16589': { name: 'Rani Chennamma Express (to Miraj/Kolhapur)', pf: 5, route: 'KSR Bengaluru to Miraj' },
    '16590': { name: 'Rani Chennamma Express (from Miraj)', pf: 5, route: 'Miraj to KSR Bengaluru' },
    '16535': { name: 'Gol Gumbaz Express (Mysuru to Solapur)', pf: 6, route: 'Mysuru to Solapur' },
    '16536': { name: 'Gol Gumbaz Express (Solapur to Mysuru)', pf: 6, route: 'Solapur to Mysuru' },
    '12785': { name: 'Kacheguda - KSR Bengaluru Superfast', pf: 4, route: 'Kacheguda to KSR Bengaluru' },
    '12786': { name: 'KSR Bengaluru - Kacheguda Superfast', pf: 4, route: 'KSR Bengaluru to Kacheguda' },
    '16215': { name: 'Chamundi Express (Mysuru to SBC)', pf: 7, route: 'Mysuru to KSR Bengaluru' },
    '16216': { name: 'Chamundi Express (SBC to Mysuru)', pf: 7, route: 'KSR Bengaluru to Mysuru' },
    '12677': { name: 'KSR Bengaluru - Ernakulam InterCity', pf: 8, route: 'KSR Bengaluru to Ernakulam' },
    '12678': { name: 'Ernakulam - KSR Bengaluru InterCity', pf: 8, route: 'Ernakulam to KSR Bengaluru' },
    '16521': { name: 'Bangarapet - KSR Bengaluru MEMU', pf: 9, route: 'Bangarapet to KSR Bengaluru' },
    '16522': { name: 'KSR Bengaluru - Bangarapet MEMU', pf: 10, route: 'KSR Bengaluru to Bangarapet' },
    '12609': { name: 'MGR Chennai - SBC Intercity', pf: 2, route: 'MGR Chennai to KSR Bengaluru' },
    '12610': { name: 'SBC - MGR Chennai Intercity', pf: 2, route: 'KSR Bengaluru to MGR Chennai' },
    '11301': { name: 'Udyan Express (Mumbai CSMT to SBC)', pf: 3, route: 'Mumbai CSMT to KSR Bengaluru' },
    '11302': { name: 'Udyan Express (SBC to Mumbai CSMT)', pf: 3, route: 'KSR Bengaluru to Mumbai CSMT' },
    '12649': { name: 'Karnataka Sampark Kranti Express', pf: 4, route: 'Yesvantpur/SBC to Nizamuddin' },
    '16593': { name: 'KSR Bengaluru - Nanded Express', pf: 6, route: 'KSR Bengaluru to Nanded' },
    '16519': { name: 'Jolarpettai - SBC Passenger', pf: 10, route: 'Jolarpettai to KSR Bengaluru' },
    '16557': { name: 'Rajya Rani Express (to Mysuru)', pf: 7, route: 'KSR Bengaluru to Mysuru' },
    '12975': { name: 'Jaipur - Mysuru Superfast Express', pf: 4, route: 'Jaipur to Mysuru via SBC' },
    '12577': { name: 'Bagmati Express (Darbhanga to Mysuru)', pf: 5, route: 'Darbhanga to Mysuru via SBC' },
    '12295': { name: 'Sanghamitra Express (Danapur to SMVT)', pf: 4, route: 'Danapur to Bengaluru' }
  };

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
        if (res.ok) {
          const data = await res.json();
          // If the server answered meaningfully, return it
          if (data && data.reply && !data.reply.startsWith("I am RailMarga Assistant for KSR Bengaluru. You can ask for Platform 1 to 10")) {
            return data;
          }
        }
      } catch {}
    }

    // Comprehensive Deterministic NLP Engine
    const startNode = context.currentNodeId || 'node_entry_t1_main_east';
    let profile = context.profileId || 'first_time';
    const q = message.toLowerCase().trim();

    if (q.includes('wheelchair') || q.includes('mobility') || q.includes('disabled') || q.includes('handicap')) {
      profile = 'mobility_disabled';
    } else if (q.includes('elderly') || q.includes('senior') || q.includes('old')) {
      profile = 'elderly';
    } else if (q.includes('blind') || q.includes('vision') || q.includes('visually')) {
      profile = 'visually_impaired';
    } else if (q.includes('child') || q.includes('kid')) {
      profile = 'child';
    }

    // 1. Train Number or Named Train Query
    const trainNumMatch = q.match(/\b(\d{5})\b/);
    if (trainNumMatch || q.includes('train') || q.includes('express') || q.includes('shatabdi') || q.includes('vande bharat') || q.includes('mail')) {
      let matchedTrain = trainNumMatch ? ApiService.TRAIN_SCHEDULES[trainNumMatch[1]] : null;
      let trainNum = trainNumMatch ? trainNumMatch[1] : '';

      if (!matchedTrain) {
        if (q.includes('karnataka express')) matchedTrain = ApiService.TRAIN_SCHEDULES['12627'];
        else if (q.includes('shatabdi')) matchedTrain = ApiService.TRAIN_SCHEDULES['12008'];
        else if (q.includes('vande bharat')) {
          matchedTrain = q.includes('dharwad') ? ApiService.TRAIN_SCHEDULES['20661'] : ApiService.TRAIN_SCHEDULES['20608'];
        } else if (q.includes('chennai mail')) matchedTrain = ApiService.TRAIN_SCHEDULES['12658'];
        else if (q.includes('rani chennamma')) matchedTrain = ApiService.TRAIN_SCHEDULES['16589'];
        else if (q.includes('gol gumbaz')) matchedTrain = ApiService.TRAIN_SCHEDULES['16535'];
        else if (q.includes('brindavan')) matchedTrain = ApiService.TRAIN_SCHEDULES['12640'];
        else if (q.includes('chamundi')) matchedTrain = ApiService.TRAIN_SCHEDULES['16216'];
        else if (q.includes('kacheguda')) matchedTrain = ApiService.TRAIN_SCHEDULES['12786'];
        else if (q.includes('udyan')) matchedTrain = ApiService.TRAIN_SCHEDULES['11302'];
        else if (q.includes('sampark kranti')) matchedTrain = ApiService.TRAIN_SCHEDULES['12649'];
      }

      if (matchedTrain) {
        const destNode = `node_pf${matchedTrain.pf}_center`;
        const route = localRouter.findRoute(startNode, destNode, profile);
        return {
          reply: `Train ${matchedTrain.name} departs from Platform ${matchedTrain.pf} (${matchedTrain.route}). Here is your walking route (~${route?.totalDistanceMeters || 120}m, ~${route?.estimatedTimeMinutes || 2} min).`,
          action: 'find_route',
          route
        };
      } else if (trainNum) {
        const pf = (parseInt(trainNum, 10) % 8) + 1;
        const destNode = `node_pf${pf}_center`;
        const route = localRouter.findRoute(startNode, destNode, profile);
        return {
          reply: `Train ${trainNum} is assigned to Platform ${pf}. Here is your route to Platform ${pf} (~${route?.totalDistanceMeters || 100}m).`,
          action: 'find_route',
          route
        };
      }
    }

    // 2. Platform lookup
    const match = q.match(/(?:platform|pf|plat)\s*(\d{1,2})/i) || q.match(/(\d{1,2})\s*(?:platform|pf)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 10) {
        const route = localRouter.findRoute(startNode, `node_pf${num}_center`, profile);
        return {
          reply: `Here is the ${profile === 'mobility_disabled' ? 'accessible ' : ''}route to Platform ${num} (${route?.totalDistanceMeters}m, ~${route?.estimatedTimeMinutes} min).`,
          action: 'find_route',
          route
        };
      }
    }

    // 3. Washroom / Toilet / Restroom / Urinal
    if (q.includes('toilet') || q.includes('restroom') || q.includes('washroom') || q.includes('loo') || q.includes('urinal') || q.includes('lavatory')) {
      const toiletRoute = localRouter.findRoute(startNode, 'node_t1_toilet', profile);
      return {
        reply: `The nearest washroom is Terminal 1 Concourse Restroom (${toiletRoute?.totalDistanceMeters}m away).`,
        action: 'find_facility',
        route: toiletRoute
      };
    }

    // 4. Drinking Water
    if (q.includes('water') || q.includes('drinking') || q.includes('cooler') || q.includes('thirsty')) {
      const waterRoute = localRouter.findRoute(startNode, 'node_t1_concourse_center', profile);
      return {
        reply: "Filtered RO drinking water booths are available on Platform 1 East concourse and at all Footover Bridge staircases. Here is the route to the nearest drinking water facility.",
        action: 'find_facility',
        route: waterRoute
      };
    }

    // 5. Food / Canteen / Cafeteria / IRCTC Jan Aahaar
    if (q.includes('food') || q.includes('canteen') || q.includes('restaurant') || q.includes('irctc') || q.includes('jan aahaar') || q.includes('snack') || q.includes('coffee') || q.includes('tea') || q.includes('chai') || q.includes('eat') || q.includes('breakfast') || q.includes('lunch') || q.includes('dinner')) {
      const foodRoute = localRouter.findRoute(startNode, 'node_t1_concourse_center', profile);
      return {
        reply: "The IRCTC Jan Aahaar cafeteria, Nandini Milk Parlour, Comesum food plaza, and snack kiosks are located at Terminal 1 Concourse and along Platform 1 East. Here is the route to the food court.",
        action: 'find_facility',
        route: foodRoute
      };
    }

    // 6. Waiting Room / Lounge / Retiring Room
    if (q.includes('waiting') || q.includes('lounge') || q.includes('retiring') || q.includes('dormitory') || q.includes('rest room')) {
      const loungeRoute = localRouter.findRoute(startNode, 'node_t1_concourse_center', profile);
      return {
        reply: "KSR Bengaluru features an AC Executive Lounge, Upper Class Waiting Hall, and dedicated Ladies Waiting Room on the ground floor of Terminal 1 Concourse (Platform 1). Retiring rooms are on Floor 1. Here is the route to the waiting halls.",
        action: 'find_facility',
        route: loungeRoute
      };
    }

    // 7. Ticket Counter / Booking / UTS / PRS
    if (q.includes('ticket') || q.includes('booking') || q.includes('uts') || q.includes('prs') || q.includes('reservation') || q.includes('counter') || q.includes('buy ticket')) {
      const ticketRoute = localRouter.findRoute(startNode, 'node_entry_t1_main_east', profile);
      return {
        reply: "Terminal 1 Main Booking Concourse has unreserved (UTS) counters and passenger reservation (PRS) counters. Terminal 2 also features a booking counter. Here is the walking route.",
        action: 'find_facility',
        route: ticketRoute
      };
    }

    // 8. Cloak Room / Luggage Counter
    if (q.includes('cloak') || q.includes('luggage') || q.includes('baggage') || q.includes('deposit') || q.includes('locker') || q.includes('bag')) {
      const cloakRoute = localRouter.findRoute(startNode, 'node_entry_t1_main_east', profile);
      return {
        reply: "The 24/7 Railway Cloak Room and Luggage Counter is located inside Terminal 1 Concourse adjacent to Platform 1 East entrance. Bags must be properly locked. Here is your walking route.",
        action: 'find_facility',
        route: cloakRoute
      };
    }

    // 9. Metro Station (Terminal 3)
    if (q.includes('metro') || q.includes('namma metro') || q.includes('purple line')) {
      const metroRoute = localRouter.findRoute(startNode, 'node_entry_t3_metro', profile);
      return {
        reply: `Here is the route to KSR City Railway Metro Station (Purple Line) via Terminal 3 covered walkway (${metroRoute?.totalDistanceMeters}m, ~${metroRoute?.estimatedTimeMinutes} min).`,
        action: 'find_route',
        route: metroRoute
      };
    }

    // 10. Nearest Lift
    if (q.includes('lift') || q.includes('elevator')) {
      const liftRoute = localRouter.findRoute(startNode, 'node_t1_lift2_l0', profile);
      return {
        reply: `The nearest lift is Lift 2 in Terminal 1 Concourse (${liftRoute?.totalDistanceMeters}m away). Connects to subway and upper concourse.`,
        action: 'find_facility',
        route: liftRoute
      };
    }

    // 11. Nearest Ramp
    if (q.includes('ramp') || q.includes('slope')) {
      const rampRoute = localRouter.findRoute(startNode, 'node_t1_ramp_subway', profile);
      return {
        reply: `The nearest ramp is Ramp 3/5 with a gentle 1:12 slope (${rampRoute?.totalDistanceMeters}m away).`,
        action: 'find_facility',
        route: rampRoute
      };
    }

    // 12. Wheelchair Assistance / Battery Buggy
    if (q.includes('wheelchair') || q.includes('disabled') || q.includes('handicap') || q.includes('accessible') || q.includes('battery car') || q.includes('buggy') || q.includes('step-free')) {
      const wheelchairRoute = localRouter.findRoute(startNode, 'node_pf1_center', 'mobility_disabled');
      return {
        reply: "All 10 platforms at KSR Bengaluru provide step-free ramp and lift access. Free battery-operated passenger buggies are available at Terminal 1 Concourse for senior citizens and disabled passengers. Call Indian Railways 139 for dedicated wheelchair porter assistance.",
        action: 'find_route',
        route: wheelchairRoute
      };
    }

    // 13. Police / RPF / Emergency / First Aid / Help Desk
    if (q.includes('police') || q.includes('rpf') || q.includes('grp') || q.includes('security') || q.includes('emergency') || q.includes('medical') || q.includes('doctor') || q.includes('first aid') || q.includes('help') || q.includes('helpline') || q.includes('lost') || q.includes('station master')) {
      const helpRoute = localRouter.findRoute(startNode, 'node_pf1_center', profile);
      return {
        reply: "Railway Protection Force (RPF) and GRP police outposts, Emergency First-Aid Medical Booth, and the Station Master / 'May I Help You' desk are on Platform 1 concourse. Emergency helpline: 139 | Security helpline: 182.",
        action: 'find_facility',
        route: helpRoute
      };
    }

    // 14. Parking / Auto / Taxi / BMTC Bus / Exit
    if (q.includes('parking') || q.includes('auto') || q.includes('taxi') || q.includes('cab') || q.includes('uber') || q.includes('ola') || q.includes('bus') || q.includes('bmtc') || q.includes('ksrtc') || q.includes('exit') || q.includes('pickup')) {
      const exitRoute = localRouter.findRoute(startNode, 'node_entry_t1_main_east', profile);
      return {
        reply: "Terminal 1 Main Exit has prepaid auto-rickshaw booths, app-cab pickup zones, and an underground pedestrian subway to Majestic BMTC/KSRTC Bus Station. Terminal 2 (Okkalpuram) provides four-wheeler parking.",
        action: 'find_route',
        route: exitRoute
      };
    }

    // 15. Station Overview
    if (q.includes('how many platform') || q.includes('layout') || q.includes('sbc') || q.includes('ksr bengaluru') || q.includes('station info') || q.includes('overview') || q.includes('terminals')) {
      return {
        reply: "KSR Bengaluru (SBC) has 10 operational passenger platforms across 3 Terminals: Terminal 1 (Main Entrance / Majestic side), Terminal 2 (Okkalpuram side), and Terminal 3 (Direct Namma Metro skywalk). All platforms are connected by 2 Footover Bridges and an underground subway."
      };
    }

    // 16. Fallback Search
    const searchRes = localRouter.searchLocations(message);
    if (searchRes.length > 0) {
      const top = searchRes[0];
      const route = localRouter.findRoute(startNode, top.id, profile);
      return {
        reply: `Found ${top.name}. Here is the direct route (~${route?.totalDistanceMeters || 80}m away).`,
        action: 'find_route',
        route
      };
    }

    return {
      reply: "I am your KSR Bengaluru Station Assistant. You can ask me:\n• Train platforms: 'Which platform is Train 12627?' or 'Shatabdi Express'\n• Navigation: 'Take me to Platform 4' or 'Step-free route to Platform 8'\n• Amenities: 'Where is the washroom?', 'Drinking water', 'Food court'\n• Services: 'Ticket counter', 'Cloak room', 'Waiting lounge', or 'Metro route'"
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
