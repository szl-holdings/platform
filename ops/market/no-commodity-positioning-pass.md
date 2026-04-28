# No-Commodity Positioning Pass

**Last updated:** April 2026  
**Purpose:** Identify and eliminate commodity AI language from all customer-facing materials. Replace with specific, defensible positioning.

---

## The Problem with Commodity AI Language

Most enterprise AI vendors use the same language interchangeably:
- "AI-powered insights"
- "Intelligent automation"
- "Smart workflows"
- "Cutting-edge AI"
- "Next-generation platform"
- "Harness the power of AI"

This language says nothing. Buyers have learned to ignore it. Worse, it signals that the vendor cannot articulate how their AI is differentiated from any other AI.

SZL Holdings must not use any of this language in customer-facing materials.

---

## Commodity Terms — Banned List

Do not use these phrases in any customer-facing content:

| Banned Phrase | Replace With |
|---|---|
| "AI-powered" | Describe the specific AI action and governance (e.g., "AI recommendations that require attorney approval before export") |
| "Intelligent" (as an adjective for software) | Describe what the intelligence does specifically |
| "Smart workflows" | Describe the workflow governance structure |
| "Cutting-edge" | Omit — meaningless |
| "Next-generation" | Omit — meaningless |
| "Harness AI" | Describe how AI is used and governed |
| "Seamless" | Omit or describe the actual integration mechanism |
| "Game-changing" | Omit — every vendor says this |
| "Revolutionary" | Omit — every vendor says this |
| "World-class" | Omit — unverifiable |
| "Enterprise-grade" | Replace with specific controls: "TLS 1.3, org-scoped tenant isolation, RBAC, Proof Chain audit trail" |
| "Trusted by enterprises" | Do not use until real paying enterprise customers exist |
| "Proven ROI" | Do not use until documented case studies exist |
| "Leading platform" | Do not use without analyst recognition or independent source |

---

## What to Say Instead

### Instead of "AI-powered insights"

**Bad:** "Get AI-powered insights across your operations."

**Good:** "Every AI recommendation on the platform carries a source citation, a confidence score, and an approval gate. No AI output reaches your team without governance."

---

### Instead of "intelligent automation"

**Bad:** "Intelligent automation that handles your workflows."

**Good:** "Workflow orchestration with durable state, human-in-the-loop approval requirements enforced at the policy layer, and an immutable audit trail connecting every step to an actor."

---

### Instead of "enterprise-grade security"

**Bad:** "Enterprise-grade security keeps your data safe."

**Good:** "Your data is protected by TLS 1.3, org-scoped tenant isolation (architectural, not just query-level), 11-role RBAC, and a Proof Chain that produces an immutable audit trail for every consequential action."

---

### Instead of "seamless integration"

**Bad:** "Seamlessly integrates with your existing stack."

**Good:** "The API follows REST conventions with standard bearer token auth, Zod-validated inputs, and predictable error codes. Integration typically takes 2–4 hours for a developer familiar with the domain."

---

### Instead of "advanced AI"

**Bad:** "Powered by advanced AI models."

**Good:** "The platform uses OpenAI, Anthropic, and Gemini models with evidence-backed hybrid retrieval. AI outputs are source-grounded — every recommendation includes the specific data points it drew from."

---

## Product Hierarchy Language Rules

The platform hierarchy must be stated consistently. These are the canonical descriptions:

| Product | Canonical Description |
|---|---|
| **SZL Holdings** | Governed decision infrastructure — the shared platform layer |
| **Lyte** | The operator command surface — where signals become decisions, under governance |
| **Continuum** | The execution fabric — workflow orchestration, approval gates, and audit trail |
| **CORTEX** | Unified mobile command — all domain workspaces in one app |
| **Aegis** | Security and defense intelligence on governed infrastructure |
| **Vessels** | Maritime intelligence on governed infrastructure |
| **Terra** | Real estate intelligence on governed infrastructure |
| **PRISM Counsel** | Legal matter intelligence on governed infrastructure |
| **Carlota Jo** | Premium advisory — human-led, platform-supported |
| **IMPERIUM** | Cloud sovereignty intelligence on governed infrastructure |

Domain packs must always be described as running "on governed infrastructure" or "on shared governance infrastructure" — not as standalone products.

---

## AI Governance Language Rules

AI governance is a structural differentiator. It must be described with precision:

**What is true and should be stated:**
- AI recommendations are advisory only — no consequential action executes without explicit human approval
- Every AI output is anchored to a Proof Chain entry (immutable, SHA-256 integrity)
- AI recommendations carry source citations and confidence scores
- AI cannot bypass Covenant Policy — approval gates are enforced at the platform layer, not the UI layer

**What is not true and must not be stated:**
- "Our AI is 100% accurate" — no AI is; do not imply it
- "Our AI is fully audited / certified" — we have internal audit trail infrastructure, not third-party AI certification
- "Our AI is compliant with [regulation]" — we are building toward compliance; do not claim it before certification
- "AI makes decisions" — AI makes recommendations; humans make decisions

---

## Proof and Claims Rules

Every factual claim in customer-facing materials must have a source:

| Claim Type | Acceptable Source |
|---|---|
| Platform scale metrics | COMPANY_FACT_SHEET.md — verified technical counts |
| Security controls | ops/security/threat-model-summary.md, ops/security/secret-inventory.md |
| Technology stack | COMPANY_FACT_SHEET.md |
| Deployment model | ops/replit/deployment-decision.md |
| API capabilities | ops/backend/api-standards.md |
| Mobile capabilities | ops/mobile/ runbooks |

If there is no source document for a claim, the claim should not be made.

---

## Positioning Pass Checklist

When reviewing any customer-facing document, check each item:

- [ ] No commodity AI adjectives (smart, intelligent, cutting-edge, next-generation)
- [ ] Every AI claim is specific and governed (advisory only, source-cited, approval-gated)
- [ ] No unverified social proof ("trusted by," "proven ROI," "leading platform")
- [ ] Security described with specific controls, not "enterprise-grade"
- [ ] Product hierarchy uses canonical names and descriptions
- [ ] Domain packs described as governed extensions, not standalone products
- [ ] Stage is disclosed honestly (pre-revenue, functional alpha, design partner phase)
- [ ] No compliance claims beyond what is currently certified (none as of April 2026)

---

*Apply this pass to: homepage copy, demo materials, trust center content, domain pack pages, press materials, and all ops/market documents.*
