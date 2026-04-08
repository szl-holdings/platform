import { Link } from "wouter";
import { Shield, Flame, CheckCircle, Lock, Eye, Server, FileText, Users, Activity, ArrowRight, ChevronRight } from "lucide-react";

const BG = "#080a10";

const complianceFrameworks = [
  { name: "SOC 2 Type II", desc: "Annual third-party audit covering Security, Availability, and Confidentiality trust service criteria.", status: "Certified" },
  { name: "ISO 27001", desc: "International standard for information security management systems — processes and controls.", status: "Certified" },
  { name: "NIST CSF", desc: "Full Cybersecurity Framework alignment across Identify, Protect, Detect, Respond, and Recover.", status: "Aligned" },
  { name: "NIST SP 800-171", desc: "CUI protection controls for organizations handling controlled unclassified government information.", status: "Aligned" },
  { name: "CMMC Level 2", desc: "Cybersecurity Maturity Model Certification requirements for DoD supply chain participants.", status: "Roadmap Q3" },
  { name: "GDPR / CCPA", desc: "Data subject rights, lawful processing basis, cross-border data transfer safeguards.", status: "Compliant" },
  { name: "FedRAMP Ready", desc: "Federal Risk and Authorization Management Program alignment — in review.", status: "Roadmap Q4" },
  { name: "HIPAA", desc: "Administrative, physical, and technical safeguards for ePHI-adjacent security environments.", status: "Available" },
];

const securityControls = [
  {
    icon: Server,
    title: "Infrastructure Security",
    points: [
      "Multi-region deployment with active-active redundancy",
      "End-to-end encryption in transit (TLS 1.3) and at rest (AES-256)",
      "Network micro-segmentation with zero-trust network access",
      "Infrastructure-as-Code with automated compliance drift detection",
      "Separate data planes for each customer tenant",
      "Continuous vulnerability scanning and patch management (< 48h SLA)",
    ],
  },
  {
    icon: Lock,
    title: "Access & Identity",
    points: [
      "SSO / SAML 2.0 / OIDC — integrates with any enterprise IdP",
      "SCIM provisioning for automated user lifecycle management",
      "FIDO2 / hardware MFA for privileged access",
      "Just-in-time (JIT) access for sensitive operations",
      "Privileged access workstations for production access",
      "Quarterly access reviews with automated de-provisioning",
    ],
  },
  {
    icon: Eye,
    title: "Monitoring & Detection",
    points: [
      "24/7 security operations monitoring by dedicated team",
      "Real-time anomaly detection on Aegis infrastructure",
      "Full audit log immutability — logs cannot be modified or deleted",
      "Alert routing to on-call security engineer in < 5 minutes",
      "Continuous threat intelligence integration on own infrastructure",
      "Quarterly red team exercises and tabletop simulations",
    ],
  },
  {
    icon: FileText,
    title: "Data & Privacy",
    points: [
      "Customer data never used for model training or product improvement",
      "Data residency options — US, EU, and APAC region selection",
      "Right-to-erasure with verified deletion certification",
      "Data processing agreements (DPAs) available for all customers",
      "Sub-processor registry maintained and publicly disclosed",
      "Annual data protection impact assessments (DPIAs)",
    ],
  },
  {
    icon: Users,
    title: "Personnel Security",
    points: [
      "Background checks for all Aegis engineering and operations staff",
      "Security awareness training — quarterly and role-specific",
      "Principle of least privilege enforced across all internal systems",
      "Insider threat detection program with behavioral analytics",
      "NDAs and confidentiality agreements for all personnel",
      "Annual third-party social engineering and phishing assessments",
    ],
  },
  {
    icon: Activity,
    title: "Resilience & Recovery",
    points: [
      "99.9% uptime SLA with financially backed commitments",
      "Real-time status page at status.firestorm.szlholdings.com",
      "RPO < 1 hour / RTO < 4 hours — tested quarterly",
      "Geographically distributed backups with integrity verification",
      "Incident response playbooks with defined escalation paths",
      "Customer notification within 72 hours of any security event",
    ],
  },
];

const penTestProgram = [
  "Annual third-party penetration test conducted by CREST-certified firm",
  "Quarterly automated DAST scanning on all production endpoints",
  "Continuous SAST in CI/CD pipeline — blocks deployment on critical findings",
  "Bug bounty program via HackerOne — open to all security researchers",
  "Responsible disclosure policy with 90-day coordinated disclosure window",
];

export default function AegisTrustPage() {
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
              <span className="text-[11px] text-gray-600 ml-1">/ Security</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/home" className="text-[12px] text-gray-500 hover:text-white transition-colors hidden sm:block">← Platform</Link>
            <Link href="/use-cases" className="text-[12px] text-gray-500 hover:text-white transition-colors hidden sm:block">Use Cases</Link>
            <Link href="/pricing">
              <button className="text-[12px] font-semibold px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 mb-7">
          <Shield className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[11px] font-semibold text-red-400/80 tracking-[0.1em] uppercase">Trust & Security</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-[1.08] tracking-tight max-w-2xl">
          Security-first. From infrastructure to product.
        </h1>
        <p className="text-[16px] text-gray-400 leading-relaxed max-w-2xl mb-10">
          Aegis protects thousands of organizations' security operations. The security of that infrastructure is not a checkbox — it's the first product we ship.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: "SOC 2 Type II", note: "Certified annually" },
            { label: "ISO 27001", note: "Certified" },
            { label: "99.9% SLA", note: "Uptime guarantee" },
            { label: "< 72 hrs", note: "Incident notification" },
          ].map(item => (
            <div key={item.label} className="p-4 rounded-xl bg-white/3 border border-white/8 text-center">
              <p className="text-[13px] font-bold text-white mb-1">{item.label}</p>
              <p className="text-[10px] text-gray-600">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance grid */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-600 mb-8">Compliance Frameworks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {complianceFrameworks.map(f => (
              <div key={f.name} className="flex items-start gap-4 p-5 rounded-xl bg-white/3 border border-white/8">
                <div className={`mt-0.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${f.status === "Certified" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : f.status === "Compliant" || f.status === "Available" || f.status === "Aligned" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                  {f.status}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white mb-1">{f.name}</p>
                  <p className="text-[12px] text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security controls */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-600 mb-8">Security Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {securityControls.map(control => (
              <div key={control.title} className="p-6 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <control.icon className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <h3 className="text-[13px] font-bold text-white">{control.title}</h3>
                </div>
                <div className="space-y-2">
                  {control.points.map(p => (
                    <div key={p} className="flex items-start gap-2 text-[12px] text-gray-500">
                      <CheckCircle className="w-3 h-3 text-red-400/50 mt-0.5 shrink-0" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pen testing */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-600 mb-6">Penetration Testing Program</h2>
          <div className="p-7 rounded-xl bg-white/3 border border-white/8">
            <p className="text-[14px] text-gray-400 leading-relaxed mb-5">
              We test Aegis's defenses the same way adversaries would — with the same tools, the same techniques, and the same goal. Our testing program is continuous, not event-driven.
            </p>
            <div className="space-y-2.5">
              {penTestProgram.map(p => (
                <div key={p} className="flex items-start gap-2.5 text-[13px] text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Shared responsibility */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-600 mb-8">Shared Responsibility Model</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-7 rounded-xl border border-red-500/15 bg-red-500/5">
              <p className="text-[13px] font-bold text-white mb-4">Aegis is responsible for:</p>
              <div className="space-y-2.5">
                {[
                  "Physical and logical security of the platform infrastructure",
                  "Encryption of data at rest and in transit",
                  "Availability and resilience of the platform",
                  "Timely patching of platform-layer vulnerabilities",
                  "Security of Aegis application code and APIs",
                  "Incident response to platform-level events",
                ].map(p => (
                  <div key={p} className="flex items-start gap-2 text-[12px] text-gray-400">
                    <CheckCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-7 rounded-xl bg-white/3 border border-white/8">
              <p className="text-[13px] font-bold text-white mb-4">You are responsible for:</p>
              <div className="space-y-2.5">
                {[
                  "Configuration of RBAC roles and access policies",
                  "Management of SSO and IdP integration",
                  "User provisioning and de-provisioning",
                  "Sensitivity classification of data ingested into Aegis",
                  "Investigation and response using Aegis's findings",
                  "Integration security between Aegis and your other tools",
                ].map(p => (
                  <div key={p} className="flex items-start gap-2 text-[12px] text-gray-400">
                    <ChevronRight className="w-3 h-3 text-gray-600 mt-0.5 shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SZL cross-link */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Part of the SZL Holdings trust infrastructure</h2>
          <p className="text-gray-400 text-[14px] mb-8 leading-relaxed max-w-xl mx-auto">
            Firestorm and Aegis operate under the shared security architecture and governance framework of SZL Holdings. The full platform trust center — including architecture documentation, penetration test reports, and compliance certifications — is available for enterprise review.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/szl-holdings/trust">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/8 border border-white/10 text-gray-300 font-medium rounded-xl text-[13px] transition-colors">
                SZL Trust Center <ArrowRight className="w-4 h-4" />
              </button>
            </a>
            <a href="/szl-holdings/architecture">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/8 border border-white/10 text-gray-300 font-medium rounded-xl text-[13px] transition-colors">
                Platform Architecture <ArrowRight className="w-4 h-4" />
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
