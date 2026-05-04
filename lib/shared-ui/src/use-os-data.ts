import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api-fetch';
import type { Recommendation, RecommendationAction, Run, SourceHealthRecord } from './os-layer';
import type { EvalResult } from './RunConsole';

export function useOsRecommendations(variant: string) {
  return useQuery<Recommendation[]>({
    queryKey: ['os-recommendations', variant],
    queryFn: () => apiFetch<Recommendation[]>(`/v1/os/recommendations?variant=${variant}`, { skipAuth: true }),
    staleTime: 30_000,
  });
}

export function useOsSourceHealth(variant: string) {
  return useQuery<SourceHealthRecord[]>({
    queryKey: ['os-source-health', variant],
    queryFn: () => apiFetch<SourceHealthRecord[]>(`/v1/os/source-health?variant=${variant}`, { skipAuth: true }),
    staleTime: 60_000,
  });
}

export function useOsRuns(variant: string) {
  return useQuery<Run[]>({
    queryKey: ['os-runs', variant],
    queryFn: () => apiFetch<Run[]>(`/v1/os/runs?variant=${variant}`, { skipAuth: true }),
    staleTime: 60_000,
  });
}

export function useOsEvalResults() {
  return useQuery<EvalResult[]>({
    queryKey: ['os-eval-results'],
    queryFn: () => apiFetch<EvalResult[]>('/v1/os/eval-results', { skipAuth: true }),
    staleTime: 120_000,
  });
}

export function useOsAction(variant: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recId,
      action,
      justification,
    }: {
      recId: string;
      action: RecommendationAction;
      justification?: string;
    }) => {
      return apiFetch<Recommendation>(`/v1/os/recommendations/${recId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, justification }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-recommendations', variant] });
    },
  });
}

export function useOsCommandKpis() {
  return useQuery({
    queryKey: ['os-command-kpis'],
    queryFn: () => apiFetch('/v1/os/command/kpis', { skipAuth: true }),
    staleTime: 30_000,
  });
}

export function useOsCommandBrief() {
  return useQuery({
    queryKey: ['os-command-brief'],
    queryFn: () => apiFetch('/v1/os/command/brief', { skipAuth: true }),
    staleTime: 30_000,
  });
}

export function useOsCommandWatchlist() {
  return useQuery({
    queryKey: ['os-command-watchlist'],
    queryFn: () => apiFetch('/v1/os/command/watchlist', { skipAuth: true }),
    staleTime: 30_000,
  });
}

export function useOsCommandCorrelations() {
  return useQuery({
    queryKey: ['os-command-correlations'],
    queryFn: () => apiFetch('/v1/os/command/correlations', { skipAuth: true }),
    staleTime: 30_000,
  });
}

export function useOsPlatformStats() {
  return useQuery({
    queryKey: ['os-platform-stats'],
    queryFn: () => apiFetch('/v1/os/platform/stats', { skipAuth: true }),
    staleTime: 30_000,
  });
}
