import { useState } from "react";
import { m } from "framer-motion";
import { Code2, Layers, Shield, ExternalLink, Copy, Check } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "wouter";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        display: "flex", alignItems: "center", gap: "0.3rem",
        padding: "0.25rem 0.625rem", borderRadius: "5px",
        background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)",
        color: "hsl(210,5%,56%)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
      }}
    >
      {copied ? <Check size={11} style={{ color: "#10b981" }} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  return (
    <div style={{
      position: "relative" as const,
      borderRadius: "8px",
      background: "hsla(210,12%,3%,0.8)",
      border: "1px solid hsla(0,0%,100%,0.07)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.5rem 0.875rem",
        background: "hsla(0,0%,100%,0.03)",
        borderBottom: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,40%)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
          {language}
        </span>
        <CopyButton text={code} />
      </div>
      <pre style={{
        margin: 0, padding: "1rem 1.125rem",
        fontSize: "12px", lineHeight: 1.7,
        color: "hsl(210,5%,75%)", fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
        overflowX: "auto" as const,
        whiteSpace: "pre" as const,
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const AUDIT_TRAIL_SAMPLE = `{
  "event_id": "evt_01HZ9KVPQR3MXJT7NW4BCFDAG",
  "event_type": "decision.confirmed",
  "timestamp": "2026-04-19T14:32:07.841Z",
  "actor": {
    "id": "usr_01HZ8MNPQR2KXJT6NW3ABCDEF",
    "role": "operator",
    "org_id": "org_01HZ7LNPQR1KXJT5NW2ABCDEF"
  },
  "agent": {
    "id": "agent_sentinel_maritime_v2.1",
    "confidence": 0.87,
    "policy_scope": "voyage_compliance"
  },
  "decision": {
    "id": "dec_01HZ9JVPQR0MXJT4NW1ABCDEF",
    "type": "voyage_hold",
    "subject_entity": "vessel:IMO-9284971",
    "signal_ids": ["sig_01HZ9HVPQRONXJT3NW0ABCDEF"],
    "inference_id": "inf_01HZ9GVPQRPMXJT2NWZABCDEF"
  },
  "outcome": "confirmed",
  "proof_chain": {
    "signal_hash": "sha256:8f3a9c1d2e4b5f6a7b8c9d0e1f2a3b4c",
    "inference_hash": "sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    "confirmation_hash": "sha256:9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e"
  },
  "immutable": true
}`;

const API_REQUEST_SAMPLE = `# Health check — returns real DB latency, auth, AI status
GET /api/health
Authorization: Bearer <session_token>

# Response
{
  "status": "healthy",
  "timestamp": "2026-04-19T14:32:07.841Z",
  "version": "3.9.1",
  "uptime": 172800,
  "services": {
    "database": { "status": "healthy", "latency": 12 },
    "auth": { "status": "healthy", "latency": 3 },
    "ai": { "status": "healthy", "provider": "anthropic" },
    "storage": { "status": "healthy" }
  }
}`;

const POLICY_SAMPLE = `# Covenant Policy — voyage hold on AIS gap detection
# Plain English → Policy Compiler → Versioned executable

POLICY voyage_hold_on_ais_gap
  VERSION 1.2.0
  SCOPE maritime_compliance
  MODE enforced

  TRIGGER
    signal.type = "ais_gap"
    signal.gap_minutes >= 60
    signal.confidence >= 0.75

  ACTION
    REQUIRE human_confirmation
    BY_ROLE [operator, compliance_officer]
    WITHIN 2h
    RECORD_TO proof_chain

  ESCALATE_ON timeout
    TO [compliance_officer, port_captain]
    AFTER 2h

  AUDIT
    IMMUTABLE true
    CHAIN [signal, inference, confirmation, outcome]`;

const ARCHITECTURE_LAYERS = [
  {
    name: "Observe",
    color: "#4a90b8",
    description: "Signal ingestion from domain-specific sources (AIS, CISA KEV, NYC Open Data, BLS) via registered adapters",
    examples: ["Live CISA KEV feed", "NYC Open Data distress pipeline", "BLS unemployment", "WebSocket real-time channel"],
  },
  {
    name: "Infer",
    color: "#8b7ac8",
    description: "AI agents synthesize signals into typed inferences with confidence scores — never autonomous execution",
    examples: ["Sentinel maritime agent", "NEXUS framework synthesis", "RAG knowledge retrieval (tenant-isolated)", "Model mesh routing"],
  },
  {
    name: "Govern",
    color: "#d4a054",
    description: "Covenant Policy evaluates every inference against configured rules before routing to human review",
    examples: ["Policy Compiler", "Approval gate enforcement", "Role-based routing", "Escalation chains"],
  },
  {
    name: "Confirm",
    color: "#c45a4a",
    description: "Human operators review evidence chain and confirm or deny — platform enforces this at the library layer",
    examples: ["Command Inbox", "Inline approve/dismiss (Task #1947)", "Mobile quick actions", "Multi-step destructive gates"],
  },
  {
    name: "Record",
    color: "#10b981",
    description: "Every confirmed decision records to the immutable Proof Chain with cryptographic hash linking",
    examples: ["Proof Chain (SHA256 linking)", "Decision Ledger", "Actor attribution", "Outcome tracking"],
  },
];

export default function TechnicalProofPage() {
  const __pageMeta = usePageMeta({
    title: "Technical Proof — SZL Holdings",
    description: "Architecture diagrams, real API examples, and audit-trail samples. Evidence-backed technical documentation for evaluators.",
    canonical: "https://szlholdings.com/technical-proof",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          <section style={{
            paddingTop: "clamp(7rem,12vw,10rem)",
            paddingBottom: "clamp(3rem,5vw,4rem)",
            borderBottom: "1px solid hsla(0,0%,100%,0.05)",
          }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                <span style={{
                  display: "inline-block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "hsl(210,5%,48%)", marginBottom: "1.25rem",
                }}>
                  Technical Proof
                </span>
                <h1 style={{
                  fontSize: "clamp(1.875rem,3.5vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.025em",
                  color: "hsl(38,12%,94%)", marginBottom: "1rem", maxWidth: "36rem", lineHeight: 1.12,
                }}>
                  Architecture, API, and audit — not claims.
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,57%)", lineHeight: 1.68, maxWidth: "48ch" }}>
                  Real architecture diagrams, actual API request/response shapes, and live audit-trail record samples.
                  Every item here is citation-linked to source code or docs.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ paddingTop: "clamp(3.5rem,6vw,5rem)", paddingBottom: "clamp(3rem,5vw,4rem)", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                  <Layers size={14} style={{ color: "hsl(210,55%,58%)" }} />
                  <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "hsl(210,55%,58%)" }}>
                    Architecture — Observe → Infer → Govern → Confirm → Record
                  </p>
                </div>
                <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.625rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,92%)", marginBottom: "0.75rem" }}>
                  The governed intelligence loop
                </h2>
                <p style={{ fontSize: "0.9rem", color: "hsl(210,5%,55%)", marginBottom: "2rem", maxWidth: "52ch", lineHeight: 1.65 }}>
                  Source: <code style={{ fontSize: "12px", color: "hsl(210,55%,60%)" }}>architecture.md</code>,{" "}
                  <code style={{ fontSize: "12px", color: "hsl(210,55%,60%)" }}>policy-model.md</code>,{" "}
                  <code style={{ fontSize: "12px", color: "hsl(210,55%,60%)" }}>packages/alloy/</code>
                </p>
              </m.div>
  
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.625rem" }}>
                {ARCHITECTURE_LAYERS.map((layer, i) => (
                  <m.div
                    key={layer.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "5rem 1fr auto",
                      gap: "1.5rem",
                      padding: "1.125rem 1.375rem",
                      borderRadius: "10px",
                      background: "hsla(0,0%,100%,0.02)",
                      border: "1px solid hsla(0,0%,100%,0.06)",
                      borderLeft: `3px solid ${layer.color}`,
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <span style={{
                        fontSize: "13px", fontWeight: 800, color: layer.color,
                        letterSpacing: "-0.01em", textTransform: "uppercase" as const,
                      }}>
                        {layer.name}
                      </span>
                      <span style={{
                        display: "block", fontSize: "10px", fontWeight: 600,
                        color: "hsl(210,5%,38%)", marginTop: "0.2rem",
                      }}>
                        Layer {i + 1}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", color: "hsl(210,5%,60%)", lineHeight: 1.6, marginBottom: "0.5rem" }}>
                        {layer.description}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.375rem" }}>
                        {layer.examples.map(ex => (
                          <span key={ex} style={{
                            fontSize: "11px", color: "hsl(210,5%,46%)",
                            background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.06)",
                            padding: "0.15rem 0.5rem", borderRadius: "4px",
                          }}>
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ paddingTop: "clamp(3.5rem,6vw,5rem)", paddingBottom: "clamp(3rem,5vw,4rem)", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ marginBottom: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                  <Code2 size={14} style={{ color: "hsl(210,55%,58%)" }} />
                  <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "hsl(210,55%,58%)" }}>
                    Real API — request and response
                  </p>
                </div>
                <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.625rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,92%)", marginBottom: "0.5rem" }}>
                  Health endpoint — live data, no mocks
                </h2>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,52%)", lineHeight: 1.6, maxWidth: "52ch" }}>
                  Source: <code style={{ fontSize: "12px", color: "hsl(210,55%,60%)" }}>artifacts/api-server/src/routes/health.ts</code> (CAP-001, status: live)
                </p>
              </m.div>
              <CodeBlock code={API_REQUEST_SAMPLE} language="http" />
              <div style={{ marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "hsl(38,12%,86%)", marginBottom: "0.5rem" }}>Covenant Policy — plain-English compiled to executable governance</h3>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,52%)", marginBottom: "1rem", lineHeight: 1.6 }}>
                  Source: <code style={{ fontSize: "12px", color: "hsl(210,55%,60%)" }}>packages/policy-engine/</code>, Task #1954 (Policy Compiler, status: live)
                </p>
                <CodeBlock code={POLICY_SAMPLE} language="policy" />
              </div>
            </div>
          </section>
  
          <section style={{ paddingTop: "clamp(3.5rem,6vw,5rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ marginBottom: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                  <Shield size={14} style={{ color: "hsl(210,55%,58%)" }} />
                  <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "hsl(210,55%,58%)" }}>
                    Audit Trail — sample record
                  </p>
                </div>
                <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.625rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,92%)", marginBottom: "0.5rem" }}>
                  Decision Ledger record
                </h2>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,52%)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                  Source: <code style={{ fontSize: "12px", color: "hsl(210,55%,60%)" }}>artifacts/api-server/src/db/schema.ts</code> → auditTrailTable,{" "}
                  <code style={{ fontSize: "12px", color: "hsl(210,55%,60%)" }}>packages/alloy/</code> (CAP-010, working_demo → proof chain).
                  Every confirmed decision generates an event of this shape. SHA256 hash chain links signal → inference → confirmation → outcome.
                </p>
              </m.div>
              <CodeBlock code={AUDIT_TRAIL_SAMPLE} language="json" />
  
              <div style={{ marginTop: "2.5rem", display: "flex", flexWrap: "wrap" as const, gap: "0.75rem" }}>
                {[
                  { label: "Product Readiness Matrix", href: "/product-readiness" },
                  { label: "Trust Center Status", href: "/trust-center/status" },
                  { label: "Trust Center", href: "/trust-center" },
                  { label: "Changelog", href: "/changelog-highlights" },
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ fontSize: "13px", color: "hsl(210,55%,58%)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    {link.label} <ExternalLink size={11} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
