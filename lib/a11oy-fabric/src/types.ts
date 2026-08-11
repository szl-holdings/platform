export type Vertical =
  | 'lyte-revenue'
  | 'vessels-maritime'
  | 'terra-real-estate'
  | 'aegis-defense'
  | 'prism-counsel'
  | 'carlota-jo'
  | 'alloy-core'
  | 'sentra-cyber'
  | 'firestorm-ops'
  | 'nuro-forge'
  | 'meridian-infra'
  | 'constellation-graph';

export type SignalSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SignalStatus = 'active' | 'acknowledged' | 'resolved' | 'escalated' | 'suppressed';

export type OutcomeStatus = 'pending' | 'in_progress' | 'achieved' | 'missed' | 'blocked';

export type ActionStatus =
  | 'recommended'
  | 'pending_approval'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'rejected'
  | 'failed';

export type PolicyEnforcement = 'block' | 'warn' | 'log' | 'require_approval';

export type WorkcellStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed';

/**
 * Evidence availability is independent from a Workcell's workflow status.
 * These tokens intentionally match the operational-source vocabulary used by
 * @workspace/a11oy-runtime without coupling the two packages.
 */
export type OperationalEvidenceState =
  | 'REAL'
  | 'DEMO'
  | 'UNAVAILABLE'
  | 'DEGRADED'
  | 'BLOCKED'
  | 'ROADMAP';

export type ProofPacketKind =
  | 'signal_ingestion'
  | 'state_transition'
  | 'action_execution'
  | 'policy_evaluation'
  | 'mirror_eval'
  | 'human_approval';

export type FabricLayer =
  | 'coverage_graph'
  | 'signal_mesh'
  | 'state_engine'
  | 'causal_core'
  | 'action_rail'
  | 'covenant_layer'
  | 'proof_ledger';

export type MirrorEvalVerdict = 'pass' | 'fail' | 'warn' | 'abstain';

export type ExecutionMode = 'demo' | 'governed' | 'autonomous' | 'supervised';
