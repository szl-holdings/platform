# CURRENT_SECURITY_POSTURE.md — SZL Holdings (honest snapshot)

**Author:** Yachay (CTO authority)
**Date:** 2026-06-01
**Doctrine:** v11 — LOCKED: **749 declarations / 14 axioms (15 raw, 1 dup) / 163 tracked sorries** (112 baseline + 51 Putnam), `lutar-v18.0.0 @ c7c0ba17`, 13-axis Yuyay canonical.
**Scope:** Org `SZLHOLDINGS` (Hugging Face) + `szl-holdings` (GitHub). 8 live HF Spaces, ~20 GitHub repos.
**Stance:** Zero-Bandaid Law. No false certification claims. Where we are weak, we say so in plain language.

> **One-line truth:** We have an unusually strong *governance and provenance substrate* (Lean-proved Λ gate, DSSE receipts, Khipu Merkle DAG, partial keyless signing) sitting on top of a *weak web-edge security posture* (wildcard CORS, zero security headers, no auth on public Spaces) and an *incomplete supply-chain signing/SBOM story* (1 of 6 UDS bundles signed, SLSA L1 not L3). The substrate is sellable; the edge and signing gaps must close before any `.gov`/`.mil` conversation.

---

## 0. Posture scorecard (traffic light)

| Domain | State | Grade |
|---|---|---|
| Secrets handling | HF token at `.secret/hf_token`, file-perm `0600`, never in CI; some app tokens read from env at runtime | 🟡 PARTIAL |
| Code signing (cosign/Sigstore) | **PENDING → now keys generated this session** (see COSIGN_KEY_MATERIAL.md). 1/6 UDS bundles signed keyless | 🔴 → 🟡 |
| SLSA level | **L1 (honest).** NOT L3. CI workflow is mislabeled "SLSA Level 3 Provenance" — honesty flag | 🟡 |
| SBOM coverage | CycloneDX + SPDX generated per repo in CI; **not signed, not attached to bundles, no container SBOMs** | 🟡 |
| Dependency vuln scanning | Trivy in `sbom.yml`, CodeQL + Scorecard live; **no Grype/Anchore, no runtime image scan, no centralized triage** | 🟡 |
| HTTPS/TLS | Provided by HF Spaces edge (TLS termination at platform); no app-level enforcement | 🟢 (inherited) |
| CORS / CSP / headers | **`allow_origins=["*"]` on all FastAPI Spaces; NO CSP/HSTS/X-Frame-Options/etc.** | 🔴 |
| Auth / authz | **No authentication on public Spaces.** Λ gate is policy-authz, not user-authz | 🔴 |
| Audit logs (Khipu DAG) | SHA-256-linked Merkle DAG + DSSE receipts shipped & Lean-proved (TH11); **not centralized, not tamper-evident-stored off-box** | 🟢 substrate / 🟡 ops |

---

## 1. Secrets handling

**Current state (honest):**
- The Hugging Face write token lives at `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token` with file mode `0600` (owner-only). User `betterwithage`, org `SZLHOLDINGS`.
- **All Hugging Face pushes use `HfApi` DIRECT with this token** — never GitHub Actions `secrets.HF_TOKEN`. This is the standing hard rule and it is being honored (confirmed in `530_ENV_PLAN_AND_UDS_DOCS.md`).
- Application secrets (`MAPBOX_ACCESS_TOKEN` in `vessels_main.py`) are read from environment at runtime, not committed.
- `COSIGN_PRIVATE_KEY`, `ZENODO_TOKEN`, and AI-provider keys were **TODO/unprovisioned** in the environment guide.

**Gaps:**
1. A single long-lived HF write token is a single point of compromise. No rotation policy, no scoping to fine-grained per-repo tokens.
2. `/api/config/mapbox-token` in `vessels_main.py` returns the raw Mapbox token to any caller (`{"configured": true, "token": <token>}`) with **wildcard CORS** — this leaks a credential to any origin.
3. No secrets manager (Vault / AWS Secrets Manager / GCP Secret Manager). Secrets are file- and env-based.
4. No pre-commit secret scanning (gitleaks/trufflehog) gate enforced across all repos.

**Patch direction:** migrate to fine-grained HF tokens per repo; stop returning Mapbox token to the client (proxy tiles server-side); add gitleaks pre-commit + CI; adopt a secrets manager before FedRAMP (control IA/SC families require it).

---

## 2. Code signing — Sigstore / cosign

**Current state (honest, per `81_UDS_BUNDLE_VERIFY_MATRIX.md`):**

| Bundle | Version | cosign signature | Verify result |
|---|---|---|---|
| **vessels** | uds-v0.3.0 | ✅ keyless (Fulcio) | ✅ **Verified OK** — Rekor index `1675423172`, integratedTime `1780149076` (2026-05-30T13:51:16Z), SAN `github.com/szl-holdings/vessels/.github/workflows/uds-sign-release.yml@refs/heads/main`, 10-min ephemeral Fulcio cert |
| a11oy | uds-v0.3.0 | ❌ NO `.sig` | PARTIAL — sha256 only |
| amaru | uds-v0.3.1 | ❌ NO `.sig` | PARTIAL — sha256 only |
| sentra | uds-v0.3.1 | ❌ NO `.sig` | PARTIAL — sha256 only |
| rosie | uds-v0.3.0 | ❌ NO `.sig` | PARTIAL — sha256 only |
| uds-mesh | — | ❌ NO `.sig` | UNSIGNED |

- HF mirrors host the `.tar.zst` **only** — no `.sig`/`.sha256`/`.pub` companions uploaded.
- **Net: 1 of 6 bundles signed.** Code-signing status is therefore correctly **PENDING** as a program.
- **This session generated a real cosign key pair** (see `COSIGN_KEY_MATERIAL.md`): SHA-256 public-key fingerprint `1f00187d861dc4fb01c9733a32e26fcb4126709f8614e201d04a099c70e3dbc7`.

**Gap:** 5/6 bundles unsigned; no signed SBOM attestations; no centralized verification gate in deploy. Sigstore provenance is principled (keyless/Fulcio/Rekor proven on vessels) but not yet universal.

---

## 3. SLSA level — **L1 (honest), NOT L3**

- Doctrine v10 honest-disclosure correction (a11oy Space commit `92ac4196`, route `/api/a11oy/v1/honest`) declares **SLSA L1**, correcting a prior mis-claim of L3 (platform PR #235). This is the canonical, honest position.
- **Honesty flag:** the GitHub CI workflow file is still *named* `slsa.yml` / "SLSA Level 3 Provenance" across repos (`13_GITHUB_WORKFLOWS_STATUS.md`). The *name* over-claims; the *attained* level is L1. The vessels release does produce a genuine keyless provenance attestation (Rekor-logged), which is the building block toward L2/L3, but org-wide we are L1.
- **Why L1 and not higher:** L2 requires a hosted, authenticated build service generating signed provenance for *every* artifact; L3 additionally requires non-falsifiable, isolated builds. We have it for one bundle, not the fleet, and the GHCR container-build job is **BROKEN (failing on main)**, so build provenance is not continuous.

**Action:** rename/retire the misleading workflow label OR actually attain what it claims; promote L1→L2 via the cosign plan (COSIGN_KEY_MATERIAL.md §"SLSA L1→L2").

---

## 4. SBOM coverage — CycloneDX per repo, with gaps

**Current state (`13_GITHUB_WORKFLOWS_STATUS.md`, `81_UDS_BUNDLE_VERIFY_MATRIX.md`):**
- `sbom.yml` runs on `main` for the flagship repos and emits **CycloneDX JSON + SPDX JSON + Trivy** — ✅ success on a11oy, amaru, sentra, rosie, vessels.
- GitHub release assets for the 5 non-vessels repos contain **only SBOM JSON** (`*-sbom-2.spdx.json`, `*-sbom.cyclonedx.json`) — no payload, no signature.

**Gaps:**
1. **No container-image SBOMs.** Spaces ship as Docker; the image layers are not SBOM'd (Syft on the built image is missing). Zarf auto-generates SBOM at package build, but our Zarf packaging is staged/incomplete for 5/6 bundles.
2. **SBOMs are not signed and not attached as cosign attestations** to the artifacts they describe (no `cosign attest --type cyclonedx`).
3. **No HF-side SBOM.** HF Spaces carry no SBOM companion.
4. **No transitive/lockfile completeness check** that the SBOM matches the deployed image.

Full per-repo / per-Space / per-image plan: see `SBOM_COMPLETION_PLAN.md`.

---

## 5. Dependency vulnerability scanning

**Current state:**
- **Trivy** runs inside `sbom.yml` (filesystem scan) — ✅.
- **CodeQL** (`codeql.yml`) — ✅ static analysis on main.
- **OpenSSF Scorecard** (`scorecard.yml`) — ✅ supply-chain posture scoring on main.
- **DCO** sign-off gate — mostly ✅ (one open PR branch missing sign-off on vessels).

**Gaps:**
1. **No Grype and no Anchore** in the pipeline (task names them; only Trivy present). Recommend adding Grype for SBOM-driven CVE matching and (optionally) Anchore Enterprise for policy gating if budget allows.
2. **No image scan** of the built Docker images (Trivy is fs-mode, not image-mode).
3. **No centralized vulnerability triage / SLA.** Findings are per-run, not tracked to closure with severity SLAs.
4. **No Dependabot/Renovate** auto-PR confirmed across all repos.
5. **Broken jobs on main:** "Container build + GHCR push" FAILURE on multiple repos; vessels "Tests" FAILURE on main; this means scan coverage of the *actual deployed image* is not guaranteed.

---

## 6. HTTPS / TLS posture per Space

| Space | SDK | TLS | Notes |
|---|---|---|---|
| a11oy | docker | 🟢 platform-terminated | HF edge provides HTTPS + HSTS at the platform domain; app does not set its own |
| amaru | docker | 🟢 platform | same |
| sentra | docker | 🟢 platform | same |
| vessels | docker | 🟢 platform | same |
| rosie | docker | 🟢 platform | same |
| lean-kernel | docker | 🟢 platform | same |
| anatomy-3d | static | 🟢 platform | same |
| uds-demo | static | 🟢 platform | same |
| README | static | 🟢 platform | same |

**Honest note:** TLS is **inherited from the Hugging Face Spaces edge**, not configured by us. This is fine for the demo surface but **does not satisfy FedRAMP/IL controls** (SC-8/SC-13 require our own validated crypto boundary). For `.gov`/`.mil` we must redeploy inside AWS GovCloud / Azure Government / a UDS Core mesh (Istio mTLS) where we own the TLS boundary.

---

## 7. CORS / CSP / security headers per Space

**Current state — CONFIRMED FROM SOURCE (`raw/*_serve.py`, `raw/vessels_main.py`):**

| Space | CORS | CSP | HSTS | X-Frame-Options | X-Content-Type-Options | Referrer-Policy | Permissions-Policy |
|---|---|---|---|---|---|---|---|
| a11oy | `allow_origins=["*"]`, `allow_headers=["*"]` | ❌ none | ❌ none (app) | ❌ | ❌ | ❌ | ❌ |
| amaru | `allow_origins=["*"]` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| sentra | `allow_origins=["*"]` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| vessels | `allow_origins=["*"]` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| rosie | (no explicit middleware found in snapshot) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| static (anatomy-3d, uds-demo, README) | n/a (no server) | ❌ | inherited | ❌ | ❌ | ❌ | ❌ |

**This is the single biggest web-edge weakness.** Wildcard CORS + zero CSP means any third-party origin can call our APIs and our pages have no XSS/clickjacking baseline. The Mapbox-token endpoint compounds this into a credential leak.

**Patch:** see `SECURITY_HEADERS_PATCH.md` with per-Space middleware + static `_headers` files (HfApi push, never CI).

---

## 8. Auth / authz across flagships

**Current state (honest):**
- **No user authentication on any public Space.** The Spaces are open demos.
- What we *do* have is **policy authorization**: the Lean-proved **Λ aggregator gate** scores every decision and can refuse/halt; **HUKLLA** provides 10 pure-predicate tripwires with deadman/halt semantics; every action emits a DSSE-signed Khipu receipt. This is *machine-action authz*, not *human-identity authz*.

**Gap:** there is no identity provider, no RBAC, no session management, no API key issuance. For enterprise/gov this is mandatory (NIST AC + IA families). The clean path is **UDS Core Keycloak SSO + AuthService + Istio** — we inherit IdP, RBAC, and mTLS by deploying inside UDS Core (which already targets IL5), rather than building auth ourselves.

---

## 9. Audit logs — Khipu DAG status

**Current state (strong substrate, per `110_ANATOMY_COMPLETENESS_AUDIT.md`):**
- **KHIPU** (organ #7): 3-tier pendant-cord, summation-invariant **Merkle DAG**, dual-attestation, knot-invariant tag. Code: `rosie/src/khipu-receipt.ts`, `vsp-otel/.../summationInvariant.ts`, cookbook `knot-calculus-v1`. **PASSING** tests (`rosie/tests/khipu-receipt.test.ts`, TH11 fail-mode + dual-attestation). Lean: `Lutar/Khipu/SummationInvariant.lean` (TH11 proven).
- **YAWAR** (organ #4): SHA-256-linked receipt chain + **DSSE-PAE signing** (`a11oy/packages/rae1/src/dsse-pae.ts`, `a11oy/src/sigstore/`, `rosie/packages/api/src/lib/dsse-pae.ts`). Adversarial test `receipt_chain_corruption.test.ts` PASSING.
- This is genuine, tested, Lean-proved **tamper-evident audit logging** — our category-defining asset (the "verifiable nervous system" / Body-of-Evidence).

**Gaps (ops, not substrate):**
1. Receipts are produced **in-process**; there is no off-box, append-only, externally-anchored store (e.g., Rekor for receipts, or a WORM bucket) so an attacker with box access could withhold receipts (not forge them — the chain is integrity-protected, but availability/completeness isn't guaranteed).
2. **KALLPA Wire C** (a11oy→rosie `/v1/events`) is "half-wired" — cross-organ receipt fan-out isn't provably bidirectional yet.
3. No centralized SIEM/log aggregation (Loki/Grafana exists in UDS Core — adopt on deploy).

---

## 10. Top remediation priorities (ordered)

| # | Fix | Effort | Why |
|---|---|---|---|
| P0 | Security headers + lock CORS to allowlist on all 5 docker Spaces; stop leaking Mapbox token | 1 day | Closes the worst public-edge exposure |
| P0 | Sign the 5 unsigned UDS bundles + attach signed CycloneDX attestations | 1–2 days | Moves cosign PENDING→DONE; unblocks UDS deploy |
| P1 | Retire/relabel the "SLSA L3" workflow name; document honest L1; ship L1→L2 plan | 0.5 day | Removes a false claim |
| P1 | Fix broken GHCR container-build + vessels Tests on main | 1–2 days | Restores continuous provenance + scan coverage |
| P1 | Add Grype (SBOM-driven CVE) + image-mode Trivy + central triage SLA | 2–3 days | Real vuln management |
| P2 | Stand up VDP `security.szlholdings.com/.well-known/security.txt` | 0.5 day | Coordinated disclosure front door |
| P2 | Migrate to fine-grained HF tokens + gitleaks pre-commit | 1 day | Reduce secret blast radius |
| P3 | Plan UDS Core deploy (Keycloak SSO, Istio mTLS, Loki) for real authz/TLS/SIEM | program | Gateway to FedRAMP/IL |

---

## Sources

- Internal: `81_UDS_BUNDLE_VERIFY_MATRIX.md`, `13_GITHUB_WORKFLOWS_STATUS.md`, `110_ANATOMY_COMPLETENESS_AUDIT.md`, `150_PLATFORM_TRUST_DEEP_DIVE.md`, `530_ENV_PLAN_AND_UDS_DOCS.md`, `raw/a11oy_serve_LIVE.py`, `raw/vessels_main.py`, `raw/{amaru,sentra}_serve.py`, `hf_spaces_inventory.json`.
- SLSA framework: <https://slsa.dev/spec/v1.0/levels>
- Sigstore/cosign: <https://docs.sigstore.dev/>
- NIST SP 800-53 Rev. 5 control families: <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>
- NIST SP 800-171: <https://csrc.nist.gov/pubs/sp/800/171/r3/final>

*— Yachay, CTO authority, 2026-06-01. Honest security. No bandaid.*
