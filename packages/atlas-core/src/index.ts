export * from './domain';
export * from './primitives';
export * from './validation';

export const ATLAS_CORE_VERSION = '1.0.0' as const;

export const ATLAS_ENTITY_DESCRIPTIONS: Record<string, string> = {
  signal: 'A raw or normalized data point indicating a state change, anomaly, or operational event',
  event: 'A structured record of something that happened — user action, system event, or AI output',
  risk: 'An identified threat with likelihood, impact, and mitigation tracking',
  opportunity: 'A positive business event or prospect worth capturing and pursuing',
  control: 'A preventive, detective, or corrective measure that mitigates one or more risks',
  workflow: 'A structured sequence of steps with approval gates, routing rules, and SLA tracking',
  recommendation: 'An AI-generated advisory with reasoning chain, evidence, and confidence score',
  action: 'A human-confirmed response to a finding or recommendation with full attribution',
  approval: 'A human-in-the-loop gate — required before any consequential action is executed',
  evidence: 'A verifiable artifact supporting a control effectiveness claim or approval decision',
  outcome: 'The recorded result of a workflow, action, or business process',
  policy: 'A governance rule that defines required behavior, constraints, or approval requirements',
  kpi: 'A key performance indicator tracking progress against a business target',
  slo: 'A service level objective with error budget tracking and burn rate alerting',
  case: 'A bounded operational event requiring investigation, response, and resolution tracking',
  matter: 'A legal or advisory engagement with client, counsel, deadlines, and billing scope',
  mission: 'A defense or intelligence operation with command structure and objectives',
  deal: 'A commercial or transactional opportunity with stages, value, and counterparty',
  voyage: 'A maritime journey with vessel, cargo, ports, financial model, and risk profile',
  incident:
    'An active security or operational event requiring triage, containment, and remediation',
};

export function describeEntity(entityType: string): string {
  return ATLAS_ENTITY_DESCRIPTIONS[entityType] ?? 'Unknown ATLAS entity type';
}
