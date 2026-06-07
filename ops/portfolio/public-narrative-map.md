# Public Narrative Map — SZL Holdings Platform

Generated: 2026-04-16
Authority: Phase 2-3 Product Topology & Portfolio Rationalization

---

## Purpose

This document maps every canonical surface to its primary audience, the story it tells, and the job it does in the overall platform narrative. It is the reference for investor presentations, PR, sales enablement, and content strategy.

---

## Platform Narrative Hierarchy

```
SZL Holdings (Corporate)
  └── "The governed intelligence platform for high-stakes operators"
        ├── Command Portal — "One command center. All domains. Real-time."
        ├── Aegis — "Defense and intelligence that thinks with you"
        ├── Vessels — "Fleet command with full economic and compliance visibility"
        ├── Terra — "NYC property intelligence that finds deals before they surface"
        ├── Carlota Jo — "Advisory amplified by platform-grade intelligence"
        └── CORTEX — "All your domains, one app, in your pocket"
```

---

## Surface-by-Surface Narrative Map

---

### 1. SZL Holdings (`szl-holdings`) — Public Web Flagship

| Dimension | Detail |
|-----------|--------|
| **Audience** | Series A investors · Enterprise evaluators · Strategic partners · Press |
| **Primary job** | Convert informed evaluation into a conversation |
| **Story it tells** | "SZL Holdings is the company that built the governed decision infrastructure layer. Here is the full platform, the trust posture, the team, and the investment case." |
| **Tone** | Authoritative · Sparse · Evidence-forward |
| **Key sections** | Product hierarchy · Trust center · Investor docs · Developer portal · Founder profile (`/founder`) |
| **Call to action** | Design partner inquiry · Investment conversation · Enterprise evaluation |
| **What it must never be** | A demo gallery. Every page must be either a real working surface or a clearly-framed vision page. Investors and enterprise evaluators lose confidence when they find a "coming soon" buried in what looked like a live product. |
| **Narrative risk** | Platform feels like too many products. Counteract with the platform layer story — every domain pack runs on the same governance backbone. This is a system, not a collection. |

---

### 2. Command (`command`) — Operator Command Surface

| Dimension | Detail |
|-----------|--------|
| **Audience** | Operations directors · Platform operators · Enterprise IT leads |
| **Primary job** | Be the daily working environment for operators running the platform |
| **Story it tells** | "Every signal. Every decision. Every approval. One surface." Governed decision-making at scale. |
| **Tone** | Functional · Dense · Trusted |
| **Key surfaces** | Signal timeline · Approval queues · Strategy workspace · Infrastructure control (`/command/infrastructure`) · Operations center |
| **Call to action** | "This is where operators live" — the surface that sells enterprise contracts through demonstrated capability during evaluation |
| **What it must never be** | A passive dashboard. The command surface exists to surface recommendations and move operators toward decisions. If a user lands here and feels like they are reading a report, the surface has failed. |
| **Narrative risk** | Confusion with `szl-holdings` (which has some command surfaces). Counteract: `command` is for operators of the platform. `szl-holdings` is for investors and evaluators of the company. |

---

### 3. Aegis (`aegis`) — Defense & Intelligence Domain Pack

| Dimension | Detail |
|-----------|--------|
| **Audience** | CISOs · SOC analysts · MSP operators · Compliance officers · Government evaluators |
| **Primary job** | Be the SOC command surface and defense intelligence hub |
| **Story it tells** | "Unified cybersecurity command. SOC + managed services + AI research in one platform, with full MITRE ATT&CK coverage and a SOAR playbook engine built on the same governance layer as every other SZL domain." |
| **Tone** | Technical · Precise · Mission-grade |
| **Key surfaces** | SOC command · MITRE ATT&CK map · SOAR playbooks · XDR console · Sentinel AI · Threat intelligence feeds |
| **Call to action** | Design partner entry for security verticals · MSP managed services contract |
| **Narrative risk** | `firestorm` path still exists and creates brand confusion. The canonical path is `/aegis/`. Once `firestorm` is redirected (301 → `/aegis/`), this risk resolves. |
| **FedRAMP note** | FedRAMP readiness is referenced in product documentation. Do not claim FedRAMP compliance without verified roadmap and third-party assessment. |

---

### 4. Vessels (`vessels`) — Maritime Intelligence Domain Pack

| Dimension | Detail |
|-----------|--------|
| **Audience** | Fleet executives · Maritime operations teams · Commercial directors · Trade compliance officers · Marine insurers |
| **Primary job** | Make fleet decisions faster, more accountable, and commercially optimized |
| **Story it tells** | "AIS telemetry, voyage economics, sanctions screening, and dark vessel detection — all in one command center with an immutable audit trail. Every commercial decision is traceable. Every compliance risk is visible before it becomes a liability." |
| **Tone** | High-stakes · Commercial · Evidence-driven |
| **Key surfaces** | Fleet tracking (AIS) · Voyage P&L · Dark vessel detection · Sanctions screening · Commodity trading · Freight rate benchmarking |
| **Call to action** | Design partner inquiry for maritime operators · Insurance and compliance buyer conversations |
| **Narrative risk** | AIS feed is currently demo/stub mode. This must be clearly disclosed during evaluation. Framing: "live architecture, data source integration in progress." Never claim live AIS tracking without confirmed data feed. |

---

### 5. Terra (`terra`) — Real Estate Intelligence Domain Pack

| Dimension | Detail |
|-----------|--------|
| **Audience** | NYC real estate brokers · Distressed property investors · Portfolio managers · Development teams |
| **Primary job** | Surface deal opportunities before they reach the open market |
| **Story it tells** | "NYC property intelligence that aggregates public distress signals — tax liens, lis pendens, violations, foreclosures — into a deal pipeline. Ownership structure mapped. Broker workflow integrated. Every deal tracked with an audit trail." |
| **Tone** | Commercial · Advantage-oriented · Local market deep |
| **Key surfaces** | NYC distress pipeline · Ownership entity graph · Deal pipeline · MLS ingestion · Broker workflow · Tax lien tracking |
| **Call to action** | Design partner entry for NYC real estate professionals |
| **Narrative risk** | "Live data pipeline" claim needs verification. Confirm which data sources are live vs. demo before any external communication. |

---

### 6. Carlota Jo (`carlota-jo`) — Premium Advisory Domain Pack

| Dimension | Detail |
|-----------|--------|
| **Audience** | UHNW individuals · Founders · C-suite executives · Family offices |
| **Primary job** | Deliver premium advisory services through a private, secure client portal |
| **Story it tells** | "Advisory grounded in platform intelligence, not intuition alone. Client management, service catalog, secure document delivery, and booking — with the same governance backbone that underpins every SZL platform." |
| **Tone** | Luxury · Discreet · Elevated |
| **Key surfaces** | Client portal · Service catalog · Booking system · Document delivery · Messaging |
| **Call to action** | Discreet inquiry form → principal engagement |
| **Unique position** | Only SZL surface that is live and operational with real client-facing workflows. Most production-ready surface in the portfolio. Use as proof point during investor presentations. |
| **Narrative risk** | Tone mismatch with the technical platform narrative. Carlota Jo must maintain its luxury positioning — do not over-integrate it with the technical platform language that works for Aegis or Vessels. |

---

### 7. CORTEX Mobile (`cortex-mobile`) — Unified Mobile Command

| Dimension | Detail |
|-----------|--------|
| **Audience** | Platform operators · Domain pack users who need mobile access · Executive buyers who want a demo on a device |
| **Primary job** | Provide unified access to all 8 domains from a single native app |
| **Story it tells** | "Every workspace. One app. Command from anywhere. Biometric auth, offline capability, push notifications, and cross-domain signals — the full platform in your pocket." |
| **Tone** | Confident · Modern · Capable |
| **Key surfaces** | 8-domain workspace switcher · Cross-domain signal feed · Copilot · Biometric auth · Offline mode |
| **Call to action** | TestFlight invite during investor / design partner meetings (powerful in-person proof point) |
| **Narrative risk** | Not yet on TestFlight. Do not claim store availability before it is live. Frame as "alpha-ready, TestFlight distribution imminent." |

---

### 8. SZL Holdings Mobile (`szl-holdings-mobile`) — Holdings Companion (Secondary)

| Dimension | Detail |
|-----------|--------|
| **Audience** | Investors · Portfolio stakeholders following SZL Holdings specifically |
| **Primary job** | Holdings-specific companion for investors and stakeholders |
| **Story it tells** | "The SZL Holdings portfolio in your pocket" |
| **Status** | Deferred — ship after CORTEX reaches stable external TestFlight distribution |
| **Narrative risk** | Do not position publicly until CORTEX is live. Running both mobile apps simultaneously before CORTEX is established dilutes the mobile flagship narrative. |

---

### 9. Mockup Sandbox (`mockup-sandbox`) — Internal

| Dimension | Detail |
|-----------|--------|
| **Audience** | Internal design and development team only |
| **Primary job** | UI component prototyping and variant exploration |
| **Story it tells** | N/A — internal tool, never public-facing |
| **Instruction** | Never mention in public documents, investor materials, or press. Remove from any document that lists "active artifacts" for external audiences. |

---

## Deprecated Surfaces — Narrative Containment

These surfaces have DEPRECATED.md files and must not appear in any external narrative:

| Surface | Was | Now | Narrative |
|---------|-----|-----|-----------|
| `prism-counsel` | Legal matter command platform | Deprecated (task #579) | Content folded into platform roadmap. Do not reference as active. |
| `stephen-site` | Founder portfolio site | Deprecated (task #579) | Content migrated to `/founder` in `szl-holdings`. Do not reference as separate product. |
| `firestorm` | Defense entry point | 301 redirect → `/aegis/` | Never mention as separate product. Aegis is the canonical name. |
| `lyte-command-center` | Ops command | Merged → `/command/` | Lyte is a brand concept (PRISM framework) within `command`. Not a separate app. |
| `imperium` | Cloud infrastructure control | Merged → `/command/infrastructure` | IMPERIUM capability lives within `command`. Not a separate product in external narrative. |

---

## Investor Narrative Alignment

The public narrative map must align with one core thesis:

> SZL Holdings is not a portfolio of unrelated products. It is a compounding platform system — one governance backbone, one API, one design language — expressed across high-stakes domains where the cost of poor observability is quantifiable.

Every surface must reinforce this. The worst investor impression is landing on `szl-holdings` and then clicking through to five disconnected-looking tools. The antidote is consistent design language (`shared-ui`), consistent trust language (proof chain, audit trail, human-in-the-loop), and clear architectural diagrams that show how every surface connects.

---

## Related Files

- `ops/portfolio/portfolio-architecture.md` — Canonical topology and artifact classifications
- `ops/portfolio/domain-pack-strategy.md` — How domain packs relate to the platform
- `ops/portfolio/archive-plan.md` — Deprecation instructions
- `docs/PRODUCT_MATRIX.md` — Public product matrix (update to remove deprecated surfaces)
- `COMPANY_FACT_SHEET.md` — Quick-reference fact sheet (update artifact counts)
