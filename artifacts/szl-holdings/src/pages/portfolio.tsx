import type { ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Ship, ShieldCheck, Building2, BarChart3, Workflow, BriefcaseBusiness,
  ArrowUpRight, RefreshCw, AlertCircle, ExternalLink,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiRequest } from "@/lib/api";
import { ScenarioCard } from "@/components/ScenarioCard";

interface EcosystemSummary {
  checkedAt: string;
  continuum: { workflowRuns: number };
  lyte: { incidents: number };
  vessels: { trackedVessels: number; fleets: number };
  aegis: { incidents: number; findings: number };
  terra: { distressProperties: number; activeDeals: number };
  carlotaJo: { inquiries: number };
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function ModuleTile({
  icon: Icon,
  name,
  tagline,
  accentColor,
  href,
  hrefExternal,
  externalHref,
  stats,
  status,
  loading,
}: {
  icon: ElementType;
  name: string;
  tagline: string;
  accentColor: string;
  href: string;
  hrefExternal?: boolean;
  externalHref?: string;
  stats: { label: string; value: string | number }[];
  status: "active" | "live" | "pilot";
  loading: boolean;
}) {
  const statusLabel = status === "live" ? "Live" : status === "active" ? "Active" : "Pilot";
  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    live: { bg: "hsla(142,62%,46%,0.1)", text: "hsl(142,55%,62%)", dot: "hsl(142,62%,50%)" },
    active: { bg: "hsla(210,80%,55%,0.1)", text: "hsl(210,72%,68%)", dot: "hsl(210,80%,60%)" },
    pilot: { bg: "hsla(38,80%,50%,0.1)", text: "hsl(38,70%,70%)", dot: "hsl(38,80%,55%)" },
  };
  const sc = statusColors[status];

  return (
    <div
      style={{
        background: "hsla(0,0%,100%,0.025)",
        border: "1px solid hsla(0,0%,100%,0.07)",
        borderRadius: "16px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        position: "relative",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={18} style={{ color: accentColor }} />
          </div>
          <div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>{name}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(214,7%,52%)", marginTop: "1px" }}>{tagline}</div>
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "4px",
            background: sc.bg,
            border: `1px solid ${sc.dot}40`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: sc.dot,
              boxShadow: status === "live" ? `0 0 4px ${sc.dot}90` : undefined,
            }}
          />
          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: sc.text, textTransform: "uppercase" }}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          gap: "0.5rem",
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "hsla(0,0%,100%,0.03)",
              border: "1px solid hsla(0,0%,100%,0.06)",
              borderRadius: "8px",
              padding: "0.625rem 0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "hsl(38,8%,93%)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {loading ? (
                <span style={{ opacity: 0.3 }}>—</span>
              ) : (
                typeof s.value === "number" ? fmt(s.value) : s.value
              )}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "hsl(214,7%,48%)", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
        {hrefExternal ? (
          <a
            href={href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: accentColor,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            View module <ArrowUpRight size={13} />
          </a>
        ) : (
          <Link href={href}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: accentColor,
                cursor: "pointer",
              }}
            >
              View module <ArrowUpRight size={13} />
            </span>
          </Link>
        )}
        {externalHref && (
          <a
            href={externalHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "hsl(214,7%,50%)",
              textDecoration: "none",
              marginLeft: "auto",
            }}
          >
            Open app <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const __pageMeta = usePageMeta({
    title: "Portfolio Dashboard — SZL Holdings",
    description: "Live portfolio summary for SZL Holdings — Terra, Vessels, Lyte, Aegis, Counsel, and Carlota Jo module health and signal counts.",
    canonical: "https://szlholdings.com/portfolio",
  });

  const { data, isLoading, isError, refetch } = useQuery<EcosystemSummary>({
    queryKey: ["holdings-ecosystem-summary"],
    queryFn: () => apiRequest<EcosystemSummary>("GET", "/api/holdings/ecosystem-summary"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const checkedAt = data?.checkedAt ? new Date(data.checkedAt).toLocaleTimeString() : null;

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "#070a10", color: "hsl(38,8%,88%)" }}>
        <SiteNav />

        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "5rem 1.5rem 4rem" }}>
          {/* Header */}
          <div style={{ marginBottom: "2.5rem" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "hsl(214,7%,42%)", marginBottom: "0.5rem" }}>
              SZL Holdings
            </p>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,8%,94%)", margin: 0 }}>
                  Portfolio Dashboard
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "hsl(214,7%,55%)", marginTop: "0.375rem" }}>
                  Live signal counts and module health across all active platform layers.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {checkedAt && (
                  <span style={{ fontSize: "0.75rem", color: "hsl(214,7%,42%)" }}>Updated {checkedAt}</span>
                )}
                <button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.375rem 0.75rem",
                    background: "hsla(0,0%,100%,0.04)",
                    border: "1px solid hsla(0,0%,100%,0.09)",
                    borderRadius: "6px",
                    color: "hsl(214,7%,58%)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  <RefreshCw size={12} style={{ opacity: isLoading ? 0.4 : 1 }} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Error state */}
          {isError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.875rem 1rem",
                background: "hsla(0,72%,56%,0.07)",
                border: "1px solid hsla(0,72%,56%,0.2)",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                fontSize: "0.8125rem",
                color: "hsl(0,72%,72%)",
              }}
            >
              <AlertCircle size={14} />
              Could not load live signal data. Showing cached or unavailable metrics.
            </div>
          )}

          {/* Demo data notice */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.75rem 1rem",
              background: "hsla(38,80%,50%,0.06)",
              border: "1px solid hsla(38,80%,50%,0.18)",
              borderRadius: "8px",
              marginBottom: "2rem",
              fontSize: "0.8125rem",
              color: "hsl(38,70%,68%)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "hsl(38,80%,55%)",
                flexShrink: 0,
              }}
            />
            Metrics below are drawn from seeded demo data. Signal counts reflect the live database state.
          </div>

          {/* Module tiles grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1rem",
              marginBottom: "2.5rem",
            }}
          >
            <ModuleTile
              icon={BarChart3}
              name="Lyte"
              tagline="Decision Intelligence Platform"
              accentColor="hsl(191,92%,44%)"
              href="/lyte/overview"
              hrefExternal
              externalHref="/lyte/"
              stats={[
                { label: "Incidents", value: data?.lyte.incidents ?? 0 },
                { label: "Status", value: "Active" },
              ]}
              status="live"
              loading={isLoading}
            />

            <ModuleTile
              icon={Building2}
              name="Terra"
              tagline="Real Estate Intelligence"
              accentColor="hsl(140,50%,46%)"
              href="/terra/dashboard"
              hrefExternal
              externalHref="/terra/"
              stats={[
                { label: "Deals", value: data?.terra.activeDeals ?? 0 },
                { label: "Distress Props", value: data?.terra.distressProperties ?? 0 },
              ]}
              status="active"
              loading={isLoading}
            />

            <ModuleTile
              icon={Ship}
              name="Vessels"
              tagline="Maritime Intelligence"
              accentColor="hsl(200,80%,52%)"
              href="/vessels/dashboard"
              hrefExternal
              externalHref="/vessels/"
              stats={[
                { label: "Tracked", value: data?.vessels.trackedVessels ?? 0 },
                { label: "Fleets", value: data?.vessels.fleets ?? 0 },
              ]}
              status="active"
              loading={isLoading}
            />

            <ModuleTile
              icon={ShieldCheck}
              name="Aegis"
              tagline="Cyber Resilience Command"
              accentColor="hsl(0,72%,56%)"
              href="/sentra/dashboard"
              hrefExternal
              externalHref="/sentra/"
              stats={[
                { label: "Incidents", value: data?.aegis.incidents ?? 0 },
                { label: "Findings", value: data?.aegis.findings ?? 0 },
              ]}
              status="active"
              loading={isLoading}
            />

            <ModuleTile
              icon={Workflow}
              name="Counsel"
              tagline="Governed Execution Fabric"
              accentColor="hsl(258,55%,68%)"
              href="/continuum/home"
              stats={[
                { label: "Workflow Runs", value: data?.continuum.workflowRuns ?? 0 },
                { label: "Status", value: "Running" },
              ]}
              status="live"
              loading={isLoading}
            />

            <ModuleTile
              icon={BriefcaseBusiness}
              name="Carlota Jo"
              tagline="Premium Advisory Services"
              accentColor="hsl(30,55%,55%)"
              href="/carlota-jo/consulting-os"
              hrefExternal
              externalHref="/carlota-jo/"
              stats={[
                { label: "Inquiries", value: data?.carlotaJo.inquiries ?? 0 },
                { label: "Status", value: "Active" },
              ]}
              status="active"
              loading={isLoading}
            />
          </div>

          {/* Causal Scenario Engine card */}
          <div style={{ marginBottom: "2rem" }}>
            <ScenarioCard />
          </div>

          {/* Quick links row */}
          <div
            style={{
              borderTop: "1px solid hsla(0,0%,100%,0.07)",
              paddingTop: "2rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {[
              { label: "Venture Intelligence", href: "/venture-intelligence" },
              { label: "Investor Hub", href: "/investors" },
              { label: "Reports", href: "/reports" },
              { label: "Trust Center", href: "/trust-center" },
              { label: "Fund Operations", href: "/fund" },
              { label: "Platform Map", href: "/ventures" },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                    borderRadius: "8px",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "hsl(214,7%,60%)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {link.label}
                  <ArrowUpRight size={13} style={{ opacity: 0.5 }} />
                </div>
              </Link>
            ))}
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
