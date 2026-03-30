import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LyteIncident, type LyteAction, type LyteSavedView } from "../lib/api";

export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: () => api.signals.list(),
  });
}

export function useUpdateSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await api.signals.update(id, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signals"] }),
  });
}

export function useIncidents() {
  return useQuery({
    queryKey: ["incidents"],
    queryFn: () => api.incidents.list(),
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<LyteIncident>) => {
      return await api.incidents.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<LyteIncident>) => {
      return await api.incidents.update(id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.recommendations.list(),
  });
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await api.recommendations.update(id, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
  });
}

export function usePlaybooks() {
  return useQuery({
    queryKey: ["playbooks"],
    queryFn: () => api.playbooks.list(),
  });
}

export function useCommandCards() {
  return useQuery({
    queryKey: ["commandCards"],
    queryFn: () => api.commandCards.list(),
  });
}

export function useExecutiveSummary() {
  return useQuery({
    queryKey: ["executiveSummary"],
    queryFn: () => api.executiveSummary(),
  });
}

export function useActions(params?: { role?: string; state?: string }) {
  return useQuery({
    queryKey: ["actions", params],
    queryFn: () => api.actions.list(params),
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<LyteAction>) => {
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
    queryFn: () => api.views.list(role),
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
  return useQuery({
    queryKey: ["readiness"],
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
