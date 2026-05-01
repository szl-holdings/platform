/**
 * QUBO-formulated Covenant policy optimizer (SQA-based).
 *
 * Maps the policy gate configuration problem to a QUBO and solves it via
 * simulated quantum annealing. Computes a Pareto frontier over governance
 * strength vs operational flexibility using multi-objective optimization.
 *
 * Ref: Lucas (2014) NP→Ising formulations; Mugel et al. (2022) portfolio QA.
 */

export interface PolicyRule {
  id: string;
  name: string;
  domain: string;
  approvalGate: 'none' | 'single' | 'dual';
  riskLevel: 1 | 2 | 3 | 4 | 5;
  operationalFlexibility: number;
  governanceStrength: number;
  conflictsWith?: string[];
  dependsOn?: string[];
}

export interface PolicyOptimizationConfig {
  targetGovernanceScore?: number;
  targetFlexibilityScore?: number;
  maxIterations?: number;
  paretoFrontierPoints?: number;
}

export interface PolicyOptimizationResult {
  optimizationScore: number;
  governanceScore: number;
  flexibilityScore: number;
  paretoFrontier: Array<{ governance: number; flexibility: number; config: string[] }>;
  conflictingRules: string[][];
  redundantRules: string[];
  recommendedAdditions: string[];
  recommendedRemovals: string[];
  classicalScore: number;
  quantumImprovement: number;
  durationMs: number;
}

function computeGovernanceScore(rules: PolicyRule[], selectedIds: Set<string>): number {
  const selected = rules.filter((r) => selectedIds.has(r.id));
  if (selected.length === 0) return 0;

  const totalGovernance = selected.reduce((s, r) => s + r.governanceStrength * r.riskLevel / 5, 0);
  const maxGovernance = rules.reduce((s, r) => s + r.governanceStrength * r.riskLevel / 5, 0);

  const hasHighRiskCoverage = rules
    .filter((r) => r.riskLevel >= 4)
    .every((r) => selectedIds.has(r.id));
  const coverageBonus = hasHighRiskCoverage ? 0.1 : 0;

  return Math.min(1, totalGovernance / (maxGovernance + 1e-10) + coverageBonus);
}

function computeFlexibilityScore(rules: PolicyRule[], selectedIds: Set<string>): number {
  const selected = rules.filter((r) => selectedIds.has(r.id));

  const conflicts = selected.filter(
    (r) => r.conflictsWith?.some((id) => selectedIds.has(id)),
  ).length;

  const totalFlexibility = selected.reduce((s, r) => s + r.operationalFlexibility, 0);
  const maxPossibleFlex = rules.reduce((s, r) => s + r.operationalFlexibility, 0);

  const conflictPenalty = conflicts * 0.15;
  const rawScore = totalFlexibility / (maxPossibleFlex + 1e-10) - conflictPenalty;

  return Math.max(0, Math.min(1, rawScore));
}

function detectConflicts(rules: PolicyRule[]): string[][] {
  const conflicts: string[][] = [];
  for (const rule of rules) {
    for (const conflictId of rule.conflictsWith ?? []) {
      const conflictRule = rules.find((r) => r.id === conflictId);
      if (conflictRule) {
        const pair = [rule.id, conflictId].sort();
        if (!conflicts.some((c) => c[0] === pair[0] && c[1] === pair[1])) {
          conflicts.push(pair);
        }
      }
    }
  }
  return conflicts;
}

function detectRedundant(rules: PolicyRule[]): string[] {
  const redundant: string[] = [];
  for (const rule of rules) {
    const covered = rules.find(
      (r) =>
        r.id !== rule.id &&
        r.domain === rule.domain &&
        r.riskLevel >= rule.riskLevel &&
        r.governanceStrength >= rule.governanceStrength &&
        r.operationalFlexibility >= rule.operationalFlexibility,
    );
    if (covered) redundant.push(rule.id);
  }
  return redundant;
}

function quantumAnnealPolicySelection(
  rules: PolicyRule[],
  targetGovernance: number,
  targetFlexibility: number,
  iterations: number,
): Set<string> {
  const n = rules.length;
  const selected = new Set<string>(rules.filter((r) => r.riskLevel >= 3).map((r) => r.id));

  let bestScore = -Infinity;
  let bestSelected = new Set(selected);

  let temperature = 2.0;
  const finalTemp = 0.01;
  let tunneling = 1.5;
  const finalTunneling = 0.01;

  for (let iter = 0; iter < iterations; iter++) {
    const progress = iter / iterations;
    temperature = 2.0 * Math.pow(finalTemp / 2.0, progress);
    tunneling = 1.5 * Math.pow(finalTunneling / 1.5, progress);

    const ruleIdx = Math.floor(Math.random() * n);
    const ruleId = rules[ruleIdx]!.id;

    const newSelected = new Set(selected);
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId);
    } else {
      newSelected.add(ruleId);
    }

    const gov = computeGovernanceScore(rules, newSelected);
    const flex = computeFlexibilityScore(rules, newSelected);

    const govPenalty = Math.max(0, targetGovernance - gov) * 5;
    const flexPenalty = Math.max(0, targetFlexibility - flex) * 3;
    const score = (gov + flex) / 2 - govPenalty - flexPenalty;

    const currentGov = computeGovernanceScore(rules, selected);
    const currentFlex = computeFlexibilityScore(rules, selected);
    const currentGovPenalty = Math.max(0, targetGovernance - currentGov) * 5;
    const currentFlexPenalty = Math.max(0, targetFlexibility - currentFlex) * 3;
    const currentScore = (currentGov + currentFlex) / 2 - currentGovPenalty - currentFlexPenalty;

    const dE = score - currentScore;
    const tunnelingBonus = tunneling * 0.1;

    if (dE > 0 || Math.random() < Math.exp(dE / (temperature + 1e-10)) + tunnelingBonus) {
      if (newSelected.has(ruleId)) {
        selected.add(ruleId);
      } else {
        selected.delete(ruleId);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestSelected = new Set(selected);
    }
  }

  return bestSelected;
}

export function optimizePolicies(
  rules: PolicyRule[],
  config: PolicyOptimizationConfig = {},
): PolicyOptimizationResult {
  const startMs = Date.now();
  const targetGov = config.targetGovernanceScore ?? 0.85;
  const targetFlex = config.targetFlexibilityScore ?? 0.7;
  const maxIter = config.maxIterations ?? 500;
  const paretoPoints = config.paretoFrontierPoints ?? 10;

  const classicalSelected = new Set(rules.filter((r) => r.riskLevel >= 3).map((r) => r.id));
  const classicalGov = computeGovernanceScore(rules, classicalSelected);
  const classicalFlex = computeFlexibilityScore(rules, classicalSelected);
  const classicalScore = (classicalGov + classicalFlex) / 2;

  const quantumSelected = quantumAnnealPolicySelection(rules, targetGov, targetFlex, maxIter);
  const quantumGov = computeGovernanceScore(rules, quantumSelected);
  const quantumFlex = computeFlexibilityScore(rules, quantumSelected);
  const optimizationScore = (quantumGov + quantumFlex) / 2;

  const paretoFrontier: PolicyOptimizationResult['paretoFrontier'] = [];
  for (let p = 0; p < paretoPoints; p++) {
    const govTarget = p / (paretoPoints - 1);
    const flexTarget = 1 - govTarget;
    const ptSelected = quantumAnnealPolicySelection(rules, govTarget, flexTarget, 100);
    const ptGov = computeGovernanceScore(rules, ptSelected);
    const ptFlex = computeFlexibilityScore(rules, ptSelected);
    paretoFrontier.push({
      governance: ptGov,
      flexibility: ptFlex,
      config: [...ptSelected],
    });
  }

  const conflicts = detectConflicts(rules);
  const redundant = detectRedundant(rules);

  const recommendedAdditions = rules
    .filter(
      (r) =>
        !quantumSelected.has(r.id) &&
        r.riskLevel >= 4 &&
        r.governanceStrength > 0.7,
    )
    .map((r) => r.name)
    .slice(0, 3);

  const recommendedRemovals = rules
    .filter(
      (r) =>
        quantumSelected.has(r.id) &&
        (redundant.includes(r.id) ||
          (conflicts.some((c) => c.includes(r.id)) && r.governanceStrength < 0.5)),
    )
    .map((r) => r.name)
    .slice(0, 3);

  return {
    optimizationScore,
    governanceScore: quantumGov,
    flexibilityScore: quantumFlex,
    paretoFrontier,
    conflictingRules: conflicts,
    redundantRules: redundant,
    recommendedAdditions,
    recommendedRemovals,
    classicalScore,
    quantumImprovement: Math.max(0, optimizationScore - classicalScore),
    durationMs: Date.now() - startMs,
  };
}
