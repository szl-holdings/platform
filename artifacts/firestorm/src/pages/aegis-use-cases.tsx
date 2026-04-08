import { useState } from "react";
import { Link } from "wouter";
import { Shield, Flame, ArrowRight, Building, Briefcase, Server, Users, Globe, CheckCircle, ChevronRight, Target, Eye, Activity, Lock } from "lucide-react";
import { ContactModal } from "@szl-holdings/shared-ui";

const ACCENT = "#ef4444";
const BG = "#080a10";

const segments = [
  {
    id: "enterprise",
    label: "Enterprise Security",
    icon: Building,
    title: "Unified XDR for enterprise security teams.",
    subtitle: "From 500 to 50,000 endpoints — one command surface.",
    desc: "Enterprise security programs run across endpoint, network, identity, and cloud — with separate tools, separate alert streams, and no unified picture. Aegis unifies detection and response across all four domains in a single pane, with automated triage and escalation that turns alert fatigue into actionable intelligence.",
    challenges: [
      "Disjointed tooling generates thousands of uncorrelated alerts daily",
      "SOC team burns cycles on manual enrichment, not investigation",
      "Board and C-suite demand posture visibility that doesn't exist",
      "M&A and rapid expansion create persistent coverage gaps",
    ],
    outcomes: [
      { metric: "< 4 min", label: "Mean time to detect across all domains" },
      { metric: "67%", label: "Reduction in analyst alert-handling time" },
      { metric: "99.7%", label: "MITRE ATT&CK framework coverage" },
      { metric: "< 12 min", label: "Mean time to respond and contain" },
    ],
    capabilities: [
      "XDR console — endpoint, network, identity, cloud",
      "Automated alert triage and severity scoring",
      "SOC command center with escalation workflows",
      "Executive risk dashboard for board reporting",
      "MITRE ATT&CK coverage visualization and gap analysis",
      "Forensics timeline for incident reconstruction",
    ],
  },
  {
    id: "msp",
    label: "MSSPs & MSPs",
    icon: Briefcase,
    title: "Multi-tenant SOC-as-a-Service. Built for scale.",
    subtitle: "Run 50 client environments with the operational footprint of 5.",
    desc: "Managed security providers need to deliver enterprise-grade protection across a diverse client base — without building a bespoke SOC for each one. Aegis's multi-tenant architecture lets MSSPs deploy, triage, and respond across all client environments from a single operator surface, with client-isolated data and configurable escalation paths.",
    challenges: [
      "Each client has different tooling, coverage gaps, and risk appetite",
      "Alert volume scales faster than analyst headcount",
      "Proving ROI to clients requires reporting that takes hours to build",
      "Credential sprawl and access management across tenants is unmanageable",
    ],
    outcomes: [
      { metric: "3×", label: "More clients per analyst than industry average" },
      { metric: "< 1 hr", label: "Client onboarding to live coverage" },
      { metric: "White-label", label: "Reporting and dashboards under your brand" },
      { metric: "Isolated", label: "Per-tenant data with zero cross-contamination" },
    ],
    capabilities: [
      "Multi-tenant command surface with isolated client environments",
      "Cross-client threat correlation (anonymized)",
      "Configurable escalation paths per client",
      "Automated client reporting — board and technical variants",
      "Analyst scorecard and performance tracking",
      "White-label dashboard and branded reporting exports",
    ],
  },
  {
    id: "government",
    label: "Government & Defense",
    icon: Globe,
    title: "Mission-grade cybersecurity for critical operations.",
    subtitle: "CMMC, FedRAMP-aligned, STIG-compatible.",
    desc: "Government agencies, defense contractors, and critical infrastructure operators face a threat landscape unlike any commercial enterprise — nation-state TTPs, supply chain risks, and compliance frameworks with no margin for failure. Aegis's threat intelligence stack is purpose-built for advanced persistent threat (APT) detection, with full MITRE ATT&CK mapping and compliance export for CMMC, NIST SP 800-171, and DoD frameworks.",
    challenges: [
      "APT groups use tradecraft that standard tools miss entirely",
      "CMMC and NIST compliance requires continuous posture evidence",
      "Supply chain risk is existential — third-party visibility is nil",
      "Airgapped and hybrid environments require specialized deployment",
    ],
    outcomes: [
      { metric: "APT-grade", label: "Threat hunting with nation-state TTP libraries" },
      { metric: "CMMC", label: "Continuous compliance evidence and audit exports" },
      { metric: "NIST", label: "SP 800-171 / 800-53 aligned controls mapping" },
      { metric: "On-prem", label: "Airgap-compatible deployment available" },
    ],
    capabilities: [
      "Nation-state TTP libraries and ATT&CK for ICS/OT",
      "CMMC Level 2 / Level 3 compliance tracking and evidence export",
      "Supply chain risk monitoring and vendor intelligence",
      "Hypothesis-driven threat hunting with APT emulation",
      "STIX / TAXII threat intelligence sharing",
      "Deception technology and active adversary detection",
    ],
  },
  {
    id: "cloud",
    label: "Cloud-Native Orgs",
    icon: Server,
    title: "Security built for cloud speed. Not retrofitted for it.",
    subtitle: "Kubernetes, multi-cloud, serverless — all covered.",
    desc: "Cloud-native organizations move faster than traditional security programs can keep up with. Every new service, every Lambda function, every Kubernetes namespace is a potential attack surface. Aegis's cloud-native integration covers AWS, Azure, GCP, and hybrid environments — with runtime threat detection, misconfiguration alerting, and identity-layer monitoring that integrates directly into your DevSecOps workflow.",
    challenges: [
      "100+ microservices make attack surface management impossible manually",
      "IAM misconfiguration is the leading cloud breach vector",
      "Dev velocity outpaces security review cycles by orders of magnitude",
      "Multi-cloud creates blind spots that single-vendor tools can't see",
    ],
    outcomes: [
      { metric: "< 90s", label: "Cloud threat detection latency" },
      { metric: "IAM", label: "Anomalous identity behavior detection in real time" },
      { metric: "Shift-left", label: "Security integrated into CI/CD and IaC review" },
      { metric: "Multi-cloud", label: "AWS + Azure + GCP unified coverage" },
    ],
    capabilities: [
      "Cloud runtime threat detection — AWS, Azure, GCP",
      "Kubernetes and container security monitoring",
      "IAM and cloud identity threat detection",
      "Infrastructure-as-Code misconfiguration scanning",
      "Serverless and API security telemetry",
      "Cloud CSPM with remediation playbooks",
    ],
  },
];

const testimonials = [
  {
    quote: "We replaced four point solutions with Aegis and reduced our mean time to detect from 40 minutes to under 4. Our SOC team actually investigates now, instead of triaging noise.",
    name: "CISO, Financial Services Enterprise",
    context: "2,400 endpoints · North American operations",
  },
  {
    quote: "As an MSSP, we needed to scale client coverage without scaling headcount linearly. Aegis's multi-tenant architecture let us triple our client base with the same analyst team.",
    name: "VP Operations, Managed Security Provider",
    context: "47 client environments · 24/7 SOC",
  },
  {
    quote: "The MITRE ATT&CK coverage visualization alone justified the deployment. We could finally show our board exactly where our gaps were — and prove we'd closed them.",
    name: "Security Director, Critical Infrastructure",
    context: "Regulated operator · CMMC Level 2",
  },
];

export default function AegisUseCasesPage() {
  const [active, setActive] = useState("enterprise");
  const [demoOpen, setDemoOpen] = useState(false);
  const segment = segments.find(s => s.id === active) ?? segments[0];

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: BG }}>
      <nav className="fixed top-0 inset-x-0 z-50 h-14 border-b border-white/5 bg-[#080a10]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/home">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-[14px]">Firestorm</span>
              <span className="text-[11px] text-gray-600 ml-1">/ Use Cases</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/home" className="text-[12px] text-gray-500 hover:text-white transition-colors hidden sm:block">← Platform</Link>
            <Link href="/pricing" className="text-[12px] text-gray-500 hover:text-white transition-colors hidden sm:block">Pricing</Link>
            <button onClick={() => setDemoOpen(true)} className="text-[12px] font-semibold px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors">
              Request Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 mb-6">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-semibold text-red-400/80 tracking-[0.1em] uppercase">Who Uses Aegis</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-[1.08] tracking-tight">
            Aegis for every security mission.
          </h1>
          <p className="text-[16px] text-gray-400 leading-relaxed max-w-xl mx-auto mb-10">
            From enterprise SOC teams to MSSPs running 50 client environments — Aegis adapts to the mission, not the other way around.
          </p>
        </div>

        {/* Segment tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {segments.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${active === s.id ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/8 hover:text-white"}`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Active segment detail */}
      <section className="pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-3 leading-snug">{segment.title}</h2>
              <p className="text-red-400/70 text-[14px] font-semibold mb-4">{segment.subtitle}</p>
              <p className="text-gray-400 text-[15px] leading-[1.85]">{segment.desc}</p>
            </div>

            <div className="mb-8">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-600 mb-4">The Challenges</h3>
              <div className="space-y-3">
                {segment.challenges.map(c => (
                  <div key={c} className="flex items-start gap-3 text-[13px] text-gray-400">
                    <div className="w-4 h-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mt-0.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    </div>
                    {c}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-600 mb-4">Capabilities Deployed</h3>
              <div className="space-y-2.5">
                {segment.capabilities.map(c => (
                  <div key={c} className="flex items-center gap-2.5 text-[13px] text-gray-300">
                    <CheckCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-600 mb-5">Documented Outcomes</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {segment.outcomes.map(o => (
                <div key={o.label} className="p-5 rounded-xl bg-white/3 border border-white/8">
                  <span className="text-[1.9rem] font-extrabold font-mono text-white block leading-none mb-2">{o.metric}</span>
                  <span className="text-[11px] text-gray-500">{o.label}</span>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-xl border border-red-500/15 bg-red-500/5">
              <p className="text-[13px] text-gray-300 leading-[1.8] mb-4">
                See how Aegis performs in your environment. Our security engineers will build a demo tailored to your threat profile, stack, and coverage gaps.
              </p>
              <button onClick={() => setDemoOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-[13px] font-semibold rounded-lg transition-colors">
                Request a Threat Briefing <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-600 mb-12 text-center">From the teams running Aegis in production</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-7 rounded-xl bg-white/3 border border-white/8">
                <p className="text-[14px] text-gray-300 leading-[1.85] mb-5 italic">"{t.quote}"</p>
                <div>
                  <p className="text-[12px] font-semibold text-white">{t.name}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{t.context}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform overview CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to see it in your environment?</h2>
          <p className="text-gray-400 text-[15px] mb-8 leading-relaxed">
            Every demo is built around your threat profile. No generic product walk-throughs.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => setDemoOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-[14px] transition-colors">
              Schedule Threat Briefing <ArrowRight className="w-4 h-4" />
            </button>
            <Link href="/pricing">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/8 border border-white/10 text-gray-300 font-medium rounded-xl text-[14px] transition-colors">
                View Pricing <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-[11px] text-gray-700 mb-3">Part of the SZL Holdings platform family</p>
            <div className="flex flex-wrap gap-4 justify-center text-[11px] text-gray-700">
              <a href="/szl-holdings/" className="hover:text-gray-400 transition-colors">SZL Holdings →</a>
              <a href="/szl-holdings/trust" className="hover:text-gray-400 transition-colors">Trust Center →</a>
              <a href="/lyte-command-center/" className="hover:text-gray-400 transition-colors">Lyte →</a>
              <a href="/prism-counsel/marketing" className="hover:text-gray-400 transition-colors">PRISM Counsel →</a>
            </div>
          </div>
        </div>
      </section>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="firestorm"
        subtitle="Aegis — Unified Defense & Intelligence Command"
      />
    </div>
  );
}
