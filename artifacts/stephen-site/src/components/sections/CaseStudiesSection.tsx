import { motion, useInView } from "framer-motion";
import { ArrowUpRight, Shield, Anchor, BarChart3, Eye, Sparkles, Scale, Building2 } from "lucide-react";
import { useRef } from "react";

const platforms = [
  {
    name: "Vessels",
    role: "Maritime Intelligence",
    icon: Anchor,
    color: "#3B8BEB",
    description: "Real-time fleet command for global shipping operators. AIS signal processing, voyage economics, route optimization, and port intelligence.",
    metrics: [
      { label: "Vessels Tracked", value: "50K+" },
      { label: "Data Refresh", value: "<200ms" },
      { label: "Routes", value: "Global" },
    ],
    tech: ["AIS Pipeline", "ML Anomaly Detection", "WebSocket"],
    href: "/vessels/",
    status: "operational",
  },
  {
    name: "Aegis",
    role: "Defense & Intelligence",
    icon: Shield,
    color: "#6366F1",
    description: "Unified defense command — SOC operations, XDR, managed security, threat intelligence, and AI research infrastructure in one platform.",
    metrics: [
      { label: "Modules", value: "12+" },
      { label: "MITRE Coverage", value: "Full" },
      { label: "Response", value: "Real-time" },
    ],
    tech: ["SOC/XDR", "Threat Intel", "MITRE ATT&CK"],
    href: "/firestorm/",
    status: "operational",
  },
  {
    name: "Lyte",
    role: "Business Observability",
    icon: Eye,
    color: "#00D4FF",
    description: "Command-layer business visibility. Risk signals, operational latency, ownership gaps — surfaced before they compound into execution failures.",
    metrics: [
      { label: "Signals", value: "330+" },
      { label: "MSP Clients", value: "12" },
      { label: "Devices", value: "163" },
    ],
    tech: ["Signal Processing", "PRISM Scoring", "Alert Engine"],
    href: "/lyte-command-center/",
    status: "operational",
  },
  {
    name: "Terra",
    role: "Real Estate Intelligence",
    icon: BarChart3,
    color: "#22C55E",
    description: "Distress property tracking, deal pipeline intelligence, commercial comps, and NYC market data for serious real estate operators.",
    metrics: [
      { label: "Properties", value: "3.5K+" },
      { label: "Alerts", value: "1,510" },
      { label: "Market", value: "NYC" },
    ],
    tech: ["MLS Integration", "Distress Detection", "Pipeline AI"],
    href: "/terra/",
    status: "operational",
  },
  {
    name: "PRISM Counsel",
    role: "Legal Intelligence",
    icon: Scale,
    color: "#F59E0B",
    description: "Legal matter command with deadline tracking, document management, compliance workflows, and recovery operations for complex legal portfolios.",
    metrics: [
      { label: "Modules", value: "8" },
      { label: "Jurisdictions", value: "NY+" },
      { label: "Compliance", value: "Full" },
    ],
    tech: ["Matter Management", "Deadline Engine", "Recovery Ops"],
    href: "/prism-counsel/",
    status: "operational",
  },
  {
    name: "Carlota Jo",
    role: "Private Advisory",
    icon: Sparkles,
    color: "#D4A054",
    description: "High-trust private advisory and residence management for high-net-worth principals. Coordination, logistics, and lifestyle intelligence.",
    metrics: [
      { label: "Services", value: "Premium" },
      { label: "Access", value: "Private" },
      { label: "Trust", value: "NDA" },
    ],
    tech: ["Client Portal", "Booking Engine", "Secure Comms"],
    href: "/carlota-jo/",
    status: "operational",
  },
  {
    name: "SZL Holdings",
    role: "Parent Company",
    icon: Building2,
    color: "#D4A054",
    description: "Multi-venture operating system. Unified auth, shared design system, ecosystem navigation, observability stack, and cross-company analytics.",
    metrics: [
      { label: "Ventures", value: "6" },
      { label: "Architecture", value: "Shared" },
      { label: "Stack", value: "Unified" },
    ],
    tech: ["Shared Infra", "Design System", "Observability"],
    href: "/szl-holdings/",
    status: "operational",
  },
];

function PlatformCard({ platform, index }: { platform: typeof platforms[0]; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = platform.icon;

  return (
    <motion.a
      ref={ref}
      href={platform.href}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative block p-6 sm:p-7 transition-all duration-300"
      style={{
        background: "rgba(12,16,24,0.9)",
        border: "1px solid rgba(255,255,255,0.05)",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(18,24,36,0.95)";
        (e.currentTarget as HTMLElement).style.borderColor = `${platform.color}30`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(12,16,24,0.9)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, ${platform.color}, transparent 70%)` }} />

      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center" style={{ background: `${platform.color}12`, border: `1px solid ${platform.color}20` }}>
            <Icon size={18} style={{ color: platform.color }} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{platform.name}</p>
            <p className="text-[10px] font-mono tracking-wide" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>{platform.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
            <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "#22C55E" }}>Live</span>
          </div>
          <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-60 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "white" }} />
        </div>
      </div>

      <p className="text-[13px] font-light leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.38)" }}>
        {platform.description}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {platform.metrics.map((m) => (
          <div key={m.label} className="p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-[14px] font-bold" style={{ color: platform.color, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</p>
            <p className="text-[8px] font-medium tracking-[0.15em] uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{m.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {platform.tech.map((t) => (
          <span
            key={t}
            className="px-2 py-1 text-[9px] font-medium tracking-wide"
            style={{
              background: `${platform.color}08`,
              border: `1px solid ${platform.color}15`,
              color: `${platform.color}90`,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </motion.a>
  );
}

export function CaseStudiesSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section id="portfolio" className="py-24 lg:py-32 bg-[#080b12]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-[2px]" style={{ background: "linear-gradient(90deg, #6366F1, transparent)" }} />
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(99,102,241,0.6)" }}>
              The Ecosystem
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.95)" }}>
            Seven platforms.<br />
            <span style={{ color: "rgba(255,255,255,0.3)" }}>One operator.</span>
          </h2>
          <p className="text-lg font-light leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.4)" }}>
            Every platform is founder-built, founder-operated, and connected by a single shared architecture. No co-founders. No outsourced product teams.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map((platform, i) => (
            <PlatformCard key={platform.name} platform={platform} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
