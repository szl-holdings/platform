import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Clock, AlertTriangle, TrendingUp, Users, BarChart3, DollarSign, Zap, Target, Activity, Eye } from "lucide-react";
import { cn } from "@lyte/lib/utils";
import { ContactModal } from "@szl-holdings/shared-ui/contact-modal";

const HOW_LYTE_WORKS = [
  {
    step: "01",
    label: "Ingest",
    color: "border-[#c45a4a]/20 bg-[#c45a4a]/5",
    accent: "text-[#c45a4a]",
    desc: "Lyte connects to your operational data sources — CRM, ERP, project management, finance systems — and continuously monitors for signal anomalies across approval chains, workflow queues, and ownership records.",
  },
  {
    step: "02",
    label: "Detect",
    color: "border-[#c8953c]/20 bg-[#c8953c]/5",
    accent: "text-[#c8953c]",
    desc: "The signal engine surfaces anomalies with severity scoring, affected function, owner attribution, and value-at-risk estimation. Every signal carries context — not just a data point.",
  },
  {
    step: "03",
    label: "Narrate",
    color: "border-violet-500/20 bg-violet-500/5",
    accent: "text-violet-400",
    desc: "Correlated signals become Narrative Intelligence — human-readable paragraphs explaining what is happening, why it matters, and the business consequence. No decoding required.",
  },
  {
    step: "04",
    label: "Action",
    color: "border-cyan-500/20 bg-cyan-500/5",
    accent: "text-cyan-400",
    desc: "Each insight surfaces a prioritized action with owner, urgency, estimated value protected, and dependency chain. Your next move is always clear.",
  },
  {
    step: "05",
    label: "Approve",
    color: "border-[#6b8f71]/20 bg-[#6b8f71]/5",
    accent: "text-[#6b8f71]",
    desc: "High-stakes actions route through human approval gates. Lyte keeps humans in the loop on consequential decisions while automating the routine.",
  },
];

const ROLE_CARDS = [
  {
    role: "Executive",
    headline: "Board-grade operating intelligence",
    description: "Value at risk by function. Forecast drift trends. Top actions required. Coverage ratios. Signal summaries in plain language — no dashboards to decode.",
    color: "border-cyan-500/30 bg-cyan-500/5",
    labelColor: "text-cyan-400",
  },
  {
    role: "Operations",
    headline: "Execution at a glance",
    description: "Every stalled workflow. Every unassigned item. Every approval bottleneck. Prioritized action queue by urgency, owner, and value. Signal filters by function.",
    color: "border-violet-500/30 bg-violet-500/5",
    labelColor: "text-violet-400",
  },
  {
    role: "Delivery & Sales",
    headline: "Pipeline and delivery in one view",
    description: "Deal stage health. Implementation handoff status. SOW signing age. Renewal calendar. All surfaced through the lens of what's moving and what's stuck.",
    color: "border-[#d4a054]/30 bg-[#d4a054]/5",
    labelColor: "text-[#d4a054]",
  },
];

const USE_CASES = [
  { label: "Approval Latency", icon: Clock, desc: "Detect when deals stall in legal, finance, or executive sign-off queues — before close dates slip." },
  { label: "Stalled Workflows", icon: AlertTriangle, desc: "Surface implementation projects, SOWs, and onboarding queues with no movement and no owner." },
  { label: "Forecast Drift", icon: TrendingUp, desc: "Track when committed pipeline reclassifies — before your board call reveals a miss." },
  { label: "Handoff Failures", icon: Users, desc: "Catch the moment sales-to-CS, CS-to-delivery, or SE handoffs break — before SLAs are breached." },
  { label: "Pipeline Hygiene", icon: BarChart3, desc: "Identify ghost opportunities that inflate reported pipeline and corrupt forecast models." },
  { label: "Revenue Leakage", icon: DollarSign, desc: "Surface exposed revenue across approval delays, ownership gaps, and unmanaged exceptions." },
];

const SIGNALS_PREVIEW = [
  { severity: "critical", type: "Approval Latency", title: "Enterprise deal approvals averaging 14.2 days — 340% above target", var: "$2.1M", func: "Enterprise Sales" },
  { severity: "critical", type: "Forecast Drift", title: "Q1 forecast dropped $3.8M in 10 days — commit at risk", var: "$3.8M", func: "Revenue" },
  { severity: "high", type: "Stalled Workflow", title: "14 implementation projects pending handoff for 8+ days — no assignee", var: "$890K", func: "Customer Success" },
  { severity: "high", type: "Ownership Gap", title: "7 enterprise renewals ($2.3M) have no named owner", var: "$2.3M", func: "Account Management" },
];

const severityColors: Record<string, string> = {
  critical: "text-[#c45a4a] border-[#c45a4a]/20 bg-[#c45a4a]/5",
  high: "text-[#c8953c] border-[#c8953c]/20 bg-[#c8953c]/5",
  medium: "text-[#d4a054] border-[#d4a054]/20 bg-[#d4a054]/5",
};

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
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
            Business Observability · Powered by Alloy
          </div>

          <h1 className="font-display font-bold text-[52px] leading-[1.05] tracking-tight text-white mb-6">
            See{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              risk, latency, ownership gaps,
            </span>
            <br />
            and workflow friction before they hit execution.
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto">
            Lyte converts operational signals into prioritized, explainable decisions. Not another alerting tool — a command surface built for the real work.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 text-slate-900 font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
                View Command Mode <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/use-cases">
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors">
                View Use Cases
              </button>
            </Link>
          </div>
        </div>

        <div className="mt-12 space-y-2">
          <div className="text-[11px] text-slate-600 text-center mb-3 uppercase tracking-wide">Live signal preview</div>
          {SIGNALS_PREVIEW.map((s, i) => (
            <div key={i} className={cn("flex items-start gap-3 p-3.5 rounded-xl border text-[12px]", severityColors[s.severity])}>
              <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", s.severity === "critical" ? "bg-[#c45a4a] animate-pulse" : "bg-[#c8953c]")} />
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
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">What Lyte Does</p>
          <h2 className="font-display font-bold text-3xl text-white mb-3">One surface. Complete operational picture.</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">Lyte surfaces the signals that matter, translates them into intelligence, and routes the right actions to the right people — before problems reach execution.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { step: "01", label: "Signals", color: "border-[#c45a4a]/20 bg-[#c45a4a]/5", accent: "text-[#c45a4a]", icon: Activity, desc: "Lyte detects anomalies across approval chains, workflow queues, ownership records, forecast data, and pipeline health. Every signal carries severity, affected function, owner, and value at risk." },
            { step: "02", label: "Intelligence", color: "border-violet-500/20 bg-violet-500/5", accent: "text-violet-400", icon: Eye, desc: "Correlated signals become Narrative Intelligence — human-readable paragraphs explaining what's happening, why it matters, and the business consequence. No decoding required." },
            { step: "03", label: "Actions", color: "border-cyan-500/20 bg-cyan-500/5", accent: "text-cyan-400", icon: Zap, desc: "Each insight surfaces a prioritized action with owner, urgency, estimated value protected, and dependency chain. Your next move is always clear." },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.step} className={cn("rounded-xl p-5 border", card.color)}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={cn("w-4 h-4", card.accent)} />
                  <div className={cn("font-mono text-[10px] uppercase tracking-widest", card.accent)}>{card.step} / {card.label}</div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="text-center mb-10">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">How Lyte Works</p>
          <h2 className="font-display font-bold text-3xl text-white mb-3">Five-step sequence from signal to action.</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">Every step has a clear function. Nothing is black-box. Every output is explainable.</p>
        </div>

        <div className="space-y-3">
          {HOW_LYTE_WORKS.map((step) => (
            <div key={step.step} className={cn("rounded-xl p-5 border flex items-start gap-5", step.color)}>
              <div className={cn("font-mono text-[10px] uppercase tracking-widest shrink-0 pt-0.5 w-16", step.accent)}>{step.step} / {step.label}</div>
              <p className="text-sm text-slate-300 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="text-center mb-10">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Role-Based Command</p>
          <h2 className="font-display font-bold text-3xl text-white mb-3">One platform. Three command surfaces.</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">KPIs, insights, and actions that change based on who's looking — executive, operations, or delivery.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {ROLE_CARDS.map(r => (
            <div key={r.role} className={cn("rounded-xl p-5 border", r.color)}>
              <div className={cn("text-[10px] font-mono uppercase tracking-widest mb-3", r.labelColor)}>{r.role}</div>
              <h3 className="font-display font-semibold text-base text-white mb-2">{r.headline}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="text-center mb-10">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Use Cases</p>
          <h2 className="font-display font-bold text-3xl text-white mb-3">Six signal categories that matter.</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">Each signal type has its own feed, narrative, workflow visualization, and action queue.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {USE_CASES.map(u => {
            const Icon = u.icon;
            return (
              <Link key={u.label} href="/use-cases">
                <div className="rounded-xl p-5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer h-full">
                  <Icon className="w-5 h-5 text-cyan-400 mb-3" />
                  <h3 className="font-display font-semibold text-[13px] text-white mb-1.5">{u.label}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{u.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center">
        <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-4">Why It Matters</div>
        <h2 className="font-display font-bold text-3xl text-white mb-4">Explainability is the product.</h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Lyte shows you what's wrong, why it matters, what's at stake, who owns it, and what to do. Every signal carries context. Every action has a clear owner and value case.
        </p>
        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
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
        <p className="text-[11px] text-slate-600 uppercase tracking-widest">Powered by Alloy · SZL Holdings</p>
      </section>

      <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-10">
        <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-2">Documented Outcomes</div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Results from production deployments</h2>
        <p className="text-slate-400 text-sm max-w-xl mb-8 leading-relaxed">
          Not projections. Specific operational outcomes from Lyte running in live environments.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { metric: "4 min", label: "Detection-to-action time", detail: "Approval queue stall identified and routed to owner in under 4 minutes", accent: "#4a90b8" },
            { metric: "$340K", label: "Revenue recovered / quarter", detail: "Critical approval stall surfaced 8 days before the weekly review would have", accent: "#0891b2" },
            { metric: "8 days", label: "Lead over manual review", detail: "Lyte's continuous monitoring eliminated the 7-day blind spot in weekly ops reviews", accent: "#0e7490" },
            { metric: "14", label: "Approval workflows monitored", detail: "Continuous — across procurement, legal, and finance; ownership gaps auto-detected", accent: "#155e75" },
            { metric: "100%", label: "Legal SLA compliance", detail: "All 5-day legal review windows maintained; escalation routing prevented breaches", accent: "#164e63" },
            { metric: "3", label: "Ownership gaps found in 48h", detail: "Role changes had left approvals with no acknowledged owner — caught immediately", accent: "#0c4a6e" },
          ].map((item, i) => (
            <div key={item.label} className="rounded-xl p-4 border border-white/5 bg-white/[0.02]">
              <div className="text-xl font-bold mb-1" style={{ color: item.accent }}>{item.metric}</div>
              <div className="text-[13px] font-semibold text-white/80 mb-1">{item.label}</div>
              <div className="text-[11px] text-slate-500 leading-relaxed">{item.detail}</div>
            </div>
          ))}
        </div>
        <a href="/szl-holdings/case-studies" className="text-[11px] text-cyan-500/50 hover:text-cyan-400/70 transition-colors inline-flex items-center gap-1.5">
          Read full case study: Approval Latency Detected 8 Days Before Weekly Review
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </a>
      </section>

      <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-10 text-center">
        <h2 className="font-display font-bold text-3xl text-white mb-3">Request a Demo</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-6 text-sm">
          Explore the full platform with real business signals, narrative intelligence, and a complete use case walkthrough.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setDemoOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 text-slate-900 font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
          >
            Request Demo <ArrowRight className="w-4 h-4" />
          </button>
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors">
              Open Lyte <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="lyte"
        subtitle="Command"
      />
    </div>
  );
}
