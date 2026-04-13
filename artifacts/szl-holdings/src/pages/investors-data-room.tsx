import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  FileText,
  ArrowRight,
  Lock,
  Building2,
  Layers,
  Shield,
  Map,
  User,
  CheckCircle2,
  Mail,
  TrendingUp,
  Eye,
  BarChart3,
  Zap,
} from "lucide-react";
import { m } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const BLURRED_METRICS = [
  { label: "ARR Trajectory", value: "••••", sub: "YoY growth rate — NDA required", icon: TrendingUp, color: "hsl(140,50%,48%)" },
  { label: "Platform Valuation", value: "••••", sub: "Current cap structure — NDA required", icon: BarChart3, color: "hsl(38,72%,58%)" },
  { label: "Design Partner MRR", value: "••••", sub: "Aggregate design-partner revenue", icon: Zap, color: "hsl(192,72%,48%)" },
  { label: "Cap Table Summary", value: "••••", sub: "Investor composition — qualified only", icon: User, color: "hsl(222,60%,62%)" },
];

const BLURRED_DOCS = [
  { title: "Pitch Deck — Series A", pages: "28 slides", tag: "Investor framed" },
  { title: "Financial Model — 5Y", pages: "Excel workbook", tag: "Full projections" },
  { title: "Cap Table & Terms", pages: "3 pages", tag: "NDA required" },
  { title: "Architecture Overview", pages: "12 pages", tag: "Technical diligence" },
  { title: "PULSE EVALS Report", pages: "8 pages", tag: "Benchmark data" },
  { title: "Design Partner Case Studies", pages: "6 case studies", tag: "Redacted names" },
];

function DataRoomNewsletterCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "newsletter",
          name: email.split("@")[0],
          email,
          app: "szl-holdings",
          message: "Monthly Investor Update signup from data room",
          metadata: { source: "data-room-newsletter" },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{ padding: "1.5rem 2rem", borderRadius: "0.875rem", background: "hsla(38,72%,58%,0.04)", border: "1px solid hsla(38,72%,58%,0.15)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1.5rem" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Mail size={14} style={{ color: "hsl(38,72%,58%)" }} />
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", fontFamily: "var(--font-mono)" }}>
            Monthly Investor Update
          </p>
        </div>
        <p style={{ fontSize: "0.875rem", color: "hsla(0,0%,100%,0.6)", lineHeight: 1.5 }}>
          Platform milestones, design-partner signals, and the honest view while you wait for data room access.
        </p>
      </div>
      <div style={{ minWidth: "260px", flex: "1 1 260px", maxWidth: "380px" }}>
        {status === "success" ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "hsla(145,60%,46%,0.12)", border: "1px solid hsla(145,60%,46%,0.25)" }}>
            <CheckCircle2 size={14} style={{ color: "hsl(145,60%,72%)" }} />
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(145,60%,72%)" }}>You're on the investor update list.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" disabled={status === "submitting"} style={{ flex: 1, padding: "0.5rem 0.875rem", background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.12)", borderRadius: "0.375rem", color: "hsl(38,8%,92%)", fontSize: "0.8125rem", outline: "none" }} />
            <button type="submit" disabled={status === "submitting"} style={{ padding: "0.5rem 1rem", background: "hsl(38,72%,58%)", color: "hsl(214,18%,4%)", border: "none", borderRadius: "0.375rem", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              {status === "submitting" ? "…" : "Subscribe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function BlurredDataRoomPreview() {
  return (
    <div style={{ position: "relative", borderRadius: "1rem", border: "1px solid hsla(0,0%,100%,0.08)", overflow: "hidden" }}>
      <div style={{ padding: "1.5rem", filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }} className="sm:grid-cols-4">
          {BLURRED_METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} style={{ padding: "1rem", borderRadius: "0.625rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem" }}>
                  <Icon size={11} style={{ color: m.color }} />
                  <span style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsla(0,0%,100%,0.35)", fontFamily: "var(--font-mono)" }}>{m.label}</span>
                </div>
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: m.color, letterSpacing: "-0.02em" }}>{m.value}</p>
                <p style={{ fontSize: "0.625rem", color: "hsla(0,0%,100%,0.3)", marginTop: "0.25rem" }}>{m.sub}</p>
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.625rem" }} className="sm:grid-cols-3">
          {BLURRED_DOCS.map((doc) => (
            <div key={doc.title} style={{ padding: "0.875rem 1rem", borderRadius: "0.5rem", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <FileText size={14} style={{ color: "hsla(0,0%,100%,0.3)", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)" }}>{doc.title}</p>
                <p style={{ fontSize: "0.625rem", color: "hsla(0,0%,100%,0.35)", fontFamily: "var(--font-mono)", marginTop: "0.125rem" }}>{doc.pages} · {doc.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom, hsla(214,18%,4%,0.4) 0%, hsla(214,18%,4%,0.85) 100%)",
        backdropFilter: "blur(2px)",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
      }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.12)" }}>
          <Lock size={18} style={{ color: "hsl(38,72%,58%)" }} />
        </div>
        <div>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.375rem" }}>Full data room requires qualification</p>
          <p style={{ fontSize: "0.8125rem", color: "hsla(0,0%,100%,0.5)", maxWidth: "28ch", lineHeight: 1.5 }}>
            Request access below — we respond within 24 hours with materials matched to your stage.
          </p>
        </div>
        <a
          href="#access-request"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.375rem", background: "hsl(38,72%,58%)", color: "hsl(214,18%,4%)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 700, textDecoration: "none" }}
        >
          <Eye size={14} />
          Request Full Access
        </a>
      </div>
    </div>
  );
}

const documentCategories = [
  {
    icon: Building2,
    color: "#d4a054",
    title: "Company Overview",
    description: "One-page company summary, category definition, and strategic positioning.",
    documents: [
      "Company one-pager",
      "Category positioning memo",
      "Portfolio overview",
      "Mission and operating thesis",
    ],
  },
  {
    icon: Layers,
    color: "#8b7ac8",
    title: "Product & Architecture",
    description:
      "Technical architecture documentation, stack overview, and product demonstration materials.",
    documents: [
      "Architecture overview (investor-framed)",
      "Six-layer stack documentation",
      "Live product demo access",
      "Model Mesh and AI governance spec",
    ],
  },
  {
    icon: Shield,
    color: "#4a90b8",
    title: "Moat & Defensibility",
    description:
      "Competitive analysis, differentiation framework, and architectural defensibility memo.",
    documents: [
      "Moat analysis memo",
      "Competitive landscape overview",
      "Platform architecture vs. point solution comparison",
      "Microsoft 365 integration strategy",
    ],
  },
  {
    icon: Map,
    color: "#6aaa72",
    title: "Commercial Strategy",
    description:
      "Go-to-market plan, design-partner strategy, ICP definition, and revenue model overview.",
    documents: [
      "GTM strategy overview",
      "Design-partner program terms",
      "Ideal customer profile definition",
      "Revenue model and pricing framework",
    ],
  },
  {
    icon: FileText,
    color: "#c8953c",
    title: "Operating Plan",
    description: "90-day operating plan, milestone tracker, and capital allocation framework.",
    documents: [
      "90-day execution plan",
      "Milestone and proof-object tracker",
      "Capital use framework",
      "Founder operating memo",
    ],
  },
  {
    icon: User,
    color: "#a07a5a",
    title: "Founder & Team",
    description: "Founder background, operating philosophy, and team overview.",
    documents: [
      "Founder bio and thesis",
      "Operating philosophy document",
      "Team and advisor overview",
      "Founder-market fit memo",
    ],
  },
];

const accessTiers = [
  {
    label: "Initial conversation",
    description: "Company one-pager, category overview, and live demo access. No request required.",
    action: "available",
  },
  {
    label: "Qualified interest",
    description:
      "Full product deck, architecture overview, commercial strategy, and operating plan. Request access below.",
    action: "request",
  },
  {
    label: "Active diligence",
    description:
      "Complete data room including legal documents, financial model, and design-partner materials. Requires NDA.",
    action: "contact",
  },
];

export default function InvestorsDataRoomPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [context, setContext] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => email.trim().length > 3 && name.trim().length > 1, [email, name]);

  usePageMeta({
    title: "Data Room — Investor Relations — SZL Holdings",
    description:
      "Request access to the SZL Holdings investor data room — company overview, architecture, commercial strategy, and operating plan.",
    canonical: "https://szlholdings.com/investors/data-room",
  });

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
          source: "data_room_request",
          name: name.trim(),
          email: email.trim(),
          subject: "Data Room Access Request",
          message: `Data room request from ${name.trim()} at ${firm.trim() || "unspecified firm"}.\n\nContext: ${context.trim() || "No context provided."}`,
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      setSent(true);
      setEmail("");
      setName("");
      setFirm("");
      setContext("");
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
        {/* Hero */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5a9a8a]/20 bg-[#5a9a8a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#5a9a8a]">
              <FileText className="h-3.5 w-3.5" />
              Data Room
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Structured materials for qualified investors.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
              The data room is organized by conversation stage. Initial materials are available
              immediately. Full diligence access is gated by qualification and NDA. Request access
              below and we will route the right package within 24 hours.
            </p>
          </div>
        </section>

        {/* Access tiers */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Access tiers
            </p>
            <div className="mt-8 space-y-3">
              {accessTiers.map((tier, i) => (
                <div
                  key={tier.label}
                  className="flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-black/20 text-xs font-bold text-white/50">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{tier.label}</p>
                    <p className="mt-1 text-sm text-white/50">{tier.description}</p>
                  </div>
                  <div className="shrink-0">
                    {tier.action === "available" ? (
                      <Link href="/demo">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#6aaa72]/25 bg-[#6aaa72]/10 px-3 py-1.5 text-xs font-semibold text-[#6aaa72] transition hover:bg-[#6aaa72]/15">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Available now
                        </span>
                      </Link>
                    ) : tier.action === "request" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4a054]/25 bg-[#d4a054]/10 px-3 py-1.5 text-xs font-semibold text-[#d4a054]">
                        Request below
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/45">
                        <Lock className="h-3.5 w-3.5" />
                        NDA required
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Blurred preview section */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40 mb-3">
              Preview — data room contents
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-white mb-8">
              A glimpse inside. Full access requires qualification.
            </h2>
            <BlurredDataRoomPreview />
          </div>
        </section>

        {/* Document categories */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Document categories
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              What's in the data room.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {documentCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.title}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                  >
                    <div
                      className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20"
                      style={{ color: cat.color }}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{cat.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/50">{cat.description}</p>
                    <ul className="mt-4 space-y-2">
                      {cat.documents.map((doc) => (
                        <li key={doc} className="flex items-center gap-2 text-xs text-white/40">
                          <div className="h-1 w-1 rounded-full bg-white/20" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Request form */}
        <section id="access-request">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                  Request access
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  We will route the right package.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  Qualified investors receive the full data room package within 24 hours. Include
                  context about your investment focus and we will tailor the materials to the
                  conversation.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Response within 24 hours",
                    "Materials tailored to your investment focus",
                    "Live demo available immediately — no request required",
                    "NDA available for full diligence package",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-white/60">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5a9a8a]" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <a
                    href="mailto:hello@szlholdings.com"
                    className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white/80 transition"
                  >
                    <Mail className="h-4 w-4" />
                    hello@szlholdings.com
                  </a>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 lg:p-8">
                {sent ? (
                  <div className="rounded-2xl border border-[#5a9a8a]/20 bg-[#5a9a8a]/10 p-6">
                    <p className="text-lg font-semibold text-white">Request received.</p>
                    <p className="mt-2 text-sm leading-7 text-white/70">
                      We will follow up with the relevant materials within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={onSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                          Your name
                        </label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
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
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                        Firm or organization
                      </label>
                      <input
                        value={firm}
                        onChange={(e) => setFirm(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                        Investment focus and context
                      </label>
                      <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
                        placeholder="Investment stage, sector focus, what you're evaluating, or any specific questions..."
                      />
                    </div>
                    {error && <p className="text-sm text-[#c45a4a]">{error}</p>}
                    <button
                      type="submit"
                      disabled={!canSubmit || submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Sending..." : "Request data room access"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
        {/* Investor Newsletter Capture */}
        <section style={{ borderTop: "1px solid hsla(0,0%,100%,0.07)" }}>
          <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
            <DataRoomNewsletterCapture />
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
