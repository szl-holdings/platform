import type { Policy, PolicyRule } from './types.js';

export const BUILT_IN_GUARDRAILS: Policy[] = [
  {
    id: 'guardrail-high-cost-auto-execution',
    name: 'High-Cost Autonomous Execution Guard',
    description:
      'Blocks autonomous execution of actions estimated to cost more than $10,000 USD without explicit approval.',
    scope: 'action',
    priority: 9000,
    isActive: true,
    rules: [
      {
        id: 'rule-cost-block',
        name: 'Block high-cost autonomous actions',
        conditions: [
          { field: 'estimatedCostUsd', operator: 'gt', value: 10000 },
          { field: 'executionMode', operator: 'eq', value: 'autonomous' },
        ],
        effect: 'require_approval',
        requiredApproverRole: 'admin',
        reason: 'Autonomous execution of actions exceeding $10,000 requires admin approval.',
        priority: 9000,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'guardrail-regulatory-exposure',
    name: 'Regulatory Exposure Escalation Guard',
    description: 'Escalates all actions involving regulatory exposure to compliance role.',
    scope: 'action',
    priority: 8000,
    isActive: true,
    rules: [
      {
        id: 'rule-regulatory-escalate',
        name: 'Escalate regulatory-exposed actions',
        conditions: [{ field: 'regulatoryExposure', operator: 'eq', value: true }],
        effect: 'require_approval',
        requiredApproverRole: 'compliance',
        reason: 'Actions with regulatory exposure require compliance officer review.',
        priority: 8000,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'guardrail-cross-domain-critical',
    name: 'Cross-Domain Critical Action Guard',
    description:
      'Requires approval for critical urgency actions with cross-domain blast radius ≥ 3 domains.',
    scope: 'action',
    priority: 7500,
    isActive: true,
    rules: [
      {
        id: 'rule-cross-domain-critical',
        name: 'Require approval for cross-domain critical',
        conditions: [{ field: 'urgency', operator: 'eq', value: 'critical' }],
        effect: 'require_approval',
        requiredApproverRole: 'ops',
        reason: 'Critical urgency cross-domain actions require operations lead approval.',
        priority: 7500,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'guardrail-low-confidence-block',
    name: 'Low Confidence Autonomous Block',
    description: 'Prevents autonomous execution when confidence is below 0.5.',
    scope: 'action',
    priority: 7000,
    isActive: true,
    rules: [
      {
        id: 'rule-low-confidence-block',
        name: 'Block low-confidence autonomous execution',
        conditions: [
          { field: 'confidence', operator: 'lt', value: 0.5 },
          { field: 'executionMode', operator: 'eq', value: 'autonomous' },
        ],
        effect: 'block',
        reason: 'Autonomous execution requires confidence ≥ 0.5. Current confidence is too low.',
        priority: 7000,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export function getActiveGuardrails(overrides?: Partial<Policy>[]): Policy[] {
  const base = [...BUILT_IN_GUARDRAILS];
  if (!overrides) return base;

  return base.map((g) => {
    const override = overrides.find((o) => o.id === g.id);
    if (!override) return g;
    return { ...g, ...override };
  });
}
