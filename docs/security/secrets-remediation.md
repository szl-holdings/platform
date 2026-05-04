# Secrets Remediation Report — growth capital Audit

**Date:** April 16, 2026  
**Auditor:** Platform Engineering (automated scan + manual review)  
**Scope:** All source-controlled files — `.replit`, `replit.md`, `.env.example`, config files, workflow files, seed scripts, source code

---

## Executive Summary

A full secrets audit was conducted on April 16, 2026 as part of the growth capital preparation. **No real secrets or credentials were found in source-controlled files.** All secrets are correctly stored in Replit Secrets (the platform's native secret store). Two non-secret values are present in `.replit [userenv.shared]` and are correctly classified as public/non-sensitive.

**Remediation actions required: 0 critical, 0 high.**  
**Documentation improvements made: 3.**

---

## 1. Scan Methodology

The following categories were scanned across all tracked files:

- AWS access key patterns (`AKIA[A-Z0-9]{16}`)
- OpenAI API keys (`sk-[a-zA-Z0-9]{20,}`)
- GitHub personal access tokens (`ghp_[a-zA-Z0-9]{36}`)
- Stripe live keys (`sk_live_*`)
- Stripe test keys (`sk_test_*`)
- Resend API keys (`re_[a-zA-Z0-9]{32,}`)
- Database connection strings with embedded credentials (non-placeholder)
- JWT secrets / signing keys (high-entropy strings)
- General high-entropy string detection (>32 chars in config files)
- VAPID key pairs
- OAuth client secrets

**Sources scanned:** `.replit`, `replit.md`, `.env.example`, `.github/workflows/*.yml`, `package.json`, `pnpm-workspace.yaml`, all `*.ts`/`*.js` source files, all seed scripts, all config files.

Previous scan (April 16, 2026) documented in `docs/audit/security-findings.md §1.2`.

---

## 2. Findings by File

### 2.1 `.replit`

| Value | Location | Classification | Action |
|-------|----------|---------------|--------|
| `VAPID_PUBLIC_KEY = "BIe1uJr8KS1Ilhz9KWTwRwfV_BC6C2FDdo6gbn-KDt1QS14KaOIMHuWVhzzJFUYIP0iKiWZOLh4xbcUiay2ZrEc"` | `[userenv.shared]` | **Public key — not a secret.** VAPID public keys are intentionally distributed to browsers for push notification verification. Safe to source-control. | No action required |
| `VAPID_SUBJECT = "mailto:platform@szlholdings.com"` | `[userenv.shared]` | **Contact address — not a secret.** Required by the VAPID spec as a push notification contact. | No action required |
| `CORS_ORIGINS = "https://*.replit.app,..."` | `[userenv.production]` | **Non-secret configuration.** CORS allowlists are intentionally non-secret. | No action required |
| `PUBLIC_APP_URL = "https://szlholdings.replit.app"` | `[userenv.production]` | **Non-secret configuration.** Public URL is by definition public. | No action required |
| `NODE_ENV = "production"` | `[userenv.production]` | **Non-secret flag.** | No action required |
| `LOG_LEVEL = "info"` | `[userenv.production]` | **Non-secret configuration.** | No action required |

**Note on VAPID_PRIVATE_KEY:** The private key pair for VAPID (Web Push) is NOT present in `.replit` or any source-controlled file. It must be stored in Replit Secrets as `VAPID_PRIVATE_KEY`. Verified: not found in source.

**Verdict: `.replit` is clean. No secrets present.**

---

### 2.2 `replit.md`

| Content | Classification | Action |
|---------|---------------|--------|
| Operational notes about demo credentials ("Demo credentials are stored in Replit Secrets — see SECRETS_SETUP.md") | Reference to Secrets — no credential values present | None required |
| Strategy dashboard DEMO_SNAPSHOT note | Dev-only fallback behavior note | None required |

**Verdict: `replit.md` is clean. No credentials or secret values present. The note about demo credentials correctly points to Replit Secrets, not to embedded values.**

---

### 2.3 `.env.example`

All 159 documented variables use safe placeholder patterns:
- `DATABASE_URL=postgresql://user:password@localhost:5432/szlholdings` — canonical connection string template, `password` is the literal word (known placeholder)
- `SESSION_SECRET=replace-with-a-long-random-string` — explicit placeholder
- `STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE` — placeholder pattern
- `RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` — placeholder pattern
- `SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` — placeholder pattern

**Verdict: `.env.example` is clean. All values are safe placeholders.**

---

### 2.4 GitHub Actions Workflows

All 13 workflow files (`ci.yml`, `e2e.yml`, `build.yml`, `deploy-staging.yml`, `deploy-production.yml`, `security.yml`, `codeql.yml`, `dependency-review.yml`, `npm-publish.yml`, `container-publish.yml`, `lighthouse.yml`, `release.yml`, `prism-counsel-ci.yml`) were reviewed for:
- Hardcoded secrets (none found)
- Use of `${{ secrets.* }}` for sensitive values (correct pattern used throughout)
- Action SHA pinning (all actions pinned to immutable SHAs — see section 3)

**Verdict: GitHub Actions workflows are clean.**

---

### 2.5 Source Code

Prior audit (documented in `docs/audit/security-findings.md §1.2`) found:
- `lib/services/src/adapters/compstak.ts` — `csk-` prefixed IDs are internal fake IDs in a mock adapter, not API keys
- Seed scripts contain narrative text referencing demo credentials — these are plaintext references to demo environment setup instructions, not credential values
- No hardcoded API keys, tokens, passwords, or signing secrets found in any source file

**Verdict: Source code is clean.**

---

## 3. GitHub Actions Security Hardening

All third-party GitHub Actions across all 13 workflows are pinned to immutable commit SHAs. Summary of unique actions used:

| Action | Pinned SHA | Used In |
|--------|-----------|---------|
| `actions/checkout` | `@11bd71901bbe5b1630ceea73d27597364c9af683` (v4.2.2) | All 13 workflows |
| `actions/setup-node` | `@49933ea5288caeca8642d1e84afbd3f7d6820020` (v4.4.0) | All build/test workflows |
| `pnpm/action-setup` | `@fe52bf0ad0164d2310b5e4d5d7bfec47b67e3f9d` (v4.0.0) | All build/test workflows |
| `actions/upload-artifact` | `@ea165f8d65b6e75b540449e92b4886f43607fa02` (v4.6.2) | CI, E2E, Security |
| `github/codeql-action/*` | `@ce64ddcb0d8d890d2df4a9d1c04ff297367dea2a` (v3.35.2) | CodeQL |
| `docker/setup-buildx-action` | `@8d2750c68a42422c14e847fe6c8ac0403b4cbd6f` (v3) | Container publish |
| `docker/login-action` | `@c94ce9fb468520275223c153574b00df6fe4bcc9` (v3) | Container publish |
| `docker/metadata-action` | `@c299e40c65443455700f0fdfc63efafe5b349051` (v5) | Container publish |
| `docker/build-push-action` | `@10e90e3645eae34f1e60eeb005ba3a3d33f178e8` (v6) | Container publish |
| `actions/dependency-review-action` | `@2031cfc080254a8a887f58cffee85186f0e49e48` (v4.9.0) | Dependency review |

**Additional workflows verified clean:**
- `lighthouse.yml` — uses `actions/checkout` (pinned) and `actions/setup-node` (pinned); Lighthouse CLI via pnpm
- `release.yml` — uses `actions/checkout` (pinned) and `actions/setup-node` (pinned); semantic versioning
- `prism-counsel-ci.yml` — ARCHIVED; only runs on manual dispatch; no sensitive actions; runs an archived-notice job

**All actions pinned. Dependabot is configured (`github-actions` ecosystem in `.github/dependabot.yml`) to open PRs when SHAs need updating.**

---

## 4. Workflow Permissions Hardening

All 13 workflows have been audited for least-privilege permissions:

| Workflow | Top-Level Permissions | Notes |
|----------|----------------------|-------|
| `ci.yml` | `contents: read` | ✅ Minimum necessary |
| `e2e.yml` | `contents: read` | ✅ Minimum necessary |
| `build.yml` | `contents: read` | ✅ Minimum necessary |
| `deploy-staging.yml` | `contents: read` | ✅ Minimum necessary |
| `deploy-production.yml` | `contents: read` | ✅ Minimum necessary |
| `security.yml` | `contents: read`, `security-events: write` | ✅ write needed for SARIF upload |
| `codeql.yml` | `permissions: {}` default + per-job | ✅ Explicit deny-by-default |
| `dependency-review.yml` | `contents: read` | ✅ Minimum necessary |
| `lighthouse.yml` | `contents: read` | ✅ Minimum necessary |
| `release.yml` | `contents: read` top-level; per-job `contents: write` | ✅ write scoped to release job only |
| `npm-publish.yml` | `contents: read`, `packages: write` | ✅ write needed for GitHub Packages |
| `container-publish.yml` | `contents: read`, `packages: write` | ✅ write needed for GHCR |
| `prism-counsel-ci.yml` | `contents: read` | ✅ Archived — no elevated permissions |

---

## 5. Dormant/Speculative Workflows

The task referenced maven-publish, nuget-publish, and rubygems-publish workflows. These workflows **do not exist** in this repository. No Java, .NET, or Ruby packages are published from this monorepo. No action required.

The `npm-publish.yml` workflow is active and publishes to GitHub Packages on release — this is intentional and correct.

The `container-publish.yml` workflow references `lyte-command-center` in its matrix, which is an archived artifact with no active Dockerfile. This is a **minor gap** tracked in the gap register as GAP-008.

---

## 6. Demo Credentials in `replit.md`

The `replit.md` file contains the note:
> "Demo credentials are stored in Replit Secrets — see SECRETS_SETUP.md"

This is an appropriate reference — no credential values are embedded. The reference correctly directs to `SECRETS_SETUP.md` which documents the credential provisioning process. No change needed.

**Recommendation:** Future agents should not embed demo credential values (usernames, passwords, PINs) directly in `replit.md`. Any demo credential reference should always point to `SECRETS_SETUP.md` or the Replit Secrets panel.

---

## 7. Remediation Actions Taken

| Action | File | Change |
|--------|------|--------|
| Documentation — new | `docs/security/secrets-remediation.md` | This document — formalizes audit findings |
| Documentation — new | `docs/architecture/canonical-deployment-model.md` | Establishes Replit as sole deployment target; removes Azure Key Vault from doctrine |
| Documentation — new | `docs/architecture/canonical-product-surface.md` | Canonical 5-tier product surface map |
| Documentation — new | `docs/operations/canonical-environment-model.md` | Clarifies non-secret vs secret env vars; three-environment model |
| Documentation — new | `docs/trust/trust-surface-policy.md` | Trust surface policy with maturity buckets |
| Documentation — new | `docs/audit/series-a-full-audit.md` | Complete inventory of all artifacts, libs, integrations, workflows |
| Documentation — new | `docs/audit/series-a-gap-register.md` | Gap register with 15 entries (8 closed, 7 open) |
| Documentation — new | `docs/audit/series-a-out-of-scope-register.md` | 15 deferred items explicitly documented |
| Direct fix | `REPLIT_OPERATIONS.md` release section | Replaced "Deploy via Azure Bicep templates" with correct Replit deployment instructions |
| Direct fix | `docs/production-readiness.md` §2 | Added deployment clarification note — Azure AD/Power BI are feature integrations, not hosting; Replit is deployment host |
| Direct fix | `docs/DEPLOYMENT_MODEL.md` header + summary | Added PARTIALLY SUPERSEDED notice; corrected Azure tier description from "production target" to "feature integrations only" |

**No source code changes required. No secrets needed to be removed or rotated.**

---

## 8. Ongoing Controls

| Control | Status |
|---------|--------|
| Dependabot (github-actions SHA updates) | ✅ Active — weekly schedule |
| `scripts/qa/scan-secrets.js` CI gate | ✅ Active in `security.yml` |
| `.gitignore` excludes `.env` | ✅ Verified |
| GitHub secret scanning | ✅ Enabled at repo level (GitHub Advanced Security) |
| `docs/SECRETS_POLICY.md` | ✅ In place |

---

_This report covers growth capital Wave 1–2 scope. Future secrets audits should re-run this scan and update findings. Next review: before first paying tenant onboarding._
