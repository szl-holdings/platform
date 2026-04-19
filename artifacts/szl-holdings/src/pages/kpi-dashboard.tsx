import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DataStateBadge } from "@/components/DataStateBadge";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { Lock, TrendingUp, Ship, Layers, Eye, Shield, Sparkles, BarChart3, ArrowUpRight, RefreshCw, Activity, Zap, Play, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { PageDataSkeleton } from "@szl-holdings/shared-ui/page-data-skeleton";
import { formatTime } from "@szl-holdings/shared-ui/utils";

interface KpiData {
  checkedAt: string;
  platforms: {
    terra: { distressProperties: number; activeDeals: number; href: string };
    vessels: { trackedVessels: number; fleets: number; href: string };
    alloy: { workflowRuns: number; activeWorkflows: number; href: string };
    lyte: { incidents: number; href: string };
    aegis: { incidents: number; findings: number; href: string };
    carlotaJo: { inquiries: number; href: string };
  };
  aggregate: {
    totalWorkflowRuns: number;
    activeIncidents: number;
    distressProperties: number;
    fleetVessels: number;
    activeDeals: number;
    securityFindings: number;
  };
}

function Sparkline({ bars = 8, accent }: { bars?: number; accent: string }) {
  const vals = Array.from({ length: bars }, (_, i) =>
    30 + Math.abs(Math.sin(i * 1.8 + 0.7) * 55 + Math.cos(i * 0.9) * 20)
  );
  const max = Math.max(...vals);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "28px", marginTop: "0.75rem" }}>
      {vals.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            borderRadius: "2px",
            background: i === bars - 1 ? accent : `${accent}50`,
            transition: "height 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

function LivePulse({ accent }: { accent: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: "8px", height: "8px", flexShrink: 0 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: accent, opacity: 0.4,
        animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
      }} />
      <span style={{ position: "relative", borderRadius: "50%", width: "8px", height: "8px", backgroundColor: accent }} />
    </span>
  );
}

function StatCard({
  label, value, sub, accent, href, icon: Icon, delay = 0,
}: {
  label: string; value: number | string; sub: string; accent: string; href?: string; icon: React.ElementType; delay?: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      style={{
        padding: "1.25rem",
        borderRadius: "14px",
        background: `radial-gradient(ellipse at top left, ${accent}08 0%, hsla(0,0%,100%,0.018) 60%)`,
        border: `1px solid ${accent}20`,
        position: "relative",
        overflow: "hidden",
        cursor: href ? "pointer" : "default",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${accent}70, transparent)` }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}15`, border: `1px solid ${accent}28`, flexShrink: 0 }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        {href && (
          <a href={href} style={{ color: "hsl(210,5%,38%)", transition: "color 0.18s", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = accent; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,38%)"; }}>
            <ArrowUpRight size={13} />
          </a>
        )}
      </div>
      <p style={{ fontSize: "1.875rem", fontWeight: 800, color: accent, letterSpacing: "-0.045em", lineHeight: 1, marginBottom: "0.3rem", fontFamily: "'Space Grotesk', system-ui" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p style={{ fontSize: "11px", fontWeight: 600, color: "hsl(38,12%,80%)", letterSpacing: "-0.005em", marginBottom: "0.15rem" }}>{label}</p>
      <p style={{ fontSize: "10px", color: "hsl(210,5%,40%)" }}>{sub}</p>
      <Sparkline accent={accent} />
    </m.div>
  );
}

function PlatformBlock({
  name, icon: Icon, accent, metrics, href, delay = 0,
}: {
  name: string; icon: React.ElementType; accent: string; metrics: { label: string; value: number | string }[]; href: string; delay?: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ borderColor: `${accent}35`, transition: { duration: 0.18 } }}
      style={{
        padding: "1.25rem",
        borderRadius: "14px",
        background: `linear-gradient(135deg, ${accent}06 0%, hsla(0,0%,100%,0.015) 100%)`,
        border: `1px solid ${accent}18`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "2px", background: `linear-gradient(180deg, ${accent}60, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}12`, border: `1px solid ${accent}22` }}>
            <Icon size={12} style={{ color: accent }} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,88%)", letterSpacing: "-0.01em" }}>{name}</span>
        </div>
        <a href={href} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 500, color: accent, textDecoration: "none", opacity: 0.65, transition: "opacity 0.18s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.65"; }}>
          Open <ArrowUpRight size={10} />
        </a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${metrics.length}, 1fr)`, gap: "0.625rem" }}>
        {metrics.map((m) => (
          <div key={m.label}>
            <p style={{ fontSize: "1.375rem", fontWeight: 800, color: "hsl(38,12%,92%)", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'Space Grotesk', system-ui" }}>
              {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
            </p>
            <p style={{ fontSize: "10px", color: "hsl(210,5%,40%)", marginTop: "0.2rem", letterSpacing: "0.025em" }}>{m.label}</p>
          </div>
        ))}
      </div>
    </m.div>
  );
}

function SystemHealthStrip({ data, refreshing, onRefresh }: { data: KpiData | null; refreshing: boolean; onRefresh: () => void }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 3000); return () => clearInterval(t); }, []);

  const statusItems = [
    { label: "Alloy", ok: true, accent: "hsl(214,80%,65%)" },
    { label: "Terra", ok: true, accent: "hsl(88,42%,44%)" },
    { label: "Vessels", ok: true, accent: "hsl(205,85%,55%)" },
    { label: "Aegis", ok: true, accent: "hsl(232,68%,60%)" },
    { label: "Lyte", ok: true, accent: "hsl(190,90%,55%)" },
    { label: "Carlota Jo", ok: true, accent: "hsl(38,55%,58%)" },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem",
      padding: "0.625rem 1rem", borderRadius: "10px",
      background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", marginBottom: "2rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Activity size={11} style={{ color: "hsl(142,62%,48%)" }} />
        <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(210,5%,44%)" }}>Platform Status</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
        {statusItems.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <LivePulse accent={s.accent} />
            <span style={{ fontSize: "10px", color: "hsl(210,5%,52%)" }}>{s.label}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        style={{
          display: "flex", alignItems: "center", gap: "5px", padding: "0.35rem 0.75rem",
          background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)",
          borderRadius: "6px", color: "hsl(210,5%,52%)", fontSize: "11px", fontWeight: 500,
          cursor: refreshing ? "not-allowed" : "pointer", transition: "all 0.18s",
        }}
        onMouseEnter={(e) => { if (!refreshing) (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.07)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
      >
        <RefreshCw size={11} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();
  if (isLoading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "20px", height: "20px", border: "2px solid hsla(0,0%,100%,0.1)", borderTopColor: "hsl(210,8%,72%)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: "360px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "radial-gradient(ellipse, hsla(214,80%,65%,0.1) 0%, hsla(0,0%,100%,0.03) 100%)", border: "1px solid hsla(214,80%,65%,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <Lock size={20} style={{ color: "hsl(214,80%,62%)" }} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(38,12%,90%)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>Auth Required</h2>
          <p style={{ fontSize: "13.5px", color: "hsl(210,5%,52%)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            The KPI dashboard is restricted to authenticated users.
          </p>
          <button
            onClick={login}
            style={{ padding: "0.65rem 1.5rem", background: "hsla(214,80%,55%,0.15)", color: "hsl(214,80%,72%)", border: "1px solid hsla(214,80%,55%,0.25)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "all 0.18s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(214,80%,55%,0.22)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(214,80%,55%,0.15)"; }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

interface RunHealthData {
  totalRuns: number;
  recentRuns: number;
  successCount: number;
  blockedCount: number;
  partialCount: number;
  failedCount: number;
  policyBlockCount: number;
  approvalCount: number;
  passRate: number;
  avgLatencyMs: number;
  domainBreakdown: Record<string, number>;
  autonomyBreakdown: Record<string, number>;
  checkedAt: string;
}

function RunHealthWidget() {
  const [health, setHealth] = useState<RunHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/runs/health", { credentials: "include" })
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<RunHealthData>;
      })
      .then((j) => { if (j) setHealth(j); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const passRate = health ? Math.round(health.passRate * 100) : null;
  const passColor = passRate === null ? "hsl(210,5%,38%)" : passRate >= 85 ? "hsl(142,62%,52%)" : passRate >= 65 ? "hsl(38,72%,58%)" : "hsl(0,72%,62%)";

  const DOMAIN_ACCENT: Record<string, string> = {
    aegis: "hsl(0,72%,62%)",
    terra: "hsl(88,42%,52%)",
    vessels: "hsl(205,85%,55%)",
    prism: "hsl(270,68%,65%)",
    pulse: "hsl(38,72%,58%)",
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: "14px",
        background: "radial-gradient(ellipse at top left, hsla(139,62%,48%,0.06) 0%, hsla(0,0%,100%,0.018) 60%)",
        border: "1px solid hsla(139,62%,48%,0.18)",
        padding: "1.25rem 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, hsl(139,62%,48%)70, transparent)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(139,62%,48%,0.12)", border: "1px solid hsla(139,62%,48%,0.2)" }}>
            <Play size={13} style={{ color: "hsl(139,62%,55%)" }} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,88%)", letterSpacing: "-0.01em" }}>Run Health</span>
          <span style={{ fontSize: "9px", fontWeight: 700, color: "hsl(139,62%,55%)", background: "hsla(139,62%,48%,0.12)", padding: "1px 7px", borderRadius: "10px", border: "1px solid hsla(139,62%,48%,0.2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>LIVE</span>
        </div>
        {!loading && health && (
          <a
            href="/command/operations/runs"
            style={{ fontSize: "11px", color: "hsl(139,62%,55%)", textDecoration: "none", display: "flex", alignItems: "center", gap: "3px", opacity: 0.8 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
          >
            Open Console <ArrowUpRight size={11} />
          </a>
        )}
      </div>

      {loading && (
        <div style={{ display: "flex", gap: "8px", height: "60px", alignItems: "center" }}>
          {[80, 60, 90, 50, 75].map((w, i) => (
            <div key={i} style={{ flex: 1, height: `${w}%`, borderRadius: "4px", background: "hsla(0,0%,100%,0.06)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {!loading && health && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
            {[
              { label: "Total Runs", value: health.totalRuns, icon: Activity, color: "hsl(214,80%,65%)" },
              { label: "Pass Rate", value: `${passRate}%`, icon: CheckCircle2, color: passColor },
              { label: "Policy Blocks", value: health.policyBlockCount, icon: XCircle, color: "hsl(0,72%,62%)" },
              { label: "Approvals", value: health.approvalCount, icon: AlertTriangle, color: "hsl(38,72%,58%)" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color, letterSpacing: "-0.04em", lineHeight: 1.1, fontFamily: "'Space Grotesk', system-ui" }}>
                  {typeof value === "number" ? value.toLocaleString() : value}
                </div>
                <div style={{ fontSize: "10px", color: "hsl(210,5%,40%)", marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                  <Icon size={9} />
                  {label}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(health.domainBreakdown).length > 0 && (
            <div>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "hsl(210,5%,36%)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Domain Breakdown</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {Object.entries(health.domainBreakdown).map(([domain, count]) => (
                  <span key={domain} style={{ fontSize: "10px", color: DOMAIN_ACCENT[domain] ?? "hsl(139,62%,55%)", background: `${DOMAIN_ACCENT[domain] ?? "hsl(139,62%,48%)"}12`, padding: "2px 8px", borderRadius: "4px", border: `1px solid ${DOMAIN_ACCENT[domain] ?? "hsl(139,62%,48%)"}28`, fontWeight: 600 }}>
                    {domain} {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(health.autonomyBreakdown).length > 0 && (
            <div style={{ marginTop: "0.625rem" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "hsl(210,5%,36%)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Autonomy Modes</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {Object.entries(health.autonomyBreakdown).map(([mode, count]) => {
                  const modeColor = mode === "autonomous" ? "hsl(142,62%,52%)" : mode === "supervised" ? "hsl(38,72%,58%)" : mode === "advisory" ? "hsl(205,85%,55%)" : "hsl(210,5%,50%)";
                  return (
                    <span key={mode} style={{ fontSize: "10px", color: modeColor, background: `${modeColor}12`, padding: "2px 8px", borderRadius: "4px", border: `1px solid ${modeColor}28`, fontWeight: 600 }}>
                      {mode} {count}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: "0.75rem", fontSize: "10px", color: "hsl(210,5%,36%)" }}>
            Avg latency {health.avgLatencyMs >= 60_000 ? `${(health.avgLatencyMs / 60_000).toFixed(1)}m` : `${(health.avgLatencyMs / 1000).toFixed(1)}s`} · {health.recentRuns} run{health.recentRuns !== 1 ? "s" : ""} in last 24h
          </div>
        </div>
      )}

      {!loading && !health && (
        <p style={{ fontSize: "12px", color: "hsl(210,5%,40%)", margin: 0 }}>Run health unavailable — agent runtime not connected.</p>
      )}
    </m.div>
  );
}

export default function KpiDashboardPage() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch("/api/holdings/kpis");
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    document.title = "KPI Dashboard — SZL Holdings";
    fetchData();
    const interval = setInterval(() => fetchData(true), 60_000);
    return () => clearInterval(interval);
  }, []);

  const agg = data?.aggregate;
  const platforms = data?.platforms;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-30%", left: "10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(ellipse, hsla(214,80%,55%,0.055) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "0", right: "-10%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(ellipse, hsla(232,68%,50%,0.04) 0%, transparent 70%)" }} />
      </div>
      <SiteNav />
      <main className="pt-24" style={{ position: "relative", zIndex: 1 }}>
        <AuthGate>
          <div style={{ padding: "3rem 0 5rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginBottom: "2.5rem" }}
              >
                <DataStateBadge state={data ? "LIVE" : "DEMO DATA"} position="top-left" style={{ position: "relative", top: "auto", left: "auto", right: "auto", bottom: "auto", display: "inline-flex", marginBottom: "0.75rem" }} />
                <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, hsla(214,80%,55%,0.2), hsla(232,68%,50%,0.12))", border: "1px solid hsla(214,80%,55%,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Zap size={15} style={{ color: "hsl(214,80%,65%)" }} />
                  </div>
                  <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "hsl(38,12%,94%)", lineHeight: 1 }}>
                    Ecosystem KPIs
                  </h1>
                </div>
                <p style={{ fontSize: "13px", color: "hsl(210,5%,50%)" }}>
                  {data ? `Last updated ${formatTime(data.checkedAt)}` : loading ? "Loading…" : "Real-time aggregate metrics across all platforms."}
                </p>
              </m.div>

              <SystemHealthStrip data={data} refreshing={refreshing} onRefresh={() => fetchData(true)} />

              <AnimatePresence>
                {loading && (
                  <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PageDataSkeleton rows={6} accentColor="hsl(214,80%,60%)" />
                  </m.div>
                )}
              </AnimatePresence>

              {error && !loading && (
                <div style={{ padding: "2rem", borderRadius: "12px", background: "hsla(0,72%,55%,0.06)", border: "1px solid hsla(0,72%,55%,0.18)", textAlign: "center", color: "hsl(0,72%,65%)", fontSize: "14px" }}>
                  Unable to load KPI data. Check the API server status.
                </div>
              )}

              {!loading && !error && agg && (
                <>
                  <div style={{ marginBottom: "0.625rem" }}>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,5%,36%)" }}>Aggregate</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                    <StatCard label="Workflow Runs" value={agg.totalWorkflowRuns} sub="Alloy orchestration" accent="hsl(214,80%,65%)" href={platforms?.alloy.href} icon={Layers} delay={0} />
                    <StatCard label="Active Incidents" value={agg.activeIncidents} sub="Lyte + Aegis" accent="hsl(38,72%,58%)" icon={TrendingUp} delay={0.05} />
                    <StatCard label="Distress Properties" value={agg.distressProperties} sub="Terra engine" accent="hsl(88,42%,52%)" href={platforms?.terra.href} icon={BarChart3} delay={0.1} />
                    <StatCard label="Fleet Vessels" value={agg.fleetVessels} sub="Vessels tracker" accent="hsl(205,85%,55%)" href={platforms?.vessels.href} icon={Ship} delay={0.15} />
                    <StatCard label="Active Deals" value={agg.activeDeals} sub="Terra pipeline" accent="hsl(142,62%,48%)" icon={TrendingUp} delay={0.2} />
                    <StatCard label="Security Findings" value={agg.securityFindings} sub="Aegis SOC" accent="hsl(232,68%,60%)" href={platforms?.aegis.href} icon={Shield} delay={0.25} />
                  </div>

                  <div style={{ marginBottom: "0.625rem" }}>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,5%,36%)" }}>By Platform</p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <PlatformBlock name="Alloy" icon={Layers} accent="hsl(214,80%,65%)" href={platforms!.alloy.href} delay={0.1} metrics={[{ label: "Workflow Runs", value: platforms!.alloy.workflowRuns }, { label: "Active Workflows", value: platforms!.alloy.activeWorkflows }]} />
                    <PlatformBlock name="Terra" icon={BarChart3} accent="hsl(88,42%,52%)" href={platforms!.terra.href} delay={0.15} metrics={[{ label: "Distress Properties", value: platforms!.terra.distressProperties }, { label: "Active Deals", value: platforms!.terra.activeDeals }]} />
                    <PlatformBlock name="Vessels" icon={Ship} accent="hsl(205,85%,55%)" href={platforms!.vessels.href} delay={0.2} metrics={[{ label: "Tracked Vessels", value: platforms!.vessels.trackedVessels }, { label: "Fleets", value: platforms!.vessels.fleets }]} />
                    <PlatformBlock name="Aegis" icon={Shield} accent="hsl(232,68%,60%)" href={platforms!.aegis.href} delay={0.25} metrics={[{ label: "Open Incidents", value: platforms!.aegis.incidents }, { label: "Findings", value: platforms!.aegis.findings }]} />
                    <PlatformBlock name="Lyte" icon={Eye} accent="hsl(190,90%,55%)" href={platforms!.lyte.href} delay={0.3} metrics={[{ label: "Active Incidents", value: platforms!.lyte.incidents }]} />
                    <PlatformBlock name="Carlota Jo" icon={Sparkles} accent="hsl(38,55%,58%)" href={platforms!.carlotaJo.href} delay={0.35} metrics={[{ label: "Client Inquiries", value: platforms!.carlotaJo.inquiries }]} />
                  </div>

                  <div style={{ marginTop: "1.5rem", marginBottom: "0.625rem" }}>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,5%,36%)" }}>Governed Autonomy</p>
                  </div>
                  <RunHealthWidget />
                </>
              )}
            </div>
          </div>
        </AuthGate>
      </main>
      <SiteFooter />
    </div>
  );
}
