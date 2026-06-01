import { randomUUID } from 'node:crypto';
import { getCurrentTenantId } from './request-context.js';
import { emitRunEvent, type RunEventType } from './run-events.js';

export interface DomainRoot {
  uri: string;
  name: string;
  domain: string;
  description: string;
  tenantScoped: boolean;
}

const DOMAIN_PACK_ROOTS: DomainRoot[] = [
  {
    uri: 'file:///szl/sentra/threat-pipeline',
    name: 'Sentra Threat Pipeline',
    domain: 'sentra',
    description: 'Cybersecurity threat triage, CVE tracking, and adversarial pattern detection data boundary.',
    tenantScoped: true,
  },
  {
    uri: 'file:///szl/sentra/compliance',
    name: 'Sentra Compliance',
    domain: 'sentra',
    description: 'Security compliance framework adherence and readiness scores.',
    tenantScoped: true,
  },
  {
    uri: 'file:///szl/vessels/fleet-ops',
    name: 'Vessels Fleet Operations',
    domain: 'vessels',
    description: 'Maritime fleet positions, voyage tracking, and AIS intelligence.',
    tenantScoped: true,
  },
  {
    uri: 'file:///szl/vessels/anomaly-detection',
    name: 'Vessels Anomaly Detection',
    domain: 'vessels',
    description: 'Vessel behavior anomaly detection including dark periods and route deviations.',
    tenantScoped: true,
  },
  {
    uri: 'file:///szl/terra/distress-pipeline',
    name: 'Terra Distress Pipeline',
    domain: 'terra',
    description: 'Real estate distressed property identification and valuation analysis.',
    tenantScoped: true,
  },
  {
    uri: 'file:///szl/terra/portfolio',
    name: 'Terra Portfolio Analytics',
    domain: 'terra',
    description: 'Real estate portfolio performance metrics and anomaly detection.',
    tenantScoped: true,
  },
  {
    uri: 'file:///szl/counsel/matters',
    name: 'Counsel Legal Matters',
    domain: 'counsel',
    description: 'Legal matter tracking, contract analysis, and regulatory document management.',
    tenantScoped: true,
  },
  {
    uri: 'file:///szl/counsel/evidence',
    name: 'Counsel Evidence Packages',
    domain: 'counsel',
    description: 'Legal evidence packaging and chain-of-custody tracking.',
    tenantScoped: true,
  },
  {
    uri: 'file:///szl/pulse/health',
    name: 'Pulse Platform Health',
    domain: 'pulse',
    description: 'Platform-wide health metrics, monitoring alerts, and system status.',
    tenantScoped: false,
  },
  {
    uri: 'file:///szl/command/orchestration',
    name: 'Command Orchestration',
    domain: 'command',
    description: 'Cross-domain workflow orchestration, approval gates, and executive briefings.',
    tenantScoped: false,
  },
];

const TENANT_DOMAIN_ACCESS: Record<string, string[]> = {
  'substrate-gateway': ['sentra', 'vessels', 'terra', 'counsel', 'pulse', 'command'],
  'sentinel': ['sentra'],
  'helmsman': ['vessels'],
  'terra': ['terra'],
  'lexis': ['counsel'],
  'beacon': ['pulse', 'command'],
};

const enabledDomains = new Set<string>([
  'sentra', 'vessels', 'terra', 'counsel', 'pulse', 'command',
]);

export function listRoots(tenantId?: string): DomainRoot[] {
  const effectiveTenant = tenantId ?? getCurrentTenantId() ?? 'substrate-gateway';
  const allowedDomains = TENANT_DOMAIN_ACCESS[effectiveTenant] ?? [];
  const isSuper = effectiveTenant === 'substrate-gateway';

  return DOMAIN_PACK_ROOTS.filter((root) => {
    if (!enabledDomains.has(root.domain)) return false;
    if (isSuper) return true;
    return allowedDomains.includes(root.domain);
  });
}

const OPERATOR_TENANTS = new Set(['substrate-gateway', 'beacon']);

function assertOperatorTenant(tenantId?: string): void {
  const effective = tenantId ?? getCurrentTenantId() ?? 'anonymous';
  if (!OPERATOR_TENANTS.has(effective)) {
    throw new Error(
      `Unauthorized: tenant '${effective}' lacks operator privileges for domain pack mutations. ` +
      `Only substrate-gateway and beacon tenants may enable/disable domain packs.`,
    );
  }
}

export function enableDomainPack(domain: string, tenantId?: string): void {
  assertOperatorTenant(tenantId);
  if (enabledDomains.has(domain)) return;
  enabledDomains.add(domain);
  emitRunEvent({
    type: 'roots_list_changed' as RunEventType,
    timestamp: Date.now(),
  });
}

export function disableDomainPack(domain: string, tenantId?: string): void {
  assertOperatorTenant(tenantId);
  if (!enabledDomains.has(domain)) return;
  enabledDomains.delete(domain);
  emitRunEvent({
    type: 'roots_list_changed' as RunEventType,
    timestamp: Date.now(),
  });
}

export function getDomainPackStatus(): Array<{ domain: string; enabled: boolean }> {
  const allDomains = [...new Set(DOMAIN_PACK_ROOTS.map((r) => r.domain))];
  return allDomains.map((d) => ({ domain: d, enabled: enabledDomains.has(d) }));
}
