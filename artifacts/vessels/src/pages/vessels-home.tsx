import { motion as m } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Demo", href: "#demo" },
];

const kpis = [
  { value: "40,000+", label: "Vessels tracked" },
  { value: "< 90s", label: "Alert response time" },
  { value: "99.97%", label: "Platform uptime" },
  { value: "180+", label: "Ports monitored" },
];

const capabilities = [
  {
    title: "Real-time fleet tracking",
    description: "Position, heading, speed, and status for every vessel in your fleet — updated continuously across global shipping lanes.",
  },
  {
    title: "Route visibility",
    description: "Monitor planned vs. actual routes with deviation alerts and estimated arrival recalculation.",
  },
  {
    title: "Fleet coordination",
    description: "Centralised command view across multi-vessel operations, cargo states, and port scheduling.",
  },
  {
    title: "Anomaly detection",
    description: "Automated identification of irregular behaviour: AIS spoofing, unexpected stops, route deviations, and dark-vessel activity.",
  },
  {
    title: "Operational reporting",
    description: "Structured reports on fleet performance, compliance, voyage efficiency, and emissions — export-ready for regulators and boards.",
  },
  {
    title: "Weather intelligence",
    description: "Integrated maritime weather overlays to support safe routing decisions and weather-related risk assessment.",
  },
];

const useCases = [
  {
    audience: "Fleet operators",
    description: "Full situational awareness across your entire fleet. Reduce voyage incidents, coordinate cargo, and manage deviations before they escalate.",
  },
  {
    audience: "Voyage oversight",
    description: "End-to-end voyage visibility from departure to arrival, with automated milestone tracking and ETA updates.",
  },
  {
    audience: "Compliance teams",
    description: "Audit-ready records of routes, positions, and incidents. Built for IMO, SOLAS, and port authority requirements.",
  },
  {
    audience: "Executive visibility",
    description: "High-level fleet performance dashboards for leadership — without the operational noise.",
  },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  return (
    <m.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#060e1a]/97 backdrop-blur-md border-b border-sky-500/10" : "bg-transparent"
      }`}
      onScroll={() => setScrolled(window.scrollY > 32)}
    >
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        <a href="/vessels/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
            <span className="text-sky-400 font-bold text-[11px]" style={{ fontFamily: "system-ui" }}>V</span>
          </div>
          <span className="font-semibold text-[14px] text-sky-50 tracking-tight">Vessels</span>
        </a>
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sky-300/50 text-[13px] font-medium hover:text-sky-100 transition-colors duration-200">
              {l.label}
            </a>
          ))}
          <a href="#demo" className="flex items-center gap-1.5 px-4 py-2 rounded text-[13px] font-semibold text-sky-950 bg-sky-400 hover:bg-sky-300 transition-colors duration-200">
            Request a private demo
            <ChevronRight size={13} />
          </a>
          <a href="/vessels/fleet" className="text-sky-300/50 text-[13px] font-medium hover:text-sky-100 transition-colors">
            Sign in
          </a>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-sky-300/60 hover:text-sky-100 transition-colors">
          <span className="sr-only">Menu</span>
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-4 h-0.5 bg-current" />
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-[#060e1a]/97 border-b border-sky-500/10 px-6 py-5 flex flex-col gap-4">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-sky-300/60 text-[15px] font-medium hover:text-sky-100 transition-colors">
              {l.label}
            </a>
          ))}
          <a href="#demo" onClick={() => setMobileOpen(false)} className="mt-1 px-5 py-3 rounded text-[13px] font-semibold text-sky-950 text-center bg-sky-400">
            Request a private demo
          </a>
        </div>
      )}
    </m.nav>
  );
}

export default function VesselsHome() {
  return (
    <div className="min-h-screen bg-[#040c18] text-sky-50">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-[60px] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.07)_0%,transparent_65%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-sky-500/10" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-7"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-400/80 text-[11px] font-medium tracking-[0.08em] uppercase">
              Maritime Intelligence Platform
            </span>
          </m.div>
          <m.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.07] tracking-[-0.02em] text-sky-50 mb-6"
          >
            Command your fleet.
            <br />
            <span className="text-sky-400">See everything.</span>
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-sky-300/60 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Vessels gives fleet operators, compliance teams, and executive leadership
            a single, authoritative picture of maritime operations — in real time.
          </m.p>
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.48 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a href="#demo" className="group flex items-center gap-2 px-6 py-3 rounded text-[13.5px] font-semibold text-sky-950 bg-sky-400 hover:bg-sky-300 transition-colors duration-200 shadow-sm">
              Request a private demo
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </a>
            <a href="/vessels/fleet" className="flex items-center gap-2 px-6 py-3 rounded text-[13.5px] font-medium text-sky-300/60 border border-sky-500/20 hover:border-sky-500/40 hover:text-sky-200 transition-all duration-200">
              Access the platform
            </a>
          </m.div>

          {/* Placeholder for product visual / map hero */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-16 rounded-xl border border-sky-500/10 bg-[#060e1a] overflow-hidden h-64 sm:h-80 flex items-center justify-center max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border border-sky-500/20 bg-sky-500/5 flex items-center justify-center mx-auto mb-4">
                <span className="text-sky-400 text-2xl">⚓</span>
              </div>
              <p className="text-sky-400/40 text-[13px] font-medium tracking-wide">Fleet command dashboard</p>
              <p className="text-sky-400/25 text-[12px] mt-1">Real-time vessel positions · Route overlays · Alert feeds</p>
            </div>
          </m.div>
        </div>
      </section>

      {/* KPI Strip */}
      <section className="border-y border-sky-500/10 bg-[#060e1a]/50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-sky-500/10 rounded-lg overflow-hidden">
            {kpis.map((k, i) => (
              <m.div
                key={k.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="bg-[#060e1a] px-6 py-6 text-center"
              >
                <p className="text-[1.75rem] font-bold text-sky-300 tracking-tight mb-1">{k.value}</p>
                <p className="text-sky-400/40 text-[11.5px] font-medium">{k.label}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="mb-12"
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-3">Platform</p>
            <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-sky-50 leading-[1.15]">
              Built for maritime operations
            </h2>
            <p className="text-sky-300/50 text-base mt-3 max-w-lg leading-relaxed">
              Every capability was designed with fleet operators, compliance officers, and executive teams in mind.
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
                className="p-5 rounded-xl border border-sky-500/10 bg-[#060e1a]/60 hover:border-sky-500/20 transition-colors duration-250"
              >
                <h3 className="text-[14.5px] font-semibold text-sky-100 mb-2 tracking-tight">{c.title}</h3>
                <p className="text-sky-400/50 text-[13px] leading-relaxed">{c.description}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Walkthrough */}
      <section id="platform" className="py-20 lg:py-28 border-t border-sky-500/10">
        <div className="max-w-6xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center"
          >
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-4">How it works</p>
              <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-sky-50 leading-[1.15] mb-5">
                From signal to decision
              </h2>
              <p className="text-sky-300/55 text-base leading-relaxed mb-6">
                Vessels ingests AIS data, weather feeds, port schedules, and cargo records
                into a unified operational picture. Teams get the context they need to act
                — not a feed of unprocessed signals.
              </p>
              <div className="space-y-4">
                {[
                  "Live AIS position tracking and historical trail",
                  "Automated deviation and anomaly alerts",
                  "Fleet cards with vessel status, cargo, and ETA",
                  "Integrated weather and routing overlays",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400/60 mt-1.5 shrink-0" />
                    <p className="text-sky-300/60 text-[13.5px] leading-relaxed">{f}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-sky-500/10 bg-[#060e1a] h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg border border-sky-500/20 bg-sky-500/5 flex items-center justify-center mx-auto mb-3">
                  <span className="text-sky-400 text-xl">🗺️</span>
                </div>
                <p className="text-sky-400/35 text-[12.5px] font-medium">Fleet map view</p>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20 lg:py-28 border-t border-sky-500/10 bg-[#060e1a]/40">
        <div className="max-w-6xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="mb-12"
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-3">Use Cases</p>
            <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-sky-50 leading-[1.15]">
              Who Vessels serves
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
                className="p-6 rounded-xl border border-sky-500/10 bg-[#060e1a]/60"
              >
                <h3 className="text-[15px] font-semibold text-sky-100 mb-2 tracking-tight">{u.audience}</h3>
                <p className="text-sky-400/50 text-[13.5px] leading-relaxed">{u.description}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Enterprise */}
      <section className="py-20 lg:py-28 border-t border-sky-500/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20">
            <m.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55 }}
            >
              <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-4">Architecture</p>
              <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-sky-50 leading-[1.15] mb-5">
                Enterprise-grade from the ground up
              </h2>
              <p className="text-sky-300/55 text-base leading-relaxed">
                Vessels is built for the organisations that operate global fleets — where downtime, data
                errors, and security failures are not acceptable outcomes.
              </p>
            </m.div>
            <div className="space-y-0 divide-y divide-sky-500/10">
              {[
                { title: "End-to-end encryption", description: "All data in transit and at rest is encrypted to enterprise standards." },
                { title: "Role-based access control", description: "Granular permissions for exec, ops, compliance, and maintenance roles." },
                { title: "Audit trails", description: "Full record of system actions, alerts, and configuration changes." },
                { title: "99.97% uptime SLA", description: "Built on resilient infrastructure with redundant data ingestion." },
              ].map((f, i) => (
                <m.div
                  key={f.title}
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="py-5"
                >
                  <h3 className="text-[14px] font-semibold text-sky-100 mb-1.5">{f.title}</h3>
                  <p className="text-sky-400/50 text-[13px] leading-relaxed">{f.description}</p>
                </m.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Proof Reinforcement */}
      <section className="py-16 lg:py-20 border-t border-sky-500/10">
        <div className="max-w-5xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-3">Documented Outcomes</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-sky-50 tracking-tight">Results from production deployments</h2>
            <p className="text-sky-300/50 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
              Not projections. Specific, documented outcomes from Vessels operating in live maritime environments.
            </p>
          </m.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { metric: "34 days", label: "Pre-designation lead time", detail: "AIS-dark vessel activity flagged before formal OFAC listing", accent: "#3b82f6" },
              { metric: "94%", label: "Confidence score", detail: "INCA SENTINEL-GAT-v4 behavioral signature accuracy on pre-designation case", accent: "#0ea5e9" },
              { metric: "40K+", label: "Vessels monitored", detail: "Continuous autonomous intelligence across global maritime corridors", accent: "#38bdf8" },
              { metric: "0", label: "Compliance breaches", detail: "Fleet operators cleared exposure window before formal designation", accent: "#22d3ee" },
              { metric: "< 2h", label: "P&I notification time", detail: "From autonomous alert to insurer notification — same monitoring cycle", accent: "#67e8f9" },
              { metric: "72h", label: "Dark period detected", detail: "Near known STS transfer zone, part of 90-day behavioral pattern", accent: "#a5f3fc" },
            ].map((item, i) => (
              <m.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-xl p-5 border border-sky-500/12 bg-sky-500/4 hover:border-sky-500/20 transition-colors duration-200"
              >
                <div className="text-2xl font-bold mb-1" style={{ color: item.accent }}>{item.metric}</div>
                <div className="text-[13px] font-semibold text-sky-100 mb-1.5">{item.label}</div>
                <div className="text-[12px] text-sky-400/50 leading-relaxed">{item.detail}</div>
              </m.div>
            ))}
          </div>
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-6 text-center"
          >
            <a href="/szl-holdings/case-studies" className="text-[12px] text-sky-400/50 hover:text-sky-300/70 transition-colors inline-flex items-center gap-1.5">
              Read full case study: 34-Day Pre-Designation Lead on AIS-Dark Vessel Activity
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </m.div>
        </div>
      </section>

      {/* Demo CTA */}
      <section id="demo" className="py-20 lg:py-28 border-t border-sky-500/10 bg-[#060e1a]/60">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-4">Get access</p>
            <h2 className="text-[1.875rem] sm:text-[2.5rem] font-bold tracking-tight text-sky-50 leading-[1.12] mb-5">
              Request a private walkthrough
            </h2>
            <p className="text-sky-300/55 text-base leading-relaxed mb-8 max-w-md mx-auto">
              We work with a limited number of fleet operators at any time.
              Contact us to arrange a private walkthrough of the platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="mailto:demo@vessels.io" className="group flex items-center gap-2 px-7 py-3.5 rounded text-[13.5px] font-semibold text-sky-950 bg-sky-400 hover:bg-sky-300 transition-colors duration-200 shadow-sm">
                Request a private walkthrough
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </m.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-sky-500/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
              <span className="text-sky-400 font-bold text-[10px]">V</span>
            </div>
            <span className="font-semibold text-[13px] text-sky-300/70 tracking-tight">Vessels</span>
            <span className="text-sky-400/25 text-[12px]">— Part of the SZL Holdings ecosystem</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/vessels/fleet" className="text-sky-400/40 text-[12px] hover:text-sky-300/70 transition-colors">Platform</a>
            <a href="/szl-holdings/" className="text-sky-400/40 text-[12px] hover:text-sky-300/70 transition-colors">SZL Holdings</a>
            <span className="text-sky-400/25 text-[12px]">&copy; {new Date().getFullYear()} Vessels</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
