import { Link } from "wouter";
import { ArrowRight, Layers, Zap, Shield, Brain, CheckCircle, Radio } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const STACK_LAYERS = [
  {
    number: "01",
    title: "Signal Ingestion",
    subtitle: "Event Fabric + Worldline Engine",
    desc: "Public APIs, business systems, and domain-specific data feeds are normalized into a unified signal stream. Every data point carries source attribution, retrieval timestamp, and confidence metadata. The Event Fabric correlates signals across domain packs without collapsing their domain-specific context.",
    icon: Radio,
    color: "#4a90b8",
  },
  {
    number: "02",
    title: "Risk Surface",
    subtitle: "Digital Twins + Pressure Graphs + Monte Carlo",
    desc: "Ingested signals update domain-specific digital twins — living snapshots of threat landscapes, vessel positions, property pipelines, or matter deadlines. Pressure graphs surface risk dimensions and anomaly patterns. For high-stakes decisions, Monte Carlo simulation models uncertainty and blast radius before any recommendation reaches an operator.",
    icon: Brain,
    color: "#8b7ac8",
  },
  {
    number: "03",
    title: "Governed Decision",
    subtitle: "Lyte Command Layer + Covenant Policy + Alloy",
    desc: "Lyte surfaces the Risk Surface as actionable intelligence — AI recommendations with source citations and confidence scores, not static dashboards. Covenant Policy determines who can approve, what conditions apply, and when human-in-the-loop is required. Alloy then orchestrates the approved action as a durable, auditable workflow with escalation paths and SLA tracking.",
    icon: Zap,
    color: "#d4a054",
  },
  {
    number: "04",
    title: "Proof Chain",
    subtitle: "Immutable Audit Trail + Outcome Graph",
    desc: "Every step — signal, recommendation, simulation, policy decision, approval, execution — is recorded in a SHA-256 hashed Proof Chain. Tamper-evident by construction. The Outcome Graph then tracks the real-world result and feeds it back into simulation models and confidence calibration, closing the governed decision loop.",
    icon: Shield,
    color: "#4a90b8",
  },
];

const VERTICALS = [
  { name: "PRISM Counsel", domain: "Legal intelligence — domain pack", signal: "Claims, deadlines, documents, communications", output: "Governed legal actions, demand packets, Proof Chain audit trails", href: "/solutions/prism-counsel", color: "#d4a054" },
  { name: "Terra", domain: "Real estate intelligence — domain pack", signal: "PLUTO, FEMA, permits, market data", output: "Acquisition signals, diligence workflows, governed LP reports", href: "/solutions/terra", color: "hsl(140,50%,38%)" },
  { name: "Vessels", domain: "Maritime intelligence — domain pack", signal: "AIS, NWS, NOAA, port statistics", output: "Route optimization, weather routing, governed fleet commands", href: "/solutions/vessels", color: "#4a90b8" },
  { name: "Aegis", domain: "Security & defense — domain pack", signal: "CISA, NVD, MITRE ATT&CK, threat feeds", output: "Threat triage, governed incident response, compliance evidence", href: "/solutions/aegis", color: "#c45a4a" },
];

const DIFFERENTIATORS = [
  { title: "Signal → Action, not dashboards", desc: "Every screen moves from ingested signal to recommended action to governed execution. No static charts that require interpretation — the Governed Decision Loop is the interface." },
  { title: "One loop. Every domain pack.", desc: "The same Signal Ingestion → Risk Surface → Governed Decision → Proof Chain loop runs across every domain pack. Domain expertise — the signals, models, and actions specific to each industry — lives in the pack, not the platform primitives." },
  { title: "Traceable AI, not magic", desc: "Every AI output shows what informed it, which model processed it, and what confidence it carries. Covenant Policy determines what the AI can recommend and what a human must approve. When AI fails, you see why." },
  { title: "Governance as a structural primitive", desc: "Governance isn't a feature — it's a structural constraint. Covenant Policy, Proof Chain, approval gates, and Outcome Graph are platform primitives, not bolt-ons. Domain packs inherit them without rebuilding them." },
];

export default function HowItWorksPage() {
  usePageMeta({
    title: "How It Works · SZL Holdings",
    description: "The SZL governed decision system transforms raw signals into auditable business action through a four-step loop: Signal Ingestion → Risk Surface → Governed Decision → Proof Chain.",
    canonical: "https://szlholdings.com/how-it-works",
  });

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <SiteNav />

      <section className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-[#d4a054]" />
          <span className="text-[11px] font-medium text-[#d4a054] uppercase tracking-widest">Governed Decision Loop</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
          Signal Ingestion → Risk Surface → Governed Decision → Proof Chain.
        </h1>
        <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-3">
          SZL is a governed decision system. The same four-step loop runs across every domain pack — security, real estate, maritime, legal — with purpose-built intelligence in each pack and shared Primitives (Covenant Policy, Proof Chain, Outcome Graph) at the platform layer.
        </p>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed mb-8">
          This page explains what happens from the moment a data signal enters the platform to the moment a governed decision is recorded in the immutable Proof Chain.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-xl font-semibold text-slate-100 mb-8">The Governed Decision Loop</h2>
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
        <h2 className="text-xl font-semibold text-slate-100 mb-2">One Governed Decision Loop. Every Domain Pack.</h2>
        <p className="text-sm text-slate-400 max-w-2xl mb-8">
          The same four-step Governed Decision Loop powers every domain pack. Domain expertise — the signals, models, risk surfaces, and governed actions specific to each industry — lives in the pack. Covenant Policy, Proof Chain, and Outcome Graph are shared platform Primitives that every pack inherits.
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
          <h2 className="text-lg font-semibold text-slate-100 mb-2">See the Governed Decision Loop in action</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
            The best way to understand the system is to see a complete Governed Decision Loop play out end-to-end — from signal ingestion through Covenant Policy approval to Proof Chain record. Request a demo to see it live.
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
