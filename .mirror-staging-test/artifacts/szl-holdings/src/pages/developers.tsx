import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Code2, Book, Key, Webhook, Shield, Terminal, Zap, Globe, ChevronRight,
  ChevronDown, Copy, Check, ExternalLink, AlertCircle, Lock, RefreshCw,
  Server, FileCode, Hash, ArrowRight, PlayCircle, Database, Layers,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
  subsections?: { id: string; label: string }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: Book,
  },
  {
    id: "authentication",
    label: "Authentication",
    icon: Key,
    subsections: [
      { id: "auth-overview", label: "Overview" },
      { id: "auth-bearer", label: "Bearer Tokens" },
      { id: "auth-oauth", label: "OAuth 2.0 Flow" },
      { id: "auth-api-keys", label: "API Keys" },
      { id: "auth-scim", label: "SCIM Tokens" },
    ],
  },
  {
    id: "rest-api",
    label: "REST API Explorer",
    icon: Globe,
    subsections: [
      { id: "rest-overview", label: "Base URL & Formats" },
      { id: "rest-explorer", label: "Interactive Explorer" },
    ],
  },
  {
    id: "graphql",
    label: "GraphQL",
    icon: Database,
    subsections: [
      { id: "gql-overview", label: "Overview" },
      { id: "gql-playground", label: "Playground" },
      { id: "gql-queries", label: "Example Queries" },
      { id: "gql-mutations", label: "Example Mutations" },
    ],
  },
  {
    id: "webhooks",
    label: "Webhooks",
    icon: Webhook,
    subsections: [
      { id: "webhooks-setup", label: "Setup & Configuration" },
      { id: "webhooks-signatures", label: "Signature Verification" },
      { id: "webhooks-events", label: "Event Reference" },
    ],
  },
  {
    id: "code-samples",
    label: "Code Samples",
    icon: Code2,
    subsections: [
      { id: "samples-auth", label: "Authentication" },
      { id: "samples-projects", label: "Projects" },
      { id: "samples-vessels", label: "Vessels" },
      { id: "samples-alloy", label: "Alloy Signals" },
    ],
  },
  {
    id: "rate-limits",
    label: "Rate Limits",
    icon: Zap,
  },
  {
    id: "errors",
    label: "Error Codes",
    icon: AlertCircle,
  },
  {
    id: "versioning",
    label: "Versioning",
    icon: Layers,
  },
];

// ─── Code Block ──────────────────────────────────────────────────────────────

function CodeBlock({
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

// ─── Language Tabs ────────────────────────────────────────────────────────────

function LanguageTabs({
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
              background:
                active === i
                  ? "hsl(214, 16%, 4%)"
                  : "hsla(214,14%,7%,0.6)",
              color:
                active === i
                  ? "hsl(214,10%,90%)"
                  : "hsl(214,8%,50%)",
              borderBottom:
                active === i
                  ? "2px solid hsl(38,55%,60%)"
                  : "2px solid transparent",
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

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
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

function SubSectionHeader({ id, title }: { id: string; title: string }) {
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

function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip" | "danger";
  children: React.ReactNode;
}) {
  const styles = {
    info: {
      bg: "hsla(218,72%,52%,0.08)",
      border: "hsla(218,72%,52%,0.25)",
      icon: "hsl(218,72%,65%)",
    },
    warning: {
      bg: "hsla(38,88%,50%,0.08)",
      border: "hsla(38,88%,50%,0.25)",
      icon: "hsl(38,88%,60%)",
    },
    tip: {
      bg: "hsla(142,64%,42%,0.08)",
      border: "hsla(142,64%,42%,0.25)",
      icon: "hsl(142,64%,52%)",
    },
    danger: {
      bg: "hsla(0,72%,52%,0.08)",
      border: "hsla(0,72%,52%,0.25)",
      icon: "hsl(0,72%,62%)",
    },
  };
  const s = styles[type];
  const Icon = type === "warning" ? AlertCircle : type === "danger" ? AlertCircle : type === "tip" ? Check : Shield;

  return (
    <div
      className="flex gap-3 rounded-lg px-4 py-3.5 my-4"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      <Icon size={16} style={{ color: s.icon, flexShrink: 0, marginTop: "2px" }} />
      <div style={{ color: "hsl(214,8%,75%)", fontSize: "0.875rem", lineHeight: "1.6" }}>
        {children}
      </div>
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
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

// ─── Error Code Table ─────────────────────────────────────────────────────────

const ERROR_CODES = [
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

const API_ERROR_CODES = [
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

// ─── Rate Limit Tiers ─────────────────────────────────────────────────────────

const RATE_LIMIT_TIERS = [
  {
    tier: "Global",
    rph: "600",
    burst: "60 / min",
    applies: "All endpoints",
    color: "hsl(214,8%,55%)",
  },
  {
    tier: "Auth",
    rph: "60",
    burst: "10 / min",
    applies: "/auth/login, /auth/refresh",
    color: "hsl(0,72%,62%)",
  },
  {
    tier: "Read",
    rph: "1,200",
    burst: "120 / min",
    applies: "GET endpoints (authenticated)",
    color: "hsl(218,72%,65%)",
  },
  {
    tier: "Write",
    rph: "300",
    burst: "30 / min",
    applies: "POST, PATCH, DELETE (authenticated)",
    color: "hsl(38,88%,60%)",
  },
  {
    tier: "Webhook Ingest",
    rph: "1,800",
    burst: "200 / min",
    applies: "POST /alloy/ingest/*",
    color: "hsl(142,62%,48%)",
  },
];

// ─── Webhook Events ───────────────────────────────────────────────────────────

const WEBHOOK_EVENTS = [
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

// ─── GraphQL Examples ─────────────────────────────────────────────────────────

const GQL_QUERY_VESSELS = `query GetFleet($status: String) {
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

const GQL_QUERY_PROJECTS = `query GetProjects {
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

const GQL_MUTATION_SIGNAL = `mutation IngestSignal($input: SignalInput!) {
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DevelopersPage() {
  usePageMeta({
    title: "Developer Documentation — SZL Holdings",
    description:
      "API reference, authentication guides, GraphQL playground, and integration documentation for the SZL Holdings DreamStack platform.",
  });

  const [activeSection, setActiveSection] = useState("overview");
  const [expandedNav, setExpandedNav] = useState<string[]>(["overview", "authentication", "rest-api"]);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleNav = (id: string) => {
    setExpandedNav((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const parentSection = NAV.find(
              (s) => s.id === id || s.subsections?.some((sub) => sub.id === id)
            );
            if (parentSection) {
              setActiveSection(parentSection.id);
            }
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    const ids = NAV.flatMap((s) => [s.id, ...(s.subsections?.map((sub) => sub.id) ?? [])]);
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(214,16%,3%)" }}>
      <SiteNav />

      {/* Hero */}
      <div
        className="pt-32 pb-16 px-6"
        style={{
          background: "linear-gradient(180deg, hsla(218,72%,22%,0.12) 0%, transparent 100%)",
          borderBottom: "1px solid hsla(0,0%,100%,0.06)",
        }}
      >
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "hsl(218,72%,65%)",
                background: "hsla(218,72%,52%,0.1)",
                border: "1px solid hsla(218,72%,52%,0.2)",
                padding: "0.2rem 0.6rem",
                borderRadius: "3px",
              }}
            >
              v0.2.0
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "hsl(142,62%,48%)",
                background: "hsla(142,62%,42%,0.1)",
                border: "1px solid hsla(142,62%,42%,0.2)",
                padding: "0.2rem 0.6rem",
                borderRadius: "3px",
              }}
            >
              stable
            </span>
          </div>

          <h1
            className="mb-4"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "hsl(38,10%,94%)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Developer Documentation
          </h1>

          <p
            className="mb-8 max-w-2xl"
            style={{
              fontSize: "1.0625rem",
              color: "hsl(214,8%,60%)",
              lineHeight: "1.7",
            }}
          >
            Complete API reference, integration guides, and interactive exploration tools
            for the SZL Holdings DreamStack platform. Build on top of the same APIs that
            power Alloy, Vessels, Terra, and Aegis.
          </p>

          <div className="flex flex-wrap gap-3">
            {[
              { icon: Globe, label: "REST API", href: "#rest-api" },
              { icon: Database, label: "GraphQL", href: "#graphql" },
              { icon: Webhook, label: "Webhooks", href: "#webhooks" },
              { icon: Terminal, label: "Code Samples", href: "#code-samples" },
            ].map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(href.slice(1));
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  background: "hsla(214,14%,9%,0.8)",
                  border: "1px solid hsla(0,0%,100%,0.08)",
                  color: "hsl(214,8%,72%)",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-display)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.14)";
                  (e.currentTarget as HTMLElement).style.color = "hsl(38,10%,88%)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.08)";
                  (e.currentTarget as HTMLElement).style.color = "hsl(214,8%,72%)";
                }}
              >
                <Icon size={14} />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-[1280px] mx-auto px-6 flex gap-8 py-12">
        {/* Sidebar */}
        <aside
          className="hidden lg:block flex-shrink-0 sticky top-24 self-start"
          style={{ width: "220px", maxHeight: "calc(100vh - 7rem)", overflowY: "auto" }}
        >
          <nav className="space-y-0.5">
            {NAV.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedNav.includes(section.id);
              const isActive = activeSection === section.id;

              return (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      scrollTo(section.id);
                      if (section.subsections) toggleNav(section.id);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left transition-colors duration-150"
                    style={{
                      background: isActive
                        ? "hsla(38,55%,60%,0.08)"
                        : "transparent",
                      color: isActive
                        ? "hsl(38,55%,70%)"
                        : "hsl(214,8%,62%)",
                      borderLeft: isActive
                        ? "2px solid hsl(38,55%,60%)"
                        : "2px solid transparent",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={13} />
                      <span style={{ fontSize: "0.8125rem", fontFamily: "var(--font-display)" }}>
                        {section.label}
                      </span>
                    </div>
                    {section.subsections && (
                      <ChevronDown
                        size={12}
                        style={{
                          transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                          transition: "transform 0.2s",
                          color: "hsl(214,8%,44%)",
                        }}
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {section.subsections && isExpanded && (
                      <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-5 pl-3 space-y-0.5 py-1" style={{ borderLeft: "1px solid hsla(0,0%,100%,0.06)" }}>
                          {section.subsections.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => scrollTo(sub.id)}
                              className="w-full text-left px-2 py-1.5 rounded transition-colors duration-150"
                              style={{
                                fontSize: "0.75rem",
                                color: "hsl(214,8%,52%)",
                                fontFamily: "var(--font-display)",
                              }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(214,8%,78%)")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(214,8%,52%)")}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          <div className="mt-8 pt-6" style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
              style={{ color: "hsl(218,72%,65%)", fontSize: "0.8125rem" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(218,72%,75%)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(218,72%,65%)")}
            >
              <ExternalLink size={13} />
              Swagger UI
            </a>
            <a
              href="/api/docs.json"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
              style={{ color: "hsl(218,72%,65%)", fontSize: "0.8125rem" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(218,72%,75%)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "hsl(218,72%,65%)")}
            >
              <FileCode size={13} />
              OpenAPI JSON
            </a>
          </div>
        </aside>

        {/* Content */}
        <main ref={contentRef} className="flex-1 min-w-0 space-y-16">

          {/* ── Overview ── */}
          <section>
            <SectionHeader
              id="overview"
              title="Platform API Overview"
              subtitle="The SZL DreamStack API provides programmatic access to all platform capabilities — vessel tracking, workflow orchestration, security operations, real estate intelligence, and more."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                {
                  icon: Globe,
                  title: "REST API",
                  desc: "OpenAPI 3.1.0 — full CRUD over platform entities. Bearer token authentication. JSON request/response.",
                  accent: "hsl(218,72%,52%)",
                  href: "#rest-api",
                },
                {
                  icon: Database,
                  title: "GraphQL",
                  desc: "Flexible query layer with schema introspection. Ideal for dashboards and partner integrations.",
                  accent: "hsl(265,80%,60%)",
                  href: "#graphql",
                },
                {
                  icon: Webhook,
                  title: "Webhooks",
                  desc: "Real-time event delivery via HTTPS. HMAC-SHA256 signatures. Retry with exponential backoff.",
                  accent: "hsl(38,88%,50%)",
                  href: "#webhooks",
                },
                {
                  icon: Key,
                  title: "Authentication",
                  desc: "Bearer tokens, OAuth 2.0 PKCE flow, API keys, SCIM provisioning, and webhook signatures.",
                  accent: "hsl(142,62%,48%)",
                  href: "#authentication",
                },
              ].map(({ icon: Icon, title, desc, accent, href }) => (
                <button
                  key={title}
                  onClick={() => scrollTo(href.slice(1))}
                  className="text-left p-5 rounded-lg transition-all duration-200"
                  style={{
                    background: "hsla(214,14%,7%,0.8)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.12)";
                    (e.currentTarget as HTMLElement).style.background = "hsla(214,14%,9%,0.8)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.07)";
                    (e.currentTarget as HTMLElement).style.background = "hsla(214,14%,7%,0.8)";
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ background: `${accent}1a`, border: `1px solid ${accent}33` }}
                    >
                      <Icon size={15} style={{ color: accent }} />
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "0.9375rem",
                        color: "hsl(38,10%,88%)",
                      }}
                    >
                      {title}
                    </span>
                    <ArrowRight size={13} style={{ color: "hsl(214,8%,40%)", marginLeft: "auto" }} />
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "hsl(214,8%,58%)", lineHeight: "1.6" }}>
                    {desc}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {[
                { label: "Base URL", value: "https://[host]/api", mono: true },
                { label: "API Version", value: "0.2.0", mono: true },
                { label: "Schema Format", value: "OpenAPI 3.1.0", mono: true },
              ].map(({ label, value, mono }) => (
                <div
                  key={label}
                  className="px-4 py-3 rounded-lg"
                  style={{
                    background: "hsla(214,14%,7%,0.5)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "hsl(214,8%,50%)", marginBottom: "4px" }}>
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: mono ? "var(--font-mono)" : "var(--font-display)",
                      fontSize: "0.875rem",
                      color: "hsl(214,10%,84%)",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <Callout type="info">
              All API endpoints are mounted under the <InlineCode>/api</InlineCode> prefix. The base path for
              the Replit-hosted environment is <InlineCode>/api</InlineCode>. Self-hosted deployments should
              configure <InlineCode>CORS_ORIGINS</InlineCode> to allow your integration's origin.
            </Callout>
          </section>

          {/* ── Authentication ── */}
          <section>
            <SectionHeader
              id="authentication"
              title="Authentication"
              subtitle="The DreamStack API supports multiple authentication patterns depending on your integration type."
            />

            <SubSectionHeader id="auth-overview" title="Overview" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              All protected endpoints require authentication via the <InlineCode>Authorization</InlineCode> header.
              The platform supports Bearer tokens (session-based), long-lived API keys, OAuth 2.0 PKCE for
              user-delegated access, and SCIM tokens for directory provisioning.
            </p>

            <div
              className="rounded-lg overflow-hidden mb-6"
              style={{ border: "1px solid hsla(0,0%,100%,0.07)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsla(214,14%,7%,0.8)", borderBottom: "1px solid hsla(0,0%,100%,0.07)" }}>
                    {["Method", "Use Case", "Expiry", "Scope"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3"
                        style={{ color: "hsl(214,8%,55%)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.75rem" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Bearer Token", "User-facing apps (web/mobile)", "30 days", "Full user permissions"],
                    ["API Key", "Server-to-server integrations", "Never (revocable)", "Configurable per key"],
                    ["OAuth 2.0 PKCE", "Third-party integrations", "1 hour (refresh tokens)", "Requested scopes"],
                    ["SCIM Token", "Directory provisioning (Azure AD)", "Never (revocable)", "User/group management"],
                  ].map(([method, useCase, expiry, scope], i) => (
                    <tr
                      key={method}
                      style={{
                        borderBottom: i < 3 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                        background: i % 2 === 0 ? "hsla(214,14%,6%,0.4)" : "transparent",
                      }}
                    >
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "hsl(200,80%,72%)" }}>
                        {method}
                      </td>
                      <td className="px-4 py-3" style={{ color: "hsl(214,8%,68%)" }}>{useCase}</td>
                      <td className="px-4 py-3" style={{ color: "hsl(214,8%,60%)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{expiry}</td>
                      <td className="px-4 py-3" style={{ color: "hsl(214,8%,60%)" }}>{scope}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SubSectionHeader id="auth-bearer" title="Bearer Tokens" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              Bearer tokens are issued after successful authentication via <InlineCode>POST /api/auth/login</InlineCode>.
              Include the token in every subsequent request using the <InlineCode>Authorization</InlineCode> header.
            </p>
            <CodeBlock
              filename="POST /api/auth/login"
              language="bash"
              code={`# Request
curl -X POST https://[host]/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"credential": "<replit_identity_token>"}'

# Response
{
  "token": "a3f9e2c4b1d8...",
  "expiresAt": "2026-05-01T00:00:00.000Z",
  "user": {
    "id": 42,
    "displayName": "Ada Lovelace",
    "email": "ada@example.com",
    "roles": ["operator", "viewer"]
  }
}`}
            />

            <div className="mt-4">
              <CodeBlock
                filename="Using the token"
                language="bash"
                code={`# Include the Bearer token in every protected request
curl https://[host]/api/projects \\
  -H "Authorization: Bearer a3f9e2c4b1d8..."`}
              />
            </div>

            <SubSectionHeader id="auth-oauth" title="OAuth 2.0 Flow" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              For third-party integrations requiring user-delegated access, the platform implements
              OpenID Connect with PKCE (Proof Key for Code Exchange) via Replit Auth.
            </p>

            <div className="space-y-3 mb-6">
              {[
                {
                  step: "01",
                  title: "Generate PKCE verifier",
                  desc: "Generate a cryptographically random code_verifier and compute its SHA-256 code_challenge.",
                },
                {
                  step: "02",
                  title: "Redirect to authorization",
                  desc: "Redirect the user to the OIDC authorization endpoint with code_challenge, client_id, and requested scopes.",
                },
                {
                  step: "03",
                  title: "Receive authorization code",
                  desc: "The user authenticates and is redirected back to your redirect_uri with an authorization code.",
                },
                {
                  step: "04",
                  title: "Exchange for tokens",
                  desc: "POST the code and code_verifier to the token endpoint. Receive access_token and refresh_token.",
                },
                {
                  step: "05",
                  title: "Use access token",
                  desc: "Include the access_token as Bearer token in API calls. Refresh using the refresh_token when expired.",
                },
              ].map(({ step, title, desc }) => (
                <div
                  key={step}
                  className="flex gap-4 p-4 rounded-lg"
                  style={{
                    background: "hsla(214,14%,7%,0.5)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "hsla(218,72%,52%,0.15)",
                      border: "1px solid hsla(218,72%,52%,0.3)",
                      color: "hsl(218,72%,70%)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {step}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "hsl(214,10%,84%)",
                        marginBottom: "2px",
                      }}
                    >
                      {title}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "hsl(214,8%,58%)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <CodeBlock
              filename="Token exchange"
              language="bash"
              code={`curl -X POST https://[host]/api/auth/oidc/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTH_CODE" \\
  -d "code_verifier=CODE_VERIFIER" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "redirect_uri=https://your-app.com/callback"`}
            />

            <SubSectionHeader id="auth-api-keys" title="API Keys" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              Long-lived API keys are intended for server-to-server integrations where a user context
              is not required. Keys are generated through the Admin panel and can be scoped to specific
              resources or operations.
            </p>

            <Callout type="warning">
              API keys are displayed only once at creation time. Store them securely in a secrets manager.
              If a key is compromised, revoke it immediately from the Admin panel — revocation takes effect
              within 60 seconds platform-wide.
            </Callout>

            <div className="mt-4">
              <CodeBlock
                filename="Using an API key"
                language="bash"
                code={`# API keys use the same Authorization header format
curl https://[host]/api/vessels \\
  -H "Authorization: Bearer szl_live_a1b2c3d4e5f6..."`}
              />
            </div>

            <SubSectionHeader id="auth-scim" title="SCIM Tokens" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              SCIM 2.0 tokens enable automated user provisioning and deprovisioning via Azure Active Directory
              or any SCIM-compliant identity provider. SCIM tokens grant access only to{" "}
              <InlineCode>/api/scim/v2/</InlineCode> endpoints.
            </p>

            <CodeBlock
              filename="Azure AD SCIM configuration"
              language="text"
              code={`Tenant URL: https://[host]/api/scim/v2
Secret Token: <scim_token_from_admin_panel>

Supported operations:
  - User provisioning (CREATE, UPDATE, DELETE)
  - Group provisioning (CREATE, UPDATE, DELETE)
  - Filtering by userName, externalId
  - Pagination: ?startIndex=1&count=100`}
            />
          </section>

          {/* ── REST API ── */}
          <section>
            <SectionHeader
              id="rest-api"
              title="REST API"
              badge="OpenAPI 3.1.0"
              subtitle="Full CRUD access to all platform entities. All endpoints return JSON. Errors include a machine-readable code field."
            />

            <SubSectionHeader id="rest-overview" title="Base URL & Request Format" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                {
                  label: "Content-Type",
                  value: "application/json",
                  desc: "Required on all POST, PUT, PATCH requests",
                },
                {
                  label: "Authorization",
                  value: "Bearer <token>",
                  desc: "Required on all protected endpoints",
                },
                {
                  label: "X-Correlation-Id",
                  value: "auto-generated",
                  desc: "Returned in every response for tracing",
                },
                {
                  label: "Accept",
                  value: "application/json",
                  desc: "Optional — JSON is always the default",
                },
              ].map(({ label, value, desc }) => (
                <div
                  key={label}
                  className="px-4 py-3 rounded-lg"
                  style={{
                    background: "hsla(214,14%,7%,0.5)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      color: "hsl(200,80%,72%)",
                      marginBottom: "2px",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8125rem",
                      color: "hsl(214,10%,80%)",
                      marginBottom: "4px",
                    }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(214,8%,50%)" }}>{desc}</div>
                </div>
              ))}
            </div>

            <SubSectionHeader id="rest-explorer" title="Interactive Explorer" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1.25rem" }}>
              The full interactive API explorer is powered by Swagger UI. You can execute live requests,
              inspect schemas, and authorize with your Bearer token directly in the browser.
            </p>

            <div
              className="rounded-xl overflow-hidden"
              style={{
                border: "1px solid hsla(0,0%,100%,0.09)",
                background: "hsla(214,14%,7%,0.5)",
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: "1px solid hsla(0,0%,100%,0.07)" }}
              >
                <div className="flex items-center gap-2.5">
                  <PlayCircle size={15} style={{ color: "hsl(142,62%,48%)" }} />
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "hsl(214,10%,84%)",
                    }}
                  >
                    Swagger UI — Live API Explorer
                  </span>
                </div>
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color: "hsl(218,72%,65%)" }}
                >
                  <ExternalLink size={13} />
                  Open full screen
                </a>
              </div>

              <div className="px-5 py-5" style={{ background: "hsla(214,14%,5%,0.95)" }}>
                <p style={{ color: "hsl(214,8%,60%)", fontSize: "0.875rem", lineHeight: "1.6", marginBottom: "1.25rem" }}>
                  The full Swagger UI explorer is available in a dedicated tab. Authenticate with your Bearer token
                  using the <strong style={{ color: "hsl(214,10%,80%)" }}>Authorize</strong> button, then execute
                  live requests against any endpoint.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {[
                    { tag: "health", count: 4, color: "hsl(142,62%,48%)" },
                    { tag: "auth", count: 12, color: "hsl(218,72%,60%)" },
                    { tag: "projects", count: 6, color: "hsl(265,80%,60%)" },
                    { tag: "vessels", count: 18, color: "hsl(210,78%,50%)" },
                    { tag: "alloy", count: 24, color: "hsl(222,68%,58%)" },
                    { tag: "billing", count: 8, color: "hsl(38,88%,55%)" },
                    { tag: "connectors", count: 10, color: "hsl(32,65%,52%)" },
                    { tag: "observability", count: 9, color: "hsl(190,90%,50%)" },
                  ].map(({ tag, count, color }) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                      style={{ background: "hsla(214,14%,8%,0.8)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                    >
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color }}>
                        {tag}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "hsl(214,8%,44%)" }}>
                        {count} endpoints
                      </span>
                    </div>
                  ))}
                </div>

                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200"
                  style={{
                    background: "hsla(218,72%,52%,0.15)",
                    border: "1px solid hsla(218,72%,52%,0.3)",
                    color: "hsl(218,72%,72%)",
                    textDecoration: "none",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  <PlayCircle size={15} />
                  Open Swagger UI Explorer
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <a
                href="/api/docs.json"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: "hsla(214,14%,9%,0.8)",
                  border: "1px solid hsla(0,0%,100%,0.08)",
                  color: "hsl(214,8%,68%)",
                  textDecoration: "none",
                  fontFamily: "var(--font-display)",
                }}
              >
                <FileCode size={14} />
                Download OpenAPI JSON
              </a>
              <a
                href="https://spec.openapis.org/oas/v3.1.0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: "hsla(214,14%,9%,0.8)",
                  border: "1px solid hsla(0,0%,100%,0.08)",
                  color: "hsl(214,8%,68%)",
                  textDecoration: "none",
                  fontFamily: "var(--font-display)",
                }}
              >
                <ExternalLink size={14} />
                OpenAPI 3.1 Spec
              </a>
            </div>
          </section>

          {/* ── GraphQL ── */}
          <section>
            <SectionHeader
              id="graphql"
              title="GraphQL"
              badge="schema v1"
              subtitle="A GraphQL layer sits alongside the REST API, providing flexible queries for complex integrations and dashboard applications."
            />

            <SubSectionHeader id="gql-overview" title="Overview" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              The GraphQL endpoint at <InlineCode>/api/graphql</InlineCode> exposes the same data as the REST API
              through a typed schema. Authentication works identically — include a Bearer token in the
              <InlineCode>Authorization</InlineCode> header.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {[
                { label: "Endpoint", value: "/api/graphql", mono: true },
                { label: "Method", value: "POST", mono: true },
                { label: "Introspection", value: "Enabled (dev)", mono: false },
              ].map(({ label, value, mono }) => (
                <div
                  key={label}
                  className="px-4 py-3 rounded-lg"
                  style={{ background: "hsla(214,14%,7%,0.5)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                >
                  <div style={{ fontSize: "0.75rem", color: "hsl(214,8%,50%)", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontFamily: mono ? "var(--font-mono)" : "inherit", fontSize: "0.875rem", color: "hsl(214,10%,84%)" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <SubSectionHeader id="gql-playground" title="GraphQL Playground" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1.25rem" }}>
              Use the embedded playground to explore the schema, run queries, and test mutations interactively.
              Set your Bearer token in the HTTP Headers panel as{" "}
              <InlineCode>{"{ \"Authorization\": \"Bearer <token>\" }"}</InlineCode>.
            </p>

            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid hsla(0,0%,100%,0.09)" }}
            >
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: "1px solid hsla(0,0%,100%,0.07)", background: "hsla(214,14%,7%,0.8)" }}
              >
                <div className="flex items-center gap-2.5">
                  <Database size={14} style={{ color: "hsl(265,80%,65%)" }} />
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 600, color: "hsl(214,10%,84%)" }}>
                    GraphQL Playground
                  </span>
                </div>
                <a
                  href="/api/graphql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "hsl(265,80%,65%)", textDecoration: "none" }}
                >
                  <ExternalLink size={13} />
                  Open in browser
                </a>
              </div>
              <div className="px-5 py-5" style={{ background: "hsla(214,14%,5%,0.95)" }}>
                <p style={{ color: "hsl(214,8%,60%)", fontSize: "0.875rem", lineHeight: "1.6", marginBottom: "1.25rem" }}>
                  The GraphQL playground provides schema documentation, query autocompletion, and live execution.
                  Set your Bearer token in the HTTP Headers panel to access protected types and fields.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  {[
                    {
                      title: "Schema Introspection",
                      desc: "Explore types, fields, and relationships through the built-in schema browser.",
                      icon: Database,
                      color: "hsl(265,80%,60%)",
                    },
                    {
                      title: "Query Autocompletion",
                      desc: "Type-aware completion for fields, arguments, and variable types.",
                      icon: Code2,
                      color: "hsl(218,72%,60%)",
                    },
                    {
                      title: "Variable Editor",
                      desc: "Provide typed variables alongside your queries for cleaner request testing.",
                      icon: FileCode,
                      color: "hsl(142,62%,48%)",
                    },
                  ].map(({ title, desc, icon: Icon, color }) => (
                    <div
                      key={title}
                      className="p-3.5 rounded-lg"
                      style={{ background: "hsla(214,14%,8%,0.8)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={13} style={{ color }} />
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 600, color: "hsl(214,10%,82%)" }}>
                          {title}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "hsl(214,8%,54%)", lineHeight: "1.55" }}>{desc}</p>
                    </div>
                  ))}
                </div>

                <a
                  href="/api/graphql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200"
                  style={{
                    background: "hsla(265,80%,60%,0.12)",
                    border: "1px solid hsla(265,80%,60%,0.28)",
                    color: "hsl(265,80%,75%)",
                    textDecoration: "none",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  <PlayCircle size={15} />
                  Open GraphQL Playground
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <SubSectionHeader id="gql-queries" title="Example Queries" />

            <LanguageTabs
              tabs={[
                {
                  label: "Vessels",
                  language: "graphql",
                  code: GQL_QUERY_VESSELS,
                  filename: "vessels-query.graphql",
                },
                {
                  label: "Projects",
                  language: "graphql",
                  code: GQL_QUERY_PROJECTS,
                  filename: "projects-query.graphql",
                },
              ]}
            />

            <SubSectionHeader id="gql-mutations" title="Example Mutations" />
            <CodeBlock
              filename="ingest-signal.graphql"
              language="graphql"
              code={GQL_MUTATION_SIGNAL}
            />
          </section>

          {/* ── Webhooks ── */}
          <section>
            <SectionHeader
              id="webhooks"
              title="Webhooks"
              subtitle="Subscribe to platform events and receive real-time HTTPS notifications to your endpoint."
            />

            <SubSectionHeader id="webhooks-setup" title="Setup & Configuration" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              Webhooks are configured per-integration through <InlineCode>POST /api/webhooks</InlineCode>. Each
              webhook target is associated with a list of event types, a secret for signature verification,
              and an active/inactive status.
            </p>

            <CodeBlock
              filename="Register a webhook"
              language="bash"
              code={`curl -X POST https://[host]/api/webhooks \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/hooks/szl",
    "events": ["workflow.run.completed", "signal.ingested"],
    "secret": "your_webhook_secret_min_32_chars",
    "description": "Production workflow notifications"
  }'

# Response
{
  "id": "wh_01j9...",
  "url": "https://your-app.com/hooks/szl",
  "events": ["workflow.run.completed", "signal.ingested"],
  "status": "active",
  "createdAt": "2026-04-01T00:00:00.000Z"
}`}
            />

            <SubSectionHeader id="webhooks-signatures" title="Signature Verification" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              Every webhook delivery includes an <InlineCode>X-SZL-Signature-256</InlineCode> header containing
              an HMAC-SHA256 signature of the raw request body, keyed with your webhook secret.
              Always verify this signature before processing a payload.
            </p>

            <Callout type="danger">
              Never process a webhook payload without verifying its signature. Failing to verify
              signatures leaves your integration vulnerable to forged events.
            </Callout>

            <div className="mt-4">
              <LanguageTabs
                tabs={[
                  {
                    label: "Node.js",
                    language: "javascript",
                    filename: "verify-webhook.js",
                    code: `import crypto from 'crypto';

function verifyWebhookSignature(req, secret) {
  const signature = req.headers['x-szl-signature-256'];
  if (!signature) return false;

  const rawBody = req.rawBody; // Buffer — do not parse first
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Express middleware
app.post('/hooks/szl', express.raw({ type: '*/*' }), (req, res) => {
  if (!verifyWebhookSignature(req, process.env.SZL_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  const event = JSON.parse(req.body);
  // handle event...
  res.status(200).end();
});`,
                  },
                  {
                    label: "Python",
                    language: "python",
                    filename: "verify_webhook.py",
                    code: `import hmac
import hashlib

def verify_webhook_signature(body: bytes, signature: str, secret: str) -> bool:
    """Verify SZL webhook HMAC-SHA256 signature."""
    expected = 'sha256=' + hmac.new(
        secret.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

# Flask example
from flask import Flask, request, abort
import json

app = Flask(__name__)

@app.route('/hooks/szl', methods=['POST'])
def handle_webhook():
    sig = request.headers.get('X-SZL-Signature-256', '')
    if not verify_webhook_signature(
        request.get_data(),
        sig,
        os.environ['SZL_WEBHOOK_SECRET']
    ):
        abort(401)
    event = request.get_json()
    # handle event...
    return '', 200`,
                  },
                ]}
              />
            </div>

            <SubSectionHeader id="webhooks-events" title="Event Reference" />

            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid hsla(0,0%,100%,0.07)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsla(214,14%,7%,0.8)", borderBottom: "1px solid hsla(0,0%,100%,0.07)" }}>
                    {["Event Type", "Description"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3"
                        style={{ color: "hsl(214,8%,55%)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.75rem" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WEBHOOK_EVENTS.map(({ event, description }, i) => (
                    <tr
                      key={event}
                      style={{
                        borderBottom: i < WEBHOOK_EVENTS.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                        background: i % 2 === 0 ? "hsla(214,14%,6%,0.4)" : "transparent",
                      }}
                    >
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "hsl(200,80%,72%)", whiteSpace: "nowrap" }}>
                        {event}
                      </td>
                      <td className="px-4 py-3" style={{ color: "hsl(214,8%,64%)" }}>{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock
                filename="Webhook payload shape"
                language="json"
                code={`{
  "id": "evt_01j9abc...",
  "type": "workflow.run.completed",
  "createdAt": "2026-04-01T12:00:00.000Z",
  "data": {
    "runId": 1024,
    "workflowId": "wf_vessels_alert_handler",
    "status": "completed",
    "durationMs": 3420,
    "triggeredBy": "signal_ingest",
    "output": { ... }
  }
}`}
              />
            </div>
          </section>

          {/* ── Code Samples ── */}
          <section>
            <SectionHeader
              id="code-samples"
              title="Code Samples"
              subtitle="Common operations in JavaScript (Node.js), Python, and cURL."
            />

            <SubSectionHeader id="samples-auth" title="Authentication" />
            <LanguageTabs
              tabs={[
                {
                  label: "JavaScript",
                  language: "javascript",
                  filename: "auth.js",
                  code: `import { createReplitAuth } from '@replit/auth-client';

// Initialize with your Replit identity token
async function authenticate() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: replitIdentityToken }),
  });

  if (!response.ok) {
    throw new Error(\`Auth failed: \${response.status}\`);
  }

  const { token, user } = await response.json();
  return { token, user };
}

// Reusable authenticated client
function createApiClient(token) {
  return {
    async get(path) {
      const res = await fetch(\`/api\${path}\`, {
        headers: { Authorization: \`Bearer \${token}\` },
      });
      if (!res.ok) throw new Error(\`API error: \${res.status}\`);
      return res.json();
    },
    async post(path, data) {
      const res = await fetch(\`/api\${path}\`, {
        method: 'POST',
        headers: {
          Authorization: \`Bearer \${token}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(\`API error: \${res.status}\`);
      return res.json();
    },
  };
}`,
                },
                {
                  label: "Python",
                  language: "python",
                  filename: "auth.py",
                  code: `import requests

class SZLClient:
    """Authenticated SZL Holdings API client."""

    BASE_URL = "https://[host]/api"

    def __init__(self, token: str):
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        })

    @classmethod
    def from_credential(cls, credential: str) -> "SZLClient":
        """Authenticate and return a ready client."""
        res = requests.post(
            f"{cls.BASE_URL}/auth/login",
            json={"credential": credential},
        )
        res.raise_for_status()
        return cls(res.json()["token"])

    def get(self, path: str) -> dict:
        res = self.session.get(f"{self.BASE_URL}{path}")
        res.raise_for_status()
        return res.json()

    def post(self, path: str, data: dict) -> dict:
        res = self.session.post(f"{self.BASE_URL}{path}", json=data)
        res.raise_for_status()
        return res.json()`,
                },
                {
                  label: "cURL",
                  language: "bash",
                  filename: "auth.sh",
                  code: `# Authenticate and extract token
TOKEN=$(curl -s -X POST https://[host]/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"credential": "$REPLIT_IDENTITY_TOKEN"}' \\
  | jq -r '.token')

# Export for reuse in subsequent calls
export SZL_TOKEN="$TOKEN"

# Verify by fetching current user
curl https://[host]/api/auth/me \\
  -H "Authorization: Bearer $SZL_TOKEN"`,
                },
              ]}
            />

            <SubSectionHeader id="samples-projects" title="Projects" />
            <LanguageTabs
              tabs={[
                {
                  label: "JavaScript",
                  language: "javascript",
                  filename: "projects.js",
                  code: `const client = createApiClient(token);

// List all projects
const projects = await client.get('/projects');
console.log(\`Found \${projects.length} projects\`);

// Create a project
const newProject = await client.post('/projects', {
  name: 'Maritime Risk Assessment Q2',
  description: 'Quarterly route risk analysis',
  status: 'active',
});
console.log('Created:', newProject.id);

// Update a project
const updated = await client.patch(\`/projects/\${newProject.id}\`, {
  status: 'completed',
});`,
                },
                {
                  label: "Python",
                  language: "python",
                  filename: "projects.py",
                  code: `client = SZLClient.from_credential(credential)

# List all projects
projects = client.get("/projects")
print(f"Found {len(projects)} projects")

# Create a project
new_project = client.post("/projects", {
    "name": "Maritime Risk Assessment Q2",
    "description": "Quarterly route risk analysis",
    "status": "active",
})
print(f"Created project {new_project['id']}")`,
                },
                {
                  label: "cURL",
                  language: "bash",
                  filename: "projects.sh",
                  code: `# List all projects
curl https://[host]/api/projects \\
  -H "Authorization: Bearer $SZL_TOKEN"

# Create a project
curl -X POST https://[host]/api/projects \\
  -H "Authorization: Bearer $SZL_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Maritime Risk Assessment Q2",
    "description": "Quarterly route risk analysis",
    "status": "active"
  }'`,
                },
              ]}
            />

            <SubSectionHeader id="samples-vessels" title="Vessels" />
            <LanguageTabs
              tabs={[
                {
                  label: "JavaScript",
                  language: "javascript",
                  filename: "vessels.js",
                  code: `const client = createApiClient(token);

// List all vessels in the fleet
const fleet = await client.get('/vessels');

// Get a specific vessel with live position
const vessel = await client.get('/vessels/42');
console.log(\`\${vessel.name} at \${vessel.position.lat}, \${vessel.position.lon}\`);

// Get live chokepoint analysis
const intel = await client.get('/vessels/live/chokepoints');
console.log('Active chokepoints:', intel.chokepoints);

// Create a vessel alert
const alert = await client.post('/vessels/42/alerts', {
  type: 'route_deviation',
  severity: 'high',
  message: 'Vessel deviated 45nm from planned route',
});`,
                },
                {
                  label: "Python",
                  language: "python",
                  filename: "vessels.py",
                  code: `client = SZLClient.from_credential(credential)

# List fleet
fleet = client.get("/vessels")
print(f"Fleet size: {len(fleet)}")

# Live chokepoint intel
intel = client.get("/vessels/live/chokepoints")
for cp in intel.get("chokepoints", []):
    print(f"Chokepoint: {cp['name']} — Risk: {cp['riskLevel']}")

# Get vessel details
vessel = client.get("/vessels/42")
print(f"Vessel: {vessel['name']}, IMO: {vessel['imo']}")`,
                },
                {
                  label: "cURL",
                  language: "bash",
                  filename: "vessels.sh",
                  code: `# List fleet
curl https://[host]/api/vessels \\
  -H "Authorization: Bearer $SZL_TOKEN"

# Get live chokepoint intelligence
curl https://[host]/api/vessels/live/chokepoints \\
  -H "Authorization: Bearer $SZL_TOKEN"

# Get a specific vessel
curl https://[host]/api/vessels/42 \\
  -H "Authorization: Bearer $SZL_TOKEN"`,
                },
              ]}
            />

            <SubSectionHeader id="samples-alloy" title="Alloy Signal Ingestion" />
            <LanguageTabs
              tabs={[
                {
                  label: "JavaScript",
                  language: "javascript",
                  filename: "alloy-signals.js",
                  code: `const client = createApiClient(token);

// Ingest a signal to trigger an Alloy workflow
const result = await client.post('/alloy/ingest/signal', {
  domain: 'vessels',
  type: 'port_delay',
  severity: 'medium',
  entityId: 'vessel_ocean_pioneer_88',
  payload: {
    port: 'USGUL',
    delayHours: 18,
    reason: 'weather',
    affectedCargo: ['container', 'bulk'],
  },
  metadata: {
    source: 'ais_feed',
    confidence: 0.94,
  },
});

console.log('Signal ID:', result.signalId);
console.log('Workflows triggered:', result.workflowsTriggered);`,
                },
                {
                  label: "Python",
                  language: "python",
                  filename: "alloy_signals.py",
                  code: `client = SZLClient.from_credential(credential)

# Ingest a signal
result = client.post("/alloy/ingest/signal", {
    "domain": "vessels",
    "type": "port_delay",
    "severity": "medium",
    "entityId": "vessel_ocean_pioneer_88",
    "payload": {
        "port": "USGUL",
        "delayHours": 18,
        "reason": "weather",
    },
    "metadata": {
        "source": "ais_feed",
        "confidence": 0.94,
    },
})
print(f"Signal {result['signalId']} — {result['workflowsTriggered']} workflows triggered")`,
                },
                {
                  label: "cURL",
                  language: "bash",
                  filename: "alloy-signals.sh",
                  code: `curl -X POST https://[host]/api/alloy/ingest/signal \\
  -H "Authorization: Bearer $SZL_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "domain": "vessels",
    "type": "port_delay",
    "severity": "medium",
    "entityId": "vessel_ocean_pioneer_88",
    "payload": {
      "port": "USGUL",
      "delayHours": 18,
      "reason": "weather"
    }
  }'`,
                },
              ]}
            />
          </section>

          {/* ── Rate Limits ── */}
          <section>
            <SectionHeader
              id="rate-limits"
              title="Rate Limits"
              subtitle="The API enforces per-tier rate limits to ensure platform stability. Limits are applied per IP address for unauthenticated requests, and per user/API key for authenticated requests."
            />

            <div
              className="rounded-lg overflow-hidden mb-6"
              style={{ border: "1px solid hsla(0,0%,100%,0.07)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsla(214,14%,7%,0.8)", borderBottom: "1px solid hsla(0,0%,100%,0.07)" }}>
                    {["Tier", "Requests/Hour", "Burst Limit", "Applies To"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3"
                        style={{ color: "hsl(214,8%,55%)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.75rem" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RATE_LIMIT_TIERS.map(({ tier, rph, burst, applies, color }, i) => (
                    <tr
                      key={tier}
                      style={{
                        borderBottom: i < RATE_LIMIT_TIERS.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                        background: i % 2 === 0 ? "hsla(214,14%,6%,0.4)" : "transparent",
                      }}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: `${color}18`,
                            border: `1px solid ${color}33`,
                            color,
                            fontFamily: "var(--font-display)",
                            fontWeight: 500,
                          }}
                        >
                          {tier}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "hsl(214,10%,80%)" }}>
                        {rph}
                      </td>
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "hsl(214,10%,80%)" }}>
                        {burst}
                      </td>
                      <td className="px-4 py-3" style={{ color: "hsl(214,8%,62%)", fontSize: "0.8125rem" }}>{applies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              When a rate limit is exceeded, the API returns a <InlineCode>429 Too Many Requests</InlineCode> response
              with the following headers:
            </p>

            <CodeBlock
              language="text"
              code={`HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1746316800
Retry-After: 47

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Retry after 47 seconds.",
  "code": "RATE_LIMITED"
}`}
            />

            <Callout type="tip">
              Implement exponential backoff when handling 429 responses. Start with the{" "}
              <InlineCode>Retry-After</InlineCode> value as your base delay, and apply jitter
              (±20%) to prevent synchronized retry storms.
            </Callout>
          </section>

          {/* ── Error Codes ── */}
          <section>
            <SectionHeader
              id="errors"
              title="Error Codes"
              subtitle="All errors follow a consistent structure with an HTTP status code, human-readable message, and machine-readable code field."
            />

            <CodeBlock
              filename="Error response shape"
              language="json"
              code={`{
  "error": "Not Found",
  "message": "The requested resource does not exist.",
  "code": "RESOURCE_NOT_FOUND",
  "statusCode": 404,
  "correlationId": "req_01j9xkz..."
}`}
            />

            <SubSectionHeader id="error-http" title="HTTP Status Codes" />
            <div
              className="rounded-lg overflow-hidden mb-8"
              style={{ border: "1px solid hsla(0,0%,100%,0.07)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsla(214,14%,7%,0.8)", borderBottom: "1px solid hsla(0,0%,100%,0.07)" }}>
                    {["Code", "Name", "Description"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3"
                        style={{ color: "hsl(214,8%,55%)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.75rem" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ERROR_CODES.map(({ code, name, description }, i) => (
                    <tr
                      key={code}
                      style={{
                        borderBottom: i < ERROR_CODES.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                        background: i % 2 === 0 ? "hsla(214,14%,6%,0.4)" : "transparent",
                      }}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: code >= 500
                              ? "hsl(0,72%,62%)"
                              : code >= 400
                              ? "hsl(38,88%,60%)"
                              : "hsl(214,8%,62%)",
                            background: code >= 500
                              ? "hsla(0,72%,52%,0.12)"
                              : code >= 400
                              ? "hsla(38,88%,50%,0.12)"
                              : "hsla(214,14%,12%,0.5)",
                          }}
                        >
                          {code}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "hsl(214,10%,78%)", fontSize: "0.8125rem" }}>
                        {name}
                      </td>
                      <td className="px-4 py-3" style={{ color: "hsl(214,8%,60%)" }}>{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SubSectionHeader id="error-codes-api" title="Application Error Codes" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              The <InlineCode>code</InlineCode> field in error responses provides machine-readable context
              for programmatic error handling.
            </p>
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid hsla(0,0%,100%,0.07)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsla(214,14%,7%,0.8)", borderBottom: "1px solid hsla(0,0%,100%,0.07)" }}>
                    {["Code", "HTTP", "Description"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3"
                        style={{ color: "hsl(214,8%,55%)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.75rem" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {API_ERROR_CODES.map(({ code, http, description }, i) => (
                    <tr
                      key={code}
                      style={{
                        borderBottom: i < API_ERROR_CODES.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                        background: i % 2 === 0 ? "hsla(214,14%,6%,0.4)" : "transparent",
                      }}
                    >
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(200,80%,72%)", whiteSpace: "nowrap" }}>
                        {code}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.8rem",
                            color: http >= 500 ? "hsl(0,72%,62%)" : "hsl(38,88%,60%)",
                          }}
                        >
                          {http}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "hsl(214,8%,60%)" }}>{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Versioning ── */}
          <section>
            <SectionHeader
              id="versioning"
              title="Versioning Strategy"
              subtitle="The DreamStack API uses a stable-first, additive-change philosophy. Breaking changes require advance notice and a migration path."
            />

            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              The current API is at version <InlineCode>0.2.0</InlineCode>. Version 1.0 will be declared
              when the schema is considered stable for public enterprise use.
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  title: "Non-breaking changes (no version bump required)",
                  color: "hsl(142,62%,48%)",
                  items: [
                    "Adding new optional fields to responses",
                    "Adding new endpoints",
                    "Adding new optional query parameters",
                    "Adding new enum values to existing fields",
                    "Performance improvements and bug fixes",
                  ],
                },
                {
                  title: "Breaking changes (require version increment + migration path)",
                  color: "hsl(0,72%,62%)",
                  items: [
                    "Removing or renaming existing fields",
                    "Changing field types",
                    "Making previously optional fields required",
                    "Removing endpoints",
                    "Changing authentication mechanisms",
                  ],
                },
              ].map(({ title, color, items }) => (
                <div
                  key={title}
                  className="p-5 rounded-lg"
                  style={{
                    background: "hsla(214,14%,7%,0.5)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <div
                    className="flex items-center gap-2 mb-3"
                    style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 600, color: "hsl(214,10%,84%)" }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    {title}
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2" style={{ fontSize: "0.8125rem", color: "hsl(214,8%,60%)" }}>
                        <ChevronRight size={12} style={{ color, marginTop: "3px", flexShrink: 0 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <SubSectionHeader id="versioning-deprecation" title="Deprecation Policy" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              Deprecated endpoints and fields are annotated in the OpenAPI spec with a{" "}
              <InlineCode>deprecated: true</InlineCode> flag and will include a{" "}
              <InlineCode>Deprecation</InlineCode> response header with the planned removal date.
              Enterprise customers receive at minimum <strong style={{ color: "hsl(38,10%,84%)" }}>6 months notice</strong> before removal.
            </p>

            <CodeBlock
              language="text"
              code={`# Deprecation headers on affected endpoints
HTTP/1.1 200 OK
Deprecation: Sat, 01 Nov 2026 00:00:00 GMT
Sunset: Sun, 01 Feb 2027 00:00:00 GMT
Link: </api/docs#section/Versioning>; rel="deprecation"
X-API-Warn: "This endpoint is deprecated. Migrate to /api/v2/vessels by 2027-02-01."`}
            />

            <Callout type="tip">
              Subscribe to the <strong style={{ color: "hsl(38,10%,84%)" }}>platform.api.deprecation</strong> webhook
              event to receive automated notification when any endpoint your integration uses is deprecated.
            </Callout>

            <div className="mt-8 pt-8" style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
              <div className="flex items-center gap-3 mb-4">
                <Server size={16} style={{ color: "hsl(214,8%,50%)" }} />
                <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", color: "hsl(214,8%,60%)" }}>
                  Need help with your integration?
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/contact"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: "hsla(38,55%,60%,0.1)",
                    border: "1px solid hsla(38,55%,60%,0.25)",
                    color: "hsl(38,55%,70%)",
                    textDecoration: "none",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  <ArrowRight size={14} />
                  Contact Integration Support
                </a>
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: "hsla(214,14%,9%,0.8)",
                    border: "1px solid hsla(0,0%,100%,0.08)",
                    color: "hsl(214,8%,68%)",
                    textDecoration: "none",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  <ExternalLink size={14} />
                  Open Swagger UI
                </a>
              </div>
            </div>
          </section>

        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
