/**
 * Primitive 72 — Rule-based reward (anti-reward-hacking)
 *
 * Inspired by DeepSeek R1 ("rule-based accuracy rewards to avoid
 * potential reward hacking") and MiMo's "test difficulty driven code
 * reward". Architectural insight: learned reward models can be gamed;
 * rule-based verifiers cannot, because the rule is the truth. Lifted:
 * a reward function that operates only on declared rules, never on a
 * learned scalar, and produces a receipt naming exactly which rules
 * fired.
 */

export interface Rule<O> {
  id: string;
  weight: number; // > 0
  fires: (output: O) => boolean;
  rationale: string;
}

export interface RewardReceipt<O> {
  output: O;
  totalReward: number;
  fired: { ruleId: string; weight: number; rationale: string }[];
  silent: { ruleId: string; weight: number; rationale: string }[];
  rationale: string;
}

export function score<O>(output: O, rules: Rule<O>[]): RewardReceipt<O> {
  if (rules.length === 0) {
    throw new Error("rule-based reward requires at least 1 rule");
  }
  for (const r of rules) {
    if (!(r.weight > 0)) {
      throw new Error(`rule ${r.id} has non-positive weight`);
    }
  }
  const fired: RewardReceipt<O>["fired"] = [];
  const silent: RewardReceipt<O>["silent"] = [];
  let total = 0;
  for (const r of rules) {
    const e = { ruleId: r.id, weight: r.weight, rationale: r.rationale };
    if (r.fires(output)) {
      fired.push(e);
      total += r.weight;
    } else {
      silent.push(e);
    }
  }
  return {
    output,
    totalReward: total,
    fired,
    silent,
    rationale: `reward ${total.toFixed(4)} from ${fired.length}/${rules.length} rule(s)`,
  };
}

export interface DifficultyReward<O> {
  output: O;
  passed: { caseId: string; difficulty: number }[];
  failed: { caseId: string; difficulty: number }[];
  totalReward: number;
  rationale: string;
}

/**
 * Difficulty-weighted code reward — pass a hard test case earns more
 * than passing an easy one, mitigating sparse-reward in code RL
 * (per MiMo).
 */
export function difficultyWeighted<O>(
  output: O,
  cases: { caseId: string; difficulty: number; check: (o: O) => boolean }[]
): DifficultyReward<O> {
  if (cases.length === 0) throw new Error("at least 1 test case required");
  const passed: DifficultyReward<O>["passed"] = [];
  const failed: DifficultyReward<O>["failed"] = [];
  let total = 0;
  for (const c of cases) {
    if (!(c.difficulty >= 0 && c.difficulty <= 1)) {
      throw new Error(`case ${c.caseId} difficulty must be in [0,1]`);
    }
    if (c.check(output)) {
      passed.push({ caseId: c.caseId, difficulty: c.difficulty });
      total += c.difficulty;
    } else {
      failed.push({ caseId: c.caseId, difficulty: c.difficulty });
    }
  }
  return {
    output,
    passed,
    failed,
    totalReward: total,
    rationale: `${passed.length}/${cases.length} case(s) passed, total weighted reward ${total.toFixed(4)}`,
  };
}
