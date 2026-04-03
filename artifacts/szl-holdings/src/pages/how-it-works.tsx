import { Link } from "wouter";
import { ArrowRight, Layers, Zap, Shield, Eye, Workflow, Brain, Database, CheckCircle, Radio, FileCheck2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const STACK_LAYERS = [
  {
    number: "01",
    title: "Signal Ingestion",
    subtitle: "Worldline Engine",
    desc: "Public APIs, business systems, and domain-specific data feeds are normalized into a unified signal stream. Every data point carries source attribution, retrieval timestamp, and confidence metadata.",
    icon: Radio,
    color: "#4a90b8",
  },
  {
    number: "02",
    title: "Intelligence Processing",
    subtitle: "Model Mesh + AI Routing",
    desc: "Signals are processed through domain-specific AI models routed by the Model Mesh. Task classification determines which model handles each request, with cost and capability optimization. Every routing decision is logged.",
    icon: Brain,
    color: "#8b7ac8",
  },
  {
    number: "03",
    title: "State Observation",
    subtitle: "Digital Twins + Pressure Graphs",
    desc: "Processed intelligence updates domain-specific digital twins — living snapshots of matters, properties, vessels, or threat landscapes. Pressure graphs surface risk dimensions and anomaly patterns.",
    icon: Eye,
    color: "#c8953c",
  },
  {
    number: "04",
    title: "Decision Surface",
    subtitle: "Lyte Command Layer",
    desc: "Lyte presents observed state as actionable intelligence — not dashboards. Forecasts, risk assessments, and recommended actions surface in context with the signals that inform them.",
    icon: Zap,
    color: "#d4a054",
  },
  {
    number: "05",
    title: "Governed Execution",
    subtitle: "Alloy Action Spine",
    desc: "When a decision is made, Alloy routes the resulting action through approval gates, role-based authorization, and compliance checks. Every execution is logged with actor identity, rationale, and outcome.",
    icon: Workflow,
    color: "#d4a054",
  },
  {
    number: "06",
    title: "Proof & Audit",
    subtitle: "Proof Chain + Trust Layer",
    desc: "Every decision, action, and state change is recorded in a SHA-256 hashed proof chain. Complete audit trail from signal ingestion through execution. Tamper-evident by construction.",
    icon: Shield,
    color: "#4a90b8",
  },
];

const VERTICALS = [
  { name: "PRISM Counsel", domain: "Legal matter observability", signal: "Claims, deadlines, documents, communications", output: "Governed legal actions, demand packets, audit trails", href: "/solutions/prism-counsel", color: "#d4a054" },
  { name: "Terra", domain: "Real estate intelligence", signal: "PLUTO, FEMA, permits, market data", output: "Acquisition signals, diligence workflows, LP reports", href: "/solutions/terra", color: "hsl(140,50%,38%)" },
  { name: "Vessels", domain: "Maritime operations", signal: "AIS, NWS, NOAA, port statistics", output: "Route optimization, weather routing, fleet monitoring", href: "/solutions/vessels", color: "#4a90b8" },
  { name: "Aegis", domain: "Security & defense", signal: "CISA, NVD, MITRE ATT&CK, threat feeds", output: "Threat triage, incident response, compliance evidence", href: "/solutions/aegis", color: "#c45a4a" },
];

const DIFFERENTIATORS = [
  { title: "Signal → Action, not dashboards", desc: "Every screen moves from observed signal to recommended action to governed execution. No static charts that require interpretation." },
  { title: "One architecture, many domains", desc: "The same signal → intelligence → observation → action → proof pipeline runs across legal, real estate, maritime, and security. Domain expertise lives in the vertical pack, not the plumbing." },
  { title: "Traceable AI, not magic", desc: "Every AI output shows what informed it, which model processed it, and what confidence it carries. When AI fails, you see why." },
  { title: "Built-in accountability", desc: "Governance isn't a feature — it's a structural constraint. Proof chains, approval gates, and decision lineage are embedded in the architecture, not bolted on." },
];

export default function HowItWorksPage() {
  usePageMeta({
    title: "How It Works · SZL Holdings",
    description: "How the SZL platform transforms raw signals into governed business action through six architectural layers — from ingestion to proof chain.",
    canonical: "https://szlholdings.com/how-it-works",
  });

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <SiteNav />

      <section className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-[#d4a054]" />
          <span className="text-[11px] font-medium text-[#d4a054] uppercase tracking-widest">Architecture</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
          Signal → intelligence → action → proof.
        </h1>
        <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-3">
          SZL builds vertical operating systems that transform domain-specific signals into governed business action. The same six-layer architecture runs across every vertical — legal, real estate, maritime, security — with domain expertise embedded in each pack.
        </p>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed mb-8">
          This page explains what happens from the moment a data signal enters the platform to the moment a governed action is executed, proved, and auditable.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-xl font-semibold text-slate-100 mb-8">The Six-Layer Stack</h2>
        <div className="space-y-4">
          {STACK_LAYERS.map((layer) => (
            <div key={layer.number} className="flex gap-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${layer.color}15`, color: layer.color, border: `1px solid ${layer.color}30` }}>
                  {layer.number}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-200">{layer.title}</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: layer.color, background: `${layer.color}10` }}>{layer.subtitle}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{layer.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">One Architecture, Four Verticals</h2>
        <p className="text-sm text-slate-400 max-w-2xl mb-8">
          The same six-layer stack powers each vertical pack. Domain expertise — the signals, models, twins, and actions specific to each industry — lives in the pack, not the platform.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VERTICALS.map((v) => (
            <Link key={v.name} href={v.href}>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-200">{v.name}</h3>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-xs font-medium mb-3" style={{ color: v.color }}>{v.domain}</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Signals</span>
                    <p className="text-xs text-slate-400">{v.signal}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Output</span>
                    <p className="text-xs text-slate-400">{v.output}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-xl font-semibold text-slate-100 mb-8">Why It's Different</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIFFERENTIATORS.map((d) => (
            <div key={d.title} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <CheckCircle className="w-4 h-4 text-[#d4a054] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">{d.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <Layers className="w-8 h-8 text-[#d4a054] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-100 mb-2">See it in action</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
            The best way to understand the architecture is to see a real workflow. PRISM Counsel is the flagship — a complete daily lawyer workflow from email ingestion to governed sign-off.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/demo">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 hover:bg-[#d4a054]/20 transition-colors cursor-pointer">
                See a Demo <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/trust">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer">
                Trust Center
              </span>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
