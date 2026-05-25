/**
 * A11oy Orchestration Backbone — shared contract.
 *
 * A11oy is the single orchestration plane. The six child products
 * (Amaru/Conduit, Sentra, Counsel, Terra, Carlota, Vessels) register with
 * A11oy on boot, route every model call through A11oy's governed router,
 * and emit material actions to A11oy's proof ledger. This file is the one
 * source of truth for the shapes that flow across that backbone.
 */

export type A11oyProductId =
  | 'amaru'
  | 'sentra'
  | 'counsel'
  | 'terra'
  | 'carlota-jo'
  | 'vessels';

export const A11OY_PRODUCT_IDS: readonly A11oyProductId[] = [
  'amaru',
  'sentra',
  'counsel',
  'terra',
  'carlota-jo',
  'vessels',
] as const;

export interface ProductCapability {
  id: string;
  label: string;
  /** What governance class this capability falls under. */
  governanceClass: 'observation' | 'recommendation' | 'mutation' | 'external_action';
}

export interface ProductRegistration {
  product: A11oyProductId;
  displayName: string;
  /** Path under the platform proxy (e.g. `/sentra/`). */
  basePath: string;
  /** Brand accent color used by A11oy hub tiles. */
  accentColor: string;
  capabilities: ProductCapability[];
  /** Optional version string (artifact build sha or package version). */
  version?: string;
  /** Reported by the registering process; defaults to current ISO timestamp. */
  bootedAt?: string;
}

export type ProductHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'unknown'
  | 'offline'
  | 'unregistered';

export interface RegisteredProduct extends ProductRegistration {
  registeredAt: string;
  lastSeen: string;
  health: ProductHealthStatus;
  recentProofCount: number;
  lastProofAt?: string;
  lastAction?: string;
  /** Models this product has invoked through the governed router. */
  modelsUsed: string[];
}

export type ProofKind =
  | 'signal_ingested'
  | 'recommendation_emitted'
  | 'action_approved'
  | 'action_executed'
  | 'cross_product_handoff'
  | 'governance_block'
  | 'model_invocation';

/**
 * Snapshot of the nine Λ axes (cleanliness, horizon, resonance, frustum,
 * gaussClosure, invariance, moralGrounding, ontologicalGrounding,
 * measurabilityHonesty). Mirrors `LambdaAxes` in `@szl-holdings/vsp-otel` but
 * is declared inline here so the SDK contract doesn't pull the OTel package
 * into browser bundles. Only finite numeric axes that were actually stamped
 * onto the proof's span are included.
 */
export type ProofLambdaAxes = Partial<{
  cleanliness: number;
  horizon: number;
  resonance: number;
  frustum: number;
  gaussClosure: number;
  invariance: number;
  moralGrounding: number;
  ontologicalGrounding: number;
  measurabilityHonesty: number;
}>;

export interface ProofLedgerEntry {
  id: string;
  product: A11oyProductId;
  kind: ProofKind;
  summary: string;
  /** Optional deep-link path back to the originating product page. */
  deepLink?: string;
  /** When the proof references a downstream product handoff. */
  relatedProduct?: A11oyProductId;
  /** Free-form structured payload (kept small — UI-friendly). */
  payload?: Record<string, unknown>;
  ts: string;
  /**
   * SHA-256 hash that anchors this proof's VSP receipt (task #5053). Derived
   * deterministically from the proof's canonical form so auditors can
   * independently re-compute it from the durable `proof_ledger` row.
   */
  receiptHash?: string;
  /**
   * OTel traceId stamped on the verifiable span emitted for this proof.
   * Equal to `receiptHash.slice(0, 32)` — operators can paste this into any
   * tracing tool wired to the OTLP exporter to audit the AI decision end-
   * to-end.
   */
  traceId?: string;
  /**
   * Λ-axis scores that were stamped on the verifiable span for this proof
   * (if any). Surfaced so the A11oy hub can render a verify panel without
   * re-querying the tracing backend.
   */
  lambdaAxes?: ProofLambdaAxes;
}

export interface GovernedModelCallRequest {
  product: A11oyProductId;
  /** Logical model id (HF or chat-completions name). */
  model: string;
  /** What the call is for; surfaces in the proof ledger. */
  purpose: string;
  /** Free-form input — not persisted, only inspected for routing. */
  input?: unknown;
  /** Optional deep link back to the call site. */
  deepLink?: string;
}

export interface GovernedModelCallResult {
  ok: boolean;
  modelUsed: string;
  /** When governance gates blocked the call. */
  blocked?: boolean;
  failedGates?: string[];
  /** Proof ledger id created for this invocation. */
  proofId: string;
  /** Demo/seed output — A11oy returns this when no live provider is wired. */
  output?: unknown;
}

export interface CrossProductHandoffRequest {
  fromProduct: A11oyProductId;
  toProduct: A11oyProductId;
  reason: string;
  /** Original event id (e.g. signal id) being handed off. */
  refId?: string;
  payload?: Record<string, unknown>;
  deepLink?: string;
}

export interface CrossProductHandoffResult {
  ok: boolean;
  handoffId: string;
  /** Proof ledger ids written for this handoff (one per leg). */
  proofIds: string[];
}

export interface ProductRegistryResponse {
  products: RegisteredProduct[];
  recentProofs: ProofLedgerEntry[];
  /** Total proofs since process start. */
  totalProofs: number;
  generatedAt: string;
}
