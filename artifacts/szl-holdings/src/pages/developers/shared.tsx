import { useState } from "react";
import { Copy, Check, Shield, AlertCircle } from "lucide-react";

export function CodeBlock({
  code,
  language = "bash",
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "hsl(214, 16%, 4%)",
        border: "1px solid hsla(0,0%,100%,0.08)",
      }}
    >
      {filename && (
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            background: "hsla(214,14%,7%,0.8)",
            borderBottom: "1px solid hsla(0,0%,100%,0.06)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "hsl(214,8%,55%)",
            }}
          >
            {filename}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 transition-colors"
            style={{ color: copied ? "hsl(142,62%,48%)" : "hsl(214,8%,55%)" }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span style={{ fontSize: "0.7rem" }}>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      )}
      {!filename && (
        <div className="flex justify-end px-4 pt-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 transition-colors"
            style={{ color: copied ? "hsl(142,62%,48%)" : "hsl(214,8%,45%)" }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>
              {copied ? "copied" : "copy"}
            </span>
          </button>
        </div>
      )}
      <pre
        className="overflow-x-auto px-4 py-4"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.8125rem",
          lineHeight: "1.7",
          color: "hsl(214,10%,82%)",
          margin: 0,
        }}
      >
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}

export function LanguageTabs({
  tabs,
}: {
  tabs: { label: string; language: string; code: string; filename?: string }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div
        className="flex gap-0 rounded-t-lg overflow-hidden"
        style={{ borderBottom: "1px solid hsla(0,0%,100%,0.08)" }}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className="px-4 py-2.5 text-sm transition-colors"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              background: active === i ? "hsl(214, 16%, 4%)" : "hsla(214,14%,7%,0.6)",
              color: active === i ? "hsl(214,10%,90%)" : "hsl(214,8%,50%)",
              borderBottom: active === i ? "2px solid hsl(38,55%,60%)" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <CodeBlock
        code={tabs[active].code}
        language={tabs[active].language}
        filename={tabs[active].filename}
      />
    </div>
  );
}

export function SectionHeader({
  id,
  title,
  subtitle,
  badge,
}: {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div id={id} className="mb-6 pt-4 scroll-mt-24">
      <div className="flex items-center gap-3 mb-2">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "hsl(38,10%,94%)",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
        {badge && (
          <span
            className="px-2 py-0.5 rounded text-xs"
            style={{
              background: "hsla(218,72%,52%,0.15)",
              color: "hsl(218,72%,72%)",
              border: "1px solid hsla(218,72%,52%,0.25)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p style={{ color: "hsl(214,8%,60%)", lineHeight: "1.6" }}>{subtitle}</p>
      )}
      <div
        className="mt-4"
        style={{ height: "1px", background: "hsla(0,0%,100%,0.06)" }}
      />
    </div>
  );
}

export function SubSectionHeader({ id, title }: { id: string; title: string }) {
  return (
    <h3
      id={id}
      className="mb-3 mt-8 scroll-mt-24"
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.0625rem",
        fontWeight: 600,
        color: "hsl(38,10%,88%)",
        letterSpacing: "-0.01em",
      }}
    >
      {title}
    </h3>
  );
}

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip" | "danger";
  children: React.ReactNode;
}) {
  const styles = {
    info: { bg: "hsla(218,72%,52%,0.08)", border: "hsla(218,72%,52%,0.25)", icon: "hsl(218,72%,65%)" },
    warning: { bg: "hsla(38,88%,50%,0.08)", border: "hsla(38,88%,50%,0.25)", icon: "hsl(38,88%,60%)" },
    tip: { bg: "hsla(142,64%,42%,0.08)", border: "hsla(142,64%,42%,0.25)", icon: "hsl(142,64%,52%)" },
    danger: { bg: "hsla(0,72%,52%,0.08)", border: "hsla(0,72%,52%,0.25)", icon: "hsl(0,72%,62%)" },
  };
  const s = styles[type];
  const Icon = type === "warning" ? AlertCircle : type === "danger" ? AlertCircle : type === "tip" ? Check : Shield;

  return (
    <div
      className="flex gap-3 rounded-lg px-4 py-3.5 my-4"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <Icon size={16} style={{ color: s.icon, flexShrink: 0, marginTop: "2px" }} />
      <div style={{ color: "hsl(214,8%,75%)", fontSize: "0.875rem", lineHeight: "1.6" }}>
        {children}
      </div>
    </div>
  );
}

export function InlineCode({ children }: { children: string }) {
  return (
    <code
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.8125em",
        background: "hsla(214,14%,12%,0.8)",
        border: "1px solid hsla(0,0%,100%,0.08)",
        padding: "0.1em 0.4em",
        borderRadius: "3px",
        color: "hsl(200,80%,72%)",
      }}
    >
      {children}
    </code>
  );
}

export const ERROR_CODES = [
  { code: 400, name: "Bad Request", description: "The request body or parameters are invalid or malformed." },
  { code: 401, name: "Unauthorized", description: "Missing or invalid authentication credentials. Include a valid Bearer token." },
  { code: 403, name: "Forbidden", description: "Valid credentials, but insufficient permissions for the requested resource." },
  { code: 404, name: "Not Found", description: "The requested resource does not exist." },
  { code: 409, name: "Conflict", description: "The request conflicts with existing state (e.g. duplicate entity)." },
  { code: 422, name: "Unprocessable Entity", description: "The request is well-formed but fails business validation rules." },
  { code: 429, name: "Too Many Requests", description: "Rate limit exceeded. Check Retry-After header for backoff guidance." },
  { code: 500, name: "Internal Server Error", description: "Unexpected server error. Correlation ID is returned for support." },
  { code: 503, name: "Service Unavailable", description: "Upstream dependency (DB, queue, external service) is temporarily unavailable." },
];

export const API_ERROR_CODES = [
  { code: "INVALID_CREDENTIALS", http: 401, description: "Supplied credential could not be verified." },
  { code: "ACCOUNT_DISABLED", http: 403, description: "The account has been administratively disabled." },
  { code: "SESSION_EXPIRED", http: 401, description: "Session token has passed its expiry time." },
  { code: "INSUFFICIENT_ROLE", http: 403, description: "Action requires a role not held by the caller." },
  { code: "RESOURCE_NOT_FOUND", http: 404, description: "Entity matching supplied ID does not exist." },
  { code: "VALIDATION_ERROR", http: 400, description: "One or more request fields failed schema validation." },
  { code: "RATE_LIMITED", http: 429, description: "Caller has exceeded the allowed request rate for this endpoint tier." },
  { code: "WEBHOOK_SIGNATURE_INVALID", http: 400, description: "HMAC-SHA256 signature on webhook payload does not match." },
  { code: "SCIM_TOKEN_INVALID", http: 401, description: "SCIM provisioning token is missing, malformed, or revoked." },
];

export const RATE_LIMIT_TIERS = [
  { tier: "Global", rph: "600", burst: "60 / min", applies: "All endpoints", color: "hsl(214,8%,55%)" },
  { tier: "Auth", rph: "60", burst: "10 / min", applies: "/auth/login, /auth/refresh", color: "hsl(0,72%,62%)" },
  { tier: "Read", rph: "1,200", burst: "120 / min", applies: "GET endpoints (authenticated)", color: "hsl(218,72%,65%)" },
  { tier: "Write", rph: "300", burst: "30 / min", applies: "POST, PATCH, DELETE (authenticated)", color: "hsl(38,88%,60%)" },
  { tier: "Webhook Ingest", rph: "1,800", burst: "200 / min", applies: "POST /alloy/ingest/*", color: "hsl(142,62%,48%)" },
];

export const WEBHOOK_EVENTS = [
  { event: "project.created", description: "A new project was created in the platform." },
  { event: "project.updated", description: "A project was updated (metadata or status)." },
  { event: "workflow.run.completed", description: "An Alloy workflow run reached a terminal state." },
  { event: "workflow.run.failed", description: "An Alloy workflow run encountered an unrecoverable error." },
  { event: "signal.ingested", description: "An external signal was accepted by the Alloy ingest pipeline." },
  { event: "vessel.alert.triggered", description: "A vessel tracking alert condition was met." },
  { event: "security.incident.created", description: "A new security incident was opened in Aegis SOC." },
  { event: "billing.invoice.paid", description: "A billing invoice was successfully settled." },
  { event: "user.role.changed", description: "A user's role assignment was modified." },
  { event: "tenant.provisioned", description: "A new Azure tenant was fully provisioned." },
];

export const GQL_QUERY_VESSELS = `query GetFleet($status: String) {
  vessels(filter: { status: $status }) {
    id
    name
    mmsi
    flag
    status
    currentPosition {
      lat
      lon
      heading
      speed
      updatedAt
    }
    cargo {
      type
      quantity
      unit
    }
  }
}`;

export const GQL_QUERY_PROJECTS = `query GetProjects {
  projects {
    id
    name
    status
    createdAt
    owner {
      id
      displayName
    }
    metrics {
      openTasks
      completionRate
    }
  }
}`;

export const GQL_MUTATION_SIGNAL = `mutation IngestSignal($input: SignalInput!) {
  ingestSignal(input: $input) {
    id
    status
    correlationId
    workflowsTriggered
    processedAt
  }
}

# Variables:
# {
#   "input": {
#     "domain": "vessels",
#     "type": "route_deviation",
#     "severity": "high",
#     "entityId": "vessel_123",
#     "payload": {
#       "deviation_km": 42,
#       "expected_route": "USGUL-NLRTM"
#     }
#   }
# }`;
