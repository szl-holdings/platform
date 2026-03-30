import { Link } from "wouter";
import { ChevronRight, Shield, Lock, Eye, Database } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

const pillars = [
  { icon: Lock, title: "Data encryption", desc: "All data encrypted at rest and in transit. Intelligence signals, findings, and investigation records protected with industry-standard encryption." },
  { icon: Shield, title: "Role-based access", desc: "Granular permissions model. Analysts, investigators, compliance reviewers, and executives see only what's relevant to their function." },
  { icon: Database, title: "Tenant isolation", desc: "Complete multi-tenant isolation. Your intelligence data is never commingled with another organisation's data." },
  { icon: Eye, title: "Immutable audit trail", desc: "Every action — signal ingestion, triage decision, investigation update, user access — is logged immutably and available for review." },
];

export default function IncaSecurityPage() {
  return (
    <div className="min-h-screen bg-[#060410] text-violet-50">
      <MarketingNav />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-14">
          <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Security</p>
          <h1 className="text-3xl md:text-4xl font-bold text-violet-50 mb-4">Security is the baseline, not a feature</h1>
          <p className="text-violet-300/40 text-[15px] max-w-2xl leading-relaxed">
            INCA handles sensitive intelligence data. Security, isolation, and auditability are built into the architecture — not layered on afterwards.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          {pillars.map((p) => (
            <div key={p.title} className="bg-[#0d0a1a]/80 border border-violet-500/10 rounded-xl p-6">
              <p.icon className="w-5 h-5 text-violet-400 mb-3" />
              <h3 className="text-[15px] font-semibold text-violet-100 mb-2">{p.title}</h3>
              <p className="text-violet-300/40 text-[13px] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="border border-violet-500/10 rounded-2xl p-8 mb-10">
          <h2 className="text-[18px] font-bold text-violet-100 mb-3">Regulatory readiness</h2>
          <p className="text-violet-300/40 text-[13.5px] leading-relaxed mb-3">
            INCA is designed for organisations that operate under regulatory frameworks requiring documented intelligence workflows, traceable decision records, and auditable data handling.
          </p>
          <p className="text-violet-300/40 text-[13.5px] leading-relaxed">
            Every investigation has a full audit trail. Every model output has an evidence chain. Every user action is logged. This is the architecture required for compliance — not an optional add-on.
          </p>
        </div>

        <div className="text-center">
          <Link href="/request-access">
            <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded text-[14px] font-bold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors">
              Discuss security requirements <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
