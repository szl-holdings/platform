import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@lyte/lib/api';
import { cn } from '@lyte/lib/utils';
import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Edit3,
  GripVertical,
  Layers,
  LayoutDashboard,
  Link,
  Network,
  Plus,
  Save,
  Share2,
  Shield,
  Table,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';

type WidgetType =
  | 'metric_card'
  | 'time_series'
  | 'table'
  | 'alert_feed'
  | 'topology_map'
  | 'status_indicator';
type GridSize = 'sm' | 'md' | 'lg' | 'xl';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config: Record<string, unknown>;
  gridSize: GridSize;
  col: number;
  row: number;
}

interface Dashboard {
  id: number;
  name: string;
  description: string;
  widgets: Widget[];
  template?: string;
  isShared: boolean;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

const WIDGET_CATALOG: Array<{
  type: WidgetType;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  description: string;
  defaultSize: GridSize;
  defaultConfig: Record<string, unknown>;
}> = [
  {
    type: 'metric_card',
    label: 'Metric Card',
    icon: BarChart3,
    description: 'Display a single KPI with trend indicator',
    defaultSize: 'sm',
    defaultConfig: { metric: 'signals_today', label: 'Signals Today', format: 'number' },
  },
  {
    type: 'time_series',
    label: 'Time Series Chart',
    icon: TrendingUp,
    description: 'Line or area chart over time',
    defaultSize: 'lg',
    defaultConfig: { metric: 'signal_volume', window: '24h', chartType: 'area' },
  },
  {
    type: 'table',
    label: 'Data Table',
    icon: Table,
    description: 'Tabular view of signals, actions, or workflows',
    defaultSize: 'lg',
    defaultConfig: {
      source: 'signals',
      columns: ['title', 'severity', 'status', 'createdAt'],
      limit: 10,
    },
  },
  {
    type: 'alert_feed',
    label: 'Alert Feed',
    icon: AlertTriangle,
    description: 'Live feed of critical alerts and signals',
    defaultSize: 'md',
    defaultConfig: { severities: ['critical', 'high'], limit: 8 },
  },
  {
    type: 'topology_map',
    label: 'Topology Mini-Map',
    icon: Network,
    description: 'Service dependency and ownership map',
    defaultSize: 'xl',
    defaultConfig: { depth: 2, focus: 'platform' },
  },
  {
    type: 'status_indicator',
    label: 'Status Indicator',
    icon: Circle,
    description: 'Single-metric health status with threshold bands',
    defaultSize: 'sm',
    defaultConfig: { metric: 'platform_health', thresholds: { warning: 70, critical: 50 } },
  },
];

const TEMPLATES: Array<{
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  widgets: Omit<Widget, 'id'>[];
}> = [
  {
    id: 'executive_overview',
    name: 'Executive Overview',
    description: 'High-level KPIs, risk indicators, and portfolio health for leadership',
    icon: Layers,
    accentColor: '#d4a054',
    widgets: [
      {
        type: 'metric_card',
        title: 'Active Signals',
        config: { metric: 'signals_active', label: 'Active Signals', format: 'number' },
        gridSize: 'sm',
        col: 0,
        row: 0,
      },
      {
        type: 'metric_card',
        title: 'Value at Risk',
        config: { metric: 'value_at_risk', label: 'Value at Risk', format: 'currency' },
        gridSize: 'sm',
        col: 1,
        row: 0,
      },
      {
        type: 'metric_card',
        title: 'Open Actions',
        config: { metric: 'actions_open', label: 'Open Actions', format: 'number' },
        gridSize: 'sm',
        col: 2,
        row: 0,
      },
      {
        type: 'status_indicator',
        title: 'Platform Health',
        config: { metric: 'platform_health', thresholds: { warning: 70, critical: 50 } },
        gridSize: 'sm',
        col: 3,
        row: 0,
      },
      {
        type: 'time_series',
        title: 'Signal Volume (24h)',
        config: { metric: 'signal_volume', window: '24h', chartType: 'area' },
        gridSize: 'xl',
        col: 0,
        row: 1,
      },
      {
        type: 'alert_feed',
        title: 'Critical Alerts',
        config: { severities: ['critical', 'high'], limit: 6 },
        gridSize: 'md',
        col: 0,
        row: 2,
      },
      {
        type: 'table',
        title: 'Top Actions',
        config: {
          source: 'actions',
          columns: ['title', 'urgency', 'owner', 'valueProtected'],
          limit: 5,
        },
        gridSize: 'md',
        col: 1,
        row: 2,
      },
    ],
  },
  {
    id: 'engineering_ops',
    name: 'Engineering Ops',
    description: 'Workflow runs, latency tracking, service topology, and SRE metrics',
    icon: Zap,
    accentColor: '#4B8BDB',
    widgets: [
      {
        type: 'metric_card',
        title: 'Running Workflows',
        config: { metric: 'workflows_running', label: 'Running', format: 'number' },
        gridSize: 'sm',
        col: 0,
        row: 0,
      },
      {
        type: 'metric_card',
        title: 'Failed Runs (24h)',
        config: { metric: 'runs_failed_24h', label: 'Failed Runs', format: 'number' },
        gridSize: 'sm',
        col: 1,
        row: 0,
      },
      {
        type: 'metric_card',
        title: 'p99 Latency',
        config: { metric: 'api_p99_ms', label: 'API p99', format: 'ms' },
        gridSize: 'sm',
        col: 2,
        row: 0,
      },
      {
        type: 'status_indicator',
        title: 'API Health',
        config: { metric: 'api_health', thresholds: { warning: 85, critical: 70 } },
        gridSize: 'sm',
        col: 3,
        row: 0,
      },
      {
        type: 'topology_map',
        title: 'Service Topology',
        config: { depth: 2, focus: 'platform' },
        gridSize: 'xl',
        col: 0,
        row: 1,
      },
      {
        type: 'time_series',
        title: 'Workflow Run Volume',
        config: { metric: 'run_volume', window: '12h', chartType: 'bar' },
        gridSize: 'lg',
        col: 0,
        row: 2,
      },
      {
        type: 'table',
        title: 'Recent Failed Runs',
        config: {
          source: 'runs',
          filter: 'failed',
          columns: ['id', 'workflowName', 'startedAt', 'errorMessage'],
          limit: 8,
        },
        gridSize: 'lg',
        col: 1,
        row: 2,
      },
    ],
  },
  {
    id: 'security_posture',
    name: 'Security Posture',
    description: 'Threat signals, compliance status, escalation tracking, and risk exposure',
    icon: Shield,
    accentColor: '#c45a4a',
    widgets: [
      {
        type: 'metric_card',
        title: 'Critical Threats',
        config: { metric: 'threats_critical', label: 'Critical', format: 'number' },
        gridSize: 'sm',
        col: 0,
        row: 0,
      },
      {
        type: 'metric_card',
        title: 'Compliance Score',
        config: { metric: 'compliance_score', label: 'Compliance', format: 'score' },
        gridSize: 'sm',
        col: 1,
        row: 0,
      },
      {
        type: 'metric_card',
        title: 'Escalations',
        config: { metric: 'escalations_open', label: 'Escalations', format: 'number' },
        gridSize: 'sm',
        col: 2,
        row: 0,
      },
      {
        type: 'status_indicator',
        title: 'Security Posture',
        config: { metric: 'security_posture', thresholds: { warning: 75, critical: 60 } },
        gridSize: 'sm',
        col: 3,
        row: 0,
      },
      {
        type: 'alert_feed',
        title: 'Security Alerts',
        config: { severities: ['critical', 'high'], filter: 'security', limit: 10 },
        gridSize: 'lg',
        col: 0,
        row: 1,
      },
      {
        type: 'time_series',
        title: 'Threat Volume (7d)',
        config: { metric: 'threat_volume', window: '7d', chartType: 'area' },
        gridSize: 'lg',
        col: 1,
        row: 1,
      },
      {
        type: 'table',
        title: 'Open Escalations',
        config: {
          source: 'escalations',
          columns: ['title', 'severity', 'assignee', 'dueAt'],
          limit: 8,
        },
        gridSize: 'xl',
        col: 0,
        row: 2,
      },
    ],
  },
];

const GRID_SIZE_CLASSES: Record<GridSize, string> = {
  sm: 'col-span-1',
  md: 'col-span-2',
  lg: 'col-span-3',
  xl: 'col-span-4',
};

const GRID_SIZE_LABELS: Record<GridSize, string> = {
  sm: '1/4',
  md: '1/2',
  lg: '3/4',
  xl: 'Full',
};

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function MetricCardWidget({ widget }: { widget: Widget }) {
  const cfg = widget.config as { metric: string; label: string; format: string };
  const vals: Record<string, { value: number | string; trend: number; color: string }> = {
    signals_active: { value: 23, trend: 12, color: '#d4a054' },
    signals_today: { value: 47, trend: -5, color: '#4B8BDB' },
    value_at_risk: { value: '$5.03M', trend: 8, color: '#c45a4a' },
    actions_open: { value: 14, trend: 3, color: '#c8953c' },
    platform_health: { value: 94, trend: -1, color: '#6b8f71' },
    workflows_running: { value: 3, trend: 0, color: '#4B8BDB' },
    runs_failed_24h: { value: 2, trend: -1, color: '#c45a4a' },
    api_p99_ms: { value: '182ms', trend: -12, color: '#6b8f71' },
    threats_critical: { value: 5, trend: 2, color: '#c45a4a' },
    compliance_score: { value: '87/100', trend: 1, color: '#6b8f71' },
    escalations_open: { value: 4, trend: -1, color: '#c8953c' },
  };
  const d = vals[cfg.metric] ?? { value: '—', trend: 0, color: '#6b7280' };
  return (
    <div className="h-full flex flex-col justify-between p-1">
      <div className="text-[10px] font-medium mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {cfg.label || widget.title}
      </div>
      <div className="font-bold text-2xl font-mono" style={{ color: d.color }}>
        {String(d.value)}
      </div>
      <div className="flex items-center gap-1 mt-1">
        <span
          className="text-[10px] font-mono"
          style={{
            color: d.trend > 0 ? '#c45a4a' : d.trend < 0 ? '#6b8f71' : 'rgba(255,255,255,0.3)',
          }}
        >
          {d.trend > 0 ? '↑' : d.trend < 0 ? '↓' : '→'} {Math.abs(d.trend)}%
        </span>
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          vs yesterday
        </span>
      </div>
    </div>
  );
}

function TimeSeriesWidget({ widget }: { widget: Widget }) {
  const cfg = widget.config as { window: string };
  const points = Array.from({ length: 24 }, (_, i) => ({
    x: i,
    y: 10 + Math.floor(30 + Math.sin(i / 3) * 15),
  }));
  const maxY = Math.max(...points.map((p) => p.y));
  const minY = Math.min(...points.map((p) => p.y));
  const range = maxY - minY || 1;
  const w = 400,
    h = 80;
  const pts = points.map((p) => `${(p.x / 23) * w},${h - ((p.y - minY) / range) * h}`).join(' ');
  return (
    <div className="h-full flex flex-col p-1">
      <div className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Last {cfg.window ?? '24h'}
      </div>
      <div className="flex-1 min-h-0 relative">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4a054" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d4a054" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#tg)" />
          <polyline points={pts} fill="none" stroke="#d4a054" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

function TableWidget({ widget }: { widget: Widget }) {
  const cfg = widget.config as { source: string; columns: string[]; limit: number };
  const rows = Array.from({ length: Math.min(cfg.limit ?? 5, 5) }, (_, i) => ({
    title: `Signal ${100 + i} — Platform anomaly`,
    severity: i === 0 ? 'critical' : i === 1 ? 'high' : 'medium',
    status: i < 2 ? 'open' : 'in_progress',
    createdAt: `${i + 1}h ago`,
  }));
  const cols = (cfg.columns ?? ['title', 'severity']).slice(0, 4);
  return (
    <div className="h-full flex flex-col p-1 overflow-hidden">
      <div
        className="grid gap-1 text-[9px] font-medium uppercase tracking-wider pb-1 border-b"
        style={{
          gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
          borderColor: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        {cols.map((c) => (
          <div key={c}>{c}</div>
        ))}
      </div>
      <div className="flex-1 overflow-auto space-y-1 pt-1">
        {rows.map((r, i) => (
          <div
            key={i}
            className="grid gap-1 text-[9px]"
            style={{
              gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <div className="truncate">{r.title}</div>
            <div
              style={{
                color:
                  r.severity === 'critical'
                    ? '#c45a4a'
                    : r.severity === 'high'
                      ? '#c8953c'
                      : '#d4a054',
              }}
            >
              {r.severity}
            </div>
            {cols.length > 2 && (
              <div style={{ color: r.status === 'open' ? '#d4a054' : '#4B8BDB' }}>{r.status}</div>
            )}
            {cols.length > 3 && <div style={{ color: 'rgba(255,255,255,0.3)' }}>{r.createdAt}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertFeedWidget({ widget }: { widget: Widget }) {
  const alerts = [
    {
      id: 1,
      title: 'Salesforce API timeout — CRM sync interrupted',
      severity: 'critical',
      time: '2m ago',
    },
    {
      id: 2,
      title: 'Approval SLA breach — contract renewal 72h',
      severity: 'high',
      time: '15m ago',
    },
    { id: 3, title: 'AIS position stale — MV Arcturus Rho', severity: 'high', time: '28m ago' },
    { id: 4, title: 'Data pipeline schema drift detected', severity: 'high', time: '1h ago' },
    { id: 5, title: 'Portfolio health below target threshold', severity: 'medium', time: '2h ago' },
  ];
  const limit = (widget.config as { limit?: number }).limit ?? 5;
  return (
    <div className="h-full flex flex-col p-1 space-y-1 overflow-hidden">
      {alerts.slice(0, limit).map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-2 p-1.5 rounded"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span
            className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background:
                a.severity === 'critical'
                  ? '#c45a4a'
                  : a.severity === 'high'
                    ? '#c8953c'
                    : '#d4a054',
            }}
          />
          <div className="flex-1 min-w-0">
            <div
              className="text-[10px] font-medium truncate"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              {a.title}
            </div>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {a.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopologyWidget() {
  const nodes = [
    { id: 'api', label: 'API Server', x: 50, y: 40, color: '#d4a054' },
    { id: 'lyte', label: 'KORA', x: 20, y: 70, color: '#d4a054' },
    { id: 'alloy', label: 'Counsel', x: 50, y: 75, color: '#4B8BDB' },
    { id: 'vessels', label: 'SEXTANT', x: 80, y: 70, color: '#38bdf8' },
    { id: 'db', label: 'DB', x: 35, y: 20, color: '#6b8f71' },
    { id: 'sf', label: 'Salesforce', x: 70, y: 20, color: '#6b7280' },
  ];
  const edges = [
    ['api', 'lyte'],
    ['api', 'alloy'],
    ['api', 'vessels'],
    ['api', 'db'],
    ['api', 'sf'],
  ];
  return (
    <div className="h-full p-1 relative">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {edges.map(([a, b], i) => {
          const from = nodes.find((n) => n.id === a);
          const to = nodes.find((n) => n.id === b);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
          );
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r="4"
              fill={`${n.color}20`}
              stroke={n.color}
              strokeWidth="0.8"
            />
            <text x={n.x} y={n.y + 8} textAnchor="middle" fontSize="3.5" fill={`${n.color}90`}>
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatusIndicatorWidget({ widget }: { widget: Widget }) {
  const cfg = widget.config as {
    metric: string;
    thresholds: { warning: number; critical: number };
  };
  const values: Record<string, number> = {
    platform_health: 94,
    api_health: 91,
    security_posture: 78,
  };
  const value = values[cfg.metric] ?? 85;
  const { warning = 70, critical = 50 } = cfg.thresholds ?? {};
  const color = value >= warning ? '#6b8f71' : value >= critical ? '#d4a054' : '#c45a4a';
  const label = value >= warning ? 'Healthy' : value >= critical ? 'Warning' : 'Critical';
  const pct = (value / 100) * 280;
  return (
    <div className="h-full flex flex-col items-center justify-center p-1">
      <div className="relative">
        <svg viewBox="-40 -40 80 80" className="w-20 h-20">
          <circle
            cx="0"
            cy="0"
            r="28"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
          />
          <circle
            cx="0"
            cy="0"
            r="28"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${pct} 280`}
            strokeDashoffset="70"
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-sm font-mono" style={{ color }}>
            {value}
          </span>
          <span
            className="text-[8px] uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

function WidgetRenderer({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'metric_card':
      return <MetricCardWidget widget={widget} />;
    case 'time_series':
      return <TimeSeriesWidget widget={widget} />;
    case 'table':
      return <TableWidget widget={widget} />;
    case 'alert_feed':
      return <AlertFeedWidget widget={widget} />;
    case 'topology_map':
      return <TopologyWidget />;
    case 'status_indicator':
      return <StatusIndicatorWidget widget={widget} />;
    default:
      return (
        <div
          className="h-full flex items-center justify-center text-[11px]"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          Unknown widget
        </div>
      );
  }
}

function SortableWidget({
  widget,
  editing,
  onRemove,
  onResize,
  dragOverlay = false,
}: {
  widget: Widget;
  editing: boolean;
  onRemove: (id: string) => void;
  onResize: (id: string, size: GridSize) => void;
  dragOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });
  const [showResize, setShowResize] = useState(false);
  const SIZES: GridSize[] = ['sm', 'md', 'lg', 'xl'];
  const catalogItem = WIDGET_CATALOG.find((c) => c.type === widget.type);
  const Icon = catalogItem?.icon ?? BarChart3;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border relative flex flex-col overflow-hidden transition-colors',
        GRID_SIZE_CLASSES[widget.gridSize],
        dragOverlay && 'shadow-2xl shadow-black/60',
      )}
      {...attributes}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
        style={{
          borderColor: editing ? 'rgba(212,160,84,0.2)' : 'rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        {editing && (
          <button
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/5 shrink-0 touch-none"
            title="Drag to reorder"
          >
            <GripVertical className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>
        )}
        <Icon className="w-3 h-3 shrink-0" style={{ color: 'rgba(212,160,84,0.6)' }} />
        <span
          className="text-[11px] font-medium flex-1 truncate"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          {widget.title}
        </span>
        {editing && (
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowResize(!showResize)}
                className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 hover:opacity-80"
                style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)' }}
              >
                {GRID_SIZE_LABELS[widget.gridSize]} <ChevronDown className="w-2.5 h-2.5" />
              </button>
              {showResize && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 rounded-lg border p-1"
                  style={{ background: '#0c1420', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        onResize(widget.id, size);
                        setShowResize(false);
                      }}
                      className={cn(
                        'block w-full text-left text-[10px] px-3 py-1.5 rounded hover:bg-white/5 whitespace-nowrap',
                      )}
                      style={{
                        color: widget.gridSize === size ? '#d4a054' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {GRID_SIZE_LABELS[size]} width
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onRemove(widget.id)}
              className="p-1 rounded hover:bg-[#c45a4a]/10 transition-colors"
              style={{ color: 'rgba(196,90,74,0.6)' }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <div
        className="flex-1 min-h-0 p-2"
        style={{
          background: 'rgba(255,255,255,0.01)',
          minHeight:
            widget.type === 'topology_map'
              ? 200
              : widget.type === 'time_series'
                ? 160
                : widget.type === 'table'
                  ? 180
                  : 120,
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          borderBottomLeftRadius: '0.75rem',
          borderBottomRightRadius: '0.75rem',
        }}
      >
        <WidgetRenderer widget={widget} />
      </div>
    </div>
  );
}

export default function DashboardBuilder() {
  const queryClient = useQueryClient();
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [editing, setEditing] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [saved, setSaved] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [showNewDashboard, setShowNewDashboard] = useState(false);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data: dashboards = [] } = useStandardQuery<Dashboard[]>({
    queryKey: ['lyte-dashboards'],
    queryFn: async () => {
      const rows = await api.dashboards.list();
      return (rows ?? []) as Dashboard[];
    },
  });

  const saveMutation = useStandardMutation({
    mutationFn: async (dash: Dashboard) => {
      const payload = {
        name: dash.name,
        description: dash.description,
        widgets: dash.widgets,
        isShared: dash.isShared,
        template: dash.template,
      };
      if (dash.id && dash.id > 0) {
        return (await api.dashboards.update(dash.id, payload)) as Dashboard;
      } else {
        return (await api.dashboards.create(payload)) as Dashboard;
      }
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['lyte-dashboards'] });
      setActiveDashboard(updated as Dashboard);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const deleteMutation = useStandardMutation({
    mutationFn: async (id: number) => {
      await api.dashboards.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lyte-dashboards'] });
    },
  });

  const handleSave = () => {
    if (activeDashboard) saveMutation.mutate(activeDashboard);
  };

  const handleAddWidget = (type: WidgetType) => {
    if (!activeDashboard) return;
    const catalogItem = WIDGET_CATALOG.find((c) => c.type === type)!;
    const newWidget: Widget = {
      id: generateId(),
      type,
      title: catalogItem.label,
      config: { ...catalogItem.defaultConfig },
      gridSize: catalogItem.defaultSize,
      col: 0,
      row: activeDashboard.widgets.length,
    };
    setActiveDashboard((prev) =>
      prev ? { ...prev, widgets: [...prev.widgets, newWidget] } : prev,
    );
    setShowCatalog(false);
  };

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setActiveDashboard((prev) =>
      prev ? { ...prev, widgets: prev.widgets.filter((w) => w.id !== widgetId) } : prev,
    );
  }, []);

  const handleResizeWidget = useCallback((widgetId: string, size: GridSize) => {
    setActiveDashboard((prev) =>
      prev
        ? {
            ...prev,
            widgets: prev.widgets.map((w) => (w.id === widgetId ? { ...w, gridSize: size } : w)),
          }
        : prev,
    );
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setDragActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !activeDashboard) return;
    const oldIndex = activeDashboard.widgets.findIndex((w) => w.id === active.id);
    const newIndex = activeDashboard.widgets.findIndex((w) => w.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(activeDashboard.widgets, oldIndex, newIndex);
    setActiveDashboard((prev) => (prev ? { ...prev, widgets: reordered } : prev));
  };

  const handleLoadTemplate = (template: (typeof TEMPLATES)[0]) => {
    const now = new Date().toISOString();
    const dashboard: Dashboard = {
      id: -1,
      name: template.name,
      description: template.description,
      widgets: template.widgets.map((w) => ({ ...w, id: generateId() })),
      template: template.id,
      isShared: false,
      createdAt: now,
      updatedAt: now,
    };
    setActiveDashboard(dashboard);
    setShowTemplates(false);
    setEditing(false);
  };

  const handleCreateBlank = () => {
    const name = newDashboardName.trim() || 'My Dashboard';
    const now = new Date().toISOString();
    const dashboard: Dashboard = {
      id: -1,
      name,
      description: '',
      widgets: [],
      isShared: false,
      createdAt: now,
      updatedAt: now,
    };
    setActiveDashboard(dashboard);
    setShowTemplates(false);
    setEditing(true);
    setNewDashboardName('');
    setShowNewDashboard(false);
  };

  const handleToggleShare = () => {
    if (!activeDashboard) return;
    setActiveDashboard((prev) => (prev ? { ...prev, isShared: !prev.isShared } : prev));
    setCopiedLink(false);
  };

  const handleCopyShareLink = () => {
    const token = activeDashboard?.shareToken;
    if (!token) return;
    const url = `${window.location.origin}/command/operations/shared/${token}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      })
      .catch(() => {
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
  };

  const activeWidget = dragActiveId
    ? activeDashboard?.widgets.find((w) => w.id === dragActiveId)
    : null;

  if (showTemplates) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 p-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <LayoutDashboard className="w-5 h-5" style={{ color: '#d4a054' }} />
            <h1 className="font-bold text-2xl text-white tracking-tight">Dashboard Builder</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Create custom dashboards with drag-and-drop widgets. Rearrange freely in edit mode.
          </p>
        </div>

        {dashboards.length > 0 && (
          <div>
            <div
              className="text-[11px] uppercase tracking-widest font-medium mb-3"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Your Dashboards
            </div>
            <div className="grid grid-cols-3 gap-3">
              {dashboards.map((d) => (
                <div key={d.id} className="relative group">
                  <button
                    onClick={() => {
                      setActiveDashboard(d);
                      setShowTemplates(false);
                    }}
                    className="w-full text-left p-4 rounded-xl border hover:border-[#d4a054]/30 transition-all"
                    style={{
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="font-medium text-sm text-white mb-1">{d.name}</div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {d.widgets.length} widgets · {d.isShared ? 'Shared' : 'Private'}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      deleteMutation.mutate(d.id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#c45a4a]/10"
                    style={{ color: 'rgba(196,90,74,0.5)' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div
            className="text-[11px] uppercase tracking-widest font-medium mb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Pre-Built Templates
          </div>
          <div className="grid grid-cols-3 gap-4">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => handleLoadTemplate(t)}
                  className="text-left p-5 rounded-xl border transition-all group hover:border-opacity-60"
                  style={{ borderColor: `${t.accentColor}30`, background: `${t.accentColor}06` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg" style={{ background: `${t.accentColor}15` }}>
                      <Icon className="w-4 h-4" style={{ color: t.accentColor }} />
                    </div>
                    <span className="font-semibold text-sm text-white">{t.name}</span>
                  </div>
                  <p
                    className="text-[11px] leading-relaxed mb-3"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {t.description}
                  </p>
                  <div className="text-[10px]" style={{ color: `${t.accentColor}80` }}>
                    {t.widgets.length} pre-configured widgets
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div
            className="text-[11px] uppercase tracking-widest font-medium mb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Start from Scratch
          </div>
          {showNewDashboard ? (
            <div
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
            >
              <input
                type="text"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBlank()}
                placeholder="Dashboard name..."
                className="flex-1 bg-transparent border-b text-sm text-white outline-none placeholder:text-slate-600"
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}
              />
              <button
                onClick={handleCreateBlank}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ background: '#d4a054' }}
              >
                Create
              </button>
              <button
                onClick={() => setShowNewDashboard(false)}
                className="p-1.5 rounded-lg hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewDashboard(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:border-[#d4a054]/30 hover:bg-[#d4a054]/5"
              style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            >
              <Plus className="w-4 h-4" /> Create blank dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="shrink-0 flex items-center gap-3 px-6 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(8,12,20,0.8)' }}
      >
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1.5 text-[11px] hover:opacity-80 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> All Dashboards
        </button>
        <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
        <span className="text-[11px] font-medium text-white">
          {activeDashboard?.name ?? 'Untitled'}
        </span>
        {activeDashboard?.isShared && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
            style={{
              color: '#6b8f71',
              background: 'rgba(107,143,113,0.1)',
              border: '1px solid rgba(107,143,113,0.2)',
            }}
          >
            Shared
          </span>
        )}
        {editing && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
            style={{
              color: '#d4a054',
              background: 'rgba(212,160,84,0.08)',
              border: '1px solid rgba(212,160,84,0.2)',
            }}
          >
            Drag widgets to reorder
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleToggleShare}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <Share2 className="w-3 h-3" />
            {activeDashboard?.isShared ? 'Unshare' : 'Share'}
          </button>
          {activeDashboard?.isShared && activeDashboard?.shareToken && (
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
              style={{
                color: copiedLink ? '#6b8f71' : 'rgba(255,255,255,0.5)',
                borderColor: copiedLink ? 'rgba(107,143,113,0.3)' : 'rgba(255,255,255,0.08)',
                background: copiedLink ? 'rgba(107,143,113,0.06)' : undefined,
              }}
            >
              {copiedLink ? <Check className="w-3 h-3" /> : <Link className="w-3 h-3" />}
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
          )}
          {editing && (
            <button
              onClick={() => setShowCatalog(true)}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
              style={{
                color: '#d4a054',
                borderColor: 'rgba(212,160,84,0.3)',
                background: 'rgba(212,160,84,0.06)',
              }}
            >
              <Plus className="w-3 h-3" /> Add Widget
            </button>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className={cn(
              'flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-all hover:opacity-80',
            )}
            style={{
              color: editing ? 'white' : 'rgba(255,255,255,0.4)',
              borderColor: editing ? 'rgba(212,160,84,0.4)' : 'rgba(255,255,255,0.08)',
              background: editing ? 'rgba(212,160,84,0.12)' : undefined,
            }}
          >
            <Edit3 className="w-3 h-3" /> {editing ? 'Done' : 'Edit'}
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-all hover:opacity-80 disabled:opacity-60"
            style={{ color: 'white', background: saved ? '#6b8f71' : '#d4a054' }}
          >
            {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {saved ? 'Saved' : saveMutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeDashboard && activeDashboard.widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(212,160,84,0.06)',
                border: '1px solid rgba(212,160,84,0.12)',
              }}
            >
              <LayoutDashboard className="w-8 h-8" style={{ color: 'rgba(212,160,84,0.5)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white mb-1">No widgets yet</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Click "Edit" then "Add Widget" to start building
              </p>
            </div>
            <button
              onClick={() => {
                setEditing(true);
                setShowCatalog(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#d4a054', color: 'white' }}
            >
              <Plus className="w-4 h-4" /> Add your first widget
            </button>
          </div>
        )}

        {activeDashboard && activeDashboard.widgets.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeDashboard.widgets.map((w) => w.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-4 gap-4 auto-rows-auto">
                {activeDashboard.widgets.map((widget) => (
                  <SortableWidget
                    key={widget.id}
                    widget={widget}
                    editing={editing}
                    onRemove={handleRemoveWidget}
                    onResize={handleResizeWidget}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeWidget && (
                <SortableWidget
                  widget={activeWidget}
                  editing={editing}
                  onRemove={handleRemoveWidget}
                  onResize={handleResizeWidget}
                  dragOverlay
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {showCatalog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowCatalog(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border p-6"
            style={{ background: '#0c1420', borderColor: 'rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Widget Catalog</h2>
              <button
                onClick={() => setShowCatalog(false)}
                className="p-1 rounded hover:bg-white/5 transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {WIDGET_CATALOG.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => handleAddWidget(item.type)}
                    className="flex items-start gap-3 p-3 rounded-xl border text-left hover:border-[#d4a054]/30 hover:bg-[#d4a054]/5 transition-all"
                    style={{
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div
                      className="p-1.5 rounded-lg mt-0.5"
                      style={{ background: 'rgba(212,160,84,0.1)' }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white mb-0.5">{item.label}</div>
                      <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
