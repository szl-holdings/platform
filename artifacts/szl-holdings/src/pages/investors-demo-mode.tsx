import { useState, useEffect } from "react";
import { Link } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Ship,
  Shield,
  Building2,
  Play,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const DEMO_APPS = [
  {
    id: "vessels",
    name: "Vessels",
    subtitle: "Maritime Fleet Intelligence",
    icon: Ship,
    color: "hsl(206,72%,52%)",
    description: "Track 847 vessels across 23 trade routes. AIS anomaly detection surfaces dark vessel behavior before it escalates.",
    screens: [
      {
        label: "Fleet Overview",
        desc: "847 active vessels — 3 anomalies requiring immediate attention",
        data: [
          { label: "Vessels Tracked", value: "847", status: "operational" },
          { label: "Route Anomalies", value: "3", status: "alert" },
          { label: "Dark Vessel Events", value: "12/30d", status: "warning" },
          { label: "Sanctions Flags", value: "0", status: "operational" },
        ],
        events: [
          { time: "14:32", label: "MV AURORA STAR", detail: "AIS gap detected — 4.2h dark window, Strait of Hormuz", severity: "high" },
          { time: "14:18", label: "MV PACIFIC LION", detail: "Route deviation 340nm off declared course", severity: "medium" },
          { time: "13:55", label: "MT SOLARIS VII", detail: "Draft anomaly — cargo weight inconsistent with manifest", severity: "medium" },
        ],
      },
      {
        label: "Anomaly Detection",
        desc: "Pre-designation intelligence — flagged 34 days before sanction",
        data: [
          { label: "Behavioral Score", value: "94/100", status: "alert" },
          { label: "MMSI Conflicts", value: "2 detected", status: "alert" },
          { label: "Shadow Transfer Risk", value: "High", status: "alert" },
          { label: "Port Call Gaps", value: "17 days", status: "warning" },
        ],
        events: [
          { time: "48h ago", label: "Identity spoofing pattern", detail: "Same MMSI broadcast from 2 vessels simultaneously in Persian Gulf", severity: "high" },
          { time: "6d ago", label: "STS transfer detected", detail: "Night-time ship-to-ship off Fujairah anchorage, no declaration", severity: "high" },
          { time: "12d ago", label: "GPS position anomaly", detail: "Vessel appeared anchored in Caspian while satellite data shows Red Sea", severity: "medium" },
        ],
      },
    ],
  },
  {
    id: "terra",
    name: "Terra",
    subtitle: "Real Estate Intelligence",
    icon: Building2,
    color: "hsl(140,50%,48%)",
    description: "Monitor 12,400 properties across 8 markets. Distress signals surface 19 days before foreclosure — before the negotiating window closes.",
    screens: [
      {
        label: "Portfolio Dashboard",
        desc: "12,400 properties monitored — 47 with active distress signals",
        data: [
          { label: "Properties Tracked", value: "12,400", status: "operational" },
          { label: "Distress Signals", value: "47", status: "warning" },
          { label: "Avg Days Lead Time", value: "+19 days", status: "operational" },
          { label: "Deals in Pipeline", value: "23 active", status: "operational" },
        ],
        events: [
          { time: "2h ago", label: "427 Madison Ave, NYC", detail: "Tax lien filed — $2.3M owed, 3rd party holder", severity: "high" },
          { time: "Yesterday", label: "Industrial Portfolio, Phoenix", detail: "Occupancy drop detected: 91% → 74% across 6 properties", severity: "medium" },
          { time: "3d ago", label: "Multifamily, Austin TX", detail: "Loan maturity in 34 days — refinancing gap risk flagged", severity: "medium" },
        ],
      },
      {
        label: "Distress Intelligence",
        desc: "Underwriting signals surfaced 19 days before public filing",
        data: [
          { label: "Distress Score", value: "87/100", status: "alert" },
          { label: "Lien Position", value: "1st priority", status: "operational" },
          { label: "Days to Filing", value: "Est. 19", status: "warning" },
          { label: "ARV Estimate", value: "$4.2M", status: "operational" },
        ],
        events: [
          { time: "Signal", label: "Tax delinquency chain", detail: "3 consecutive missed payments — escalating through lien threshold", severity: "high" },
          { time: "Signal", label: "Ownership entity stress", detail: "LLC registered at property address — no registered agent update in 14 months", severity: "medium" },
          { time: "Signal", label: "Permitting gap", detail: "C/O expired 8 months ago, no renewal filed — insurance exposure risk", severity: "medium" },
        ],
      },
    ],
  },
  {
    id: "aegis",
    name: "Aegis",
    subtitle: "Defense & Threat Intelligence",
    icon: Shield,
    color: "hsl(222,60%,62%)",
    description: "SOC command surface with 40% faster threat detection. MITRE ATT&CK coverage across 847 simulated attack paths.",
    screens: [
      {
        label: "Threat Command",
        desc: "Real-time threat posture — 3 active incidents under containment",
        data: [
          { label: "Threat Posture", value: "Elevated", status: "warning" },
          { label: "Active Incidents", value: "3", status: "warning" },
          { label: "MITRE Coverage", value: "94%", status: "operational" },
          { label: "MTTR (24h avg)", value: "4.2h", status: "operational" },
        ],
        events: [
          { time: "ACTIVE", label: "Lateral movement detected", detail: "T1021 — Remote Services abuse across 4 endpoints, DC subnet", severity: "high" },
          { time: "ACTIVE", label: "Credential access attempt", detail: "T1110.003 — Password spray against Azure AD, 847 attempts/h", severity: "high" },
          { time: "Contained", label: "Phishing campaign", detail: "147 mailboxes targeted — 3 clicks, 0 payload execution", severity: "medium" },
        ],
      },
      {
        label: "Adversarial Simulation",
        desc: "Continuous red team — 847 attack paths tested this cycle",
        data: [
          { label: "Paths Tested", value: "847", status: "operational" },
          { label: "Blocked", value: "801 (94.6%)", status: "operational" },
          { label: "Detection Gap", value: "46 paths", status: "warning" },
          { label: "Security Score", value: "78 → 91", status: "operational" },
        ],
        events: [
          { time: "Critical", label: "T1547 — Boot/Logon persistence", detail: "Registry run key via scheduled task — not blocked by current controls", severity: "high" },
          { time: "High", label: "T1055 — Process injection", detail: "DLL injection via remote thread — bypasses current EDR signature", severity: "high" },
          { time: "Medium", label: "T1136 — Account creation", detail: "Local admin creation — detected in 4.2min, within SLA", severity: "medium" },
        ],
      },
    ],
  },
];

function RequestAccessBanner() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "investor",
          name: email.split("@")[0],
          email: email.trim(),
          app: "szl-holdings",
          message: "Demo mode full access request",
          metadata: { source: "demo-mode-floating-cta" },
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 50,
        maxWidth: "320px",
        background: "hsl(214,18%,6%)",
        border: "1px solid hsla(38,72%,58%,0.3)",
        borderRadius: "0.875rem",
        padding: "1.25rem",
        boxShadow: "0 8px 32px hsla(0,0%,0%,0.5)",
      }}
    >
      {sent ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <CheckCircle2 size={16} style={{ color: "hsl(145,60%,50%)" }} />
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>Request received</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "hsla(0,0%,100%,0.5)", lineHeight: 1.5 }}>
            We'll follow up within 24 hours with full access and structured materials.
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(38,72%,58%)", fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
            Request Full Access
          </p>
          <p style={{ fontSize: "0.8125rem", color: "hsla(0,0%,100%,0.6)", lineHeight: 1.5, marginBottom: "0.875rem" }}>
            Get the complete data room package — pitch deck, architecture, financials.
          </p>
          {error && (
            <p style={{ fontSize: "0.75rem", color: "hsl(0,65%,60%)", marginBottom: "0.5rem" }}>
              Unable to submit — try hello@szlholdings.com directly.
            </p>
          )}
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
              required
              style={{
                flex: 1,
                padding: "0.5rem 0.75rem",
                background: "hsla(0,0%,100%,0.06)",
                border: "1px solid hsla(0,0%,100%,0.12)",
                borderRadius: "0.375rem",
                color: "hsl(38,8%,92%)",
                fontSize: "0.8125rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "0.5rem 0.875rem",
                background: "hsl(38,72%,58%)",
                color: "hsl(214,18%,4%)",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {submitting ? "…" : "Request"}
            </button>
          </form>
        </>
      )}
    </m.div>
  );
}

function AppScreen({ screen, color }: { screen: typeof DEMO_APPS[0]["screens"][0]; color: string }) {
  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "0.75rem",
        marginBottom: "1.5rem",
      }}>
        {screen.data.map((d) => (
          <div key={d.label} style={{
            padding: "0.875rem 1rem",
            borderRadius: "0.5rem",
            background: "hsla(0,0%,100%,0.03)",
            border: d.status === "alert" ? `1px solid ${color}40`
              : d.status === "warning" ? "1px solid hsla(38,72%,58%,0.3)"
              : "1px solid hsla(0,0%,100%,0.07)",
          }}>
            <p style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsla(0,0%,100%,0.35)", fontFamily: "var(--font-mono)", marginBottom: "0.375rem" }}>
              {d.label}
            </p>
            <p style={{
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "-0.015em",
              color: d.status === "alert" ? color
                : d.status === "warning" ? "hsl(38,72%,58%)"
                : "hsl(38,8%,92%)",
            }}>
              {d.value}
            </p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {screen.events.map((ev, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.875rem",
            padding: "0.875rem 1rem",
            borderRadius: "0.5rem",
            background: "hsla(0,0%,100%,0.025)",
            border: ev.severity === "high"
              ? `1px solid ${color}25`
              : ev.severity === "medium"
              ? "1px solid hsla(38,72%,58%,0.15)"
              : "1px solid hsla(0,0%,100%,0.06)",
          }}>
            <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              flexShrink: 0,
              marginTop: "5px",
              background: ev.severity === "high" ? color
                : ev.severity === "medium" ? "hsl(38,72%,58%)"
                : "hsla(0,0%,100%,0.25)",
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.625rem", fontWeight: 600, color: "hsla(0,0%,100%,0.35)", fontFamily: "var(--font-mono)" }}>{ev.time}</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,90%)" }}>{ev.label}</span>
              </div>
              <p style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "hsla(0,0%,100%,0.5)" }}>{ev.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InvestorsDemoModePage() {
  usePageMeta({
    title: "Interactive Demo — Investor Platform Tour | SZL Holdings",
    description: "Explore Vessels, Terra, and Aegis with realistic sample data. No login required. See the full cross-domain intelligence platform in action.",
    canonical: "https://szlholdings.com/investors/demo",
  });

  const [activeApp, setActiveApp] = useState(0);
  const [activeScreen, setActiveScreen] = useState(0);

  const app = DEMO_APPS[activeApp];
  const screen = app.screens[activeScreen];
  const AppIcon = app.icon;

  useEffect(() => {
    setActiveScreen(0);
  }, [activeApp]);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main className="pt-20">

        <section style={{ borderBottom: "1px solid hsla(0,0%,100%,0.07)", padding: "3rem 0 2rem" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem 0.25rem 0.5rem", borderRadius: "2rem", background: "hsla(192,72%,48%,0.1)", border: "1px solid hsla(192,72%,48%,0.25)", marginBottom: "1.25rem" }}>
                <Play size={11} style={{ color: "hsl(192,72%,48%)" }} />
                <span style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)" }}>
                  Interactive Demo — No Login Required
                </span>
              </div>
              <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: "1rem", maxWidth: "26ch" }}>
                The platform, in three domains.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: 1.72, color: "hsla(0,0%,100%,0.6)", maxWidth: "44ch", marginBottom: "1.5rem" }}>
                Explore Vessels fleet tracking, Terra property intelligence, and Aegis threat detection using realistic sample data. Every screen runs on the same architectural spine.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/investors" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "hsl(192,72%,48%)", color: "hsl(214,18%,4%)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
                  Investor Hub <ArrowRight size={14} />
                </Link>
                <Link href="/investors/data-room" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "transparent", color: "hsla(0,0%,100%,0.6)", border: "1px solid hsla(0,0%,100%,0.15)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
                  Request Data Room
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 6rem" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
              {DEMO_APPS.map((a, i) => {
                const Icon = a.icon;
                const isActive = i === activeApp;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActiveApp(i)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.625rem 1.125rem",
                      borderRadius: "0.5rem",
                      background: isActive ? `${a.color}15` : "hsla(0,0%,100%,0.03)",
                      border: `1px solid ${isActive ? a.color + "40" : "hsla(0,0%,100%,0.08)"}`,
                      color: isActive ? a.color : "hsla(0,0%,100%,0.55)",
                      fontSize: "0.875rem",
                      fontWeight: isActive ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Icon size={15} />
                    {a.name}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <m.div
                key={activeApp}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <div style={{ display: "grid", gap: "2rem" }} className="lg:grid-cols-[340px_1fr]">

                  <div>
                    <div style={{
                      padding: "1.5rem",
                      borderRadius: "0.875rem",
                      background: `${app.color}08`,
                      border: `1px solid ${app.color}25`,
                      marginBottom: "1.25rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: `${app.color}15`,
                          border: `1px solid ${app.color}30`,
                        }}>
                          <AppIcon size={16} style={{ color: app.color }} />
                        </div>
                        <div>
                          <p style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>{app.name}</p>
                          <p style={{ fontSize: "0.75rem", color: `${app.color}`, fontFamily: "var(--font-mono)", fontWeight: 500 }}>{app.subtitle}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.65, color: "hsla(0,0%,100%,0.55)" }}>{app.description}</p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <p style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsla(0,0%,100%,0.3)", fontFamily: "var(--font-mono)", marginBottom: "0.25rem" }}>
                        Demo Screens
                      </p>
                      {app.screens.map((s, i) => (
                        <button
                          key={s.label}
                          onClick={() => setActiveScreen(i)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.75rem 1rem",
                            borderRadius: "0.5rem",
                            background: activeScreen === i ? `${app.color}10` : "hsla(0,0%,100%,0.02)",
                            border: `1px solid ${activeScreen === i ? app.color + "30" : "hsla(0,0%,100%,0.06)"}`,
                            color: activeScreen === i ? "hsl(38,8%,92%)" : "hsla(0,0%,100%,0.5)",
                            fontSize: "0.8125rem",
                            fontWeight: activeScreen === i ? 600 : 400,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <ChevronRight size={13} style={{ color: activeScreen === i ? app.color : "hsla(0,0%,100%,0.2)" }} />
                          <div>
                            <div>{s.label}</div>
                            <div style={{ fontSize: "0.6875rem", color: "hsla(0,0%,100%,0.35)", marginTop: "0.125rem", lineHeight: 1.4 }}>{s.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div style={{ marginTop: "1.5rem", padding: "0.875rem 1rem", borderRadius: "0.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                      <p style={{ fontSize: "0.5625rem", fontWeight: 500, color: "hsla(0,0%,100%,0.25)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                        DEMO DATA — Not real operational data. All metrics are representative samples using realistic parameters.
                      </p>
                    </div>
                  </div>

                  <div>
                    <div style={{
                      borderRadius: "0.875rem",
                      border: "1px solid hsla(0,0%,100%,0.08)",
                      background: "hsla(0,0%,100%,0.015)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        padding: "1rem 1.5rem",
                        borderBottom: "1px solid hsla(0,0%,100%,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "hsla(0,0%,100%,0.02)",
                      }}>
                        <div>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>{screen.label}</p>
                          <p style={{ fontSize: "0.6875rem", color: "hsla(0,0%,100%,0.4)", marginTop: "0.125rem" }}>{screen.desc}</p>
                        </div>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "2rem",
                          background: `${app.color}12`,
                          border: `1px solid ${app.color}25`,
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: app.color, animation: "pulse 2s ease-in-out infinite" }} />
                          <span style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.08em", color: app.color, fontFamily: "var(--font-mono)" }}>LIVE DEMO</span>
                        </div>
                      </div>
                      <div style={{ padding: "1.5rem" }}>
                        <AnimatePresence mode="wait">
                          <m.div
                            key={`${activeApp}-${activeScreen}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <AppScreen screen={screen} color={app.color} />
                          </m.div>
                        </AnimatePresence>
                      </div>
                    </div>

                    <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "0.8125rem", color: "hsla(0,0%,100%,0.45)" }}>
                        Ready to see the full platform with your data?
                      </p>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <Link
                          href="/investors/data-room"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.125rem", background: `${app.color}`, color: "hsl(214,18%,4%)", borderRadius: "0.375rem", fontSize: "0.8125rem", fontWeight: 700, textDecoration: "none" }}
                        >
                          Request Full Access <ArrowRight size={13} />
                        </Link>
                        <Link
                          href="/investors"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.125rem", background: "transparent", color: "hsla(0,0%,100%,0.55)", border: "1px solid hsla(0,0%,100%,0.12)", borderRadius: "0.375rem", fontSize: "0.8125rem", fontWeight: 500, textDecoration: "none" }}
                        >
                          Investor Hub
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </m.div>
            </AnimatePresence>
          </div>
        </section>

      </main>
      <SiteFooter />
      <RequestAccessBanner />
    </div>
  );
}
