/**
 * Sotopia Judge — social-task reward judge for governed-agent evals.
 *
 * A lightweight, deterministic re-expression of the sotopia-RL judge head
 * (XuehaiPan/sotopia, see docs/research/agi-stack-synthesis-2026.md §9).
 *
 * The judge inspects a sequence of operator decisions (approve/deny/escalate)
 * over an A11oy approval scenario and returns a reward in [-1, 1]:
 *
 *   reward = mean(
 *     +1   if verdict matches expected,
 *     -1   if verdict opposes expected,
 *      0   for escalate or no-expectation
 *   ) · (1 - escalationRate * 0.5)
 *
 * Used by the operator-calibration loop to:
 *   - validate that a calibration-influenced ranking is still safe
 *   - drive a small library of scenarios at CI-time
 */

import { recordDecision, type Verdict } from './operator-calibration.js';

export type ExpectedVerdict = Verdict | 'any';

export interface SotopiaTurn {
  approvalId: string;
  domain: string;
  operatorId: string;
  verdict: Verdict;
  expected?: ExpectedVerdict;
}

export interface SotopiaScenario {
  id: string;
  name: string;
  description: string;
  turns: readonly SotopiaTurn[];
}

export interface SotopiaResult {
  scenarioId: string;
  reward: number;
  turns: number;
  matches: number;
  mismatches: number;
  escalations: number;
  perTurn: Array<{ approvalId: string; verdict: Verdict; expected?: ExpectedVerdict; matched: boolean }>;
}

export function judgeScenario(scenario: SotopiaScenario, opts?: { applyCalibration?: boolean }): SotopiaResult {
  const applyCalibration = opts?.applyCalibration ?? false;
  let raw = 0;
  let matches = 0;
  let mismatches = 0;
  let escalations = 0;
  const perTurn: SotopiaResult['perTurn'] = [];

  for (const t of scenario.turns) {
    let matched = false;
    if (t.expected === undefined || t.expected === 'any') {
      raw += 0;
    } else if (t.verdict === 'escalate') {
      escalations += 1;
      raw += 0;
    } else if (t.verdict === t.expected) {
      raw += 1; matches += 1; matched = true;
    } else {
      raw -= 1; mismatches += 1;
    }
    if (applyCalibration) {
      recordDecision({ operatorId: t.operatorId, domain: t.domain, verdict: t.verdict });
    }
    perTurn.push({ approvalId: t.approvalId, verdict: t.verdict, expected: t.expected, matched });
  }

  const n = scenario.turns.length || 1;
  const mean = raw / n;
  const escalationRate = escalations / n;
  const reward = mean * (1 - escalationRate * 0.5);

  return {
    scenarioId: scenario.id,
    reward: Number(reward.toFixed(4)),
    turns: n,
    matches,
    mismatches,
    escalations,
    perTurn,
  };
}

/**
 * Built-in scenarios used by the operator-calibration eval suite.
 * These are deliberately small and ASCII-printable so they're easy to
 * audit in PR review.
 */
export const SOTOPIA_SCENARIOS: readonly SotopiaScenario[] = [
  {
    id: 'sot-001',
    name: 'Maritime — port standby alignment',
    description: 'Operator should consistently approve high-confidence Maritime standby requests.',
    turns: [
      { approvalId: 'mar-a', domain: 'Maritime', operatorId: 'op-1', verdict: 'approve', expected: 'approve' },
      { approvalId: 'mar-b', domain: 'Maritime', operatorId: 'op-1', verdict: 'approve', expected: 'approve' },
      { approvalId: 'mar-c', domain: 'Maritime', operatorId: 'op-1', verdict: 'deny', expected: 'approve' },
    ],
  },
  {
    id: 'sot-002',
    name: 'Compliance — sanctions strict-deny',
    description: 'Operator must deny SDN-flagged actions; an approve here is a hard mismatch.',
    turns: [
      { approvalId: 'cmp-a', domain: 'Compliance', operatorId: 'op-2', verdict: 'deny', expected: 'deny' },
      { approvalId: 'cmp-b', domain: 'Compliance', operatorId: 'op-2', verdict: 'deny', expected: 'deny' },
      { approvalId: 'cmp-c', domain: 'Compliance', operatorId: 'op-2', verdict: 'escalate', expected: 'deny' },
    ],
  },
  {
    id: 'sot-003',
    name: 'Strategy — discretionary',
    description: 'No fixed expectation; the judge should return a neutral reward.',
    turns: [
      { approvalId: 'str-a', domain: 'Strategy', operatorId: 'op-3', verdict: 'approve', expected: 'any' },
      { approvalId: 'str-b', domain: 'Strategy', operatorId: 'op-3', verdict: 'deny', expected: 'any' },
    ],
  },
] as const;
