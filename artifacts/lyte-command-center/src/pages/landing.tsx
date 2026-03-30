import { Link } from "wouter";
import { ArrowRight, CheckCircle2, AlertTriangle, TrendingUp, Users, Clock, BarChart3, DollarSign, Zap, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const SIGNALS_PREVIEW = [
  { severity: "critical", type: "Approval Latency", title: "Enterprise deal approvals averaging 14.2 days — 340% above target", var: "$2.1M", func: "Enterprise Sales" },
  { severity: "critical", type: "Forecast Drift", title: "Q1 forecast dropped $3.8M in 10 days — commit at risk", var: "$3.8M", func: "Revenue" },
  { severity: "high", type: "Stalled Workflow", title: "14 implementation projects pending handoff for 8+ days — no assignee", var: "$890K", func: "Customer Success" },
  { severity: "high", type: "Ownership Gap", title: "7 enterprise renewals ($2.3M) have no named owner", var: "$2.3M", func: "Account Management" },
];

const severityColors: Record<string, string> = {
  critical: "text-red-400 border-red-500/20 bg-red-500/5",
  high: "text-orange-400 border-orange-500/20 bg-orange-500/5",
  medium: "text-amber-400 border-amber-500/20 bg-amber-500/5",
};

const FEATURES = [
  {
    icon: Activity,
    color: "text-red-400",
    title: "Business Signal Feed",
    body: "Real-time signals across approval latency, stalled workflows, ownership gaps, forecast drift, handoff failures, and revenue leakage — not CloudWatch alerts.",
  },
  {
    icon: Zap,
    color: "text-cyan-400",
    title: "Narrative Intelligence Rail",
    body: "Raw signals become human-readable operating intelligence. Not a dashboard dump — decision-ready insight with business language and context.",
  },
  {
    icon: Target,
    color: "text-violet-400",
    title: "Action Center",
    body: "A prioritized queue with owner, urgency, estimated value protected, and dependency chains. Triaged for your role — executive, operations, or delivery.",
  },
  {
    icon: Clock,
    color: "text-orange-400",
    title: "Workflow Latency Visualization",
    body: "Stage-by-stage dwell time across every critical workflow. See exactly where approval chains stall, queues congest, and handoffs break.",
  },
  {
    icon: Users,
    color: "text-amber-400",
    title: "Ownership Map",
    body: "Every area of your business mapped by owner status: clear, ambiguous, or missing. No more high-value items drifting without accountability.",
  },
  {
    icon: DollarSign,
    color: "text-emerald-400",
    title: "Value at Risk Panel",
    body: "Business value exposed across every signal, workflow, team, and stage — with trend over time. Know your exposure before it becomes loss.",
  },
];

const USE_CASES = [
  { label: "Approval Latency", icon: Clock, desc: "Detect when deals stall in legal, finance, or executive sign-off queues — before close dates slip." },
  { label: "Stalled Workflows", icon: AlertTriangle, desc: "Surface implementation projects, SOWs, and onboarding queues with no movement and no owner." },
  { label: "Forecast Drift", desc: "Track when committed pipeline reclassifies — before your board call reveals a miss.", icon: TrendingUp },
  { label: "Handoff Failures", icon: Users, desc: "Catch the moment sales-to-CS, CS-to-delivery, or SE handoffs break — before SLAs are breached." },
  { label: "Pipeline Hygiene", icon: BarChart3, desc: "Identify ghost opportunities that inflate reported pipeline and corrupt forecast models." },
];

const ROLES = [
  {
    role: "Executive",
    headline: "Board-grade operating intelligence",
    description: "Value at risk by function. Forecast drift trends. Top 3 actions required. Coverage ratios. Signal summaries in plain language — no dashboards to decode.",
    color: "border-cyan-500/30 bg-cyan-500/5",
    labelColor: "text-cyan-400",
  },
  {
    role: "Operations",
    headline: "Operational execution at a glance",
    description: "Every stalled workflow. Every unassigned item. Every approval bottleneck. Prioritized action queue by urgency, owner, and value. Signal filters by function.",
    color: "border-violet-500/30 bg-violet-500/5",
    labelColor: "text-violet-400",
  },
  {
    role: "Delivery & Sales",
    headline: "Pipeline and delivery in one view",
    description: "Deal stage health. SE queue depth. Implementation handoff status. SOW signing age. Renewal calendar. All surfaced through the lens of what's moving and what's stuck.",
    color: "border-amber-500/30 bg-amber-500/5",
    labelColor: "text-amber-400",
  },
];

export default function LandingPage() {
  return (
    <div className="max-w-[1100px] space-y-20 pb-20">
      <section className="pt-6 pb-8 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[100px]" />
          <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
        </div>

        <div className="relative text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[11px] text-cyan-400 font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Business Observability Command Center
          </div>

          <h1 className="font-display font-bold text-[52px] leading-[1.05] tracking-tight text-white mb-6">
            See what's{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">stalling your business</span>
            <br />before it costs you
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto">
            Lyte surfaces approval bottlenecks, stalled workflows, ownership gaps, forecast drift, and revenue leakage — giving you operating intelligence you can act on today.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 text-slate-900 font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
                Open Command Center <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/use-cases">
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors">
                See Use Cases
              </button>
            </Link>
          </div>
        </div>

        <div className="mt-12 space-y-2">
          <div className="text-[11px] text-slate-600 text-center mb-3 uppercase tracking-wide">Live signal preview</div>
          {SIGNALS_PREVIEW.map((s, i) => (
            <div key={i} className={cn("flex items-start gap-3 p-3.5 rounded-xl border text-[12px]", severityColors[s.severity])}>
              <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", s.severity === "critical" ? "bg-red-500 animate-pulse" : "bg-orange-500")} />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-white/90">{s.title}</span>
                <span className="text-slate-500 ml-2 text-[10px]">· {s.func}</span>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold text-slate-300">{s.var}</span>
                <span className="text-[9px] text-slate-600 uppercase">{s.type}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl text-white mb-3">Signals → Insights → Actions</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">Not another alerting tool. A command surface that translates operational reality into what you need to do next.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { step: "01", label: "Signals", color: "border-red-500/20 bg-red-500/5", accent: "text-red-400", desc: "Lyte detects anomalies across approval chains, workflow queues, ownership records, forecast data, and pipeline health. Every signal carries severity, affected function, owner, and value at risk." },
            { step: "02", label: "Insights", color: "border-violet-500/20 bg-violet-500/5", accent: "text-violet-400", desc: "Correlated signals become Narrative Intelligence — human-readable paragraphs explaining what's happening, why it matters, and the business consequence. No decoding required." },
            { step: "03", label: "Actions", color: "border-cyan-500/20 bg-cyan-500/5", accent: "text-cyan-400", desc: "Each insight surfaces a prioritized action with owner, urgency, estimated value protected, and dependency chain. Your next move is always clear." },
          ].map(card => (
            <div key={card.step} className={cn("rounded-xl p-5 border", card.color)}>
              <div className={cn("font-mono text-[10px] mb-3 uppercase tracking-widest", card.accent)}>{card.step} / {card.label}</div>
              <p className="text-sm text-slate-300 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl text-white mb-3">What Lyte surfaces</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">Six signal types, five use case experiences, three role views — built around how business operations actually break.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl p-5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-white/5")}>
                  <Icon className={cn("w-4 h-4", f.color)} />
                </div>
                <h3 className="font-display font-semibold text-sm text-white mb-2">{f.title}</h3>
                <p className="text-[12px] text-slate-400 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl text-white mb-3">Five use case experiences</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">Each scenario has its own signal feed, narrative, workflow visualization, and action queue.</p>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {USE_CASES.map(u => {
            const Icon = u.icon;
            return (
              <Link key={u.label} href="/use-cases">
                <div className="rounded-xl p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer h-full">
                  <Icon className="w-5 h-5 text-cyan-400 mb-3" />
                  <h3 className="font-display font-semibold text-[13px] text-white mb-1.5">{u.label}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{u.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl text-white mb-3">Built for three distinct roles</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">One platform. Three views. KPIs, insights, and actions that change based on who's looking.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {ROLES.map(r => (
            <div key={r.role} className={cn("rounded-xl p-5 border", r.color)}>
              <div className={cn("text-[10px] font-mono uppercase tracking-widest mb-3", r.labelColor)}>{r.role}</div>
              <h3 className="font-display font-semibold text-base text-white mb-2">{r.headline}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center">
        <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-4">The moat</div>
        <h2 className="font-display font-bold text-3xl text-white mb-4">Explainability is the product</h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-6 leading-relaxed">
          Lyte doesn't just show you what's wrong. It shows you what's wrong, why it matters, what's at stake, who owns it, and what to do. Every signal carries context. Every insight tells a story. Every action has a clear owner and value case.
        </p>
        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { label: "Signal", desc: "What happened" },
            { label: "Context", desc: "Why it matters" },
            { label: "Stake", desc: "Value at risk" },
            { label: "Action", desc: "What to do next" },
          ].map(item => (
            <div key={item.label} className="rounded-lg p-3 border border-white/5 bg-white/[0.02]">
              <div className="font-display font-semibold text-sm text-cyan-400 mb-1">{item.label}</div>
              <div className="text-[11px] text-slate-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-10 text-center">
        <h2 className="font-display font-bold text-3xl text-white mb-3">See Lyte in action</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-6 text-sm">
          Explore the full demo with real business signals, narrative intelligence, and a complete use case walkthrough.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 text-slate-900 font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
              Open Demo <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/use-cases">
            <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors">
              Browse Use Cases
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
