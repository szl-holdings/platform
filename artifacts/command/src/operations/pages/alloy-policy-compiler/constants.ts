import { AlertTriangle, ArrowRight, CheckCircle, Clock, Eye, XCircle } from 'lucide-react';
import type { OutcomeKey, PolicyEffect, PreviewCase } from './types';

export const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e', card: '#111722' } as const;
export const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.07)', accent: 'rgba(212,160,84,0.3)' } as const;
export const TEXT = { primary: 'rgba(255,255,255,0.88)', secondary: 'rgba(255,255,255,0.55)', tertiary: 'rgba(255,255,255,0.3)', muted: 'rgba(255,255,255,0.15)' } as const;
export const ACCENT = '#d4a054';

export const EFFECT_CFG: Record<PolicyEffect, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  allow: { label: 'Allow', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', Icon: CheckCircle },
  require_approval: { label: 'Require Approval', color: ACCENT, bg: 'rgba(212,160,84,0.1)', border: 'rgba(212,160,84,0.3)', Icon: Clock },
  escalate: { label: 'Escalate', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.3)', Icon: ArrowRight },
  block: { label: 'Block', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', Icon: XCircle },
  audit_only: { label: 'Audit Only', color: '#8b7ac8', bg: 'rgba(139,122,200,0.1)', border: 'rgba(139,122,200,0.3)', Icon: Eye },
};

export const OUTCOME_CFG: Record<OutcomeKey, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  allowed: { label: 'Allowed', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', Icon: CheckCircle },
  blocked: { label: 'Blocked', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', Icon: XCircle },
  approval_required: { label: 'Needs Approval', color: ACCENT, bg: 'rgba(212,160,84,0.08)', Icon: Clock },
  escalated: { label: 'Escalated', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', Icon: AlertTriangle },
  audited: { label: 'Audited', color: '#8b7ac8', bg: 'rgba(139,122,200,0.08)', Icon: Eye },
};

export const PATTERN_SUGGESTIONS = [
  'No payout over $250,000 without two approvers and a finance sign-off',
  'Block all transactions exceeding $500,000 without compliance officer review',
  'Require finance approval for any payment above $50,000',
  'Escalate to compliance officer when export destination is external',
  'Allow transfers under $10,000 automatically within guardrails',
  'Audit all deletion actions regardless of amount',
  'Block irreversible write-backs without dual approver sign-off',
];

export const INITIAL_INPUT = `No payout over $250,000 without two approvers and a finance sign-off.
Block all transactions exceeding $500,000 regardless of approvers.
Require compliance officer review for any export to an external party.
Allow transfers under $10,000 automatically within guardrails.
Audit all deletion actions.`;

export const PREVIEW_ACTIONS: Omit<PreviewCase, 'outcome' | 'matchedRule' | 'reasoning' | 'previousOutcome'>[] = [
  { id: 'p1', actionType: 'payout', description: 'Payout $180,000 to vendor', context: { estimatedCostUsd: 180_000, action: 'payout', domain: 'finance' } },
  { id: 'p2', actionType: 'payout', description: 'Payout $320,000 for vessel charter', context: { estimatedCostUsd: 320_000, action: 'payout', domain: 'maritime' } },
  { id: 'p3', actionType: 'transfer', description: 'Internal fund transfer $7,500', context: { estimatedCostUsd: 7_500, action: 'transfer', domain: 'finance' } },
  { id: 'p4', actionType: 'export', description: 'Export compliance report externally', context: { estimatedCostUsd: 0, action: 'export', domain: 'compliance' } },
  { id: 'p5', actionType: 'deletion', description: 'Delete historical transaction batch', context: { estimatedCostUsd: 0, action: 'deletion', domain: 'finance' } },
  { id: 'p6', actionType: 'payout', description: 'Payout $600,000 for infrastructure', context: { estimatedCostUsd: 600_000, action: 'payout', domain: 'infrastructure' } },
  { id: 'p7', actionType: 'transfer', description: 'Payroll transfer $45,000', context: { estimatedCostUsd: 45_000, action: 'transfer', domain: 'hr' } },
];
