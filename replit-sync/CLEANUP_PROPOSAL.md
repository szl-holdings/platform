# CLEANUP PROPOSAL — SZL Holdings HF Org

**Author:** Opus 4.8 (Dev3 — Rosie ingest + HF assets instill)
**Date:** 2026-06-08
**HF org:** `SZLHOLDINGS` · **Status:** PROPOSAL ONLY — **do NOT delete; parent/founder handles all deletions.**

This proposal is the JOB 3 deliverable of the "Rosie ingest + HF assets instill" task. It lists (a) showpiece/demo HF Spaces that are now safe to delete and (b) redundant or superseded ORG datasets/collections, each with a concrete reason. Nothing here is deleted by me. Every "safe to delete" claim that depended on a live ingest is gated on the eyes-on verification recorded in `ROSIE_INGEST_HF_INSTILL_REPORT.md`.

---

## A. Showpiece / demo Spaces — SAFE TO DELETE

These are demonstration or staging Spaces whose capability now lives inside the two canonical production apps (`SZLHOLDINGS/a11oy`, `SZLHOLDINGS/killinchu`) or is otherwise superseded. The two canonical apps + `SZLHOLDINGS/anatomy` are the keepers.

| # | Space | Reason safe to delete | Gate |
|---|-------|----------------------|------|
| 1 | `a11oy-staging` | Staging mirror of `SZLHOLDINGS/a11oy`. Production a11oy is RUNNING and serves all current code (commit `89bf0945`). No unique content. | Production a11oy live-verified. |
| 2 | `killinchu-staging` | Staging mirror of `SZLHOLDINGS/killinchu`. Production killinchu is RUNNING (commit `cd57edbb`). No unique content. | Production killinchu live-verified. |
| 3 | `a11oy-mirror` | Pure byte-identical mirror of a11oy. Redundant — GitHub `szl-holdings/a11oy` is the source of truth and HF `SZLHOLDINGS/a11oy` is the canonical deploy. | Byte-identical mirror confirmed. |
| 4 | `khipu-constellation` | Standalone 3D constellation demo. Its visualization role is already covered inside a11oy's organ-substrate tabs (Receipt bus / mesh / lineage) and the new Operator organ topology. Showpiece only. | a11oy organ tabs live. |
| 5 | `operator-shell-demo` | Demo shell for an "operator" surface. Now fully superseded by the **Operator organ** ingested into a11oy (`/operator-organ`, live 3D infra topology). Demo no longer needed. | **GATED on Operator-organ live-verify (DONE — see report).** |
| 6 | `szl-papers-live` | Live papers showpiece. Thesis/papers content is served from the canonical thesis datasets (`thesis-corpus-v18`, `thesis-v24-*`) and surfaced in a11oy/killinchu Evidence/Knowledge tabs via the asset endpoints. Standalone Space redundant. | Evidence/Knowledge asset endpoints live (source=live). |
| 7 | `rosie-3d` (`betterwithage/rosie-3d`) | **The 3D infra-viz Space that was the ingest source for JOB 1.** Its 3D topology capability is now ingested into a11oy as the **Operator organ** (codename "rosie" NOT user-visible; surfaced as "Operator"). | **GATED on Operator-organ live-verify (DONE — see report). Safe to delete only AFTER verification, which is now complete.** |

**Note on #7:** Per task doctrine, I did NOT delete `betterwithage/rosie-3d`. Live verification of the ingested Operator organ is complete (HTTP 200, 3D canvas renders 6-node topology, title "Operator — Live Infrastructure Topology · a11oy", "rosie" string absent from rendered page, 0 console errors, doctrine footer correct). The source Space is therefore confirmed safe for the parent/founder to delete.

---

## B. Redundant / superseded ORG datasets — propose delete or merge

| Dataset | Proposed action | Reason |
|---------|-----------------|--------|
| `szl-payloads` | DELETE | Empty / 0 usable files — no content to lose. Not referenced by any wired app tab in the canonical manifest. |
| `usb-bundle-v1` | DELETE (superseded) | Superseded by `uds-bundles-v1`. The "USB bundle" naming predates the UDS bundle scheme; UDS bundles are the canonical deployment-bundle dataset. Migrate any unique files into `uds-bundles-v1` first, then delete. |
| `thesis-v18-formal-verification` | MERGE then delete | Overlaps `thesis-corpus-v18`. The formal-verification subset can live under the canonical thesis corpus to avoid two near-duplicate thesis datasets. Confirm no unique Lean artifacts before removing (Lean proofs canonical home is `lean-proofs-v1`). |
| `org-card-assets` | REVIEW (candidate) | If only used for the HF org profile card image(s), keep if the org card still references it; otherwise fold into a single brand-assets dataset. Low priority — verify references before any action. |

### Datasets to KEEP (canonical, wired into apps — do NOT delete)
These are referenced by the wired asset endpoints / manifest and must stay:
- `rag-corpus-v1` — agentic-RAG corpus + per-organ FAISS (Knowledge/RAG, both apps; source=live verified)
- `lean-proofs-v1` — Lean 4 theorem library (Formulas/Λ, both apps; source=live verified)
- `thesis-corpus-v18` (+ current `thesis-v24-*`) — thesis/evidence corpus (Evidence/Knowledge tabs)
- `uds-bundles-v1` — canonical deployment bundles
- The canonical formula/evidence/receipts datasets referenced in `HF_ASSET_MANIFEST.json` (canonical-formulas, thesis-formula-index, lean-theorem-tree, lake-receipts, evidence, governance-receipts, spans-receipts, k-verify, yuyay-axis-labels, doctrine)

## C. Redundant / superseded COLLECTIONS — propose consolidation
- Consolidate any duplicate "showpiece"/"demo" collections that only group the Spaces listed in Section A; once those Spaces are deleted, the grouping collections become empty and can be removed.
- Keep the canonical collections that map models/datasets to the two production apps (referenced in `HF_ASSET_MANIFEST.json` → `collections`, 14 entries).
- Action: after Section A deletions, sweep collections for now-empty/orphaned groupings and remove them. Verify each collection's membership before removal.

---

## Doctrine compliance of this proposal
- locked formulas = EXACTLY 8 {F1, F4, F7, F11, F12, F18, F19, F22} — unchanged by any cleanup here.
- Λ = Conjecture 1 — unchanged.
- No user-visible banned codenames introduced; `rosie` ingest surfaced as **Operator**.
- No fabricated data — every "safe to delete" tied to an observed live state or a concrete redundancy.
- **DELETIONS ARE NOT PERFORMED HERE.** This file is advisory; the parent/founder executes deletions.
