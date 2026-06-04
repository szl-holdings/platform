# A11oy Code Skill — Operating Instructions

This skill governs how AI agents operate in the SZL Holdings monorepo. It defines the operating sequence, agent selection logic, scope boundaries, and proof obligations.

## When to Use This Skill

Use this skill any time you are:
- Starting a new task or Workcell in the SZL Holdings repo
- Selecting which agent to invoke for a specific type of work
- Preparing a Proof Packet
- Running pre-release or pre-demo checks
- Auditing the repo for gaps, security issues, or claim violations

## Core Operating Sequence

Every agent session must follow this sequence. Do not skip steps.

```
1. Read AGENTS.md
2. Read docs/A11OY_NON_NEGOTIABLES.md
3. Pathfinder Scan (context)
4. ForgeMind Plan
5. Confirm Scope
6. PatchPilot Execute
7. BuildWarden Test
8. PixelProof Screenshot
9. ClaimGuard Review
10. SecretHawk Sweep
11. ProofSmith → Commit
```

Full sequence definition: `docs/A11OY_REPLIT_CODEX_DOCTRINE.md`

## Agent Selection Logic

| Task Type | Primary Agent | Supporting Agents |
|-----------|--------------|------------------|
| Context scan | Pathfinder | — |
| Planning | ForgeMind | WorkGraphWeaver (if multi-Workcell) |
| Code execution | PatchPilot | BuildWarden (if failures) |
| Repair/recovery | BuildWarden | PatchPilot |
| Screenshot capture | PixelProof | — |
| Public claim review | ClaimGuard | BoardroomOracle (investor materials) |
| Secret sweep | SecretHawk | — |
| Documentation refresh | ReadMeRanger | ClaimGuard |
| Proof assembly | ProofSmith | — |
| Release prep | ReleaseCaptain | AuditTitan |
| UI consistency | InterfaceMonk | PixelProof |
| Route health | RouteRover | BuildWarden |
| Workflow mapping | WorkGraphWeaver | ForgeMind |
| Editor setup | CursorSage | — |
| Codex tasks | CodexSmith | — |
| Investor narrative | BoardroomOracle | NarrativeForge, ClaimGuard |
| Product content | NarrativeForge | ClaimGuard |
| Full audit | AuditTitan | All agents |

## Scope Boundaries

Agents must not exceed their defined scope. See `docs/A11OY_AGENT_DOCTRINE.md` for each agent's blocked actions.

General scope rules:
- **Read-only agents** (Pathfinder, RouteRover, WorkGraphWeaver): do not modify files
- **Execution agents** (PatchPilot, BuildWarden): touch only files in the approved plan
- **Review agents** (ClaimGuard, SecretHawk, PixelProof): audit and report; do not edit without explicit authorization
- **Assembly agents** (ProofSmith, ReleaseCaptain, AuditTitan): aggregate outputs; do not generate evidence

## Proof Obligations

| Proof Level | Required For |
|-------------|-------------|
| Level 1 | Documentation-only, zero-risk changes |
| Level 2 | Code changes to non-critical paths |
| Level 3 | Any UI surface change |
| Level 4 | Any public-facing copy change |
| Level 5 | Any release, investor demo, or AuditTitan run |

Full proof level definitions: `docs/A11OY_PROOF_DOCTRINE.md`

## Doctrine Reference

| Document | Key Content |
|----------|-------------|
| `AGENTS.md` | Core doctrine: loop, naming, forbidden, done criteria |
| `docs/A11OY_DOCTRINE.md` | Product thesis and operating philosophy |
| `docs/A11OY_OPERATING_PRINCIPLES.md` | The ten principles |
| `docs/A11OY_NON_NEGOTIABLES.md` | Hard rules |
| `docs/A11OY_AGENT_DOCTRINE.md` | All 18 agents in full |
| `docs/A11OY_PRODUCT_LANGUAGE.md` | Approved terms, forbidden terms, tone |
| `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md` | Claim safety rules |
| `docs/A11OY_SECURITY_DOCTRINE.md` | Security and secret hygiene |
| `docs/A11OY_SCREENSHOT_DOCTRINE.md` | Screenshot quality rules |
| `docs/A11OY_PROOF_DOCTRINE.md` | Proof Packet structure and levels |
| `docs/A11OY_WORKCELL_DOCTRINE.md` | Workcell definition and governance |
| `docs/A11OY_RELEASE_DOCTRINE.md` | Release readiness checklist and scoring |
| `docs/A11OY_REPLIT_CODEX_DOCTRINE.md` | Eleven-step operating sequence |
| `docs/A11OY_DEFINITION_OF_DONE.md` | Full done checklist |
