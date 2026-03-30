import { motion as m } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Security", href: "#security" },
  { label: "Insights", href: "#use-cases" },
];

const signalFindings = [
  {
    type: "Threat Signal",
    title: "Coordinated infrastructure reconnaissance detected",
    severity: "High",
    time: "14 min ago",
  },
  {
    type: "Intelligence Finding",
    title: "Anomalous credential access pattern across three tenants",
    severity: "Medium",
    time: "1 hr ago",
  },
  {
    type: "Model Alert",
    title: "Prediction drift detected in classification layer — review required",
    severity: "Low",
    time: "3 hr ago",
  },
  {
    type: "Research Signal",
    title: "Novel attack vector identified in adversarial simulation corpus",
    severity: "High",
    time: "6 hr ago",
  },
];

const severityColors: Record<string, string> = {
  High: "text-red-400 bg-red-400/8 border-red-400/20",
  Medium: "text-amber-400 bg-amber-400/8 border-amber-400/20",
  Low: "text-emerald-400 bg-emerald-400/8 border-emerald-400/20",
};

const capabilities = [
  {
    title: "Signal visibility",
    description: "Unified view of intelligence signals across your enterprise — structured, searchable, and actionable.",
  },
  {
    title: "AI triage",
    description: "Machine-assisted prioritisation of signals so analysts focus on what matters first.",
  },
  {
    title: "Explainability",
    description: "Every model output includes traceable reasoning — not just a score, but why.",
  },
  {
    title: "Traceability",
    description: "Full audit trail from raw signal to final decision. Required for compliance and post-incident review.",
  },
  {
    title: "Response workflows",
    description: "Structured workflows for triaging, escalating, and resolving intelligence findings.",
  },
  {
    title: "Secure architecture",
    description: "Multi-tenant isolation, role-based permissions, and enterprise-grade access controls throughout.",
  },
];

const useCases = [
  {
    audience: "Enterprise security operations",
    description: "Centralise threat intelligence, alert triage, and response workflows across your security operations function.",
  },
  {
    audience: "Cyber intelligence teams",
    description: "Ingest, process, and act on cyber threat intelligence with structured analysis and explainable AI outputs.",
  },
  {
    audience: "Investigations & compliance",
    description: "Traceable decision records and audit trails built for regulatory review and post-incident reporting.",
  },
  {
    audience: "Executive decision support",
    description: "Intelligence summaries and risk dashboards that give leadership the clarity they need to act.",
  },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <m.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0a0814]/95 backdrop-blur-md border-b border-violet-500/10"
    >
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        <a href="/inca/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-violet-500/12 border border-violet-500/25 flex items-center justify-center">
            <span className="text-violet-400 font-bold text-[11px]">I</span>
          </div>
          <span className="font-semibold text-[14px] text-violet-50 tracking-tight">INCA</span>
        </a>
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-violet-300/45 text-[13px] font-medium hover:text-violet-100 transition-colors duration-200">
              {l.label}
            </a>
          ))}
          <a href="#access" className="text-violet-300/45 text-[13px] font-medium hover:text-violet-100 transition-colors">
            Request access
          </a>
          <a href="#access" className="flex items-center gap-1.5 px-4 py-2 rounded text-[13px] font-semibold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors duration-200">
            Schedule a private walkthrough
            <ChevronRight size={13} />
          </a>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-violet-300/60 hover:text-violet-100 transition-colors">
          <span className="sr-only">Menu</span>
          <div className="space-y-1.5">
            <div className="w-5 h-0.5 bg-current" />
            <div className="w-5 h-0.5 bg-current" />
            <div className="w-4 h-0.5 bg-current" />
          </div>
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0814]/97 border-b border-violet-500/10 px-6 py-5 flex flex-col gap-4">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-violet-300/55 text-[15px] font-medium hover:text-violet-100 transition-colors">
              {l.label}
            </a>
          ))}
          <a href="#access" onClick={() => setMobileOpen(false)} className="mt-1 px-5 py-3 rounded text-[13px] font-semibold text-violet-50 text-center bg-violet-600">
            Request access
          </a>
        </div>
      )}
    </m.nav>
  );
}

export default function IncaHome() {
  return (
    <div className="min-h-screen bg-[#060410] text-violet-50">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-[60px] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.08)_0%,transparent_65%)]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-7"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/6 text-violet-400/80 text-[11px] font-medium tracking-[0.08em] uppercase">
              Intelligence Platform
            </span>
          </m.div>
          <m.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.07] tracking-[-0.02em] text-violet-50 mb-6"
          >
            Intelligence at scale.
            <br />
            <span className="text-violet-400">Decisions you can trace.</span>
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-violet-300/55 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
          >
            INCA provides enterprise teams with structured visibility, explainable AI triage,
            and auditable decision workflows — for operations where accountability is non-negotiable.
          </m.p>
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.48 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a href="#access" className="group flex items-center gap-2 px-6 py-3 rounded text-[13.5px] font-semibold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors duration-200 shadow-sm">
              Schedule a private walkthrough
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </a>
            <a href="/inca/" className="flex items-center gap-2 px-6 py-3 rounded text-[13.5px] font-medium text-violet-300/55 border border-violet-500/20 hover:border-violet-500/40 hover:text-violet-200 transition-all duration-200">
              Access the platform
            </a>
          </m.div>
        </div>
      </section>

      {/* Signals Strip */}
      <section className="border-y border-violet-500/10 bg-[#0a0814]/50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-violet-400/40 mb-5">Live signals preview</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {signalFindings.map((s, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="flex items-start gap-3.5 p-4 rounded-lg border border-violet-500/10 bg-[#0a0814]/60"
              >
                <div className="mt-0.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${severityColors[s.severity]}`}>
                    {s.severity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-violet-400/45 mb-0.5">{s.type}</p>
                  <p className="text-violet-200/85 text-[13.5px] font-medium leading-snug">{s.title}</p>
                  <p className="text-violet-400/30 text-[11px] mt-1">{s.time}</p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section id="capabilities" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="mb-12"
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-violet-400/45 mb-3">Platform</p>
            <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-violet-50 leading-[1.15]">
              Built for intelligence operations
            </h2>
            <p className="text-violet-300/50 text-base mt-3 max-w-lg leading-relaxed">
              Every capability is designed for teams where explainability, traceability, and auditability
              are requirements — not features.
            </p>
          </m.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((c, i) => (
              <m.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="p-5 rounded-xl border border-violet-500/10 bg-[#0a0814]/50 hover:border-violet-500/18 transition-colors duration-250"
              >
                <h3 className="text-[14.5px] font-semibold text-violet-100 mb-2 tracking-tight">{c.title}</h3>
                <p className="text-violet-400/50 text-[13px] leading-relaxed">{c.description}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Secure Architecture */}
      <section id="security" className="py-20 lg:py-28 border-t border-violet-500/10 bg-[#0a0814]/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
            <m.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55 }}
            >
              <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-violet-400/45 mb-4">Security</p>
              <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-violet-50 leading-[1.15] mb-5">
                Operational trust, by design
              </h2>
              <p className="text-violet-300/55 text-base leading-relaxed">
                INCA is built for organisations where security is not a checkbox — it's an operating
                requirement. Every access control, permission boundary, and audit trail is built in
                from the ground up.
              </p>
            </m.div>
            <div className="space-y-0 divide-y divide-violet-500/10">
              {[
                { title: "Multi-tenant isolation", description: "Complete data and access isolation between tenants — no shared data planes." },
                { title: "Granular permissions", description: "Role-based controls with field-level permission scoping." },
                { title: "Complete audit trails", description: "Every action, decision, and configuration change is logged and timestamped." },
                { title: "Compliance-ready architecture", description: "Designed for regulated environments with structured data export for review." },
              ].map((f, i) => (
                <m.div
                  key={f.title}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="py-5"
                >
                  <h3 className="text-[14px] font-semibold text-violet-100 mb-1.5">{f.title}</h3>
                  <p className="text-violet-400/50 text-[13px] leading-relaxed">{f.description}</p>
                </m.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20 lg:py-28 border-t border-violet-500/10">
        <div className="max-w-6xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="mb-12"
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-violet-400/45 mb-3">Use Cases</p>
            <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-violet-50 leading-[1.15]">
              Who INCA serves
            </h2>
          </m.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {useCases.map((u, i) => (
              <m.div
                key={u.audience}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="p-6 rounded-xl border border-violet-500/10 bg-[#0a0814]/50"
              >
                <h3 className="text-[15px] font-semibold text-violet-100 mb-2 tracking-tight">{u.audience}</h3>
                <p className="text-violet-400/50 text-[13.5px] leading-relaxed">{u.description}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Access CTA */}
      <section id="access" className="py-20 lg:py-28 border-t border-violet-500/10 bg-[#0a0814]/60">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-violet-400/45 mb-4">Get access</p>
            <h2 className="text-[1.875rem] sm:text-[2.5rem] font-bold tracking-tight text-violet-50 leading-[1.12] mb-5">
              Request a private walkthrough
            </h2>
            <p className="text-violet-300/50 text-base leading-relaxed mb-8 max-w-md mx-auto">
              INCA is available to qualified enterprise and intelligence organisations.
              Contact us to arrange a private demonstration.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="mailto:access@inca.io" className="group flex items-center gap-2 px-7 py-3.5 rounded text-[13.5px] font-semibold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors duration-200 shadow-sm">
                Request access
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="/inca/" className="flex items-center gap-2 px-6 py-3.5 rounded text-[13.5px] font-medium text-violet-300/55 border border-violet-500/20 hover:border-violet-500/35 hover:text-violet-200 transition-all duration-200">
                Access platform
              </a>
            </div>
          </m.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-violet-500/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-violet-500/12 border border-violet-500/25 flex items-center justify-center">
              <span className="text-violet-400 font-bold text-[10px]">I</span>
            </div>
            <span className="font-semibold text-[13px] text-violet-300/60 tracking-tight">INCA</span>
            <span className="text-violet-400/25 text-[12px]">— Part of the SZL Holdings ecosystem</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/inca/" className="text-violet-400/35 text-[12px] hover:text-violet-300/60 transition-colors">Platform</a>
            <a href="/szl-holdings/" className="text-violet-400/35 text-[12px] hover:text-violet-300/60 transition-colors">SZL Holdings</a>
            <span className="text-violet-400/25 text-[12px]">&copy; {new Date().getFullYear()} INCA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
