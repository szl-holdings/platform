import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Pause,
  Play,
  Cpu,
  Database,
  GitBranch,
  Shield,
  Ship,
  Home,
  Scale,
  BarChart2,
  Layers,
  Wifi,
  WifiOff,
  ChevronRight,
} from "lucide-react";

const API_BASE = "/api";

type TelemetryEventType =
  | "api_call"
  | "ai_inference"
  | "agent_task"
  | "compliance_check"
  | "signal_routed"
  | "data_sync"
  | "threat_detected"
  | "record_processed";

type Venture = "Vessels" | "Aegis" | "Terra" | "PRISM" | "Lyte" | "Alloy" | "SZL";

interface TelemetryEvent {
  id: string;
  ts: string;
  type: TelemetryEventType;
  venture: Venture;
  message: string;
  durationMs?: number;
}

interface EcosystemPulse {
  requestsPerSecond: number;
  activeAgents: number;
  dbOpsPerSecond: number;
  eventsProcessed: number;
  uptime: number;
}

interface VentureHealth {
  name: Venture;
  status: "operational" | "degraded" | "maintenance";
  latencyMs: number;
  uptimePct: number;
}

const VENTURE_COLORS: Record<Venture, string> = {
  Vessels: "#3B8BEB",
  Aegis: "#EF4444",
  Terra: "#22C55E",
  PRISM: "#F59E0B",
  Lyte: "#00D4FF",
  Alloy: "#6366F1",
  SZL: "#D4A054",
};

const VENTURE_ICONS: Record<Venture, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Vessels: Ship,
  Aegis: Shield,
  Terra: Home,
  PRISM: Scale,
  Lyte: BarChart2,
  Alloy: Layers,
  SZL: GitBranch,
};

const EVENT_TYPE_LABELS: Record<TelemetryEventType, string> = {
  api_call: "API",
  ai_inference: "AI",
  agent_task: "AGENT",
  compliance_check: "COMPLY",
  signal_routed: "SIGNAL",
  data_sync: "SYNC",
  threat_detected: "THREAT",
  record_processed: "RECORD",
};

const EVENT_TYPE_COLORS: Record<TelemetryEventType, string> = {
  api_call: "#6366F1",
  ai_inference: "#A78BFA",
  agent_task: "#F97316",
  compliance_check: "#22C55E",
  signal_routed: "#00D4FF",
  data_sync: "#94A3B8",
  threat_detected: "#EF4444",
  record_processed: "#F59E0B",
};

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTs(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "--:--:--";
  }
}

function PulseBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="relative h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
      />
    </div>
  );
}

function EcosystemPulsePanel({ pulse }: { pulse: EcosystemPulse | null }) {
  const metrics = pulse
    ? [
        { label: "Requests / sec", value: pulse.requestsPerSecond.toFixed(1), unit: "rps", color: "#6366F1", barMax: 30, barVal: pulse.requestsPerSecond, icon: Activity },
        { label: "Active AI agents", value: String(pulse.activeAgents), unit: "agents", color: "#A78BFA", barMax: 20, barVal: pulse.activeAgents, icon: Cpu },
        { label: "DB ops / sec", value: pulse.dbOpsPerSecond.toFixed(1), unit: "ops", color: "#00D4FF", barMax: 80, barVal: pulse.dbOpsPerSecond, icon: Database },
      ]
    : [];

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Activity size={11} style={{ color: "#6366F1" }} />
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
          Ecosystem Pulse
        </span>
        {pulse && (
          <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
            uptime {formatUptime(pulse.uptime)}
          </span>
        )}
      </div>

      {!pulse && (
        <div className="flex items-center gap-2 py-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#6366F1" }} />
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Connecting…</span>
        </div>
      )}

      {metrics.map(({ label, value, unit, color, barMax, barVal, icon: Icon }) => (
        <div key={label} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon size={9} style={{ color, opacity: 0.7 }} />
              <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-black tabular-nums" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
                {value}
              </span>
              <span className="text-[8px]" style={{ color: `${color}60` }}>{unit}</span>
            </div>
          </div>
          <PulseBar value={barVal} max={barMax} color={color} />
        </div>
      ))}

      {pulse && (
        <div className="pt-1 flex items-center gap-1.5 opacity-50">
          <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
            {(pulse.eventsProcessed).toLocaleString()} events processed this session
          </span>
        </div>
      )}
    </div>
  );
}

function VentureHealthBar({ health }: { health: VentureHealth[] }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
          Systems Online
        </span>
        <span
          className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: "#22C55E", background: "rgba(34,197,94,0.1)" }}
        >
          {health.filter(h => h.status === "operational").length}/{health.length} OP
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {health.map((v) => {
          const color = VENTURE_COLORS[v.name];
          const Icon = VENTURE_ICONS[v.name];
          return (
            <div key={v.name} className="flex items-center gap-2.5">
              <Icon size={10} style={{ color, opacity: 0.8, flexShrink: 0 }} />
              <span className="text-[10px] font-semibold flex-1 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                {v.name}
              </span>
              <span className="text-[9px] font-mono tabular-nums" style={{ color: "rgba(255,255,255,0.2)" }}>
                {v.latencyMs}ms
              </span>
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: v.status === "operational" ? "#22C55E" : "#EF4444",
                  boxShadow: v.status === "operational" ? "0 0 6px rgba(34,197,94,0.5)" : "none",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TerminalEventRow({ event, index }: { event: TelemetryEvent; index: number }) {
  const color = VENTURE_COLORS[event.venture];
  const typeColor = EVENT_TYPE_COLORS[event.type];
  const typeLabel = EVENT_TYPE_LABELS[event.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8, y: -4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-start gap-2.5 py-2 px-3 group hover:bg-white/[0.02] transition-colors rounded"
    >
      <span
        className="text-[9px] font-mono tabular-nums shrink-0 mt-0.5"
        style={{ color: "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        {formatTs(event.ts)}
      </span>

      <span
        className="text-[8px] font-bold tracking-wide px-1.5 py-0.5 rounded shrink-0 mt-0.5"
        style={{ color: typeColor, background: `${typeColor}15` }}
      >
        {typeLabel}
      </span>

      <div
        className="flex items-center gap-1 shrink-0 mt-0.5"
        style={{ color }}
      >
        <ChevronRight size={8} />
        <span className="text-[9px] font-bold tracking-wide">{event.venture}</span>
      </div>

      <span
        className="text-[10px] flex-1 min-w-0 leading-snug"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {event.message}
      </span>

      {event.durationMs !== undefined && (
        <span
          className="text-[8px] font-mono tabular-nums shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}
        >
          {event.durationMs}ms
        </span>
      )}
    </motion.div>
  );
}

function useTelemetryStream() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [pulse, setPulse] = useState<EcosystemPulse | null>(null);
  const [health, setHealth] = useState<VentureHealth[]>([]);
  const [connected, setConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `${API_BASE}/stephen/telemetry/stream`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
      setConnectionAttempts(0);
    });

    es.addEventListener("event", (e: MessageEvent) => {
      try {
        const evt = JSON.parse(e.data) as TelemetryEvent;
        setEvents((prev) => {
          const next = [evt, ...prev];
          return next.slice(0, 80);
        });
      } catch {}
    });

    es.addEventListener("pulse", (e: MessageEvent) => {
      try {
        setPulse(JSON.parse(e.data) as EcosystemPulse);
      } catch {}
    });

    es.addEventListener("health", (e: MessageEvent) => {
      try {
        setHealth(JSON.parse(e.data) as VentureHealth[]);
      } catch {}
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;
      const attempt = connectionAttempts + 1;
      setConnectionAttempts(attempt);
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      reconnectRef.current = setTimeout(connect, delay);
    };
  }, [connectionAttempts]);

  useEffect(() => {
    connect();

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/stephen/telemetry/snapshot`);
        if (res.ok) {
          const data = await res.json();
          if (data.pulse) setPulse(data.pulse);
          if (data.health) setHealth(data.health);
          if (data.recentEvents) {
            setEvents(data.recentEvents.slice(0, 20));
          }
        }
      } catch {}
    })();

    return () => {
      esRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  return { events, pulse, health, connected };
}

export function LiveProofTerminal() {
  const { events, pulse, health, connected } = useTelemetryStream();
  const [paused, setPaused] = useState(false);
  const [displayedEvents, setDisplayedEvents] = useState<TelemetryEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!paused) {
      setDisplayedEvents(events.slice(0, 40));
    }
  }, [events, paused]);

  useEffect(() => {
    if (autoScroll && !paused && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [displayedEvents, autoScroll, paused]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    setAutoScroll(scrollRef.current.scrollTop < 40);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
      <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: 480 }}>
        <div
          className="flex-1 flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: "rgba(8,11,18,0.95)",
            border: "1px solid rgba(99,102,241,0.15)",
            boxShadow: "0 0 60px rgba(99,102,241,0.04)",
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}
          >
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#EF4444", opacity: 0.6 }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F59E0B", opacity: 0.6 }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22C55E", opacity: 0.6 }} />
            </div>

            <div className="flex items-center gap-2 ml-1">
              {connected ? (
                <Wifi size={9} style={{ color: "#22C55E" }} />
              ) : (
                <WifiOff size={9} style={{ color: "#EF4444" }} />
              )}
              <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
                szl.live/telemetry
              </span>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: connected ? "#22C55E" : "#EF4444",
                  boxShadow: connected ? "0 0 6px rgba(34,197,94,0.7)" : "none",
                  animation: connected ? "pulse 2s ease-in-out infinite" : "none",
                }}
              />
              <span
                className="text-[9px] font-semibold"
                style={{ color: connected ? "#22C55E" : "rgba(255,255,255,0.25)" }}
              >
                {connected ? "LIVE" : "CONNECTING"}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)", fontFamily: "'JetBrains Mono', monospace" }}>
                {displayedEvents.length} events
              </span>
              <button
                onClick={() => setPaused((p) => !p)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded transition-all"
                style={{
                  background: paused ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${paused ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {paused ? (
                  <><Play size={9} style={{ color: "#F59E0B" }} /><span className="text-[9px] font-mono" style={{ color: "#F59E0B" }}>Resume</span></>
                ) : (
                  <><Pause size={9} style={{ color: "rgba(255,255,255,0.4)" }} /><span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>Pause</span></>
                )}
              </button>
            </div>
          </div>

          {displayedEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    style={{ background: "#6366F1" }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
                Establishing telemetry stream…
              </span>
            </div>
          )}

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto py-2"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {displayedEvents.map((evt, i) => (
                <TerminalEventRow key={evt.id} event={evt} index={i} />
              ))}
            </AnimatePresence>
          </div>

          <div
            className="px-4 py-2 shrink-0 flex items-center gap-4 flex-wrap"
            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
          >
            {(Object.entries(EVENT_TYPE_LABELS) as [TelemetryEventType, string][]).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1">
                <span
                  className="text-[8px] font-bold px-1 py-0.5 rounded"
                  style={{ color: EVENT_TYPE_COLORS[type], background: `${EVENT_TYPE_COLORS[type]}15` }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="xl:w-64 shrink-0 flex flex-col gap-4">
        <EcosystemPulsePanel pulse={pulse} />
        {health.length > 0 && <VentureHealthBar health={health} />}
      </div>
    </div>
  );
}
