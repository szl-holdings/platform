# Buyer Journey by Persona

**Status**: Phase C deliverable
**Owner**: Stephen Lutar, Founder & CEO
**Pairs with**: `category-site-pass.md`, `public-architecture-story.md`, `why-buyers-buy.md`, `enterprise-close-pack.md`, `design-partner-machine.md`

---

## 1. Why this document exists

The flagship site has five distinct buyer personas and they do not buy in the same way, in the same sequence, or for the same reason. A single linear journey ("land on home → click pricing → start trial") would fail every one of them. This document specifies the journey we expect each persona to actually take and the surfaces we have built to support it.

This is a *map*, not a script. Personas overlap in real engagements. But each surface on the public site has been built to carry the load for one persona at a time.

## 2. The five personas

| # | Persona | Why they are here | First click | Real evaluation surface |
|---|---|---|---|---|
| 1 | **Executive buyer** (CEO / COO / CIO / business owner of the workflow) | A high-friction operating problem they cannot solve with their current stack | `/platform` | Conversation with founder; design-partner pilot |
| 2 | **Technical evaluator** (Head of Platform / Chief Architect / Principal Engineer) | Architectural diligence — is this real, will it integrate, will it scale | `/architecture`, `/docs` | Architecture review session; integration scoping |
| 3 | **Security reviewer** (CISO / Head of GRC / Compliance Officer) | Can this pass our security and audit posture | `/trust`, `/trust/security`, `/trust/ai` | Security questionnaire; controls walk-through |
| 4 | **Design partner candidate** (Operator owning the workflow + sponsor) | Wants to be early, wants influence, wants proof | `/design-partner` | Founder-led qualification call; pilot scoping |
| 5 | **Investor / advisor** (Series A lead, strategic, or board candidate) | Diligence on the company, the founder, and the category thesis | `/investor`, `/founder`, `/leadership` | Founder conversation; data room |

## 3. Journey by persona

### 3.1 Executive buyer

**Entry signal:** "We have an operating workflow that loses time, money, or risk every week. We have tried tools. They didn't hold."

**Surfaces (in order):**
1. Homepage hero → category clarity in one screen
2. "Where do you start?" → "Executive buyer" → `/platform`
3. Platform overview → reads the loop, sees the platform hierarchy, sees domain pack relevance
4. One of: `/lyte`, `/continuum-fabric`, or a domain pack page (Aegis, Vessels, Terra, Counsel) depending on their workflow
5. `/case-studies` for shape-matching to their context
6. CTA: `/demo` or `/design-partner`

**Disqualifying signals:** They want a self-serve trial. They want to swap us into an existing dashboard slot. They want a feature checklist.
**Qualifying signals:** They can name the workflow. They can name the cost of the workflow being broken. They can name an operator who would own it.

**What we owe them:** A 30-minute founder-led call within the week.

---

### 3.2 Technical evaluator

**Entry signal:** "An exec asked me to look at this. I need to know if it is real architecture or marketing."

**Surfaces (in order):**
1. Homepage → platform hierarchy and the 9-step loop
2. "Where do you start?" → "Technical evaluator" → `/architecture`
3. `/docs/architecture`, `/docs/control-plane`, `/docs/proof-chain`, `/docs/model-mesh`
4. `/architecture` (full-page architecture story)
5. `/lyte`, `/continuum-fabric`, `/api` for surface-level integration footprint
6. CTA: technical review session (founder + architecture)

**Disqualifying signals:** They are looking for a generic ML platform. They want to replace their data warehouse. They expect a Kubernetes operator and helm charts as the integration story.
**Qualifying signals:** They are interested in policy enforcement, attribution, decision audit trails, and how the simulation layer interacts with the policy layer. They ask about override semantics.

**What we owe them:** Direct technical content (the docs above), plus a working architecture review with the founder. They do not get handed to a sales engineer because there isn't one.

---

### 3.3 Security reviewer

**Entry signal:** "Procurement / business is moving on this. I need to size the risk."

**Surfaces (in order):**
1. `/trust` (Trust Center index)
2. `/trust/security` (controls and posture)
3. `/trust/ai` (AI governance — model accountability, override semantics)
4. `/trust/governance` (policy and audit architecture)
5. `/trust/architecture`, `/docs/proof-chain`, `/docs/control-plane`
6. `/legal/privacy`, `/legal/terms`, `/legal/acceptable-use`, `/legal/security-disclosure`
7. CTA: security questionnaire response and a controls walk-through

**Disqualifying signals:** They expect SOC 2 Type II at series-seed maturity. They expect a fully populated CAIQ in week one.
**Qualifying signals:** They engage on architecture and *override semantics* — not just on certification status. They understand the difference between what is *enforced architecturally* and what is *enforced procedurally*.

**What we owe them:** Honest current-state controls, a roadmap for compliance maturity, and the posture document — *what is enforced where, and what bypass requires* — that lets them write up an internal risk memo without having to invent claims.

---

### 3.4 Design partner candidate

**Entry signal:** "I have a workflow that hurts every week. I want to fix it. I am okay being early if it means I shape the product."

**Surfaces (in order):**
1. Homepage hero → category clarity
2. CTA: "Become a design partner" → `/design-partner`
3. Design Partner page → the five qualification criteria, the timeline, the "good fit / not a fit" frames
4. `/case-studies` to see the shape of past pilots
5. `/contact` → founder-led qualification call

**Disqualifying signals:** They want a generic SaaS trial. They cannot commit a named operator. They cannot articulate the workflow.
**Qualifying signals:** They can name the workflow on the first call, name the cost, name the operator, and name what their next 12 months look like if the proof lands. They are open to a 90-day instrumented pilot.

**What we owe them:** A founder-led qualification call within the week, a written pilot scope within two weeks of qualification, and an instrumented baseline measurement before we instrument the workflow.

---

### 3.5 Investor / advisor

**Entry signal:** "I am tracking the category. I want to talk to the founder. I want to see the work, not the deck."

**Surfaces (in order):**
1. Homepage → category and traction
2. "Where do you start?" → "Investor" → `/investor`
3. `/investor-relations`, `/investors-overview-v2`, `/investors-moat`, `/investors-architecture`, `/investors-roadmap`, `/investors-trust`
4. `/founder` and `/leadership` for founder context
5. `/insights` for the founder's public thinking
6. `/investors-data-room` (gated) for diligence
7. CTA: founder conversation

**Disqualifying signals:** They are looking for an early-AI-application bet with low capital intensity and no governance burden.
**Qualifying signals:** They are looking for category-creation moats, governed-execution thesis investors, or strategic infra investors. They engage on the moat surface (`investors-moat.md`, `moat-definition.md`).

**What we owe them:** A founder conversation, full data-room access on intent, and consistent message architecture across founder calls and the public site.

## 4. Cross-persona principles

1. **Every persona ends in a founder conversation.** There is no automated funnel. This is intentional and is part of the moat.
2. **No persona is asked to register before they get content.** Trust, architecture, docs, case studies, and the design-partner story are all open. The data room is the only gated surface.
3. **Persona surfaces share a common substrate.** The category statement, the 9-step loop, and the platform hierarchy appear on every persona's first surface. Personas diverge after that.
4. **The Design Partner page is the convergence point.** Three of the five personas (executive, technical evaluator, security reviewer) frequently route through Design Partner before purchase. That page therefore carries persona shortcuts back out, so a reviewer who landed there for the wrong reason can re-route without bouncing.

## 5. What this document does not cover

- Internal operator surfaces (`/forge`, `/continuum/*`) — those serve a different audience (active customers and design partners, not prospects)
- Pricing path — see `packaging-model.md` and `founder-pricing-notes.md`
- Post-pilot expansion path — see `pilot-to-case-study-system.md` and `referenceability-model.md`
- Specific buyer-objection handling — see `buyer-close-system.md` and `enterprise-close-pack.md`

## 6. Maintenance

When a new public page is added, it must declare:

1. **Which persona(s) it serves.**
2. **What step of that persona's journey it sits at.**
3. **What the next surface is.** (No dead-end pages.)
4. **What CTA it routes to.** (Demo, Design Partner, Investor, Trust, Docs.)

If a page cannot answer these four questions, it does not belong on the public surface yet.
