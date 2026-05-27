# UDS Bundle Matrix — air-gap-ready

Single source of truth for the four flagship UDS bundles that compose the
SZL Holdings air-gapped stack. Each bundle is a signed Zarf package
(`zarf package create`) with a per-file `MANIFEST.json`, doctrine demo,
and hash-chained Proof Chain. All four are produced by their respective
`scripts/build.sh` and signed with the project cosign key
(see `.agents/memory/a11oy-uds-release-flow.md`).

| Bundle | Source | Doctrine kernel pillars | Capabilities added by current evolution sprint |
|---|---|---|---|
| **a11oy-uds** | `artifacts/a11oy-uds/` | Fisher manifold · Bohr complementarity engine · KS-18 contextuality witness · POVM verdict semantics · tetrad-field gauge connection | AMI v2 with Adversarial-Resistance (`A`) multiplier; Sotopia-calibrated approvals (per-operator·domain resonance band); Reliquary episodic recall; UniRec briefing recommender; antivenom-fabric pattern classifier |
| **sentra-uds** | `artifacts/sentra-uds/` | Asset-scoped fail-closed Safety Gate · risk + financial-exposure formulas · z-score + KL drift · Ising allocation · NIST CSF 2.0 / SP 800-61r2 / CISA CIRCIA / MITRE D3FEND mappings · Proof Chain | Detector Council (multi-detector quorum); Temporal Anomaly Scoring; Antivenom detector class; CTM broadcast bus |
| **amaru-uds** | `artifacts/amaru-uds/` | Doctrine V6 convergent-sync kernel (Lutar Σ · Λ-floor · Bekenstein gate · bounded-loop convergence · 9-axis AND · KL drift · Proof Chain) | Unstructured / Visual ingestion paths; Episodic mapping recall |
| **rosie-uds** | `artifacts/rosie-uds/` (new) | Graph Planner · CTM-Loop deliberation · Time-R1 (Allen-13) temporal engine · MARBLE Bench scoring · Drone-Oversight gate · Proof Chain | Drone-oversight demo paired with sentra-uds at the tactical edge |

## Warhacker 2026 coverage

| Problem | Bundles |
|---|---|
| 1. Fragmented Satellite Ground Software | The bundle matrix itself — four signed Zarf payloads under one attestation chain. |
| 2. Military Deployment Health Screening | `amaru-uds` (Conduit/Amaru ingest + 9-axis AND gate on screening forms) |
| 3. AI Oversight for Autonomous Drones | `rosie-uds` + `sentra-uds` (plan→deliberate→time→approve, antivenom on telemetry) |
| 4. Trajectory Data Visualization | `rosie-uds` (Time-R1 fusion) + Vessels web surface |
| 5. AI at the Tactical Edge | `rosie-uds` + `sentra-uds` (edge adversary drill) |

## Build · sign · deploy

The same flow applies to every bundle. Replace `<bundle>` with one of
`a11oy-uds`, `sentra-uds`, `amaru-uds`, `rosie-uds`.

```bash
# Build (writes dist/<bundle>/<bundle>-<version>.tar.zst)
bash artifacts/<bundle>/scripts/build.sh

# Sign with project cosign key
COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD="" \
  cosign sign-blob --yes \
    --output-signature dist/<bundle>/<bundle>-0.1.0.tar.zst.sig \
    dist/<bundle>/<bundle>-0.1.0.tar.zst

# Smoke-test from the public URL (NOT a local file — see memory note)
curl -fL "$PUBLIC_RELEASE_URL/<bundle>-0.1.0.tar.zst" -o /tmp/<bundle>.tar.zst
cosign verify-blob --key artifacts/<bundle>/release-keys/cosign.pub \
  --signature /tmp/<bundle>.tar.zst.sig /tmp/<bundle>.tar.zst

# Deploy at the air gap
zarf package deploy /tmp/<bundle>.tar.zst --confirm
node /opt/<bundle-short>/doctrine-demo.mjs /opt/<bundle-short>/lib
```

Expected exit line: `RESULT: PASS — all pillars green`.

## Verification commands per bundle

| Bundle | Demo command |
|---|---|
| a11oy-uds | `node /opt/a11oy/doctrine-demo.mjs /opt/a11oy/lib` |
| sentra-uds | `node /opt/sentra/doctrine-demo.mjs /opt/sentra/lib` |
| amaru-uds | `node /opt/amaru/doctrine-demo.mjs /opt/amaru/lib` |
| rosie-uds | `node /opt/rosie/doctrine-demo.mjs /opt/rosie/lib` |

## See also

- `.agents/memory/a11oy-uds-release-flow.md` — build/sign/smoke flow.
- `.agents/memory/ami-v2-A-multiplier.md` — the new antivenom-driven gate that ships in a11oy-uds.
- `docs/research/agi-stack-synthesis-2026.md` §13 — Warhacker problem→capability mapping.
