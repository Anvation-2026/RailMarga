import { create } from 'zustand';
import { RouteResult, StationNode, localRouter, Coordinates } from '../services/localRouter';
import { apiService } from '../services/apiService';
import { voiceService } from '../services/voiceService';
import { locationService } from '../services/locationService';
import { evaluateRouteProgress, pointDistance } from '../services/pathGeometryUtils';

export type SourceMethod = 'SEARCH' | 'MAP' | 'QR' | 'GPS' | 'FACILITY' | 'PLATFORM' | null;
export type DestinationMethod = 'SEARCH' | 'MAP' | 'FACILITY' | 'PLATFORM' | null;
export type LocationSource = 'LIVE GPS' | 'QR VERIFIED' | 'REAL STEPS (PDR)' | 'MANUAL' | 'DEMO SIMULATION' | null;
export type CameraMode = 'FOLLOW_USER' | 'NORTH_UP' | 'FOLLOW_DIRECTION' | 'FREE_PAN';
export type SimulationSpeed = 0.5 | 1 | 2 | 4;

let simulationTimer: any = null;
let simulatedPoints: Coordinates[] = [];
let simCurrentIndex = 0;

/**
 * Interpolate points along a polyline geometry so points are smooth and evenly spaced (12 map units apart)
 */
function interpolateGeometry(points: Coordinates[], stepSize: number = 12): Coordinates[] {
  if (!points || points.length < 2) return points ? [...points] : [];
  const result: Coordinates[] = [points[0]];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = pointDistance(p1, p2);
    if (dist <= stepSize) {
      result.push(p2);
      continue;
    }
    const numSteps = Math.floor(dist / stepSize);
    for (let s = 1; s <= numSteps; s++) {
      const t = s / (numSteps + 1);
      result.push({
        x: Math.round(p1.x + (p2.x - p1.x) * t),
        y: Math.round(p1.y + (p2.y - p1.y) * t)
      });
    }
    result.push(p2);
  }

  return result;
}

interface NavigationState {
  // Existing state
  startNode: StationNode | null;
  destinationNode: StationNode | null;
  sourceMethod: SourceMethod;
  destinationMethod: DestinationMethod;
  selectedProfile: string;
  activeRoute: RouteResult | null;
  currentStepIndex: number;
  isNavigating: boolean;
  isOnline: boolean;
  voiceEnabled: boolean;
  blockageAlert: string | null;
  mapSelectionMode: 'none' | 'source' | 'destination';

  // Live Location & Positioning
  userLocation: Coordinates | null;
  userHeading: number | null;
  userAccuracy: number | null;
  locationSource: LocationSource;
  gpsRaw: { latitude: number; longitude: number; accuracy: number | null } | null;

  // Camera & Navigation Experience
  isFollowingUser: boolean;
  cameraMode: CameraMode;
  recenterRequested: number; // timestamp to trigger snap

  // Dynamic Route Progress
  completedGeometry: Coordinates[];
  remainingGeometry: Coordinates[];
  remainingDistanceMeters: number;
  remainingEtaMinutes: number;
  isArrived: boolean;
  consecutiveOffRouteCount: number;

  // Demo Simulation & PDR Step Mode
  isSimulating: boolean;
  simulationSpeed: SimulationSpeed;
  isPdrActive: boolean;
  stepCount: number;
  totalSteps: number;

  // Existing Actions
  setStartNode: (node: StationNode | null, method?: SourceMethod) => void;
  setDestinationNode: (node: StationNode | null, method?: DestinationMethod) => void;
  swapSourceAndDestination: () => void;
  setMapSelectionMode: (mode: 'none' | 'source' | 'destination') => void;
  setProfile: (profileId: string) => void;
  calculateRoute: () => Promise<RouteResult | null>;
  startNavigation: (route?: RouteResult) => void;
  stopNavigation: () => void;
  resetNavigation: () => void;
  advanceStep: () => void;
  previousStep: () => void;
  toggleVoice: () => void;
  checkNetwork: () => Promise<void>;
  triggerDynamicReroute: (blockedFacilityId: string) => Promise<void>;
  clearBlockageAlert: () => void;

  // Live Navigation Actions
  setUserLocation: (
    coords: Coordinates,
    source: LocationSource,
    heading?: number | null,
    accuracy?: number | null
  ) => void;
  setCameraMode: (mode: CameraMode) => void;
  setFollowingUser: (following: boolean) => void;
  recenterOnUser: () => void;
  updateProgressFromLocation: (coords: Coordinates) => void;
  startGpsTracking: () => Promise<boolean>;
  stopGpsTracking: () => void;
  startSimulation: (speed?: SimulationSpeed) => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  restartSimulation: () => void;
  setSimulationSpeed: (speed: SimulationSpeed) => void;
  startPdrMode: () => void;
  takePdrStep: () => void;
  stopPdrMode: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  startNode: null,
  destinationNode: null,
  sourceMethod: null,
  destinationMethod: null,
  selectedProfile: 'first_time',
  activeRoute: null,
  currentStepIndex: 0,
  isNavigating: false,
  isOnline: false,
  voiceEnabled: true,
  blockageAlert: null,
  mapSelectionMode: 'none',

  userLocation: null,
  userHeading: null,
  userAccuracy: null,
  locationSource: null,
  gpsRaw: null,

  isFollowingUser: true,
  cameraMode: 'FOLLOW_USER',
  recenterRequested: 0,

  completedGeometry: [],
  remainingGeometry: [],
  remainingDistanceMeters: 0,
  remainingEtaMinutes: 0,
  isArrived: false,
  consecutiveOffRouteCount: 0,

  isSimulating: false,
  simulationSpeed: 1,
  isPdrActive: false,
  stepCount: 0,
  totalSteps: 0,

  setStartNode: (node, method = 'SEARCH') => {
    set({ startNode: node, sourceMethod: node ? method : null });
    if (node) {
      set({
        userLocation: { ...node.coordinates },
        locationSource: method === 'QR' ? 'QR VERIFIED' : 'MANUAL'
      });
    }
    const { destinationNode } = get();
    if (node && destinationNode) {
      get().calculateRoute();
    } else {
      set({ activeRoute: null, completedGeometry: [], remainingGeometry: [] });
    }
  },

  setDestinationNode: (node, method = 'SEARCH') => {
    set({ destinationNode: node, destinationMethod: node ? method : null, isArrived: false });
    const { startNode } = get();
    if (startNode && node) {
      get().calculateRoute();
    } else {
      set({ activeRoute: null, completedGeometry: [], remainingGeometry: [] });
    }
  },

  swapSourceAndDestination: () => {
    const { startNode, destinationNode, sourceMethod, destinationMethod } = get();
    set({
      startNode: destinationNode,
      destinationNode: startNode,
      sourceMethod: destinationMethod as SourceMethod,
      destinationMethod: sourceMethod as DestinationMethod,
      userLocation: destinationNode ? { ...destinationNode.coordinates } : null,
      isArrived: false
    });
    if (destinationNode && startNode) {
      get().calculateRoute();
    }
  },

  setMapSelectionMode: (mode) => set({ mapSelectionMode: mode }),

  setProfile: (profileId: string) => {
    set({ selectedProfile: profileId });
    const { startNode, destinationNode } = get();
    if (startNode && destinationNode) {
      get().calculateRoute();
    }
  },

  calculateRoute: async () => {
    const { startNode, destinationNode, selectedProfile } = get();
    if (!startNode || !destinationNode) {
      set({ activeRoute: null, completedGeometry: [], remainingGeometry: [] });
      return null;
    }

    const route = await apiService.getRoute(startNode.id, destinationNode.id, selectedProfile);
    if (route) {
      set({
        activeRoute: route,
        currentStepIndex: 0,
        completedGeometry: [],
        remainingGeometry: [...route.pathGeometry],
        remainingDistanceMeters: route.totalDistanceMeters,
        remainingEtaMinutes: route.estimatedTimeMinutes,
        isArrived: false
      });
    }
    return route;
  },

  startNavigation: (customRoute?: any) => {
    const route = customRoute && typeof customRoute === 'object' && Array.isArray(customRoute.steps)
      ? customRoute
      : get().activeRoute;
    if (!route || !Array.isArray(route.steps)) return;

    const initialLocation = get().userLocation || (route.start ? { ...route.start.coordinates } : null);

    set({
      activeRoute: route,
      isNavigating: true,
      currentStepIndex: 0,
      userLocation: initialLocation,
      locationSource: get().locationSource || 'MANUAL',
      isFollowingUser: true,
      cameraMode: 'FOLLOW_USER',
      recenterRequested: Date.now(),
      completedGeometry: [],
      remainingGeometry: [...route.pathGeometry],
      remainingDistanceMeters: route.totalDistanceMeters,
      remainingEtaMinutes: route.estimatedTimeMinutes,
      isArrived: false,
      consecutiveOffRouteCount: 0
    });

    if (route.steps.length > 0 && get().voiceEnabled && route.steps[0]?.voiceText) {
      voiceService.speak(route.steps[0].voiceText);
    }
  },

  stopNavigation: () => {
    if (simulationTimer) {
      clearInterval(simulationTimer);
      simulationTimer = null;
    }
    locationService.stopWatching();
    voiceService.stop();
    set({
      isNavigating: false,
      isSimulating: false,
      isPdrActive: false,
      currentStepIndex: 0,
      blockageAlert: null,
      isArrived: false
    });
  },

  resetNavigation: () => {
    if (simulationTimer) {
      clearInterval(simulationTimer);
      simulationTimer = null;
    }
    locationService.stopWatching();
    voiceService.stop();
    set({
      startNode: null,
      destinationNode: null,
      sourceMethod: null,
      destinationMethod: null,
      activeRoute: null,
      isNavigating: false,
      isSimulating: false,
      isPdrActive: false,
      currentStepIndex: 0,
      blockageAlert: null,
      mapSelectionMode: 'none',
      userLocation: null,
      userHeading: null,
      userAccuracy: null,
      locationSource: null,
      completedGeometry: [],
      remainingGeometry: [],
      remainingDistanceMeters: 0,
      remainingEtaMinutes: 0,
      isArrived: false,
      consecutiveOffRouteCount: 0
    });
  },

  advanceStep: () => {
    const { activeRoute, currentStepIndex, voiceEnabled } = get();
    if (!activeRoute) return;
    if (currentStepIndex < activeRoute.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      set({ currentStepIndex: nextIdx });
      if (voiceEnabled) {
        const step = activeRoute.steps[nextIdx];
        voiceService.speak(step?.voiceText || step?.instruction || '');
      }
    } else {
      if (voiceEnabled) {
        voiceService.speak(`You have reached your destination: ${activeRoute.destination.name}.`);
      }
      set({ isArrived: true });
    }
  },

  previousStep: () => {
    const { activeRoute, currentStepIndex, voiceEnabled } = get();
    if (!activeRoute || currentStepIndex === 0) return;
    const prevIdx = currentStepIndex - 1;
    set({ currentStepIndex: prevIdx });
    if (voiceEnabled) {
      const step = activeRoute.steps[prevIdx];
      voiceService.speak(step?.voiceText || step?.instruction || '');
    }
  },

  toggleVoice: () => {
    const next = !get().voiceEnabled;
    voiceService.setEnabled(next);
    set({ voiceEnabled: next });
  },

  checkNetwork: async () => {
    const online = await apiService.checkConnectivity();
    set({ isOnline: online });
  },

  // Dynamic Rerouting starting from CURRENT PASSENGER LOCATION
  triggerDynamicReroute: async (blockedFacilityId: string) => {
    const { userLocation, startNode, destinationNode, selectedProfile, voiceEnabled, isNavigating } = get();
    if (!destinationNode) return;

    // Anchor from userLocation if navigating, else from startNode
    let effectiveStartNode = startNode;
    if (userLocation && isNavigating) {
      const nearest = localRouter.findNearestNode(userLocation);
      if (nearest && nearest.node) {
        effectiveStartNode = nearest.node;
      }
    }

    if (!effectiveStartNode) return;

    set({
      blockageAlert: `PATH BLOCKED: ${blockedFacilityId} is unavailable. Recalculating route...`
    });

    if (voiceEnabled) {
      voiceService.speak(`Warning. ${blockedFacilityId} is currently blocked. Recalculating route from your current position.`);
    }

    const newRoute = await apiService.reroute(
      effectiveStartNode.id,
      destinationNode.id,
      selectedProfile,
      blockedFacilityId
    );

    if (newRoute) {
      set({
        activeRoute: newRoute,
        currentStepIndex: 0,
        completedGeometry: [],
        remainingGeometry: [...newRoute.pathGeometry],
        remainingDistanceMeters: newRoute.totalDistanceMeters,
        remainingEtaMinutes: newRoute.estimatedTimeMinutes,
        consecutiveOffRouteCount: 0
      });

      // Update simulation path if currently running
      if (get().isSimulating) {
        simulatedPoints = interpolateGeometry(newRoute.pathGeometry, 12);
        simCurrentIndex = 0;
      }

      setTimeout(() => {
        if (get().voiceEnabled && newRoute.steps.length > 0) {
          const firstStep = newRoute.steps[0];
          voiceService.speak(`Alternative route found. ${firstStep?.voiceText || firstStep?.instruction || ''}`);
        }
      }, 2000);
    }
  },

  clearBlockageAlert: () => set({ blockageAlert: null }),

  // Set User Location and update heading/accuracy
  setUserLocation: (coords, source, heading = null, accuracy = null) => {
    set({
      userLocation: coords,
      locationSource: source,
      userHeading: heading ?? get().userHeading,
      userAccuracy: accuracy ?? get().userAccuracy
    });
    get().updateProgressFromLocation(coords);
  },

  setCameraMode: (mode) => {
    set({ cameraMode: mode, isFollowingUser: mode === 'FOLLOW_USER' || mode === 'FOLLOW_DIRECTION' });
  },

  setFollowingUser: (following) => {
    set({
      isFollowingUser: following,
      cameraMode: following ? 'FOLLOW_USER' : 'FREE_PAN'
    });
  },

  recenterOnUser: () => {
    set({
      isFollowingUser: true,
      cameraMode: 'FOLLOW_USER',
      recenterRequested: Date.now()
    });
  },

  // Evaluate progress along actual route geometry & check off-route/arrival
  updateProgressFromLocation: (coords: Coordinates) => {
    const { activeRoute, destinationNode, voiceEnabled, currentStepIndex, isNavigating } = get();
    if (!activeRoute || !activeRoute.pathGeometry || activeRoute.pathGeometry.length === 0) return;

    // 1. Arrival Detection
    if (destinationNode) {
      const distToDest = pointDistance(coords, destinationNode.coordinates);
      // Arrival threshold: 45 map units (~15 meters)
      if (distToDest <= 45 && !get().isArrived) {
        set({
          isArrived: true,
          remainingDistanceMeters: 0,
          remainingEtaMinutes: 0
        });
        if (voiceEnabled) {
          voiceService.speak(`Arrived. You have reached your destination: ${destinationNode.name}.`);
        }
        if (get().isSimulating) {
          get().pauseSimulation();
        }
        return;
      }
    }

    // 2. Route Geometry Progress Projection
    const progress = evaluateRouteProgress(coords, activeRoute.pathGeometry, activeRoute.steps);

    // 3. Off-Route Detection: distance to path > 85 map units (~28 meters)
    const OFF_ROUTE_THRESHOLD = 85;
    if (progress.distanceToPath > OFF_ROUTE_THRESHOLD && isNavigating) {
      const count = get().consecutiveOffRouteCount + 1;
      set({ consecutiveOffRouteCount: count });

      // After 2 consecutive off-route readings, trigger automatic recalculation from current position
      if (count >= 2) {
        set({ consecutiveOffRouteCount: 0 });
        const nearest = localRouter.findNearestNode(coords);
        if (nearest && nearest.node && destinationNode && nearest.node.id !== destinationNode.id) {
          if (voiceEnabled) {
            voiceService.speak('Off route detected. Recalculating from your current position.');
          }
          apiService
            .getRoute(nearest.node.id, destinationNode.id, get().selectedProfile)
            .then((recalculated) => {
              if (recalculated) {
                set({
                  activeRoute: recalculated,
                  currentStepIndex: 0,
                  completedGeometry: [],
                  remainingGeometry: [...recalculated.pathGeometry],
                  remainingDistanceMeters: recalculated.totalDistanceMeters,
                  remainingEtaMinutes: recalculated.estimatedTimeMinutes
                });
                if (get().isSimulating) {
                  simulatedPoints = interpolateGeometry(recalculated.pathGeometry, 12);
                  simCurrentIndex = 0;
                }
              }
            });
        }
      }
      return;
    } else {
      set({ consecutiveOffRouteCount: 0 });
    }

    // 4. Update route progress geometry & stats
    const etaMins = Math.max(1, Math.ceil(progress.remainingDistanceMeters / 60)); // ~60m/min walking speed
    set({
      completedGeometry: progress.completedGeometry,
      remainingGeometry: progress.remainingGeometry,
      remainingDistanceMeters: progress.remainingDistanceMeters,
      remainingEtaMinutes: etaMins
    });

    // 5. Turn-by-Turn Instruction Step Advancement
    if (progress.suggestedStepIndex !== currentStepIndex && progress.suggestedStepIndex < activeRoute.steps.length) {
      set({ currentStepIndex: progress.suggestedStepIndex });
      if (voiceEnabled) {
        const nextStep = activeRoute.steps[progress.suggestedStepIndex];
        if (nextStep) {
          voiceService.speak(nextStep.voiceText || nextStep.instruction);
        }
      }
    }
  },

  // Real GPS Watching (Expo Location + Web)
  startGpsTracking: async () => {
    const started = await locationService.startWatching(
      (reading) => {
        set({
          gpsRaw: {
            latitude: reading.latitude,
            longitude: reading.longitude,
            accuracy: reading.accuracy
          },
          userAccuracy: reading.accuracy,
          userHeading: reading.heading
        });

        // If outdoor GPS is available, clearly indicate LIVE GPS
        // Note: Real indoor KSR station positions use Station CAD coordinates.
        // We preserve CAD geometry and do not claim fabricated centimeter indoor GPS.
        const currentLoc = get().userLocation;
        if (!currentLoc && get().startNode) {
          set({
            userLocation: { ...get().startNode!.coordinates },
            locationSource: 'LIVE GPS'
          });
        } else if (currentLoc) {
          set({ locationSource: 'LIVE GPS' });
        }
      },
      (err) => {
        console.warn('GPS tracking error:', err);
      }
    );
    return started;
  },

  stopGpsTracking: () => {
    locationService.stopWatching();
  },

  // Demo Simulation Mode (Follows exact route geometry)
  startSimulation: (speed = 1) => {
    const { activeRoute, isNavigating } = get();
    if (!activeRoute || !activeRoute.pathGeometry || activeRoute.pathGeometry.length < 2) return;

    if (!isNavigating) {
      get().startNavigation();
    }

    if (simulationTimer) {
      clearInterval(simulationTimer);
      simulationTimer = null;
    }

    simulatedPoints = interpolateGeometry(activeRoute.pathGeometry, 14);
    simCurrentIndex = 0;

    set({
      isSimulating: true,
      isPdrActive: false,
      simulationSpeed: speed,
      locationSource: 'DEMO SIMULATION',
      isArrived: false,
      isFollowingUser: true,
      cameraMode: 'FOLLOW_USER'
    });

    const intervalMs = speed === 4 ? 60 : speed === 2 ? 140 : speed === 0.5 ? 560 : 280;

    simulationTimer = setInterval(() => {
      if (simCurrentIndex >= simulatedPoints.length) {
        clearInterval(simulationTimer);
        simulationTimer = null;
        set({ isSimulating: false, isArrived: true, remainingDistanceMeters: 0, remainingEtaMinutes: 0 });
        if (get().voiceEnabled && get().destinationNode) {
          voiceService.speak(`Arrived. You have reached your destination: ${get().destinationNode!.name}.`);
        }
        return;
      }

      const pCurr = simulatedPoints[simCurrentIndex];
      const pNext = simulatedPoints[Math.min(simCurrentIndex + 1, simulatedPoints.length - 1)];

      // Compute heading angle in degrees (0 = North/Up)
      let heading: number | null = null;
      if (pCurr && pNext && (pCurr.x !== pNext.x || pCurr.y !== pNext.y)) {
        const rad = Math.atan2(pNext.y - pCurr.y, pNext.x - pCurr.x);
        heading = Math.round((rad * 180) / Math.PI + 90);
      }

      set({
        userLocation: pCurr,
        userHeading: heading,
        userAccuracy: null,
        locationSource: 'DEMO SIMULATION'
      });

      get().updateProgressFromLocation(pCurr);
      simCurrentIndex++;
    }, intervalMs);
  },

  pauseSimulation: () => {
    if (simulationTimer) {
      clearInterval(simulationTimer);
      simulationTimer = null;
    }
    set({ isSimulating: false });
  },

  resumeSimulation: () => {
    const { simulationSpeed } = get();
    if (simCurrentIndex < simulatedPoints.length) {
      set({ isSimulating: true });
      const intervalMs = simulationSpeed === 4 ? 60 : simulationSpeed === 2 ? 140 : simulationSpeed === 0.5 ? 560 : 280;
      simulationTimer = setInterval(() => {
        if (simCurrentIndex >= simulatedPoints.length) {
          clearInterval(simulationTimer);
          simulationTimer = null;
          set({ isSimulating: false, isArrived: true, remainingDistanceMeters: 0, remainingEtaMinutes: 0 });
          return;
        }
        const pCurr = simulatedPoints[simCurrentIndex];
        const pNext = simulatedPoints[Math.min(simCurrentIndex + 1, simulatedPoints.length - 1)];
        let heading: number | null = null;
        if (pCurr && pNext && (pCurr.x !== pNext.x || pCurr.y !== pNext.y)) {
          const rad = Math.atan2(pNext.y - pCurr.y, pNext.x - pCurr.x);
          heading = Math.round((rad * 180) / Math.PI + 90);
        }
        set({ userLocation: pCurr, userHeading: heading, locationSource: 'DEMO SIMULATION' });
        get().updateProgressFromLocation(pCurr);
        simCurrentIndex++;
      }, intervalMs);
    }
  },

  restartSimulation: () => {
    simCurrentIndex = 0;
    get().startSimulation(get().simulationSpeed);
  },

  setSimulationSpeed: (speed) => {
    set({ simulationSpeed: speed });
    if (get().isSimulating) {
      get().pauseSimulation();
      get().resumeSimulation();
    }
  },

  startPdrMode: () => {
    const { activeRoute, isNavigating } = get();
    if (!activeRoute || !activeRoute.pathGeometry || activeRoute.pathGeometry.length < 2) return;
    if (!isNavigating) {
      get().startNavigation();
    }
    if (simulationTimer) {
      clearInterval(simulationTimer);
      simulationTimer = null;
    }
    simulatedPoints = interpolateGeometry(activeRoute.pathGeometry, 6);
    simCurrentIndex = 0;
    const total = Math.ceil(activeRoute.totalDistanceMeters / 0.75);
    set({
      isPdrActive: true,
      isSimulating: false,
      locationSource: 'REAL STEPS (PDR)',
      stepCount: 0,
      totalSteps: total,
      isFollowingUser: true,
      cameraMode: 'FOLLOW_USER'
    });
  },

  takePdrStep: () => {
    const { isArrived, stepCount } = get();
    if (isArrived || !simulatedPoints || simulatedPoints.length === 0) return;
    const nextIdx = Math.min(simCurrentIndex + 1, simulatedPoints.length - 1);
    simCurrentIndex = nextIdx;
    const pCurr = simulatedPoints[simCurrentIndex];
    const pNext = simulatedPoints[Math.min(simCurrentIndex + 1, simulatedPoints.length - 1)];
    let heading: number | null = null;
    if (pCurr && pNext && (pCurr.x !== pNext.x || pCurr.y !== pNext.y)) {
      const rad = Math.atan2(pNext.y - pCurr.y, pNext.x - pCurr.x);
      heading = Math.round((rad * 180) / Math.PI + 90);
    }
    set({
      userLocation: pCurr,
      userHeading: heading,
      locationSource: 'REAL STEPS (PDR)',
      stepCount: stepCount + 1
    });
    get().updateProgressFromLocation(pCurr);
    if (simCurrentIndex >= simulatedPoints.length - 1) {
      set({ isArrived: true, remainingDistanceMeters: 0, remainingEtaMinutes: 0 });
      if (get().voiceEnabled && get().destinationNode) {
        voiceService.speak(`Arrived. You have reached your destination: ${get().destinationNode!.name}.`);
      }
    }
  },

  stopPdrMode: () => {
    set({ isPdrActive: false });
  }
}));
