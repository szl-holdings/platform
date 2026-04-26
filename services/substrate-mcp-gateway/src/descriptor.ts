/**
 * Substrate MCP Gateway — Server Descriptor
 *
 * Defines the MCP server identity, capabilities, and every tool/resource/prompt
 * schema. All schemas are derived from the Zod definitions in @szl/substrate.
 */

export const GATEWAY_VERSION = '1.1.0' as const;

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
  resources: { subscribe: true, listChanged: true },
  prompts: { listChanged: false },
  logging: {},
  extensions: {
    'szl/governed-autonomy': { version: '1.0', description: 'Policy-gated approval gates and evidence-chain enforcement' },
    'szl/counterfactual-replay': { version: '1.0', description: 'Counterfactual run replay for governance audit' },
    'szl/praxis-consciousness': { version: '1.0', description: 'Every MCP response includes x-nexus-consciousness metacognitive metadata and x-nexus-proof cryptographic envelope' },
    'szl/praxis-convergence': { version: '1.0', description: 'Cross-domain intelligence convergence engine available as MCP Resources' },
    'szl/praxis-federation': { version: '1.0', description: 'NuroMesh domain agents discoverable and delegatable via MCP' },
    'mcp/apps': { version: '1.0', description: 'Interactive HTML micro-dashboards served as ui:// resources with postMessage JSON-RPC' },
    'io.modelcontextprotocol/enterprise-managed-authorization': {
      version: '1.0',
      description: 'Enterprise IdP-governed MCP access via ID-JAG (urn:ietf:params:oauth:grant-type:jwt-bearer). ' +
        'Employees authenticate once with corporate SSO; IdP-issued JWTs are exchanged for scoped MCP access tokens. ' +
        'Supports centralized revocation, claims-to-RBAC mapping, and full audit trail.',
      tokenEndpoint: '/mcp/token',
      grantTypesSupported: ['urn:ietf:params:oauth:grant-type:jwt-bearer', 'authorization_code'],
      metadataEndpoint: '/.well-known/oauth-authorization-server',
    },
  },
} as const;

// ─── Tool Definitions ─────────────────────────────────────────────────────────

export interface McpToolUiMeta {
  resourceUri: string;
  csp?: string;
  permissions?: string[];
}

export interface McpToolDescriptor {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  _meta?: {
    ui?: McpToolUiMeta;
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
    _meta: {
      ui: {
        resourceUri: 'ui://szl/metrics',
        csp: "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; frame-ancestors 'none'",
      },
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
    _meta: {
      ui: {
        resourceUri: 'ui://szl/timeline',
        csp: "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; frame-ancestors 'none'",
      },
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
    _meta: {
      ui: {
        resourceUri: 'ui://szl/chart',
        csp: "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; frame-ancestors 'none'",
      },
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
    _meta: {
      ui: {
        resourceUri: 'ui://szl/approval-form',
        csp: "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; frame-ancestors 'none'",
        permissions: ['tools/call'],
      },
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
    _meta: {
      ui: {
        resourceUri: 'ui://szl/data-table',
        csp: "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; frame-ancestors 'none'",
      },
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

  {
    name: 'agent_delegate',
    description:
      'Delegate a specialized task to a NuroMesh domain agent via the PRAXIS Intelligence Fabric. ' +
      'Routes the task through the full governance stack: policy check, approval gate (if required), ' +
      'consciousness assessment, and proof-chain entry. ' +
      'Use nexus://agents/registry to discover available agents and their capabilities. ' +
      'Returns: { taskId, targetAgent, domain, status, response, confidence, latencyMs, proofHash }',
    inputSchema: {
      type: 'object',
      properties: {
        targetAgentId: {
          type: 'string',
          description:
            'Agent ID or canonical name from nexus://agents/registry ' +
            "(e.g. 'helmsman' / 'SEXTANT', 'sentinel' / 'TENAX', 'terra' / 'DOMAINE', 'lexis' / 'Counsel')",
        },
        taskDescription: {
          type: 'string',
          description: 'Natural-language description of the task to delegate to the agent',
        },
        context: {
          type: 'object',
          description: 'Structured context parameters to pass to the agent (arbitrary JSON object)',
        },
        urgency: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description:
            "Task urgency level. 'critical' bypasses standard queuing; " +
            "'high' engages priority routing through NuroMesh. Default: medium",
        },
      },
      required: ['targetAgentId', 'taskDescription'],
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

export const UI_RESOURCES: McpResourceDescriptor[] = [
  {
    uri: 'ui://szl/data-table',
    name: 'SZL Data Table Explorer',
    description: 'Interactive data table with sorting, text filtering, pagination, and CSV export. Rendered inline by MCP hosts that support the Apps extension.',
    mimeType: 'text/html',
  },
  {
    uri: 'ui://szl/chart',
    name: 'SZL Chart Visualizer',
    description: 'Chart renderer for line, bar, pie, area, scatter, and donut charts. Communicates via postMessage JSON-RPC.',
    mimeType: 'text/html',
  },
  {
    uri: 'ui://szl/approval-form',
    name: 'SZL Approval Workflow Form',
    description: 'Governed approval/rejection form. Calls substrate_approve or substrate_reject via the MCP tools/call bridge when the operator submits.',
    mimeType: 'text/html',
  },
  {
    uri: 'ui://szl/metrics',
    name: 'SZL Metric Dashboard',
    description: 'KPI card grid with trend indicators, severity coloring, and real-time metric display.',
    mimeType: 'text/html',
  },
  {
    uri: 'ui://szl/timeline',
    name: 'SZL Timeline / Audit Trail',
    description: 'Chronological event trail with severity badges, actor attribution, and expandable metadata panels.',
    mimeType: 'text/html',
  },
];

export const SUBSTRATE_RESOURCES: McpResourceDescriptor[] = [
  ...UI_RESOURCES,
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

  // ─── NEXUS Intelligence Fabric Resources ─────────────────────────────────────

  {
    uri: 'nexus://convergence/active',
    name: 'PRAXIS Active Convergence Correlations',
    description:
      'Currently live cross-domain intelligence correlations from the PRAXIS Convergence Engine. ' +
      'Each entry spans multiple domains (maritime, security, real estate, legal) and includes ' +
      'the compound risk score, contributing signal domains, and recommended actions. ' +
      'Surfaces compound risk spanning all SZL domains simultaneously for cross-domain threat assessment.',
    mimeType: 'application/json',
  },
  {
    uri: 'nexus://convergence/history',
    name: 'PRAXIS Convergence History',
    description:
      'Recent convergence events with resolution status. Shows how cross-domain correlations ' +
      'were detected, escalated, and resolved. Includes resolved and active entries.',
    mimeType: 'application/json',
  },
  {
    uri: 'nexus://convergence/{id}',
    name: 'PRAXIS Convergence Correlation Detail',
    description:
      'Full signal decomposition for a specific convergence correlation by ID. ' +
      'Includes contributing domain signals, compound risk breakdown, ' +
      'and the evidence chain used to derive the correlation.',
    mimeType: 'application/json',
  },

  {
    uri: 'nexus://signals/maritime',
    name: 'PRAXIS Maritime Signal Stream',
    description:
      'Real-time maritime domain intelligence signals from the Prism Bus. ' +
      'Each signal includes intake score, entity resolution, policy evaluation result, ' +
      'and recommendation (if above threshold). Respects tenant isolation.',
    mimeType: 'application/json',
  },
  {
    uri: 'nexus://signals/security',
    name: 'PRAXIS Security Signal Stream',
    description:
      'Real-time cybersecurity intelligence signals from the Prism Bus. ' +
      'Includes threat triage results, CVE signals, and incident alerts with full pipeline metadata.',
    mimeType: 'application/json',
  },
  {
    uri: 'nexus://signals/realestate',
    name: 'PRAXIS Real Estate Signal Stream',
    description:
      'Real-time real estate market signals from the Prism Bus. ' +
      'Includes portfolio anomalies, valuation alerts, and deal pipeline signals.',
    mimeType: 'application/json',
  },
  {
    uri: 'nexus://signals/legal',
    name: 'PRAXIS Legal Signal Stream',
    description:
      'Real-time legal and compliance signals from the Prism Bus. ' +
      'Includes regulatory deadlines, Counsel matter alerts, and compliance risks.',
    mimeType: 'application/json',
  },
  {
    uri: 'nexus://signals/all',
    name: 'PRAXIS Aggregate Signal Stream',
    description:
      'Aggregate real-time signal stream across all SZL domains (maritime, security, real estate, legal). ' +
      'The broadest signal surface available over MCP — receive intelligence from all domains simultaneously.',
    mimeType: 'application/json',
  },
  {
    uri: 'nexus://signals/{domain}/{tenantId}',
    name: 'PRAXIS Tenant-Scoped Signal Channel',
    description:
      'Per-tenant subscription channel for domain signal updates. ' +
      'Subscribe to nexus://signals/{domain}/{tenantId} to receive notifications ONLY for your tenant\'s events. ' +
      'The convergence bridge emits on this URI when a Prism Bus event carries a matching tenantId, ' +
      'eliminating cross-tenant timing and volume leakage from shared global notification channels.',
    mimeType: 'application/json',
  },

  {
    uri: 'nexus://agents/registry',
    name: 'PRAXIS NuroMesh Agent Registry',
    description:
      'Discoverable registry of NuroMesh domain agents available for delegation via the agent_delegate tool. ' +
      'Each entry includes canonical agent name, domain specializations, capabilities, ' +
      'confidence profiles, and supported delegation protocols. ' +
      'This makes SZL the first MCP deployment with a governed multi-agent mesh discoverable over MCP.',
    mimeType: 'application/json',
  },

  {
    uri: 'nexus://evidence/graph',
    name: 'PRAXIS Evidence Graph',
    description:
      'Current evidence items with provenance chains and confidence scores. ' +
      'Shows the raw intelligence items that underpin AI recommendations — ' +
      'from sensor intake through enrichment, scoring, and policy evaluation.',
    mimeType: 'application/json',
  },
  {
    uri: 'nexus://evidence/recommendations',
    name: 'PRAXIS Evidence Recommendations',
    description:
      'Active AI recommendations with their supporting evidence chains and policy evaluation status. ' +
      'Each recommendation includes confidence score, supporting evidence IDs, ' +
      'and whether approval is required before execution.',
    mimeType: 'application/json',
  },
  {
    uri: 'nexus://evidence/trace/{id}',
    name: 'PRAXIS Decision Trace',
    description:
      'Full provenance trace for a specific AI decision, showing every stage from raw signal ' +
      'through enrichment, scoring, recommendation, policy evaluation, and final outcome. ' +
      'External auditors can use this with a traceId to independently verify any AI decision.',
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
