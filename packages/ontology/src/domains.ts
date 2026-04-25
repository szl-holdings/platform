/**
 * Canonical domain taxonomy for the SZL Holdings platform.
 *
 * A domain defines the operational vertical to which an entity, signal, or
 * event belongs. All cross-domain correlation uses these values as the
 * authoritative key — do not introduce domain names outside this enum.
 *
 * Source of truth: ontology.md § Domains
 */

export const DOMAINS = [
  'platform', // cross-cutting governance, identity, billing, and policy
  'vessels', // maritime intelligence — fleet, voyages, AIS, sanctions
  'terra', // real estate intelligence — property, ownership, distress
  'security', // defense, threat intelligence, incident response (Aegis)
  'counsel', // legal matter management (Counsel / prism-counsel)
  'carlota', // advisory and client portal (Carlota Jo)
  'pulse', // AI executive briefing
  'command', // unified command operations (cross-domain hub)
  'lyte', // business observability (planned flagship)
  'sentra', // (planned) new domain pack — TBD operational vertical
] as const;

export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  platform: 'Platform',
  vessels: 'Maritime Intelligence',
  terra: 'Real Estate Intelligence',
  security: 'Defense & Intelligence',
  counsel: 'Legal Matter Command',
  carlota: 'Advisory',
  pulse: 'Executive Briefing',
  command: 'Unified Command',
  lyte: 'Business Observability',
  sentra: 'Cyber Resilience',
};

export function isDomain(value: unknown): value is Domain {
  return DOMAINS.includes(value as Domain);
}
