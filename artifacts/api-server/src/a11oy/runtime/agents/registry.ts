import type { OperatorId } from '../types.js';
import type { BaseOperator } from './base-operator.js';
import {
  PlannerOperator,
  AnalystOperator,
  RiskOperator,
  ProofOperator,
  ActionOperator,
  VerificationOperator,
  BoardPacketOperator,
  ConnectorOperator,
  EvaluatorOperator,
  CodeOperator,
} from './operators.js';

type OperatorFactory = () => BaseOperator;

const REGISTRY: Record<OperatorId, OperatorFactory> = {
  planner: () => new PlannerOperator(),
  analyst: () => new AnalystOperator(),
  risk: () => new RiskOperator(),
  proof: () => new ProofOperator(),
  action: () => new ActionOperator(),
  verification: () => new VerificationOperator(),
  'board-packet': () => new BoardPacketOperator(),
  connector: () => new ConnectorOperator(),
  evaluator: () => new EvaluatorOperator(),
  code: () => new CodeOperator(),
};

export const OPERATOR_METADATA: Array<{
  operatorId: OperatorId;
  displayName: string;
  description: string;
  capabilities: string[];
  restrictions: string[];
}> = [
  {
    operatorId: 'planner',
    displayName: 'Planner',
    description: 'Decomposes objectives into phased execution plans. Coordinates operator handoffs.',
    capabilities: ['plan_decomposition', 'phase_routing', 'operator_handoff'],
    restrictions: ['no_execution', 'no_approval'],
  },
  {
    operatorId: 'analyst',
    displayName: 'Analyst',
    description: 'Performs signal analysis, pattern detection, and business impact quantification.',
    capabilities: ['signal_analysis', 'pattern_detection', 'impact_quantification'],
    restrictions: ['observe_only', 'no_execution'],
  },
  {
    operatorId: 'risk',
    displayName: 'Risk Assessor',
    description: 'Classifies risk classes, applies governance rules, and determines required approval tier.',
    capabilities: ['risk_classification', 'policy_application', 'approval_routing'],
    restrictions: ['no_approval_authority', 'no_execution'],
  },
  {
    operatorId: 'proof',
    displayName: 'Proof Constructor',
    description: 'Constructs Proof Packets with evidence chain linkage. Validates proof integrity.',
    capabilities: ['proof_packet_generation', 'evidence_linkage', 'chain_validation'],
    restrictions: ['no_execution', 'requires_prior_approval'],
  },
  {
    operatorId: 'action',
    displayName: 'Action Brief Creator',
    description: 'Drafts structured Action Briefs backed by evidence. Submits for governance approval.',
    capabilities: ['action_brief_drafting', 'evidence_citation', 'approval_submission'],
    restrictions: ['no_execution', 'draft_only'],
  },
  {
    operatorId: 'verification',
    displayName: 'Verification Agent',
    description: 'Verifies post-execution outcomes against action briefs. Issues proof on success.',
    capabilities: ['execution_verification', 'outcome_comparison', 'proof_issuance'],
    restrictions: ['post_execution_only', 'no_new_actions'],
  },
  {
    operatorId: 'board-packet',
    displayName: 'Board Packet Generator',
    description: 'Synthesizes board-ready briefing packets from signals, outcomes, and proof.',
    capabilities: ['board_packet_generation', 'executive_synthesis', 'proof_aggregation'],
    restrictions: ['requires_executive_approval', 'read_only_inputs'],
  },
  {
    operatorId: 'connector',
    displayName: 'Connector',
    description: 'Manages connector health and validates MCP adapter state. Routes data between verticals.',
    capabilities: ['connector_health', 'mcp_adapter_validation', 'vertical_bridging'],
    restrictions: ['observe_only', 'no_data_mutation'],
  },
  {
    operatorId: 'evaluator',
    displayName: 'Evaluator',
    description: 'Runs MirrorEval against action briefs and PCE contracts. Blocks on poor disposition.',
    capabilities: ['mirror_eval_execution', 'disposition_routing', 'quality_gating'],
    restrictions: ['evaluation_only', 'no_execution'],
  },
  {
    operatorId: 'code',
    displayName: 'Code Auditor',
    description: 'Analyzes code quality and configuration drift. Reports findings only.',
    capabilities: ['code_audit', 'config_drift_detection', 'policy_compliance_check'],
    restrictions: ['read_only', 'no_code_modification'],
  },
];

export function getOperator(operatorId: OperatorId): BaseOperator {
  const factory = REGISTRY[operatorId];
  if (!factory) throw new Error(`Unknown operator: ${operatorId}`);
  return factory();
}

export function listOperators() {
  return OPERATOR_METADATA;
}

export function routeOperator(opts: {
  signalSeverity?: string;
  vertical?: string;
  riskLevel?: string;
  requiresApproval?: boolean;
}): OperatorId {
  if (opts.riskLevel === 'critical' || opts.signalSeverity === 'critical') return 'risk';
  if (opts.vertical === 'alloy-core') return 'connector';
  return 'planner';
}

export async function handoff(
  fromOperatorId: OperatorId,
  toOperatorId: OperatorId,
  ctx: Parameters<BaseOperator['run']>[0],
  previousOutput: Record<string, unknown>,
): Promise<import('../types.js').OperatorOutput> {
  const operator = getOperator(toOperatorId);
  const enrichedCtx = { ...ctx, input: { ...ctx.input, previousOutput, handoffFrom: fromOperatorId } };
  return operator.run(enrichedCtx);
}
