# A11oy Checklists — Copy-Ready Verification Lists

Use these checklists before, during, and after every task. Check off items in order.

---

## Preflight Checklist (Before Starting Any Task)

- [ ] Read `AGENTS.md` in full
- [ ] Read `docs/A11OY_NON_NEGOTIABLES.md`
- [ ] Run Pathfinder Scan or read `docs/APP_STATUS.md` and `docs/operations/known-gaps.md`
- [ ] Read the relevant artifact README (if touching an artifact)
- [ ] Run `pnpm typecheck` and record the baseline result
- [ ] Confirm the task does not require touching files outside its authorized scope
- [ ] Confirm the task does not violate the Forbidden list in `AGENTS.md`
- [ ] Confirm the required approval tier has been granted for this risk class
- [ ] Write the plan (ForgeMind) before executing

---

## Patch Checklist (During and After Executing)

- [ ] Only files in the authorized scope were touched
- [ ] Every change is the minimum required to satisfy the objective
- [ ] No unrelated refactors or cleanups were introduced
- [ ] No `console.log` statements added to server code
- [ ] No new TypeScript `any` casts without documented justification
- [ ] No Bo11y, Bolly, or Boss naming introduced
- [ ] No vendor copy or trade dress introduced
- [ ] Decision log written for any deviation from the plan

---

## Screenshot Checklist (After Touching Any UI Surface)

- [ ] Application is running in the Replit workspace
- [ ] Screenshot captured from the live app (not a design tool)
- [ ] Screenshot shows the correct route that was modified
- [ ] Screenshot uses real or realistic demo data (no LOREM/TODO/PLACEHOLDER)
- [ ] Screenshot is free of error pages and loading spinners
- [ ] Stored in `docs/assets/screenshots/current/` with correct filename
- [ ] Catalog entry added to `audit/screenshot-catalog.md` with all required fields
- [ ] Screenshot refs recorded in the Proof Packet

---

## Public Claim Checklist (Before Committing Any Public-Facing Copy)

- [ ] Every claim about customers uses the approved qualifier (design partner, enterprise evaluation, investor demo)
- [ ] Every compliance claim uses the approved qualifier (architected for X readiness, roadmap)
- [ ] Every integration claim for mock connectors uses the approved qualifier (mock connector, future connector target)
- [ ] No ARR, MRR, or customer count claims without verified source in `docs/platform-facts.md`
- [ ] No "best-in-class", "revolutionary", "disrupting", or "the only platform that..." language
- [ ] No "autonomous AI" or "self-driving" language — use "governed agentic"
- [ ] No lifted copy from vendor UI, marketing, or documentation
- [ ] ClaimGuard review result recorded in Proof Packet

---

## Security Checklist (Before Every Commit)

- [ ] No API keys, tokens, or credentials in changed files
- [ ] No database URLs or connection strings in changed files
- [ ] No `.env` file contents in changed files
- [ ] No service account JSON or private keys in changed files
- [ ] `.gitignore` covers `.env`, `.env.local`, `.env.*.local`, `*.env`, `node_modules`, `dist`, `build`, `.next`, `coverage`, `.turbo`, `playwright-report`, `test-results`, `screenshots/raw`, `*.log`
- [ ] SecretHawk sweep completed — result recorded in Proof Packet

---

## Release Checklist (Before Any Release, Demo, or Public Deployment)

- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm test` — zero failures
- [ ] `pnpm qa:routes` — all routes healthy
- [ ] `pnpm audit` — zero high or critical vulnerabilities
- [ ] Gitleaks scan — clean
- [ ] ClaimGuard full review — all public claims qualified
- [ ] PixelProof freshness check — all screenshots within 30-day window
- [ ] `docs/APP_STATUS.md` — current
- [ ] `docs/operations/known-gaps.md` — current
- [ ] No Bo11y/Bolly/Boss naming in any file
- [ ] Release Readiness Score ≥ 80 with all categories ≥ 70
- [ ] Release Workcell approved at required tier (Executive for investor demos, Board for public)
- [ ] ReleaseCaptain has produced the Release Proof Packet (Proof Level 5)

---

## Proof Checklist (Before Committing Any Change)

- [ ] Plan summary written before execution
- [ ] Patch summary written after execution
- [ ] Test results recorded (command + exit code + output summary)
- [ ] Screenshot refs recorded (if UI surface was modified)
- [ ] Claim check result recorded (if public-facing copy was modified)
- [ ] Secret sweep result recorded
- [ ] Known-gaps update recorded (new gaps or closed gaps)
- [ ] Proof level confirmed and matches Workcell requirement
- [ ] Proof Packet assembled with all required fields
- [ ] Commit message references the Workcell ID or task number
- [ ] No force-push performed
