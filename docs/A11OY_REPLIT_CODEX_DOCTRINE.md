# A11OY_REPLIT_CODEX_DOCTRINE.md — Agent Operating Sequence

This document defines the eleven-step operating sequence that every Replit agent, Codex session, and AI contributor must follow when working in this repository. Following this sequence is mandatory. Deviating from it is a doctrine violation.

---

## The Eleven-Step Agent Operating Sequence

### Step 1: Read AGENTS.md

Before touching a single file, read `AGENTS.md` in full. This is non-negotiable. AGENTS.md contains the Core Execution Loop, the Forbidden list, the A11oy Naming rules, the Public Claim Safety rules, and the Definition of Done. You cannot make good decisions in this repo without reading it.

### Step 2: Read A11OY_NON_NEGOTIABLES.md

Read `docs/A11OY_NON_NEGOTIABLES.md`. These are the hard rules across security, public claims, naming, screenshots, repo changes, and agent behavior. They are unconditional.

### Step 3: Run Pathfinder Scan (Context)

Invoke the Pathfinder agent or run the equivalent context scan:
- Read `docs/APP_STATUS.md` — what is the current artifact readiness?
- Read `docs/operations/known-gaps.md` — what open gaps exist in your target area?
- Read the relevant artifact README — what is the specific context for the artifact you are touching?
- Check `audit/screenshot-catalog.md` — what screenshots exist and are they fresh?
- Check the relevant doctrine doc for your work type (e.g., `docs/A11OY_SECURITY_DOCTRINE.md` for security work).

Do not skip this step. Agents that skip context are agents that introduce regressions.

### Step 4: Write the Plan (ForgeMind)

Before executing, write a specific plan:
- State the objective in one sentence.
- List every file you will touch.
- List every section within those files you will change.
- State the success criteria — how will you know it's done?
- Confirm the plan does not violate any of the Ten Operating Principles or the Forbidden list.

Record the plan before proceeding to Step 5.

### Step 5: Confirm Scope

Before patching, confirm:
- The plan is within the defined scope of the task.
- No file you plan to touch is outside the authorized scope.
- No action in the plan requires a higher approval tier than what has been granted.
- The patch is the minimum change that satisfies the objective — no refactors, no opportunistic cleanups outside scope.

If scope is unclear, halt and surface the question rather than proceeding.

### Step 6: Execute the Patch (PatchPilot)

Implement the plan. Follow the minimum-change principle: touch only what the plan authorizes. Record every file changed, every section modified, and every decision made during execution.

### Step 7: Run Available Tests (BuildWarden)

Run the applicable checks:
- `pnpm typecheck` — must pass or be explicitly no worse than pre-patch baseline
- `pnpm test` — for patches that affect tested logic
- `pnpm qa:routes` — for patches that affect routes
- Any artifact-specific checks listed in the artifact README

Capture every command, its arguments, its exit code, and a summary of the output. Do not chase failures unrelated to your patch — but do record them in `docs/operations/known-gaps.md`.

### Step 8: Capture Screenshots (PixelProof)

For every UI surface modified:
1. Ensure the application is running in the Replit workspace.
2. Navigate to the modified route.
3. Capture a live screenshot meeting the quality bar in `docs/A11OY_SCREENSHOT_DOCTRINE.md`.
4. Store in `docs/assets/screenshots/current/` with the correct filename convention.
5. Add the catalog entry to `audit/screenshot-catalog.md`.

If the patch does not affect a UI surface, document why and note it in the Proof Packet.

### Step 9: Review Public Claims (ClaimGuard)

For any patch that touches public-facing copy, documentation, or UI labels:
1. Read every changed line that could constitute a public claim.
2. Apply the soften-or-remove rule from `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`.
3. Confirm no unqualified claims about customers, compliance, revenue, or integrations remain.
4. Record the claim review result in the Proof Packet.

For patches that do not touch public-facing copy, note this explicitly in the Proof Packet.

### Step 10: Sweep for Secrets (SecretHawk)

Before assembling the Proof Packet:
1. Review every changed file for hardcoded secrets, tokens, credentials, and `.env` values.
2. Confirm no new pattern in the changed files matches a secret pattern.
3. Confirm `.gitignore` still covers all required patterns.
4. Record the sweep result in the Proof Packet.

### Step 11: Assemble Proof and Commit (ProofSmith → ReleaseCaptain)

1. Assemble the Proof Packet with all required fields (see `docs/A11OY_PROOF_DOCTRINE.md`).
2. Record the Proof Packet in the commit message, in `audit/`, or in both.
3. Write the commit message: what changed, why, what was verified, task/Workcell reference.
4. Commit. Do not force-push. Do not rewrite history.

---

## AuditTitan Rule

AuditTitan is the full audit orchestration agent. It is invoked:
- Before any investor demo preparation.
- Before any production release.
- Quarterly as a standing governance practice.
- Whenever the Release Readiness Score drops below 70 in any category.

AuditTitan orchestrates all other agents in sequence, produces a full repo Context Pack, Release Readiness Score, Screenshot Freshness Score, Public Claim Safety Score, and the top 10 recommended next Workcells.

No agent may claim a release is ready without AuditTitan having run and produced a Release Proof Packet (Proof Level 5) within the prior 7 days.

---

## Quick Reference Card

```
1. Read AGENTS.md
2. Read A11OY_NON_NEGOTIABLES.md
3. Pathfinder Scan (context)
4. Write the Plan (ForgeMind)
5. Confirm Scope
6. Execute Patch (PatchPilot)
7. Run Tests (BuildWarden)
8. Screenshot (PixelProof)
9. Claims Review (ClaimGuard)
10. Secret Sweep (SecretHawk)
11. Proof + Commit (ProofSmith)
```
