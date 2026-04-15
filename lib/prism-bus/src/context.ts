export type PrismDomain =
  | "aegis"
  | "lyte"
  | "vessels"
  | "terra"
  | "carlota-jo"
  | "szl-holdings"
  | "stephen"
  | "cortex"
  | "global";

export type PrismPermission =
  | "view"
  | "edit"
  | "execute"
  | "approve"
  | "export"
  | "admin";

export type PrismRole =
  | "super_admin"
  | "admin"
  | "editor"
  | "member"
  | "client"
  | "authenticated"
  | "exec"
  | "ops"
  | "compliance"
  | "maintenance"
  | "analyst"
  | "viewer"
  | "operator"
  | "seller"
  | "client_viewer"
  | "creative_user"
  | "executive_viewer"
  | "approver"
  | "tenant_admin"
  | "external_partner";

export interface UserContext {
  userId: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  roles: PrismRole[];
  permissions: PrismPermission[];
  tenantId?: string | null;
  sessionId: string;
  authenticatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface TenantContext {
  tenantId: string;
  displayName: string;
  plan: "starter" | "professional" | "enterprise" | "platform";
  domains: PrismDomain[];
  featureFlags: Record<string, boolean>;
  policyVersion: string;
  metadata?: Record<string, unknown>;
}

export interface DomainContext {
  domain: PrismDomain;
  displayName: string;
  isActive: boolean;
  tools: string[];
  connectors: string[];
  agentSchedules: string[];
  lastSyncAt?: number;
  metadata?: Record<string, unknown>;
}

export interface WorkflowContext {
  workflowId: string;
  name: string;
  domain: PrismDomain;
  status: "pending" | "running" | "paused" | "completed" | "failed" | "cancelled";
  triggeredBy: string;
  triggeredAt: number;
  completedAt?: number;
  inputPayload?: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  correlationId?: string;
  approvalId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ExecutionContext {
  executionId: string;
  taskType: "browser" | "code" | "artifact" | "workflow" | "messaging";
  domain: PrismDomain;
  tenantId?: string | null;
  userId?: string | null;
  approvalClass: "observe_only" | "propose_only" | "approval_required" | "approved_execute";
  isDryRun: boolean;
  sandboxBoundaries: {
    allowedHosts: string[];
    allowedTools: string[];
    allowedDomains: PrismDomain[];
    maxDurationMs: number;
    maxCostUsd?: number;
  };
  startedAt: number;
  completedAt?: number;
  costUsd?: number;
  latencyMs?: number;
  status: "running" | "completed" | "failed" | "dry_run_complete" | "awaiting_approval";
  metadata?: Record<string, unknown>;
}

export interface EvidenceContext {
  evidenceId: string;
  executionId: string;
  domain: PrismDomain;
  type: "screenshot" | "log_snapshot" | "data_export" | "diff" | "audit_entry";
  capturedAt: number;
  storagePath?: string | null;
  hash?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ArtifactContext {
  artifactId: string;
  title: string;
  type: "report" | "brief" | "summary" | "analysis" | "data_export" | "dashboard";
  domain: PrismDomain;
  tenantId?: string | null;
  createdBy: string;
  createdAt: number;
  version: number;
  status: "draft" | "review" | "approved" | "published" | "archived";
  evidenceIds: string[];
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalContext {
  approvalId: string;
  resourceType: string;
  resourceId: string;
  title: string;
  actionClass: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected" | "escalated" | "expired" | "revised";
  requestedBy?: string | null;
  requestedByRole?: string | null;
  requiredApproverRole?: string | null;
  domain?: PrismDomain;
  payload?: Record<string, unknown>;
  decidedAt?: number | null;
  expiresAt?: number | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PrismContextBundle {
  user?: UserContext | null;
  tenant?: TenantContext | null;
  domain?: DomainContext | null;
  workflow?: WorkflowContext | null;
  execution?: ExecutionContext | null;
  evidence?: EvidenceContext[] | null;
  artifacts?: ArtifactContext[] | null;
  approvals?: ApprovalContext[] | null;
}
