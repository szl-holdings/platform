import { Link } from "wouter";
import { Scale, ArrowRight, Mail, FileText, Activity, Shield, Download, CheckSquare, Clock, AlertTriangle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const workflowSteps = [
  { icon: Mail, label: "Email / file arrives", detail: "Outlook integration ingests carrier correspondence, court filings, medical reports" },
  { icon: Activity, label: "Matter updates", detail: "Matter Twin auto-updates — deadlines, pressure scores, forecast probabilities adjust" },
  { icon: AlertTriangle, label: "Risk shown", detail: "What Changed surface highlights new risks, contradictions, and quiet dangers" },
  { icon: Shield, label: "Action recommended", detail: "AI recommends next-best-action with source support and confidence scoring" },
  { icon: CheckSquare, label: "Review + sign-off", detail: "Attorney reviews recommendations, verifies source grounding, approves or rejects" },
  { icon: Download, label: "Word export", detail: "Defensible Word document with proof chain metadata and full audit trail" },
];

const integrations = [
  "Microsoft 365 (Outlook, SharePoint, Teams)",
  "Court filing systems (configured per jurisdiction)",
  "Medical record providers",
  "Carrier communication platforms",
  "Calendar and deadline management",
];

const outcomes30 = [
  "One matter fully instrumented end-to-end",
  "Morning brief operational for daily use",
  "What Changed surface covering overnight events",
  "Review Before Send workflow proven for one document type",
];

const outcomes60 = [
  "5-10 matters running through the full workflow",
  "Quiet risk detection surfacing overlooked matters",
  "Word export with proof chain in regular use",
  "Sign-off queue integrated into partner review process",
];

const outcomes90 = [
  "Full portfolio visibility through Today dashboard",
  "Measurable reduction in missed deadline risk",
  "Attorney time savings quantified per matter type",
  "Decision on expansion scope and rollout plan",
];

export default function PilotPrismCounselPage() {
  usePageMeta({
    title: "Pilot — PRISM Counsel — SZL Holdings",
    description: "PRISM Counsel pilot program: instrument one legal workflow, prove operational improvement.",
    canonical: "https://szlholdings.com/pilot/prism-counsel",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <Scale className="h-3.5 w-3.5" />
              PRISM Counsel Pilot
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Instrument one legal workflow. Prove it works.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              The PRISM Counsel pilot takes one high-friction legal workflow — from email arrival through
              matter update, risk assessment, review, approval, and export — and instruments it with
              observability, governance, and proof. No generic trial. Real workflow, real proof.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Request pilot access <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/demo" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                See the live demo
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">The flagship workflow</h2>
            <p className="mt-2 text-sm text-white/56">One complete daily lawyer workflow, end to end.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflowSteps.map((s, i) => (
                <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4a054]/10">
                      <s.icon className="h-4 w-4 text-[#d4a054]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#d4a054]">STEP {i + 1}</span>
                      <div className="text-sm font-semibold text-white">{s.label}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/56">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Required integrations</h2>
            <div className="mt-6 space-y-2">
              {integrations.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#d4a054]" />
                  <span className="text-sm text-white/72">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Expected outcomes</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { period: "30 days", items: outcomes30 },
                { period: "60 days", items: outcomes60 },
                { period: "90 days", items: outcomes90 },
              ].map((block) => (
                <div key={block.period} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <h3 className="text-base font-semibold text-[#d4a054]">{block.period}</h3>
                  <ul className="mt-4 space-y-2">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                        <Clock className="mt-0.5 h-3 w-3 flex-shrink-0 text-white/32" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Trust & governance</h2>
            <p className="mt-4 text-sm leading-6 text-white/60 max-w-3xl">
              Every AI recommendation requires human approval. Every exported document carries a proof
              chain. Every access event is logged. Privilege screening prevents internal strategy from
              leaking into external communications. The pilot runs under the same governance framework
              as production.
            </p>
            <div className="mt-8">
              <Link href="/trust" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                Trust Center <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
