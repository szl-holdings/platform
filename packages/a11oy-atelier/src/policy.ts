import { randomUUID } from 'node:crypto';
import {
  evaluatePolicies,
  POLICY_ENGINE_VERSION,
  type Policy,
  type PolicyEvaluationResult,
} from '@szl-holdings/policy-engine';
import type { AtelierAskRequest } from './contracts.js';

const POLICY_EPOCH = Date.UTC(2026, 7, 26);

export const ATELIER_POLICY_VERSION = `atelier-1.0.0+policy-engine-${POLICY_ENGINE_VERSION}`;

export const ATELIER_POLICIES: Policy[] = [
  {
    id: 'a11oy-atelier-capability-admission-v1',
    name: 'A11oy Atelier capability admission',
    description:
      'First-release capabilities are fail-closed unless a reviewed policy enables them.',
    scope: 'domain',
    domain: 'a11oy.atelier',
    priority: 10_000,
    isActive: true,
    rules: [
      {
        id: 'block-tools',
        name: 'Block tool execution',
        conditions: [{ field: 'tools', operator: 'eq', value: true }],
        effect: 'block',
        reason: 'Tool execution is disabled in A11oy Atelier release 1.',
        priority: 10_000,
      },
      {
        id: 'block-search',
        name: 'Block hosted search',
        conditions: [{ field: 'search', operator: 'eq', value: true }],
        effect: 'block',
        reason: 'Hosted search is disabled until source-admission receipts are wired.',
        priority: 10_000,
      },
      {
        id: 'block-durable-storage',
        name: 'Block provider-side durable storage',
        conditions: [{ field: 'durableStorage', operator: 'eq', value: true }],
        effect: 'block',
        reason: 'Provider-side durable storage is disabled; A11oy owns session memory.',
        priority: 10_000,
      },
      {
        id: 'block-subagents',
        name: 'Block provider subagents',
        conditions: [{ field: 'subagents', operator: 'eq', value: true }],
        effect: 'block',
        reason: 'Provider subagents are disabled; future Ayllu councils require reviewed policies.',
        priority: 10_000,
      },
      {
        id: 'allow-inference',
        name: 'Allow disclosed inference',
        conditions: [{ field: 'action', operator: 'eq', value: 'atelier.ask' }],
        effect: 'allow',
        reason: 'Disclosed text inference is allowed within configured limits.',
        priority: 100,
      },
    ],
    createdAt: POLICY_EPOCH,
    updatedAt: POLICY_EPOCH,
  },
];

export interface AtelierPolicyDecision {
  evaluationId: string;
  version: string;
  result: PolicyEvaluationResult;
}

export function evaluateAtelierPolicy(
  request: AtelierAskRequest,
  tenantId: string,
): AtelierPolicyDecision {
  return {
    evaluationId: randomUUID(),
    version: ATELIER_POLICY_VERSION,
    result: evaluatePolicies(ATELIER_POLICIES, {
      action: 'atelier.ask',
      actionClass: 'inference',
      domain: 'a11oy.atelier',
      tenantId,
      subject: { roles: ['operator'], tenantId },
      resource: { type: 'model-inference', domain: 'a11oy.atelier' },
      context: {
        ...request.capabilities,
        provider: request.provider,
        maxOutputTokens: request.maxOutputTokens,
        executionMode: 'operator-initiated',
      },
    }),
  };
}
