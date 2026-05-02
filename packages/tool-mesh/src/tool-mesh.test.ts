import { GuardianDecisionEngine } from '@workspace/guardian/decision-engine';
import { InMemoryTraceStore } from '@workspace/trace-graph/store';
import { TraceWriter } from '@workspace/trace-graph/writer';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToolMeshGateway } from './gateway.js';
import { ToolManifestSchema } from './manifest.js';
import { InMemoryToolRegistry } from './registry.js';
import {
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  documentRetrievalHandler,
} from './tools/document-retrieval.js';
import {
  budgetForecastHandler,
  FINANCE_TOOL_MANIFESTS,
  portfolioSnapshotHandler,
} from './tools/finance-tools.js';
import { GRAPH_QUERY_TOOL_MANIFEST, graphQueryHandler } from './tools/graph-query.js';
import {
  metricsQueryHandler,
  notificationSendHandler,
  OPERATIONS_TOOL_MANIFESTS,
} from './tools/operations-tools.js';
import {
  complianceCheckHandler,
  SECURITY_TOOL_MANIFESTS,
  threatScanHandler,
  vulnerabilityReportHandler,
} from './tools/security-tools.js';

function makeRegistry() {
  const registry = new InMemoryToolRegistry();
  registry.register(GRAPH_QUERY_TOOL_MANIFEST);
  registry.register(DOCUMENT_RETRIEVAL_TOOL_MANIFEST);
  return registry;
}

function makeGateway(registry: InMemoryToolRegistry) {
  const guardian = new GuardianDecisionEngine();
  guardian.addRule({
    id: 'allow-internal',
    name: 'Allow supervised tier',
    tier: 'supervised',
    conditions: [],
    action: 'allow',
    priority: 10,
    enabled: true,
    tags: [],
  });
  const store = new InMemoryTraceStore();
  const writer = new TraceWriter(store);
  return new ToolMeshGateway(registry, guardian, writer);
}

describe('ToolManifestSchema', () => {
  it('parses GRAPH_QUERY_TOOL_MANIFEST', () => {
    expect(() => ToolManifestSchema.parse(GRAPH_QUERY_TOOL_MANIFEST)).not.toThrow();
  });

  it('parses DOCUMENT_RETRIEVAL_TOOL_MANIFEST', () => {
    expect(() => ToolManifestSchema.parse(DOCUMENT_RETRIEVAL_TOOL_MANIFEST)).not.toThrow();
  });
});

describe('InMemoryToolRegistry', () => {
  it('registers and retrieves tools', () => {
    const registry = makeRegistry();
    expect(registry.count()).toBe(2);
    expect(registry.get('graph-query')).toBeDefined();
    expect(registry.get('document-retrieval')).toBeDefined();
  });

  it('filters by domain tag', () => {
    const registry = makeRegistry();
    expect(registry.list({ domainTag: 'graph' })).toHaveLength(1);
    expect(registry.list({ domainTag: 'documents' })).toHaveLength(1);
  });

  it('unregisters tools', () => {
    const registry = makeRegistry();
    expect(registry.unregister('graph-query')).toBe(true);
    expect(registry.count()).toBe(1);
  });
});

describe('ToolMeshGateway', () => {
  let registry: InMemoryToolRegistry;
  let gateway: ToolMeshGateway;

  beforeEach(() => {
    registry = makeRegistry();
    gateway = makeGateway(registry);
    gateway.registerHandler('graph-query', graphQueryHandler);
    gateway.registerHandler('document-retrieval', documentRetrievalHandler);
  });

  it('successfully invokes graph-query tool', async () => {
    const result = await gateway.invoke(
      'graph-query',
      { query: 'find all vessels', maxResults: 5 },
      { requestId: 'req-001', agentId: 'agent-1' },
    );
    expect(result.success).toBe(true);
    expect(result.decisionOutcome).toBe('allow');
    expect(result.traceId).toBeDefined();
  });

  it('successfully invokes document-retrieval tool', async () => {
    const result = await gateway.invoke(
      'document-retrieval',
      { query: 'lease agreements', topK: 3 },
      { requestId: 'req-002' },
    );
    expect(result.success).toBe(true);
  });

  it('returns error for unknown tool', async () => {
    const result = await gateway.invoke('nonexistent-tool', {}, { requestId: 'req-003' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it('denies when guardian has no matching rule', async () => {
    const denying = new GuardianDecisionEngine();
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const denyGateway = new ToolMeshGateway(registry, denying, writer);
    denyGateway.registerHandler('graph-query', graphQueryHandler);

    const result = await denyGateway.invoke(
      'graph-query',
      { query: 'test' },
      { requestId: 'req-004' },
    );
    expect(result.success).toBe(false);
    expect(result.decisionOutcome).toBe('deny');
  });

  it('records trace on tool invocation', async () => {
    const store = new InMemoryTraceStore();
    const guardian = new GuardianDecisionEngine();
    guardian.addRule({
      id: 'allow',
      name: 'Allow all',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 1,
      enabled: true,
      tags: [],
    });
    const writer = new TraceWriter(store);
    const tracingGateway = new ToolMeshGateway(registry, guardian, writer);
    tracingGateway.registerHandler('graph-query', graphQueryHandler);

    const result = await tracingGateway.invoke(
      'graph-query',
      { query: 'test' },
      { requestId: 'req-005' },
    );
    expect(result.traceId).toBeDefined();
    const trace = store.get(result.traceId!);
    expect(trace).toBeDefined();
    expect(trace?.toolCalls).toHaveLength(1);
    expect(trace?.toolCalls[0]?.toolName).toBe('Graph Query');
  });
});

describe('Security tool manifests', () => {
  it('parses all security tool manifests', () => {
    for (const manifest of SECURITY_TOOL_MANIFESTS) {
      expect(() => ToolManifestSchema.parse(manifest)).not.toThrow();
    }
  });

  it('has 5 security tools', () => {
    expect(SECURITY_TOOL_MANIFESTS).toHaveLength(5);
  });

  it('incident-containment requires approval and is human-approval-mandatory tier', () => {
    const containment = SECURITY_TOOL_MANIFESTS.find(
      (m) => m.id === 'security.incident-containment',
    );
    expect(containment).toBeDefined();
    expect(containment?.approvalRequired).toBe(true);
    expect(containment?.policyTier).toBe('human-approval-mandatory');
  });

  it('threat-scan is regulated-workflow tier', () => {
    const threatScan = SECURITY_TOOL_MANIFESTS.find((m) => m.id === 'security.threat-scan');
    expect(threatScan?.policyTier).toBe('regulated-workflow');
  });

  it('vulnerability-report handler returns expected shape', async () => {
    const result = await vulnerabilityReportHandler(
      { severity: 'high' },
      SECURITY_TOOL_MANIFESTS.find((m) => m.id === 'security.vulnerability-report')!,
    );
    expect(result).toMatchObject({ vulnerabilities: [] });
  });

  it('threat-scan handler validates input and returns stub response', async () => {
    const result = await threatScanHandler(
      { targetId: 'host-123', targetType: 'host' },
      SECURITY_TOOL_MANIFESTS.find((m) => m.id === 'security.threat-scan')!,
    );
    expect(result).toMatchObject({ targetId: 'host-123', targetType: 'host', threats: [] });
  });

  it('compliance-check handler validates framework', async () => {
    const result = await complianceCheckHandler(
      { framework: 'SOC2', scope: 'org-wide' },
      SECURITY_TOOL_MANIFESTS.find((m) => m.id === 'security.compliance-check')!,
    );
    expect(result).toMatchObject({ framework: 'SOC2', findings: [] });
  });
});

describe('Finance tool manifests', () => {
  it('parses all finance tool manifests', () => {
    for (const manifest of FINANCE_TOOL_MANIFESTS) {
      expect(() => ToolManifestSchema.parse(manifest)).not.toThrow();
    }
  });

  it('has 4 finance tools', () => {
    expect(FINANCE_TOOL_MANIFESTS).toHaveLength(4);
  });

  it('fund-transfer requires human approval', () => {
    const transfer = FINANCE_TOOL_MANIFESTS.find((m) => m.id === 'finance.fund-transfer');
    expect(transfer?.approvalRequired).toBe(true);
    expect(transfer?.policyTier).toBe('human-approval-mandatory');
  });

  it('regulatory-filing requires approval', () => {
    const filing = FINANCE_TOOL_MANIFESTS.find((m) => m.id === 'finance.regulatory-filing');
    expect(filing?.approvalRequired).toBe(true);
    expect(filing?.policyTier).toBe('regulated-workflow');
  });

  it('portfolio-snapshot handler returns expected shape', async () => {
    const result = await portfolioSnapshotHandler(
      { portfolioId: 'portfolio-abc' },
      FINANCE_TOOL_MANIFESTS.find((m) => m.id === 'finance.portfolio-snapshot')!,
    );
    expect(result).toMatchObject({ portfolioId: 'portfolio-abc', allocation: [] });
  });

  it('budget-forecast handler returns expected shape', async () => {
    const result = await budgetForecastHandler(
      { orgId: 'org-1', period: 'quarterly' },
      FINANCE_TOOL_MANIFESTS.find((m) => m.id === 'finance.budget-forecast')!,
    );
    // The handler synthesises a forecast series from the (here, empty)
    // historical transactions feed; with no transactions every projected
    // spend is 0 but the period scaffolding is still produced. We assert
    // on the structural fields and on the shape of one forecast row
    // rather than expecting an empty forecast array.
    expect(result).toMatchObject({ orgId: 'org-1', period: 'quarterly' });
    expect(Array.isArray((result as { forecast: unknown }).forecast)).toBe(true);
    const forecast = (result as { forecast: Array<Record<string, unknown>> }).forecast;
    expect(forecast.length).toBeGreaterThan(0);
    expect(forecast[0]).toMatchObject({
      period: 1,
      currency: 'USD',
      projectedSpend: 0,
    });
  });
});

describe('Operations tool manifests', () => {
  it('parses all operations tool manifests', () => {
    for (const manifest of OPERATIONS_TOOL_MANIFESTS) {
      expect(() => ToolManifestSchema.parse(manifest)).not.toThrow();
    }
  });

  it('has 5 operations tools', () => {
    expect(OPERATIONS_TOOL_MANIFESTS).toHaveLength(5);
  });

  it('infra-provision is autonomous-reversible tier', () => {
    const infra = OPERATIONS_TOOL_MANIFESTS.find((m) => m.id === 'infrastructure.provision');
    expect(infra?.policyTier).toBe('autonomous-reversible');
  });

  it('external-webhook is external-client-facing tier', () => {
    const webhook = OPERATIONS_TOOL_MANIFESTS.find(
      (m) => m.id === 'communication.external-webhook',
    );
    expect(webhook?.policyTier).toBe('external-client-facing');
  });

  it('metrics-query handler returns expected shape', async () => {
    const result = await metricsQueryHandler(
      { metric: 'cpu_usage', step: '1m' },
      OPERATIONS_TOOL_MANIFESTS.find((m) => m.id === 'analytics.metrics-query')!,
    );
    expect(result).toMatchObject({ metric: 'cpu_usage', dataPoints: [] });
  });

  it('notification-send handler validates recipients', async () => {
    const result = await notificationSendHandler(
      { channel: 'email', recipients: ['user@example.com'], body: 'Test notification' },
      OPERATIONS_TOOL_MANIFESTS.find((m) => m.id === 'communication.notification-send')!,
    );
    expect(result).toMatchObject({ channel: 'email', recipientCount: 1 });
  });
});

describe('Gateway approval-required flow', () => {
  it('returns require-approval result when tool is human-approval-mandatory', async () => {
    const registry = new InMemoryToolRegistry();
    const securityManifests = SECURITY_TOOL_MANIFESTS;
    for (const m of securityManifests) registry.register(m);

    const guardian = new GuardianDecisionEngine();
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const gateway = new ToolMeshGateway(registry, guardian, writer);

    const result = await gateway.invoke(
      'security.incident-containment',
      { incidentId: 'inc-1', containmentAction: 'isolate-host', justification: 'Active breach' },
      { requestId: 'req-approval-001', agentId: 'agent-security' },
    );

    expect(result.success).toBe(false);
    expect(result.decisionOutcome).toBe('require-approval');
    expect(result.error).toMatch(/approval/i);
  });

  it('allows tool call when guardian has a matching allow rule', async () => {
    const registry = new InMemoryToolRegistry();
    registry.register(
      SECURITY_TOOL_MANIFESTS.find((m) => m.id === 'security.vulnerability-report')!,
    );

    const guardian = new GuardianDecisionEngine();
    guardian.addRule({
      id: 'allow-internal',
      name: 'Allow internal-workflow tools',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 10,
      enabled: true,
      tags: [],
    });
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const gateway = new ToolMeshGateway(registry, guardian, writer);
    gateway.registerHandler('security.vulnerability-report', vulnerabilityReportHandler);

    const result = await gateway.invoke(
      'security.vulnerability-report',
      { severity: 'critical' },
      { requestId: 'req-vuln-001' },
    );
    expect(result.success).toBe(true);
    expect(result.decisionOutcome).toBe('allow');
  });

  it('disabled tool cannot be invoked', async () => {
    const registry = new InMemoryToolRegistry();
    const disabledManifest = { ...GRAPH_QUERY_TOOL_MANIFEST, id: 'disabled-tool', enabled: false };
    registry.register(disabledManifest);

    const guardian = new GuardianDecisionEngine();
    guardian.addRule({
      id: 'allow',
      name: 'Allow all',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 1,
      enabled: true,
      tags: [],
    });
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const gateway = new ToolMeshGateway(registry, guardian, writer);

    const result = await gateway.invoke('disabled-tool', {}, { requestId: 'req-disabled' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/disabled/i);
  });
});

describe('Total tool coverage', () => {
  it('platform has at least 12 registered tools across all domains', () => {
    const registry = new InMemoryToolRegistry();
    registry.register(GRAPH_QUERY_TOOL_MANIFEST);
    registry.register(DOCUMENT_RETRIEVAL_TOOL_MANIFEST);
    for (const m of SECURITY_TOOL_MANIFESTS) registry.register(m);
    for (const m of FINANCE_TOOL_MANIFESTS) registry.register(m);
    for (const m of OPERATIONS_TOOL_MANIFESTS) registry.register(m);
    expect(registry.count()).toBeGreaterThanOrEqual(12);
  });

  it('tools span multiple policy tiers', () => {
    const allManifests = [
      GRAPH_QUERY_TOOL_MANIFEST,
      DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
      ...SECURITY_TOOL_MANIFESTS,
      ...FINANCE_TOOL_MANIFESTS,
      ...OPERATIONS_TOOL_MANIFESTS,
    ];
    const tiers = new Set(allManifests.map((m) => m.policyTier));
    expect(tiers.size).toBeGreaterThanOrEqual(5);
  });

  it('all manifests pass schema validation', () => {
    const allManifests = [
      GRAPH_QUERY_TOOL_MANIFEST,
      DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
      ...SECURITY_TOOL_MANIFESTS,
      ...FINANCE_TOOL_MANIFESTS,
      ...OPERATIONS_TOOL_MANIFESTS,
    ];
    for (const manifest of allManifests) {
      expect(
        () => ToolManifestSchema.parse(manifest),
        `Schema validation failed for: ${manifest.id}`,
      ).not.toThrow();
    }
  });
});
