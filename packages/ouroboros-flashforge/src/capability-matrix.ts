/**
 * Primitive 61 — Capability matrix
 *
 * Inspired by FlashInfer's GPU support table (SM75 → SM12.0+) which
 * declares, for every (operation, architecture) pair, whether the
 * operation is admissible. We lift that idea: a capability matrix
 * declares (operation, target, admits, rationale) and refuses silent
 * fallback.
 */

export interface CapabilityCell {
  op: string;
  target: string;
  admits: boolean;
  rationale: string;
}

export interface CapabilityMatrix {
  cells: CapabilityCell[];
  ops: string[];
  targets: string[];
}

export interface CoverageReceipt {
  matrix: CapabilityMatrix;
  totalCells: number;
  admitted: number;
  refused: number;
  coverage: number; // admitted / totalCells in [0,1]
  unspecified: { op: string; target: string }[];
  rationale: string;
}

export function buildMatrix(cells: CapabilityCell[]): CapabilityMatrix {
  if (cells.length === 0) {
    throw new Error("capability matrix requires at least 1 cell");
  }
  const ops = Array.from(new Set(cells.map((c) => c.op))).sort();
  const targets = Array.from(new Set(cells.map((c) => c.target))).sort();
  // refuse duplicates with conflicting verdicts
  const seen = new Map<string, CapabilityCell>();
  for (const c of cells) {
    const key = `${c.op}::${c.target}`;
    const prior = seen.get(key);
    if (prior && prior.admits !== c.admits) {
      throw new Error(
        `conflicting cells for ${key}: ${prior.admits} vs ${c.admits}`
      );
    }
    seen.set(key, c);
  }
  return { cells: Array.from(seen.values()), ops, targets };
}

export function coverage(m: CapabilityMatrix): CoverageReceipt {
  const totalCells = m.ops.length * m.targets.length;
  const lookup = new Map(m.cells.map((c) => [`${c.op}::${c.target}`, c]));
  const unspecified: { op: string; target: string }[] = [];
  let admitted = 0;
  let refused = 0;
  for (const op of m.ops) {
    for (const t of m.targets) {
      const cell = lookup.get(`${op}::${t}`);
      if (!cell) {
        unspecified.push({ op, target: t });
      } else if (cell.admits) {
        admitted++;
      } else {
        refused++;
      }
    }
  }
  const cov = totalCells === 0 ? 0 : admitted / totalCells;
  return {
    matrix: m,
    totalCells,
    admitted,
    refused,
    coverage: cov,
    unspecified,
    rationale:
      unspecified.length === 0
        ? `matrix fully specified: ${admitted}/${totalCells} admit`
        : `matrix incomplete: ${unspecified.length} cells unspecified`,
  };
}

export function admits(m: CapabilityMatrix, op: string, target: string): boolean {
  const c = m.cells.find((x) => x.op === op && x.target === target);
  if (!c) {
    throw new Error(`no capability cell declared for ${op}::${target}`);
  }
  return c.admits;
}
