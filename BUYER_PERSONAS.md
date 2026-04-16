# Buyer Personas — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Sales, marketing, founder, product
**Companion docs:** [GO_TO_MARKET_MOTION.md](GO_TO_MARKET_MOTION.md) · [SALES_NARRATIVE.md](SALES_NARRATIVE.md) · [OBJECTION_HANDLING.md](OBJECTION_HANDLING.md)

---

## How to Read This Document

Every commercial conversation involves three buyer roles, sometimes embodied in one person, sometimes in three:

1. **The Operator Champion** — the user who lives the workflow today
2. **The Executive Sponsor** — the person who controls budget and reputation
3. **The Technical Buyer** — the person who answers "is this safe to deploy"

We never sell to one without addressing the other two. A successful close requires all three to nod.

---

## Persona 1: The Operator Champion

### Who they are

| Trait | Profile |
|-------|---------|
| Role | Head of SOC, head of fleet, head of distressed deals, managing partner, head of matter management |
| Title examples | Director of Security Ops · VP Maritime Ops · Head of Distressed Acquisitions · General Counsel · Chief of Staff |
| Years in role | 4–10 years |
| Reports to | C-suite or 1 layer below |
| Manages | A team of 4–30 specialists |

### What they care about

- **Their team's daily reality** — they are accountable for what happens
- **Audit defensibility** — they have explained "what did we do and why" to a regulator, a board, a court
- **Operator productivity** — they have lived through tools that promised productivity and produced friction
- **Career risk on adoption** — picking the wrong tool reflects on them
- **Speed of decisions** — slow decisions cost them deals, incidents, opportunities

### What they do not care about (in the first conversation)

- Vendor financial backing
- Architecture diagrams
- Pricing details
- Compliance certifications

### What they ask

- "What does my Monday morning look like with this?"
- "What happens when the AI is wrong?"
- "Can my team reject the recommendation?"
- "How long does onboarding take?"
- "Does this work on mobile?"

### How we close them

- **Operator demo** that walks one decision through the loop
- **Mobile demo** with their own scenario
- **Free 30-min consultation** with their team to scope a PoV around one decision type
- **Reference call** with a comparable operator champion

### Disqualifiers

- "I'd need to evaluate 3 vendors" — they want a procurement exercise; route to standard sales motion later
- "Send me a deck and I'll get back to you" — without follow-up engagement, deprioritize
- "Our IT team is the buyer" — re-route to Technical Buyer persona

---

## Persona 2: The Executive Sponsor

### Who they are

| Trait | Profile |
|-------|---------|
| Role | CEO, COO, CFO, Chief Risk Officer |
| Company size | 50–500 people (mid-market); 500–5,000 (Enterprise) |
| Industry | Regulated — security, maritime, real estate (distressed/institutional), legal |
| Years as exec | 3–15 years |
| Reports to | Board / owner / next-level CEO |

### What they care about

- **Strategic narrative** — can they explain to their board what changed
- **Risk reduction** — fewer surprises, faster audit closure, cleaner regulator response
- **Revenue or margin impact** — does this make decisions faster or better
- **Reputational positioning** — being on the right side of "AI governance" matters in their industry
- **Capital efficiency** — they want value before they want features

### What they do not care about

- Tool features
- API specifications
- UI polish (beyond a basic threshold)
- Integration count

### What they ask

- "What is this category?"
- "Who else uses it?"
- "What does it cost?"
- "What's the time to value?"
- "How does this change the way we operate in 3 years?"

### How we close them

- **Executive demo** with the 9-step loop and one cross-domain example
- **Reference conversation** with a peer
- **One-page commercial proposal** with edition + pack scope and total fee
- **Strategic narrative** they can repeat to their board verbatim

### Disqualifiers

- "Send me to my CFO" — sponsor is not engaged; loop back to operator champion to escalate
- "I need to see this in a quadrant" — not category-ready; nurture with content
- "We need to see SOC 2" — book an Enterprise track + diligence path; do not bluff

---

## Persona 3: The Technical Buyer

### Who they are

| Trait | Profile |
|-------|---------|
| Role | CISO, head of platform engineering, head of compliance, security architect |
| Title examples | Chief Information Security Officer · VP Platform · Head of Cloud Engineering · Director of Compliance |
| Years in role | 5–15 years |
| Reports to | CEO, CTO, or COO |
| Manages | Architecture and platform decisions across the org |

### What they care about

- **Tenant isolation** — can another tenant ever see our data
- **Identity and access** — how does authentication work; what about SSO; what about MFA
- **Audit and immutability** — can we get audit data out; is it tamper-evident
- **AI governance** — what model is used; can we BYO model; how is data handled
- **Secrets and key management** — how are credentials stored
- **Incident response** — what happens when something breaks
- **Roadmap honesty** — what is real, what is roadmap, what is missing
- **Disaster recovery** — backup, restore, region failover

### What they do not care about

- Sales narrative
- Marketing positioning
- Operator workflow nuances
- Pricing (until later)

### What they ask

- "Walk me through your tenant isolation."
- "What's your IAM model?"
- "Show me an audit export."
- "What's your AI governance posture?"
- "What's your DR runbook?"
- "What's your known-gaps list?"
- "When will SOC 2 be done?"
- "What happens if a `super_admin` goes rogue?"

### How we close them

- **Technical demo** that walks the architecture, the proof chain, the audit export
- **Diligence packet** ([TECHNICAL_DILIGENCE_PACKET.md](TECHNICAL_DILIGENCE_PACKET.md))
- **Trust Center** ([TRUST_CENTER_INDEX.md](TRUST_CENTER_INDEX.md))
- **Known Gaps** document — yes, we send it
- **Architecture diagram + access control matrix** ([ARCHITECTURE.md](ARCHITECTURE.md), [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md))

### Disqualifiers

- "We need on-prem only" — Sovereign tier roadmap (FY27); set expectations
- "We need full SOC 2 / FedRAMP today" — not us in 2026; nurture with roadmap
- "Send me the SOC 2 report" (when we don't have one) — be honest; many will respect the answer

---

## Cross-Persona Dynamics

| Combination | Pattern |
|-------------|---------|
| Operator alone | Possible at very small orgs; almost always loops in others |
| Executive alone | Rare; usually hands to operator or technical |
| Technical alone | Rare; almost always loops in executive for budget |
| Operator + Executive | Common in mid-market; technical brought in late |
| Operator + Executive + Technical | Standard at Enterprise |
| Operator + Technical | Common when CISO is also the operator champion |

We always confirm who is in each role on the first call. Misnaming the persona costs cycles.

---

## Industry Specifics

### Security Operations (Aegis primary)

| Persona | Common title | What's different |
|---------|--------------|------------------|
| Operator | Director of SOC | Cares about MTTR, alert fatigue, analyst burnout |
| Executive | CISO or COO | Cares about board reporting, regulator readiness |
| Technical | Security architect | Cares deeply about tenant isolation and audit |

### Maritime Ops (Vessels primary)

| Persona | Common title | What's different |
|---------|--------------|------------------|
| Operator | VP Maritime Ops or Fleet Manager | Cares about sanctions exposure, port turn-around |
| Executive | COO or CFO | Cares about regulatory exposure, charter economics |
| Technical | Often outsourced; one IT lead | Less involved early; surfaces at MSA stage |

### Distressed Real Estate (Terra primary)

| Persona | Common title | What's different |
|---------|--------------|------------------|
| Operator | Head of Acquisitions | Cares about deal velocity and ownership-graph quality |
| Executive | Founder / Managing Partner | Often the same person as operator |
| Technical | Sometimes none; small firms | Surfaces only if cyber insurance asks |

### Legal / Matter Management (PRISM Counsel primary)

| Persona | Common title | What's different |
|---------|--------------|------------------|
| Operator | General Counsel or Managing Partner | Cares about matter intake load and audit trails |
| Executive | Managing Partner / CEO | Cares about case-load and recovery economics |
| Technical | Outside firm or one IT person | Limited involvement until MSA review |

### Professional Services (Carlota Jo primary)

| Persona | Common title | What's different |
|---------|--------------|------------------|
| Operator | Founder / Principal Advisor | Same as executive |
| Executive | Same as operator | — |
| Technical | Outsourced | Minimal |

---

## What Each Persona Receives Post-Demo

| Persona | Artifact |
|---------|----------|
| Operator | Operator playbook excerpt for their domain + recording |
| Executive | One-page positioning + recording + reference offer |
| Technical | Diligence packet + Trust Center URL + Known Gaps + recording |

---

## Related Documents

| Document | Path |
|----------|------|
| Go-to-market motion | [GO_TO_MARKET_MOTION.md](GO_TO_MARKET_MOTION.md) |
| Sales narrative | [SALES_NARRATIVE.md](SALES_NARRATIVE.md) |
| Objection handling | [OBJECTION_HANDLING.md](OBJECTION_HANDLING.md) |
| Demo strategy | [DEMO_STRATEGY.md](DEMO_STRATEGY.md) |
| Executive demo | [EXECUTIVE_DEMO.md](EXECUTIVE_DEMO.md) |
| Operator demo | [OPERATOR_DEMO.md](OPERATOR_DEMO.md) |
| Technical demo | [TECHNICAL_DEMO.md](TECHNICAL_DEMO.md) |
| Technical diligence packet | [TECHNICAL_DILIGENCE_PACKET.md](TECHNICAL_DILIGENCE_PACKET.md) |
| Trust Center index | [TRUST_CENTER_INDEX.md](TRUST_CENTER_INDEX.md) |
