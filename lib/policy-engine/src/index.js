import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { z } = require('zod');

const _policies = new Map();

export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(''),
  domain: z.string(),
  conditions: z.array(z.any()).optional().default([]),
  actions: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
  createdAt: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
});

export function registerPolicy(policy) {
  _policies.set(policy.id, { ...policy, isActive: true, createdAt: new Date().toISOString() });
}

export function getRegisteredPolicies() {
  return Array.from(_policies.values());
}

export function evaluatePolicies(request = {}) {
  const { actionId, domain, context } = request;
  const relevant = Array.from(_policies.values()).filter(
    (p) => p.isActive && (!p.domain || p.domain === domain),
  );
  const passed = relevant.filter((p) => {
    if (!p.conditions?.length) return true;
    return p.conditions.every((c) => {
      if (c.type === 'role_required') return (context?.roles ?? []).includes(c.value);
      return true;
    });
  });
  return {
    allowed: passed.length === relevant.length || relevant.length === 0,
    evaluated: relevant.length,
    passed: passed.length,
    blocked: relevant.length - passed.length,
    blockedBy: [],
    reasoning: `Evaluated ${relevant.length} policies for action ${actionId}`,
  };
}

export function checkAction(actionId, context = {}) {
  const result = evaluatePolicies({ actionId, domain: context.domain, context });
  return result.allowed;
}
