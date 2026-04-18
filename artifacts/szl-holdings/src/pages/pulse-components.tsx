import { useState, useEffect, useRef, useMemo, memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Cpu, Globe, Shield, Anchor, Building2, Scale,
  Sparkles, Network, Radio, Signal, Eye, GitCommit,
  ChevronRight,
} from "lucide-react";

export const PLATFORM_APPS = [
  { id: "szl-holdings", name: "SZL Holdings", icon: Building2, color: "#d4a054", domain: "holdings", orbit: 1, angle: 0, desc: "Governed operational intelligence platform" },
  { id: "lyte", name: "Lyte", icon: () => null, color: "#f59e0b", domain: "observability", orbit: 2, angle: 0, desc: "Decision intelligence engine" },
  { id: "aegis", name: "Aegis", icon: Shield, color: "#3b82f6", domain: "security", orbit: 2, angle: 72, desc: "Unified defense & intelligence" },
  { id: "vessels", name: "Vessels", icon: Anchor, color: "#06b6d4", domain: "maritime", orbit: 2, angle: 144, desc: "Fleet command intelligence" },
  { id: "terra", name: "Terra", icon: Globe, color: "#10b981", domain: "real-estate", orbit: 2, angle: 216, desc: "Real estate portfolio intel" },
  { id: "carlota-jo", name: "Carlota Jo", icon: Sparkles, color: "#c4a265", domain: "advisory", orbit: 2, angle: 288, desc: "UHNW residential advisory" },
  { id: "prism", name: "PRISM Counsel", icon: Scale, color: "#8b5cf6", domain: "legal", orbit: 3, angle: 0, desc: "Legal matter observability" },
  { id: "nexus", name: "Nexus", icon: Network, color: "#ec4899", domain: "fusion", orbit: 3, angle: 36, desc: "Cross-domain fusion canvas" },
  { id: "alloy", name: "Alloy", icon: Cpu, color: "#64748b", domain: "automation", orbit: 3, angle: 72, desc: "Execution fabric & audit" },
  { id: "lyte-cc", name: "Lyte CC", icon: Radio, color: "#f97316", domain: "command", orbit: 3, angle: 108, desc: "AIOps command center" },
  { id: "stephen", name: "Stephen", icon: Eye, color: "#94a3b8", domain: "identity", orbit: 3, angle: 144, desc: "Founder identity site" },
  { id: "szl-mobile", name: "SZL Mobile", icon: Signal, color: "#d4a054", domain: "mobile", orbit: 3, angle: 180, desc: "Executive mobile command" },
  { id: "aegis-mobile", name: "Aegis Mobile", icon: Shield, color: "#3b82f6", domain: "mobile", orbit: 3, angle: 216, desc: "SOC mobile command" },
  { id: "vessels-mobile", name: "Vessels Mobile", icon: Anchor, color: "#06b6d4", domain: "mobile", orbit: 3, angle: 252, desc: "Fleet mobile command" },
  { id: "terra-mobile", name: "Terra Mobile", icon: Globe, color: "#10b981", domain: "mobile", orbit: 3, angle: 288, desc: "Field intelligence mobile" },
  { id: "api-server", name: "API Server", icon: Cpu, color: "#d4a054", domain: "api", orbit: 3, angle: 324, desc: "1,618+ REST endpoints" },
];

export const AGENT_TYPES = [
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

export interface PulseEvent {
  id: string;
  type: string;
  agent: string;
  domain: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: number;
}

export function generatePulseEvent(): PulseEvent {
  const agent = AGENT_TYPES[Math.floor(Math.random() * AGENT_TYPES.length)];
  const types = ["correlation_found", "insight_generated", "threat_scan", "anomaly_check", "route_analysis", "deal_scored", "compliance_check", "model_inference", "causal_chain", "proactive_activation"];
  const type = types[Math.floor(Math.random() * types.length)];
  const severities: PulseEvent["severity"][] = ["info", "info", "info", "low", "low", "medium", "high"];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const messages: Record<string, string[]> = {
    correlation_found: ["Cross-domain signal correlated", "Multi-vector pattern matched", "Temporal correlation chain detected"],
    insight_generated: ["Portfolio insight synthesized", "Market signal processed", "Trend anomaly flagged"],
    threat_scan: ["Perimeter scan complete — 0 IOCs", "Vulnerability assessment passed", "MITRE ATT&CK coverage updated"],
    anomaly_check: ["Behavioral baseline updated", "Deviation threshold exceeded", "Pattern regression detected"],
    route_analysis: ["Route deviation scored at 0.03σ", "ETA recalculated — 2h delta", "Port congestion index: low"],
    deal_scored: ["Deal pipeline scored: 87/100", "Valuation model updated", "3 comparable deals analyzed"],
    compliance_check: ["Regulatory checkpoint passed", "Filing deadline: 14d", "Contract clause flagged — review"],
    model_inference: ["Qwen3-8B inference: 142ms", "Confidence calibration: +2.3%", "Agent budget: $0.004 spent"],
    causal_chain: ["3-hop causal chain identified", "Root cause isolated: supply delay", "Counterfactual generated"],
    proactive_activation: ["Proactive scan triggered", "Signal threshold met — activating", "Pre-emptive alert dispatched"],
  };
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type, agent: agent.name, domain: agent.domain, severity,
    message: messages[type][Math.floor(Math.random() * messages[type].length)],
    timestamp: Date.now(),
  };
}

export function severityColor(severity: string) {
  switch (severity) {
    case "critical": return "#ef4444";
    case "high": return "#f97316";
    case "medium": return "#f59e0b";
    case "low": return "#3b82f6";
    default: return "rgba(255,255,255,0.3)";
  }
}

export const ParticleField = memo(function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth * 2; canvas.height = canvas.offsetHeight * 2; };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];
    const colors = ["#d4a054", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = (1 - dist / 120) * 0.06;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none", opacity: 0.6 }} />;
});

export const ConstellationView = memo(function ConstellationView({ onSelectApp }: { onSelectApp: (app: typeof PLATFORM_APPS[0] | null) => void }) {
  const [rotation, setRotation] = useState(0);
  const [activeSignals, setActiveSignals] = useState<{ from: number; to: number; id: string; color: string }[]>([]);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setRotation(r => r + 0.12), 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const from = Math.floor(Math.random() * PLATFORM_APPS.length);
      let to = Math.floor(Math.random() * PLATFORM_APPS.length);
      while (to === from) to = Math.floor(Math.random() * PLATFORM_APPS.length);
      const colors = ["#d4a054", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"];
      setActiveSignals(prev => [
        ...prev.slice(-5),
        { from, to, id: `sig-${Date.now()}`, color: colors[Math.floor(Math.random() * colors.length)] }
      ]);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setActiveSignals(prev => prev.filter(s => Date.now() - parseInt(s.id.split("-")[1]) < 3000));
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  const centerX = 220;
  const centerY = 220;
  const orbitRadii = [0, 90, 155, 200];

  const appPositions = useMemo(() => {
    return PLATFORM_APPS.map(app => {
      const orbitSpeed = app.orbit === 1 ? 0 : app.orbit === 2 ? 1 : 0.6;
      const angle = (app.angle + rotation * orbitSpeed) * (Math.PI / 180);
      const r = orbitRadii[app.orbit];
      return { ...app, x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
    });
  }, [rotation]);

  return (
    <svg viewBox="0 0 440 440" className="w-full max-w-[440px] mx-auto cursor-pointer">
      <defs>
        <radialGradient id="coreGlow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d4a054" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#d4a054" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#d4a054" stopOpacity="0" />
        </radialGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <circle cx={centerX} cy={centerY} r="210" fill="url(#coreGlow2)" />

      {[90, 155, 200].map(r => (
        <circle key={r} cx={centerX} cy={centerY} r={r}
          fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2 4" />
      ))}

      {activeSignals.map(sig => {
        const from = appPositions[sig.from];
        const to = appPositions[sig.to];
        if (!from || !to) return null;
        const midX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 30;
        const midY = (from.y + to.y) / 2 + (Math.random() - 0.5) * 30;
        return (
          <g key={sig.id}>
            <path
              d={`M${from.x},${from.y} Q${midX},${midY} ${to.x},${to.y}`}
              fill="none" stroke={sig.color} strokeWidth="1.5" opacity="0.4"
              strokeDasharray="4 4">
              <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite" />
            </path>
            <circle r="2.5" fill={sig.color} filter="url(#glow2)">
              <animateMotion dur="1.2s" fill="freeze" path={`M${from.x - centerX},${from.y - centerY} Q${midX - centerX},${midY - centerY} ${to.x - centerX},${to.y - centerY}`} />
            </circle>
          </g>
        );
      })}

      <circle cx={centerX} cy={centerY} r="24" fill="rgba(212,160,84,0.12)" stroke="#d4a054" strokeWidth="1.5" filter="url(#softGlow)">
        <animate attributeName="r" values="22;26;22" dur="4s" repeatCount="indefinite" />
      </circle>
      <text x={centerX} y={centerY + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#d4a054" fontSize="10" fontWeight="800" fontFamily="system-ui">SZL</text>

      {appPositions.slice(1).map((app) => {
        const isHovered = hoveredApp === app.id;
        return (
          <g key={app.id}
            onMouseEnter={() => setHoveredApp(app.id)}
            onMouseLeave={() => setHoveredApp(null)}
            onClick={() => onSelectApp(app)}
            style={{ cursor: "pointer" }}
          >
            <circle cx={app.x} cy={app.y} r={isHovered ? 18 : 14} fill={isHovered ? `${app.color}15` : "rgba(255,255,255,0.02)"}
              stroke={app.color} strokeWidth={isHovered ? 2 : 1} style={{ transition: "all 0.2s" }} />
            <circle cx={app.x} cy={app.y} r="14" fill="none"
              stroke={app.color} strokeWidth="0.5" opacity="0.2">
              <animate attributeName="r" values="14;22;14" dur="5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0;0.2" dur="5s" repeatCount="indefinite" />
            </circle>
            <text x={app.x} y={app.y + 1} textAnchor="middle" dominantBaseline="middle"
              fill={app.color} fontSize={isHovered ? 7 : 6} fontWeight="700" fontFamily="system-ui"
              style={{ transition: "font-size 0.2s" }}>
              {app.name.slice(0, 3).toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
});

export const GitTicker = memo(function GitTicker() {
  const commits = [
    { hash: "e0798e0", msg: "feat: Platform Pulse — ecosystem dashboard", author: "stephen", time: "2m ago", files: 4 },
    { hash: "b33ba2a", msg: "feat: dashboard UI redesign across all apps", author: "agent-459", time: "14m ago", files: 18 },
    { hash: "b1a0925", msg: "feat: agent framework evolution — 4 agents", author: "agent-457", time: "28m ago", files: 5 },
    { hash: "b317e94", msg: "fix: 190 TypeScript errors zeroed out", author: "agent-468", time: "35m ago", files: 22 },
    { hash: "5545dd9", msg: "feat: 8 frontier agentic AI capabilities", author: "agent-470", time: "41m ago", files: 12 },
    { hash: "79cb07f", msg: "chore: web app polish & investor cleanup", author: "agent-453", time: "52m ago", files: 8 },
    { hash: "dc164a8", msg: "chore: dependency audit & cleanup", author: "agent-452", time: "1h ago", files: 9 },
    { hash: "1315b2c", msg: "feat: mobile redesign + federation + streaming", author: "agent-471", time: "1h ago", files: 16 },
  ];

  const [visibleIdx, setVisibleIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setVisibleIdx(prev => (prev + 1) % commits.length), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-1">
      <AnimatePresence mode="popLayout">
        {commits.slice(visibleIdx, visibleIdx + 4).map(commit => (
          <m.div
            key={commit.hash}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}
          >
            <GitCommit className="w-3 h-3 flex-shrink-0" style={{ color: "#d4a054" }} />
            <code className="text-[10px] font-mono flex-shrink-0" style={{ color: "rgba(212,160,84,0.7)" }}>{commit.hash}</code>
            <span className="text-[10px] truncate flex-1" style={{ color: "rgba(255,255,255,0.45)" }}>{commit.msg}</span>
            <span className="text-[9px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{commit.time}</span>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

export const AgentNeuralMesh = memo(function AgentNeuralMesh() {
  const [events, setEvents] = useState<PulseEvent[]>([]);
  useEffect(() => {
    setEvents(Array.from({ length: 8 }, () => generatePulseEvent()));
    const timer = setInterval(() => {
      setEvents(prev => [generatePulseEvent(), ...prev].slice(0, 14));
    }, 2200);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="space-y-1.5">
      <AnimatePresence mode="popLayout">
        {events.slice(0, 8).map(event => (
          <m.div key={event.id} layout
            initial={{ opacity: 0, x: -16, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-3 px-3 py-2 rounded-md"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.035)" }}>
            <div className="mt-1.5 relative flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: severityColor(event.severity) }} />
              {event.severity !== "info" && (
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping" style={{ background: severityColor(event.severity), opacity: 0.4 }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: severityColor(event.severity) === "rgba(255,255,255,0.3)" ? "rgba(255,255,255,0.5)" : severityColor(event.severity) }}>{event.agent}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)" }}>{event.type.replace(/_/g, " ")}</span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{event.message}</p>
            </div>
            <span className="text-[9px] flex-shrink-0 mt-1 tabular-nums" style={{ color: "rgba(255,255,255,0.12)" }}>
              {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

export function DomainHealthGrid() {
  const domains = [
    { name: "SZL Holdings", load: 23, color: "#d4a054" },
    { name: "Lyte Platform", load: 41, color: "#f59e0b" },
    { name: "Aegis Defense", load: 67, color: "#3b82f6" },
    { name: "Vessels Maritime", load: 35, color: "#06b6d4" },
    { name: "Terra Real Estate", load: 28, color: "#10b981" },
    { name: "Carlota Jo", load: 19, color: "#c4a265" },
    { name: "PRISM Counsel", load: 44, color: "#8b5cf6" },
    { name: "Nexus Fusion", load: 52, color: "#ec4899" },
    { name: "Alloy Fabric", load: 31, color: "#64748b" },
    { name: "API Gateway", load: 58, color: "#d4a054" },
    { name: "Neural Mesh", load: 73, color: "#f59e0b" },
    { name: "Event Bus", load: 45, color: "#3b82f6" },
  ];
  const [loads, setLoads] = useState(domains.map(d => d.load));
  useEffect(() => {
    const timer = setInterval(() => {
      setLoads(prev => prev.map(l => Math.max(5, Math.min(95, l + (Math.random() - 0.5) * 8))));
    }, 2500);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {domains.map((domain, i) => (
        <m.div key={domain.name} className="rounded-md px-3 py-2.5 group cursor-default"
          whileHover={{ scale: 1.02 }}
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.035)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
            <span className="text-[10px] font-medium truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{domain.name}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            <m.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${domain.color}80, ${domain.color})` }}
              animate={{ width: `${loads[i]}%` }} transition={{ duration: 1.2, ease: "easeInOut" }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>Load</span>
            <span className="text-[9px] tabular-nums font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{Math.round(loads[i])}%</span>
          </div>
        </m.div>
      ))}
    </div>
  );
}

export function CrossDomainIntelFlow() {
  const flows = [
    { from: "Aegis", to: "Lyte", type: "Threat → Priority Signal", color: "#3b82f6", intensity: 3 },
    { from: "Vessels", to: "Terra", type: "Port Data → Supply Chain", color: "#06b6d4", intensity: 2 },
    { from: "Terra", to: "PRISM", type: "Deal → Compliance Review", color: "#10b981", intensity: 4 },
    { from: "Nexus", to: "All", type: "Fusion Intelligence Broadcast", color: "#ec4899", intensity: 5 },
    { from: "Alloy", to: "All", type: "Execution Fabric Dispatch", color: "#64748b", intensity: 3 },
    { from: "Lyte", to: "Aegis", type: "Anomaly → Investigation", color: "#f59e0b", intensity: 2 },
  ];
  const [activeFlow, setActiveFlow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setActiveFlow(prev => (prev + 1) % flows.length), 2500);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="space-y-1.5">
      {flows.map((flow, i) => (
        <m.div key={`${flow.from}-${flow.to}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md"
          animate={{
            background: i === activeFlow ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.01)",
            borderColor: i === activeFlow ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.025)",
          }}
          style={{ border: "1px solid rgba(255,255,255,0.025)" }}
          transition={{ duration: 0.5 }}>
          <div className="w-14 text-right">
            <span className="text-[11px] font-semibold" style={{ color: flow.color }}>{flow.from}</span>
          </div>
          <div className="flex-1 h-[2px] relative overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
            {i === activeFlow && (
              <m.div className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${flow.color})`, width: "40%" }}
                animate={{ left: ["0%", "60%", "0%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
            )}
          </div>
          <ChevronRight className="w-3 h-3" style={{ color: i === activeFlow ? flow.color : "rgba(255,255,255,0.08)" }} />
          <div className="w-14">
            <span className="text-[11px] font-semibold" style={{ color: i === activeFlow ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.25)" }}>{flow.to}</span>
          </div>
          <span className="text-[9px] hidden sm:block flex-1 truncate" style={{ color: "rgba(255,255,255,0.18)" }}>{flow.type}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="w-1 h-3 rounded-sm"
                style={{ background: j < flow.intensity ? flow.color : "rgba(255,255,255,0.04)", opacity: j < flow.intensity ? (i === activeFlow ? 0.8 : 0.3) : 1 }} />
            ))}
          </div>
        </m.div>
      ))}
    </div>
  );
}

export function AppDetailPanel({ app, onClose }: { app: typeof PLATFORM_APPS[0]; onClose: () => void }) {
  const Icon = app.icon;
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="rounded-lg p-5 relative"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${app.color}30` }}>
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${app.color}, transparent)` }} />
      <button onClick={onClose} className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded"
        style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)" }}>Close</button>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${app.color}15`, border: `1px solid ${app.color}30` }}>
          <Icon className="w-5 h-5" style={{ color: app.color }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{app.name}</h3>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{app.desc}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="rounded-md p-2.5 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="text-lg font-bold tabular-nums" style={{ color: app.color }}>99.9%</div>
          <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>Uptime</div>
        </div>
        <div className="rounded-md p-2.5 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="text-lg font-bold tabular-nums" style={{ color: app.color }}>{Math.floor(Math.random() * 50 + 10)}ms</div>
          <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>Latency</div>
        </div>
        <div className="rounded-md p-2.5 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="text-lg font-bold tabular-nums" style={{ color: "#10b981" }}>Live</div>
          <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>Status</div>
        </div>
      </div>
    </m.div>
  );
}

export const ThroughputChart = memo(function ThroughputChart() {
  const [dataPoints, setDataPoints] = useState<number[]>(() =>
    Array.from({ length: 30 }, () => Math.random() * 60 + 20)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setDataPoints(prev => [...prev.slice(1), Math.random() * 60 + 20]);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const max = Math.max(...dataPoints, 1);
  const w = 400;
  const h = 80;
  const points = dataPoints.map((v, i) => `${(i / (dataPoints.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id="throughput-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a054" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#d4a054" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="throughput-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d4a054" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#d4a054" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#d4a054" stopOpacity="1" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#throughput-fill)" />
      <polyline points={points} fill="none" stroke="url(#throughput-stroke)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={w} cy={h - (dataPoints[dataPoints.length - 1] / max) * h} r="3" fill="#d4a054">
        <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
});
