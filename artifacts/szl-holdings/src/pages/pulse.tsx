import { useState, useEffect, useCallback, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Activity, Cpu, Globe, Shield, Anchor, Building2, Scale,
  Zap, Network, Radio, TrendingUp, Eye, Brain,
  Layers, ChevronRight, Sparkles, Signal
} from "lucide-react";

const PLATFORM_APPS = [
  { id: "szl-holdings", name: "SZL Holdings", icon: Building2, color: "#d4a054", domain: "holdings", orbit: 1, angle: 0 },
  { id: "lyte", name: "Lyte", icon: Activity, color: "#f59e0b", domain: "observability", orbit: 2, angle: 0 },
  { id: "aegis", name: "Aegis", icon: Shield, color: "#3b82f6", domain: "security", orbit: 2, angle: 72 },
  { id: "vessels", name: "Vessels", icon: Anchor, color: "#06b6d4", domain: "maritime", orbit: 2, angle: 144 },
  { id: "terra", name: "Terra", icon: Globe, color: "#10b981", domain: "real-estate", orbit: 2, angle: 216 },
  { id: "carlota-jo", name: "Carlota Jo", icon: Sparkles, color: "#c4a265", domain: "advisory", orbit: 2, angle: 288 },
  { id: "prism", name: "PRISM Counsel", icon: Scale, color: "#8b5cf6", domain: "legal", orbit: 3, angle: 0 },
  { id: "nexus", name: "Nexus", icon: Network, color: "#ec4899", domain: "fusion", orbit: 3, angle: 36 },
  { id: "alloy", name: "Alloy", icon: Cpu, color: "#64748b", domain: "automation", orbit: 3, angle: 72 },
  { id: "lyte-cc", name: "Lyte CC", icon: Radio, color: "#f97316", domain: "command", orbit: 3, angle: 108 },
  { id: "stephen", name: "Stephen", icon: Eye, color: "#94a3b8", domain: "identity", orbit: 3, angle: 144 },
  { id: "szl-mobile", name: "SZL Mobile", icon: Signal, color: "#d4a054", domain: "mobile", orbit: 3, angle: 180 },
  { id: "aegis-mobile", name: "Aegis Mobile", icon: Shield, color: "#3b82f6", domain: "mobile", orbit: 3, angle: 216 },
  { id: "vessels-mobile", name: "Vessels Mobile", icon: Anchor, color: "#06b6d4", domain: "mobile", orbit: 3, angle: 252 },
  { id: "terra-mobile", name: "Terra Mobile", icon: Globe, color: "#10b981", domain: "mobile", orbit: 3, angle: 288 },
  { id: "api-server", name: "API Server", icon: Cpu, color: "#d4a054", domain: "api", orbit: 3, angle: 324 },
];

const AGENT_TYPES = [
  { id: "aegis-autonomous", domain: "aegis", name: "Aegis SOC", color: "#3b82f6" },
  { id: "vessels-autonomous", domain: "vessels", name: "Vessels Fleet", color: "#06b6d4" },
  { id: "terra-autonomous", domain: "terra", name: "Terra Analyst", color: "#10b981" },
  { id: "lyte-autonomous", domain: "lyte", name: "Lyte Ops", color: "#f59e0b" },
  { id: "nexus-autonomous", domain: "nexus", name: "Nexus Fusion", color: "#ec4899" },
  { id: "inca-autonomous", domain: "inca", name: "Inca Lab", color: "#8b5cf6" },
  { id: "msp-autonomous", domain: "msp", name: "MSP Watchdog", color: "#64748b" },
  { id: "lexis-autonomous", domain: "legal", name: "Lexis Legal", color: "#a855f7" },
  { id: "atlas-autonomous", domain: "financial", name: "Atlas Finance", color: "#d4a054" },
  { id: "helmsman-autonomous", domain: "alloy", name: "Helmsman", color: "#94a3b8" },
  { id: "compass-autonomous", domain: "advisory", name: "Compass CJ", color: "#c4a265" },
  { id: "muse-autonomous", domain: "creative", name: "Muse Creative", color: "#f472b6" },
];

interface PulseEvent {
  id: string;
  type: string;
  agent: string;
  domain: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: number;
}

function generatePulseEvent(): PulseEvent {
  const agent = AGENT_TYPES[Math.floor(Math.random() * AGENT_TYPES.length)];
  const types = ["correlation_found", "insight_generated", "threat_scan", "anomaly_check", "route_analysis", "deal_scored", "compliance_check"];
  const type = types[Math.floor(Math.random() * types.length)];
  const severities: PulseEvent["severity"][] = ["info", "info", "info", "low", "medium", "high"];
  const severity = severities[Math.floor(Math.random() * severities.length)];

  const messages: Record<string, string[]> = {
    correlation_found: ["Cross-domain signal correlated", "Multi-vector pattern identified", "Temporal correlation detected"],
    insight_generated: ["Portfolio insight synthesized", "Market signal processed", "Trend anomaly flagged"],
    threat_scan: ["Perimeter scan complete", "IOC hash matched", "Vulnerability assessment done"],
    anomaly_check: ["Behavioral baseline updated", "Deviation threshold exceeded", "Pattern regression detected"],
    route_analysis: ["Route deviation scored", "ETA recalculated", "Port congestion analyzed"],
    deal_scored: ["Deal pipeline scored", "Valuation model updated", "Comparable analysis run"],
    compliance_check: ["Regulatory checkpoint passed", "Filing deadline tracked", "Contract clause flagged"],
  };

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    agent: agent.name,
    domain: agent.domain,
    severity,
    message: messages[type][Math.floor(Math.random() * messages[type].length)],
    timestamp: Date.now(),
  };
}

function severityColor(severity: string) {
  switch (severity) {
    case "critical": return "#ef4444";
    case "high": return "#f97316";
    case "medium": return "#f59e0b";
    case "low": return "#3b82f6";
    default: return "rgba(255,255,255,0.3)";
  }
}

function ConstellationView() {
  const [rotation, setRotation] = useState(0);
  const [activeSignals, setActiveSignals] = useState<{ from: number; to: number; id: string; color: string }[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setRotation(r => r + 0.15), 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const from = Math.floor(Math.random() * PLATFORM_APPS.length);
      let to = Math.floor(Math.random() * PLATFORM_APPS.length);
      while (to === from) to = Math.floor(Math.random() * PLATFORM_APPS.length);
      const colors = ["#d4a054", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"];
      setActiveSignals(prev => [
        ...prev.slice(-4),
        { from, to, id: `sig-${Date.now()}`, color: colors[Math.floor(Math.random() * colors.length)] }
      ]);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setActiveSignals(prev => prev.filter(s => Date.now() - parseInt(s.id.split("-")[1]) < 3000));
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  const centerX = 200;
  const centerY = 200;
  const orbitRadii = [0, 80, 140, 185];

  const appPositions = useMemo(() => {
    return PLATFORM_APPS.map(app => {
      const orbitSpeed = app.orbit === 1 ? 0 : app.orbit === 2 ? 1 : 0.6;
      const angle = (app.angle + rotation * orbitSpeed) * (Math.PI / 180);
      const r = orbitRadii[app.orbit];
      return {
        ...app,
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      };
    });
  }, [rotation]);

  return (
    <div className="relative">
      <svg viewBox="0 0 400 400" className="w-full max-w-[500px] mx-auto">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d4a054" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#d4a054" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={centerX} cy={centerY} r="190" fill="url(#coreGlow)" />

        {[80, 140, 185].map(r => (
          <circle key={r} cx={centerX} cy={centerY} r={r}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"
            strokeDasharray="4 6" />
        ))}

        {activeSignals.map(sig => {
          const from = appPositions[sig.from];
          const to = appPositions[sig.to];
          return (
            <g key={sig.id}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={sig.color} strokeWidth="1" opacity="0.6"
                strokeDasharray="3 3">
                <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.5s" repeatCount="indefinite" />
              </line>
              <circle r="3" fill={sig.color} filter="url(#glow)">
                <animateMotion dur="1.5s" fill="freeze">
                  <mpath href={`#path-${sig.id}`} />
                </animateMotion>
              </circle>
              <path id={`path-${sig.id}`} d={`M${from.x},${from.y} L${to.x},${to.y}`} fill="none" />
            </g>
          );
        })}

        <circle cx={centerX} cy={centerY} r="20" fill="rgba(212,160,84,0.15)" stroke="#d4a054" strokeWidth="1.5">
          <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite" />
        </circle>
        <text x={centerX} y={centerY + 1} textAnchor="middle" dominantBaseline="middle"
          fill="#d4a054" fontSize="9" fontWeight="800" fontFamily="system-ui">SZL</text>

        {appPositions.slice(1).map(app => (
          <g key={app.id}>
            <circle cx={app.x} cy={app.y} r="14" fill="rgba(255,255,255,0.03)"
              stroke={app.color} strokeWidth="1" />
            <circle cx={app.x} cy={app.y} r="14" fill="none"
              stroke={app.color} strokeWidth="0.5" opacity="0.3">
              <animate attributeName="r" values="14;20;14" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" repeatCount="indefinite" />
            </circle>
            <text x={app.x} y={app.y + 1} textAnchor="middle" dominantBaseline="middle"
              fill={app.color} fontSize="6" fontWeight="600" fontFamily="system-ui">
              {app.name.slice(0, 3).toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function AgentNeuralMesh() {
  const [events, setEvents] = useState<PulseEvent[]>([]);

  useEffect(() => {
    const initial = Array.from({ length: 6 }, () => generatePulseEvent());
    setEvents(initial);
    const timer = setInterval(() => {
      setEvents(prev => [generatePulseEvent(), ...prev].slice(0, 12));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {events.slice(0, 8).map(event => (
          <m.div
            key={event.id}
            layout
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 px-3 py-2 rounded-md"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: severityColor(event.severity) }}>
              <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: severityColor(event.severity), opacity: 0.5 }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: severityColor(event.severity) === "rgba(255,255,255,0.3)" ? "rgba(255,255,255,0.5)" : severityColor(event.severity) }}>
                  {event.agent}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {event.type.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                {event.message}
              </p>
            </div>
            <span className="text-[9px] flex-shrink-0 mt-1" style={{ color: "rgba(255,255,255,0.15)" }}>
              {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ label, value, suffix, icon: Icon, color, trend }: {
  label: string; value: number; suffix?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string; trend?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 25);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg p-4"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.88)" }}>
          {displayValue.toLocaleString()}
        </span>
        {suffix && <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>{suffix}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp className="w-3 h-3" style={{ color }} />
          <span className="text-[10px]" style={{ color }}>{trend}</span>
        </div>
      )}
    </m.div>
  );
}

function HeartbeatLine() {
  return (
    <div className="relative h-12 overflow-hidden">
      <svg viewBox="0 0 600 50" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="heartbeat-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d4a054" stopOpacity="0" />
            <stop offset="30%" stopColor="#d4a054" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d4a054" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          d="M0,25 L100,25 L120,25 L130,10 L140,40 L150,5 L160,45 L170,25 L190,25 L300,25 L320,25 L330,12 L340,38 L350,8 L360,42 L370,25 L390,25 L500,25 L520,25 L530,10 L540,40 L550,5 L560,45 L570,25 L600,25"
          fill="none"
          stroke="url(#heartbeat-grad)"
          strokeWidth="2"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to="-200 0"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #070a10, transparent 20%, transparent 80%, #070a10)" }} />
    </div>
  );
}

function DomainHealthGrid() {
  const domains = [
    { name: "SZL Holdings", status: "operational", load: 23, color: "#d4a054" },
    { name: "Lyte Platform", status: "operational", load: 41, color: "#f59e0b" },
    { name: "Aegis Defense", status: "operational", load: 67, color: "#3b82f6" },
    { name: "Vessels Maritime", status: "operational", load: 35, color: "#06b6d4" },
    { name: "Terra Real Estate", status: "operational", load: 28, color: "#10b981" },
    { name: "Carlota Jo Advisory", status: "operational", load: 19, color: "#c4a265" },
    { name: "PRISM Counsel", status: "operational", load: 44, color: "#8b5cf6" },
    { name: "Nexus Fusion", status: "operational", load: 52, color: "#ec4899" },
    { name: "Alloy Fabric", status: "operational", load: 31, color: "#64748b" },
    { name: "API Gateway", status: "operational", load: 58, color: "#d4a054" },
    { name: "Neural Mesh", status: "operational", load: 73, color: "#f59e0b" },
    { name: "Event Bus", status: "operational", load: 45, color: "#3b82f6" },
  ];

  const [loads, setLoads] = useState(domains.map(d => d.load));

  useEffect(() => {
    const timer = setInterval(() => {
      setLoads(prev => prev.map(l => Math.max(5, Math.min(95, l + (Math.random() - 0.5) * 10))));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {domains.map((domain, i) => (
        <div key={domain.name} className="rounded-md px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
            <span className="text-[10px] font-medium truncate" style={{ color: "rgba(255,255,255,0.55)" }}>{domain.name}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <m.div
              className="h-full rounded-full"
              style={{ background: domain.color }}
              animate={{ width: `${loads[i]}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>Load</span>
            <span className="text-[9px] tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>{Math.round(loads[i])}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CrossDomainIntelFlow() {
  const flows = [
    { from: "Aegis", to: "Lyte", type: "Threat → Priority", color: "#3b82f6", intensity: 3 },
    { from: "Vessels", to: "Terra", type: "Port Data → Logistics", color: "#06b6d4", intensity: 2 },
    { from: "Terra", to: "PRISM", type: "Deal → Compliance", color: "#10b981", intensity: 4 },
    { from: "Nexus", to: "All", type: "Fusion Intelligence", color: "#ec4899", intensity: 5 },
    { from: "Alloy", to: "All", type: "Execution Fabric", color: "#64748b", intensity: 3 },
    { from: "Lyte", to: "Aegis", type: "Anomaly → Investigation", color: "#f59e0b", intensity: 2 },
  ];

  const [activeFlow, setActiveFlow] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFlow(prev => (prev + 1) % flows.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-1.5">
      {flows.map((flow, i) => (
        <m.div
          key={`${flow.from}-${flow.to}`}
          className="flex items-center gap-3 px-3 py-2 rounded-md"
          animate={{
            background: i === activeFlow ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
            borderColor: i === activeFlow ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
          }}
          style={{ border: "1px solid rgba(255,255,255,0.03)" }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 text-right">
            <span className="text-[11px] font-semibold" style={{ color: flow.color }}>{flow.from}</span>
          </div>
          <div className="flex-1 h-[2px] relative overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
            {i === activeFlow && (
              <m.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: flow.color, width: "30%" }}
                animate={{ left: ["0%", "70%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
          <ChevronRight className="w-3 h-3" style={{ color: i === activeFlow ? flow.color : "rgba(255,255,255,0.1)" }} />
          <div className="w-16">
            <span className="text-[11px] font-semibold" style={{ color: i === activeFlow ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>{flow.to}</span>
          </div>
          <span className="text-[9px] hidden sm:block w-32 truncate" style={{ color: "rgba(255,255,255,0.2)" }}>{flow.type}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="w-1 h-3 rounded-sm"
                style={{ background: j < flow.intensity ? flow.color : "rgba(255,255,255,0.05)", opacity: j < flow.intensity ? 0.6 : 1 }} />
            ))}
          </div>
        </m.div>
      ))}
    </div>
  );
}

export default function PulsePage() {
  const [uptime, setUptime] = useState("99.97%");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const uptimes = ["99.97%", "99.98%", "99.99%", "99.97%"];
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(uptimes[Math.floor(Math.random() * uptimes.length)]);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#070a10" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h1 className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.88)" }}>
                Platform Pulse
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: "rgba(212,160,84,0.15)", color: "#d4a054" }}>
                LIVE
              </span>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              Real-time ecosystem intelligence across all SZL Holdings platforms
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>System Uptime</div>
              <div className="text-lg font-bold tabular-nums" style={{ color: "#10b981" }}>{uptime}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>UTC</div>
              <div className="text-lg font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.55)" }}>
                {time.toUTCString().slice(17, 25)}
              </div>
            </div>
          </div>
        </m.div>

        <HeartbeatLine />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
          <MetricCard label="Applications" value={16} icon={Layers} color="#d4a054" trend="All operational" />
          <MetricCard label="DB Tables" value={446} icon={Cpu} color="#3b82f6" trend="+12 this week" />
          <MetricCard label="API Endpoints" value={1618} suffix="+" icon={Globe} color="#06b6d4" trend="+47 this sprint" />
          <MetricCard label="Active Agents" value={12} icon={Brain} color="#8b5cf6" trend="Neural mesh online" />
          <MetricCard label="Signals / hr" value={847} icon={Signal} color="#f59e0b" trend="+23% throughput" />
          <MetricCard label="Domains" value={9} icon={Eye} color="#10b981" trend="Full coverage" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 rounded-lg p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #d4a054, #8b5cf6)" }} />
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
              <Network className="w-4 h-4" style={{ color: "#d4a054" }} />
              Ecosystem Constellation
            </h2>
            <ConstellationView />
          </m.div>

          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-lg p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
              <Brain className="w-4 h-4" style={{ color: "#8b5cf6" }} />
              Agent Neural Mesh — Live Activity
            </h2>
            <AgentNeuralMesh />
          </m.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
              <Zap className="w-4 h-4" style={{ color: "#06b6d4" }} />
              Cross-Domain Intelligence Flow
            </h2>
            <CrossDomainIntelFlow />
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
              <Activity className="w-4 h-4" style={{ color: "#10b981" }} />
              Domain Health Matrix
            </h2>
            <DomainHealthGrid />
          </m.div>
        </div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-6"
        >
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.12)" }}>
            SZL Holdings — Platform Pulse — Real-Time Ecosystem Intelligence
          </p>
        </m.div>
      </div>
    </div>
  );
}
