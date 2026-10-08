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

  private deterministicHandler(query: string, startNodeId: string, currentProfile: string) {
    const q = query.toLowerCase();

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

    // 1. Destination request: Platform check
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

    // 2. Nearest Toilet / Restroom
    if (q.includes('toilet') || q.includes('restroom') || q.includes('washroom')) {
      const res = this.stationService.findNearestFacility(startNodeId, 'TOILET', profile);
      if (res && res.route) {
        return {
          reply: `The nearest restroom is ${res.facility.name} (${res.distance.toFixed(0)}m away).`,
          action: 'find_facility',
          route: res.route,
          facility: res.facility
        };
      }
    }

    // 3. Nearest Lift
    if (q.includes('lift') || q.includes('elevator')) {
      const res = this.stationService.findNearestFacility(startNodeId, 'LIFT', profile);
      if (res && res.route) {
        return {
          reply: `The nearest lift is ${res.facility.name} (${res.distance.toFixed(0)}m away).`,
          action: 'find_facility',
          route: res.route,
          facility: res.facility
        };
      }
    }

    // 4. Metro station
    if (q.includes('metro') || q.includes('namma metro')) {
      const destNodeId = 'node_entry_t3_metro';
      const route = this.stationService.router.findRoute(startNodeId, destNodeId, profile);
      if (route) {
        return {
          reply: `Here is the route to KSR City Railway Metro Station via Terminal 3 (${route.totalDistanceMeters}m, ~${route.estimatedTimeMinutes} min).`,
          action: 'find_route',
          route
        };
      }
    }

    // 5. Blockage / Reroute
    if (q.includes('blocked') || q.includes('reroute') || q.includes('alternative') || q.includes('not working')) {
      // Find candidate blocked element
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

    // 6. Generic Location Query
    const searchRes = this.stationService.searchLocations(query);
    if (searchRes.length > 0) {
      const top = searchRes[0];
      return {
        reply: `Found ${top.name}. Would you like to navigate there?`,
        data: { searchResults: searchRes }
      };
    }

    return {
      reply: "I am RailMarga Assistant for KSR Bengaluru. You can ask for Platform 1 to 10, accessible wheelchair routes, nearest toilets, lifts, or the Metro."
    };
  }
}
