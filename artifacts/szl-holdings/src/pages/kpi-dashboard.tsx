import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DataStateBadge } from "@/components/DataStateBadge";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { Lock, TrendingUp, Ship, Layers, Eye, Shield, Sparkles, BarChart3, ArrowUpRight, RefreshCw } from "lucide-react";

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
      style={{
        padding: "1.5rem",
        borderRadius: "12px",
        background: "hsla(0,0%,100%,0.025)",
        border: "1px solid hsla(0,0%,100%,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}12`, border: `1px solid ${accent}22`, flexShrink: 0 }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
        {href && (
          <a href={href} style={{ color: "hsl(210,5%,38%)", transition: "color 0.18s", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,60%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,38%)"; }}>
            <ArrowUpRight size={14} />
          </a>
        )}
      </div>
      <p style={{ fontSize: "2rem", fontWeight: 800, color: accent, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.375rem", fontFamily: "'Space Grotesk', system-ui" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p style={{ fontSize: "11px", fontWeight: 600, color: "hsl(38,12%,82%)", letterSpacing: "-0.005em", marginBottom: "0.2rem" }}>{label}</p>
      <p style={{ fontSize: "11px", color: "hsl(210,5%,42%)" }}>{sub}</p>
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: "1.375rem",
        borderRadius: "12px",
        background: "hsla(0,0%,100%,0.02)",
        border: "1px solid hsla(0,0%,100%,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}10`, border: `1px solid ${accent}1e` }}>
            <Icon size={13} style={{ color: accent }} />
          </div>
          <span style={{ fontSize: "13.5px", fontWeight: 700, color: "hsl(38,12%,88%)", letterSpacing: "-0.008em" }}>{name}</span>
        </div>
        <a href={href} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: 500, color: accent, textDecoration: "none", opacity: 0.75, transition: "opacity 0.18s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}>
          Open <ArrowUpRight size={11} />
        </a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${metrics.length}, 1fr)`, gap: "0.75rem" }}>
        {metrics.map((m) => (
          <div key={m.label}>
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "hsl(38,12%,90%)", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'Space Grotesk', system-ui" }}>
              {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
            </p>
            <p style={{ fontSize: "10px", color: "hsl(210,5%,42%)", marginTop: "0.25rem", letterSpacing: "0.02em" }}>{m.label}</p>
          </div>
        ))}
      </div>
    </m.div>
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
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Lock size={20} style={{ color: "hsl(210,5%,50%)" }} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(38,12%,90%)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>Auth Required</h2>
          <p style={{ fontSize: "13.5px", color: "hsl(210,5%,52%)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            The KPI dashboard is restricted to authenticated users.
          </p>
          <button
            onClick={login}
            style={{ padding: "0.625rem 1.5rem", background: "hsl(210,8%,18%)", color: "hsl(0,0%,88%)", border: "1px solid hsl(210,8%,26%)", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
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
  }, []);

  const agg = data?.aggregate;
  const platforms = data?.platforms;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main className="pt-24">
        <AuthGate>
          <div style={{ padding: "3rem 0 5rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginBottom: "2.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}
              >
                <div style={{ position: "relative" }}>
                  <DataStateBadge state="DEMO DATA" position="top-left" style={{ position: "relative", top: "auto", left: "auto", right: "auto", bottom: "auto", display: "inline-flex", marginBottom: "0.75rem" }} />
                  <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.5rem" }}>
                    Command Dashboard
                  </p>
                  <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", marginBottom: "0.5rem" }}>
                    Ecosystem KPIs
                  </h1>
                  <p style={{ fontSize: "13.5px", color: "hsl(210,5%,52%)" }}>
                    {data ? `Last updated ${new Date(data.checkedAt).toLocaleTimeString()}` : loading ? "Loading..." : "Real-time aggregate metrics across all platforms."}
                  </p>
                </div>
                <button
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", padding: "0.5rem 1rem",
                    background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)",
                    borderRadius: "6px", color: "hsl(210,5%,56%)", fontSize: "12px", fontWeight: 500,
                    cursor: refreshing ? "not-allowed" : "pointer", transition: "all 0.18s",
                  }}
                  onMouseEnter={(e) => { if (!refreshing) (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.07)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
                >
                  <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                  {refreshing ? "Refreshing…" : "Refresh"}
                </button>
              </m.div>

              {loading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
                  <div style={{ width: "20px", height: "20px", border: "2px solid hsla(0,0%,100%,0.1)", borderTopColor: "hsl(210,8%,72%)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
              )}

              {error && !loading && (
                <div style={{ padding: "2rem", borderRadius: "12px", background: "hsla(0,72%,55%,0.06)", border: "1px solid hsla(0,72%,55%,0.18)", textAlign: "center", color: "hsl(0,72%,65%)", fontSize: "14px" }}>
                  Unable to load KPI data. Check the API server status.
                </div>
              )}

              {!loading && !error && agg && (
                <>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,38%)" }}>Aggregate</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                    <StatCard label="Workflow Runs" value={agg.totalWorkflowRuns} sub="Alloy orchestration" accent="hsl(214,80%,65%)" href={platforms?.alloy.href} icon={Layers} delay={0} />
                    <StatCard label="Active Incidents" value={agg.activeIncidents} sub="Lyte + Aegis" accent="hsl(38,72%,58%)" icon={TrendingUp} delay={0.05} />
                    <StatCard label="Distress Properties" value={agg.distressProperties} sub="Terra engine" accent="hsl(88,42%,44%)" href={platforms?.terra.href} icon={BarChart3} delay={0.1} />
                    <StatCard label="Fleet Vessels" value={agg.fleetVessels} sub="Vessels tracker" accent="hsl(205,85%,55%)" href={platforms?.vessels.href} icon={Ship} delay={0.15} />
                    <StatCard label="Active Deals" value={agg.activeDeals} sub="Terra pipeline" accent="hsl(142,62%,48%)" icon={TrendingUp} delay={0.2} />
                    <StatCard label="Security Findings" value={agg.securityFindings} sub="Aegis SOC" accent="hsl(232,68%,60%)" href={platforms?.aegis.href} icon={Shield} delay={0.25} />
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,38%)" }}>By Platform</p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <PlatformBlock
                      name="Alloy" icon={Layers} accent="hsl(214,80%,65%)" href={platforms!.alloy.href} delay={0.1}
                      metrics={[
                        { label: "Workflow Runs", value: platforms!.alloy.workflowRuns },
                        { label: "Active Workflows", value: platforms!.alloy.activeWorkflows },
                      ]}
                    />
                    <PlatformBlock
                      name="Terra" icon={BarChart3} accent="hsl(88,42%,44%)" href={platforms!.terra.href} delay={0.15}
                      metrics={[
                        { label: "Distress Properties", value: platforms!.terra.distressProperties },
                        { label: "Active Deals", value: platforms!.terra.activeDeals },
                      ]}
                    />
                    <PlatformBlock
                      name="Vessels" icon={Ship} accent="hsl(205,85%,55%)" href={platforms!.vessels.href} delay={0.2}
                      metrics={[
                        { label: "Tracked Vessels", value: platforms!.vessels.trackedVessels },
                        { label: "Fleets", value: platforms!.vessels.fleets },
                      ]}
                    />
                    <PlatformBlock
                      name="Aegis" icon={Shield} accent="hsl(232,68%,60%)" href={platforms!.aegis.href} delay={0.25}
                      metrics={[
                        { label: "Open Incidents", value: platforms!.aegis.incidents },
                        { label: "Findings", value: platforms!.aegis.findings },
                      ]}
                    />
                    <PlatformBlock
                      name="Lyte" icon={Eye} accent="hsl(190,90%,55%)" href={platforms!.lyte.href} delay={0.3}
                      metrics={[{ label: "Active Incidents", value: platforms!.lyte.incidents }]}
                    />
                    <PlatformBlock
                      name="Carlota Jo" icon={Sparkles} accent="hsl(38,55%,58%)" href={platforms!.carlotaJo.href} delay={0.35}
                      metrics={[{ label: "Client Inquiries", value: platforms!.carlotaJo.inquiries }]}
                    />
                  </div>
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
