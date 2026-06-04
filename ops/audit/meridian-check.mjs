#!/usr/bin/env node
/**
 * Alloy Meridian — Audit Check Script
 *
 * Validates the Meridian layer by querying all major endpoints and
 * checking that key invariants hold. Run against a live API server.
 *
 * Usage:
 *   node ops/audit/meridian-check.mjs [--base-url <url>]
 *
 * Environment:
 *   MERIDIAN_CHECK_BASE_URL — override base URL (default: http://localhost:3000)
 */

import { setTimeout } from 'node:timers/promises';

const BASE_URL = process.env.MERIDIAN_CHECK_BASE_URL
  || process.argv.find((_, i, a) => a[i - 1] === '--base-url')
  || 'http://localhost:3000';

const API = `${BASE_URL}/api`;
let passed = 0;
let failed = 0;
const failures = [];

function pass(label) {
  process.stdout.write(`  ✓ ${label}\n`);
  passed++;
}

function fail(label, reason) {
  process.stderr.write(`  ✗ ${label}: ${reason}\n`);
  failed++;
  failures.push({ label, reason });
}

async function get(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function check(label, fn) {
  try {
    await fn();
    pass(label);
  } catch (err) {
    fail(label, err.message);
  }
}

console.log(`\n⚡ Alloy Meridian Audit Check`);
console.log(`   Base URL: ${BASE_URL}\n`);

// ── Status ────────────────────────────────────────────────────────────────────
console.log('📊 Status & Model Router');

await check('GET /meridian/status responds', async () => {
  const r = await get('/meridian/status');
  if (!r.data && !r.layer) throw new Error('Unexpected response shape');
});

await check('Model router returns 8 lanes', async () => {
  const r = await get('/meridian/model-router');
  const d = r.data ?? r;
  const lanes = d.lanes ?? [];
  if (lanes.length !== 8) throw new Error(`Expected 8 lanes, got ${lanes.length}`);
});

await check('Model router status snapshot has all lanes', async () => {
  const r = await get('/meridian/model-router');
  const d = r.data ?? r;
  const statuses = d.status ?? [];
  if (statuses.length !== 8) throw new Error(`Expected 8 status entries, got ${statuses.length}`);
});

await check('Route a strategy lane request', async () => {
  const r = await post('/meridian/model-router/route', { lane: 'strategy' });
  const d = r.data ?? r;
  if (!d.selectedModel) throw new Error('No selectedModel in routing decision');
  if (d.lane !== 'strategy') throw new Error('Wrong lane returned');
});

await check('Route a forecasting lane request', async () => {
  const r = await post('/meridian/model-router/route', { lane: 'forecasting' });
  const d = r.data ?? r;
  if (!d.selectedModel) throw new Error('No selectedModel');
});

await check('Unknown lane returns 400', async () => {
  const res = await fetch(`${API}/meridian/model-router/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lane: 'unknown-lane-xyz' }),
  });
  if (res.ok) throw new Error('Expected 4xx for unknown lane');
});

// ── Agents ────────────────────────────────────────────────────────────────────
console.log('\n🤖 Agent Constellation');

await check('GET /meridian/agents returns 7 agents', async () => {
  const r = await get('/meridian/agents');
  const d = r.data ?? r;
  if ((d.total ?? d.agents?.length) !== 7) throw new Error(`Expected 7 agents, got ${d.total ?? d.agents?.length}`);
});

const AGENT_IDS = [
  'signal-cartographer',
  'forecast-council',
  'deepseek-strategist',
  'operator-swarm',
  'voice-of-business',
  'brand-imagination-engine',
  'governance-sentinel',
];

for (const agentId of AGENT_IDS) {
  await check(`Agent ${agentId} exists and is healthy`, async () => {
    const r = await get(`/meridian/agents/${agentId}`);
    const d = r.data ?? r;
    if (!d.id) throw new Error('No id in agent response');
    if (!d.systemPrompt) throw new Error('Missing systemPrompt');
    if (!d.capabilities || d.capabilities.length === 0) throw new Error('No capabilities');
  });
}

await check('Unknown agent returns 404', async () => {
  const res = await fetch(`${API}/meridian/agents/nonexistent-agent-xyz`);
  if (res.ok) throw new Error('Expected 404 for unknown agent');
});

// ── Forecast Council ─────────────────────────────────────────────────────────
console.log('\n📈 Forecast Council & Tournament');

await check('GET /meridian/forecast returns global rankings', async () => {
  const r = await get('/meridian/forecast');
  const d = r.data ?? r;
  if (!d.globalRankings || d.globalRankings.length === 0) throw new Error('No global rankings');
  if (!d.sessions || d.sessions.length === 0) throw new Error('No sessions');
});

await check('Forecast sessions cover all 8 business metrics', async () => {
  const r = await get('/meridian/forecast');
  const d = r.data ?? r;
  const metrics = new Set((d.sessions ?? []).map(s => s.metric));
  const expectedMetrics = [
    'revenue_pipeline_velocity', 'delivery_risk', 'incident_likelihood',
    'customer_demand', 'cash_runway', 'engineering_throughput',
    'market_timing', 'platform_adoption',
  ];
  for (const m of expectedMetrics) {
    if (!metrics.has(m)) throw new Error(`Missing metric: ${m}`);
  }
});

await check('GET /meridian/forecast/revenue_pipeline_velocity returns valid session', async () => {
  const r = await get('/meridian/forecast/revenue_pipeline_velocity');
  const d = r.data ?? r;
  if (!d.winner) throw new Error('No winner in session');
  if (!d.rankings || d.rankings.length === 0) throw new Error('No rankings');
  if (!d.results || d.results.length === 0) throw new Error('No results');
});

await check('Forecast results include uncertainty bands', async () => {
  const r = await get('/meridian/forecast/cash_runway');
  const d = r.data ?? r;
  const firstPoint = d.results?.[0]?.points?.[0];
  if (!firstPoint) throw new Error('No forecast points');
  if (firstPoint.lower80 === undefined) throw new Error('Missing lower80 band');
  if (firstPoint.upper95 === undefined) throw new Error('Missing upper95 band');
});

// ── Signal Graph & Debt ───────────────────────────────────────────────────────
console.log('\n📡 Signal Graph & Signal Debt');

await check('GET /meridian/signal-graph returns nodes and edges', async () => {
  const r = await get('/meridian/signal-graph');
  const d = r.data ?? r;
  if (!d.nodes || d.nodes.length === 0) throw new Error('No signal nodes');
  if (!d.edges || d.edges.length === 0) throw new Error('No signal edges');
  if (d.healthScore === undefined) throw new Error('Missing healthScore');
});

await check('Signal graph health score is between 0 and 1', async () => {
  const r = await get('/meridian/signal-graph');
  const d = r.data ?? r;
  if (d.healthScore < 0 || d.healthScore > 1) throw new Error(`Invalid healthScore: ${d.healthScore}`);
});

await check('GET /meridian/signal-debt returns scored items', async () => {
  const r = await get('/meridian/signal-debt');
  const d = r.data ?? r;
  if (!d.items) throw new Error('No debt items');
  if (d.totalDebt === undefined) throw new Error('Missing totalDebt');
});

await check('Signal debt items have required fields', async () => {
  const r = await get('/meridian/signal-debt');
  const d = r.data ?? r;
  for (const item of d.items ?? []) {
    if (!item.label) throw new Error('Debt item missing label');
    if (!item.debtType) throw new Error('Debt item missing debtType');
    if (!item.recommendation) throw new Error('Debt item missing recommendation');
  }
});

// ── Decision Weather ──────────────────────────────────────────────────────────
console.log('\n🌤️  Decision Weather');

await check('GET /meridian/decision-weather returns all 5 event types', async () => {
  const r = await get('/meridian/decision-weather');
  const d = r.data ?? r;
  const types = new Set((d.events ?? []).map(e => e.type));
  for (const t of ['delivery_delay', 'customer_churn', 'cost_overrun', 'incident', 'opportunity_conversion']) {
    if (!types.has(t)) throw new Error(`Missing event type: ${t}`);
  }
});

await check('Decision weather has valid overallRisk', async () => {
  const r = await get('/meridian/decision-weather');
  const d = r.data ?? r;
  const valid = ['clear', 'caution', 'warning', 'storm'];
  if (!valid.includes(d.overallRisk)) throw new Error(`Invalid overallRisk: ${d.overallRisk}`);
});

await check('Each weather event has 3 forecast windows (7d, 14d, 30d)', async () => {
  const r = await get('/meridian/decision-weather');
  const d = r.data ?? r;
  for (const event of d.events ?? []) {
    const windows = event.windows ?? [];
    if (windows.length !== 3) throw new Error(`Event ${event.type} has ${windows.length} windows, expected 3`);
    const days = windows.map(w => w.days);
    if (!days.includes(7) || !days.includes(14) || !days.includes(30)) {
      throw new Error(`Event ${event.type} missing required day windows`);
    }
  }
});

// ── Counterfactual Ledger ─────────────────────────────────────────────────────
console.log('\n🔀 Counterfactual Ledger');

await check('GET /meridian/counterfactual-ledger returns entries', async () => {
  const r = await get('/meridian/counterfactual-ledger');
  const d = r.data ?? r;
  if (!d.entries || d.entries.length === 0) throw new Error('No ledger entries');
});

await check('Each ledger entry has all 4 counterfactual paths', async () => {
  const r = await get('/meridian/counterfactual-ledger');
  const d = r.data ?? r;
  for (const entry of d.entries ?? []) {
    const paths = (entry.projections ?? []).map(p => p.path);
    for (const expected of ['do_nothing', 'delay_30d', 'delegate', 'execute_now']) {
      if (!paths.includes(expected)) throw new Error(`Entry ${entry.id} missing path: ${expected}`);
    }
  }
});

await check('Ledger entries have sources and rollback paths', async () => {
  const r = await get('/meridian/counterfactual-ledger');
  const d = r.data ?? r;
  for (const entry of d.entries ?? []) {
    if (!entry.sources || entry.sources.length === 0) throw new Error(`Entry ${entry.id} missing sources`);
    if (!entry.owner) throw new Error(`Entry ${entry.id} missing owner`);
    if (!entry.nextAction) throw new Error(`Entry ${entry.id} missing nextAction`);
    const executeNow = entry.projections?.find(p => p.path === 'execute_now');
    if (!executeNow?.rollbackPath) throw new Error(`Entry ${entry.id} execute_now missing rollbackPath`);
  }
});

// ── Flight Recorder ───────────────────────────────────────────────────────────
console.log('\n✈️  Business Flight Recorder');

await check('GET /meridian/flight-recorder returns records', async () => {
  const r = await get('/meridian/flight-recorder');
  const d = r.data ?? r;
  if (!d.records) throw new Error('No records array');
  if (!d.summary) throw new Error('No summary');
});

await check('Flight recorder summary has required fields', async () => {
  const r = await get('/meridian/flight-recorder');
  const d = r.data ?? r;
  const s = d.summary;
  if (s.modelCalls === undefined) throw new Error('Missing summary.modelCalls');
  if (s.forecasts === undefined) throw new Error('Missing summary.forecasts');
  if (s.toolActions === undefined) throw new Error('Missing summary.toolActions');
});

await check('Flight recorder type filter works', async () => {
  const r = await get('/meridian/flight-recorder?type=model_call');
  const d = r.data ?? r;
  for (const rec of d.records ?? []) {
    if (rec.type !== 'model_call') throw new Error(`Record ${rec.id} has wrong type: ${rec.type}`);
  }
});

// ── MCP Registry ──────────────────────────────────────────────────────────────
console.log('\n🔌 MCP Server Registry');

await check('GET /meridian/mcp-registry returns servers', async () => {
  const r = await get('/meridian/mcp-registry');
  const d = r.data ?? r;
  if (!d.servers || d.servers.length === 0) throw new Error('No MCP servers in registry');
  if (d.total !== d.servers.length) throw new Error('total mismatch with servers.length');
});

await check('MCP registry includes all expected servers', async () => {
  const r = await get('/meridian/mcp-registry');
  const d = r.data ?? r;
  const ids = new Set(d.servers.map(s => s.id));
  for (const expected of ['sentry', 'linear', 'posthog', 'amplitude', 'notion', 'pagerduty', 'slack', 'github']) {
    if (!ids.has(expected)) throw new Error(`Missing MCP server: ${expected}`);
  }
});

await check('MCP governance policy enforces read-first', async () => {
  const r = await get('/meridian/mcp-registry');
  const d = r.data ?? r;
  if (!d.governancePolicy?.readFirstEnforced) throw new Error('readFirstEnforced is not true');
});

await check('Governance check for read operation requires no approval', async () => {
  const r = await post('/meridian/mcp-governance/check', {
    serverId: 'github',
    capabilityId: 'github.list_prs',
  });
  const d = r.data ?? r;
  if (d.requiresApproval !== false) throw new Error('Read operation should not require approval');
});

await check('Governance check for write operation requires approval', async () => {
  const r = await post('/meridian/mcp-governance/check', {
    serverId: 'github',
    capabilityId: 'github.create_issue',
  });
  const d = r.data ?? r;
  if (!d.requiresApproval) throw new Error('Write operation should require approval');
});

await check('Governance check for unknown server returns not found', async () => {
  const r = await post('/meridian/mcp-governance/check', {
    serverId: 'unknown-server-xyz',
    capabilityId: 'something.read',
  });
  const d = r.data ?? r;
  if (d.permitted !== false) throw new Error('Unknown server should not be permitted');
});

// ── Founder Intent ────────────────────────────────────────────────────────────
console.log('\n🧭 Founder Intent & Governance');

await check('GET /meridian/founder-intent returns doctrine', async () => {
  const r = await get('/meridian/founder-intent');
  const d = r.data ?? r;
  if (!d.missionStatement) throw new Error('Missing missionStatement');
  if (!d.coreDoctrines || d.coreDoctrines.length === 0) throw new Error('No core doctrines');
  if (!d.prohibitedActions || d.prohibitedActions.length === 0) throw new Error('No prohibited actions');
});

await check('Founder Intent has all required doctrine dimensions', async () => {
  const r = await get('/meridian/founder-intent');
  const d = r.data ?? r;
  const dims = new Set(d.coreDoctrines.map(c => c.dimension));
  for (const expected of ['evidence_over_assumption', 'human_in_the_loop', 'audit_trail_completeness']) {
    if (!dims.has(expected)) throw new Error(`Missing doctrine dimension: ${expected}`);
  }
});

await check('Governance evaluate returns compliant result', async () => {
  const r = await post('/meridian/governance/evaluate', {
    action: 'query signals from github',
    domain: 'engineering',
  });
  const d = r.data ?? r;
  if (d.compliant === undefined) throw new Error('Missing compliant field');
  if (d.approvalRequired === undefined) throw new Error('Missing approvalRequired field');
});

// ── Summary ───────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${'─'.repeat(50)}`);
console.log(`  Results: ${passed}/${total} checks passed`);
if (failures.length > 0) {
  console.log(`\n  Failures:`);
  for (const f of failures) {
    console.error(`    ✗ ${f.label}: ${f.reason}`);
  }
}
console.log(`${'─'.repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
