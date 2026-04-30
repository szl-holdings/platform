# Page Priorities — SZL Holdings Public Site

**Purpose:** Prioritization framework for development, QA, and content investment  
**Last updated:** April 2026

---

## Priority tier 1 — Core conversion pages

These pages form the primary enterprise buyer journey and must be benchmark-grade at all times.

| Page | Route | Primary job | Current status |
|------|-------|-------------|---------------|
| Homepage | `/` | Platform positioning, audience routing, CTA architecture | Upgraded (Phase 6) |
| Platform overview | `/platform` | Company → platform → product hierarchy | Functional |
| Trust Center | `/trust` | Security and governance diligence | Functional |
| Request a Demo | `/demo` | Primary conversion action | Functional |
| Design Partners | `/design-partner` | Design partner pipeline | Functional |
| Contact | `/contact` | Enterprise inquiry routing | Functional |

---

## Priority tier 2 — Domain pack pages

Each domain pack page is an enterprise buyer entry point for its specific domain. Must clearly explain: what the domain problem is, how the platform solves it, and what the governed workflow looks like.

| Page | Route | Domain | Current status |
|------|-------|--------|---------------|
| Domain packs overview | `/solutions` | All | Functional |
| Aegis | `/solutions/aegis` | Security & defense | Functional |
| Vessels | `/solutions/vessels` | Maritime | Functional |
| Terra | `/solutions/terra` | Real estate | Functional |
| Carlota Jo | `/carlota-jo/` | Advisory | Functional |

---

## Priority tier 3 — Trust sub-pages

Security and compliance reviewers will deep-dive these pages. Must be accurate, non-aspirational, and technically precise.

| Page | Route | Audience |
|------|-------|---------|
| Security | `/trust/security` | Security reviewer |
| AI Governance | `/trust/ai` | Technical evaluator, compliance |
| Governance / Audit | `/trust/governance` | Compliance, legal |
| Architecture | `/trust/architecture` | Technical evaluator |
| Approvals framework | `/trust/approvals` | Risk, compliance |
| Operations | `/trust/operations` | IT, procurement |

---

## Priority tier 4 — Platform detail pages

| Page | Route | Audience |
|------|-------|---------|
| Lyte | `/lyte` | Operator, executive buyer |
| Alloy | `/alloy-fabric` | Technical evaluator, executive buyer |
| Architecture | `/architecture` | Technical evaluator |
| How it works | `/how-it-works` | Executive buyer |
| Proof Chain docs | `/docs/proof-chain` | Technical, compliance |

---

## Priority tier 5 — Company and resources

| Page | Route | Audience |
|------|-------|---------|
| About | `/company` | All |
| Founder | `/founder` | Investor, design partner |
| Operating Doctrine | `/operating-doctrine` | Design partner, investor |
| Investor Relations | `/investor` | Investor |
| Insights | `/insights` | All |
| Pricing | `/pricing` | All |
| FAQ | `/faq` | All |

---

## Priority tier 6 — Legal and compliance

| Page | Route | Priority |
|------|-------|---------|
| Privacy Policy | `/legal/privacy` | Must exist, accurate |
| Terms of Service | `/legal/terms` | Must exist, accurate |
| Accessibility | `/accessibility` | Must exist |
| System Status | `/status` | Must exist |

---

## Page quality standards by tier

### Tier 1 (conversion pages)
- Benchmark-grade typography and spacing
- All CTA links tested and functional
- Mobile-responsive at all common breakpoints (375px, 768px, 1280px)
- SEO title and description match SEO_MAP.md exactly
- OG image present and correct
- Accessibility: ARIA labels, skip nav, focus-visible
- No vague AI marketing claims

### Tier 2 (domain pack pages)
- Clear domain problem statement at top
- Capability list accurate to current build
- CTA to demo or design partner program
- Trust link surfaced
- Mobile-responsive

### Tier 3 (trust pages)
- Technically accurate — verified against trust-center.md
- No unclaimed certifications
- SOC 2 status clearly noted as "targeted post-funding"
- Consistent with BRAND_GUIDELINES.md trust copy rules

### Tier 4–6 (supporting pages)
- Functional and non-broken
- Consistent navigation and footer
- No 404s or broken links

---

## Known gaps (as of Phase 6)

- OG images: `og/` directory is referenced but images not yet generated — use placeholder until Phase 7
- Sitemap.xml: referenced in robots.txt but not yet auto-generated — create static sitemap or add build step
- `/pricing` page: copy needs audit against current commercial packaging
- Domain pack pages (Aegis, Vessels, Terra, Counsel): would benefit from Phase 7 use-case lane expansion
