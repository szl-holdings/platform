/**
 * NVIDIA-Ising-inspired pre-decoder + calibration surface.
 *
 * Mounts public-read alongside `/api/memo` and `/api/uds`, plus an
 * auth-required admit endpoint for the pre-decoder cascade. Backs the
 * synthesis doc at `docs/research/ising-quantum-synthesis-2026.md`
 * and the typed primitives in `@szl-holdings/ising-calibration-kit`.
 *
 * Doctrine V6 contract:
 *   - No invented refs. Every ref returned is content-addressed over
 *     the canonical body the kit computes.
 *   - No silent escalation bypass. If the caller's local-pass output
 *     exceeds the policy residual rate AND no real globalDecoderRef
 *     was supplied, the kit throws and we return 422 — never 200.
 *   - No vendor lock. No NVIDIA SDK, no Python sidecar — pure TS.
 */
import { type IRouter, type Request, type Response, Router } from 'express';
import {
  composePredecoderResult,
  composeNoiseDivergence,
  ISING_RECEIPT_CLASSES,
  type CascadePolicy,
  type GlobalDecoderReceipt,
  type IsingReceiptRef,
} from '@szl-holdings/ising-calibration-kit';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

/**
 * Default cascade policy. Conservative threshold: anything above 10%
 * residual rate MUST escalate to a global decoder. Operators can override
 * by supplying their own `policy.escalateAboveResidualRate` in the admit
 * body, but the kit caps the legal range at [0, 1].
 */
const DEFAULT_CASCADE_POLICY: CascadePolicy = {
  escalateAboveResidualRate: 0.1,
};

/** Default Jensen-Shannon divergence tolerance (nats) for noise-model drift. */
const DEFAULT_NOISE_TOLERANCE = 0.05;

/**
 * GET /api/ising/receipts/classes
 *
 * Canonical, ordered list of `ising.*.v1` receipt classes the platform
 * may emit. Auditors diff against the on-disk corpus to detect schema
 * drift.
 */
router.get('/receipts/classes', (_req: Request, res: Response) => {
  try {
    return sendSuccess(res, {
      receiptClasses: ISING_RECEIPT_CLASSES,
      synthesisDoc: 'docs/research/ising-quantum-synthesis-2026.md',
      kit: '@szl-holdings/ising-calibration-kit',
      attribution: {
        decoder: {
          paper: 'arXiv:2604.12841',
          authors: [
            'Christopher Chamberland',
            'Jan Olle',
            'Muyuan Li',
            'Scott Thornton',
            'Igor Baratta',
          ],
          source: 'https://github.com/NVIDIA/Ising-Decoding',
          license: 'Apache-2.0',
        },
        calibration: {
          source: 'https://github.com/NVIDIA/Quantum-Calibration-Agent-Blueprint',
          lead: '@ShuxiangCao',
          license: 'Apache-2.0',
        },
      },
    });
  } catch (err) {
    return handleRouteError(res, err, 'ising.receipts.classes');
  }
});

/**
 * GET /api/ising/cascade/policy
 *
 * The default cascade + noise-model policy. Operators may inspect the
 * residual-rate ceiling and JSD tolerance without admitting a batch.
 */
router.get('/cascade/policy', (_req: Request, res: Response) => {
  try {
    return sendSuccess(res, {
      cascadePolicy: DEFAULT_CASCADE_POLICY,
      noiseTolerance: DEFAULT_NOISE_TOLERANCE,
      notes: [
        'escalateAboveResidualRate in [0,1]; > value forces a real ising.global.decoded.v1 ref AND its verified body',
        'noiseTolerance is Jensen-Shannon divergence in nats (bounded [0, ln 2]); assertNoiseModelAligned throws above this',
      ],
    });
  } catch (err) {
    return handleRouteError(res, err, 'ising.cascade.policy');
  }
});

/**
 * POST /api/ising/predecode/admit
 *
 * Admit a pre-decoder cascade result. The caller supplies the input
 * batch, the cheap local-pass output, an optional policy override, and
 * — if local-pass residual exceeded the threshold — a real
 * `ising.global.decoded.v1` ref from their global decoder. The kit's
 * escalation gate throws otherwise; we surface that as 422.
 */
router.post(
  '/predecode/admit',
  authMiddleware({ required: true }),
  (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const input = body.input;
      const local = body.local;
      const policy: CascadePolicy = body.policy ?? DEFAULT_CASCADE_POLICY;
      const globalDecoderRef: IsingReceiptRef | null =
        body.globalDecoderRef ?? null;
      // REQUIRED (paired with globalDecoderRef) when escalation is mandatory.
      // Without it, the kit's gate throws and we return 422. The route does
      // NOT synthesise a body — the caller must supply the global decoder's
      // actual output, otherwise nothing to verify against.
      const globalDecoderBody: GlobalDecoderReceipt | null =
        body.globalDecoderBody ?? null;

      if (!input || typeof input !== 'object') {
        return sendSuccess(
          res,
          { ok: false, error: 'input-required' },
          422,
        );
      }
      if (!local || typeof local !== 'object') {
        return sendSuccess(
          res,
          { ok: false, error: 'local-required' },
          422,
        );
      }

      try {
        const result = composePredecoderResult({
          input,
          local,
          policy,
          globalDecoderRef,
          globalDecoderBody,
        });
        return sendSuccess(res, { ok: true, result });
      } catch (gateErr) {
        return sendSuccess(
          res,
          {
            ok: false,
            error: 'cascade-gate-rejected',
            message:
              gateErr instanceof Error ? gateErr.message : String(gateErr),
          },
          422,
        );
      }
    } catch (err) {
      return handleRouteError(res, err, 'ising.predecode.admit');
    }
  },
);

/**
 * POST /api/ising/noise/divergence
 *
 * Compose a noise-model divergence witness from a learned snapshot and
 * a declared snapshot. Public-read (auth-required to keep the
 * timestamps tied to a principal). Does not throw on divergence — it
 * returns the witness with `aligned: false`. Callers that want to
 * refuse to proceed should call `assertNoiseModelAligned` directly in
 * their own process.
 */
router.post(
  '/noise/divergence',
  authMiddleware({ required: true }),
  (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const learned = body.learned;
      const declared = body.declared;
      const tolerance: number = body.tolerance ?? DEFAULT_NOISE_TOLERANCE;

      if (!learned || !declared) {
        return sendSuccess(
          res,
          { ok: false, error: 'learned-and-declared-required' },
          422,
        );
      }

      try {
        const witness = composeNoiseDivergence({
          learned,
          declared,
          tolerance,
        });
        return sendSuccess(res, { ok: true, witness });
      } catch (gateErr) {
        return sendSuccess(
          res,
          {
            ok: false,
            error: 'noise-witness-rejected',
            message:
              gateErr instanceof Error ? gateErr.message : String(gateErr),
          },
          422,
        );
      }
    } catch (err) {
      return handleRouteError(res, err, 'ising.noise.divergence');
    }
  },
);

export default router;
