/**
 * Alloy WorkGraph — Workspace Permission Mirror & DLP Enforcement Layer
 *
 * Every WorkGraph query is scoped to the requesting user via this mirror.
 * Private nodes are redacted unless the user has source-system access.
 * Restricted data classes are masked; proof references are returned instead.
 *
 * This is the enforcement path — not merely UI copy. Any node with
 * sourcePermissionState === 'restricted' or 'blocked' will have its summary
 * replaced with a proof-reference stub before being returned to the caller.
 */

import type { DataClass } from './alloy-workgraph-connectors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DlpAction = 'allow' | 'mask' | 'redact' | 'block' | 'proof_ref_only';

export interface DlpPolicy {
  id: string;
  name: string;
  dataClass: DataClass;
  action: DlpAction;
  reason: string;
  requiresApproval: boolean;
  approvalClass: 'auto' | 'review' | 'finance' | 'legal' | 'security' | 'executive';
}

export interface WorkGraphQueryContext {
  tenantId: number;
  requestingUserId: string;
  requestingUserRoles: string[];
  projectFilter?: string;
  typeFilter?: string[];
  freshnessFilter?: string[];
  riskFilter?: string[];
}

export interface WorkGraphNodeResult {
  nodeId: string;
  type: string;
  title: string;
  summary: string;
  owner: string;
  project: string;
  sourceSystem: string;
  dataClass: DataClass;
  sensitivity: number;
  confidence: number;
  visibility: string;
  sourcePermissionState: string;
  freshness: string;
  riskLevel: string;
  permissionNote?: string;
  dlpMasked?: boolean;
  proofRefOnly?: boolean;
}

// ─── Default DLP Policies ─────────────────────────────────────────────────────

export const WORKSPACE_DLP_POLICIES: DlpPolicy[] = [
  {
    id: 'dlp-restricted',
    name: 'Restricted Source — Proof Reference Only',
    dataClass: 'restricted',
    action: 'proof_ref_only',
    reason: 'Restricted content cannot be summarized or included in outbound messages. Proof reference returned.',
    requiresApproval: true,
    approvalClass: 'executive',
  },
  {
    id: 'dlp-legal',
    name: 'Legal Content — Human Review Required',
    dataClass: 'legal',
    action: 'mask',
    reason: 'Legal-class content requires human review before inclusion in any output. Content masked.',
    requiresApproval: true,
    approvalClass: 'legal',
  },
  {
    id: 'dlp-finance',
    name: 'Finance Action — Finance Approval Required',
    dataClass: 'finance',
    action: 'allow',
    reason: 'Finance-class content visible to authorized roles. Finance approval required for actions.',
    requiresApproval: true,
    approvalClass: 'finance',
  },
  {
    id: 'dlp-security',
    name: 'Security Event — Security Review Required',
    dataClass: 'security',
    action: 'allow',
    reason: 'Security-class content visible to security roles. Security review required before actions.',
    requiresApproval: true,
    approvalClass: 'security',
  },
  {
    id: 'dlp-personal',
    name: 'Personal Data — PII Masked in Outbound',
    dataClass: 'personal',
    action: 'mask',
    reason: 'Personal data (PII) masked in board packets and external documents per GDPR Article 5.',
    requiresApproval: false,
    approvalClass: 'auto',
  },
  {
    id: 'dlp-regulated',
    name: 'Regulated Data — Compliance Review',
    dataClass: 'regulated',
    action: 'mask',
    reason: 'Regulated data requires compliance review and cannot be included in automated outputs.',
    requiresApproval: true,
    approvalClass: 'executive',
  },
  {
    id: 'dlp-confidential-external',
    name: 'Confidential — Customer-Facing Review Required',
    dataClass: 'confidential',
    action: 'allow',
    reason: 'Confidential content visible to authorized team. Customer-facing drafts require account owner review.',
    requiresApproval: true,
    approvalClass: 'review',
  },
];

// ─── Permission mirror ────────────────────────────────────────────────────────

function hasRoleAccess(userRoles: string[], dataClass: DataClass): boolean {
  if (userRoles.includes('super_admin') || userRoles.includes('admin')) return true;
  if (dataClass === 'finance') return userRoles.includes('finance') || userRoles.includes('executive');
  if (dataClass === 'legal') return userRoles.includes('legal') || userRoles.includes('executive');
  if (dataClass === 'security') return userRoles.includes('security') || userRoles.includes('executive');
  if (dataClass === 'restricted') return userRoles.includes('executive') || userRoles.includes('super_admin');
  if (dataClass === 'regulated') return userRoles.includes('compliance') || userRoles.includes('executive');
  return true;
}

export function applyDlpPolicy(
  node: {
    nodeId: string;
    type: string;
    title: string;
    summary: string;
    owner: string;
    project: string;
    sourceSystem: string;
    dataClass: DataClass;
    sensitivity: number;
    confidence: number;
    visibility: string;
    sourcePermissionState: string;
    freshness: string;
    riskLevel: string;
  },
  context: WorkGraphQueryContext,
): WorkGraphNodeResult {
  const policy = WORKSPACE_DLP_POLICIES.find((p) => p.dataClass === node.dataClass);
  const hasAccess = hasRoleAccess(context.requestingUserRoles, node.dataClass);

  // Blocked / no access
  if (node.sourcePermissionState === 'blocked' || !hasAccess) {
    return {
      ...node,
      summary: '[Access denied — insufficient permission for this source system]',
      permissionNote: 'Access blocked. You do not have source-system access to this node.',
      dlpMasked: true,
      proofRefOnly: false,
    };
  }

  // Restricted — proof reference only
  if (node.dataClass === 'restricted' || node.sourcePermissionState === 'restricted') {
    return {
      ...node,
      summary: '[Restricted source — proof reference only. Content not available in summary layer.]',
      permissionNote: policy?.reason ?? 'Restricted access.',
      dlpMasked: true,
      proofRefOnly: true,
    };
  }

  // Legal / personal / regulated — mask content
  if (policy?.action === 'mask' || node.dataClass === 'legal' || node.dataClass === 'personal' || node.dataClass === 'regulated') {
    const maskedSummary = node.dataClass === 'personal'
      ? node.summary.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[MASKED]')
      : `[${node.dataClass.charAt(0).toUpperCase() + node.dataClass.slice(1)}-class content masked — ${policy?.reason ?? 'requires review'}]`;
    return {
      ...node,
      summary: maskedSummary,
      permissionNote: policy?.reason,
      dlpMasked: true,
      proofRefOnly: false,
    };
  }

  // Inherited visibility
  if (node.sourcePermissionState === 'inherited') {
    return {
      ...node,
      permissionNote: 'Access inherited from source system.',
      dlpMasked: false,
      proofRefOnly: false,
    };
  }

  return {
    ...node,
    dlpMasked: false,
    proofRefOnly: false,
  };
}

/**
 * enforceVisibility: filter/mask nodes based on their visibility field
 * relative to the requesting user.
 *
 * - owner_only: only the owning user may see the full content; others see a
 *   permission-note stub so they know a private node exists.
 * - team: accessible to any authenticated team member.
 * - org: accessible to any authenticated org member.
 * - public: always visible.
 *
 * For demo mode (requestingUserId starts with "demo-") owner_only nodes are
 * surfaced with an appropriate note instead of being fully blocked, so demo
 * walkthroughs show realistic data coverage.
 */
function enforceVisibility(
  node: Parameters<typeof applyDlpPolicy>[0],
  context: WorkGraphQueryContext,
): Parameters<typeof applyDlpPolicy>[0] | null {
  const { requestingUserId } = context;
  const isDemo = requestingUserId.startsWith('demo-');
  const isOwner = node.owner === requestingUserId || isDemo;

  if (node.visibility === 'owner_only' && !isOwner) {
    // Return a stub — reveal title+type but mask content so users know
    // private work exists without exposing it.
    return {
      ...node,
      summary: '[Private node — content restricted to owner only]',
      sourcePermissionState: 'blocked',
    };
  }
  // team / org / public all pass through; DLP will handle data-class checks
  return node;
}

/**
 * workspacePermissionMirror: the main enforcement entry point.
 * Applies (1) visibility-ownership rules, then (2) DLP data-class policies.
 * Returns only nodes the requesting user is permitted to receive.
 */
export function workspacePermissionMirror(
  nodes: Parameters<typeof applyDlpPolicy>[0][],
  context: WorkGraphQueryContext,
): WorkGraphNodeResult[] {
  return nodes
    .map((node) => enforceVisibility(node, context))
    .filter((node): node is Parameters<typeof applyDlpPolicy>[0] => node !== null)
    .map((node) => applyDlpPolicy(node, context));
}

/**
 * deriveUserRoles: extract per-user role list from authenticated request user.
 * Checks for a roles claim in the JWT payload; falls back to ['member'].
 * In demo mode (no real user) returns a demo-executive set so the demo
 * shows realistic data coverage without granting super_admin.
 */
export function deriveUserRoles(
  user: { id?: string; roles?: string[]; email?: string } | undefined,
  isDemo: boolean,
): string[] {
  if (isDemo && (!user?.id || user.id === 'demo-user')) {
    // Demo user is a senior executive — sees finance, legal, security content
    // but NOT restricted (super_admin required) unless role is granted.
    return ['member', 'executive', 'finance', 'legal', 'security'];
  }
  if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles as string[];
  }
  // Authenticated user with no explicit roles: base team member
  return ['member'];
}
