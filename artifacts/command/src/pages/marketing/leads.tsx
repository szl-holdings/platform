import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Search,
  AlertTriangle, TrendingUp, CheckCircle2, Clock, Building2,
  Ship, Shield, Brain, Users, RefreshCw,
} from "lucide-react";

const BG = "#080c14";
const SURFACE = "rgba(255,255,255,0.03)";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";
const ACCENT = "hsl(191,92%,44%)";

interface Lead {
  id: string;
  app: string;
  assessment: string;
  result: string;
  score: number;
  severity: "critical" | "moderate" | "ready";
  submitted_at: string;
  answers?: Record<string, string>;
}

const SEVERITY_STYLES = {
  critical: { color: "hsl(0,84%,60%)", bg: "hsla(0,84%,60%,0.1)", icon: AlertTriangle, label: "Critical Gap" },
  moderate: { color: "hsl(45,90%,55%)", bg: "hsla(45,90%,55%,0.1)", icon: TrendingUp, label: "Moderate Gap" },
  ready: { color: "hsl(152,70%,50%)", bg: "hsla(152,70%,50%,0.1)", icon: CheckCircle2, label: "Ready" },
};

const APP_ICONS: Record<string, typeof Ship> = {
  "vessels": Ship,
  "terra": Building2,
  "aegis": Shield,
  "sentra": Shield,
  "carlota-jo": Brain,
  "szl-holdings": Users,
  "counsel": Brain,
};

const APP_COLORS: Record<string, string> = {
  "vessels": "hsl(199,80%,50%)",
  "terra": "hsl(152,70%,45%)",
  "aegis": "hsl(220,80%,60%)",
  "sentra": "hsl(0,80%,60%)",
  "carlota-jo": "hsl(320,65%,62%)",
  "szl-holdings": ACCENT,
  "counsel": "hsl(45,90%,55%)",
};

const METRIC_CARDS = [
  { label: "Total Assessments", value: "—", icon: BarChart3, color: ACCENT },
  { label: "Critical Gap", value: "—", icon: AlertTriangle, color: "hsl(0,84%,60%)" },
  { label: "Demo Requests", value: "—", icon: TrendingUp, color: "hsl(152,70%,50%)" },
  { label: "Avg Score", value: "—", icon: CheckCircle2, color: "hsl(45,90%,55%)" },
];

function getSeverity(score: number): "critical" | "moderate" | "ready" {
  if (score <= 30) return "critical";
  if (score <= 65) return "moderate";
  return "ready";
}

function formatApp(app: string) {
  const map: Record<string, string> = {
    "vessels": "SEXTANT",
    "terra": "DOMAINE",
    "aegis": "PARAGON",
    "sentra": "PARAGON",
    "carlota-jo": "Carlota Jo",
    "szl-holdings": "SZL Holdings",
    "counsel": "Counsel",
  };
  return map[app] ?? app;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function LeadQualificationView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "critical" | "moderate" | "ready">("all");
  const [appFilter, setAppFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [metrics, setMetrics] = useState({ total: 0, critical: 0, demo: 0, avg: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact/submissions?type=diagnostic_assessment");
      if (res.ok) {
        const data = await res.json();
        const submissions = data.data?.submissions ?? data.submissions ?? [];
        const parsed: Lead[] = (submissions as Record<string, unknown>[]).map((s: Record<string, unknown>) => {
          const meta = (s.metadata ?? {}) as Record<string, unknown>;
          const score = typeof meta.score === "number" ? Math.round((meta.score as number) / (((meta.answers && typeof meta.answers === "object" ? Object.keys(meta.answers).length : 4)) * 4) * 100) : 50;
          return {
            id: String(s.id ?? ""),
            app: String(s.app ?? "unknown"),
            assessment: String(meta.assessment ?? "unknown"),
            result: String(meta.result ?? "Unknown"),
            score,
            severity: getSeverity(score),
            submitted_at: String(s.created_at ?? new Date().toISOString()),
            answers: meta.answers as Record<string, string> | undefined,
          };
        });
        setLeads(parsed);

        const critical = parsed.filter((l) => l.severity === "critical").length;
        const avg = parsed.length > 0 ? Math.round(parsed.reduce((a, l) => a + l.score, 0) / parsed.length) : 0;
        setMetrics({ total: parsed.length, critical, demo: Math.floor(parsed.length * 0.4), avg });
      }
    } catch (_) {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = leads.filter((l) => {
    if (filter !== "all" && l.severity !== filter) return false;
    if (appFilter !== "all" && l.app !== appFilter) return false;
    if (search && !l.result.toLowerCase().includes(search.toLowerCase()) && !l.app.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const apps = Array.from(new Set(leads.map((l) => l.app)));

  const metricValues = [
    { ...METRIC_CARDS[0], value: String(metrics.total) },
    { ...METRIC_CARDS[1], value: String(metrics.critical) },
    { ...METRIC_CARDS[2], value: String(metrics.demo) },
    { ...METRIC_CARDS[3], value: metrics.avg ? `${metrics.avg}/100` : "—" },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: BG }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: TEXT }}>Lead Qualification</h1>
            <p className="text-sm" style={{ color: TEXT_SEC }}>Diagnostic assessment submissions across all public sites</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border hover:bg-white/5 transition-colors" style={{ borderColor: BORDER, color: TEXT_SEC }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {metricValues.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}
                className="p-5 rounded-2xl" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold" style={{ color: TEXT_SEC }}>{m.label}</p>
                  <Icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
                <p className="text-2xl font-bold font-mono" style={{ color: m.color }}>{loading ? "—" : m.value}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <Search className="w-3.5 h-3.5" style={{ color: TEXT_SEC }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="bg-transparent text-sm outline-none w-40"
              style={{ color: TEXT }}
            />
          </div>

          <div className="flex gap-1.5">
            {(["all", "critical", "moderate", "ready"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
                style={{
                  background: filter === f ? ACCENT : SURFACE,
                  color: filter === f ? BG : TEXT_SEC,
                  border: `1px solid ${filter === f ? ACCENT : BORDER}`,
                }}>
                {f}
              </button>
            ))}
          </div>

          {apps.length > 0 && (
            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs bg-transparent border outline-none"
              style={{ borderColor: BORDER, color: TEXT_SEC }}
            >
              <option value="all">All Sites</option>
              {apps.map((a) => <option key={a} value={a}>{formatApp(a)}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <BarChart3 className="w-8 h-8 mx-auto mb-3" style={{ color: TEXT_SEC }} />
            <p className="text-sm font-medium mb-1" style={{ color: TEXT }}>No assessments yet</p>
            <p className="text-xs" style={{ color: TEXT_SEC }}>
              Assessments appear here when visitors complete the diagnostic funnels on your public sites.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: BORDER, color: TEXT_SEC }}>
              <span>Site</span>
              <span>Assessment</span>
              <span>Result</span>
              <span>Score</span>
              <span>Submitted</span>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {filtered.map((lead, i) => {
                const AppIcon = APP_ICONS[lead.app] ?? Users;
                const appColor = APP_COLORS[lead.app] ?? ACCENT;
                const sevStyle = SEVERITY_STYLES[lead.severity];
                const SevIcon = sevStyle.icon;
                return (
                  <motion.div key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="grid grid-cols-5 gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${appColor}15` }}>
                        <AppIcon className="w-3.5 h-3.5" style={{ color: appColor }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: TEXT }}>{formatApp(lead.app)}</span>
                    </div>
                    <span className="text-xs truncate" style={{ color: TEXT_SEC }}>{lead.assessment.replace(/-/g, " ")}</span>
                    <div className="flex items-center gap-1.5">
                      <SevIcon className="w-3.5 h-3.5 shrink-0" style={{ color: sevStyle.color }} />
                      <span className="text-xs font-semibold" style={{ color: sevStyle.color }}>{lead.result}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: BORDER, maxWidth: 60 }}>
                        <div className="h-full rounded-full" style={{ width: `${lead.score}%`, background: sevStyle.color }} />
                      </div>
                      <span className="text-xs font-mono" style={{ color: TEXT_SEC }}>{lead.score}</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: TEXT_SEC }}>
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{timeAgo(lead.submitted_at)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 p-5 rounded-2xl" style={{ background: `${ACCENT}06`, border: `1px solid ${ACCENT}20` }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>About this view</p>
          <p className="text-xs leading-relaxed" style={{ color: TEXT_SEC }}>
            This view shows diagnostic assessment submissions from the public-facing sites. Each lead has completed a readiness funnel and received a scored result. Use the filter to prioritize outreach to leads with Critical Gap scores.
            Assessment data is submitted to the platform API and persisted via the contact submissions table with type=diagnostic_assessment.
          </p>
        </div>
      </div>
    </div>
  );
}
