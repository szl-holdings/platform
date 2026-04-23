import { Link } from "wouter";
import {
  Map,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Shield,
  Layers,
  Building2,
  Target,
  Zap,
  Users,
  FileCheck2,
  AlertTriangle,
  Server,
  TestTube2,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useInvestorContent } from "@/hooks/useInvestorContent";

const ICONS: Record<string, LucideIcon> = {
  Map, CheckCircle2, Circle, Clock, Shield, Layers, Building2, Target, Zap, Users,
  FileCheck2, AlertTriangle, Server, TestTube2, Lock,
};

function resolveIcon(name: unknown, fallback: LucideIcon): LucideIcon {
  if (typeof name === "function") return name as LucideIcon;
  if (typeof name === "string" && ICONS[name]) return ICONS[name];
  return fallback;
}

type IconRef = LucideIcon | string;
type StatusRow = { platform: string; status: string; note: string };
type PriorityItem = { done: boolean; label: string; note: string };
type PriorityGroup = { priority: string; label: string; color: string; icon: IconRef; items: PriorityItem[] };
type MilestoneItem = { label: string; note: string };
type MilestoneGroup = { milestone: string; label: string; timeframe: string; color: string; icon: IconRef; items: MilestoneItem[] };
type SuccessGroup = { horizon: string; metrics: string[] };

type RoadmapContent = {
  hero: { eyebrow: string; title: string; lede: string };
  statusBaseline: StatusRow[];
  thirtyDayPriorities: PriorityGroup[];
  ninetyDayMilestones: MilestoneGroup[];
  successMetrics: SuccessGroup[];
};

const FALLBACK_CONTENT: RoadmapContent = {
  hero: {
    eyebrow: "Product Roadmap — April 2026",
    title: "30 days to hardened. 90 days to first revenue.",
    lede:
      "Pre-commercial priorities only — the work required to take the platform from Functional Alpha to first commercial deployment and initial design partner engagement. Every item is scoped, estimated, and dependency-mapped.",
  },
  statusBaseline: [
    { platform: "KORA (Command)", status: "Functional Alpha", note: "Full PRISM framework, signal-to-action loop" },
    { platform: "FORGE", status: "Functional Alpha", note: "Workflow engine, approval gates, audit trail" },
    { platform: "APEX (Mobile)", status: "Alpha Prep", note: "All workspaces functional, pre-release hardening" },
    { platform: "PARAGON", status: "Functional Alpha", note: "SOC command, 8 security modules" },
    { platform: "SEXTANT", status: "Functional Alpha", note: "Fleet, S&P, demurrage, freight, voyage P&L" },
    { platform: "DOMAINE", status: "Functional Alpha", note: "Distress pipeline, ownership graph, deal workflow" },
    { platform: "Carlota Jo", status: "Live", note: "Client portal, advisory ops — paying-client capable" },
    { platform: "Counsel", status: "Integrated", note: "Legal modules integrated into PARAGON" },
    { platform: "IMPERIUM", status: "In Development", note: "Cloud sovereignty — not yet functional" },
    { platform: "Command Portal", status: "Functional Alpha", note: "8-domain SSE dashboard, executive briefing" },
  ],
  thirtyDayPriorities: [
    {
      priority: "P1", label: "Security and Compliance Gates", color: "#c45a4a", icon: Shield,
      items: [
        { done: true, label: "P0 security gaps closed", note: "All critical vulnerabilities confirmed resolved as of April 2026" },
        { done: false, label: "Wire OpenTelemetry exporter (KG009)", note: "Connect OTEL exporter to production APM — hard pre-deploy requirement. Est. 3–5 days." },
        { done: false, label: "Add CodeQL SAST to CI pipeline (KG011)", note: "Block merges on critical/high severity findings + dependency review gate. Est. 2–3 days." },
        { done: false, label: "SSRF validation on webhook delivery URLs (KG020b)", note: "Host allowlist validation before webhook delivery. Est. 1–2 days." },
      ],
    },
    {
      priority: "P2", label: "Design Partner Readiness", color: "#d4a054", icon: Users,
      items: [
        { done: false, label: "Demo environment stability", note: "Consistent, non-overlapping seed data across KORA, PARAGON, SEXTANT, DOMAINE" },
        { done: false, label: "CODEOWNERS file (KG013)", note: "Code ownership for all major packages — required for enterprise security reviews. Est. 1 day." },
        { done: false, label: "Environment matrix documentation (KG018)", note: "Document all 80+ environment variables with schema, defaults, status. Est. 2–3 days." },
      ],
    },
    {
      priority: "P3", label: "Trust Center and Diligence Publication", color: "#6aaa72", icon: FileCheck2,
      items: [
        { done: true, label: "TECHNICAL_DILIGENCE_PACKET.md complete", note: "Full technical diligence reference published" },
        { done: true, label: "INVESTOR_NARRATIVE.md complete", note: "Governed decision operating system thesis — Version 3.0" },
        { done: true, label: "MOAT_MAP.md complete", note: "Eight structural moats with codebase evidence — Version 2.0" },
        { done: true, label: "PRODUCT_ROADMAP.md complete", note: "30/90-day priorities documented" },
        { done: false, label: "Trust center review and link validation", note: "Update TRUST_CENTER_INDEX.md, verify all doc links, set next review date" },
      ],
    },
    {
      priority: "P4", label: "APEX Alpha Release Readiness", color: "#4a90b8", icon: Zap,
      items: [
        { done: false, label: "App store submission checklist complete", note: "Privacy policy integration, app store metadata, screenshot packages" },
        { done: false, label: "Biometric auth QA", note: "End-to-end testing of Face ID / Touch ID flows, offline sync validation" },
      ],
    },
  ],
  ninetyDayMilestones: [
    { milestone: "M1", label: "First Commercial Deployment", timeframe: "30–60 days", color: "#d4a054", icon: Server, items: [
      { label: "Production infrastructure provisioning", note: "Azure Bicep IaC — Key Vault, App Service, PostgreSQL Flexible Server, Redis, CDN, Front Door" },
      { label: "Production secrets rotation", note: "Rotate all credentials to production-grade values in Azure Key Vault. Remove all placeholders." },
      { label: "SLI/SLO definition (KG023)", note: "Wire alerting to OTEL and on-call. Min SLOs: API availability 99.5%, p95 latency < 500ms, error rate < 1%" },
      { label: "Performance baseline (KG024)", note: "Reduce vendor bundle sizes to < 800 KB. Add Lighthouse CI regression guard. Target Core Web Vitals." },
    ]},
    { milestone: "M2", label: "Design Partner Onboarding", timeframe: "45–75 days", color: "#8b7ac8", icon: Users, items: [
      { label: "First 3–6 design partners — one per domain", note: "Maritime (SEXTANT), security (PARAGON), real estate (DOMAINE)" },
      { label: "Partner provisioning workflow", note: "Azure AD tenant setup, SCIM provisioning, role assignment, support rotation" },
      { label: "Domain-specific onboarding content", note: "Demo scripts, operator quick-start guides, trust center briefing deck per domain" },
      { label: "Partner success instrumentation", note: "Log first signal reviewed, first simulation, first approval, first workflow completed" },
    ]},
    { milestone: "M3", label: "E2E Test Coverage", timeframe: "60–90 days", color: "#6aaa72", icon: TestTube2, items: [
      { label: "Critical path E2E suite", note: "Signal → recommendation → approval → execution → proof recording. Playwright (web) + Detox (mobile)" },
      { label: "API integration tests", note: "POST/mutation coverage for all domain packs. Multi-tenant isolation: no cross-org data leakage." },
      { label: "Regression baseline on main", note: "Passing baseline established. CI gate blocks merges on E2E failures. Weekly regression run." },
    ]},
    { milestone: "M4", label: "SOC 2 Type II Readiness Planning", timeframe: "75–90 days", color: "#4a90b8", icon: Lock, items: [
      { label: "Controls inventory — map to SOC 2 Trust Services Criteria", note: "Identify gaps. Prioritize control implementation based on audit firm feedback." },
      { label: "Audit firm selection", note: "Engage 2–3 SOC 2 firms for scoping. Target audit date: Q4 2026 or Q1 2027." },
      { label: "Evidence collection automation", note: "Wire audit trail for automated evidence generation: access logs, scan results, change management." },
    ]},
    { milestone: "M5", label: "IMPERIUM MVP", timeframe: "90 days", color: "#c8953c", icon: Zap, items: [
      { label: "Core cloud inventory and policy modules", note: "Multi-cloud estate visibility (AWS, Azure, GCP). Policy enforcement dashboard. Cost anomaly detection." },
      { label: "Integration with Command Portal", note: "IMPERIUM signals in 8-domain SSE dashboard. Cross-domain: cloud posture → security posture (PARAGON)." },
    ]},
  ],
  successMetrics: [
    { horizon: "30-day", metrics: ["All P0 security gaps closed (confirmed ✅ April 2026)", "KG009, KG011, KG012 resolved and CI-gated", "Demo environment stable for 5+ consecutive sessions without data reset"] },
    { horizon: "60-day", metrics: ["First design partner organization provisioned and onboarded", "Production environment live with OTEL connected", "SLI/SLO definitions complete with alerting active"] },
    { horizon: "90-day", metrics: ["3+ active design partner organizations using the platform weekly", "E2E test suite covering critical path with CI gate", "IMPERIUM MVP functional", "SOC 2 readiness assessment complete"] },
  ],
};

const statusColor: Record<string, string> = {
  "Functional Alpha": "#d4a054",
  "Alpha Prep": "#8b7ac8",
  "Live": "#6aaa72",
  "Integrated": "#4a90b8",
  "In Development": "#c8953c",
};

export default function InvestorsRoadmapPage() {
  const __pageMeta = usePageMeta({
    title: "Roadmap — Investor Relations — SZL Holdings",
    description: "SZL Holdings 30-day and 90-day product roadmap — pre-commercial hardening to first commercial deployment and design partner activation.",
    canonical: "https://szlholdings.com/investors/roadmap",
  });

  const { content, isSeeded } = useInvestorContent<RoadmapContent>("roadmap", FALLBACK_CONTENT);
  const { hero, statusBaseline, thirtyDayPriorities, ninetyDayMilestones, successMetrics } = content;

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <main>
          {/* Hero */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#6aaa72]/20 bg-[#6aaa72]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#6aaa72]">
                  <Map className="h-3.5 w-3.5" />
                  {hero.eyebrow}
                </div>
                {isSeeded ? (
                  <span
                    data-testid="investor-content-demo-badge"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Live DB
                  </span>
                ) : null}
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                {hero.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">{hero.lede}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/investors/overview" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                  Company overview
                </Link>
                <Link href="/investors/moat" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                  Moat & defensibility <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Status baseline */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Status baseline — April 2026</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">All platforms at Functional Alpha.</h2>
              <p className="mt-2 text-sm text-white/50">Full feature sets with seeded/demo data. Not yet commercially deployed.</p>
              <div className="mt-8 space-y-2">
                {statusBaseline.map((row) => (
                  <div key={row.platform} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
                    <div>
                      <span className="text-sm font-semibold text-white">{row.platform}</span>
                      <span className="ml-3 text-xs text-white/40">{row.note}</span>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: statusColor[row.status] ?? "#ffffff80",
                        background: `${statusColor[row.status] ?? "#ffffff"}18`,
                        border: `1px solid ${statusColor[row.status] ?? "#ffffff"}30`,
                      }}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 30-day priorities */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">30-day horizon — April–May 2026</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Pre-commercial hardening.</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/50">Closing the highest-priority gaps before design partner onboarding begins.</p>
              <div className="mt-10 space-y-6">
                {thirtyDayPriorities.map((group) => {
                  const Icon = resolveIcon(group.icon, Shield);
                  return (
                    <div key={group.priority} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:p-8">
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20">
                          <Icon className="h-4 w-4" style={{ color: group.color }} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: group.color }}>{group.priority}</span>
                        <h3 className="text-base font-semibold text-white">{group.label}</h3>
                      </div>
                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <div key={item.label} className="flex items-start gap-3">
                            {item.done ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: group.color }} />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-white/20" />
                            )}
                            <div>
                              <p className="text-sm font-medium" style={{ color: item.done ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.60)" }}>
                                {item.label}
                              </p>
                              <p className="text-xs text-white/35 mt-0.5">{item.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 90-day milestones */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">90-day horizon — April–July 2026</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">First commercial deployment and design partner activation.</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/50">The critical path from Functional Alpha to revenue-generating operations.</p>
              <div className="mt-10 space-y-6">
                {ninetyDayMilestones.map((ms) => {
                  const Icon = resolveIcon(ms.icon, Server);
                  return (
                    <div key={ms.milestone} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:p-8">
                      <div className="flex flex-wrap items-center gap-4 mb-5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20">
                          <Icon className="h-4 w-4" style={{ color: ms.color }} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ms.color }}>{ms.milestone}</span>
                        <h3 className="text-base font-semibold text-white">{ms.label}</h3>
                        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1 text-xs text-white/45">
                          <Clock className="h-3 w-3" />
                          {ms.timeframe}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {ms.items.map((item) => (
                          <div key={item.label} className="flex items-start gap-3">
                            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-white/20" />
                            <div>
                              <p className="text-sm font-medium text-white/60">{item.label}</p>
                              <p className="text-xs text-white/35 mt-0.5">{item.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Success metrics */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">Success metrics</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Measurable outcomes at each horizon.</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {successMetrics.map((group) => (
                  <div key={group.horizon} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#d4a054]">{group.horizon}</div>
                    <div className="space-y-3">
                      {group.metrics.map((m) => (
                        <div key={m} className="flex items-start gap-2">
                          <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#d4a054]/60" />
                          <p className="text-xs leading-5 text-white/60">{m}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Out of scope */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
              <div className="flex items-start gap-4 rounded-2xl border border-[#c45a4a]/15 bg-[#c45a4a]/[0.04] p-6">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#c45a4a]/70" />
                <div>
                  <p className="text-sm font-semibold text-white/80">Explicitly out of scope for this roadmap</p>
                  <p className="mt-1.5 text-sm leading-6 text-white/50">
                    New domain pack feature development · GitHub Actions CI/CD pipeline rebuild · Mobile app store launch ·
                    Public marketing website refresh · Any roadmap items beyond 90 days.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Overview", href: "/investors/overview", icon: Building2 },
                  { label: "Architecture", href: "/investors/architecture", icon: Layers },
                  { label: "Data Room", href: "/investors/data-room", icon: FileCheck2 },
                ].map((item) => (
                  <Link key={item.label} href={item.href}>
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04]">
                      <item.icon className="h-4 w-4 text-[#d4a054]" />
                      <span className="text-sm font-medium text-white/80">{item.label}</span>
                      <ArrowRight className="ml-auto h-3.5 w-3.5 text-white/25" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
