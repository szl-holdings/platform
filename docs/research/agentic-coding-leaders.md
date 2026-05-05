# Agentic Coding Leaders — Audit & Pattern Extraction

> Companion to A11oy Code (`tools/a11oy-code/`). Captures what each leader does,
> what we kept, what we improved, and license / attribution context. We absorbed
> design ideas under each project's public docs; we did not copy code.

Last reviewed: 2026-05-05.

## Scope

For each leader we record:

- **Design summary** — the architectural shape that makes it distinctive.
- **What we kept** — the patterns that landed in A11oy Code.
- **What we improved** — where A11oy Code goes past it.
- **License / attribution** — the footing on which we absorb design ideas.

We deliberately do **not** include source-code excerpts. Patterns are absorbed
under fair-use of public documentation; concrete implementations are our own.

---

## 1. Claude Code (Anthropic)

- **Design summary.** Terminal-native pair-programmer. Plan → tool-call → reflection loop driven by Claude. First-class file-edit, shell, web-search and sub-agent tools. "Skills" let teams ship reusable instructions; hooks intercept lifecycle events; plan-lock protects in-flight plans from being torn up mid-execution.
- **What we kept.** The terminal-native loop shape; first-class skills, hooks, plan-lock, sub-agents; the principle that the agent's tools are a small, well-typed registry rather than an open shell.
- **What we improved.** Every tool dispatch is Lutar-scored and proof-tagged; the planner is wrapped in Ouroboros so each plan is critiqued and rewritten before the next dispatch; we are model-portable (Claude is one provider among five) and we add bounded autonomous self-evolution under MirrorEval that Claude Code does not currently expose.
- **License / attribution.** Anthropic public docs; absorbed as design inspiration under fair-use, no source imported.

## 2. Cursor (Anysphere)

- **Design summary.** IDE-native agent + editor. Strong UX around inline diffs, ⌘K command palette, codebase-wide chat. Background indexer keeps the codebase embedded for retrieval.
- **What we kept.** The in-IDE / in-app panel as a first-class surface (we ship an in-A11oy `/code` panel beside the CLI); diff-first edit ergonomics.
- **What we improved.** A11oy Code is also a public, OS-portable CLI; every retrieval and edit is proof-tagged; planning is governed by the same 5-gate model router as the rest of A11oy.
- **License / attribution.** Cursor docs and public engineering posts; commercial closed source — no code touched.

## 3. Aider (paul-gauthier)

- **Design summary.** Open-source CLI pair-programmer. Pioneered "edit-block" diff format and aggressive git-commit-per-edit so every change is reviewable.
- **What we kept.** The discipline of recording every edit immediately (we record to the proof ledger; git commits are still up to the user) and the small, narrow tool surface.
- **What we improved.** We add Ouroboros plan revision, Lutar tool routing, multi-provider governed routing, and bounded autonomous self-evolution.
- **License / attribution.** Apache-2.0. Patterns absorbed; no source copied.

## 4. Cline (formerly Claude Dev)

- **Design summary.** VS Code extension agent. Notable for the explicit "approve every action" UX that surfaces tool calls one-by-one to the human.
- **What we kept.** The principle that mutating tools should be inspectable before they fire — A11oy Code's verify-before-mutate Ouroboros pass and proof ledger play the same role programmatically.
- **What we improved.** We add the formal blast-radius classifier (`safe` / `boundary` / `doctrine`) so the operator only sees the proposals that actually matter, instead of being asked to approve every read.
- **License / attribution.** Apache-2.0. Patterns absorbed; no source copied.

## 5. Codex CLI (OpenAI)

- **Design summary.** Lightweight CLI front-end to OpenAI's coding models. Emphasizes streaming and easy install (`npm i -g`).
- **What we kept.** The npm install path and binary ergonomics — `npm i -g @szl/a11oy-code` lands an `a11oy-code` binary on PATH, no other config required.
- **What we improved.** Multi-provider not single-provider; proof-tagged not opaque; self-evolving not static.
- **License / attribution.** OpenAI public docs and the open Codex CLI repo (Apache-2.0). No source copied.

## 6. Devin (Cognition)

- **Design summary.** Hosted autonomous SWE agent. Notable for long-horizon planning and an explicit "session replay" surface where a human reviews the agent's full trajectory after the fact.
- **What we kept.** The notion that **every** step of the trajectory must be replayable. Our proof ledger is the local, hash-chained equivalent.
- **What we improved.** Devin is hosted, opaque, and approval-gated end-to-end; A11oy Code is local, transparent, and bounded-autonomous — autonomy lives only inside the safe-class blast radius and is bounded by a kill-switch and a 24h cap.
- **License / attribution.** Cognition public material; no code touched.

## 7. Continue (Continue.dev)

- **Design summary.** Open-source IDE assistant with a strong "config.json" model that lets teams pin providers, models, and tools per repo.
- **What we kept.** Per-repo model pinning via `--provider` / `--model` flags and a future per-repo config file.
- **What we improved.** We add governance gates around model selection and the frontier-registry auto-update loop.
- **License / attribution.** Apache-2.0. Patterns absorbed; no source copied.

## 8. Sweep (sweep-ai)

- **Design summary.** GitHub-issue → PR autonomous agent. Strong at issue triage and codebase-wide refactor planning.
- **What we kept.** The pattern of treating an issue as the agent's planning seed.
- **What we improved.** A11oy Code's planner is Ouroboros-wrapped, so the issue's plan is iterated within the session rather than committed-to-and-shipped.
- **License / attribution.** GPL-3.0 (server) / open source. No source copied.

## 9. Goose (Block / Square)

- **Design summary.** Open-source CLI agent with an extensible "extension" system inspired by MCP. Focus on local execution.
- **What we kept.** Local-first execution and an extensible tool registry surface.
- **What we improved.** Lutar-scored dispatch, proof ledger, bounded self-evolution.
- **License / attribution.** Apache-2.0. Patterns absorbed; no source copied.

## 10. OpenHands (formerly OpenDevin)

- **Design summary.** Open-source autonomous agent with a strong sandbox model and replay UI.
- **What we kept.** The discipline of confining the agent's shell tool to an allowlist so the blast radius is bounded by construction.
- **What we improved.** We formalize the blast-radius taxonomy beyond the shell — all self-modifications are classified and the autonomy envelope is hard-coded into the evolution subsystem.
- **License / attribution.** MIT. Patterns absorbed; no source copied.

---

## Cross-cutting patterns we did **not** keep

- **"Approve every step" UX.** Heavy approval surfaces train operators to stop reading; we keep approvals for boundary- and doctrine-class proposals only.
- **Background autonomous PR-writing without an audit ledger.** We require every step to land in the proof ledger before any auto-apply is allowed.
- **Single-provider lock-in.** Every leader that pins to one provider becomes brittle when that provider has an outage, a price spike, or a policy change. A11oy Code is multi-provider by construction.

## What this audit feeds

- `tools/a11oy-code/` — implementation.
- `docs/research/a11oy-code-edge.md` — concrete capabilities where we surpass each leader.
- `services/frontier-ingest/` — model registry that the router consults for auto-update.
