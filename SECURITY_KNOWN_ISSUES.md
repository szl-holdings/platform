# Security — Known Findings and Remediation Status

> **Scope:** This document records measured security findings and their remediation
> status. It is not an advisory allowlist or a risk-acceptance mechanism. Critical and
> High dependency findings block the release in both `pnpm audit` and Grype, and the
> Grype configuration contains no suppressions.
>
> Maintained by: Yachay (CTO), SZL Holdings. Last triage: 2026-08-08.
> Source of truth for live alerts: the GitHub Security tab (Code Scanning,
> Dependabot, and Secret Scanning) on `szl-holdings/platform`.
>
> This process makes no CMMC, FedRAMP, or other certification claim.

---

## 1. Triage summary (2026-08-08)

| Source | Open | Notes |
|---|---|---|
| CodeQL / Code Scanning | 639 after false-positive dismissal | Dominated by code-quality rules; production security findings remain explicitly open below |
| Dependabot | 16 open on protected `main` (3 High, 11 Moderate, 2 Low) | Exact pre-merge API readback; the successor lock resolves `pnpm audit` to zero, but GitHub alert closure still requires protected merge and default-branch re-evaluation |
| Secret Scanning | 0 open | All 3 historical alerts are resolved; push protection is enabled |

The 16 Dependabot alerts are the measured protected-`main` state, not a projected
successor state. Their packages are `brace-expansion`, `fast-uri`, `ip-address`,
`undici`, `hono`, `@hono/node-server`, `body-parser`, `dompurify`, and `protobufjs`.
The exact successor lock and overrides produce zero findings under `pnpm audit
--json`; that local result does not mark the GitHub alerts fixed. After a normal
protected merge, Dependabot must re-evaluate the new default-branch lock before the
open-alert count can be updated.

The bulk of open Code Scanning alerts are non-security code-quality rules
(`js/syntax-error` ×247, `js/unused-local-variable` ×198,
`py/unused-import` ×25, and similar findings). They remain code-health work; they are
not represented as vulnerability exceptions.

---

## 2. Dependency vulnerability gate

The release policy is fail-closed:

- `.grype.yaml` has `ignore: []`, and `.trivyignore` contains no advisory IDs, so
  neither scanner suppresses a dependency finding.
- `scripts/qa/generate-vuln-report.js` treats every Critical or High advisory as a
  blocking finding. It has no exception or allowlist set.
- A malformed, empty, or non-JSON `pnpm audit` response is a gate failure.
- Moderate and Low findings stay visible in the generated report and remain eligible
  for remediation; they do not silently change the Critical/High release threshold.

The mobile dependency tree previously resolved `image-size@1.2.1` through Metro and
exposed the following two High advisories:

| Advisory | Remediation |
|---|---|
| `GHSA-w3rx-r6r6-pgpr` | Replaced the vulnerable ICNS-capable parser with the repository-owned `packages/image-size-safe` package. ICNS is not supported. Reads and directory walks are bounded. |
| `GHSA-5p2g-fcmc-qvqq` | The same replacement intentionally excludes JXL and HEIF and rejects those payload classes fail-closed. |

The replacement preserves the CommonJS API and the exact PNG, JPEG, BMP, GIF, WebP,
PSD, SVG, TIFF, and KTX formats Metro consumes. Tests exercise every declared format,
both file APIs, bounded direct-buffer behavior, format disabling, concurrency, crafted
advisory inputs, and truncated headers. Workspace overrides also move
`@hono/node-server` and `body-parser` to patched releases; compatibility is validated
by the normal exact-head test and typecheck gates.

Historical Python advisory identifiers that appeared in the old Grype ignore file are
not carried forward as exceptions. If any becomes reachable in a future SBOM, the
unsuppressed Grype gate reports it and blocks on High or Critical severity.

---

## 3. Supply-chain and posture findings (informational)

These are posture findings, not dependency exceptions. They remain visible for
follow-up and do not weaken a required check.

| Alert | Finding | Status |
|---|---|---|
| #3065 `SAST` | SAST ran on 21 of 30 recent commits | Open hardening work |
| #3063 `Maintained` | Repository is less than 90 days old | Time-based observation |
| #3062 `CodeReview` | Approved-changeset ratio is low | Process evidence is still accumulating |
| #3026 `BranchProtection` | Scorecard reports branch-protection posture | Governed separately; this document does not authorize a protection change |
| #3041–#3137, #3052–#3061 `Pinned-Dependencies` ×49 | Docker base images or workflow steps reported without immutable pins | Open supply-chain hardening work |

---

## 4. False positives dismissed during triage

| Alert | Rule | Location | Reason |
|---|---|---|---|
| #3024 | `js/file-system-race` | `packages/gateway/test/gateway-e2e.test.ts:208` | The TOCTOU pattern is in an end-to-end harness operating on a test-owned audit-log file; no untrusted actor can access that test path. Dismissed as `false positive`. |

---

## 5. Open production security findings

These findings are not accepted, suppressed, or marked remediated by this document:

- `py/path-injection` — `apps/substrate-inference/engine/ollm/ollm/auto_inference.py:34,136` (#3139, #3140)
- `py/clear-text-logging-sensitive-data` — `ops/meridian/check.py:34` (#3138)
- `js/resource-exhaustion` ×3 — `packages/ouroboros-integrations/src/sovereign-engine.ts` (#3020–#3022)
- `js/cors-misconfiguration-for-credentials` — `services/substrate-mcp-gateway/src/transport/http.ts:414` (#3019)
- `js/loop-bound-injection` — `packages/ouroboros-integrations/src/sovereign-engine.ts:3659` (#3018)
- `js/polynomial-redos` ×3 — `packages/ouroboros-anchor/src/rekor.ts`, `packages/gateway/src/auth.ts` (#3015–#3017)
- `js/missing-rate-limiting` — `apps/alloy-runtime-api/src/routes/v1/ouroboros.ts:226` (#3014)
- `py/log-injection` ×6 — `apps/substrate-inference/engine/ollm/ollm/auto_inference.py` (#3141–#3146)
- `js/http-to-file-access` — `packages/gateway/src/audit.ts:132` (#3025)
- `js/stack-trace-exposure` — `packages/gateway/src/server.ts:48` (#3023)

---

This file describes evidence and policy only. It does not close an alert or alter a
repository protection.
