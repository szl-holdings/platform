import {
  alloyRuntimeAgentsTable,
  alloyRuntimeAgentVersionsTable,
  db,
  organizationsTable,
} from '@szl-holdings/db';
import { sql } from 'drizzle-orm';

async function ensureDemoOrgExists() {
  await db
    .insert(organizationsTable)
    .values({
      id: 1,
      name: 'SZL Holdings (Demo)',
      slug: 'szl-holdings-demo',
      orgType: 'internal',
      plan: 'enterprise',
    })
    .onConflictDoNothing({ target: organizationsTable.id });
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('organizations', 'id'), GREATEST((SELECT MAX(id) FROM organizations), 1))`,
  );
}

const AEGIS_AGENTS = [
  {
    agentId: 'aegis-sentinel',
    name: 'Sentinel',
    description:
      'Real-time cyber threat detection and incident triage agent. Continuously monitors telemetry streams, correlates SIEM events, and escalates high-confidence threats to the SOC.',
    domain: 'cybersecurity',
    policyTier: 'tier-1-critical',
    defaultModel: 'anthropic/claude-sonnet-4-5',
    capabilities: ['threat-detection', 'siem-correlation', 'incident-triage', 'alert-scoring'],
    toolAccess: ['firestorm-alerts', 'mitre-lookup', 'asset-registry', 'soar-playbooks'],
    maxCostPerRunUsd: '0.50',
    isActive: true,
    metadata: {
      version: '3.2.1',
      confidenceBaseline: 0.94,
      framework: 'MITRE ATT&CK v14',
      lastAudit: '2026-03-15',
      deployedRegions: ['us-east-1', 'eu-west-1'],
    },
    version: '3.2.1',
    changelog:
      'Upgraded to Claude Sonnet 4.5. Improved lateral movement detection precision by 18%.',
  },
  {
    agentId: 'aegis-quipu',
    name: 'Quipu',
    description:
      'Structured intelligence record-keeping and evidence chain agent. Maintains tamper-evident audit trails for all AI-generated decisions, evidence collections, and case linkages across Aegis.',
    domain: 'intelligence',
    policyTier: 'tier-2-sensitive',
    defaultModel: 'anthropic/claude-sonnet-4-5',
    capabilities: ['evidence-chain', 'audit-trail', 'case-linkage', 'structured-recall'],
    toolAccess: ['audit-log', 'case-memory', 'vector-store', 'evidence-index'],
    maxCostPerRunUsd: '0.25',
    isActive: true,
    metadata: {
      version: '2.4.0',
      confidenceBaseline: 0.98,
      storageBackend: 'pgvector',
      retentionPolicy: 'immutable-7yr',
      lastAudit: '2026-04-01',
    },
    version: '2.4.0',
    changelog:
      'Added pgvector semantic recall. Evidence index latency reduced from 840ms to 120ms.',
  },
  {
    agentId: 'aegis-willaq-umu',
    name: 'Willaq-Umu',
    description:
      'Predictive oracle agent for threat forecasting and adversary behaviour modelling. Synthesises open-source intelligence, STIX feeds, and historical campaign data to generate probabilistic attack projections.',
    domain: 'threat-intelligence',
    policyTier: 'tier-2-sensitive',
    defaultModel: 'anthropic/claude-opus-4-5',
    capabilities: [
      'threat-forecasting',
      'adversary-modelling',
      'stix-synthesis',
      'campaign-attribution',
    ],
    toolAccess: ['taxii-feeds', 'stix-objects', 'mitre-coverage', 'historical-campaigns'],
    maxCostPerRunUsd: '1.20',
    isActive: true,
    metadata: {
      version: '1.8.3',
      confidenceBaseline: 0.87,
      forecastHorizonDays: 30,
      attributionModels: ['apt29', 'lazarus', 'sandworm'],
      lastAudit: '2026-02-28',
    },
    version: '1.8.3',
    changelog:
      'Added Sandworm attribution model. Forecast horizon extended to 30 days. Claude Opus upgrade.',
  },
  {
    agentId: 'aegis-dual-mind',
    name: 'Dual-Mind',
    description:
      'Dual-mode decision orchestration agent that operates both autonomously (fast-path) and under human-in-the-loop oversight (deliberate-path) depending on threat severity and policy tier. Routes decisions to the appropriate execution mode.',
    domain: 'decision-orchestration',
    policyTier: 'tier-1-critical',
    defaultModel: 'anthropic/claude-sonnet-4-5',
    capabilities: [
      'mode-switching',
      'approval-routing',
      'policy-evaluation',
      'human-in-the-loop',
    ],
    toolAccess: ['alloy-approvals', 'policy-engine', 'workflow-router', 'audit-log'],
    maxCostPerRunUsd: '0.40',
    isActive: true,
    metadata: {
      version: '2.1.0',
      confidenceBaseline: 0.91,
      autonomousThreshold: 0.95,
      humanReviewThreshold: 0.75,
      lastAudit: '2026-03-22',
    },
    version: '2.1.0',
    changelog:
      'Introduced adaptive threshold tuning. Autonomous path approval latency cut to < 200ms.',
  },
  {
    agentId: 'aegis-chasqui',
    name: 'Chasqui',
    description:
      'High-speed intelligence relay and inter-agent messaging agent. Ensures reliable, ordered delivery of signals, alerts, and decision payloads between Aegis sub-agents and external platform connectors.',
    domain: 'communications',
    policyTier: 'internal-workflow',
    defaultModel: 'openai/gpt-4o-mini',
    capabilities: ['signal-relay', 'message-ordering', 'retry-logic', 'connector-bridge'],
    toolAccess: ['pubsub-bridge', 'websocket-broadcast', 'alloy-signals', 'connector-registry'],
    maxCostPerRunUsd: '0.05',
    isActive: true,
    metadata: {
      version: '1.5.2',
      confidenceBaseline: 0.99,
      maxThroughputMsgSec: 5000,
      deliveryGuarantee: 'at-least-once',
      lastAudit: '2026-04-10',
    },
    version: '1.5.2',
    changelog: 'Switched to GPT-4o Mini for routing classification. Throughput increased 3×.',
  },
  {
    agentId: 'aegis-nexus',
    name: 'Praxis',
    description:
      'Unified agentic integration layer that bridges Aegis with all external SZL platform services (Terra, Vessels, Counsel, Pulse). Manages cross-domain context propagation and shared knowledge graphs.',
    domain: 'integration',
    policyTier: 'tier-2-sensitive',
    defaultModel: 'anthropic/claude-sonnet-4-5',
    capabilities: [
      'cross-domain-context',
      'knowledge-graph-sync',
      'api-federation',
      'semantic-routing',
    ],
    toolAccess: ['constellation-graph', 'cross-domain-registry', 'api-gateway', 'context-store'],
    maxCostPerRunUsd: '0.60',
    isActive: true,
    metadata: {
      version: '4.0.1',
      confidenceBaseline: 0.92,
      connectedDomains: ['terra', 'vessels', 'counsel', 'pulse', 'command'],
      graphNodes: 142800,
      lastAudit: '2026-04-12',
    },
    version: '4.0.1',
    changelog:
      'Graph now covers 142,800 nodes across 5 domains. Added semantic routing for ambiguous queries.',
  },
  {
    agentId: 'aegis-inca-lab',
    name: 'AI Research Lab',
    description:
      'Experimental research and red-team simulation agent. Runs adversarial simulations, tabletop exercises, and novel technique evaluations in a sandboxed environment to stress-test Aegis defences.',
    domain: 'research',
    policyTier: 'sandboxed-research',
    defaultModel: 'anthropic/claude-opus-4-5',
    capabilities: [
      'red-team-simulation',
      'tabletop-exercise',
      'novel-technique-eval',
      'sandbox-execution',
    ],
    toolAccess: ['simulation-runtime', 'sandbox-env', 'scenario-library', 'firestorm-scenarios'],
    maxCostPerRunUsd: '2.00',
    isActive: true,
    metadata: {
      version: '0.9.4',
      confidenceBaseline: 0.82,
      sandboxIsolation: 'full',
      allowedInProduction: false,
      activeExperiments: 3,
      lastAudit: '2026-03-30',
    },
    version: '0.9.4',
    changelog:
      'Beta: added tabletop exercise generator. Sandbox isolation hardened to prevent leakage.',
  },
];

export async function seedAlloyRuntimeAgents() {

  await ensureDemoOrgExists();

  const ORG_ID = 1;

  let inserted = 0;
  let skippedAgents = 0;

  for (const agent of AEGIS_AGENTS) {
    const { version, changelog, ...agentFields } = agent;

    const result = await db
      .insert(alloyRuntimeAgentsTable)
      .values({ ...agentFields, orgId: ORG_ID })
      .onConflictDoNothing({ target: alloyRuntimeAgentsTable.agentId })
      .returning({ agentId: alloyRuntimeAgentsTable.agentId });

    if (result.length > 0) {
      inserted++;
      await db
        .insert(alloyRuntimeAgentVersionsTable)
        .values({
          agentId: agent.agentId,
          version,
          changelog,
          snapshot: {
            name: agentFields.name,
            domain: agentFields.domain,
            policyTier: agentFields.policyTier,
            defaultModel: agentFields.defaultModel,
            capabilities: agentFields.capabilities,
            toolAccess: agentFields.toolAccess,
            metadata: agentFields.metadata,
          },
          isDeployed: true,
          deployedAt: new Date(),
        })
        .onConflictDoNothing();
    } else {
      skippedAgents++;
    }
  }
  return { inserted, skipped: skippedAgents };
}

async function main() {
  const _result = await seedAlloyRuntimeAgents();
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((_err) => {
    process.exit(1);
  });
}
