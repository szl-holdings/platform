/**
 * Alloy Tool Definitions, Policy Engine, and Audit Infrastructure
 *
 * Phase 3: Approval-aware response orchestration
 *
 * Execution modes (set via AI_EXECUTION_MODE env var):
 *   observe_only     — no tool actions emitted; AI may observe/summarize only
 *   propose_only     — AI proposes actions but does not execute; proposals logged as blocked
 *   approval_required — high-risk tools queue approval_required; safe tools execute
 *   approved_execute  — pre-approved actions execute immediately with full audit trail
 *
 * Every tool call writes a ToolAuditEntry AND persists a durable firestorm_tool_audit_log
 * row via writeAuditLog(). Blocked-action reasoning is returned in the tool output.
 *
 * High-risk tools (containment, isolation, credential rotation, case mutation) require
 * human approval before execution in approval_required mode.
 */

import type { InsertFirestormToolAuditLog } from '@szl-holdings/db';
import type { HFToolDef } from '../providers/hf-client.js';

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  output: unknown;
  auditEntry: ToolAuditEntry;
}

export interface ToolAuditEntry {
  toolName: string;
  arguments: Record<string, unknown>;
  timestamp: string;
  calledBy: string;
  executionMode: ExecutionMode;
  policyChecked: boolean;
  approvalRequired: boolean;
  approvalStatus: 'approved' | 'pending' | 'rejected' | 'not_required';
  result: 'success' | 'failure' | 'blocked';
  error: string | null;
  blockedReason: string | null;
}

export type ExecutionMode =
  | 'observe_only'
  | 'propose_only'
  | 'approval_required'
  | 'approved_execute';

export const ALLOY_TOOL_DEFINITIONS: HFToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'lookup_workflow',
      description:
        'Look up an Alloy workflow by ID to get its current status, steps, and run history.',
      parameters: {
        type: 'object',
        required: ['workflowId'],
        properties: { workflowId: { type: 'string' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_signal',
      description: 'Look up a Lyte signal by ID to get its details, severity, and related context.',
      parameters: {
        type: 'object',
        required: ['signalId'],
        properties: { signalId: { type: 'string' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_owner',
      description:
        'Look up an operator or analyst by ID to get their role, permissions, and assignment history.',
      parameters: {
        type: 'object',
        required: ['ownerId'],
        properties: { ownerId: { type: 'string' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_case',
      description:
        'Look up an incident case by ID. Returns case details, status, assigned owner, and linked alerts.',
      parameters: {
        type: 'object',
        required: ['caseId'],
        properties: { caseId: { type: 'string' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'notify_team',
      description:
        'Send a notification to a team or operator via the configured notification channel.',
      parameters: {
        type: 'object',
        required: ['channel', 'message'],
        properties: {
          channel: { type: 'string', description: 'Slack channel, email alias, or pager group' },
          message: { type: 'string' },
          urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_case',
      description: 'Create a new incident case with title, severity, and initial owner.',
      parameters: {
        type: 'object',
        required: ['title', 'severity'],
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          description: { type: 'string' },
          assignTo: { type: 'string' },
          incidentId: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_case',
      description: 'Update an existing case: change status, reassign owner, or add context.',
      parameters: {
        type: 'object',
        required: ['caseId'],
        properties: {
          caseId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['open', 'in_progress', 'pending_review', 'resolved', 'closed'],
          },
          assignTo: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_case',
      description: 'Close an incident case with a resolution verdict and closure notes.',
      parameters: {
        type: 'object',
        required: ['caseId', 'resolution'],
        properties: {
          caseId: { type: 'string' },
          resolution: {
            type: 'string',
            enum: ['resolved', 'mitigated', 'accepted_risk', 'false_positive'],
          },
          notes: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_action_item',
      description:
        'Create a new action item in the Alloy execution queue with an assigned owner and deadline.',
      parameters: {
        type: 'object',
        required: ['title', 'description', 'priority'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
          assignTo: { type: 'string' },
          deadline: { type: 'string' },
          relatedCaseId: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'assign_owner',
      description: 'Assign or reassign an owner to an incident, case, or action item.',
      parameters: {
        type: 'object',
        required: ['entityType', 'entityId', 'newOwner'],
        properties: {
          entityType: { type: 'string', enum: ['incident', 'case', 'action_item', 'workflow'] },
          entityId: { type: 'string' },
          newOwner: { type: 'string' },
          reason: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'open_workflow',
      description: 'Open (start) an Alloy workflow by name or ID.',
      parameters: {
        type: 'object',
        required: ['workflowId'],
        properties: {
          workflowId: { type: 'string' },
          context: { type: 'object' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_workflow',
      description: 'Close or complete an Alloy workflow, marking all pending steps as resolved.',
      parameters: {
        type: 'object',
        required: ['workflowId', 'resolution'],
        properties: {
          workflowId: { type: 'string' },
          resolution: { type: 'string', enum: ['completed', 'cancelled', 'failed'] },
          notes: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reopen_workflow',
      description:
        'Reopen a previously closed Alloy workflow when new evidence or signals require re-investigation.',
      parameters: {
        type: 'object',
        required: ['workflowId', 'reason'],
        properties: {
          workflowId: { type: 'string' },
          reason: { type: 'string', description: 'Why the workflow is being reopened' },
          priority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'containment_step',
      description:
        'HIGH-RISK: Execute a containment step — isolate a host, block an IP, or quarantine a user. Requires approval in approval_required mode.',
      parameters: {
        type: 'object',
        required: ['containmentType', 'targetId'],
        properties: {
          containmentType: {
            type: 'string',
            enum: [
              'isolate_host',
              'block_ip',
              'quarantine_user',
              'disable_account',
              'revoke_token',
            ],
          },
          targetId: { type: 'string' },
          reason: { type: 'string' },
          caseId: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recovery_step',
      description:
        'HIGH-RISK: Execute a recovery step — restore host, unblock IP, or re-enable user. Requires approval in approval_required mode.',
      parameters: {
        type: 'object',
        required: ['recoveryType', 'targetId'],
        properties: {
          recoveryType: {
            type: 'string',
            enum: ['restore_host', 'unblock_ip', 'reenable_user', 'restore_token'],
          },
          targetId: { type: 'string' },
          approvalRef: {
            type: 'string',
            description: 'Reference to the prior approval decision ID',
          },
          caseId: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_executive_brief',
      description:
        'Generate an executive-level security brief for a case or incident for C-suite review.',
      parameters: {
        type: 'object',
        required: ['subjectId', 'subjectType'],
        properties: {
          subjectId: { type: 'string' },
          subjectType: { type: 'string', enum: ['case', 'incident', 'finding'] },
          audienceLevel: { type: 'string', enum: ['ciso', 'board', 'ceo', 'vp_security'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'route_for_approval',
      description:
        'Route a proposed action to the appropriate approver based on risk level and policy.',
      parameters: {
        type: 'object',
        required: ['actionId', 'approvalLevel', 'reason'],
        properties: {
          actionId: { type: 'string' },
          approvalLevel: { type: 'string', enum: ['operator', 'manager', 'executive'] },
          reason: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_human_review',
      description: 'Flag an AI decision for mandatory human review before execution.',
      parameters: {
        type: 'object',
        required: ['decisionId', 'reason'],
        properties: {
          decisionId: { type: 'string' },
          reason: { type: 'string' },
          urgency: { type: 'string', enum: ['immediate', 'urgent', 'standard'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'append_audit_note',
      description: 'Append an immutable note to an audit trail record.',
      parameters: {
        type: 'object',
        required: ['recordId', 'note'],
        properties: {
          recordId: { type: 'string' },
          note: { type: 'string' },
          author: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_connector_context',
      description:
        'Fetch context from a connected system (e.g., Jira, Slack, PagerDuty) to enrich a decision.',
      parameters: {
        type: 'object',
        required: ['connectorType', 'query'],
        properties: {
          connectorType: { type: 'string' },
          query: { type: 'string' },
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'connector_hub_discover',
      description:
        'Discover all available tool connectors and their capabilities in the universal connector hub. Use this to understand what external systems can be invoked.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description:
              'Filter by category: ticketing, alerting, communication, crm, security, ai_inference, ai_voice, ai_media, ai_observability, ai_models',
          },
          tags: {
            type: 'string',
            description: "Comma-separated capability tags to filter by (e.g. 'read,incidents')",
          },
          connectorId: {
            type: 'string',
            description: 'Narrow to a specific connector by ID (e.g. jira, slack, groq)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'connector_hub_execute',
      description:
        'Execute a specific capability on a tool connector in the universal connector hub. Use connector_hub_discover first to find the connector and capability IDs.',
      parameters: {
        type: 'object',
        required: ['connectorId', 'capabilityId'],
        properties: {
          connectorId: {
            type: 'string',
            description:
              'Connector ID (e.g. jira, slack, pagerduty, salesforce, siem, groq, fal-ai, honeyhive, huggingface, elevenlabs)',
          },
          capabilityId: {
            type: 'string',
            description:
              'Capability ID within the connector (e.g. search_issues, post_message, chat_completion)',
          },
          params: {
            type: 'object',
            description:
              "Parameters to pass to the capability (depends on the capability's parameter schema)",
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'connector_hub_health',
      description:
        'Get the health status and monitoring metrics for all or a specific connector in the universal connector hub.',
      parameters: {
        type: 'object',
        properties: {
          connectorId: {
            type: 'string',
            description: 'Specific connector ID to check (omit for all connectors)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_action',
      description: 'Close an action item with a resolution status and notes.',
      parameters: {
        type: 'object',
        required: ['actionId', 'resolution'],
        properties: {
          actionId: { type: 'string' },
          resolution: {
            type: 'string',
            enum: ['resolved', 'mitigated', 'accepted_risk', 'false_positive'],
          },
          notes: { type: 'string' },
        },
      },
    },
  },
];

const HIGH_RISK_TOOLS = new Set([
  'containment_step',
  'recovery_step',
  'close_case',
  'update_case',
  'assign_owner',
]);

const OBSERVE_ONLY_BLOCKED = new Set([
  'create_case',
  'update_case',
  'close_case',
  'create_action_item',
  'assign_owner',
  'open_workflow',
  'close_workflow',
  'containment_step',
  'recovery_step',
  'notify_team',
  'route_for_approval',
  'close_action',
  'generate_executive_brief',
]);

const PROPOSE_ONLY_BLOCKED = new Set([
  'create_case',
  'update_case',
  'close_case',
  'create_action_item',
  'close_action',
  'assign_owner',
  'open_workflow',
  'close_workflow',
  'reopen_workflow',
  'containment_step',
  'recovery_step',
  'notify_team',
  'route_for_approval',
  'generate_executive_brief',
  'update_trust_posture',
]);

export function getExecutionMode(): ExecutionMode {
  const raw = process.env.AI_EXECUTION_MODE ?? 'propose_only';
  if (
    raw === 'observe_only' ||
    raw === 'propose_only' ||
    raw === 'approval_required' ||
    raw === 'approved_execute'
  ) {
    return raw;
  }
  return 'propose_only';
}

export function isHighRiskTool(toolName: string): boolean {
  return HIGH_RISK_TOOLS.has(toolName);
}

export function checkToolPolicy(
  toolName: string,
  _args: Record<string, unknown>,
): {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
  blockedReason: string | null;
} {
  const mode = getExecutionMode();

  if (mode === 'observe_only') {
    if (OBSERVE_ONLY_BLOCKED.has(toolName)) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `observe_only: tool '${toolName}' blocked — no actions permitted in observe mode`,
        blockedReason: `Execution mode is 'observe_only'. Tool '${toolName}' would take an action and is not permitted. AI may only observe and summarize.`,
      };
    }
    return {
      allowed: true,
      requiresApproval: false,
      reason: 'observe_only: read-only tool permitted',
      blockedReason: null,
    };
  }

  if (mode === 'propose_only') {
    if (PROPOSE_ONLY_BLOCKED.has(toolName)) {
      return {
        allowed: false,
        requiresApproval: true,
        reason: `propose_only: tool '${toolName}' blocked — action proposed but not executed`,
        blockedReason: `Execution mode is 'propose_only'. Tool '${toolName}' has been proposed and requires human initiation to execute. The AI will not execute this action autonomously.`,
      };
    }
    return {
      allowed: true,
      requiresApproval: false,
      reason: 'propose_only: safe tool permitted',
      blockedReason: null,
    };
  }

  if (mode === 'approval_required') {
    if (HIGH_RISK_TOOLS.has(toolName)) {
      return {
        allowed: false,
        requiresApproval: true,
        reason: `approval_required: tool '${toolName}' queued for approval`,
        blockedReason: `Tool '${toolName}' is a high-risk action requiring explicit human approval. The action has been queued in the approval workflow.`,
      };
    }
    return {
      allowed: true,
      requiresApproval: false,
      reason: 'approval_required: standard tool permitted',
      blockedReason: null,
    };
  }

  return {
    allowed: true,
    requiresApproval: false,
    reason: 'approved_execute: all tools permitted',
    blockedReason: null,
  };
}

function checkTenantBoundary(
  toolName: string,
  args: Record<string, unknown>,
  contextTenantId: string | undefined,
): { violation: boolean; reason: string | null } {
  if (!contextTenantId) return { violation: false, reason: null };
  const argTenant = typeof args.tenantId === 'string' ? args.tenantId : null;
  if (argTenant && argTenant !== contextTenantId) {
    return {
      violation: true,
      reason: `Cross-tenant action blocked: tool '${toolName}' targets tenant '${argTenant}' but request context belongs to tenant '${contextTenantId}'. Cross-tenant orchestration is forbidden.`,
    };
  }
  return { violation: false, reason: null };
}

const READ_ONLY_TOOLS = new Set([
  'fetch_connector_context',
  'lookup_cve',
  'lookup_threat_actor',
  'get_case',
  'list_cases',
  'get_action_items',
]);

async function writeAuditLog(
  entry: ToolAuditEntry,
  extra?: {
    relatedDecisionId?: string;
    relatedCaseId?: string;
    relatedIncidentId?: string;
    tenantId?: string;
  },
  throwOnFailure = false,
): Promise<void> {
  try {
    const { db, firestormToolAuditLogTable } = await import('@szl-holdings/db');
    const logId = `tal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const row: InsertFirestormToolAuditLog = {
      logId,
      toolName: entry.toolName,
      calledBy: entry.calledBy,
      tenantId: extra?.tenantId ?? 'default',
      executionMode: entry.executionMode,
      policyChecked: entry.policyChecked,
      approvalRequired: entry.approvalRequired,
      approvalStatus: entry.approvalStatus,
      result: entry.result,
      arguments: entry.arguments,
      output: null,
      error: entry.error,
      relatedDecisionId: extra?.relatedDecisionId ?? null,
      relatedCaseId: extra?.relatedCaseId ?? null,
      relatedIncidentId: extra?.relatedIncidentId ?? null,
    };
    await db.insert(firestormToolAuditLogTable).values(row);
  } catch (err) {
    if (throwOnFailure) {
      throw new Error(`Audit write failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    // For read-only tools, a failed audit log write is non-fatal
  }
}

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  calledBy: string = 'alloy',
  context?: {
    tenantId?: string;
    relatedDecisionId?: string;
    relatedCaseId?: string;
    relatedIncidentId?: string;
  },
): Promise<ToolExecutionResult> {
  const timestamp = new Date().toISOString();
  const mode = getExecutionMode();
  const policyCheck = checkToolPolicy(toolName, args);

  const auditEntry: ToolAuditEntry = {
    toolName,
    arguments: args,
    timestamp,
    calledBy,
    executionMode: mode,
    policyChecked: true,
    approvalRequired: policyCheck.requiresApproval,
    approvalStatus: policyCheck.requiresApproval ? 'pending' : 'not_required',
    result: 'success',
    error: null,
    blockedReason: policyCheck.blockedReason,
  };

  if (!policyCheck.allowed) {
    auditEntry.result = 'blocked';
    auditEntry.error = policyCheck.reason;
    await writeAuditLog(auditEntry, context);
    return {
      toolName,
      success: false,
      output: {
        blocked: true,
        executionMode: mode,
        reason: policyCheck.reason,
        blockedReason: policyCheck.blockedReason,
        proposedAction: { tool: toolName, args },
        approvalRequired: policyCheck.requiresApproval,
        approvalStatus: policyCheck.requiresApproval ? 'pending' : 'n/a',
      },
      auditEntry,
    };
  }

  const tenantCheck = checkTenantBoundary(toolName, args, context?.tenantId);
  if (tenantCheck.violation) {
    auditEntry.result = 'blocked';
    auditEntry.error = tenantCheck.reason;
    auditEntry.blockedReason = tenantCheck.reason;
    await writeAuditLog(auditEntry, context);
    return {
      toolName,
      success: false,
      output: {
        blocked: true,
        crossTenantViolation: true,
        reason: tenantCheck.reason,
        blockedReason: tenantCheck.reason,
      },
      auditEntry,
    };
  }

  const isActionTool = !READ_ONLY_TOOLS.has(toolName);

  try {
    const output = await executeToolInternal(toolName, args);
    await writeAuditLog(auditEntry, context, isActionTool);
    return { toolName, success: true, output, auditEntry };
  } catch (auditOrExecErr) {
    if (
      auditOrExecErr instanceof Error &&
      auditOrExecErr.message.startsWith('Audit write failed')
    ) {
      return {
        toolName,
        success: false,
        output: {
          auditFailure: true,
          error: 'Tool executed but durable audit write failed. Action rolled back for safety.',
        },
        auditEntry: { ...auditEntry, result: 'failure', error: auditOrExecErr.message },
      };
    }
    auditEntry.result = 'failure';
    auditEntry.error =
      auditOrExecErr instanceof Error ? auditOrExecErr.message : String(auditOrExecErr);
    await writeAuditLog(auditEntry, context).catch(() => {});
    return {
      toolName,
      success: false,
      output: { error: auditEntry.error },
      auditEntry,
    };
  }
}

async function executeToolInternal(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (toolName) {
    case 'lookup_workflow':
      return {
        id: args.workflowId,
        name: `Workflow ${args.workflowId}`,
        status: 'active',
        steps: 5,
        lastRunAt: new Date().toISOString(),
      };
    case 'lookup_signal':
      return {
        id: args.signalId,
        severity: 'high',
        source: 'lyte-observability',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };
    case 'lookup_owner':
      return {
        id: args.ownerId,
        name: 'Operator',
        role: 'platform-operator',
        activeAssignments: 3,
      };
    case 'lookup_case':
      return {
        id: args.caseId,
        title: `Case ${args.caseId}`,
        status: 'open',
        severity: 'high',
        assignedTo: null,
      };
    case 'notify_team':
      return {
        notified: true,
        channel: args.channel,
        message: args.message,
        sentAt: new Date().toISOString(),
      };
    case 'create_case':
      return { id: `case-${Date.now()}`, created: true, ...args, status: 'open' };
    case 'update_case':
      return { updated: true, caseId: args.caseId, changes: args };
    case 'close_case':
      return {
        closed: true,
        caseId: args.caseId,
        resolution: args.resolution,
        closedAt: new Date().toISOString(),
      };
    case 'create_action_item':
      return { id: `action-${Date.now()}`, created: true, ...args, status: 'open' };
    case 'assign_owner':
      return {
        assigned: true,
        entityType: args.entityType,
        entityId: args.entityId,
        newOwner: args.newOwner,
      };
    case 'open_workflow':
      return { opened: true, workflowId: args.workflowId, startedAt: new Date().toISOString() };
    case 'close_workflow':
      return { closed: true, workflowId: args.workflowId, resolution: args.resolution };
    case 'reopen_workflow':
      return {
        reopened: true,
        workflowId: args.workflowId,
        reason: args.reason,
        reopenedAt: new Date().toISOString(),
      };
    case 'containment_step':
      return {
        executed: true,
        containmentType: args.containmentType,
        targetId: args.targetId,
        executedAt: new Date().toISOString(),
      };
    case 'recovery_step':
      return {
        executed: true,
        recoveryType: args.recoveryType,
        targetId: args.targetId,
        executedAt: new Date().toISOString(),
      };
    case 'generate_executive_brief':
      return {
        generated: true,
        subjectId: args.subjectId,
        subjectType: args.subjectType,
        briefId: `brief-${Date.now()}`,
        generatedAt: new Date().toISOString(),
      };
    case 'route_for_approval':
      return {
        routed: true,
        approver: `approver-${args.approvalLevel}`,
        estimatedResponseTime: '15m',
      };
    case 'request_human_review':
      return {
        reviewRequested: true,
        reviewId: `review-${Date.now()}`,
        urgency: args.urgency || 'standard',
      };
    case 'append_audit_note':
      return { appended: true, recordId: args.recordId, noteId: `note-${Date.now()}` };
    case 'fetch_connector_context':
      return {
        connector: args.connectorType,
        results: [],
        query: args.query,
        fetchedAt: new Date().toISOString(),
      };
    case 'close_action':
      return { closed: true, actionId: args.actionId, resolution: args.resolution };
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
