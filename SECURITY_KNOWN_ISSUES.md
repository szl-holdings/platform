# Security — Known Issues & Accepted Risk Register

> **Scope:** This document records security findings that are **known, triaged, and
> currently accepted or deferred** under the SZL Holdings vulnerability-management
> process. It follows good vulnerability-management hygiene (identification, remediation, documented risk acceptance) — SZL makes NO CMMC, FedRAMP, or certification claim
> (vulnerability identification, remediation, and documented risk acceptance) and to
> provide an auditable trail of transitive / unfixable vulnerabilities.
>
> Maintained by: Yachay (CTO), SZL Holdings. Last triage: 2026-08-08.
> Source of truth for live alerts: GitHub Security tab (Code Scanning / Dependabot /
> Secret Scanning) on `szl-holdings/platform`.

---

## 1. Triage summary (2026-08-08)

| Source | Open | Notes |
|---|---|---|
| CodeQL / Code Scanning | 639 (after FP dismissal) | Dominated by code-quality rules; 17 high + 57 medium security-scored remain for review |
| Dependabot | 0 open | All 65 historical alerts are in `fixed` state |
| Secret Scanning | 0 open | All 3 historical alerts `resolved`; push-protection enabled |

The bulk of open Code Scanning alerts are **non-security code-quality rules**
(`js/syntax-error` ×247, `js/unused-local-variable` ×198, `py/unused-import` ×25,
etc.). These do not represent exploitable conditions and are tracked as code-health
debt, not security risk.

---

## 2. Known transitive vulnerabilities (OSSF Scorecard `Vulnerabilities` check)

The OSSF Scorecard `Vulnerabilities` probe (Code Scanning alert **#3066**, scored 0)
reports the following advisories reachable through **transitive dependencies** of the
Python inference/eval surfaces. These are upstream advisories in indirect dependencies
that have **no fixed version available in our current dependency tree**, or whose fix
requires a major upstream version bump gated by founder review. They are documented
here as **accepted/deferred risk** with the listed mitigations.

| Advisory | Mitigation / rationale |
|---|---|
| PYSEC-2021-100 / GHSA-8h2j-cgx8-6xv7 | Transitive; affected code path not invoked by substrate runtime. Network egress sandboxed. |
| PYSEC-2024-38 | Transitive; deferred pending upstream patched release. |
| PYSEC-2022-183 / GHSA-h8pj-cxx2-jfg2 | Transitive; input is internally generated, not attacker-controlled. |
| PYSEC-2021-47 / GHSA-5jqp-qgf6-3pvh | Transitive; mitigated by input validation at gateway boundary. |
| GHSA-mr82-8j83-vxmv | Transitive; no fixed version; compensating control = read-only mount. |
| PYSEC-2020-150 / GHSA-33c7-2mpw-hg34 | Transitive; legacy advisory, affected feature disabled in config. |
| PYSEC-2020-151 / GHSA-f97h-2pfx-f59f | Transitive; affected feature disabled in config. |
| GHSA-6w46-j5rx-g56g | Transitive; deferred pending dependency bump. |
| GHSA-f83h-ghpp-7wcc | Transitive; deferred pending dependency bump. |
| GHSA-wf5f-4jwr-ppcp | Transitive; not in reachable call graph. |
| GHSA-cfh3-3jmp-rvhc | Transitive; not in reachable call graph. |
| GHSA-pwv6-vv43-88gr | Transitive; mitigated by container network isolation. |
| GHSA-r73j-pqj5-w3x7 | Transitive; deferred pending upstream fix. |
| GHSA-whj4-6x5x-4v2j | Transitive; deferred pending upstream fix. |
| PYSEC-2026-165 / GHSA-wjx4-4jcj-g98j | Transitive; recent advisory, fix tracked for next dependency sweep. |
| GHSA-w3rx-r6r6-pgpr | Image-size parser DOS (ICNS). No fixed upstream transitive replacement today; build-time-only mobile image parsing path. |
| GHSA-5p2g-fcmc-qvqq | Image-size parser DOS (JXL/HEIF). No fixed upstream transitive replacement today; build-time-only mobile image parsing path. |

**Compensating controls (apply broadly to the above):**
- Inference/eval workloads run in network-isolated containers (no inbound, egress allow-listed).
- Untrusted input is validated and bounded at the gateway boundary before reaching Python surfaces.
- Sovereign-only posture: no cloud LLM keys; no external model-provider egress.
- Dependabot security updates are **enabled**; fixed versions will be adopted automatically as they publish.

> **Review cadence:** This register is re-evaluated each dependency sweep and at every
> vulnerability-management triage cycle (no CMMC claim). Any advisory that gains a fixed version is removed here
> and remediated via a Dependabot/founder-reviewed PR.

---

## 3. Supply-chain / posture findings (OSSF Scorecard, informational)

These are **posture** findings, not code vulnerabilities. Documented for transparency;
remediation is owned by the founder and tracked outside this register.

| Alert | Finding | Status |
|---|---|---|
| #3065 `SAST` | SAST run on 21/30 recent commits | Deferred — CI gate hardening planned |
| #3063 `Maintained` | Repo < 90 days old | Time-based; resolves automatically |
| #3062 `CodeReview` | Approved-changeset ratio low | Process maturing as team scales |
| #3026 `BranchProtection` | `main` protection not maximal | Founder-owned policy decision |
| #3041–#3137, #3052–#3061 `Pinned-Dependencies` ×49 | Docker base images / workflow steps not pinned by hash | Deferred — hash-pinning sweep planned; tracked as supply-chain hardening |

---

## 4. False positives dismissed during triage

| Alert | Rule | Location | Reason |
|---|---|---|---|
| #3024 | `js/file-system-race` | `packages/gateway/test/gateway-e2e.test.ts:208` | TOCTOU pattern in **e2e test harness** on a test-owned audit-log file; no untrusted-actor attack surface in test code. Dismissed as `false positive`. |

---

## 5. Items requiring founder review (NOT accepted — open for remediation)

The following **production** security findings remain open and are explicitly **not**
accepted by this register. They are flagged for founder-reviewed fixes:

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

_This file is additive documentation only. It does not modify application code._
