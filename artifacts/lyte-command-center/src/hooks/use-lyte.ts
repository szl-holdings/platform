import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LyteIncident } from "../lib/api";
import { signals as demoSignals, incidents as demoIncidents, recommendations as demoRecommendations, playbooks as demoPlaybooks } from "../lib/mock-data";

function isAuthError(e: unknown): boolean {
  return e instanceof Error && (e.message.includes("HTTP 401") || e.message.includes("HTTP 403"));
}

export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: async () => {
      try {
        return await api.signals.list();
      } catch (e) {
        if (isAuthError(e)) return demoSignals;
        throw e;
      }
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
      try {
        return await api.incidents.list();
      } catch (e) {
        if (isAuthError(e)) return demoIncidents;
        throw e;
      }
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
      try {
        return await api.recommendations.list();
      } catch (e) {
        if (isAuthError(e)) return demoRecommendations;
        throw e;
      }
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
      try {
        return await api.playbooks.list();
      } catch (e) {
        if (isAuthError(e)) return demoPlaybooks;
        throw e;
      }
    },
  });
}

export function useCommandCards() {
  return useQuery({
    queryKey: ["commandCards"],
    queryFn: async () => {
      try {
        return await api.commandCards.list();
      } catch (e) {
        if (isAuthError(e)) return [];
        throw e;
      }
    },
  });
}

export function useExecutiveSummary() {
  return useQuery({
    queryKey: ["executiveSummary"],
    queryFn: async () => {
      try {
        return await api.executiveSummary();
      } catch (e) {
        if (isAuthError(e)) return {};
        throw e;
      }
    },
  });
}
