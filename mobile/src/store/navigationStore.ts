import { create } from 'zustand';
import { RouteResult, StationNode, localRouter } from '../services/localRouter';
import { apiService } from '../services/apiService';
import { voiceService } from '../services/voiceService';

export type SourceMethod = 'SEARCH' | 'MAP' | 'QR' | 'GPS' | 'FACILITY' | 'PLATFORM' | null;
export type DestinationMethod = 'SEARCH' | 'MAP' | 'FACILITY' | 'PLATFORM' | null;

interface NavigationState {
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

  setStartNode: (node, method = 'SEARCH') => {
    set({ startNode: node, sourceMethod: node ? method : null });
    const { destinationNode } = get();
    if (node && destinationNode) {
      get().calculateRoute();
    } else {
      set({ activeRoute: null });
    }
  },

  setDestinationNode: (node, method = 'SEARCH') => {
    set({ destinationNode: node, destinationMethod: node ? method : null });
    const { startNode } = get();
    if (startNode && node) {
      get().calculateRoute();
    } else {
      set({ activeRoute: null });
    }
  },

  swapSourceAndDestination: () => {
    const { startNode, destinationNode, sourceMethod, destinationMethod } = get();
    set({
      startNode: destinationNode,
      destinationNode: startNode,
      sourceMethod: destinationMethod as SourceMethod,
      destinationMethod: sourceMethod as DestinationMethod
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
      set({ activeRoute: null });
      return null;
    }

    const route = await apiService.getRoute(startNode.id, destinationNode.id, selectedProfile);
    if (route) {
      set({ activeRoute: route, currentStepIndex: 0 });
    }
    return route;
  },

  startNavigation: (customRoute) => {
    const route = customRoute || get().activeRoute;
    if (!route) return;
    set({ activeRoute: route, isNavigating: true, currentStepIndex: 0 });

    if (route.steps.length > 0 && get().voiceEnabled) {
      voiceService.speak(route.steps[0].voiceText);
    }
  },

  stopNavigation: () => {
    voiceService.stop();
    set({ isNavigating: false, currentStepIndex: 0, blockageAlert: null });
  },

  resetNavigation: () => {
    voiceService.stop();
    set({
      startNode: null,
      destinationNode: null,
      sourceMethod: null,
      destinationMethod: null,
      activeRoute: null,
      isNavigating: false,
      currentStepIndex: 0,
      blockageAlert: null,
      mapSelectionMode: 'none'
    });
  },

  advanceStep: () => {
    const { activeRoute, currentStepIndex, voiceEnabled } = get();
    if (!activeRoute) return;
    if (currentStepIndex < activeRoute.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      set({ currentStepIndex: nextIdx });
      if (voiceEnabled) {
        voiceService.speak(activeRoute.steps[nextIdx].voiceText);
      }
    } else {
      if (voiceEnabled) {
        voiceService.speak(`You have reached your destination: ${activeRoute.destination.name}.`);
      }
      set({ isNavigating: false });
    }
  },

  previousStep: () => {
    const { activeRoute, currentStepIndex, voiceEnabled } = get();
    if (!activeRoute || currentStepIndex === 0) return;
    const prevIdx = currentStepIndex - 1;
    set({ currentStepIndex: prevIdx });
    if (voiceEnabled) {
      voiceService.speak(activeRoute.steps[prevIdx].voiceText);
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

  triggerDynamicReroute: async (blockedFacilityId: string) => {
    const { startNode, destinationNode, selectedProfile, voiceEnabled } = get();
    if (!startNode || !destinationNode) return;

    set({ blockageAlert: `⚠️ PATH BLOCKED: ${blockedFacilityId} is unavailable. Recalculating route...` });
    if (voiceEnabled) {
      voiceService.speak(`Warning. ${blockedFacilityId} is currently blocked. Recalculating an alternative route.`);
    }

    const newRoute = await apiService.reroute(startNode.id, destinationNode.id, selectedProfile, blockedFacilityId);
    if (newRoute) {
      set({ activeRoute: newRoute, currentStepIndex: 0 });
      setTimeout(() => {
        if (voiceEnabled && newRoute.steps.length > 0) {
          voiceService.speak(`Alternative route found. ${newRoute.steps[0].voiceText}`);
        }
      }, 2500);
    }
  },

  clearBlockageAlert: () => set({ blockageAlert: null })
}));
