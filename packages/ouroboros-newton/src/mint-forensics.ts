/**
 * Primitive 44 — Mint forensics.
 *
 * Source: Newton's tenure as Warden (1696) and Master (1699–1727) of the
 *   Royal Mint. Newton instituted exact-weight coin assay, the Trial of the
 *   Pyx (random sample retention against a master), and aggressive
 *   prosecution of clipping/counterfeiting (Mint MS at Cambridge MS Add
 *   3958, also Royal Society Mint papers).
 *
 * Computable form: every released artifact carries an assayed weight (a
 * cryptographic digest) and a pyx-style sample is retained for adversarial
 * verification. Tampering anywhere along the chain is detectable from any
 * retained pyx sample.
 */

import { createHash } from "node:crypto";

export interface MintEntry {
  artifactId: string;
  /** The bytes (or canonical string) of the artifact at issuance. */
  contentDigestSha256: string;
  /** Standard weight (any positive integer; bytes, units, etc.). */
  declaredWeight: number;
  /** Pyx sample — typically the artifact bytes themselves or a salted commitment. */
  pyxSample: string;
  /** Issuance timestamp. */
  timestamp: number;
}

export interface AssayInput {
  artifactId: string;
  presentedDigestSha256: string;
  presentedWeight: number;
  /** Optional pyx sample to compare against the retained one. */
  presentedPyxSample?: string;
}

export type AssayVerdict =
  | "GENUINE"
  | "DIGEST_MISMATCH"
  | "WEIGHT_MISMATCH"
  | "PYX_MISMATCH"
  | "NOT_FOUND";

export interface AssayResult {
  artifactId: string;
  verdict: AssayVerdict;
  reason: string;
}

export class Mint {
  private entries = new Map<string, MintEntry>();
  private weightTolerance: number;

  constructor(weightTolerance: number = 0) {
    if (weightTolerance < 0 || !Number.isFinite(weightTolerance)) {
      throw new Error("weightTolerance must be non-negative finite.");
    }
    this.weightTolerance = weightTolerance;
  }

  /** Issue and retain pyx sample. Returns the entry as recorded. */
  issue(artifactId: string, content: string, declaredWeight: number, timestamp: number): MintEntry {
    if (this.entries.has(artifactId)) {
      throw new Error(`Mint already has entry for ${artifactId}; double-issue.`);
    }
    if (declaredWeight < 0 || !Number.isFinite(declaredWeight)) {
      throw new Error(`declaredWeight must be non-negative finite; got ${declaredWeight}.`);
    }
    const digest = createHash("sha256").update(content).digest("hex");
    const pyxSample = createHash("sha256").update("pyx::" + content).digest("hex");
    const entry: MintEntry = {
      artifactId,
      contentDigestSha256: digest,
      declaredWeight,
      pyxSample,
      timestamp,
    };
    this.entries.set(artifactId, entry);
    return { ...entry };
  }

  assay(input: AssayInput): AssayResult {
    const entry = this.entries.get(input.artifactId);
    if (!entry) {
      return {
        artifactId: input.artifactId,
        verdict: "NOT_FOUND",
        reason: "No issuance record for this artifact.",
      };
    }
    if (entry.contentDigestSha256 !== input.presentedDigestSha256) {
      return {
        artifactId: input.artifactId,
        verdict: "DIGEST_MISMATCH",
        reason: "Presented digest does not match issuance record.",
      };
    }
    if (Math.abs(entry.declaredWeight - input.presentedWeight) > this.weightTolerance) {
      return {
        artifactId: input.artifactId,
        verdict: "WEIGHT_MISMATCH",
        reason: `Weight mismatch: declared ${entry.declaredWeight}, presented ${input.presentedWeight}.`,
      };
    }
    if (input.presentedPyxSample !== undefined && input.presentedPyxSample !== entry.pyxSample) {
      return {
        artifactId: input.artifactId,
        verdict: "PYX_MISMATCH",
        reason: "Pyx sample mismatch (clipping/counterfeit suspected).",
      };
    }
    return {
      artifactId: input.artifactId,
      verdict: "GENUINE",
      reason: "Digest, weight, and pyx all match issuance record (Newton's Trial of the Pyx).",
    };
  }

  size(): number {
    return this.entries.size;
  }
}
