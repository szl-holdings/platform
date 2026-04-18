import { useMemo } from "react";
import { useCounselListMatters, type CounselMatter } from "@szl-holdings/api-client-react";

export type MatterStatus = "active" | "pending" | "closed" | "escalated" | "on-hold";
export type MatterType = "litigation" | "transaction" | "regulatory" | "employment" | "ip" | "real-estate" | "contract";
export type PrivilegeLevel = "public" | "confidential" | "privileged" | "restricted";
export type ObligationStatus = "pending" | "in-progress" | "complete" | "overdue" | "at-risk";
export type PartyRole = "client" | "opposing-counsel" | "regulator" | "third-party" | "expert" | "co-counsel";
export type AuditAction = "viewed" | "edited" | "exported" | "redacted" | "accessed-wall" | "escalated" | "deadline-updated" | "privilege-changed";

export interface Party {
  id: string;
  name: string;
  role: PartyRole;
  counsel?: string;
  jurisdiction?: string;
}

export interface Obligation {
  id: string;
  matterId: string;
  title: string;
  description: string;
  dueDate: string;
  status: ObligationStatus;
  assignee: string;
  dependencies: string[];
  privilegeLevel: PrivilegeLevel;
  filingRequired: boolean;
  courtId?: string;
  consequence?: string;
  completedDate?: string;
}

export interface AuditEntry {
  id: string;
  matterId: string;
  timestamp: string;
  user: string;
  role: string;
  action: AuditAction;
  detail: string;
  ip: string;
}

export interface MatterWall {
  enabled: boolean;
  reason: string;
  blockedRoles: string[];
  approvedUsers: string[];
  createdAt: string;
  createdBy: string;
}

export interface ProofChainEntry {
  id: string;
  matterId: string;
  timestamp: string;
  eventType: "filing" | "communication" | "discovery" | "order" | "settlement" | "hearing" | "deadline" | "expert-report";
  title: string;
  summary: string;
  privilegeLevel: PrivilegeLevel;
  author: string;
  parties: string[];
  documentRef?: string;
  hash?: string;
  redacted?: boolean;
}

export interface Matter {
  id: string;
  name: string;
  clientName: string;
  matterNumber: string;
  type: MatterType;
  status: MatterStatus;
  privilegeLevel: PrivilegeLevel;
  pressureScore: number;
  complexityScore: number;
  openedDate: string;
  trialDate?: string;
  closingDate?: string;
  nextDeadline: string;
  nextDeadlineLabel: string;
  leadCounsel: string;
  parties: Party[];
  obligations: Obligation[];
  auditTrail: AuditEntry[];
  proofChain: ProofChainEntry[];
  wall: MatterWall;
  tags: string[];
  jurisdiction: string;
  estimatedExposure?: number;
  summary: string;
}

function normalize(raw: CounselMatter): Matter {
  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    clientName: raw.clientName ?? "",
    matterNumber: raw.matterNumber ?? "",
    type: (raw.type ?? "litigation") as MatterType,
    status: (raw.status ?? "active") as MatterStatus,
    privilegeLevel: (raw.privilegeLevel ?? "confidential") as PrivilegeLevel,
    pressureScore: raw.pressureScore ?? 0,
    complexityScore: raw.complexityScore ?? 0,
    openedDate: raw.openedDate ?? "",
    trialDate: raw.trialDate,
    closingDate: raw.closingDate,
    nextDeadline: raw.nextDeadline ?? "",
    nextDeadlineLabel: raw.nextDeadlineLabel ?? "",
    leadCounsel: raw.leadCounsel ?? "",
    jurisdiction: raw.jurisdiction ?? "",
    estimatedExposure: raw.estimatedExposure,
    summary: raw.summary ?? "",
    tags: raw.tags ?? [],
    parties: (raw.parties ?? []).map((p) => ({
      id: p.id ?? "",
      name: p.name ?? "",
      role: (p.role ?? "client") as PartyRole,
      counsel: p.counsel,
      jurisdiction: p.jurisdiction,
    })),
    wall: {
      enabled: raw.wall?.enabled ?? false,
      reason: raw.wall?.reason ?? "",
      blockedRoles: raw.wall?.blockedRoles ?? [],
      approvedUsers: raw.wall?.approvedUsers ?? [],
      createdAt: raw.wall?.createdAt ?? "",
      createdBy: raw.wall?.createdBy ?? "",
    },
    obligations: (raw.obligations ?? []).map((o) => ({
      id: o.id ?? "",
      matterId: o.matterId ?? raw.id ?? "",
      title: o.title ?? "",
      description: o.description ?? "",
      dueDate: o.dueDate ?? "",
      status: (o.status ?? "pending") as ObligationStatus,
      assignee: o.assignee ?? "",
      dependencies: o.dependencies ?? [],
      privilegeLevel: (o.privilegeLevel ?? "confidential") as PrivilegeLevel,
      filingRequired: o.filingRequired ?? false,
      courtId: o.courtId,
      consequence: o.consequence,
      completedDate: o.completedDate,
    })),
    auditTrail: (raw.auditTrail ?? []).map((a) => ({
      id: a.id ?? "",
      matterId: a.matterId ?? raw.id ?? "",
      timestamp: a.timestamp ?? "",
      user: a.user ?? "",
      role: a.role ?? "",
      action: (a.action ?? "viewed") as AuditAction,
      detail: a.detail ?? "",
      ip: a.ip ?? "",
    })),
    proofChain: (raw.proofChain ?? []).map((p) => ({
      id: p.id ?? "",
      matterId: p.matterId ?? raw.id ?? "",
      timestamp: p.timestamp ?? "",
      eventType: (p.eventType ?? "filing") as ProofChainEntry["eventType"],
      title: p.title ?? "",
      summary: p.summary ?? "",
      privilegeLevel: (p.privilegeLevel ?? "confidential") as PrivilegeLevel,
      author: p.author ?? "",
      parties: p.parties ?? [],
      documentRef: p.documentRef,
      hash: p.hash,
      redacted: p.redacted,
    })),
  };
}

export function useMatters(): { matters: Matter[]; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useCounselListMatters();
  const matters = useMemo(() => (data?.matters ?? []).map(normalize), [data]);
  return { matters, isLoading, isError };
}

export function findMatterById(matters: Matter[], id: string): Matter | undefined {
  return matters.find((m) => m.id === id);
}

export function getPressureColor(score: number): string {
  if (score >= 90) return "#ef4444";
  if (score >= 70) return "#f97316";
  if (score >= 50) return "#eab308";
  return "#22c55e";
}

export function getPressureLabel(score: number): string {
  if (score >= 90) return "Critical";
  if (score >= 70) return "High";
  if (score >= 50) return "Moderate";
  return "Low";
}

export function getStatusColor(status: MatterStatus): string {
  switch (status) {
    case "escalated": return "#ef4444";
    case "active": return "#a78bfa";
    case "pending": return "#eab308";
    case "on-hold": return "#6b7280";
    case "closed": return "#22c55e";
    default: return "#6b7280";
  }
}

export function getPrivilegeColor(level: PrivilegeLevel): string {
  switch (level) {
    case "restricted": return "#ef4444";
    case "privileged": return "#f97316";
    case "confidential": return "#eab308";
    case "public": return "#22c55e";
    default: return "#6b7280";
  }
}

export function getObligationStatusColor(status: ObligationStatus): string {
  switch (status) {
    case "overdue": return "#ef4444";
    case "at-risk": return "#f97316";
    case "in-progress": return "#a78bfa";
    case "pending": return "#6b7280";
    case "complete": return "#22c55e";
    default: return "#6b7280";
  }
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDeadline(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days}d`;
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
