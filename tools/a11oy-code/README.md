# A11oy Code

Terminal-native, **governed**, **self-evolving** agentic coding tool.

```bash
npm install -g @szl/a11oy-code
a11oy-code
```

A11oy Code is the terminal surface of the A11oy platform's coding agent. It sits in the same lineage as Claude Code, Cursor, Aider, Cline, Codex CLI, Devin, Continue, Sweep, Goose, and OpenHands — and goes past them on three axes:

1. **Thesis-grounded planning.** Every plan revision and tool dispatch is scored against the Lutar invariant and tagged in a per-step **proof ledger**. Plans are not strings; they are auditable objects.
2. **Ouroboros self-revision.** The planner critiques and rewrites its own plan every turn, so reasoning compounds instead of drifting.
3. **Bounded autonomous self-evolution.** Sub-threshold sessions trigger safe-class auto-applied improvements (with armed rollback), and queue boundary- / doctrine-class proposals for operator review. There is a global kill-switch and a hard 24-hour cap.

This README positions the tool, documents the safety envelope, and shows how to opt into (or out of) every behaviour. Architectural lineage and what we kept from each leader is in [`docs/research/agentic-coding-leaders.md`](../../docs/research/agentic-coding-leaders.md). What we surpass them on is in [`docs/research/a11oy-code-edge.md`](../../docs/research/a11oy-code-edge.md).

---

## Quick start

```bash
# install
npm install -g @szl/a11oy-code

# interactive REPL in the current repo
a11oy-code

# one-shot
a11oy-code "refactor src/eta.ts to use weather API v3, run the tests"

# JSON-mode for scripting / CI
a11oy-code --json "summarize the last 10 commits"

# pin provider + model
a11oy-code --provider anthropic --model claude-4.5

# disable autonomous self-evolution for the session
a11oy-code --no-autonomy

# revert the last 5 auto-applied improvements
a11oy-code evolve revert --last 5

# globally disable autonomous self-evolution
a11oy-code evolve disable
```

## Positioning

| Capability | Claude Code | Cursor | Aider | Cline | Codex CLI | Devin | Continue | Sweep | Goose | OpenHands | **A11oy Code** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Terminal-native | ✅ | — | ✅ | partial | ✅ | — | partial | — | ✅ | partial | ✅ |
| In-IDE / in-app panel | partial | ✅ | — | ✅ | — | ✅ | ✅ | partial | partial | ✅ | ✅ (`/code`) |
| Multi-provider | partial | ✅ | ✅ | ✅ | partial | — | ✅ | partial | ✅ | ✅ | ✅ (governed) |
| Per-step proof ledger | — | — | — | — | — | partial | — | — | — | — | ✅ |
| Self-revising planner (Ouroboros) | partial | — | — | — | — | partial | — | — | — | — | ✅ |
| Thesis-tagged decisions | — | — | — | — | — | — | — | — | — | — | ✅ |
| Bounded autonomous self-evolution | — | — | — | — | — | partial | — | — | — | — | ✅ |
| Public npm distribution | ✅ | — | ✅ (pip) | ✅ | ✅ | — | partial | — | partial | partial | ✅ |
| Open source | partial | — | ✅ | ✅ | ✅ | — | ✅ | partial | ✅ | ✅ | ✅ (MIT) |

## Architecture

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                       a11oy-code REPL                            │
 ├──────────────────────────────────────────────────────────────────┤
 │  Planner  ──►  Ouroboros critic  ──►  revised plan               │
 │     │                                                            │
 │     ▼                                                            │
 │  Lutar tool router  ──►  tool dispatch                           │
 │     │                       │                                    │
 │     ▼                       ▼                                    │
 │  Provider router       File / shell / git / web / HF /           │
 │  (5-gate governance)   thesis / formula / proof / sub-agent      │
 │     │                                                            │
 │     ▼                                                            │
 │  Reflection  ──►  MirrorEval score  ──►  self-evolution proposal │
 │                                              │                   │
 │                          ┌───────────────────┼───────────────┐   │
 │                          ▼                   ▼               ▼   │
 │                    safe-class          boundary-class   doctrine │
 │                  (auto-apply +         (operator queue) (operator│
 │                   armed rollback)                       + author)│
 ├──────────────────────────────────────────────────────────────────┤
 │  Proof ledger (append-only) — every step, every dispatch         │
 └──────────────────────────────────────────────────────────────────┘
```

Concretely:

- **`bin/a11oy-code.mjs`** — entrypoint. Parses argv, boots the REPL or runs one-shot.
- **`src/agent.mjs`** — Plan → Tool-call → Reflection loop.
- **`src/codex/ouroboros.mjs`** — self-referential plan revision.
- **`src/codex/lutar.mjs`** — tool routing + step confidence (re-exports `@szl-holdings/formulas` Lutar invariant when available, falls back to a self-contained pure-function copy when running outside the monorepo so the public install stays self-sufficient).
- **`src/codex/mirroreval.mjs`** — per-turn evaluator.
- **`src/providers/router.mjs`** — multi-provider router with a deterministic offline registry. Live frontier-registry consultation is wired in [#4885](https://github.com/szl-holdings/a11oy/issues/4885); until then, new models are added by bumping the bundled registry.
- **`src/tools/*.mjs`** — tool implementations.
- **`src/evolve/*.mjs`** — blast-radius classifier, safe-class auto-apply with rollback, boundary/doctrine queues, kill-switch, hard cap.
- **`src/proof.mjs`** — append-only proof ledger.

## Safety envelope (read this)

A11oy Code is allowed to apply changes **to itself** — to its own tool descriptions, prompt micro-edits, routing weights, and retry policies — without operator approval, **only** within the safe-class blast radius. Everything boundary-class or doctrine-class is queued for review. The envelope is enforced by:

- **Global kill-switch.** `a11oy-code evolve disable` flips an immutable flag in `~/.a11oy-code/state.json`. All subsequent sessions refuse to auto-apply, regardless of CLI flags.
- **Per-session opt-out.** `--no-autonomy` on any invocation.
- **Hard 24h cap.** Default 50 auto-applies per rolling 24h window, configurable via `~/.a11oy-code/config.json` (`maxAutoAppliesPerDay`). Past the cap, even safe-class proposals queue.
- **Armed rollback.** Each auto-apply is reverted automatically if the next 10 turns' MirrorEval score drops below the pre-apply baseline.
- **Kill-revert.** `a11oy-code evolve revert --last N` reverts the last N auto-applied changes in one command and writes the revert to the proof ledger.
- **Immutable audit.** Every proposal — auto-applied or queued — lands in the append-only proof ledger with formula name, version, input/output hashes, and blast-radius classification.

The envelope is the product. Read [`src/evolve/classifier.mjs`](./src/evolve/classifier.mjs) for the rules.

## Telemetry

Off by default. With `--telemetry`, A11oy Code emits anonymized session metrics (turn counts, MirrorEval scores, auto-apply counts) to the frontier-evolution pipeline. No source code, no diffs, no prompts, no file paths leave your machine. The exact payload schema is in [`src/telemetry.mjs`](./src/telemetry.mjs).

## In-A11oy `/code` panel

The same engine runs inside A11oy's web app at `/code` — editor + terminal pane, deep-link hand-off chip to `/chat`. See `artifacts/a11oy/src/pages/A11oyCode.tsx`.

## License

MIT — see [LICENSE](./LICENSE). Architectural lineage and license-respectful citations for every leader we audited are in [`docs/research/agentic-coding-leaders.md`](../../docs/research/agentic-coding-leaders.md). We absorbed design ideas under each project's public docs; we did not copy code.
