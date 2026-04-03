import { Scale, Eye, Shield, TrendingUp, DollarSign, FileCheck, MessageSquare, ArrowRight, CheckCircle, Cpu, Building2, MapPin, Clock, AlertTriangle, Lock, Server } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";

const PILLARS = [
  { icon: Eye, name: "Posture", desc: "Liability, coverage, venue, and opposing counsel posture assessment. Insurer behavior profiling and adjuster pattern intelligence." },
  { icon: FileCheck, name: "Readiness", desc: "Demand, discovery, deposition, mediation, and trial readiness scoring with gap detection and checklist enforcement." },
  { icon: Shield, name: "Integrity", desc: "Source lineage confidence, privilege risk, deadline completeness, treatment gap detection, and conflicting fact identification." },
  { icon: TrendingUp, name: "Strategy", desc: "Next best actions, leverage points, witness/document gaps, negotiation timing, and escalation recommendations." },
  { icon: DollarSign, name: "Money", desc: "Settlement band forecasting, lien exposure, damages completeness, reserve movement tracking, and offer trajectory analysis." },
  { icon: Scale, name: "Governance", desc: "Approval state, AI usage trace, user/role attribution, export safety, audit packet completeness, and client-consent checkpoints." },
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
          Legal Business Observability.<br />
          Governed Matter Execution.
        </h1>
        <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-3">
          PRISM Counsel turns fragmented claim, matter, document, communication, and deadline signals into governed legal action and outcome forecasting. Built for plaintiff-side litigation teams operating in New York insurance litigation.
        </p>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed mb-8">
          A command layer above case management, email, documents, claims feeds, and Microsoft 365. Not a chatbot. Not a case management clone. A matter command system.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/prism-counsel">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 hover:bg-[#d4a054]/20 transition-colors cursor-pointer">
              Enter Command Center <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <Link href="/prism-counsel/ny">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer">
              NY Litigation Command
            </span>
          </Link>
          <Link href="/prism-counsel/trust">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer">
              Trust Center
            </span>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Why It Matters</h2>
        <p className="text-sm text-slate-400 max-w-3xl mb-8 leading-relaxed">
          Plaintiff-side litigation teams manage dozens of matters across insurance carriers, courts, adjusters, and deadlines. Critical signals are buried in email, scattered across documents, and tracked in spreadsheets. Deadlines get missed. Demand packets go out incomplete. Insurer patterns go unnoticed. PRISM Counsel makes every signal visible, every deadline tracked, and every action governed.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Clock, title: "Deadline Intelligence", desc: "NY Insurance Regulation 68 compliance clocks, statute of limitations tracking, and escalation ladders. Never miss a critical deadline." },
            { icon: Building2, title: "Insurer Behavior Intel", desc: "Carrier response patterns, adjuster profiles, offer trajectories, and silence window tracking. Know how your opposing party operates." },
            { icon: MapPin, title: "Venue Intelligence", desc: "Court and part profiles, scheduling patterns, milestone velocity, ADR tendencies, and staffing guidance. Plan for the venue you are in." },
          ].map((item, i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
              <item.icon className="w-5 h-5 text-[#d4a054] mb-3" />
              <h3 className="text-sm font-semibold text-slate-200 mb-1">{item.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
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
        <div className="rounded-lg border border-white/[0.06] p-8" style={{ background: "#0c1220" }}>
          <h2 className="text-xl font-semibold text-slate-100 mb-3">New York Insurance Litigation Wedge</h2>
          <p className="text-sm text-slate-400 mb-6 max-w-3xl leading-relaxed">
            PRISM Counsel starts with New York insurance litigation — plaintiff-side auto, no-fault, bodily injury, premises liability, and coverage-linked disputes. The platform encodes NY-specific rules (11 NYCRR Part 65), compliance clocks, court scheduling patterns, and insurer behavior intelligence.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              "PIP / no-fault claim clock tracking (acknowledgement, verification, pay/deny)",
              "NY Insurance Regulation 68 compliance monitoring",
              "Arbitration packet readiness assessment and evidence-lock risk",
              "Insurer response cadence and silence window tracking",
              "Medical bill submission deadline enforcement",
              "Venue and part velocity forecasting for NY courts",
              "Lost wage claim documentation workflow",
              "Notice of claim (GML § 50-e) deadline management",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#d4a054] mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">How Lyte + Alloy Power It</h2>
        <p className="text-sm text-slate-500 mb-8">PRISM Counsel is built on the Lyte + Alloy platform spine — not bolted on as a side project</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Lyte — Command Surface</h3>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>PRISM scoring framework applied to legal matter health</li>
              <li>Dashboard, watchlist, and forecast surfaces</li>
              <li>Role-based views for partners, attorneys, and paralegals</li>
              <li>Real-time signal aggregation and visualization</li>
            </ul>
          </div>
          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Alloy — Execution Fabric</h3>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>Workflow orchestration for approval chains</li>
              <li>Audit trail infrastructure for legal accountability</li>
              <li>Connector framework for Microsoft 365 and case management</li>
              <li>AI governance with source tracing and defensibility scoring</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">What PRISM Counsel Delivers</h2>
        <p className="text-sm text-slate-500 mb-8">Operational visibility for every stage of matter lifecycle</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            "Matter health scoring with pillar-level breakdown",
            "Settlement range forecasting with contributing signals",
            "Medical chronology with treatment gap detection",
            "Offer / reserve movement tracking and trajectory analysis",
            "Deadline risk queue with compliance clock enforcement",
            "Demand readiness scoring with missing-item detection",
            "Lien exposure tracking and resolution status",
            "Discovery tracker with deadline compliance",
            "Insurer behavior profiling with response pattern analysis",
            "Venue and part intelligence with velocity forecasting",
            "AI recommendations with source citations and confidence scoring",
            "Role-based approval workflows for consequential actions",
            "No-fault PIP claim tracking with Regulation 68 clocks",
            "Communication silence window monitoring and escalation",
            "Source-grounded Copilot with privilege-aware retrieval",
            "Immutable audit trail with export safety controls",
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
              "Surface deadline risks and clock violations in Teams",
              "Source-grounded demand drafting support in Word",
              "Permission-aware matter search across SharePoint",
              "Approval requests and deadline alerts via Teams cards",
              "Calendar-synced deadline and conference management",
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
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <Lock className="w-5 h-5 text-[#d4a054] mb-3" />
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Trust & Governance</h3>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>Human approval on every consequential action</li>
              <li>Source-grounded AI with defensibility scoring</li>
              <li>Privilege-aware architecture</li>
              <li>Immutable audit trail</li>
              <li>Role-based access control</li>
              <li>Export safety with redaction controls</li>
            </ul>
          </div>
          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <AlertTriangle className="w-5 h-5 text-[#d4a054] mb-3" />
            <h3 className="text-sm font-semibold text-slate-200 mb-2">This Is Not</h3>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>A generic legal chatbot or drafting toy</li>
              <li>A Westlaw or Lexis replacement</li>
              <li>A basic case management clone</li>
              <li>An autonomous filing system</li>
              <li>A source of legal advice</li>
              <li>A system that makes decisions for you</li>
            </ul>
          </div>
          <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <Server className="w-5 h-5 text-[#d4a054] mb-3" />
            <h3 className="text-sm font-semibold text-slate-200 mb-2">This Is</h3>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li>A matter command system</li>
              <li>A deadline intelligence engine</li>
              <li>An insurer behavior intelligence layer</li>
              <li>A forecasting and readiness platform</li>
              <li>A governed action system with human approval</li>
              <li>A Microsoft-native legal operating layer</li>
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
