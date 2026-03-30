import { Link } from "wouter";
import { ChevronRight, Brain, Eye, Activity, Shield, Search, BarChart3 } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

const modules = [
  { icon: Search, title: "Signal Intelligence", desc: "Structured ingestion, enrichment, and prioritisation of intelligence signals across enterprise data sources.", tag: "Core" },
  { icon: Brain, title: "AI Triage Engine", desc: "Machine-assisted classification and prioritisation — so analysts spend time on what matters, not on noise filtering.", tag: "Core" },
  { icon: Eye, title: "Explainability Layer", desc: "Every model output includes traceable reasoning. Not just a confidence score — a chain of evidence you can review.", tag: "Core" },
  { icon: Activity, title: "Findings & Investigations", desc: "Structured workflows to triage, escalate, and resolve findings. From raw signal to closed investigation.", tag: "Core" },
  { icon: Shield, title: "Audit Trail", desc: "Full provenance from signal to decision. Required for regulatory review and post-incident accountability.", tag: "Core" },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Intelligence reporting, trend analysis, and operational dashboards for security and research leadership.", tag: "Premium" },
];

export default function IncaPlatformPage() {
  return (
    <div className="min-h-screen bg-[#060410] text-violet-50">
      <MarketingNav />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/6 mb-6">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-medium text-violet-400/70">Platform Overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-violet-50 mb-4">Intelligence infrastructure for complex operations</h1>
          <p className="text-violet-300/50 text-[15px] max-w-2xl mx-auto leading-relaxed">
            INCA is designed for operations where the intelligence cycle has to be auditable, explainable, and traceable — from first signal to final decision.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          {modules.map((m) => (
            <div key={m.title} className="bg-[#0d0a1a]/80 border border-violet-500/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <m.icon className="w-5 h-5 text-violet-400" />
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  m.tag === "Core"
                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                    : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                }`}>{m.tag}</span>
              </div>
              <h3 className="text-[15px] font-semibold text-violet-100 mb-2">{m.title}</h3>
              <p className="text-violet-300/40 text-[13px] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center bg-[#0d0a1a]/60 border border-violet-500/10 rounded-2xl p-10">
          <h2 className="text-[20px] font-bold text-violet-100 mb-3">Schedule a private walkthrough</h2>
          <p className="text-violet-300/40 text-[13px] mb-6">INCA is available by request to qualified enterprise teams.</p>
          <Link href="/request-access">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded text-[13px] font-bold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors">
              Request access <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
