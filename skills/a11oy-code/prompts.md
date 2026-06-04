# A11oy Agent Prompts — Eleven Copy-Ready Prompts

Copy and adapt these prompts for your agent sessions. Replace bracketed placeholders with specifics.

---

## 1. Pathfinder Scan

```
Run a Pathfinder Scan of this repository. Produce a full Context Pack covering:

1. Artifact readiness — read docs/APP_STATUS.md and summarize the current status of each artifact
2. Open known gaps — read docs/operations/known-gaps.md and list all open gaps with their priority
3. Screenshot freshness — check audit/screenshot-catalog.md and flag any screenshots older than 30 days
4. Public claim safety — review README.md, docs/A11OY_DOCTRINE.md, and any investor docs for unqualified claims
5. Architecture summary — read docs/architecture/architecture.md and summarize the current topology
6. Release Readiness Score — score each of the nine categories from docs/A11OY_RELEASE_DOCTRINE.md
7. Top 10 recommended next Workcells — prioritized by impact, risk, and blocking relationships

Do not modify any files. Read, catalog, and report only.
```

---

## 2. ForgeMind Plan

```
ForgeMind: design a Workcell for the following objective:

Objective: [STATE THE OBJECTIVE IN ONE SENTENCE]

Produce:
1. Workcell definition with all required fields (id, title, vertical, agent, objective, scope in/out, tools, risk class, approval tier, covenant policies, proof level)
2. File list: every file to be touched and exactly what changes are planned in each
3. Success criteria: how will we know this is done?
4. Doctrine check: confirm this plan does not violate the Forbidden list in AGENTS.md or any Non-Negotiables in docs/A11OY_NON_NEGOTIABLES.md
5. Approval tier confirmation: what tier of approval is required for this risk class?

Do not execute. Do not modify files. Plan only.
```

---

## 3. PatchPilot Execute

```
PatchPilot: execute the plan from Workcell [WORKCELL_ID].

Authorized files to touch: [LIST FILES FROM FORGEM IND PLAN]
Authorized scope: [SCOPE IN FROM FORGEM IND PLAN]

Rules:
- Touch only the files and sections listed in the plan
- Apply the minimum change that satisfies the objective
- Record every file changed, section modified, and decision made
- Do not refactor, clean up, or improve anything outside the authorized scope
- Do not force-push or rewrite history
- If you discover the change requires touching an out-of-scope file, halt and report

After execution, produce:
- Patch summary: files changed, sections modified, lines added/removed
- Decision log: any deviations from the plan and why
```

---

## 4. BuildWarden Repair

```
BuildWarden: diagnose and repair the following failure:

Failure type: [typecheck / test / qa:routes / workflow / other]
Error output:
[PASTE ERROR OUTPUT HERE]

Steps:
1. Trace the error to its root cause
2. Identify the minimum change required to restore the passing state
3. Confirm the fix does not introduce new failures or regressions
4. Do not introduce new features or refactors while repairing
5. Record: root cause, remediation applied, test result after fix

Run the failing command again after the fix and include the exit code and output in your report.
```

---

## 5. PixelProof Capture

```
PixelProof: capture live screenshots of the following surfaces after the current patch has been applied:

Routes to capture: [LIST ROUTES]

Requirements for each screenshot:
- The application must be running in the Replit workspace
- Navigate to the exact route
- The screenshot must show real or realistic demo data (no LOREM, TODO, PLACEHOLDER)
- Store in docs/assets/screenshots/current/ with naming: {surface-name}-YYYY-MM-DD.jpg
- Add a catalog entry in audit/screenshot-catalog.md with all required fields

After capture, produce:
- Screenshot refs list (filename, route, surface name, capture date)
- Confirmation each screenshot meets the quality bar in docs/A11OY_SCREENSHOT_DOCTRINE.md
```

---

## 6. ClaimGuard Review

```
ClaimGuard: review the following copy for public claim safety:

[PASTE COPY HERE]

Steps:
1. Identify every claim about: customers, compliance, revenue, integrations, capabilities, metrics
2. For each claim: is it verified in docs/platform-facts.md or the source-of-truth registry?
3. Apply the soften-or-remove rule from docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md:
   - Can it be softened with an approved qualifier? If yes, soften it.
   - If it cannot be meaningfully softened, remove it.
4. Return the clean copy with a log of every change: original claim → action taken → revised text

Blocked claims that must never appear: [reference docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md blocked list]
```

---

## 7. SecretHawk Sweep

```
SecretHawk: sweep the following files for secrets and sensitive patterns:

Files changed in this session: [LIST FILES]

Check for:
- API keys, tokens, and bearer credentials
- Database connection strings
- Service account JSON or credential files
- Private keys and certificates
- Hardcoded passwords or secrets
- .env file contents
- Any pattern matching common secret formats (AWS keys, Stripe keys, GitHub tokens, etc.)

Also verify:
- .gitignore covers all required patterns from docs/A11OY_SECURITY_DOCTRINE.md
- No new .env.* files outside the exception list were added

Produce:
- Sweep result: clean OR findings list with file, line, pattern matched
- .gitignore verification: all required patterns present (list any missing)
```

---

## 8. ReadMeRanger Refresh

```
ReadMeRanger: refresh the following documentation to ensure it is current and accurate:

Target document: [README.md / docs/INDEX.md / artifact README / other]

Steps:
1. Read the current document
2. Compare every claim and statistic against docs/APP_STATUS.md and docs/platform-facts.md
3. Check all internal links — flag any broken or stale links
4. Check artifact list if present — ensure it matches actual registered artifacts
5. Check API surface if described — ensure it matches current routes
6. Update any stale sections
7. Do not introduce new claims without ClaimGuard review
8. Do not delete sections without explicit authorization

Produce:
- Updated document
- Change log: every section added, modified, or removed and why
- Verification statement: document is now consistent with current repo state
```

---

## 9. ProofSmith Package

```
ProofSmith: assemble the Proof Packet for Workcell [WORKCELL_ID].

Required proof level for this Workcell: [LEVEL 1–5]

Gather from this session:
- Plan summary (from ForgeMind)
- Patch summary (from PatchPilot)
- Test results (from BuildWarden or direct test run — include command, exit code, output)
- Screenshot refs (from PixelProof — include filenames and routes)
- Claim check result (from ClaimGuard — include clean/flagged status)
- Secret sweep result (from SecretHawk — include clean/findings status)
- Known-gaps update (any new gaps introduced or closed)

If any required element is missing, report the gap rather than omitting it.

Produce:
- Complete Proof Packet with all fields from docs/A11OY_PROOF_DOCTRINE.md
- Proof level achieved
- Recommended commit message
```

---

## 10. ReleaseCaptain Prepare

```
ReleaseCaptain: run the Release Readiness Checklist for [RELEASE NAME / RELEASE DATE].

Steps:
1. Run through all items in docs/A11OY_RELEASE_DOCTRINE.md Release Readiness Checklist
2. Score each of the nine Release Readiness Score categories (0–100)
3. Calculate the composite Release Readiness Score
4. For any category below 70, identify the specific blockers and recommend remediation Workcells
5. Produce the go/no-go recommendation with rationale

Release threshold:
- Score ≥ 80 and all categories ≥ 70: Release approved
- Score 60–79 or any category 50–69: Conditional release — requires Executive authorization
- Score < 60 or any category < 50: Release blocked

Produce:
- Completed Release Readiness Checklist (checked items)
- Scored Release Readiness Score by category
- Go/no-go recommendation
- Release Proof Packet (Proof Level 5)
- Blocker list with remediation Workcell recommendations (if applicable)
```

---

## 11. AuditTitan Full Audit

```
AuditTitan: run a full platform audit of the SZL Holdings repo.

Orchestrate the following in sequence:
1. Pathfinder Scan — produce Context Pack, initial Release Readiness Score, Screenshot Freshness Score, Public Claim Safety Score
2. RouteRover — run pnpm qa:routes, produce route health report
3. InterfaceMonk — audit UI consistency for the five primary surfaces: [list surfaces]
4. ClaimGuard — full public claim review of README.md, docs/A11OY_DOCTRINE.md, and investor materials
5. SecretHawk — sweep all files changed in the last 30 days for secrets
6. PixelProof freshness check — flag all screenshots older than 30 days

Produce:
- Full Context Pack
- Route health report
- UI consistency audit
- Public claim audit log
- Secret sweep result
- Screenshot freshness report
- Final Release Readiness Score (all nine categories scored)
- Release Proof Packet (Proof Level 5)
- Top 10 recommended next Workcells with: priority, primary agent, objective, risk class, expected deliverables

Do not approve a release if any category scores below 70.
```
