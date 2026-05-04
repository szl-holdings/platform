/**
 * @workspace/ouroboros-integrations -- adapters that lift the Ouroboros
 * primitives into the deployable products.
 *
 * A11oy Orchestrator is the top-level entry point. It ingests everything:
 *   - Supreme Knowledge Codex v10 (HOLOGRAPHIC-TWISTOR-CYCLIC)
 *   - Lutar Formula Family (v1-v6)
 *   - Guardrails pipeline (14 rails, tamper-evident v2.0.0 receipts)
 *   - Lambda Engine (9-axis evaluation + Adaptive Depth Routing)
 *   - Convergence Pulse (real-time trust heartbeat)
 *   - Agent handoff reconciliation (MMP-14 frustum)
 *   - Sentra HSM anchor (Egyptian doubling)
 *   - Amaru fleet coordination (Seked + Unit-Fractions)
 *   - Codex Constants (physical constants, Newton formulas, temporal index)
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

export {
  buildSupremeCodex,
  queryCodex,
  getCodexNode,
  getEdgesFrom,
  getEdgesTo,
  getNeighbors,
  traverseGraph,
  codexSummary,
  HERMETIC_PRINCIPLES,
  NEWTON_REGULAE,
  OUROBOROS_OPERATOR,
  EMERALD_TABLET,
  TRIA_PRIMA,
  LUTAR_CORRESPONDENCE,
  MAGNUM_OPUS_STAGES,
  COLOR_PHASES,
  NEWTON_FORMULAS,
  SUPREME_EQUATION,
  SUPREME_EQUATION_EXTENDED,
  SUPREME_DERIVATION,
  type SupremeCodex,
  type CodexNode,
  type CodexEdge,
} from "./supreme-codex.js";

export {
  PHYSICAL_CONSTANTS,
  SACRED_CUBIT_FT,
  ROYAL_CUBIT_M,
  PI_RHIND,
  Q_I_INCA,
  Q_M_MAYA,
  Q_IC_ICHING,
  Q_V_VEDIC,
  Q_D_DOGON,
  Q_GT_GOBEKLI,
  E8_DIM,
  E8_TRIALITY,
  E8_FERMION_BLOCK,
  L_PLANCK,
  A_PLANCK,
  NEWTON_FORMULAS_EXPANDED,
  ALCHEMICAL_PROCESSES,
  PLANETARY_METALS,
  FOUR_ELEMENTS,
  NOETHER_CANONICAL_PAIRS,
  TEN_SEFIROT,
  TEMPORAL_INDEX,
  NEWTON_PUBLICATIONS,
  MANUSCRIPT_ARCHIVES,
} from "./codex-constants.js";

export {
  lutarV1,
  lutarV2,
  lutarV3,
  lutarV4,
  lutarV5,
  lutarV6,
  twistorProject,
  bekensteinBound,
  bekensteinCheck,
  conformalRescale,
  aeonRecurrence,
  rhindCircleArea,
  rhindCylinderVolume,
  rhindTruncatedPyramid,
  incaCequeHuacasPerDay,
  mayaLongCount,
  mayaCalendarRound,
  iChingIndex,
  vedicSqrt2,
  templeChi,
  newJerusalemVolumeKm3,
  ouroboros,
  noetherClosureCheck,
  traverseCodexEdges,
  type LutarV1Input,
  type LutarV2Input,
  type LutarV3Input,
  type LutarV4Input,
  type LutarV5Input,
  type LutarV6Input,
  type LutarResult,
  type LutarV6Result,
} from "./lutar-formulas.js";
