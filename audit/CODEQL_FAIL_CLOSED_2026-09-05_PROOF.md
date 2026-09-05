# CodeQL fail-closed gate — Proof Packet

- **workcell_id:** `SEC-CODEQL-FAIL-CLOSED-2026-09-05`
- **agent:** Codex + SZL operator review lane
- **objective:** Make the required CodeQL severity gate fail closed when prerequisite analysis or alert enumeration is unavailable, while preserving the existing block on open critical/high alerts.
- **plan_summary:** Limit the patch to `.github/workflows/codeql.yml`; keep the gate runnable after upstream failure with `always()`, reject non-success analysis conclusions, reject GitHub API failures, and retain critical/high alert blocking. Record proof separately and do not weaken repository policy, permissions, or branch protection.
- **patch_summary:** The workflow gate now executes after analyzer failure/cancellation, treats an unsuccessful analyzer as blocking, treats an alert-query failure as blocking instead of an empty result set, and still blocks successful analysis when open critical/high CodeQL alerts exist. This proof packet is append-only evidence for that security-critical CI change.
- **test_results:**
  - `actionlint 1.7.12 .github/workflows/codeql.yml` — exit `0`, passed.
  - `git diff --check` — exit `0`, passed.
  - full workspace typecheck attempt — not reached because the repository's pnpm install policy blocked six dependency build scripts before typechecking; no supply-chain exception was added. Hosted exact-head required checks remain authoritative.
- **screenshot_refs:** `N/A` — CI/workflow-only change; no UI surface changed.
- **verification_notes:** Reviewed the gate flow against the objective: every prerequisite-analysis non-success state is terminal blocking, API enumeration errors are terminal blocking, and only a successful query with no open critical/high alert can clear the severity gate. No unrelated workflow behavior was intentionally changed.
- **public_claim_check:** PASS — no public product or compliance claim was introduced.
- **security_check:** PASS — no secrets, tokens, `.env` values, permission expansion, or protection bypass were added.
- **known_gaps_update:** No new product/runtime gap introduced. The existing dependency-build-script approval constraint remains unchanged and is explicitly recorded above rather than bypassed.
- **proof_level:** `2` — Standard Proof; no UI surface exists for screenshot evidence.
- **recorded_at:** `2026-09-05T15:34:00Z`
- **recorded_by:** ChatGPT GPT-5.6 Sol acting in the user-authorized SZL repair lane

## Source binding

- protected base at PR creation: `f8c7780b16a9d1e3e4089f5d3c77614c53608c5c`
- reviewed PR head before this proof successor: `39d77532de9bf66335605de822029855e30ca2cc`
- PR: `szl-holdings/platform#745`

## Authority boundary

This packet records source and verification evidence only. It does not claim merge, deployment, production runtime effect, CodeQL scan success on a future head, or permission to bypass any required review/check. A fresh exact-head CI run and Codex review are required after this append-only proof commit.
