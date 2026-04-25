import { useStandardQuery } from '@szl-holdings/api-client-react';

import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  Activity,
  AlertTriangle,
  Database,
  Globe,
  Layers,
  Network,
  RefreshCw,
  Server,
  Shield,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface TopologyNode {
  service: string;
  avgLatency: number;
  avgErrorRate: number;
  anomalyCount: number;
  dataPoints: number;
  health: 'healthy' | 'degraded' | 'down';
}

interface TopologyResponse {
  nodes: TopologyNode[];
  firingAlertCount: number;
  snapshotAt: string;
}

const PLATFORM_NODES = [
  {
    id: 'api-gateway',
    label: 'API Gateway',
    icon: Shield,
    connects: ['lyte-core', 'alloy-engine', 'terra-lyte', 'vessels-intel', 'firestorm-soc'],
    platform: 'Core',
  },
  {
    id: 'lyte-core',
    label: 'Command Core',
    icon: Zap,
    connects: ['signal-bus', 'action-router', 'prism-engine'],
    platform: 'Lyte',
  },
  {
    id: 'alloy-engine',
    label: 'Counsel Engine',
    icon: Layers,
    connects: ['signal-bus', 'workflow-exec', 'ml-inference'],
    platform: 'Counsel',
  },
  {
    id: 'terra-lyte',
    label: 'Terra Command',
    icon: Globe,
    connects: ['signal-bus', 'geo-index', 'crm-sync'],
    platform: 'Terra',
  },
  {
    id: 'vessels-intel',
    label: 'Vessels Intel',
    icon: Activity,
    connects: ['signal-bus', 'ais-stream', 'port-api'],
    platform: 'Vessels',
  },
  {
    id: 'firestorm-soc',
    label: 'Aegis SOC',
    icon: Shield,
    connects: ['signal-bus', 'threat-db', 'vuln-scan'],
    platform: 'Aegis',
  },
  {
    id: 'signal-bus',
    label: 'Signal Bus',
    icon: Activity,
    connects: ['prism-engine', 'alert-engine', 'escalation-mgr'],
    platform: 'Core',
  },
  {
    id: 'prism-engine',
    label: 'PRISM Engine',
    icon: Database,
    connects: ['metrics-store'],
    platform: 'Lyte',
  },
  {
    id: 'alert-engine',
    label: 'Alert Engine',
    icon: AlertTriangle,
    connects: ['notification-svc'],
    platform: 'Core',
  },
  {
    id: 'escalation-mgr',
    label: 'Escalation Mgr',
    icon: AlertTriangle,
    connects: ['notification-svc', 'action-router'],
    platform: 'Core',
  },
  { id: 'metrics-store', label: 'Metrics Store', icon: Database, connects: [], platform: 'Core' },
  { id: 'action-router', label: 'Action Router', icon: Server, connects: [], platform: 'Lyte' },
  {
    id: 'notification-svc',
    label: 'Notification Svc',
    icon: Globe,
    connects: [],
    platform: 'Core',
  },
  {
    id: 'workflow-exec',
    label: 'Workflow Exec',
    icon: Layers,
    connects: ['metrics-store'],
    platform: 'Counsel',
  },
  {
    id: 'ml-inference',
    label: 'ML Inference',
    icon: Database,
    connects: ['metrics-store'],
    platform: 'Counsel',
  },
];

const PLATFORM_COLORS: Record<string, string> = {
  Core: '#d4a054',
  Command: '#d4a054',
  FORGE: '#4B8BDB',
  DOMAINE: '#4a90b8',
  SEXTANT: '#38bdf8',
  PARAGON: '#c45a4a',
};

const HEALTH_STYLES = {
  healthy: { dot: '#6b8f71', border: 'rgba(107,143,113,0.2)', bg: 'rgba(107,143,113,0.04)' },
  degraded: { dot: '#d4a054', border: 'rgba(212,160,84,0.3)', bg: 'rgba(212,160,84,0.06)' },
  down: { dot: '#c45a4a', border: 'rgba(196,90,74,0.3)', bg: 'rgba(196,90,74,0.06)' },
};

function ServiceCard({
  node,
  metricsNode,
  selected,
  onClick,
}: {
  node: (typeof PLATFORM_NODES)[0];
  metricsNode: TopologyNode | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = node.icon;
  const health = metricsNode?.health ?? 'healthy';
  const hs = HEALTH_STYLES[health];
  const pColor = PLATFORM_COLORS[node.platform] ?? '#d4a054';

  return (
    <div
      className="rounded-xl border cursor-pointer transition-all hover:border-opacity-60 p-3"
      style={{
        borderColor: selected ? `${pColor}40` : hs.border,
        background: selected ? `${pColor}08` : hs.bg,
        outline: selected ? `1px solid ${pColor}30` : 'none',
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${pColor}15`, border: `1px solid ${pColor}20` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: pColor }} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white leading-tight">{node.label}</div>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {node.platform}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: hs.dot,
              boxShadow: health !== 'healthy' ? `0 0 4px ${hs.dot}` : 'none',
            }}
          />
          <span className="text-[9px] capitalize" style={{ color: hs.dot }}>
            {health}
          </span>
        </div>
      </div>

      {metricsNode && (
        <div className="grid grid-cols-3 gap-1 mt-1">
          {[
            {
              label: 'Latency',
              value: `${metricsNode.avgLatency}ms`,
              color: metricsNode.avgLatency > 200 ? '#d4a054' : '#6b8f71',
            },
            {
              label: 'Error %',
              value: `${metricsNode.avgErrorRate.toFixed(1)}%`,
              color: metricsNode.avgErrorRate > 2 ? '#c45a4a' : '#6b8f71',
            },
            {
              label: 'Anomalies',
              value: metricsNode.anomalyCount.toString(),
              color: metricsNode.anomalyCount > 0 ? '#c8953c' : 'rgba(255,255,255,0.3)',
            },
          ].map((c) => (
            <div key={c.label} className="text-center">
              <div className="text-[10px] font-mono font-bold" style={{ color: c.color }}>
                {c.value}
              </div>
              <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {c.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {node.connects.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {node.connects.slice(0, 3).map((c) => (
            <span
              key={c}
              className="text-[8px] px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              → {c}
            </span>
          ))}
          {node.connects.length > 3 && (
            <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              +{node.connects.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServiceTopology() {
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useStandardQuery({
    queryKey: ['topology'],
    queryFn: () => apiFetch<TopologyResponse>('/lyte/topology'),
    refetchInterval: 30000,
  });

  const nodes = data?.nodes ?? [];
  const firingAlerts = data?.firingAlertCount ?? 0;

  const metricsMap: Record<string, TopologyNode> = {};
  for (const n of nodes) {
    metricsMap[n.service] = n;
  }

  const _healthyPlatforms = PLATFORM_NODES.filter((n) => {
    const m =
      metricsMap[n.id] ??
      metricsMap[n.label] ??
      metricsMap[n.label.toLowerCase().replace(/ /g, '-')];
    return !m || m.health === 'healthy';
  });

  const degraded = PLATFORM_NODES.filter((n) => {
    const m = metricsMap[n.id] ?? metricsMap[n.label.toLowerCase().replace(/ /g, '-')];
    return m && m.health === 'degraded';
  });

  const selectedNode = selected ? PLATFORM_NODES.find((n) => n.id === selected) : null;
  const selectedMetrics = selectedNode
    ? (metricsMap[selectedNode.id] ??
      metricsMap[selectedNode.label.toLowerCase().replace(/ /g, '-')])
    : null;

  const platforms = [...new Set(PLATFORM_NODES.map((n) => n.platform))];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#d4a054' }}
            >
              Command · Service Topology
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Service Topology Map</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Visual map of all SZL platforms with connection health, data flow, and latency between
            services.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border"
          style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="flex items-stretch">
          {[
            {
              label: 'Total Services',
              value: PLATFORM_NODES.length.toString(),
              color: 'rgba(255,255,255,0.5)',
            },
            {
              label: 'Healthy',
              value: (PLATFORM_NODES.length - degraded.length).toString(),
              color: '#6b8f71',
            },
            {
              label: 'Degraded',
              value: degraded.length.toString(),
              color: degraded.length > 0 ? '#d4a054' : 'rgba(255,255,255,0.3)',
            },
            {
              label: 'Firing Alerts',
              value: firingAlerts.toString(),
              color: firingAlerts > 0 ? '#c45a4a' : 'rgba(255,255,255,0.3)',
              pulse: firingAlerts > 0,
            },
            { label: 'Data Sources', value: nodes.length.toString(), color: '#4a90b8' },
          ].map((c, i) => (
            <div
              key={c.label}
              className="flex-1 px-4 py-3 text-center"
              style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-lg font-bold font-mono" style={{ color: c.color }}>
                  {c.value}
                </span>
                {(c as any).pulse && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#c45a4a] shrink-0" />
                )}
              </div>
              <div
                className="text-[9px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {c.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-[#d4a054] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex gap-5">
        <div className="flex-1 space-y-5">
          {platforms.map((platform) => {
            const pNodes = PLATFORM_NODES.filter((n) => n.platform === platform);
            const pColor = PLATFORM_COLORS[platform] ?? '#d4a054';
            return (
              <div key={platform}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: pColor }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: pColor }}
                  >
                    {platform}
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: `linear-gradient(to right, ${pColor}30, transparent)` }}
                  />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {pNodes.map((node) => (
                    <ServiceCard
                      key={node.id}
                      node={node}
                      metricsNode={
                        metricsMap[node.id] ??
                        metricsMap[node.label.toLowerCase().replace(/ /g, '-')]
                      }
                      selected={selected === node.id}
                      onClick={() => setSelected(selected === node.id ? null : node.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {selectedNode && (
          <div
            className="w-72 shrink-0 rounded-xl border p-4 h-fit sticky top-6"
            style={{
              borderColor: `${PLATFORM_COLORS[selectedNode.platform]}20`,
              background: 'rgba(255,255,255,0.015)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white">{selectedNode.label}</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {selectedMetrics ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: 'Avg Latency',
                      value: `${selectedMetrics.avgLatency}ms`,
                      color: selectedMetrics.avgLatency > 200 ? '#d4a054' : '#6b8f71',
                    },
                    {
                      label: 'Error Rate',
                      value: `${selectedMetrics.avgErrorRate.toFixed(2)}%`,
                      color: selectedMetrics.avgErrorRate > 2 ? '#c45a4a' : '#6b8f71',
                    },
                    {
                      label: 'Anomalies',
                      value: selectedMetrics.anomalyCount.toString(),
                      color: selectedMetrics.anomalyCount > 0 ? '#c8953c' : '#6b8f71',
                    },
                    {
                      label: 'Data Points',
                      value: selectedMetrics.dataPoints.toString(),
                      color: 'rgba(255,255,255,0.5)',
                    },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className="p-2 rounded-lg text-center"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="text-sm font-bold font-mono" style={{ color: c.color }}>
                        {c.value}
                      </div>
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {c.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: HEALTH_STYLES[selectedMetrics.health].dot }}
                  />
                  <span
                    className="text-[11px] capitalize"
                    style={{ color: HEALTH_STYLES[selectedMetrics.health].dot }}
                  >
                    {selectedMetrics.health}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                No live metrics for this node yet. Seed data to populate.
              </p>
            )}

            <div className="mt-3">
              <div
                className="text-[9px] uppercase tracking-wider mb-2"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                Downstream Connections
              </div>
              <div className="space-y-1">
                {selectedNode.connects.length === 0 ? (
                  <p className="text-[10px] text-slate-600">No downstream connections</p>
                ) : (
                  selectedNode.connects.map((c) => {
                    const connNode = PLATFORM_NODES.find((n) => n.id === c);
                    const connColor = connNode ? PLATFORM_COLORS[connNode.platform] : '#d4a054';
                    return (
                      <div
                        key={c}
                        className="flex items-center gap-2 text-[10px] cursor-pointer hover:opacity-80"
                        onClick={() => setSelected(c)}
                      >
                        <span className="w-1 h-1 rounded-full" style={{ background: connColor }} />
                        <span style={{ color: connColor }}>{connNode?.label ?? c}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
