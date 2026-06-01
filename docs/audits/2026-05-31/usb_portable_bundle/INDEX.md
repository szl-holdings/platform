# INDEX — Master Manual + USB Portable Bundle

All deliverables for the "Master Manual + USB Portable Bundle" task.
Working directory: `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/usb_portable_bundle/`

## Deliverable files
| File | What it is |
| --- | --- |
| `SZL_MASTER_STUDY_MANUAL.docx` | The 204-page Word master study manual (Parts I–X). 9.26 MB. |
| `SZL_MASTER_STUDY_MANUAL.pdf` | PDF render used for page count (204pp). 7.38 MB. |
| `USB_BUNDLE_PATH.md` | Bundle dir + zip path, sizes, tree. |
| `HF_DATASET_URL.md` | HF dataset URL + repo contents. |
| `TOTAL_PAGES.md` | Page count (204) + python-docx stats. |
| `VERIFICATION.md` | Full hard-verification: page count, 10 live curl 200s, manifest excerpt, scripts, doctrine numbers, rosie honesty reconciliation. |
| `INDEX.md` | This file. |

## Build sources (reproducible)
- `docxw.py` — dependency-free streaming .docx writer.
- `canon_py.py` — LOCKED doctrine v11 constants.
- `content_a.py` … `content_o.py` — 15 content modules (Parts I–X + appendices).
- Data: `lean_data.py`, `gallery_data.py`, `decls_data.py`, `source_data.py`.
- `build_manual.py` — assembles the manual; `build_root_docs.py` — QUICKSTART/CONTACT;
  `make_manifest.py` — bundle manifest; `push_hf.py` — founder-token HF push.

## USB bundle
- Dir: `/home/user/workspace/szl_usb_bundle/` (manuals/, code/, data/, proofs/, web/ + AUTORUN.md, QUICKSTART.docx, CONTACT.docx, LICENSE, manifest.json).
- Zip: `/home/user/workspace/szl_usb_bundle_2026-06-01.zip` (14.24 MB, 50 entries, integrity PASS).

## Hugging Face
- https://huggingface.co/datasets/SZLHOLDINGS/usb-bundle-v1 (HTTP 200).

## Honest framing & rules met
- Quechua names = cultural-heritage branding, not magical/secret-wisdom claims.
- Apache 2.0 license. Signed by Yachay (Stephen P. Lutar Jr.), ORCID 0009-0001-0110-4173.
- Doctrine v11 LOCKED numbers verbatim in every chapter.
- rosie brain endpoints corrected to real live paths (`/api/rosie/v1/brain/...`) — no bandaid.
