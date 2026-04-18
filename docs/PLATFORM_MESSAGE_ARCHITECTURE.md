# SZL Holdings — Platform Message Architecture

**Purpose:** Define the naming hierarchy, messaging roles, and communication rules for Lyte, Alloy, and domain packs — so that every surface, document, and conversation is coherent.

**For:** Product, design, marketing, sales, investor relations
**As of:** April 2026

---

## Naming Hierarchy

```
SZL Holdings (Corporate / Holding Company)
│
├── Lyte ─── Command Surface (flagship, commercial wedge)
│
├── Alloy ── Execution Fabric (infrastructure layer, not sold standalone)
│
├── Aegis ── Domain Pack: Defense & Intelligence
├── Vessels ─ Domain Pack: Maritime Intelligence
├── Terra ─── Domain Pack: Real Estate Intelligence
│
└── Carlota Jo ── Advisory Layer
```

---

## Tier Definitions

### Tier 0: Corporate Brand — SZL Holdings

**Role:** Holding company and ecosystem context layer.

**What it says:**
- We are an enterprise technology holding company.
- We build a unified ecosystem of command-grade platforms.
- Every platform shares one intelligence backbone, one governance model, one design language.

**What it does NOT say:**
- Product features, platform capabilities, or domain specifics at this level.
- Competitive positioning at this level.

**Primary audiences:** Institutional investors, board-level enterprise buyers, strategic partners, press.

**Tone:** Authoritative, concise, institutional. Never promotional.

---

### Tier 1: Command Surface — Lyte

**Role:** Commercial flagship, operating wedge, primary entry point for enterprise buyers.

**What Lyte is:**
Business Observability platform. Connects operational signals to confirmed, governed action. PRISM framework (Pulse / Risk / Intelligence / Signals / Motion). Built for operations leaders and executive teams.

**What Lyte says:**
- "See across your operation in real time."
- "From signal to confirmed action — with full accountability."
- "The command surface for operations leadership."

**What Lyte does NOT say:**
- Security, maritime, real estate — those are domain packs.
- "AI dashboard" or "workflow tool" — too narrow.
- "Automation" — Lyte governs; it doesn't automate blindly.

**Navigation/hierarchy signal:** Lyte is where operators spend most of their time. All domain packs surface their signal context into Lyte when the operator needs cross-domain synthesis.

---

### Tier 2: Execution Fabric — Alloy

**Role:** Infrastructure layer. Not sold as a standalone product. Governs all execution across the platform.

**What Alloy is:**
The connective tissue. Routes signals from observation to action. Maintains the audit trail. Governs agent coordination. Enforces human-in-the-loop checkpoints.

**What Alloy says (when referenced externally):**
- "One execution fabric across every platform."
- "Every confirmed action — human or AI-assisted — runs through Alloy."
- "The governance layer is not optional. It is the architecture."

**What Alloy does NOT say:**
- "Automation platform" — misrepresents the governance model.
- "RPA" — Alloy is workflow orchestration with accountability, not robotic process automation.
- Alloy is never the lead message. It is the credibility layer behind every domain pack's action model.

**Naming rule:** In investor and enterprise contexts, Alloy is the "execution fabric." In technical contexts, it is the "workflow engine." In product copy, it is referenced as the governance layer. It is never just called "workflow software."

---

### Tier 3: Domain Packs

Domain packs are vertical intelligence extensions. They share the Alloy execution model and Lyte's command surface conventions, but provide domain-specific:
- Observation layer (signals specific to the vertical)
- AI reasoning models (domain-tuned)
- Action playbooks (domain-specific escalation and response)

**Aegis — Unified Defense & Intelligence**
- Role: Cybersecurity and defense intelligence vertical.
- Three workspaces: Defense (SOC), Command (MSP Operations), Intelligence (AI Research).
- Says: "Command-grade security operations with unified intelligence context."
- Does NOT say: "SIEM replacement" — Aegis is complementary intelligence, not a log aggregation tool.

**Vessels — Maritime Intelligence**
- Role: Fleet operations and maritime compliance vertical.
- Says: "Real-time fleet intelligence with voyage economics and compliance risk."
- Does NOT say: "AIS viewer" — Vessels reasons, alerts, and routes; it doesn't just display positions.

**Terra — Real Estate Intelligence**
- Role: Commercial real estate distress and deal intelligence vertical.
- Says: "Distressed property intelligence for brokers and investors — live data, not manual research."
- Does NOT say: "Property search tool" — Terra surfaces opportunity signals, not listings.

---

### Tier 4: Advisory Layer — Carlota Jo

**Role:** Premium advisory brand demonstrating intelligence-amplified expert judgment.

**What Carlota Jo says:**
- "Principal-led advisory grounded in platform intelligence."
- "Not intuition — intelligence-informed."

**What Carlota Jo does NOT say:**
- Technology, AI, or platform references in primary client communications — the advisory relationship is personal and trust-based.
- Pricing or commercials in the public-facing surface — inquiry-driven by design.

---

## Cross-Platform Messaging Rules

### Language Consistency

| Concept | Use This | Not This |
|---|---|---|
| Confirmed, attributed actions | "governed action" | "automation" |
| AI agents with HITL | "AI-assisted" or "advisory agents" | "autonomous AI" |
| Signal-to-action lifecycle | "signal to confirmed action" | "automated workflow" |
| Accountability record | "audit trail" or "proof chain" | "logs" |
| Human approval requirements | "human-in-the-loop gates" | "manual review step" |
| Platform overall | "governed decision infrastructure" | "AI platform" or "dashboard suite" |
| Domain packs | "domain packs" or "vertical intelligence" | "modules" or "plugins" |
| Alloy | "execution fabric" | "workflow tool" |
| Lyte | "command surface" | "main dashboard" |

### Status Labels

Every surface must carry an explicit status label visible to users. Use the APP_STATUS register as the authoritative source.

| Status | Label | Meaning |
|---|---|---|
| GA | — (no label needed) | Production-ready, investor/customer presentable |
| Beta | `BETA` badge | Core features complete; some data seeded/mocked |
| Internal | `INTERNAL` badge | Not customer-facing |
| Archived | `ARCHIVED` label | No longer maintained |

### Route Hierarchy

The path structure reflects the brand hierarchy:

```
/                  → SZL Holdings corporate (Tier 0)
/lyte/             → Lyte Command Surface (Tier 1)
/alloy/            → Alloy admin/ops (Tier 2, internal-facing)
/aegis/            → Aegis domain pack (Tier 3)
/vessels/          → Vessels domain pack (Tier 3)
/terra/            → Terra domain pack (Tier 3)
/carlota-jo/       → Carlota Jo advisory (Tier 4)
```

No domain pack should claim language that belongs to the Tier 0 or Tier 1 level (corporate governance, platform thesis). No Tier 1 surface should carry domain-pack-specific content (maritime, security, real estate) without explicit cross-domain context framing.

---

## Mobile Platform: CORTEX

CORTEX is the mobile command surface for the SZL platform — not a parallel brand and not a standalone product.

**CORTEX positioning:**
- "The SZL platform in your pocket — unified command surface across all domain packs."
- Extends Lyte's command surface to mobile.
- Surfaces alerts, approvals, and key signals from all domain packs.

**CORTEX does NOT say:**
- Its own platform thesis or positioning.
- Features that diverge from the desktop platform's architecture.
- Anything that implies CORTEX is a separate product from SZL.

**CORTEX visual identity:** Uses SZL Holdings color system and Lyte's command surface design language. Any CORTEX-specific branding elements must be approved against the SZL Holdings design system.

---

## AI Messaging Rules

AI is present throughout the platform. The messaging must consistently reflect the governance model:

| Context | Correct Framing |
|---|---|
| Agent makes a recommendation | "AI-assisted analysis" or "advisory signal" |
| Agent outputs a summary | "AI-generated synthesis — verify key decisions with primary sources" |
| Agent routes a workflow step | "AI-assisted routing — human confirmation required" |
| Agent evaluation | "Correctness check and version comparison" |
| Model governance | "Explainable, versioned, auditable AI outputs" |

Never: "AI decided," "automated by AI," "AI executed," or similar phrasing that implies autonomous consequential action.

---

## Investor Messaging Hierarchy

When presenting to investors, the messaging sequence is:

1. **Category:** Business Observability — the missing layer between data and accountable action.
2. **Thesis:** Governed decision infrastructure — one backbone, N verticals.
3. **Architecture:** Observe (domain packs) → Alloy (govern) → Confirm (HITL) → Record (proof chain).
4. **Evidence:** Real data pipelines, real approval trails, real audit logs — not a prototype.
5. **Moat:** Shared event model, entity graph, agent governance framework — these cannot be replicated quickly.
6. **Expansion:** One new vertical = new Observe layer + domain models. Alloy, design system, auth, and AI infrastructure are already built.

---

*This document governs all platform naming, messaging hierarchy, and cross-surface language consistency. Conflicts between this document and other materials should be resolved in favor of this document.*
