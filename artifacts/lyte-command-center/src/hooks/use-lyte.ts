import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSandboxMode } from "@workspace/shared-ui";
import { api, type LyteIncident, type LyteAction, type LyteSavedView } from "../lib/api";
import { lyteSignals as mockSignals, lyteIncidents as mockIncidents, lyteRecommendations as mockRecommendations, lytePlaybooks as mockPlaybooks } from "@workspace/services";

export function useSignals() {
  const { sandboxActive, resetKey } = useSandboxMode();
  return useQuery({
    queryKey: ["signals", sandboxActive ? "sandbox" : "live", resetKey],
    queryFn: sandboxActive ? async () => mockSignals as unknown[] : () => api.signals.list(),
  });
}

export function useUpdateSignal() {
  const { sandboxActive } = useSandboxMode();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (sandboxActive) {
        const signal = mockSignals.find(s => s.id === id);
        if (signal) signal.status = status;
        return signal;
      }
      return await api.signals.update(id, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signals"] }),
  });
}

export function useIncidents() {
  const { sandboxActive, resetKey } = useSandboxMode();
  return useQuery({
    queryKey: ["incidents", sandboxActive ? "sandbox" : "live", resetKey],
    queryFn: sandboxActive ? async () => mockIncidents as unknown[] : () => api.incidents.list(),
  });
}

export function useCreateIncident() {
  const { sandboxActive } = useSandboxMode();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<LyteIncident>) => {
      if (sandboxActive) {
        return { id: Date.now(), ...data };
      }
      return await api.incidents.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

export function useUpdateIncident() {
  const { sandboxActive } = useSandboxMode();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<LyteIncident>) => {
      if (sandboxActive) {
        const incident = mockIncidents.find(i => i.id === id);
        if (incident) Object.assign(incident, data);
        return incident;
      }
      return await api.incidents.update(id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

export function useRecommendations() {
  const { sandboxActive, resetKey } = useSandboxMode();
  return useQuery({
    queryKey: ["recommendations", sandboxActive ? "sandbox" : "live", resetKey],
    queryFn: sandboxActive ? async () => mockRecommendations as unknown[] : () => api.recommendations.list(),
  });
}

export function useUpdateRecommendation() {
  const { sandboxActive } = useSandboxMode();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (sandboxActive) {
        const rec = mockRecommendations.find(r => r.id === id);
        if (rec) rec.status = status;
        return rec;
      }
      return await api.recommendations.update(id, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
  });
}

export function usePlaybooks() {
  const { sandboxActive, resetKey } = useSandboxMode();
  return useQuery({
    queryKey: ["playbooks", sandboxActive ? "sandbox" : "live", resetKey],
    queryFn: sandboxActive ? async () => mockPlaybooks as unknown[] : () => api.playbooks.list(),
  });
}

export function useCommandCards() {
  const { sandboxActive, resetKey } = useSandboxMode();
  return useQuery({
    queryKey: ["commandCards", sandboxActive ? "sandbox" : "live", resetKey],
    queryFn: () => api.commandCards.list(),
  });
}

export function useExecutiveSummary() {
  const { sandboxActive, resetKey } = useSandboxMode();
  return useQuery({
    queryKey: ["executiveSummary", sandboxActive ? "sandbox" : "live", resetKey],
    queryFn: sandboxActive
      ? async () => ({
          openIncidents: mockIncidents.filter(i => i.status !== "resolved").length,
          criticalSignals: mockSignals.filter(s => s.severity === "critical").length,
          pendingActions: 7,
          systemHealth: 91,
          riskScore: 68,
          trend: "stable" as const,
        })
      : () => api.executiveSummary(),
  });
}

export function useActions(params?: { role?: string; state?: string }) {
  const { sandboxActive, resetKey } = useSandboxMode();
  return useQuery({
    queryKey: ["actions", params, sandboxActive ? "sandbox" : "live", resetKey],
    queryFn: () => api.actions.list(params),
  });
}

export function useUpdateAction() {
  const { sandboxActive } = useSandboxMode();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<LyteAction>) => {
      if (sandboxActive) return { id, ...data };
      return await api.actions.update(id, data);
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ["actions"] });
      const previous = queryClient.getQueriesData({ queryKey: ["actions"] });
      queryClient.setQueriesData({ queryKey: ["actions"] }, (old: LyteAction[] | undefined) => {
        if (!old) return old;
        return old.map(a => a.id === id ? { ...a, ...data } : a);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["actions"] }),
  });
}

export function useSavedViews(role?: string) {
  return useQuery({
    queryKey: ["savedViews", role],
    queryFn: () => api.views.list(role as any),
  });
}

export function useCreateSavedView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LyteSavedView>) => api.views.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savedViews"] }),
  });
}

export function useDeleteSavedView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.views.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savedViews"] }),
  });
}

export function useReadiness() {
  const { sandboxActive, resetKey } = useSandboxMode();
  return useQuery({
    queryKey: ["readiness", sandboxActive ? "sandbox" : "live", resetKey],
    queryFn: () => api.readiness.get(),
  });
}

export function useUpdateReadinessItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; status?: string; score?: number }) => {
      return await api.readiness.update(id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["readiness"] }),
  });
}
