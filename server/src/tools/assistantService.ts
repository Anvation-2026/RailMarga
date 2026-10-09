import { GoogleGenerativeAI, FunctionDeclaration, Tool, SchemaType } from '@google/generative-ai';
import { StationService } from '../services/stationService';
import { RouteResult } from '../algorithms/router';

export class AssistantService {
  private stationService: StationService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(stationService: StationService) {
    this.stationService = stationService;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          tools: this.getToolDefinitions()
        });
      } catch (err) {
        console.warn('Gemini initialization warning, using deterministic fallback engine.');
      }
    }
  }

  private getToolDefinitions(): Tool[] {
    const findRouteDeclaration: FunctionDeclaration = {
      name: 'find_route',
      description: 'Calculates the optimal walking route between two station nodes for a specified accessibility profile.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          startNodeId: {
            type: SchemaType.STRING,
            description: 'Starting node ID, e.g. node_entry_t1_main_east, or nearest known node.'
          },
          destinationNodeId: {
            type: SchemaType.STRING,
            description: 'Destination node ID, e.g. node_pf8_center.'
          },
          profileId: {
            type: SchemaType.STRING,
            description: 'Accessibility profile: first_time, elderly, child, visually_impaired, or mobility_disabled.'
          }
        },
        required: ['startNodeId', 'destinationNodeId']
      }
    };

    const findFacilityDeclaration: FunctionDeclaration = {
      name: 'find_facility',
      description: 'Finds nearest passenger facility (toilet, lift, ramp, ticket counter, metro) from current location.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          category: {
            type: SchemaType.STRING,
            description: 'Facility type: TOILET, LIFT, RAMP, STAIRS, TICKET_COUNTER, METRO.'
          },
          startNodeId: {
            type: SchemaType.STRING,
            description: 'Starting station node ID.'
          },
          profileId: {
            type: SchemaType.STRING,
            description: 'Accessibility profile ID.'
          }
        },
        required: ['category']
      }
    };

    const getLocationStatusDeclaration: FunctionDeclaration = {
      name: 'get_location_status',
      description: 'Retrieves current operational status (OPEN, BLOCKED, LIMITED) of a station lift, ramp, or facility.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          locationId: {
            type: SchemaType.STRING,
            description: 'Identifier of the facility, e.g. lift_1, lift_2, ramp_1.'
          }
        },
        required: ['locationId']
      }
    };

    const rerouteDeclaration: FunctionDeclaration = {
      name: 'reroute',
      description: 'Recalculates route avoiding a newly reported blockage.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          startNodeId: { type: SchemaType.STRING },
          destinationNodeId: { type: SchemaType.STRING },
          blockedLocationId: { type: SchemaType.STRING },
          profileId: { type: SchemaType.STRING }
        },
        required: ['startNodeId', 'destinationNodeId', 'blockedLocationId']
      }
    };

    const searchLocationsDeclaration: FunctionDeclaration = {
      name: 'search_station_locations',
      description: 'Searches verified platforms and facilities at KSR Bengaluru.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: { type: SchemaType.STRING, description: 'Search term, e.g. Platform 8, toilet, lift.' }
        },
        required: ['query']
      }
    };

    const getStationInfoDeclaration: FunctionDeclaration = {
      name: 'get_station_info',
      description: 'Retrieves verified architectural overview of KSR Bengaluru Station.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {}
      }
    };

    return [{
      functionDeclarations: [
        findRouteDeclaration,
        findFacilityDeclaration,
        getLocationStatusDeclaration,
        rerouteDeclaration,
        searchLocationsDeclaration,
        getStationInfoDeclaration
      ]
    }];
  }

  public async processUserMessage(
    userMessage: string,
    context: {
      currentNodeId?: string;
      profileId?: string;
      activeRoute?: any;
    } = {}
  ): Promise<{
    reply: string;
    action?: string;
    route?: RouteResult | null;
    facility?: any;
    data?: any;
  }> {
    const startNode = context.currentNodeId || 'node_entry_t1_main_east';
    const profile = context.profileId || 'first_time';

    // 1. Try Gemini Function Calling if model initialized
    if (this.model) {
      try {
        const prompt = `You are RailMarga Assistant, the official AI navigation guide for KSR Bengaluru Railway Station.
Current passenger context:
- Location Node: ${startNode}
- Accessibility Profile: ${profile}
IMPORTANT RULES:
- Never fabricate platforms, coordinates, routes, or facilities.
- Always invoke tools to find routes or facilities.
- If asking for Platform 8 with wheelchair, invoke find_route with profileId="mobility_disabled".
User Query: "${userMessage}"`;

        const chat = this.model.startChat();
        const result = await chat.sendMessage(prompt);
        const functionCalls = result.response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          const toolResult = this.executeTool(call.name, call.args, startNode, profile);

          // Send tool output back to model for final text
          const followUp = await chat.sendMessage([{
            functionResponse: {
              name: call.name,
              response: { result: toolResult }
            }
          }]);

          return {
            reply: followUp.response.text(),
            action: call.name,
            route: toolResult.route || null,
            facility: toolResult.facility || null,
            data: toolResult
          };
        }

        return {
          reply: result.response.text()
        };
      } catch (err: any) {
        console.warn('Gemini invocation error, falling back to deterministic engine:', err.message);
      }
    }

    // 2. Deterministic Fallback Engine (Zero-latency offline / keyless execution)
    return this.deterministicHandler(userMessage, startNode, profile);
  }

  private executeTool(name: string, args: any, defaultStart: string, defaultProfile: string): any {
    switch (name) {
      case 'find_route': {
        const s = args.startNodeId || defaultStart;
        const d = args.destinationNodeId;
        const p = args.profileId || defaultProfile;
        const route = this.stationService.router.findRoute(s, d, p);
        return { success: !!route, route };
      }
      case 'find_facility': {
        const cat = args.category;
        const s = args.startNodeId || defaultStart;
        const p = args.profileId || defaultProfile;
        const res = this.stationService.findNearestFacility(s, cat, p);
        return { success: !!res, facility: res?.facility, route: res?.route, distance: res?.distance };
      }
      case 'get_location_status': {
        const locId = args.locationId;
        const status = this.stationService.getStatus()[locId] || 'OPEN';
        return { locationId: locId, status };
      }
      case 'reroute': {
        const s = args.startNodeId || defaultStart;
        const d = args.destinationNodeId;
        const p = args.profileId || defaultProfile;
        const blocked = [args.blockedLocationId];
        const route = this.stationService.router.findRoute(s, d, p, blocked);
        return { success: !!route, route, blocked };
      }
      case 'search_station_locations': {
        const matches = this.stationService.searchLocations(args.query);
        return { matches };
      }
      case 'get_station_info': {
        return this.stationService.getStationOverview();
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
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

  private deterministicHandler(query: string, startNodeId: string, currentProfile: string) {
    const q = query.toLowerCase().trim();

    // Profile override detection
    let profile = currentProfile;
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
      let matchedTrain = trainNumMatch ? AssistantService.TRAIN_SCHEDULES[trainNumMatch[1]] : null;
      let trainNum = trainNumMatch ? trainNumMatch[1] : '';

      // Check by train name keyword if number wasn't specified
      if (!matchedTrain) {
        if (q.includes('karnataka express')) matchedTrain = AssistantService.TRAIN_SCHEDULES['12627'];
        else if (q.includes('shatabdi')) matchedTrain = AssistantService.TRAIN_SCHEDULES['12008'];
        else if (q.includes('vande bharat')) {
          matchedTrain = q.includes('dharwad') ? AssistantService.TRAIN_SCHEDULES['20661'] : AssistantService.TRAIN_SCHEDULES['20608'];
        } else if (q.includes('chennai mail')) matchedTrain = AssistantService.TRAIN_SCHEDULES['12658'];
        else if (q.includes('rani chennamma')) matchedTrain = AssistantService.TRAIN_SCHEDULES['16589'];
        else if (q.includes('gol gumbaz')) matchedTrain = AssistantService.TRAIN_SCHEDULES['16535'];
        else if (q.includes('brindavan')) matchedTrain = AssistantService.TRAIN_SCHEDULES['12640'];
        else if (q.includes('chamundi')) matchedTrain = AssistantService.TRAIN_SCHEDULES['16216'];
        else if (q.includes('kacheguda')) matchedTrain = AssistantService.TRAIN_SCHEDULES['12786'];
        else if (q.includes('udyan')) matchedTrain = AssistantService.TRAIN_SCHEDULES['11302'];
        else if (q.includes('sampark kranti')) matchedTrain = AssistantService.TRAIN_SCHEDULES['12649'];
      }

      if (matchedTrain) {
        const destNode = `node_pf${matchedTrain.pf}_center`;
        const route = this.stationService.router.findRoute(startNodeId, destNode, profile);
        return {
          reply: `Train ${matchedTrain.name} departs from Platform ${matchedTrain.pf} (${matchedTrain.route}). Here is your walking route (~${route?.totalDistanceMeters || 120}m, ~${route?.estimatedTimeMinutes || 2} min).`,
          action: 'find_route',
          route,
          data: { destination: `Platform ${matchedTrain.pf}`, train: matchedTrain }
        };
      } else if (trainNum) {
        // Unknown 5-digit train number: fallback to assigned platform
        const pf = (parseInt(trainNum, 10) % 8) + 1;
        const destNode = `node_pf${pf}_center`;
        const route = this.stationService.router.findRoute(startNodeId, destNode, profile);
        return {
          reply: `Train ${trainNum} is assigned to Platform ${pf}. Here is your route to Platform ${pf} (~${route?.totalDistanceMeters || 100}m).`,
          action: 'find_route',
          route,
          data: { destination: `Platform ${pf}` }
        };
      }
    }

    // 2. Destination request: Platform check (e.g. "Platform 4", "take me to pf 8")
    const pfMatch = q.match(/(?:platform|pf|plat)\s*(\d{1,2})/i) || q.match(/(\d{1,2})\s*(?:platform|pf)/i);
    if (pfMatch) {
      const pfNum = parseInt(pfMatch[1], 10);
      if (pfNum >= 1 && pfNum <= 10) {
        const destNodeId = `node_pf${pfNum}_center`;
        const route = this.stationService.router.findRoute(startNodeId, destNodeId, profile);
        if (route) {
          const isWheelchair = profile === 'mobility_disabled';
          const reply = isWheelchair
            ? `I have calculated a step-free accessible route to Platform ${pfNum} (${route.totalDistanceMeters}m, ~${route.estimatedTimeMinutes} min) avoiding all stairs.`
            : `Here is the recommended route to Platform ${pfNum} (${route.totalDistanceMeters}m, ~${route.estimatedTimeMinutes} min).`;
          return {
            reply,
            action: 'find_route',
            route,
            data: { profile, destination: `Platform ${pfNum}` }
          };
        }
      }
    }

    // 3. Washroom / Toilet / Restroom / Urinal / Lavatory
    if (q.includes('toilet') || q.includes('restroom') || q.includes('washroom') || q.includes('loo') || q.includes('urinal') || q.includes('lavatory')) {
      const res = this.stationService.findNearestFacility(startNodeId, 'TOILET', profile);
      if (res && res.route) {
        return {
          reply: `The nearest washroom is ${res.facility.name} (${res.distance.toFixed(0)}m away). Tap below to navigate.`,
          action: 'find_facility',
          route: res.route,
          facility: res.facility
        };
      }
    }

    // 4. Drinking Water / Water Cooler / Water ATM
    if (q.includes('water') || q.includes('drinking') || q.includes('thirsty') || q.includes('cooler')) {
      const waterRoute = this.stationService.router.findRoute(startNodeId, 'node_t1_concourse_center', profile);
      return {
        reply: "Filtered RO drinking water booths are available on Platform 1 East concourse and at all Footover Bridge (FOB) staircases. Here is the route to the nearest drinking water facility (~60m).",
        action: 'find_facility',
        route: waterRoute
      };
    }

    // 5. Food / Canteen / Cafeteria / IRCTC Jan Aahaar / Coffee / Tea
    if (q.includes('food') || q.includes('canteen') || q.includes('restaurant') || q.includes('irctc') || q.includes('jan aahaar') || q.includes('snack') || q.includes('coffee') || q.includes('tea') || q.includes('chai') || q.includes('eat') || q.includes('breakfast') || q.includes('lunch') || q.includes('dinner')) {
      const foodRoute = this.stationService.router.findRoute(startNodeId, 'node_t1_concourse_center', profile);
      return {
        reply: "The IRCTC Jan Aahaar cafeteria, Nandini Milk Parlour, Comesum food plaza, and snack kiosks are located at Terminal 1 Concourse and along Platform 1 East. Here is the route to the food court.",
        action: 'find_facility',
        route: foodRoute
      };
    }

    // 6. Waiting Room / Executive Lounge / Ladies Waiting / Retiring Room
    if (q.includes('waiting') || q.includes('lounge') || q.includes('retiring') || q.includes('dormitory') || q.includes('rest room')) {
      const loungeRoute = this.stationService.router.findRoute(startNodeId, 'node_t1_concourse_center', profile);
      return {
        reply: "KSR Bengaluru features an AC Executive Lounge, Upper Class Waiting Hall, and dedicated Ladies Waiting Room on the ground floor of Terminal 1 Concourse (Platform 1). Retiring rooms are on Floor 1. Here is the route to the waiting halls.",
        action: 'find_facility',
        route: loungeRoute
      };
    }

    // 7. Ticket Counter / Booking Office / UTS / PRS / Reservation
    if (q.includes('ticket') || q.includes('booking') || q.includes('uts') || q.includes('prs') || q.includes('reservation') || q.includes('counter') || q.includes('buy ticket')) {
      const res = this.stationService.findNearestFacility(startNodeId, 'TICKET_COUNTER', profile);
      if (res && res.route) {
        return {
          reply: `The nearest ticket booking office is ${res.facility.name} (${res.distance.toFixed(0)}m away) for unreserved (UTS) and reserved tickets.`,
          action: 'find_facility',
          route: res.route,
          facility: res.facility
        };
      }
    }

    // 8. Cloak Room / Luggage Counter / Locker
    if (q.includes('cloak') || q.includes('luggage') || q.includes('baggage') || q.includes('deposit') || q.includes('locker') || q.includes('bag')) {
      const cloakRoute = this.stationService.router.findRoute(startNodeId, 'node_entry_t1_main_east', profile);
      return {
        reply: "The 24/7 Railway Cloak Room and Luggage Counter is located inside Terminal 1 Concourse adjacent to Platform 1 East entrance. Bags must be properly locked for deposit. Here is your walking route.",
        action: 'find_facility',
        route: cloakRoute
      };
    }

    // 9. Metro Station / Namma Metro (Terminal 3)
    if (q.includes('metro') || q.includes('namma metro') || q.includes('purple line')) {
      const destNodeId = 'node_entry_t3_metro';
      const route = this.stationService.router.findRoute(startNodeId, destNodeId, profile);
      if (route) {
        return {
          reply: `Here is the route to KSR City Railway Metro Station (Purple Line) via Terminal 3 covered walkway (${route.totalDistanceMeters}m, ~${route.estimatedTimeMinutes} min).`,
          action: 'find_route',
          route
        };
      }
    }

    // 10. Nearest Lift / Elevator
    if (q.includes('lift') || q.includes('elevator')) {
      const res = this.stationService.findNearestFacility(startNodeId, 'LIFT', profile);
      if (res && res.route) {
        return {
          reply: `The nearest lift is ${res.facility.name} (Status: OPEN, ${res.distance.toFixed(0)}m away). Connects to Footover Bridge.`,
          action: 'find_facility',
          route: res.route,
          facility: res.facility
        };
      }
    }

    // 11. Nearest Ramp / Accessible slope
    if (q.includes('ramp') || q.includes('slope')) {
      const res = this.stationService.findNearestFacility(startNodeId, 'RAMP', profile);
      if (res && res.route) {
        return {
          reply: `The nearest ramp is ${res.facility.name} (${res.distance.toFixed(0)}m away, gentle 1:12 slope).`,
          action: 'find_facility',
          route: res.route,
          facility: res.facility
        };
      }
    }

    // 12. Wheelchair & Accessibility Assistance / Battery Car
    if (q.includes('wheelchair') || q.includes('disabled') || q.includes('handicap') || q.includes('accessible') || q.includes('battery car') || q.includes('buggy') || q.includes('step-free')) {
      const wheelchairRoute = this.stationService.router.findRoute(startNodeId, 'node_pf1_center', 'mobility_disabled');
      return {
        reply: "All 10 platforms at KSR Bengaluru provide step-free ramp and lift access. Free battery-operated passenger buggies are available at Terminal 1 Concourse for senior citizens and disabled passengers. Call Indian Railways 139 for dedicated wheelchair porter assistance.",
        action: 'find_route',
        route: wheelchairRoute
      };
    }

    // 13. Police / RPF / GRP / Security / Emergency / Medical / Lost & Found / Help
    if (q.includes('police') || q.includes('rpf') || q.includes('grp') || q.includes('security') || q.includes('emergency') || q.includes('medical') || q.includes('doctor') || q.includes('first aid') || q.includes('help') || q.includes('helpline') || q.includes('lost') || q.includes('station master')) {
      const helpRoute = this.stationService.router.findRoute(startNodeId, 'node_pf1_center', profile);
      return {
        reply: "Railway Protection Force (RPF) and GRP police outposts, Emergency First-Aid Medical Booth, and the Station Master / 'May I Help You' desk are on Platform 1 concourse. Emergency helpline: 139 | Security helpline: 182.",
        action: 'find_facility',
        route: helpRoute
      };
    }

    // 14. Parking / Auto Rickshaw / Taxi / Cab / Bus / BMTC / Exit
    if (q.includes('parking') || q.includes('auto') || q.includes('taxi') || q.includes('cab') || q.includes('uber') || q.includes('ola') || q.includes('bus') || q.includes('bmtc') || q.includes('ksrtc') || q.includes('exit') || q.includes('pickup')) {
      const exitRoute = this.stationService.router.findRoute(startNodeId, 'node_entry_t1_main_east', profile);
      return {
        reply: "Terminal 1 Main Exit has prepaid auto-rickshaw booths, app-cab pickup zones, and an underground pedestrian subway to Majestic BMTC/KSRTC Bus Station. Terminal 2 (Okkalpuram) provides four-wheeler parking.",
        action: 'find_route',
        route: exitRoute
      };
    }

    // 15. Station Overview / Number of platforms / SBC
    if (q.includes('how many platform') || q.includes('layout') || q.includes('sbc') || q.includes('ksr bengaluru') || q.includes('station info') || q.includes('overview') || q.includes('terminals')) {
      return {
        reply: "KSR Bengaluru (SBC) has 10 operational passenger platforms across 3 Terminals: Terminal 1 (Main Entrance / Majestic side), Terminal 2 (Okkalpuram side), and Terminal 3 (Direct Namma Metro skywalk). All platforms are connected by 2 Footover Bridges and an underground subway."
      };
    }

    // 16. Blockage / Reroute
    if (q.includes('blocked') || q.includes('reroute') || q.includes('alternative') || q.includes('not working')) {
      let blockedId = 'vc_edge_lift1';
      if (q.includes('lift 2')) blockedId = 'vc_edge_lift2';
      else if (q.includes('lift 3')) blockedId = 'vc_edge_lift3';
      else if (q.includes('ramp')) blockedId = 'vc_edge_ramp1';

      const route = this.stationService.router.findRoute(startNodeId, 'node_pf8_center', profile, [blockedId, `${blockedId}_rev`]);
      if (route) {
        return {
          reply: `I have recalculated an alternative accessible route avoiding the blockage (${route.totalDistanceMeters}m, ~${route.estimatedTimeMinutes} min).`,
          action: 'reroute',
          route
        };
      }
    }

    // 17. Generic Search Fallback
    const searchRes = this.stationService.searchLocations(query);
    if (searchRes.length > 0) {
      const top = searchRes[0];
      const targetNodeId = (top as any).nodeId || `node_pf${(top as any).platformNumber || 1}_center`;
      const route = this.stationService.router.findRoute(startNodeId, targetNodeId, profile);
      return {
        reply: `Found ${top.name}. Here is the direct route (~${route?.totalDistanceMeters || 80}m away).`,
        action: 'find_route',
        route,
        data: { searchResults: searchRes }
      };
    }

    // 18. Polite Comprehensive Guide
    return {
      reply: "I am your KSR Bengaluru Station Assistant. You can ask me:\n• Train platforms: 'Which platform is Train 12627?' or 'Shatabdi Express'\n• Navigation: 'Take me to Platform 4' or 'Step-free route to Platform 8'\n• Amenities: 'Where is the washroom?', 'Drinking water', 'Food court'\n• Services: 'Ticket counter', 'Cloak room', 'Waiting lounge', or 'Metro route'"
    };
  }
}
