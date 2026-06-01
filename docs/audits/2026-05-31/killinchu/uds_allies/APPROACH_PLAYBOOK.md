# APPROACH_PLAYBOOK.md — the one-page playbook

> Credit → Partner → Sell → Introduce. Concrete next 3 actions with named contacts. — *Yachay*

---

## The map at a glance

| Move | Who | Why |
|---|---|---|
| **Credit publicly** | **Defense Unicorns** (UDS/Zarf/Pepr), **Chainguard**, **Anchore**, **Sigstore** | We build *alongside* and *atop* them; full ally credit, never re-badging. |
| **Partner (governance)** | **CNCF** (in-toto, Istio, Flux, Falco), **OpenSSF** (SLSA, Sigstore) | Standards bodies; contributing upstream = legitimacy + neutrality. |
| **Sell to** | **USAF software factories** (Kessel Run / Space CAMP lineage), **DIU Replicator** (ACT swarm), **SOFWERX** (CPO 64 K8s edge, CPO 79 UAV payloads), **STRIKEWERX** (C-sUAS + RemoteID), **Navy Overmatch** (autonomous USVs) | Already-fielded autonomy/airgap surfaces that need attestation. |
| **Introduced by** | **Andrew Greene → Rob Slaughter (CEO) + Jeff McCoy (CTO)** | Greene is a **named co-founder of Defense Unicorns** — warm, internal intro. |

Sources: see UDS_CORE_BAKERS.md, UDS_ALLIES_ECOSYSTEM.md, DOD_DRONE_UDS_OPPORTUNITY.md (all primary-cited).

## The core insight that makes this cheap

Our backer **Andrew Greene is a co-founder of Defense Unicorns** ([Bain Capital release](https://www.baincapital.com/news/defense-unicorns-raises-136-million-series-b-build-software-backbone-department-war); [DU company timeline](https://defenseunicorns.com/company/)). The "bakers of UDS" the founder asked us to find **include our own backer**. The introduction path is not cold outreach — it is one co-founder vouching to the CEO/CTO of the same company. This collapses the normal 6-month BD cycle.

## The product wedge (one sentence)

A **drone/autonomy supply-chain attestation layer** — Zarf-delivered, Pepr-enforced, Sigstore-signed, in-toto/SLSA-conformant, Khipu-DAG-receipted — that lets mass-autonomy programs (Replicator ACT, SOCOM UAS, Navy USVs) prove every fielded software payload's provenance, even under EW/airgap conditions UDS already operates in.

## Concrete next 3 actions (named contacts)

### Action 1 — Greene makes the intro (this week)
- **Ask Andrew Greene** to introduce SZL/Killinchu to **Rob Slaughter (CEO, [LinkedIn](https://www.linkedin.com/in/robertcslaughter))** and **Jeff McCoy (CTO, [GitHub jeff-mccoy](https://github.com/jeff-mccoy))**.
- **Frame:** "American-made attestation layer that makes UDS fully operational for mass-autonomy supply-chain trust." Lead with the EW-attack drone-update proof point as shared language.

### Action 2 — Land a low-risk upstream PR (next 2 weeks)
- **Open `pepr` #2511** (`--registry-info` input validation) to establish credibility with Pepr lead **Case Wylie (`cmwylie19`, [GitHub](https://github.com/cmwylie19))**, then engage **Micah Nagel (`mjnagel`, [GitHub](https://github.com/mjnagel))** on **`uds-core` #789** (signature/attestation admission policy).
- **Coordinate with Zarf lead Wayne Starr (`Racer159`, [GitHub](https://github.com/Racer159))** on **zarf #4794 / #4917** for Khipu-receipt reproducibility hooks.
- See UDS_PR_CONTRIBUTION_OPPORTUNITIES.md for the full sequence. **Do not push without human sign-off.**

### Action 3 — Position the government wedge (next 30 days)
- **Target DIU Replicator ACT** (swarm software) and **SOFWERX CPO 64** (portable K8s edge) as the first design-partner conversations — both publicly seek open-architecture, integration-friendly software for mass autonomy ([DIU Replicator software vendors](https://www.diu.mil/latest/defense-innovation-unit-announces-software-vendors-to-support-replicator); [SOFWERX Transitions](https://sofwerx.org/transitions)).
- **Contracting path:** ride Defense Unicorns' **GSA SBIR Phase III IDIQ** (sole-source for DoD/DHS/CISA) as a sub/teaming partner once the DU relationship is warm ([DU contracting](https://defenseunicorns.com/start-free/)).
- **Compliance gate before any pitch:** confirm SZL is **NDAA §889-clean** and FOCI-clear, and prepare the **SBOM + SLSA provenance + country-of-origin disclosure** per AMERICAN_MADE_SUPPLY_CHAIN.md — so "American-made" is defensible to DFARS 252.225 on first contact.

## Guardrails (no bandaid)
- **Always credit upstream.** We are building *with* the American defense-software ecosystem, not over it.
- **Never over-claim.** Only Kessel Run / Space CAMP / UDS Army / Navy SUBMEPP have direct public DU links; flag the rest as ecosystem-adjacent.
- **"American-made" = US-controlled supply chain + 889-clean + SBOM-disclosed**, not "zero foreign code."

---
*Compiled by Yachay — SZL Holdings. 2026-06-01.*
