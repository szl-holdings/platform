import { m } from "framer-motion";
import { ArrowRight, Activity, AlertTriangle, Clock, CheckCircle2, Shield, GitBranch, Zap, Eye } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const RELIEFS = [
  {
    icon: Eye,
    symptom: "You find out about problems after they've already compounded.",
    relief: "Stop finding out last.",
    body: "Every workflow, approval queue, and ownership gap in your operation becomes legible before it turns into a crisis. Lyte instruments your existing systems — not a new one — and surfaces what's stuck, who owns it, and what's at risk.",
    color: "hsl(192,72%,48%)",
    product: "Lyte Command Center",
    cta: "/lyte",
  },
  {
    icon: AlertTriangle,
    symptom: "Threats surface in your SOC but the response is still manual, slow, and inconsistent.",
    relief: "Stop triaging threats by Slack.",
    body: "Aegis correlates threat signals across your attack surface and routes governed response actions through COVENANT — the policy enforcement layer that decides who can do what, under what conditions, with a full audit trail.",
    color: "hsl(0,72%,58%)",
    product: "Aegis SOC",
    cta: "/solutions/aegis",
  },
  {
    icon: Clock,
    symptom: "Your team spends more time getting approvals than doing the work that needs approving.",
    relief: "Stop burning hours on approval theater.",
    body: "FORGE RUNTIME routes consequential actions through the minimum viable approval gate — configured for your org structure. Every action is traceable. Nothing slips through unrecorded. Nothing gets blocked for no reason.",
    color: "hsl(38,90%,52%)",
    product: "FORGE RUNTIME",
    cta: "/platform",
  },
  {
    icon: Shield,
    symptom: "When a decision gets challenged, it takes days to reconstruct what happened and why.",
    relief: "Stop dreading the audit.",
    body: "RECEIPT GRAPH maintains an immutable provenance chain for every signal, action, approval, and outcome. When legal, compliance, or the board asks what happened and why, the answer is already structured and retrievable.",
    color: "hsl(142,52%,48%)",
    product: "RECEIPT GRAPH + COVENANT",
    cta: "/trust",
  },
  {
    icon: GitBranch,
    symptom: "Intelligence generated in one system never makes it to the people who need it in another.",
    relief: "Stop operating in silos.",
    body: "Cross-app handoff contracts route signals across Lyte, Aegis, Vessels, Terra, and Carlota Jo automatically. A threat in Aegis triggers a COVENANT response. A priority in Lyte creates a FORGE workflow. Intelligence compounds instead of fragmenting.",
    color: "hsl(280,52%,62%)",
    product: "PRISM BUS + HELM CONSOLE",
    cta: "/helm",
  },
  {
    icon: Zap,
    symptom: "You've built observability for your systems. You still don't have observability for your decisions.",
    relief: "Stop guessing at what's working.",
    body: "OUTCOME GRAPH tracks what actions were taken, what outcomes followed, and what the platform predicted versus what happened. PULSE EVALS measures model and process quality continuously. You see the ROI — not inferred, but traced.",
    color: "hsl(48,90%,52%)",
    product: "OUTCOME GRAPH + PULSE EVALS",
    cta: "/roi",
  },
];

const PLATFORM_PROOF = [
  { label: "Signal-to-action time", value: "8.4 min", desc: "median, across platform" },
  { label: "Approval overhead reduction", value: "62%", desc: "year-one average" },
  { label: "Handoff success rate", value: "98%", desc: "cross-app contracts" },
  { label: "Audit reconstruction time", value: "< 2 min", desc: "from RECEIPT GRAPH" },
];

export default function ReliefMessagingPage() {
  usePageMeta({
    title: "What SZL Relieves — Platform Intelligence | SZL Holdings",
    description: "SZL doesn't sell features. It relieves operational pain. See exactly what your team stops doing when the platform is live.",
    canonical: "https://szlholdings.com/relief",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main className="pt-24">

        <section style={{ padding: "5rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(38,90%,52%)", marginBottom: "0.75rem" }}>
                What the platform relieves
              </p>
              <h1 style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "hsl(38,12%,94%)", lineHeight: 1.05, marginBottom: "1.5rem" }}>
                You didn't build a<br />
                <span style={{ color: "hsl(38,90%,52%)" }}>company to manage<br />operational drag.</span>
              </h1>
              <p style={{ fontSize: "1.0625rem", lineHeight: 1.75, color: "hsl(210,5%,58%)", maxWidth: "44rem" }}>
                SZL is an intelligence platform. It instruments your operations, surfaces what's stuck, routes what needs to move, and records every action so you never have to reconstruct what happened. 
                Here's what teams stop doing when it's live.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 4rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {RELIEFS.map((relief, i) => (
                <m.div
                  key={relief.relief}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  style={{
                    background: "hsl(210,12%,8%)",
                    border: "1px solid hsl(210,12%,14%)",
                    borderRadius: "16px",
                    padding: "2.5rem",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr 1fr",
                    gap: "2rem",
                    alignItems: "start",
                  }}
                >
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${relief.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <relief.icon size={22} style={{ color: relief.color }} />
                  </div>

                  <div>
                    <p style={{ fontSize: "13px", lineHeight: 1.6, color: "hsl(210,5%,42%)", fontStyle: "italic", marginBottom: "0.75rem", maxWidth: "36rem" }}>
                      "{relief.symptom}"
                    </p>
                    <h3 style={{ fontSize: "1.375rem", fontWeight: 800, color: relief.color, letterSpacing: "-0.02em", marginBottom: "0.75rem", lineHeight: 1.2 }}>
                      {relief.relief}
                    </h3>
                    <p style={{ fontSize: "14px", lineHeight: 1.75, color: "hsl(210,5%,62%)", maxWidth: "36rem" }}>
                      {relief.body}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ background: "hsl(210,12%,6%)", borderRadius: "8px", padding: "0.875rem 1rem", border: `1px solid ${relief.color}22` }}>
                      <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Platform</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: relief.color }}>{relief.product}</div>
                    </div>
                    <Link href={relief.cta} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: relief.color, fontWeight: 600, fontSize: "13px", textDecoration: "none" }}>
                      Learn more
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0 4rem", borderTop: "1px solid hsl(210,12%,10%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ marginBottom: "2rem" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                Platform proof
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,94%)" }}>
                Numbers from the platform, not marketing.
              </h2>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "3rem" }}>
              {PLATFORM_PROOF.map((proof, i) => (
                <m.div
                  key={proof.label}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  style={{ background: "hsl(210,12%,8%)", border: "1px solid hsl(210,12%,14%)", borderRadius: "12px", padding: "1.5rem" }}
                >
                  <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "hsl(38,90%,52%)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.5rem" }}>{proof.value}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,84%)", marginBottom: "0.25rem" }}>{proof.label}</div>
                  <div style={{ fontSize: "11px", color: "hsl(210,5%,42%)" }}>{proof.desc}</div>
                </m.div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/roi" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.75rem", borderRadius: "8px", background: "hsl(38,90%,52%)", color: "hsl(210,12%,5%)", fontWeight: 700, fontSize: "15px", textDecoration: "none" }}>
                Calculate your ROI
                <ArrowRight size={16} />
              </Link>
              <Link href="/packages" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.75rem", borderRadius: "8px", border: "1px solid hsl(210,12%,22%)", color: "hsl(38,12%,84%)", fontWeight: 600, fontSize: "15px", textDecoration: "none" }}>
                See packages
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
