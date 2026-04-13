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
import {
  CodeBlock, LanguageTabs, SectionHeader, SubSectionHeader, Callout, InlineCode,
  GQL_QUERY_VESSELS, GQL_QUERY_PROJECTS, GQL_MUTATION_SIGNAL,
} from "./developers/shared";
import { AuthenticationSection } from "./developers/AuthenticationSection";
import { WebhooksSection } from "./developers/WebhooksSection";
import { CodeSamplesSection } from "./developers/CodeSamplesSection";
import { RateLimitsSection } from "./developers/RateLimitsSection";
import { ErrorCodesSection } from "./developers/ErrorCodesSection";
import { VersioningSection } from "./developers/VersioningSection";

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
          <AuthenticationSection />


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
          <WebhooksSection />

          {/* ── Code Samples ── */}
          <CodeSamplesSection />

          {/* ── Rate Limits ── */}
          <RateLimitsSection />

          {/* ── Error Codes ── */}
          <ErrorCodesSection />

          {/* ── Versioning ── */}
          <VersioningSection />


        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
