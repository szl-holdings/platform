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

export interface DomainSnapshot {
  domain: string;
  entityCount: number;
  activeCount: number;
  edgeCount: number;
  avgConfidence: number;
  topEntityTypes: Array<{ type: string; count: number }>;
  staleFraction: number;
  healthScore: number;
  summary: string;
}

export interface ExecutiveBrief {
  generatedAt: string;
  totalEntities: number;
  totalEdges: number;
  crossDomainLinks: number;
  overallHealthScore: number;
  domains: DomainSnapshot[];
  highlights: string[];
  alerts: Array<{ domain: string; message: string; severity: "info" | "warning" | "critical" }>;
}

export interface DomainDrift {
  domain: string;
  totalEntities: number;
  avgConfidence: number;
  confidenceDrift: number;
  freshnessWindows: Array<{ windowHours: number; staleCount: number; stalePercent: number }>;
  driftScore: number;
  status: "healthy" | "degraded" | "critical";
}

export interface DriftSummary {
  measuredAt: string;
  overallDriftScore: number;
  status: "healthy" | "degraded" | "critical";
  domains: DomainDrift[];
  topAlerts: Array<{ domain: string; reason: string; severity: "warning" | "critical" }>;
}

export interface DeploymentRecord {
  appId: string;
  appName: string;
  version: string;
  environment: "development" | "staging" | "production";
  status: "active" | "deploying" | "rolled-back" | "failed" | "inactive";
  deployedAt: string;
  deployedBy: string;
  commitSha?: string;
  notes?: string;
}

async function rawFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error ?? "";
    } catch {
      // ignore
    }
    throw new Error(`Request failed: ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`);
  }
  return (await res.json()) as T;
}

export function useExecutiveBrief() {
  return useQuery({
    queryKey: ["pulse", "executive-brief"],
    queryFn: () => rawFetch<ExecutiveBrief>("/api/briefings"),
    refetchInterval: 60_000,
  });
}

export function useDriftSummary() {
  return useQuery({
    queryKey: ["pulse", "drift"],
    queryFn: () => rawFetch<DriftSummary>("/api/drift"),
    refetchInterval: 60_000,
  });
}

export interface DriftHistorySnapshot {
  measuredAt: string;
  overallDriftScore: number;
  status: "healthy" | "degraded" | "critical";
  domains: DomainDrift[];
  topAlerts: Array<{ domain: string; reason: string; severity: "warning" | "critical" }>;
}

export interface DriftHistoryResponse {
  snapshots: DriftHistorySnapshot[];
  count: number;
}

export function useDriftHistory() {
  return useQuery({
    queryKey: ["pulse", "drift-history"],
    queryFn: () => rawFetch<DriftHistoryResponse>("/api/drift/history"),
    refetchInterval: 60_000,
  });
}

export function useDeployments(environment: "production" | "staging" | "development" = "production") {
  return useQuery({
    queryKey: ["pulse", "deployments", environment],
    queryFn: () =>
      rawFetch<{ deployments: DeploymentRecord[]; environment: string; count: number }>(
        `/api/deployments?environment=${environment}`,
      ),
    refetchInterval: 60_000,
  });
}

export function useApproveBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      rawFetch<{ id: string; status: string; approvedAt: string }>(
        `/api/briefings/${encodeURIComponent(id)}/approve`,
        { method: "PUT" },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pulse", "briefings"] });
      qc.invalidateQueries({ queryKey: ["pulse", "briefing"] });
      qc.invalidateQueries({ queryKey: ["pulse", "today"] });
    },
  });
}

export function useArchiveBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      rawFetch<{ id: string; status: string; archivedAt: string }>(
        `/api/briefings/${encodeURIComponent(id)}/archive`,
        { method: "PUT" },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pulse", "briefings"] });
      qc.invalidateQueries({ queryKey: ["pulse", "briefing"] });
      qc.invalidateQueries({ queryKey: ["pulse", "today"] });
    },
  });
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
