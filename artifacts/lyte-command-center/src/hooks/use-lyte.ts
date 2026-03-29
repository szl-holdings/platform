import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LyteIncident } from "../lib/api";

export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: async () => {
      return await api.signals.list();
    },
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
    queryFn: async () => {
      return await api.incidents.list();
    },
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
    queryFn: async () => {
      return await api.recommendations.list();
    },
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
    queryFn: async () => {
      return await api.playbooks.list();
    },
  });
}

export function useCommandCards() {
  return useQuery({
    queryKey: ["commandCards"],
    queryFn: async () => {
      return await api.commandCards.list();
    },
  });
}

export function useExecutiveSummary() {
  return useQuery({
    queryKey: ["executiveSummary"],
    queryFn: async () => {
      return await api.executiveSummary();
    },
  });
}
