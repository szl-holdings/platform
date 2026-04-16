import { Code2, Key, Webhook, Shield, Terminal, Zap, Globe, ChevronRight, ExternalLink, AlertCircle, Lock, RefreshCw, Server, FileCode, Hash, ArrowRight, PlayCircle, Database, Layers } from "lucide-react";
import { CodeBlock, LanguageTabs, SectionHeader, SubSectionHeader, Callout, InlineCode } from "./components";
import { GQL_QUERY_VESSELS, GQL_QUERY_PROJECTS, GQL_MUTATION_SIGNAL, WEBHOOK_EVENTS, RATE_LIMIT_TIERS, ERROR_CODES, API_ERROR_CODES } from "./constants";

export function GraphQLSection() {
  return (
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
  );
}
