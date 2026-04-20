import {
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronRight,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Layers,
  Network,
  Search,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const GOLD = '#d4a054';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type NodeType = 'service' | 'database' | 'queue' | 'cache' | 'gateway' | 'storage';

interface KGNode {
  id: string;
  name: string;
  type: NodeType;
  team: string;
  healthScore: number;
  dependencies: string[];
  dependents: string[];
  dataFlows: { to: string; volume: string; latency: string }[];
  description: string;
  tier: 'critical' | 'high' | 'medium' | 'low';
}

const NODE_COLOR: Record<NodeType, string> = {
  service: '#3b82f6',
  database: '#10b981',
  queue: '#f59e0b',
  cache: '#8b5cf6',
  gateway: GOLD,
  storage: '#ec4899',
};

const NODE_ICON: Record<NodeType, any> = {
  service: Cpu,
  database: Database,
  queue: Layers,
  cache: Zap,
  gateway: Globe,
  storage: Database,
};

const NODES: KGNode[] = [
  {
    id: 'api-gateway',
    name: 'API Gateway',
    type: 'gateway',
    team: 'Platform',
    healthScore: 96,
    dependencies: ['order-processor', 'payment-processor', 'user-auth'],
    dependents: ['web-frontend', 'mobile-app', 'partner-api'],
    dataFlows: [
      { to: 'order-processor', volume: '12k req/min', latency: '4ms' },
      { to: 'payment-processor', volume: '1.2k req/min', latency: '8ms' },
      { to: 'user-auth', volume: '8k req/min', latency: '3ms' },
    ],
    description:
      'Primary API ingress point routing all external traffic to backend services. Handles authentication, rate limiting, and routing.',
    tier: 'critical',
  },
  {
    id: 'order-processor',
    name: 'Order Processor',
    type: 'service',
    team: 'Commerce',
    healthScore: 78,
    dependencies: ['postgres-primary', 'order-queue', 'inventory-service', 'payment-processor'],
    dependents: ['api-gateway', 'reporting-service'],
    dataFlows: [
      { to: 'postgres-primary', volume: '4k writes/min', latency: '6ms' },
      { to: 'order-queue', volume: '3k msg/min', latency: '2ms' },
      { to: 'inventory-service', volume: '4k req/min', latency: '5ms' },
    ],
    description:
      'Core order management service. Processes customer orders, validates inventory, and coordinates payment.',
    tier: 'critical',
  },
  {
    id: 'postgres-primary',
    name: 'PostgreSQL Primary',
    type: 'database',
    team: 'Database SRE',
    healthScore: 84,
    dependencies: ['storage-san'],
    dependents: ['order-processor', 'user-auth', 'inventory-service', 'reporting-service'],
    dataFlows: [{ to: 'postgres-replica', volume: 'WAL stream', latency: '0.2s lag' }],
    description:
      'Primary relational database for all transactional data. High-availability with warm standby replica.',
    tier: 'critical',
  },
  {
    id: 'payment-processor',
    name: 'Payment Processor',
    type: 'service',
    team: 'Payments',
    healthScore: 91,
    dependencies: ['stripe-api', 'postgres-primary', 'fraud-detection'],
    dependents: ['api-gateway', 'order-processor'],
    dataFlows: [
      { to: 'stripe-api', volume: '1.2k req/min', latency: '120ms' },
      { to: 'fraud-detection', volume: '1.2k req/min', latency: '18ms' },
    ],
    description:
      'Handles all payment processing, refunds, and financial reconciliation. Integrates with Stripe.',
    tier: 'critical',
  },
  {
    id: 'order-queue',
    name: 'Order Queue (Kafka)',
    type: 'queue',
    team: 'Platform',
    healthScore: 72,
    dependencies: [],
    dependents: ['order-processor', 'notification-service', 'shipping-service'],
    dataFlows: [
      { to: 'notification-service', volume: '3k msg/min', latency: '50ms' },
      { to: 'shipping-service', volume: '800 msg/min', latency: '50ms' },
    ],
    description:
      'Kafka topic for order events. Used for async processing of notifications, shipping, and analytics.',
    tier: 'high',
  },
  {
    id: 'user-auth',
    name: 'User Auth Service',
    type: 'service',
    team: 'Identity',
    healthScore: 98,
    dependencies: ['redis-cache', 'postgres-primary'],
    dependents: ['api-gateway', 'web-frontend', 'mobile-app'],
    dataFlows: [{ to: 'redis-cache', volume: '8k ops/min', latency: '1ms' }],
    description: 'JWT-based authentication and session management. Redis for token caching.',
    tier: 'critical',
  },
  {
    id: 'redis-cache',
    name: 'Redis Cache Cluster',
    type: 'cache',
    team: 'Platform',
    healthScore: 99,
    dependencies: [],
    dependents: ['user-auth', 'api-gateway', 'inventory-service'],
    dataFlows: [],
    description:
      'Distributed cache for sessions, rate limiting, and hot data. 3-node cluster with replication.',
    tier: 'high',
  },
];

const NL_QUERIES = [
  'What happens if postgres-primary goes down?',
  'Which services depend on the order-queue?',
  'What is the blast radius of api-gateway failure?',
  'Show data flows from order-processor',
];

interface ImpactAnalysis {
  node: string;
  affectedNodes: string[];
  severity: string;
  estimate: string;
  mitigation: string;
}

function getImpact(nodeId: string): ImpactAnalysis {
  const impacts: Record<string, ImpactAnalysis> = {
    'postgres-primary': {
      node: 'PostgreSQL Primary',
      affectedNodes: ['order-processor', 'user-auth', 'inventory-service', 'reporting-service'],
      severity: 'CRITICAL',
      estimate: '100% write failure. 4 services degraded. Estimated revenue impact $24k/hr.',
      mitigation:
        'Automatic failover to postgres-replica in ~30s. WAL lag 0.2s — no data loss expected.',
    },
    'api-gateway': {
      node: 'API Gateway',
      affectedNodes: ['web-frontend', 'mobile-app', 'partner-api', 'all downstream'],
      severity: 'CRITICAL',
      estimate: 'Complete external access loss. 100% of user-facing traffic interrupted.',
      mitigation: 'No automatic failover. On-call escalation required. Estimated recovery 8-15m.',
    },
    'order-queue': {
      node: 'Order Queue',
      affectedNodes: ['notification-service', 'shipping-service', 'reporting-service'],
      severity: 'HIGH',
      estimate:
        'Async order processing halted. Notification delivery fails. Shipping delayed. Orders still process synchronously.',
      mitigation:
        'Services fall back to synchronous mode. Auto-restart available via runbook RUNBOOK-008.',
    },
  };
  return (
    impacts[nodeId] ?? {
      node: nodeId,
      affectedNodes: NODES.find((n) => n.id === nodeId)?.dependents ?? [],
      severity: 'MEDIUM',
      estimate: 'Limited blast radius. Dependent services may degrade.',
      mitigation: 'Auto-restart via standard runbook.',
    }
  );
}

export default function KnowledgeGraph() {
  const [selected, setSelected] = useState<KGNode>(NODES[0]);
  const [nlQuery, setNlQuery] = useState('');
  const [nlResult, setNlResult] = useState<ImpactAnalysis | null>(null);

  const runQuery = (q: string) => {
    const nodeMatch = NODES.find(
      (n) => q.toLowerCase().includes(n.id) || q.toLowerCase().includes(n.name.toLowerCase()),
    );
    if (nodeMatch) {
      setNlResult(getImpact(nodeMatch.id));
    } else {
      setNlResult({
        node: 'Query',
        affectedNodes: [],
        severity: 'INFO',
        estimate:
          "No specific node matched. Try naming a service like 'postgres-primary' or 'api-gateway'.",
        mitigation: '',
      });
    }
  };

  return (
    <div className="h-full overflow-auto" style={{ background: '#080c14' }}>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: DS.text.primary }}>
            Infrastructure Knowledge Graph
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
            Living dependency map · natural language impact queries · blast radius analysis · data
            flow visualization
          </p>
        </div>

        {/* NL Query */}
        <div
          className="rounded-lg p-4"
          style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4" style={{ color: GOLD }} />
            <span className="text-[10px] font-semibold" style={{ color: DS.text.primary }}>
              Natural Language Impact Query
            </span>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runQuery(nlQuery)}
              placeholder="Ask: 'What happens if this database goes down?'"
              className="flex-1 px-3 py-2 rounded text-[11px] outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${DS.border}`,
                color: DS.text.primary,
              }}
            />
            <button
              onClick={() => runQuery(nlQuery)}
              className="px-3 py-2 rounded text-[10px] font-medium"
              style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: GOLD }}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {NL_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setNlQuery(q);
                  runQuery(q);
                }}
                className="text-[9px] px-2 py-1 rounded"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${DS.border}`,
                  color: DS.text.muted,
                }}
              >
                {q}
              </button>
            ))}
          </div>
          {nlResult && (
            <div
              className="mt-3 p-3 rounded-lg"
              style={{
                background:
                  nlResult.severity === 'CRITICAL'
                    ? 'rgba(239,68,68,0.06)'
                    : 'rgba(212,160,84,0.06)',
                border: `1px solid ${nlResult.severity === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : GOLD + '25'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle
                  className="w-3.5 h-3.5"
                  style={{ color: nlResult.severity === 'CRITICAL' ? '#ef4444' : GOLD }}
                />
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: nlResult.severity === 'CRITICAL' ? '#ef4444' : GOLD }}
                >
                  {nlResult.severity} — {nlResult.node} Failure Impact
                </span>
              </div>
              <p className="text-[11px] mb-2" style={{ color: DS.text.secondary }}>
                {nlResult.estimate}
              </p>
              {nlResult.affectedNodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {nlResult.affectedNodes.map((n) => (
                    <span
                      key={n}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}
              {nlResult.mitigation && (
                <p className="text-[10px]" style={{ color: '#10b981' }}>
                  ✓ {nlResult.mitigation}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Node list */}
          <div className="space-y-2">
            <div
              className="text-[9px] uppercase tracking-widest px-1 mb-2"
              style={{ color: DS.text.muted }}
            >
              Infrastructure Nodes
            </div>
            {NODES.map((n) => {
              const Icon = NODE_ICON[n.type];
              const tc = NODE_COLOR[n.type];
              const hColor =
                n.healthScore >= 90 ? '#10b981' : n.healthScore >= 70 ? GOLD : '#ef4444';
              return (
                <button
                  key={n.id}
                  onClick={() => setSelected(n)}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    background: selected.id === n.id ? `${tc}08` : DS.surface,
                    border: `1px solid ${selected.id === n.id ? tc + '30' : DS.border}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                      style={{ background: `${tc}15`, border: `1px solid ${tc}25` }}
                    >
                      <Icon className="w-3 h-3" style={{ color: tc }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[10px] font-semibold truncate"
                        style={{ color: DS.text.primary }}
                      >
                        {n.name}
                      </div>
                      <div className="text-[9px]" style={{ color: DS.text.muted }}>
                        {n.team}
                      </div>
                    </div>
                    <div className="text-[11px] font-mono font-bold" style={{ color: hColor }}>
                      {n.healthScore}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Node detail */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="p-4 border-b" style={{ borderColor: DS.border }}>
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${NODE_COLOR[selected.type]}15`,
                    border: `1px solid ${NODE_COLOR[selected.type]}30`,
                  }}
                >
                  {(() => {
                    const Icon = NODE_ICON[selected.type];
                    return (
                      <Icon className="w-5 h-5" style={{ color: NODE_COLOR[selected.type] }} />
                    );
                  })()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: DS.text.primary }}>
                    {selected.name}
                  </h2>
                  <p className="text-[10px] mt-1" style={{ color: DS.text.secondary }}>
                    {selected.description}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <div
                    className="text-xl font-bold font-mono"
                    style={{
                      color:
                        selected.healthScore >= 90
                          ? '#10b981'
                          : selected.healthScore >= 70
                            ? GOLD
                            : '#ef4444',
                    }}
                  >
                    {selected.healthScore}
                  </div>
                  <div className="text-[8px]" style={{ color: DS.text.muted }}>
                    health
                  </div>
                </div>
              </div>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-3 divide-x"
              style={{ borderColor: DS.border }}
            >
              <div className="p-4">
                <div
                  className="text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Depends On ({selected.dependencies.length})
                </div>
                <div className="space-y-1">
                  {selected.dependencies.length === 0 ? (
                    <div className="text-[10px]" style={{ color: DS.text.muted }}>
                      No upstream dependencies
                    </div>
                  ) : (
                    selected.dependencies.map((d) => {
                      const node = NODES.find((n) => n.id === d);
                      const tc = node ? NODE_COLOR[node.type] : DS.text.muted;
                      return (
                        <button
                          key={d}
                          onClick={() => node && setSelected(node)}
                          className="flex items-center gap-2 w-full text-left p-1.5 rounded"
                          style={{ color: tc }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: tc }}
                          />
                          <span className="text-[10px]">{node?.name ?? d}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-4">
                <div
                  className="text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Used By ({selected.dependents.length})
                </div>
                <div className="space-y-1">
                  {selected.dependents.map((d) => {
                    const node = NODES.find((n) => n.id === d);
                    const tc = node ? NODE_COLOR[node.type] : '#3b82f6';
                    return (
                      <button
                        key={d}
                        onClick={() => node && setSelected(node)}
                        className="flex items-center gap-2 w-full text-left p-1.5 rounded"
                        style={{ color: tc }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: tc }}
                        />
                        <span className="text-[10px]">{node?.name ?? d}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4">
                <div
                  className="text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Data Flows
                </div>
                <div className="space-y-2">
                  {selected.dataFlows.length === 0 ? (
                    <div className="text-[10px]" style={{ color: DS.text.muted }}>
                      No outbound flows
                    </div>
                  ) : (
                    selected.dataFlows.map((f) => (
                      <div
                        key={f.to}
                        className="p-2 rounded"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                      >
                        <div
                          className="text-[10px] font-semibold mb-0.5"
                          style={{ color: DS.text.primary }}
                        >
                          → {f.to}
                        </div>
                        <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                          {f.volume} · {f.latency}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t" style={{ borderColor: DS.border }}>
              <div
                className="text-[9px] uppercase tracking-widest mb-2"
                style={{ color: DS.text.muted }}
              >
                Blast Radius Analysis
              </div>
              {(() => {
                const impact = getImpact(selected.id);
                return (
                  <div
                    className="p-3 rounded"
                    style={{
                      background:
                        impact.severity === 'CRITICAL'
                          ? 'rgba(239,68,68,0.05)'
                          : 'rgba(212,160,84,0.05)',
                      border: `1px solid ${impact.severity === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : GOLD + '20'}`,
                    }}
                  >
                    <p className="text-[10px] mb-2" style={{ color: DS.text.secondary }}>
                      {impact.estimate}
                    </p>
                    {impact.mitigation && (
                      <p className="text-[10px]" style={{ color: '#10b981' }}>
                        ✓ {impact.mitigation}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
