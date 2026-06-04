/**
 * Lutar Invariant routes — Λ, Λ₅, Λ₆..Λ₉, and Λ₁₀ (the Audit Closure Operator).
 *
 *   POST /v1/ouroboros/lutar/v1     — 4-axis Λ over {C, H, R, F}
 *   POST /v1/ouroboros/lutar/v2     — 5-axis Λ₅ over {C, H, R, F, G}
 *   POST /v1/ouroboros/lutar/v6     — 6-axis Λ₆ over {C, H, R, F, G, I}
 *   POST /v1/ouroboros/lutar/v7     — 7-axis Λ₇ adds M (moral grounding)
 *   POST /v1/ouroboros/lutar/v8     — 8-axis Λ₈ adds B (ontological grounding)
 *   POST /v1/ouroboros/lutar/v9     — 9-axis Λ₉ adds N (non-measurability honesty)
 *   POST /v1/ouroboros/lutar/v10    — Audit Closure Operator Λ₁₀ over an artefact matrix
 *
 * Every route is auth-guarded upstream via apiKeyGuard at /v1/ouroboros.
 */
import { type IRouter, Router } from "express";
import { z } from "zod";
import {
  lutarInvariant,
  lutarInvariant5,
  lutarInvariant6,
  lutarInvariant7,
  lutarInvariant8,
  lutarInvariant9,
  lutarV10Audit,
  type LutarLayerArtifacts,
} from "@workspace/ouroboros-invariant";

const lutarRouter: IRouter = Router();

const unit = z.number().min(0).max(1);

const axes4 = z.object({
  cleanliness: unit,
  horizon: unit,
  resonance: unit,
  frustum: unit,
});
const axes5 = axes4.extend({ gaussClosure: unit });
const axes6 = axes5.extend({ invariance: unit });
const axes7 = axes6.extend({ moralGrounding: unit });
const axes8 = axes7.extend({ ontologicalGrounding: unit });
const axes9 = axes8.extend({ measurabilityHonesty: unit });

function handle<TIn, TOut>(
  schema: z.ZodType<TIn>,
  fn: (input: TIn) => TOut
) {
  return (req: any, res: any) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }
    try {
      const result = fn(parsed.data);
      return res.status(200).json(result);
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: "computation_failed", message: err?.message ?? String(err) });
    }
  };
}

lutarRouter.post("/lutar/v1", handle(axes4, (a) => lutarInvariant(a)));
lutarRouter.post("/lutar/v2", handle(axes5, (a) => lutarInvariant5(a)));
lutarRouter.post("/lutar/v6", handle(axes6, (a) => lutarInvariant6(a)));
lutarRouter.post("/lutar/v7", handle(axes7, (a) => lutarInvariant7(a)));
lutarRouter.post("/lutar/v8", handle(axes8, (a) => lutarInvariant8(a)));
lutarRouter.post("/lutar/v9", handle(axes9, (a) => lutarInvariant9(a)));

// v10 — Audit Closure Operator over an artefact matrix
const artifactDimension = z.enum([
  "CODE",
  "CODEX",
  "API",
  "TEST",
  "THESIS",
  "SURFACE",
]);
const artifactMatrixRow = z.object({
  layer: z.string().min(1),
  lambdaValue: z.number().finite().nonnegative(),
  artifacts: z.record(artifactDimension, z.boolean()),
});
const v10Body = z.object({ matrix: z.array(artifactMatrixRow).min(1) });

lutarRouter.post(
  "/lutar/v10",
  handle(v10Body, (b) =>
    lutarV10Audit(b.matrix as unknown as LutarLayerArtifacts[])
  )
);

// Convenience: evaluate the whole v1..v9 family at one 9-axis tuple by
// projecting onto the appropriate axis subset for each layer.
lutarRouter.post(
  "/lutar/evaluate-all",
  handle(axes9, (a) => ({
    v1: lutarInvariant({
      cleanliness: a.cleanliness,
      horizon: a.horizon,
      resonance: a.resonance,
      frustum: a.frustum,
    }),
    v2: lutarInvariant5({
      cleanliness: a.cleanliness,
      horizon: a.horizon,
      resonance: a.resonance,
      frustum: a.frustum,
      gaussClosure: a.gaussClosure,
    }),
    v6: lutarInvariant6({
      cleanliness: a.cleanliness,
      horizon: a.horizon,
      resonance: a.resonance,
      frustum: a.frustum,
      gaussClosure: a.gaussClosure,
      invariance: a.invariance,
    }),
    v7: lutarInvariant7({
      cleanliness: a.cleanliness,
      horizon: a.horizon,
      resonance: a.resonance,
      frustum: a.frustum,
      gaussClosure: a.gaussClosure,
      invariance: a.invariance,
      moralGrounding: a.moralGrounding,
    }),
    v8: lutarInvariant8({
      cleanliness: a.cleanliness,
      horizon: a.horizon,
      resonance: a.resonance,
      frustum: a.frustum,
      gaussClosure: a.gaussClosure,
      invariance: a.invariance,
      moralGrounding: a.moralGrounding,
      ontologicalGrounding: a.ontologicalGrounding,
    }),
    v9: lutarInvariant9(a),
  }))
);

export default lutarRouter;
