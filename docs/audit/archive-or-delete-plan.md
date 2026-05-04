# SZL Holdings — Archive or Delete Plan

**Date:** April 16, 2026
**Purpose:** Recommended disposition for every non-production file, directory, or artifact that does not belong in the live platform or the public GitHub mirror
**Out of scope:** Making the actual changes — this plan is input to Phase 2 (Repo Cleanup & Runtime Canonicalization)

---

## Disposition Definitions

| Disposition | Meaning |
|---|---|
| **Keep** | Legitimately in use; no action required |
| **Keep (document)** | Keep but add context doc or README |
| **Quarantine** | Already excluded from public mirror; verify exclusion and do not restore |
| **Archive** | Move to `.archive/` with dated README explaining what it was and why it was archived |
| **Delete** | Remove outright; content is superseded, orphaned, or has no recovery value |
| **Deregister** | Remove from Replit artifact.toml / `.replit` and stop workflows |
| **Investigate** | Requires code-level investigation before a final call |

---

## 1. Artifact Directories

| Path | Current State | Recommended Disposition | Rationale |
|---|---|---|---|
| `artifacts/stephen-site/` | Deprecated (has `DEPRECATED.md`); registered and workflow running | **Delete + Deregister** | Content fully migrated to `szl-holdings` `/founder` route. `DEPRECATED.md` confirms this. Remove from workflow registry, then delete directory. |
| `artifacts/lyte-command-center/` | No `package.json`, no source files; has `dist/` and `vite.config.ts`; workflow appears registered | **Delete** | This is a build artifact orphan — no active source code. Lyte is now served from `szl-holdings`. Safe to delete the directory. Deregister any associated workflow. |
| `artifacts/imperium/` | Only `node_modules/` — no package.json, no source | **Delete** | Empty shell. `node_modules` was likely installed to test a scaffold that was never completed. No recovery value. |
| `artifacts/cortex-mobile/` | Expo `app/` directory present; no `package.json`; active development per task backlog | **Keep (document)** | Active mobile development in progress (CORTEX). Add a `README.md` noting its development state and target scaffold. Do not delete. |
| `artifacts/mockup-sandbox/` | Registered; used for design system component preview | **Keep** | Internal design tooling. No public exposure. Keep registered as internal-only. |

---

## 2. Archive Directory

| Path | Contents | Recommended Disposition | Rationale |
|---|---|---|---|
| `.archive/alloy-archived/` | Archived Alloy subsystem code (prior execution engine iteration) | **Quarantine (already excluded from mirror)** | Already in `.replitignore` / excluded from public mirror. Document contents with a README inside the directory. Do not restore to active codebase. |

---

## 3. Mirror Staging Test

| Path | Contents | Recommended Disposition | Rationale |
|---|---|---|---|
| `.mirror-staging-test/` | `artifacts/` directory from a mirror staging test | **Delete** | One-time test artifact. The mirror staging process is complete; this directory has no ongoing value. |

---

## 4. Attached Assets

| Path | Contents | Recommended Disposition | Rationale |
|---|---|---|---|
| `attached_assets/` | ~18 files: PNG images, AI payload text files, `nohup.out` | **Mixed** — see below | |
| `attached_assets/aegis_nsa_cia_master_payload_1775160901960.txt` | AI-generated payload for Aegis NSA/CIA simulation | **Delete** | Internal agent work artifact; high-sensitivity filename; no production value |
| `attached_assets/alloy_gaps_closure_payload_*.md/.txt` | Two copies of Alloy gap closure AI payloads | **Delete** | Duplicate agent task artifacts |
| `attached_assets/alloy_huggingface_evolution_payload_*.txt` | HuggingFace evolution AI payload | **Delete** | Agent artifact; no production value |
| `attached_assets/alloy_superplatform_evolution_payload_*.txt` | Superplatform evolution AI payload | **Delete** | Agent artifact |
| `attached_assets/image_*.png` (11 files) | Assorted PNG screenshots/images from March–April 2026 | **Investigate** | May be reference screenshots for UI implementation tasks; review each before deleting. If purely reference, delete. |
| `attached_assets/nohup.out` | Empty nohup log (0 bytes) | **Delete** | Empty artifact |

---

## 5. Noisy Root Files

| Path | Contents | Recommended Disposition | Rationale |
|---|---|---|---|
| `nohup.out` (root, if present) | Background process log | **Delete** | Development artifact; confirmed 0 bytes |

---

## 6. GitHub Actions Workflow Files (Scaffolded / Inapplicable)

| File | Status | Recommended Disposition | Rationale |
|---|---|---|---|
| `.github/workflows/nuget-publish.yml` | Scaffolded — .NET not applicable | **Delete** | This is a Node.js/TypeScript platform; .NET package publishing is irrelevant |
| `.github/workflows/maven-publish.yml` | Scaffolded — Java not applicable | **Delete** | Java/Maven not applicable to this stack |
| `.github/workflows/rubygems-publish.yml` | Scaffolded — Ruby not applicable | **Delete** | Ruby not applicable to this stack |
| `.github/workflows/npm-publish.yml` | Not activated | **Keep (document)** | May be useful if `lib/*` packages are published to npm in future |
| `.github/workflows/container-publish.yml` | Not activated | **Keep** | Docker image publishing is part of the enterprise deployment path |
| `.github/workflows/release.yml` | Not activated | **Keep** | Release automation is needed |

---

## 7. Library Anomalies

| Path | Issue | Recommended Disposition | Rationale |
|---|---|---|---|
| `lib/approvals/` | Has `dist/`, `node_modules/`, `tsconfig.tsbuildinfo` but no `package.json` | **Investigate** | Determine if this is an orphaned split-out from another lib or if source was accidentally deleted. If no source, delete the directory. If source exists elsewhere, regularize. |

---

## 8. Seed Scripts (Post-Commercial Cleanup)

| Script | Recommended Disposition | Rationale |
|---|---|---|
| `scripts/seed-demo-data.ts` | **Keep** | Required for demo/staging environment |
| `scripts/seed-pilot-data.ts` | **Keep** | Required for pilot onboarding |
| `scripts/seed-prism-counsel.ts` | **Keep + Fix** | Has known broken recovery table seed — fix before keeping |
| `scripts/upload-seed-data.ts` | **Investigate** | Determine if this is still needed or superseded |

---

## 9. Scripts Directory (Non-Seed Items)

| Path | Contents | Recommended Disposition |
|---|---|---|
| `scripts/github/` | GitHub mirror scripts | **Keep** — active mirror tooling |
| `scripts/qa/` | QA scripts (`qa:site`, `qa:routes`, etc.) | **Keep** |
| `scripts/rollback/` | Rollback scripts | **Keep** |
| `scripts/public-mirror/` | Mirror management scripts | **Keep** |
| `scripts/media/` | Media/asset scripts | **Investigate** |
| `scripts/wiki/` | Wiki tooling | **Investigate** |
| `scripts/generate-screenshots.js` | Automated screenshot capture | **Keep** — used in `capture:screens` npm script |
| `scripts/deploy-mobile.js` | Mobile deploy helper | **Keep** |

---

## 10. Documentation (Superseded by This Audit)

| File | Status | Recommended Disposition |
|---|---|---|
| `docs/audit/public-surface-audit.md` | Prior GitHub overhaul audit; some content superseded | **Keep** — historical record of GitHub overhaul decisions |
| `docs/audit/public-surface-inventory.md` | Public surface inventory from GitHub overhaul | **Keep** — historical |
| `docs/audit/repo-canonicalization-plan.md` | GitHub repo canonicalization plan | **Keep** — still actionable |
| `docs/audit/repo-role-map.md` | Repo role assignments | **Keep** — still authoritative |
| `docs/audit/noise-and-risk-audit.md` | Noise/risk audit for GitHub mirror | **Keep** — still applicable |
| `docs/audit/omega-audit-findings.md` | Omega Phase 0 audit findings | **Keep** — historical baseline |
| `docs/audit/flagship-repo-decision.md` | Decision to use szl-holdings-platform as flagship | **Keep** — decision record |
| `docs/audit/github-overhaul-audit.md` | Full GitHub overhaul audit | **Keep** — historical |

---

## 11. Priority Order for Phase 2 Execution

1. **Immediate / High confidence (delete without investigation):** `.mirror-staging-test/`, `attached_assets/aegis_nsa_cia_master_payload_*.txt`, all `attached_assets/alloy_*.txt/.md`, `attached_assets/nohup.out`, `nohup.out` (root), `artifacts/lyte-command-center/`, `artifacts/imperium/`, `.github/workflows/nuget-publish.yml`, `.github/workflows/maven-publish.yml`, `.github/workflows/rubygems-publish.yml`

2. **After review (deregister then delete):** `artifacts/stephen-site/` (deregister workflow first, then remove directory)

3. **Investigation required before action:** `lib/approvals/`, `attached_assets/image_*.png` (11 files), `scripts/media/`, `scripts/wiki/`, `scripts/upload-seed-data.ts`

4. **Archive with README:** `.archive/alloy-archived/` (add dated context README inside)

---

*Part of growth capital Cleanup — Phase 1 audit. April 2026.*
