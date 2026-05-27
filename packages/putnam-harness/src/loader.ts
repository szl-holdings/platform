// Loader for the MathArena Putnam-2025 dataset (pre-snapshotted into
// data/putnam_2025.json by tools/fetch-dataset.sh — see README).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export interface PutnamRubricItem {
  readonly description: string;
  readonly part_id: number;
  readonly points: number;
  readonly title: string;
}

export interface PutnamProblem {
  readonly problem_idx: number;
  readonly points: number;
  readonly problem: string;
  readonly grading_scheme: ReadonlyArray<PutnamRubricItem>;
}

let cache: ReadonlyArray<PutnamProblem> | null = null;

export function loadPutnam2025(): ReadonlyArray<PutnamProblem> {
  if (cache) return cache;
  const here = dirname(fileURLToPath(import.meta.url));
  const path = join(here, "..", "data", "putnam_2025.json");
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as ReadonlyArray<PutnamProblem>;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("putnam-harness: loader received empty dataset");
  }
  for (const p of parsed) {
    if (typeof p.problem_idx !== "number") throw new Error("missing problem_idx");
    if (typeof p.problem !== "string" || p.problem.length === 0) throw new Error(`problem ${p.problem_idx} empty`);
    if (!Array.isArray(p.grading_scheme) || p.grading_scheme.length === 0) {
      throw new Error(`problem ${p.problem_idx} missing grading_scheme`);
    }
  }
  cache = parsed;
  return parsed;
}

export function getProblem(idx: number): PutnamProblem {
  const p = loadPutnam2025().find((q) => q.problem_idx === idx);
  if (!p) throw new Error(`putnam-harness: problem ${idx} not found`);
  return p;
}
