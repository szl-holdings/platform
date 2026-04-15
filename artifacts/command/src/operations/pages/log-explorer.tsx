import { useState, useEffect, useRef, type ComponentType, type SVGProps } from "react";
import { Search, Filter, Play, Pause, Download, RefreshCw, X, ChevronRight, Terminal, AlertTriangle, CheckCircle, Info, Activity, Clock, Database, Layers } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number; className?: string }>;

type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  fields?: Record<string, string | number>;
}

const LEVEL_CONFIG: Record<LogLevel, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  error: { label: "ERROR", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: AlertTriangle },
  warn: { label: "WARN", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: AlertTriangle },
  info: { label: "INFO", color: "#60a5fa", bg: "rgba(96,165,250,0.08)", icon: Info },
  debug: { label: "DEBUG", color: "#94a3b8", bg: "rgba(148,163,184,0.06)", icon: Activity },
  trace: { label: "TRACE", color: "#64748b", bg: "rgba(100,116,139,0.05)", icon: ChevronRight },
};

const SERVICES = ["all", "api-gateway", "auth-service", "payment-svc", "worker-pool", "ml-engine", "notif-service", "cache-layer"];

const SERVICE_COLORS: Record<string, string> = {
  "api-gateway": "#d4a054",
  "auth-service": "#60a5fa",
  "payment-svc": "#34d399",
  "worker-pool": "#a78bfa",
  "ml-engine": "#f97316",
  "notif-service": "#38bdf8",
  "cache-layer": "#94a3b8",
};

function generateLog(id: number): LogEntry {
  const levels: LogLevel[] = ["error", "warn", "info", "info", "info", "info", "debug", "debug", "trace"];
  const svcs = Object.keys(SERVICE_COLORS);
  const level = levels[Math.floor(Math.random() * levels.length)];
  const svc = svcs[Math.floor(Math.random() * svcs.length)];
  const now = new Date();
  now.setSeconds(now.getSeconds() - id * 2);

  const messages: Record<LogLevel, string[]> = {
    error: [
      "Unhandled exception in payment processor: connection timeout after 30s",
      "Database query failed: deadlock detected on table user_sessions",
      "Auth token validation failed: JWT signature mismatch for user_id=48291",
      "Rate limit exceeded: 429 on /api/v2/workload for tenant_id=T-8821",
      "Webhook delivery failed (attempt 3/3): destination unreachable",
    ],
    warn: [
      "Memory pressure detected: heap at 87% capacity on worker-pool-03",
      "Slow query warning: 2341ms on SELECT * FROM metrics WHERE ts > NOW()-24h",
      "Circuit breaker OPEN for downstream service notif-service (5 failures)",
      "Cache miss ratio elevated: 68% over last 5 minutes",
      "Retry attempt 2/3 for job id=job_9821x",
    ],
    info: [
      "POST /api/v2/signals 200 OK — 48ms [user_id=48291]",
      "Workflow execution started: wf_id=WF-1249 [tenant=szlholdings]",
      "Cache warmed: 12,483 entries preloaded for tenant_id=T-8821",
      "Scheduled job completed: cleanup_expired_sessions — 0 errors",
      "WebSocket connection established: client_id=cl_8821 [region=us-east-1]",
      "GET /api/v1/vessels/list 200 OK — 22ms",
      "New deployment detected: api-gateway v2.14.1 → v2.14.2",
      "Health check passed: all 8 services healthy",
    ],
    debug: [
      "Cache lookup: key=session:48291 HIT [ttl=1847s]",
      "SQL query: SELECT id,name FROM tenants WHERE active=true [8ms, 142 rows]",
      "Middleware chain: auth→ratelimit→cors→handler [total: 3.2ms]",
      "Signal published: topic=alerts.critical, partition=3",
    ],
    trace: [
      "→ Entering handler: validatePayload [span=sp_9821]",
      "→ DB pool: acquired connection from pool (2/10 active)",
      "→ Serialization: JSON.parse 841 bytes in 0.3ms",
    ],
  };

  const levelMessages = messages[level];
  const message = levelMessages[Math.floor(Math.random() * levelMessages.length)];

  return {
    id: `log_${id}`,
    timestamp: now.toISOString(),
    level,
    service: svc,
    message,
    traceId: Math.random().toString(36).slice(2, 14),
    spanId: Math.random().toString(36).slice(2, 10),
    ...(level === "info" && Math.random() > 0.5 ? { duration: Math.floor(Math.random() * 300 + 10) } : {}),
    ...(level === "error" ? { statusCode: [500, 502, 503, 504][Math.floor(Math.random() * 4)] } : {}),
  };
}

const INITIAL_LOGS: LogEntry[] = Array.from({ length: 60 }, (_, i) => generateLog(i));

const FACETS = {
  Level: ["error", "warn", "info", "debug", "trace"],
  Service: Object.keys(SERVICE_COLORS),
};

export default function LogExplorer() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<Set<LogLevel>>(new Set());
  const [serviceFilter, setServiceFilter] = useState<Set<string>>(new Set());
  const [liveTail, setLiveTail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!liveTail) return;
    const interval = setInterval(() => {
      const newLog = generateLog(0);
      newLog.id = `log_live_${Date.now()}`;
      newLog.timestamp = new Date().toISOString();
      setLogs(prev => [newLog, ...prev].slice(0, 200));
    }, 1400);
    return () => clearInterval(interval);
  }, [liveTail]);

  const filtered = logs.filter(log => {
    const matchLevel = levelFilter.size === 0 || levelFilter.has(log.level);
    const matchService = serviceFilter.size === 0 || serviceFilter.has(log.service);
    const matchSearch = !search || log.message.toLowerCase().includes(search.toLowerCase()) || log.service.includes(search.toLowerCase()) || (log.traceId ?? "").includes(search.toLowerCase());
    return matchLevel && matchService && matchSearch;
  });

  const levelCounts = logs.reduce<Record<string, number>>((acc, l) => { acc[l.level] = (acc[l.level] ?? 0) + 1; return acc; }, {});

  function toggleLevel(level: LogLevel) {
    setLevelFilter(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level); else next.add(level);
      return next;
    });
  }

  function toggleService(svc: string) {
    setServiceFilter(prev => {
      const next = new Set(prev);
      if (next.has(svc)) next.delete(svc); else next.add(svc);
      return next;
    });
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#080f1c" }}>
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: "rgba(212,160,84,0.12)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,160,84,0.1)" }}>
            <Terminal className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Log Explorer</h1>
            <p className="text-[9px] text-white/30">Structured log search · faceted filtering · live tail</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/20">{filtered.length.toLocaleString()} entries</span>
          <button
            onClick={() => setLiveTail(!liveTail)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all"
            style={{
              borderColor: liveTail ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)",
              color: liveTail ? "#22c55e" : "rgba(255,255,255,0.4)",
              background: liveTail ? "rgba(34,197,94,0.08)" : "transparent",
            }}
          >
            {liveTail ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {liveTail ? "Live" : "Tail"}
            {liveTail && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </button>
          <button className="p-1.5 rounded hover:bg-white/5 text-white/30 transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 py-2.5 border-b shrink-0" style={{ borderColor: "rgba(212,160,84,0.08)" }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
          <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs… (try: error, trace_id, service name)"
            className="flex-1 bg-transparent text-[12px] text-white placeholder:text-white/20 outline-none font-mono"
          />
          {search && (
            <button onClick={() => setSearch("")} className="p-0.5 rounded hover:bg-white/10 text-white/30">
              <X className="w-3 h-3" />
            </button>
          )}
          <span className="text-[9px] text-white/15 font-mono border-l border-white/10 pl-2 ml-1">⌘K</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Facets sidebar */}
        <div className="w-[200px] shrink-0 border-r overflow-y-auto p-3 space-y-4" style={{ borderColor: "rgba(212,160,84,0.08)" }}>
          {/* Level facets */}
          <div>
            <p className="text-[9px] font-medium text-white/25 uppercase tracking-wider mb-2">Level</p>
            <div className="space-y-1">
              {(["error", "warn", "info", "debug", "trace"] as LogLevel[]).map(level => {
                const cfg = LEVEL_CONFIG[level];
                const count = levelCounts[level] ?? 0;
                const active = levelFilter.has(level);
                return (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded transition-all text-left"
                    style={{ background: active ? cfg.bg : "transparent" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                      <span className="text-[10px] font-mono font-medium" style={{ color: active ? cfg.color : "rgba(255,255,255,0.4)" }}>{cfg.label}</span>
                    </div>
                    <span className="text-[9px] font-mono text-white/25">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service facets */}
          <div>
            <p className="text-[9px] font-medium text-white/25 uppercase tracking-wider mb-2">Service</p>
            <div className="space-y-1">
              {Object.keys(SERVICE_COLORS).map(svc => {
                const count = logs.filter(l => l.service === svc).length;
                const active = serviceFilter.has(svc);
                const color = SERVICE_COLORS[svc];
                return (
                  <button
                    key={svc}
                    onClick={() => toggleService(svc)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded transition-all"
                    style={{ background: active ? `${color}12` : "transparent" }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-[9px] truncate" style={{ color: active ? color : "rgba(255,255,255,0.35)" }}>{svc}</span>
                    </div>
                    <span className="text-[8px] font-mono text-white/20 shrink-0">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear filters */}
          {(levelFilter.size > 0 || serviceFilter.size > 0 || search) && (
            <button
              onClick={() => { setLevelFilter(new Set()); setServiceFilter(new Set()); setSearch(""); }}
              className="w-full px-2 py-1.5 rounded text-[9px] border transition-all"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Log Stream */}
        <div ref={listRef} className="flex-1 overflow-y-auto font-mono text-[11px]">
          {filtered.map((log, idx) => {
            const cfg = LEVEL_CONFIG[log.level];
            const svcColor = SERVICE_COLORS[log.service] ?? "#94a3b8";
            const isSelected = selectedLog?.id === log.id;
            const ts = new Date(log.timestamp);
            const timeStr = ts.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const msStr = String(ts.getMilliseconds()).padStart(3, "0");

            return (
              <div key={log.id}>
                <div
                  className="flex items-start gap-2 px-4 py-1.5 border-b cursor-pointer transition-all"
                  style={{
                    borderColor: "rgba(255,255,255,0.03)",
                    background: isSelected ? "rgba(255,255,255,0.04)" : log.level === "error" ? "rgba(239,68,68,0.03)" : "transparent",
                  }}
                  onClick={() => setSelectedLog(isSelected ? null : log)}
                >
                  <span className="text-white/20 shrink-0 w-24 text-[10px]">{timeStr}.{msStr}</span>
                  <span className="shrink-0 w-12 text-[9px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="shrink-0 w-24 text-[10px] truncate" style={{ color: svcColor }}>{log.service}</span>
                  <span className="flex-1 min-w-0 text-white/60 truncate">{log.message}</span>
                  {log.duration && (
                    <span className="shrink-0 text-[9px] text-white/20">{log.duration}ms</span>
                  )}
                  {log.statusCode && log.statusCode >= 500 && (
                    <span className="shrink-0 text-[9px] text-red-400 font-bold">{log.statusCode}</span>
                  )}
                </div>
                {isSelected && (
                  <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { label: "Timestamp", value: log.timestamp },
                        { label: "Trace ID", value: log.traceId ?? "—" },
                        { label: "Span ID", value: log.spanId ?? "—" },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[8px] text-white/20 mb-0.5">{label}</p>
                          <p className="text-[10px] text-white/50 font-mono">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg p-3 border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
                      <p className="text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap font-mono">{log.message}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button className="text-[9px] text-white/30 hover:text-white/60 transition-colors">Copy trace ID</button>
                      <button className="text-[9px] text-white/30 hover:text-white/60 transition-colors">Filter by service</button>
                      <button className="text-[9px] text-white/30 hover:text-white/60 transition-colors">Open trace</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-48">
              <p className="text-[11px] text-white/20">No logs match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
