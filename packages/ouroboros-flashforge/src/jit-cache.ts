/**
 * Primitive 63 — JIT cache with provenance
 *
 * Inspired by FlashInfer's flashinfer-jit-cache: kernels compile on
 * first use, cached so the second use is free. We lift the idea to any
 * receipted compile: each cache entry must carry an artifactHash and a
 * compileReceipt so a downstream consumer can verify provenance, not
 * just performance.
 */

export interface JitArtifact {
  key: string;
  artifactHash: string; // hex digest of compiled output
  compiledAtMs: number;
  compileReceipt: string; // human-readable provenance
}

export interface JitCache {
  entries: Map<string, JitArtifact>;
  hits: number;
  misses: number;
}

export function makeCache(): JitCache {
  return { entries: new Map(), hits: 0, misses: 0 };
}

export interface CompileResult {
  cache: JitCache;
  artifact: JitArtifact;
  wasHit: boolean;
}

export function compileOrLoad(
  cache: JitCache,
  key: string,
  compile: () => { artifactHash: string; compileReceipt: string }
): CompileResult {
  const existing = cache.entries.get(key);
  if (existing) {
    cache.hits++;
    return { cache, artifact: existing, wasHit: true };
  }
  const built = compile();
  if (!built.artifactHash || built.artifactHash.length === 0) {
    throw new Error("compile() returned empty artifactHash; cache refuses");
  }
  const art: JitArtifact = {
    key,
    artifactHash: built.artifactHash,
    compiledAtMs: Date.now(),
    compileReceipt: built.compileReceipt,
  };
  cache.entries.set(key, art);
  cache.misses++;
  return { cache, artifact: art, wasHit: false };
}

export interface ProvenanceCheck {
  key: string;
  matches: boolean;
  recordedHash: string;
  observedHash: string;
  rationale: string;
}

export function verifyProvenance(
  cache: JitCache,
  key: string,
  observedHash: string
): ProvenanceCheck {
  const a = cache.entries.get(key);
  if (!a) {
    return {
      key,
      matches: false,
      recordedHash: "",
      observedHash,
      rationale: "no cache entry for key",
    };
  }
  const matches = a.artifactHash === observedHash;
  return {
    key,
    matches,
    recordedHash: a.artifactHash,
    observedHash,
    rationale: matches
      ? "artifact hash matches recorded compile"
      : "artifact hash does NOT match recorded compile — provenance broken",
  };
}
