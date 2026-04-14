import { AppShell } from "@/components/layout/AppShell";
import { Link } from "wouter";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Clock, CheckCircle2,
  AlertCircle, Anchor, Building2, Scale, Shield, ChevronRight,
  Activity, RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { portalApi, type DashboardData } from "@/lib/api";
import { DOMAIN_CARDS, fmt } from "@/data/mock";
import { cn } from "@/lib/utils";
import { SectionErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { DataStateBadge } from "@szl-holdings/shared-ui/data-state-badge";

const DOMAIN_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  vessels: Anchor,
  terra: Building2,
  legal: Scale,
  security: Shield,
};

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "var(--color-forge-vessels)",
  terra: "var(--color-forge-terra)",
  legal: "var(--color-forge-legal)",
  security: "var(--color-forge-security)",
};

const STATUS_ICON: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  active: CheckCircle2,
  attention: AlertCircle,
  critical: AlertCircle,
};

const STATUS_COLOR: Record<string, string> = {
  active: "var(--color-forge-success)",
  attention: "var(--color-forge-warning)",
  critical: "var(--color-forge-danger)",
};

const DOMAIN_LINKS: Record<string, string> = {
  vessels: "/assets",
  terra: "/assets",
  legal: "/matters",
  security: "/documents",
};

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["forge-portal", "dashboard"],
    queryFn: () => portalApi.getDashboard(),
    retry: 1,
  });

  const clientName = data?.client?.name?.split(" ")[0] ?? "there";
  const companyName = data?.client?.companyName ?? "SZL Holdings Client";
  const relationship = data?.client?.relationship ?? "";
  const summary = data?.summary;
  const domains = data?.client?.domains ?? ["vessels", "terra", "legal", "security"];
  const nextDeadline = data?.nextDeadline;
  const recentActivity = data?.recentActivity ?? [];
  const domainCards = DOMAIN_CARDS.filter(c => domains.includes(c.domain as "vessels" | "terra" | "legal" | "security"));

  return (
    <AppShell
      title={`Welcome back, ${clientName}`}
      subtitle={`${companyName}${relationship ? ` · ${relationship}` : ""}`}
    >
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-end">
          <DataStateBadge state={data?.demoMode ? "demo" : isError ? "stub" : "live"} />
        </div>
        {isError && (
          <div className="rounded-lg border p-3 text-sm flex items-center gap-2" style={{ borderColor: "var(--color-forge-warning)", background: "color-mix(in srgb, var(--color-forge-warning) 8%, transparent)", color: "var(--color-forge-warning)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Live data unavailable — displaying demo data. Ensure the API server is running.</span>
          </div>
        )}

        {/* Summary strip */}
        <SectionErrorBoundary sectionName="Portfolio Summary">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          <SummaryCard
            label="Portfolio Value"
            value={isLoading ? "—" : fmt(summary?.totalValue ?? 0)}
            sub={summary?.totalReturn ? `${summary.totalReturn} total return` : "Loading..."}
            icon={TrendingUp}
            color="var(--color-forge-primary)"
            positive
          />
          <SummaryCard
            label="Capital Deployed"
            value={isLoading ? "—" : fmt(summary?.totalDeployed ?? 0)}
            sub={`Across ${isLoading ? "—" : String(domains.length)} domains`}
            icon={Activity}
            color="var(--color-forge-gold)"
          />
          <SummaryCard
            label="Active Matters"
            value={isLoading ? "—" : String(summary?.openMatters ?? 0)}
            sub={nextDeadline ? `Next: ${nextDeadline.date}` : "All on track"}
            icon={Scale}
            color="var(--color-forge-legal)"
          />
          <SummaryCard
            label="Unread Messages"
            value={isLoading ? "—" : String(summary?.unreadMessages ?? 0)}
            sub="From your SZL team"
            icon={Activity}
            color="var(--color-forge-security)"
          />
        </div>
        </SectionErrorBoundary>

        {/* Domain cards */}
        <SectionErrorBoundary sectionName="Domain Verticals">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-600" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>Your Verticals</h2>
            <span className="forge-eyebrow">{domains.length} engaged domains</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {domainCards.map((card, i) => {
              const Icon = DOMAIN_ICONS[card.domain];
              const StatusIcon = STATUS_ICON[card.status];
              const link = DOMAIN_LINKS[card.domain];
              return (
                <Link key={card.domain} href={link}>
                  <div
                    className={cn("forge-domain-card p-5 cursor-pointer animate-fade-in-up", card.domain)}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: `color-mix(in srgb, ${DOMAIN_COLORS[card.domain]} 12%, transparent)` }}
                      >
                        <Icon className="w-4.5 h-4.5" style={{ color: DOMAIN_COLORS[card.domain] }} />
                      </div>
                      <div className="flex items-center gap-1">
                        <StatusIcon className="w-3.5 h-3.5" style={{ color: STATUS_COLOR[card.status] }} />
                        <span className="text-xs capitalize" style={{ color: STATUS_COLOR[card.status] }}>{card.status}</span>
                      </div>
                    </div>
                    <div className="font-600 text-sm mb-0.5" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{card.label}</div>
                    <div className="text-xs mb-4" style={{ color: "var(--color-forge-text-muted)" }}>{card.summary}</div>
                    <div className="space-y-2">
                      {card.metrics.map(m => (
                        <div key={m.label} className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>{m.label}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-600" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-mono)" }}>{m.value}</span>
                            {m.delta && (
                              <span className="text-[0.625rem]" style={{ color: m.up ? "var(--color-forge-success)" : "var(--color-forge-danger)" }}>
                                {m.up ? <ArrowUpRight className="inline w-2.5 h-2.5" /> : <ArrowDownRight className="inline w-2.5 h-2.5" />}
                                {m.delta}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid var(--color-forge-border)" }}>
                      <span className="flex items-center gap-1 text-[0.6875rem]" style={{ color: "var(--color-forge-text-faint)" }}>
                        <Clock className="w-3 h-3" />
                        {card.lastUpdated}
                      </span>
                      <span className="text-[0.6875rem] font-500 flex items-center gap-0.5" style={{ color: DOMAIN_COLORS[card.domain] }}>
                        View <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        </SectionErrorBoundary>

        {/* Two-column: Recent Activity + Quick Actions */}
        <SectionErrorBoundary sectionName="Recent Activity">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="forge-card-elevated p-5 lg:col-span-2 animate-fade-in-up stagger-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-600 text-sm" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>Recent Activity</h3>
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--color-forge-text-faint)" }} />}
            </div>
            <div className="space-y-3">
              {(recentActivity.length > 0 ? recentActivity : [
                { type: "document", description: "Q1 2026 Maritime Portfolio Report uploaded", date: "2026-04-01" },
                { type: "matter", description: "Pacific Sentinel hearing scheduled for Apr 28", date: "2026-04-08" },
                { type: "message", description: "New message from Diana Reyes re: Q1 Review", date: "2026-04-05" },
                { type: "alert", description: "Gulf Explorer cargo temp variance flagged", date: "2026-04-11" },
              ]).map((item, idx) => {
                const typeColors: Record<string, string> = {
                  document: "var(--color-forge-gold)",
                  matter: "var(--color-forge-legal)",
                  message: "var(--color-forge-vessels)",
                  alert: "var(--color-forge-warning)",
                };
                return (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0" style={{ borderColor: "var(--color-forge-border)" }}>
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: typeColors[item.type] ?? "var(--color-forge-primary)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm" style={{ color: "var(--color-forge-text)" }}>{item.description}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-forge-text-muted)" }}>{item.date}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="forge-card-elevated p-5 animate-fade-in-up stagger-5">
            <h3 className="font-600 text-sm mb-4" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>Quick Access</h3>
            <div className="space-y-2">
              {[
                { label: "View Portfolio", sub: "Holdings & returns", path: "/portfolio", color: "var(--color-forge-primary)" },
                { label: "Active Matters", sub: `${summary?.openMatters ?? "—"} open`, path: "/matters", color: "var(--color-forge-legal)" },
                { label: "Asset Monitor", sub: "Vessels & properties", path: "/assets", color: "var(--color-forge-vessels)" },
                { label: "Document Vault", sub: "Reports & filings", path: "/documents", color: "var(--color-forge-gold)" },
                { label: "Messages", sub: `${summary?.unreadMessages ?? "—"} unread`, path: "/messages", color: "var(--color-forge-security)" },
              ].map(item => (
                <Link key={item.path} href={item.path}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-forge-bg-secondary)]">
                    <div className="w-2 h-6 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                    <div>
                      <div className="text-sm font-500" style={{ color: "var(--color-forge-text)" }}>{item.label}</div>
                      <div className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>{item.sub}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "var(--color-forge-text-faint)" }} />
                  </div>
                </Link>
              ))}
            </div>
            {nextDeadline && (
              <div className="mt-4 p-3 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-forge-warning) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-forge-warning) 25%, transparent)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5" style={{ color: "var(--color-forge-warning)" }} />
                  <span className="forge-eyebrow">Upcoming deadline</span>
                </div>
                <div className="text-sm font-500" style={{ color: "var(--color-forge-text)" }}>{nextDeadline.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--color-forge-text-muted)" }}>{nextDeadline.date} · {nextDeadline.leadAttorney}</div>
              </div>
            )}
          </div>
        </div>
        </SectionErrorBoundary>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  label, value, sub, icon: Icon, color, positive
}: {
  label: string; value: string; sub: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string; positive?: boolean;
}) {
  return (
    <div className="forge-card-elevated p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="forge-eyebrow">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <div className="forge-metric">{value}</div>
      <div className="text-xs mt-1" style={{ color: positive ? "var(--color-forge-success)" : "var(--color-forge-text-muted)" }}>
        {sub}
      </div>
    </div>
  );
}
