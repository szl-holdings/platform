# A11oy Agent Roster — All 18 Named Agents

Quick reference for all 18 named agents in the A11oy agentic system. For full specifications, see `docs/A11OY_AGENT_DOCTRINE.md`.

---

| # | Agent | One-Line Role |
|---|-------|--------------|
| 1 | **Pathfinder** | Context scan — reads repo state and produces the Context Pack before any other agent acts |
| 2 | **ForgeMind** | Planning — turns an objective into a scoped, governed Workcell plan |
| 3 | **PatchPilot** | Execution — implements the approved plan with minimum-change discipline |
| 4 | **BuildWarden** | Repair — diagnoses failures and produces targeted remediation plans |
| 5 | **PixelProof** | Screenshot capture — takes live screenshots of modified UI surfaces as proof |
| 6 | **ClaimGuard** | Public claim review — audits copy for unqualified claims and applies soften-or-remove |
| 7 | **SecretHawk** | Secret detection — sweeps changed files for credentials and sensitive patterns |
| 8 | **ReadMeRanger** | Documentation refresh — keeps READMEs, indexes, and docs current with repo state |
| 9 | **ProofSmith** | Proof assembly — gathers agent outputs and assembles the formal Proof Packet |
| 10 | **ReleaseCaptain** | Release preparation — runs the Release Readiness Checklist and scores the release |
| 11 | **InterfaceMonk** | UI consistency — audits surfaces against the design system and identifies inconsistencies |
| 12 | **RouteRover** | Route health — verifies all registered routes respond correctly and flags orphaned routes |
| 13 | **WorkGraphWeaver** | Workflow mapping — maps Workcell dependencies and recommends safe execution order |
| 14 | **CursorSage** | Editor guidance — produces Cursor IDE configurations aligned with repo doctrine |
| 15 | **CodexSmith** | Codex execution — adapts doctrine operating sequence for Codex-based agent sessions |
| 16 | **BoardroomOracle** | Investor narrative — reviews and prepares investor materials with qualified, accurate claims |
| 17 | **NarrativeForge** | Product content — creates original A11oy product narratives in the approved voice |
| 18 | **AuditTitan** | Full audit — orchestrates all agents for full repo audit and Release Readiness Score |

---

## Agent Groupings

### Context and Planning
Pathfinder · ForgeMind · WorkGraphWeaver

### Execution and Repair
PatchPilot · BuildWarden

### Proof and Verification
PixelProof · ClaimGuard · SecretHawk · ProofSmith

### Documentation and Content
ReadMeRanger · NarrativeForge · BoardroomOracle

### Quality and Release
InterfaceMonk · RouteRover · ReleaseCaptain · AuditTitan

### Platform and Tooling
CursorSage · CodexSmith

---

## Quick Invocation Reference

| What you need to do | Agent to invoke |
|---------------------|----------------|
| Understand the current state before starting | Pathfinder |
| Design a plan for a new task | ForgeMind |
| Execute an approved plan | PatchPilot |
| Fix a typecheck or test failure | BuildWarden |
| Take screenshots after a UI change | PixelProof |
| Review copy for public claim safety | ClaimGuard |
| Check for secrets before committing | SecretHawk |
| Update a README or index doc | ReadMeRanger |
| Assemble the Proof Packet | ProofSmith |
| Prepare for a release or investor demo | ReleaseCaptain |
| Audit UI consistency | InterfaceMonk |
| Check route health | RouteRover |
| Map Workcell dependencies | WorkGraphWeaver |
| Set up Cursor IDE for this repo | CursorSage |
| Run a Codex session | CodexSmith |
| Prepare investor materials | BoardroomOracle |
| Write product content | NarrativeForge |
| Run a full platform audit | AuditTitan |
