import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/api/prism-counsel/review-desk";

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useReviewDeskOverview() {
  return useQuery({
    queryKey: ["review-desk", "overview"],
    queryFn: () => api("/overview"),
    staleTime: 30000,
  });
}

export function useMyReviewQueue(userId?: number) {
  return useQuery({
    queryKey: ["review-desk", "my-queue", userId],
    queryFn: () => api(`/my-queue${userId ? `?userId=${userId}` : ""}`),
    staleTime: 30000,
  });
}

export function useTeamReviewQueue() {
  return useQuery({
    queryKey: ["review-desk", "team-queue"],
    queryFn: () => api("/team-queue"),
    staleTime: 30000,
  });
}

export function useHighRiskQueue() {
  return useQuery({
    queryKey: ["review-desk", "high-risk"],
    queryFn: () => api("/high-risk"),
    staleTime: 30000,
  });
}

export function useLowConfidenceQueue() {
  return useQuery({
    queryKey: ["review-desk", "low-confidence"],
    queryFn: () => api("/low-confidence"),
    staleTime: 30000,
  });
}

export function useContradictionQueue() {
  return useQuery({
    queryKey: ["review-desk", "contradiction"],
    queryFn: () => api("/contradiction"),
    staleTime: 30000,
  });
}

export function useNeedsAttorneyQueue() {
  return useQuery({
    queryKey: ["review-desk", "needs-attorney"],
    queryFn: () => api("/needs-attorney"),
    staleTime: 30000,
  });
}

export function useNeedsPartnerQueue() {
  return useQuery({
    queryKey: ["review-desk", "needs-partner"],
    queryFn: () => api("/needs-partner"),
    staleTime: 30000,
  });
}

export function useReadyToExportQueue() {
  return useQuery({
    queryKey: ["review-desk", "ready-to-export"],
    queryFn: () => api("/ready-to-export"),
    staleTime: 30000,
  });
}

export function useBlockedQueue() {
  return useQuery({
    queryKey: ["review-desk", "blocked"],
    queryFn: () => api("/blocked"),
    staleTime: 30000,
  });
}

export function useReviewItem(id: number) {
  return useQuery({
    queryKey: ["review-desk", "item", id],
    queryFn: () => api(`/items/${id}`),
    enabled: !!id,
    staleTime: 15000,
  });
}

export function useReviewMetrics(days = 30) {
  return useQuery({
    queryKey: ["review-desk", "metrics", days],
    queryFn: () => api(`/metrics?days=${days}`),
    staleTime: 60000,
  });
}

export function useReviewAdminView() {
  return useQuery({
    queryKey: ["review-desk", "admin"],
    queryFn: () => api("/admin"),
    staleTime: 30000,
  });
}

export function useMyReviewSummary(userId?: number) {
  return useQuery({
    queryKey: ["review-desk", "my-review", userId],
    queryFn: () => api(`/my-review${userId ? `?userId=${userId}` : ""}`),
    staleTime: 30000,
  });
}

export function useMaxUnblockItem() {
  return useQuery({
    queryKey: ["review-desk", "copilot", "max-unblock"],
    queryFn: () => api("/copilot/max-unblock"),
    staleTime: 30000,
  });
}

function makeOptimisticStatusUpdate(qc: ReturnType<typeof useQueryClient>, id: number, status: string) {
  return async () => {
    await qc.cancelQueries({ queryKey: ["review-desk"] });
    const snapshots = qc.getQueriesData({ queryKey: ["review-desk"] });
    qc.setQueriesData({ queryKey: ["review-desk"] }, (old: any) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return old.map((item: any) => item.id === id ? { ...item, status } : item);
      }
      if (old.items && Array.isArray(old.items)) {
        return { ...old, items: old.items.map((item: any) => item.id === id ? { ...item, status } : item) };
      }
      return old;
    });
    return { snapshots };
  };
}

function rollbackSnapshots(qc: ReturnType<typeof useQueryClient>, snapshots: Array<[readonly unknown[], unknown]> | undefined) {
  if (snapshots) snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
}

export function useReviewAction() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["review-desk"] });
  };

  const approve = useMutation({
    mutationFn: ({ id, actorId, notes }: { id: number; actorId?: number; notes?: string }) =>
      api(`/items/${id}/actions/approve`, { method: "POST", body: JSON.stringify({ actorId, notes }) }),
    onMutate: ({ id }) => makeOptimisticStatusUpdate(qc, id, "approved")(),
    onError: (_err, _vars, ctx) => { rollbackSnapshots(qc, ctx?.snapshots); },
    onSettled: invalidate,
  });

  const reject = useMutation({
    mutationFn: ({ id, actorId, reason }: { id: number; actorId?: number; reason?: string }) =>
      api(`/items/${id}/actions/reject`, { method: "POST", body: JSON.stringify({ actorId, reason }) }),
    onMutate: ({ id }) => makeOptimisticStatusUpdate(qc, id, "rejected")(),
    onError: (_err, _vars, ctx) => { rollbackSnapshots(qc, ctx?.snapshots); },
    onSettled: invalidate,
  });

  const revise = useMutation({
    mutationFn: ({ id, actorId, notes }: { id: number; actorId?: number; notes?: string }) =>
      api(`/items/${id}/actions/revise`, { method: "POST", body: JSON.stringify({ actorId, notes }) }),
    onMutate: ({ id }) => makeOptimisticStatusUpdate(qc, id, "revision_requested")(),
    onError: (_err, _vars, ctx) => { rollbackSnapshots(qc, ctx?.snapshots); },
    onSettled: invalidate,
  });

  const escalate = useMutation({
    mutationFn: ({ id, actorId, escalateTo, reason }: { id: number; actorId?: number; escalateTo: string; reason?: string }) =>
      api(`/items/${id}/actions/escalate`, { method: "POST", body: JSON.stringify({ actorId, escalateTo, reason }) }),
    onSuccess: invalidate,
  });

  const assign = useMutation({
    mutationFn: ({ id, actorId, assignTo, role }: { id: number; actorId?: number; assignTo: number; role?: string }) =>
      api(`/items/${id}/actions/assign`, { method: "POST", body: JSON.stringify({ actorId, assignTo, role }) }),
    onSuccess: invalidate,
  });

  const block = useMutation({
    mutationFn: ({ id, actorId, reason }: { id: number; actorId?: number; reason: string }) =>
      api(`/items/${id}/actions/block`, { method: "POST", body: JSON.stringify({ actorId, reason }) }),
    onSuccess: invalidate,
  });

  const requestSupport = useMutation({
    mutationFn: ({ id, actorId, request }: { id: number; actorId?: number; request: string }) =>
      api(`/items/${id}/actions/request-support`, { method: "POST", body: JSON.stringify({ actorId, request }) }),
    onSuccess: invalidate,
  });

  const generateReviewPacket = useMutation({
    mutationFn: ({ id, actorId }: { id: number; actorId?: number }) =>
      api(`/items/${id}/actions/generate-review-packet`, { method: "POST", body: JSON.stringify({ actorId }) }),
    onSuccess: invalidate,
  });

  const exportPacket = useMutation({
    mutationFn: ({ id, actorId }: { id: number; actorId?: number }) =>
      api(`/items/${id}/actions/export-packet`, { method: "POST", body: JSON.stringify({ actorId }) }),
    onSuccess: invalidate,
  });

  const addNote = useMutation({
    mutationFn: ({ id, authorId, noteType, content }: { id: number; authorId?: number; noteType?: string; content: string }) =>
      api(`/items/${id}/notes`, { method: "POST", body: JSON.stringify({ authorId, noteType, content }) }),
    onSuccess: invalidate,
  });

  return { approve, reject, revise, escalate, assign, block, requestSupport, generateReviewPacket, exportPacket, addNote };
}
