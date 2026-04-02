import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Banknote,
  Landmark,
  HandCoins,
  CheckCircle2,
  Mail,
  FileText,
  Workflow,
  Radar,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const capitalPaths = [
  {
    icon: Landmark,
    title: "Bank / SBA path",
    body: "Use lender conversations to support working capital, pilot delivery, design-partner execution, and commercialization discipline.",
    bullets: ["Working capital narrative", "Repayment discipline", "Founder credibility and operating plan"],
  },
  {
    icon: HandCoins,
    title: "Angel / seed path",
    body: "Use equity conversations to accelerate product proof, customer acquisition, and the commercial maturation of Lyte + Alloy.",
    bullets: ["Clear wedge story", "Design-partner pipeline", "Product + GTM milestones"],
  },
  {
    icon: Banknote,
    title: "Design-partner revenue",
    body: "Treat early customer revenue as strategic capital. A paid pilot or design-partner agreement increases both financing credibility and product truth.",
    bullets: ["Faster learning loop", "Evidence for future capital", "Lower narrative risk"],
  },
];

const materials = [
  "One-page teaser",
  "Bank / lender brief",
  "Angel memo",
  "Master investor deck",
  "Design-partner proposal",
  "Financial model and 90-day plan",
];

const milestones = [
  "3\u20135 serious lender conversations",
  "20+ target investor conversations",
  "3\u20135 design-partner prospects in pipeline",
  "1\u20132 paid pilots or structured discovery engagements",
];

export default function InvestorRelationsPage() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  usePageMeta({
    title: "Investor Relations \u2014 SZL Holdings",
    description:
      "Capital and partner materials for SZL Holdings, centered on the Lyte + Alloy raise story.",
    canonical: "https://szlholdings.com/investor-relations",
  });

  const canSubmit = useMemo(() => email.trim().length > 3, [email]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/holdings/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "investor",
          source: "investor_relations",
          name: company.trim() || "Investor / Capital Inquiry",
          email: email.trim(),
          subject: "Capital / Investor Relations Inquiry",
          message:
            message.trim() ||
            `Capital inquiry from ${email.trim()}${company.trim() ? ` (${company.trim()})` : ""}.`,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setSent(true);
      setEmail("");
      setCompany("");
      setMessage("");
    } catch {
      setError("Unable to submit right now. Please email hello@szlholdings.com directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/25 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <FileText className="h-3.5 w-3.5" />
              Investor relations
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Capital materials for a disciplined company narrative.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              SZL Holdings is running a focused capital story around Lyte + Alloy. The objective is
              to align lenders, investors, and design partners around one commercial wedge, one
              product narrative, and one execution plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Start a conversation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:hello@szlholdings.com"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
              >
                <Mail className="h-4 w-4" />
                hello@szlholdings.com
              </a>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Capital paths</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Three sources of momentum
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {capitalPaths.map((path) => {
                const Icon = path.icon;
                return (
                  <div key={path.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-black/20 p-3">
                      <Icon className="h-5 w-5 text-white/80" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{path.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/72">{path.body}</p>
                    <ul className="mt-4 space-y-2">
                      {path.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-sm leading-6 text-white/78">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a054]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Available now</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Materials ready for serious conversations
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  The package is built to support lender calls, investor meetings, and design-partner
                  outreach without changing the company story every time the audience changes.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {materials.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/80">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Near-term targets</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  What progress should look like in the next 90 days
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {milestones.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/80">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#4a90b8]/25 bg-[#4a90b8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4a90b8]">
                  <Workflow className="h-3.5 w-3.5" />
                  Request materials
                </div>
                <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white">
                  Send a note and we will route the right package.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  Lenders, investors, and design partners need different slices of the same company
                  story. This form routes the request into the same operating pipeline as the rest of
                  the commercial workflow.
                </p>
                <div className="mt-6 rounded-2xl border border-[#d4a054]/20 bg-[#d4a054]/10 p-5">
                  <div className="flex items-start gap-3">
                    <Radar className="mt-1 h-5 w-5 shrink-0 text-[#d4a054]" />
                    <p className="text-sm leading-7 text-white/80">
                      Keep the ask simple: Lyte + Alloy now, expansion lanes later, proof and customer
                      truth as the filter for everything else.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 lg:p-8">
                {sent ? (
                  <div className="rounded-2xl border border-[#d4a054]/20 bg-[#d4a054]/10 p-6">
                    <p className="text-lg font-semibold text-white">Request received.</p>
                    <p className="mt-2 text-sm leading-7 text-white/80">
                      We will follow up with the relevant materials and next step.
                    </p>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={onSubmit}>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                        Email
                      </label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
                        placeholder="you@firm.com"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                        Firm or company
                      </label>
                      <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                        What are you looking for?
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
                        placeholder="Bank / SBA conversation, angel materials, design-partner proposal, etc."
                      />
                    </div>
                    {error ? <p className="text-sm text-[#c45a4a]">{error}</p> : null}
                    <button
                      type="submit"
                      disabled={!canSubmit || submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Sending..." : "Request materials"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
