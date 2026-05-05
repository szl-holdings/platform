/**
 * Seed routing weights for A11oy operator-tunable routing policy.
 *
 * Each entry is a single dimension on the routing-policy hypercube
 * (model tier × agent class × tool family × vertical). The weight is the
 * operator-tunable scalar in [0, 1]; the runtime stamps `seed`, `updatedBy`,
 * `updatedAt` when initializing the in-memory store.
 *
 * Dimensions are aligned with the model tiers shown in
 * artifacts/a11oy/src/pages/ModelRouter.tsx (fast_triage, deep_reasoning,
 * long_context, code_analysis, document_analysis, eval_judge,
 * board_packet, proof_reconstruction) and the verticals exposed in
 * artifacts/a11oy/src/pages/Fabric.tsx.
 */

export interface RoutingWeightSeed {
  dimension: string;
  category: string;
  label: string;
  weight: number;
}

export const SEED_ROUTING_WEIGHTS: RoutingWeightSeed[] = [
  { dimension: 'model:fast_triage',          category: 'Model Tier',  label: 'Fast Triage (sub-500ms)',    weight: 0.85 },
  { dimension: 'model:deep_reasoning',       category: 'Model Tier',  label: 'Deep Reasoning',             weight: 0.78 },
  { dimension: 'model:long_context',         category: 'Model Tier',  label: 'Long Context (>64k)',        weight: 0.62 },
  { dimension: 'model:code_analysis',        category: 'Model Tier',  label: 'Code Analysis',              weight: 0.55 },
  { dimension: 'model:document_analysis',    category: 'Model Tier',  label: 'Document Analysis',          weight: 0.60 },
  { dimension: 'model:eval_judge',           category: 'Model Tier',  label: 'Eval Judge (deterministic)', weight: 0.95 },
  { dimension: 'model:board_packet',         category: 'Model Tier',  label: 'Board Packet Synthesis',     weight: 0.50 },
  { dimension: 'model:proof_reconstruction', category: 'Model Tier',  label: 'Proof Reconstruction',       weight: 0.70 },

  { dimension: 'agent:auto',                 category: 'Agent Class', label: 'Auto (no human)',            weight: 0.30 },
  { dimension: 'agent:operator',             category: 'Agent Class', label: 'Operator-tier',              weight: 0.55 },
  { dimension: 'agent:executive',            category: 'Agent Class', label: 'Executive-tier',             weight: 0.75 },
  { dimension: 'agent:board',                category: 'Agent Class', label: 'Board-tier',                 weight: 0.90 },

  { dimension: 'tool:mesh',                  category: 'Tool Family', label: 'Tool Mesh',                  weight: 0.65 },
  { dimension: 'tool:connector',             category: 'Tool Family', label: 'Connector Hub',              weight: 0.55 },
  { dimension: 'tool:mcp',                   category: 'Tool Family', label: 'MCP Gateway',                weight: 0.50 },

  { dimension: 'vertical:lyte-revenue',      category: 'Vertical',    label: 'Lyte Revenue',               weight: 0.60 },
  { dimension: 'vertical:vessels-maritime',  category: 'Vertical',    label: 'Vessels Maritime',           weight: 0.70 },
  { dimension: 'vertical:terra-real-estate', category: 'Vertical',    label: 'Terra Real Estate',          weight: 0.65 },
  { dimension: 'vertical:aegis-defense',     category: 'Vertical',    label: 'Aegis Defense',              weight: 0.80 },
  { dimension: 'vertical:prism-counsel',     category: 'Vertical',    label: 'Prism Counsel',              weight: 0.75 },
  { dimension: 'vertical:carlota-jo',        category: 'Vertical',    label: 'Carlota Jo',                 weight: 0.45 },
  { dimension: 'vertical:alloy-core',        category: 'Vertical',    label: 'Alloy Core',                 weight: 0.50 },
];
