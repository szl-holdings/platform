import type { PolicyContext, PolicyDecision, PolicyRule } from './types.js';

export class PolicyEngine {
  private rules: PolicyRule[];

  constructor(rules: PolicyRule[] = []) {
    this.rules = [...rules].sort((a, b) => b.priority - a.priority);
  }

  addRule(rule: PolicyRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  removeRule(ruleId: string): boolean {
    const before = this.rules.length;
    this.rules = this.rules.filter((r) => r.ruleId !== ruleId);
    return this.rules.length < before;
  }

  getRules(): PolicyRule[] {
    return [...this.rules];
  }

  evaluate(context: PolicyContext): PolicyDecision {
    const reasons: string[] = [];
    const redactions: string[] = [];
    const appliedRuleIds: string[] = [];
    let denied = false;

    for (const rule of this.rules) {
      if (!this.ruleApplies(rule, context)) continue;

      appliedRuleIds.push(rule.ruleId);

      if (rule.action === 'deny') {
        denied = true;
        reasons.push(
          rule.description
            ? `Denied by rule '${rule.ruleId}': ${rule.description}`
            : `Denied by rule '${rule.ruleId}'`,
        );
      }

      if (rule.action === 'redact' && rule.redactFields.length > 0) {
        for (const field of rule.redactFields) {
          if (!redactions.includes(field)) {
            redactions.push(field);
          }
        }
        reasons.push(`Redaction applied by rule '${rule.ruleId}'`);
      }

      if (rule.requireProvenance && !context.hasProvenance) {
        denied = true;
        reasons.push(`Rule '${rule.ruleId}' requires provenance but none was provided`);
      }
    }

    if (denied) {
      return {
        allow: false,
        reasons,
        redactions,
        appliedRuleIds,
      };
    }

    if (appliedRuleIds.length === 0) {
      reasons.push('No rules matched; default-allow');
    }

    return {
      allow: true,
      reasons,
      redactions,
      appliedRuleIds,
    };
  }

  private ruleApplies(rule: PolicyRule, context: PolicyContext): boolean {
    if (rule.tenantIds && rule.tenantIds.length > 0) {
      if (!rule.tenantIds.includes(context.tenantId)) return false;
    }

    if (rule.allowedProfiles && rule.allowedProfiles.length > 0) {
      if (!context.profileId) return false;
      if (!rule.allowedProfiles.includes(context.profileId)) return false;
    }

    return true;
  }
}
