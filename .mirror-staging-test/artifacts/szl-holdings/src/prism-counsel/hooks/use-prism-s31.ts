import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = "/api";

async function s31Fetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/prism-counsel/s31${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(`S31 API ${path} failed: ${res.status}`);
  return res.json();
}

export function useModelMeshLanes() {
  return useQuery({ queryKey: ["s31-model-lanes"], queryFn: () => s31Fetch<any>("/model-mesh/lanes"), staleTime: 30_000, retry: 1 });
}

export function useModelMeshStats(hours = 24) {
  return useQuery({ queryKey: ["s31-model-stats", hours], queryFn: () => s31Fetch<any>(`/model-mesh/stats?hours=${hours}`), staleTime: 30_000, retry: 1 });
}

export function useWorldlineSources() {
  return useQuery({ queryKey: ["s31-wl-sources"], queryFn: () => s31Fetch<any>("/worldline/sources"), staleTime: 30_000, retry: 1 });
}

export function useWorldlineSignals(limit = 50) {
  return useQuery({ queryKey: ["s31-wl-signals", limit], queryFn: () => s31Fetch<any>(`/worldline/signals?limit=${limit}`), staleTime: 30_000, retry: 1 });
}

export function useWorldlineFeatures(matterId: number | null) {
  return useQuery({ queryKey: ["s31-wl-features", matterId], queryFn: () => s31Fetch<any>(`/worldline/features/${matterId}`), enabled: matterId !== null, staleTime: 30_000 });
}

export function useWorldlineInit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => s31Fetch("/worldline/initialize", { method: "POST" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["s31-wl-sources"] }) });
}

export function usePressureGraph(matterId: number | null) {
  return useQuery({ queryKey: ["s31-pressure", matterId], queryFn: () => s31Fetch<any>(`/pressure-graph/${matterId}`), enabled: matterId !== null, staleTime: 30_000 });
}

export function useDataProducts(matterId: number | null) {
  return useQuery({ queryKey: ["s31-data-products", matterId], queryFn: () => s31Fetch<any>(`/data-products/${matterId}`), enabled: matterId !== null, staleTime: 30_000 });
}

export function useProofChainMatter(matterId: number | null) {
  return useQuery({ queryKey: ["s31-proof-chain", matterId], queryFn: () => s31Fetch<any>(`/proof-chain/matter/${matterId}`), enabled: matterId !== null, staleTime: 30_000 });
}

export function useProofChainPending() {
  return useQuery({ queryKey: ["s31-proof-pending"], queryFn: () => s31Fetch<any>("/proof-chain/pending-reviews"), staleTime: 15_000 });
}

export function useMatterTwin(matterId: number | null) {
  return useQuery({ queryKey: ["s31-matter-twin", matterId], queryFn: () => s31Fetch<any>(`/matter-twin/${matterId}`), enabled: matterId !== null, staleTime: 30_000 });
}

export function useMatterTwinHistory(matterId: number | null) {
  return useQuery({ queryKey: ["s31-twin-history", matterId], queryFn: () => s31Fetch<any>(`/matter-twin/${matterId}/history`), enabled: matterId !== null, staleTime: 60_000 });
}

export function useForecastDiff(matterId: number | null) {
  return useQuery({ queryKey: ["s31-forecast-diff", matterId], queryFn: () => s31Fetch<any>(`/forecast-diff/${matterId}`), enabled: matterId !== null, staleTime: 30_000 });
}

export function useCopilotSessions() {
  return useQuery({ queryKey: ["s31-copilot-sessions"], queryFn: () => s31Fetch<any>("/copilot/sessions"), staleTime: 15_000 });
}

export function useCopilotHistory(sessionId: number | null) {
  return useQuery({ queryKey: ["s31-copilot-history", sessionId], queryFn: () => s31Fetch<any>(`/copilot/sessions/${sessionId}/history`), enabled: sessionId !== null, staleTime: 10_000 });
}

export function useCopilotTemplates() {
  return useQuery({ queryKey: ["s31-copilot-templates"], queryFn: () => s31Fetch<any>("/copilot/templates"), staleTime: 300_000 });
}

export function useCopilotCreateSession() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: { mode: string; matterId?: number }) => s31Fetch<any>("/copilot/sessions", { method: "POST", body: JSON.stringify(body) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["s31-copilot-sessions"] }) });
}

export function useCopilotSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: number; content: string }) => s31Fetch<any>(`/copilot/sessions/${sessionId}/message`, { method: "POST", body: JSON.stringify({ content }) }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["s31-copilot-history", vars.sessionId] }),
  });
}

export function useM365Subscriptions() {
  return useQuery({ queryKey: ["s31-m365-subs"], queryFn: () => s31Fetch<any>("/m365/subscriptions"), staleTime: 60_000 });
}

export function useCostSummary(days = 30) {
  return useQuery({ queryKey: ["s31-costs", days], queryFn: () => s31Fetch<any>(`/costs/summary?days=${days}`), staleTime: 60_000 });
}

export function useAdminOverview() {
  return useQuery({ queryKey: ["s31-admin-overview"], queryFn: () => s31Fetch<any>("/admin/overview"), staleTime: 30_000 });
}
