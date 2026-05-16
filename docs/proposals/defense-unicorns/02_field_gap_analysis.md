# §02 — Field gap analysis

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Retrieved:** 2026-05-16
**Scope:** Secure DevSecOps / airgap-capable platform field. Sources
cited inline; full URL + retrieved-on list in §07.

---

## 2.1 Players reviewed

| Player                                | What it solves (1 line)                                                | Sourced from                       |
| ------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| Defense Unicorns (UDS + Zarf + Pepr)  | Airgap-native distribution + opinionated runtime + admission policy    | `gh_uds-core.json`, `gh_pepr.json` |
| Anduril Lattice                       | Edge-tactical software for autonomous systems                          | anduril.com/lattice                |
| Palantir Apollo                       | Continuous delivery across classified / disconnected estates           | palantir.com/platforms/apollo      |
| Red Hat OpenShift + ACS               | Enterprise K8s + Kubernetes-native security (StackRox)                 | redhat.com/openshift, redhat.com/advanced-cluster-security |
| SUSE Rancher Government               | FedRAMP-aligned Rancher distribution (RKE2 / Rancher Gov)              | rancher.com/rancher-government     |
| Sigstore (Cosign / Fulcio / Rekor)    | Keyless signing + transparency log for OCI artifacts                   | sigstore.dev                       |
| Chainguard                            | Minimal distroless images + Wolfi distro + Enforce policy              | chainguard.dev                     |
| SLSA framework                        | Provenance + build-integrity *spec* (not a product)                    | slsa.dev                           |
| Kyverno                               | K8s-native policy as YAML                                              | kyverno.io                         |
| OPA / Gatekeeper                      | Policy-as-code for K8s admission                                       | openpolicyagent.org                |
| Falco                                 | Runtime kernel-level threat detection                                  | falco.org                          |
| Tetragon                              | eBPF-based runtime security + enforcement                              | github.com/cilium/tetragon         |
| Wiz                                   | Agentless multi-cloud CSPM + CNAPP                                     | wiz.io                             |
| Snyk                                  | Developer-first SCA / SAST / container security                        | snyk.io                            |
| Aqua Security                         | CNAPP — full container lifecycle security                              | aquasec.com                        |

## 2.2 Capability axes

Each axis is a real capability question a UDS operator or a Defense
Unicorns prospect can ask out loud:

- **C1 — Airgap-native distribution** (single artifact, no registry).
- **C2 — In-bundle, registry-independent attestation** (verifiable
  offline; not "we wrote a signature into the registry").
- **C3 — Hash-chained, append-only proof ledger** (every decision /
  build / admission produces one immutable line).
- **C4 — Admission-time gate on agent / model invocations** (not on
  container images — on the *call*).
- **C5 — 9-axis conjunctive Λ-floor doctrine gate** (provenance,
  containment, coherence, convergence, moralGrounding,
  measurabilityHonesty, etc., AND-composed, with hard floors).
- **C6 — 5× byte-identical replay** of governed runs from a canonical
  registry, anchored to a public DOI.
- **C7 — Adversary-emulation maturity gate** (a runtime can be told
  `MATURITY_GATE_BLOCKED` on policy violation, not just "noisy alert").
- **C8 — Fleet-level "what-changed" recalibration memo pipeline**
  for operators (weekly drift digest, not point-in-time CSPM scan).
- **C9 — Insurance-aligned posture API** (carrier / policy id /
  pass-fail clause tied to live posture).
- **C10 — Machine-checked formal verification** of the
  invariant kernel (Lean 4 / Coq / similar).

## 2.3 Gap matrix

**Legend:** ✅ solved · ◐ partial · ☐ open

| Player                                  | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 |
| --------------------------------------- | -- | -- | -- | -- | -- | -- | -- | -- | -- | --- |
| Defense Unicorns (UDS+Zarf+Pepr)        | ✅ | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| Anduril Lattice                         | ◐ | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| Palantir Apollo                         | ✅ | ◐  | ☐  | ☐  | ☐  | ☐  | ☐  | ◐  | ☐  | ☐   |
| Red Hat OpenShift + ACS                 | ◐ | ◐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| SUSE Rancher Government                 | ◐ | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| Sigstore (Cosign / Fulcio / Rekor)      | ☐  | ◐  | ✅ | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| Chainguard                              | ☐  | ◐  | ◐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| SLSA (spec)                             | ☐  | ◐  | ◐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| Kyverno                                 | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| OPA / Gatekeeper                        | ☐  | ☐  | ☐  | ◐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| Falco                                   | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| Tetragon                                | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| Wiz                                     | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| Snyk                                    | ☐  | ◐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| Aqua Security                           | ☐  | ◐  | ◐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐  | ☐   |
| **SZL Holdings (A11oy + Sentra + Amaru)** | ☐ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ◐   |

### Evidence key for the matrix

Each ✅ / ◐ / ☐ in the matrix above derives from one of the following
evidence classes (cited per row, not per cell, because the gap
assignments cluster by player):

- **Defense Unicorns (UDS+Zarf+Pepr)** — `_sources/gh_uds-cli.json`,
  `_sources/gh_uds-core.json`, `_sources/gh_pepr.json`,
  `_sources/gh_zarf.json`, plus the install-page snapshot at
  `_sources/uds-cli-install.html`. C1=✅ because Zarf is explicitly
  airgap-native. C2–C10=☐ because no public surface of these repos
  ships in-bundle attestation chains, agent-call admission gates, a
  9-axis Λ-floor, byte-identical replay, an adversary-emulation
  maturity gate, fleet recalibration memos, an insurance-aligned
  posture API, or machine-checked formal verification.
- **Anduril Lattice / Palantir Apollo / Red Hat / SUSE** — product
  landing pages listed in §07. C1=✅/◐ on distribution claims; ☐ on
  C2–C10 because no publicly documented feature on those pages claims
  the specific capability in those columns.
- **Sigstore** — sigstore.dev. C3=✅ because Rekor is a published
  transparency log; ◐ on C2 (signatures, not in-bundle chain); ☐
  elsewhere because Sigstore is explicitly out of scope for agent /
  model invocation admission and 9-axis gates.
- **Chainguard / SLSA / Snyk / Aqua** — vendor landing pages /
  framework spec in §07. ◐ on C2/C3 where SBOM/provenance claims are
  documented; ☐ on agent-invocation / Λ-floor / replay / memo / Lean
  axes.
- **Kyverno / OPA-Gatekeeper / Falco / Tetragon / Wiz** — vendor /
  project pages in §07. OPA gets ◐ on C4 because OPA *can* in
  principle gate any decision input; ☐ everywhere else because there
  is no public reference implementation of any of the SZL-specific
  axes shipping in those projects today.
- **SZL Holdings (A11oy + Sentra + Amaru)** — every ✅ traces to a
  file under `packages/payload/raw/` or a route in this monorepo,
  enumerated in §03 and §07.

If Andrew (or any reviewer) wants a per-cell footnote instead of the
per-row evidence class above, the underlying payload + cached HTML are
all in `_sources/` plus `packages/payload/raw/` — happy to expand on
demand.

The matrix reads honestly in both directions. **UDS owns the columns SZL
does not** (airgap distribution, C1). **SZL owns the columns UDS does
not** (C2–C9, and C10 partially via `lutar-lean`). Sigstore owns C3 in a
narrow sense (Rekor *is* a transparency log) but does not extend it to
agent invocations (C4) or to a 9-axis doctrine gate (C5).

## 2.4 SZL's landing zone (the open cells in UDS's row)

The columns where UDS today has **☐** and SZL has **✅** are the
defensible mesh points:

- **C2 — In-bundle attestation** → §05 Fix A.
- **C3 — Hash-chained proof ledger** → §04 Plane 3.
- **C4 — Admission gate on agent / model invocations** → §05 Fix B.
- **C5 — 9-axis Λ-floor doctrine gate** → §04 Plane 4.
- **C7 — Adversary-emulation maturity gate** → §04 Plane 4 (Sentra
  pattern transplanted).
- **C8 — Fleet recalibration memo pipeline** → §04 Plane 5.
- **C9 — Insurance-aligned posture API** → bundled with Plane 1
  (Sentra Zarf package surfaces it as a service).

The two cells with the highest "ship in ≤14 days and the proof is
already on disk" leverage are **C2** and **C4** — those become Fix A
and Fix B in §05.

## 2.5 Honest non-claims

- SZL does not own C1 (airgap distribution). We're not pretending to.
  Plane 1 of §04 is explicitly *bundle into Zarf*, not *replace Zarf*.
- SZL's C10 is partial: 35 theorems in Lean 4, **8 open `sorry`s**
  (tracked in #4940). That's the canonical state per
  `packages/payload/raw/dev1_thesis/thesis_payload.json` line 168.
- No SZL product currently runs in a production UDS bundle. The proposal
  is to make that true, not to claim it.
