import { m } from "framer-motion";
import { GitBranch, GitCommit, Zap, Shield, Bug, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

type ChangeType = "feature" | "security" | "fix" | "infra" | "audit";

interface CommitGroup {
  date: string;
  sha: string;
  title: string;
  body?: string;
  type: ChangeType;
  products: string[];
  taskRef?: string;
}

const TYPE_META: Record<ChangeType, { label: string; color: string; bg: string }> = {
  feature: { label: "Feature", color: "#10b981", bg: "hsla(152,50%,42%,0.12)" },
  security: { label: "Security", color: "#ef4444", bg: "hsla(0,62%,52%,0.1)" },
  fix: { label: "Fix", color: "#f59e0b", bg: "hsla(38,85%,50%,0.1)" },
  infra: { label: "Infra", color: "#6b7280", bg: "hsla(0,0%,50%,0.1)" },
  audit: { label: "Audit", color: "#8b5cf6", bg: "hsla(246,55%,62%,0.1)" },
};

const COMMITS: CommitGroup[] = [
  {
    date: "2026-04-19",
    sha: "1d14b5d",
    title: "Inline approve/dismiss on Global Fabric approvals panel",
    body: "Operators can now approve or dismiss Alloy workflow items inline — no modal or page navigation required. Confirmation records to audit trail with actor attribution.",
    type: "feature",
    products: ["Alloy", "Command"],
    taskRef: "#1947",
  },
  {
    date: "2026-04-19",
    sha: "7b83d29",
    title: "Fabric: feed live signal/run data from real product sources",
    body: "Global Fabric now pulls signal data from live API endpoints across Lyte, Vessels, Terra, and Aegis. Replaced seeded mock data on the Command surface.",
    type: "feature",
    products: ["Command", "Lyte", "Vessels", "Terra", "Aegis"],
    taskRef: "#1948",
  },
  {
    date: "2026-04-19",
    sha: "497daf4",
    title: "Runtime audit harness — pnpm audit:full pipeline",
    body: "Introduced automated runtime audit pipeline that validates every capability in the platform-capability-manifest.json against live API responses. Closes the loop between manifest claims and runtime truth.",
    type: "audit",
    products: ["Infrastructure"],
    taskRef: "#1951",
  },
  {
    date: "2026-04-18",
    sha: "5542230",
    title: "Decision Twin — causal what-if simulation with PRISM impact and audit",
    body: "Lyte operators can now fork a pending decision, adjust parameters, and run causal simulation against the PRISM model before confirming. All simulation runs record to the decision ledger.",
    type: "feature",
    products: ["Lyte"],
  },
  {
    date: "2026-04-18",
    sha: "17a1cdf",
    title: "Truth audit deliverables — capability manifest, gap register, launch readiness report",
    body: "Published platform-capability-manifest.json covering 80+ capabilities across all products. Every claim is backed by code evidence or marked as partial/stub. Gap register created for unfulfilled items.",
    type: "audit",
    products: ["Infrastructure", "All Products"],
    taskRef: "#1950",
  },
  {
    date: "2026-04-17",
    sha: "7d93dda",
    title: "Policy Compiler — plain-English to versioned executable governance",
    body: "Operators can now write governance policies in plain language and compile them to versioned, executable policy objects. Integrated with Covenant Policy enforcement layer.",
    type: "feature",
    products: ["Alloy", "Lyte"],
    taskRef: "#1954",
  },
  {
    date: "2026-04-16",
    sha: "be36015",
    title: "Email/Slack daily proof-chain digest to executives",
    body: "Automated daily proof-chain summary now delivers to executive subscribers via email (Resend) and Slack. Summary includes decision count, pending approvals, and high-severity audit events.",
    type: "feature",
    products: ["Alloy", "API Server"],
    taskRef: "#1945",
  },
  {
    date: "2026-04-15",
    sha: "78c6c9c",
    title: "Policy approvals page: approve/reject buttons functional",
    body: "Fixed a blocking issue where policy approval/rejection UI calls were silently failing. Approve and reject now correctly route to the Alloy workflow engine and record to audit trail.",
    type: "fix",
    products: ["Lyte", "Alloy"],
    taskRef: "#1944",
  },
  {
    date: "2026-04-15",
    sha: "c7f0a58",
    title: "PolicyModeBadge consolidated into shared design-system package",
    body: "Policy mode badge (Advisory / Enforced / Locked) is now a single canonical component in the design-system package, used consistently across Vessels, Terra, Carlota Jo, and Lyte.",
    type: "infra",
    products: ["Design System"],
  },
  {
    date: "2026-04-14",
    sha: "d46ef47",
    title: "Policy mode badge on every operational product page",
    body: "Vessels, Terra, and Carlota Jo now display the current policy mode badge in their header. Operators can see at a glance whether AI decisions are advisory, enforced, or locked.",
    type: "feature",
    products: ["Vessels", "Terra", "Carlota Jo"],
  },
  {
    date: "2026-04-13",
    sha: "1a79391",
    title: "PRISM Counsel data scoped to signed-in organization",
    body: "Legal matter data in PRISM Counsel is now fully tenant-scoped. All queries now enforce org_id at the DB layer. Closes a data isolation gap documented in KNOWN-GAPS.md.",
    type: "security",
    products: ["PRISM Counsel", "API Server"],
  },
  {
    date: "2026-04-12",
    sha: "f46cf44",
    title: "Sentra and Counsel marketing landing pages",
    body: "Public marketing pages launched for Sentra (Cyber Resilience Command) and Counsel (Legal Matter Command). Both include live demo narrative flows and product positioning.",
    type: "feature",
    products: ["Sentra", "Counsel"],
  },
  {
    date: "2026-04-11",
    sha: "ab00755",
    title: "Sentra/Counsel demo narratives wired to live signal mesh",
    body: "Sentra and Counsel demo flows now pull from the live signal mesh via WebSocket. Incident and matter timelines update in real time during demos.",
    type: "feature",
    products: ["Sentra", "Counsel"],
    taskRef: "#1935",
  },
  {
    date: "2026-04-09",
    sha: "a5d7728",
    title: "Signal mesh write batching — 3× throughput improvement",
    body: "Signal writes now batch at 50ms windows before flushing to the DB. Reduces DB connection pressure at peak load and improves overall signal ingestion throughput.",
    type: "infra",
    products: ["API Server"],
    taskRef: "#1921",
  },
  {
    date: "2026-04-08",
    sha: "e18f7a5",
    title: "Operations pages for Counsel: Alerts, Approvals, Trust & Provenance",
    body: "Counsel now has full operational pages for alert triage, approval workflows, and proof-chain browsing. Trust & Provenance page shows matter-level audit trails.",
    type: "feature",
    products: ["Counsel"],
  },
  {
    date: "2026-04-06",
    sha: "da80b57",
    title: "Rotating refresh-token endpoint — web and mobile",
    body: "Added rotating refresh-token endpoint. Web and mobile clients now exchange short-lived access tokens with automatic refresh. Eliminates long-lived session vulnerabilities.",
    type: "security",
    products: ["API Server", "SZL Holdings Mobile"],
  },
  {
    date: "2026-04-04",
    sha: "c32b76e",
    title: "Admin UI for governance tiers and guardrail configs",
    body: "Platform admins can now configure governance tier assignments and guardrail parameters from the admin UI. Changes are versioned and logged to the audit trail.",
    type: "feature",
    products: ["Command", "API Server"],
    taskRef: "#1927",
  },
  {
    date: "2026-04-02",
    sha: "5e8f739",
    title: "Lyte surfaces wired to live API data",
    body: "PRISM dashboard, Command Inbox, and Watchdog surfaces in Lyte now pull from live API endpoints. BLS, GitHub Trending, and RSS feeds are active. Demo seed fallback retained for offline mode.",
    type: "feature",
    products: ["Lyte"],
    taskRef: "#1893",
  },
];

function TypeBadge({ type }: { type: ChangeType }) {
  const m = TYPE_META[type];
  return (
    <span style={{
      display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: "4px",
      background: m.bg, color: m.color, fontSize: "10px", fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase" as const,
    }}>
      {m.label}
    </span>
  );
}

const PRODUCT_COLORS: Record<string, string> = {
  Lyte: "#d4a054", Alloy: "#8b7ac8", Command: "#5b8dd4", Vessels: "#4a90b8",
  Terra: "#c8953c", Aegis: "#c45a4a", Sentra: "#ef8c3a", Counsel: "#6aaa72",
  "PRISM Counsel": "#70b890", "Carlota Jo": "#a0a0c0", "API Server": "#6aaa72",
  Infrastructure: "#808090", "Design System": "#7090a8", "SZL Holdings Mobile": "#7ecfc0",
  "All Products": "#d4a054",
};

export default function ChangelogHighlightsPage() {
  const __pageMeta = usePageMeta({
    title: "Changelog — SZL Holdings",
    description: "Real changelog derived from git history — material capabilities shipped across the SZL Holdings platform.",
    canonical: "https://szlholdings.com/changelog-highlights",
  });

  const byMonth = COMMITS.reduce<Record<string, CommitGroup[]>>((acc, c) => {
    const m = c.date.substring(0, 7);
    if (!acc[m]) acc[m] = [];
    acc[m].push(c);
    return acc;
  }, {});

  const monthLabels: Record<string, string> = {
    "2026-04": "April 2026",
    "2026-03": "March 2026",
    "2026-02": "February 2026",
    "2026-01": "January 2026",
  };

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main id="main-content" role="main">
  
          <section style={{
            paddingTop: "clamp(7rem,12vw,10rem)",
            paddingBottom: "clamp(3rem,5vw,4rem)",
            borderBottom: "1px solid hsla(0,0%,100%,0.05)",
          }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                  <GitBranch size={14} style={{ color: "hsl(210,5%,48%)" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,48%)" }}>
                    Changelog
                  </span>
                </div>
                <h1 style={{
                  fontSize: "clamp(1.875rem,3.5vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.025em",
                  color: "hsl(38,12%,94%)", marginBottom: "1rem", maxWidth: "36rem", lineHeight: 1.12,
                }}>
                  Material capabilities, shipped.
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,57%)", lineHeight: 1.68, maxWidth: "48ch" }}>
                  Derived from real git commit history — filtered to customer-visible capability changes.
                  Internal refactors, test coverage, and documentation commits are excluded.
                  SHA links trace to the actual commit.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ paddingTop: "clamp(3rem,5vw,4.5rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "3rem" }}>
                {Object.entries(byMonth).sort(([a], [b]) => b.localeCompare(a)).map(([month, commits]) => (
                  <div key={month}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "hsl(38,12%,70%)", letterSpacing: "0.04em" }}>
                        {monthLabels[month] ?? month}
                      </span>
                      <div style={{ flex: 1, height: "1px", background: "hsla(0,0%,100%,0.06)" }} />
                      <span style={{ fontSize: "11px", color: "hsl(210,5%,38%)" }}>{commits.length} changes</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.75rem" }}>
                      {commits.map((commit, i) => (
                        <m.div
                          key={commit.sha}
                          initial={{ opacity: 0, y: 8 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: i * 0.04 }}
                          style={{
                            padding: "1.125rem 1.375rem",
                            borderRadius: "10px",
                            background: "hsla(0,0%,100%,0.02)",
                            border: "1px solid hsla(0,0%,100%,0.06)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" as const }}>
                              <TypeBadge type={commit.type} />
                              <span style={{ fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,88%)", letterSpacing: "-0.01em" }}>
                                {commit.title}
                              </span>
                              {commit.taskRef && (
                                <span style={{ fontSize: "11px", color: "hsl(210,5%,40%)", fontFamily: "monospace" }}>{commit.taskRef}</span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                              <span style={{ fontSize: "11px", color: "hsl(210,5%,36%)" }}>{commit.date}</span>
                              <code style={{
                                fontSize: "11px", fontFamily: "monospace", color: "hsl(210,55%,60%)",
                                background: "hsla(210,55%,52%,0.1)", padding: "0.15rem 0.45rem", borderRadius: "4px",
                              }}>
                                {commit.sha}
                              </code>
                            </div>
                          </div>
                          {commit.body && (
                            <p style={{ fontSize: "13px", color: "hsl(210,5%,52%)", lineHeight: 1.65, marginBottom: "0.625rem" }}>
                              {commit.body}
                            </p>
                          )}
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.375rem" }}>
                            {commit.products.map(p => (
                              <span key={p} style={{
                                fontSize: "11px", fontWeight: 600,
                                color: PRODUCT_COLORS[p] ?? "hsl(210,5%,50%)",
                                padding: "0.1rem 0.5rem", borderRadius: "4px",
                                background: "hsla(0,0%,100%,0.04)",
                              }}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </m.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
  
              <div style={{ marginTop: "3rem", padding: "1.25rem 1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.015)", border: "1px solid hsla(0,0%,100%,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                  <GitCommit size={13} style={{ color: "hsl(210,5%,48%)" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,42%)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                    Source
                  </span>
                </div>
                <p style={{ fontSize: "12.5px", color: "hsl(210,5%,44%)", lineHeight: 1.6 }}>
                  This changelog is derived from git log entries filtered to material customer-visible changes — features, security improvements, significant fixes, and infrastructure changes that affect operator experience.
                  Internal refactors, documentation updates, and test-only commits are excluded.
                  SHA hashes trace to commits in the platform repository.
                </p>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
