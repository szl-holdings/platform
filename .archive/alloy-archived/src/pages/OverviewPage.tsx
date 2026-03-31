import { useEffect, useRef } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { trackEvent } from "../App";
import { AlloyGraphQLPanel } from "../components/graphql-data-panel";

const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, "") || "/alloy";

function useSectionEngagement(sectionId: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackEvent("section_impression", { section: sectionId, page: "overview" });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionId]);
  return ref;
}

interface NavProps {
  onNavigate: (page: string) => void;
}

const WHAT_ALLOY_IS = [
  { num: "01", title: "An orchestration engine", desc: "Multi-step workflows across systems and teams — with conditional logic, approval gates, and structured outputs." },
  { num: "02", title: "A signal processing layer", desc: "Operational, financial, and environmental signals ingested, classified by severity, function, and required action." },
  { num: "03", title: "An output generation system", desc: "Raw signals transformed into structured reports, briefings, and decision-ready documents — automatically." },
  { num: "04", title: "A governance framework", desc: "Configurable approval flows on every consequential action. Every decision logged. Humans in the loop where it matters." },
];

const WHAT_ALLOY_POWERS = [
  { platform: "Lyte", accent: "#06b6d4", desc: "Business observability — signals classified, incidents triaged, and operators alerted with context, not noise.", href: "/lyte-command-center/" },
  { platform: "Vessels", accent: "#3b82f6", desc: "Maritime intelligence — AIS signal interpretation, deviation detection, and fleet briefings for operations teams.", href: "/vessels/" },
  { platform: "Terra", accent: "#a07848", desc: "Real estate broker platform — deal conversion, lead routing, and distress property workflows for active pipelines.", href: "/terra/" },
  { platform: "Carlota Jo", accent: "#d97706", desc: "High-trust service coordination — vendor orchestration, residence logistics, and cross-border operational workflows.", href: "/carlota-jo/" },
];

const HOW_ALLOY_WORKS = [
  { step: "01", label: "Ingest", accent: "#06b6d4", desc: "Signals and requests enter from connected platforms. Every input is timestamped and attributed." },
  { step: "02", label: "Classify", accent: "#3b82f6", desc: "Incoming data is normalised — severity, ownership, and consequence assigned before any action." },
  { step: "03", label: "Orchestrate", accent: "#8b5cf6", desc: "Workflows sequenced with conditional logic. Each step has a defined owner and output requirement." },
  { step: "04", label: "Route", accent: "#a78bfa", desc: "Actions and decisions distributed to the right person — by role, urgency, and context." },
  { step: "05", label: "Output", accent: "#10b981", desc: "Structured reports, briefings, and decision documents generated automatically." },
  { step: "06", label: "Approve", accent: "#f59e0b", desc: "High-stakes outputs route through human approval gates. Every decision logged with reason." },
  { step: "07", label: "Execute", accent: "#f472b6", desc: "Confirmed actions executed. Downstream systems updated. Audit trail complete and explainable." },
];

const AGENT_ROLES = [
  { name: "Signal Agent", desc: "Monitors platforms for anomalies, classifies by severity, and surfaces context-rich alerts." },
  { name: "Workflow Agent", desc: "Sequences multi-step execution — gating, re-routing on failure, escalating on timeout." },
  { name: "Document Agent", desc: "Drafts briefings, reports, and decision summaries from structured data and signal context." },
  { name: "Routing Agent", desc: "Distributes tasks, alerts, and approvals to the right owner by role and urgency." },
  { name: "Audit Agent", desc: "Maintains decision logs, approval trails, and output histories across all workflow runs." },
];

const OUTPUTS = [
  { label: "Signal Briefings", desc: "What is happening, why it matters, and what action is required — in plain language." },
  { label: "Workflow Status Reports", desc: "Execution summaries with owner attribution, completion status, and exception notes." },
  { label: "Decision Packages", desc: "Executive-ready documents with context, risk, and recommended action." },
  { label: "Audit Trails", desc: "Every decision, approval, rejection, and execution — timestamped and attributable." },
  { label: "Exception Alerts", desc: "Prioritised notifications for anomalies, stalls, ownership gaps, and time-sensitive actions." },
];

export default function OverviewPage({ onNavigate }: NavProps) {
  const heroRef = useSectionEngagement("hero");
  const whatRef = useSectionEngagement("what_alloy_is");
  const powersRef = useSectionEngagement("what_alloy_powers");
  const worksRef = useSectionEngagement("how_alloy_works");
  const agentsRef = useSectionEngagement("agent_roles");
  const outputsRef = useSectionEngagement("outputs");
  const govRef = useSectionEngagement("governance");

  return (
    <div className="min-h-screen text-white" style={{ background: "hsl(224, 25%, 4%)" }}>

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden px-6 pt-20 pb-24 max-w-6xl mx-auto">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-8" style={{ background: "radial-gradient(circle, #6e9ef5, transparent)" }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-6" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        </div>

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium mb-6 border" style={{ background: "rgba(110,158,245,0.08)", borderColor: "rgba(110,158,245,0.25)", color: "#6e9ef5" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            SZL Holdings — Intelligence Backbone
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-6">
            The intelligence layer behind{" "}
            <span style={{ color: "#6e9ef5" }}>premium command systems.</span>
          </h1>

          <p className="text-lg leading-relaxed mb-4 max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
            Alloy is the orchestration, workflow, and output engine powering every platform in the SZL ecosystem.
            It sequences processes, routes actions, generates structured outputs, and keeps humans in the loop
            on consequential decisions.
          </p>

          <p className="text-sm leading-relaxed mb-10 max-w-xl" style={{ color: "rgba(255,255,255,0.35)" }}>
            Alloy is not a chatbot. It is an execution fabric — built for precision, governance, and scale.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { trackEvent("cta_click", { label: "Explore Architecture", from: "overview_hero" }); onNavigate("architecture"); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-semibold text-black transition-all hover:brightness-110"
              style={{ background: "#6e9ef5" }}
            >
              Explore Architecture <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { trackEvent("cta_click", { label: "View Workflows", from: "overview_hero" }); onNavigate("workflows"); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-medium border transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}
            >
              View Workflows <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* What Alloy Is */}
      <section ref={whatRef} className="px-6 py-16 max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#6e9ef5" }}>What Alloy Is</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">An orchestration and output engine — not a chatbot.</h2>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Alloy manages structured workflows, processes operational signals, routes actions to the right people,
            and generates explainable outputs. Every step is governed, logged, and attributable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {WHAT_ALLOY_IS.map((item) => (
            <div key={item.num} className="p-5 rounded-sm border" style={{ borderColor: "rgba(110,158,245,0.12)", background: "rgba(110,158,245,0.04)" }}>
              <div className="text-xs font-mono mb-2" style={{ color: "rgba(110,158,245,0.6)" }}>{item.num}</div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What Alloy Powers */}
      <section ref={powersRef} className="px-6 py-16 max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#6e9ef5" }}>What Alloy Powers</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Every platform in the SZL ecosystem runs on Alloy.</h2>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Alloy is the shared intelligence backbone. Signal processing, workflow orchestration, and output generation
            are Alloy capabilities — surfaced through each platform's command interface.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {WHAT_ALLOY_POWERS.map((p) => (
            <a
              key={p.platform}
              href={p.href}
              className="group flex items-start gap-4 p-5 rounded-sm border transition-all hover:border-white/15"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: p.accent }} />
              <div>
                <div className="text-sm font-semibold mb-1.5" style={{ color: p.accent }}>{p.platform}</div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{p.desc}</p>
                <div className="mt-2 flex items-center gap-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: p.accent }}>
                  Open platform <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* How Alloy Works */}
      <section ref={worksRef} className="px-6 py-16 max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#6e9ef5" }}>How Alloy Works</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">A seven-step execution sequence.</h2>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Every input that enters Alloy follows a structured path from ingestion to execution.
            Nothing acts without classification. Nothing executes without approval where required.
          </p>
        </div>

        <div className="space-y-3">
          {HOW_ALLOY_WORKS.map((step) => (
            <div key={step.step} className="flex items-start gap-5 p-5 rounded-sm border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <div className="shrink-0 w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold font-mono border" style={{ borderColor: `${step.accent}40`, background: `${step.accent}12`, color: step.accent }}>
                {step.step}
              </div>
              <div>
                <div className="text-sm font-semibold mb-1" style={{ color: step.accent }}>{step.label}</div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Engine */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="rounded-sm border p-8 md:p-12" style={{ borderColor: "rgba(110,158,245,0.12)", background: "linear-gradient(135deg, rgba(110,158,245,0.04), rgba(139,92,246,0.04))" }}>
          <div className="md:flex md:items-start md:gap-12">
            <div className="md:flex-1 mb-8 md:mb-0">
              <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#6e9ef5" }}>Workflow Engine</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Structured processes. No black boxes.</h2>
              <p className="leading-relaxed mb-6 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Alloy workflows are defined, versioned, and explainable. Every step has a clear trigger,
                owner, and output. Multi-step sequences handle branching logic, timeout escalation,
                and human approval gates without losing traceability.
              </p>
              <button
                onClick={() => { trackEvent("cta_click", { label: "View Workflows", from: "workflow_engine" }); onNavigate("workflows"); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium border transition-all hover:bg-white/5"
                style={{ borderColor: "rgba(110,158,245,0.3)", color: "#6e9ef5" }}
              >
                View Workflow Library <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="md:flex-1 space-y-3">
              {[
                { label: "Conditional branching", desc: "Workflows adapt based on signal type, severity, or operator input." },
                { label: "Multi-step sequencing", desc: "Processes execute in defined order with dependency awareness." },
                { label: "Timeout escalation", desc: "Stalled steps automatically escalate to the right owner." },
                { label: "Parallel execution", desc: "Independent workflow branches run concurrently when permitted." },
              ].map((f) => (
                <div key={f.label} className="flex items-start gap-3 p-3 rounded-sm border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: "#6e9ef5" }} />
                  <div>
                    <div className="text-xs font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>{f.label}</div>
                    <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Agent Roles */}
      <section ref={agentsRef} className="px-6 py-16 max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#6e9ef5" }}>Agent Roles</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Specialized agents. Coordinated execution.</h2>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Alloy's agent layer is composed of purpose-built agents, each with a defined scope and output contract.
            No agent acts outside its role. Every action is attributable.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENT_ROLES.map((a) => (
            <div key={a.name} className="p-5 rounded-sm border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <div className="text-sm font-semibold mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>{a.name}</div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.40)" }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outputs */}
      <section ref={outputsRef} className="px-6 py-16 max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#6e9ef5" }}>Outputs</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Structured outputs. Ready to act on.</h2>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Alloy produces outputs that operators can act on immediately — without interpretation, without decoding,
            without additional analysis required.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {OUTPUTS.map((o) => (
            <div key={o.label} className="p-5 rounded-sm border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <div className="text-sm font-semibold mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>{o.label}</div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.40)" }}>{o.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Governance */}
      <section ref={govRef} className="px-6 py-16 max-w-6xl mx-auto">
        <div className="rounded-sm border p-8 md:p-12" style={{ borderColor: "rgba(110,158,245,0.15)", background: "linear-gradient(135deg, rgba(110,158,245,0.04), rgba(99,102,241,0.04))" }}>
          <div className="md:flex md:items-start md:gap-12">
            <div className="md:flex-1 mb-8 md:mb-0">
              <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#6e9ef5" }}>Governance</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Human-in-the-loop by design.</h2>
              <p className="leading-relaxed mb-6 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                Alloy never acts unilaterally on consequential decisions. Every high-stakes output
                passes through configurable approval flows. Every decision is logged. Every rejection
                is recorded with reason and attribution.
              </p>
              <button
                onClick={() => { trackEvent("cta_click", { label: "View Governance Controls", from: "governance" }); onNavigate("governance"); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium border transition-all hover:bg-white/5"
                style={{ borderColor: "rgba(110,158,245,0.3)", color: "#6e9ef5" }}
              >
                View Governance Controls <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="md:flex-1 grid grid-cols-2 gap-3">
              {[
                { label: "Human Approval Flows" },
                { label: "Confidence Signals" },
                { label: "Complete Audit Trails" },
                { label: "Explainable Outputs" },
                { label: "Structured Escalation" },
                { label: "Role-Based Control" },
              ].map(g => (
                <div key={g.label} className="flex items-center gap-2.5 p-3 rounded-sm border" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#6e9ef5" }} />
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Proof Reinforcement */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#00d4ff" }}>Documented Outcomes</div>
          <h2 className="text-2xl font-bold text-white">Results from Alloy-powered deployments</h2>
          <p className="text-white/45 text-sm mt-2 max-w-xl leading-relaxed">
            Specific operational outcomes achieved through Alloy's orchestration layer. Documented with constraints, timelines, and measured impact.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { metric: "3.4×", label: "Decision velocity improvement", detail: "Multi-entity procurement: 18 days → 5.3 days average cycle time", accent: "#00d4ff" },
            { metric: "99%", label: "Legal SLA compliance", detail: "Up from 71% — routing automation eliminated manual hand-off delays", accent: "#06b6d4" },
            { metric: "0", label: "Escalations in first 90 days", detail: "Entity-aware authority matrix prevented mis-routing across all 6 entities", accent: "#0891b2" },
            { metric: "6", label: "Entities integrated", detail: "Full authority matrix encoded — NetSuite, Xero, QuickBooks all unified", accent: "#0e7490" },
            { metric: "100%", label: "Board prep automated", detail: "Structured briefings generated directly from workflow completion data", accent: "#155e75" },
            { metric: "8", label: "Decision categories covered", detail: "Highest-frequency procurement, legal, finance, and operations workflows", accent: "#164e63" },
          ].map((item, i) => (
            <div
              key={item.label}
              className="rounded-xl p-5 border transition-colors duration-200 hover:border-white/15"
              style={{ borderColor: "rgba(0,212,255,0.12)", background: "rgba(0,212,255,0.04)" }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: item.accent }}>{item.metric}</div>
              <div className="text-[13px] font-semibold text-white/80 mb-1.5">{item.label}</div>
              <div className="text-[12px] text-white/40 leading-relaxed">{item.detail}</div>
            </div>
          ))}
        </div>
        <a href="/szl-holdings/case-studies" className="text-[12px] text-[#00d4ff]/50 hover:text-[#00d4ff]/80 transition-colors inline-flex items-center gap-1.5">
          Read full case study: 3.4× Decision Velocity Across a Multi-Entity Operating Structure
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </a>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to explore the architecture?</h2>
        <p className="mb-8 max-w-md mx-auto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          See how Alloy's execution fabric turns operational inputs into structured, explainable actions.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { trackEvent("cta_click", { label: "View Architecture", from: "overview_bottom_cta" }); onNavigate("architecture"); }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm text-sm font-semibold text-black"
            style={{ background: "#6e9ef5" }}
          >
            View Architecture <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { trackEvent("cta_click", { label: "Meet the Agents", from: "overview_bottom_cta" }); onNavigate("agents"); }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm text-sm font-medium border"
            style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}
          >
            Meet the Agents
          </button>
          <a
            href="/szl-holdings/"
            onClick={() => trackEvent("cta_click", { label: "Back to Ecosystem", from: "overview_bottom_cta" })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm text-sm font-medium border transition-all hover:bg-white/5"
            style={{ borderColor: "rgba(110,158,245,0.3)", color: "#6e9ef5" }}
          >
            Back to Ecosystem <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <AlloyGraphQLPanel />
        </div>
      </section>
    </div>
  );
}
