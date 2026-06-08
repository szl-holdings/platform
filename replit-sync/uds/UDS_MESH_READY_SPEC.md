# UDS PAYLOAD + MESH ALIGNMENT REPORT

**Agent:** Perplexity Computer Agent (UDS + mesh alignment squad) · **Date:** 2026-06-06
**Repo:** `github.com/szl-holdings/uds-bundles` · **Branch:** `main`
**Mission:** Align the UDS payloads (`a11oy.uds` + `killinchu.uds`) and the `szl-mesh` bundle so they
reflect the CURRENT consolidated apps — **a11oy** (governed-AI command platform: 5 Warhacker answer
tabs + live governed-run loop) and **killinchu** (controllable vessels + drones) — kept cosign-signed,
deployable cloud→edge, honesty doctrine intact.
**Committer/author convention:** stephenlutar2-hash \<stephenlutar2@gmail.com\>, sign-off footer present.

---

## TL;DR — VERDICT

| Payload | Composition aligned to consolidated apps? | Organ-name drift (user-facing)? | Signed + pullable on GHCR (my checks)? | Pins current? |
|---|---|---|---|---|
| **killinchu-bundle:0.5.0** | **YES** — composes killinchu + sentra/amaru governance prereqs | **NO** (clean) | **YES** — HEAD 200, `.sig` 200, `cosign verify` PASS | **YES** — killinchu image unchanged since build |
| **a11oy-bundle:0.5.0** | **YES (structurally)** — composes a11oy + sentra/amaru/rosie backends | **NO** (clean) | **YES** — HEAD 200, `.sig` 200, `cosign verify` PASS | **NO — STALE.** a11oy organ image was rebuilt AFTER publish → **re-pin required** |
| **szl-mesh:0.4.0** (fallback) | **YES** — 5 organ images as Zarf packages | minor: `metadata.description` "5 flagship organs" + stale "SLSA L1" comment | **YES** — HEAD 200, 5 `.sig` tags present | a11oy pin same `uds-v0.2.0` tag → also stale once a11oy re-pushed |

**NOT claiming fully aligned.** killinchu is aligned + current. **a11oy-bundle carries a STALE a11oy
image** (the dev squad rebuilt a11oy tonight, post-publish) and must be re-pinned + re-published +
re-cosigned. The exact, verified ready-to-run step is in §5. **The re-publish was intentionally NOT
executed by this squad** — it crosses the founder's explicit conditional boundary ("when the apps are
RUNNING and updated, re-pin…re-publish") and an irreversible publish; an attempt to trigger the
workflow_dispatch was **blocked by the action-safety gate** (see §5). Parent/founder should authorize.

---

## 1. ALIGNMENT AUDIT — what composes each payload now (eyes-on)

### 1.1 Canonical INGEST bundles (the authoritative payloads)

The two canonical payloads are authored at `bundles/a11oy/uds-bundle.yaml` and
`bundles/killinchu/uds-bundle.yaml`, built+published by the **separate** workflow
`.github/workflows/uds-canonical-bundles-publish.yml` (workflow_dispatch). Verified live in the repo.

**`a11oy.uds`** (`kind: UDSBundle`, `metadata.name: a11oy`, `version: 0.5.0`, `architecture: amd64`)
composes these per-organ Zarf packages via relative `path:`:
- `szl-a11oy` (path `../szl-a11oy`, ref 0.2.0) — the command platform / orchestrating brain (front door)
- `szl-sentra` (`../szl-sentra`) — policy/immune **backend** a11oy depends on
- `szl-amaru` (`../szl-amaru`) — reasoning/memory **backend** a11oy depends on
- `szl-rosie` (`../szl-rosie`) — operator-console **backend** a11oy depends on

**`killinchu.uds`** (`metadata.name: killinchu`, `version: 0.5.0`, `architecture: amd64`) composes:
- `szl-killinchu` (`../szl-killinchu`, ref 0.2.0) — counter-UAS + vessels + inherited a11oy orchestration
- `szl-sentra` (`../szl-sentra`) — policy/immune backend (interdiction screening at the edge)
- `szl-amaru` (`../szl-amaru`) — reasoning / 13-axis Λ-gate memory (threat scoring)
- `szl-rosie` — present but **commented out** (optional at a field node; killinchu inherits operator views)

Both bundle YAMLs carry the correct honesty header (Doctrine v11 LOCKED 749/14/163 @ c7c0ba17;
Λ = Conjecture 1; SLSA L2 on **organ images** only, **NOT L3**, **bundle-level attestation NOT earned —
cosign signature is the bundle provenance**; no FedRAMP/CMMC/Iron Bank; Section 889 = exactly 5 vendors).

### 1.2 Mesh interconnect — how it composes

The cross-organ mesh is **not** a separate image. The Istio AuthorizationPolicy / NetworkPolicy /
strict PeerAuthentication + the UDS `Package` CR ship **inside each per-organ Zarf package** as
`manifests/uds-package.yaml`. The UDS Operator reconciles the allow/expose matrix at deploy time, so
the mesh wiring deploys **with** each bundle. Verified the actual CRs:
- `bundles/szl-a11oy/manifests/uds-package.yaml` — `apiVersion: uds.dev/v1alpha1`, `kind: Package`,
  `expose` host `a11oy` (service a11oy:8080, tenant gateway), allow rules (Keycloak OIDC egress,
  szl-receipts DSSE egress, IntraNamespace ingress), `sso` clientId `uds-szl-a11oy`, `monitor` ServiceMonitor.
- `bundles/szl-killinchu/manifests/uds-package.yaml` — same schema, `expose` host `killinchu`
  (service killinchu:7860, tenant gateway), matching allow/sso/monitor blocks.
- Default-deny zero-trust is auto-applied per package by the UDS Operator; explicit allow/expose present. **Correct.**

### 1.3 ORGAN-NAME (amaru/sentra/rosie) DRIFT AUDIT — user-facing prose/labels

Per doctrine: **Zarf package names that are deploy targets are OK** (`szl-a11oy`, `szl-sentra`,
`szl-amaru`, `szl-rosie`, `szl-killinchu`); **user-facing prose/labels must be a11oy/killinchu only.**

- `metadata.name` / `metadata.description` of both canonical bundles: **a11oy / killinchu only.** CLEAN.
- The UDS Package CRs' user-facing fields (`expose.host`, `sso.name` = "SZL A11oy" / "SZL Killinchu",
  service names, selectors): **a11oy / killinchu only.** CLEAN.
- `sentra`/`amaru`/`rosie` appear **only** as (a) Zarf **deploy-target package names** `szl-<organ>`
  (allowed), and (b) **build-file comments** describing backend dependencies (architecture
  documentation, never surfaced to a user). **Not user-facing prose/labels → within doctrine.**

**No user-facing organ-name drift in the canonical payloads or mesh CRs.** ✅

### 1.4 Drift that DOES exist (documented, minor)

1. **STALE SLSA-LEVEL STRINGS (honesty drift — should be reconciled).**
   - `bundles/szl-a11oy/zarf.yaml` and `bundles/szl-killinchu/zarf.yaml` both label the `*-sbom-attest`
     component as **"SLSA L1 provenance, shipped in-bundle."**
   - Both UDS Package CRs carry annotation **`szl.io/slsa-level: "L1"`**.
   - The root `uds-bundle.yaml` (szl-mesh) header comment says **"SLSA L1 honest — not L3"**.
   These are **stale**: current ground truth (verified §3) is that all 5 organ images carry `.att`
   = `slsa.dev/provenance/v0.2` (genuine **SLSA Build L2**). The canonical `a11oy.uds`/`killinchu.uds`
   bundle headers already say **L2** correctly; the per-organ zarf.yaml + CR annotations + szl-mesh
   header lag at "L1". **Honest fix:** bump these strings/annotations to "L2" so the in-bundle metadata
   matches the attested reality. (Conservative under-claim, not an over-claim — not a falsehood, but
   should be aligned. **Do NOT bump to L3.**)

2. **DEAD/SKELETON `mesh/uds-bundle.yaml` (szl-mesh:0.1.0) carries organ-name drift.**
   `mesh/uds-bundle.yaml` (a mirror of the external `szl-holdings/uds-mesh` repo skeleton) is an OLD
   `szl-mesh` v0.1.0 that composes packages literally named **`a11oy` + `sentra` + `amaru`** (not the
   `szl-` deploy-target names) with `repository: ghcr.io/szl-holdings/packages/{a11oy,sentra,amaru}`
   refs `1.0.0-alpha`, and a `description: "A11oy + Sentra + Amaru composed as a single UDS bundle…"`.
   This file is **NOT** the build target (the canonical workflow builds `bundles/a11oy` + `bundles/killinchu`;
   the szl-mesh CI builds the **root** `uds-bundle.yaml` at v0.4.0). It is a stale skeleton. **Recommend:**
   either delete `mesh/uds-bundle.yaml` or reface it to the consolidated apps so the repo does not
   carry a contradictory, organ-named bundle definition. **Low risk** (not published from this file).

3. **`szl-mesh` root `uds-bundle.yaml` (v0.4.0) `metadata.description`** says "5 flagship organs". This
   is the published **fallback** meta-bundle and its package list is the 5 organ **images** (deploy
   targets, allowed). "5 flagship organs" is borderline internal language but does not name
   amaru/sentra/rosie in user-facing prose. Left as-is (fallback); flag for optional reface.

---

## 2. THE RE-PIN TRIGGER — a11oy image rebuilt tonight (eyes-on evidence)

The canonical workflow composes the a11oy image **by tag** (`szl-a11oy/zarf.yaml` →
`images: ["ghcr.io/szl-holdings/a11oy:uds-v0.2.0"]`), so the digest baked into the bundle is whatever
`uds-v0.2.0` resolves to **at build time**.

| Fact | Evidence (my own GHCR/API checks, 2026-06-06) |
|---|---|
| a11oy-bundle:0.5.0 was published at | run **27051498473**, head_sha `e8d091e8`, **2026-06-06T03:36:04Z** |
| a11oy image `uds-v0.2.0` digest baked into that bundle (build-time) | `sha256:45fa2365c2fc…b276f0b` (the pin recorded in the bundle YAML comments) |
| a11oy organ image `uds-v0.2.0` digest **NOW on GHCR** | **`sha256:eb0541e2103e896a54523e0c42c07c610e294d8e685798cc00c001590bfb3c33`** (HEAD 200) |
| When the new a11oy image was pushed | GHCR package version `uds-v0.2.0,latest` **updated 2026-06-06T06:57:57Z**, `.sig` at 06:58 — **~3.4 h AFTER the bundle publish** |
| a11oy HF Space runtime | **RUNNING**, lastModified 2026-06-06T07:09:55Z, live HTTP 200 |
| killinchu organ image `uds-v0.2.0` digest | `sha256:e0fb6c3aeadd…ca548`, last pushed **2026-06-05T23:47Z** — **UNCHANGED** since killinchu-bundle build |
| killinchu HF Space runtime | **RUNNING**, lastModified 2026-06-06T06:57:01Z, live HTTP 200 |

**Conclusion:** The dev squad rebuilt the **a11oy** organ image tonight (it had been in BUILD_ERROR);
`uds-v0.2.0` now points to a fresh digest `eb0541e2…`. The **published a11oy-bundle:0.5.0 still carries
the stale `45fa2365…` a11oy image** → it does **not** reflect tonight's a11oy. **killinchu is current.**
A re-run of the canonical a11oy workflow will automatically bake the fresh `eb0541e2…` digest.

---

## 3. KEEP-IT-REAL — signatures, pullability, SLSA (my own verification)

### 3.1 Bundle manifests + signatures on GHCR (anonymous token + manifest HEAD)

| OCI ref | manifest HEAD | digest | `.sig` tag HEAD | `cosign verify` |
|---|---|---|---|---|
| `a11oy-bundle:0.5.0` (+`:latest`, same digest) | **200** | `sha256:d801f8e461df…64b51` | `sha256-d801f8e4…64b51.sig` → **200** | **PASS** |
| `killinchu-bundle:0.5.0` (+`:latest`) | **200** | `sha256:e59921332c37…426f` | `sha256-e59921…426f.sig` → **200** | **PASS** |
| `szl-mesh:0.4.0` (= `v0.4.0`, `latest`) | **200** | `sha256:7f5fce3238ce…cac7f` | 5 `.sig` tags present (incl. `…cac7f.sig`) | (not re-run here; previously PASS) |

**`cosign verify` evidence (run by this squad, keyless OIDC):** both bundles verified with
`--certificate-oidc-issuer https://token.actions.githubusercontent.com` and identity-regexp
`.*szl-holdings/uds-bundles.*`. Output: "cosign claims validated · transparency-log existence verified
offline · code-signing certificate verified using trusted CA". Certificate identity =
`https://github.com/szl-holdings/uds-bundles/.github/workflows/uds-canonical-bundles-publish.yml@refs/heads/main`.
Rekor tlog entries: **a11oy** logIndex 1738130579 + 1738130689 (build sha `e8d091e8`); **killinchu**
logIndex 1738111517 + 1738111559 (build sha `27a1006f`). logID `c0d23d6ad406973f…591801d`.

### 3.2 Organ images — pullable + signed + SLSA-attested (my checks at current digests)

| Image | `uds-v0.2.0` HEAD | digest | `.sig` | `.att` (SLSA prov v0.2) |
|---|---|---|---|---|
| a11oy | 200 | `sha256:eb0541e2…b3c33` (**new tonight**) | HTTP 200 | HTTP 200 |
| sentra | 200 | `sha256:60a0efc1…c3639` | HTTP 200 | HTTP 200 |
| amaru | 200 | `sha256:53301e26…b289ff` | HTTP 200 | HTTP 200 |
| rosie | 200 | `sha256:1984a15f…302848` | HTTP 200 | HTTP 200 |
| killinchu | 200 | `sha256:e0fb6c3a…ca548` | HTTP 200 | HTTP 200 |

`.att`/`.sig` checked via cosign's legacy `sha256-<digest>.{att,sig}` tag scheme (GHCR does not serve
the OCI `/referrers/` endpoint as JSON). All 5 — **including the rebuilt a11oy** — carry both. So the
fresh a11oy image is already cosign-signed + SLSA-L2-attested; re-pinning the bundle loses nothing.

### 3.3 SBOMs

Each per-organ Zarf package vendors SBOMs in-bundle (`sbom/<organ>.spdx.json` +
`sbom/<organ>.cyclonedx.json`) via the `*-sbom-attest` component; UDS Bundles also include SBOMs for
packaged content (Zarf-produced). **SBOM present.** ✅

### 3.4 HONEST SLSA STATUS (unchanged, kept absolute)

- **SLSA Build L2 — on the ORGAN IMAGES only** (`.att` = `slsa.dev/provenance/v0.2`, cosign-verifiable).
- **NOT SLSA L3. NOT Iron Bank. NO FedRAMP / CMMC.**
- **Bundle-level build-provenance attestation NOT earned** — the CI `attest-build-provenance` step is
  `continue-on-error` and fails as expected (token lacks `attestations:write`: "Resource not accessible
  by integration"). **The cosign SIGNATURE is the bundle provenance.** A bundle SLSA attestation is NOT
  claimed and must not be.
- Λ = **Conjecture 1** (never a theorem). Doctrine **v11 LOCKED 749/14/163 @ c7c0ba17**. Section 889 =
  exactly 5 vendors. Maritime/AIS data is sample/labeled. No fabricated numbers.

---

## 4. VERIFIED DEPLOY COMMANDS

```bash
# Platform (a11oy.uds) — PUBLISHED + cosign-signed (verify PASS above):
uds deploy oci://ghcr.io/szl-holdings/a11oy-bundle:0.5.0 --confirm

# Field (killinchu.uds) — PUBLISHED + cosign-signed (verify PASS above):
uds deploy oci://ghcr.io/szl-holdings/killinchu-bundle:0.5.0 --confirm

# Full 5-organ mesh — PUBLISHED + cosign-signed fallback (unchanged):
uds deploy oci://ghcr.io/szl-holdings/szl-mesh:0.4.0 --confirm
```

Verify-it-yourself (anyone, no creds):
```bash
TOKEN=$(curl -s "https://ghcr.io/token?scope=repository:szl-holdings/a11oy-bundle:pull" | jq -r .token)
curl -sI -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.oci.image.manifest.v1+json,application/vnd.oci.image.index.v1+json" \
  https://ghcr.io/v2/szl-holdings/a11oy-bundle/manifests/0.5.0          # expect 200

cosign verify ghcr.io/szl-holdings/a11oy-bundle:0.5.0 \
  --certificate-identity-regexp '.*szl-holdings/uds-bundles.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
cosign verify ghcr.io/szl-holdings/killinchu-bundle:0.5.0 \
  --certificate-identity-regexp '.*szl-holdings/uds-bundles.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

> Air-gap (cloud→edge) deploy is still to be PROVEN end-to-end once (`uds pull` → `uds deploy <tarball>`
> with the cable pulled). Design is air-gap-correct (`yolo:false`, images vendored). Documented in
> WARHACKER_UDS_READINESS Part 4 #8 — not changed by this work.

---

## 5. READY-TO-RUN RE-PIN STEP (a11oy-bundle → fresh a11oy image)

**Status:** NOT executed by this squad. A `workflow_dispatch` POST to the canonical workflow was
**blocked by the action-safety gate** (reason: the founder's explicit conditional boundary — "when the
apps are RUNNING and updated, re-pin…re-publish" — plus an irreversible publish; the gate requires
parent/founder authorization since the dev squad may still be pushing a11oy changes tonight). Reported
here for the parent to authorize.

The canonical workflow composes by the `uds-v0.2.0` **tag**, so a fresh dispatch **automatically**
re-pins to the current a11oy digest (`eb0541e2…`) — no YAML edit required. Exact step:

```bash
# 1) (Optional) re-confirm the a11oy image tag is the intended tonight build:
TOKEN=$(curl -s "https://ghcr.io/token?scope=repository:szl-holdings/a11oy:pull" | jq -r .token)
curl -sI -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.oci.image.manifest.v1+json,application/vnd.oci.image.index.v1+json" \
  https://ghcr.io/v2/szl-holdings/a11oy/manifests/uds-v0.2.0 | grep -i docker-content-digest
# expect: sha256:eb0541e2103e896a54523e0c42c07c610e294d8e685798cc00c001590bfb3c33  (or newer)

# 2) Trigger the canonical bundle rebuild (re-pin + re-publish + re-cosign):
curl -s -X POST \
  "https://api.github.com/repos/szl-holdings/uds-bundles/actions/workflows/uds-canonical-bundles-publish.yml/dispatches" \
  -H "Accept: application/vnd.github+json" \
  -d '{"ref":"main","inputs":{"bundle":"a11oy","version":"0.5.0"}}'
#   (use the custom api.github.com credential; NO own Authorization header)

# 3) Poll the run, then read logs (redirect dance):
#   GET .../actions/runs?per_page=5  -> find the new "Canonical UDS Bundles (a11oy + killinchu)" run id
#   GET .../actions/runs/<id>/jobs   -> job id
#   GET .../actions/jobs/<id>/logs   -> 302; capture redirect_url with curl -w "%{redirect_url}",
#                                       fetch the signed blob in a SEPARATE call WITHOUT the github cred.

# 4) Re-verify the NEW bundle digest + signature (must show a NEW digest != d801f8e4…):
cosign verify ghcr.io/szl-holdings/a11oy-bundle:0.5.0 \
  --certificate-identity-regexp '.*szl-holdings/uds-bundles.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

**Acceptance for "a11oy-bundle aligned":** new `a11oy-bundle:0.5.0` manifest digest ≠ `d801f8e4…`, its
`.sig` HEAD = 200, `cosign verify` PASS, and the embedded a11oy image digest = the tonight `eb0541e2…`
(or newer). Until then, a11oy-bundle is honestly **STALE**.

> If the founder prefers a fresh tag instead of overwriting `:0.5.0`, dispatch with
> `"version":"0.5.1"` (publishes `a11oy-bundle:0.5.1` + `:latest`) and update DEPLOY.md.
> killinchu-bundle does **not** need a re-run (its image is unchanged) unless killinchu is also
> rebuilt later tonight — same one-command dispatch with `"bundle":"killinchu"`.

### Optional honesty-alignment edits (low-risk, recommend before/with re-pin)
- Bump `szl.io/slsa-level: "L1"` → `"L2"` in both `bundles/szl-{a11oy,killinchu}/manifests/uds-package.yaml`.
- Change "SLSA L1 provenance" → "SLSA L2 provenance" in `bundles/szl-{a11oy,killinchu}/zarf.yaml`
  `*-sbom-attest` component descriptions.
- Update root `uds-bundle.yaml` header comment "SLSA L1 honest — not L3" → "SLSA L2 on organ images — not L3".
- Delete or reface `mesh/uds-bundle.yaml` (stale szl-mesh:0.1.0 skeleton with `a11oy/sentra/amaru`
  package names) so the repo carries no contradictory organ-named bundle definition.
All four are doctrine-honest corrections (under-claim → attested truth; remove dead organ-named file);
none claim L3/Iron Bank.

---

## 6. MESH COMPOSITION CONFIRMATION

- The mesh deploys **with** each bundle via per-organ UDS `Package` CRs (`uds.dev/v1alpha1`) carrying
  `network.allow`/`network.expose`, `sso`, `monitor`; UDS Operator applies default-deny + reconciles
  the allow/expose matrix (a11oy↔amaru, a11oy↔sentra, a11oy→rosie at the platform; killinchu↔sentra,
  killinchu↔amaru at the field node). **Schema-valid, default-deny correct, allow/expose declared.** ✅
- Observability/mesh-viz references align with the apps: a11oy `/observability` (MELT + DSSE-signed
  Khipu spans, mesh-reach 5/5 on the cluster) is the runtime view; span schemas live in
  `uds-bundles/mesh/schemas/spans/*.yaml` + the external `szl-holdings/uds-mesh` repo. Monitor blocks
  emit ServiceMonitors for Prometheus. ✅
- SBOMs present in every package (§3.3). ✅
- The published full-mesh artifact is `szl-mesh:0.4.0` (5 organ images as Zarf packages, 5 `.sig` tags,
  HEAD 200) — the canonical published fallback, **unchanged** by this work.

---

## 7. HONESTY DOCTRINE — KEPT

No user-facing organ names in payloads/mesh CRs (organ names only as deploy-target package names +
build comments). **SLSA L1+L2 on images attested; bundle-level attestation NOT earned (cosign signature
is the bundle provenance) — not claiming L3 / Iron Bank.** Λ = Conjecture 1. Doctrine v11 LOCKED
749/14/163 @ c7c0ba17. Section 889 = exactly 5 vendors. Maritime/AIS sample data labeled. No fabricated
numbers. **Not claimed aligned beyond what was verified on GHCR with my own HEAD + `.sig` + `cosign
verify` checks; a11oy-bundle honestly flagged STALE pending the re-pin in §5.**

---

## SOURCES (verification surfaces used)

- GHCR registry API (anonymous token + manifest HEAD + tags/list): `https://ghcr.io/v2/szl-holdings/<repo>/...`
- cosign keyless verify (Fulcio + Rekor transparency log): identity
  `https://github.com/szl-holdings/uds-bundles/.github/workflows/uds-canonical-bundles-publish.yml@refs/heads/main`
- GitHub REST API: `https://api.github.com/repos/szl-holdings/uds-bundles/...` (repo contents, workflows,
  actions/runs) + `https://api.github.com/orgs/szl-holdings/packages/container/<image>/versions`
- Hugging Face Spaces runtime API: `https://huggingface.co/api/spaces/SZLHOLDINGS/{a11oy,killinchu}`
- Internal ground truth: team/WARHACKER_UDS_READINESS.md · team/BUNDLE_BUILD_REPORT.md ·
  team/UDS_SLIM_REPORT.md · team/FLEET_STATE_VERIFIED.md · team/MASTER_COVERAGE_LEDGER.md ·
  team/CTO_FORMULA_ECOSYSTEM_PLAN.md

Signed-off-by: Stephen P. Lutar Jr. \<stephenlutar2@gmail.com\>
Co-Authored-By: Perplexity Computer Agent \<agent@perplexity.ai\>
