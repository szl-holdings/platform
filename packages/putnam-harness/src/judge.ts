// Putnam judge — re-implementation of the matharena rubric-judge using
// Anthropic Opus as the adjudicator. The judge is given the problem, the
// candidate proof, AND the rubric items (each with max points), and is
// required to return strict JSON scoring each item independently with a
// justification. Honesty rule: when the judge is uncertain it must mark
// the candidate as `incorrect` or `partial`, never `correct`.

import { complete, JUDGE_MODEL } from "./anthropic.js";
import type { PutnamProblem, PutnamRubricItem } from "./loader.js";

export interface JudgeScore {
  readonly partId: number;
  readonly title: string;
  readonly maxPoints: number;
  readonly awarded: number;
  readonly justification: string;
}

export interface JudgeResult {
  readonly model: string;
  readonly rubricItems: ReadonlyArray<JudgeScore>;
  readonly totalAwarded: number;
  readonly totalPossible: number;
  readonly verdict: "correct" | "partial" | "incorrect" | "abstained";
  readonly raw: string;
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly wallMs: number;
}

const SYSTEM = `You are a strict mathematical-proof judge for the Putnam Competition (proof-style).
Apply the supplied rubric independently to each item. Be conservative: if a step
is unjustified, the proof is incomplete — award strictly less than full credit.
If the candidate "proof" hand-waves, cites a non-elementary theorem, or contains
arithmetic errors, mark the relevant item 0. Return STRICT JSON only — no
prose, no markdown, no commentary outside the JSON object.`;

function buildPrompt(problem: PutnamProblem, candidateProof: string): string {
  const rubric = problem.grading_scheme.map(
    (r: PutnamRubricItem) => `  { "part_id": ${r.part_id}, "title": ${JSON.stringify(r.title)}, "max_points": ${r.points}, "description": ${JSON.stringify(r.description)} }`,
  ).join(",\n");
  return `PUTNAM 2025 — Problem ${problem.problem_idx}
=========================================

PROBLEM
-------
${problem.problem}

RUBRIC (max ${problem.points} pts total)
----------------------------------------
[
${rubric}
]

CANDIDATE PROOF
---------------
${candidateProof}

TASK
----
Score each rubric item independently. Reply with STRICT JSON of the shape:

{
  "items": [
    { "part_id": <int>, "awarded": <int 0..max_points>, "justification": "<one paragraph>" }
  ]
}

Do NOT include any text outside the JSON.`;
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Try direct parse first.
  try { return JSON.parse(trimmed); } catch {}
  // Strip ```json fences.
  const fenced = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(trimmed);
  if (fenced && fenced[1]) {
    try { return JSON.parse(fenced[1]); } catch {}
  }
  // First brace to last brace.
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try { return JSON.parse(trimmed.slice(first, last + 1)); } catch {}
  }
  throw new Error(`judge returned non-JSON: ${trimmed.slice(0, 200)}`);
}

export async function judge(problem: PutnamProblem, candidateProof: string): Promise<JudgeResult> {
  const completion = await complete({
    model: JUDGE_MODEL,
    system: SYSTEM,
    prompt: buildPrompt(problem, candidateProof),
    maxTokens: 2048,
  });
  let parsed: unknown;
  try {
    parsed = extractJson(completion.text);
  } catch (err) {
    // Honesty: failed parse → abstained, not a fabricated score.
    return {
      model: completion.model,
      rubricItems: problem.grading_scheme.map((r) => ({
        partId: r.part_id,
        title: r.title,
        maxPoints: r.points,
        awarded: 0,
        justification: `judge parse-failed: ${(err as Error).message}`,
      })),
      totalAwarded: 0,
      totalPossible: problem.points,
      verdict: "abstained",
      raw: completion.text,
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
      wallMs: completion.wallMs,
    };
  }
  const items = (parsed as { items?: ReadonlyArray<{ part_id: number; awarded: number; justification: string }> }).items ?? [];
  const scored: JudgeScore[] = problem.grading_scheme.map((r) => {
    const m = items.find((i) => i.part_id === r.part_id);
    const awarded = m ? Math.max(0, Math.min(r.points, Math.round(m.awarded))) : 0;
    return {
      partId: r.part_id,
      title: r.title,
      maxPoints: r.points,
      awarded,
      justification: m?.justification ?? "judge omitted this rubric item",
    };
  });
  const totalAwarded = scored.reduce((s, x) => s + x.awarded, 0);
  const totalPossible = problem.points;
  let verdict: JudgeResult["verdict"];
  if (totalAwarded === totalPossible) verdict = "correct";
  else if (totalAwarded > 0) verdict = "partial";
  else verdict = "incorrect";
  return {
    model: completion.model,
    rubricItems: scored,
    totalAwarded,
    totalPossible,
    verdict,
    raw: completion.text,
    tokensIn: completion.tokensIn,
    tokensOut: completion.tokensOut,
    wallMs: completion.wallMs,
  };
}
