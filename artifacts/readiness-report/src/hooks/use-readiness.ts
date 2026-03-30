import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { mockPrograms, mockDimensions, mockRisks, mockAlerts, mockMilestones, mockScoreHistory } from "@/lib/mock-data";

function isAuthError(e: unknown): boolean {
  return e instanceof Error && (e.message.includes("HTTP 401") || e.message.includes("HTTP 403"));
}

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
    queryFn: async () => {
      try {
        const result = await api.programs.list();
        return ((result.data || result) as unknown) as Program[];
      } catch (e) {
        if (isAuthError(e)) return mockPrograms as unknown as Program[];
        throw e;
      }
    }
  });
}

export function useProgram(id: number) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: async () => {
      try {
        return (await api.programs.get(id) as unknown) as Program;
      } catch (e) {
        if (isAuthError(e)) return (mockPrograms.find(p => String(p.id) === String(id)) || mockPrograms[0]) as unknown as Program;
        throw e;
      }
    }
  });
}

export function useDimensions(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['dimensions', programId],
    queryFn: async () => {
      try {
        return (await api.dimensions.listForProgram(programId) as unknown) as Dimension[];
      } catch (e) {
        if (isAuthError(e)) return mockDimensions as unknown as Dimension[];
        throw e;
      }
    }
  });
}

export function useMilestones(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['milestones', programId],
    queryFn: async () => {
      try {
        return (await api.milestones.listForProgram(programId) as unknown) as Milestone[];
      } catch (e) {
        if (isAuthError(e)) return mockMilestones as unknown as Milestone[];
        throw e;
      }
    }
  });
}

export function useRisks(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['risks', programId],
    queryFn: async () => {
      try {
        return (await api.risks.listForProgram(programId) as unknown) as Risk[];
      } catch (e) {
        if (isAuthError(e)) return mockRisks as unknown as Risk[];
        throw e;
      }
    }
  });
}

export function useAlerts(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['alerts', programId],
    queryFn: async () => {
      try {
        return (await api.alerts.listForProgram(programId) as unknown) as Alert[];
      } catch (e) {
        if (isAuthError(e)) return mockAlerts as unknown as Alert[];
        throw e;
      }
    }
  });
}

export function useScoreHistory(programId: number = ACTIVE_PROGRAM_ID) {
  return useQuery({
    queryKey: ['scoreHistory', programId],
    queryFn: async () => {
      try {
        const dims = (await api.dimensions.listForProgram(programId) as unknown) as Dimension[];
        const allScores: ScoreHistory[] = [];
        for (const dim of dims) {
          const scores = (await api.dimensions.scores(dim.id) as unknown) as ScoreHistory[];
          allScores.push(...scores);
        }
        return allScores;
      } catch (e) {
        if (isAuthError(e)) return mockScoreHistory as unknown as ScoreHistory[];
        throw e;
      }
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
