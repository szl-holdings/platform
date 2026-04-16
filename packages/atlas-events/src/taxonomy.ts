export const ATLAS_EVENT_DOMAINS = [
  "business",
  "security",
  "maritime",
  "real_estate",
  "legal",
  "platform",
  "ai",
  "workflow",
  "billing",
  "auth",
] as const;
export type AtlasEventDomain = typeof ATLAS_EVENT_DOMAINS[number];

export type AtlasEventClass =
  | `business.${string}`
  | `security.${string}`
  | `maritime.${string}`
  | `real_estate.${string}`
  | `legal.${string}`
  | `platform.${string}`
  | `ai.${string}`
  | `workflow.${string}`
  | `billing.${string}`
  | `auth.${string}`;

export const BUSINESS_EVENTS = {
  TRANSACTION_STARTED: "business.transaction.started",
  TRANSACTION_COMPLETED: "business.transaction.completed",
  TRANSACTION_FAILED: "business.transaction.failed",
  TRANSACTION_REVERSED: "business.transaction.reversed",

  RISK_DETECTED: "business.risk.detected",
  RISK_ESCALATED: "business.risk.escalated",
  RISK_MITIGATED: "business.risk.mitigated",
  RISK_ACCEPTED: "business.risk.accepted",

  OPPORTUNITY_IDENTIFIED: "business.opportunity.identified",
  OPPORTUNITY_QUALIFIED: "business.opportunity.qualified",
  OPPORTUNITY_WON: "business.opportunity.won",
  OPPORTUNITY_LOST: "business.opportunity.lost",

  KPI_THRESHOLD_BREACHED: "business.kpi.threshold_breached",
  KPI_TARGET_MET: "business.kpi.target_met",
  SLO_BURN_RATE_HIGH: "business.slo.burn_rate_high",
  SLO_BREACHED: "business.slo.breached",
  SLO_RECOVERED: "business.slo.recovered",

  ANOMALY_DETECTED: "business.anomaly.detected",
  ANOMALY_CONFIRMED: "business.anomaly.confirmed",
  ANOMALY_DISMISSED: "business.anomaly.dismissed",

  FORECAST_UPDATED: "business.forecast.updated",
  BUDGET_VARIANCE_DETECTED: "business.budget.variance_detected",

  SIGNAL_INGESTED: "business.signal.ingested",
  SIGNAL_PROCESSED: "business.signal.processed",
  SIGNAL_EXPIRED: "business.signal.expired",
} as const;

export const SECURITY_EVENTS = {
  THREAT_DETECTED: "security.threat.detected",
  THREAT_CONFIRMED: "security.threat.confirmed",
  THREAT_NEUTRALIZED: "security.threat.neutralized",
  THREAT_ESCALATED: "security.threat.escalated",

  INCIDENT_CREATED: "security.incident.created",
  INCIDENT_TRIAGED: "security.incident.triaged",
  INCIDENT_CONTAINED: "security.incident.contained",
  INCIDENT_ERADICATED: "security.incident.eradicated",
  INCIDENT_RECOVERED: "security.incident.recovered",
  INCIDENT_CLOSED: "security.incident.closed",

  VULNERABILITY_DISCOVERED: "security.vulnerability.discovered",
  VULNERABILITY_PATCHED: "security.vulnerability.patched",
  CVE_MATCHED: "security.cve.matched",

  IOC_DETECTED: "security.ioc.detected",
  IOC_BLOCKED: "security.ioc.blocked",
  MITRE_TACTIC_MAPPED: "security.mitre.tactic_mapped",

  ACCESS_UNAUTHORIZED: "security.access.unauthorized",
  PRIVILEGE_ESCALATION: "security.access.privilege_escalation",
  DATA_EXFILTRATION_DETECTED: "security.data.exfiltration_detected",

  CONTROL_TESTED: "security.control.tested",
  CONTROL_FAILED: "security.control.failed",
  CONTROL_REMEDIATED: "security.control.remediated",

  PLAYBOOK_TRIGGERED: "security.playbook.triggered",
  PLAYBOOK_COMPLETED: "security.playbook.completed",
  PLAYBOOK_FAILED: "security.playbook.failed",
} as const;

export const MARITIME_EVENTS = {
  VESSEL_POSITION_UPDATED: "maritime.vessel.position_updated",
  VESSEL_DARK_PERIOD_STARTED: "maritime.vessel.dark_period_started",
  VESSEL_DARK_PERIOD_ENDED: "maritime.vessel.dark_period_ended",
  VESSEL_SPEED_ANOMALY: "maritime.vessel.speed_anomaly",
  VESSEL_COURSE_DEVIATION: "maritime.vessel.course_deviation",

  VOYAGE_STARTED: "maritime.voyage.started",
  VOYAGE_COMPLETED: "maritime.voyage.completed",
  VOYAGE_DIVERTED: "maritime.voyage.diverted",
  VOYAGE_CANCELLED: "maritime.voyage.cancelled",
  VOYAGE_PROFIT_UPDATED: "maritime.voyage.profit_updated",

  PORT_ARRIVED: "maritime.port.arrived",
  PORT_DEPARTED: "maritime.port.departed",
  PORT_CALL_DELAYED: "maritime.port.call_delayed",

  SANCTIONS_MATCH_DETECTED: "maritime.sanctions.match_detected",
  SANCTIONS_CLEARED: "maritime.sanctions.cleared",
  SANCTIONS_BLOCKED: "maritime.sanctions.blocked",

  FLEET_HEALTH_UPDATED: "maritime.fleet.health_updated",
  CHARTER_RATE_UPDATED: "maritime.market.charter_rate_updated",
  TCE_THRESHOLD_BREACHED: "maritime.voyage.tce_threshold_breached",
} as const;

export const REAL_ESTATE_EVENTS = {
  PROPERTY_DISTRESS_DETECTED: "real_estate.property.distress_detected",
  PROPERTY_DISTRESS_SCORE_CHANGED: "real_estate.property.distress_score_changed",
  PROPERTY_OWNERSHIP_CHANGED: "real_estate.property.ownership_changed",
  PROPERTY_FILING_RECORDED: "real_estate.property.filing_recorded",

  DEAL_OPENED: "real_estate.deal.opened",
  DEAL_ADVANCED: "real_estate.deal.advanced",
  DEAL_CLOSED: "real_estate.deal.closed",
  DEAL_FELL_THROUGH: "real_estate.deal.fell_through",

  MARKET_SIGNAL_DETECTED: "real_estate.market.signal_detected",
  MARKET_INDEX_UPDATED: "real_estate.market.index_updated",

  PIPELINE_UPDATED: "real_estate.pipeline.updated",
  LEAD_QUALIFIED: "real_estate.lead.qualified",
} as const;

export const LEGAL_EVENTS = {
  MATTER_OPENED: "legal.matter.opened",
  MATTER_UPDATED: "legal.matter.updated",
  MATTER_DEADLINE_APPROACHING: "legal.matter.deadline_approaching",
  MATTER_DEADLINE_BREACHED: "legal.matter.deadline_breached",
  MATTER_CLOSED: "legal.matter.closed",

  DOCUMENT_FILED: "legal.document.filed",
  DOCUMENT_REVIEWED: "legal.document.reviewed",
  DOCUMENT_APPROVED: "legal.document.approved",

  BILLING_MILESTONE_REACHED: "legal.billing.milestone_reached",
  RETAINER_LOW: "legal.billing.retainer_low",
  INVOICE_ISSUED: "legal.billing.invoice_issued",
} as const;

export const AI_EVENTS = {
  RECOMMENDATION_GENERATED: "ai.recommendation.generated",
  RECOMMENDATION_ACCEPTED: "ai.recommendation.accepted",
  RECOMMENDATION_REJECTED: "ai.recommendation.rejected",
  RECOMMENDATION_EXPIRED: "ai.recommendation.expired",

  INFERENCE_STARTED: "ai.inference.started",
  INFERENCE_COMPLETED: "ai.inference.completed",
  INFERENCE_FAILED: "ai.inference.failed",
  INFERENCE_RATE_LIMITED: "ai.inference.rate_limited",

  MODEL_EVALUATED: "ai.model.evaluated",
  MODEL_CONFIDENCE_LOW: "ai.model.confidence_low",
  MODEL_DRIFT_DETECTED: "ai.model.drift_detected",

  AGENT_TASK_STARTED: "ai.agent.task_started",
  AGENT_TASK_COMPLETED: "ai.agent.task_completed",
  AGENT_TASK_FAILED: "ai.agent.task_failed",
  AGENT_ESCALATED_TO_HUMAN: "ai.agent.escalated_to_human",

  GOVERNANCE_VIOLATION: "ai.governance.violation",
  GOVERNANCE_OVERRIDE: "ai.governance.override",
  OUTPUT_TAGGED: "ai.output.tagged",
} as const;

export const WORKFLOW_EVENTS = {
  CREATED: "workflow.created",
  STARTED: "workflow.started",
  STEP_COMPLETED: "workflow.step.completed",
  STEP_FAILED: "workflow.step.failed",
  APPROVAL_REQUESTED: "workflow.approval.requested",
  APPROVAL_GRANTED: "workflow.approval.granted",
  APPROVAL_REJECTED: "workflow.approval.rejected",
  APPROVAL_EXPIRED: "workflow.approval.expired",
  APPROVAL_DELEGATED: "workflow.approval.delegated",
  COMPLETED: "workflow.completed",
  FAILED: "workflow.failed",
  CANCELLED: "workflow.cancelled",
  SLA_AT_RISK: "workflow.sla.at_risk",
  SLA_BREACHED: "workflow.sla.breached",
} as const;

export const PLATFORM_EVENTS = {
  TENANT_PROVISIONED: "platform.tenant.provisioned",
  TENANT_SUSPENDED: "platform.tenant.suspended",
  TENANT_OFFBOARDED: "platform.tenant.offboarded",

  FEATURE_FLAG_CHANGED: "platform.feature_flag.changed",
  CONFIG_CHANGED: "platform.config.changed",

  HEALTH_DEGRADED: "platform.health.degraded",
  HEALTH_RECOVERED: "platform.health.recovered",
  SERVICE_OUTAGE: "platform.service.outage",
  SERVICE_RECOVERED: "platform.service.recovered",

  DEPLOYMENT_STARTED: "platform.deployment.started",
  DEPLOYMENT_COMPLETED: "platform.deployment.completed",
  DEPLOYMENT_ROLLED_BACK: "platform.deployment.rolled_back",
} as const;

export const AUTH_EVENTS = {
  USER_SIGNED_IN: "auth.user.signed_in",
  USER_SIGNED_OUT: "auth.user.signed_out",
  USER_SESSION_EXPIRED: "auth.user.session_expired",
  USER_PASSWORD_RESET: "auth.user.password_reset",
  MFA_CHALLENGED: "auth.mfa.challenged",
  MFA_PASSED: "auth.mfa.passed",
  MFA_FAILED: "auth.mfa.failed",
  ACCESS_DENIED: "auth.access.denied",
  ROLE_CHANGED: "auth.role.changed",
  PERMISSION_ESCALATED: "auth.permission.escalated",
} as const;

export const BILLING_EVENTS = {
  SUBSCRIPTION_CREATED: "billing.subscription.created",
  SUBSCRIPTION_RENEWED: "billing.subscription.renewed",
  SUBSCRIPTION_CANCELLED: "billing.subscription.cancelled",
  SUBSCRIPTION_UPGRADED: "billing.subscription.upgraded",
  SUBSCRIPTION_DOWNGRADED: "billing.subscription.downgraded",
  PAYMENT_SUCCEEDED: "billing.payment.succeeded",
  PAYMENT_FAILED: "billing.payment.failed",
  INVOICE_CREATED: "billing.invoice.created",
  INVOICE_PAID: "billing.invoice.paid",
  TRIAL_STARTED: "billing.trial.started",
  TRIAL_EXPIRED: "billing.trial.expired",
} as const;

export const ATLAS_ALL_EVENTS = {
  ...BUSINESS_EVENTS,
  ...SECURITY_EVENTS,
  ...MARITIME_EVENTS,
  ...REAL_ESTATE_EVENTS,
  ...LEGAL_EVENTS,
  ...AI_EVENTS,
  ...WORKFLOW_EVENTS,
  ...PLATFORM_EVENTS,
  ...AUTH_EVENTS,
  ...BILLING_EVENTS,
} as const;

export type AtlasEventName = typeof ATLAS_ALL_EVENTS[keyof typeof ATLAS_ALL_EVENTS];

export function getEventDomain(eventName: string): AtlasEventDomain | "unknown" {
  const prefix = eventName.split(".")[0] as string;
  const domainMap: Record<string, AtlasEventDomain> = {
    business: "business",
    security: "security",
    maritime: "maritime",
    real_estate: "real_estate",
    legal: "legal",
    platform: "platform",
    ai: "ai",
    workflow: "workflow",
    billing: "billing",
    auth: "auth",
  };
  return domainMap[prefix] ?? "unknown";
}
