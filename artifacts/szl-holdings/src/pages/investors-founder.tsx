import { Link } from "wouter";
import { User, ArrowRight, Building2, Code2, Shield, Target } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function InvestorsFounderPage() {
  usePageMeta({
    title: "Founder — Investor Relations — SZL Holdings",
    description: "Stephen Lutar — Founder & CEO of SZL Holdings.",
    canonical: "https://szlholdings.com/investors/founder",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <User className="h-3.5 w-3.5" />
              Founder
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Stephen Lutar
            </h1>
            <p className="mt-2 text-lg text-[#d4a054]">Founder & CEO, SZL Holdings</p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              Founder building Lyte, Alloy, and Vessels at SZL Holdings. Business observability,
              AI systems, and secure operations. Based in New York, NY.
            </p>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Operating philosophy</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <Code2 className="h-5 w-5 text-[#4a90b8]" />
                <h3 className="mt-4 text-base font-semibold text-white">Builder-operator</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Stephen builds the product, runs the operations, and works directly with design
                  partners. There is no separation between vision and execution at this stage.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <Target className="h-5 w-5 text-[#c8953c]" />
                <h3 className="mt-4 text-base font-semibold text-white">Proof over pitch</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Every claim is backed by running code, live demos, and operational proof. The
                  preference is always to show a working system over describing a future one.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <Shield className="h-5 w-5 text-[#d4a054]" />
                <h3 className="mt-4 text-base font-semibold text-white">Trust-first development</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Governance, audit trails, and AI accountability are built into the architecture
                  from day one — not retrofitted when enterprise customers demand them.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <Building2 className="h-5 w-5 text-[#8b7ac8]" />
                <h3 className="mt-4 text-base font-semibold text-white">Vertical focus</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Start with one vertical (legal operations), prove it works, then extend the
                  architecture horizontally. No premature scaling, no vaporware roadmaps.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="flex flex-wrap gap-3">
              <Link href="/investors/overview" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                Investor overview
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Connect <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
