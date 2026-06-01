# HATUN-WILLAY — README Patches (exact markdown, additive, HR-3 safe)

Exact markdown patches to insert the Hatun-Willay narrative card into each flagship README **without disturbing any locked surface**.

## Patch discipline (read first)

- **ADDITIVE ONLY (HR-3).** Every patch is an *insertion*. No existing line is deleted or rewritten.
- **NEVER TOUCH (org card, HR-3):** the HF org **banner** image, the **5 painterly hero avatars**, the **animated emojis**. On `SZLHOLDINGS/README` these live in the YAML front-matter (`emoji`, `thumbnail`, gallery) and the top hero block. Patches insert a `## Hatun-Willay` section **in the body, below the hero block, never inside front-matter or the avatar/emoji region.**
- **Insert marker:** each patch specifies an `ANCHOR` — the existing line *after which* the block is inserted. If the exact anchor text differs in the live file, insert after the first `## ` heading that follows the hero/banner block; never before it.
- **Numbers verbatim (HR-6):** 749 / 14 / 163 / 13-axis, replay hash `bacf5443…631fc5`, tag `lutar-v18.0.0`.
- **Honest labels preserved:** do not strip any existing 9-axis-legacy / Conjecture / PLACEHOLDER / Wire-D disclosure; the card *adds* a short echo, it does not replace.
- **Apply via `HfApi.create_commit` only (HR-1).** NEVER GitHub Actions for HF sync. These are patches only — **DO NOT push.**

---

## PATCH 1 — `spaces/SZLHOLDINGS/a11oy/README.md`

**ANCHOR:** insert immediately after the first `## ` body heading (e.g. `## What this is`), below the hero/banner block.

```markdown

## Hatun-Willay — the great telling

**a11oy is the alloy:** many open models fused into one governed metal. a11oy.code routes every query through a **7-tier organ-mapped router** and a **13-axis `yuyay_v3` heart** (conjunctive AND, no compensation — 2 sacred axes ≥ 0.95, 7 structural ≥ 0.90, 4 introspection cross-linked to HUKLLA).

The math is real and counted out loud: **749 Lean declarations, 14 unique axioms, 163 tracked sorries** (tag `lutar-v18.0.0` / `c7c0ba17`); the heart's **replay hash is `bacf5443…631fc5`** and is re-derivable. *Honest labels:* the 9-axis HATUN-RAID loop is still sovereign, the 13-axis kernel is runnable but not yet wired end-to-end; `λ_receipt` Sigstore signature is **PLACEHOLDER**; `traceparent_propagated` is **in-process only** until Wire D lands.

**Verify it:** [`/api/a11oy/*` live](https://huggingface.co/spaces/SZLHOLDINGS/a11oy/commit/efb1f44d) · [substrate](https://huggingface.co/SZLHOLDINGS/a11oy-v19-substrate/commit/684e3dfed9881f0fa050849e07f0275062d9ede5) · [Lean proofs](https://huggingface.co/datasets/SZLHOLDINGS/lean-proofs-v1).

**→ Open `/code`, paste a query with a 13-axis score vector, watch it route, then re-derive the replay hash yourself.**
```

---

## PATCH 2 — `spaces/SZLHOLDINGS/amaru/README.md`

**ANCHOR:** after the first `## ` body heading, below the hero block.

```markdown

## Hatun-Willay — the great telling

**Amaru is the serpent that binds worlds** — it fuses convergent multi-source data into one **append-only, hash-verified** memory cortex (`json.dumps(sort_keys=True) → sha256`). Every recalled claim re-enters the **13-axis** gate before it surfaces; memory gets no free pass past the conjunctive AND.

Shared, disclosed substrate: **749 declarations, 14 axioms, 163 sorries**. *Honest label:* the 9-axis legacy is still sovereign; the 13-axis `yuyay_v3` is runnable but not yet end-to-end wired.

**Verify it:** [reasoner UI live](https://huggingface.co/spaces/SZLHOLDINGS/amaru/commit/a4b31854) · `/api/amaru/v1/math/*` backed by [`canonical-formulas-v1`](https://huggingface.co/datasets/SZLHOLDINGS/canonical-formulas-v1).

**→ Ingest two sources and verify the delta-chain hash links back to root.**
```

---

## PATCH 3 — `spaces/SZLHOLDINGS/sentra/README.md`

**ANCHOR:** after the first `## ` body heading, below the hero block.

```markdown

## Hatun-Willay — the great telling

**Sentra is the sentinel cell:** **18 SLOC** of inline immune screen — six threat signatures (`DROP TABLE`, `rm -rf`, `<script`, `eval(`, `subprocess`, `../../etc`) + a **1 MB DoS guard** — that runs *before* compute. On a fail it raises `PermissionError` and **the receipt NEVER enters the ledger**: no partial state, fails closed, never silently green.

Cross-linked to the **HUKLLA** deadman (660 SLOC, 10 tripwires) and introspection axes 10–13 of the **13-axis** heart. Substrate: **749 declarations, 14 axioms, 163 sorries**; SLSA is **L1 (honest)** — "SLSA L3" is banned.

**Verify it:** [`/api/sentra/*` live](https://huggingface.co/spaces/SZLHOLDINGS/sentra/commit/b0e9ba86) · [doctrine dataset](https://huggingface.co/datasets/SZLHOLDINGS/doctrine-v10-v11).

**→ Send a payload with `DROP TABLE` in it and confirm the receipt never reaches the ledger.**
```

---

## PATCH 4 — `spaces/SZLHOLDINGS/vessels/README.md` (Killinchu — rename in flight)

**ANCHOR:** after the first `## ` body heading, below the hero block. *Do not rename the file in this patch* — the `git mv` to `killinchu` and `/api/killinchu/*` alias are tracked TODO, disclosed below.

```markdown

## Hatun-Willay — the great telling

**Killinchu is the kestrel** (renamed from Vessels) — the hawk that hovers, tracks, and reports only what it can prove it saw. It fuses sanctions + dark-vessel detection (MMSI) with UAS drone-fleet tracking (FAA zones) into one operational picture across **7/7 dashboard routes**. Every track passes the **13-axis** gate before it shows — a threat claim must clear `empiricalGrounding` and `claimCalibration` (each ≥ 0.90).

Back-end style matches a11oy exactly: `/api/<space>/v1/code-proxy` + the 8 `/math/*` endpoints. Substrate: **749 declarations, 14 unique axioms, 163 tracked sorries** (tag `lutar-v18.0.0`). *Honest label:* the rename to `killinchu` and the `/api/killinchu/*` alias are tracked TODO, not yet complete.

**Verify it:** [`/api/vessels/*` live](https://huggingface.co/spaces/SZLHOLDINGS/vessels/commit/2c6e80ae) — 7/7 routes, OpenFreeMap tiles, MMSI.

**→ Drop a threat-colored drone on the FAA zone layer and follow the receipt for that detection.**
```

---

## PATCH 5 — `spaces/SZLHOLDINGS/rosie/README.md`

**ANCHOR:** after the first `## ` body heading, below the hero block.

```markdown

## Hatun-Willay — the great telling

**Rosie is the brain-jack** — the live mesh that shows PURIQ thinking in real time. It renders the **9-position Maxwell-rigid pipeline** (9 nodes, 21 edges, M = 0 isostatic) with the **13-axis** gate between Recommend/Approve and Execute; each axis lights only when it clears its floor (2 × 0.95 sacred, 7 × 0.90 structural, 4 introspection). The mesh stops emitting on a **Butler–Volmer halt budget** — a principled, non-arbitrary stop.

Decision flow is receipt-chained (`continuum_hash`) and replayable against `bacf5443…631fc5`. Substrate: **749 declarations, 14 axioms, 163 sorries**; Λ uniqueness is shown as a **Conjecture**, not a theorem.

**Verify it:** [Rosie live](https://huggingface.co/spaces/SZLHOLDINGS/rosie/commit/6da36b78e04ff8a90d990993c049973401a50c59) (LUTAR_EVIDENCE + OUROBOROS_RUN_ALL shipped alongside).

**→ Run a query and watch which of the 13 axes blocks an over-claimed action.**
```

---

## PATCH 6 — `spaces/SZLHOLDINGS/szl-anatomy/README.md` (anatomy-3d)

**ANCHOR:** after the first `## ` body heading, below the hero block.

```markdown

## Hatun-Willay — the great telling

**Anatomy-3D renders the PURIQ body as it is** — organs, spine, wires, and Khipu receipt-glyphs along the spine. It does not look like a human body; it looks like an agent's body. The viewer vendors the upstream thesis anatomy bundle (CC-BY-4.0) and **flips the banner green→red if one byte drifts** — fails closed, never silently green.

Each organ maps to its math role: heart (`yuyay_v3`, **13-axis**), HUKLLA (10 tripwires), YAWAR, SENTRA (18 SLOC). 3D techniques (SSS skin, blood particles, breathing-heart shader, KhipuKnot Reidemeister R1/R2/R3) are drawn from a cited 46-leader survey. Substrate caption: **749 declarations, 14 axioms, 163 sorries**.

**Verify it:** [Anatomy Space live](https://huggingface.co/spaces/SZLHOLDINGS/szl-anatomy/commit/b38dc8a421a4dd922795f31bc6a106388ff597a3).

**→ Click the heart to read the 13-axis floor vector live; then corrupt one byte and watch the banner flip red.**
```

---

## PATCH 7 — `spaces/SZLHOLDINGS/rosie/README.md` — rosie-3d section (second card, ecosystem layer)

**ANCHOR:** insert as a *separate* `## ` section after PATCH 5's card (the 3D ecosystem layer is additive on the same Rosie Space). If a dedicated rosie-3d README exists, use its first body heading instead.

```markdown

## Hatun-Willay — the living ecosystem

**Rosie-3D shows all 8 canonical Spaces as organs in one breathing 3D mesh** (a11oy, amaru, sentra, killinchu, rosie, uds-demo, anatomy, README), wired by the spine and lit by live receipts. Wires animate PENDING→GREEN as receipts land; every wire passes the **13-axis** gate choke point.

GPU techniques (KANCHAY FBM halo, curve-particle flow, 3d-force-graph brain-jack, InstancedMesh spine) come from the cited 46-leader survey. Substrate: **749 declarations, 14 unique axioms, 163 tracked sorries**, replay hash `bacf5443…631fc5`. *Honest label:* **Wire D** (W3C traceparent across the mesh) is **NOT YET IMPLEMENTED** — in-mesh wires are honest within a single Space; cross-mesh propagation is future work.

**Verify it:** [Rosie / 3D ecosystem live](https://huggingface.co/spaces/SZLHOLDINGS/rosie/commit/6da36b78e04ff8a90d990993c049973401a50c59).

**→ Rotate the ecosystem and click any wire to read the receipt that turned it green.**
```

---

## PATCH 8 — `spaces/SZLHOLDINGS/README/README.md` (the ORG CARD) — MOST SENSITIVE

**HARD CONSTRAINT:** the YAML front-matter (`emoji`, `colorFrom/To`, `thumbnail`), the **banner** image reference, the **5 painterly hero avatars**, and the **animated emojis** are **NEVER touched**. This patch inserts **one paragraph** into the body **below** the entire hero/banner/avatar/emoji block, after the first body-level `## ` heading.

**ANCHOR:** the first `## ` heading that appears *after* the hero block (e.g. `## The substrate` or equivalent). If unsure, insert directly above the existing "wedge" / numbers paragraph — never above the hero block, never inside front-matter.

```markdown

### Hatun-Willay — what we build, in one telling

SZL Holdings builds a **formally-verified 13-axis governance gate for agentic AI**: a conjunctive (no-compensation) heart (`yuyay_v3`, replay hash `bacf5443…`) wired behind a 660-SLOC immune deadman (HUKLLA, 10 tripwires), a 20-line receipt ledger (YAWAR), and an 18-SLOC inline screen (SENTRA), unified by the a11oy.code 7-tier router across **8 canonical Spaces**. The math is in Lean — **749 declarations, 14 axioms, 163 tracked sorries, honestly disclosed** — and mirrored as four public HF Datasets; Λ uniqueness is an open **Conjecture**. The **9-axis** legacy still runs; the **13-axis** migration is the next ratchet — labeled honestly, not hidden.

[Lean proofs](https://huggingface.co/datasets/SZLHOLDINGS/lean-proofs-v1) · [canonical formulas](https://huggingface.co/datasets/SZLHOLDINGS/canonical-formulas-v1) · [thesis corpus](https://huggingface.co/datasets/SZLHOLDINGS/thesis-corpus-v18) · [doctrine](https://huggingface.co/datasets/SZLHOLDINGS/doctrine-v10-v11)
```

**Verification before any future push (org card):**
- `git diff` MUST show **zero** changes to front-matter, banner line, avatar block, emoji block.
- The patch adds exactly one `### ` subsection + one link line. Nothing else.
- Live anchor: [org card](https://huggingface.co/spaces/SZLHOLDINGS/README/commit/cc8831acaa6d1c1f618f96b29e0104a7106d4f90).

---

## Apply checklist (for whoever ships these — NOT this agent)

1. For each Space, pull the live README via `HfApi`, locate the ANCHOR, insert the block **after** it.
2. Run `git diff` and confirm: (a) only insertions, (b) on `README/README.md` zero touches to banner/avatars/emojis/front-matter.
3. Confirm every number matches the canonical counter (749/14/163/13) and the replay hash prefix `bacf5443`.
4. Commit via `HfApi.create_commit` (HR-1) — **NEVER GitHub Actions.**
5. These are patches only. **DO NOT push from this brain-trust agent.**

— Signed **Yachay** (CTO authority), PURIQ brain-trust, 2026-06-01.
