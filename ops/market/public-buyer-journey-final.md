# Public Buyer Journey — Final

**Last updated:** April 2026

---

## Journey Overview

The SZL Holdings buyer journey has five stages. Each stage has a distinct objective, primary questions the buyer is answering, and specific platform assets that serve those questions.

```
Understand → Trust → Request Demo → Diligence → Design Partner
```

The journey is designed to be largely self-serve through the first three stages. The founder enters as the primary contact at Demo Request and stays through Design Partner activation.

---

## Stage 1: Understand

**Buyer question:** What is this? Does it solve something I actually have?

**Where they land:**
- Homepage (/) — hero, category positioning, problem statement
- /platform — platform hierarchy, domain pack overview
- /architecture — technical architecture overview
- /lyte — operator command surface overview

**What they need to conclude:**
> This is a decision infrastructure layer, not another dashboard or AI chatbot. It solves the accountability gap I have in my operations.

**Platform assets:**
- Homepage hero and problem statement
- Category positioning copy (drawn from CATEGORY_POSITIONING.md)
- Platform hierarchy diagram (SZL → Lyte → Continuum → domain packs)
- Domain pack overview pages

**Friction points to eliminate:**
- Do not make them read technical documentation to understand what this is
- The first screen must articulate the problem, not the product features
- No jargon: "governed execution infrastructure" must be explained in one plain sentence alongside the term

---

## Stage 2: Trust

**Buyer question:** Is this real? Is this team credible? Are my data and operations safe with this?

**Where they land:**
- /company — founder, mission, company context
- /trust — security posture, AI governance, data handling
- /docs — architecture, API documentation
- GitHub repository — code maturity, release history, activity

**What they need to conclude:**
> This is a real platform with real engineering behind it. The founder is credible. My data would be handled responsibly. The AI outputs are governed, not black boxes.

**Platform assets:**
- Trust Center (/trust) — security controls, AI governance summary, data handling
- Company page — founder bio, platform mission, stage transparency
- Threat model summary (sanitized public version)
- GitHub release history — v0.1.0 release notes, commit cadence

**What to be honest about:**
- Pre-revenue stage — do not obscure this
- No SOC 2 yet — state timeline (Phase 3, post-funding)
- No paying customers yet — "design partner program is how first commercial relationships are structured"
- Functional alpha across all products — be specific about what "alpha" means

**What not to say:**
- "Enterprise-grade" without specifying which controls are in place
- "Trusted by X companies" if zero companies are using it commercially
- "Secure" without specifics (TLS 1.3, org-scoped tenant isolation, RBAC, Proof Chain — use these)

---

## Stage 3: Request Demo

**Buyer question:** Is it worth 45 minutes of my time to see this live?

**Where they land:**
- /demo — demo request form
- /contact — general contact

**What triggers this stage:**
- They have understood the category and seen enough to believe the fit might be real
- A specific domain pack resonated (Aegis for security buyers, Vessels for maritime, etc.)
- A referral or warm introduction bypassed stages 1–2

**Demo request form should capture:**
- Name, title, organization
- Domain of primary interest (Aegis, Vessels, Terra, Counsel, Carlota Jo, General)
- Primary problem they are trying to solve (short answer)
- Current stage: exploring / active evaluation / have budget / ready to pilot

**Conversion actions:**
- Form submission → immediate confirmation email with demo prep notes
- Founder reviews same day and schedules within 48 hours
- No SDR gatekeeping at this stage — direct founder calendar

---

## Stage 4: Diligence

**Buyer question:** If I move forward, what am I getting into? Does this hold up under scrutiny?

**Who runs diligence:**
- Executive buyers: platform thesis, ROI model, trust posture, vendor risk
- Technical evaluators: API documentation, security architecture, data model, integration patterns
- Security reviewers: penetration test status, secret management, encryption, RBAC
- Procurement / legal: data processing agreements, terms, privacy policy

**Diligence paths by persona (see `diligence-fast-path-final.md` for full routes):**

| Persona | Primary Questions | Primary Assets |
|---|---|---|
| Executive buyer | What does success look like? What is the commercial path? | Pilot playbook, packaging model, case study structure |
| Technical evaluator | How does it integrate? How is it secured? | API standards, authz matrix, OpenAPI spec |
| Security reviewer | What are the controls? Who manages secrets? | Threat model summary, secret inventory summary, encryption details |
| Procurement/legal | What are the terms? Who owns the data? | Privacy policy, DPA, terms of service |

**Self-serve diligence assets to have ready:**
- Trust Center pages (public-facing sanitized versions of ops/security docs)
- API documentation (/api/docs — Swagger UI)
- Architecture overview (public-facing)
- Data handling and retention summary
- Incident response overview

---

## Stage 5: Design Partner

**Buyer question:** Should we commit to a structured pilot? What are the terms?

**Entry criteria:**
- Domain fit confirmed (their operations map to at least one domain pack)
- Executive sponsor identified
- Technical POC identified
- Pilot window agreed (60–90 days standard)
- Success metrics defined before kickoff

**Design partner offer summary:**
- Early access to full platform including unreleased capabilities
- Direct founder input into roadmap based on partner priorities
- Preferred commercial terms locked at design partner pricing
- Co-authorship credit on case study (if they agree to be referenceable)

**What happens after design partner:**
- 30-day kickoff → 60-day pilot → 30-day review
- Success metrics reviewed at 90-day mark
- Conversion to full commercial agreement or structured exit with written feedback

*Full design partner operating model: `design-partner-operating-model.md`*

---

## Journey Anti-Patterns to Avoid

1. **Asking for budget too early.** Stage 1–2 buyers are not budget conversations. Let them understand and trust first.
2. **Requiring registration to see the platform.** Demo access should be available post-request, not pre-request.
3. **Overstating readiness.** If a feature is in alpha, say so. Buyers who discover this in diligence lose trust in everything else.
4. **Multiple conflicting CTAs.** Each page should have one primary CTA appropriate to the buyer's likely stage.
5. **Hiding the pricing model completely.** Buyers who can't get a sense of commercial range won't advance to demo.

---

## CTA Hierarchy by Page

| Page | Primary CTA | Secondary CTA |
|---|---|---|
| Homepage | Request a demo | Explore the platform |
| Platform | Explore [domain pack] | Request a demo |
| Domain pack pages | Request a demo | View documentation |
| Trust Center | Contact security team | Request a demo |
| Company | Request a demo | — |
| /docs | Request API access | Contact |

---

*See also: `buyer-evaluation-map.md` (persona-specific evaluation paths), `diligence-fast-path-final.md` (diligence asset routing)*
