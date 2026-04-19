import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Briefing, DissentRecord, CustomBriefRequest, DomainKey, RiskLevel } from "./data";
import {
  detectSessionRevocationCode,
  extractServerMessage,
  notifySessionRevoked,
} from "@szl-holdings/shared-ui/session-revocation";

// The demo token is the PIN entered via the PIN modal in App.tsx.
// It is stored in sessionStorage by verifyAndStoreDemoPin() after the server
// validates it. The PIN is never placed in the client bundle or the URL.
const DEMO_TOKEN_KEY = "pulse-demo-token";
const DEMO_ALLOWED = import.meta.env.DEV || import.meta.env.VITE_DEMO_ALLOWED === "true";

export function isDemoMode(): boolean {
  if (!DEMO_ALLOWED) return false;
  return !!sessionStorage.getItem(DEMO_TOKEN_KEY);
}

async function demoApiFetch<T>(path: string): Promise<T> {
  const token = sessionStorage.getItem(DEMO_TOKEN_KEY);
  if (!token) throw new Error("demo_session_expired");
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-demo-token": token,
    },
  });
  if (!res.ok) throw new Error(`Demo API ${res.status}`);
  return res.json() as Promise<T>;
}

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
    if (res.status === 401) {
      const errBody = await res.clone().json().catch(() => null);
      const code = detectSessionRevocationCode(errBody);
      if (code) {
        notifySessionRevoked(code, { message: extractServerMessage(errBody) ?? undefined });
      }
    }
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
    queryFn: async () => {
      if (isDemoMode()) {
        return demoApiFetch<{ success: true; briefing: Briefing }>("/api/pulse/demo/today");
      }
      return apiFetch<{ success: true; briefing: Briefing }>("/api/pulse/today");
    },
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
    queryFn: async () => {
      if (isDemoMode()) {
        const data = await demoApiFetch<{ success: true; briefings: Briefing[]; total: number }>("/api/pulse/demo/briefings");
        if (filters?.domain && filters.domain !== "all") {
          data.briefings = data.briefings.filter(b => b.domains.includes(filters.domain as DomainKey));
        }
        if (filters?.risk && filters.risk !== "all") {
          data.briefings = data.briefings.filter(b => b.overallRisk === filters.risk);
        }
        return data;
      }
      return apiFetch<{ success: true; briefings: Briefing[]; total: number }>(path);
    },
    select: (d) => d.briefings,
  });
}

export function useBriefing(id: string | undefined) {
  return useQuery({
    queryKey: ["pulse", "briefing", id],
    queryFn: async () => {
      if (isDemoMode()) {
        // In demo mode, fetch the full briefings list and find by ID.
        // Falls back to today's briefing if the specific ID isn't in the demo set.
        const all = await demoApiFetch<{ success: true; briefings: Briefing[]; total: number }>("/api/pulse/demo/briefings");
        const match = all.briefings.find((b) => b.id === id);
        if (match) return { success: true as const, briefing: match };
        // ID not in demo set — return today's as the closest proxy
        return demoApiFetch<{ success: true; briefing: Briefing }>("/api/pulse/demo/today");
      }
      return apiFetch<{ success: true; briefing: Briefing }>(`/api/pulse/briefings/${id}`);
    },
    select: (d) => d.briefing,
    enabled: !!id,
  });
}

export function useConfidenceHistory() {
  return useQuery({
    queryKey: ["pulse", "confidence"],
    queryFn: async () => {
      if (isDemoMode()) {
        return demoApiFetch<{ success: true; history: ConfidenceHistoryEntry[] }>("/api/pulse/demo/confidence");
      }
      return apiFetch<{ success: true; history: ConfidenceHistoryEntry[] }>("/api/pulse/confidence");
    },
    select: (d) => d.history,
  });
}

export function useDissents() {
  return useQuery({
    queryKey: ["pulse", "dissents"],
    queryFn: async () => {
      if (isDemoMode()) {
        return demoApiFetch<{ success: true; dissents: DissentRecord[] }>("/api/pulse/demo/dissents");
      }
      return apiFetch<{ success: true; dissents: DissentRecord[] }>("/api/pulse/dissents");
    },
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

export function useGenerateBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (isDemoMode()) {
        return Promise.reject(new Error("Live AI generation is disabled in demo mode. Sign in to generate a fresh briefing."));
      }
      return apiFetch<{ success: true; briefing: Briefing; briefingId: string; message: string }>(
        "/api/pulse/briefings/generate",
        { method: "POST", body: JSON.stringify({}) },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pulse", "today"] });
      qc.invalidateQueries({ queryKey: ["pulse", "briefings"] });
    },
  });
}

export function useFileDissent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FileDissentInput) => {
      if (isDemoMode()) {
        return Promise.reject(new Error("Write operations are not available in demo mode. Sign in to file a dissent."));
      }
      return apiFetch<{ success: true; dissent: DissentRecord }>("/api/pulse/dissents", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pulse", "dissents"] });
    },
  });
}

export function useCustomBriefs() {
  return useQuery({
    queryKey: ["pulse", "custom"],
    queryFn: () => {
      if (isDemoMode()) {
        // Custom briefs are not available in demo mode; return an empty list
        return Promise.resolve({ success: true as const, requests: [] as CustomBriefRequest[] });
      }
      return apiFetch<{ success: true; requests: CustomBriefRequest[] }>("/api/pulse/custom");
    },
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

function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : undefined;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function ensureCsrfToken(): Promise<string | undefined> {
  let token = getCsrfToken();
  if (token) return token;
  try {
    await fetch("/api/csrf-token", { credentials: "include" });
  } catch {
    // ignore — CSRF is best-effort; the request will fail loud if needed
  }
  token = getCsrfToken();
  return token;
}

async function rawFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const csrfHeaders: Record<string, string> = {};
  if (!SAFE_METHODS.has(method)) {
    const token = await ensureCsrfToken();
    if (token) csrfHeaders["x-csrf-token"] = token;
  }
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...csrfHeaders, ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = "";
    let body: unknown = null;
    try {
      body = await res.json();
      detail = (body as { error?: string } | null)?.error ?? "";
    } catch {
      // ignore
    }
    if (res.status === 401) {
      const code = detectSessionRevocationCode(body);
      if (code) {
        notifySessionRevoked(code, { message: extractServerMessage(body) ?? undefined });
      }
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

export function useDeploymentHistory(
  appId: string | undefined,
  environment: "production" | "staging" | "development" = "production",
  enabled = true,
) {
  return useQuery({
    queryKey: ["pulse", "deployments", "history", environment, appId],
    queryFn: () =>
      rawFetch<{ appId: string; environment: string; history: DeploymentRecord[]; count: number }>(
        `/api/deployments/${encodeURIComponent(appId!)}/history?environment=${environment}`,
      ),
    enabled: !!appId && enabled,
  });
}

export interface RollbackResponse {
  rolledBack: true;
  previous: DeploymentRecord;
  current: DeploymentRecord;
}

export function useRollbackDeployment(
  environment: "production" | "staging" | "development" = "production",
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appId, version }: { appId: string; version?: string }) =>
      rawFetch<RollbackResponse>(`/api/deployments/${encodeURIComponent(appId)}/rollback`, {
        method: "POST",
        body: JSON.stringify({ environment, ...(version ? { version } : {}) }),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["pulse", "deployments", environment] });
      qc.invalidateQueries({ queryKey: ["pulse", "deployments", "history", environment, vars.appId] });
    },
  });
}

export function useBriefingSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["pulse", "briefings", "search", q],
    queryFn: async () => {
      if (!q) return { briefings: [] as Briefing[], total: 0 };
      // In demo mode the search endpoint is not available (it requires auth).
      // Fall back to a local search over the already-cached demo briefing list
      // so the Library search box keeps working in unauthenticated demo flows.
      if (isDemoMode()) {
        const cached = await demoApiFetch<{ success: true; briefings: Briefing[]; total: number }>(
          "/api/pulse/demo/briefings",
        );
        const ql = q.toLowerCase();
        const matches = (cached.briefings ?? []).filter((b) => {
          if (b.headline.toLowerCase().includes(ql)) return true;
          if (b.leadSentence.toLowerCase().includes(ql)) return true;
          if (b.date.includes(ql)) return true;
          if (b.domains.some((d) => d.toLowerCase().includes(ql))) return true;
          for (const s of b.sections) {
            if (s.keyJudgment.toLowerCase().includes(ql)) return true;
            if (s.narrative.some((p) => p.toLowerCase().includes(ql))) return true;
          }
          return false;
        });
        return { briefings: matches, total: matches.length };
      }
      return apiFetch<{ success: true; briefings: Briefing[]; total: number; query: string }>(
        `/api/pulse/briefings/search?q=${encodeURIComponent(q)}`,
      );
    },
    select: (d) => ({ briefings: d.briefings, total: d.total }),
    enabled: q.length > 0,
    placeholderData: (prev) => prev,
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
    mutationFn: (input: RequestCustomBriefInput) => {
      if (isDemoMode()) {
        return Promise.reject(new Error("Custom brief requests are not available in demo mode. Sign in to request a brief."));
      }
      return apiFetch<{ success: true; request: CustomBriefRequest }>("/api/pulse/custom", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pulse", "custom"] });
    },
  });
}
