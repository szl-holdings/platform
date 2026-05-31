/**
 * slsa/ — T15 SLSA L1 honest attestation builders.
 *
 * Backing (REAL): mirrors verify_slsa_chain.py / szl/slsa_dsse_substrate.py.
 * SLSA Level 1 = source + build provenance documented (honest). L2/L3 require
 * Sigstore + isolated builders (roadmap — NOT claimed here). No fake-green:
 * this builds an HONEST L1 provenance statement, label says L1, not L3.
 */

import { hashJson } from "../tamper/index.ts";

export interface SlsaProvenance {
  readonly _type: "https://in-toto.io/Statement/v1";
  readonly predicateType: "https://slsa.dev/provenance/v1";
  readonly subject: ReadonlyArray<{ name: string; digest: { sha256: string } }>;
  readonly predicate: {
    readonly buildType: string;
    readonly builder: { id: string };
    readonly slsaLevel: 1;
    readonly honest: true;
    readonly invocation: { configSource: { uri: string; digest?: { sha1?: string } } };
  };
}

/**
 * buildProvenance — assemble an SLSA L1 in-toto provenance statement. The
 * subject digest is a real SHA-256 over the artifact descriptor. slsaLevel is
 * pinned to 1 with honest:true — we do NOT assert L2/L3.
 */
export function buildProvenance(opts: {
  artifactName: string;
  artifactContent: unknown;
  buildType: string;
  builderId: string;
  sourceUri: string;
  sourceSha1?: string;
}): SlsaProvenance {
  return {
    _type: "https://in-toto.io/Statement/v1",
    predicateType: "https://slsa.dev/provenance/v1",
    subject: [{ name: opts.artifactName, digest: { sha256: hashJson(opts.artifactContent) } }],
    predicate: {
      buildType: opts.buildType,
      builder: { id: opts.builderId },
      slsaLevel: 1,
      honest: true,
      invocation: { configSource: { uri: opts.sourceUri, digest: opts.sourceSha1 ? { sha1: opts.sourceSha1 } : undefined } },
    },
  };
}

/** Verify a provenance statement's subject digest matches the artifact. */
export function verifyProvenance(prov: SlsaProvenance, artifactContent: unknown): boolean {
  return prov.subject.some((s) => s.digest.sha256 === hashJson(artifactContent));
}
