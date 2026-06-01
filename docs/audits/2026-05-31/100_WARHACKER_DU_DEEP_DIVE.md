# 100 — WARHACKER 2026 + DEFENSE UNICORNS DEEP DIVE

**Classification:** SZL Internal — Founder Eyes
**Date:** 2026-05-31
**Author:** Research subagent (re-audit round 2)
**Event countdown:** Warhacker Day 0 = 16 June 2026, San Diego, CA (16 days out)

---

## EXECUTIVE ANSWER (read this first)

**The two problems SZL can fix that Warhacker has NOT thought of:**

1. **No one at Warhacker is building a *formally-verified, deterministic* decision gate — every "AI oversight" entry is a probabilistic monitor that cannot itself be trusted.** The Cannonico drone problem, the DoD's own April-2026 agentic-AI guidance, and the entire commercial guardrails industry all rely on classifiers and rule-filters whose "effectiveness is unquantifiable" and which "can be bypassed trivially" ([Shine Solutions, Mar 2026](https://shinesolutions.com/2026/03/27/moving-bedrock-solutions-to-production-with-defence-in-depth-beyond-standard-guardrails/)). SZL's wedge is a **machine-checked (Lean 4) governance gate** whose authorization decision is a kernel-verified theorem (`Λ_k` uniqueness + bounded-`Λ_k`, in `lutar-lean`), not a learned threshold. **The oversight layer is the one thing in the autonomy stack that must be provably correct, and nobody is making it provable.**

2. **Nobody is producing a tamper-evident, *summation-checked* "non-refutable Body of Evidence" that lets an Authorizing Official accept risk on an autonomous AI in minutes — exactly the unsolved problem a DU judge (Scott Thompson) posted in the Warhacker thread.** DU signs *images* (cosign, at admission) but produces **no signed receipt of what an AI actually decided at run time, and no cross-checked roll-up of those decisions**. SZL's DSSE-signed **Khipu Merkle DAG** receipt enforces a *sum-of-sums* invariant (Lean TH11 `khipuReceipt_checksum_invariant`): the root value must equal the summed pendant values or the receipt is mathematically invalid — turning an audit log into a self-verifying evidentiary artifact with dual-signer attestation. This is the "non-refutable Body of Evidence" the ATO problem demands, and it is structurally absent from the UDS platform.

**Can SZL fix ALL of Warhacker's problems? Honest verdict: NO — and it shouldn't try.**
Of the **5 publicly-confirmed accepted problem statements + 1 judge-posed challenge = 6 problems**, SZL fits as follows:

| Fit verdict | Count | Problems |
|---|---|---|
| **SZL FITS NATIVELY** | **2 of 6** | Cannonico (AI oversight for autonomous drones); Scott Thompson's "evaluate-in-minutes / non-refutable Body of Evidence" ATO challenge |
| **SZL PARTIAL** | **2 of 6** | Tychee (reusable airgap deployment stacks); Raven Tactical Computing (AI at the tactical edge) |
| **NOT SZL** | **2 of 6** | CyberRTS (orbit/trajectory visualization); HANGAR2APPS (deployment health screening) |

**Bottom line for the founder:** SZL fits *natively* on **2 of 6** and *contributes* on **2 more (4 of 6 total)**. Lead with the Cannonico drone-oversight problem — it is already on DU's accepted list, it is the single best public match for the a11oy governance gate, and it is reinforced by brand-new DoD policy. The ATO "Body of Evidence" challenge is the second pillar and is backed by your Khipu receipt structure. Do **not** pretend to solve the orbit-viz or medical-screening problems; that dilutes a sharp, defensible story.

---

## SECTION 1 — WARHACKER 2026 PROBLEM CATALOG (numbered, sourced)

Warhacker is Defense Unicorns' inaugural "build-package-deploy" hackathon, **16–19 June 2026, downtown San Diego**, free, ~400 curated attendees from government/industry/academia/non-profit. The mandate: *"You show up with a mission problem that matters. You leave with a working prototype"* — no slide decks, no vendor hall, no passive attendees ([Rob Slaughter, DU April 2026 newsletter](https://www.linkedin.com/pulse/april-2026-edition-defense-unicorns-jglge); [Warhacker page](https://defenseunicorns.com/warhacker/)). All solutions must be **packaged with UDS Core** and judged by *"a panel of elite judges … [who] pressure-test solutions, challenge assumptions, and highlight teams ready to deliver real impact"* ([DU LinkedIn, applications-open post](https://www.linkedin.com/posts/jarek-jermier_what-i-love-about-defense-unicorns-is-the-activity-7436774395483832321-tCR2)).

### 1.1 Publicly-confirmed accepted problem statements

| # | Organization | Problem statement (as published) | Source |
|---|---|---|---|
| **P1** | **Cannonico** | **AI oversight for autonomous drones.** *"When a drone loses contact mid-mission, it's running on its own with no human in the loop. The looming question: is the AI still operating within its authorized parameters, or has it gone off script?"* | [DU LinkedIn, 7 May 2026](https://www.linkedin.com/posts/defense-unicorns_at-warhacker-cannonico-is-solving-the-problem-activity-7458161888741425152-QCnS) |
| **P2** | **CyberRTS** | A **lightweight visualization and assessment layer** that can ingest any trajectory or orbit data and immediately put it in operational context, accelerating understanding on existing and new systems without waiting for a bespoke integration. | [DU LinkedIn, "Problems Accepted"](https://www.linkedin.com/posts/defense-unicorns_warhacker-problems-accepted-activity-7454892282723475456-KRLH) |
| **P3** | **Raven Tactical Computing LLC** | **AI at the tactical edge** — purpose-built infrastructure that lets your software actually run where the mission happens. | [DU LinkedIn, "Problems Accepted"](https://www.linkedin.com/posts/defense-unicorns_warhacker-problems-accepted-activity-7454892282723475456-KRLH) |
| **P4** | **Tychee Research Group** | **Fragmented satellite ground software (GSW)** — bespoke, air-gapped networks create redundant work and inconsistent delivery across organizations. Goal: *proven, reusable deployment stacks* that bring delivery tools, system services, data sources, and GSW applications together. | [DU LinkedIn, Tychee problem post](https://www.linkedin.com/posts/defense-unicorns_warhacker-is-getting-closer-and-were-activity-7457428931802120193-HZSg) |
| **P5** | **HANGAR2APPS** | **Military deployment health screening** — medical readiness data scattered across paper, spreadsheets, and legacy systems. Vision: a unified platform with automated workflows, real-time readiness dashboards, and mobile-optimized field screening to stop preventable medevacs. | [DU LinkedIn, HANGAR2APPS post](https://www.linkedin.com/posts/defense-unicorns_at-warhacker-this-june-hangar2apps-is-going-activity-7457791346238705664-zdX_) |

### 1.2 Judge-posed open challenge (from the Warhacker thread)

| # | Source / who | Problem (verbatim themes) | Source |
|---|---|---|---|
| **P6** | **Scott Thompson, CISSP/CSSLP** (commenting on DU's "Problems Accepted" post) | **Evaluate-in-minutes authorization.** *"How can we take what has been built, and evaluate it in minutes for an intended operating environment and generate the gaps for risk acceptance decisions."* The flow: ingest → analyze → generate report → import into the System of Record → iterate → issue authorization when "sufficiently secure." Critically: *"The expected format cannot just be 'plans,' but must be a non-refutable Body of Evidence."* | [DU LinkedIn, "Problems Accepted" comments](https://www.linkedin.com/posts/defense-unicorns_warhacker-problems-accepted-activity-7454892282723475456-KRLH) |

### 1.3 Standing open invitation (the "bring-your-own" slot)

DU explicitly invites additional problems: *"The critical workflow still living in a sketchy spreadsheet. The capable tool that can't get authorized. The prototype that never made it to prod. Bring it."* ([DU LinkedIn](https://www.linkedin.com/posts/defense-unicorns_warhacker-problems-accepted-activity-7454892282723475456-KRLH)). This is SZL's lane for entering its own governance-gate problem framing if a direct team match isn't secured.

> **Note on judging criteria:** DU has published **no formal scoring rubric**. The de-facto criteria, reconstructed from all DU content, are: (1) a **working MVP**, (2) **UDS-Core packaged** / ATO-ready posture, (3) **portable** (cloud→edge via Zarf), (4) solves a **real, sponsored problem**, (5) **deployable**, not a science project ([Warhacker page](https://defenseunicorns.com/warhacker/); [Slaughter newsletter](https://www.linkedin.com/pulse/april-2026-edition-defense-unicorns-jglge)).

---

## SECTION 2 — DEFENSE UNICORNS FULL OPERATIONS MAP

### 2.1 Company snapshot

| Field | Value | Source |
|---|---|---|
| Identity | "The Airgap Software Company" — secure software delivery for national-security mission systems | [defenseunicorns.com](https://defenseunicorns.com) |
| Founded / leadership | Veteran-founded; CEO **Rob Slaughter** (ex-Air Force, founded Platform One); HQ Colorado Springs | [DefenseScoop, Mar 2026](https://defensescoop.com/radio/how-defense-unicorns-is-tackling-software-modernization-for-the-defense-department/) |
| Funding | **$136M Series B**, Jan 2026, led by **Bain Capital Tech Opportunities**; **>$1B valuation** (unicorn status) | [Reuters, 13 Jan 2026](https://www.reuters.com/business/defense-unicorns-valued-1-billion-latest-funding-round-2026-01-13/); [DU press release](https://defenseunicorns.com/defense-unicorns-raises-136-million-series-b/) |
| Other investors | Ansa Capital, Sapphire Ventures, Valor Equity Partners, AVP, Uncorrelated Ventures, **David H. Petraeus** (ex-CIA Director) | [Intelligence Community News](https://intelligencecommunitynews.com/defense-unicorns-reaches-1b-valuation-in-series-b-round/) |
| Traction | ~300% YoY increase in adoption across military systems; "rapid and profitable growth" | [DefenseScoop, Mar 2026](https://defensescoop.com/radio/how-defense-unicorns-is-tackling-software-modernization-for-the-defense-department/) |

### 2.2 Product / platform stack

| Product | What it is | Scope |
|---|---|---|
| **UDS (Unicorn Delivery Service)** | Open-source, airgap-native software delivery platform; canonical path to get containerized software onto DoD systems cloud→classified edge. Lineage: built on Platform One's Big Bang. | Packaging, distribution, deployment, monitoring, sustainment |
| **UDS Core** | Security-hardened runtime baseline: Istio (mesh/mTLS), KeyCloak (IdP), AuthService, **Pepr** (policy engine/operator), NeuVector (runtime security), Prometheus/Grafana/Loki/Vector (observability), Velero (backup). | Secure-by-default runtime |
| **Zarf** | Declarative airgap packaging engine; OCI artifacts carrying all K8s deps; **auto-generates SBOM at build time**. | Supply-chain packaging |
| **Pepr** | TypeScript K8s middleware — mutating/validating webhooks + reconcile loops on the `UDSPackage` CRD; auto-generates network policy, SSO, authz, least-privilege RBAC. | Admission-time policy enforcement |
| **UDS CLI** | Bundle orchestrator (`uds create`/`uds deploy`); combines Zarf packages into a `uds-bundle.yaml`. | Bundle lifecycle |
| **UDS Registry** | OCI-compliant, airgap-native "app store" for mission software (launched Sept 2025); 200+ packages; partners incl. SAIC, BAE. *"Stores, verifies and distributes."* | Distribution/catalog |
| **UDS Identity** | Keycloak config image (`uds-identity-config`) powering identity & group-based access control. | IdAM |
| **LeapFrogAI** | DU's generative-AI / RAG platform — hosts, manages, and customizes generative AI modalities for national-security missions in airgapped environments. | GenAI hosting (the "AI product") |
| **Forward Deployed Engineering (FDE)** | Embedded engineers who build/deploy/adapt mission software in classified/airgapped environments; problem→capability in days/weeks. | Services |

### 2.3 Customers, deployments, partnerships

- **U.S. Air Force / F-22 Raptor** — In partnership with the **Air Force Sustainment Center Software Directorate**, UDS installed/upgraded software in the F-22 open-mission-system compute enclave **in minutes** (Edwards AFB, demonstrated Mar 2026). Slaughter: *"For decades, getting new software onto a fighter jet meant months … With UDS, the F-22 can receive software updates in minutes, on demand, at the edge."* ([DU F-22 press release](https://defenseunicorns.com/defense-unicorns-demonstrates-key-enabler-for-continuous-software-delivery-on-the-f-22/); [Air Force Technology](https://www.airforce-technology.com/news/defense-unicorn-f22-raptor/)).
- **"Several other DoW aircraft"** already demonstrating UDS efficacy (per F-22 release).
- **Registry partners:** SAIC, BAE Systems ([DefenseScoop registry article](https://defensescoop.com/2025/09/05/defense-unicorns-uds-registry-software/)).
- **Solutions framing:** Government (Software Factory, Compliance Automation, FDE) and Industry (**Army Authorization Fast-Track**, Portable DevSecOps) ([Warhacker/DU nav](https://defenseunicorns.com/warhacker/)).

### 2.4 Strategic thesis

DU's bet: the decisive military advantage is **delivery speed under constraint** — getting modern, containerized, compliant software into airgapped/edge/classified environments faster than the adversary can adapt. *"Future wars will be won by whoever can adapt fastest"* (Slaughter). UDS commoditizes the **delivery + authorization + runtime-security** layer; everything is open-source-anchored, portable, and "secure by default, ATO-ready out of the box."

### 2.5 Public pain points (from GitHub + DU's own framing)

| Signal | Evidence | Source |
|---|---|---|
| **Image-signature verification is still "research," not shipped** | Open issue: *"Research UDS Operator Pepr policy to validate image signatures"* — they want admission-time cosign verification but it isn't a built capability yet. | [uds-core #789](https://github.com/defenseunicorns/uds-core/issues/789) |
| **Non-exportable cryptography unresolved (esp. SSO)** | Open investigation issue, no comments → unsolved. | [uds-core #501](https://github.com/defenseunicorns/uds-core/issues/501) |
| **Egress/network-policy completeness gaps** | "Add netpols to istio components" (9 comments — relatively high engagement); "Global Egress Allow List + Anywhere Modes." | [uds-core #103](https://github.com/defenseunicorns/uds-core/issues/103), [#2193](https://github.com/defenseunicorns/uds-core/issues/2193) |
| **No run-time AI-decision attestation anywhere in the platform** | **Zero** open issues in uds-core for "attestation," "tamper," "provenance," or "receipt." The platform's verification surface ends at the *container image*, not the *decision*. | uds-core issue search (this audit) |

---

## SECTION 3 — GAP ANALYSIS: WHAT DEFENSE UNICORNS SOLVES vs. DOESN'T

| DU capability | What they DO solve | What they ALMOST solve (gap) | What they EXPLICITLY DON'T solve (scope boundary) | SZL plug point |
|---|---|---|---|---|
| **Software delivery (UDS/Zarf)** | Airgap packaging + deploy in minutes, cloud→edge; SBOM auto-gen | SBOM exists but **not pushed/attested to registry by default**; SLSA provenance not native | Run-time *behavioral* provenance (what the app did, not what it contains) | a11oy UDS package rides on top; adds decision-time receipts |
| **Supply-chain integrity (cosign/Registry)** | Signs and distributes images; registry "verifies" artifacts | Image-signature *admission enforcement* still "research" (#789) | **Verification of decisions, not just images.** No signed record of *what an AI decided at run time* | DSSE **Khipu Merkle DAG** receipt = decision-level attestation |
| **Policy enforcement (Pepr)** | Admission-time K8s policy: netpol, RBAC, SSO, mutating/validating webhooks | Policy is **static/admission-time**; DoD guidance warns "stale 'allow' decisions … evaluated only once at startup" | **Per-decision, run-time authorization** of an autonomous agent's actions | a11oy **Covenant Policy Engine** = per-action approval gate (the 46-gate ladder), evaluated every invocation |
| **Identity (KeyCloak/UDS Identity)** | Human/service SSO, OIDC, group RBAC | Service identity exists | **Per-agent cryptographic principal identity** with grant-chain expiry (DoD agentic-AI ask) | Agent Zero Trust runtime gate binds each agent action to a verified principal |
| **AI hosting (LeapFrogAI)** | Hosts/serves generative AI in airgap | Can serve a model | **Governing the model's autonomous behavior**, halt semantics, goal-drift detection, formally-verified bounds | a11oy/sentra/amaru = the governance layer *over* a served model |
| **Observability (Loki/Grafana/Vector)** | Log aggregation, dashboards, metrics | Logs exist | **Tamper-evident, summation-checked, dual-attested** logs that constitute legal evidence | Khipu receipt + dual-attestation = court-grade Body of Evidence |
| **Compliance Automation / ATO Fast-Track** | Accelerates control evidence + authorization paperwork | Speeds the *process* | **Auto-generating a "non-refutable Body of Evidence" in minutes** for an autonomous AI system (the P6 challenge) | Λ audit-closure operator + receipt DAG produces machine-checkable evidence bundle |

**Synthesis of the boundary:** Defense Unicorns owns the **delivery, runtime-security, and authorization-process** layer. Its entire trust surface terminates at the **container image and the admission decision**. It has **no native capability for run-time, decision-level, formally-verified AI governance**, and **no self-verifying evidentiary receipt structure**. Those two voids are precisely where SZL's wedge lives.

---

## SECTION 4 — TWO SZL-UNIQUE PROBLEMS (the headline)

### PROBLEM A — "The watchman who cannot be trusted": every AI-oversight solution at Warhacker is itself an *unverified probabilistic monitor*

**The gap, stated sharply.** The Cannonico problem (P1) and the DoD's own April-2026 guidance both demand a way to know whether an autonomous AI is "still operating within its authorized parameters or has gone off script" ([Cannonico/DU](https://www.linkedin.com/posts/defense-unicorns_at-warhacker-cannonico-is-solving-the-problem-activity-7458161888741425152-QCnS)). Every available answer — Bedrock-style guardrails, classifier monitors, rule filters — is itself a **learned, probabilistic, bypassable** component. Industry practitioners say it plainly: NLP/ML guardrails are *"not completely deterministic,"* their *"effectiveness is unquantifiable,"* and *"bypassing these measures can often be trivial"* ([Shine Solutions, Mar 2026](https://shinesolutions.com/2026/03/27/moving-bedrock-solutions-to-production-with-defence-in-depth-beyond-standard-guardrails/)). The DoD agentic-AI memo explicitly lists *"deceptive behavior … misrepresenting actions to avoid shut down or constraint"* and *agents' ability to bypass guardrails, monitors, and human-in-the-loop processes* as core risks ([DoW, Careful Adoption of Agentic AI Services, 30 Apr 2026](https://media.defense.gov/2026/Apr/30/2003922823/-1/-1/0/CAREFUL%20ADOPTION%20OF%20AGENTIC%20AI%20SERVICES_FINAL.PDF)). **If the watchman is itself a guessing machine, you have not solved oversight — you have added a second AI to the trust problem.**

**Why nobody at Warhacker has thought of this.** The accepted teams are building *better monitors* (Cannonico), *better infrastructure to run AI* (Raven), and *better data layers* (CyberRTS/Tychee). None is building a **provably-correct decision gate**. DU's platform stops at admission-time policy (Pepr) and image signing (cosign) — there is no decision-level, formally-verified authorization primitive anywhere in UDS Core (Section 2.5, Section 3).

**SZL's credible technical wedge.**
- The authorization decision is a **machine-checked theorem**, not a tuned threshold. SZL's `Λ_k` audit-closure operator has **Lean 4 + Mathlib kernel-verified proofs of uniqueness, Egyptian-exactness, and boundedness** in [`lutar-lean`](https://github.com/szl-holdings) (thesis v12, [Zenodo 10.5281/zenodo.20173920](https://doi.org/10.5281/zenodo.20173920)); `lake build` re-checks the kernel on every CI run.
- **Halt/deny semantics are deterministic and bounded** — the gate's `13-axis conjunctive AND` heart (yuyay_v3) fails *closed*: it satisfies the DoD ask to *"set system configurations to fail-safe by default"* and *"establish declarative safety contracts … that agents cannot override"* with a property that is *proven*, not hoped for.
- The **`drone_deny` demo** already maps to Cannonico's exact scenario: an autonomous agent attempts an action outside authorized parameters; the gate denies it; the denial is recorded in a signed receipt — and the *denial logic itself* is backed by a Lean theorem the judge can inspect.

**One-line pitch to a Warhacker judge:** *"Every other oversight tool here is an AI watching an AI. Ours is the only one whose 'allow/deny' is a kernel-verified mathematical proof — the watchman that can't itself go off script."*

---

### PROBLEM B — "Signatures on the box, nothing on the decision": there is no tamper-evident, *summation-checked* Body of Evidence for what an AI actually did

**The gap, stated sharply.** A Warhacker judge (Scott Thompson) posted the unsolved problem directly in the accepted-problems thread: evaluate a system *"in minutes for an intended operating environment,"* generate the gaps for risk-acceptance, and produce *"a non-refutable Body of Evidence"* — not "plans" ([DU thread comments](https://www.linkedin.com/posts/defense-unicorns_warhacker-problems-accepted-activity-7454892282723475456-KRLH)). The DoD memo reinforces it: agentic systems must *"produce comprehensive artefacts documenting the agent's actions and decision-making,"* with *"cryptographic integrity checks for task definitions and constraints,"* *"cryptographic attestation … that they are running expected and unmodified code,"* and **non-repudiation** — while warning that *"large and repetitive logs obscure meaningful signals"* and that you must *"quarantine requests to delete logs or audit records until reviewed by a human"* ([DoW agentic-AI memo](https://media.defense.gov/2026/Apr/30/2003922823/-1/-1/0/CAREFUL%20ADOPTION%20OF%20AGENTIC%20AI%20SERVICES_FINAL.PDF)). DU's platform signs the **container image** at admission (cosign, and even that is still "research" — [uds-core #789](https://github.com/defenseunicorns/uds-core/issues/789)). It produces **nothing** that attests to the *decisions made at run time*, and **no mechanism that cross-checks a roll-up of those decisions for internal consistency**. A pile of Loki logs is not a Body of Evidence — it's repetitive, unsigned, and individually deletable.

**Why nobody at Warhacker has thought of this.** The cATO / ATO world treats evidence as *documents and control checklists* ingested into a System of Record ([cATO Implementation Playbook, ATARC](https://atarc.org/wp-content/uploads/2025/04/atarc_cato-working-group_white-paper_continuous-authorization-to-operate-implementation-playbook.pdf); [DoD cATO memo](https://media.defense.gov/2022/Feb/03/2002932852/-1/-1/0/CONTINUOUS-AUTHORIZATION-TO-OPERATE.PDF)). No one is building the evidence as a **self-verifying cryptographic data structure** where tampering is *mathematically detectable*, not just *policy-prohibited*.

**SZL's credible technical wedge.**
- The **DSSE-signed Khipu Merkle DAG receipt** (`khipu-receipt.ts`) is a three-tier knotted-cord structure (decision → organ pendant → primary root) that enforces a **sum-of-sums invariant**: `rootValue` must equal Σ pendant values, each pendant must equal Σ its decision values, or the receipt is invalid *by construction*. This is the **Lean obligation TH11 `khipuReceipt_checksum_invariant`** in `lutar-lean/Lutar/Khipu/SummationInvariant.lean` (commit `1dca0003…`). Tampering with any single decision breaks the summation and is detectable without trusting any logging system.
- **Dual-attestation** is built into the root receipt (`DualAttestation`: two distinct signers, both required) — directly satisfying the DoD's non-repudiation and multi-party-consensus asks, and mirroring the IETF SCITT multi-receipt transparent-statement pattern (`draft-ietf-scitt-architecture-22`).
- The **Λ audit-closure operator** computes a closure ratio across the (layer × dimension) matrix and returns `auditClosed: true` only when every required pair is present — i.e., it *mechanically certifies the Body of Evidence is complete* before an AO sees it. Live result against HEAD: ρ = 1.000 (thesis v10, [Zenodo 10.5281/zenodo.20053163](https://doi.org/10.5281/zenodo.20053163)).
- The **`tamper_test` demo** already shows: take a signed receipt, flip one decision value, watch the summation invariant fail and the DAG reject it — the "non-refutable" claim made physical in under a minute.

**One-line pitch to a Warhacker judge:** *"UDS signs the box the software came in. We sign — and arithmetically lock — every decision the AI made inside it. Change one number and the math says it's been tampered with. That's the 'non-refutable Body of Evidence' your own thread asked for."*

---

## SECTION 5 — WARHACKER PROBLEM × SZL FIT MATRIX (per-problem verdict)

| # | Problem | Verdict | Why / what SZL contributes | What SZL does NOT provide |
|---|---|---|---|---|
| **P1** | **Cannonico — AI oversight for autonomous drones** | **✅ FITS NATIVELY** | a11oy governance gate = independent oversight that answers "in/out of authorized parameters" with a **formally-verified** allow/deny (`Λ_k` Lean proofs), fail-closed halt semantics, and signed denial receipts. `drone_deny` demo is a 1:1 match. Reinforced by [DoW agentic-AI guidance](https://media.defense.gov/2026/Apr/30/2003922823/-1/-1/0/CAREFUL%20ADOPTION%20OF%20AGENTIC%20AI%20SERVICES_FINAL.PDF). | SZL does not provide the drone autonomy/flight stack itself or the loss-of-link comms — it governs the AI's *decisions*, not the airframe. Best as a **teaming play with Cannonico**. |
| **P6** | **Scott Thompson — evaluate-in-minutes / non-refutable Body of Evidence (ATO)** | **✅ FITS NATIVELY** | Khipu Merkle DAG receipt (TH11 summation invariant) + dual attestation + Λ closure-completeness check = a self-verifying evidence bundle generated at run time. `tamper_test` demo proves non-refutability. | SZL doesn't replace the AO's System of Record or the human risk-acceptance decision — it produces the *evidence artifact* the SoR ingests. Integration to the SoR is glue work. |
| **P3** | **Raven Tactical Computing — AI at the tactical edge** | **🟡 PARTIAL** | SZL governance gate is lightweight (sub-ms Λ overhead, p99 ≤1.27ms — thesis v11, [Zenodo 20119582](https://doi.org/10.5281/zenodo.20119582)) and airgap-deployable as a UDS package → runs *where the mission happens*. Complements Raven's edge infra as the governance layer on top. | SZL is **not** the edge compute/runtime infrastructure itself (hardware, orchestration, resource mgmt). Raven owns that; SZL rides on it. |
| **P4** | **Tychee — reusable airgap deployment stacks (satellite GSW)** | **🟡 PARTIAL** | SZL's signed UDS bundle + DSSE receipts contribute a **reusable, verifiable governance + attestation module** that any GSW stack can adopt; supports the "consistent delivery" goal. amaru's hash-verified, append-only convergent sync also fits fragmented multi-source data. | SZL does not build the GSW applications, the satellite data pipelines, or the deployment-stack templating. Contribution is a bolt-on trust/attestation layer, not the stack. |
| **P2** | **CyberRTS — orbit/trajectory visualization & assessment layer** | **❌ NOT SZL** | Out of wedge. SZL has no orbital-mechanics ingest, trajectory modeling, or visualization capability. | Entire problem domain. Do not claim this. |
| **P5** | **HANGAR2APPS — military deployment health screening** | **❌ NOT SZL** | Out of wedge. A medical-readiness data/workflow/dashboard product. SZL's receipts could in principle attest to data handling, but that is a stretch, not a fit. | Entire problem domain. Do not claim this. |

**Tally:** **2 native + 2 partial + 2 out-of-scope = 4 of 6 touched, 2 of 6 owned.**

---

## SECTION 6 — STRATEGIC RECOMMENDATION (what to lead with for max impact)

1. **Lead with P1 (Cannonico drone oversight) as the headline demo.** It is the single best public match for a11oy, it's already an accepted problem, and it now has top-cover from brand-new DoD policy. **Pursue a teaming arrangement with Cannonico** — DU explicitly wants industry+government teams, "no passive attendees." Offer a11oy as the *formally-verified* oversight gate behind their monitor. This satisfies DU's "real sponsored problem" criterion.

2. **Make P6 (non-refutable Body of Evidence) the second pillar — and name the judge's words back to him.** Scott Thompson posed this in DU's own thread. Walking up with the `tamper_test` demo and saying *"you asked for a non-refutable Body of Evidence in the Warhacker thread — here it is, and the math, not a policy, is what makes it non-refutable"* is a high-credibility, judge-resonant move.

3. **Frame the differentiator as "provable vs. probabilistic."** Every other AI-oversight/guardrail story in the room is a classifier. SZL's is the only one whose allow/deny is a Lean-kernel theorem and whose evidence is summation-locked. That single contrast is the whole pitch. Lean into it.

4. **Be disciplined about scope.** Explicitly do **not** pitch CyberRTS or HANGAR2APPS. Claiming everything destroys the sharpness of "the only formally-verified governance layer." Honesty about the 2 out-of-scope problems *increases* credibility with technical judges.

5. **Package for the criteria you can't dodge:** UDS-Core bundle, cosign keyless signing, SBOM attached, airgap USB demo. (Tracked in prior `09_GAP_ANALYSIS_AND_PLAYBOOK.md` — Gaps 2–5 remain the critical path.) A brilliant wedge with no deployable UDS bundle scores zero at a "build-package-deploy" event.

6. **Tie every claim to a verifiable artifact on the day:** `Λ_k` Lean proof (`lake build` runs live), TH11 summation invariant (flip-a-value demo), and a dual-attested receipt the judge can verify offline with `cosign verify --offline`. The receipt is the deliverable; the loop is the product.

---

## SECTION 7 — SOURCES CITED

**Warhacker 2026**
- [Warhacker official page — Defense Unicorns](https://defenseunicorns.com/warhacker/)
- [DU April 2026 newsletter — Rob Slaughter (LinkedIn Pulse)](https://www.linkedin.com/pulse/april-2026-edition-defense-unicorns-jglge)
- [DU "Warhacker Problems Accepted" (CyberRTS, Raven) + Scott Thompson ATO comment](https://www.linkedin.com/posts/defense-unicorns_warhacker-problems-accepted-activity-7454892282723475456-KRLH)
- [DU — Cannonico AI oversight for autonomous drones](https://www.linkedin.com/posts/defense-unicorns_at-warhacker-cannonico-is-solving-the-problem-activity-7458161888741425152-QCnS)
- [DU — Tychee satellite ground software problem](https://www.linkedin.com/posts/defense-unicorns_warhacker-is-getting-closer-and-were-activity-7457428931802120193-HZSg)
- [DU — HANGAR2APPS deployment health screening](https://www.linkedin.com/posts/defense-unicorns_at-warhacker-this-june-hangar2apps-is-going-activity-7457791346238705664-zdX_)
- [DU — "Don't just talk about problems" (Jarek Jermier / applications open)](https://www.linkedin.com/posts/jarek-jermier_what-i-love-about-defense-unicorns-is-the-activity-7436774395483832321-tCR2)

**Defense Unicorns operations**
- [defenseunicorns.com — homepage](https://defenseunicorns.com)
- [Reuters — DU valued at $1B in Series B (13 Jan 2026)](https://www.reuters.com/business/defense-unicorns-valued-1-billion-latest-funding-round-2026-01-13/)
- [DU press release — $136M Series B](https://defenseunicorns.com/defense-unicorns-raises-136-million-series-b/)
- [Intelligence Community News — $1B valuation](https://intelligencecommunitynews.com/defense-unicorns-reaches-1b-valuation-in-series-b-round/)
- [DU — F-22 continuous software delivery demonstration](https://defenseunicorns.com/defense-unicorns-demonstrates-key-enabler-for-continuous-software-delivery-on-the-f-22/)
- [Air Force Technology — UDS rapid delivery to F-22](https://www.airforce-technology.com/news/defense-unicorn-f22-raptor/)
- [DefenseScoop — DU software modernization / 300% adoption](https://defensescoop.com/radio/how-defense-unicorns-is-tackling-software-modernization-for-the-defense-department/)
- [DefenseScoop — UDS Registry (SAIC, BAE partners)](https://defensescoop.com/2025/09/05/defense-unicorns-uds-registry-software/)
- [DU Forward Deployed Engineering](https://defenseunicorns.com/solutions/government/forward-deployed-engineering/)
- [UDS Identity & Authorization docs](https://docs.defenseunicorns.com/core/how-to-guides/identity--authorization/overview/)
- [defenseunicorns/uds-identity-config (GitHub)](https://github.com/defenseunicorns/uds-identity-config)
- [LeapFrogAI — DU generative AI for national security (LinkedIn)](https://www.linkedin.com/posts/defense-unicorns_ai-nationalsecurity-leapfrogai-activity-7163955070370349056-mOlC)
- GitHub open issues: [uds-core #789 (image signature verify)](https://github.com/defenseunicorns/uds-core/issues/789), [#501 (non-exportable crypto)](https://github.com/defenseunicorns/uds-core/issues/501), [#103 (netpols)](https://github.com/defenseunicorns/uds-core/issues/103), [#2193 (egress allow list)](https://github.com/defenseunicorns/uds-core/issues/2193)

**DoD / governance context**
- [DoW — Careful Adoption of Agentic AI Services (30 Apr 2026)](https://media.defense.gov/2026/Apr/30/2003922823/-1/-1/0/CAREFUL%20ADOPTION%20OF%20AGENTIC%20AI%20SERVICES_FINAL.PDF)
- [DoD — Continuous Authorization to Operate (cATO) memo](https://media.defense.gov/2022/Feb/03/2002932852/-1/-1/0/CONTINUOUS-AUTHORIZATION-TO-OPERATE.PDF)
- [ATARC — cATO Implementation Playbook (SBOM/AI-BOM into ATO)](https://atarc.org/wp-content/uploads/2025/04/atarc_cato-working-group_white-paper_continuous-authorization-to-operate-implementation-playbook.pdf)
- [FY2026 NDAA cyber/AI provisions (Sec. 1512 jailbreaks/data poisoning; 1521 ATO timelines; 1533 model oversight) — CRS](https://www.everycrsreport.com/files/2026-04-07_IF13197_32a62beab5e4cf659506d0e03272b98feeb1027a.pdf)
- [Lieber Institute, West Point — Legal Accountability for AI-Driven Autonomous Weapons (the "accountability gap")](https://lieber.westpoint.edu/legal-accountability-ai-driven-autonomous-weapons/)
- [Shine Solutions — beyond standard guardrails (probabilistic guardrails are bypassable/unquantifiable)](https://shinesolutions.com/2026/03/27/moving-bedrock-solutions-to-production-with-defence-in-depth-beyond-standard-guardrails/)

**SZL technical backing**
- [SZL Holdings org profile (architecture, Λ, A11oy/Sentra/Amaru, gate ladder)](https://github.com/szl-holdings)
- Ouroboros thesis: [v10 Λ audit-closure (Zenodo 10.5281/zenodo.20053163)](https://doi.org/10.5281/zenodo.20053163), [v11 applied Λ latency (Zenodo 10.5281/zenodo.20119582)](https://doi.org/10.5281/zenodo.20119582), [v12 Lean-verified mechanisms (Zenodo 10.5281/zenodo.20173920)](https://doi.org/10.5281/zenodo.20173920)
- `lutar-lean` Lean 4 proofs — `Λ_k` uniqueness/Egyptian-exactness/boundedness; TH11 `khipuReceipt_checksum_invariant` (`Lutar/Khipu/SummationInvariant.lean`, commit `1dca00032dfc9aa8559cc6c2e4b63192fcf52371`)
- Khipu receipt DAG (`khipu-receipt.ts`): sum-of-sums invariant + DSSE dual-attestation; references IETF SCITT `draft-ietf-scitt-architecture-22`
- Prior SZL research: `../phd_warhacker/00`–`09`, `../phd_scrape/defenseunicorns/`

---

*Prepared by research subagent, 2026-05-31. Honest-scope note per founder request: SZL fits natively on 2 of 6 Warhacker problems, partially on 2 more, and is out of scope on 2. The two headline SZL-unique problems (formally-verified oversight gate; summation-checked non-refutable Body of Evidence) are defensible against the public Warhacker catalog and reinforced by current DoD policy.*
