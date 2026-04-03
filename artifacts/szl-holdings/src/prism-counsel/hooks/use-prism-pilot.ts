import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/api/prism-counsel/pilot";

async function fetchJSON(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postJSON(path: string, body?: any) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function patchJSON(path: string, body?: any) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useToday() {
  return useQuery({ queryKey: ["pilot", "today"], queryFn: () => fetchJSON("/today"), retry: 1 });
}

export function useMorningBrief() {
  return useQuery({ queryKey: ["pilot", "brief"], queryFn: () => fetchJSON("/today/brief"), retry: 1 });
}

export function useGenerateBrief() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => postJSON("/today/brief/generate"), onSuccess: () => qc.invalidateQueries({ queryKey: ["pilot"] }) });
}

export function useQuietRisks() {
  return useQuery({ queryKey: ["pilot", "quiet-risks"], queryFn: () => fetchJSON("/today/quiet-risks"), retry: 1 });
}

export function useDetectRisks() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => postJSON("/today/detect-risks"), onSuccess: () => qc.invalidateQueries({ queryKey: ["pilot"] }) });
}

export function useNextActions(matterId?: number) {
  const path = matterId ? `/today/next-actions?matterId=${matterId}` : "/today/next-actions";
  return useQuery({ queryKey: ["pilot", "next-actions", matterId], queryFn: () => fetchJSON(path), retry: 1 });
}

export function useCompleteAction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => postJSON(`/today/next-actions/${id}/complete`), onSuccess: () => qc.invalidateQueries({ queryKey: ["pilot"] }) });
}

export function useMatterDesk(matterId: number | null) {
  return useQuery({
    queryKey: ["pilot", "matter-desk", matterId],
    queryFn: () => fetchJSON(`/matter-desk/${matterId}`),
    enabled: !!matterId,
    retry: 1,
  });
}

export function useWhatChanged(opts?: { matterId?: number; hours?: number }) {
  const params = new URLSearchParams();
  if (opts?.matterId) params.set("matterId", String(opts.matterId));
  if (opts?.hours) params.set("hours", String(opts.hours));
  const qs = params.toString() ? `?${params}` : "";
  return useQuery({ queryKey: ["pilot", "what-changed", opts], queryFn: () => fetchJSON(`/what-changed${qs}`), retry: 1 });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (ids: number[]) => postJSON("/what-changed/mark-read", { ids }), onSuccess: () => qc.invalidateQueries({ queryKey: ["pilot"] }) });
}

export function useReviews(opts?: { matterId?: number; state?: string }) {
  const params = new URLSearchParams();
  if (opts?.matterId) params.set("matterId", String(opts.matterId));
  if (opts?.state) params.set("state", String(opts.state));
  const qs = params.toString() ? `?${params}` : "";
  return useQuery({ queryKey: ["pilot", "reviews", opts], queryFn: () => fetchJSON(`/reviews${qs}`), retry: 1 });
}

export function useReview(id: number | null) {
  return useQuery({ queryKey: ["pilot", "review", id], queryFn: () => fetchJSON(`/reviews/${id}`), enabled: !!id, retry: 1 });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => postJSON("/reviews", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["pilot"] }) });
}

export function useUpdateReviewState() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, state }: { id: number; state: string }) => patchJSON(`/reviews/${id}/state`, { state }), onSuccess: () => qc.invalidateQueries({ queryKey: ["pilot"] }) });
}

export function useSubmitForSignoff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (reviewId: number) => postJSON(`/reviews/${reviewId}/submit-signoff`), onSuccess: () => qc.invalidateQueries({ queryKey: ["pilot"] }) });
}

export function useSignoffs(opts?: { status?: string }) {
  const params = new URLSearchParams();
  if (opts?.status) params.set("status", String(opts.status));
  const qs = params.toString() ? `?${params}` : "";
  return useQuery({ queryKey: ["pilot", "signoffs", opts], queryFn: () => fetchJSON(`/signoffs${qs}`), retry: 1 });
}

export function usePendingSignoffs() {
  return useQuery({ queryKey: ["pilot", "signoffs", "pending"], queryFn: () => fetchJSON("/signoffs/pending"), retry: 1 });
}

export function useResolveSignoff() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, decision }: { id: number; decision: "approved" | "rejected" }) => postJSON(`/signoffs/${id}/resolve`, { decision }), onSuccess: () => qc.invalidateQueries({ queryKey: ["pilot"] }) });
}

export function useExports(matterId?: number) {
  const qs = matterId ? `?matterId=${matterId}` : "";
  return useQuery({ queryKey: ["pilot", "exports", matterId], queryFn: () => fetchJSON(`/exports${qs}`), retry: 1 });
}

export function useGenerateExport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => postJSON("/exports", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["pilot"] }) });
}

export function useExportContent(exportId: number | null) {
  return useQuery({ queryKey: ["pilot", "export-content", exportId], queryFn: () => fetchJSON(`/exports/${exportId}/content`), enabled: !!exportId, retry: 1 });
}

export function usePilotForecasts(matterId: number | null) {
  return useQuery({ queryKey: ["pilot", "forecasts", matterId], queryFn: () => fetchJSON(`/forecasts/${matterId}`), enabled: !!matterId, retry: 1 });
}

export function useAdminJobs() {
  return useQuery({ queryKey: ["pilot", "admin", "jobs"], queryFn: () => fetchJSON("/admin/jobs"), retry: 1 });
}

export function useAdminConnectors() {
  return useQuery({ queryKey: ["pilot", "admin", "connectors"], queryFn: () => fetchJSON("/admin/connectors"), retry: 1 });
}

export function useAdminHealth() {
  return useQuery({ queryKey: ["pilot", "admin", "health"], queryFn: () => fetchJSON("/admin/health"), retry: 1 });
}
