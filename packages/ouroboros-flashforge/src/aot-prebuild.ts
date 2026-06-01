/**
 * Primitive 64 — AOT pre-build manifest
 *
 * Inspired by FlashInfer's flashinfer-cubin (pre-compiled kernel
 * binaries for all supported GPU architectures). The idea: declare
 * everything you intend to ship as pre-built, then verify that the
 * shipped artifacts cover exactly that declaration — no surprise JIT
 * fall-throughs in production.
 */

import type { CapabilityMatrix } from "./capability-matrix.js";
import type { JitCache } from "./jit-cache.js";

export interface PrebuildEntry {
  op: string;
  target: string;
  artifactHash: string;
}

export interface PrebuildManifest {
  entries: PrebuildEntry[];
  declaredAtMs: number;
}

export function declareManifest(entries: PrebuildEntry[]): PrebuildManifest {
  if (entries.length === 0) {
    throw new Error("AOT manifest requires at least 1 entry");
  }
  const seen = new Set<string>();
  for (const e of entries) {
    const k = `${e.op}::${e.target}`;
    if (seen.has(k)) throw new Error(`duplicate manifest entry: ${k}`);
    if (!e.artifactHash) throw new Error(`empty artifactHash for ${k}`);
    seen.add(k);
  }
  return { entries, declaredAtMs: Date.now() };
}

export interface CoverageVerdict {
  manifest: PrebuildManifest;
  capability: CapabilityMatrix;
  missing: { op: string; target: string }[];
  extra: { op: string; target: string }[];
  jitFallthroughs: { op: string; target: string }[]; // declared in capability, missing from manifest, NOT in cache
  ok: boolean;
  rationale: string;
}

export function verifyCoverage(
  manifest: PrebuildManifest,
  capability: CapabilityMatrix,
  cache?: JitCache
): CoverageVerdict {
  const required = capability.cells
    .filter((c) => c.admits)
    .map((c) => ({ op: c.op, target: c.target }));
  const have = new Set(manifest.entries.map((e) => `${e.op}::${e.target}`));
  const requiredKeys = new Set(required.map((r) => `${r.op}::${r.target}`));

  const missing = required.filter((r) => !have.has(`${r.op}::${r.target}`));
  const extra = manifest.entries
    .filter((e) => !requiredKeys.has(`${e.op}::${e.target}`))
    .map((e) => ({ op: e.op, target: e.target }));

  const jitFallthroughs = cache
    ? missing.filter((m) => !cache.entries.has(`${m.op}::${m.target}`))
    : missing;

  const ok = missing.length === 0 && extra.length === 0;
  return {
    manifest,
    capability,
    missing,
    extra,
    jitFallthroughs,
    ok,
    rationale: ok
      ? `AOT covers all ${required.length} admissible (op,target) pairs`
      : `AOT incomplete: ${missing.length} missing, ${extra.length} extra, ${jitFallthroughs.length} would JIT-fallthrough`,
  };
}
