/**
 * Λ-gate — the SDK-side governance decorator.
 *
 * Destructive endpoints (webhooks.delete, apiKeys.revoke, treasury.transfer,
 * esignature.send) refuse to even attempt the call when the Lutar invariant
 * is below threshold AND the caller has not supplied an explicit
 * `approvalToken`.
 *
 * The actual policy + invariant math lives in `@szl-holdings/policy-engine`
 * and `@workspace/ouroboros-invariant`. This module deliberately holds no
 * policy logic of its own — it is a thin call-site refusal gate that
 * mirrors what `a11oy-cli` already does for tool calls.
 */

export class SZLPolicyError extends Error {
  readonly code = 'SZL_POLICY_BLOCKED';
  readonly action: string;
  readonly invariant: number;
  readonly threshold: number;

  constructor(action: string, invariant: number, threshold: number) {
    super(
      `SZL policy gate refused ${action}: Λ=${invariant.toFixed(4)} < threshold ${threshold.toFixed(
        4,
      )}. Pass { approvalToken } to bypass with provenance recorded on the receipt.`,
    );
    this.name = 'SZLPolicyError';
    this.action = action;
    this.invariant = invariant;
    this.threshold = threshold;
  }
}

/**
 * Pluggable invariant provider. Returns the current Λ ∈ [0,1] for the given
 * action identifier (e.g. `'webhooks.delete'`). Implementations typically
 * route through `lutarInvariant` from `@workspace/ouroboros-invariant` and
 * may consult `@szl-holdings/policy-engine` for hard blocks.
 */
export interface LambdaInvariantProvider {
  evaluate(action: string): number | Promise<number>;
}

export interface LambdaGateOptions {
  /** Minimum Λ admitted without an approval token. Defaults to 0.5. */
  threshold?: number;
  provider: LambdaInvariantProvider;
}

/**
 * Provenance record attached to receipts whenever a gated method is invoked.
 * If `bypassed` is true the call only proceeded because an `approvalToken`
 * was supplied; the token itself is preserved verbatim so auditors can
 * trace back to the approval system that issued it.
 */
export interface GateDecision {
  action: string;
  invariant: number;
  threshold: number;
  bypassed: boolean;
  approvalToken?: string;
  evaluatedAt: number;
}

export class LambdaGate {
  readonly threshold: number;
  private readonly provider: LambdaInvariantProvider;

  constructor(options: LambdaGateOptions) {
    if (options.threshold !== undefined) {
      if (!Number.isFinite(options.threshold) || options.threshold < 0 || options.threshold > 1) {
        throw new Error(`LambdaGate: threshold must be in [0,1], got ${options.threshold}`);
      }
    }
    this.threshold = options.threshold ?? 0.5;
    this.provider = options.provider;
  }

  /**
   * Throws `SZLPolicyError` if the invariant is below threshold and no
   * approval token is supplied. Returns the decision otherwise — callers
   * must forward it to the HTTP layer so it lands on the receipt.
   */
  async check(action: string, opts?: { approvalToken?: string }): Promise<GateDecision> {
    const invariant = await this.provider.evaluate(action);
    if (!Number.isFinite(invariant) || invariant < 0 || invariant > 1) {
      throw new Error(
        `LambdaGate: provider returned invalid invariant ${invariant} for ${action}; expected value in [0,1]`,
      );
    }
    const evaluatedAt = Date.now();
    if (opts?.approvalToken) {
      return {
        action,
        invariant,
        threshold: this.threshold,
        bypassed: true,
        approvalToken: opts.approvalToken,
        evaluatedAt,
      };
    }
    if (invariant < this.threshold) {
      throw new SZLPolicyError(action, invariant, this.threshold);
    }
    return {
      action,
      invariant,
      threshold: this.threshold,
      bypassed: false,
      evaluatedAt,
    };
  }
}

/**
 * Build a provider that returns a fixed invariant. Useful in tests; in
 * production wire a provider that calls `lutarInvariant(...)` from
 * `@workspace/ouroboros-invariant` against your live axes and optionally
 * short-circuits to 0 when `@szl-holdings/policy-engine`'s `checkAction`
 * returns `block`.
 */
export function constantProvider(value: number): LambdaInvariantProvider {
  return { evaluate: () => value };
}
