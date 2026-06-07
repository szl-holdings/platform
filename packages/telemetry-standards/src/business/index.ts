export const BUSINESS_ATTRS = {
  EVENT_CLASS: 'business.event.class',
  EVENT_ID: 'business.event.id',
  SCHEMA_VERSION: 'business.event.schema_version',

  DOMAIN: 'business.domain',
  TENANT_ID: 'business.tenant.id',
  ORG_ID: 'business.org.id',

  ACTOR_ID: 'business.actor.id',
  ACTOR_TYPE: 'business.actor.type',
  ACTOR_NAME: 'business.actor.name',

  WORKFLOW_ID: 'business.workflow.id',
  CORRELATION_ID: 'business.correlation.id',

  TRANSACTION_ID: 'business.transaction.id',
  TRANSACTION_TYPE: 'business.transaction.type',
  TRANSACTION_OUTCOME: 'business.transaction.outcome',
  TRANSACTION_DURATION_MS: 'business.transaction.duration_ms',

  RISK_TYPE: 'business.risk.type',
  RISK_SCORE: 'business.risk.score',

  POLICY_ID: 'business.policy.id',
  POLICY_NAME: 'business.policy.name',
  POLICY_VIOLATION_TYPE: 'business.policy.violation_type',
  POLICY_AUTO_REMEDIATED: 'business.policy.auto_remediated',

  RECOMMENDATION_ID: 'business.recommendation.id',
  RECOMMENDATION_TYPE: 'business.recommendation.type',
  RECOMMENDATION_CONFIDENCE: 'business.recommendation.confidence',
  RECOMMENDATION_MODEL_ID: 'business.recommendation.model_id',

  ACTION_ID: 'business.action.id',
  ACTION_TYPE: 'business.action.type',
  ACTION_APPROVAL_LEVEL: 'business.action.approval_level',
  ACTION_EXECUTOR_ID: 'business.action.executor_id',
  ACTION_DURATION_MS: 'business.action.duration_ms',
  ACTION_RESULT_SUMMARY: 'business.action.result_summary',

  OUTCOME_ID: 'business.outcome.id',
  OUTCOME_TYPE: 'business.outcome.type',
  OUTCOME_CONFIDENCE: 'business.outcome.confidence',
  OUTCOME_PERIOD_DAYS: 'business.outcome.period_days',

  VALUE_AMOUNT: 'business.value.amount',
  VALUE_CURRENCY: 'business.value.currency',
  VALUE_TYPE: 'business.value.type',
  VALUE_DESCRIPTION: 'business.value.description',

  SLA_ID: 'business.sla.id',
  SLO_ID: 'business.slo.id',
  SLA_IMPACT: 'business.sla.impact',
  SLA_BREACH_THRESHOLD_MS: 'business.sla.breach_threshold_ms',
  SLA_ACTUAL_DURATION_MS: 'business.sla.actual_duration_ms',

  SEVERITY: 'business.severity',
  TAGS: 'business.tags',
} as const;

export type BusinessAttrKey = (typeof BUSINESS_ATTRS)[keyof typeof BUSINESS_ATTRS];

export const ATLAS_EVENT_CLASS = {
  TRANSACTION_STARTED: 'business.transaction.started',
  TRANSACTION_COMPLETED: 'business.transaction.completed',
  TRANSACTION_FAILED: 'business.transaction.failed',
  RISK_DETECTED: 'business.risk.detected',
  OPPORTUNITY_CREATED: 'business.opportunity.created',
  POLICY_VIOLATION: 'policy.violation.detected',
  RECOMMENDATION_GENERATED: 'recommendation.generated',
  ACTION_APPROVED: 'action.approved',
  ACTION_EXECUTED: 'action.executed',
  ACTION_FAILED: 'action.failed',
  OUTCOME_REALIZED: 'outcome.realized',
} as const;

export type ATLASEventClassValue = (typeof ATLAS_EVENT_CLASS)[keyof typeof ATLAS_EVENT_CLASS];
