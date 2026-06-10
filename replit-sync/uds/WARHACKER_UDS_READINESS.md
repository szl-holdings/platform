# WARHACKER + UDS READINESS — Honest Gap Analysis

**Author:** Perplexity Computer Agent (subagent) · **Date:** 2026-06-06
**Scope:** Defense Unicorns *Warhacker* event facts + UDS (Unicorn Delivery Service) deployment
requirements, gap-analyzed against SZL Holdings' current apps (**a11oy** command platform +
**killinchu** drones/vessels) and our **a11oy.uds** / **killinchu.uds** bundles.
**Founder's core question answered at the bottom:** *Are our applications + UDS ready to be
deployed and demo'd at Warhacker, and can we produce answers to their challenge problems?*

**Doctrine honesty kept throughout:** trust score = research **conjecture** (never a theorem),
**5** formulas proven in Lean, **SLSA Build L2** on the organ images (NOT L3 / NOT Iron Bank),
**bundle-level attestation NOT earned**. No FedRAMP / CMMC / Iron Bank claims.

---

## PART 1 — WARHACKER: THE REAL EVENT (cited)

All confirmed against the official event page.

| Fact | Detail | Source |
|---|---|---|
| **Dates** | **16–19 June 2026** (Day 0 travel/networking 16 Jun; Day 1 teams + build 17 Jun; Day 2 build 18 Jun; Day 3 complete + **Outbrief** 19 Jun) | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/), [DU Events](https://defenseunicorns.com/events/) |
| **Location** | Downtown **San Diego, CA** (specific venue given on acceptance) | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |
| **Format** | "First-of-its-kind **hackathon**" — explicitly **NOT a conference** with a speaker lineup or vendor hall. Mission: **BUILD → PACKAGE → DEPLOY** software solutions to warfighter problems. Success measure = **number of apps in mission environments**. | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |
| **Packaging mandate** | "**Packaging solutions with the open source UDS Core platform** so they're ready for **rapid deployment and authorization anywhere — cloud to edge**." This is the central technical bar. | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |
| **Who attends** | Government, Industry, Academia, Nonprofit. ~**400** Warhackers, curated for equitable distribution **aligned to problems**. DoD/"DOW systems" language ("deployed and/or authorized on DOW systems"). Free to attend. | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |
| **Confirmed attendee example** | SynapseMX (legacy QA / authorization pain). DU calls it where "if there's a problem worth solving, this is where it gets solved." | [Defense Unicorns LinkedIn](https://www.linkedin.com/posts/defense-unicorns_warhacker-defensetech-softwaredelivery-activity-7460328215358730240-OOVH) |
| **Selection / approval waves** | Rolling, reviewed every 2 weeks. Wave 1: **13 Mar 2026**; Wave 2: **27 Mar 2026**; Wave 3: **10 Apr 2026**. | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |
| **Data rights / IP** | Default: publish new solutions as **AGPL-3.0 open source**. **Commercial vendors retain full rights to their original IP and enhancements built during Warhacker.** Non-public cases handled case-by-case. | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |
| **Contact** | warhacker@defenseunicorns.com | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |

### The 5 challenge problems (verbatim owners + asks)

| # | Problem owner | The ask (paraphrased from official text) | Source |
|---|---|---|---|
| 1 | **Cannonico** | **AI oversight for autonomous drones.** When a drone loses contact mid-mission it runs with **no human in the loop**. Unanswerable today: *is the AI still within authorized parameters or has it gone off script?* Needs an **independent system to monitor AI behavior in real time, catch the moment a line is crossed, and back it with a permanent, tamper-evident record.** | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |
| 2 | **Tychee Research Group** | **Satellite ground software.** Fragmented, bespoke air-gapped networks, redundant work. Wants **proven, reusable deployment stacks** binding delivery tools, system services, data sources, and GSW apps. | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |
| 3 | **HANGAR2APPS** | **Military deployment health screening.** Readiness data scattered across paper/spreadsheets/legacy. Wants a **unified platform, automated workflows, real-time readiness dashboards, mobile-optimized field screening.** | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |
| 4 | **Cyber RTS** | **Trajectory/orbit visualization.** A **lightweight viz + assessment layer** that ingests **any** trajectory or orbit data and immediately puts it in operational context **without bespoke integration.** | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |
| 5 | **Raven Tactical Computing LLC** | **AI at the tactical edge.** Purpose-built infrastructure that lets software **actually run where the mission happens** — deployed and authorized on mission systems. | [Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/) |

### Likely evaluation criteria (reasoned, since no formal rubric is published)
The event is explicitly a **build/package/deploy hackathon judged on getting software into mission
environments**, not a pitch contest ([Defense Unicorns — Warhacker](https://defenseunicorns.com/warhacker/)).
For a governed-AI platform like ours, a panel will almost certainly pressure-test:
1. **Does it actually deploy into UDS Core (cloud→air-gap) and run?** (the stated north star).
2. **Does it solve a real warfighter problem end-to-end**, not a slide.
3. **Provenance / supply-chain integrity** — signed images, SBOM, attestation (DU's whole UDS thesis).
4. **Auditability / accountability** of AI decisions (directly the Cannonico ask).
5. **Open-source posture** (AGPL default) and clean licensing.

---

## PART 2 — UDS DEPLOYMENT REQUIREMENTS (what makes a bundle "UDS-ready")

### 2.1 Current versions (verified live, 2026-06-06)
- **UDS Core latest = `v1.5.0`** (published 2026-05-27). *(Note: GitHub's cached releases HTML showed an
  older `v0.43.0`; the live API confirms `v1.5.0`.)* — [UDS Core releases (GitHub API)](https://api.github.com/repos/defenseunicorns/uds-core/releases/latest), [UDS Core releases page](https://github.com/defenseunicorns/uds-core/releases)
- Our bundles declare `x-uds-core-compat: ">=1.5.0"` and `x-zarf-compat: ">=0.77.0"` — **consistent with current UDS Core** (our last bundle build logged uds-cli v0.32.0 / Zarf v0.77.0).

### 2.2 UDS Core baseline (what the customer cluster already provides)
UDS Core is a single Zarf package establishing a secure baseline; a vendor app deploys **on top of it**
([UDS docs](https://uds.defenseunicorns.com/), [UDS llms-full snapshot](https://uds.defenseunicorns.com/llms-full.txt)):

| Capability | Component(s) |
|---|---|
| Service mesh | **Istio** (ambient is now the default mode; sidecar still supported) |
| Policy engine / operator | **Pepr** (UDS Policy Engine) + **UDS Operator** (reconciles `Package` CRs → NetworkPolicies, Istio VirtualServices, Keycloak clients, ServiceMonitors) |
| Identity & access | **Keycloak** (SSO) + **AuthService** (OIDC redirect in the mesh) |
| Monitoring | **Prometheus**, **Grafana**, **Alertmanager**, Metrics Server |
| Logging | **Vector** (agent) → **Loki** (aggregation) |
| Runtime security | **Falco** (now the default; **NeuVector is no longer managed by UDS Core** — deploy standalone if needed) |
| Backup/restore | **Velero** |

> **GAP FLAG for us:** Our docs/CRs and the old `audit_uds.md` describe a **NeuVector + Istio sidecar**
> baseline. Current UDS Core baseline is **Falco + ambient Istio** ([UDS llms-full](https://uds.defenseunicorns.com/llms-full.txt)).
> Our `Package` CR explicitly sets `serviceMesh.mode: sidecar`, which is *valid* but no longer the default —
> fine to keep, but we should stop referencing NeuVector as the assumed baseline.

### 2.3 What a vendor MUST ship to deploy into a customer UDS Core cluster
Per the UDS docs ([UDS llms-full](https://uds.defenseunicorns.com/llms-full.txt)):
1. **A Zarf package** containing all OCI images, Helm chart(s), and supplemental manifests — *self-contained for air-gap*.
2. **A UDS `Package` custom resource** (`apiVersion: uds.dev/v1alpha1`, `kind: Package`) so the **UDS Operator** can wire the app into Core — this is the one addition that turns a Zarf package into a "UDS package."
3. **`network.allow` / `network.expose`** declarations (default-deny zero-trust is auto-applied per package; you must explicitly allow the traffic you need; expose creates Istio VirtualServices on the tenant/admin gateway).
4. **`sso`** entries if the app needs Keycloak clients; **`monitor`** entries for ServiceMonitor/PodMonitor; **`caBundle`** if talking to private PKI.
5. **Flavored images** (`unicorn` / `registry1`=Iron Bank / `upstream`) — DoD contracts "often require" `registry1`/Iron Bank.
6. **SBOMs** — UDS Bundles include SBOMs for all packaged content (Zarf produces them).
7. **A `UDSBundle`** (`uds-bundle.yaml`) composing the package(s), built with `uds create`, published to OCI with `uds publish`, and ideally **cosign-signed**. `uds deploy` pulls + deploys (air-gap via local `.tar.zst` after `uds pull`).

### 2.4 The network allow/expose model (our CRs use this correctly)
- Every `Package` gets an **auto default-deny** NetworkPolicy + DNS-egress allow. You then add `allow` rules
  (`direction`, `selector`, `remoteNamespace`, `remoteSelector`, `port[s]`, `remoteGenerated: KubeAPI|Anywhere|…`)
  and `expose` rules (`host`, `gateway`, `service`, `port`, `selector`) ([UDS llms-full](https://uds.defenseunicorns.com/llms-full.txt)).
- **Our `szl-uds-deployment/packages/*/uds-package.yaml` already author this matrix** (verified: a11oy↔amaru:8080,
  a11oy↔sentra:8080, a11oy→rosie:7860, a11oy→vessels:8080, a11oy→szl-receipts:8080, with Ingress mirrors).
  Schema fields match the official v1alpha1 reference. **This is MET.**

### 2.5 Air-gap (cloud→edge)
- Zarf bakes images + charts into a `.tar.zst`; `uds pull` → `uds deploy <tarball>` deploys offline; no pull at
  deploy time when `yolo:false` and images are vendored ([UDS llms-full](https://uds.defenseunicorns.com/llms-full.txt)).
  Our `szl-a11oy` Zarf package declares `yolo:false` and lists the image — **air-gap model is correct in design**;
  the gap is that the bundle isn't **built** (so we haven't produced/tested the offline tarball end-to-end).

### 2.6 Image / supply-chain requirements
- Images should live in an OCI registry (we use **GHCR**), be **cosign-signed**, and carry **SBOMs**; Pepr's
  "Require Image Signature" policy can verify cosign signatures before pull ([UDS llms-full](https://uds.defenseunicorns.com/llms-full.txt)).
  Our organ images on GHCR carry **`.sig` + `.att`** — **MET at image level**.

---

## PART 3 — SLSA / SUPPLY-CHAIN EXPECTATIONS

| Item | Standard / expectation | Our state | Honest read |
|---|---|---|---|
| **SLSA L2 build-attested (container images, verifiable)** | Hosted build service + **authenticated (signed) provenance** | **MET on all 5 organ images** — `cosign verify-attestation --type slsaprovenance` passes with strict per-org identity, keyless Fulcio+Rekor, `predicateType=slsa.dev/provenance/v0.2` | Defensible. Honest to demo. ([SLSA v1.0 requirements](https://slsa.dev/spec/v1.0/requirements), [GitHub: SLSA L2 build-attested, L3 roadmap, via attestations](https://github.blog/enterprise-software/devsecops/enhance-build-security-and-reach-slsa-level-3-with-github-artifact-attestations/)) |
| **SLSA Build L3** | **Non-falsifiable** provenance: signing isolated on dedicated infra via a **reusable workflow**; build steps cannot access signing material | **NOT earned** | The jump from L2→L3 is "use a reusable workflow for provenance so signing is separated from the build job" — *achievable* but not done. Do **not** claim L3. ([GitHub SLSA L3](https://github.blog/enterprise-software/devsecops/enhance-build-security-and-reach-slsa-level-3-with-github-artifact-attestations/)) |
| **Bundle-level attestation** | Provenance attestation on the **bundle** artifact itself | **NOT earned** — CI token lacks `attestations:write`; the **cosign signature** is the only bundle-level provenance (`szl-mesh:0.4.0` signed; `a11oy-bundle`/`killinchu-bundle` not built/signed yet) | Real, documented gap. The signature ≠ a SLSA attestation. |
| **Iron Bank (`registry1`)** | "Often required on DoD contracts"; UDS `registry1` flavor pulls Platform One Ironbank images (amd64-only) | **NOT used** — we ship our own GHCR images | **Roadmap, not a Warhacker blocker.** Warhacker is a build/deploy hackathon, not an ATO gate. Iron Bank matters for production ATO, not the demo. ([UDS llms-full](https://uds.defenseunicorns.com/llms-full.txt)) |
| **RKE2 / STIG-hardened k8s** | Production DoD clusters commonly run RKE2 (STIG/FIPS) | **NOT required for demo** — we deploy to k3d / our tower for the demo | Roadmap. RKE2 Government is the STIG/FIPS-hardened distro for production. ([Rancher Government certifications](https://ranchergovernment.com/security-certifications)) |
| **IL4 / IL5 ATO** | FedRAMP-baseline + DISA Impact Level controls, US-person access, NIPRNet/BCAP, granular supply-chain provenance | **NOT in scope at this stage** | IL5 is a fundamental architectural divergence (dedicated hardware, ~200 NSS controls). **Not expected for an inaugural hackathon demo**; it's the long-horizon production roadmap. ([SecondFront IL4 vs IL5](https://www.secondfront.com/resources/blog/achieving-dod-cc-srg-compliance-navigating-fedramp-and-disa-impact-levels-il4-vs-il5/), [Microsoft IL5](https://learn.microsoft.com/en-us/azure/compliance/offerings/offering-dod-il5)) |

**Bottom line on supply chain:** **SLSA L2 build-attested (verifiable) on the container images is honest and acceptable to demo; bundle-level attestation = roadmap. Not Iron Bank/FedRAMP/CMMC/ATO.** RKE2 /
STIG / IL4-5 are **production-ATO roadmap, not a Warhacker bar.** The one credible knock a judge could land is
the **missing bundle-level attestation** — own it (cosign signature is the bundle provenance today).

---

## PART 4 — UDS-READY CHECKLIST (requirement → status → close-it action)

Ordered by **demo-criticality** (top items block the demo first).

| # | Requirement | Status | What to close it |
|---|---|---|---|
| 1 | **Bundles BUILT + PUBLISHED to OCI** (`a11oy-bundle:0.5.0`, `killinchu-bundle:0.5.0`) | **MET** (verified 2026-06-06) | Both built+published+cosign-signed via `uds-canonical-bundles-publish.yml` (workflow_dispatch). **Anonymous GHCR manifest HEAD = 200** for `:0.5.0` and `:latest` on both: `a11oy-bundle` → `sha256:d801f8e461dfd519b5f8593322e75b89a1e66d4da9f6d72d0937c8ff2de64b51`; `killinchu-bundle` → `sha256:e59921332c37408fb5a62b270eeeafb1f1ab44aebb350f18662c37aa2c67426f`. cosign `.sig` tags present + `cosign verify` passes (keyless OIDC, issuer token.actions.githubusercontent.com). `szl-mesh:0.4.0` remains the published fallback. Runs: a11oy=27051498473, killinchu=27051339399. |
| 2 | **`uds create` actually succeeds** for `szl-a11oy` (+sentra/amaru/rosie) Zarf packages | **MET** (verified 2026-06-06) | `zarf package create` for all referenced per-organ packages (a11oy: szl-a11oy/sentra/amaru/rosie; killinchu: szl-killinchu/sentra/amaru) and `uds create` both **succeed in CI** — the per-organ images are pulled into the tarballs (air-gap, yolo:false) and the bundle archive builds. Bundle digests verified on GHCR (see #1). |
| 3 | **Bundle cosign-signed** | **MET** (verified 2026-06-06) | `szl-mesh:0.4.0` signed (verified earlier). `a11oy-bundle:0.5.0` + `killinchu-bundle:0.5.0` now **cosign-signed** via keyless OIDC: `.sig` tags exist on GHCR and `cosign verify ... --certificate-oidc-issuer https://token.actions.githubusercontent.com` passes for both (Rekor tlog entries created). |
| 4 | **Bundle path references resolve at build time** | **MET** (verified 2026-06-06) | Resolved. The workflow now pre-builds each per-organ Zarf package into a `.tar.zst` (`zarf package create bundles/szl-<organ> -o bundles/szl-<organ>`) **before** `uds create`, so the `path: ../szl-<organ>` references resolve. `uds create` + `uds publish` both succeed in CI for both bundles. |
| 5 | **UDS `Package` CR present + schema-valid** | **MET** | `szl-uds-deployment/packages/*/uds-package.yaml` + the in-package `manifests/uds-package.yaml` use correct `uds.dev/v1alpha1` schema (sso, network.allow/expose, monitor). Verified against the official v1alpha1 reference. |
| 6 | **Network allow/expose matrix (zero-trust)** | **MET** | Cross-organ allow/expose authored and correct. Default-deny is auto-applied by the Operator. |
| 7 | **Images on OCI, signed, SBOM, SLSA L2 build-attested (verifiable)** | **MET** | All 5 organ images on GHCR carry `.sig` + `.att` (SLSA prov v0.2). SBOMs (SPDX+CycloneDX) vendored in each Zarf package. |
| 8 | **Air-gap offline deploy proven** (`uds pull` → `uds deploy <tarball>` with cable pulled) | **PARTIAL** | Design is air-gap-correct (`yolo:false`, images vendored). **Not yet executed end-to-end** for the new bundles. Once #1 builds, run `uds pull oci://…a11oy-bundle:0.5.0` then deploy from the tarball offline on the tower to prove it. |
| 9 | **Baseline assumptions match current UDS Core** | **PARTIAL** | Stop assuming **NeuVector**; current baseline is **Falco + ambient Istio**. Our `serviceMesh.mode: sidecar` is valid but should be a deliberate, documented choice. Verify our AuthorizationPolicies still apply under the deployed Core version. |
| 10 | **Bundle-level SLSA attestation** | **GAP** | CI token lacks `attestations:write`. Either grant the token `attestations:write` + add `attest-build-provenance` for the bundle, or keep the cosign signature as the documented bundle provenance and **say so honestly**. Not a demo blocker. |
| 11 | **Roadmap prerequisite images public** (vsp-otel, szl-receipts-server, szl-lake, vessels) | **GAP (roadmap)** | 403/not-public. Allow rules already exist so nothing breaks (traffic just doesn't flow). Make images public + add Zarf packages **only if** OTEL/central-receipts are needed at the edge; killinchu signs receipts locally regardless. |
| 12 | **Iron Bank / RKE2 / STIG / IL4-5** | **GAP (out of demo scope)** | Production-ATO roadmap. Do not attempt before June. Mention as roadmap if asked. |

---

## PART 5 — PER-WARHACKER-PROBLEM READINESS (can we answer it? evidence? gaps?)

The five problems are all demoable today from **a11oy `/warhacker` → "Launch all 5 demos"**, which the parent
verified eyes-on with all 5 green + real receipts (FLEET_STATE_VERIFIED). Honest per-problem read:

| # | Problem | Our answer today | Live evidence | Honest gaps |
|---|---|---|---|---|
| **1** | **Cannonico** — AI oversight for autonomous drones ★ **BULLSEYE** | **YES — real, defensible.** `killinchu_cannonico.py` lost-contact governance loop: mission envelope = authorized params, 13-axis Λ-gate = line-crossing detector, Khipu Merkle DAG + DSSE = tamper-evident record. | Live 4-decision replay catches the moment at **seq 2 = ENGAGE** (5 breaches), `merkle_chain_contiguous:true`, **real ECDSA-P256 DSSE** `verify_envelope→True`; flip one byte → `False` (rejected). a11oy `/warhacker` P1 returns a real **cosign-signed** receipt (keyid `szlholdings-cosign`). killinchu serves `GET /cosign.pub` + `/receipt/export` so a judge verifies **offline** with openssl/cosign. | This is the **verbatim DoD problem statement** = our thesis. Strongest play. Only honest caveat: Λ is a **conjecture-grade** trust aggregator, not a proven optimum — labeled as such. |
| **2** | **Tychee** — reusable air-gap satellite GSW deployment stacks | **PARTIAL — substrate yes, GSW vertical no.** Our answer is the **UDS+Zarf reusable air-gap deploy stack** + sentra deny-by-default policy gates as the "system services" layer. | a11oy `/warhacker` P2 (Tychee): **8 immune gates deny-by-default**, live ~19ms. sentra `/console` shows 8 gates + ALLOW/DENY audit ring. The bundle IS a reusable air-gap stack. | **No satellite-GSW-specific data adapter.** We bring the reusable *deployment stack* (the literal ask) but not a GSW app. Honest pitch: "we are the reusable air-gap delivery substrate; a GSW vertical plugs in via a readiness pack." |
| **3** | **HANGAR2APPS** — military deployment health screening | **PARTIAL — dashboard/ingest substrate, no health schema.** amaru ingests/reasons over scattered data; rosie/a11oy render real-time readiness dashboards; receipt substrate = auditable workflow. | a11oy `/warhacker` P3 (HANGAR2APPS): **VERDICT DEPLOYABLE** cited, live ~18ms (readiness/deployability check via amaru). a11oy `/govern` (Readiness & Compliance) renders live. | **No medical-readiness data model / mobile field-screening UI.** We have the readiness-dashboard + ingest pattern, not the health-screening vertical. Build a readiness pack for the screening schema. |
| **4** | **Cyber RTS** — ingest any trajectory/orbit data → operational context | **PARTIAL/CLOSE — anomaly triage real, generic trajectory ingest partial.** amaru reasons + flags anomalies; killinchu already ingests track/trajectory data and multi-prioritizes. | a11oy `/warhacker` P4 (Cyber-RTS): **VERDICT ANOMALOUS, 1 flag**, live ~16ms (real reasoning output). killinchu track board ingests trajectory tracks live. | **Not a generic "any orbit/trajectory format" ingester** with zero bespoke integration. Closest of the four non-Cannonico problems. Gap = a schema-agnostic trajectory adapter. |
| **5** | **Raven** — AI at the tactical edge (deploy + authorize where mission happens) | **YES (as deploy story) — the UDS air-gap bundle IS the answer.** Raven's ask is literally "purpose-built infra to run software at the edge." Our killinchu.uds field bundle + DDIL profile is exactly that. | a11oy `/warhacker` P5 (Raven): **5 edge-mesh wires** live (~3ms after the self-call deadlock fix). killinchu bundle annotated `ddil-ok:true`, signs receipts offline with in-image cosign key. | **The deploy must be PROVEN** — i.e., the bundle must actually `uds deploy` air-gapped (see Part 4 #1/#8). The answer is the deploy itself, so the build/publish gap is the same gap as Raven's gap. |

**Net:** **1 true bullseye (Cannonico), 1 strong deploy-story (Raven), 3 credible-with-a-readiness-pack
(Tychee/HANGAR2APPS/Cyber-RTS).** The horizontal substrate — **signed receipts + Λ-gate + UDS air-gap deploy** —
is real and demoable across all five. Honest pitch: *"We are the governance + deploy layer under any of these,
not a point solution. Cannonico is real today; the rest stand up on the same substrate via a vertical-readiness pack."*

---

## PART 6 — HONEST VERDICT

### Q1: Are we demo-ready for the **HF live demo**? → **YES.**
- a11oy is a live, self-contained 26-tab command platform (commit `c255b252`), **0 console errors across all 26 tabs**, real 3D/charts/live public data, mesh **5/5 reachable** on HF.
- a11oy `/warhacker` launches **all 5 problems green** with real data + receipts; killinchu serves genuinely **cosign-signed** DSSE receipts verifiable offline.
- Honesty posture is clean and on-screen (trust=conjecture, 5/100 proven, SLSA L2 build-attested (container images, verifiable), "unsigned-no-key" labeled where true).
- **The HF demo works today.** Lead with a11oy `/warhacker`; for the "anyone can verify" thesis, use killinchu's `/cosign.pub` + `/receipt/export` offline-verify.

### Q2: Are the **UDS bundles deployable into a UDS Core cluster** today? → **BUILT, PUBLISHED + SIGNED; air-gap deploy still to be proven once.**
Status (updated 2026-06-06):
1. **DONE — Build + publish + cosign-sign** `a11oy-bundle:0.5.0` and `killinchu-bundle:0.5.0` via `uds-canonical-bundles-publish.yml`. Verified on GHCR (manifest HEAD=200 for `:0.5.0` + `:latest`, `.sig` tags present, `cosign verify` passes). `szl-mesh:0.4.0` remains the published fallback.
2. **DONE — `uds create` runs end-to-end**; the `path: ../szl-<organ>` resolution is fixed by pre-building each per-organ Zarf `.tar.zst` before `uds create`.
3. **STILL TO DO — Prove the air-gap deploy** (`uds pull` → `uds deploy <tarball>` offline on the tower) at least once. (Now unblocked: the bundles are pullable from GHCR.)

### TOP BLOCKING ITEMS BEFORE JUNE (ranked)
1. **✅ DONE (2026-06-06) — Built + published + cosign-signed `a11oy-bundle:0.5.0` and `killinchu-bundle:0.5.0`.** Verified REAL on GHCR (manifest HEAD=200 for `:0.5.0`+`:latest`, `.sig` tags, `cosign verify` passes). Was the single gate between "authored" and "deployable." (`szl-mesh:0.4.0` remains the published fallback.)
2. **✅ DONE (2026-06-06) — `uds create` runs end-to-end** and the relative `path:` resolution is fixed (pre-build each per-organ Zarf `.tar.zst` before `uds create`). Both bundles build + publish in CI.
3. **🟠 Prove one air-gapped `uds deploy` on the tower** (pull cable, redeploy) — Raven's answer IS the deploy, so this doubles as the Raven proof. Now unblocked (bundles pullable from GHCR).
4. **🟠 Reconcile baseline drift:** stop assuming NeuVector; confirm our sidecar AuthorizationPolicies apply under deployed UDS Core (Falco + ambient is now default).
5. **🟡 Decide bundle attestation posture:** either earn `attestations:write` + add bundle `attest-build-provenance`, or formally document "cosign signature = bundle provenance, no bundle SLSA attestation." Either way, **say it honestly** — it's the most likely judge knock.
6. **🟢 (Optional / roadmap, NOT June):** make OTEL/receipts/lake/vessels images public + add Zarf packages; Iron Bank `registry1` flavor; RKE2/STIG; IL4/5. None are Warhacker blockers.

### Doctrine kept honest (unchanged)
Trust score = **research conjecture** (never a theorem) · **5** Lean-proven formulas (of 100) · **SLSA L2 build-attested on container images (verifiable via `cosign verify-attestation`)**
on organ images, **NOT L3 / NOT Iron Bank** · **bundle-level attestation NOT earned** (cosign signature is the bundle
provenance) · Doctrine **v11 LOCKED 749/14/163 @ c7c0ba17** · Λ = **Conjecture 1** · Section 889 = exactly 5 vendors ·
No FedRAMP / CMMC / Iron Bank claims.

---

## SOURCES
- Defense Unicorns — Warhacker (official event page): https://defenseunicorns.com/warhacker/
- Defense Unicorns — Events: https://defenseunicorns.com/events/
- Defense Unicorns LinkedIn (Warhacker, June 16–19, SynapseMX): https://www.linkedin.com/posts/defense-unicorns_warhacker-defensetech-softwaredelivery-activity-7460328215358730240-OOVH
- UDS docs (overview): https://uds.defenseunicorns.com/
- UDS machine-readable docs snapshot (Core baseline, Package CR schema, UDSBundle, air-gap, cosign/SBOM, versions): https://uds.defenseunicorns.com/llms-full.txt
- UDS Package v1alpha1 CR reference: https://uds.defenseunicorns.com/reference/configuration/custom-resources/packages-v1alpha1-cr/
- UDS Core releases (live API → v1.5.0): https://api.github.com/repos/defenseunicorns/uds-core/releases/latest
- UDS Core releases page: https://github.com/defenseunicorns/uds-core/releases
- SLSA v1.0 requirements (L1 honest / L2 build-attested / L3 roadmap producer + build-platform table): https://slsa.dev/spec/v1.0/requirements
- SLSA security levels summary: https://slsa.dev/spec/v0.1/levels
- GitHub blog — SLSA L2 (build-attested) / L3 (roadmap) via artifact attestations: https://github.blog/enterprise-software/devsecops/enhance-build-security-and-reach-slsa-level-3-with-github-artifact-attestations/
- DoD CC SRG IL4 vs IL5 (SecondFront): https://www.secondfront.com/resources/blog/achieving-dod-cc-srg-compliance-navigating-fedramp-and-disa-impact-levels-il4-vs-il5/
- Microsoft Learn — DoD IL5: https://learn.microsoft.com/en-us/azure/compliance/offerings/offering-dod-il5
- Rancher Government — RKE2 security certifications (STIG/FIPS): https://ranchergovernment.com/security-certifications

### Internal ground-truth files referenced (workspace, not URLs)
team/FLEET_STATE_VERIFIED.md · team/UDS_SLIM_REPORT.md · team/GENIUS_BUILD_REPORT.md ·
team/DOMAIN_LEADERS_SPEC.md · team/COSIGN_L2_GROUND_TRUTH.md · team/warhacker_approved_problems.md ·
team/warhacker_coverage_FINAL_REPORT.md · a11oy.uds-bundle.yaml · killinchu.uds-bundle.yaml ·
uds-bundles/bundles/szl-a11oy/* · szl-uds-deployment/packages/*/uds-package.yaml
