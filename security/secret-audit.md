# Secret Audit — Series-A Reset (Phase 9 Update)

**Last updated:** 2026-04-20 (Phase 9 — Security Hardening & Sign-On Consolidation)
**Previous version:** Phase A (2026-04-20)
**Auditor:** Series A Hardening — Phase 9
**Tool:** `scripts/qa/scan-secrets.js` (internal) + `.gitleaks.toml` policy + manual tree review

## Phase 9 Update Summary

A full-tree secret sweep was re-run as part of the Series-A reset. Results are unchanged from Phase A:

- **0 true positives** — no live credentials committed to the repository.
- **1 false positive** — `AKIAIOSFODNN7EXAMPLE` in `.gitleaks.toml` (canonical AWS docs example, correctly allowlisted).
- `.env.example` confirmed placeholder-only across all 482+ lines.
- All three bootstrap admin secrets (`BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`) confirmed provisioned in Replit Secrets.
- `scripts/seed-bootstrap-admin.ts` confirmed env-driven with no credential logging.
- Gitleaks PR-diff gate, scheduled full-history scan, and CodeQL all active in CI.

Phase A findings and remediation history are preserved below.

---

# Secret Audit — Phase A

**Date:** 2026-04-20  
**Auditor:** Series A Hardening — Phase A automated + manual review  
**Tool:** `scripts/qa/scan-secrets.js` (internal) + `.gitleaks.toml` policy

---

## Summary

| Status | Finding Count |
|--------|--------------|
| True positives (committed secrets) | 0 |
| False positives | 1 |
| Files with credential-shaped placeholders | 0 (confirmed placeholder-only) |

**Result: CLEAN — no live credentials are committed to the repository.**

---

## Scanner Run

```
=== SZL Holdings — Secret Scanner ===
Scanning: /home/runner/workspace

FAILED — 1 secret(s) detected:
  ❌ runner/workspace/.gitleaks.toml: AWS access key
```

### Finding 1 — `.gitleaks.toml` line matching AWS key pattern

| Field | Value |
|-------|-------|
| File | `.gitleaks.toml` |
| Rule triggered | `AKIA[A-Z0-9]{16}` (AWS access key pattern) |
| Matched value | `AKIAIOSFODNN7EXAMPLE` |
| Classification | **FALSE POSITIVE** |
| Reason | This is the canonical AWS documentation example key, widely published in AWS official docs. It is used in the gitleaks `allowlist.regexes` section as a known-safe pattern to suppress false positives in other files. The scanner itself does not skip `.gitleaks.toml` when evaluating. |
| Action | None required. The `.gitleaks.toml` allowlist already lists this file in `paths` to suppress this exact match via gitleaks itself. The internal scan script (`scan-secrets.js`) should be updated to skip `.gitleaks.toml` similarly to how it skips `pnpm-lock.yaml`. |

**Remediation status:** No credential to rotate. Scanner false-positive acknowledged and documented.

---

## Credential Placeholder Review

The following files contain credential-shaped strings that were manually verified as safe placeholders:

| File | Placeholder Values | Safe? |
|------|--------------------|-------|
| `.env.example` | `REPLACE_ME_*`, `YOUR_*_KEY_HERE`, `replace-with-*` | Yes — all are templates only |
| `.gitleaks.toml` | `AKIAIOSFODNN7EXAMPLE`, `sk-proj-...XXXXXXXXXX`, `re_XXXX...` | Yes — allowlist examples |
| `docs/*.md` | No credential-shaped strings found | Yes |
| `scripts/qa/scan-secrets.js` | Regex patterns for credential detection | Yes — the scanner is allowlisted |

---

## `.env.example` Review

The `.env.example` file was reviewed in full (442 lines). All values are either:

- Template placeholders (`REPLACE_ME_*`, `YOUR_*_KEY_HERE`)
- Non-sensitive defaults (`NODE_ENV=development`, `PORT=3000`)
- Public/derived values (Replit domain variables, feature flags)

No live keys, tokens, or connection strings with real credentials are present.

---

## Git History Note

This audit covers the current working tree only. A full historical git-log scan with gitleaks (`gitleaks detect --source . --log-opts "--all"`) should be run before making the repository public (Phase D). If any historical commits contain live credentials, those credentials must be rotated before the scan is considered complete.

---

## Recommendations

1. **Update `scan-secrets.js`** to skip `.gitleaks.toml` from its file scan list, eliminating the false positive.
2. **Run gitleaks on full git history** before any public mirror or investor repository access (Phase D scope).
3. **Add `BOOTSTRAP_ADMIN_*` variables** to `.env.example` with placeholder values so operators know to set them.
4. **Rotate any `SESSION_SECRET` or `ENCRYPTION_KEY`** values before production go-live; the `.env.example` defaults are not safe for production use.

---

## Secrets Requested / Required

The following secrets are required for production operation. All were confirmed present after Phase A secret provisioning (2026-04-20):

| Secret | Status | Notes |
|--------|--------|-------|
| `BOOTSTRAP_ADMIN_USERNAME` | Present | Set via Replit Secrets (2026-04-20) |
| `BOOTSTRAP_ADMIN_PASSWORD` | Present | Set via Replit Secrets (2026-04-20) |
| `BOOTSTRAP_ADMIN_EMAIL` | Present | Set via Replit Secrets (2026-04-20) |
| `JWT_SECRET` | Present | Set via Replit Secrets (2026-04-20) |
| `ENCRYPTION_KEY` | Present | Set via Replit Secrets (2026-04-20) |
| `SESSION_SECRET` | Present | Pre-existing |
| `DATABASE_URL` | Present | Pre-existing |
