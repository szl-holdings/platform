# §07 — Appendix: cited sources

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Retrieval date for all sources below:** 2026-05-16

All HTML / JSON below cached under `./_sources/` for reproducibility.

---

## Defense Unicorns surface (user-supplied)

| URL                                                                                                                  | Cached as                              | 1-line summary                                                          |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| https://defenseunicorns.com/warhacker/                                                                               | `_sources/warhacker.html`              | Defense Unicorns Warhacker event landing page.                          |
| https://docs.defenseunicorns.com/cli/getting-started/installation/                                                   | `_sources/uds-cli-install.html`        | Canonical `uds` CLI install path.                                       |
| https://github.com/defenseunicorns/uds-cli/commit/72327d9169eab5fcc5a88a45836946b0bf173512                            | `_sources/commit_72327d9.json`         | Doc-quality PR #1360 (`fix(docs): llm friendly docs`); 14 files, +36/−26. |

## GitHub repo metadata (authenticated GitHub API)

All retrieved on 2026-05-16 via `GH_WORKFLOW_TOKEN`-authenticated calls
to `https://api.github.com/repos/<owner>/<repo>`.

| Repo                                | Cached as                          | License    |
| ----------------------------------- | ---------------------------------- | ---------- |
| `defenseunicorns/uds-cli`           | `_sources/gh_uds-cli.json`         | AGPL-3.0   |
| `defenseunicorns/uds-core`          | `_sources/gh_uds-core.json`        | AGPL-3.0   |
| `defenseunicorns/pepr`              | `_sources/gh_pepr.json`            | Apache-2.0 |
| `defenseunicorns/uds-identity-config` | `_sources/gh_uds-identity-config.json` | AGPL-3.0 |
| `defenseunicorns/uds-package`       | `_sources/gh_uds-package.json`     | (404 on retrieval — see §01.1) |
| `defenseunicorns/uds-runtime`       | `_sources/gh_uds-runtime.json`     | (404 on retrieval — see §01.1) |
| `zarf-dev/zarf`                     | `_sources/gh_zarf.json`            | Apache-2.0 |

## Field-scan sources (§02)

URLs cited for the gap matrix:

| Player              | URL                                                                                                   | One-line summary (publicly stated scope)                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Anduril Lattice     | https://www.anduril.com/lattice/                                                                       | Edge-tactical software platform for autonomous systems and multi-domain operations.    |
| Palantir Apollo     | https://www.palantir.com/platforms/apollo/                                                            | Continuous delivery system for software across classified / disconnected environments. |
| Red Hat OpenShift   | https://www.redhat.com/en/technologies/cloud-computing/openshift                                      | Enterprise Kubernetes distribution with developer + operator tooling.                  |
| Red Hat ACS         | https://www.redhat.com/en/technologies/cloud-computing/openshift/advanced-cluster-security-kubernetes | Kubernetes-native security (formerly StackRox): admission, runtime, vuln management.    |
| SUSE Rancher Gov    | https://www.rancher.com/products/rancher-government                                                   | FedRAMP-aligned Rancher distribution targeting US-government K8s estates.              |
| Sigstore            | https://www.sigstore.dev/                                                                              | Keyless signing + Rekor transparency log for OCI artifacts (Cosign / Fulcio / Rekor).   |
| Chainguard          | https://www.chainguard.dev/                                                                            | Minimal distroless images, Wolfi distro, and Enforce policy product.                   |
| SLSA                | https://slsa.dev/                                                                                      | Specification (not a product) for build-integrity and provenance levels.               |
| Kyverno             | https://kyverno.io/                                                                                    | Kubernetes-native policy engine using YAML-defined policies (CNCF).                    |
| OPA / Gatekeeper    | https://www.openpolicyagent.org/                                                                       | General-purpose policy-as-code engine; Gatekeeper applies OPA to K8s admission.        |
| Falco               | https://falco.org/                                                                                     | Runtime kernel-level threat detection via syscall instrumentation.                     |
| Tetragon            | https://github.com/cilium/tetragon                                                                     | eBPF-based runtime security observability + in-kernel enforcement.                     |
| Wiz                 | https://www.wiz.io/                                                                                    | Agentless multi-cloud CSPM / CNAPP graph.                                              |
| Snyk                | https://snyk.io/                                                                                       | Developer-first SCA / SAST / container security and policy.                            |
| Aqua Security       | https://www.aquasec.com/                                                                               | Full-lifecycle container and CNAPP security platform.                                  |

These pages were not snapshotted because the gap matrix only relies on
publicly-stated product scope; any reviewer can re-fetch on demand.

## SZL Holdings payload (internal canonical source)

All numbers, replay roots, DOIs, and component capabilities cited in
§03 are direct reads of files under `packages/payload/raw/`:

| Path                                                          | What it provides                                       |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| `packages/payload/raw/payload.json`                           | Doctrine V6, org_summary, sentra_posture, file_integrity |
| `packages/payload/raw/dev1_thesis/thesis_payload.json`        | TH1–TH8, DOI ledger, Lean 4 counts                     |
| `packages/payload/raw/dev2_runtime/raw_runtime/a11oy.json`    | A11oy repo + a11oy-knowledge package state             |
| `packages/payload/raw/dev2_runtime/raw_runtime/sentra.json`   | Sentra repo state                                      |
| `packages/payload/raw/dev2_runtime/raw_runtime/amaru.json`    | Amaru repo state                                       |
| `packages/payload/raw/dev2_runtime/raw_runtime/ouroboros.json` | Ouroboros loop kernel state                            |
| `packages/payload/raw/dev2_runtime/raw_runtime/lutar-lean.json` | lutar-lean mechanization state                         |
| `packages/payload/raw/github_pro/github_inventory.json`       | Full 16-repo org inventory + audit                     |

## In-monorepo source pointers

- `platform/agent-gateway/tests/gateway-opa-live.test.ts` — OPA test pack
  (§04 Plane 2, §05 Fix B proof-of-work).
- `platform/agent-gateway/scripts/install-opa.sh` — pinned OPA installer.
- `artifacts/api-server/src/routes/sentra-posture.ts` — posture API
  read endpoints (§03.5, §06 step 3).
- `artifacts/api-server/src/routes/helios/index.ts` — recalibration
  memo pipeline (§04 Plane 5).
- `tools/a11oy-code/` — proof-ledger reference (§04 Plane 3, §05 Fix A).
