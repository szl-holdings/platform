# A11oy Code — Push-Past-Leaders Edge

> Companion to `docs/research/agentic-coding-leaders.md`. For each leader,
> one concrete capability that A11oy Code does and the leader does not (or
> only does in a degraded form). Every claim points to the implementing file.

Last reviewed: 2026-05-05.

| # | Leader | A11oy Code's edge | Implemented in |
|---|---|---|---|
| 1 | **Claude Code** | Per-step proof ledger. Every plan, every revision, every tool dispatch, every MirrorEval, every self-evolution proposal lands in a hash-chained, append-only file (`~/.a11oy-code/proof.jsonl`). Replay is the default, not an add-on. | `tools/a11oy-code/src/proof.mjs` |
| 2 | **Cursor** | Thesis-grounded planning. Plans cite the formula and thesis section that justified each step. Lookups go through `thesis_lookup` and `formula_lookup` tools that are themselves proof-tagged. | `tools/a11oy-code/src/tools/index.mjs` (`thesis_lookup`, `formula_lookup`) + `lib/formulas/` |
| 3 | **Aider** | Ouroboros self-revising planner. Every turn the planner critiques and rewrites its own plan: drops repeats, sorts by Lutar cost, and injects verify-before-mutate steps. | `tools/a11oy-code/src/codex/ouroboros.mjs` |
| 4 | **Cline** | Formal blast-radius classifier with bounded autonomous self-evolution. Safe-class proposals auto-apply with armed rollback; only boundary- and doctrine-class hit the operator queue. | `tools/a11oy-code/src/evolve/classifier.mjs` + `tools/a11oy-code/src/evolve/index.mjs` |
| 5 | **Codex CLI** | Multi-provider governed routing. The router consults the frontier registry for newly-promoted models — A11oy Code picks them up with zero CLI re-install. | `tools/a11oy-code/src/providers/router.mjs` |
| 6 | **Devin** | Local, transparent autonomy with a kill-switch. Operators can disable autonomous self-evolution globally with one command, hard-cap to 50 auto-applies / 24h, revert the last N in one command. | `tools/a11oy-code/src/evolve/store.mjs` (`setKillSwitch`, `canAutoApplyNow`, `revertLast`) |
| 7 | **Continue** | MirrorEval per turn with a baseline; sub-baseline turns trigger a self-improvement proposal classified by blast radius. The agent's quality is observable, not folkloric. | `tools/a11oy-code/src/codex/mirroreval.mjs` |
| 8 | **Sweep** | Lutar-scored tool dispatch. Every tool selection is scored against a five-axis invariant (precision, recall, latency, blast, cost). The score sits in the proof ledger so dispatch quality is auditable. | `tools/a11oy-code/src/codex/lutar.mjs` |
| 9 | **Goose** | First-class, restricted shell. Allowlisted binaries only, no pipes / redirects, 30s timeout, 1 MB output cap. The shell is a tool, not an escape hatch. | `tools/a11oy-code/src/tools/index.mjs` (`shell` + `SHELL_ALLOWLIST`) |
| 10 | **OpenHands** | Telemetry that defaults to silence. The opt-in payload is a counts-and-scores schema with no source, diffs, prompts, or paths. The default install is observable to nobody but the operator. | `tools/a11oy-code/src/telemetry.mjs` |

## Composite edge

Each line above is one capability per leader; the composite is the real product.
A11oy Code is the only agentic coding tool that, **in the same session**, is:

- terminal-native **and** in-app,
- multi-provider **and** governance-gated,
- self-evolving **and** kill-switched,
- public-npm-distributable **and** thesis-grounded.

If you remove any one of those, you end up at one of the leaders above.

## How to verify a claim yourself

```bash
# 1. Install
npm install -g @szl/a11oy-code

# 2. Inspect the proof ledger after a session
a11oy-code "list the files in src/"
cat ~/.a11oy-code/proof.jsonl | tail -20

# 3. Inspect the evolution state
a11oy-code evolve status

# 4. Trigger the kill-switch
a11oy-code evolve disable
a11oy-code evolve status   # killSwitch: true

# 5. Revert the last N safe-class auto-applies
a11oy-code evolve revert --last 5
```

Every command above writes to the proof ledger; nothing about A11oy Code is
hidden from the operator.
