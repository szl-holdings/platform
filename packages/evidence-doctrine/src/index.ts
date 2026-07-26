// SPDX-License-Identifier: Apache-2.0

export const EVIDENCE_STATES = ['VERIFIED', 'UNVERIFIED', 'ABSENT'] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const DSLSA_LEVELS = ['D0', 'D1', 'D2', 'D3', 'D4'] as const;
export type DSeLevel = (typeof DSLSA_LEVELS)[number];

export const LEVEL_REQUIREMENTS = {
  D1: ['inputs_recorded', 'policy_recorded', 'output_recorded'],
  D2: ['signature_verified', 'tamper_evidence_verified'],
  D3: [
    'third_party_transparency_log_verified',
    'byte_identical_replay_verified',
    'offline_verification_verified',
  ],
  D4: [
    'hardware_attested_execution_verified',
    'formally_specified_policy_verified',
    'machine_checked_denial_verified',
  ],
} as const;

export type Requirement = (typeof LEVEL_REQUIREMENTS)[keyof typeof LEVEL_REQUIREMENTS][number];
export type DecisionEvidence = Partial<Record<Requirement, EvidenceState>>;

export interface GradeResult {
  achieved_level: DSeLevel;
  evaluation_state: 'EVALUATED_FROM_SUPPLIED_EVIDENCE';
  satisfied_requirements: Requirement[];
  blocking_requirements: Requirement[];
  unverified_requirements: Requirement[];
  absent_requirements: Requirement[];
  note: string;
}

function validateEvidenceState(requirement: Requirement, state: unknown): EvidenceState {
  if (!EVIDENCE_STATES.includes(state as EvidenceState)) {
    throw new TypeError(
      `${requirement} must be VERIFIED, UNVERIFIED, or ABSENT; received ${String(state)}`,
    );
  }
  return state as EvidenceState;
}

/**
 * Return the highest consecutively satisfied D-SLSA level.
 *
 * Every requirement at a level must be VERIFIED. UNVERIFIED and ABSENT both
 * block advancement; later-level evidence cannot skip an earlier level.
 */
export function gradeDecision(evidence: DecisionEvidence): GradeResult {
  const states = new Map<Requirement, EvidenceState>();
  for (const requirements of Object.values(LEVEL_REQUIREMENTS)) {
    for (const requirement of requirements) {
      const supplied = evidence[requirement] ?? 'ABSENT';
      states.set(requirement, validateEvidenceState(requirement, supplied));
    }
  }

  let achievedLevel: DSeLevel = 'D0';
  const blockingRequirements: Requirement[] = [];

  for (const level of ['D1', 'D2', 'D3', 'D4'] as const) {
    const requirements = LEVEL_REQUIREMENTS[level];
    const blocked = requirements.filter((requirement) => states.get(requirement) !== 'VERIFIED');
    if (blocked.length > 0) {
      blockingRequirements.push(...blocked);
      break;
    }
    achievedLevel = level;
  }

  const satisfiedRequirements: Requirement[] = [];
  const unverifiedRequirements: Requirement[] = [];
  const absentRequirements: Requirement[] = [];
  for (const [requirement, state] of states) {
    if (state === 'VERIFIED') satisfiedRequirements.push(requirement);
    if (state === 'UNVERIFIED') unverifiedRequirements.push(requirement);
    if (state === 'ABSENT') absentRequirements.push(requirement);
  }

  return {
    achieved_level: achievedLevel,
    evaluation_state: 'EVALUATED_FROM_SUPPLIED_EVIDENCE',
    satisfied_requirements: satisfiedRequirements,
    blocking_requirements: blockingRequirements,
    unverified_requirements: unverifiedRequirements,
    absent_requirements: absentRequirements,
    note: 'This result grades only the supplied evidence states. It is not a certification, publication, or independent audit.',
  };
}

export interface LambdaCaseStudy {
  claim: 'CONJECTURE_1';
  state: 'OPEN';
  display: 'GRAY';
  machine_checked: false;
}

const LAMBDA_CASE_STUDY: LambdaCaseStudy = {
  claim: 'CONJECTURE_1',
  state: 'OPEN',
  display: 'GRAY',
  machine_checked: false,
};

/**
 * Guard the doctrine-bearing Lambda case study against an accidental green or
 * closed representation.
 */
export function assertLambdaCaseStudy(value: unknown): LambdaCaseStudy {
  if (
    typeof value !== 'object' ||
    value === null ||
    Object.keys(value).sort().join(',') !== Object.keys(LAMBDA_CASE_STUDY).sort().join(',') ||
    !Object.entries(LAMBDA_CASE_STUDY).every(
      ([key, expected]) => (value as Record<string, unknown>)[key] === expected,
    )
  ) {
    throw new Error(
      'Lambda uniqueness must remain CONJECTURE_1, OPEN, GRAY, and not machine-checked',
    );
  }
  return { ...LAMBDA_CASE_STUDY };
}

export interface TheoremUPremises {
  premise_u1: EvidenceState;
  premise_u2: EvidenceState;
  premise_u3: EvidenceState;
}

const THEOREM_U_PREMISES = ['premise_u1', 'premise_u2', 'premise_u3'] as const;

export function evaluateTheoremU(
  premises: unknown,
): 'CONDITIONALLY_SATISFIED' | 'CONDITIONAL_OPEN' {
  if (
    typeof premises !== 'object' ||
    premises === null ||
    Object.keys(premises).sort().join(',') !== [...THEOREM_U_PREMISES].sort().join(',')
  ) {
    return 'CONDITIONAL_OPEN';
  }
  const supplied = premises as Record<string, unknown>;
  const states = THEOREM_U_PREMISES.map((name) =>
    validateEvidenceState(name as Requirement, supplied[name]),
  );
  return states.every((state) => state === 'VERIFIED')
    ? 'CONDITIONALLY_SATISFIED'
    : 'CONDITIONAL_OPEN';
}
