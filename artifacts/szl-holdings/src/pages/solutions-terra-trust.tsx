import { Link } from "wouter";
import { Building2, Shield, Eye, FileCheck2, Lock, ArrowRight, MapPin, Database } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOVERNANCE_CONTROLS = [
  {
    icon: Eye,
    title: "Public data sourcing only",
    body: "DOMAINE ingests exclusively from public government APIs — PLUTO, FEMA, census, tax assessor, permit databases. No scraped, purchased, or user-contributed proprietary data enters the pipeline without explicit provenance tagging.",
  },
  {
    icon: Database,
    title: "Source lineage on every signal",
    body: "Every market signal, risk score, and property flag traces back to its originating data source, retrieval timestamp, and transformation logic. No opaque scoring.",
  },
  {
    icon: Lock,
    title: "Deal pipeline access isolation",
    body: "Active deals, acquisition targets, and pipeline data are scoped by organization and role. LP-facing reports are generated from governed export pipelines with approval gates.",
  },
  {
    icon: FileCheck2,
    title: "Diligence audit trail",
    body: "Every diligence step — from sourcing to closing — is logged with actor identity, timestamp, and decision rationale. Complete chain of custody for every acquisition.",
  },
];

const DATA_SOURCES = [
  { name: "NYC PLUTO", desc: "Lot-level land use and zoning data for every tax lot in New York City." },
  { name: "FEMA NFHL", desc: "National Flood Hazard Layer — flood zone classification and risk mapping." },
  { name: "Census ACS", desc: "American Community Survey demographic and economic indicators by geography." },
  { name: "Tax assessor feeds", desc: "Property valuation, tax status, and assessment change tracking." },
  { name: "Permit databases", desc: "Building permit activity, renovation signals, and development pipeline." },
  { name: "Foreclosure filings", desc: "Public foreclosure and lis pendens filing monitoring for distress detection." },
];

export default function SolutionsTerraTrustPage() {
  const __pageMeta = usePageMeta({
    title: "DOMAINE Trust & Data Governance · SZL Holdings",
    description: "How DOMAINE sources, processes, and governs real estate intelligence data with full provenance, public-data-only sourcing, and audit-ready pipelines.",
    canonical: "https://szlholdings.com/solutions/terra/trust",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen" style={{ background: "var(--gi-bg-base)" }}>
        <SiteNav />
  
        <section className="max-w-5xl mx-auto px-6 pt-32 pb-16">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5" style={{ color: "hsl(140,50%,38%)" }} />
            <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "hsl(140,50%,38%)" }}>DOMAINE · Trust</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
            Transparent data. Traceable intelligence.
          </h1>
          <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-8">
            DOMAINE provides real estate intelligence built entirely on public government data sources with full provenance tracking. Every signal, score, and recommendation traces back to its source — no proprietary black boxes.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/solutions/terra">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer" style={{ borderColor: "hsla(140,50%,38%,0.2)", color: "hsl(140,50%,38%)", background: "hsla(140,50%,38%,0.08)" }}>
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
            How DOMAINE ensures data integrity, access isolation, and auditability across the real estate intelligence pipeline.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GOVERNANCE_CONTROLS.map((c) => (
              <div key={c.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <c.icon className="w-5 h-5" style={{ color: "hsla(140,50%,38%,0.7)" }} />
                  <h3 className="text-sm font-semibold text-slate-200">{c.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>
  
        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Verified Data Sources</h2>
          <p className="text-sm text-slate-400 max-w-2xl mb-8">
            DOMAINE ingests exclusively from authoritative public data sources. Every record includes source attribution and retrieval metadata.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DATA_SOURCES.map((s) => (
              <div key={s.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" style={{ color: "hsla(140,50%,38%,0.6)" }} />
                  <span className="text-sm font-semibold text-slate-200">{s.name}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
  
        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <Shield className="w-8 h-8 mx-auto mb-4" style={{ color: "hsl(140,50%,38%)" }} />
            <h2 className="text-lg font-semibold text-slate-100 mb-2">LP-ready audit trails</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
              Every acquisition decision, market signal, and diligence checkpoint is logged with full attribution. Generate compliance-ready reports for LP review at any time.
            </p>
            <Link href="/solutions/terra">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer" style={{ borderColor: "hsla(140,50%,38%,0.2)", color: "hsl(140,50%,38%)", background: "hsla(140,50%,38%,0.08)", border: "1px solid hsla(140,50%,38%,0.2)" }}>
                Explore DOMAINE <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </section>
  
        <SiteFooter />
      </div>
        </>
  );
}
