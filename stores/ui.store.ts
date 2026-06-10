import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activePipeline: string | null;
  channelStatus: {
    form: boolean;
    sms: boolean;
    demo_ada: boolean;
    demo_ai: boolean;
    demo_missed_call: boolean;
    qr: boolean;
  };

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePipeline: (pipelineId: string | null) => void;
  setChannelStatus: (channel: keyof UIState['channelStatus'], active: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activePipeline: null,
  channelStatus: {
    form: true,
    sms: true,
    demo_ada: true,
    demo_ai: true,
    demo_missed_call: true,
    qr: false,
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePipeline: (pipelineId) => set({ activePipeline: pipelineId }),
  setChannelStatus: (channel, active) =>
    set((state) => ({
      channelStatus: { ...state.channelStatus, [channel]: active },
    })),
}));
