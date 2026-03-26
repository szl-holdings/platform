import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  mockPrograms, 
  mockDimensions, 
  mockMilestones, 
  mockRisks, 
  mockAlerts, 
  mockScoreHistory,
  type Program,
  type Dimension,
  type Milestone,
  type Risk,
  type Alert,
  type ScoreHistory
} from "@/lib/mock-data";

// Simulate network delay
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to filter by active program (default to first one for demo)
const ACTIVE_PROGRAM_ID = "p_1";

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      await delay();
      return mockPrograms;
    }
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: async () => {
      await delay();
      return mockPrograms.find(p => p.id === id);
    }
  });
}

export function useDimensions(programId: string = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['dimensions', programId],
    queryFn: async () => {
      await delay();
      return mockDimensions.filter(d => d.programId === programId);
    }
  });
}

export function useMilestones(programId: string = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['milestones', programId],
    queryFn: async () => {
      await delay();
      return mockMilestones.filter(m => m.programId === programId).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }
  });
}

export function useRisks(programId: string = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['risks', programId],
    queryFn: async () => {
      await delay();
      return mockRisks.filter(r => r.programId === programId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  });
}

export function useAlerts(programId: string = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['alerts', programId],
    queryFn: async () => {
      await delay();
      return mockAlerts.filter(a => a.programId === programId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  });
}

export function useScoreHistory(programId: string = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['scoreHistory', programId],
    queryFn: async () => {
      await delay();
      // Aggregate dimensions for this program
      const dims = mockDimensions.filter(d => d.programId === programId);
      const dimIds = dims.map(d => d.id);
      return mockScoreHistory.filter(sh => dimIds.includes(sh.dimensionId));
    }
  });
}

// --- Mutations ---
export function useUpdateMilestoneStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: Milestone['status'] }) => {
      await delay();
      const idx = mockMilestones.findIndex(m => m.id === id);
      if (idx !== -1) mockMilestones[idx].status = status;
      return mockMilestones[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    }
  });
}

export function useUpdateRiskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: Risk['status'] }) => {
      await delay();
      const idx = mockRisks.findIndex(r => r.id === id);
      if (idx !== -1) mockRisks[idx].status = status;
      return mockRisks[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] });
    }
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await delay();
      const idx = mockAlerts.findIndex(a => a.id === id);
      if (idx !== -1) mockAlerts[idx].isRead = true;
      return mockAlerts[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });
}
