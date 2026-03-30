import { Link } from "wouter";
import { ChevronRight, Brain, Eye, Activity, Shield, Search, BarChart3, Network, AlertTriangle, Database } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

const groups = [
  {
    group: "Signal & Triage",
    items: [
      { icon: Search, title: "Signal ingestion", desc: "Multi-source signal ingestion with structured enrichment and deduplication." },
      { icon: Brain, title: "AI prioritisation", desc: "Machine-assisted signal ranking so analysts focus on highest-impact items." },
      { icon: AlertTriangle, title: "Alert correlation", desc: "Cross-signal correlation to identify coordinated patterns and reduce alert noise." },
    ],
  },
  {
    group: "Intelligence & Findings",
    items: [
      { icon: Eye, title: "Explainable outputs", desc: "Every intelligence output includes traceable reasoning chains — not just a score." },
      { icon: Network, title: "Finding management", desc: "Structured findings workflow from identification through to resolution and close." },
      { icon: Activity, title: "Investigation tracking", desc: "Multi-stage investigation management with collaboration, notes, and evidence linking." },
    ],
  },
  {
    group: "Governance & Security",
    items: [
      { icon: Shield, title: "Multi-tenant isolation", desc: "Complete data isolation between organisations. No cross-tenant data leakage." },
      { icon: Database, title: "Audit trail", desc: "Full provenance log from signal ingestion to decision. Immutable and exportable." },
      { icon: BarChart3, title: "Compliance reporting", desc: "Pre-built reports for security compliance, regulatory review, and executive briefing." },
    ],
  },
];

export default function IncaCapabilitiesPage() {
  return (
    <div className="min-h-screen bg-[#060410] text-violet-50">
      <MarketingNav />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-14">
          <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Capabilities</p>
          <h1 className="text-3xl md:text-4xl font-bold text-violet-50 mb-4">The full intelligence stack</h1>
          <p className="text-violet-300/40 text-[15px] max-w-2xl leading-relaxed">
            From signal ingestion to explainable decision output — INCA covers the complete intelligence workflow for enterprise teams.
          </p>
        </div>

        <div className="space-y-14">
          {groups.map((group) => (
            <div key={group.group}>
              <h2 className="text-[12px] font-semibold text-violet-400/60 uppercase tracking-[0.12em] mb-5">{group.group}</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {group.items.map((item) => (
                  <div key={item.title} className="bg-[#0d0a1a]/80 border border-violet-500/10 rounded-xl p-5">
                    <item.icon className="w-4 h-4 text-violet-400 mb-3" />
                    <h3 className="text-[14px] font-semibold text-violet-100 mb-1.5">{item.title}</h3>
                    <p className="text-violet-300/40 text-[12px] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link href="/request-access">
            <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded text-[14px] font-bold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors">
              Request access <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
