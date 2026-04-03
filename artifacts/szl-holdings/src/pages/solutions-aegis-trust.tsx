import { Link } from "wouter";
import { ShieldAlert, Shield, Eye, FileCheck2, Lock, ArrowRight, CheckCircle, AlertTriangle, Activity, Server } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOVERNANCE_CONTROLS = [
  {
    icon: Eye,
    title: "Public threat intelligence sourcing",
    body: "Aegis ingests from authoritative public feeds — CISA advisories, NVD vulnerability data, MITRE ATT&CK mappings, and open threat intelligence. Every threat indicator traces to its source feed and publication timestamp.",
  },
  {
    icon: AlertTriangle,
    title: "Incident response audit trail",
    body: "Every alert triage, escalation, containment action, and resolution is logged with actor identity, timestamp, severity classification, and decision rationale. Complete forensic timeline for every incident.",
  },
  {
    icon: Lock,
    title: "Tenant-isolated security data",
    body: "Security telemetry, vulnerability assessments, and incident data are strictly scoped by organization. Cross-tenant visibility is impossible at every layer — query, API, and UI.",
  },
  {
    icon: FileCheck2,
    title: "Compliance-mapped controls",
    body: "Security controls map to NIST CSF, SOC 2, and ISO 27001 frameworks. Evidence collection is automated. Audit-ready reports generate from governed data pipelines.",
  },
];

const THREAT_SOURCES = [
  { name: "CISA Advisories", desc: "Cybersecurity and Infrastructure Security Agency alerts, advisories, and known exploited vulnerability catalog." },
  { name: "NVD / CVE Database", desc: "National Vulnerability Database with CVSS scoring, affected product enumeration, and remediation guidance." },
  { name: "MITRE ATT&CK", desc: "Adversary tactics, techniques, and procedures framework for threat modeling and detection coverage mapping." },
  { name: "Open Threat Feeds", desc: "Curated open-source threat intelligence feeds including IP reputation, malware indicators, and phishing domains." },
  { name: "NIST CSF Controls", desc: "Cybersecurity Framework control mappings for Identify, Protect, Detect, Respond, and Recover functions." },
  { name: "Compliance Frameworks", desc: "SOC 2 Type II, ISO 27001, and industry-specific compliance control evidence mapping." },
];

export default function SolutionsAegisTrustPage() {
  usePageMeta({
    title: "Aegis Trust & Security Governance · SZL Holdings",
    description: "How Aegis governs security operations with public threat intelligence, incident audit trails, tenant isolation, and compliance-mapped controls.",
    canonical: "https://szlholdings.com/solutions/aegis/trust",
  });

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <SiteNav />

      <section className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5" style={{ color: "#c45a4a" }} />
          <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "#c45a4a" }}>Aegis · Trust</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
          Defensible security operations.
        </h1>
        <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-8">
          Aegis provides unified security intelligence built on authoritative public threat feeds with complete incident audit trails. Every alert, triage decision, and containment action is traceable and compliance-mapped.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/solutions/aegis">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border cursor-pointer" style={{ borderColor: "rgba(196,90,74,0.2)", color: "#c45a4a", background: "rgba(196,90,74,0.08)" }}>
              Product Overview <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <Link href="/trust">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer">
              Platform Trust Center
            </span>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Governance Controls</h2>
        <p className="text-sm text-slate-400 max-w-2xl mb-8">
          How Aegis ensures threat intelligence provenance, incident accountability, and compliance alignment across security operations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GOVERNANCE_CONTROLS.map((c) => (
            <div key={c.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-3 mb-3">
                <c.icon className="w-5 h-5" style={{ color: "rgba(196,90,74,0.7)" }} />
                <h3 className="text-sm font-semibold text-slate-200">{c.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Threat Intelligence Sources</h2>
        <p className="text-sm text-slate-400 max-w-2xl mb-8">
          Aegis ingests from authoritative public security feeds. Every threat indicator includes source attribution and publication metadata.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {THREAT_SOURCES.map((s) => (
            <div key={s.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4" style={{ color: "rgba(196,90,74,0.6)" }} />
                <span className="text-sm font-semibold text-slate-200">{s.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <Shield className="w-8 h-8 mx-auto mb-4" style={{ color: "#c45a4a" }} />
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Compliance-ready operations</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
            Every security operation in Aegis generates compliance evidence mapped to NIST CSF, SOC 2, and ISO 27001. Export audit-ready reports for assessors at any time.
          </p>
          <Link href="/solutions/aegis">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border cursor-pointer" style={{ borderColor: "rgba(196,90,74,0.2)", color: "#c45a4a", background: "rgba(196,90,74,0.08)" }}>
              Explore Aegis <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
