import { useState } from "react";

import { OpsLayout } from "../components/ops-layout";
import { Zap, Shield, Activity, DollarSign, CheckCircle2, Clock, AlertTriangle, ChevronRight, Settings, RefreshCw, User } from "lucide-react";
import { useEcosystemData } from "../hooks/use-ecosystem-data";
import { useStandardQuery } from "@szl-holdings/api-client-react";

interface ApiDigestSection {
  id: string;
  priority: number;
  label: string;
  color: string;
  headline: string;
  detail: string;
  actions: { label: string; href: string }[];
  relevantFor: string[];
}

interface ApiDigestResponse {
  role: string;
  sections: ApiDigestSection[];
  stats: { firing: number; critical: number; pending: number; p95: number };
  generatedAt: string;
  dataSource: string;
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  health: Activity, alerts: AlertTriangle, security: Shield, sla: CheckCircle2,
  costs: DollarSign, compliance: CheckCircle2, "ops-win": Zap, activity: Clock,
};

type Role = "executive" | "security" | "operations" | "finance" | "legal";

interface DigestSection {
  id: string;
  priority: number;
  icon: React.ElementType;
  label: string;
  color: string;
  headline: string;
  detail: string;
  actions: { label: string; href: string }[];
  relevantFor: Role[];
}

function buildDigest(role: Role, compositeScore: number): DigestSection[] {
  const base: DigestSection[] = [
    {
      id: "health",
      priority: role === "executive" ? 1 : 4,
      icon: Activity,
      label: "Ecosystem Health",
      color: "#8b7ac8",
      headline: `Composite health score at ${compositeScore}/100 — ${compositeScore >= 80 ? "holding steady" : "needs attention"}`,
      detail: compositeScore >= 80
        ? "All critical systems nominal. Operational and financial dimensions are the primary drag on the overall score."
        : `${7 - Math.floor(compositeScore / 15)} domain${compositeScore < 70 ? "s" : ""} require attention. Lyte API latency and SZL NAV delay are the primary contributors.`,
      actions: [{ label: "View Health Score", href: "/health" }, { label: "Domain Details", href: "/" }],
      relevantFor: ["executive", "operations"],
    },
    {
      id: "alerts",
      priority: role === "security" ? 1 : role === "operations" ? 2 : 3,
      icon: AlertTriangle,
      label: "Active Alerts",
      color: "var(--color-critical)",
      headline: "2 critical, 3 high-priority alerts require action today",
      detail: "AIS transponder breach attempt on Vessels OT systems (Aegis SOC responding). Force majeure clause triggered on Q3 Cargo Agreement. Miami Beach deal deadline 48h out.",
      actions: [{ label: "Alert Inbox", href: "/alerts" }, { label: "Aegis SOC", href: "/" }],
      relevantFor: ["executive", "security", "operations", "legal"],
    },
    {
      id: "security",
      priority: role === "security" ? 2 : 5,
      icon: Shield,
      label: "Security Posture",
      color: "#ef4444",
      headline: "SOC posture elevated — nation-state credential attempt logged",
      detail: "7 failed auth attempts from Tor exit node targeting Vessels SCADA. IP blocked, Aegis playbook activated. MTTR tracking at 11 min (target: 15 min). 3 open CVEs pending patch.",
      actions: [{ label: "View Aegis", href: "/" }, { label: "SOC Dashboard", href: "/" }],
      relevantFor: ["executive", "security"],
    },
    {
      id: "sla",
      priority: role === "operations" ? 1 : 3,
      icon: CheckCircle2,
      label: "SLA Performance",
      color: "var(--color-high)",
      headline: "3 SLAs breaching — Lyte API, Lyte on-time rate, SZL NAV delay",
      detail: "Lyte API P95 latency at 2.4s vs 2s target (81.5% monthly compliance). Driver on-time rate 88% vs 92% target. SZL NAV computation running 15min late due to Bloomberg feed issues.",
      actions: [{ label: "SLA Dashboard", href: "/sla" }, { label: "Lyte Command", href: "/" }],
      relevantFor: ["executive", "operations"],
    },
    {
      id: "costs",
      priority: role === "finance" ? 1 : 4,
      icon: DollarSign,
      label: "Cost & Budget",
      color: "#22c55e",
      headline: "Vessels 9% over budget MTD — API cost spike driven by AIS data feeds",
      detail: "Vessels domain at $38.2k vs $35k budget (+9.1%). Cause: increased satellite AIS polling frequency post security incident. Recommend temporary polling reduction after incident resolution.",
      actions: [{ label: "Cost Analytics", href: "/costs" }, { label: "Vessels Budget", href: "/costs" }],
      relevantFor: ["executive", "finance"],
    },
    {
      id: "compliance",
      priority: role === "legal" ? 1 : 5,
      icon: CheckCircle2,
      label: "Governance & Compliance",
      color: "#a855f7",
      headline: "AI Governance Policy pending CISO approval — action required",
      detail: "AI Model Governance Policy v1.0 submitted for CISO review. Legal has approved. 2 approvals remaining before activation. Also: Q1 data retention audit complete, no violations.",
      actions: [{ label: "Review Policy", href: "/governance" }, { label: "Audit Trail", href: "/governance" }],
      relevantFor: ["executive", "security", "legal"],
    },
    {
      id: "ops-win",
      priority: 6,
      icon: Zap,
      label: "Today's Opportunity",
      color: "var(--color-low)",
      headline: "Lyte route optimization v2 rolling out — track adoption metrics",
      detail: "ML-powered scheduling live for 30% of Lyte traffic. Early indicators show 14% on-time improvement in test cohort. Full rollout expected by Apr 18 pending QA.",
      actions: [{ label: "View Changelog", href: "/changelog" }],
      relevantFor: ["executive", "operations"],
    },
  ];

  return base
    .filter((s) => s.relevantFor.includes(role))
    .sort((a, b) => a.priority - b.priority);
}

const ROLE_LABELS: Record<Role, string> = {
  executive: "Executive",
  security: "Security",
  operations: "Operations",
  finance: "Finance",
  legal: "Legal",
};

export default function DigestPage() {
  const { data } = useEcosystemData();
  const [role, setRole] = useState<Role>("executive");
  const [generating, setGenerating] = useState(false);
  const [timestamp] = useState(() => {
    const now = new Date();
    return now.toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  });

  const compositeScore = data?.compositeScore ?? 78;

  const { data: apiData } = useStandardQuery<ApiDigestResponse>({
    queryKey: ["command-digest", role],
    queryFn: async () => {
      const res = await fetch(`/api/command/digest?role=${role}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load digest");
      const json = await res.json();
      return (json?.data ?? json) as ApiDigestResponse;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const sections: DigestSection[] = apiData?.sections
    ? apiData.sections.map((s) => ({
        id: s.id,
        priority: s.priority,
        icon: SECTION_ICONS[s.id] ?? Activity,
        label: s.label,
        color: s.color,
        headline: s.headline,
        detail: s.detail,
        actions: s.actions,
        relevantFor: (s.relevantFor as Role[]),
      }))
    : buildDigest(role, compositeScore);

  const handleRegenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1200);
  };

  return (
    <OpsLayout title="Daily Digest">
      <div className="flex flex-col gap-6 max-w-[900px]">
        {/* Header */}
        <div
          className="rounded-2xl p-6 flex items-start justify-between gap-4"
          style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" style={{ color: "#8b7ac8" }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#8b7ac8" }}>Smart Daily Digest</span>
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-fg-primary)" }}>
              Good morning — here's what matters today
            </h1>
            <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>{timestamp} · Personalized for: {ROLE_LABELS[role]}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Role Switcher */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)" }}>
              <User className="w-3 h-3" style={{ color: "var(--color-fg-muted)" }} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="text-xs bg-transparent"
                style={{ color: "var(--color-fg-secondary)", outline: "none" }}
              >
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: "#8b7ac820", border: "1px solid #8b7ac840", color: "#8b7ac8" }}
            >
              <RefreshCw className={`w-3 h-3 ${generating ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>
        </div>

        {/* Digest Sections */}
        {generating ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-surface-base)" }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className="rounded-xl p-5 flex gap-4 transition-all"
                  style={{
                    backgroundColor: "var(--color-surface-base)",
                    border: "1px solid var(--color-surface-border)",
                    borderLeftWidth: "3px",
                    borderLeftColor: section.color,
                  }}
                >
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `color-mix(in srgb, ${section.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${section.color} 25%, transparent)` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: section.color }} />
                    </div>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ backgroundColor: "var(--color-bg-elevated)", color: "var(--color-fg-muted)" }}
                    >
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: section.color }}>{section.label}</span>
                        <div className="text-sm font-bold mt-0.5" style={{ color: "var(--color-fg-primary)" }}>{section.headline}</div>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--color-fg-muted)" }}>{section.detail}</p>
                    <div className="flex flex-wrap gap-2">
                      {section.actions.map((action) => (
                        <a
                          key={action.label}
                          href={action.href}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${section.color} 10%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${section.color} 25%, transparent)`,
                            color: section.color,
                          }}
                        >
                          {action.label} <ChevronRight className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}
        >
          <Settings className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-fg-muted)" }} />
          <div className="flex-1">
            <div className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
              Digest is personalized based on your role, recent activity, and ecosystem signal priority weights. {sections.length} sections relevant to {ROLE_LABELS[role]} view.
            </div>
          </div>
          <a href="/alerts" className="text-xs font-semibold" style={{ color: "#8b7ac8" }}>Full Alert Inbox →</a>
        </div>
      </div>
    </OpsLayout>
  );
}
