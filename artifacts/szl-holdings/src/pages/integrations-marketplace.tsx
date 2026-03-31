import { m } from "framer-motion";
import { ExternalLink, Shield, Zap, RefreshCw, ArrowRight, CheckCircle2, Package, Blocks } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CONNECTORS = [
  {
    id: "salesforce",
    name: "Salesforce",
    subtitle: "AppExchange Managed Package",
    badgeLabel: "AppExchange",
    badgeColor: "hsl(214,90%,60%)",
    accentColor: "hsl(214,90%,60%)",
    accentRgb: "26,115,232",
    icon: "SF",
    status: "Listing Ready",
    statusColor: "hsl(142,62%,48%)",
    tagline: "Real-time CRM intelligence — pipe your Salesforce signals into the SZL decision engine.",
    description:
      "The SZL Salesforce Connector is a managed package that bridges your Salesforce org with the SZL Alloy intelligence engine. Pipeline health, escalated cases, forecast revisions, and converted leads flow automatically — giving executive leadership a unified risk view across every revenue motion.",
    features: [
      "Live pipeline health and weighted forecast analytics",
      "Escalated case signals surfaced in seconds, not hours",
      "Bi-directional task and case push from SZL to Salesforce",
      "OAuth 2.0 Connected App — no hard-coded credentials",
      "Custom Metadata configuration — admin-friendly setup",
      "Post-install Apex hook auto-schedules hourly sync",
      "Invocable Method for Flow and Process Builder integration",
      "Security Review compliant — passes AppExchange requirements",
    ],
    supportedEditions: ["Professional", "Enterprise", "Unlimited", "Developer"],
    installUrl: "#salesforce-install",
    docsUrl: "https://szlholdings.com/integrations/salesforce",
    marketplaceUrl: "https://appexchange.salesforce.com",
    marketplaceLabel: "View on AppExchange",
    category: "CRM & Revenue",
  },
  {
    id: "jira",
    name: "Jira",
    subtitle: "Atlassian Connect Cloud App",
    badgeLabel: "Atlassian Marketplace",
    badgeColor: "hsl(197,90%,48%)",
    accentColor: "hsl(197,90%,48%)",
    accentRgb: "0,165,213",
    icon: "JR",
    status: "Listing Ready",
    statusColor: "hsl(142,62%,48%)",
    tagline: "Sprint health, SLA signals, and bi-directional sync — powered by SZL intelligence.",
    description:
      "The SZL Jira Connector is a Atlassian Connect Cloud app that delivers sprint health signals, blocked-issue alerts, and SLA breach detection directly into the SZL Alloy engine. Install once and your engineering execution data flows alongside your commercial intelligence — portfolio leadership sees both in one view.",
    features: [
      "Sprint burndown risk detection before retrospectives reveal it",
      "Blocked-issue alerts tagged with issue keys and sprint context",
      "SLA breach signals with severity classification",
      "Overdue item tracking across all connected projects",
      "Real-time webhooks — no polling delay",
      "Issue Glance panel shows SZL context on every Jira ticket",
      "Admin config page embedded in Jira — no CLI needed",
      "Bi-directional issue creation from SZL Alloy signals",
    ],
    supportedEditions: ["Jira Software Cloud", "Jira Service Management Cloud"],
    installUrl: "#jira-install",
    docsUrl: "https://szlholdings.com/integrations/jira",
    marketplaceUrl: "https://marketplace.atlassian.com",
    marketplaceLabel: "View on Marketplace",
    category: "Engineering Execution",
  },
];

const SHARED_FEATURES = [
  {
    icon: Shield,
    title: "Zero Duplicate Logic",
    description:
      "Both connectors wire directly into the existing SZL service adapters. No parallel code paths — one source of truth for data models and business logic.",
  },
  {
    icon: Zap,
    title: "Signal-Native",
    description:
      "Every event from both platforms is normalized into the SZL signal schema and ingested through the Alloy engine — searchable, rankable, and actionable.",
  },
  {
    icon: RefreshCw,
    title: "Bi-Directional",
    description:
      "Push actions from SZL back into your tools — create Salesforce tasks from signals, open Jira tickets from incidents. The loop closes in both directions.",
  },
  {
    icon: Package,
    title: "Enterprise-Grade Packaging",
    description:
      "Salesforce managed package with Apex, Connected App, and Permission Set. Atlassian Connect app with JWT auth, lifecycle hooks, and marketplace descriptor.",
  },
];

const SETUP_STEPS = {
  salesforce: [
    { step: "01", label: "Install Package", detail: "One-click install from AppExchange into your Salesforce org" },
    { step: "02", label: "Authorize OAuth", detail: "Click Connect in SZL portal — OAuth flow handles token storage automatically" },
    { step: "03", label: "Configure Metadata", detail: "Review SZL Config custom metadata record — defaults are pre-configured" },
    { step: "04", label: "Verify & Sync", detail: "Test connection, run first sync, signals appear in Alloy Signal Feed" },
  ],
  jira: [
    { step: "01", label: "Install App", detail: "One-click install from Atlassian Marketplace into your Jira Cloud site" },
    { step: "02", label: "Complete Wizard", detail: "Post-install wizard opens automatically — click Authorize SZL Platform" },
    { step: "03", label: "Set Preferences", detail: "Configure sync interval and feature flags in the embedded admin panel" },
    { step: "04", label: "View Signals", detail: "Navigate to SZL Alloy Signal Feed — sprint health and Jira signals visible" },
  ],
};

export default function IntegrationsMarketplacePage() {
  usePageMeta({
    title: "Marketplace Integrations — SZL Holdings",
    description:
      "Salesforce AppExchange and Atlassian Marketplace connectors for the SZL Holdings intelligence platform. Install and connect in minutes.",
  });

  return (
    <div style={{ background: "hsl(210,12%,5%)", minHeight: "100vh", color: "hsl(0,0%,90%)" }}>
      <SiteNav />

      <main>
        <section
          style={{
            paddingTop: "clamp(80px, 12vw, 140px)",
            paddingBottom: "clamp(48px, 8vw, 96px)",
            paddingInline: "clamp(16px, 5vw, 64px)",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                background: "hsla(214,80%,65%,0.1)",
                border: "1px solid hsla(214,80%,65%,0.2)",
                borderRadius: "100px",
                marginBottom: "24px",
              }}
            >
              <Blocks size={12} color="hsl(214,80%,65%)" />
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: "hsl(214,80%,65%)", textTransform: "uppercase" }}>
                Marketplace Connectors
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: "20px",
                color: "hsl(0,0%,92%)",
              }}
            >
              Connect your stack.
              <br />
              <span style={{ color: "hsl(214,80%,65%)" }}>Amplify your intelligence.</span>
            </h1>

            <p
              style={{
                fontSize: "clamp(15px, 2vw, 18px)",
                color: "hsl(0,0%,58%)",
                lineHeight: 1.7,
                maxWidth: "640px",
                marginBottom: "0",
              }}
            >
              SZL Holdings integrations are published on the Salesforce AppExchange and Atlassian Marketplace — enterprise-grade, security-reviewed, and wired directly into the Alloy intelligence engine.
            </p>
          </m.div>
        </section>

        <section
          style={{
            paddingBlock: "clamp(48px, 6vw, 80px)",
            paddingInline: "clamp(16px, 5vw, 64px)",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "80px" }}>
            {SHARED_FEATURES.map((f, i) => (
              <m.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                style={{
                  padding: "24px",
                  background: "hsl(210,12%,8%)",
                  border: "1px solid hsl(210,10%,12%)",
                  borderRadius: "12px",
                }}
              >
                <f.icon size={20} color="hsl(214,80%,65%)" style={{ marginBottom: "12px" }} />
                <div style={{ fontSize: "14px", fontWeight: 600, color: "hsl(0,0%,88%)", marginBottom: "8px" }}>{f.title}</div>
                <div style={{ fontSize: "13px", color: "hsl(0,0%,50%)", lineHeight: 1.6 }}>{f.description}</div>
              </m.div>
            ))}
          </div>

          {CONNECTORS.map((connector, idx) => (
            <m.div
              key={connector.id}
              id={`${connector.id}-install`}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                marginBottom: "80px",
                background: "hsl(210,12%,7%)",
                border: "1px solid hsl(210,10%,12%)",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "clamp(28px, 4vw, 48px)",
                  borderBottom: "1px solid hsl(210,10%,12%)",
                  background: `radial-gradient(ellipse 60% 100% at ${idx === 0 ? "100%" : "0%"} 50%, hsla(${connector.accentRgb},0.06) 0%, transparent 70%)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "12px",
                        background: `hsla(${connector.accentRgb},0.15)`,
                        border: `1px solid hsla(${connector.accentRgb},0.25)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: connector.accentColor,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {connector.icon}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "hsl(0,0%,92%)", margin: 0 }}>{connector.name}</h2>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "100px",
                            background: `hsla(${connector.accentRgb},0.12)`,
                            color: connector.accentColor,
                            border: `1px solid hsla(${connector.accentRgb},0.2)`,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          {connector.badgeLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "hsl(0,0%,50%)", marginTop: "2px" }}>{connector.subtitle}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: connector.statusColor,
                      }}
                    />
                    <span style={{ fontSize: "12px", color: connector.statusColor, fontWeight: 600 }}>{connector.status}</span>
                  </div>
                </div>

                <p style={{ fontSize: "14px", color: "hsl(0,0%,58%)", lineHeight: 1.7, marginBottom: "20px", maxWidth: "680px" }}>
                  {connector.description}
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <a
                    href={connector.marketplaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 18px",
                      background: connector.accentColor,
                      color: "hsl(0,0%,100%)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "none",
                      border: "none",
                    }}
                  >
                    {connector.marketplaceLabel}
                    <ExternalLink size={12} />
                  </a>
                  <a
                    href={connector.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 18px",
                      background: "transparent",
                      color: "hsl(0,0%,72%)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "none",
                      border: "1px solid hsl(210,8%,18%)",
                    }}
                  >
                    Setup Guide
                    <ArrowRight size={12} />
                  </a>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                <div style={{ padding: "clamp(20px, 3vw, 36px)", borderRight: "1px solid hsl(210,10%,12%)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "hsl(0,0%,40%)", textTransform: "uppercase", marginBottom: "16px" }}>
                    Features
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {connector.features.map((f) => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <CheckCircle2 size={14} color={connector.accentColor} style={{ marginTop: "1px", flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", color: "hsl(0,0%,62%)", lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "clamp(20px, 3vw, 36px)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "hsl(0,0%,40%)", textTransform: "uppercase", marginBottom: "16px" }}>
                    Setup in 4 Steps
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {SETUP_STEPS[connector.id as keyof typeof SETUP_STEPS].map((s) => (
                      <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            background: `hsla(${connector.accentRgb},0.12)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: connector.accentColor,
                            flexShrink: 0,
                          }}
                        >
                          {s.step}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "hsl(0,0%,80%)", marginBottom: "2px" }}>{s.label}</div>
                          <div style={{ fontSize: "12px", color: "hsl(0,0%,48%)", lineHeight: 1.5 }}>{s.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid hsl(210,10%,12%)" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "hsl(0,0%,40%)", textTransform: "uppercase", marginBottom: "10px" }}>
                      Supported Editions
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {connector.supportedEditions.map((e) => (
                        <span
                          key={e}
                          style={{
                            fontSize: "11px",
                            padding: "3px 8px",
                            background: "hsl(210,10%,10%)",
                            border: "1px solid hsl(210,8%,16%)",
                            borderRadius: "4px",
                            color: "hsl(0,0%,55%)",
                          }}
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </m.div>
          ))}
        </section>

        <section
          style={{
            paddingBlock: "clamp(48px, 6vw, 80px)",
            paddingInline: "clamp(16px, 5vw, 64px)",
            maxWidth: "1200px",
            margin: "0 auto",
            borderTop: "1px solid hsl(210,10%,12%)",
          }}
        >
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "32px",
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "hsl(0,0%,90%)", marginBottom: "12px" }}>
                Ready to connect your tools?
              </h2>
              <p style={{ fontSize: "14px", color: "hsl(0,0%,52%)", lineHeight: 1.7 }}>
                Contact us to set up your Salesforce or Jira integration. Our team will walk you through the install and first sync.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <a
                href="/contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  background: "hsl(214,80%,58%)",
                  color: "hsl(0,0%,100%)",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Get in Touch
                <ArrowRight size={13} />
              </a>
              <a
                href="/architecture"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  background: "transparent",
                  color: "hsl(0,0%,65%)",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  border: "1px solid hsl(210,8%,18%)",
                }}
              >
                Platform Architecture
              </a>
            </div>
          </m.div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
