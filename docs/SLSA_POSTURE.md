# SLSA v1.2 Build Track posture

**Assessment date:** 2026-07-25
**Assessment commit:** `36e924f2c8ec34d7e725fa1da6606dfa609e9eda`
**Status:** Repository evidence inventory; no SLSA level claimed
**Scope:** Build Track posture for artifacts present under `artifacts/` at the
assessment commit

## Claim boundary

This is not a SLSA certification, conformance statement, or verification of a
published artifact. It records what can and cannot be established from the
repository at the assessment commit. A workflow definition is evidence of
configured intent; it is not evidence that a particular run succeeded or that
its output satisfies a SLSA level.

Authoritative references:

- [SLSA v1.2 specification](https://slsa.dev/spec/v1.2/)
- [SLSA v1.2 Build Track requirements](https://slsa.dev/spec/v1.2/build-requirements)
- [SLSA v1.2 levels and tracks](https://slsa.dev/spec/v1.2/about)

The Build Track levels used here are:

- **Build L1:** provenance exists.
- **Build L2:** provenance is authentic and the build runs on a hosted build
  platform.
- **Build L3:** provenance is unforgeable and the build platform provides the
  required build isolation.

SLSA v1.2 explicitly does **not** make hermetic or no-network builds a Build L3
requirement. Hermeticity, network isolation, frozen lockfiles, digest-pinned
images, vendored inputs, and reproducibility are useful additional hardening
controls, but they must be assessed separately from the normative L3
requirements.

## Evidence labels

| Label | Meaning in this document |
|---|---|
| **MEASURED** | Directly observed in the repository or produced by a command in this assessment. This does not imply production operation. |
| **MODELED** | Declared in workflow or source configuration, but no current attestation bundle and subject artifact were verified. |
| **PLANNED** | Described as future work without current implementation evidence. |
| **UNKNOWN** | The repository does not establish the answer. |
| **UNEVALUATED** | A SLSA level was deliberately not assigned because the required artifact/run evidence was not examined or is insufficient. |

## Per-artifact posture

The artifact inventory below is **MEASURED** from the seven directories present
under `artifacts/` at the assessment commit. Every SLSA level remains
**UNEVALUATED** because this assessment did not obtain a subject artifact,
provenance statement, trusted builder identity, and verification result for a
specific build run.

| Artifact | Repository evidence | Build Track posture | Exact blocker |
|---|---|---|---|
| `artifacts/a11oy` | Workspace source is present. No artifact-specific provenance workflow was identified. | **UNEVALUATED** | Produce an immutable output, provenance bound to its digest, builder identity, and a successful verification record. |
| `artifacts/api-server` | Workspace source is present. The repository-level release workflow attests an SBOM, not an API-server binary or image. | **UNEVALUATED** | Bind provenance to the deployed API-server subject and verify it at an exact commit. |
| `artifacts/carlota-jo` | Workspace source is present. No artifact-specific provenance workflow was identified. | **UNEVALUATED** | Produce and verify subject-bound provenance for the released artifact. |
| `artifacts/counsel` | Workspace source is present. No artifact-specific provenance workflow was identified. | **UNEVALUATED** | Produce and verify subject-bound provenance for the released artifact. |
| `artifacts/sentra` | Workspace source is present. No artifact-specific provenance workflow was identified. | **UNEVALUATED** | Produce and verify subject-bound provenance for the released artifact. |
| `artifacts/terra` | Workspace source is present. No artifact-specific provenance workflow was identified. | **UNEVALUATED** | Produce and verify subject-bound provenance for the released artifact. |
| `artifacts/vessels` | [`.github/workflows/vessels-image.yml`](../.github/workflows/vessels-image.yml) configures BuildKit provenance/SBOM output and Cosign signing for a pushed image. This is **MODELED** workflow evidence. | **UNEVALUATED** | Retrieve a current image by digest, its provenance and signature, then verify the predicate, builder identity, source/materials, and isolation properties. |

An unqualified repository-wide “SLSA L1,” “SLSA L2,” or “SLSA L3” badge is not
authorized by this assessment.

## Other build and release outputs

| Output | Evidence | Assessment |
|---|---|---|
| Repository SBOM | [`.github/workflows/release.yml`](../.github/workflows/release.yml) generates a CycloneDX SBOM and configures GitHub build-provenance and SBOM attestations. | **MODELED / UNEVALUATED.** The workflow is present, but no current release SBOM plus attestation was verified. Attesting the SBOM does not establish a level for every application artifact. |
| Zarf packages and `szl-mesh` bundle | [`.github/workflows/szl-zarf-publish.yml`](../.github/workflows/szl-zarf-publish.yml) contains keyless-signing, custom-provenance, and verification steps, but sets `SZL_ROOT` to the absent `docs/proposals/defense-unicorns/szl-holdings` tree and reads four manifests from that missing path. | **MODELED / UNEVALUATED, presently non-runnable.** Restore or supply the pinned input manifests in a governed location, make the workflow reach its build and verification steps, then retrieve and verify a current package, bundle, and attestation. The custom predicate is labeled SLSA v0.2 and still requires a v1.2 Build Track assessment. |
| GitHub Packages npm outputs | [`.github/workflows/npm-publish.yml`](../.github/workflows/npm-publish.yml) builds and publishes selected packages. | **UNKNOWN / UNEVALUATED.** No subject-bound provenance step is visible in that workflow, and no published package attestation was examined. |
| Repository container tag | [`.github/workflows/cosign.yml`](../.github/workflows/cosign.yml) configures keyless image signing and identity-constrained verification. | **MODELED / UNEVALUATED.** Signing establishes an identity assertion, not by itself SLSA provenance or a Build Track level. |

## Controls measured in source

These controls improve supply-chain posture but do not establish a SLSA level
for an artifact:

- `pnpm-lock.yaml` is committed, and several CI workflows use frozen-lockfile
  installation paths. This is not repository-wide enforcement:
  [`.github/workflows/build.yml`](../.github/workflows/build.yml) explicitly
  invokes `pnpm install --no-frozen-lockfile --prefer-offline`.
- GitHub Actions references are SHA-pinned and checked by
  [`.github/workflows/pin-check.yml`](../.github/workflows/pin-check.yml).
- Dependency review and SBOM workflows exist under `.github/workflows/`.
- Sigstore/Cosign signing and verification are configured for selected outputs.

## Evidence required before assigning a level

For each artifact:

1. identify the immutable subject digest;
2. retain the provenance statement or Sigstore bundle;
3. verify the signature and expected workflow identity;
4. verify that the provenance subject matches the artifact digest;
5. verify source repository, revision, builder identity, invocation, and
   materials;
6. for L3, evaluate whether the build platform prevents the build from
   influencing the provenance and isolates builds as required by SLSA v1.2; and
7. retain the verification command, result, workflow run URL, and exact commit.

Hermetic and no-network tests may be added to this evidence packet as stronger
hardening, but failure or absence of those tests must not be misreported as the
normative SLSA v1.2 L3 definition.
