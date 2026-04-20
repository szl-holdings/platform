import { useState, useEffect } from "react";
import { m } from "framer-motion";
import {
  Shield, Activity, Database, Lock, CheckCircle, AlertTriangle, XCircle, Clock,
  ExternalLink, RefreshCw, Wifi, WifiOff, Server,
} from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useCapabilityManifest } from "@/hooks/useCapabilityManifest";

type LiveStatus = "live" | "degraded" | "down" | "unknown";

interface StatusCard {
  id: string;
  label: string;
  description: string;
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
  status: LiveStatus;
  detail: string;
  source: string;
  lastChecked: string;
}

function StatusDot({ status }: { status: LiveStatus }) {
  const colors: Record<LiveStatus, string> = {
    live: "#10b981",
    degraded: "#f59e0b",
    down: "#ef4444",
    unknown: "#6b7280",
  };
  return (
    <span style={{
      display: "inline-block", width: "8px", height: "8px", borderRadius: "50%",
      background: colors[status], boxShadow: `0 0 6px ${colors[status]}80`, flexShrink: 0,
    }} />
  );
}

function StatusIcon({ status }: { status: LiveStatus }) {
  if (status === "live") return <CheckCircle size={14} style={{ color: "#10b981" }} />;
  if (status === "degraded") return <AlertTriangle size={14} style={{ color: "#f59e0b" }} />;
  if (status === "down") return <XCircle size={14} style={{ color: "#ef4444" }} />;
  return <Clock size={14} style={{ color: "#6b7280" }} />;
}

function StatusLabel({ status }: { status: LiveStatus }) {
  const map = { live: "Operational", degraded: "Degraded", down: "Outage", unknown: "Unknown" };
  const colors: Record<LiveStatus, string> = { live: "#10b981", degraded: "#f59e0b", down: "#ef4444", unknown: "#6b7280" };
  return <span style={{ fontSize: "12px", fontWeight: 700, color: colors[status] }}>{map[status]}</span>;
}

interface HealthResponse {
  status: string;
  services?: {
    database?: { latency?: number };
    auth?: { latency?: number };
    ai?: { latency?: number };
    storage?: { latency?: number };
  };
  uptime?: number;
}

export default function TrustStatusPage() {
  const __pageMeta = usePageMeta({
    title: "Trust Center Status — SZL Holdings",
    description: "Live platform status: uptime, security posture, dependency health, data residency, and SOC 2 progress.",
    canonical: "https://szlholdings.com/trust-center/status",
  });

  const { totals, provenClaims } = useCapabilityManifest();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<LiveStatus>("unknown");
  const [lastChecked, setLastChecked] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) { setHealthStatus("down"); return; }
        const data = await res.json() as HealthResponse;
        setHealth(data);
        setHealthStatus(data.status === "healthy" || data.status === "ok" ? "live" : "degraded");
        setLastChecked(new Date().toLocaleTimeString());
      } catch {
        setHealthStatus("down");
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
    const id = setInterval(fetchHealth, 60_000);
    return () => clearInterval(id);
  }, []);

  const dbLatency = health?.services?.database?.latency;
  const authStatus: LiveStatus = health?.services?.auth ? "live" : health ? "degraded" : "unknown";
  const dbStatus: LiveStatus = dbLatency !== undefined ? (dbLatency < 200 ? "live" : dbLatency < 1000 ? "degraded" : "down") : health ? "live" : "unknown";

  const cards: StatusCard[] = [
    {
      id: "api",
      label: "API & Core Services",
      description: "Health endpoint, authentication, session management, RBAC",
      icon: Server,
      status: loading ? "unknown" : healthStatus,
      detail: loading
        ? "Checking…"
        : healthStatus === "live"
          ? `All services healthy. Uptime: ${health?.uptime ? Math.round(health.uptime / 3600) + "h" : "—"}`
          : "Degraded or unreachable — check /api/health",
      source: "GET /api/health (live probe)",
      lastChecked,
    },
    {
      id: "database",
      label: "Database",
      description: "PostgreSQL 16 via Replit managed infrastructure",
      icon: Database,
      status: loading ? "unknown" : dbStatus,
      detail: loading ? "Checking…" : dbLatency !== undefined ? `Query latency: ${dbLatency}ms` : "Connected — latency not reported",
      source: "GET /api/health → services.database (live probe)",
      lastChecked,
    },
    {
      id: "auth",
      label: "Authentication",
      description: "OpenID Connect (PKCE) via Replit provider — login, sessions, logout",
      icon: Lock,
      status: loading ? "unknown" : authStatus,
      detail: "OIDC PKCE flow active. Session tokens stored in PostgreSQL. Timing-safe comparison.",
      source: "GET /api/health → services.auth (live probe)",
      lastChecked,
    },
    {
      id: "security",
      label: "Security Posture",
      description: "TLS 1.3, HMAC-signed WebSocket tickets, RBAC, tenant isolation",
      icon: Shield,
      status: "live",
      detail: `${totals.live} capabilities confirmed live. RBAC covers 155/170 routes. Tenant isolation enforced at query layer.`,
      source: "artifacts/audit/platform-capability-manifest.json (manifest)",
      lastChecked: "2026-04-19",
    },
    {
      id: "ci",
      label: "CI / Build Pipeline",
      description: "GitHub Actions — lint, typecheck, test, build, Zod coverage gate",
      icon: Activity,
      status: "live",
      detail: "246/281 route files (87%) have Zod validation. CI enforces ≥80% floor. Smoke test workflow registered.",
      source: "artifacts/audit/platform-capability-manifest.json (CAP-005, Infrastructure / Security)",
      lastChecked: "2026-04-18",
    },
    {
      id: "soc2",
      label: "SOC 2 Type II",
      description: "Compliance audit engagement status",
      icon: Shield,
      status: "degraded",
      detail: "Not yet initiated. Controls alignment underway. Audit engagement targeted post-Series A funding.",
      source: "docs/KNOWN-GAPS.md, trust-center compliance register",
      lastChecked: "2026-04-16",
    },
    {
      id: "data-residency",
      label: "Data Residency",
      description: "PostgreSQL hosted via Replit managed infrastructure (US)",
      icon: Database,
      status: "live",
      detail: "All production data stored in Replit-managed PostgreSQL. No third-party data replication. Tenant data scoped by org_id at all query paths.",
      source: "architecture.md, docs/DEPLOYMENT_MODEL.md",
      lastChecked: "2026-04-16",
    },
    {
      id: "dependencies",
      label: "Dependency Health",
      description: "Automated vulnerability scanning via npm audit, CodeQL",
      icon: Activity,
      status: "live",
      detail: "Automated dependency audit integrated in CI pipeline. Critical findings trigger immediate review block.",
      source: "Infrastructure / Security CAP in platform-capability-manifest.json",
      lastChecked: "2026-04-18",
    },
  ];

  const operationalCount = cards.filter(c => c.status === "live").length;
  const overallStatus: LiveStatus = cards.some(c => c.status === "down") ? "down"
    : cards.some(c => c.status === "degraded") ? "degraded"
      : cards.every(c => c.status === "live") ? "live"
        : "unknown";

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main id="main-content" role="main">
  
          <section style={{
            paddingTop: "clamp(7rem,12vw,10rem)",
            paddingBottom: "clamp(3rem,5vw,4rem)",
            borderBottom: "1px solid hsla(0,0%,100%,0.05)",
          }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <StatusDot status={overallStatus} />
                  <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,48%)" }}>
                    Trust Center Status
                  </span>
                </div>
                <h1 style={{
                  fontSize: "clamp(1.875rem,3.5vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.025em",
                  color: "hsl(38,12%,94%)", marginBottom: "1rem", maxWidth: "36rem", lineHeight: 1.12,
                }}>
                  {overallStatus === "live" ? "All systems operational." : overallStatus === "degraded" ? "Some systems degraded." : "Checking status…"}
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,57%)", lineHeight: 1.65, maxWidth: "42ch", marginBottom: "1.5rem" }}>
                  Live status for platform uptime, database, security posture, and compliance progress.
                  API probe data refreshes every 60 seconds. Manifest data reflects last audit.
                </p>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" as const }}>
                  <div>
                    <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#10b981" }}>{operationalCount}/{cards.length}</span>
                    <span style={{ fontSize: "12px", color: "hsl(210,5%,46%)", display: "block" }}>systems operational</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#3b82f6" }}>{provenClaims.length}</span>
                    <span style={{ fontSize: "12px", color: "hsl(210,5%,46%)", display: "block" }}>proven capabilities</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "hsl(38,12%,88%)" }}>{totals.live}</span>
                    <span style={{ fontSize: "12px", color: "hsl(210,5%,46%)", display: "block" }}>live (real data)</span>
                  </div>
                </div>
              </m.div>
            </div>
          </section>
  
          <section style={{ paddingTop: "clamp(3rem,5vw,4.5rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {cards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <m.div
                      key={card.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.045 }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2.5rem 1fr auto",
                        gap: "1rem",
                        padding: "1.125rem 1.375rem",
                        borderRadius: "10px",
                        background: "hsla(0,0%,100%,0.02)",
                        border: "1px solid hsla(0,0%,100%,0.06)",
                        alignItems: "start",
                      }}
                    >
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "8px",
                        background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.07)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={16} style={{ color: "hsl(210,5%,55%)" }} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,88%)" }}>{card.label}</span>
                          <StatusIcon status={card.status} />
                          <StatusLabel status={card.status} />
                        </div>
                        <p style={{ fontSize: "12.5px", color: "hsl(210,5%,52%)", marginBottom: "0.375rem" }}>{card.description}</p>
                        <p style={{ fontSize: "12px", color: "hsl(210,5%,44%)", lineHeight: 1.55 }}>{card.detail}</p>
                        <p style={{ fontSize: "11px", color: "hsl(210,5%,34%)", marginTop: "0.375rem" }}>
                          Source: <code style={{ fontFamily: "monospace", color: "hsl(210,55%,55%)" }}>{card.source}</code>
                          {card.lastChecked && <> · {card.lastChecked === lastChecked ? <><RefreshCw size={9} style={{ display: "inline", marginRight: "0.25rem" }} />Just now</> : `Last checked: ${card.lastChecked}`}</>}
                        </p>
                      </div>
                      <StatusDot status={card.status} />
                    </m.div>
                  );
                })}
              </div>
  
              <div style={{ marginTop: "2.5rem", padding: "1.25rem 1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.015)", border: "1px solid hsla(0,0%,100%,0.05)" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,40%)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Data Sources</p>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem" }}>
                  {[
                    ["API probe", "Live HTTP request to GET /api/health every 60 seconds"],
                    ["Capability manifest", "artifacts/audit/platform-capability-manifest.json — audited 2026-04-19"],
                    ["Architecture docs", "architecture.md, docs/DEPLOYMENT_MODEL.md"],
                    ["Trust register", "TRUST_CENTER_INDEX.md, docs/trust/"],
                  ].map(([src, detail]) => (
                    <div key={src} style={{ display: "flex", gap: "1rem" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "hsl(210,5%,50%)", minWidth: "9rem" }}>{src}</span>
                      <span style={{ fontSize: "12px", color: "hsl(210,5%,40%)" }}>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
  
              <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap" as const, gap: "0.75rem" }}>
                <Link href="/trust-center" style={{ fontSize: "13px", color: "hsl(210,55%,58%)", textDecoration: "none" }}>
                  ← Trust Center overview
                </Link>
                <span style={{ color: "hsl(210,5%,30%)" }}>·</span>
                <Link href="/product-readiness" style={{ fontSize: "13px", color: "hsl(210,55%,58%)", textDecoration: "none" }}>
                  Product Readiness Matrix
                </Link>
                <span style={{ color: "hsl(210,5%,30%)" }}>·</span>
                <a href="mailto:security@szlholdings.com" style={{ fontSize: "13px", color: "hsl(210,5%,40%)", textDecoration: "none" }}>
                  security@szlholdings.com
                </a>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
