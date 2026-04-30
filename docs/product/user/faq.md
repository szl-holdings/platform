# Frequently Asked Questions — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026  
**Audience:** Enterprise evaluators, design partners, operators, developers

---

## General

**What is SZL Holdings?**  
SZL Holdings builds governed decision infrastructure — the structural layer between signal detection and action execution that enforces governance, attribution, and outcome tracking on every consequential decision. The platform is not a dashboard or an AI copilot. It is decision infrastructure with built-in accountability.

**What stage is the platform?**  
Functional alpha across all products, approaching design-partner beta. All domain packs are deployed and operational with real or seeded data integrations. Commercially, the platform is in the design partner phase — building alongside early enterprise customers in security, maritime, real estate, and legal.

**What is the product hierarchy?**  
SZL Holdings (platform) → Lyte (flagship command surface) → Alloy (execution fabric) → CORTEX (mobile command) → 6 domain packs (Aegis, Sentra, Vessels, Terra, Counsel, Carlota Jo). The platform has 8 domain verticals in total: the 6 domain packs plus Lyte and Alloy as platform layers.

**Can I use just one domain pack (e.g., only Vessels)?**  
Yes. Each domain pack is designed to work independently. However, domain packs benefit from the shared Alloy execution fabric and cross-domain Event Fabric signal correlation.

---

## Products

**What is Lyte?**  
Lyte is the flagship governed command surface. It surfaces business signals across the PRISM framework (People, Revenue, Infrastructure, Security, Market), routes them through the governed decision loop, and tracks decisions to outcomes.

**What is Alloy?**  
Alloy is the execution fabric. It provides the workflow engine, approval gate infrastructure, and Proof Chain audit trail shared by all domain packs. It is the governance backbone.

**What is CORTEX?**  
CORTEX is the unified mobile command layer — an iOS and Android app that gives operators access to all domain workspaces, cross-domain badge counts, a unified command feed, and workspace-adaptive AI.

**What is Aegis?**  
Aegis is the security and defense domain pack. It provides SOC command, MITRE ATT&CK mapping, SOAR playbook execution with human approval gates, threat intelligence, and cross-domain security signal correlation.

**What is Vessels?**  
Vessels is the maritime domain pack. It provides fleet command, live AIS telemetry, sanctions screening, dark vessel detection, voyage P&L, freight rate benchmarking, and exception-based workflows.

**What is Terra?**  
Terra is the real estate domain pack. It provides NYC distress pipeline detection, ownership graph analysis, AI-powered underwriting, deal workflow management, and portfolio tracking.

**What is Counsel?**  
Counsel is the legal domain pack. It provides matter management, AI-assisted triage with approval gates, Proof Chain audit trails for legal actions, and court filing integration.

**What is Carlota Jo?**  
Carlota Jo is the advisory domain pack — a client portal, service catalog, booking system, and secure document delivery for high-net-worth advisory clients.

---

## Technology

**What technology stack does SZL use?**  
TypeScript throughout. React 19 + Vite for web, Expo for mobile, Node.js + Express 5 for API, PostgreSQL 16 for database, Drizzle ORM for queries, Azure for infrastructure (App Service, PostgreSQL Flexible, Key Vault, Redis, CDN), Azure Bicep for IaC.

**How many API endpoints and database tables exist?**  
As of April 2026: 2,816 API endpoints across 357 route files; 798 database tables across 170 schema files.

**What AI models does SZL use?**  
The platform supports multi-provider AI with fallback: OpenAI, Anthropic, and Gemini. All AI recommendations are evidence-backed using hybrid retrieval (semantic + keyword), and all outputs operate in "advisory-only" mode — no consequential action executes without human approval.

---

## Security & Trust

**How does authentication work?**  
OIDC/PKCE with session-based auth (httpOnly cookies). Enterprise SSO via Azure AD, Okta, or any OIDC-compatible provider. SCIM 2.0 for automated user provisioning. Biometric auth in CORTEX mobile.

**Do you support SSO?**  
Yes. OIDC-compatible SSO with Azure AD, Okta, Google Workspace, and any standard OIDC provider. SAML is on the roadmap.

**How is tenant isolation enforced?**  
Tenant isolation is architectural, not just query-level. Every database query is org-scoped. Cross-tenant vectors and RAG retrieval are isolated by tenant ID. All P0 isolation gaps were resolved in the April 2026 hardening sprint.

**Is the AI advisory-only?**  
Yes. All AI agents operate in "propose-only" mode. The AI retrieves evidence, checks policy gates, and proposes actions — but a human must explicitly approve before any consequential action executes. The Covenant Policy primitive enforces this; AI cannot bypass it.

**Where is data hosted?**  
On Microsoft Azure infrastructure (US-based). Database is managed PostgreSQL Flexible Server with automated backups, geo-redundant storage, and point-in-time recovery.

**Is SZL SOC 2 certified?**  
SOC 2 Type II audit is targeted for Phase 3 (post-funding, Q3–Q4 2026). The platform is built to SOC 2 controls — the audit process has not yet been completed.

**What is the Proof Chain?**  
The Proof Chain is the immutable audit trail that records every AI-generated recommendation, approval decision, execution action, and outcome. Each record includes source attribution, model identity, confidence score, actor name, and timestamp. It is append-only and cannot be edited after sealing.

**What is Covenant Policy?**  
Covenant Policy is the governance primitive that defines what actions are permitted, under what conditions, and by whom. It enforces human-in-the-loop approval requirements. AI agents cannot bypass Covenant Policy — it is evaluated before any action executes.

---

## Governance & Compliance

**How does human-in-the-loop work?**  
Covenant Policy defines approval requirements for each action type. When a recommended action triggers an approval requirement, the system routes it to the appropriate approvers. Actions cannot execute until all required approvals are collected. Operators approve in the Action Queue; approvals are recorded in the Proof Chain.

**Can the platform produce audit-ready records?**  
Yes. The Proof Chain provides a complete, immutable record of every decision: what was recommended, what evidence was used, who approved, what was decided, and what the outcome was. Records can be exported as PDF or JSON.

**Is the AI governance model compliant with EU AI Act?**  
The platform's architecture is designed with the EU AI Act's requirements in mind: explainability (evidence citations, confidence scores), human oversight (mandatory approval gates), transparency (model attribution on all AI outputs), and immutable audit trails. Formal compliance certification has not been completed.

---

## Getting Started

**How do I request a demo?**  
Visit /demo or /contact to request a guided demonstration. See [DEMO_GUIDE.md](../../sales/demo-guide.md) for demo options.

**How do I become a design partner?**  
See [DESIGN_PARTNER_PROGRAM.md](../../sales/design-partner-program.md) or contact inquiries@szlholdings.com.

**How do I report a security issue?**  
Email security@szlholdings.com. See [SECURITY.md](../../../SECURITY.md) for our responsible disclosure policy.

**Where can I find documentation?**  
Start at [DOCS_HOME.md](docs-home.md). All docs are indexed there.

---

## Support

**What support is available?**  
Design partners receive dedicated onboarding and direct access to the product team. Standard support includes help center documentation, email support, and an escalation path for critical issues. SLAs are defined in design partner agreements.

**Where do I report a bug?**  
Visit /help and select "Report a Bug" or email support@szlholdings.com. For security issues, use security@szlholdings.com.
