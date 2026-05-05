import { useQuery, useMutation, useSubscription } from 'urql';
import {
  ALLOY_DASHBOARD_QUERY,
  ALLOY_SIGNALS_QUERY,
  ALLOY_SIGNAL_QUERY,
  ALLOY_WORKFLOWS_QUERY,
  ALLOY_WORKFLOW_QUERY,
  ALLOY_WORKFLOW_RUNS_QUERY,
  ALLOY_APPROVALS_QUERY,
  ALLOY_ACTIONS_QUERY,
  ALLOY_ARTIFACTS_QUERY,
  ALLOY_AUDIT_LOG_QUERY,
  CREATE_ALLOY_WORKFLOW,
  SUBMIT_ALLOY_WORKFLOW,
  CANCEL_ALLOY_WORKFLOW,
  RETRY_ALLOY_WORKFLOW,
  REQUEST_ALLOY_APPROVAL,
  REVIEW_ALLOY_APPROVAL,
  RUN_ALLOY_WORKFLOW,
  RECORD_ALLOY_ACTION,
  WORKFLOW_RUN_UPDATED_SUBSCRIPTION,
  APPROVAL_REQUIRED_SUBSCRIPTION,
  WORKFLOW_STATUS_CHANGED_SUBSCRIPTION,
  AEGIS_INCIDENT_UPDATED_SUBSCRIPTION,
} from './operations';

export interface AlloyDashboardStats {
  totalWorkflows: number;
  totalRuns: number;
  runningRuns: number;
  pendingApprovals: number;
  failedRuns: number;
  successRate: number;
  avgDurationMs: number | null;
  workflowsByStatus: { status: string; count: number }[];
  recentActivity: AlloyAuditEntry[];
}

export interface AlloySignal {
  id: string;
  source: string | null;
  sourceType: string | null;
  domain: string | null;
  severity: string | null;
  status: string | null;
  title: string | null;
  description: string | null;
  confidence: number | null;
  ownerUserId: string | null;
  environment: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AlloyWorkflowStep {
  step: number;
  name: string;
  description: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

export interface AlloyWorkflow {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  domain: string | null;
  status: string;
  priority: string | null;
  requiresApproval: boolean;
  approvalState: string;
  confidenceScore: number | null;
  triggerId: string | null;
  triggerType: string | null;
  environment: string | null;
  steps: AlloyWorkflowStep[];
  currentStep: number | null;
  retryCount: number | null;
  ownerUserId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  canRun: boolean;
  canCancel: boolean;
  canRetry: boolean;
  allowedNextStates: string[];
}

export interface AlloyWorkflowRun {
  id: string;
  workflowId: string;
  runNumber: number;
  status: string;
  trigger: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  ownerUserId: string | null;
  approvalState: string | null;
  stepsExecuted: AlloyWorkflowStep[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface AlloyApproval {
  id: string;
  workflowId: string;
  status: string;
  reason: string | null;
  reviewNote: string | null;
  requestedByUserId: string | null;
  reviewerUserId: string | null;
  requiredRoles: string[] | null;
  expiresAt: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
}

export interface AlloyAction {
  id: string;
  workflowId: string;
  type: string | null;
  status: string | null;
  description: string | null;
  outcome: string | null;
  actorUserId: string | null;
  actorType: string | null;
  executedAt: string | null;
  createdAt: string | null;
}

export interface AlloyArtifact {
  id: string;
  workflowId: string | null;
  signalId: string | null;
  type: string | null;
  title: string | null;
  content: string | null;
  domain: string | null;
  format: string | null;
  confidenceScore: number | null;
  requiresApproval: boolean | null;
  approvalState: string | null;
  tags: string[] | null;
  ownerUserId: string | null;
  publishedAt: string | null;
  createdAt: string | null;
}

export interface AlloyAuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorUserId: string | null;
  actorType: string;
  previousState: string | null;
  newState: string | null;
  notes: string | null;
  correlationId: string | null;
  createdAt: string;
}

export function useAlloyDashboard() {
  const [result, reexecute] = useQuery<{ alloyDashboard: AlloyDashboardStats }>({
    query: ALLOY_DASHBOARD_QUERY,
  });
  return {
    data: result.data?.alloyDashboard ?? null,
    fetching: result.fetching,
    error: result.error,
    refetch: reexecute,
  };
}

export function useAlloySignals(vars?: {
  limit?: number;
  offset?: number;
  severity?: string;
  status?: string;
  domain?: string;
}) {
  const [result, reexecute] = useQuery<{ alloySignals: AlloySignal[] }>({
    query: ALLOY_SIGNALS_QUERY,
    variables: vars ?? {},
  });
  return {
    data: result.data?.alloySignals ?? [],
    fetching: result.fetching,
    error: result.error,
    refetch: reexecute,
  };
}

export function useAlloySignal(id: string) {
  const [result, reexecute] = useQuery<{ alloySignal: AlloySignal | null }>({
    query: ALLOY_SIGNAL_QUERY,
    variables: { id },
    pause: !id,
  });
  return {
    data: result.data?.alloySignal ?? null,
    fetching: result.fetching,
    error: result.error,
    refetch: reexecute,
  };
}

export function useAlloyWorkflows(vars?: {
  limit?: number;
  offset?: number;
  status?: string;
  priority?: string;
  domain?: string;
}) {
  const [result, reexecute] = useQuery<{ alloyWorkflows: AlloyWorkflow[] }>({
    query: ALLOY_WORKFLOWS_QUERY,
    variables: vars ?? {},
  });
  return {
    data: result.data?.alloyWorkflows ?? [],
    fetching: result.fetching,
    error: result.error,
    refetch: reexecute,
  };
}

export function useAlloyWorkflow(id: string) {
  const [result, reexecute] = useQuery<{ alloyWorkflow: AlloyWorkflow | null }>({
    query: ALLOY_WORKFLOW_QUERY,
    variables: { id },
    pause: !id,
  });
  return {
    data: result.data?.alloyWorkflow ?? null,
    fetching: result.fetching,
    error: result.error,
    refetch: reexecute,
  };
}

export function useAlloyWorkflowRuns(vars?: {
  workflowId?: string;
  limit?: number;
  offset?: number;
  status?: string;
}) {
  const [result, reexecute] = useQuery<{ alloyWorkflowRuns: AlloyWorkflowRun[] }>({
    query: ALLOY_WORKFLOW_RUNS_QUERY,
    variables: vars ?? {},
  });
  return {
    data: result.data?.alloyWorkflowRuns ?? [],
    fetching: result.fetching,
    error: result.error,
    refetch: reexecute,
  };
}

export function useAlloyApprovals(vars?: {
  workflowId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const [result, reexecute] = useQuery<{ alloyApprovals: AlloyApproval[] }>({
    query: ALLOY_APPROVALS_QUERY,
    variables: vars ?? {},
  });
  return {
    data: result.data?.alloyApprovals ?? [],
    fetching: result.fetching,
    error: result.error,
    refetch: reexecute,
  };
}

export function useAlloyActions(vars?: {
  workflowId?: string;
  limit?: number;
  offset?: number;
}) {
  const [result, reexecute] = useQuery<{ alloyActions: AlloyAction[] }>({
    query: ALLOY_ACTIONS_QUERY,
    variables: vars ?? {},
  });
  return {
    data: result.data?.alloyActions ?? [],
    fetching: result.fetching,
    error: result.error,
    refetch: reexecute,
  };
}

export function useAlloyArtifacts(vars?: {
  workflowId?: string;
  domain?: string;
  limit?: number;
  offset?: number;
}) {
  const [result, reexecute] = useQuery<{ alloyArtifacts: AlloyArtifact[] }>({
    query: ALLOY_ARTIFACTS_QUERY,
    variables: vars ?? {},
  });
  return {
    data: result.data?.alloyArtifacts ?? [],
    fetching: result.fetching,
    error: result.error,
    refetch: reexecute,
  };
}

export function useAlloyAuditLog(vars?: {
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}) {
  const [result, reexecute] = useQuery<{ alloyAuditLog: AlloyAuditEntry[] }>({
    query: ALLOY_AUDIT_LOG_QUERY,
    variables: vars ?? {},
  });
  return {
    data: result.data?.alloyAuditLog ?? [],
    fetching: result.fetching,
    error: result.error,
    refetch: reexecute,
  };
}

export function useCreateWorkflow() {
  return useMutation(CREATE_ALLOY_WORKFLOW);
}

export function useSubmitWorkflow() {
  return useMutation(SUBMIT_ALLOY_WORKFLOW);
}

export function useCancelWorkflow() {
  return useMutation(CANCEL_ALLOY_WORKFLOW);
}

export function useRetryWorkflow() {
  return useMutation(RETRY_ALLOY_WORKFLOW);
}

export function useRequestApproval() {
  return useMutation(REQUEST_ALLOY_APPROVAL);
}

export function useReviewApproval() {
  return useMutation(REVIEW_ALLOY_APPROVAL);
}

export function useRunWorkflow() {
  return useMutation(RUN_ALLOY_WORKFLOW);
}

export function useRecordAction() {
  return useMutation(RECORD_ALLOY_ACTION);
}

export function useWorkflowRunSubscription(workflowId?: string) {
  const [result] = useSubscription<{ alloyWorkflowRunUpdated: AlloyWorkflowRun }>({
    query: WORKFLOW_RUN_UPDATED_SUBSCRIPTION,
    variables: { workflowId },
  });
  return {
    data: result.data?.alloyWorkflowRunUpdated ?? null,
    error: result.error,
  };
}

export function useApprovalSubscription(reviewerUserId?: string) {
  const [result] = useSubscription<{ alloyApprovalRequired: AlloyApproval }>({
    query: APPROVAL_REQUIRED_SUBSCRIPTION,
    variables: { reviewerUserId },
  });
  return {
    data: result.data?.alloyApprovalRequired ?? null,
    error: result.error,
  };
}

export function useWorkflowStatusSubscription() {
  const [result] = useSubscription<{
    alloyWorkflowStatusChanged: Pick<AlloyWorkflow, 'id' | 'name' | 'status' | 'priority' | 'domain' | 'updatedAt'>;
  }>({
    query: WORKFLOW_STATUS_CHANGED_SUBSCRIPTION,
  });
  return {
    data: result.data?.alloyWorkflowStatusChanged ?? null,
    error: result.error,
  };
}

export interface AegisIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  detectedAt: string | null;
  createdAt: string;
}

export function useAegisIncidentUpdated() {
  const [result] = useSubscription<{ aegisIncidentUpdated: AegisIncident }>({
    query: AEGIS_INCIDENT_UPDATED_SUBSCRIPTION,
  });
  return {
    data: result.data?.aegisIncidentUpdated ?? null,
    error: result.error,
  };
}
