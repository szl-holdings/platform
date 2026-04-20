import { z } from 'zod';

/**
 * The five policy modes that govern how the action-engine handles a proposed action.
 *
 * observe              – log only; no draft, no recommendation, no execution
 * recommend            – surface a human-readable recommendation; do not draft or execute
 * draft                – produce a draft artifact (email, document, plan) for human review
 * approval-required    – queue an approval request; execute only after explicit human sign-off
 * auto-within-guardrails – execute autonomously if confidence, cost, and scope are within limits
 */
export const PolicyModeSchema = z.enum([
  'observe',
  'recommend',
  'draft',
  'approval-required',
  'auto-within-guardrails',
]);
export type PolicyMode = z.infer<typeof PolicyModeSchema>;

export const POLICY_MODE_DESCRIPTIONS: Record<PolicyMode, string> = {
  observe: 'Log and monitor only — no action taken',
  recommend: 'Surface recommendation to operator; no execution',
  draft: 'Produce a draft artifact for human review before any action',
  'approval-required': 'Queue for explicit human approval before execution',
  'auto-within-guardrails': 'Execute autonomously when confidence, cost, and scope meet thresholds',
};

/**
 * Key that identifies a mode override scope: product × action-type × workspace.
 * Any field can be '*' (wildcard) to match all values.
 */
export const PolicyModeScopeSchema = z.object({
  product: z.string().default('*'),
  actionType: z.string().default('*'),
  workspace: z.string().default('*'),
});
export type PolicyModeScope = z.infer<typeof PolicyModeScopeSchema>;

export const PolicyModeConfigSchema = z.object({
  id: z.string(),
  scope: PolicyModeScopeSchema,
  mode: PolicyModeSchema,
  confidenceThreshold: z.number().min(0).max(1).default(0.8),
  maxCostUsd: z.number().min(0).optional(),
  guardedEntitySensitivity: z
    .enum(['public', 'internal', 'confidential', 'restricted'])
    .default('internal'),
  validWindowCron: z.string().optional(),
  environment: z.enum(['development', 'staging', 'production', 'all']).default('all'),
  reason: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
});
export type PolicyModeConfig = z.infer<typeof PolicyModeConfigSchema>;

/**
 * In-process registry mapping (product, actionType, workspace) → PolicyModeConfig.
 * The most specific match (fewest wildcards) wins.
 */
export class PolicyModeRegistry {
  private configs: PolicyModeConfig[] = [];

  register(config: PolicyModeConfig): void {
    const idx = this.configs.findIndex((c) => c.id === config.id);
    if (idx >= 0) {
      this.configs[idx] = config;
    } else {
      this.configs.push(config);
    }
  }

  unregister(id: string): boolean {
    const idx = this.configs.findIndex((c) => c.id === id);
    if (idx >= 0) {
      this.configs.splice(idx, 1);
      return true;
    }
    return false;
  }

  getAll(): PolicyModeConfig[] {
    return [...this.configs];
  }

  getById(id: string): PolicyModeConfig | undefined {
    return this.configs.find((c) => c.id === id);
  }

  /**
   * Resolve the effective PolicyModeConfig for a given (product, actionType, workspace) triple.
   * More specific matches (non-wildcard fields) take precedence.
   */
  resolve(params: {
    product: string;
    actionType: string;
    workspace: string;
  }): PolicyModeConfig | null {
    const candidates = this.configs.filter((c) => {
      const s = c.scope;
      return (
        (s.product === '*' || s.product === params.product) &&
        (s.actionType === '*' || s.actionType === params.actionType) &&
        (s.workspace === '*' || s.workspace === params.workspace)
      );
    });

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      const specificityA = specificityScore(a.scope);
      const specificityB = specificityScore(b.scope);
      return specificityB - specificityA;
    });

    return candidates[0]!;
  }
}

function specificityScore(scope: PolicyModeScope): number {
  let score = 0;
  if (scope.product !== '*') score++;
  if (scope.actionType !== '*') score++;
  if (scope.workspace !== '*') score++;
  return score;
}

export const defaultPolicyModeRegistry = new PolicyModeRegistry();
