import { useMemo, useState } from "react";
import { m } from "framer-motion";
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
  "3–5 serious lender conversations",
  "20+ target investor conversations",
  "3–5 design-partner prospects in pipeline",
  "1–2 paid pilots or structured discovery engagements",
];

export default function InvestorRelationsPage() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  usePageMeta({
    title: "Investor Relations — SZL Holdings",
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
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(38,72%,58%,0.25)", background: "hsla(38,72%,58%,0.08)", marginBottom: "1.75rem" }}>
                <FileText size={13} color="hsl(38,72%,58%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(38,72%,58%)" }}>Investor Relations</span>
              </div>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                Capital materials for a disciplined company narrative.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "54ch", marginBottom: "2.25rem" }}>
                SZL Holdings is running a focused capital story around Lyte + Alloy. The objective is
                to align lenders, investors, and design partners around one commercial wedge, one
                product narrative, and one execution plan.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/contact" className="szl-btn-primary">Start a conversation <ArrowRight size={15} /></Link>
                <a href="mailto:hello@szlholdings.com" className="szl-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <Mail size={14} /> hello@szlholdings.com
                </a>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", marginBottom: "1rem" }}>Capital Paths</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Three sources of momentum
              </h2>
            </m.div>
            <div className="szl-grid-3">
              {capitalPaths.map((path, i) => {
                const Icon = path.icon;
                return (
                  <m.div key={path.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                    <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(0,0%,100%,0.04)", border: "1px solid var(--color-szl-border)", borderRadius: "0.5rem", marginBottom: "1.25rem" }}>
                      <Icon size={18} color="hsl(38,8%,78%)" />
                    </div>
                    <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.75rem" }}>{path.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.72, color: "hsl(214,7%,60%)", marginBottom: "1.25rem" }}>{path.body}</p>
                    <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {path.bullets.map((bullet) => (
                        <li key={bullet} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8625rem", lineHeight: 1.55, color: "hsl(38,8%,75%)" }}>
                          <CheckCircle2 size={14} color="hsl(38,72%,58%)" style={{ flexShrink: 0, marginTop: "2px" }} />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem", gridTemplateColumns: "1fr" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", marginBottom: "1rem" }}>Available Now</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "0.75rem" }}>
                  Materials ready for serious conversations
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,60%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                  The package is built to support lender calls, investor meetings, and design-partner
                  outreach without changing the company story every time the audience changes.
                </p>
              </m.div>
              <div className="szl-grid-3">
                {materials.map((item, i) => (
                  <m.div key={item} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.04 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "1.25rem 1.5rem" }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{item}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(145,62%,46%)", marginBottom: "1rem" }}>Near-Term Targets</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2.5rem" }}>
                What progress should look like in the next 90 days
              </h2>
            </m.div>
            <div className="szl-grid-2">
              {milestones.map((item, i) => (
                <m.div key={item} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.05 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "1.25rem 1.5rem" }}>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, fontWeight: 500 }}>{item}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(206,72%,52%,0.25)", background: "hsla(206,72%,52%,0.08)", marginBottom: "1.5rem" }}>
                  <Workflow size={13} color="hsl(206,72%,52%)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(206,72%,52%)" }}>Request Materials</span>
                </div>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "0.75rem" }}>
                  Send a note and we will route the right package.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,60%)", maxWidth: "52ch", marginBottom: "1.5rem" }}>
                  Lenders, investors, and design partners need different slices of the same company
                  story. This form routes the request into the same operating pipeline as the rest of
                  the commercial workflow.
                </p>
                <div className="szl-card" style={{ borderRadius: "0.75rem", padding: "1.25rem 1.5rem", borderLeft: "3px solid hsl(38,72%,58%)", maxWidth: "520px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <Radar size={18} color="hsl(38,72%,58%)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.72, color: "hsl(38,8%,78%)" }}>
                      Keep the ask simple: Lyte + Alloy now, expansion lanes later, proof and customer
                      truth as the filter for everything else.
                    </p>
                  </div>
                </div>
              </m.div>

              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.1 }} className="szl-card" style={{ borderRadius: "1rem", padding: "clamp(1.5rem,3vw,2.5rem)", maxWidth: "600px" }}>
                {sent ? (
                  <div style={{ borderRadius: "0.75rem", border: "1px solid hsla(38,72%,58%,0.25)", background: "hsla(38,72%,58%,0.08)", padding: "1.5rem" }}>
                    <p style={{ fontSize: "1.0625rem", fontWeight: 600, marginBottom: "0.5rem" }}>Request received.</p>
                    <p style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "hsl(214,7%,60%)" }}>
                      We will follow up with the relevant materials and next step.
                    </p>
                  </div>
                ) : (
                  <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={onSubmit}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(214,7%,48%)" }}>Email</label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        style={{ width: "100%", borderRadius: "0.625rem", border: "1px solid var(--color-szl-border)", background: "hsla(0,0%,0%,0.3)", padding: "0.75rem 1rem", fontSize: "0.9375rem", color: "hsl(38,8%,90%)", outline: "none" }}
                        placeholder="you@firm.com"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(214,7%,48%)" }}>Firm or company</label>
                      <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        style={{ width: "100%", borderRadius: "0.625rem", border: "1px solid var(--color-szl-border)", background: "hsla(0,0%,0%,0.3)", padding: "0.75rem 1rem", fontSize: "0.9375rem", color: "hsl(38,8%,90%)", outline: "none" }}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(214,7%,48%)" }}>What are you looking for?</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        style={{ width: "100%", borderRadius: "0.625rem", border: "1px solid var(--color-szl-border)", background: "hsla(0,0%,0%,0.3)", padding: "0.75rem 1rem", fontSize: "0.9375rem", color: "hsl(38,8%,90%)", outline: "none", resize: "vertical" }}
                        placeholder="Bank / SBA conversation, angel materials, design-partner proposal, etc."
                      />
                    </div>
                    {error ? <p style={{ fontSize: "0.875rem", color: "hsl(0,60%,55%)" }}>{error}</p> : null}
                    <button
                      type="submit"
                      disabled={!canSubmit || submitting}
                      className="szl-btn-primary"
                      style={{ alignSelf: "flex-start", opacity: !canSubmit || submitting ? 0.6 : 1, cursor: !canSubmit || submitting ? "not-allowed" : "pointer" }}
                    >
                      {submitting ? "Sending..." : "Request materials"} <ArrowRight size={14} />
                    </button>
                  </form>
                )}
              </m.div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
