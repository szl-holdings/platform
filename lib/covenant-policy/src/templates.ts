import type { CovenantPolicy } from "./engine.js";
import type { PrismDomain } from "@szl-holdings/prism-bus";

export const COVENANT_POLICY_TEMPLATES: Record<string, Omit<CovenantPolicy, "id">> = {
  executive_viewer: {
    name: "Executive Viewer",
    description: "Read-only access across all domains for executive leadership",
    version: "1.0.0",
    roles: ["executive_viewer"],
    domains: [],
    permissions: ["view", "export"],
    effect: "allow",
    priority: 10,
  },
  analyst: {
    name: "Analyst",
    description: "Read and edit access within assigned domains, no approve/execute",
    version: "1.0.0",
    roles: ["analyst"],
    domains: [],
    permissions: ["view", "edit", "export"],
    effect: "allow",
    priority: 20,
  },
  operator: {
    name: "Operator",
    description: "Full read/edit/execute within assigned domain, propose-level actions",
    version: "1.0.0",
    roles: ["operator"],
    domains: [],
    permissions: ["view", "edit", "execute"],
    effect: "allow",
    priority: 30,
  },
  approver: {
    name: "Approver",
    description: "All operator capabilities plus approve/reject decisions",
    version: "1.0.0",
    roles: ["approver"],
    domains: [],
    permissions: ["view", "edit", "execute", "approve"],
    effect: "allow",
    priority: 40,
  },
  tenant_admin: {
    name: "Tenant Admin",
    description: "Full permissions within the tenant including policy management",
    version: "1.0.0",
    roles: ["tenant_admin"],
    domains: [],
    permissions: ["view", "edit", "execute", "approve", "export", "admin"],
    effect: "allow",
    priority: 50,
  },
  external_partner: {
    name: "External Partner",
    description: "Limited view-only access to specific shared domains",
    version: "1.0.0",
    roles: ["external_partner"],
    domains: [],
    permissions: ["view"],
    effect: "allow",
    priority: 5,
  },
  super_admin: {
    name: "Super Admin",
    description: "Unrestricted access across all tenants and domains",
    version: "1.0.0",
    roles: ["super_admin"],
    domains: [],
    permissions: ["view", "edit", "execute", "approve", "export", "admin"],
    effect: "allow",
    priority: 100,
  },
  deny_all: {
    name: "Deny All",
    description: "Explicit deny-all policy for lockdown scenarios",
    version: "1.0.0",
    roles: [],
    domains: [],
    permissions: ["view", "edit", "execute", "approve", "export", "admin"],
    effect: "deny",
    priority: 1000,
  },
};

export function instantiateTemplate(
  templateKey: keyof typeof COVENANT_POLICY_TEMPLATES,
  overrides: Partial<Pick<CovenantPolicy, "domains" | "conditions" | "expiresAt" | "metadata">> & { id?: string } = {}
): CovenantPolicy {
  const template = COVENANT_POLICY_TEMPLATES[templateKey];
  if (!template) throw new Error(`COVENANT: Unknown policy template '${templateKey}'`);

  return {
    ...template,
    id: overrides.id ?? `cov-${templateKey}-${Date.now()}`,
    domains: overrides.domains ?? template.domains,
    conditions: overrides.conditions ?? template.conditions,
    expiresAt: overrides.expiresAt ?? template.expiresAt ?? null,
    metadata: overrides.metadata ?? template.metadata,
  };
}

export function buildDomainScopedPolicy(
  templateKey: keyof typeof COVENANT_POLICY_TEMPLATES,
  domains: PrismDomain[],
  id?: string
): CovenantPolicy {
  return instantiateTemplate(templateKey, { domains, id });
}
