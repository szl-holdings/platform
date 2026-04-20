import { z } from 'zod';

export const PolicyTierSchema = z.enum([
  'advisory',
  'supervised',
  'operator-approved',
  'dual-approved',
  'regulated',
  'sovereign',
]);

export type PolicyTier = z.infer<typeof PolicyTierSchema>;

export const TIER_NUMBER: Record<PolicyTier, number> = {
  advisory: 0,
  supervised: 1,
  'operator-approved': 2,
  'dual-approved': 3,
  regulated: 4,
  sovereign: 5,
};

export const TIER_RISK_LEVEL: Record<PolicyTier, number> = {
  advisory: 1,
  supervised: 2,
  'operator-approved': 3,
  'dual-approved': 4,
  regulated: 5,
  sovereign: 6,
};

export const POLICY_TIER_DESCRIPTIONS: Record<PolicyTier, string> = {
  advisory:
    'T0 — Read-only recommendations. No system state may be changed. No external comms. Zero approval required.',
  supervised:
    'T1 — Internal data reads and draft generation only. Operator oversight strongly recommended. No external or financial effects.',
  'operator-approved':
    'T2 — Agent action requires single operator approval before any commit. Suitable for routine internal ops tasks.',
  'dual-approved':
    'T3 — Two approvers required (operator + executive) before execution. Executive-grade scrutiny applies.',
  regulated:
    'T4 — Compliance gate mandatory. Dual approval required. Full audit trail. External comms blocked. PII must be redacted.',
  sovereign:
    'T5 — Full autonomy, but action must be reversible. Rollback capability verified before execution. Highest capability tier.',
};

export interface TierControlSet {
  tier: PolicyTier;
  tierNumber: number;
  allowedModels: string[] | null;
  allowedTools: string[] | null;
  maxActionsPerSession: number | null;
  approvalGate: 'none' | 'single' | 'dual';
  requiresRollback: boolean;
  redactPII: boolean;
  retentionDays: number;
  allowExternalComms: boolean;
  allowedEnvironments: string[];
  allowMemoryWrite: boolean;
  approvalExpiryHours: number | null;
}

export function getApprovalExpiryHoursForTier(tier: PolicyTier): number | null {
  return TIER_CONTROLS[tier]?.approvalExpiryHours ?? null;
}

export function computeApprovalExpiresAt(tier: PolicyTier, from: Date = new Date()): Date | null {
  const hours = getApprovalExpiryHoursForTier(tier);
  if (hours == null || hours <= 0) return null;
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

export const TIER_CONTROLS: Record<PolicyTier, TierControlSet> = {
  advisory: {
    tier: 'advisory',
    tierNumber: 0,
    allowedModels: null,
    allowedTools: null,
    maxActionsPerSession: 100,
    approvalGate: 'none',
    requiresRollback: false,
    redactPII: true,
    retentionDays: 30,
    allowExternalComms: false,
    allowedEnvironments: ['development', 'staging', 'production'],
    allowMemoryWrite: false,
    approvalExpiryHours: null,
  },
  supervised: {
    tier: 'supervised',
    tierNumber: 1,
    allowedModels: null,
    allowedTools: null,
    maxActionsPerSession: 50,
    approvalGate: 'none',
    requiresRollback: false,
    redactPII: true,
    retentionDays: 60,
    allowExternalComms: false,
    allowedEnvironments: ['development', 'staging', 'production'],
    allowMemoryWrite: true,
    approvalExpiryHours: null,
  },
  'operator-approved': {
    tier: 'operator-approved',
    tierNumber: 2,
    allowedModels: null,
    allowedTools: null,
    maxActionsPerSession: 25,
    approvalGate: 'single',
    requiresRollback: false,
    redactPII: true,
    retentionDays: 90,
    allowExternalComms: false,
    allowedEnvironments: ['staging', 'production'],
    allowMemoryWrite: true,
    approvalExpiryHours: 24,
  },
  'dual-approved': {
    tier: 'dual-approved',
    tierNumber: 3,
    allowedModels: null,
    allowedTools: null,
    maxActionsPerSession: 10,
    approvalGate: 'dual',
    requiresRollback: true,
    redactPII: true,
    retentionDays: 365,
    allowExternalComms: false,
    allowedEnvironments: ['production'],
    allowMemoryWrite: true,
    approvalExpiryHours: 48,
  },
  regulated: {
    tier: 'regulated',
    tierNumber: 4,
    allowedModels: null,
    allowedTools: null,
    maxActionsPerSession: 5,
    approvalGate: 'dual',
    requiresRollback: true,
    redactPII: true,
    retentionDays: 2555,
    allowExternalComms: false,
    allowedEnvironments: ['production'],
    allowMemoryWrite: false,
    approvalExpiryHours: 72,
  },
  sovereign: {
    tier: 'sovereign',
    tierNumber: 5,
    allowedModels: null,
    allowedTools: null,
    maxActionsPerSession: null,
    approvalGate: 'none',
    requiresRollback: true,
    redactPII: false,
    retentionDays: 365,
    allowExternalComms: true,
    allowedEnvironments: ['production'],
    allowMemoryWrite: true,
    approvalExpiryHours: null,
  },
};
