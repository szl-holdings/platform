/** Promotion gate thresholds and suite identifiers. */

export const STANDARD_SUITE_ID = 'standard-v1' as const;

export const DOMAIN_SUITE_IDS = [
  'vessels-domain-v1',
  'terra-domain-v1',
  'aegis-domain-v1',
  'sentra-domain-v1',
  'counsel-domain-v1',
] as const;

export type DomainSuiteId = (typeof DOMAIN_SUITE_IDS)[number];

export const ALL_SUITE_IDS = [STANDARD_SUITE_ID, ...DOMAIN_SUITE_IDS] as const;

/** A model must score at or above this pass-rate on the Standard Suite to be promoted. */
export const MIN_PASS_RATE_STANDARD = 0.75;

/** A model must score at or above this pass-rate on any applicable domain suite. */
export const MIN_PASS_RATE_DOMAIN = 0.70;

/** A category may not regress more than this delta vs the baseline before promotion is blocked. */
export const REGRESSION_THRESHOLD = 0.05;
