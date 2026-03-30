import { Link } from "wouter";
import { Brain, ChevronRight, Shield, Eye, Activity, Search, BarChart3, ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { motion as m } from "framer-motion";

const signalFindings = [
  { type: "Threat Signal", title: "Coordinated infrastructure reconnaissance detected", severity: "High", time: "14 min ago" },
  { type: "Intelligence Finding", title: "Anomalous credential access pattern across three tenants", severity: "Medium", time: "1 hr ago" },
  { type: "Model Alert", title: "Prediction drift detected in classification layer — review required", severity: "Low", time: "3 hr ago" },
];

const severityColors: Record<string, string> = {
  High: "text-red-400 bg-red-400/8 border-red-400/20",
  Medium: "text-amber-400 bg-amber-400/8 border-amber-400/20",
  Low: "text-emerald-400 bg-emerald-400/8 border-emerald-400/20",
};

const capabilities = [
  { icon: Search, title: "Signal visibility", desc: "Unified view of intelligence signals across your enterprise — structured, searchable, and actionable." },
  { icon: Brain, title: "AI triage", desc: "Machine-assisted prioritisation of signals so analysts focus on what matters first." },
  { icon: Eye, title: "Explainability", desc: "Every model output includes traceable reasoning — not just a score, but why." },
  { icon: Activity, title: "Traceability", desc: "Full audit trail from raw signal to final decision." },
  { icon: Shield, title: "Secure architecture", desc: "Multi-tenant isolation, role-based permissions, and enterprise-grade access controls." },
  { icon: BarChart3, title: "Response workflows", desc: "Structured workflows for triaging, escalating, and resolving intelligence findings." },
];

export default function IncaMarketingHome() {
  return (
    <div className="min-h-screen bg-[#060410] text-violet-50">
      <MarketingNav />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-[60px] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.08)_0%,transparent_65%)]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/6 text-violet-400/80 text-[11px] font-medium tracking-[0.08em] uppercase mb-8">
            Intelligence Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-bold leading-[1.07] tracking-[-0.02em] text-violet-50 mb-6">
            Intelligence at scale.<br />
            <span className="text-violet-400">Decisions you can trace.</span>
          </h1>
          <p className="text-violet-300/55 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            INCA provides enterprise teams with structured visibility, explainable AI triage, and auditable decision workflows — for operations where accountability is non-negotiable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/request-access">
              <button className="flex items-center gap-2 px-7 py-3.5 rounded text-[14px] font-semibold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors">
                Schedule a private walkthrough <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-7 py-3.5 rounded text-[14px] font-medium text-violet-300/55 border border-violet-500/20 hover:border-violet-500/40 hover:text-violet-200 transition-all">
                Access the platform
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Signal preview */}
      <section className="border-t border-violet-500/10 bg-[#0a0814]/50 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-2">Live signal feed</p>
            <h2 className="text-xl font-bold text-violet-100">What the platform surfaces</h2>
          </div>
          <div className="space-y-3">
            {signalFindings.map((s, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className="flex items-start gap-4 bg-[#0d0a1a]/80 border border-violet-500/10 rounded-lg px-4 py-3.5"
              >
                <div className={`text-[9px] font-semibold px-2 py-1 rounded-full border whitespace-nowrap mt-0.5 ${severityColors[s.severity]}`}>
                  {s.severity}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-violet-400/40 mb-0.5">{s.type}</p>
                  <p className="text-[13px] font-medium text-violet-100 leading-snug">{s.title}</p>
                </div>
                <span className="text-[10px] text-violet-400/25 shrink-0">{s.time}</span>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Capabilities</p>
          <h2 className="text-2xl md:text-3xl font-bold text-violet-50 mb-3">Built for intelligence-first operations</h2>
          <p className="text-violet-300/40 text-[14px] max-w-xl mx-auto">Every layer of the intelligence stack — from signal ingestion to explainable decision output.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((c) => (
            <div key={c.title} className="bg-[#0d0a1a]/80 border border-violet-500/10 rounded-xl p-5">
              <c.icon className="w-5 h-5 text-violet-400 mb-3" />
              <h3 className="text-[14px] font-semibold text-violet-100 mb-1.5">{c.title}</h3>
              <p className="text-violet-300/40 text-[12.5px] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/capabilities" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-violet-400 hover:text-violet-300 transition-colors">
            See all capabilities <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* Request access CTA */}
      <section className="border-t border-violet-500/10 bg-[#0a0814]/40 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-violet-50 mb-4">Request access to INCA</h2>
          <p className="text-violet-300/40 text-[14px] mb-8 leading-relaxed">
            INCA is available to qualified enterprise teams. Schedule a private walkthrough to understand whether it's the right fit for your operation.
          </p>
          <Link href="/request-access">
            <button className="px-8 py-4 rounded text-[14px] font-bold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors">
              Schedule a private walkthrough
            </button>
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
