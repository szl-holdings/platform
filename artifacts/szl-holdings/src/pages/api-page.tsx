import { m } from "framer-motion";
import { Link } from "wouter";
import { Terminal, ArrowRight, Lock, Activity, Layers, CheckCircle, AlertCircle, RefreshCw, FileText, Cpu } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const ENDPOINT_GROUPS = [
  {
    group: "Health & Readiness",
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,40%,0.08)",
    colorBorder: "hsla(145,62%,40%,0.20)",
    icon: Activity,
    endpoints: [
      { method: "GET", path: "/health", desc: "Platform health status — live check" },
      { method: "GET", path: "/health/ready", desc: "Readiness gate — returns 200 only when fully initialized" },
      { method: "GET", path: "/health/dependencies", desc: "Upstream dependency health — DB, cache, connectors" },
    ],
  },
  {
    group: "Authentication",
    color: "hsl(40,90%,54%)",
    colorMuted: "hsla(40,90%,54%,0.08)",
    colorBorder: "hsla(40,90%,54%,0.22)",
    icon: Lock,
    endpoints: [
      { method: "POST", path: "/auth/session", desc: "Create authenticated session from OIDC token" },
      { method: "DELETE", path: "/auth/session", desc: "Terminate session and invalidate token" },
      { method: "GET", path: "/auth/me", desc: "Current session user, role, and tenant context" },
      { method: "POST", path: "/auth/refresh", desc: "Refresh session token within active window" },
    ],
  },
  {
    group: "Signals",
    color: "var(--color-lyte-light)",
    colorMuted: "var(--color-lyte-muted)",
    colorBorder: "var(--color-lyte-border)",
    icon: Activity,
    endpoints: [
      { method: "GET", path: "/signals", desc: "List active signals for the tenant, with classification and severity" },
      { method: "GET", path: "/signals/:id", desc: "Signal detail — source, classification, context, linked workflows" },
      { method: "POST", path: "/signals/ingest", desc: "Ingest an external signal via webhook or push" },
      { method: "GET", path: "/signals/history", desc: "Paginated signal history with filter support" },
      { method: "PATCH", path: "/signals/:id/status", desc: "Update signal status — acknowledge, dismiss, escalate" },
    ],
  },
  {
    group: "Workflows",
    color: "var(--color-alloy-light)",
    colorMuted: "var(--color-alloy-muted)",
    colorBorder: "var(--color-alloy-border)",
    icon: RefreshCw,
    endpoints: [
      { method: "GET", path: "/workflows", desc: "List workflows for the tenant — active, pending, completed" },
      { method: "GET", path: "/workflows/:id", desc: "Workflow detail — current state, approval chain, timeline" },
      { method: "POST", path: "/workflows", desc: "Create a new workflow from a template or signal trigger" },
      { method: "PATCH", path: "/workflows/:id", desc: "Update workflow state — advance, pause, cancel" },
      { method: "GET", path: "/workflows/:id/history", desc: "Full state transition history for a workflow" },
    ],
  },
  {
    group: "Recommendations",
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
    icon: Cpu,
    endpoints: [
      { method: "GET", path: "/recommendations", desc: "Pending AI recommendations awaiting human review" },
      { method: "GET", path: "/recommendations/:id", desc: "Recommendation detail — signal basis, confidence, proposed action" },
      { method: "POST", path: "/recommendations/:id/approve", desc: "Approve a recommendation — triggers execution" },
      { method: "POST", path: "/recommendations/:id/reject", desc: "Reject a recommendation with optional rationale" },
      { method: "POST", path: "/recommendations/:id/defer", desc: "Defer a recommendation with a review timestamp" },
    ],
  },
  {
    group: "Audit & Events",
    color: "hsl(195,70%,48%)",
    colorMuted: "hsla(195,70%,48%,0.08)",
    colorBorder: "hsla(195,70%,48%,0.20)",
    icon: FileText,
    endpoints: [
      { method: "GET", path: "/audit", desc: "Query audit trail — filterable by actor, action type, entity, timerange" },
      { method: "GET", path: "/audit/:id", desc: "Audit event detail — full record with attribution and context" },
      { method: "GET", path: "/events", desc: "Platform event stream — webhook-ready event feed" },
      { method: "POST", path: "/events/subscribe", desc: "Register a webhook for event type subscriptions" },
    ],
  },
  {
    group: "Reports",
    color: "hsl(160,60%,44%)",
    colorMuted: "hsla(160,60%,44%,0.08)",
    colorBorder: "hsla(160,60%,44%,0.20)",
    icon: Layers,
    endpoints: [
      { method: "GET", path: "/reports", desc: "List available report templates and recent reports" },
      { method: "POST", path: "/reports/generate", desc: "Generate a report from template with configurable parameters" },
      { method: "GET", path: "/reports/:id", desc: "Report status and download link" },
      { method: "GET", path: "/reports/:id/export", desc: "Export report as PDF or structured JSON" },
    ],
  },
  {
    group: "Integrations",
    color: "hsl(210,80%,60%)",
    colorMuted: "hsla(210,80%,60%,0.08)",
    colorBorder: "hsla(210,80%,60%,0.20)",
    icon: Activity,
    endpoints: [
      { method: "GET", path: "/integrations", desc: "List configured connectors and their status" },
      { method: "POST", path: "/integrations", desc: "Register a new connector with scoped credentials" },
      { method: "GET", path: "/integrations/:id/health", desc: "Connector health — last successful sync, error state" },
      { method: "DELETE", path: "/integrations/:id", desc: "Remove a connector and revoke associated tokens" },
    ],
  },
];

const ERROR_CODES = [
  { code: "400", label: "Bad Request", desc: "Malformed request body or invalid parameters." },
  { code: "401", label: "Unauthorized", desc: "Missing or invalid authentication token." },
  { code: "403", label: "Forbidden", desc: "Authenticated but insufficient role for this action." },
  { code: "404", label: "Not Found", desc: "Resource does not exist or is not accessible in tenant context." },
  { code: "409", label: "Conflict", desc: "State conflict — e.g., approving an already-approved workflow." },
  { code: "422", label: "Unprocessable", desc: "Validation error — field-level error details returned in body." },
  { code: "429", label: "Rate Limited", desc: "Request rate exceeded. Retry-After header included." },
  { code: "500", label: "Server Error", desc: "Internal error. Incident may be in progress." },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "hsl(145,62%,46%)",
  POST: "var(--color-lyte)",
  PATCH: "hsl(40,90%,54%)",
  DELETE: "hsl(0,75%,58%)",
  PUT: "hsl(210,80%,60%)",
};

export default function ApiPage() {
  usePageMeta({
    title: "API — SZL Holdings",
    description: "Lyte + Alloy API overview: health, auth, signals, workflows, recommendations, audit, reports, and integrations endpoint groups.",
    canonical: "https://szlholdings.com/api",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section className="szl-grid-texture szl-depth-glow-dual" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid var(--color-szl-border-hover)", background: "hsla(0,0%,100%,0.04)", marginBottom: "1.75rem" }}>
                <Terminal size={13} color="var(--color-szl-text-muted)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-szl-text-secondary)" }}>API Reference</span>
              </div>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                Lyte + Alloy API
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,62%)", maxWidth: "54ch", marginBottom: "2rem" }}>
                The Lyte + Alloy platform exposes a REST API and a governance API for tenant
                configuration, observability access, and audit queries. This page documents the
                primary REST API surface.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/docs/control-plane" className="szl-btn-primary">
                  Governance API <ArrowRight size={14} />
                </Link>
                <Link href="/docs" className="szl-btn-secondary">
                  Full documentation →
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {[
                { icon: Lock, label: "Auth model", body: "OIDC / PKCE bearer token. Tokens are scoped by tenant and role. Short-lived with refresh support." },
                { icon: Activity, label: "Versioning", body: "API is versioned via URL prefix: /v1/. Breaking changes increment the version. v1 is current." },
                { icon: CheckCircle, label: "Tenant isolation", body: "Every request is evaluated in tenant context. Cross-tenant access is not possible at the API layer." },
                { icon: AlertCircle, label: "Rate limiting", body: "Per-tenant rate limits apply. Retry-After header is returned on 429 responses." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.div key={item.label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                      <Icon size={15} color="var(--color-szl-text-muted)" />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>{item.label}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.62, color: "hsl(214,7%,58%)" }}>{item.body}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Endpoint Groups</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Eight endpoint groups.
              </h2>
            </m.div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {ENDPOINT_GROUPS.map((group, i) => {
                const Icon = group.icon;
                return (
                  <m.div key={group.group} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.04 }} className="szl-card" style={{ borderRadius: "0.875rem", overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-szl-border)", background: "hsla(214,12%,8%,0.60)" }}>
                      <div style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: group.colorMuted, border: `1px solid ${group.colorBorder}`, borderRadius: "0.4rem" }}>
                        <Icon size={14} color={group.color} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: group.color }}>{group.group}</span>
                    </div>
                    {group.endpoints.map((ep, j) => (
                      <div key={ep.path} style={{ display: "grid", gridTemplateColumns: "4rem 14rem 1fr", gap: "1rem", padding: "0.75rem 1.25rem", borderBottom: j < group.endpoints.length - 1 ? "1px solid var(--color-szl-border)" : "none", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 700, color: METHOD_COLORS[ep.method] ?? "var(--color-szl-text-muted)", letterSpacing: "0.06em" }}>{ep.method}</span>
                        <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "hsl(38,8%,80%)" }}>{ep.path}</code>
                        <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.5 }}>{ep.desc}</span>
                      </div>
                    ))}
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Example</p>
              <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "2rem" }}>
                Request and response format.
              </h2>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
              <div className="szl-card" style={{ borderRadius: "0.75rem", overflow: "hidden" }}>
                <div style={{ padding: "0.625rem 1rem", borderBottom: "1px solid var(--color-szl-border)", background: "hsla(214,12%,8%,0.60)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Request</span>
                </div>
                <pre style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", lineHeight: 1.75, color: "hsl(214,7%,68%)", padding: "1.25rem", margin: 0, overflow: "auto" }}>{`GET /v1/signals?severity=high&status=active
Authorization: Bearer <token>
X-Tenant-ID: tenant_abc123
Accept: application/json`}</pre>
              </div>
              <div className="szl-card" style={{ borderRadius: "0.75rem", overflow: "hidden" }}>
                <div style={{ padding: "0.625rem 1rem", borderBottom: "1px solid var(--color-szl-border)", background: "hsla(214,12%,8%,0.60)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(145,62%,46%)" }}>Response 200</span>
                </div>
                <pre style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", lineHeight: 1.75, color: "hsl(214,7%,68%)", padding: "1.25rem", margin: 0, overflow: "auto" }}>{`{
  "ok": true,
  "data": {
    "signals": [
      {
        "id": "sig_x7k2m",
        "type": "approval_latency",
        "severity": "high",
        "entity": "matter_9201",
        "timestamp": "2026-04-03T14:22:00Z",
        "status": "active"
      }
    ],
    "meta": {
      "total": 12,
      "page": 1,
      "per_page": 20
    }
  }
}`}</pre>
              </div>
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Error Model</p>
              <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2rem" }}>Consistent error structure.</h2>
            </m.div>
            <div className="szl-card" style={{ borderRadius: "0.875rem", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "4rem 10rem 1fr", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--color-szl-border)", background: "hsla(214,12%,8%,0.60)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Code</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Status</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Description</span>
              </div>
              {ERROR_CODES.map((err, i) => (
                <div key={err.code} style={{ display: "grid", gridTemplateColumns: "4rem 10rem 1fr", padding: "0.75rem 1.25rem", borderBottom: i < ERROR_CODES.length - 1 ? "1px solid var(--color-szl-border)" : "none", alignItems: "center", gap: "1rem" }}>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: parseInt(err.code) >= 500 ? "hsl(0,75%,58%)" : parseInt(err.code) >= 400 ? "hsl(40,90%,54%)" : "hsl(145,62%,46%)" }}>{err.code}</code>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(38,8%,82%)" }}>{err.label}</span>
                  <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.55 }}>{err.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href="/docs/control-plane" className="szl-btn-secondary">Governance API →</Link>
              <Link href="/docs" className="szl-btn-secondary">Full docs →</Link>
              <Link href="/contact" className="szl-btn-ghost">Request API access <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
