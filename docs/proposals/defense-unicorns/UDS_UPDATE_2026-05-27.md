# UDS Update — 2026-05-27

**Author:** Stephen Paul Lutar · SZL Holdings
**Audience:** Defense Unicorns team, UDS pull partners
**Window:** since the per-product UDS release cut (2026-05-26/27)

---

## TL;DR

- **No bundle re-release required this window.** All five published bundles (`a11oy uds-v0.1.1`, `sentra uds-v0.2.0`, `amaru uds-v0.1.0`, `rosie uds-v0.1.0`, `vessels uds-v0.1.0`) still match the kernels they ship — the new code landed in the live web / API artifacts above the kernel line, not in the bundled runtimes.
- **One material expansion is queued:** rolling the new `perception-loop`, `sequence-pipeline`, and `sparse-attention-kit` shared packages into a `uds-v0.2` bundle cut. This needs `build.sh` scaffolding (additional staged packages + manifest entries) and is a planned next cut, not a hot-fix.
- **Operational posture:** 8/8 artifact workflows green, 0 high/critical alerts, doctrine v6 sweep clean, risk-formula drift clean.

## What shipped since the last cut

| Area | Change | Receipt class added / touched |
|---|---|---|
| **Vessels** | Dark-vessel signal mesh now driven by real live AIS (Digitraffic + BarentsWatch), not synthetic. Provider provenance surfaced in UI. | `voyage.lambda.v1`, `ais.gap.v1` |
| **Vessels** | `/vessels-cognitive` signal-mesh endpoint shape locked with snapshot test. | n/a (test only) |
| **Vessels** | Deterministic 3D ShipPortScene3D with real glTF mesh assets. | n/a (rendering) |
| **A11oy** | Perception-loop + sequence-pipeline primitives wired into reviewer flow and reliquary. Reviewer presence + peak detection *mixed* into AMI (max for N/D, multiplicative damper for G), never overwritten. Privacy invariant (raw frame bytes never in envelope) enforced by serialization test. | `perception.envelope.v1`, `peak.detector.v1`, `reviewer.presence.v1` |
| **Warhacker** | Replay-by-trace-ID on every demo run. Lane 1 shows real signed bundle hashes + signer DIDs from release artifacts. Bundle×detector matrix regression tests. | `replay.trace.v1`, `bundle.signed.v1` |
| **Sentra** | PARAGON sub-brand absorbed into Sentra. Detector Council + incident triage wired to perception/bio primitives. | n/a (consolidation) |
| **Research** | Sparse-attention synthesis 2026 (MiniMax M1/M2, DeepSeek NSA, Moonshot MoBA, FlashAttention, FLA). 12 new `sparse.*.v1` receipt classes; contradiction-probe gates hybrid → full attention escalation. | `sparse.*.v1` (×12) |
| **Doctrine** | Forbidden-pattern list trimmed (founder name + suffix removed — author identity, not a forbidden term). v6 sweep clean against 332 grandfathered entries. | n/a |

## UDS release decision matrix

For each bundle, the question is: *did the kernel source it ships change since the published tag?*

| Bundle | Published | Kernel source dir | Changed since tag? | Action |
|---|---|---|---|---|
| `a11oy-uds` | `uds-v0.1.1` (2026-05-26) | `artifacts/a11oy/packages/a11oy-core`, `a11oy-connection` | **No** — perception/bio work added *new shared* packages outside the existing bundle scope | None now; queue for `v0.2` expansion |
| `sentra-uds` | `uds-v0.2.0` (2026-05-27) | `artifacts/sentra-uds/lib/` | **No** | None |
| `amaru-uds` | `uds-v0.1.0` (2026-05-26) | `artifacts/amaru-uds/lib/` | **No** | None |
| `rosie-uds` | `uds-v0.1.0` (2026-05-27) | `artifacts/rosie-uds/lib/` | **No** (Warhacker work is in `artifacts/rosie/`, above the kernel line) | None |
| `vessels-uds` | `uds-v0.1.0` (2026-05-27) | `artifacts/vessels-uds/lib/` | **No** (live AIS work is in `artifacts/api-server/src/routes/vessels-cognitive.ts`, above the kernel line) | None |

The honest pattern: we cut clean per-product release tags on 2026-05-26/27, then most of the week's work landed in the *consuming* artifacts (live web + API services), not in the bundled kernels themselves. That's the right layering — a kernel that re-bumps on every UI tweak isn't a kernel — but it means there's nothing to re-publish to GitHub right now.

## What `v0.2` will be (planned, not in this window)

The work that *would* warrant new bundle cuts is the shared-package expansion:

- `packages/perception-loop` — perception envelope + peak detector + reviewer presence primitives (currently consumed by A11oy, Sentra, Amaru web/api).
- `packages/sequence-pipeline` — sequence-pipeline primitive (perception/bio synthesis).
- `packages/sparse-attention-kit` — 12 new `sparse.*.v1` receipt classes + contradiction-probe gating.

Rolling these into the relevant `*-uds` bundles requires:

1. Extending each bundle's `scripts/build.sh` to stage the additional packages.
2. Adding manifest entries + per-file sha256 to `MANIFEST.json`.
3. Bumping `package.json` + `uds-bundle.yaml` `metadata.version` + `ref` in lockstep.
4. Cosign-signing + publishing a fresh `.tar.zst` + `.sig` + `.sha256` + `.pub` set to each per-product repo (`szl-holdings/<product>`).
5. Updating per-bundle `OPERATOR-QUICKSTART.md` to document the new entrypoints.

This is a deliberate next cut — scoped, signed, smoke-tested from the public asset URL (per memory `a11oy-uds-release-flow.md`), with the manifest-driven gate (`scripts/release/uds-release.sh`) as the green light. Not a single-session hot-fix.

## Where to pull today

Per-product release pages remain the canonical pull surface:

- `https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.1.1`
- `https://github.com/szl-holdings/sentra/releases/tag/uds-v0.2.0`
- `https://github.com/szl-holdings/amaru/releases/tag/uds-v0.1.0`
- `https://github.com/szl-holdings/rosie/releases/tag/uds-v0.1.0`
- `https://github.com/szl-holdings/vessels/releases/tag/uds-v0.1.0`

Each release ships `<name>-<version>.tar.zst` + `.sha256` + `.sig` and the dev cosign public key. The `uds-pull-guide.md` walkthrough in this directory still applies unchanged.

— Stephen
