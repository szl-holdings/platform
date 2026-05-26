/**
 * Sentra Agent Traffic Forensics — mitmproxy-style introspection.
 *
 * Mocked streaming source of agent ↔ tool traffic flows. Each flow carries a
 * captured request/response pair plus a single observed-vs-baseline meta
 * field derived from the canonical risk-score formula projection in
 * `sentra-formula-observations.ts` (FORMULA_REGISTRY §5.2).
 *
 * Patterns re-derived from mitmproxy (study only, no code copy):
 *   - Flow as the unit of capture (request + response + metadata).
 *   - Streaming event log surfaced over a polled cursor.
 *   - Replay surface exposed as a future endpoint (see docs).
 *
 * This route ships the data shape and a deterministic mock generator so the
 * Sentra forensics page is demonstrable in dev preview. Live capture wiring
 * is intentionally deferred — see docs/ingestion/sentra-introspection.md.
 */
import { type IRouter, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';
import { _testing as formulaObs } from '../lib/sentra-formula-observations';

const router: IRouter = Router();

interface AgentTrafficFlow {
  flowId: string;
  timestamp: string;
  agent: { id: string; name: string; domain: string };
  tool: { id: string; name: string; transport: 'http' | 'mcp' | 'rpc' };
  request: {
    method: string;
    target: string;
    headers: Record<string, string>;
    body: unknown;
  };
  response: {
    status: number;
    latencyMs: number;
    headers: Record<string, string>;
    body: unknown;
  };
  observedVsBaseline: {
    parameter: string;
    observed: number;
    baseline: number;
    gap: number;
    oldValue: number;
    candidateValue: number;
    citation: string;
  };
}

const FLOW_TEMPLATES: Array<{
  agent: AgentTrafficFlow['agent'];
  tool: AgentTrafficFlow['tool'];
  request: AgentTrafficFlow['request'];
  response: Omit<AgentTrafficFlow['response'], 'latencyMs'>;
  observed: number;
  baseline: number;
  parameter: string;
}> = [
  {
    agent: { id: 'sentinel-01', name: 'Sentinel/Asset-Risk', domain: 'sentra-ml' },
    tool: { id: 'asset-risk-head', name: 'asset-risk inference', transport: 'http' },
    request: {
      method: 'POST',
      target: '/sentra/ml/asset-risk',
      headers: { 'content-type': 'application/json', 'x-trace-id': 'trc-asset-001' },
      body: { assetId: 'srv-prod-04', cvssScore: 8.6, internetExposure: true, assetCriticality: 'critical' },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-model-version': 'asset-risk@2026.05' },
      body: { score: { p30dCompromise: 0.62, modelVersionId: 'asset-risk@2026.05' } },
    },
    observed: 0.62,
    baseline: 0.35,
    parameter: 'cap',
  },
  {
    agent: { id: 'sentinel-02', name: 'Sentinel/Blast-Radius', domain: 'sentra-ml' },
    tool: { id: 'blast-radius-head', name: 'blast-radius forecast', transport: 'http' },
    request: {
      method: 'POST',
      target: '/sentra/ml/blast-radius',
      headers: { 'content-type': 'application/json', 'x-trace-id': 'trc-blast-014' },
      body: { identityType: 'service-account', hasAdminRights: true, accessibleSystems: 47 },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-model-version': 'blast-radius@2026.04' },
      body: { score: { blastRadiusScore: 0.41, modelVersionId: 'blast-radius@2026.04' } },
    },
    observed: 0.41,
    baseline: 0.28,
    parameter: 'cap',
  },
  {
    agent: { id: 'redteam-03', name: 'Adversary/Replay', domain: 'sentra-ml' },
    tool: { id: 'adversary-replay-head', name: 'adversary-replay sim', transport: 'http' },
    request: {
      method: 'POST',
      target: '/sentra/ml/adversary-replay',
      headers: { 'content-type': 'application/json', 'x-trace-id': 'trc-adv-027' },
      body: { kevListedCount: 3, webApps: 12, endpoints: 240 },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-model-version': 'adversary-replay@2026.04' },
      body: { score: { scenarioSuccessRate: 0.48, modelVersionId: 'adversary-replay@2026.04' } },
    },
    observed: 0.48,
    baseline: 0.3,
    parameter: 'cap',
  },
  {
    agent: { id: 'sentinel-04', name: 'Sentinel/Asset-Risk', domain: 'sentra-ml' },
    tool: { id: 'asset-risk-head', name: 'asset-risk inference', transport: 'http' },
    request: {
      method: 'POST',
      target: '/sentra/ml/asset-risk',
      headers: { 'content-type': 'application/json', 'x-trace-id': 'trc-asset-002' },
      body: { assetId: 'lpt-emp-1182', cvssScore: 4.2, internetExposure: false, assetCriticality: 'medium' },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-model-version': 'asset-risk@2026.05' },
      body: { score: { p30dCompromise: 0.13, modelVersionId: 'asset-risk@2026.05' } },
    },
    observed: 0.13,
    baseline: 0.15,
    parameter: 'cap',
  },
  {
    agent: { id: 'hunt-agent-07', name: 'Hunt/Lateral', domain: 'sentra-hunt' },
    tool: { id: 'blast-radius-head', name: 'blast-radius forecast', transport: 'mcp' },
    request: {
      method: 'POST',
      target: '/sentra/ml/blast-radius',
      headers: { 'content-type': 'application/json', 'x-trace-id': 'trc-blast-015' },
      body: { identityType: 'human', hasAdminRights: false, accessibleSystems: 12 },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-model-version': 'blast-radius@2026.04' },
      body: { score: { blastRadiusScore: 0.19, modelVersionId: 'blast-radius@2026.04' } },
    },
    observed: 0.19,
    baseline: 0.18,
    parameter: 'cap',
  },
  {
    agent: { id: 'redteam-08', name: 'Adversary/Replay', domain: 'sentra-ml' },
    tool: { id: 'adversary-replay-head', name: 'adversary-replay sim', transport: 'http' },
    request: {
      method: 'POST',
      target: '/sentra/ml/adversary-replay',
      headers: { 'content-type': 'application/json', 'x-trace-id': 'trc-adv-028' },
      body: { kevListedCount: 0, webApps: 4, endpoints: 80 },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-model-version': 'adversary-replay@2026.04' },
      body: { score: { scenarioSuccessRate: 0.22, modelVersionId: 'adversary-replay@2026.04' } },
    },
    observed: 0.22,
    baseline: 0.3,
    parameter: 'cap',
  },
];

const RISK_CITATION = 'FORMULA_REGISTRY v10 §5.2 (risk-score)';

function buildFlow(template: (typeof FLOW_TEMPLATES)[number], offsetSec: number): AgentTrafficFlow {
  const gap = Math.abs(template.observed - template.baseline);
  const candidate = formulaObs.projectCandidateCap(gap);
  const latencyMs = 80 + Math.round((template.observed * 1000) % 220);
  return {
    flowId: `flow-${template.agent.id}-${offsetSec}`,
    timestamp: new Date(Date.now() - offsetSec * 1000).toISOString(),
    agent: template.agent,
    tool: template.tool,
    request: template.request,
    response: { ...template.response, latencyMs },
    observedVsBaseline: {
      parameter: template.parameter,
      observed: template.observed,
      baseline: template.baseline,
      gap: Number(gap.toFixed(4)),
      oldValue: formulaObs.RISK_CAP_DEFAULT,
      candidateValue: candidate,
      citation: RISK_CITATION,
    },
  };
}

/**
 * GET /sentra/agent-traffic/flows
 *
 * Returns a windowed list of recent mocked agent ↔ tool flows. The page
 * polls this endpoint to simulate a streaming event log. Each flow carries
 * an observed-vs-baseline meta block produced by the same projection used
 * by the formula registry's drift bridge.
 */
router.get(
  '/sentra/agent-traffic/flows',
  authMiddleware(),
  async (_req, res) => {
    try {
      const flows = FLOW_TEMPLATES.map((t, i) => buildFlow(t, (i + 1) * 7));
      sendSuccess(res, {
        flows,
        asOf: new Date().toISOString(),
        source: 'mock',
        note: 'Mocked stream. Live capture deferred — see docs/ingestion/sentra-introspection.md.',
      });
    } catch (err) {
      handleRouteError(res, err, 'Sentra agent-traffic flows lookup failed');
    }
  },
);

export default router;
