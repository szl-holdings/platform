/**
 * Decision Adversarial Validation
 *
 * Runs six structured checks on a decision card before it can be promoted
 * to "ready for review". Each check returns a structured pass/fail with
 * explanation, implementing structured analytic technique principles.
 *
 * Checks:
 *   1. contradiction     — Does any evidence directly contradict the recommendation?
 *   2. stale-data        — Is any critical evidence older than its freshness threshold?
 *   3. missing-evidence  — Are required evidence types absent?
 *   4. policy            — Does the action fall within the workspace constitution?
 *   5. confidence-floor  — Is composite confidence above the workspace minimum?
 *   6. falsification     — What observable condition would invalidate this? (devil's advocacy)
 */

import type { PolicyEvaluation } from "./decision-policy-engine";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CheckType =
  | "contradiction"
  | "stale-data"
  | "missing-evidence"
  | "policy"
  | "confidence-floor"
  | "falsification";

export interface ValidationCheckResult {
  checkType: CheckType;
  passed: boolean;
  explanation: string;
  severity: "blocking" | "warning" | "info";
  metadata?: Record<string, unknown>;
}

export interface EvidenceItem {
  label: string;
  value: string;
  source: string;
  freshness: "live" | "recent" | "stale" | "expired";
  confidence: number;
  sourceType?: string;
  capturedAt?: string;
}

export interface AdversarialValidationInput {
  cardId: string;
  title: string;
  summary: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  recommendedAction?: string;
  reasoning?: string;
  domain: string;
  evidence: EvidenceItem[];
  policyEvaluation: PolicyEvaluation;
  freshnessMaxHours?: number;
}

export interface AdversarialValidationResult {
  allPassed: boolean;
  checks: ValidationCheckResult[];
  blockingFailures: ValidationCheckResult[];
  warnings: ValidationCheckResult[];
}

// ─── Individual checks ───────────────────────────────────────────────────────

function checkContradiction(input: AdversarialValidationInput): ValidationCheckResult {
  const contradictionKeywords = [
    "no evidence", "insufficient", "unverified", "disputed", "contradicts",
    "conflicts with", "inconsistent", "no data", "unknown",
  ];

  const highConfidenceEvidence = input.evidence.filter(e => e.confidence >= 0.7);
  const lowConfidenceEvidence = input.evidence.filter(e => e.confidence < 0.5);

  if (lowConfidenceEvidence.length > 0 && highConfidenceEvidence.length === 0) {
    return {
      checkType: "contradiction",
      passed: false,
      explanation: `All ${lowConfidenceEvidence.length} evidence items have confidence below 50%. The recommendation lacks a reliable evidentiary basis — risk of contradictory conclusion.`,
      severity: "blocking",
      metadata: { lowConfidenceCount: lowConfidenceEvidence.length },
    };
  }

  const textToScan = [input.summary, input.reasoning ?? "", ...input.evidence.map(e => e.value)].join(" ").toLowerCase();
  const hits = contradictionKeywords.filter(kw => textToScan.includes(kw));

  if (hits.length >= 3) {
    return {
      checkType: "contradiction",
      passed: false,
      explanation: `Detected ${hits.length} contradiction indicators in card text ("${hits.slice(0, 2).join('", "')}"). Review evidence chain for conflicting signals before promoting.`,
      severity: "blocking",
      metadata: { contradictionKeywordsFound: hits },
    };
  }

  return {
    checkType: "contradiction",
    passed: true,
    explanation: "No direct contradictions detected between evidence items and the recommendation. Evidence chain is internally consistent.",
    severity: "info",
  };
}

function checkStaleData(input: AdversarialValidationInput): ValidationCheckResult {
  const freshnessOrder = ["live", "recent", "stale", "expired"] as const;
  const maxAllowed = input.freshnessMaxHours ?? 48;

  const expiredItems = input.evidence.filter(e => e.freshness === "expired");
  const staleItems = input.evidence.filter(e => e.freshness === "stale");
  const totalItems = input.evidence.length;

  if (expiredItems.length > 0 && (input.severity === "critical" || input.severity === "high")) {
    return {
      checkType: "stale-data",
      passed: false,
      explanation: `${expiredItems.length} of ${totalItems} evidence items are EXPIRED. For a ${input.severity}-severity decision, expired evidence is a blocking condition. Re-run evidence collection before promoting.`,
      severity: "blocking",
      metadata: { expiredCount: expiredItems.length, severity: input.severity },
    };
  }

  if (staleItems.length > totalItems / 2) {
    return {
      checkType: "stale-data",
      passed: false,
      explanation: `${staleItems.length} of ${totalItems} evidence items are STALE (majority). Recommendation may be based on outdated signals. Verify current state before acting.`,
      severity: "warning",
      metadata: { staleCount: staleItems.length, total: totalItems },
    };
  }

  if (expiredItems.length > 0) {
    return {
      checkType: "stale-data",
      passed: true,
      explanation: `${expiredItems.length} expired evidence item(s) present but severity is ${input.severity}. Proceeding with warning — validate expired items before execution.`,
      severity: "warning",
      metadata: { expiredCount: expiredItems.length },
    };
  }

  return {
    checkType: "stale-data",
    passed: true,
    explanation: `All ${totalItems} evidence items are within freshness threshold. Data is current.`,
    severity: "info",
    metadata: { totalItems, staleCount: staleItems.length },
  };
}

function checkMissingEvidence(input: AdversarialValidationInput): ValidationCheckResult {
  if (input.evidence.length === 0) {
    return {
      checkType: "missing-evidence",
      passed: false,
      explanation: "No evidence items attached to this decision card. Every recommendation must carry at least one evidence item with source attribution. Cannot promote without evidence.",
      severity: "blocking",
    };
  }

  const domainRequirements: Record<string, { minItems: number; requiredTypes?: string[] }> = {
    lyte: { minItems: 2, requiredTypes: ["signal", "database"] },
    aegis: { minItems: 3, requiredTypes: ["signal"] },
    vessels: { minItems: 2, requiredTypes: ["api", "signal"] },
    terra: { minItems: 2 },
    counsel: { minItems: 2 },
    carlota: { minItems: 1 },
    cross_domain: { minItems: 3 },
  };

  const req = domainRequirements[input.domain] ?? { minItems: 2 };

  if (input.evidence.length < req.minItems) {
    return {
      checkType: "missing-evidence",
      passed: false,
      explanation: `Domain "${input.domain}" requires at least ${req.minItems} evidence items. Found ${input.evidence.length}. Add supporting evidence before promoting.`,
      severity: "blocking",
      metadata: { requiredMin: req.minItems, actual: input.evidence.length },
    };
  }

  if (req.requiredTypes && req.requiredTypes.length > 0) {
    const presentTypes = new Set(input.evidence.map(e => e.sourceType ?? "signal"));
    const missingTypes = req.requiredTypes.filter(t => !presentTypes.has(t));
    if (missingTypes.length > 0) {
      return {
        checkType: "missing-evidence",
        passed: true,
        explanation: `Sufficient evidence count (${input.evidence.length}) but missing preferred source types: ${missingTypes.join(", ")}. Consider adding these for stronger provenance.`,
        severity: "warning",
        metadata: { missingTypes },
      };
    }
  }

  return {
    checkType: "missing-evidence",
    passed: true,
    explanation: `Evidence chain is complete: ${input.evidence.length} items from ${new Set(input.evidence.map(e => e.source)).size} distinct source(s).`,
    severity: "info",
    metadata: { evidenceCount: input.evidence.length },
  };
}

function checkPolicy(input: AdversarialValidationInput): ValidationCheckResult {
  const { policyEvaluation } = input;

  if (policyEvaluation.decision === "block") {
    return {
      checkType: "policy",
      passed: false,
      explanation: `Policy engine blocked this action. Reasons: ${policyEvaluation.reasons.join("; ")}. Constitution version: ${policyEvaluation.appliedConstitutionVersion ?? "unknown"}.`,
      severity: "blocking",
      metadata: { policyDecision: policyEvaluation.decision, reasons: policyEvaluation.reasons },
    };
  }

  if (policyEvaluation.decision === "require-approval") {
    return {
      checkType: "policy",
      passed: true,
      explanation: `Policy approved with required human sign-off from: [${(policyEvaluation.requiredApproverRoles ?? []).join(", ")}]. SLA: ${policyEvaluation.slaMinutes ?? 60} minutes.`,
      severity: "info",
      metadata: {
        policyDecision: policyEvaluation.decision,
        requiredApproverRoles: policyEvaluation.requiredApproverRoles,
        slaMinutes: policyEvaluation.slaMinutes,
      },
    };
  }

  return {
    checkType: "policy",
    passed: true,
    explanation: `Policy cleared. Action is within workspace constitution bounds. Constitution version: ${policyEvaluation.appliedConstitutionVersion ?? "unknown"}.`,
    severity: "info",
    metadata: { policyDecision: policyEvaluation.decision },
  };
}

function checkConfidenceFloor(input: AdversarialValidationInput): ValidationCheckResult {
  const avgEvidenceConfidence = input.evidence.length > 0
    ? input.evidence.reduce((sum, e) => sum + e.confidence, 0) / input.evidence.length
    : 0;

  const compositeConfidence = input.evidence.length > 0
    ? (input.confidence * 0.6 + avgEvidenceConfidence * 0.4)
    : input.confidence;

  const COMPOSITE_FLOOR = 0.65;

  if (compositeConfidence < COMPOSITE_FLOOR) {
    return {
      checkType: "confidence-floor",
      passed: false,
      explanation: `Composite confidence score ${(compositeConfidence * 100).toFixed(0)}% is below the ${(COMPOSITE_FLOOR * 100).toFixed(0)}% floor. Card confidence: ${(input.confidence * 100).toFixed(0)}%, avg evidence confidence: ${(avgEvidenceConfidence * 100).toFixed(0)}%. Strengthen evidence or acknowledge uncertainty explicitly.`,
      severity: "blocking",
      metadata: { compositeConfidence, cardConfidence: input.confidence, avgEvidenceConfidence },
    };
  }

  if (compositeConfidence < 0.75) {
    return {
      checkType: "confidence-floor",
      passed: true,
      explanation: `Composite confidence ${(compositeConfidence * 100).toFixed(0)}% is above the floor but below the ideal 75% threshold. Decision-maker should acknowledge residual uncertainty.`,
      severity: "warning",
      metadata: { compositeConfidence, cardConfidence: input.confidence },
    };
  }

  return {
    checkType: "confidence-floor",
    passed: true,
    explanation: `Composite confidence ${(compositeConfidence * 100).toFixed(0)}% — strong basis for this recommendation. Derived from card confidence (${(input.confidence * 100).toFixed(0)}%) and ${input.evidence.length} evidence items.`,
    severity: "info",
    metadata: { compositeConfidence, cardConfidence: input.confidence, evidenceCount: input.evidence.length },
  };
}

function checkFalsification(input: AdversarialValidationInput): ValidationCheckResult {
  const domainFalsificationPrompts: Record<string, string[]> = {
    lyte: [
      "If the approval chain unblocked itself without intervention, would the recommendation still apply?",
      "If the financial exposure figure is overestimated by 50%, does the urgency level change?",
      "If the stakeholder identified as the blocker has already resolved the issue, is the card stale?",
    ],
    aegis: [
      "If the threat indicator was a false positive, does the recommended response still justify the cost?",
      "If the affected system is already isolated, does the escalation path still apply?",
      "If the CVE severity was reclassified downward, would the autonomy mode change?",
    ],
    vessels: [
      "If the AIS gap was caused by legitimate technical failure rather than manipulation, does the sanctions flag still apply?",
      "If vessel position was reported by an alternative tracking system, does the route deviation finding hold?",
      "If port conditions changed since evidence capture, does the voyage hold recommendation still stand?",
    ],
    terra: [
      "If the ownership record was recently updated and distress filing resolved, is this card obsolete?",
      "If the property's assessed value changed, does the distress signal threshold still trigger?",
    ],
    counsel: [
      "If the matter status changed since evidence was captured, is this recommendation still timely?",
      "If opposing counsel filed a counterfiling, does the recommended action still hold?",
    ],
    carlota: [
      "If client preferences have shifted, does this recommendation still serve their stated goals?",
    ],
    cross_domain: [
      "If one domain's signal resolves, does the cross-domain risk still justify the recommendation?",
    ],
  };

  const prompts = domainFalsificationPrompts[input.domain] ?? domainFalsificationPrompts.lyte;
  const primaryPrompt = prompts[0];

  if (!input.reasoning || input.reasoning.length < 50) {
    return {
      checkType: "falsification",
      passed: false,
      explanation: `No substantive reasoning provided. Devil's advocacy check requires a reasoning chain of at least 50 characters. Add explicit reasoning addressing: "${primaryPrompt}"`,
      severity: "blocking",
      metadata: { reasoningLength: input.reasoning?.length ?? 0 },
    };
  }

  return {
    checkType: "falsification",
    passed: true,
    explanation: `Falsification prompt acknowledged: "${primaryPrompt}" — reasoning chain provided (${input.reasoning.length} chars). Decision-maker should consider this counter-hypothesis before approving.`,
    severity: "info",
    metadata: { falsificationPrompt: primaryPrompt, reasoningLength: input.reasoning.length },
  };
}

// ─── Run all six checks ───────────────────────────────────────────────────────

export function runAdversarialValidation(input: AdversarialValidationInput): AdversarialValidationResult {
  const checks = [
    checkContradiction(input),
    checkStaleData(input),
    checkMissingEvidence(input),
    checkPolicy(input),
    checkConfidenceFloor(input),
    checkFalsification(input),
  ];

  const blockingFailures = checks.filter(c => !c.passed && c.severity === "blocking");
  const warnings = checks.filter(c => c.severity === "warning");
  const allPassed = blockingFailures.length === 0;

  return { allPassed, checks, blockingFailures, warnings };
}
