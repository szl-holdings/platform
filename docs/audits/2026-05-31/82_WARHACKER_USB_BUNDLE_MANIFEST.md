# 82 — WARHACKER USB BUNDLE MANIFEST

**Classification:** SZL Internal — Founder Eyes
**Built:** 2026-05-31 (Perplexity sandbox)
**For:** Warhacker, San Diego, June 16–19 2026

---

## FINAL ARTIFACT

| Field | Value |
|---|---|
| **Tarball** | `WARHACKER_USB_BUNDLE_2026-05-31.tar.gz` |
| **Path** | `/home/user/workspace/uds_verify_2026-05-31/WARHACKER_USB_BUNDLE_2026-05-31.tar.gz` |
| **Size** | 12,174,852 bytes (12 MB) |
| **sha256** | `af553b4cc9663d5734a8531843f78305458eed981203d6c222ecdd06267546ef` |
| **Uncompressed dir** | `WARHACKER_USB_BUNDLE/` (12 MB, 24 files) |

Copy `WARHACKER_USB_BUNDLE_2026-05-31.tar.gz` to a USB stick, or copy the unpacked `WARHACKER_USB_BUNDLE/` directory directly.

---

## CONTENTS

```
WARHACKER_USB_BUNDLE/
├── README.md                              operator quickstart + trust model
├── 80_ANDREW_BUNDLE_MANUAL_v0.3.x.md      full bundle manual (the deliverable)
├── VERIFY_ALL.sh                          one-command sha256 + cosign on all 6  [executable]
├── INSTALL_ON_UDS.sh                      zarf/uds deploy onto a UDS cluster     [executable]
└── payloads/
    ├── a11oy/
    │   ├── a11oy-uds-0.3.0.tar.zst              (10,539,040 B)
    │   ├── a11oy-uds-0.3.0.tar.zst.sha256
    │   └── a11oy-uds-dev.pub                    (org dev ECDSA P-256)
    ├── amaru/
    │   ├── amaru-uds-0.3.0.tar.zst              (381,567 B)
    │   ├── amaru-uds-0.3.0.tar.zst.sha256
    │   └── amaru-uds-dev.pub
    ├── sentra/
    │   ├── sentra-uds-0.3.0.tar.zst             (756,132 B)
    │   ├── sentra-uds-0.3.0.tar.zst.sha256
    │   └── sentra-uds-dev.pub
    ├── vessels/                                 ← FULLY SIGNED
    │   ├── vessels-uds-0.3.0.tar.zst            (512,102 B)
    │   ├── vessels-uds-0.3.0.tar.zst.sha256
    │   ├── vessels-uds-0.3.0.tar.zst.sig
    │   ├── vessels-uds-0.3.0.tar.zst.sigstore.json
    │   └── vessels-uds-dev.pub                  (keyless verify instructions)
    ├── rosie/
    │   ├── rosie-uds-0.3.0.tar.zst              (29,364 B)
    │   ├── rosie-uds-0.3.0.tar.zst.sha256
    │   └── rosie-uds-dev.pub
    └── uds-mesh/
        ├── uds-mesh-uds-0.3.0.tar.zst           (69,606 B)
        ├── uds-mesh-uds-0.3.0.tar.zst.sha256
        └── uds-mesh-uds-dev.pub                 (org dev key, from release body)
```

---

## PER-PAYLOAD sha256 (matches GitHub release bodies)

| Organ | tar.zst sha256 | bytes | signed |
|---|---|---|---|
| a11oy | `96a301140ef24c886718e91d122ade83b8db26696ec48681b46653cd753410b8` | 10,539,040 | no (re-sign pending) |
| amaru | `84bbbb362955b5a8330b04f7b73eb7ad02fdc235f23ef71cfa7467b77d1a261c` | 381,567 | no (re-sign pending) |
| sentra | `659a2fb6aa1ea4977c43dd02d485e42369c8b51520d81df5d220f5c58421c2db` | 756,132 | no (re-sign pending) |
| vessels | `a3b1a8c26977ed48270895d10123b3124773517e3155f3ed3287dc7e1d6467b3` | 512,102 | **yes — keyless/Fulcio, Rekor 1675423172** |
| rosie | `c4332b7ce6b1c33a83c548235ee173b1cc6e88722fce7a3ad59b589499325251` | 29,364 | no (re-sign pending) |
| uds-mesh | `44727fdcb89027aed39d39e821302c5e60e2bf2d1d3f5504b508e7099b742eb6` | 69,606 | no (re-sign pending) |

---

## VERIFY_ALL.sh — SANDBOX RUN RESULT (2026-05-31)

```
a11oy     [ OK ] sha256   [WARN] unsigned
amaru     [ OK ] sha256   [WARN] unsigned
sentra    [ OK ] sha256   [WARN] unsigned
vessels   [ OK ] sha256   [ OK ] cosign keyless Verified OK (Rekor 1675423172)
rosie     [ OK ] sha256   [WARN] unsigned
uds-mesh  [ OK ] sha256   [WARN] unsigned

RESULT: ALL CHECKS PASSED (integrity verified; signatures where present)   exit 0
```

The script exits non-zero on any sha256 mismatch (tamper guard) or any failed signature verification, so it is safe to gate deploy on `./VERIFY_ALL.sh && ./INSTALL_ON_UDS.sh`.

---

## KNOWN GAPS CARRIED INTO THE USB (see doc 81 for full P0/P1 list)
- **5 of 6 payloads are unsigned** (no `.sig`). VERIFY_ALL.sh marks them `UNSIGNED` and still passes on sha256. **Re-sign before presenting them as attested** (manual §6, doc 81 P0-1).
- The HF mirror only hosts `.tar.zst`; `.sha256` files in this bundle were generated locally from the downloaded payloads and confirmed equal to the release-body hashes. dev `.pub` keys were pulled from each repo's v0.2.0 release (uds-mesh's was reconstructed from the org-dev-key block in its release body — identical key, sha256 `009a3d59…`).
- Tarballs are repo source, not built Zarf packages → INSTALL_ON_UDS.sh runs `zarf package create` first.

---
*Built and verified in the Perplexity sandbox. Source of expected hashes: GitHub release bodies for szl-holdings/{a11oy,amaru,sentra,vessels,rosie,uds-mesh}.*
