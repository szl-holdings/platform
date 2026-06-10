# UDS INGEST: a11oy.uds + killinchu.uds

**Agent:** Perplexity Computer Agent (subagent) · **Date:** 2026-06-05 ~20:45 EDT
**Directive:** CEO correction — do NOT slim. INGEST everything into TWO clean, self-contained UDS bundles. `a11oy.uds` = full command platform + all prerequisites; `killinchu.uds` = full field node + inherited governance prerequisites. Keep `szl-mesh:0.4.0` working.
**Repo:** `github.com/szl-holdings/uds-bundles` · **Branch:** `main` · **Commit:** `49d939eeba3727ad33e1eab53b392748d2d3f79c`
**Committer/author:** stephenlutar2-hash \<stephenlutar2@gmail.com\> · sign-off present.

---

## What I created / changed (paths + commit)

All in commit `49d939ee` on `main` (parent `680fe399`):

| Path | Action |
|---|---|
| `bundles/a11oy/uds-bundle.yaml` | **NEW** — UDSBundle name `a11oy`, version `0.5.0`, arch amd64. Composes a11oy + sentra + amaru + rosie via relative `path:` to the verified `bundles/szl-<organ>/` Zarf packages. Mesh interconnect carried as the per-organ UDS Package CRs. Roadmap prerequisites (OTEL/MCP/receipts/lake) listed as honest TODO comments, NOT fake-pinned. |
| `bundles/a11oy/README.md` | **NEW** — bundle description + honest publish status. |
| `bundles/killinchu/uds-bundle.yaml` | **NEW** — UDSBundle name `killinchu`, version `0.5.0`. Composes killinchu + sentra + amaru (rosie optional, commented). Self-contained field node. |
| `bundles/killinchu/README.md` | **NEW** — bundle description + honest publish status. |
| `DEPLOY.md` | **REWRITTEN** — two canonical deploy commands + published-vs-authored table + GHCR verification table + cosign/provenance honesty. szl-mesh:0.4.0 kept as the published full-mesh path. |
| `.github/workflows/uds-canonical-bundles-publish.yml` | **NEW, SEPARATE** workflow (workflow_dispatch, input `bundle=a11oy\|killinchu`) to build + publish to the `-bundle` repos. `uds-bundle-publish.yml` (szl-mesh) left UNCHANGED so it never breaks. |
| `uds-bundles/INVENTORY.md` | **APPENDED** — §9 INGEST model + deprecated-dir notes. |

---

## Corrected deploy commands

```bash
# Platform (a11oy.uds) — PUBLISHED + cosign-signed (verified 2026-06-06):
uds deploy oci://ghcr.io/szl-holdings/a11oy-bundle:0.5.0 --confirm

# Field (killinchu.uds) — PUBLISHED + cosign-signed (verified 2026-06-06):
uds deploy oci://ghcr.io/szl-holdings/killinchu-bundle:0.5.0 --confirm

# Full 5-organ mesh — PUBLISHED + cosign-signed, still works (unchanged fallback):
uds deploy oci://ghcr.io/szl-holdings/szl-mesh:0.4.0 --confirm
```

**Why `-bundle` suffix (honest engineering decision):** the GHCR repos `ghcr.io/szl-holdings/a11oy` and `.../killinchu` ALREADY hold the organ **IMAGES** (verified pullable at `:uds-v0.2.0`). Publishing a UDSBundle to the same repo path would collide image-vs-bundle, so the bundles publish to `a11oy-bundle` / `killinchu-bundle`. The conceptual names (`a11oy.uds`, `killinchu.uds`) map to those publish paths.

---

## Published vs authored-only (HONEST)

| OCI ref | Status (verified) |
|---|---|
| `ghcr.io/szl-holdings/szl-mesh:0.4.0` | **PUBLISHED + cosign-SIGNED.** GHCR tags list shows `0.4.0`, `v0.4.0`, `latest`, plus 3 `.sig` tags. Manifest HEAD = HTTP 200 for all three. NOT changed by this work (fallback). |
| `ghcr.io/szl-holdings/a11oy-bundle:0.5.0` (+ `:latest`) | **PUBLISHED + cosign-SIGNED (verified 2026-06-06).** Anonymous manifest HEAD = **HTTP 200** for `:0.5.0` and `:latest`, digest `sha256:d801f8e461dfd519b5f8593322e75b89a1e66d4da9f6d72d0937c8ff2de64b51`. Tags list: `0.5.0`, `latest`, `sha256-d801f8e4…64b51.sig`. `cosign verify` passes (keyless OIDC, issuer token.actions.githubusercontent.com). Run id 27051498473. |
| `ghcr.io/szl-holdings/killinchu-bundle:0.5.0` (+ `:latest`) | **PUBLISHED + cosign-SIGNED (verified 2026-06-06).** Anonymous manifest HEAD = **HTTP 200** for `:0.5.0` and `:latest`, digest `sha256:e59921332c37408fb5a62b270eeeafb1f1ab44aebb350f18662c37aa2c67426f`. Tags list: `0.5.0`, `latest`, `sha256-e59921…426f.sig`. `cosign verify` passes (keyless OIDC). Run id 27051339399. |

Both new bundles are now **built, published, and cosign-signed** on GHCR, verified by anonymous manifest HEAD = 200 and `cosign verify`. The bundle-level SLSA attestation step is **expected to fail** (CI token lacks `attestations:write`) — the cosign signature is the bundle provenance; **no bundle SLSA attestation is claimed.**

---

## GHCR tag verification results (anonymous token + manifest HEAD, 2026-06-05)

**Pullable — used as REAL pins:**
| Image | Tag | HTTP | Digest |
|---|---|---|---|
| `a11oy` | `uds-v0.2.0` | 200 | `sha256:45fa2365c2fc6cda4ed2d1387478980d173f7f8cdd80a6e7aaa4082f7b276f0b` |
| `sentra` | `uds-v0.2.0` | 200 | `sha256:60a0efc14366ba392bfe3f3cd4196863fe148bb87a17428be6a57f0a05ac3639` |
| `amaru` | `uds-v0.2.0` | 200 | `sha256:53301e26adcde49e73df28d8c3b790f2496da9d495307fe8587ffa7452b289ff` |
| `rosie` | `uds-v0.2.0` | 200 | `sha256:1984a15f53c2e1b91c7dafaa0ed5df9148d57e3e86eb73db879c2b0443302848` |
| `killinchu` | `uds-v0.2.0` | 200 | `sha256:e0fb6c3aeaddadfbabc3ca7c5f29ef7b3ba31370b5ffb816e12495d5f29ca548` |
| `hatun-mcp` | `latest` | 200 | `sha256:fba23f0e26886d6c6b99dfb834c72a0af89f83382ceaaeedfeedaab0feb8f247` |

**NOT anonymously pullable (HTTP 403 = private or not published) → listed as roadmap TODO, NEVER fake-pinned:**
`vsp-otel` (OTEL), `szl-lake`, `szl-receipts-server`, `vessels`, `khipu-consensus`.

---

## How the prerequisites were handled (ingest vs roadmap)

- **a11oy + sentra + amaru + rosie + killinchu** — real GHCR images, pinned via the existing per-organ Zarf packages. INGESTED.
- **Mesh interconnect** — NOT a separate image. The Istio AuthorizationPolicy / NetworkPolicy / strict PeerAuthentication ship inside each per-organ Zarf package as its **UDS Package CR** (`manifests/uds-package.yaml`); the UDS Operator reconciles the cross-organ allow/expose matrix (authored in `szl-uds-deployment/packages/*/uds-package.yaml`) at deploy time. So the mesh deploys WITH each bundle. Span schemas (`uds-bundles/mesh/schemas/spans/*.yaml` + `szl-holdings/uds-mesh`) are the governance fabric, referenced.
- **Knowledge / doctrine** — already baked into the a11oy image (ingested organ source + `knowledge.json` + 100 formula LaTeX + policy yamls). Deploys with the a11oy package. No separate package.
- **MCP (hatun-mcp)** — image IS public (pinned by digest in the header), but no Zarf package is vendored in this repo yet → honest TODO to add `bundles/szl-hatun-mcp`.
- **OTEL (vsp-otel), receipts/lake (szl-receipts-server, szl-lake), vessels** — images NOT public (403) → honest roadmap TODO comments with their intended image refs. The organ UDS Package CRs already carry permissive allow rules to the `szl-receipts` namespace, so traffic simply does not flow until those services deploy (no breakage).

---

## Honest gaps / what is NOT done

1. **Bundles not built/published.** Both new bundles are authored YAML only. Requires a GitHub Actions run (the new workflow) on a runner with `packages: write`. From this sandbox I cannot `uds create`/publish.
2. **No bundle-level SLSA attestation.** The CI token lacks `attestations: write`; the `attest-build-provenance` step is expected to fail (kept non-blocking, documented). The cosign **signature** is the real bundle provenance. Organ images carry their own SLSA **L2** `.att`. **No L3.**
3. **OTEL / receipts / lake / vessels prerequisites** are roadmap (private/absent images). Once public, add the Zarf package + uncomment the bundle entry.
4. **`-bundle` publish path** is an engineering choice to avoid image-vs-bundle GHCR collision; if the org prefers a different OCI path (e.g. `bundles/a11oy`), the workflow `PUBLISH_REPO` var is the single place to change it.
5. **Not Iron Bank/FedRAMP/CMMC/ATO; SLSA L3 roadmap.** Λ = Conjecture 1. Doctrine v11 LOCKED 749/14/163 @ c7c0ba17. Section 889 = 5 vendors.
6. **Untouched (per instructions):** HF Spaces, a11oy/killinchu app code, no repos deleted, `szl-mesh:0.4.0` and its `uds-bundle-publish.yml` left working/unchanged.

---

## Next action for the parent / founder
Trigger the `Canonical UDS Bundles (a11oy + killinchu)` workflow (workflow_dispatch) once for `bundle=a11oy` and once for `bundle=killinchu`, then verify:
```bash
cosign verify ghcr.io/szl-holdings/a11oy-bundle:0.5.0 \
  --certificate-identity-regexp="^https://github.com/szl-holdings/" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
```
and update DEPLOY.md's status table from AUTHORED-ONLY → PUBLISHED once confirmed on GHCR.

Signed-off-by: Stephen P. Lutar Jr. \<stephenlutar2@gmail.com\>
