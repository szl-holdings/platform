# Agent Skills Harvest Log

Harvested: 2026-04-25  
Harvested by: Task #3460 — "Harvest 8-12 high-value agent skills from awesome-claude collections"  
Target directory: `.agents/skills/` (per skill-authoring conventions — agent-created skills belong here, not in `.local/skills/` which is Replit-managed)

---

## Source Repositories (Pinned at Harvest)

| Repo | Commit SHA | Date | License | Notes |
|------|-----------|------|---------|-------|
| `sickn33/antigravity-awesome-skills` | `9bad53f2426e310c33ef5bacf9f845855197be6a` | 2026-04-25 | MIT | Primary source for dead-code, dependency, and doc patterns |
| `affaan-m/everything-claude-code` | `4e66b2882da9afb9747468b08a253ca2f09c85f3` | 2026-04-21 | MIT | Debugging and structured-thinking patterns |
| `Sep7734/anthropic-claude-code-ai-agent-blueprints` | `f74439fdb9b34c24c6a330d9dbb5ae2f1a29b3e7` | 2026-03-31 | MIT | API contract review and monorepo change management |
| `obra/superpowers-skills` | `cdcd624ad3fd8026deb692e565351854569798dd` | 2025-10-14 | MIT | "Force structured thinking before coding" pattern (pre-flight-thinking) |
| `hesreallyhim/awesome-claude-code` | `81c5b4cc6258451eca36b81551cac9d14a98571a` | 2026-04-25 | CC BY-NC-ND 4.0 | **See license note below** — patterns referenced only, no text reproduced |

### License Note — `hesreallyhim/awesome-claude-code`

This repository uses CC BY-NC-ND 4.0, which prohibits derivative works. **No text from this repository was reproduced in any skill here.** The React component review and TypeScript refactor patterns in `.agents/skills/` are independently authored implementations of common software engineering conventions (key props, memoization discipline, TypeScript strict mode, etc.) — not adaptations of any specific content from this repo. The repo was consulted only to confirm which patterns are most widely recommended for this stack.

---

## Per-Skill Provenance

### 1. `pre-flight-thinking`
- **Primary source**: `obra/superpowers-skills` @ `cdcd624` — "Force structured thinking before coding" SKILL.md
- **License**: MIT
- **What we took**: The four-question checklist structure (restate, assume, minimize, enumerate failure modes)
- **Adaptation**: Rewritten in prose; removed generic examples and replaced with TypeScript/monorepo-specific language; added cross-references to other skills in this project

### 2. `typescript-refactor`
- **Primary source**: `sickn33/antigravity-awesome-skills` @ `9bad53f` — TypeScript refactoring section
- **License**: MIT
- **What we took**: Pattern structure for `any` elimination, discriminated unions, and shared util extraction
- **Adaptation**: Added monorepo-specific import rules, `packages/shared` path conventions, build-order guidance, and this project's tsconfig settings

### 3. `react-component-review`
- **Primary source**: `sickn33/antigravity-awesome-skills` @ `9bad53f` — React component audit checklist
- **License**: MIT
- **What we took**: Correctness and performance checklist categories
- **Adaptation**: Added accessibility section; calibrated line-count thresholds; added output format template; removed Python/non-React references

### 4. `monorepo-impact-analysis`
- **Primary source**: `Sep7734/anthropic-claude-code-ai-agent-blueprints` @ `f74439f` — monorepo change management blueprint
- **License**: MIT
- **What we took**: Impact classification table and five-step analysis structure
- **Adaptation**: Added this project's artifact slugs; grounded grep examples in actual paths; added red-flag pause list for Drizzle schema and route renames

### 5. `debug-protocol`
- **Primary source**: `affaan-m/everything-claude-code` @ `4e66b28` — systematic debugging section
- **License**: MIT
- **What we took**: Phase-based debugging workflow (reproduce → evidence → hypothesis → test → fix)
- **Adaptation**: Added sixth phase (prevent recurrence); added stack-specific common patterns table; added Vite HMR, pnpm module-not-found, and React StrictMode entries

### 6. `commit-hygiene`
- **Primary source**: `sickn33/antigravity-awesome-skills` @ `9bad53f` — git hygiene and Conventional Commits section
- **License**: MIT
- **What we took**: Conventional Commits type table and scope guidance
- **Adaptation**: Added this project's artifact/package scope names; added PR description template; added squash vs. preserve history guidance

### 7. `dead-code-detector`
- **Primary source**: `sickn33/antigravity-awesome-skills` @ `9bad53f` — dead code detection patterns
- **License**: MIT
- **What we took**: Detection technique categories (unused exports, orphaned files, stale flags)
- **Adaptation**: Added `knip` tooling reference; added Tailwind/PurgeCSS note; added "what not to remove" guardrails for dynamic imports and env-gated code

### 8. `api-contract-review`
- **Primary source**: `Sep7734/anthropic-claude-code-ai-agent-blueprints` @ `f74439f` — API contract review blueprint
- **License**: MIT
- **What we took**: Breaking-change classification table and review gate concept
- **Adaptation**: Simplified the table; added grep examples for this project's `/api/` route prefix; added versioning strategy and output format template

### 9. `dependency-health`
- **Primary source**: `sickn33/antigravity-awesome-skills` @ `9bad53f` — dependency management patterns
- **License**: MIT
- **What we took**: Audit → triage → upgrade → verify loop structure
- **Adaptation**: Rewritten entirely for pnpm workspaces; added monorepo-specific dedup and hoisting rules; added Vite plugin version pinning guidance; added commit message format

### 10. `doc-comment-hygiene`
- **Primary source**: `sickn33/antigravity-awesome-skills` @ `9bad53f` — documentation hygiene patterns
- **License**: MIT
- **What we took**: "Comment why, not what" heuristic and JSDoc completeness guidelines
- **Adaptation**: Added TypeScript JSDoc examples; added README health checklist calibrated to this project's `packages/` and `artifacts/` layout; added audit process steps

---

## License Compliance Summary

| License | Repos | Derivatives Permitted? | Status |
|---------|-------|----------------------|--------|
| MIT | antigravity-awesome-skills, everything-claude-code, claude-agent-blueprints, superpowers-skills | Yes (with attribution) | ✅ Clean — all skills derived from MIT sources are adaptations with attribution in this log |
| CC BY-NC-ND 4.0 | hesreallyhim/awesome-claude-code | No | ✅ Clean — no text reproduced; only consulted as reference |

No `NOTICE` file is required: MIT requires attribution in the software itself only when redistributing. Since `.agents/skills/` is not a redistributed library, attribution in this log satisfies the spirit of the license.

---

## Re-Harvest Guidance

To update a skill from its source:
1. `git fetch` the source repo and check commits since the SHA pinned above.
2. Find the relevant section (skill names map clearly to repo section names).
3. Diff the new version against the SKILL.md here.
4. Apply any new patterns while preserving this-project-specific customizations.
5. Update the SHA and date in this log entry.
