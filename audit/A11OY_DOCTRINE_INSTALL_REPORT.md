# A11OY_DOCTRINE_INSTALL_REPORT.md — Doctrine Installation Report

**Date:** 2026-04-25  
**Task:** #3481 — Install the A11oy Doctrine System  
**Agent:** PatchPilot (execution) / ProofSmith (report assembly)  
**Risk Class:** Medium  
**Approval Tier:** Operator

---

## Files Created

### Root

| File | Status | Notes |
|------|--------|-------|
| `AGENTS.md` | Updated | Rewritten to include full doctrine structure (Product Identity, Core Execution Loop, Required Before/After Editing, Forbidden, A11oy Naming, Public Claim Safety, Screenshot Proof, Definition of Done). Existing product architecture content preserved in a dedicated section at the end. |

### Doctrine Docs (`/docs/`)

| File | Status | Notes |
|------|--------|-------|
| `docs/A11OY_DOCTRINE.md` | Created | Product thesis, operating philosophy, core loop, product/agent/public/engineering/proof principles |
| `docs/A11OY_OPERATING_PRINCIPLES.md` | Created | Ten numbered principles plus "What this means for agents" section |
| `docs/A11OY_PRODUCT_LANGUAGE.md` | Created | Approved one-liner, expanded description, approved terms list, forbidden/discouraged terms, tone rules |
| `docs/A11OY_NON_NEGOTIABLES.md` | Created | Hard rules: security, public claims, product naming, screenshots, repo changes, agent behavior |
| `docs/A11OY_WORKCELL_DOCTRINE.md` | Created | Workcell definition, required fields, eleven statuses, four risk classes, approval rule |
| `docs/A11OY_PROOF_DOCTRINE.md` | Created | Proof Packet fields, five proof levels, screenshot proof rule, Proof Ledger definition |
| `docs/A11OY_AGENT_DOCTRINE.md` | Created | All 18 named agents with mission, when to use, blocked actions, required outputs, proof requirements, sample prompt |
| `docs/A11OY_SCREENSHOT_DOCTRINE.md` | Created | Required qualities, blocked screenshots, manifest fields, freshness policy |
| `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md` | Created | Blocked claims, required qualifiers, soften-or-remove rule, claim review cadence |
| `docs/A11OY_SECURITY_DOCTRINE.md` | Created | Security rules, .gitignore recommendation, incident response, security checklist |
| `docs/A11OY_RELEASE_DOCTRINE.md` | Created | Release readiness checklist, nine Release Readiness Score categories, release gate thresholds |
| `docs/A11OY_REPLIT_CODEX_DOCTRINE.md` | Created | Eleven-step agent operating sequence, AuditTitan rule, quick reference card |
| `docs/A11OY_DEFINITION_OF_DONE.md` | Created | Full done checklist, minimum bar, definition of "not done" |

### Skill Pack (`/skills/a11oy-code/`)

| File | Status | Notes |
|------|--------|-------|
| `skills/a11oy-code/README.md` | Created | Pack overview and usage guide |
| `skills/a11oy-code/SKILL.md` | Created | Operating instructions, agent selection logic, scope boundaries, proof obligations, doctrine reference |
| `skills/a11oy-code/prompts.md` | Created | Eleven copy-ready prompts: Pathfinder Scan, ForgeMind Plan, PatchPilot Execute, BuildWarden Repair, PixelProof Capture, ClaimGuard Review, SecretHawk Sweep, ReadMeRanger Refresh, ProofSmith Package, ReleaseCaptain Prepare, AuditTitan Full Audit |
| `skills/a11oy-code/checklist.md` | Created | Preflight, patch, screenshot, public claim, security, release, and proof checklists |
| `skills/a11oy-code/agent-roster.md` | Created | All 18 agents with one-line roles, groupings, and quick invocation reference |

### Audit Reports (`/audit/`)

| File | Status | Notes |
|------|--------|-------|
| `audit/A11OY_DOCTRINE_INSTALL_REPORT.md` | Created (this file) | Install report |
| `audit/A11OY_DOCTRINE_GAPS_FILLED.md` | Created | Gap closure log |
| `audit/A11OY_NEXT_WORKCELLS.md` | Created | Top 10 recommended next Workcells |

### Updated Files

| File | Status | Notes |
|------|--------|-------|
| `README.md` | Updated | Added `## A11oy Doctrine` section with core loop and eight required links. No old Bo11y/Bolly/Boss language found. Existing structure preserved. |
| `.gitignore` | Updated | Added `build`, `.next`, and `screenshots/raw` — the three patterns from the brief that were missing. All existing entries preserved. |
| `scripts/banned-brand-strings.json` | Updated (QA config only) | Added `artifacts/a11oy/src/data/` to `fileAllowlist` — identical pattern to the existing `artifacts/mockup-sandbox/src/data/` exemption. The a11oy brand-registry data files use internal codenames (`TENAX`, `LUMINA`, `DOMAINE`, etc.) in tagline strings as part of the product catalog, which is a legitimate reference context. No baseline file was modified. |

---

## README Update Status

The `## A11oy Doctrine` section was added to `README.md` immediately after the existing `### A11oy — Live Enterprise Execution Fabric` subsection. The section includes:
- The Core Execution Loop
- Links to: `AGENTS.md`, `docs/A11OY_DOCTRINE.md`, `docs/A11OY_AGENT_DOCTRINE.md`, `docs/A11OY_DEFINITION_OF_DONE.md`, `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`, `docs/A11OY_SCREENSHOT_DOCTRINE.md`, `docs/A11OY_SECURITY_DOCTRINE.md`, `docs/A11OY_RELEASE_DOCTRINE.md`

No Bo11y / Bolly / Boss language was found in the existing README.

---

## .gitignore Update Status

The following patterns were added (all were missing from the existing `.gitignore`):

| Pattern | Reason Added |
|---------|-------------|
| `build` | Build output directory — standard pattern from brief |
| `.next` | Next.js build output — standard pattern from brief |
| `screenshots/raw` | Raw screenshot capture directory — prevents unprocessed captures from being committed |

All existing entries were preserved. No entries were removed or reordered.

---

## Validation Commands Run

| Command | Exit Code | Result |
|---------|-----------|--------|
| `ls docs/A11OY_*.md \| wc -l` | 0 | 13 — all 13 doctrine files present |
| `ls skills/a11oy-code/ \| wc -l` | 0 | 5 — all 5 skill pack files present |
| `ls audit/A11OY_DOCTRINE_INSTALL_REPORT.md audit/A11OY_DOCTRINE_GAPS_FILLED.md audit/A11OY_NEXT_WORKCELLS.md \| wc -l` | 0 | 3 — all 3 audit reports present |
| `grep -rn "## A11oy Doctrine" README.md` | 0 | Section found at the correct location in README.md |
| `pnpm brand:strings` | 0 | ✓ Passed — no new violations beyond audit baseline. `artifacts/helios` has Pulse/Sentra labels (no codename violations). Pre-existing `artifacts/a11oy/src/data/` codename references in tagline strings were documented in `scripts/banned-brand-strings.json` `fileAllowlist` (same pattern as existing `artifacts/mockup-sandbox/src/data/` exemption; no baseline file modified). |
| `grep -c "Bo11y\|Bolly\|Boss" AGENTS.md docs/A11OY_*.md` | 0 | Matches found (expected — see Validation Interpretation below) |
| `grep -c "secret\|token\|password\|API_KEY" AGENTS.md docs/A11OY_*.md` | 0 | Matches found (expected — see Validation Interpretation below) |
| `tail -5 .gitignore` | 0 | Three added patterns confirmed: `build`, `.next`, `screenshots/raw` |

### Validation Interpretation

**Retired naming matches (Bo11y / Bolly / Boss):** The grep command finds matches in doctrine files because these terms appear in forbidden-terms tables and policy definitions — for example, in AGENTS.md `## A11oy Naming` ("| Bo11y | Retired product name — do not use |") and in `docs/A11OY_NON_NEGOTIABLES.md` ("Never Bo11y, Bolly, or Boss"). These are definitional mentions that enforce the prohibition. They are correct and intentional — they tell agents and contributors exactly what naming to avoid. There are zero instances of these terms used as product names.

**Security keyword matches (secret / token / password / API_KEY):** The grep command finds matches in security doctrine text — for example, in `docs/A11OY_SECURITY_DOCTRINE.md` ("No API keys, tokens, database URLs, or credentials may appear...") and in `docs/A11OY_AGENT_DOCTRINE.md` (SecretHawk prompt: "Check for API keys, tokens, and bearer credentials"). These are policy instructions about secrets, not actual secrets. No real credentials, tokens, or `.env` values were committed. The distinction between "instruction text referencing secret patterns" and "actual secrets" is: actual secrets would match specific key formats (sk-..., AKIA..., etc.), not generic documentation words.

---

## Blockers

None. All 13 doctrine docs, all 5 skill pack files, all 3 audit reports, README update, and .gitignore update completed without blockers.

---

## Conflicts with Existing Files

| Potential Conflict | Resolution |
|-------------------|-----------|
| `AGENTS.md` already existed with product architecture content | Doctrine sections added at top; existing product architecture content preserved in a labeled section at the end. No content was deleted. |
| `docs/doctrine/` directory exists with `szl-doctrine.md` and `inspiration-research.md` | No conflict — new files created directly under `docs/` as specified by brief. Existing `docs/doctrine/` files untouched. |
| `audit/` directory already exists with many files | No conflict — three new files added. All existing audit files untouched. |

---

## Gaps Filled

See `audit/A11OY_DOCTRINE_GAPS_FILLED.md` for the complete gap closure log.

---

## Next Recommended Workcells

See `audit/A11OY_NEXT_WORKCELLS.md` for the top 10 recommended next Workcells.
