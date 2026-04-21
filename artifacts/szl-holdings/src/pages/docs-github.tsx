import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, GitBranch, Code2, History, BookOpen, Shield, Layers } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const GITHUB_AS_PROOF = [
  {
    icon: Code2,
    label: "Implementation evidence",
    desc: "The repository is not a portfolio piece or a prototype. It is the working implementation of the platform — signal ingestion, Twin enrichment, execution fabric, governance layers, and vertical packs — organized, committed, and testable.",
  },
  {
    icon: History,
    label: "Architecture decision record",
    desc: "Commit history, branch structure, and architecture decision records in the repository show how technical decisions were made, what alternatives were considered, and what the trade-offs were. This is engineering depth made visible.",
  },
  {
    icon: Layers,
    label: "Monorepo structure evidence",
    desc: "The monorepo layout — shared packages, vertical packs, platform core, and governance layers — demonstrates the architectural thinking that separates the platform core from domain-specific extensions. Structure is evidence of design.",
  },
  {
    icon: Shield,
    label: "Governance layer visibility",
    desc: "The governance and human-in-the-loop layers are visible in the codebase — not as configuration options, but as structural components that the execution fabric cannot bypass. Reviewers can verify the architecture claim in code.",
  },
  {
    icon: GitBranch,
    label: "Integration surface documentation",
    desc: "External integration patterns — USCG AIS, CISA KEV, NIST NVD, Microsoft Graph — are documented and implemented in the repository. The connector architecture is not a slide. It is code that runs.",
  },
  {
    icon: BookOpen,
    label: "Technical depth for diligence",
    desc: "For technical reviewers conducting due diligence, the repository is the primary technical artifact. It shows what the team built, how they built it, and what architectural choices they made — with the commit history to prove it was not assembled overnight.",
  },
];

const GITHUB_IS_NOT = [
  "A primary CTA or hero link — the product case is made by the platform, not the repository",
  "A marketing surface — it exists for technical reviewers, not for general brand building",
  "The source of the company story — that lives in the investor materials and the founder section",
  "A replacement for the trust documentation — security posture is documented in the Trust Center",
  "A shortcut to bypass the design partner conversation — the repo doesn't replace the engagement",
];

export default function DocsGithubPage() {
  const __pageMeta = usePageMeta({
    title: "GitHub — Docs — SZL Holdings",
    description: "GitHub is technical proof and implementation evidence for the KORA + FORGE platform — not the company story or the primary CTA. This page explains what the repository demonstrates and why.",
    canonical: "https://szlholdings.com/docs/github",
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
                <span className="text-white/60">GitHub</span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                <GitBranch className="h-3 w-3" />
                Technical proof
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                GitHub as technical proof.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                The SZL Holdings GitHub organization is not the front door. It is technical evidence — a public
                mirror of engineering depth, implementation quality, and architectural decision-making available
                for technical reviewers, investors, and design partners conducting diligence. This page explains
                what the repository demonstrates and what it does not replace.
              </p>
            </div>
          </section>
  
          {/* What GitHub proves */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">What the repository demonstrates</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">GitHub as implementation artifact</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                For technical reviewers, the repository provides direct evidence of things that cannot be
                established through product screenshots or architecture slides alone.
              </p>
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {GITHUB_AS_PROOF.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                      <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <Icon className="h-4 w-4 text-white/50" />
                      </div>
                      <h3 className="text-base font-semibold text-white">{item.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/58">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* What GitHub is not */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">What GitHub is not</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">The repository has a defined role — and a boundary</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                GitHub is technical proof available for technical reviewers. It is not the primary conversion
                surface and should not be interpreted as a substitute for the platform itself.
              </p>
              <div className="mt-8 space-y-2">
                {GITHUB_IS_NOT.map((item) => (
                  <div key={item} className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3.5">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/18" />
                    <span className="text-sm text-white/60">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Who should use GitHub */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Intended audience</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Who the repository is for</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { audience: "Technical due diligence reviewers", detail: "Investors and design partners conducting technical evaluation of the platform's architecture and implementation quality." },
                  { audience: "Enterprise security teams", detail: "Reviewers assessing the open-source components, dependency surface, and architectural security posture before a pilot engagement." },
                  { audience: "Integration partners", detail: "Technical teams evaluating the connector architecture and integration surface before building or configuring connections to their systems." },
                  { audience: "Engineering candidates", detail: "Engineers evaluating SZL as a place to work who want to assess the technical environment, code quality, and architecture before engaging." },
                  { audience: "Academic and research reviewers", detail: "Researchers studying AI governance patterns, human-in-the-loop architecture, or domain-specific operating system design." },
                  { audience: "Journalists and analysts", detail: "Technical journalists and analysts who want to verify implementation claims against the actual codebase rather than relying on product descriptions." },
                ].map((item) => (
                  <div key={item.audience} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <h3 className="text-sm font-semibold text-white">{item.audience}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/55">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* GitHub link — only here */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">SZL Holdings on GitHub</h3>
                  <p className="mt-1 text-sm text-white/55">Public organization mirror for technical review and diligence. Not the primary product entry point.</p>
                </div>
                <a
                  href="https://github.com/szl-holdings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 flex-shrink-0 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/28 hover:bg-white/5"
                >
                  View on GitHub <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </section>
  
          {/* Related docs */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">If you need the product, start here instead</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Architecture docs", href: "/docs/architecture", detail: "Full technical architecture documentation" },
                  { label: "Trust documentation", href: "/docs/trust", detail: "Governance, security controls, and compliance" },
                  { label: "Design partner program", href: "/design-partners", detail: "How to work with SZL on a pilot" },
                  { label: "Trust Center", href: "/trust", detail: "Security posture and AI governance documentation" },
                  { label: "Contact", href: "/contact", detail: "Start a conversation directly" },
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
