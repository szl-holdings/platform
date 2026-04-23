import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import {
  Smartphone,
  ArrowRight,
  Activity,
  Briefcase,
  Radio,
  AlertTriangle,
  ShieldCheck,
  Ship,
  Building2,
  BarChart3,
  Bell,
  Mic,
  Search,
  Zap,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Layers,
  Wifi,
  Battery,
  Signal,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const ACCENT = "#c9a84c";
const BG = "#080c14";
const PANEL = "#0d131e";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "hsl(38,8%,92%)";
const MUTED = "hsl(214,7%,55%)";

type ScreenId = "dashboard" | "portfolio" | "command";

const SCREENS: Array<{ id: ScreenId; label: string; sublabel: string; icon: typeof Activity }> = [
  { id: "dashboard", label: "Command Dashboard", sublabel: "Cross-domain signal feed", icon: Activity },
  { id: "portfolio", label: "Portfolio", sublabel: "Ecosystem health & KPIs", icon: Briefcase },
  { id: "command", label: "Operations Command", sublabel: "KORA signal-to-action inbox", icon: Radio },
];

function StatusBar() {
  return (
    <div
      style={{
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 22px",
        fontSize: 11,
        color: TEXT,
        fontWeight: 600,
        letterSpacing: 0.2,
      }}
    >
      <span>9:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Signal size={11} />
        <Wifi size={12} />
        <Battery size={14} />
      </div>
    </div>
  );
}

function PhoneFrame({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <div
      style={{
        width: 320,
        height: 660,
        flexShrink: 0,
        background: "#000",
        borderRadius: 42,
        padding: 10,
        boxShadow: active
          ? `0 28px 60px rgba(0,0,0,0.6), 0 0 0 1px ${ACCENT}55, 0 0 40px ${ACCENT}22`
          : "0 18px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        transition: "box-shadow 0.3s ease",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 26,
          background: "#000",
          borderRadius: 18,
          zIndex: 5,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          borderRadius: 32,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <StatusBar />
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>{children}</div>
      </div>
    </div>
  );
}

function Header({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: string }) {
  return (
    <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
            SZL Command
          </div>
          <div style={{ fontSize: 18, color: TEXT, fontWeight: 700, marginTop: 2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {badge && (
            <div
              style={{
                background: "rgba(220, 60, 60, 0.18)",
                border: "1px solid rgba(220,60,60,0.4)",
                color: "hsl(0,80%,68%)",
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 7px",
                borderRadius: 6,
              }}
            >
              {badge}
            </div>
          )}
          <Bell size={16} color={MUTED} />
        </div>
      </div>
    </div>
  );
}

function TabBar({ tabs, active }: { tabs: Array<{ icon: typeof Activity; label: string }>; active: number }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "rgba(8,12,20,0.96)",
        borderTop: `1px solid ${BORDER}`,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "0 6px 14px",
        backdropFilter: "blur(12px)",
      }}
    >
      {tabs.map((t, i) => {
        const Icon = t.icon;
        const isActive = i === active;
        return (
          <div
            key={t.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              color: isActive ? ACCENT : MUTED,
            }}
          >
            <Icon size={18} />
            <span style={{ fontSize: 9, fontWeight: 600 }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DashboardScreen() {
  const signals = [
    { sev: "critical", source: "PARAGON", title: "Privileged credential anomaly — finance VPC", time: "2m", color: "hsl(0,80%,62%)" },
    { sev: "high", source: "SEXTANT", title: "MV Atlantic Crest deviated from filed route", time: "11m", color: "hsl(28,90%,58%)" },
    { sev: "high", source: "DOMAINE", title: "Distress signal: 4 properties in Zone 7 portfolio", time: "23m", color: "hsl(28,90%,58%)" },
    { sev: "medium", source: "PRAXIS", title: "Settlement band updated — Matter #4421", time: "41m", color: "hsl(48,80%,58%)" },
    { sev: "info", source: "KORA", title: "Approval aging crossed 7-day threshold (3 deals)", time: "1h", color: "hsl(200,70%,60%)" },
  ];
  const domains = [
    { label: "Defense", icon: ShieldCheck, count: 7, color: "hsl(0,72%,56%)" },
    { label: "Fleet", icon: Ship, count: 12, color: "hsl(200,80%,52%)" },
    { label: "Real Estate", icon: Building2, count: 5, color: "hsl(140,50%,46%)" },
    { label: "Operations", icon: BarChart3, count: 18, color: "hsl(191,92%,44%)" },
  ];
  return (
    <>
      <Header title="Today" subtitle="5 signals · 2 critical" badge="2" />
      <div style={{ padding: "12px 14px 80px", overflow: "auto", height: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {domains.map((d) => {
            const Icon = d.icon;
            return (
              <div
                key={d.label}
                style={{
                  background: PANEL,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <Icon size={14} color={d.color} />
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{d.label}</div>
                <div style={{ fontSize: 18, color: TEXT, fontWeight: 700, marginTop: 1 }}>{d.count}</div>
                <div style={{ fontSize: 9, color: d.color, marginTop: 1, fontWeight: 600 }}>active</div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 10, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, margin: "8px 2px 8px" }}>
          Live signal feed
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {signals.map((s, i) => (
            <div
              key={i}
              style={{
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderLeft: `3px solid ${s.color}`,
                borderRadius: 8,
                padding: "9px 10px",
                display: "flex",
                gap: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: s.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {s.sev}
                  </span>
                  <span style={{ fontSize: 9, color: MUTED }}>· {s.source}</span>
                  <span style={{ fontSize: 9, color: MUTED, marginLeft: "auto" }}>{s.time}</span>
                </div>
                <div style={{ fontSize: 11, color: TEXT, lineHeight: 1.35 }}>{s.title}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 14,
            background: `${ACCENT}10`,
            border: `1px solid ${ACCENT}40`,
            borderRadius: 10,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Mic size={16} color={ACCENT} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>Hold to ask Command</div>
            <div style={{ fontSize: 9, color: MUTED }}>"Brief me on the PARAGON incident"</div>
          </div>
        </div>
      </div>
      <TabBar
        active={0}
        tabs={[
          { icon: Activity, label: "Today" },
          { icon: Briefcase, label: "Portfolio" },
          { icon: Radio, label: "Command" },
          { icon: Layers, label: "More" },
        ]}
      />
    </>
  );
}

function PortfolioScreen() {
  const platforms = [
    { name: "PARAGON", role: "Defense", status: "online", latency: 84 },
    { name: "SEXTANT", role: "Fleet", status: "online", latency: 112 },
    { name: "DOMAINE", role: "Real Estate", status: "degraded", latency: 248 },
    { name: "KORA", role: "Operations", status: "online", latency: 67 },
    { name: "Counsel", role: "Advisory", status: "online", latency: 91 },
    { name: "APEX", role: "Intelligence", status: "online", latency: 103 },
  ];
  const kpis = [
    { label: "Workflow runs", value: "12,408", trend: "+8.2%", color: "hsl(140,50%,55%)" },
    { label: "Active incidents", value: "9", trend: "-3", color: "hsl(28,90%,58%)" },
    { label: "Distress properties", value: "14", trend: "+2", color: "hsl(0,80%,62%)" },
    { label: "Active deals", value: "37", trend: "+5", color: "hsl(140,50%,55%)" },
  ];
  return (
    <>
      <Header title="Portfolio" subtitle="6 platforms · 1 degraded" />
      <div style={{ padding: "12px 14px 80px", overflow: "auto", height: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {kpis.map((k) => (
            <div key={k.label} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 10, color: MUTED }}>{k.label}</div>
              <div style={{ fontSize: 18, color: TEXT, fontWeight: 700, marginTop: 4 }}>{k.value}</div>
              <div style={{ fontSize: 9, color: k.color, marginTop: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                <TrendingUp size={9} /> {k.trend}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, margin: "6px 2px 8px" }}>
          Ecosystem health
        </div>
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
          {platforms.map((p, i) => (
            <div
              key={p.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: p.status === "online" ? "hsl(140,50%,55%)" : "hsl(28,90%,58%)",
                  boxShadow: `0 0 8px ${p.status === "online" ? "hsl(140,50%,55%)" : "hsl(28,90%,58%)"}`,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: MUTED }}>{p.role}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>{p.latency}ms</div>
                <div style={{ fontSize: 9, color: p.status === "online" ? "hsl(140,50%,55%)" : "hsl(28,90%,58%)", fontWeight: 600 }}>
                  {p.status}
                </div>
              </div>
              <ChevronRight size={14} color={MUTED} />
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, margin: "14px 2px 8px" }}>
          Quick actions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { icon: Search, label: "Search portfolio" },
            { icon: BarChart3, label: "Open analytics" },
            { icon: Zap, label: "Run playbook" },
            { icon: ShieldCheck, label: "Trust posture" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.label}
                style={{
                  background: PANEL,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon size={14} color={ACCENT} />
                <span style={{ fontSize: 11, color: TEXT, fontWeight: 500 }}>{a.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <TabBar
        active={1}
        tabs={[
          { icon: Activity, label: "Today" },
          { icon: Briefcase, label: "Portfolio" },
          { icon: Radio, label: "Command" },
          { icon: Layers, label: "More" },
        ]}
      />
    </>
  );
}

function CommandScreen() {
  const cards = [
    {
      sev: "critical",
      title: "Revenue stall — North America segment",
      source: "KORA · Pipeline",
      detail: "MoM bookings down 18%. Top 3 deals stalled at procurement gate.",
      action: "Approve outreach playbook",
      color: "hsl(0,80%,62%)",
      time: "4m",
    },
    {
      sev: "high",
      title: "Approval aging — Series B SAFE conversion",
      source: "KORA · Ownership",
      detail: "8 days in pending state. Counsel review complete, awaiting CFO sign.",
      action: "Route to CFO",
      color: "hsl(28,90%,58%)",
      time: "17m",
    },
    {
      sev: "high",
      title: "Ownership drift detected — PARAGON cap table",
      source: "KORA · Governance",
      detail: "Founder common dropped below 51% threshold after pool refresh.",
      action: "Open proof envelope",
      color: "hsl(28,90%,58%)",
      time: "32m",
    },
    {
      sev: "medium",
      title: "KPI anomaly — SEXTANT utilization",
      source: "KORA · Fleet",
      detail: "Atlantic fleet utilization down 6.4% week-over-week. Above tolerance.",
      action: "Review dashboard",
      color: "hsl(48,80%,58%)",
      time: "1h",
    },
  ];
  return (
    <>
      <Header title="Command" subtitle="4 actions awaiting decision" badge="1" />
      <div style={{ padding: "12px 14px 80px", overflow: "auto", height: "100%" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["All", "Critical", "Approvals", "Drafts"].map((t, i) => (
            <div
              key={t}
              style={{
                fontSize: 10,
                padding: "5px 10px",
                borderRadius: 12,
                background: i === 0 ? `${ACCENT}22` : "transparent",
                border: i === 0 ? `1px solid ${ACCENT}55` : `1px solid ${BORDER}`,
                color: i === 0 ? ACCENT : MUTED,
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cards.map((c, i) => (
            <div
              key={i}
              style={{
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderTop: `2px solid ${c.color}`,
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <AlertTriangle size={11} color={c.color} />
                <span style={{ fontSize: 9, color: c.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {c.sev}
                </span>
                <span style={{ fontSize: 9, color: MUTED, marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={9} />
                  {c.time}
                </span>
              </div>
              <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, lineHeight: 1.3, marginBottom: 3 }}>{c.title}</div>
              <div style={{ fontSize: 9, color: MUTED, marginBottom: 6 }}>{c.source}</div>
              <div style={{ fontSize: 10, color: "hsl(38,8%,75%)", lineHeight: 1.45, marginBottom: 9 }}>{c.detail}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <div
                  style={{
                    flex: 1,
                    background: `${ACCENT}1a`,
                    border: `1px solid ${ACCENT}55`,
                    borderRadius: 7,
                    padding: "6px 8px",
                    fontSize: 10,
                    color: ACCENT,
                    fontWeight: 600,
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <CheckCircle2 size={11} /> {c.action}
                </div>
                <div
                  style={{
                    background: "transparent",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 7,
                    padding: "6px 10px",
                    fontSize: 10,
                    color: MUTED,
                    fontWeight: 600,
                  }}
                >
                  Defer
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar
        active={2}
        tabs={[
          { icon: Activity, label: "Today" },
          { icon: Briefcase, label: "Portfolio" },
          { icon: Radio, label: "Command" },
          { icon: Layers, label: "More" },
        ]}
      />
    </>
  );
}

function ScreenContent({ id }: { id: ScreenId }) {
  if (id === "dashboard") return <DashboardScreen />;
  if (id === "portfolio") return <PortfolioScreen />;
  return <CommandScreen />;
}

export default function MobilePreviewPage() {
  const __pageMeta = usePageMeta({
    title: "Mobile Command — Browser Preview · SZL Holdings",
    description:
      "See the SZL Holdings Mobile Command app in your browser — no install required. Dashboard, portfolio, and operations command screens.",
  });

  const [active, setActive] = useState<ScreenId>("dashboard");

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: BG, color: TEXT }}>
        <SiteNav />
  
        <main style={{ maxWidth: 1240, margin: "0 auto", padding: "6rem 1.5rem 4rem" }}>
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <Smartphone size={26} style={{ color: ACCENT }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: ACCENT }}>
                Mobile Command — Browser Preview
              </span>
            </div>
            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                lineHeight: 1.15,
                marginBottom: "1rem",
                color: "hsl(38,8%,94%)",
              }}
            >
              Tour the mobile app. No install.
            </h1>
            <p style={{ fontSize: "1.125rem", color: MUTED, maxWidth: 680, lineHeight: 1.6 }}>
              The SZL Holdings Mobile Command app puts the entire portfolio — defense, fleet, real estate, operations,
              advisory — in your pocket. Below is a faithful in-browser preview of the three primary screens. No Expo
              Go, no TestFlight, no install.
            </p>
          </m.div>
  
          {/* Screen selector */}
          <section style={{ marginTop: "2.5rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {SCREENS.map((s) => {
                const Icon = s.icon;
                const isActive = s.id === active;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    style={{
                      background: isActive ? `${ACCENT}1a` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? `${ACCENT}66` : BORDER}`,
                      borderRadius: 10,
                      padding: "10px 14px",
                      color: isActive ? ACCENT : TEXT,
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={16} />
                    <div style={{ textAlign: "left" }}>
                      <div>{s.label}</div>
                      <div style={{ fontSize: 10, color: MUTED, fontWeight: 500, marginTop: 1 }}>{s.sublabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
  
          {/* Phone gallery */}
          <section style={{ marginTop: "2.5rem" }}>
            <div
              style={{
                display: "flex",
                gap: 28,
                overflowX: "auto",
                padding: "20px 4px 36px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {SCREENS.map((s) => (
                <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <PhoneFrame active={s.id === active}>
                    <ScreenContent id={s.id} />
                  </PhoneFrame>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{s.sublabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
  
          {/* Feature highlights */}
          <section style={{ marginTop: "2rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1rem",
              }}
            >
              {[
                {
                  icon: Activity,
                  title: "Cross-domain signal feed",
                  body: "Critical events from every portfolio company surface in one ranked feed, with severity, source, and recommended action.",
                },
                {
                  icon: Briefcase,
                  title: "Live portfolio health",
                  body: "Real-time KPIs and ecosystem status across PARAGON, SEXTANT, DOMAINE, KORA, Counsel, and Cortex.",
                },
                {
                  icon: Radio,
                  title: "KORA command inbox",
                  body: "Approvals, action drafts, and decision-ready cards governed end-to-end through the FORGE execution fabric.",
                },
                {
                  icon: Mic,
                  title: "Voice-first command",
                  body: "Hold-to-ask voice queries route through the same governed agents available on web and desktop.",
                },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    style={{
                      background: PANEL,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 12,
                      padding: "1.25rem",
                    }}
                  >
                    <Icon size={20} color={ACCENT} />
                    <div style={{ fontSize: 14, color: TEXT, fontWeight: 600, marginTop: 10 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginTop: 6 }}>{f.body}</div>
                  </div>
                );
              })}
            </div>
          </section>
  
          {/* CTA */}
          <section
            style={{
              marginTop: "3rem",
              padding: "1.75rem 2rem",
              background: "hsla(0,0%,100%,0.025)",
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ maxWidth: 520 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 6 }}>Want it on a real device?</div>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>
                The mobile app ships through TestFlight and Google Play internal testing for design partners and LPs.
                Browser preview gives you the full UX flow today; production builds add native push, biometrics, and
                offline-ready proof envelopes.
              </p>
            </div>
            <Link href="/contact">
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: ACCENT,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  background: `${ACCENT}1a`,
                  border: `1px solid ${ACCENT}55`,
                  borderRadius: 9,
                }}
              >
                Request a build <ArrowRight size={14} />
              </span>
            </Link>
          </section>
        </main>
  
        <SiteFooter />
      </div>
        </>
  );
}
