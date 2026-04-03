import { Link } from "wouter";
import { Download, ArrowRight, ShieldCheck, FileCheck2, Lock, Eye, Hash, Clock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const controls = [
  {
    icon: FileCheck2,
    title: "Proof chain attached",
    body: "Every exported document carries a proof chain — a cryptographic summary of the sources, review events, and approval actions that produced it. Recipients can verify provenance without accessing the platform.",
  },
  {
    icon: Lock,
    title: "Privilege screening",
    body: "Before any export is generated, the platform scans for privilege-flagged content — internal strategy notes, attorney work product, or confidential markings — and blocks export until cleared.",
  },
  {
    icon: Eye,
    title: "Pre-export review",
    body: "Every export passes through the Review Before Send surface where unsupported claims, contradictions, and privilege risks are surfaced for human inspection before the document leaves the platform.",
  },
  {
    icon: Hash,
    title: "Immutable export record",
    body: "Each export event is recorded with a hash of the exported content, the approving user, timestamp, recipient context, and the exact version of every source document included.",
  },
  {
    icon: Clock,
    title: "Access audit trail",
    body: "Post-export access is tracked: who downloaded, when, from which IP, and how many times. Access patterns that deviate from expected behavior trigger alerts.",
  },
  {
    icon: ShieldCheck,
    title: "Format governance",
    body: "Exports are generated in controlled formats (Word, PDF) with metadata stripped, watermarks applied where configured, and version headers embedded in the document structure.",
  },
];

export default function TrustExportsPage() {
  usePageMeta({
    title: "Export Safety — Trust Center — SZL Holdings",
    description: "How SZL ensures every exported document is verified, privilege-screened, and audit-traced.",
    canonical: "https://szlholdings.com/trust/exports",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <Download className="h-3.5 w-3.5" />
              Export Safety
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Nothing leaves the platform without proof and approval.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              The most dangerous moment in any workflow is when a document crosses the boundary from
              internal system to external recipient. SZL treats every export as a governed event —
              verified, screened, approved, and permanently recorded.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/trust" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                Trust Center
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Request export controls review <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Export governance controls</h2>
            <p className="mt-2 text-sm text-white/56">Every document that leaves the platform passes through these layers.</p>
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {controls.map((c) => (
                <div key={c.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <c.icon className="h-5 w-5 text-[#d4a054]" />
                  <h3 className="mt-4 text-base font-semibold text-white">{c.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Export flow</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-5">
              {["Review triggered", "Source verified", "Privilege screened", "Human approved", "Export + audit"].map((step, i) => (
                <div key={step} className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                  <div className="text-xs font-bold text-[#d4a054]">0{i + 1}</div>
                  <div className="mt-1 text-sm font-medium text-white/80">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
