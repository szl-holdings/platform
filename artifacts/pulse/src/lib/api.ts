import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Briefing, DissentRecord, CustomBriefRequest, DomainKey, RiskLevel } from "./data";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { success?: boolean; error?: string } & Record<string, unknown>;
  if (data && data.success === false) {
    throw new Error(data.error ?? "Request unsuccessful");
  }
  return data as T;
}

export interface ConfidenceHistoryEntry {
  date: string;
  maritime: number;
  security: number;
  real_estate: number;
  legal: number;
  financial: number;
  platform: number;
}

export function useTodaysBrief() {
  return useQuery({
    queryKey: ["pulse", "today"],
    queryFn: () => apiFetch<{ success: true; briefing: Briefing }>("/api/pulse/today"),
    select: (d) => d.briefing,
  });
}

export function useBriefings(filters?: { domain?: DomainKey | "all"; risk?: RiskLevel | "all" }) {
  const params = new URLSearchParams();
  if (filters?.domain && filters.domain !== "all") params.set("domain", filters.domain);
  if (filters?.risk && filters.risk !== "all") params.set("risk", filters.risk);
  const qs = params.toString();
  const path = qs ? `/api/pulse/briefings?${qs}` : "/api/pulse/briefings";

  return useQuery({
    queryKey: ["pulse", "briefings", filters?.domain ?? "all", filters?.risk ?? "all"],
    queryFn: () => apiFetch<{ success: true; briefings: Briefing[]; total: number }>(path),
    select: (d) => d.briefings,
  });
}

export function useBriefing(id: string | undefined) {
  return useQuery({
    queryKey: ["pulse", "briefing", id],
    queryFn: () => apiFetch<{ success: true; briefing: Briefing }>(`/api/pulse/briefings/${id}`),
    select: (d) => d.briefing,
    enabled: !!id,
  });
}

export function useConfidenceHistory() {
  return useQuery({
    queryKey: ["pulse", "confidence"],
    queryFn: () => apiFetch<{ success: true; history: ConfidenceHistoryEntry[] }>("/api/pulse/confidence"),
    select: (d) => d.history,
  });
}

export function useDissents() {
  return useQuery({
    queryKey: ["pulse", "dissents"],
    queryFn: () => apiFetch<{ success: true; dissents: DissentRecord[] }>("/api/pulse/dissents"),
    select: (d) => d.dissents,
  });
}

export interface FileDissentInput {
  briefingId?: string;
  sectionId?: string;
  sectionTitle: string;
  dissentingView: string;
  basis: string;
  impactIfCorrect?: string;
}

export function useFileDissent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FileDissentInput) =>
      apiFetch<{ success: true; dissent: DissentRecord }>("/api/pulse/dissents", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pulse", "dissents"] });
    },
  });
}

export function useCustomBriefs() {
  return useQuery({
    queryKey: ["pulse", "custom"],
    queryFn: () => apiFetch<{ success: true; requests: CustomBriefRequest[] }>("/api/pulse/custom"),
    select: (d) => d.requests,
  });
}

export interface RequestCustomBriefInput {
  topic: string;
  entity?: string;
  scenario?: string;
  domains?: DomainKey[];
  agents?: string[];
}

export function useRequestCustomBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RequestCustomBriefInput) =>
      apiFetch<{ success: true; request: CustomBriefRequest }>("/api/pulse/custom", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pulse", "custom"] });
    },
  });
}
