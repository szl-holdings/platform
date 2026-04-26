/**
 * Substrate MCP Gateway — Server Descriptor
 *
 * Defines the MCP server identity, capabilities, and every tool/resource/prompt
 * schema. All schemas are derived from the Zod definitions in @szl/substrate.
 */

export const GATEWAY_VERSION = '1.0.0' as const;

export const SERVER_INFO = {
  name: 'szl-substrate-mcp-gateway',
  version: GATEWAY_VERSION,
  description:
    'Sovereign Execution Substrate — MCP transport layer. ' +
    'Policy-shaped graphs, evidence-chained transitions, approval gating, and ' +
    'counterfactual replay for all SZL workflows.',
  protocolVersion: '2025-11-25',
} as const;

export const CAPABILITIES = {
  tools: { listChanged: true },
  resources: { subscribe: false, listChanged: false },
  prompts: { listChanged: false },
  logging: {},
  extensions: {
    'szl/governed-autonomy': { version: '1.0', description: 'Policy-gated approval gates and evidence-chain enforcement' },
    'szl/counterfactual-replay': { version: '1.0', description: 'Counterfactual run replay for governance audit' },
  },
} as const;

// ─── Tool Definitions ─────────────────────────────────────────────────────────

export interface McpToolDescriptor {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export const SUBSTRATE_TOOLS: McpToolDescriptor[] = [
  {
    name: 'substrate_submit_run',
    description:
      'Submit a workflow run to the Sovereign Execution Substrate. ' +
      'The run is enqueued and started immediately; the response contains the runId ' +
      'for subsequent status polls. All runs flow through the policy compiler, ' +
      'approval engine, and evidence/audit chain. ' +
      'Returns: { runId, status, workflowId, traceId }',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'ID of a registered workflow (from substrate_list_workflows)',
        },
        input: {
          type: 'object',
          description: 'Workflow-specific input payload (arbitrary JSON object)',
        },
        mode: {
          type: 'string',
          enum: ['live', 'dry-run'],
          description:
            "Execution mode. 'live' runs against real adapters; " +
            "'dry-run' executes the graph but skips side effects. Default: live",
        },
        metadata: {
          type: 'object',
          description: 'Optional caller-supplied key/value metadata attached to the run',
        },
      },
      required: ['workflowId', 'input'],
      additionalProperties: false,
    },
  },

  {
    name: 'substrate_get_run',
    description:
      'Retrieve the current state of a substrate run by ID. ' +
      'Includes status, stage results, current stage, confidence scores, ' +
      'and the evidence bundle. Poll this to track run progress or detect ' +
      'pending-approval states where human action is required.',
    inputSchema: {
      type: 'object',
      properties: {
        runId: {
          type: 'string',
          description: 'UUID of the run returned by substrate_submit_run',
        },
      },
      required: ['runId'],
      additionalProperties: false,
    },
  },

  {
    name: 'substrate_replay',
    description:
      'Replay a completed substrate run from its journal. ' +
      'Skips stages already completed in the source run; re-executes subsequent ' +
      'stages with identical inputs to verify determinism. ' +
      'Returns a new PipelineRun with replaySourceRunId set.',
    inputSchema: {
      type: 'object',
      properties: {
        runId: {
          type: 'string',
          description: 'ID of the completed run to replay',
        },
        workflowId: {
          type: 'string',
          description:
            'Workflow definition ID to replay against. ' +
            "Must match the original run's workflow.",
        },
      },
      required: ['runId', 'workflowId'],
      additionalProperties: false,
    },
  },

  {
    name: 'substrate_counterfactual',
    description:
      'Run a counterfactual replay of a completed run with model and/or policy substitution. ' +
      'Produces a decision diff showing which stages changed outcome, ' +
      'the final confidence delta, and whether the overall outcome changed. ' +
      'Used for eval harnesses, offline analysis, and governance audit.',
    inputSchema: {
      type: 'object',
      properties: {
        runId: {
          type: 'string',
          description: 'ID of the completed baseline run',
        },
        workflowId: {
          type: 'string',
          description: 'Workflow definition ID to replay against',
        },
        modelAdapterId: {
          type: 'string',
          description:
            "Substitute model adapter ID (e.g. 'gpt-4o-mini' vs 'gpt-4o'). " +
            'Omit to keep original model.',
        },
        policyId: {
          type: 'string',
          description:
            'Substitute policy ID from the policy-engine registry. ' +
            'Omit to keep original policy profile.',
        },
      },
      required: ['runId', 'workflowId'],
      additionalProperties: false,
    },
  },

  {
    name: 'substrate_list_approvals',
    description:
      'List pending approval actions in the approvals inbox. ' +
      "Runs that reach an ApprovalGate stage pause with status 'pending-approval' " +
      'and surface here. Resolving an approval via substrate_approve or ' +
      'substrate_reject resumes the run.',
    inputSchema: {
      type: 'object',
      properties: {
        verdict: {
          type: 'string',
          enum: ['approved', 'rejected', 'escalated'],
          description: 'Filter by verdict. Omit to return all entries including pending.',
        },
        domain: {
          type: 'string',
          description: "Filter by domain (e.g. 'lyte', 'terra', 'vessels')",
        },
      },
      additionalProperties: false,
    },
  },

  {
    name: 'substrate_approve',
    description:
      'Approve a pending substrate run at its ApprovalGate. ' +
      'Records the approval in the approvals inbox with full provenance ' +
      '(actor, timestamp, proof ref). The run then resumes execution ' +
      'from the stage after the gate.',
    inputSchema: {
      type: 'object',
      properties: {
        recommendationId: {
          type: 'string',
          description: 'The recommendationId / runId of the pending approval',
        },
        actor: {
          type: 'string',
          description: 'Human actor name or system ID performing the approval',
        },
        note: {
          type: 'string',
          description: 'Optional rationale note recorded in the proof entry',
        },
        domain: {
          type: 'string',
          description: "Domain tag for this approval (e.g. 'lyte', 'vessels')",
        },
      },
      required: ['recommendationId'],
      additionalProperties: false,
    },
  },

  {
    name: 'substrate_reject',
    description:
      'Reject a pending substrate run at its ApprovalGate. ' +
      'Records the rejection in the approvals inbox. The run is terminated ' +
      "with status 'failed' and the rejection reason is written to the evidence chain.",
    inputSchema: {
      type: 'object',
      properties: {
        recommendationId: {
          type: 'string',
          description: 'The recommendationId / runId of the pending approval',
        },
        actor: {
          type: 'string',
          description: 'Human actor name or system ID performing the rejection',
        },
        note: {
          type: 'string',
          description: 'Required rejection rationale recorded in the proof entry',
        },
        domain: {
          type: 'string',
          description: 'Domain tag for this rejection',
        },
      },
      required: ['recommendationId', 'note'],
      additionalProperties: false,
    },
  },

  {
    name: 'substrate_list_workflows',
    description:
      'List all workflows registered in the Substrate runtime. ' +
      'Returns workflow IDs, names, stage counts, and policy profiles. ' +
      'Use these IDs with substrate_submit_run.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },

  {
    name: 'search_available_servers',
    description:
      'Search available MCP server endpoints by natural-language query. ' +
      'Returns server IDs, names, capability summaries, and current connection status. ' +
      'Use enable_server to establish a connection on demand.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural-language search terms (e.g. "document retrieval", "finance tools")',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 10)',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },

  {
    name: 'enable_server',
    description:
      'Establish an on-demand connection to an MCP server and surface its tools. ' +
      'Lazy — only connects when called. ' +
      'Use search_available_servers to find available server IDs. ' +
      'After a successful connection, call tools/list to discover the newly added tools.',
    inputSchema: {
      type: 'object',
      properties: {
        serverId: {
          type: 'string',
          description: 'Server ID returned by search_available_servers',
        },
      },
      required: ['serverId'],
      additionalProperties: false,
    },
  },

  {
    name: 'disable_server',
    description:
      'Disconnect from an MCP server and remove its tools from the active set. ' +
      'Use when a server is no longer needed for the current task to free context allocation.',
    inputSchema: {
      type: 'object',
      properties: {
        serverId: {
          type: 'string',
          description: 'Server ID to disconnect',
        },
      },
      required: ['serverId'],
      additionalProperties: false,
    },
  },
];

// ─── Resource Definitions ─────────────────────────────────────────────────────

export interface McpResourceDescriptor {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const SUBSTRATE_RESOURCES: McpResourceDescriptor[] = [
  {
    uri: 'substrate://schema/run',
    name: 'Substrate Run Schema',
    description:
      'JSON Schema for a PipelineRun — the full state object returned by substrate_get_run. ' +
      'Includes status, stageResults, evidence bundles, and confidence metadata.',
    mimeType: 'application/schema+json',
  },
  {
    uri: 'substrate://schema/stage-result',
    name: 'Substrate Stage Result Schema',
    description:
      'JSON Schema for a StageResult — individual stage execution record ' +
      'within a PipelineRun.',
    mimeType: 'application/schema+json',
  },
  {
    uri: 'substrate://schema/counterfactual-diff',
    name: 'Counterfactual Diff Schema',
    description:
      'JSON Schema for a CounterfactualDiff — produced by substrate_counterfactual. ' +
      'Contains per-stage diffs, final confidence delta, and outcome change flag.',
    mimeType: 'application/schema+json',
  },
  {
    uri: 'substrate://policy/active',
    name: 'Active Policy Profiles',
    description:
      'Current list of policy profiles registered in the Substrate policy adapter. ' +
      'Each entry includes the policy ID, name, high-risk categories, ' +
      'and minimum approval tier.',
    mimeType: 'application/json',
  },
];

// ─── Prompt Definitions ───────────────────────────────────────────────────────

export interface McpPromptDescriptor {
  name: string;
  description: string;
  arguments?: Array<{ name: string; description: string; required?: boolean }>;
}

export const SUBSTRATE_PROMPTS: McpPromptDescriptor[] = [
  {
    name: 'substrate_run_summary',
    description:
      'Generate a human-readable summary of a completed substrate run, ' +
      'including the key decision made, confidence scores, and any approval gates triggered.',
    arguments: [{ name: 'runId', description: 'ID of the run to summarise', required: true }],
  },
  {
    name: 'substrate_counterfactual_analysis',
    description:
      'Interpret a counterfactual diff and explain which model or policy substitution ' +
      'caused the outcome to change.',
    arguments: [
      {
        name: 'diffJson',
        description: 'JSON string of the CounterfactualDiff object',
        required: true,
      },
    ],
  },
];
