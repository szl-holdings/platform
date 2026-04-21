import { Link } from "wouter";
import { ArrowRight, Link2, FileText, Shield, Search, GitBranch, Download } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PROOF_CHAIN_PROPERTIES = [
  {
    icon: Link2,
    name: "Source-to-output traceability",
    desc: "Every claim in a system output — a recommendation, an exported document, a governance report — links back through the decision chain to the specific source signal that supported it. There are no unsupported outputs.",
  },
  {
    icon: Shield,
    name: "Approval record embedded",
    desc: "The proof chain includes the full approval record: who reviewed the recommendation, when they approved or rejected it, and what role they held. The approval is not a separate log — it is embedded in the chain that travels with the output.",
  },
  {
    icon: GitBranch,
    name: "Branching decision history",
    desc: "When multiple recommendations were generated and one was selected, the full set of candidate recommendations is preserved in the proof chain along with the selection rationale. Reviewers can see what alternatives existed.",
  },
  {
    icon: Search,
    name: "Independently verifiable",
    desc: "Each proof chain element includes enough information to allow an independent reviewer to verify the source claim without requiring access to internal systems. References point to authoritative public sources where available.",
  },
  {
    icon: FileText,
    name: "Embedded in export artifacts",
    desc: "When an output document is exported — a Word document, a governance report, a diligence packet — the proof chain metadata is embedded in the file itself. The chain travels with the document wherever it goes.",
  },
  {
    icon: Download,
    name: "Regulatory and legal defensibility",
    desc: "The proof chain format is designed to support legal and regulatory defensibility requirements — attorney-client privilege screening, evidentiary standards, and regulatory audit requirements across legal, maritime, financial, and security domains.",
  },
];

const CHAIN_ANATOMY = [
  { field: "output_id", desc: "Unique identifier for the output artifact (document, report, or recommendation)." },
  { field: "generation_ts", desc: "Timestamp when the output was generated, linked to the audit timeline event record." },
  { field: "subject_ref", desc: "Reference to the Domain Twin subject (matter, voyage, property, or threat) at the time of generation." },
  { field: "twin_snapshot_ref", desc: "Reference to the specific Twin state version used at decision time." },
  { field: "source_signals", desc: "Array of source signals that contributed to this output, each with origin, ingestion timestamp, and classification." },
  { field: "model_invocations", desc: "Array of AI model calls made during generation, with model version, input hash, and output hash." },
  { field: "recommendation_set", desc: "All candidate recommendations generated, including the selected one and any alternatives." },
  { field: "approval_record", desc: "The approval event: actor identity, role, timestamp, decision (approve/reject), and optional rationale." },
  { field: "worldline_ref", desc: "Direct reference to the audit timeline event sequence that produced this output, for independent verification." },
];

export default function DocsProofChainPage() {
  const __pageMeta = usePageMeta({
    title: "Proof Chain — Docs — SZL Holdings",
    description: "Proof chain documentation: how KORA + FORGE traces every output back to its source signals, model invocations, and human approval record.",
    canonical: "https://szlholdings.com/docs/proof-chain",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <main>
  
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Link href="/docs" className="hover:text-white/70 transition">Docs</Link>
                <span>/</span>
                <span className="text-white/60">Proof Chain</span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                <Link2 className="h-3 w-3" />
                Platform primitive
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Proof Chain.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                Every output produced by KORA + FORGE — a recommendation, an exported document, a governance
                report — carries a proof chain: a structured record that traces every claim back to its source
                signal, the model invocation that processed it, and the human approval that authorized it.
                The chain travels with the output.
              </p>
            </div>
          </section>
  
          {/* Properties */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">System properties</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What the proof chain provides</h2>
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {PROOF_CHAIN_PROPERTIES.map((prop) => {
                  const Icon = prop.icon;
                  return (
                    <div key={prop.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                      <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <Icon className="h-4 w-4 text-white/50" />
                      </div>
                      <h3 className="text-base font-semibold text-white">{prop.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/58">{prop.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Chain anatomy */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Chain anatomy</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What a proof chain record contains</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Each proof chain record is a structured document with the following fields. The record is
                sealed at output generation time and cannot be modified post-hoc.
              </p>
              <div className="mt-8 space-y-2">
                {CHAIN_ANATOMY.map((field) => (
                  <div key={field.field} className="flex gap-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <code className="w-48 flex-shrink-0 text-xs font-mono font-semibold text-white/55">{field.field}</code>
                    <span className="text-sm text-white/65">{field.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Where it appears */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Where proof chains appear</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Outputs that carry proof chains</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Word export (Counsel)", detail: "Legal document exports embed the proof chain as document metadata, preserving the decision record for file use." },
                  { label: "Diligence packet (Terra)", detail: "Property diligence exports carry source citations and IC approval records in structured metadata." },
                  { label: "Governance report (Aegis)", detail: "Security governance reports include the full threat assessment chain and response authorization record." },
                  { label: "Voyage exception report (Vessels)", detail: "Maritime exception reports carry the Voyage Twin state, risk scoring basis, and operator decision record." },
                  { label: "AI recommendations", detail: "Every recommendation generated includes inline source citations with confidence scores — visible before approval." },
                  { label: "Audit export", detail: "Audit trail exports generated via the governance API include full audit timeline references for independent verification." },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <h3 className="text-sm font-semibold text-white">{s.label}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/55">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Related docs */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Related documentation</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Outcome Graph", href: "/docs/outcome-graph", detail: "The graph from which proof chains are derived" },
                  { label: "Audit Timeline", href: "/docs/worldline", detail: "The event timeline that proof chains reference" },
                  { label: "Governed Inference", href: "/docs/model-mesh", detail: "Model invocations recorded in the proof chain" },
                  { label: "Covenant Policy", href: "/docs/covenant-policy", detail: "Governance rules that authorize each proof chain step" },
                  { label: "Trust", href: "/docs/trust", detail: "How proof chains support trust and compliance requirements" },
                  { label: "Back to docs hub", href: "/docs", detail: "Full documentation index" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/12 hover:bg-white/[0.04]"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/30" />
                    <div>
                      <div className="text-sm font-semibold text-white">{link.label}</div>
                      <div className="mt-0.5 text-xs text-white/45">{link.detail}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
