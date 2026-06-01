# USB Bundle Path

## Bundle directory (USB-portable layout)
`/home/user/workspace/szl_usb_bundle/`

## Bundle archive (zip)
`/home/user/workspace/szl_usb_bundle_2026-06-01.zip`

| Property | Value |
| --- | --- |
| Zip size | 14,241,666 bytes (13.58 MiB / 14.24 MB) |
| Zip entries | 50 files |
| Zip integrity | `unzip -t` PASS |
| Zip sha256 | `d225783fcbdb608d3304a5d1c3120596610179207ab12530def34c017c259901` |
| Manifest artifacts | 42 files, 17,010,472 bytes (16.22 MB) uncompressed |
| Target | < 2 GB — PASS (well under) |

## Directory tree (top level)
```
szl_usb_bundle/
├── AUTORUN.md          (entry point / how to use the stick)
├── QUICKSTART.docx     (Word quick-start)
├── CONTACT.docx        (Word contact card)
├── LICENSE             (Apache 2.0)
├── manifest.json       (42 artifacts + sha256 each)
├── manuals/            (SZL_MASTER_STUDY_MANUAL.docx + .pdf, 204pp)
├── code/               (offline_up.sh, verify_replay.sh, verify_endpoints.sh,
│                        manual_build/ — all content_*.py + build scripts)
├── data/               (DATASETS.md)
├── proofs/             (lean_core/ 6 .lean + 31/32/34 audit .md)
└── web/                (index.html offline landing)
```

## Notes
- Layout is FAT32/exFAT-safe (plain folders, no symlinks) so it copies to a real USB stick.
- `code/verify_endpoints.sh` checks one live endpoint per canonical Space; reports 000 (unreachable) in air-gapped mode, which is the correct air-gap behaviour.
- Apache 2.0 license at root. Signed by Yachay (Stephen P. Lutar Jr.), ORCID 0009-0001-0110-4173.
