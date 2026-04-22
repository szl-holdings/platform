import { Activity, AlertTriangle, Link, Search } from 'lucide-react';
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

interface Span {
  id: string;
  traceId: string;
  service: string;
  operation: string;
  startMs: number;
  durationMs: number;
  status: 'ok' | 'error' | 'slow';
  children: string[];
  tags: Record<string, string>;
  logLink?: string;
  parentId?: string;
  errorMessage?: string;
}

interface Trace {
  id: string;
  rootService: string;
  rootOperation: string;
  startTime: string;
  totalDurationMs: number;
  spanCount: number;
  status: 'ok' | 'error' | 'slow';
  spans: Span[];
  userId?: string;
  errorMessage?: string;
}

const SERVICE_COLORS: Record<string, string> = {
  'api-gateway': '#d4a054',
  'auth-service': '#60a5fa',
  'payment-svc': '#34d399',
  'order-processor': '#a78bfa',
  'ml-engine': '#f97316',
  'notification-svc': '#38bdf8',
  postgres: '#f59e0b',
  'redis-cache': '#94a3b8',
};

function makeTrace(id: string, status: 'ok' | 'error' | 'slow', totalMs: number): Trace {
  const _services = Object.keys(SERVICE_COLORS);
  const spans: Span[] = [
    {
      id: `${id}-s1`,
      traceId: id,
      service: 'api-gateway',
      operation: 'POST /api/orders',
      startMs: 0,
      durationMs: totalMs,
      status,
      children: [`${id}-s2`, `${id}-s3`],
      tags: {
        'http.method': 'POST',
        'http.status_code': status === 'error' ? '500' : '200',
        'http.url': '/api/orders',
      },
    },
    {
      id: `${id}-s2`,
      traceId: id,
      parentId: `${id}-s1`,
      service: 'auth-service',
      operation: 'validateToken',
      startMs: 4,
      durationMs: 12,
      status: 'ok',
      children: [`${id}-s5`],
      tags: { 'user.id': 'usr_8821', 'token.valid': 'true' },
    },
    {
      id: `${id}-s3`,
      traceId: id,
      parentId: `${id}-s1`,
      service: 'order-processor',
      operation: 'createOrder',
      startMs: 18,
      durationMs: totalMs - 24,
      status: status === 'error' ? 'error' : status,
      children: [`${id}-s4`, `${id}-s6`, `${id}-s7`],
      tags: {
        'order.id': `ord_${Math.random().toString(36).slice(2, 8)}`,
        'order.total': '$142.00',
      },
      errorMessage:
        status === 'error' ? 'Payment authorization failed: error code 4291' : undefined,
    },
    {
      id: `${id}-s4`,
      traceId: id,
      parentId: `${id}-s3`,
      service: 'payment-svc',
      operation: 'authorizePayment',
      startMs: 22,
      durationMs: status === 'error' ? 180 : 95,
      status: status === 'error' ? 'error' : 'ok',
      children: [],
      tags: { 'payment.method': 'card', 'payment.processor': 'stripe' },
      logLink: 'log-ref-4821',
    },
    {
      id: `${id}-s5`,
      traceId: id,
      parentId: `${id}-s2`,
      service: 'redis-cache',
      operation: 'GET session',
      startMs: 6,
      durationMs: 3,
      status: 'ok',
      children: [],
      tags: { 'cache.hit': 'true', 'cache.key': 'sess_usr_8821' },
    },
    {
      id: `${id}-s6`,
      traceId: id,
      parentId: `${id}-s3`,
      service: 'postgres',
      operation: 'INSERT orders',
      startMs: 124,
      durationMs: status === 'slow' ? 340 : 28,
      status: status === 'slow' ? 'slow' : 'ok',
      children: [],
      tags: { 'db.type': 'postgresql', 'db.statement': 'INSERT INTO orders' },
      logLink: 'log-ref-4822',
    },
    {
      id: `${id}-s7`,
      traceId: id,
      parentId: `${id}-s3`,
      service: 'notification-svc',
      operation: 'sendConfirmation',
      startMs: 155,
      durationMs: 18,
      status: 'ok',
      children: [],
      tags: { 'notification.channel': 'email', 'notification.template': 'order_confirm' },
    },
    {
      id: `${id}-s8`,
      traceId: id,
      parentId: `${id}-s1`,
      service: 'ml-engine',
      operation: 'fraudScore',
      startMs: 8,
      durationMs: status === 'slow' ? 280 : 45,
      status: status === 'slow' ? 'slow' : 'ok',
      children: [],
      tags: { 'ml.model': 'fraud-v3', 'ml.score': '0.04' },
    },
  ];

  return {
    id,
    rootService: 'api-gateway',
    rootOperation: 'POST /api/orders',
    startTime: new Date(Date.now() - Math.random() * 300000).toISOString(),
    totalDurationMs: totalMs,
    spanCount: spans.length,
    status,
    spans,
    userId: 'usr_8821',
    errorMessage: status === 'error' ? 'Payment authorization failed: error code 4291' : undefined,
  };
}

const TRACES: Trace[] = [
  makeTrace('trace_a3f1e9', 'error', 248),
  makeTrace('trace_b8c2d4', 'slow', 892),
  makeTrace('trace_c5e7f2', 'ok', 142),
  makeTrace('trace_d1b4a8', 'ok', 98),
  makeTrace('trace_e9c3f1', 'ok', 167),
];

const STATUS_CONFIG = {
  ok: { color: '#10b981', label: 'OK', bg: 'rgba(16,185,129,0.08)' },
  error: { color: '#ef4444', label: 'Error', bg: 'rgba(239,68,68,0.08)' },
  slow: { color: GOLD, label: 'Slow', bg: 'rgba(212,160,84,0.08)' },
};

function WaterfallView({ trace }: { trace: Trace }) {
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(null);
  const total = trace.totalDurationMs;

  const _orderedSpans = [
    trace.spans[0],
    ...trace.spans.filter((s) => s.parentId === trace.spans[0].id),
    ...trace.spans.filter(
      (s) => s.parentId && s.parentId !== trace.spans[0].id && s.parentId !== `${trace.id}-s2`,
    ),
    trace.spans[1],
    trace.spans[4],
  ]
    .filter(Boolean)
    .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);

  const depthMap: Record<string, number> = {};
  function setDepth(spanId: string, depth: number) {
    const span = trace.spans.find((s) => s.id === spanId);
    if (!span) return;
    depthMap[spanId] = depth;
    span.children.forEach((c) => setDepth(c, depth + 1));
  }
  setDepth(trace.spans[0].id, 0);
  trace.spans.forEach((s) => {
    if (depthMap[s.id] === undefined) depthMap[s.id] = 1;
  });

  return (
    <div className="space-y-1">
      {trace.spans.map((span) => {
        const sc = SERVICE_COLORS[span.service] ?? '#94a3b8';
        const sc2 = STATUS_CONFIG[span.status];
        const left = (span.startMs / total) * 100;
        const width = Math.max(0.5, (span.durationMs / total) * 100);
        const depth = depthMap[span.id] ?? 0;
        const isSelected = selectedSpan?.id === span.id;
        return (
          <div key={span.id}>
            <button
              onClick={() => setSelectedSpan(isSelected ? null : span)}
              className="w-full flex items-center gap-2 py-1 group hover:bg-white/[0.02] rounded transition-all text-left"
            >
              <div
                className="shrink-0 flex items-center gap-1"
                style={{ width: 180, paddingLeft: depth * 12 }}
              >
                {depth > 0 && (
                  <span className="text-[8px]" style={{ color: DS.text.muted }}>
                    └
                  </span>
                )}
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc }} />
                <span className="text-[9px] font-mono truncate" style={{ color: sc }}>
                  {span.service}
                </span>
              </div>
              <div className="flex-1 relative h-5">
                <div
                  className="absolute inset-0"
                  style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 2 }}
                />
                <div
                  className="absolute top-1 bottom-1 rounded"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    background: `${sc}${span.status === 'error' ? '80' : span.status === 'slow' ? '60' : '40'}`,
                    border: `1px solid ${sc}60`,
                  }}
                />
                {span.status !== 'ok' && (
                  <div
                    className="absolute top-1 bottom-1"
                    style={{ left: `${left}%`, width: 2, background: sc2.color, borderRadius: 1 }}
                  />
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2" style={{ width: 140 }}>
                <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                  {span.durationMs}ms
                </span>
                <span
                  className="text-[8px] px-1 rounded"
                  style={{ background: `${sc2.color}12`, color: sc2.color }}
                >
                  {sc2.label}
                </span>
              </div>
            </button>
            {isSelected && (
              <div
                className="ml-4 mt-1 mb-2 p-3 rounded-lg text-[9px] space-y-1"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${sc}20` }}
              >
                <div className="font-mono font-bold mb-2" style={{ color: sc }}>
                  {span.service} · {span.operation}
                </div>
                {Object.entries(span.tags).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="font-mono" style={{ color: DS.text.muted }}>
                      {k}:
                    </span>
                    <span style={{ color: DS.text.secondary }}>{v}</span>
                  </div>
                ))}
                {span.errorMessage && (
                  <div className="mt-1 font-mono text-[9px]" style={{ color: '#ef4444' }}>
                    error: {span.errorMessage}
                  </div>
                )}
                {span.logLink && (
                  <button
                    onClick={() => {
                      window.location.href = window.location.pathname.replace(
                        /\/[^/]*$/,
                        `/logs?traceId=${span.traceId}&spanId=${span.id}`,
                      );
                    }}
                    className="mt-1 flex items-center gap-1 text-[8px] px-2 py-1 rounded"
                    style={{
                      background: 'rgba(96,165,250,0.08)',
                      color: '#60a5fa',
                      border: '1px solid rgba(96,165,250,0.15)',
                    }}
                  >
                    <Link className="w-2.5 h-2.5" /> View correlated logs
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DistributedTracing() {
  const [selected, setSelected] = useState<Trace>(TRACES[0]);
  const [view, setView] = useState<'waterfall' | 'flame'>('waterfall');
  const [search, setSearch] = useState('');

  const filtered = TRACES.filter(
    (t) =>
      t.id.includes(search) ||
      t.rootOperation.toLowerCase().includes(search.toLowerCase()) ||
      t.rootService.includes(search),
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-5" style={{ background: '#080c14' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>
              Distributed Tracing Visualizer
            </h1>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>
            Flame graph and waterfall views for request traces across microservices. Latency
            breakdown, error highlighting, trace-to-log correlation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Traces / min', value: '2,840', color: GOLD },
          {
            label: 'Error Rate',
            value: `${Math.round((TRACES.filter((t) => t.status === 'error').length / TRACES.length) * 100)}%`,
            color: '#ef4444',
          },
          { label: 'P99 Latency', value: '892ms', color: GOLD },
          { label: 'P50 Latency', value: '142ms', color: '#10b981' },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border p-3 text-center"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div
              className="text-[9px] uppercase tracking-widest mb-1"
              style={{ color: DS.text.muted }}
            >
              {k.label}
            </div>
            <div className="text-[20px] font-bold font-mono" style={{ color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 p-2 rounded-lg"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <Search className="w-3 h-3 shrink-0" style={{ color: DS.text.muted }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search traces..."
              className="flex-1 bg-transparent text-[10px] outline-none"
              style={{ color: DS.text.primary }}
            />
          </div>
          <div
            className="text-[9px] uppercase tracking-widest px-1"
            style={{ color: DS.text.muted }}
          >
            Recent Traces
          </div>
          {filtered.map((trace) => {
            const sc = STATUS_CONFIG[trace.status];
            const ago = Math.floor((Date.now() - new Date(trace.startTime).getTime()) / 1000);
            return (
              <button
                key={trace.id}
                onClick={() => setSelected(trace)}
                className="w-full text-left p-3 rounded-lg transition-all"
                style={{
                  background: selected.id === trace.id ? `${sc.color}08` : DS.surface,
                  border: `1px solid ${selected.id === trace.id ? `${sc.color}30` : DS.border}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                    {trace.id}
                  </span>
                  <span
                    className="text-[8px] px-1 rounded font-mono"
                    style={{ background: `${sc.color}12`, color: sc.color }}
                  >
                    {sc.label}
                  </span>
                </div>
                <div className="text-[10px] font-medium mb-1" style={{ color: DS.text.primary }}>
                  {trace.rootOperation}
                </div>
                <div
                  className="flex items-center gap-3 text-[9px]"
                  style={{ color: DS.text.muted }}
                >
                  <span
                    className="font-mono font-bold"
                    style={{
                      color:
                        trace.totalDurationMs > 500
                          ? '#f97316'
                          : trace.totalDurationMs > 200
                            ? GOLD
                            : '#10b981',
                    }}
                  >
                    {trace.totalDurationMs}ms
                  </span>
                  <span>{trace.spanCount} spans</span>
                  <span>{ago}s ago</span>
                </div>
                {trace.errorMessage && (
                  <div className="text-[9px] mt-1 truncate" style={{ color: '#ef4444' }}>
                    {trace.errorMessage}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: DS.border, background: DS.surface }}
        >
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{ borderColor: DS.border }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                  trace_id: {selected.id}
                </span>
                <span
                  className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: `${STATUS_CONFIG[selected.status].color}12`,
                    color: STATUS_CONFIG[selected.status].color,
                  }}
                >
                  {STATUS_CONFIG[selected.status].label}
                </span>
              </div>
              <div className="text-[12px] font-semibold" style={{ color: DS.text.primary }}>
                {selected.rootOperation}
              </div>
              <div
                className="flex items-center gap-3 text-[9px] mt-1"
                style={{ color: DS.text.muted }}
              >
                <span
                  className="font-mono font-bold"
                  style={{ color: selected.totalDurationMs > 500 ? '#f97316' : '#10b981' }}
                >
                  {selected.totalDurationMs}ms total
                </span>
                <span>{selected.spanCount} spans</span>
                <span>{selected.spanCount} services involved</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(['waterfall', 'flame'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="text-[9px] px-2.5 py-1 rounded font-medium capitalize"
                  style={{
                    background: view === v ? `${GOLD}12` : 'rgba(255,255,255,0.03)',
                    color: view === v ? GOLD : DS.text.muted,
                    border: `1px solid ${view === v ? `${GOLD}30` : DS.border}`,
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
              {Object.entries(SERVICE_COLORS)
                .filter(([svc]) => selected.spans.some((s) => s.service === svc))
                .map(([svc, color]) => (
                  <div key={svc} className="flex items-center gap-1 shrink-0">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-[8px] font-mono" style={{ color }}>
                      {svc}
                    </span>
                  </div>
                ))}
            </div>

            {view === 'waterfall' ? (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div style={{ width: 180, color: DS.text.muted }} className="text-[8px]">
                    Service
                  </div>
                  <div
                    className="flex-1 flex justify-between text-[8px]"
                    style={{ color: DS.text.muted }}
                  >
                    <span>0ms</span>
                    <span>{Math.round(selected.totalDurationMs / 2)}ms</span>
                    <span>{selected.totalDurationMs}ms</span>
                  </div>
                  <div style={{ width: 140, color: DS.text.muted }} className="text-[8px]">
                    Duration
                  </div>
                </div>
                <WaterfallView trace={selected} />
              </div>
            ) : (
              <div>
                <div className="relative" style={{ height: 180 }}>
                  <div className="absolute inset-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-full"
                        style={{ top: `${i * 23}px`, height: 22 }}
                      >
                        {selected.spans
                          .filter((s) => {
                            const depths: Record<string, number> = {};
                            function assignDepth(id: string, d: number) {
                              depths[id] = d;
                              selected.spans
                                .find((s) => s.id === id)
                                ?.children.forEach((c) => assignDepth(c, d + 1));
                            }
                            assignDepth(selected.spans[0].id, 0);
                            return depths[s.id] === i;
                          })
                          .map((span) => {
                            const sc = SERVICE_COLORS[span.service] ?? '#94a3b8';
                            const left = (span.startMs / selected.totalDurationMs) * 100;
                            const width = Math.max(
                              0.5,
                              (span.durationMs / selected.totalDurationMs) * 100,
                            );
                            return (
                              <div
                                key={span.id}
                                title={`${span.service}: ${span.durationMs}ms`}
                                className="absolute top-0 h-full rounded flex items-center overflow-hidden"
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  background: `${sc}40`,
                                  border: `1px solid ${sc}50`,
                                }}
                              >
                                {width > 6 && (
                                  <span
                                    className="px-1 text-[6px] font-mono truncate"
                                    style={{ color: sc }}
                                  >
                                    {span.service}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {selected.errorMessage && (
            <div
              className="mx-4 mb-4 p-3 rounded-lg flex items-start gap-2"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#ef4444]" />
              <div>
                <div className="text-[9px] font-mono font-bold mb-0.5" style={{ color: '#ef4444' }}>
                  Error in trace
                </div>
                <div className="text-[10px]" style={{ color: DS.text.secondary }}>
                  {selected.errorMessage}
                </div>
                <button
                  onClick={() => {
                    window.location.href = window.location.pathname.replace(
                      /\/[^/]*$/,
                      `/logs?traceId=${selected.id}`,
                    );
                  }}
                  className="mt-1.5 flex items-center gap-1 text-[9px] px-2 py-1 rounded"
                  style={{
                    background: 'rgba(96,165,250,0.08)',
                    color: '#60a5fa',
                    border: '1px solid rgba(96,165,250,0.15)',
                  }}
                >
                  <Link className="w-2.5 h-2.5" /> Jump to correlated logs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
