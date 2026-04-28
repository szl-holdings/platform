import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Settings, Activity, Server, AlertTriangle, Clock, Database, ShieldCheck, Globe } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CAPABILITIES = [
  {
    icon: Activity,
    title: "Continuous health monitoring",
    body: "Every service, connector, and workflow in the platform is continuously monitored. Health degradation is surfaced through the admin diagnostics layer before it reaches end users — not after.",
  },
  {
    icon: Server,
    title: "Per-tenant service observability",
    body: "Request latency, error rates, queue depths, and connector health are tracked per tenant. Operators see real-time service health with trend data — not just static uptime badges.",
  },
  {
    icon: AlertTriangle,
    title: "Structured incident management",
    body: "When a service degrades, the platform creates a structured incident record: root cause context, affected tenants, resolution timeline, and communication log. Incidents are visible in the admin surface.",
  },
  {
    icon: Clock,
    title: "Retry, replay, and recovery",
    body: "Failed ingestion jobs, webhook deliveries, and async workflows are retried with exponential backoff. Operators can replay specific events through the admin interface for a 30-day window.",
  },
  {
    icon: Database,
    title: "Architectural tenant isolation",
    body: "Every query, every export, and every AI inference is scoped to the requesting tenant at the database and middleware layer. Cross-tenant data access is blocked at the query layer through enforced organization-id guards on every data path.",
  },
  {
    icon: ShieldCheck,
    title: "Runbook-backed operations",
    body: "Critical operational procedures — tenant onboarding, connector rotation, incident response, data export — are documented in runbooks that operators follow. No undocumented manual procedures.",
  },
];

const ADMIN_VISIBILITY = [
  { label: "Real-time connector health", body: "Every external integration connector has a live health indicator in the admin surface — response time, last sync, error rate, and authentication status." },
  { label: "Ingestion pipeline monitoring", body: "Data ingestion pipelines show job status, queue depth, processing latency, and error detail in the admin diagnostics layer — not just success/fail." },
  { label: "Per-tenant audit log access", body: "Tenant admins can access the full audit log for their organization — every action, every approval, every AI decision — from the admin interface." },
  { label: "Workflow execution visibility", body: "Every Counsel workflow execution is visible in the admin surface: trigger, approval chain, execution, outcome, and SLA status." },
];

const EXTERNAL_DATA_POLICY = [
  { label: "Ingestion scope", body: "External data ingestion is scoped to the source types explicitly configured by the tenant. No silent collection from unconfigured sources." },
  { label: "External data provenance", body: "Every data point ingested through external sources carries a provenance record: origin system, ingestion timestamp, schema version, and processing status." },
  { label: "Retention governance", body: "Data retention policies are defined per data category and enforced at the storage layer. Expired data is purged on schedule, not on request." },
  { label: "External provider boundaries", body: "External data providers receive only the minimum context required for their integration. No cross-tenant data sharing through integration layers." },
];

const METRICS = [
  { label: "Ingestion uptime target", value: "99.9%", sub: "Operational target" },
  { label: "Export audit retention", value: "7 years", sub: "Default retention; enterprise contracts may specify custom terms" },
  { label: "Incident response target", value: "< 4 hrs", sub: "Initial acknowledgement" },
  { label: "Failed job replay window", value: "30 days", sub: "Replay availability" },
];

export default function TrustOperationsPage() {
  const __pageMeta = usePageMeta({
    title: "Operations — Trust Center · SZL Holdings",
    description: "Operational model, admin visibility, incident management, external data policy, and supportability for KORA + Counsel.",
    canonical: "https://szlholdings.com/trust/operations",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(200,70%,52%,0.04) 0%, transparent 60%)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                  <Link href="/trust" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Trust Center</Link>
                  <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(200,70%,52%)" }}>Operations</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(200,70%,52%,0.08)", border: "1px solid hsla(200,70%,52%,0.20)", borderRadius: "0.5625rem" }}>
                    <Settings size={20} color="hsl(200,70%,52%)" />
                  </div>
                  <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>Operations</h1>
                </div>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.0625rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                  A platform is only as trustworthy as its operations. SZL backs every trust claim with
                  observable operations: health monitoring, structured incidents, retry policies, architectural
                  tenant isolation, external data governance, and documented runbooks — no undocumented procedures.
                </p>
              </m.div>
            </div>
          </section>
  
          {/* Operational targets */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "2.5rem 0", background: "hsla(214,12%,6%,0.60)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem" }}>
                {METRICS.map((metric, i) => (
                  <m.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "1.25rem", textAlign: "center" }}
                  >
                    <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "hsl(200,70%,52%)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>{metric.value}</div>
                    <div style={{ fontSize: "0.8125rem", color: "hsl(214,7%,56%)", marginTop: "0.375rem" }}>{metric.label}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(200,70%,52%)", marginTop: "0.25rem", opacity: 0.7, letterSpacing: "0.06em" }}>{metric.sub}</div>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Operational capabilities */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(200,70%,52%)", marginBottom: "1rem" }}>Capabilities</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                  Observable operations across every layer.
                </h2>
              </m.div>
              <div className="szl-grid-2">
                {CAPABILITIES.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <m.div
                      key={c.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.38, delay: i * 0.06 }}
                      className="szl-card"
                      style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}
                    >
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(200,70%,52%,0.08)", border: "1px solid hsla(200,70%,52%,0.20)", borderRadius: "0.4375rem", flexShrink: 0, marginTop: "1px" }}>
                        <Icon size={16} color="hsl(200,70%,52%)" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.625rem", lineHeight: 1.4 }}>{c.title}</h3>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{c.body}</p>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Admin visibility */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(200,70%,52%)", marginBottom: "1rem" }}>Admin visibility</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                  What operators and admins can see.
                </h2>
              </m.div>
              <div className="szl-grid-2">
                {ADMIN_VISIBILITY.map((item, i) => (
                  <m.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.07 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                  >
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem", color: "hsl(38,8%,88%)" }}>{item.label}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{item.body}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* External data policy */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Globe size={14} color="hsl(200,70%,52%)" />
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(200,70%,52%)" }}>External data policy</p>
                </div>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                  How external and audit timeline data is handled.
                </h2>
              </m.div>
              <div className="szl-grid-2">
                {EXTERNAL_DATA_POLICY.map((item, i) => (
                  <m.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.07 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                  >
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem", color: "hsl(38,8%,88%)" }}>{item.label}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{item.body}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "var(--space-section-sm) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/trust/security" className="szl-btn-secondary">Security posture →</Link>
                <Link href="/trust/architecture" className="szl-btn-secondary">Architecture →</Link>
                <Link href="/contact" className="szl-btn-ghost">Request operations review <ArrowRight size={13} /></Link>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
