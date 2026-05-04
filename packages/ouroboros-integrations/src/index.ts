/**
 * @workspace/ouroboros-integrations -- adapters that lift the Ouroboros
 * primitives into the deployable products.
 *
 * A11oy Orchestrator is the top-level entry point. It ingests everything:
 *   - Guardrails pipeline (14 rails, tamper-evident v2.0.0 receipts)
 *   - Lambda Engine (9-axis evaluation + Adaptive Depth Routing)
 *   - Convergence Pulse (real-time trust heartbeat)
 *   - Agent handoff reconciliation (MMP-14 frustum)
 *   - Sentra HSM anchor (Egyptian doubling)
 *   - Amaru fleet coordination (Seked + Unit-Fractions)
 */

export * as a11oy from "./a11oy.js";
export * as amaru from "./amaru.js";
export * as sentra from "./sentra.js";

export {
  A11oyOrchestrator,
  type A11oyGuardRequest,
  type A11oyGuardResult,
  type A11oyOrchestratorStats,
} from "./a11oy-orchestrator.js";

export {
  computeLambdaEngine,
  scoreContentAxes,
  estimateBatchSavings,
  LAMBDA_ENGINE_VERSION,
  type LambdaEngineInput,
  type LambdaEngineReport,
  type AdaptiveDepthDecision,
  type ModelTier,
  type VerificationDepth,
} from "./lambda-engine.js";

export {
  ConvergencePulse,
  type PulseReading,
  type PulseSnapshot,
  type TrustTrajectory,
  type ConvergencePulseConfig,
} from "./convergence-pulse.js";
