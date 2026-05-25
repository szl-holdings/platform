# Warhacker Problems — Exhaustive Gap Map for a11oy.UDS

**Author:** SZL Holdings (founder draft) · **Date:** 2026-05-25
**Companion to:** `10_andrew_yes_reply.md`, `05_proof_plan.md`, `OPTION_A_STATUS_2026-05-25.md`
**Reading order:** §0 (zoom-out thesis) → §1 (the 5 known examples + what's missing) → §2 (wider gap inventory) → §3 (3 problems we lead with at Warhacker) → §4 (open questions for the on-site team)

---

## §0 · Zoom-out: what these problems are really about

The five problem statements published in the Warhacker materials (fragmented satellite ground software, deployment health screening, AI oversight for autonomous drones, lightweight trajectory/orbit viz, AI at the tactical edge) look like five different problems. **They are five symptoms of one problem.**

> **The DoD has no portable, cryptographically-verifiable chain of custody connecting policy → ROE → AI model behavior → kinetic or operational action — across air-gapped, multi-classification, multi-vendor environments.**

Concretely, every one of the following is true today and is publicly sourced:

| Failure mode | Evidence (May 2026) |
|---|---|
| AI-assisted strike killed a civilian (Abdul-Rahman al-Rawi, 20yo student, Iraq, Feb 2024). US military accepted responsibility, sent condolence payment. No public artifact of which model, which threshold, which human signed off. | Airwars / The Independent joint investigation, Feb 2024. |
| DoD Directive 3000.09 (re-issued Jan 2023) requires "appropriate levels of human judgment" but provides **no machine-readable specification** of what that means, no required audit format, and no test-and-evaluation regime that operators can actually run before fielding. | DoDD 3000.09; CRS IF11150; "Autonomous Weapon Systems: No Human-in-the-Loop Required" (War on the Rocks). |
| Replicator is on track to field thousands of attritable autonomous systems by Aug 2025 / 2026, but Brookings and Responsible Statecraft have both flagged that the **oversight tooling is not keeping up with the platform tooling**. | CRS IF12611; Brookings "Replicator and beyond"; Inkstick deep dive. |
| GAO has repeatedly found that DoD lacks an enterprise approach to AI model risk management, workforce, and inventory — and that DHS-adjacent critical infrastructure guidance is still draft. | GAO-24-105645, GAO-24-105980, GAO-25-107435, GAO-25-107653. |
| Project Maven now fuses 179 data sources at CENTCOM and is used to "discern the nearest available weapon" — operators have publicly described **decision cycles compressed past the point where a human can meaningfully audit**. | TechPolicy.Press; Project Maven Wikipedia (current rev); Airwars. |
| ABMS / JADC2 cross-domain ATO remains the throat-point: cATO (continuous authority to operate) is talked about but rarely achieved across services because **artifact lineage doesn't survive air-gap traversal**. | Air & Space Forces Magazine "Operationalizing ABMS-JADC2"; JADC2 LibGuide. |

**The thesis a11oy.UDS makes credible:** *Governance is a deliverable, not a meeting.* You ship the policy chain alongside the model and the platform, as a Zarf bundle, signed end-to-end, replayable in an air-gapped cluster, and queryable from the field. The reason this is uniquely buildable by us (and not by the prime that built the targeting system) is that we own the **decision-fabric layer between the policy authors and the runtime operators** — that is what a11oy.UDS *is*.

---

## §1 · The 5 published Warhacker problems — what's actually missing, what a11oy.UDS gives them

For each of the five problems the user surfaced, this section names (a) the **gap inside the gap**, (b) the **a11oy.UDS capability** that closes it, and (c) the **existing proof-point** we already have on the shelf for Andrew (so we are not promising vapor).

### 1.1 Fragmented satellite ground software
- **Stated gap.** Multiple orgs run bespoke air-gapped ground software, redundant work, inconsistent delivery.
- **Real gap.** No one owns the *policy and capability manifest* that says "this ground station may ingest this telemetry, fuse it with this catalog, and emit this artifact to this downstream consumer." Every integration is bespoke because every governance contract is bespoke.
- **a11oy.UDS capability.** UDS bundles ship as Zarf packages; a11oy adds a **portable Decision Fabric manifest** that declares which sensors, models, and downstream sinks are allowed for each tenant. The manifest is signed, versioned, and travels with the bundle into the air-gap.
- **Proof we already have.** GHCR-published `a11oy-uds` Zarf bundle (issue #5293, payload #5319), deny-path latency harness showing policy decisions in <5 ms on t3.medium (#5288, #5290).

### 1.2 Military deployment health screening
- **Stated gap.** Medical readiness data scattered across paper, spreadsheets, legacy systems; commanders blind.
- **Real gap.** **PII + PHI + readiness classification.** You cannot just stand up a Power BI dashboard — every datum is governed by HIPAA, the Privacy Act, and operational classification rules that change by deployment. The reason it stays on paper is that no platform makes "who is allowed to see this row, under which authority, in which network" a *runtime* decision.
- **a11oy.UDS capability.** Row-level Decision Fabric policies (the same engine that governs AI model access) applied to health-record reads. Every read produces a tamper-evident audit signal; every form submission is a signed attestation. Mobile-optimized because the bundle ships its own auth + offline cache.
- **Proof we already have.** ROSIE governed decision fabric (artifact `rosie`), ROSIE mobile (artifact `rosie-mobile`), Helios live signal store, NVD CVE scanner + AI-relevance filter (just landed #4957).

### 1.3 AI oversight for autonomous drones (loss-of-link)
- **Stated gap.** When a drone loses contact, no way to confirm its AI is still within authorized parameters.
- **Real gap.** Two layered failures: (a) the model's *operating envelope* is not formally specified anywhere the drone can re-check it; (b) there is no **tamper-evident on-board log** that survives recovery (or capture, or loss) intact enough to be used in an investigation or a courts-martial. DoDD 3000.09 talks about "human judgment" without saying what the box needs to record. This is the bullseye on the al-Rawi case.
- **a11oy.UDS capability.** Two pieces.
  1. **Lean-checked operating envelope.** The drone ships with 4 Lean-proven invariants (we already have this — 4 Helios formulas, issue #5317) plus a runtime predicate that says "if telemetry leaves this envelope, downgrade autonomy to RTB-only."
  2. **Tamper-evident black-box log** signed with a forward-secure key, mirrored to the bundle's audit channel on every reconnect. The signing key is provisioned by the same Zarf bundle that ships the model, so chain-of-custody is end-to-end.
- **Proof we already have.** 4 Helios Lean proofs published (#5317); risk-formula-drift gate is green every commit; deny-path latency harness (#5290) demonstrates <5 ms decision under load.

### 1.4 Lightweight trajectory / orbit visualization
- **Stated gap.** Instantly contextualize trajectory data without waiting for custom integrations.
- **Real gap.** The viz isn't hard; the **integration contract** is hard. Today every new orbit feed requires a new ATO conversation because the consumer can't prove what it will do with the data, and the producer can't prove what the data is allowed for.
- **a11oy.UDS capability.** Trajectory data ingested through a typed, signed Decision Fabric edge — the bundle ships both the viewer and the contract. Viewer is a thin React surface (same pattern as `conduit`, `sentra`, `vessels`); contract is a signed manifest.
- **Proof we already have.** Vessels (maritime intelligence) already does this for AIS feeds — same pattern, different domain.

### 1.5 AI at the tactical edge
- **Stated gap.** Run AI directly on mission systems where capability is needed.
- **Real gap.** Three: (a) **model provenance** (which weights, trained on what, by whom, signed by whom — almost nobody can answer this in writing); (b) **cATO across air-gap traversal** (the model gets re-baselined every time it crosses a network boundary because lineage isn't carried with it); (c) **t3.medium-class hardware reality** (most edge boxes are NOT H100s; you need decisions in single-digit ms, not seconds).
- **a11oy.UDS capability.** AI BoM (model card + SBOM + weights hash + training-data manifest) bundled into the Zarf package, with the **same signature chain** as the policy and the platform. Deny-path latency budget enforced at runtime — if the inference + decision can't complete in budget, the decision fails closed, not open.
- **Proof we already have.** Interim t3.medium evidence (#5288); deny-path latency harness on the same class of hardware (#5290).

---

## §2 · Wider gap inventory — problems Warhacker has NOT yet published that a11oy.UDS fits

Organized by where the gap lives in the kill-chain / deploy-chain. Each row is intended to be pitchable verbatim at Warhacker as a problem statement we can pick up.

### A. AI / Autonomy oversight

| # | Problem statement (one sentence) | What a11oy.UDS uniquely brings |
|---|---|---|
| A1 | **Loss-of-link autonomy envelope enforcement.** When a Group 2 ISR drone loses link, prove on recovery that its autonomous behavior stayed inside the operator-signed envelope, and downgrade autonomy in real time when it doesn't. | Lean-checked envelope + forward-secure on-board black box, both shipped in the same signed Zarf bundle as the model. |
| A2 | **AI-assisted strike audit reconstruction.** Given a kinetic event, reconstruct in <60 minutes which model version + which input frame + which human approval + which ROE clause led to the decision. | Decision Fabric records every (input, model, policy, approver) tuple as a signed event; replay tooling reconstructs the chain from any single tuple. |
| A3 | **Meaningful Human Control attestation.** Convert DoDD 3000.09's "appropriate level of human judgment" from prose into a machine-checkable predicate that the system refuses to operate without. | a11oy is fundamentally a runtime policy engine; this is the canonical use case. |
| A4 | **Counter-UAS friendly-fire attribution.** Before engaging an unidentified UAS in civilian airspace, prove cryptographically that it is NOT on the friendly-IFF list and NOT a Blue UAS-registered platform within the last N seconds. | Signed friendly registry shipped + refreshed via the Zarf bundle; runtime check enforced by the Decision Fabric. |
| A5 | **Loitering munition recall window.** Switchblade/Phoenix Ghost-class munitions have a short human-recall window; today the recall decision happens over voice. Build a signed digital recall channel with a tamper-evident record. | Same audit + signature primitives as A1; recall command is itself a signed Decision Fabric event. |

### B. Tactical-edge deployment

| # | Problem statement | a11oy.UDS contribution |
|---|---|---|
| B1 | **Model provenance manifest at the edge.** Every model running on a tactical box can answer "what weights, what data, signed by whom, valid until when" from local disk, offline. | AI BoM shipped inside the Zarf bundle alongside the policy and the runtime. |
| B2 | **Air-gap traversal without cATO re-baselining.** Carry the cATO artifact set across an air-gap boundary so the receiving network can verify lineage without restarting the ATO process. | Zarf bundle is the artifact set; a11oy adds the policy-side lineage; receiver verifies signatures locally. |
| B3 | **Sub-10ms deny-path on edge hardware.** Decisions must complete fast enough that the AI cannot route around them. | Already measured on t3.medium (#5288, #5290); we lead with this number. |
| B4 | **Disconnected operation with eventual reconciliation.** Edge node makes locally-final decisions during disconnect, then reconciles audit + policy state on reconnect without contradiction. | This is the conduit pattern (`artifacts/conduit`) generalized. |

### C. Cross-domain / JADC2

| # | Problem statement | a11oy.UDS contribution |
|---|---|---|
| C1 | **Cross-classification artifact lineage.** A model trained on Unclassified data and approved at Secret retains a verifiable provenance chain across both networks. | Signed manifest survives the air-gap; receiver verifies with its own root of trust. |
| C2 | **Service-to-service policy contracts (Army Convergence ↔ Navy Overmatch ↔ AF ABMS).** Each service publishes a signed contract describing what it will accept and what it will emit. | a11oy's Decision Fabric *is* a contract registry — same primitive used in `rosie`. |
| C3 | **Coalition partner data-sharing with revocation.** Share a model or a dataset with a partner today, revoke tomorrow, prove revocation took effect. | Forward-secure signature chain; revocation is a signed event; runtime refuses revoked artifacts. |

### D. Civilian harm mitigation (the headline)

| # | Problem statement | a11oy.UDS contribution |
|---|---|---|
| D1 | **Pre-strike civilian-presence override.** Before any AI-recommended target nomination crosses the human threshold, the policy engine must confirm civilian-presence sensors disagree at <X confidence; if they don't, the recommendation is held. | This is a Decision Fabric policy. Already pattern-matched in the Helios formula set. |
| D2 | **Condolence + accountability dossier auto-assembly.** When civilian harm is suspected, the system assembles the full reconstructed decision chain (A2 above) into a packet ready for a CIVHARM cell — without operator intervention, without selective deletion. | Replay tooling + audit channel; signed packet handed off as an immutable bundle. |
| D3 | **Public-facing harm registry feed.** Continuously publish a redacted, signed feed of every assessed civilian-harm event in a format Airwars / Brown Costs of War can ingest. Closes the public-trust gap. | Bundle ships a signed feed endpoint; redaction policy is itself a Decision Fabric rule. |

### E. Supply chain / provenance

| # | Problem statement | a11oy.UDS contribution |
|---|---|---|
| E1 | **AI-SBOM for every model in the inventory.** Replace today's spreadsheet inventory with a machine-readable, signed, queryable inventory across all services. | Aligns to CISA's AI-SBOM minimum elements + DoD SBOM guidance; we ship the per-bundle artifact today. |
| E2 | **Blue UAS provenance attestation in the field.** A unit in the field can verify, offline, that a UAS in hand is on the Blue list as of date D and has not been recalled. | Signed registry refreshed via Zarf bundle; offline verification by the same a11oy primitives. |
| E3 | **Training-data lineage for export-controlled datasets.** Prove a model was not trained on data the unit isn't cleared to consume. | Manifest carries dataset hashes + classification labels; runtime enforces match against operator clearance. |

### F. Audit / accountability

| # | Problem statement | a11oy.UDS contribution |
|---|---|---|
| F1 | **GAO-grade AI inventory across DoD.** Single queryable inventory of every AI system in use, its risk tier, its last evaluation, its owner — closes the gap GAO has flagged 4 times since 2023. | a11oy's signal store + Decision Fabric is the inventory. Plug in once per bundle. |
| F2 | **CDAO RAI Toolkit operationalization.** Today the RAI toolkit is documents; convert it into a runtime gate that AI bundles must pass before deploy. | Convert each RAI checklist item into a Lean predicate or a runtime check; ship as a UDS Core capability. |
| F3 | **Continuous evaluation post-deploy (model drift + policy drift).** Detect when a model's behavior or a policy's effective coverage has drifted and flag for re-attestation. | Already prototyped — risk-formula-drift gate (`pnpm run check:risk-formula-drift`) is the in-house version of this. |

### G. Civil-military overlap (Warhacker likes these because they're deployable beyond DoD)

| # | Problem statement | a11oy.UDS contribution |
|---|---|---|
| G1 | **FEMA / disaster-response cross-agency decision fabric** — same air-gap, same multi-tenant, same chain-of-custody requirements as a forward operating base. | Same bundle, different policy pack. |
| G2 | **VA medical-records portability with patient-side audit.** Veteran can see, offline, every decision an AI made about their care. | Same primitives as 1.2 (deployment health screening) with patient-side viewer. |
| G3 | **NORTHCOM / NORAD cross-border civilian-airspace deconfliction.** Same problem as A4 but with bi-national governance. | Decision Fabric with two roots of trust. |

---

## §3 · The 3 problems we lead with at Warhacker

We do not pitch 23 things. We pitch three, and the on-site team picks one. Recommended order:

1. **A1 + A2 + D2 together as one problem: "Make the al-Rawi case impossible."** The most emotionally honest framing of what a11oy.UDS exists for. Demo path:
   - Zarf-bundle a synthetic ISR pipeline onto the reference UDS cluster.
   - Inject a frame that crosses the civilian-presence threshold.
   - Show the decision fail closed, the audit packet auto-assemble, and the redacted public feed publish — all in one continuous run.
   - This is *exactly* the proof Andrew said yes to, just framed for the audience.
2. **B1 + B2: "AI BoM that survives the air-gap."** A direct hit on what every prime currently fakes. Demo path:
   - Sign a model on the internet side, push to GHCR, pull through Zarf, deploy on an air-gapped kind cluster, query its AI BoM from the offline side.
3. **F3: "Continuous evaluation that catches drift."** A direct hit on GAO findings the DoD has been getting beaten up over for two years running. Demo path:
   - Run `pnpm run check:risk-formula-drift` against a bundle that has drifted; show the gate fail; show the re-attestation flow.

Each of the three maps to proof we already have on the shelf — no vaporware in the deck.

---

## §4 · Questions for the Defense Unicorns on-site team

Folded in to ask #3 of `10_andrew_yes_reply.md`. Listed here so the conversation has a clean agenda.

1. **Which of these problems already has an internal sponsor at DU?** We do not want to step on a teammate's problem; we want to show up where we add unique value.
2. **What is the actual hardware floor for "tactical edge" in your reference architecture?** We have proof on t3.medium-class boxes; we want to confirm whether that's the relevant target or if there's a smaller floor.
3. **Is the Mission App you'd most like a governed example for already in `uds-core`, or do you have a candidate workload in mind that isn't public yet?** This is exactly the ask we put to Andrew — repeating it here so the on-site team can give us the right name on day one.
4. **For the AI BoM work — are you aligning to CISA's AI-SBOM minimum elements, or to an internal DU specification?** We will conform to whichever is canonical for you; just need to know which.
5. **Warhacker problem-submission window.** Lyndsi is handling logistics; we will submit the three problems in §3 as candidate problem statements unless DU prefers we attend as builders against existing problems.

---

## Appendix A · Sources used to build this memo

All public; pulled 2026-05-25. Listed here so any claim above can be re-verified.

- Defense Unicorns Warhacker landing page — https://defenseunicorns.com/warhacker/
- Stanford Hacking for Defense 2025 problem statements — stanfordh4d.substack.com
- Airwars + The Independent, "First civilian confirmed killed in an AI-assisted strike?" (Abdul-Rahman al-Rawi) — https://airwars.org/the-first-civilian-confirmed-killed-in-an-ai-assisted-strike/
- Costs of War (Brown / Watson) — https://costsofwar.watson.brown.edu/
- DoDD 3000.09 (Autonomy in Weapon Systems, Jan 2023) — https://www.esd.whs.mil/portals/54/documents/dd/issuances/dodd/300009p.pdf
- CRS IF11150 "Defense Primer: U.S. Policy on Lethal Autonomous Weapon Systems"
- CRS IF12611 "DoD Replicator Initiative: Background and Issues for Congress"
- War on the Rocks — "Autonomous Weapon Systems: No Human-in-the-Loop Required, and Other Myths Dispelled"
- Brookings — "Replicator and beyond: The future of drone warfare"
- TechPolicy.Press — "Project Maven and the Age of AI Warfare"
- CDAO Responsible AI Toolkit — https://www.ai.mil/Latest/Blog/Article-Display/Article/3940314/responsible-ai-toolkit/
- GAO-24-105645, GAO-24-105980, GAO-25-107435, GAO-25-107653
- Air & Space Forces Magazine — "Operationalizing ABMS-JADC2"
- DIU Blue UAS — https://www.diu.mil/latest/dius-blue-uas-list-to-transition-to-dcma
- CISA AI-SBOM Minimum Elements — https://www.cisa.gov/resources-tools/resources/software-bill-materials-ai-minimum-elements
- HRW 2025 — "A Hazard to Human Rights: Autonomous Weapons Systems and Digital Decision-Making"
- Springer Minds & Machines (2020) — "Accountability and Control Over Autonomous Weapon Systems: A Framework for Comprehensive Human Oversight"

## Appendix B · Internal proof references

- GHCR-published `a11oy-uds` Zarf bundles — issue #5293
- `a11oy-uds` installable payload — issue #5319
- 4 Helios Lean proofs — issue #5317
- Deny-path latency harness — issue #5290
- Interim t3.medium evidence — issue #5288
- NVD CVE scanner + AI-relevance filter — issue #4957 (just landed)
- ROSIE governed decision fabric — `artifacts/rosie`, `artifacts/rosie-mobile`
- `pnpm run check:risk-formula-drift` — green every commit
