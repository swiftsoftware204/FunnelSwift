import { create } from 'zustand';
import { Contact, Tag, Event, LeadWithDetails, Pipeline, PipelineStage } from '@/types';

interface LeadsState {
  leads: Contact[];
  selectedLead: LeadWithDetails | null;
  tags: Tag[];
  pipelines: Pipeline[];
  pipelineStages: PipelineStage[];
  recentEvents: Event[];
  isLoading: boolean;

  // Actions
  setLeads: (leads: Contact[]) => void;
  addLead: (lead: Contact) => void;
  updateLead: (id: string, updates: Partial<Contact>) => void;
  removeLead: (id: string) => void;
  setSelectedLead: (lead: LeadWithDetails | null) => void;
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  setPipelines: (pipelines: Pipeline[]) => void;
  setPipelineStages: (stages: PipelineStage[]) => void;
  setRecentEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useLeadsStore = create<LeadsState>((set) => ({
  leads: [],
  selectedLead: null,
  tags: [],
  pipelines: [],
  pipelineStages: [],
  recentEvents: [],
  isLoading: false,

  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLead: (id, updates) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === id ? { ...lead, ...updates } : lead
      ),
      selectedLead:
        state.selectedLead?.id === id
          ? { ...state.selectedLead, ...updates }
          : state.selectedLead,
    })),
  removeLead: (id) =>
    set((state) => ({
      leads: state.leads.filter((lead) => lead.id !== id),
      selectedLead: state.selectedLead?.id === id ? null : state.selectedLead,
    })),
  setSelectedLead: (lead) => set({ selectedLead: lead }),
  setTags: (tags) => set({ tags }),
  addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
  setPipelines: (pipelines) => set({ pipelines }),
  setPipelineStages: (stages) => set({ pipelineStages: stages }),
  setRecentEvents: (events) => set({ recentEvents: events }),
  addEvent: (event) =>
    set((state) => ({ recentEvents: [event, ...state.recentEvents].slice(0, 50) })),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
