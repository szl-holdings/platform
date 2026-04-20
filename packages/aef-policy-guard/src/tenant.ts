import type { PolicyDecision, PolicyContext } from "./types.js";

export interface TenantBoundaryConfig {
  registeredTenants: Set<string>;
}

export class TenantBoundaryEnforcer {
  private readonly registered: Set<string>;

  constructor(config: TenantBoundaryConfig) {
    this.registered = new Set(config.registeredTenants);
  }

  register(tenantId: string): void {
    this.registered.add(tenantId);
  }

  enforce(context: PolicyContext): PolicyDecision | null {
    if (!this.registered.has(context.tenantId)) {
      return {
        allow: false,
        reasons: [
          `Tenant '${context.tenantId}' is not registered in AEF. Cross-tenant access is not permitted.`,
        ],
        redactions: [],
        appliedRuleIds: ["tenant-boundary-enforcer"],
      };
    }
    return null;
  }

  isRegistered(tenantId: string): boolean {
    return this.registered.has(tenantId);
  }
}
