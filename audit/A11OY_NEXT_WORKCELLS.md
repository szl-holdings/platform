# A11OY_NEXT_WORKCELLS.md — Top 10 Recommended Next Workcells

**Date:** 2026-04-25  
**Produced by:** ProofSmith (doctrine install)  
**Context:** Post-doctrine-installation recommendations

These are the ten highest-priority Workcells recommended following the doctrine installation. The Pathfinder Scan Workcell (WC-01) is first — it produces the full repo Context Pack and Release Readiness Score that all subsequent Workcells depend on.

---

## WC-01: Pathfinder Full Scan

**Priority:** Critical — do first  
**Agent:** Pathfinder  
**Objective:** Run a full Pathfinder Scan of the SZL Holdings repo to produce the initial Context Pack, Release Readiness Score, Screenshot Freshness Score, Public Claim Safety Score, and the authoritative top 10 Workcell backlog.  
**Risk Level:** Low (read-only)  
**Expected Deliverables:**
- Context Pack: artifact readiness, open known gaps, screenshot freshness, public claim safety, architecture summary
- Release Readiness Score: scored across all nine categories
- Screenshot Freshness Score: percentage of screenshots within the 30-day window
- Public Claim Safety Score: percentage of reviewed copy passing claim audit
- Top 10 recommended Workcells with priority, agent, objective, risk class, and expected deliverables
- Any gaps or blockers discovered during the scan, recorded in `docs/operations/known-gaps.md`

**Why first:** All other Workcells are prioritized based on Pathfinder findings. Without the Context Pack, priority ordering is guesswork.

---

## WC-02: Screenshot Freshness Pass (PixelProof)

**Priority:** High  
**Agent:** PixelProof  
**Objective:** Capture fresh live screenshots of all seven primary surfaces (SZL Holdings Dashboard, KORA, TENAX, SEXTANT, DOMAINE, FORGE Command Portal, A11oy Now Board) and update the screenshot catalog.  
**Risk Level:** Low (read-only application use; no code changes)  
**Expected Deliverables:**
- 7+ fresh screenshots stored in `docs/assets/screenshots/current/` with ISO-date naming
- Updated `audit/screenshot-catalog.md` with full metadata for each capture
- Screenshot Freshness Score ≥ 90%

**Why second:** The release blocklist includes stale screenshots. A fresh set enables investor demos and supports the Release Readiness Score.

---

## WC-03: Public Claims Safety Audit (ClaimGuard)

**Priority:** High  
**Agent:** ClaimGuard  
**Objective:** Full public claims audit of `README.md`, `docs/A11OY_DOCTRINE.md`, investor materials, and all artifact READMEs. Apply soften-or-remove to any blocked claims.  
**Risk Level:** Medium (copy changes to public-facing files)  
**Expected Deliverables:**
- Claim audit log: every claim reviewed, action taken, qualifier applied
- Updated clean copy for any files with blocked claims
- Public Claim Safety Score
- Any blocked claims removed or softened with documented reasoning

**Why third:** Public claims safety is a release blocker. Clearing it enables investor demo preparation.

---

## WC-04: Route Health Verification (RouteRover)

**Priority:** High  
**Agent:** RouteRover  
**Objective:** Run `pnpm qa:routes` across all registered routes, identify any that return unexpected status codes, flag orphaned routes, and produce a route health report.  
**Risk Level:** Low (read-only audit)  
**Expected Deliverables:**
- Route health report: all routes tested, HTTP status codes, failures
- Orphaned route list: routes responding that are not registered in the API spec
- Missing route list: routes in spec that are not responding
- Remediation Workcell recommendations for any failures

**Why fourth:** Route health directly impacts the Release Readiness Score (Architecture Integrity category). Known route gaps should be documented before any demo.

---

## WC-05: Known Gaps Audit and Triage (Pathfinder + ForgeMind)

**Priority:** High  
**Agent:** Pathfinder (audit) + ForgeMind (triage plan)  
**Objective:** Read `docs/operations/known-gaps.md` in full. Validate every open gap is still accurate. Mark closed gaps as closed. Prioritize the top 5 gaps for remediation in the next sprint.  
**Risk Level:** Low (documentation update)  
**Expected Deliverables:**
- Updated `docs/operations/known-gaps.md` with current accuracy
- Top 5 gaps prioritized for remediation with recommended agents and risk levels
- Any new gaps discovered during the audit added and logged

**Why fifth:** A current known-gaps doc is required for the Release Readiness Checklist and demonstrates honest self-assessment to investors and auditors.

---

## WC-06: A11oy Artifact Workflow Restoration

**Priority:** High  
**Agent:** BuildWarden  
**Objective:** Restore all artifact workflows to running state. Per Pathfinder context, no workflows are currently started. Restart all 15 registered artifact workflows and verify each is healthy.  
**Risk Level:** Medium (workflow operations)  
**Expected Deliverables:**
- All 15 artifact workflows in running state
- Workflow health report: each artifact's URL, status, and any startup errors
- Failures documented in `docs/operations/known-gaps.md` with remediation plans

**Why sixth:** Investors and operators cannot evaluate the platform if workflows are not running. This is a demo blocker.

---

## WC-07: UI Consistency Audit (InterfaceMonk)

**Priority:** Medium  
**Agent:** InterfaceMonk  
**Objective:** Audit the five primary web surfaces (SZL Holdings Dashboard, KORA, TENAX, SEXTANT, DOMAINE) for design system compliance — spacing, color, typography, component patterns.  
**Risk Level:** Medium (UI patches may result from audit)  
**Expected Deliverables:**
- UI consistency audit report: surfaces reviewed, issues by severity
- Prioritized remediation list: specific component/file changes needed
- Before/after screenshots for any critical inconsistencies

**Why seventh:** Investor demo quality depends on visual consistency. UI inconsistencies undermine trust in the platform's maturity.

---

## WC-08: Security Hardening Verification (SecretHawk)

**Priority:** Medium  
**Agent:** SecretHawk  
**Objective:** Run a full SecretHawk sweep of the repo for secrets, tokens, and sensitive patterns. Verify gitleaks produces a clean result. Confirm all `.gitignore` patterns are in place.  
**Risk Level:** Low (read-only audit; any findings require separate remediation Workcell)  
**Expected Deliverables:**
- Full secret sweep result (clean or findings with file, line, pattern)
- Gitleaks scan result
- `.gitignore` verification: all required patterns present
- Any findings documented in a separate High-risk remediation Workcell

**Why eighth:** Security is a release blocker at the Critical level. A clean SecretHawk sweep is required for the Release Readiness Checklist.

---

## WC-09: A11oy Now Board Verification (PatchPilot + PixelProof)

**Priority:** Medium  
**Agent:** PatchPilot (verification) + PixelProof (screenshot)  
**Objective:** Navigate to the A11oy Now Board (`/a11oy/`), verify it loads with the correct seed data (32 signals × 7 verticals, 5 outcomes, 5 covenant policies, 5 proof packets), and capture a fresh proof screenshot.  
**Risk Level:** Low (read-only verification)  
**Expected Deliverables:**
- Verification report: all 11 GET endpoints responding correctly, seed data counts verified
- Fresh screenshot of the A11oy Now Board in `docs/assets/screenshots/current/`
- Any discrepancies between expected and actual seed data logged in `docs/operations/known-gaps.md`

**Why ninth:** A11oy is the flagship product being showcased. Its demo state must be verified before any investor engagement.

---

## WC-10: AuditTitan Full Release Readiness (Pre-Demo)

**Priority:** Medium (execute after WC-01 through WC-09 are complete)  
**Agent:** AuditTitan  
**Objective:** Run the full AuditTitan orchestration — all agents in sequence — and produce the complete Release Proof Packet and final Release Readiness Score before the next investor demo.  
**Risk Level:** Low (audit orchestration; no code changes)  
**Expected Deliverables:**
- Full Context Pack
- Route health report
- UI consistency audit
- Public claim audit
- Secret sweep result
- Screenshot freshness report
- Final Release Readiness Score (all nine categories)
- Release Proof Packet (Proof Level 5)
- Go/no-go recommendation for next investor demo
- Updated top 10 Workcell backlog based on audit findings

**Why tenth:** AuditTitan is the final gate before any investor demo or public release. It orchestrates all other agents and produces the definitive Release Readiness Score.
