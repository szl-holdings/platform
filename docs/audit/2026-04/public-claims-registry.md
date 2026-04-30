# SZL Holdings — Public Claims Registry
**Audit date:** April 18, 2026  
**Scope:** All numbers, product names, capability claims, and taglines appearing on public-facing surfaces (sites, READMEs, pitch deck, marketing copy, footer)  
**Truth values:** `verified` = traceable to live data | `demo-data` = seed/fixture value, clearly labeled | `unverified` = hardcoded, no live source | `aspirational` = future-state claim, not current | `inaccurate` = contradicted by code

---

## 1. Quantitative Claims

| Claim | Surface | File | Truth value | Notes |
|---|---|---|---|---|
| "52,000+ vessels monitored" | szl-holdings dashboard | `src/data/ventures.ts` | **unverified** | AIS not subscribed; positions simulated |
| "2.4M+ signals processed per day" | szl-holdings (Lyte) | `src/data/ventures.ts` | **unverified** | No live signal telemetry at this scale |
| "< 4 min average signal detection time" | szl-holdings (Lyte) | `src/data/ventures.ts` | **unverified** | No live monitoring to verify |
| "31,200+ simulations executed" | szl-holdings, szl-demo-video | `video_scenes/Scene2.tsx` | **unverified** | Hardcoded; not derived from simulation DB |
| "200+ MITRE ATT&CK techniques covered" | szl-holdings, aegis, szl-demo-video | `Scene2.tsx`, `digital-twin.tsx` | **demo-data** | MITRE ATT&CK v14 feed is real; count is aspirational |
| "34 days before formal designation" (dark vessel) | szl-holdings | `src/data/ventures.ts` | **unverified** | Demo scenario data; no live dark fleet tracking |
| "$15.4B addressable market for maritime" | aegis pitch deck | `slides/S11Market.tsx` | **aspirational** | Market sizing estimate; source not cited in slide |
| "$4.2B+ assets under analysis in Terra" | szl-demo-video, carlota-jo | `Scene2.tsx`, `case-studies.json` | **demo-data** | Seed portfolio data; correctly labeled as demo in video context |
| "$50.1B market for governed decision infrastructure by 2030" | aegis pitch deck | `slides/S11Market.tsx` or similar | **aspirational** | Projection; source not cited |
| "98% client retention" | carlota-jo | `PremiumHome.tsx`, `AdvisoryIntel.tsx`, `pulse.tsx` | **unverified** | Hardcoded; no CRM data source |
| "18 years of private advisory experience" | carlota-jo | `PremiumHome.tsx` | **unverified** | Static string; not linked to founder year |
| "99.98% uptime" (Aegis service status) | command marketing | `pages/marketing/status.tsx` | **inaccurate** | Hardcoded in static data file; no real uptime monitor |
| "98% auto-resolved" (self-heal) | command | `operations/pages/pulse.tsx` | **demo-data** | Fixture value in seeded Command ops data |
| "12 auth endpoints" / "18 vessels endpoints" / "24 alloy endpoints" | szl-holdings (Dev docs) | `RestApiSection.tsx` | **demo-data** | Illustrative API browser counts; approximate |
| "$50K–$500K/year enterprise pricing" | aegis pitch deck | `slides/S07SeriesDomains.tsx` or similar | **aspirational** | Pricing model, no signed contracts |
| "6 months deprecation notice" | szl-holdings (Dev docs) | `VersioningSection.tsx` | **aspirational** | Commitment stated in docs; not contractually enforced yet |
| "£2,200/day lead advisor rate" | carlota-jo | `data/operationalData.ts` | **demo-data** | Internal Consulting OS fixture; not public-facing |
| "£120,000 M&A advisory engagement" | carlota-jo | `data/operationalData.ts` | **demo-data** | Internal Consulting OS fixture; not public-facing |
| "£84,000 growth strategy Phase 2 engagement" | carlota-jo | `data/operationalData.ts` | **demo-data** | Internal Consulting OS fixture; not public-facing |
| "$2.4M exposure prevented" (containment) | command | `operations/lib/demo-mode.tsx` | **demo-data** | Demo scenario; clearly in demo seed |
| "$12.4M–$8.6M commit reclassification" | command | `operations/lib/business-data.ts` | **demo-data** | Demo scenario; Consulting OS fixture |
| "71ms response time" (Aegis status page) | command | `pages/marketing/status.tsx` | **inaccurate** | Hardcoded in static data file |

---

## 2. Product Names and Taxonomy

| Name | Status | Notes |
|---|---|---|
| **Lyte** | Active — platform core | Business observability surface; PRISM framework |
| **Alloy** | Active — platform core | Execution fabric; workflow orchestration |
| **CORTEX** | Active — mobile | iOS/Android command app (`szl-holdings-mobile`); `cortex-mobile` is concept-only |
| **Aegis** | Active — domain pack | Defense/security intelligence; also investor pitch deck artifact |
| **Terra** | Active — domain pack | Real estate intelligence |
| **Vessels** | Active — domain pack | Maritime intelligence |
| **Carlota Jo** | Active — domain pack | Private advisory |
| **Pulse** | Active — domain pack | AI executive briefing |
| **Command** | Active — platform surface | Unified operational command (Lyte + Imperium merged) |
| **Firestorm** | **Archived** — still referenced in api-server route family `/api/firestorm/` | Backend still live; UI archived |
| **Counsel** | **Archived** — deregistered | Backend data retained; referenced in api-server |
| **Imperium** | **Archived** — merged into Command | Do not use in marketing |
| **NEXUS** | Internal prototype | `mockup-sandbox`; not a customer-facing product |
| **ATLAS** | Active — internal | Spatial engine runtime; referenced across terra/vessels/aegis |
| **Nuro Mesh** | Active — internal | Multi-agent collective for Pulse briefings |
| **Sentinel** | Active — agent name | Security domain agent |
| **Helmsman** | Active — agent name | Maritime domain agent |
| **Compass** | Active — agent name | Navigation/advisory agent |
| **Navigator** | Active — agent name | Planning agent |
| **Covenant Policy** | Active — principle + implementation | Human-in-the-loop enforcement primitive |

---

## 3. Taglines and Capability Claims

| Claim | Surface | File | Truth value | Notes |
|---|---|---|---|---|
| "Governed decision infrastructure — connecting what is observable to what is executable, with full attribution." | README.md, szl-holdings | Various | **verified** | Accurately describes the platform's architectural intent |
| "AI cannot execute consequential actions without human confirmation" | README.md, trust section | `README.md` | **verified** — Covenant Policy is real | Architecture enforces this via policy-engine |
| "All recommendations include source citations, confidence scores, and retrieval provenance" | README.md | `README.md` | **verified** — for Pulse; **aspirational** — not confirmed for all recommendation surfaces |
| "Every action generates an immutable audit event via Proof Chain" | README.md | `README.md` | **verified** — proof-chain lib is real; **stub** — not all routes write proof events |
| "All queries scoped by org identifier; cross-org access returns 404" | README.md | `README.md` | **verified** — tenant scope is real |
| "Six practice areas. One uncompromising standard." | carlota-jo | `PremiumHome.tsx` | **demo-data** — six areas are defined; "uncompromising standard" is marketing copy |
| "Where life's complexity finds quiet clarity." | carlota-jo | `PremiumHome.tsx` | **aspirational** — tagline |
| "Detect. Decide. Defend." | aegis (implied) | Various | **aspirational** — tagline |

---

## 4. Drift Map (claims vs. code reality)

| Surface | Claim count | Verified | Demo-data | Unverified | Inaccurate | Aspirational |
|---|---|---|---|---|---|---|
| szl-holdings | 8 | 3 | 1 | 4 | 0 | 0 |
| carlota-jo | 6 | 0 | 3 | 2 | 0 | 1 |
| aegis pitch deck | 4 | 0 | 0 | 0 | 0 | 4 |
| command marketing | 3 | 0 | 1 | 0 | 2 | 0 |
| szl-demo-video | 3 | 0 | 2 | 1 | 0 | 0 |
| README.md | 5 | 3 | 0 | 0 | 0 | 2 |
| **Total** | **29** | **6 (21%)** | **7 (24%)** | **7 (24%)** | **2 (7%)** | **7 (24%)** |

**Key finding:** Only 21% of tracked public claims are verified against live data. 31% are unverified or inaccurate. This is the primary credibility risk for investor and enterprise sales motions.

---

*See `mock-and-gap-report.md` for remediation priorities.*
