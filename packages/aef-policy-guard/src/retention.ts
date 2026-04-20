import type { RetentionPolicy } from './types.js';

export class RetentionRegistry {
  private readonly policies = new Map<string, RetentionPolicy>();

  register(policy: RetentionPolicy): void {
    this.policies.set(policy.tenantId, policy);
  }

  get(tenantId: string): RetentionPolicy | undefined {
    return this.policies.get(tenantId);
  }

  resolveRetentionDays(tenantId: string, profileId?: string): number {
    const policy = this.policies.get(tenantId);
    if (!policy) return 90;

    if (profileId && policy.profileOverrides[profileId] !== undefined) {
      return policy.profileOverrides[profileId]!;
    }

    return policy.defaultRetentionDays;
  }

  requiresDeletion(tenantId: string): boolean {
    return this.policies.get(tenantId)?.deletionRequired ?? false;
  }
}
