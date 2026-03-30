import { useEffect, useRef } from "react";
import { ArrowRight, ExternalLink, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { trackEvent } from "../App";

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

function EcosystemNode({ label, subtitle, accent, x, y, isCentral = false }: {
  label: string; subtitle: string; accent: string; x: string; y: string; isCentral?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2",
      )}
      style={{ left: x, top: y }}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl font-bold text-white",
          isCentral ? "w-20 h-20 text-base shadow-2xl" : "w-14 h-14 text-sm shadow-lg"
        )}
        style={{
          background: isCentral
            ? `radial-gradient(circle, ${accent}40, ${accent}20)`
            : `${accent}20`,
          border: `2px solid ${accent}60`,
          boxShadow: isCentral ? `0 0 40px ${accent}40` : `0 0 15px ${accent}25`,
        }}
      >
        {isCentral ? "⬡" : label.charAt(0)}
      </div>
      <span className={cn("text-center font-semibold leading-tight", isCentral ? "text-sm" : "text-xs")} style={{ color: accent }}>
        {label}
      </span>
      <span className="text-[10px] text-white/40 text-center leading-tight">{subtitle}</span>
    </div>
  );
}

function ConnectionLine({ x1, y1, x2, y2, accent }: { x1: number; y1: number; x2: number; y2: number; accent: string }) {
  return (
    <line
      x1={`${x1}%`} y1={`${y1}%`}
      x2={`${x2}%`} y2={`${y2}%`}
      stroke={accent} strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.4"
    />
  );
}

function EcosystemMap() {
  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <ConnectionLine x1={50} y1={50} x2={20} y2={25} accent="#00d4ff" />
        <ConnectionLine x1={50} y1={50} x2={80} y2={25} accent="#00d4ff" />
        <ConnectionLine x1={50} y1={50} x2={20} y2={75} accent="#00d4ff" />
        <ConnectionLine x1={50} y1={50} x2={80} y2={75} accent="#00d4ff" />
        <ConnectionLine x1={50} y1={50} x2={50} y2={15} accent="#00d4ff" />
        <ConnectionLine x1={50} y1={50} x2={50} y2={85} accent="#a78bfa" />
      </svg>
      <EcosystemNode label="Alloy" subtitle="Intelligence Engine" accent="#00d4ff" x="50%" y="50%" isCentral />
      <EcosystemNode label="Lyte" subtitle="Business Observability" accent="#f59e0b" x="20%" y="25%" />
      <EcosystemNode label="Vessels" subtitle="Maritime Command" accent="#3b82f6" x="80%" y="25%" />
      <EcosystemNode label="Carlota Jo" subtitle="Operational Workflows" accent="#f472b6" x="20%" y="75%" />
      <EcosystemNode label="Future" subtitle="App Endpoints" accent="#6366f1" x="80%" y="75%" />
      <EcosystemNode label="Humans" subtitle="Approval & Oversight" accent="#10b981" x="50%" y="15%" />
      <EcosystemNode label="Actions" subtitle="Execution Layer" accent="#a78bfa" x="50%" y="85%" />
    </div>
  );
}

function PipelineStep({ step, label, description, accent }: { step: number; label: string; description: string; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0"
        style={{ borderColor: `${accent}60`, background: `${accent}15`, color: accent }}
      >
        {step}
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-white/90">{label}</div>
        <div className="text-[10px] text-white/40 mt-0.5 leading-tight">{description}</div>
      </div>
    </div>
  );
}

const PIPELINE_STEPS = [
  { label: "Inputs", description: "Signals, data, requests", accent: "#00d4ff" },
  { label: "Normalise", description: "Structure & classify", accent: "#3b82f6" },
  { label: "Reason", description: "Analyse & synthesise", accent: "#8b5cf6" },
  { label: "Orchestrate", description: "Sequence & coordinate", accent: "#a78bfa" },
  { label: "Outputs", description: "Actions & documents", accent: "#10b981" },
  { label: "Approve", description: "Human review gate", accent: "#f59e0b" },
  { label: "Execute", description: "Confirmed actions", accent: "#f472b6" },
];

export default function OverviewPage({ onNavigate }: NavProps) {
  const heroRef = useSectionEngagement("hero");
  const ecosystemRef = useSectionEngagement("ecosystem_map");
  const pipelineRef = useSectionEngagement("input_pipeline");
  const useCasesRef = useSectionEngagement("use_cases_preview");
  const poweredRef = useSectionEngagement("powered_products");

  return (
    <div className="min-h-screen text-white" style={{ background: "hsl(224, 25%, 4%)" }}>

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden px-6 pt-20 pb-24 max-w-6xl mx-auto">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: "radial-gradient(circle, #00d4ff, transparent)" }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-8" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        </div>

        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border" style={{ background: "rgba(0,212,255,0.08)", borderColor: "rgba(0,212,255,0.25)", color: "#00d4ff" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            SZL Ecosystem Intelligence Layer
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-6">
            Alloy turns fragmented operational inputs into structured, explainable{" "}
            <span style={{ color: "#00d4ff" }}>execution.</span>
          </h1>

          <p className="text-lg text-white/55 leading-relaxed mb-10 max-w-2xl">
            Built to orchestrate workflows without losing accountability. Alloy is the intelligence, orchestration, and workflow backbone powering Lyte, Vessels, and the entire SZL ecosystem.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { trackEvent("cta_click", { label: "Explore Architecture", from: "overview_hero" }); onNavigate("architecture"); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-black transition-all hover:brightness-110"
              style={{ background: "#00d4ff" }}
            >
              Explore Architecture <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { trackEvent("cta_click", { label: "View Workflows", from: "overview_hero" }); onNavigate("workflows"); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}
            >
              View Workflows <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { trackEvent("cta_click", { label: "Open Command Interface", from: "overview_hero" }); onNavigate("chat"); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(0,212,255,0.25)", color: "#00d4ff" }}
            >
              Open Command Interface <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Ecosystem Power Map */}
      <section ref={ecosystemRef} className="px-6 py-16 max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#00d4ff" }}>Ecosystem Power Map</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Alloy at the center of the SZL ecosystem</h2>
          <p className="text-white/50 max-w-xl">Every product in the ecosystem connects to Alloy. Intelligence flows in, structured execution flows out — with human approval where it matters.</p>
        </div>

        <div className="rounded-2xl border p-8 md:p-12" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          <EcosystemMap />
        </div>
      </section>

      {/* Pipeline Visual */}
      <section ref={pipelineRef} className="px-6 py-16 max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#00d4ff" }}>Inputs-to-Actions Pipeline</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">From raw signal to confirmed action</h2>
          <p className="text-white/50 max-w-xl">Every piece of information entering Alloy passes through a structured pipeline. Nothing executes without passing through reasoning, orchestration, and — where required — human approval.</p>
        </div>

        <div className="rounded-2xl border p-6 md:p-10" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2 flex-1 min-w-0">
                <PipelineStep step={i + 1} {...step} />
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="w-4 h-px shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Highlights */}
      <section ref={useCasesRef} className="px-6 py-16 max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#00d4ff" }}>Use Cases</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">What Alloy powers across the ecosystem</h2>
          <p className="text-white/50 max-w-xl">From maritime signal interpretation to document generation, Alloy handles the operational workflows that keep the ecosystem moving.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { icon: "⚡", label: "Lyte Observability", desc: "Signals classified, incidents triaged, and operators alerted with context — not noise." },
            { icon: "🚢", label: "Maritime Intelligence", desc: "AIS signal interpretation, deviation detection, and fleet briefings for Vessels operators." },
            { icon: "📄", label: "Document Generation", desc: "From data to approval-ready documents via structured drafting and human review workflows." },
            { icon: "🔀", label: "Workflow Routing", desc: "Inbound requests triaged, classified, and routed to the right team or workflow automatically." },
            { icon: "⚠️", label: "Exception Handling", desc: "Anomalies detected, assessed, and converted into structured remediation action plans." },
            { icon: "🎯", label: "Command Workflows", desc: "Cross-product operational digests and pending decision queues for founders and operators." },
          ].map(uc => (
            <div key={uc.label} className="p-5 rounded-xl border hover:border-white/15 transition-colors group cursor-pointer" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
              onClick={() => onNavigate("use-cases")}>
              <div className="text-2xl mb-3">{uc.icon}</div>
              <div className="text-sm font-semibold text-white/90 mb-1.5">{uc.label}</div>
              <div className="text-xs text-white/40 leading-relaxed">{uc.desc}</div>
              <div className="mt-3 flex items-center gap-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#00d4ff" }}>
                View use case <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => onNavigate("use-cases")} className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "#00d4ff" }}>
          See all use cases <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Governance Preview */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="rounded-2xl border p-8 md:p-12" style={{ borderColor: "rgba(0,212,255,0.15)", background: "linear-gradient(135deg, rgba(0,212,255,0.04), rgba(99,102,241,0.04))" }}>
          <div className="md:flex md:items-start md:gap-12">
            <div className="md:flex-1 mb-8 md:mb-0">
              <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#00d4ff" }}>Governance</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Human-in-the-loop by design</h2>
              <p className="text-white/55 leading-relaxed mb-6">
                Alloy never acts unilaterally on consequential decisions. Every high-stakes output passes through configurable approval flows. Every decision is logged. Every rejection is recorded.
              </p>
              <button onClick={() => onNavigate("governance")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-white/5" style={{ borderColor: "rgba(0,212,255,0.3)", color: "#00d4ff" }}>
                View Governance Controls <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="md:flex-1 grid grid-cols-2 gap-3">
              {[
                { icon: "👤", label: "Human Approval Flows" },
                { icon: "📊", label: "Confidence Signals" },
                { icon: "📋", label: "Complete Audit Trails" },
                { icon: "💬", label: "Explainable Outputs" },
                { icon: "🔼", label: "Structured Escalation" },
                { icon: "🔑", label: "Role-Based Control" },
              ].map(g => (
                <div key={g.label} className="flex items-center gap-2.5 p-3 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                  <span className="text-lg">{g.icon}</span>
                  <span className="text-xs font-medium text-white/75">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Powered Products */}
      <section ref={poweredRef} className="px-6 py-16 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#00d4ff" }}>Powered by Alloy</div>
          <h2 className="text-2xl font-bold">Products running on Alloy intelligence</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            { name: "Lyte Command Center", path: "/lyte-command-center/", icon: "⚡", accent: "#f59e0b", desc: "Business observability & ITOps" },
            { name: "Vessels", path: "/vessels/", icon: "🚢", accent: "#3b82f6", desc: "Maritime intelligence platform" },
            { name: "Carlota Jo", path: "/carlota-jo/", icon: "✨", accent: "#f472b6", desc: "Operational consulting workflows" },
          ].map(p => (
            <a key={p.name} href={p.path} onClick={() => trackEvent("cross_nav_click", { destination: p.name, destination_path: p.path, from: "overview_powered_products" })} className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:border-white/20" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: `${p.accent}15`, border: `1px solid ${p.accent}30` }}>{p.icon}</div>
              <div>
                <div className="text-sm font-semibold text-white/90">{p.name}</div>
                <div className="text-xs text-white/40">{p.desc}</div>
              </div>
              <div className="text-xs ml-2 px-2 py-0.5 rounded text-xs font-medium" style={{ background: `${p.accent}15`, color: p.accent }}>Powered by Alloy</div>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to explore the architecture?</h2>
        <p className="text-white/50 mb-8 max-w-md mx-auto">See how Alloy's six-layer system turns inputs into accountable, explainable actions.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => { trackEvent("cta_click", { label: "View Architecture", from: "overview_bottom_cta" }); onNavigate("architecture"); }} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-black" style={{ background: "#00d4ff" }}>
            View Architecture <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => { trackEvent("cta_click", { label: "Meet the Agents", from: "overview_bottom_cta" }); onNavigate("agents"); }} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border" style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}>
            Meet the Agents
          </button>
          <a
            href="/stephen-site/"
            onClick={() => trackEvent("cta_click", { label: "Request Demo", from: "overview_bottom_cta" })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
            style={{ borderColor: "rgba(0,212,255,0.3)", color: "#00d4ff" }}
          >
            Request Demo <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
}
