/**
 * Pre-decoder cascade — cheap-local first, escalate to global on residual.
 *
 * Re-expression of the architectural pattern from NVIDIA Ising-Decoding
 * (Chamberland et al., arXiv:2604.12841). The paper's pre-decoder runs
 * local block-wise corrections in O(1 μs) and only the residual
 * syndromes go to a slower global decoder (PyMatching). We absorb the
 * pattern, not the model.
 *
 * Runtime gate: `composePredecoderResult` throws if asked to seal a
 * result whose residual rate exceeded the escalation threshold AND no
 * `globalDecoderRef` was supplied. Bypassing escalation cannot be
 * satisfied by passing a fake ref — the orchestrator must produce a
 * real `ising.global.decoded.v1` receipt, content-address it, and pass
 * the resulting ref.
 */

import {
  digestBody,
  makeRef,
  parseRef,
  verifyRef,
  type IsingReceiptRef,
} from "./receipts.js";

/** Input batch admitted to the cascade. */
export interface PredecodeInput {
  /** Caller-supplied id, opaque to the kit. */
  readonly batchId: string;
  /** Logical units of work the local pass will attempt to resolve. */
  readonly itemCount: number;
  /** Optional caller tag (artifact slug, experiment id, etc.). */
  readonly tag?: string;
}

/** Output of the cheap-local pass. */
export interface LocalDecodeOutput {
  /** Items the cheap stage resolved on its own. */
  readonly resolvedCount: number;
  /** Items left for the global stage. MUST equal `itemCount - resolvedCount`. */
  readonly residualCount: number;
  /** Wall-clock for the cheap pass. */
  readonly localLatencyMicros: number;
}

/** Policy controlling when escalation becomes mandatory. */
export interface CascadePolicy {
  /**
   * Maximum allowed residualCount / itemCount before escalation is
   * mandatory. Must be in [0, 1].
   */
  readonly escalateAboveResidualRate: number;
}

export interface PredecoderResult {
  readonly inputRef: IsingReceiptRef;
  readonly localRef: IsingReceiptRef;
  readonly residualRef: IsingReceiptRef;
  /** Set iff escalation occurred. Caller-supplied content-addressed ref. */
  readonly globalRef: IsingReceiptRef | null;
  /** Set iff `residualRate > policy.escalateAboveResidualRate`. */
  readonly escalationRef: IsingReceiptRef | null;
  readonly residualRate: number;
  readonly escalated: boolean;
}

/**
 * A real global-decoder receipt — the body the upstream stage produced.
 * Required (paired with `globalDecoderRef`) when escalation is mandatory.
 *
 * Shape is intentionally permissive on the metric fields (different
 * global decoders report different things: PyMatching reports
 * `correctionCount`, an MLP decoder reports `logitVector`, etc.). The
 * kit's gate is purely about authenticity: the ref MUST be the
 * sha256-prefix of `canonicalJson(body)` and the body MUST cite the
 * residual digest it consumed.
 */
export interface GlobalDecoderReceipt {
  /** sha256-prefix of the residual body the global stage consumed. */
  readonly consumesResidualDigest: string;
  /** Free-form metric payload from the global decoder. Opaque to the kit. */
  readonly metrics: Record<string, unknown>;
}

/**
 * Compose the pre-decoder cascade. Throws when:
 *   - the local output's residualCount disagrees with itemCount minus resolvedCount
 *   - residualRate exceeds `escalateAboveResidualRate` AND no globalDecoderRef
 *     was supplied
 *   - a supplied globalDecoderRef does not parse as `ising.global.decoded.v1`
 *
 * The escalation gate is the entire point of the cascade. A caller
 * that wishes to seal a result that swallowed an escalation requirement
 * must produce an actual global-decoder receipt out-of-band and pass
 * its ref — there is no "force" flag.
 */
export function composePredecoderResult(args: {
  input: PredecodeInput;
  local: LocalDecodeOutput;
  policy: CascadePolicy;
  /** Real ref of an `ising.global.decoded.v1` receipt, if escalation ran. */
  globalDecoderRef?: IsingReceiptRef | null;
  /**
   * The actual body the global decoder produced. REQUIRED when escalation
   * is mandatory. The kit recomputes its digest and verifies it matches
   * `globalDecoderRef` — fabricated refs cannot pass this check unless
   * the caller also produces a body whose sha256-prefix matches, which
   * defeats the point of fabrication.
   */
  globalDecoderBody?: GlobalDecoderReceipt | null;
}): PredecoderResult {
  const { input, local, policy } = args;

  if (input.itemCount < 0) {
    throw new Error("composePredecoderResult: itemCount must be ≥ 0");
  }
  if (
    local.resolvedCount < 0 ||
    local.residualCount < 0 ||
    local.localLatencyMicros < 0
  ) {
    throw new Error("composePredecoderResult: local counts must be ≥ 0");
  }
  if (local.resolvedCount + local.residualCount !== input.itemCount) {
    throw new Error(
      `composePredecoderResult: resolved(${local.resolvedCount}) + residual(${local.residualCount}) != itemCount(${input.itemCount})`,
    );
  }
  if (
    !Number.isFinite(policy.escalateAboveResidualRate) ||
    policy.escalateAboveResidualRate < 0 ||
    policy.escalateAboveResidualRate > 1
  ) {
    throw new Error(
      "composePredecoderResult: escalateAboveResidualRate must be in [0, 1]",
    );
  }

  const residualRate =
    input.itemCount === 0 ? 0 : local.residualCount / input.itemCount;
  const mustEscalate = residualRate > policy.escalateAboveResidualRate;

  // Compose content-addressed refs over canonical bodies.
  const inputBody = {
    batchId: input.batchId,
    itemCount: input.itemCount,
    tag: input.tag ?? null,
  };
  const localBody = {
    inputDigest: digestBody(inputBody),
    resolvedCount: local.resolvedCount,
    residualCount: local.residualCount,
    localLatencyMicros: local.localLatencyMicros,
  };
  const residualBody = {
    inputDigest: digestBody(inputBody),
    residualCount: local.residualCount,
    residualRate,
  };

  const inputRef = makeRef("ising.predecode.input.v1", inputBody);
  const localRef = makeRef("ising.predecode.local.v1", localBody);
  const residualRef = makeRef("ising.predecode.residual.v1", residualBody);

  // Escalation gate. Strict — bypass requires forging sha256.
  if (mustEscalate) {
    const suppliedRef = args.globalDecoderRef ?? null;
    const suppliedBody = args.globalDecoderBody ?? null;

    if (!suppliedRef) {
      throw new Error(
        `composePredecoderResult: residualRate=${residualRate.toFixed(
          4,
        )} > policy=${policy.escalateAboveResidualRate} but no globalDecoderRef was supplied — escalation is mandatory`,
      );
    }
    if (!suppliedBody) {
      throw new Error(
        "composePredecoderResult: globalDecoderBody is required when escalation is mandatory — the kit verifies ref against body, fabricated refs cannot bypass",
      );
    }

    // 1. parseRef validates class + 16-hex-digest format (rejects garbage prefixes).
    let parsed: ReturnType<typeof parseRef>;
    try {
      parsed = parseRef(suppliedRef);
    } catch (e) {
      throw new Error(
        `composePredecoderResult: globalDecoderRef is malformed — ${(e as Error).message}`,
      );
    }
    if (parsed.cls !== "ising.global.decoded.v1") {
      throw new Error(
        `composePredecoderResult: globalDecoderRef must be ising.global.decoded.v1, got ${parsed.cls}`,
      );
    }

    // 2. The body must cite the SAME residual digest we just sealed.
    //    This is what prevents a caller from replaying an unrelated global
    //    receipt against this cascade.
    const ourResidualDigest = digestBody(residualBody);
    if (suppliedBody.consumesResidualDigest !== ourResidualDigest) {
      throw new Error(
        `composePredecoderResult: globalDecoderBody.consumesResidualDigest=${suppliedBody.consumesResidualDigest} does not match this cascade's residual digest=${ourResidualDigest} — receipt does not belong to this cascade`,
      );
    }

    // 3. verifyRef recomputes the digest from the body and checks it matches.
    //    A fabricated ref would have to satisfy a sha256 collision over a
    //    body the caller still has to produce — i.e. it's not a bypass.
    if (!verifyRef(suppliedRef, suppliedBody)) {
      throw new Error(
        "composePredecoderResult: globalDecoderRef does not content-address its body — receipt is forged or mutated",
      );
    }

    const escalationBody = {
      residualDigest: ourResidualDigest,
      globalDecoderRef: suppliedRef,
      reason: "residualRate-above-threshold",
    };
    const escalationRef = makeRef(
      "ising.escalation.required.v1",
      escalationBody,
    );
    return {
      inputRef,
      localRef,
      residualRef,
      globalRef: suppliedRef,
      escalationRef,
      residualRate,
      escalated: true,
    };
  }

  return {
    inputRef,
    localRef,
    residualRef,
    globalRef: args.globalDecoderRef ?? null,
    escalationRef: null,
    residualRate,
    escalated: false,
  };
}
