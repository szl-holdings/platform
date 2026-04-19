import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, AlertOctagon, Eye, Database, Lock, Zap, ArrowRightCircle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CAPABILITIES = [
  { icon: Eye, title: "SOC Command Surface", body: "Unified threat visibility across your security stack. Alerts, incidents, findings, and analyst queues in one command view — not a dozen dashboards." },
  { icon: AlertOctagon, title: "Incident Response Routing", body: "When a threat signal crosses threshold, Alloy routes the incident to the right analyst with full context, playbook reference, and approval chain ready." },
  { icon: Lock, title: "Identity & Access Intelligence", body: "Surface anomalous authentication, privilege escalation signals, and access drift before they become incidents. Attribution tied to role and scope." },
  { icon: Database, title: "XDR Signal Normalization", body: "Normalize threat signals from endpoint, network, identity, and cloud layers into a single structured feed — severity scored and context enriched." },
  { icon: ShieldCheck, title: "Compliance Audit Trail", body: "Every security decision, investigation step, and action is logged with full attribution. Designed for regulatory frameworks, not as an afterthought." },
  { icon: Zap, title: "Managed Operations Layer", body: "For teams that need managed security operations support — Aegis provides the operating model, Alloy provides the execution layer, with HITL gates throughout." },
];

const USE_CASES = [
  {
    label: "Incident response",
    title: "From privilege escalation alert to governed remediation",
    role: "SOC Analyst → Incident Commander → CISO",
    steps: [
      { signal: true, text: "Privilege escalation signal fires — anomalous admin access detected at 02:14 UTC" },
      { text: "SOC analyst opens correlated event timeline: three failed logins, one successful auth, lateral movement indicator" },
      { text: "Alloy routes incident to on-call incident commander with playbook reference and approval chain pre-staged" },
      { text: "Incident commander approves containment action — access revoked, endpoint isolated" },
      { proof: true, text: "Proof Chain logs decision with analyst attribution, playbook version, and remediation timestamp" },
    ],
  },
  {
    label: "Compliance audit",
    title: "Regulatory audit request delivered without scrambling",
    role: "Compliance Officer → Legal → External Auditor",
    steps: [
      { signal: true, text: "External audit request arrives — auditor requires 90-day access event log for three privileged roles" },
      { text: "Compliance officer opens Aegis audit surface, applies role filter and date range" },
      { text: "Covenant Policy enforces export scope — confirms output stays within approved disclosure boundary" },
      { text: "Report generated with full attribution: user, timestamp, action, approval state, and outcome for every event" },
      { proof: true, text: "Proof Chain-backed export delivered — defensible, complete, and signed off in the governed decision loop" },
    ],
  },
  {
    label: "Threat triage",
    title: "Third-party CVE report → prioritized remediation decision",
    role: "Security Engineer → CISO → Change Approval Board",
    steps: [
      { signal: true, text: "Critical CVE reported against a core infrastructure dependency — severity 9.1, active exploit in the wild" },
      { text: "Aegis enriches with asset exposure map: 14 production systems at risk, two in regulated scope" },
      { text: "Decision Simulation models remediation options — emergency patch vs. compensating control — with risk delta for each" },
      { text: "CISO reviews simulation output, selects emergency patch path, submits for Change Approval Board sign-off" },
      { proof: true, text: "Alloy executes the approved patch workflow; Proof Chain records the full decision chain for post-incident review" },
    ],
  },
];

function UseCaseLane({ useCase, color, delay }: { useCase: typeof USE_CASES[0]; color: string; delay: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.42, delay }}
      className="szl-card"
      style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)", display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color, opacity: 0.85 }}>{useCase.label}</span>
        <h3 style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", fontWeight: 600, letterSpacing: "-0.016em", lineHeight: 1.3, marginTop: "0.4rem", marginBottom: "0.375rem" }}>{useCase.title}</h3>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "hsl(214,7%,48%)", letterSpacing: "0.06em" }}>{useCase.role}</p>
      </div>
      <ol style={{ display: "flex", flexDirection: "column", gap: "0", listStyle: "none", margin: 0, padding: 0 }}>
        {useCase.steps.map((step, i) => (
          <li key={i} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: step.signal ? `hsla(222,60%,50%,0.15)` : step.proof ? `hsla(152,70%,50%,0.12)` : "hsla(214,12%,14%,1)",
                border: step.signal ? `1px solid hsla(222,60%,50%,0.35)` : step.proof ? `1px solid hsla(152,70%,50%,0.30)` : "1px solid hsla(0,0%,100%,0.08)",
                fontSize: "0.6rem", fontWeight: 700, color: step.signal ? "hsl(222,60%,70%)" : step.proof ? "hsl(152,70%,55%)" : "hsl(214,7%,52%)",
                fontFamily: "var(--font-mono)",
              }}>
                {i + 1}
              </div>
              {i < useCase.steps.length - 1 && (
                <div style={{ width: "1px", height: "1.5rem", background: "hsla(0,0%,100%,0.07)", margin: "0.25rem 0" }} />
              )}
            </div>
            <div style={{ paddingBottom: i < useCase.steps.length - 1 ? "0" : "0", paddingTop: "0.2rem" }}>
              <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: step.signal ? "hsl(38,8%,88%)" : step.proof ? "hsl(152,40%,72%)" : "hsl(214,7%,62%)", marginBottom: i < useCase.steps.length - 1 ? "0" : "0" }}>
                {step.signal && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(222,60%,68%)", marginRight: "0.4rem" }}>Signal</span>}
                {step.proof && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(152,70%,55%)", marginRight: "0.4rem" }}>Proof Chain</span>}
                {step.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </m.div>
  );
}

export default function SolutionsAegisPage() {
  usePageMeta({
    title: "Aegis — Security & Defense Intelligence · SZL Holdings",
    description: "SOC command, MITRE ATT&CK mapping, SOAR playbooks, policy-gated triage with human approval. Aegis is the security & defense domain pack — built on the same governance infrastructure as every SZL product.",
    canonical: "https://szlholdings.com/solutions/aegis",
    ogImage: "https://szlholdings.com/og/og-aegis.jpg",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">
        <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(222,60%,50%,0.06) 0%, transparent 60%)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                <Link href="/solutions" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>
                  Solutions
                </Link>
                <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-aegis)", opacity: 0.9 }}>
                  Aegis
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
                <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-aegis-muted)", border: "1px solid hsla(222,60%,50%,0.20)", borderRadius: "0.5625rem" }}>
                  <ShieldCheck size={20} color="var(--color-aegis)" />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-aegis)", opacity: 0.8 }}>Defense & Intelligence</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>Aegis</h1>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: "hsla(222,60%,50%,0.12)", border: "1px solid hsla(222,60%,50%,0.25)", fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-aegis)", alignSelf: "flex-start", marginTop: "0.5rem" }}>Beta</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch", marginBottom: "2.25rem" }}>
                SOC command, XDR, and managed security operations — built on the Lyte + Alloy
                platform for environments where every decision has consequence and every action
                needs an audit trail.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/contact" className="szl-btn-primary">Request a walkthrough <ArrowRight size={15} /></Link>
                <Link href="/solutions/aegis/trust" className="szl-btn-secondary">Trust & Governance</Link>
                <Link href="/solutions" className="szl-btn-secondary">All solutions</Link>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-aegis)", marginBottom: "1rem" }}>Capabilities</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                The full security operations stack, governed.
              </h2>
            </m.div>
            <div className="szl-grid-3">
              {CAPABILITIES.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <m.div key={cap.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                    <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-aegis-muted)", border: "1px solid hsla(222,60%,50%,0.18)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                      <Icon size={16} color="var(--color-aegis)" />
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{cap.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{cap.body}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-aegis)", marginBottom: "1rem" }}>Scenarios</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "36ch", marginBottom: "0.75rem" }}>
                A day in the life of a governed security operation.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "hsl(214,7%,56%)", maxWidth: "56ch", marginBottom: "3rem" }}>
                Signal fires. Analyst acts. Decision is captured. Every step of every consequential security workflow follows the same governed loop — regardless of threat type or team size.
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))", gap: "1.25rem" }}>
              {USE_CASES.map((uc, i) => (
                <UseCaseLane key={uc.label} useCase={uc} color="var(--color-aegis)" delay={i * 0.08} />
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="szl-card szl-grid-cta" style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.2, marginBottom: "0.875rem" }}>Discuss a pilot or walkthrough.</h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>Aegis is currently in pilot with security teams in high-consequence operating environments. Talk to us about your environment.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                <Link href="/contact" className="szl-btn-primary">Discuss a pilot <ArrowRight size={14} /></Link>
                <Link href="/solutions" className="szl-btn-secondary" style={{ textAlign: "center" }}>All solutions</Link>
              </div>
            </m.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
