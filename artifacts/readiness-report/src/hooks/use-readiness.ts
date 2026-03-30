import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockPrograms, mockDimensions, mockRisks, mockAlerts, mockMilestones, mockScoreHistory } from "@/lib/mock-data";

export type Program = {
  id: number;
  name: string;
  description: string;
  overallScore: number;
  targetScore: number;
  status: 'active' | 'paused' | 'completed' | 'archived';
  owner: string;
  createdAt: string;
};

export type Dimension = {
  id: number;
  programId: number;
  name: string;
  category: string;
  currentScore: number;
  targetScore: number;
  maxScore: number;
  assessorName: string;
  lastAssessedAt: string;
};

export type Milestone = {
  id: number;
  programId: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'canceled';
  dueDate: string;
  owner: string;
};

export type Risk = {
  id: number;
  programId: number;
  dimensionId?: number;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: 'very_likely' | 'likely' | 'possible' | 'unlikely';
  status: 'open' | 'mitigating' | 'resolved' | 'accepted';
  mitigation: string;
  owner: string;
  createdAt: string;
};

export type Alert = {
  id: number;
  programId: number;
  type: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  isRead: boolean;
  createdAt: string;
};

export type ScoreHistory = {
  id: number;
  dimensionId: number;
  programId: number;
  score: number;
  notes: string;
  recordedAt: string;
};

const ACTIVE_PROGRAM_ID = 1;

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => mockPrograms as unknown as Program[],
    staleTime: Infinity,
  });
}

export function useProgram(id: number) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: async () => (mockPrograms.find(p => String(p.id) === String(id)) || mockPrograms[0]) as unknown as Program,
    staleTime: Infinity,
  });
}

export function useDimensions(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['dimensions', programId],
    queryFn: async () => mockDimensions as unknown as Dimension[],
    staleTime: Infinity,
  });
}

export function useMilestones(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['milestones', programId],
    queryFn: async () => mockMilestones as unknown as Milestone[],
    staleTime: Infinity,
  });
}

export function useRisks(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['risks', programId],
    queryFn: async () => mockRisks as unknown as Risk[],
    staleTime: Infinity,
  });
}

export function useAlerts(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['alerts', programId],
    queryFn: async () => mockAlerts as unknown as Alert[],
    staleTime: Infinity,
  });
}

export function useScoreHistory(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['scoreHistory', programId],
    queryFn: async () => mockScoreHistory as unknown as ScoreHistory[],
    staleTime: Infinity,
  });
}

export function useUpdateMilestoneStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: Milestone['status'] }) => {
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    }
  });
}

export function useUpdateRiskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: Risk['status'] }) => {
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] });
    }
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return { id, isRead: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });
}
