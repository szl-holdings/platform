import { Code2, Book, Key, Webhook, Shield, Terminal, Zap, Globe, ChevronRight, ChevronDown, ExternalLink, AlertCircle, Lock, RefreshCw, Server, FileCode, Hash, ArrowRight, PlayCircle, Database, Layers } from "lucide-react";
import { CodeBlock, LanguageTabs, SectionHeader, SubSectionHeader, Callout, InlineCode } from "./components";

export function OverviewSection({ scrollTo }: { scrollTo: (id: string) => void }) {
  return (
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
  );
}
