# Changelog

All notable changes to `@szl/a11oy-code`. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## [1.0.0] — 2026-05-05

Initial public release.

### Added
- Terminal-native REPL (`a11oy-code` binary) with Plan → Tool-call → Reflection loop.
- Ouroboros self-revising planner — the planner critiques and rewrites its own plan turn-over-turn.
- Lutar-routed tool selection — every tool dispatch is scored against the Lutar invariant before execution.
- Multi-provider model router under 5-gate governance (Anthropic Claude, Moonshot Kimi, OpenAI incl. GPT-5.5 when registered, Google Gemini, Hugging Face hubs).
- Tool surface: `read`, `write`, `edit`, `shell`, `git`, `web_search`, `hf_search`, `thesis_lookup`, `formula_lookup`, `proof_query`, `subagent`.
- Skills, hooks, plan-lock, and sub-agents — first-class.
- Per-turn MirrorEval scoring with bounded autonomous self-evolution: safe-class proposals auto-apply with rollback armed; boundary- and doctrine-class queue for review.
- Hard safety envelope: global kill-switch, per-session opt-out, immutable audit ledger, configurable 24h auto-apply cap (default 50), one-command revert of last N auto-applies.
- Multi-provider router with a deterministic offline registry; live frontier-registry consultation is wired in [#4885](https://github.com/szl-holdings/a11oy/issues/4885).
- Same engine is consumable as a library by the in-A11oy `/code` panel; full panel rewire to share runtime state lands in [#4886](https://github.com/szl-holdings/a11oy/issues/4886).
- Opt-in anonymized telemetry — off by default; explicit `--telemetry` flag required; every session ends with a proof-ledger `telemetry` entry recording whether a payload was sent.
