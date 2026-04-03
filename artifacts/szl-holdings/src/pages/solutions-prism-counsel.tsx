import { Scale, Eye, Shield, TrendingUp, DollarSign, FileCheck, MessageSquare, ArrowRight, CheckCircle, Cpu } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";

const PILLARS = [
  { icon: Eye, name: "Posture", desc: "Liability, coverage, venue, and opposing counsel posture assessment across every matter" },
  { icon: FileCheck, name: "Readiness", desc: "Demand, discovery, deposition, mediation, and trial readiness scoring with gap detection" },
  { icon: Shield, name: "Integrity", desc: "Source lineage confidence, privilege risk, deadline completeness, and conflicting fact detection" },
  { icon: TrendingUp, name: "Strategy", desc: "Next best actions, leverage points, witness/document gaps, and negotiation timing" },
  { icon: DollarSign, name: "Money", desc: "Settlement band forecasting, lien exposure, damages completeness, and reserve movement tracking" },
  { icon: Scale, name: "Governance", desc: "Approval state, AI usage trace, user/role attribution, and client-consent checkpoints" },
];

export default function SolutionsPrismCounselPage() {
  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <SiteNav />

      <section className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-6 h-6 text-[#d4a054]" />
          <span className="text-[11px] font-medium text-[#d4a054] uppercase tracking-widest">PRISM Counsel</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
          Matter Observability.<br />
          Governed Legal Execution.
        </h1>
        <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-8">
          PRISM Counsel turns fragmented matter, claim, document, and communication signals into governed legal action and outcome forecasting. Built for plaintiff-side litigation teams who demand visibility, accountability, and execution precision.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/prism-counsel">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 hover:bg-[#d4a054]/20 transition-colors cursor-pointer">
              Enter Command Center <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <Link href="/prism-counsel/trust">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer">
              Trust & Governance
            </span>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Six Observability Pillars</h2>
        <p className="text-sm text-slate-500 mb-8">Every matter scored across six dimensions of operational health</p>
        <div className="grid grid-cols-3 gap-4">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
                <Icon className="w-5 h-5 text-[#d4a054] mb-3" />
                <h3 className="text-sm font-semibold text-slate-200 mb-1">{p.name}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">What PRISM Counsel Delivers</h2>
        <p className="text-sm text-slate-500 mb-8">Operational visibility for every stage of matter lifecycle</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            "Matter health scoring with pillar-level breakdown",
            "Settlement range forecasting with contributing signals",
            "Medical chronology and treatment gap detection",
            "Offer / reserve movement tracking and trajectory analysis",
            "Deadline risk queue with countdown and priority",
            "Demand readiness scoring with missing-item detection",
            "Lien exposure tracking and resolution status",
            "Discovery tracker with deadline compliance",
            "Deposition preparation with issue detection",
            "AI recommendations with source citations and confidence",
            "Role-based approval workflows for consequential actions",
            "Immutable audit trail for every action and output",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 py-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#d4a054] mt-0.5 flex-shrink-0" />
              <span className="text-xs text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="rounded-lg border border-white/[0.06] p-8" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-[#d4a054]" />
            <h2 className="text-xl font-semibold text-slate-100">Copilot-Native</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 max-w-2xl">
            Built for Microsoft environments. PRISM Counsel integrates with Outlook, Teams, SharePoint, and Word through Copilot connectors — bringing matter intelligence directly into the tools attorneys already use.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              "Summarize insurer correspondence from Outlook",
              "Surface deadline risks in Teams channels",
              "Source-grounded drafting support in Word",
              "Permission-aware search across matter data",
              "Matter alerts and approval nudges in Teams",
              "Calendar-synced deadline management",
            ].map((use, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                <MessageSquare className="w-3 h-3 text-[#4a90b8] flex-shrink-0" />
                {use}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">This Is Not</h2>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>A generic legal chatbot or drafting toy</li>
              <li>A Westlaw or Lexis replacement</li>
              <li>A basic case management clone</li>
              <li>An autonomous filing system</li>
              <li>A source of legal advice</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">This Is</h2>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>A command layer for matters, claims, and lawsuit execution</li>
              <li>A system that turns fragmented legal signals into governed action</li>
              <li>A forecasting engine for matter trajectory and settlement readiness</li>
              <li>An accountability tool for legal team execution</li>
              <li>Copilot-native for Microsoft-first legal environments</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <span className="px-3 py-1 rounded text-[10px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
          FUNCTIONAL ALPHA
        </span>
        <p className="text-sm text-slate-500 mt-4 mb-2">Built on the Lyte + Alloy platform spine</p>
        <p className="text-[10px] text-slate-600">SZL Holdings · PRISM Counsel · {new Date().getFullYear()}</p>
      </section>
    </div>
  );
}
