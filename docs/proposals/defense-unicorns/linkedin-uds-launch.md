# LinkedIn — UDS team pull narrative

**Audience:** Defense Unicorns engineers, UDS platform operators, and the broader UDS community.
**Tone:** calm, professional, first-person plural. No emojis.
**Post manually.** Imagery is out of scope.

---

## Long-form LinkedIn post

We spent the last quarter building for one specific reader: the UDS platform operator who needs to pull a bundle, verify it, and deploy it into a restricted cluster without leaving the command line.

Here is what we shipped, and exactly how a fellow UDS team can run it today.

**What we built**

- Four signed, deterministic UDS bundles — `a11oy-uds`, `sentra-uds`, `amaru-uds`, `rosie-uds` — each shipped as `tar.zst` with a `sha256` sidecar and (when keys are configured) a `cosign` `.sig`.
- A governed decision fabric (ROSIE) that is deny-by-default, refuses to load contradictory policy sets, and emits a hash-chained receipt on every decision.
- Five Warhacker 2026 lanes wired to live POST endpoints on our platform API — every lane mints a fresh Doctrine V6 receipt chain in front of the operator, no slideware.

**Why it matters for UDS operators**

- Three commands per bundle: download, verify, deploy. No bespoke tooling, no GHCR pull required for the demo path, no new auth surface.
- Every bundle ships its own `ATTESTATIONS.json` hash chain. Auditors can re-walk the chain against `MANIFEST.json` and prove no in-flight tampering.
- The release pipeline (`scripts/release/uds-release.sh`) is deterministic — sorted entries, `owner=0`, fixed mtime — so any operator can rebuild locally and byte-compare against what we shipped.

**The five Warhacker lanes, mapped to bundles**

1. *Fragmented Satellite Ground Software* — `rosie-uds` + `sentra-uds` + `amaru-uds` + `a11oy-uds`. One bundle composition, one attestation chain, one Loki + Prometheus plane.
2. *Military Deployment Health Screening* — `amaru-uds`. Schema-grounded extraction into unit-readiness rollups.
3. *AI Oversight for Autonomous Drones* — `rosie-uds`. Graph plan → CTM tick → Λ-invariant hold/fail, every step a receipt.
4. *Trajectory Data Visualization* — `rosie-uds`. Pipeline-stage receipts feeding an operator context card.
5. *AI at the Tactical Edge* — `rosie-uds` + `sentra-uds`. Edge drill plus an antivenom classifier that catches poisoned inputs before any downstream agent sees them.

**How to pull a bundle (three commands)**

Set `TAG` and `VERSION` to the release you want, pick a `BUNDLE` from `{a11oy-uds, sentra-uds, amaru-uds, rosie-uds}`, then:

```bash
# 1. download
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/${BUNDLE}-${VERSION}.tar.zst
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/${BUNDLE}-${VERSION}.tar.zst.sha256
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/${BUNDLE}-${VERSION}.tar.zst.sig

# 2. verify (sha256 always; cosign when the .sig is present)
sha256sum -c ${BUNDLE}-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key szl-cosign.pub \
       --signature ${BUNDLE}-${VERSION}.tar.zst.sig \
       ${BUNDLE}-${VERSION}.tar.zst

# 3. deploy
zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm
```

**The four bundle URLs** (substitute `${TAG}` and `${VERSION}`):

- `https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/a11oy-uds-${VERSION}.tar.zst`
  `sha256sum -c a11oy-uds-${VERSION}.tar.zst.sha256`
- `https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/sentra-uds-${VERSION}.tar.zst`
  `sha256sum -c sentra-uds-${VERSION}.tar.zst.sha256`
- `https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/amaru-uds-${VERSION}.tar.zst`
  `sha256sum -c amaru-uds-${VERSION}.tar.zst.sha256`
- `https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/rosie-uds-${VERSION}.tar.zst`
  `sha256sum -c rosie-uds-${VERSION}.tar.zst.sha256`

The `cosign.pub` public key lives on the same release page — download it once as `szl-cosign.pub` and reuse it across every SZL bundle in the release line.

**If you want to see it before you deploy**

- The per-lane route, backend dependency, and a captured receipt sample are in our readiness checklist: `docs/proposals/defense-unicorns/warhacker-2026-readiness.md`.
- The full pull guide (per-bundle commands, fallback to sha256-only, reproducing the release locally, registering a new bundle) is in `docs/proposals/defense-unicorns/uds-pull-guide.md`.
- The Warhacker Hub itself lives at `/rosie/warhacker` — click *Run This Demo* on any lane card to mint a live receipt chain.

If you operate a UDS cluster and want to try a pull, we are happy to walk it with you. Reply here or open an issue on `szl-holdings/szl-holdings-platform`.

— SZL Holdings

---

## Short variant for X / Twitter (≤280 chars)

> Four signed UDS bundles — a11oy-uds, sentra-uds, amaru-uds, rosie-uds — each a three-command pull: download, sha256 + cosign verify, `zarf package deploy`. Five Warhacker lanes wired to live receipt chains. Guide: docs/proposals/defense-unicorns/uds-pull-guide.md
