import {
  ACTION_SEVERITY,
  type CheckOutcome,
  type CheckResult,
  type DecisionAction,
} from "./types.js";

interface AggregatedTotals {
  passCount: number;
  warningCount: number;
  failCount: number;
  blockerCount: number;
}

function tally(checks: CheckResult[]): AggregatedTotals {
  const t: AggregatedTotals = { passCount: 0, warningCount: 0, failCount: 0, blockerCount: 0 };
  for (const c of checks) {
    if (c.outcome === "pass") t.passCount += 1;
    else if (c.outcome === "warn") t.warningCount += 1;
    else if (c.outcome === "fail") t.failCount += 1;
    else if (c.outcome === "blocked") t.blockerCount += 1;
  }
  return t;
}

/** Pick the most severe action that any individual check recommended. */
function pickAction(checks: CheckResult[], totals: AggregatedTotals): DecisionAction {
  if (totals.blockerCount > 0) return "block";

  let highest: DecisionAction = "approve";
  for (const c of checks) {
    if (!c.recommendedAction) continue;
    if (ACTION_SEVERITY[c.recommendedAction] > ACTION_SEVERITY[highest]) {
      highest = c.recommendedAction;
    }
  }
  // If no check explicitly recommended, but we have failures, default to revise.
  if (highest === "approve" && totals.failCount > 0) return "revise";
  // Pure-warn results without a recommendation → escalate one notch.
  if (highest === "approve" && totals.warningCount > 0) return "escalate";
  return highest;
}

function pickOutcome(totals: AggregatedTotals): CheckOutcome {
  if (totals.blockerCount > 0) return "blocked";
  if (totals.failCount > 0) return "fail";
  if (totals.warningCount > 0) return "warn";
  return "pass";
}

function buildReasoning(
  action: DecisionAction,
  outcome: CheckOutcome,
  totals: AggregatedTotals,
  evaluatedCount: number,
): string {
  const parts: string[] = [
    `Evaluated ${evaluatedCount} check(s): ${totals.passCount} pass, ${totals.warningCount} warn, ${totals.failCount} fail, ${totals.blockerCount} blocked.`,
  ];
  switch (action) {
    case "approve":
      parts.push("Output is approved for commit.");
      break;
    case "revise":
      parts.push("Output requires revision before commit.");
      break;
    case "request_more_evidence":
      parts.push("Output needs additional evidence/citations before commit.");
      break;
    case "escalate":
      parts.push("Output requires escalation per policy/calibration signals.");
      break;
    case "route_to_human_review":
      parts.push("Output must be reviewed by a human before commit.");
      break;
    case "block":
      parts.push(`Output is BLOCKED (outcome=${outcome}).`);
      break;
  }
  return parts.join(" ");
}

export interface AggregatedDecision {
  action: DecisionAction;
  outcome: CheckOutcome;
  overallScore: number;
  reasoning: string;
  totals: AggregatedTotals;
}

export function aggregateDecision(checks: CheckResult[]): AggregatedDecision {
  const totals = tally(checks);
  const action = pickAction(checks, totals);
  const outcome = pickOutcome(totals);
  const overallScore =
    checks.length === 0 ? 1 : checks.reduce((s, c) => s + c.score, 0) / checks.length;
  const reasoning = buildReasoning(action, outcome, totals, checks.length);
  return { action, outcome, overallScore, reasoning, totals };
}
