<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# Changelog — Khipu Doctrine Open Spec

All notable changes to this spec are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the spec follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-04-26

Initial public draft. Authored and operated by A11oy. Grounded in `KHIPU_RESEARCH_SWEEP.md`.

### Added
- `Constitution` — versioned, machine-readable behavior contract for an agent.
- `SystemCard` — per-agent disclosure: capabilities, scope, evals, residual risks.
- `RiskReport` — periodic, board-ready aggregate of governed posture.
- `BehavioralAuditFinding` — one observation from a Petri-style behavioral audit.
- `WelfareTelemetrySample` — one welfare-signal observation; aggregated, never user-replayable.
- `AdversarialRobustnessScore` — per-snapshot score (0–100) per attack category.
- `SnapshotFingerprint` — bit-exact identity of a workcell snapshot.
- `CovenantLiftSample` — one paired governed-vs-shadow brief outcome.
- `PillpintuPartnerAttestation` — per-partner record: vetting, scope, dual-approval, revocation log.
- `CoordinatedAgentVulnerabilityDisclosure` — hash-now / disclose-later record per CAVD protocol.
- Shared `_shared.json` schema with reusable `$defs` (SemVer, ISO timestamp, SHA-256 hash, signature envelope).
- TypeScript companion types in `types/index.d.ts`.

### Notes
- Backward compatibility: every consumer must accept unknown additive fields. Producers must include the `specVersion` discriminator on every artifact.
- Out of scope for this version: any model-training schema, real CBRN classifier output schema, mobile-only artifact kinds.
