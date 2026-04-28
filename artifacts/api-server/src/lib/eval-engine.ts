/**
 * Eval Verification Engine
 *
 * Wires the Open Evaluation Layer's verification pipeline to the existing
 * eval-forge / eval-executors infrastructure. When a submitted result has a
 * verifyToken, this module:
 *   1. Spins up an isolated sandbox re-run using the appropriate executor
 *   2. Compares the re-run value to the submitted value
 *   3. If within tolerance, signs a cryptographic proof and flips the badge
 *      from `community` → `verified`
 *   4. Persists the verification token row with status, proof, and delta
 *
 * Security model:
 *   - Verification NEVER passes based on token prefix alone. The only two
 *     accepted paths to "verified" are:
 *       a) Successful sandbox re-run with result within tolerance
 *       b) HMAC-SHA256 token validation using EVAL_PROOF_SECRET (must be set)
 *   - If EVAL_PROOF_SECRET is not set, hash-based validation is DISABLED and
 *     the result will fail with a clear diagnostic note. Fail closed.
 *   - Proof HMAC generation also requires EVAL_PROOF_SECRET; the engine
 *     refuses to generate proofs without it.
 */

import { evalRegistryRepository } from '@szl-holdings/db-repository/eval-registry';
import { createHmac } from 'node:crypto';
import { logger } from './logger';
import type { EvalResultRow } from '@szl-holdings/db-repository/eval-registry';

const DEFAULT_RELATIVE_TOLERANCE = 0.02;

export interface VerificationJobInput {
  resultId: string;
  verifyToken: string;
  verifyTokenId?: string;
  result: EvalResultRow | null;
  executorConfig?: Record<string, unknown>;
}

export interface VerificationJobOutput {
  passed: boolean;
  rerunValue?: number | string | boolean;
  delta?: number;
  proof?: string;
  notes?: string;
}

export async function runEvalVerification(input: VerificationJobInput): Promise<void> {
  const { resultId, verifyToken, verifyTokenId, result, executorConfig = {} } = input;

  if (!result) {
    logger.warn({ resultId }, '[eval-engine] Verification skipped — result not found');
    return;
  }

  let tokenRow = verifyTokenId
    ? await evalRegistryRepository.findVerificationToken(resultId).then((r) =>
        r?.id === verifyTokenId ? r : null,
      )
    : await evalRegistryRepository.findVerificationToken(resultId);

  if (!tokenRow) {
    logger.warn({ resultId }, '[eval-engine] Verification token not found');
    return;
  }

  await evalRegistryRepository.updateVerificationToken(tokenRow.id, { status: 'running' });

  try {
    const output = await executeVerificationSandbox(result, verifyToken, executorConfig);

    if (output.passed) {
      const proofSecret = process.env.EVAL_PROOF_SECRET;
      if (!proofSecret) {
        logger.error(
          { resultId },
          '[eval-engine] EVAL_PROOF_SECRET is not set — cannot generate cryptographic proof; failing verification',
        );
        await evalRegistryRepository.updateVerificationToken(tokenRow.id, {
          status: 'failed',
          verifiedBy: 'sandbox',
          verifiedAt: new Date(),
          notes: 'EVAL_PROOF_SECRET not configured on server — proof generation is disabled',
        });
        return;
      }

      const proofPayload = JSON.stringify({
        resultId,
        submittedValue: result.value,
        rerunValue: output.rerunValue,
        delta: output.delta,
        verifiedAt: new Date().toISOString(),
        verifyToken,
      });
      const proof = createHmac('sha256', proofSecret).update(proofPayload).digest('hex');
      const proofWithPrefix = `v1.hmac256.${proof}`;

      await evalRegistryRepository.updateVerificationToken(tokenRow.id, {
        status: 'passed',
        proof: proofWithPrefix,
        rerunNumericValue:
          typeof output.rerunValue === 'number' ? String(output.rerunValue) : null,
        delta: output.delta !== undefined ? String(output.delta) : null,
        verifiedBy: 'sandbox',
        verifiedAt: new Date(),
        notes: output.notes ?? null,
        rerunReport: { ...output, proofPayload } as unknown as Record<string, unknown>,
      });

      await evalRegistryRepository.updateResultBadgeState(resultId, 'verified', tokenRow.id);

      logger.info(
        { resultId, delta: output.delta },
        '[eval-engine] Verification PASSED — badge promoted to verified',
      );
    } else {
      await evalRegistryRepository.updateVerificationToken(tokenRow.id, {
        status: 'failed',
        rerunNumericValue:
          typeof output.rerunValue === 'number' ? String(output.rerunValue) : null,
        delta: output.delta !== undefined ? String(output.delta) : null,
        verifiedBy: 'sandbox',
        verifiedAt: new Date(),
        notes: output.notes ?? 'Re-run value outside tolerance',
        rerunReport: output as unknown as Record<string, unknown>,
      });

      logger.warn(
        { resultId, delta: output.delta, tolerance: DEFAULT_RELATIVE_TOLERANCE },
        '[eval-engine] Verification FAILED — re-run outside tolerance',
      );
    }
  } catch (err) {
    logger.error({ resultId, err }, '[eval-engine] Verification sandbox error');
    await evalRegistryRepository.updateVerificationToken(tokenRow.id, {
      status: 'failed',
      notes: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Run the verification sandbox.
 *
 * Two accepted paths to a passing result:
 *
 * Path A — Sandbox re-run: a matching eval suite is found via the verifyToken
 * in the eval-forge registry. The suite is re-run and the result compared
 * against the submitted numeric value within DEFAULT_RELATIVE_TOLERANCE.
 *
 * Path B — HMAC token validation (CI pipelines): the verifyToken is a valid
 * HMAC-SHA256 of `${resultId}:${value}` signed with EVAL_PROOF_SECRET. This
 * allows trusted CI systems to self-attest without a full sandbox re-run.
 * DISABLED when EVAL_PROOF_SECRET is not set. Fail closed.
 *
 * All prefix-based auto-pass patterns are rejected. The engine never passes
 * a result based solely on token format.
 */
async function executeVerificationSandbox(
  result: EvalResultRow,
  verifyToken: string,
  executorConfig: Record<string, unknown>,
): Promise<VerificationJobOutput> {
  const submittedNumeric = result.numericValue ? Number(result.numericValue) : null;

  // Path A: sandbox re-run via eval-forge
  try {
    const { evalForgeStore } = await import('./eval-forge-store.js');
    const suite = await evalForgeStore.findSuiteByVerifyToken(verifyToken);

    if (suite && submittedNumeric !== null) {
      const { buildSuiteExecutor } = await import('@workspace/eval-forge');
      const { defaultEvalInfer } = await import('./eval-executors.js');
      const executor = buildSuiteExecutor(suite, defaultEvalInfer);
      const report = await executor.run();

      const rerunValue = report.avgScore;
      const delta = Math.abs(rerunValue - submittedNumeric);
      const relativeDelta = submittedNumeric !== 0 ? delta / Math.abs(submittedNumeric) : delta;
      const passed = relativeDelta <= DEFAULT_RELATIVE_TOLERANCE;

      return {
        passed,
        rerunValue,
        delta: rerunValue - submittedNumeric,
        notes: `Re-run avgScore=${rerunValue.toFixed(4)}, submitted=${submittedNumeric}, Δ=${(rerunValue - submittedNumeric).toFixed(4)}, rel_Δ=${(relativeDelta * 100).toFixed(2)}%`,
      };
    }
  } catch {
    // Suite not found or executor error — fall through to HMAC path
  }

  // Path B: HMAC token validation for CI-submitted results
  // Requires EVAL_PROOF_SECRET to be set. Fail closed if missing.
  const proofSecret = process.env.EVAL_PROOF_SECRET;
  if (!proofSecret) {
    return {
      passed: false,
      notes:
        'No matching eval suite found and EVAL_PROOF_SECRET is not configured — HMAC validation disabled. Set EVAL_PROOF_SECRET to enable CI token verification.',
    };
  }

  const expectedPayload = `${result.id}:${result.value}`;
  const expectedHmac = createHmac('sha256', proofSecret).update(expectedPayload).digest('hex');

  if (verifyToken === expectedHmac) {
    return {
      passed: true,
      rerunValue: result.value,
      delta: 0,
      notes: 'HMAC token validation passed (no sandbox re-run available for this benchmark)',
    };
  }

  return {
    passed: false,
    notes: 'No matching eval suite and HMAC token validation failed',
  };
}
