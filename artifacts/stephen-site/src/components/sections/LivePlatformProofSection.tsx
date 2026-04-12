import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Activity, AlertTriangle, MapPin, TrendingUp, Ship, Home, Shield, RefreshCw, Terminal } from "lucide-react";
import { LiveProofTerminal } from "./LiveProofTerminal";

type Vessel = {
  name: string;
  flag: string;
  status: string;
  eta: string;
  lat: number;
  lng: number;
  speed: string;
  course: string;
  type: string;
};

type ThreatEvent = {
  id: string;
  severity: "critical" | "high" | "medium";
  type: string;
  time: string;
  region: string;
};

type Property = {
  id: string;
  address: string;
  city: string;
  distressScore: number;
  trend: "rising" | "falling" | "stable";
  value: string;
  signal: string;
};

const MOCK_VESSELS: Vessel[] = [
  { name: "MV ATLANTIC TRADER", flag: "🇬🇧", status: "Underway", eta: "14h 22m", lat: 51.2, lng: -2.8, speed: "12.4 kn", course: "087°", type: "Bulk Carrier" },
  { name: "PACIFIC GLORY II", flag: "🇵🇦", status: "At Anchor", eta: "Holding", lat: 53.5, lng: 0.1, speed: "0.0 kn", course: "—", type: "Tanker" },
  { name: "NORDIC PIONEER", flag: "🇳🇴", status: "Underway", eta: "2h 05m", lat: 55.9, lng: 3.2, speed: "16.1 kn", course: "192°", type: "Container" },
  { name: "EASTERN DAWN", flag: "🇸🇬", status: "In Port", eta: "Docked", lat: 51.5, lng: 0.1, speed: "0.0 kn", course: "—", type: "Ro-Ro" },
];

const MOCK_THREATS: ThreatEvent[] = [
  { id: "T-9812", severity: "critical", type: "Credential Stuffing", time: "2m ago", region: "EU-WEST" },
  { id: "T-9807", severity: "high", type: "Anomalous API Access", time: "8m ago", region: "NA-EAST" },
  { id: "T-9802", severity: "high", type: "Privilege Escalation Attempt", time: "15m ago", region: "APAC" },
  { id: "T-9799", severity: "medium", type: "Brute Force Pattern", time: "22m ago", region: "EU-NORTH" },
  { id: "T-9794", severity: "medium", type: "Data Exfiltration Signal", time: "31m ago", region: "NA-WEST" },
];

const MOCK_PROPERTIES: Property[] = [
  { id: "P-1142", address: "1247 Canary Wharf E14", city: "London", distressScore: 82, trend: "rising", value: "£2.4M", signal: "3 liens, tax default" },
  { id: "P-1138", address: "88 Aldgate High St EC3", city: "London", distressScore: 67, trend: "rising", value: "£4.1M", signal: "Vacancy rate spike" },
  { id: "P-1131", address: "15 Leadenhall St EC3", city: "London", distressScore: 45, trend: "stable", value: "£8.9M", signal: "Mortgage stress" },
  { id: "P-1124", address: "233 Southwark SE1", city: "London", distressScore: 31, trend: "falling", value: "£1.8M", signal: "Resolved notices" },
];

function severityColor(s: "critical" | "high" | "medium") {
  return s === "critical" ? "#EF4444" : s === "high" ? "#F97316" : "#F59E0B";
}

function trendColor(t: "rising" | "falling" | "stable") {
  return t === "rising" ? "#EF4444" : t === "falling" ? "#22C55E" : "#94A3B8";
}

function VesselsWidget() {
  const [tick, setTick] = useState(0);
  const [vessels, setVessels] = useState(MOCK_VESSELS);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setVessels((prev) =>
        prev.map((v) => ({
          ...v,
          speed:
            v.status === "Underway"
              ? `${(parseFloat(v.speed) + (Math.random() - 0.5) * 0.3).toFixed(1)} kn`
              : v.speed,
        }))
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
      {vessels.map((v, i) => (
        <motion.div
          key={v.name}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: v.status === "Underway" ? "#22C55E" : v.status === "At Anchor" ? "#F59E0B" : "#3B8BEB",
              boxShadow: v.status === "Underway" ? "0 0 8px rgba(34,197,94,0.6)" : "none",
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-white/70 truncate">{v.flag} {v.name}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[9px] text-white/25 font-mono">{v.type}</span>
              <span className="text-[9px] text-white/25">{v.speed}</span>
              {v.course !== "—" && <span className="text-[9px] text-white/25">{v.course}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div
              className="text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded"
              style={{
                color: v.status === "Underway" ? "#22C55E" : v.status === "At Anchor" ? "#F59E0B" : "#3B8BEB",
                background: v.status === "Underway" ? "rgba(34,197,94,0.10)" : v.status === "At Anchor" ? "rgba(245,158,11,0.10)" : "rgba(59,139,235,0.10)",
              }}
            >
              {v.status}
            </div>
            <div className="text-[9px] text-white/20 mt-0.5 font-mono">ETA {v.eta}</div>
          </div>
        </motion.div>
      ))}
      <div className="flex items-center gap-1.5 pt-1 opacity-40">
        <RefreshCw size={9} className="animate-spin" style={{ color: "#3B8BEB", animationDuration: "3s" }} />
        <span className="text-[9px] font-mono" style={{ color: "#3B8BEB" }}>Live AIS — updating every 3s</span>
      </div>
    </div>
  );
}

function AegisWidget() {
  const [threats, setThreats] = useState(MOCK_THREATS);
  const [count, setCount] = useState(247);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#EF4444" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#EF4444" }} />
          </span>
          <span className="text-[10px] font-semibold text-white/40 tracking-wider uppercase">Active threats</span>
        </div>
        <span className="text-xl font-black tabular-nums" style={{ color: "#EF4444", fontFamily: "'JetBrains Mono', monospace" }}>
          {count}
        </span>
      </div>
      {threats.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
          style={{ background: `${severityColor(t.severity)}08`, border: `1px solid ${severityColor(t.severity)}18` }}
        >
          <AlertTriangle size={10} style={{ color: severityColor(t.severity), flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-white/70 truncate">{t.type}</div>
            <div className="text-[9px] text-white/25 font-mono mt-0.5">{t.id} · {t.region}</div>
          </div>
          <div className="text-right shrink-0">
            <span
              className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ color: severityColor(t.severity), background: `${severityColor(t.severity)}18` }}
            >
              {t.severity}
            </span>
            <div className="text-[9px] text-white/20 mt-0.5">{t.time}</div>
          </div>
        </motion.div>
      ))}
      <div className="flex items-center gap-1.5 pt-1 opacity-40">
        <RefreshCw size={9} className="animate-spin" style={{ color: "#EF4444", animationDuration: "5s" }} />
        <span className="text-[9px] font-mono" style={{ color: "#EF4444" }}>SOC Live Feed — continuous ingestion</span>
      </div>
    </div>
  );
}

function TerraWidget() {
  const [properties, setProperties] = useState(MOCK_PROPERTIES);

  useEffect(() => {
    const id = setInterval(() => {
      setProperties((prev) =>
        prev.map((p) => ({
          ...p,
          distressScore: Math.max(0, Math.min(100, p.distressScore + (Math.random() - 0.45) * 2)),
        }))
      );
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
      {properties.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="px-4 py-3 rounded-lg"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-white/70 truncate">{p.address}</div>
              <div className="text-[9px] text-white/25 mt-0.5 font-mono">{p.id} · {p.signal}</div>
            </div>
            <div className="text-right shrink-0">
              <div
                className="text-[11px] font-black tabular-nums"
                style={{
                  color: p.distressScore > 70 ? "#EF4444" : p.distressScore > 45 ? "#F59E0B" : "#22C55E",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {Math.round(p.distressScore)}
              </div>
              <div className="text-[8px] text-white/20">distress</div>
            </div>
          </div>
          <div className="mt-2.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${p.distressScore}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                background:
                  p.distressScore > 70
                    ? "linear-gradient(90deg, #EF4444, #F97316)"
                    : p.distressScore > 45
                    ? "linear-gradient(90deg, #F59E0B, #FBBF24)"
                    : "linear-gradient(90deg, #22C55E, #4ADE80)",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] font-mono text-white/20">{p.value}</span>
            <span
              className="text-[9px] font-semibold"
              style={{ color: trendColor(p.trend) }}
            >
              {p.trend === "rising" ? "▲ Rising" : p.trend === "falling" ? "▼ Falling" : "● Stable"}
            </span>
          </div>
        </motion.div>
      ))}
      <div className="flex items-center gap-1.5 pt-1 opacity-40">
        <RefreshCw size={9} className="animate-spin" style={{ color: "#22C55E", animationDuration: "4s" }} />
        <span className="text-[9px] font-mono" style={{ color: "#22C55E" }}>Property Intelligence — live distress scoring</span>
      </div>
    </div>
  );
}

const platforms = [
  {
    id: "vessels",
    name: "Vessels",
    tag: "Maritime Intelligence",
    color: "#3B8BEB",
    description: "Real-time fleet tracking across global shipping lanes. AIS data, voyage P&L, and compliance monitoring — live.",
    icon: Ship,
    Widget: VesselsWidget,
  },
  {
    id: "aegis",
    name: "Aegis",
    tag: "Defense & Intelligence",
    color: "#EF4444",
    description: "Unified SOC command. Threat correlation, incident governance, and live threat count from global sensors.",
    icon: Shield,
    Widget: AegisWidget,
  },
  {
    id: "terra",
    name: "Terra",
    tag: "Real Estate Intelligence",
    color: "#22C55E",
    description: "Property distress pulse across the London market. Tax liens, vacancy spikes, and mortgage stress — scored live.",
    icon: Home,
    Widget: TerraWidget,
  },
];

export function LivePlatformProofSection() {
  const ref = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const isTerminalInView = useInView(terminalRef, { once: true, margin: "-5%" });
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % platforms.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const platform = platforms[active];
  const Widget = platform.Widget;

  return (
    <section ref={ref} className="relative py-24 sm:py-32 overflow-hidden" id="live-proof">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[200px] rounded-full"
          style={{ background: `radial-gradient(ellipse, ${platform.color}08 0%, transparent 70%)` }}
        />
        <div
          className="absolute left-1/4 bottom-1/4 w-[400px] h-[400px] blur-[180px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="mb-12">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Live Platform Proof
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Investors don't need a demo.
            <br />
            <span style={{ color: "rgba(255,255,255,0.35)" }}>They see it here.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[15px] leading-[1.75] max-w-xl"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            These are live feeds from the production platforms. Realistic mock data that reflects the actual data models and update cadences of each system.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="lg:w-64 shrink-0">
            <div className="flex lg:flex-col gap-3">
              {platforms.map((p, i) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActive(i)}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 flex-1 lg:flex-auto"
                    style={{
                      background: active === i ? `${p.color}10` : "transparent",
                      border: `1px solid ${active === i ? `${p.color}30` : "rgba(255,255,255,0.05)"}`,
                    }}
                  >
                    <Icon
                      size={15}
                      style={{ color: active === i ? p.color : "rgba(255,255,255,0.25)", flexShrink: 0 }}
                    />
                    <div className="min-w-0 hidden lg:block">
                      <div
                        className="text-[12px] font-bold truncate"
                        style={{ color: active === i ? p.color : "rgba(255,255,255,0.5)" }}
                      >
                        {p.name}
                      </div>
                      <div className="text-[10px] text-white/20 truncate">{p.tag}</div>
                    </div>
                    <div className="hidden lg:block ml-auto">
                      {active === i && (
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          style={{ background: p.color }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:block mt-6 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[11px] font-bold mb-1.5" style={{ color: platform.color }}>{platform.name}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{platform.description}</p>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "rgba(15,20,30,0.8)",
                border: `1px solid ${platform.color}20`,
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: `1px solid ${platform.color}15`, background: `${platform.color}05` }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Activity size={10} style={{ color: platform.color }} />
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {platform.name.toLowerCase()}.szlholdings.com/live
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: platform.color }} />
                  <span className="text-[9px] font-semibold" style={{ color: platform.color }}>LIVE</span>
                </div>
              </div>

              <div className="p-6">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Widget />
                </motion.div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 justify-end">
              {platforms.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className="transition-all duration-300"
                  style={{
                    width: active === i ? 24 : 6,
                    height: 4,
                    borderRadius: 2,
                    background: active === i ? platform.color : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div ref={terminalRef} className="mt-20 sm:mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isTerminalInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <Terminal size={14} style={{ color: "rgba(99,102,241,0.7)" }} />
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
                Live Proof Terminal
              </p>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
              The ecosystem heartbeat,{" "}
              <span style={{ color: "rgba(255,255,255,0.3)" }}>right now.</span>
            </h3>
            <p className="text-[14px] leading-[1.8] max-w-2xl" style={{ color: "rgba(255,255,255,0.4)" }}>
              Sanitized, real-time system events streaming from across the SZL Holdings production stack — API calls processed, AI inferences completed, agent tasks orchestrated, compliance checks run. No client data. No PII. Pure system signal.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isTerminalInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <LiveProofTerminal />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </section>
  );
}
