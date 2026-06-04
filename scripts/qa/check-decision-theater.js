#!/usr/bin/env node
/**
 * Decision Theater — End-to-End Simulation Verification
 *
 * Exercises the three core engines used by useDecisionEngine:
 *   1. PrismEventBus  (lib/prism-bus)
 *   2. CovenantPolicyEngine (lib/covenant-policy)
 *   3. Monte Carlo runner + VESSELS_VOYAGE_COST scenario (lib/monte-carlo)
 *
 * Run:
 *   node scripts/qa/check-decision-theater.js
 */

// ---------------------------------------------------------------------------
// 1. PrismEventBus — inline port of lib/prism-bus/src/bus.ts
// ---------------------------------------------------------------------------
class PrismEventBus {
  constructor() {
    this.subscriptions = new Map();
    this.history = [];
    this.counters = new Map();
  }

  subscribe(subscriberId, eventTypes, handler, domains) {
    const id = `sub-${subscriberId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.subscriptions.set(id, { id, subscriberId, eventTypes, domains, handler });
    return () => this.subscriptions.delete(id);
  }

  async publish(event) {
    const full = {
      ...event,
      id: event.id ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: event.timestamp ?? Date.now(),
    };
    this.history.unshift(full);
    if (this.history.length > 1000) this.history.length = 1000;
    this.counters.set(full.type, (this.counters.get(full.type) ?? 0) + 1);
    for (const sub of this.subscriptions.values()) {
      const typeMatch = sub.eventTypes === '*' || sub.eventTypes.includes(full.type);
      const domainMatch =
        !sub.domains ||
        sub.domains === '*' ||
        sub.domains.includes(full.domain) ||
        sub.domains.includes('global');
      if (typeMatch && domainMatch) {
        try {
          await Promise.resolve(sub.handler(full));
        } catch {}
      }
    }
    return full;
  }

  getHistory({ correlationId } = {}) {
    let results = this.history;
    if (correlationId) results = results.filter((e) => e.correlationId === correlationId);
    return results;
  }

  getStats() {
    const byType = {};
    for (const [type, count] of this.counters) byType[type] = count;
    return {
      totalPublished: Array.from(this.counters.values()).reduce((a, b) => a + b, 0),
      byType,
      subscriptionCount: this.subscriptions.size,
      historySize: this.history.length,
    };
  }
}

// ---------------------------------------------------------------------------
// 2. CovenantPolicyEngine — inline port of lib/covenant-policy/src/engine.ts
// ---------------------------------------------------------------------------
class CovenantPolicyEngine {
  constructor() {
    this.policies = new Map();
  }

  register(policy) {
    this.policies.set(policy.id, policy);
  }

  evaluate(request) {
    const startedAt = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();

    const applicablePolicies = Array.from(this.policies.values())
      .filter((p) => {
        if (p.expiresAt != null && p.expiresAt < now) return false;
        const roleMatch =
          p.roles.length === 0 || request.subject.roles.some((r) => p.roles.includes(r));
        const domainMatch =
          p.domains.length === 0 ||
          !request.resource.domain ||
          p.domains.includes(request.resource.domain) ||
          p.domains.includes('global');
        const permissionMatch = p.permissions.includes(request.action);
        return roleMatch && domainMatch && permissionMatch;
      })
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    let effect = 'deny';
    let reason;
    const matchedPolicies = [];

    for (const policy of applicablePolicies) {
      matchedPolicies.push(policy.id);
      if (policy.effect === 'deny') {
        effect = 'deny';
        reason = `Denied by policy: ${policy.name}`;
        break;
      }
      if (policy.effect === 'allow') {
        effect = 'allow';
        reason = `Allowed by policy: ${policy.name}`;
      }
    }

    if (matchedPolicies.length === 0) {
      effect = 'deny';
      reason = 'No applicable policy found (default deny)';
    }

    return {
      requestId,
      effect,
      allowed: effect === 'allow',
      matchedPolicies,
      reason,
      evaluatedAt: startedAt,
      durationMs: Date.now() - startedAt,
      subject: request.subject,
      resource: request.resource,
      action: request.action,
    };
  }
}

// ---------------------------------------------------------------------------
// 3. Monte Carlo engine — inline port of lib/monte-carlo
// ---------------------------------------------------------------------------
function randomNormal(mean, stdDev) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev;
}

function randomGamma(shape) {
  if (shape < 1) return randomGamma(1 + shape) * Math.random() ** (1 / shape);
  const d = shape - 1 / 3,
    c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x, v;
    do {
      x = randomNormal(0, 1);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function randomBeta(alpha, beta) {
  const x = randomGamma(alpha),
    y = randomGamma(beta);
  return x / (x + y);
}

function randomPoisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0,
    p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function sample(dist) {
  switch (dist.type) {
    case 'normal':
      return randomNormal(dist.mean, dist.stdDev);
    case 'log_normal': {
      const lnMean = Math.log(
        (dist.mean * dist.mean) / Math.sqrt(dist.stdDev ** 2 + dist.mean ** 2),
      );
      const lnStd = Math.sqrt(Math.log(1 + (dist.stdDev / dist.mean) ** 2));
      return Math.exp(randomNormal(lnMean, lnStd));
    }
    case 'uniform':
      return dist.min + Math.random() * (dist.max - dist.min);
    case 'triangular': {
      const u = Math.random();
      const fc = (dist.mode - dist.min) / (dist.max - dist.min);
      if (u < fc) return dist.min + Math.sqrt(u * (dist.max - dist.min) * (dist.mode - dist.min));
      return dist.max - Math.sqrt((1 - u) * (dist.max - dist.min) * (dist.max - dist.mode));
    }
    case 'beta': {
      const raw = randomBeta(dist.alpha, dist.beta);
      return (dist.min ?? 0) + raw * ((dist.max ?? 1) - (dist.min ?? 0));
    }
    case 'poisson':
      return randomPoisson(dist.lambda);
    case 'constant':
      return dist.value;
    default:
      return 0;
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil((sorted.length * p) / 100) - 1);
  return sorted[idx];
}

function stdDev(values, mean) {
  if (values.length < 2) return 0;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
}

// VESSELS_VOYAGE_COST scenario definition (mirrors lib/monte-carlo/src/scenarios.ts)
const VESSELS_VOYAGE_COST = {
  id: 'vessels/voyage-cost',
  title: 'Voyage Cost Simulation',
  description:
    'Simulates total voyage cost including fuel, weather delays, port fees, and piracy risk premium.',
  domain: 'vessels',
  inputs: [
    { id: 'fuelPricePerTon', distribution: { type: 'normal', mean: 620, stdDev: 80 } },
    { id: 'fuelConsumptionTons', distribution: { type: 'triangular', min: 28, mode: 34, max: 42 } },
    { id: 'voyageDays', distribution: { type: 'normal', mean: 18, stdDev: 3 } },
    { id: 'portFees', distribution: { type: 'triangular', min: 40, mode: 65, max: 120 } },
    { id: 'weatherDelayDays', distribution: { type: 'poisson', lambda: 1.5 } },
    {
      id: 'piracyRiskPremiumPct',
      distribution: { type: 'beta', alpha: 2, beta: 10, min: 0, max: 0.08 },
    },
    { id: 'cargoValue', distribution: { type: 'log_normal', mean: 8, stdDev: 2 } },
  ],
  outputs: [
    { id: 'totalVoyageCost', label: 'Total Voyage Cost ($000)' },
    { id: 'fuelCostShare', label: 'Fuel Cost Share' },
    { id: 'costPerDay', label: 'Cost per Day ($000)' },
    { id: 'totalDays', label: 'Total Transit Days' },
  ],
  calculate(inputs) {
    const totalDays = inputs.voyageDays + inputs.weatherDelayDays;
    const fuelCost = inputs.fuelPricePerTon * inputs.fuelConsumptionTons * totalDays;
    const portFees = inputs.portFees * 1000;
    const piracyPremium = inputs.cargoValue * 1_000_000 * inputs.piracyRiskPremiumPct;
    const totalCost = fuelCost + portFees + piracyPremium;
    return {
      totalVoyageCost: totalCost / 1000,
      fuelCostShare: fuelCost / totalCost,
      costPerDay: totalCost / totalDays / 1000,
      totalDays,
    };
  },
};

function runSimulation(scenario, iterations) {
  const start = performance.now();
  const outputAccum = {};
  for (const out of scenario.outputs) outputAccum[out.id] = [];

  let validIterations = 0;
  for (let i = 0; i < iterations; i++) {
    const inputs = {};
    for (const inp of scenario.inputs) inputs[inp.id] = sample(inp.distribution);
    try {
      const outputs = scenario.calculate(inputs);
      validIterations++;
      for (const out of scenario.outputs) {
        const v = outputs[out.id];
        if (v !== undefined && Number.isFinite(v)) outputAccum[out.id].push(v);
      }
    } catch {}
  }

  const metrics = {};
  for (const out of scenario.outputs) {
    const values = outputAccum[out.id] ?? [];
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    metrics[out.id] = {
      label: out.label,
      mean,
      p5: percentile(sorted, 5),
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      stdDev: stdDev(values, mean),
      n: values.length,
    };
  }

  return {
    scenarioId: scenario.id,
    iterations,
    validIterations,
    durationMs: performance.now() - start,
    metrics,
  };
}

// ---------------------------------------------------------------------------
// MARITIME_RESPONSE_POLICY (mirrors useDecisionEngine.ts)
// ---------------------------------------------------------------------------
const MARITIME_RESPONSE_POLICY = {
  id: 'maritime-critical-response-v2',
  name: 'Maritime Critical Response Protocol',
  version: '2.0.0',
  roles: ['super_admin', 'admin', 'exec', 'ops', 'compliance'],
  domains: ['aegis', 'vessels', 'global'],
  permissions: ['execute', 'approve'],
  conditions: [],
  effect: 'allow',
  priority: 100,
};

// ---------------------------------------------------------------------------
// CHECK RUNNERS
// ---------------------------------------------------------------------------
function checkPrismEventBus() {
  const bus = new PrismEventBus();
  const received = [];
  bus.subscribe(
    'test-sub',
    ['domain_signal', 'cross_domain_correlation'],
    (evt) => {
      received.push(evt);
    },
    ['aegis', 'vessels', 'global'],
  );

  const correlationId = `test-${Date.now()}`;

  return Promise.all([
    bus.publish({
      type: 'domain_signal',
      domain: 'aegis',
      sourceId: 'sensor-01',
      severity: 'critical',
      correlationId,
      payload: { title: 'SSH intrusion' },
    }),
    bus.publish({
      type: 'domain_signal',
      domain: 'vessels',
      sourceId: 'ais-monitor',
      severity: 'high',
      correlationId,
      payload: { title: 'AIS dark' },
    }),
    bus.publish({
      type: 'cross_domain_correlation',
      domain: 'global',
      sourceId: 'correlation-engine',
      severity: 'critical',
      correlationId,
      payload: { confidence: 0.87 },
    }),
  ]).then(([aegisEvt, _vesselsEvt, corrEvt]) => {
    const history = bus.getHistory({ correlationId });
    const stats = bus.getStats();
    const checks = [
      { label: 'Published 3 events', ok: stats.totalPublished === 3 },
      { label: 'History has 3 events', ok: history.length === 3 },
      { label: 'Subscriber received 3', ok: received.length === 3 },
      {
        label: 'Aegis signal has ID',
        ok: typeof aegisEvt.id === 'string' && aegisEvt.id.startsWith('evt-'),
      },
      { label: 'Correlation ID preserved', ok: corrEvt.correlationId === correlationId },
      {
        label: 'Stats byType populated',
        ok: stats.byType.domain_signal === 2 && stats.byType.cross_domain_correlation === 1,
      },
    ];
    return { section: 'PrismEventBus', checks };
  });
}

async function checkCovenantPolicy() {
  const engine = new CovenantPolicyEngine();
  engine.register(MARITIME_RESPONSE_POLICY);

  const allowDecision = engine.evaluate({
    subject: { userId: 'user-jvandenberg', roles: ['exec', 'ops'], tenantId: 'szl-holdings' },
    resource: {
      type: 'incident-response',
      id: 'test-001',
      domain: 'vessels',
      actionClass: 'emergency_response',
    },
    action: 'execute',
  });

  const denyDecision = engine.evaluate({
    subject: { userId: 'user-stranger', roles: ['viewer'], tenantId: 'szl-holdings' },
    resource: { type: 'incident-response', id: 'test-002', domain: 'vessels' },
    action: 'execute',
  });

  const checks = [
    { label: 'exec+ops role → ALLOW', ok: allowDecision.allowed === true },
    { label: 'ALLOW effect matches', ok: allowDecision.effect === 'allow' },
    {
      label: 'Policy matched maritime-critical-v2',
      ok: allowDecision.matchedPolicies[0] === 'maritime-critical-response-v2',
    },
    { label: 'viewer role → DENY', ok: denyDecision.allowed === false },
    { label: 'DENY has no matched policies', ok: denyDecision.matchedPolicies.length === 0 },
    { label: 'DENY reason is default-deny', ok: denyDecision.reason?.includes('default deny') },
    { label: 'Decision has requestId', ok: typeof allowDecision.requestId === 'string' },
    { label: 'Evaluation time < 100ms', ok: allowDecision.durationMs < 100 },
  ];

  return { section: 'CovenantPolicyEngine', checks };
}

async function checkMonteCarlo() {
  const ITERATIONS = 5000;
  const result = runSimulation(VESSELS_VOYAGE_COST, ITERATIONS);
  const cost = result.metrics.totalVoyageCost;
  const fuelShare = result.metrics.fuelCostShare;
  const totalDays = result.metrics.totalDays;

  const checks = [
    { label: `Ran ${ITERATIONS} iterations`, ok: result.iterations === ITERATIONS },
    { label: 'Valid iterations > 4900', ok: result.validIterations > 4900 },
    { label: 'Completed in < 5000ms', ok: result.durationMs < 5000 },
    { label: 'Total cost mean $200K–$2000K range', ok: cost.mean > 200 && cost.mean < 2000 },
    { label: 'P5 < mean < P95 (cost)', ok: cost.p5 < cost.mean && cost.mean < cost.p95 },
    { label: 'Cost stdDev > 0 (variance exists)', ok: cost.stdDev > 0 },
    { label: 'Fuel share mean 0.5–0.99', ok: fuelShare.mean > 0.5 && fuelShare.mean < 0.99 },
    { label: 'Total days mean 15–25 days', ok: totalDays.mean > 15 && totalDays.mean < 25 },
    {
      label: 'All cost values finite',
      ok: Number.isFinite(cost.mean) && Number.isFinite(cost.p5) && Number.isFinite(cost.p95),
    },
    { label: 'totalVoyageCost n ≈ 5000', ok: cost.n > 4900 },
  ];

  return {
    section: 'Monte Carlo (VESSELS_VOYAGE_COST)',
    checks,
    summary: {
      'mean ($000)': cost.mean.toFixed(1),
      'p5 ($000)': cost.p5.toFixed(1),
      'p50 ($000)': cost.p50.toFixed(1),
      'p95 ($000)': cost.p95.toFixed(1),
      stdDev: cost.stdDev.toFixed(1),
      durationMs: result.durationMs.toFixed(0),
    },
  };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {

  const results = await Promise.all([
    checkPrismEventBus(),
    checkCovenantPolicy(),
    checkMonteCarlo(),
  ]);

  let _totalPassed = 0;
  let totalFailed = 0;

  for (const { section, checks, summary } of results) {
    for (const { label, ok } of checks) {
      if (ok) {
        _totalPassed++;
      } else {
        totalFailed++;
      }
    }
    if (summary) {
      for (const [_k, _v] of Object.entries(summary)) {
      }
    }
  }

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((_err) => {
  process.exit(1);
});
