# SZL Holdings — Product Matrix

*Public-facing platform inventory | Updated Q1 2026*

---

## Active Platforms

### Lyte — Business Observability

| Attribute | Detail |
|-----------|--------|
| **Audience** | Operations leads, CFOs, PMOs, executive teams |
| **Problem Solved** | Organizations can't see across their operational systems in real time — signals are siloed, risks surface too late, and the people responsible for outcomes spend too much time manually correlating data |
| **Category** | Business Observability |
| **Status** | Live |
| **Core Differentiators** | PRISM framework (Pulse/Risk/Intelligence/Signals/Motion), approval latency detection, signal-to-action lifecycle with full audit trail, 40+ connector integrations |
| **Strategic Role** | Operating wedge and flagship platform. Lyte establishes the category of Business Observability and is the primary commercial entry point for the SZL ecosystem |

---

### Aegis — Unified Defense & Intelligence

| Attribute | Detail |
|-----------|--------|
| **Audience** | CISOs, SOC analysts, managed security providers (MSPs), compliance officers |
| **Problem Solved** | Security and intelligence operations are fragmented across disconnected tools — threat detection, managed operations, and AI research each require separate systems with separate context |
| **Category** | Cybersecurity & Defense Intelligence |
| **Status** | Live |
| **Core Differentiators** | Three unified workspaces (Defense/Command/Intelligence) sharing one data context, MITRE ATT&CK v14 detection coverage, SOAR playbook engine, STIX/TAXII protocol layer, FedRAMP readiness track |
| **Strategic Role** | Defense and intelligence vertical built on the same PRISM observability backbone as Lyte. MSP Command module creates a managed services revenue path |

---

### Terra — Real Estate Intelligence

| Attribute | Detail |
|-----------|--------|
| **Audience** | NYC brokers, real estate investors, portfolio managers |
| **Problem Solved** | Distressed property intelligence is fragmented across public records, manual research, and disconnected tools — deal opportunities are missed and ownership structures are opaque |
| **Category** | Real Estate Intelligence |
| **Status** | Live |
| **Core Differentiators** | Live NYC distress data pipeline (multiple public data sources), ownership structure tracking, deal pipeline management via Alloy, broker workflow integration |
| **Strategic Role** | Real estate vertical demonstrating the platform's ability to aggregate public data into actionable commercial intelligence. Foundation for national expansion |

---

### Vessels — Maritime Intelligence

| Attribute | Detail |
|-----------|--------|
| **Audience** | Fleet executives, maritime operations teams, commercial directors, compliance officers |
| **Problem Solved** | Fleet operators lack real-time visibility into vessel behavior, voyage economics, and compliance risk — decisions are made on lagging data and manual synthesis |
| **Category** | Maritime Intelligence |
| **Status** | Live |
| **Core Differentiators** | AIS telemetry integration, voyage economics modeling, dark vessel detection, sanctions screening, route intelligence, exception center with consequence modeling |
| **Strategic Role** | Maritime vertical with a quantifiable compliance and commercial intelligence value proposition. High-stakes buyer profile (enterprise, government, insurance) |

---

### Carlota Jo — Private Advisory

| Attribute | Detail |
|-----------|--------|
| **Audience** | Founders, executives, high-net-worth clients seeking brand and operational strategy |
| **Problem Solved** | Premium advisory is often disconnected from operational reality — advice is intuition-based rather than intelligence-informed |
| **Category** | Private Advisory |
| **Status** | Live (web and mobile) |
| **Core Differentiators** | Principal-led advisory grounded in platform intelligence, luxury brand positioning, native mobile app for client engagement, discreet inquiry workflow |
| **Strategic Role** | Advisory layer of the SZL ecosystem. Demonstrates the model that every vertical eventually supports: domain expertise amplified by platform-grade intelligence access |

---

### SZL Holdings — Corporate Platform

| Attribute | Detail |
|-----------|--------|
| **Audience** | Investors, enterprise evaluators, strategic partners |
| **Problem Solved** | The ecosystem needs a coherent corporate presence that presents the platform hierarchy, trust posture, and investor narrative in one place |
| **Category** | Corporate / Holding Company |
| **Status** | Live |
| **Core Differentiators** | Ecosystem overview with Alloy backbone, investor relations, trust center, compliance documentation, developer portal, contact pathways |
| **Strategic Role** | Top of the brand hierarchy. Primary destination for investor and enterprise evaluation |

---

### Stephen Lutar — Founder Authority Site

| Attribute | Detail |
|-----------|--------|
| **Audience** | Prospective partners, employers, clients, collaborators |
| **Problem Solved** | Founder identity and professional narrative separate from the corporate brand |
| **Category** | Founder Portfolio |
| **Status** | Live |
| **Core Differentiators** | Work showcase, technical frameworks, thesis writing, case studies, career command |
| **Strategic Role** | Founder positioning and personal brand — independent from SZL Holdings corporate identity |

---

## Internal Systems (Platform Infrastructure)

These systems power the SZL ecosystem but are not standalone products sold to customers.

| System | Purpose |
|--------|---------|
| **Alloy — Execution Fabric** | Workflow orchestration, audit trail, agent coordination, and human-in-the-loop approval gates across all platforms |
| **Aegis Intelligence** | AI research infrastructure — model registry, experiment tracking, ensemble evaluation, and LLM governance |
| **Aegis Operations** | Managed services command infrastructure within the Aegis platform |

---

## Technology Platform Summary

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Mobile | Expo / React Native (iOS and Android) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Real-time | WebSocket with HMAC-signed authentication |
| AI | OpenAI, Anthropic, Google Gemini |
| Payments | Stripe (Checkout, Subscriptions, Invoicing) |
| Maps | Mapbox GL JS |
| Infrastructure | Azure Bicep, pnpm monorepo |
