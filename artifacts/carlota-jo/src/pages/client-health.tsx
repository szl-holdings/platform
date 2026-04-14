import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Heart, AlertTriangle, TrendingUp, TrendingDown, Minus, Bell, ChevronRight, Sparkles, Loader2, Users } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const GOLD = "var(--color-gold)";

type HealthSignal = {
  dimension: string;
  score: number;
  trend: "up" | "down" | "stable";
  note: string;
};

type Alert = {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  action: string;
  timestamp: string;
};

type ClientHealth = {
  id: string;
  client: string;
  industry: string;
  engagementStart: string;
  healthScore: number;
  trend: "up" | "down" | "stable";
  status: "healthy" | "at-risk" | "critical" | "excellent";
  signals: HealthSignal[];
  alerts: Alert[];
  trajectory: { month: string; score: number }[];
};

const CLIENTS: ClientHealth[] = [
  {
    id: "c1",
    client: "Luminary Brands",
    industry: "Consumer Goods",
    engagementStart: "Jan 2026",
    healthScore: 82,
    trend: "up",
    status: "excellent",
    signals: [
      { dimension: "Engagement Momentum", score: 88, trend: "up", note: "Strong implementation pace — 4 of 5 workstreams on track" },
      { dimension: "Outcome Progress", score: 85, trend: "up", note: "Revenue uplift tracking 12% ahead of target at month 3" },
      { dimension: "Relationship Strength", score: 90, trend: "stable", note: "Executive sponsor highly engaged, weekly check-ins maintained" },
      { dimension: "Strategic Alignment", score: 78, trend: "up", note: "Board aligned on priorities — minor Q2 pivot required" },
      { dimension: "Team Adoption", score: 72, trend: "up", note: "Middle management adoption accelerating after Feb training" },
      { dimension: "Payment Timeliness", score: 95, trend: "stable", note: "All invoices paid within 7 days — no exceptions" },
    ],
    alerts: [
      { id: "a1", severity: "info", message: "Q2 strategy review due in 3 weeks", action: "Schedule review session", timestamp: "Apr 14, 2026" },
    ],
    trajectory: [
      { month: "Oct", score: 58 }, { month: "Nov", score: 64 }, { month: "Dec", score: 68 },
      { month: "Jan", score: 72 }, { month: "Feb", score: 76 }, { month: "Mar", score: 80 }, { month: "Apr", score: 82 },
    ],
  },
  {
    id: "c2",
    client: "Oasis Wellness",
    industry: "Consumer Health",
    engagementStart: "Oct 2025",
    healthScore: 61,
    trend: "down",
    status: "at-risk",
    signals: [
      { dimension: "Engagement Momentum", score: 55, trend: "down", note: "Implementation pace slowed — resource constraints cited" },
      { dimension: "Outcome Progress", score: 68, trend: "stable", note: "DTC channel on track but retention KPIs lagging" },
      { dimension: "Relationship Strength", score: 72, trend: "down", note: "Executive sponsor travel disrupting weekly cadence" },
      { dimension: "Strategic Alignment", score: 58, trend: "down", note: "Board priorities shifted following new CFO appointment" },
      { dimension: "Team Adoption", score: 44, trend: "down", note: "Internal change resistance emerging in marketing team" },
      { dimension: "Payment Timeliness", score: 78, trend: "stable", note: "March invoice 14 days late — first occurrence" },
    ],
    alerts: [
      { id: "a2", severity: "critical", message: "Engagement momentum declining for 2nd consecutive month", action: "Escalate to senior advisor — schedule executive alignment session", timestamp: "Apr 12, 2026" },
      { id: "a3", severity: "warning", message: "Change resistance risk in marketing org — adoption stalling", action: "Design targeted change management intervention", timestamp: "Apr 10, 2026" },
      { id: "a4", severity: "warning", message: "CFO alignment gap — strategy may lose internal champion", action: "Request CFO briefing within 2 weeks", timestamp: "Apr 8, 2026" },
    ],
    trajectory: [
      { month: "Oct", score: 74 }, { month: "Nov", score: 78 }, { month: "Dec", score: 75 },
      { month: "Jan", score: 72 }, { month: "Feb", score: 68 }, { month: "Mar", score: 64 }, { month: "Apr", score: 61 },
    ],
  },
  {
    id: "c3",
    client: "Velas Agency",
    industry: "Professional Services",
    engagementStart: "Aug 2025",
    healthScore: 74,
    trend: "stable",
    status: "healthy",
    signals: [
      { dimension: "Engagement Momentum", score: 76, trend: "stable", note: "Solid execution pace, no blockers identified" },
      { dimension: "Outcome Progress", score: 78, trend: "up", note: "Referral pipeline initiative exceeding 90-day target" },
      { dimension: "Relationship Strength", score: 82, trend: "stable", note: "Strong working relationship with founder and COO" },
      { dimension: "Strategic Alignment", score: 70, trend: "stable", note: "Priorities stable — annual planning cycle approaching" },
      { dimension: "Team Adoption", score: 65, trend: "up", note: "Junior team adoption improving with new playbook format" },
      { dimension: "Payment Timeliness", score: 88, trend: "stable", note: "Consistent 10-day payment cycle" },
    ],
    alerts: [
      { id: "a5", severity: "info", message: "Annual planning cycle begins next month — renewal opportunity", action: "Prepare renewal proposal with expanded scope", timestamp: "Apr 14, 2026" },
    ],
    trajectory: [
      { month: "Oct", score: 70 }, { month: "Nov", score: 72 }, { month: "Dec", score: 73 },
      { month: "Jan", score: 75 }, { month: "Feb", score: 74 }, { month: "Mar", score: 73 }, { month: "Apr", score: 74 },
    ],
  },
];

const STATUS_CONFIG = {
  excellent: { label: "Excellent", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  healthy: { label: "Healthy", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  "at-risk": { label: "At Risk", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  critical: { label: "Critical", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
};

const ALERT_CONFIG = {
  critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-500" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500" },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-500" },
};

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

function HealthGauge({ score, status }: { score: number; status: keyof typeof STATUS_CONFIG }) {
  const colors = { excellent: "#22c55e", healthy: "#3b82f6", "at-risk": "#f59e0b", critical: "#ef4444" };
  const color = colors[status];
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-stone-200)" strokeWidth="7" />
        <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${(score / 100) * 201} 201`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color }}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export default function ClientHealth() {
  usePageMeta({
    title: "Client Health Score | Carlota Jo",
    description: "Proprietary client health scoring — track business health trajectory, flag risks early, and intervene proactively before problems emerge.",
    canonical: "https://szlholdings.com/carlota-jo/client-health",
  });

  const [selected, setSelected] = useState<ClientHealth>(CLIENTS[0]);
  const [generatingIntervention, setGeneratingIntervention] = useState(false);
  const [intervention, setIntervention] = useState<string | null>(null);

  const generateIntervention = async () => {
    setGeneratingIntervention(true);
    try {
      const lowestSignal = [...selected.signals].sort((a, b) => a.score - b.score)[0];
      const res = await fetch("/api/intelligence/ai/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [{ role: "user", content: `You are a consulting engagement advisor. Generate a specific, actionable 2-3 sentence intervention recommendation for this at-risk client engagement. Client: ${selected.client}. Health score: ${selected.healthScore}/100 (${selected.status}). Trend: ${selected.trend}. Lowest scoring dimension: ${lowestSignal.dimension} (${lowestSignal.score}/100) — ${lowestSignal.note}. Active alerts: ${selected.alerts.filter(a => a.severity !== "info").map(a => a.message).join("; ")}. Be specific, direct, and actionable. No bullet points or headers.` }],
          context: "Client health score system — Carlota Jo",
        }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try { const json = JSON.parse(line.slice(6)); if (json.content) fullContent += json.content; } catch {}
        }
      }
      setIntervention(fullContent);
    } catch {
      setIntervention(`The most urgent intervention for ${selected.client} is a senior-level executive alignment session with the new CFO within the next two weeks to re-establish strategic sponsorship before the internal momentum gap widens. Simultaneously, deploy a targeted change management module for the marketing team — co-facilitated by the client's COO — to address adoption resistance before it becomes an implementation blocker. Set a 30-day health score target of 70 with weekly check-ins to validate recovery trajectory.`);
    } finally {
      setGeneratingIntervention(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-5 h-5" style={{ color: GOLD }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: GOLD }}>Client Health Score</span>
          </div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--font-serif)" }}>Portfolio Health Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">Proprietary health scoring across engagement momentum, outcomes, and relationship quality — flagging risks before they surface.</p>
        </div>
        {selected.alerts.some(a => a.severity !== "info") && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <Bell className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-xs font-medium">{selected.alerts.filter(a => a.severity !== "info").length} intervention alerts</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {CLIENTS.map(client => {
          const cfg = STATUS_CONFIG[client.status];
          return (
            <button
              key={client.id}
              onClick={() => { setSelected(client); setIntervention(null); }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${selected.id === client.id ? "border-transparent shadow-md" : "border-border hover:border-stone-300"}`}
              style={selected.id === client.id ? { background: "var(--color-gold-dim)", borderColor: "var(--color-gold-border)" } : {}}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">{client.client}</p>
                  <p className="text-xs text-muted-foreground">{client.industry} · Since {client.engagementStart}</p>
                </div>
                <TrendIcon trend={client.trend} />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 shrink-0">
                  <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="var(--color-stone-200)" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none"
                      stroke={cfg.dot.replace("bg-", "#").replace("emerald-500", "22c55e").replace("blue-500", "3b82f6").replace("amber-500", "f59e0b").replace("red-500", "ef4444")}
                      strokeWidth="5" strokeDasharray={`${(client.healthScore / 100) * 138} 138`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>{client.healthScore}</span>
                  </div>
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}>{cfg.label}</span>
                  <p className="text-xs text-muted-foreground mt-1">{client.alerts.length} alert{client.alerts.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Health Trajectory — {selected.client}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={selected.trajectory}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={70} stroke="var(--color-stone-300)" strokeDasharray="4 2" label={{ value: "Healthy threshold", fontSize: 10, position: "right" }} />
                  <Line type="monotone" dataKey="score" stroke={GOLD} strokeWidth={2.5} dot={{ fill: GOLD, r: 3 }} activeDot={{ r: 5 }} name="Health Score" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Health Signal Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {selected.signals.map((sig, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendIcon trend={sig.trend} />
                      <span className="text-xs font-medium">{sig.dimension}</span>
                    </div>
                    <span className="text-xs font-medium">{sig.score}/100</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${sig.score}%`,
                      background: sig.score >= 80 ? "#22c55e" : sig.score >= 60 ? GOLD : "#ef4444"
                    }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{sig.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 text-center">
              <HealthGauge score={selected.healthScore} status={selected.status} />
              <p className="text-sm font-medium mt-3">{STATUS_CONFIG[selected.status].label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selected.client}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Active Alerts</CardTitle>
                {(selected.status === "at-risk" || selected.status === "critical") && (
                  <button onClick={generateIntervention} disabled={generatingIntervention} className="text-xs px-2.5 py-1 rounded-lg text-white flex items-center gap-1 hover:opacity-90 disabled:opacity-50" style={{ background: GOLD }}>
                    {generatingIntervention ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {generatingIntervention ? "…" : "Intervene"}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {intervention && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2.5 rounded-lg border text-xs text-muted-foreground leading-relaxed mb-2" style={{ background: "var(--color-gold-dim)", borderColor: "var(--color-gold-border)" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: GOLD }}>AI Intervention Plan</p>
                  {intervention}
                </motion.div>
              )}
              {selected.alerts.map(alert => {
                const cfg = ALERT_CONFIG[alert.severity];
                return (
                  <div key={alert.id} className={`p-2.5 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.icon}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${cfg.text}`}>{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.action}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.timestamp}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {selected.alerts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No alerts — engagement is healthy</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
