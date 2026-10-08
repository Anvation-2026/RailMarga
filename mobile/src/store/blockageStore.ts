import { create } from 'zustand';
import { apiService } from '../services/apiService';
import { useNavigationStore } from './navigationStore';

interface BlockageState {
  statuses: Record<string, string>;
  toggleBlockage: (facilityId: string) => Promise<void>;
  resetAll: () => Promise<void>;
  isBlocked: (facilityId: string) => boolean;
}

const initialStatuses: Record<string, string> = {
  lift_1: 'OPEN',
  lift_2: 'OPEN',
  lift_3: 'OPEN',
  ramp_1: 'OPEN',
  ramp_2: 'OPEN',
  ramp_3: 'OPEN',
  vc_edge_lift1: 'OPEN',
  vc_edge_lift2: 'OPEN',
  vc_edge_lift3: 'OPEN'
};

export const useBlockageStore = create<BlockageState>((set, get) => ({
  statuses: { ...initialStatuses },

  toggleBlockage: async (facilityId: string) => {
    const current = get().statuses[facilityId] || 'OPEN';
    const nextStatus = current === 'OPEN' ? 'BLOCKED' : 'OPEN';

    const updated = { ...get().statuses, [facilityId]: nextStatus };
    set({ statuses: updated });

    await apiService.updateStatus(facilityId, nextStatus);

    // If blocked and user is navigating, trigger dynamic rerouting
    if (nextStatus === 'BLOCKED') {
      const nav = useNavigationStore.getState();
      if (nav.activeRoute) {
        await nav.triggerDynamicReroute(facilityId);
      }
    }
  },

  resetAll: async () => {
    const reset = { ...initialStatuses };
    set({ statuses: reset });
    for (const k of Object.keys(reset)) {
      await apiService.updateStatus(k, 'OPEN');
    }
    useNavigationStore.getState().clearBlockageAlert();
  },

  isBlocked: (facilityId: string) => {
    return get().statuses[facilityId] === 'BLOCKED';
  }
}));
