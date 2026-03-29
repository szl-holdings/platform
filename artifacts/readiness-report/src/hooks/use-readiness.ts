import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Program = {
  id: number;
  name: string;
  description: string;
  overallScore: number | string;
  targetScore: number | string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  owner: string;
  createdAt: string;
};

export type Dimension = {
  id: number;
  programId: number;
  name: string;
  category: string;
  currentScore: number | string;
  targetScore: number | string;
  maxScore: number | string;
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
  score: number | string;
  notes: string;
  recordedAt: string;
};

const ACTIVE_PROGRAM_ID = 1;

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const result = await api.programs.list();
      return (result.data || result) as Program[];
    }
  });
}

export function useProgram(id: number) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: async () => {
      return await api.programs.get(id) as Program;
    }
  });
}

export function useDimensions(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['dimensions', programId],
    queryFn: async () => {
      return await api.dimensions.listForProgram(programId) as Dimension[];
    }
  });
}

export function useMilestones(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['milestones', programId],
    queryFn: async () => {
      return await api.milestones.listForProgram(programId) as Milestone[];
    }
  });
}

export function useRisks(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['risks', programId],
    queryFn: async () => {
      return await api.risks.listForProgram(programId) as Risk[];
    }
  });
}

export function useAlerts(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['alerts', programId],
    queryFn: async () => {
      return await api.alerts.listForProgram(programId) as Alert[];
    }
  });
}

export function useScoreHistory(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['scoreHistory', programId],
    queryFn: async () => {
      const dims = await api.dimensions.listForProgram(programId) as Dimension[];
      const allScores: ScoreHistory[] = [];
      for (const dim of dims) {
        const scores = await api.dimensions.scores(dim.id) as ScoreHistory[];
        allScores.push(...scores);
      }
      return allScores;
    }
  });
}

export function useUpdateMilestoneStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: Milestone['status'] }) => {
      return await api.milestones.update(id, { status });
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
      return await api.risks.update(id, { status });
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
      return await api.alerts.update(id, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });
}
