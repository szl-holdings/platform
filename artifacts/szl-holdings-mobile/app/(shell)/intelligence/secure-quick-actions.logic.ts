/**
 * Pure logic extracted from the Secure Quick Actions screen.
 * Imported by both the screen and its tests so regressions are caught.
 */

export const ACCENT = '#c9a84c';

export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ActionTemplate {
  id: string;
  title: string;
  description: string;
  actionClass: string;
  resourceType: string;
  priority: ActionPriority;
  icon: string;
  accentColor: string;
  requiresBiometric: boolean;
  domain: string;
}

export const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: 'escalate-approval',
    title: 'Escalate Approval',
    description: 'Escalate a pending approval to senior decision-maker with reason',
    actionClass: 'compliance',
    resourceType: 'approval',
    priority: 'high',
    icon: 'arrow-up-circle',
    accentColor: '#f97316',
    requiresBiometric: true,
    domain: 'guardian',
  },
  {
    id: 'suspend-agent',
    title: 'Suspend Agent Run',
    description: 'Pause an active cognitive agent run pending human review',
    actionClass: 'deployment',
    resourceType: 'agent_run',
    priority: 'critical',
    icon: 'pause-circle',
    accentColor: '#ef4444',
    requiresBiometric: true,
    domain: 'alloy',
  },
  {
    id: 'freeze-action',
    title: 'Freeze Pending Action',
    description: 'Block a guardian-queued action from executing',
    actionClass: 'compliance',
    resourceType: 'action_draft',
    priority: 'high',
    icon: 'lock',
    accentColor: '#6366f1',
    requiresBiometric: true,
    domain: 'guardian',
  },
  {
    id: 'request-brief',
    title: 'Request Priority Brief',
    description: 'Trigger an on-demand cross-domain executive briefing',
    actionClass: 'general',
    resourceType: 'briefing',
    priority: 'medium',
    icon: 'file-text',
    accentColor: ACCENT,
    requiresBiometric: false,
    domain: 'pulse',
  },
  {
    id: 'flag-entity',
    title: 'Flag World-Model Entity',
    description: 'Flag a Constellation entity for manual review',
    actionClass: 'compliance',
    resourceType: 'cst_entity',
    priority: 'medium',
    icon: 'flag',
    accentColor: '#ec4899',
    requiresBiometric: false,
    domain: 'cortex',
  },
  {
    id: 'rollback-request',
    title: 'Request Rollback',
    description: 'Request a rollback for a recently recorded action',
    actionClass: 'deployment',
    resourceType: 'action',
    priority: 'critical',
    icon: 'rotate-ccw',
    accentColor: '#ef4444',
    requiresBiometric: true,
    domain: 'guardian',
  },
];

export const GUARDIAN_APPROVALS_PATH = '/api/approvals';
export const RECENT_ACTIVITY_PATH = '/api/approvals?status=all&limit=10';

export interface GuardianSubmitBody {
  resourceType: string;
  resourceId: string;
  title: string;
  description: string;
  actionClass: string;
  priority: ActionPriority;
  payload: {
    templateId: string;
    domain: string;
    requiresBiometric: boolean;
    rollbackPoint: string;
    initiatedFrom: 'mobile:secure-quick-actions';
  };
}

export function buildGuardianSubmitBody(
  template: ActionTemplate,
  resourceId: string,
  description: string,
  nowIso: string = new Date().toISOString(),
): GuardianSubmitBody {
  return {
    resourceType: template.resourceType,
    resourceId,
    title: template.title,
    description: description || template.description,
    actionClass: template.actionClass,
    priority: template.priority,
    payload: {
      templateId: template.id,
      domain: template.domain,
      requiresBiometric: template.requiresBiometric,
      rollbackPoint: nowIso,
      initiatedFrom: 'mobile:secure-quick-actions',
    },
  };
}

/**
 * Executes the secure-action flow: validates input, gates on biometrics when
 * required, then submits to the Guardian approvals endpoint. The biometric
 * prompt and apiFetch are injected so tests can exercise real code paths.
 */
export async function executeSecureActionFlow(
  template: ActionTemplate,
  resourceId: string,
  description: string,
  promptBiometric: (reason: string) => Promise<boolean>,
  apiFetch: (path: string, init: { method: string; body: string }) => Promise<unknown>,
  nowIso?: string,
): Promise<unknown> {
  if (!resourceId.trim()) {
    throw new Error('Missing field: resourceId is required');
  }
  if (template.requiresBiometric) {
    const ok = await promptBiometric('Confirm guardian-scoped action');
    if (!ok) {
      throw new Error('Biometric authentication cancelled');
    }
  }
  const body = buildGuardianSubmitBody(template, resourceId.trim(), description.trim(), nowIso);
  return apiFetch(GUARDIAN_APPROVALS_PATH, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
