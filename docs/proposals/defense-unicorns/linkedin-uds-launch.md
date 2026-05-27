# LinkedIn — UDS team pull narrative

**Audience:** Defense Unicorns engineers, UDS platform operators, and the broader UDS community.
**Tone:** calm, professional, first-person plural. No emojis.
**Post manually.** Imagery is out of scope.

---

## Long-form LinkedIn post

We spent the last quarter building for one specific reader: the UDS platform operator who needs to pull a bundle, verify it, and deploy it into a restricted cluster without leaving the command line.

Here is the full picture of what we shipped, and exactly how a fellow UDS team can run it today.

**What we built**

- **Five signed, deterministic UDS bundles, each on its own GitHub repo:**
  - `szl-holdings/a11oy` — A11oy.UDS (brand-orchestration kernel)
  - `szl-holdings/sentra` — Sentra.UDS (cyber-resilience runtime)
  - `szl-holdings/amaru` — Amaru.UDS (convergent data-sync runtime)
  - `szl-holdings/rosie` — ROSIE.UDS (governed decision fabric)
  - `szl-holdings/vessels` — Vessels.UDS (maritime intelligence kernel)

  Each bundle is shipped as `tar.zst` with a `sha256` sidecar and a `cosign` `.sig`. Builds are reproducible (sorted entries, `owner=0`, fixed mtime), so any operator can rebuild locally and byte-compare against the release asset.
- **A governed decision fabric (ROSIE)** that is deny-by-default, refuses to load contradictory policy sets, and emits a hash-chained receipt on every decision. Fresh landing surface with a new design language (graphite + tungsten + halon, Newsreader/Inter/JetBrains Mono), every CTA reaches the live backend.
- **A Warhacker Hub at `/rosie/warhacker`** with all five Defense Unicorns problem lanes wired to live POST endpoints. Every lane mints a fresh Doctrine V6 receipt chain in front of the operator — no slideware. Lane 1's bundle matrix reads real signed sha256 sidecars and `did:key:cosign:sha256:…` signer DIDs from the artifact's release key. Every run is replayable by trace ID.
- **A maritime intelligence surface (Vessels)** running on real, free public AIS feeds (Digitraffic, plus BarentsWatch when credentials are provided), with per-feed provenance chips showing whether positions are live, cached, or unavailable. The Voyage Twin page renders the procedurally generated ship-and-port scene in deterministic 3D alongside the same scene in 2D, both driven by the USD prim graph from the vessels-uds kernel.
- **A cyber-resilience runtime (Sentra)** with signed command-bundle releases published on `szl-holdings/sentra`, plus an asset-scoped fail-closed Safety Gate. Brand consolidated end-to-end so investors see one wordmark, not three.
- **A unified release pipeline** (`scripts/release/uds-release.sh`) that builds every bundle, verifies its sidecar, verifies cosign signatures when keys are present, runs a per-bundle runtime smoke, and emits the assets ready for upload to the matching per-product repo's GitHub Release.

**Why it matters for UDS operators**

- Three commands per bundle: download, verify, deploy. No bespoke tooling, no GHCR pull required for the demo path, no new auth surface.
- Each bundle ships its own `MANIFEST.json` with per-file sha256 + size, and the larger ones ship a hash-chained `ATTESTATIONS.json`. Auditors can re-walk the chain and prove no in-flight tampering.
- Every Warhacker lane mints receipts the same way the bundles do — `prevHash` linked from a 64-zero genesis, derived from canonical JSON, deterministic given the input body. The chain integrity is locked by regression tests in CI.
- The whole posture is auditable from the outside: pull the bundle from the product repo, verify the chain, deploy, then walk the receipts the live system emits — same hash algorithm, same shape, end to end.

**The five Warhacker lanes, mapped to bundles**

1. *Fragmented Satellite Ground Software* — `rosie-uds` + `sentra-uds` + `amaru-uds` + `a11oy-uds`. One bundle composition, one attestation chain, one Loki + Prometheus plane. Lane 1's matrix shows the real signed hashes and signer DIDs when bundles are present on disk.
2. *Military Deployment Health Screening* — `amaru-uds`. Schema-grounded extraction into unit-readiness rollups, with an inline screening form on the hub.
3. *AI Oversight for Autonomous Drones* — `rosie-uds`. Graph plan → CTM tick → Λ-invariant hold/fail, every step a receipt, with a direct deep link into the ROSIE Approvals Inbox carrying the trace + head.
4. *Trajectory Data Visualization* — `rosie-uds` + `vessels-uds`. Pipeline-stage receipts feeding an operator context card and an inline SVG trajectory inspector backed by the vessels-uds CPA + collision-cone kernel.
5. *AI at the Tactical Edge* — `rosie-uds` + `sentra-uds`. Edge drill plus an antivenom classifier that catches poisoned inputs before any downstream agent sees them.

**How to pull a bundle (three commands)**

Each product has its own repo. Pick a `PRODUCT` from `{a11oy, sentra, amaru, rosie, vessels}`, set `BUNDLE=${PRODUCT}-uds`, set `TAG` (e.g. `uds-v0.1.0`) and `VERSION` (e.g. `0.1.0`), then:

```bash
BASE=https://github.com/szl-holdings/${PRODUCT}/releases/download/${TAG}

# 1. download
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sha256
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sig
curl -fSL -O ${BASE}/${BUNDLE}-dev.pub

# 2. verify (sha256 always; cosign when the .sig is present)
sha256sum -c ${BUNDLE}-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key ${BUNDLE}-dev.pub \
       --signature ${BUNDLE}-${VERSION}.tar.zst.sig \
       ${BUNDLE}-${VERSION}.tar.zst

# 3. deploy
zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm
```

The dev cosign public key ships on every release as `<bundle>-dev.pub` — each product's key is repo-scoped, so an operator can trust each bundle independently.

**The five bundle repos** (with current latest tag):

- [`szl-holdings/a11oy`](https://github.com/szl-holdings/a11oy/releases/latest) — A11oy.UDS — Brand-orchestration kernel with hash-chained attestation sidecar (A11oy-V1, KS-18 contextuality witness).
- [`szl-holdings/sentra`](https://github.com/szl-holdings/sentra/releases/latest) — Sentra.UDS — Cyber-resilience runtime with fail-closed asset-scoped Safety Gate (Sentra-V1, NIST CSF 2.0 + D3FEND, Ising allocation).
- [`szl-holdings/amaru`](https://github.com/szl-holdings/amaru/releases/latest) — Amaru.UDS — Convergent data-sync runtime with KL drift + hash-chained proof receipts (V6).
- [`szl-holdings/rosie`](https://github.com/szl-holdings/rosie/releases/latest) — ROSIE.UDS — Governed decision fabric with mandatory witnesses on every decision (ROSIE-V1).
- [`szl-holdings/vessels`](https://github.com/szl-holdings/vessels/releases/latest) — Vessels.UDS — Maritime intelligence kernel: haversine, CPA + collision cone, AIS-gap Λ floor, sanctions screen, voyage receipts.

**If you want to see it before you deploy**

- The Warhacker Hub itself lives at `/rosie/warhacker` — click *Run This Demo* on any lane card to mint a live receipt chain. Every chain is replayable by trace ID.
- The per-lane route, backend dependency, and a captured receipt sample are in our readiness checklist: `docs/proposals/defense-unicorns/warhacker-2026-readiness.md`.
- The full pull guide (per-bundle commands, fallback to sha256-only, reproducing the release locally, registering a new bundle) is in `docs/proposals/defense-unicorns/uds-pull-guide.md`.
- The one-page lane → artifact → bundle → receipt map is in `docs/proposals/defense-unicorns/warhacker-2026-onepager.md`.

If you operate a UDS cluster and want to try a pull, we are happy to walk it with you. Reply here or open an issue on the matching product repo.

— SZL Holdings

---

## Short variant for X / Twitter (≤280 chars)

> Five signed UDS bundles, each on its own repo: szl-holdings/{a11oy,sentra,amaru,rosie,vessels}. Three-command pull: download, sha256 + cosign verify, `zarf package deploy`. Five Warhacker lanes wired to live, replayable receipt chains at /rosie/warhacker.
