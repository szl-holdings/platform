import type { PrismDomain } from '@szl-holdings/prism-bus';

export type ApprovalClass =
  | 'observe_only'
  | 'propose_only'
  | 'approval_required'
  | 'approved_execute';

export interface ForgeSandboxPolicy {
  tenantId?: string | null;
  domain: PrismDomain;
  approvalClass: ApprovalClass;
  allowedHosts: string[];
  allowedTools: string[];
  allowedDomains: PrismDomain[];
  maxDurationMs: number;
  maxCostUsd?: number;
  isDryRunDefault: boolean;
  requiresEvidenceCapture: boolean;
}

export interface ForgeSandboxViolation {
  type:
    | 'host_blocked'
    | 'tool_blocked'
    | 'domain_blocked'
    | 'duration_exceeded'
    | 'cost_exceeded'
    | 'approval_required';
  detail: string;
  blockedValue?: string;
}

export class ForgeSandbox {
  private policy: ForgeSandboxPolicy;
  private violations: ForgeSandboxViolation[] = [];

  constructor(policy: ForgeSandboxPolicy) {
    this.policy = policy;
  }

  get approvalClass(): ApprovalClass {
    return this.policy.approvalClass;
  }

  get isDryRunDefault(): boolean {
    return this.policy.isDryRunDefault;
  }

  get requiresEvidenceCapture(): boolean {
    return this.policy.requiresEvidenceCapture;
  }

  checkHost(host: string): ForgeSandboxViolation | null {
    if (this.policy.allowedHosts.length === 0) return null;
    const allowed = this.policy.allowedHosts.some(
      (h) => h === '*' || host === h || host.endsWith(`.${h}`),
    );
    if (!allowed) {
      const violation: ForgeSandboxViolation = {
        type: 'host_blocked',
        detail: `Host '${host}' is not in the Counsel sandbox allowed list`,
        blockedValue: host,
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  checkTool(toolName: string): ForgeSandboxViolation | null {
    if (this.policy.allowedTools.length === 0) return null;
    const allowed = this.policy.allowedTools.some((t) => t === '*' || t === toolName);
    if (!allowed) {
      const violation: ForgeSandboxViolation = {
        type: 'tool_blocked',
        detail: `Tool '${toolName}' is not permitted in this Counsel execution context`,
        blockedValue: toolName,
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  checkDomain(domain: PrismDomain): ForgeSandboxViolation | null {
    const allowed =
      this.policy.allowedDomains.length === 0 ||
      this.policy.allowedDomains.includes(domain) ||
      this.policy.allowedDomains.includes('global' as PrismDomain);
    if (!allowed) {
      const violation: ForgeSandboxViolation = {
        type: 'domain_blocked',
        detail: `Domain '${domain}' is outside the Counsel sandbox boundary`,
        blockedValue: domain,
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  checkDuration(durationMs: number): ForgeSandboxViolation | null {
    if (durationMs > this.policy.maxDurationMs) {
      const violation: ForgeSandboxViolation = {
        type: 'duration_exceeded',
        detail: `Execution duration ${durationMs}ms exceeded Counsel limit ${this.policy.maxDurationMs}ms`,
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  checkCost(costUsd: number): ForgeSandboxViolation | null {
    if (this.policy.maxCostUsd != null && costUsd > this.policy.maxCostUsd) {
      const violation: ForgeSandboxViolation = {
        type: 'cost_exceeded',
        detail: `Execution cost $${costUsd.toFixed(4)} exceeded Counsel limit $${this.policy.maxCostUsd.toFixed(4)}`,
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  requiresApprovalForAction(actionClass: ApprovalClass): boolean {
    const hierarchy: ApprovalClass[] = [
      'observe_only',
      'propose_only',
      'approval_required',
      'approved_execute',
    ];
    const policyIdx = hierarchy.indexOf(this.policy.approvalClass);
    const actionIdx = hierarchy.indexOf(actionClass);
    return actionIdx > policyIdx;
  }

  getViolations(): ForgeSandboxViolation[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }

  getPolicy(): Readonly<ForgeSandboxPolicy> {
    return { ...this.policy };
  }
}

export function createDefaultSandboxPolicy(
  domain: PrismDomain,
  overrides: Partial<ForgeSandboxPolicy> = {},
): ForgeSandboxPolicy {
  return {
    domain,
    approvalClass: 'propose_only',
    allowedHosts: [],
    allowedTools: [],
    allowedDomains: [domain, 'global'] as PrismDomain[],
    maxDurationMs: 5 * 60 * 1000,
    maxCostUsd: 1.0,
    isDryRunDefault: false,
    requiresEvidenceCapture: true,
    ...overrides,
  };
}
