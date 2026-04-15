import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = "/api";

async function prismFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(`PRISM API ${path} failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data ?? json;
}

export function usePrismDashboard() {
  return useQuery({
    queryKey: ["prism-dashboard"],
    queryFn: () => prismFetch<PrismDashboardData>("/prism-counsel/dashboard"),
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePrismMatters() {
  return useQuery({
    queryKey: ["prism-matters"],
    queryFn: () => prismFetch<PrismMatter[]>("/prism-counsel/matters"),
    staleTime: 60_000,
    retry: 1,
  });
}

export function usePrismMatterDetail(matterId: number | null) {
  return useQuery({
    queryKey: ["prism-matter", matterId],
    queryFn: () => prismFetch<PrismMatterDetail>(`/prism-counsel/matters/${matterId}`),
    enabled: matterId !== null,
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePrismDeadlines() {
  return useQuery({
    queryKey: ["prism-deadlines"],
    queryFn: () => prismFetch<PrismDeadline[]>("/prism-counsel/deadlines"),
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePrismMatterDeadlines(matterId: number | null) {
  return useQuery({
    queryKey: ["prism-matter-deadlines", matterId],
    queryFn: () => prismFetch<PrismDeadline[]>(`/prism-counsel/matters/${matterId}/deadlines`),
    enabled: matterId !== null,
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePrismMatterParties(matterId: number | null) {
  return useQuery({
    queryKey: ["prism-matter-parties", matterId],
    queryFn: () => prismFetch<PrismParty[]>(`/prism-counsel/matters/${matterId}/parties`),
    enabled: matterId !== null,
    staleTime: 60_000,
    retry: 1,
  });
}

export function usePrismMatterComms(matterId: number | null) {
  return useQuery({
    queryKey: ["prism-matter-comms", matterId],
    queryFn: () => prismFetch<PrismCommunication[]>(`/prism-counsel/matters/${matterId}/communications`),
    enabled: matterId !== null,
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePrismMatterDocuments(matterId: number | null) {
  return useQuery({
    queryKey: ["prism-matter-docs", matterId],
    queryFn: () => prismFetch<PrismDocument[]>(`/prism-counsel/matters/${matterId}/documents`),
    enabled: matterId !== null,
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePrismApprovals(status: string = "pending") {
  return useQuery({
    queryKey: ["prism-approvals", status],
    queryFn: () => prismFetch<{ approvals: PrismApproval[] }>(`/prism-counsel/approvals?status=${status}`),
    staleTime: 15_000,
    retry: 1,
  });
}

export function usePrismResolveApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalId, decision }: { approvalId: number; decision: "approved" | "rejected" }) =>
      prismFetch(`/prism-counsel/approvals/${approvalId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prism-approvals"] });
      qc.invalidateQueries({ queryKey: ["prism-dashboard"] });
    },
  });
}

export function usePrismConnectors() {
  return useQuery({
    queryKey: ["prism-connectors"],
    queryFn: () => prismFetch<{ connectors: PrismConnectorHealth[] }>("/prism-counsel/connectors"),
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePrismTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) =>
      prismFetch(`/prism-counsel/connectors/${accountId}/sync`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prism-connectors"] });
    },
  });
}

export function usePrismConnectorHistory(accountId: number | null) {
  return useQuery({
    queryKey: ["prism-connector-history", accountId],
    queryFn: () => prismFetch<{ history: PrismSyncRun[] }>(`/prism-counsel/connectors/${accountId}/history`),
    enabled: accountId !== null,
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePrismJobs() {
  return useQuery({
    queryKey: ["prism-jobs"],
    queryFn: () => prismFetch<{ stats: Record<string, number>; deadLetterCount: number }>("/prism-counsel/jobs"),
    staleTime: 15_000,
    retry: 1,
  });
}

export function usePrismNotifications() {
  return useQuery({
    queryKey: ["prism-notifications"],
    queryFn: () => prismFetch<{ notifications: PrismNotification[] }>("/prism-counsel/notifications"),
    staleTime: 15_000,
    retry: 1,
  });
}

export function usePrismPipelineStats() {
  return useQuery({
    queryKey: ["prism-pipeline"],
    queryFn: () => prismFetch<PrismPipelineStats>("/prism-counsel/pipeline/stats"),
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePrismHealth() {
  return useQuery({
    queryKey: ["prism-health"],
    queryFn: () => prismFetch<{ status: string; timestamp: string; version: string }>("/prism-counsel/health"),
    staleTime: 60_000,
    retry: false,
  });
}

export interface PrismDashboardData {
  matters: { total_matters: number; active_matters: number; total_exposure: string };
  deadlines: { upcoming_14d: number; overdue: number; total_pending: number };
  approvals: { pending_approvals: number };
  recentActivity: PrismAuditEvent[];
}

export interface PrismMatter {
  id: number;
  orgId: number;
  caseNumber: string;
  title: string;
  status: string;
  matterType: string;
  jurisdiction: string | null;
  courtName: string | null;
  healthScore: number | null;
  settlementLow: string | null;
  settlementMid: string | null;
  settlementHigh: string | null;
  assignedAttorney: string | null;
  assignedParalegal: string | null;
  filingDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrismMatterDetail extends PrismMatter {
  parties?: PrismParty[];
  deadlines?: PrismDeadline[];
  communications?: PrismCommunication[];
}

export interface PrismDeadline {
  id: number;
  matterId: number;
  title: string;
  deadlineType: string;
  dueDate: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  notes: string | null;
}

export interface PrismParty {
  id: number;
  matterId: number;
  partyRole: string;
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
}

export interface PrismCommunication {
  id: number;
  matterId: number;
  direction: string;
  channel: string;
  fromParty: string | null;
  subject: string | null;
  sentAt: string;
}

export interface PrismDocument {
  id: number;
  matterId: number;
  documentType: string;
  title: string;
  status: string;
  uploadedAt: string;
}

export interface PrismApproval {
  id: number;
  matterId: number;
  requestType: string;
  title: string;
  description: string | null;
  status: string;
  requestedBy: number | null;
  approvedBy: number | null;
  requestedAt: string;
  resolvedAt: string | null;
  sourceBasis: string | null;
}

export interface PrismConnectorHealth {
  accountId: number;
  connectorType: string;
  status: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  syncFrequencyMinutes: number | null;
  errorCount: number;
}

export interface PrismSyncRun {
  id: number;
  accountId: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  recordsSynced: number | null;
  errorMessage: string | null;
}

export interface PrismNotification {
  id: number;
  orgId: number;
  userId: number | null;
  channel: string;
  subject: string;
  body: string | null;
  status: string;
  createdAt: string;
  sentAt: string | null;
}

export interface PrismAuditEvent {
  id: number;
  orgId: number;
  matterId: number | null;
  actorId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  details: unknown;
  createdAt: string;
}

export interface PrismPipelineStats {
  totalDocuments: number;
  pendingExtraction: number;
  completedExtraction: number;
  failedExtraction: number;
  manualReviewQueue: number;
}
