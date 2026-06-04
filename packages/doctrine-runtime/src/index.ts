/**
 * @workspace/doctrine-runtime — Doctrine v11 LOCKED 749/14/163 Runtime Layer
 *
 * R1: Policy composition (doctrine_composer, prometheus-exporter)
 * R2: SCITT-Rekor adapter (scitt_adapter, dpi_chain_verifier, merkle_dag_b7)
 * R3: Vertical policy gate (policy_gate, policy_event_bus, policy_admin_ui)
 * R4: A15 persistent homology (persistent_homology_check, a15_metrics)
 * R5: xoshiro256** PRNG (xoshiro256ss)
 * R6: K10_v2 event-sourcing replay root (k10v2_replay_root)
 *
 * Standards:
 *   - COSE_Sign1: RFC 9052 (https://www.rfc-editor.org/rfc/rfc9052)
 *   - CBOR: RFC 8949 (https://www.rfc-editor.org/rfc/rfc8949)
 *   - Certificate Transparency: RFC 6962 (https://www.rfc-editor.org/rfc/rfc6962)
 *   - SCITT: draft-ietf-scitt-architecture-07 (https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/)
 *   - ELZ persistent homology: DOI 10.1007/s00454-002-2885-2
 */

// R1 — Composition runtime
export type {
  Lambda,
  DoctrineLabel,
  Cosignature,
  DoctrinePolicy,
  CompositionMode,
  InterleaveStrategy,
  CompositionConfig,
  CompositionResult,
} from "./composer/doctrine_composer.js";
export { DoctrineComposer, scanDoctrineV6 } from "./composer/doctrine_composer.js";
export { compositionMetrics, withMetrics } from "./composer/prometheus-exporter.js";

// R2 — SCITT-Rekor adapter
export type {
  CoseProtectedHeader,
  ScittSignedStatement,
  ScittReceipt,
  ScittAdapterConfig,
} from "./scitt/scitt_adapter.js";
export { ScittAdapter } from "./scitt/scitt_adapter.js";
export type { DpiChain, DpiHop, DpiVerificationResult } from "./scitt/dpi_chain_verifier.js";
export { DpiChainVerifier } from "./scitt/dpi_chain_verifier.js";
export { MerkleDAGB7 } from "./scitt/merkle_dag_b7.js";

// R3 — Vertical policy gate
export type {
  RequestContext,
  PolicyDecision,
  GateDecisionRecord,
  PolicyGateConfig,
} from "./policy/policy_gate.js";
export { PolicyGate } from "./policy/policy_gate.js";
export type {
  PolicyUpdateEvent,
  BusConfig,
  PolicyUpdateHandler,
  NatsConnection,
} from "./policy/policy_event_bus.js";
export { PolicyEventBus, InProcessNatsStub } from "./policy/policy_event_bus.js";

// R4 — A15 persistent homology
export type {
  PolicyPoint,
  PersistenceInterval,
  H0CheckResult,
  A15CheckConfig,
} from "./a15/persistent_homology_check.js";
export { PersistentHomologyChecker } from "./a15/persistent_homology_check.js";
export { a15Metrics } from "./a15/a15_metrics.js";

// R5 — xoshiro256** PRNG
export type { Xoshiro256State } from "./prng/xoshiro256ss.js";
export { Xoshiro256StarStar } from "./prng/xoshiro256ss.js";

// R6 — K10_v2 replay root
export type {
  LamportTs,
  K10EventType,
  K10Event,
  K10Snapshot,
  K10ReplayState,
} from "./k10/k10v2_replay_root.js";
export { K10ReplayRoot, makeEvent, EventValidator } from "./k10/k10v2_replay_root.js";

// v17 grafts
export * as wheeler from './wheeler/wheeler_window';
export * as shannon from './shannon/shannon_doctrine_code';

// v17 QEC lineage (Hamming + Shor + CSS + Kitaev)
export * as qec from './qec/qec_lineage';

// v17 matched-filter correlator (Bell Labs / P300 / radio astronomy lineage)
export * as correlator from './correlator/matched_filter';
