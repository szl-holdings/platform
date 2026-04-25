import type { CovenantPolicy } from '../schema';
import type { PolicyEnforcement } from '../core/types';
import { SEED_POLICIES } from '../demo/seedPolicies';

export interface PolicyEvalResult {
  policyId: string;
  policyName: string;
  enforcement: PolicyEnforcement;
  verdict: 'pass' | 'block' | 'warn' | 'require_approval' | 'log';
  rationale: string;
  evaluatedAt: string;
}

export interface CovenantLayerInterface {
  evaluate(actionId: string, context: Record<string, unknown>): Promise<PolicyEvalResult[]>;
  listPolicies(): Promise<{ policies: CovenantPolicy[]; total: number }>;
  getPolicy(id: string): Promise<CovenantPolicy | undefined>;
}

class InMemoryCovenantLayer implements CovenantLayerInterface {
  private store: Map<string, CovenantPolicy> = new Map(SEED_POLICIES.map(p => [p.id, p]));

  async evaluate(_actionId: string, _context: Record<string, unknown>): Promise<PolicyEvalResult[]> {
    const ts = new Date().toISOString();
    return [
      {
        policyId: 'pol-001',
        policyName: 'No Financial Commitments Without Executive Approval',
        enforcement: 'require_approval',
        verdict: 'require_approval',
        rationale: 'Action financial impact exceeds $50K threshold',
        evaluatedAt: ts,
      },
      {
        policyId: 'pol-002',
        policyName: 'Block Critical-Severity Actions Without Proof',
        enforcement: 'block',
        verdict: 'pass',
        rationale: 'Proof packet present and valid',
        evaluatedAt: ts,
      },
    ];
  }

  async listPolicies(): Promise<{ policies: CovenantPolicy[]; total: number }> {
    const policies = Array.from(this.store.values()).filter(p => p.active);
    return { policies, total: policies.length };
  }

  async getPolicy(id: string): Promise<CovenantPolicy | undefined> {
    return this.store.get(id);
  }
}

export const covenantLayer: CovenantLayerInterface = new InMemoryCovenantLayer();
