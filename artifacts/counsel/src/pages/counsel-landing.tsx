import { useState } from "react";
import { Link } from "wouter";
import {
  Scale,
  Gavel,
  FileText,
  AlertTriangle,
  Network,
  Activity,
  ChevronRight,
  ShieldCheck,
  Clock,
  TrendingUp,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { ContactModal } from "@szl-holdings/shared-ui/contact-modal";
import { NewsletterSubscribe } from "@szl-holdings/shared-ui/newsletter-subscribe";

const CORE_VIEWS = [
  {
    icon: Briefcase,
    title: "Matter Overview",
    desc: "Every active matter on a single command surface — phase, exposure, owner, and the next decision the GC actually needs to make.",
    color: "text-violet-400",
  },
  {
    icon: Clock,
    title: "Obligation Timeline",
    desc: "Every contractual and regulatory deadline mapped against ownership, dependencies, and the consequence of missing it.",
    color: "text-amber-400",
  },
  {
    icon: Network,
    title: "Dependency Graph",
    desc: "Cross-matter dependencies — counterparties, contracts, and obligations that move together — rendered as a graph instead of a spreadsheet.",
    color: "text-fuchsia-400",
  },
  {
    icon: AlertTriangle,
    title: "Risk Exposure Desk",
    desc: "Quantified legal exposure per matter, per business unit — what could go wrong, how much it costs, who decides next.",
    color: "text-red-400",
  },
];

const EXPOSURE_DEMO = [
  { matter: "Project Halcyon · M&A diligence", exposure: "$3.2M", status: "obligation gap", severity: "critical", next: "Counter-warranty draft · 4 days to signing" },
  { matter: "Indigo IP enforcement", exposure: "$1.8M", status: "decision required", severity: "high", next: "Approve injunction filing · GC sign-off" },
  { matter: "Aurora supply contract", exposure: "$0.9M", status: "under negotiation", severity: "medium", next: "Counter-redline · response within 48h" },
  { matter: "Beacon employment claim", exposure: "$0.5M", status: "monitoring", severity: "info", next: "Mediation scheduled · evidence packet ready" },
];

const SEVERITY_STYLE: Record<string, string> = {
  critical: "text-red-300 bg-red-500/15 border-red-500/30",
  high: "text-orange-300 bg-orange-500/10 border-orange-500/25",
  medium: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  info: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
};

const WHAT_IT_SOLVES = [
  "Matter status that lives in email threads instead of a system of record",
  "Obligations buried in PDFs that surface only after the deadline passes",
  "Cross-matter dependencies that no one notices until they collide",
  "Outside counsel spend with no link to the matter outcome it produced",
  "Legal exposure that is felt by the business but never quantified",
  "Approval chains that stall because the next decision has no owner",
  "Board reporting that summarizes activity instead of risk and outcome",
  "Privilege and audit trails reconstructed by hand under pressure",
];

export default function CounselLandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0614] text-violet-50 overflow-x-hidden">
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[420px] bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute top-2/3 right-1/4 w-64 h-64 bg-fuchsia-500/5 rounded-full blur-2xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 1200 600" aria-hidden="true">
            <g stroke="rgba(139,92,246,0.7)" strokeWidth="0.5" fill="none">
              {Array.from({ length: 13 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i * 50} x2={1200} y2={i * 50} strokeDasharray="2 10" />
              ))}
              {Array.from({ length: 25 }, (_, i) => (
                <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={600} strokeDasharray="2 10" />
              ))}
            </g>
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm font-medium text-violet-300/60">Counsel Legal Matter Command · Powered by Alloy</span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold text-violet-50 leading-tight mb-6">
            Turn matters, obligations,
            <br />
            <span className="text-violet-400">and legal exposure into command.</span>
          </h1>

          <p className="text-lg text-violet-200/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Counsel is a legal matter command platform for general counsel and legal ops who need more than a matter management tool. See exposure across every matter, the obligations that depend on each other, and the next decision someone has to make this week.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => setDemoOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-400 text-[#0a0614] font-semibold rounded-xl transition-all text-sm"
            >
              Request a Pilot <ChevronRight className="w-4 h-4" />
            </button>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-6 py-3 bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 text-violet-200 font-medium rounded-xl transition-all text-sm">
                Open Matter Command <Activity className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: Briefcase, label: "26 active matters" },
              { icon: Clock, label: "12 obligations in 30 days" },
              { icon: AlertTriangle, label: "$6.4M exposure tracked" },
              { icon: ShieldCheck, label: "Privilege chain enforced" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs text-violet-400/40">
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-[#06040f] border-y border-violet-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono text-violet-400/40 uppercase tracking-widest mb-3">What Counsel Does</p>
            <h2 className="font-display text-3xl font-bold text-violet-50 mb-3">Legal matter command. Not a matter database.</h2>
            <p className="text-violet-300/55 mt-3 max-w-xl mx-auto text-sm">
              Most legal tools stop at storage. Counsel carries every matter through to the obligation it creates, the exposure it represents, and the decision that has to land before the next deadline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Briefcase, title: "Matter Overview", desc: "Every active matter on one command surface — phase, exposure, owner, and the next decision required.", color: "text-violet-400" },
              { icon: Clock, title: "Obligation Timeline", desc: "Contractual and regulatory deadlines mapped against ownership and the consequence of missing them.", color: "text-amber-400" },
              { icon: Network, title: "Dependency Graph", desc: "Cross-matter dependencies rendered as a graph — counterparties and obligations that move together.", color: "text-fuchsia-400" },
              { icon: AlertTriangle, title: "Risk Exposure Desk", desc: "Quantified legal exposure per matter and per business unit — dollarized and tied to decision owners.", color: "text-red-400" },
              { icon: TrendingUp, title: "Counsel Performance", desc: "Outside counsel spend tied to matter outcome, cycle time, and recovered or avoided exposure.", color: "text-emerald-400" },
              { icon: ShieldCheck, title: "Trust & Provenance", desc: "Every action signed, attributable, and privilege-aware — the audit trail boards and regulators expect.", color: "text-violet-400" },
            ].map((feature) => (
              <div key={feature.title} className="bg-[#120a24]/80 border border-violet-500/10 rounded-xl p-5 hover:border-violet-500/25 transition-all">
                <feature.icon className={cn("w-5 h-5 mb-3", feature.color)} />
                <h3 className="text-sm font-bold text-violet-100 mb-2">{feature.title}</h3>
                <p className="text-[11px] text-violet-300/55 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono text-violet-400/40 uppercase tracking-widest mb-3">Core Views</p>
          <h2 className="font-display text-3xl font-bold text-violet-50">Four command surfaces. One legal platform.</h2>
          <p className="text-violet-300/55 mt-3 max-w-xl mx-auto text-sm">Each view is purpose-built for a specific decision the GC and legal ops actually have to make.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CORE_VIEWS.map((view) => (
            <div key={view.title} className="bg-[#120a24]/80 border border-violet-500/10 rounded-xl p-6">
              <view.icon className={cn("w-5 h-5 mb-3", view.color)} />
              <h3 className="text-sm font-bold text-violet-100 mb-2">{view.title}</h3>
              <p className="text-[12px] text-violet-300/60 leading-relaxed">{view.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 bg-[#06040f] border-y border-violet-500/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-mono text-violet-400/40 uppercase tracking-widest mb-3">Live Exposure Demo</p>
            <h2 className="font-display text-3xl font-bold text-violet-50 mb-3">Every matter is exposure with an owner.</h2>
            <p className="text-violet-300/55 max-w-xl mx-auto text-sm">A snapshot from the Counsel exposure desk — every matter quantified, scored, and routed to the next decision.</p>
          </div>

          <div className="bg-[#120a24]/90 border border-violet-500/15 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-violet-500/10 bg-[#1a0e30]/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-violet-300/70">Live · Exposure Desk</span>
              </div>
              <span className="text-[10px] font-mono text-violet-400/40">Total tracked exposure · $6.4M</span>
            </div>
            <div className="divide-y divide-violet-500/5">
              {EXPOSURE_DEMO.map((row) => (
                <div key={row.matter} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5">
                  <div className="col-span-4 text-[12px] text-violet-100/85 leading-snug">{row.matter}</div>
                  <div className="col-span-2 text-right text-[12px] font-mono text-violet-200/85">{row.exposure}</div>
                  <div className="col-span-2">
                    <span className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border", SEVERITY_STYLE[row.severity])}>
                      {row.status}
                    </span>
                  </div>
                  <div className="col-span-4 text-[11px] text-violet-300/55 leading-snug text-right">{row.next}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono text-violet-400/40 uppercase tracking-widest mb-3">What It Solves</p>
          <h2 className="font-display text-3xl font-bold text-violet-50 mb-3">Eight problems. One legal command.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WHAT_IT_SOLVES.map((tile) => (
            <div key={tile} className="bg-[#120a24]/80 border border-violet-500/10 rounded-xl p-4">
              <div className="w-3 h-3 rounded-full border-2 border-violet-400/30 mb-3" />
              <p className="text-[12px] text-violet-200/65 leading-snug">{tile}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 bg-[#06040f] border-y border-violet-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono text-violet-400/40 uppercase tracking-widest mb-3">Why It Matters</p>
            <h2 className="font-display text-3xl font-bold text-violet-50 mb-4">From matter management to legal command.</h2>
            <p className="text-violet-300/55 text-sm max-w-2xl mx-auto leading-relaxed">
              Every general counsel already has matters. Very few can show the board which matters represent the most exposure, which obligations land next, and which decisions are stalled because no one owns the next move. That is the gap Counsel closes.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { metric: "$6.4M", label: "exposure quantified & owned", trend: "across 26 active matters" },
              { metric: "12", label: "obligations landing in 30 days", trend: "tracked to deadline & owner" },
              { metric: "31%", label: "outside counsel spend reduced", trend: "↓ vs prior fiscal year" },
              { metric: "100%", label: "privilege chain attestable", trend: "every action signed and traceable" },
            ].map((o) => (
              <div key={o.metric} className="text-center">
                <p className="text-3xl font-bold font-display text-violet-300 mb-1">{o.metric}</p>
                <p className="text-[11px] text-violet-300/55 leading-relaxed mb-1">{o.label}</p>
                <p className="text-[9px] font-mono text-violet-400/30">{o.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-[#0a0614] border-t border-violet-500/5">
        <div className="max-w-[560px] mx-auto">
          <NewsletterSubscribe
            utmSource="counsel"
            variant="banner"
            heading="Legal command essays, straight to your inbox"
            subheading="SZL Command essays on legal operations, exposure quantification, and the decision infrastructure behind Counsel — delivered weekly."
          />
        </div>
      </section>

      <section className="px-6 py-20 bg-[#06040f] border-t border-violet-500/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-mono text-violet-400/40 uppercase tracking-widest mb-3">Powered by Alloy · SZL Holdings</p>
          <h2 className="font-display text-3xl font-bold text-violet-50 mb-4">Request a Pilot</h2>
          <p className="text-violet-300/55 mb-8 text-sm leading-relaxed max-w-xl mx-auto">
            Counsel is built for general counsel and legal ops who need to command exposure, not just track matters. Request a pilot — we will walk through the full command center against your active matter book.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => setDemoOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-400 text-[#0a0614] font-semibold rounded-xl transition-all text-sm"
            >
              Request a Pilot <Gavel className="w-4 h-4" />
            </button>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-6 py-3 border border-violet-500/20 hover:border-violet-500/40 text-violet-200 font-medium rounded-xl transition-all text-sm">
                Open Matter Command <FileText className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <p className="text-[10px] font-mono text-violet-400/30 mt-6 inline-flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" />
            Pilot pricing tied to matter book size · onboard in two weeks
          </p>
        </div>
      </section>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="counsel"
        subtitle="Counsel Legal Matter Command"
      />
    </div>
  );
}
