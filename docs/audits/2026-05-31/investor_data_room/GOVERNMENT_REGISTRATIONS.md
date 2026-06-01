# Government Registrations — Status & Action Plan

**SZL Holdings · 2026-06-01 · prepared by Yachay**
**Why this exists:** without these registrations and certifications, **SZL cannot legally invoice or contract with the U.S. Government.** A Series-A defense-AI company is uninvestable without a credible plan here. Honesty: **none of these are in place today** — this is the gap and the plan.

---

## 1. Status snapshot (all NOT STARTED unless noted)

| Registration | What it is | Status | Owner | Lead time |
|---|---|---|---|---|
| **SAM.gov registration** | Mandatory to receive any federal contract/grant; issues the Unique Entity ID (UEI) | ❌ NOT STARTED | Founder + counsel | 2–4 weeks (after UEI) |
| **UEI (Unique Entity ID)** | Replaced DUNS; assigned in SAM.gov | ❌ NOT STARTED | Founder | days–weeks |
| **DUNS** | Legacy identifier — **superseded by UEI (April 2022)**; do not pursue separately | N/A (obsolete) | — | — |
| **CAGE code** | Commercial And Government Entity code; auto-assigned during SAM.gov registration | ❌ NOT STARTED (comes with SAM) | via SAM | with SAM |
| **NAICS codes** | Industry classification on the SAM profile | ❌ NOT SET | Founder | with SAM |
| **ITAR / DDTC registration** | State Dept Directorate of Defense Trade Controls registration for defense articles/services | ❌ NOT STARTED — assess applicability first | Counsel | 4–8 weeks |
| **NDAA Section 848** | Beneficial-ownership / foreign-influence disclosure pre-positioning | ❌ NOT STARTED | Counsel | with contracting |
| **CMMC self-assessment** | Cybersecurity Maturity Model Certification (Level 1 self-assess now; L2/L3 later) | ❌ NOT STARTED | Yachay + counsel | self-assess weeks; L3 = program |
| **FedRAMP** | Cloud authorization for `.gov` SaaS | ❌ NOT STARTED — UDS Core / GovCloud path | program | 12–18+ months |
| **SOC 2 Type II** | Commercial trust baseline | ❌ NOT STARTED | program | 6–12 months |

## 2. Recommended NAICS codes (set in SAM.gov)

| NAICS | Description | Why |
|---|---|---|
| **541511** | Custom Computer Programming Services | Core software |
| **541512** | Computer Systems Design Services | Systems integration |
| **541715** | R&D in Physical/Engineering/Life Sciences | Formal-methods / proof R&D |
| **541330** | Engineering Services | Defense engineering |
| **518210** | Computing Infrastructure / Data Processing | Hosted governance substrate |

## 3. ITAR applicability (assess before registering)

Killinchu is **oversight-only software** (it does not control or fire effectors) and processes drone-detection/decision data. Whether the *software* is ITAR-controlled (USML Category XI/XV) vs EAR-controlled depends on its technical data and end-use. **Action: obtain a commodity-jurisdiction / classification opinion from ITAR counsel before any `.gov`/allied engagement.** Do not self-certify.

## 4. Sequenced action plan (next 90 days)

1. **Week 1–2:** Register in SAM.gov → obtain UEI; CAGE code auto-issues; set NAICS. (Free; founder + counsel.)
2. **Week 2–4:** ITAR/EAR jurisdiction opinion; register with DDTC only if controlled.
3. **Week 3–6:** CMMC Level 1 self-assessment; document the SSP (System Security Plan) and POA&M against the security-posture gaps already catalogued.
4. **Month 2–3:** Begin SOC 2 Type II readiness; scope FedRAMP via the UDS Core / AWS GovCloud path (inherit IL5 controls).
5. **Ongoing:** NDAA §848 beneficial-ownership disclosures prepared for any solicitation.

## 5. Dependency note

These registrations are **prerequisites** for converting the Warhacker/Cannonico wedge into a billable program of record. SAM.gov + CAGE + NAICS are fast and free and should be done **immediately** — there is no reason to wait for the round to close to register in SAM.gov.

---

*Signed — Yachay · 2026-06-01. Nothing registered yet — stated plainly. The plan is sequenced and mostly free to start. No bandaid.*
