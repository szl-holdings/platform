import { Link } from "wouter";
import {
  User,
  ArrowRight,
  Building2,
  Code2,
  Shield,
  Target,
  type LucideIcon,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useInvestorContent } from "@/hooks/useInvestorContent";

const ICONS: Record<string, LucideIcon> = {
  User, Building2, Code2, Shield, Target,
};

function resolveIcon(name: unknown, fallback: LucideIcon): LucideIcon {
  if (typeof name === "function") return name as LucideIcon;
  if (typeof name === "string" && ICONS[name]) return ICONS[name];
  return fallback;
}

type IconRef = LucideIcon | string;
type Philosophy = { icon: IconRef; color: string; title: string; body: string };

type FounderContent = {
  hero: {
    eyebrow: string;
    name: string;
    role: string;
    bio: string;
  };
  philosophy: Philosophy[];
};

const FALLBACK_CONTENT: FounderContent = {
  hero: {
    eyebrow: "Founder",
    name: "Stephen Lutar",
    role: "Founder & CEO, SZL Holdings",
    bio:
      "Founder building KORA, Counsel, and SEXTANT at SZL Holdings. Governed decision infrastructure, AI systems, and secure operations. Based in New York, NY.",
  },
  philosophy: [
    { icon: Code2, color: "#4a90b8", title: "Builder-operator", body: "Stephen builds the product, runs the operations, and works directly with design partners. There is no separation between vision and execution at this stage." },
    { icon: Target, color: "#c8953c", title: "Proof over pitch", body: "Every claim is backed by running code, live demos, and operational proof. The preference is always to show a working system over describing a future one." },
    { icon: Shield, color: "#d4a054", title: "Trust-first development", body: "Governance, audit trails, and AI accountability are built into the architecture from day one — not retrofitted when enterprise customers demand them." },
    { icon: Building2, color: "#8b7ac8", title: "Vertical focus", body: "Start with one vertical (legal operations), prove it works, then extend the architecture horizontally. No premature scaling, no vaporware roadmaps." },
  ],
};

export default function InvestorsFounderPage() {
  const __pageMeta = usePageMeta({
    title: "Founder — Investor Relations — SZL Holdings",
    description: "Stephen Lutar — Founder & CEO of SZL Holdings.",
    canonical: "https://szlholdings.com/investors/founder",
  });

  const { content, isSeeded } = useInvestorContent<FounderContent>("founder", FALLBACK_CONTENT);
  const { hero, philosophy } = content;

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <main>
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
                  <User className="h-3.5 w-3.5" />
                  {hero.eyebrow}
                </div>
                {isSeeded ? (
                  <span
                    data-testid="investor-content-demo-badge"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Live DB
                  </span>
                ) : null}
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                {hero.name}
              </h1>
              <p className="mt-2 text-lg text-[#d4a054]">{hero.role}</p>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">{hero.bio}</p>
            </div>
          </section>

          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <h2 className="text-2xl font-semibold text-white">Operating philosophy</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {philosophy.map((item) => {
                  const Icon = resolveIcon(item.icon, Building2);
                  return (
                    <div key={item.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                      <Icon className="h-5 w-5" style={{ color: item.color }} />
                      <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
                    </div>
                  );
                })}
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
        </>
  );
}
