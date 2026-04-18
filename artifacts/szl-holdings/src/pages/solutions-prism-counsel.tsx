import { Scale, Eye, Shield, TrendingUp, DollarSign, FileCheck, MessageSquare, ArrowRight, CheckCircle, Cpu, Building2, MapPin, Clock, AlertTriangle, Lock, Server } from "lucide-react";
import { Link } from "wouter";
import { m } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

const PILLARS = [
  { icon: Eye, name: "Posture", desc: "Liability, coverage, venue, and opposing counsel posture assessment. Insurer behavior profiling and adjuster pattern intelligence." },
  { icon: FileCheck, name: "Readiness", desc: "Demand, discovery, deposition, mediation, and trial readiness scoring with gap detection and checklist enforcement." },
  { icon: Shield, name: "Integrity", desc: "Source lineage confidence, privilege risk, deadline completeness, treatment gap detection, and conflicting fact identification." },
  { icon: TrendingUp, name: "Strategy", desc: "Next best actions, leverage points, witness/document gaps, negotiation timing, and escalation recommendations." },
  { icon: DollarSign, name: "Money", desc: "Settlement band forecasting, lien exposure, damages completeness, reserve movement tracking, and offer trajectory analysis." },
  { icon: Scale, name: "Governance", desc: "Approval state, AI usage trace, user/role attribution, export safety, audit packet completeness, and client-consent checkpoints." },
];

const USE_CASES = [
  {
    label: "Demand readiness",
    title: "Deadline approaching — attorney reviews demand readiness before filing",
    role: "Paralegal → Associate Attorney → Partner",
    steps: [
      { signal: true, text: "Compliance clock fires — demand deadline 14 days out on Ramirez v. Empire Transit, matter readiness score 61/100" },
      { text: "Attorney opens matter command surface: PRISM scoring surfaces two critical gaps — incomplete medical chronology and missing lost wage documentation" },
      { text: "Alloy routes gap remediation tasks to paralegal: medical records request to Dr. Okonkwo's office, W-2 documentation workflow initiated" },
      { text: "Partner reviews completed demand package — readiness score rises to 94/100, approves filing via the governed approval gate" },
      { proof: true, text: "Proof Chain records the readiness state at filing: which records were reviewed, who approved the package, and when the decision was made" },
    ],
  },
  {
    label: "Insurer behavior",
    title: "Silence window detected — attorney adjusts strategy before offer window closes",
    role: "Associate Attorney → Supervising Partner → Client",
    steps: [
      { signal: true, text: "Signal fires — adjuster at Empire Mutual has gone silent for 31 days, outside their documented response pattern for bodily injury files" },
      { text: "PRISM Counsel surfaces insurer behavior intel: this adjuster typically responds within 18 days; silence at 30+ days preceded reserve increases in 4 of 6 prior matters" },
      { text: "Settlement band forecast updated — AI recommendation surfaces a narrower offer window based on reserve movement pattern, with source citations" },
      { text: "Supervising partner reviews recommendation and approves accelerated outreach strategy — deadline for response demand set, client notified" },
      { proof: true, text: "Proof Chain logs the signal, AI recommendation, source citations, and partner approval — defensible record for any subsequent dispute over negotiation conduct" },
    ],
  },
  {
    label: "Matter intake",
    title: "New matter opened — compliance clocks started, insurer profile attached, attorney assigned",
    role: "Intake Coordinator → Attorney → Partner",
    steps: [
      { signal: true, text: "New matter intake: Chen v. Metro Logistics — no-fault PIP claim, date of loss March 4, carrier is National Indemnity Group" },
      { text: "PRISM Counsel scores the matter across six pillars: Posture 70, Readiness 45, Integrity 80, Strategy 55, Money 60, Governance 100" },
      { text: "Compliance clocks started automatically: 30-day acknowledgement clock (NY Reg 68), 15-day verification clock, and notice of claim deadline entered in calendar" },
      { text: "National Indemnity Group insurer profile attached — adjuster behavior patterns, average time-to-offer, and prior matter outcomes surfaced" },
      { proof: true, text: "Alloy routes matter to assigned attorney with full intake packet; Proof Chain records the intake state, clock start timestamps, and routing decision" },
    ],
  },
];

function UseCaseLane({ useCase, delay }: { useCase: typeof USE_CASES[0]; delay: number }) {
  const gold = "#d4a054";
  return (
    <m.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.42, delay }}
      className="rounded-lg border border-white/[0.06]"
      style={{ background: "#0c1220", padding: "clamp(1.5rem,3vw,2rem)", display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <div>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: gold, opacity: 0.85 }}>{useCase.label}</span>
        <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.016em", lineHeight: 1.3, marginTop: "0.4rem", marginBottom: "0.375rem", color: "#e2e8f0" }}>{useCase.title}</h3>
        <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.625rem", color: "rgba(148,163,184,0.6)", letterSpacing: "0.06em" }}>{useCase.role}</p>
      </div>
      <ol style={{ display: "flex", flexDirection: "column", gap: "0", listStyle: "none", margin: 0, padding: 0 }}>
        {useCase.steps.map((step, i) => (
          <li key={i} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: step.signal ? `rgba(212,160,84,0.14)` : step.proof ? `rgba(52,211,153,0.10)` : "rgba(255,255,255,0.04)",
                border: step.signal ? `1px solid rgba(212,160,84,0.38)` : step.proof ? `1px solid rgba(52,211,153,0.28)` : "1px solid rgba(255,255,255,0.08)",
                fontSize: "0.6rem", fontWeight: 700, color: step.signal ? gold : step.proof ? "#34d399" : "#64748b",
                fontFamily: "var(--font-mono, monospace)",
              }}>
                {i + 1}
              </div>
              {i < useCase.steps.length - 1 && (
                <div style={{ width: "1px", height: "1.5rem", background: "rgba(255,255,255,0.06)", margin: "0.25rem 0" }} />
              )}
            </div>
            <div style={{ paddingTop: "0.2rem" }}>
              <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: step.signal ? "#e2e8f0" : step.proof ? "#6ee7b7" : "#94a3b8" }}>
                {step.signal && <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: gold, marginRight: "0.4rem" }}>Signal</span>}
                {step.proof && <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "#34d399", marginRight: "0.4rem" }}>Proof Chain</span>}
                {step.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </m.div>
  );
}

export default function SolutionsPrismCounselPage() {
  usePageMeta({
    title: "PRISM Counsel — Legal Intelligence · SZL Holdings",
    description: "AI-assisted legal operations with approval gates, proof chain, and immutable audit trail. PRISM Counsel is the legal intelligence domain pack — built on the same governance infrastructure as every SZL product.",
    canonical: "https://szlholdings.com/solutions/prism-counsel",
    ogImage: "https://szlholdings.com/og/og-prism-counsel.jpg",
  });

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <SiteNav />

      <section className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-6 h-6 text-[#d4a054]" />
          <span className="text-[11px] font-medium text-[#d4a054] uppercase tracking-widest">PRISM Counsel</span>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: "rgba(212,160,84,0.12)", border: "1px solid rgba(212,160,84,0.25)", fontFamily: "var(--font-mono, monospace)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#d4a054" }}>Beta</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
          Legal Decision Intelligence.<br />
          Governed Matter Execution.
        </h1>
        <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-3">
          PRISM Counsel turns fragmented claim, matter, document, communication, and deadline signals into governed legal action and outcome forecasting. Built for plaintiff-side litigation teams operating in New York insurance litigation.
        </p>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed mb-8">
          A command layer above case management, email, documents, claims feeds, and Microsoft 365. Not a chatbot. Not a case management clone. A matter command system.
        </p>
        <div className="flex items-center gap-3">
          <a href="/aegis/">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 hover:bg-[#d4a054]/20 transition-colors cursor-pointer">
              Enter Command Center <ArrowRight className="w-4 h-4" />
            </span>
          </a>
          <a href="/aegis/">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer">
              NY Litigation Command
            </span>
          </a>
          <Link href="/solutions/prism-counsel/trust">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer">
              Trust & Governance
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

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.04]">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Scenarios</h2>
        <p className="text-sm text-slate-400 max-w-3xl mb-2 leading-relaxed">
          A day in the life of a plaintiff-side litigation team.
        </p>
        <p className="text-[11px] text-slate-500 mb-8">
          Signal fires. Attorney acts. Decision is captured. Every consequential legal workflow follows the same governed loop — deadline, demand, intake, or settlement.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "1.25rem" }}>
          {USE_CASES.map((uc, i) => (
            <UseCaseLane key={uc.label} useCase={uc} delay={i * 0.08} />
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
