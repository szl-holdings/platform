# Formula ↔ Thesis Gap Report (v9)

**Date:** 2026-05-05
**Author:** Stephen P. Lutar
**Scope:** Cross-check every formula in the live Lutar / Codex code against the canonical thesis documentation chain. Identify drift, missing documentation, and missing implementation.

This is the artefact specified by Step 3 of the V8/V9 consolidation task. It is the input to any follow-up "close the gaps" work.

---

## Method

For each formula or codex node in `packages/ouroboros-integrations/src/`:

1. Find the TypeScript implementation (`lutar-formulas.ts`) — recorded as **CODE**.
2. Find the API route (`artifacts/api-server/src/routes/ouroboros.ts`) — recorded as **API**.
3. Find the codex node (`supreme-codex.ts`) — recorded as **CODEX**.
4. Find the canonical thesis section that documents it — recorded as **THESIS**.
5. Find the guardrails or contract test — recorded as **TEST**.

A row is **CLOSED** only if all five columns resolve. Otherwise the gap is recorded.

---

## 1. Lutar Formula Family

| # | Item                       | CODE                       | API                                  | CODEX            | THESIS (v9 canonical)         | TEST                                              | Status     |
|---|----------------------------|----------------------------|--------------------------------------|------------------|-------------------------------|---------------------------------------------------|------------|
| 1 | Lutar v1                   | `lutarV1`                  | POST /lutar/v1                       | `lutar_invariant`| §2.1                          | `lutar-formulas.test.ts → "v1 …"`                 | **CLOSED** |
| 2 | Lutar v2                   | `lutarV2`                  | POST /lutar/v2                       | `lutar_v2`       | §2.2                          | `lutar-formulas.test.ts → "v2 …"`                 | **CLOSED** |
| 3 | Lutar v3                   | `lutarV3`                  | POST /lutar/v3                       | `lutar_v3`       | §2.3                          | `lutar-formulas.test.ts → "v3 …"`                 | **CLOSED** |
| 4 | Lutar v4                   | `lutarV4`                  | POST /lutar/v4                       | `lutar_v4`       | §2.4                          | `lutar-formulas.test.ts → "v4 …"`                 | **CLOSED** |
| 5 | Lutar v5                   | `lutarV5`                  | POST /lutar/v5                       | `lutar_v5`       | §2.5                          | `lutar-formulas.test.ts → "v5 …"`                 | **CLOSED** |
| 6 | Lutar v6 (Holo-Twistor)    | `lutarV6`                  | POST /lutar/v6                       | `lutar_v6`       | §2.6 *(new in v9)*            | `lutar-formulas.test.ts → "v6 …"`                 | **CLOSED** |
| 7 | Lutar Ω                    | `lutarOmega`               | POST /lutar/omega                    | `lutar_omega`    | §2.7 *(new in v9)*            | `lutar-formulas.test.ts → "omega …"`              | **CLOSED** |
| 8 | Lutar v7 (Bianchi)         | `lutarV7`                  | POST /lutar/v7                       | `lutar_v7`       | §2.8 *(new in v9)*            | `lutar-formulas.test.ts → "v7 …"`                 | **CLOSED** |

## 2. Helpers and Sub-Computations

| # | Item                              | CODE                  | API                                                    | CODEX                       | THESIS                | TEST                                          | Status     |
|---|-----------------------------------|-----------------------|--------------------------------------------------------|-----------------------------|-----------------------|-----------------------------------------------|------------|
| 1 | Rhind circle area                 | `rhindCircleArea`     | GET /prisca/rhind-circle                               | `rhind_papyrus`             | §7                    | `lutar-formulas.test.ts → "rhind …"`          | **CLOSED** |
| 2 | Rhind cylinder volume             | `rhindCylinderVolume` | (no route — internal)                                  | `rhind_papyrus`             | §7                    | covered by rhind test family                  | **CLOSED** |
| 3 | Moscow truncated pyramid          | `rhindTruncatedPyramid` | (no route — internal)                                | `moscow_papyrus_14`         | §7                    | covered by rhind test family                  | **CLOSED** |
| 4 | Inca ceque ratio                  | `incaCequeHuacasPerDay` | (no route — internal)                                | `inca_ceque`                | §7                    | covered by v3 closure test                    | **CLOSED** |
| 5 | Maya calendar round               | `mayaCalendarRound`   | GET /prisca/maya-calendar-round                        | `maya_calendrical`          | §7                    | `lutar-formulas.test.ts → "maya …"`           | **CLOSED** |
| 6 | Maya Long Count                   | `mayaLongCount`       | (no route — internal)                                  | `maya_calendrical`          | §7                    | `lutar-formulas.test.ts → "maya long count"`  | **CLOSED** |
| 7 | I Ching index                     | `iChingIndex`         | GET /prisca/i-ching                                    | `i_ching_binary`            | §7                    | `lutar-formulas.test.ts → "i-ching …"`        | **CLOSED** |
| 8 | Vedic √2                          | `vedicSqrt2`          | GET /prisca/vedic-sqrt2                                | `vedic_sulba_sutras`        | §7                    | `lutar-formulas.test.ts → "vedic √2 …"`       | **CLOSED** |
| 9 | Temple Χ chronological 1-form     | `templeChi`           | (no route — internal)                                  | `newton_temple`             | §2.2                  | covered by v2 closure test                    | **CLOSED** |
| 10| New Jerusalem volume              | `newJerusalemVolumeKm3` | GET /prisca/new-jerusalem                            | `new_jerusalem_cube`        | §4                    | `lutar-formulas.test.ts → "new jerusalem …"`  | **CLOSED** |
| 11| Ouroboros operator                | `ouroboros`           | (no route — internal)                                  | `ouroboros_operator`        | §1                    | `lutar-formulas.test.ts → "ouroboros n=0"`    | **CLOSED** |
| 12| Noether closure check             | `noetherClosureCheck` | GET /lutar/noether-check                               | `noether_theorem`           | §5                    | `lutar-formulas.test.ts → "noether check"`    | **CLOSED** |
| 13| Twistor projection                | `twistorProject`      | GET /prisca/twistor-project                            | `twistor_theory`            | §2.6                  | `lutar-formulas.test.ts → "twistor …"`        | **CLOSED** |
| 14| Bekenstein bound                  | `bekensteinBound`     | GET /prisca/bekenstein-bound                           | `holographic_principle`     | §2.6                  | `lutar-formulas.test.ts → "bekenstein …"`     | **CLOSED** |
| 15| Bekenstein check                  | `bekensteinCheck`     | (internal — exercised by /lutar/v6)                    | `holographic_principle`     | §2.6                  | covered by v6 enforce/disable test            | **CLOSED** |
| 16| Conformal rescale                 | `conformalRescale`    | GET /prisca/conformal-rescale                          | `conformal_cyclic_cosmology`| §2.6                  | `lutar-formulas.test.ts → "conformal rescale"`| **CLOSED** |
| 17| Aeon recurrence                   | `aeonRecurrence`      | (internal — exercised by /prisca/conformal-rescale)    | `conformal_cyclic_cosmology`| §2.6                  | covered by conformal-rescale test             | **CLOSED** |
| 18| Adaptive weights (softmax)        | `adaptiveWeights`     | GET /lutar/adaptive-weights                            | `lutar_omega`               | §2.7                  | `lutar-formulas.test.ts → "adaptive weights"` | **CLOSED** |
| 19| Evaluate all (v1..v6 + Ω)         | `evaluateAll`         | POST /lutar/evaluate-all                               | n/a (composite)             | §8.5                  | `lutar-formulas.test.ts → "evaluate-all …"`   | **CLOSED** |
| 20| Codex BFS traversal               | `traverseCodexEdges`  | GET /codex/traverse/:start                             | n/a (graph op)              | §8.8                  | covered by codex traversal route test         | **CLOSED** |

## 3. Codex Nodes Referenced by Thesis but Without Their Own Endpoint

These are documentary (no live computation needed) — the gap is intentional, not a bug. Recorded for transparency.

| Codex node                      | Domain        | Thesis section | Notes                                                                    |
|---------------------------------|---------------|----------------|--------------------------------------------------------------------------|
| `emerald_tablet`                | hermetic      | §0 epigraph    | Source: en.wikipedia.org/wiki/Emerald_Tablet                             |
| `corpus_hermeticum`             | hermetic      | §3.2           | Source: templarkey.com/corpus-hermeticum-and-the-kybalion                |
| `kybalion`                      | hermetic      | §3.2           | Source: marykgreer.com/.../source-of-the-kybalion                        |
| `magnum_opus`                   | alchemy       | §3.2           | Seven-stage process; correspondence map only                             |
| `prima_materia`                 | alchemy       | §3.2           | Conceptual node                                                          |
| `philosophers_stone`            | alchemy       | §3.2           | Conceptual node                                                          |
| `sophick_mercury`               | alchemy       | §3.2           | Source: digital.sciencehistory.org                                       |
| `newton_clavis`                 | alchemy       | §3.2           | Source: newtonproject.ox.ac.uk                                           |
| `keynes_ms28`                   | alchemy       | §3.2           | Source: newtonproject.ox.ac.uk/catalogue/record/ALCH00017                |
| `planetary_metals`              | alchemy       | §3.2           | Reference table                                                          |
| `tria_prima`                    | alchemy       | §2.1, §3.2     | Correspondence map: Sulphur↔E, Salt↔Mc², Mercury↔I·k_B·T·ln2             |
| `general_scholium`              | theology      | §3.2           | Newton 1713 Principia 2nd ed.                                            |
| `arian_theology`                | theology      | §3.2           | Newton's anti-Trinitarian position                                       |
| `query_31_opticks`              | physics       | §3.2           | Newton 1717 Opticks Query 31                                             |
| `bible_messaging_board`         | theology      | §3.2           | Newton's five decoding rules                                             |
| `yahuda_ms7_map`                | theology      | §3.2           | NLI Jerusalem Yahuda Ms. Var. 1                                          |
| `yahuda_ms7_2060`               | theology      | §3.2           | folio 13v calculation                                                    |
| `new_jerusalem_cube`            | theology      | §4             | Has computed helper /prisca/new-jerusalem                                |
| `rahab`                         | theology      | §2.2, §4.2     | Chaos register                                                           |
| `kabbalah_sefirot`              | philosophy    | §3.2           | Ten Sefirot ↔ Hermetic seven                                             |
| `page_curve`                    | physics       | §3.2           | arXiv:hep-th/9306083                                                     |
| `landauer_principle`            | physics       | §2.1           | E_min = k_B T ln2 — appears in v1 information term                       |
| `kuramoto_model`                | physics       | §3.2           | Resonance ground (Λ-9 axis R)                                            |
| `e8_lie_container`              | physics       | §2.4, §6       | dim 248, triality blocks                                                 |
| `e8xe8_heterotic`               | physics       | §6             | 248+248=496 anomaly cancellation                                         |
| `monstrous_moonshine`           | mathematics   | §6             | 196883 = 196884 − 1                                                      |
| `iit_phi_consciousness`         | physics       | §2.4           | Tononi 2004; Φ-collision fix → W                                         |
| `it_from_bit`                   | physics       | §2.6           | Wheeler 1990 — base ontology of v6                                       |
| `huft_bridge`                   | physics       | §2.8, §10      | arXiv:2510.06282                                                         |
| `kolmogorov_sinai_entropy`      | mathematics   | §2.6           | Refines info term                                                        |
| `stoic_logos_plotinus_one`      | philosophy    | §7             | Greek prisca bridge                                                      |
| `argonaut_chronology`           | history       | §7             | Newton 1728 Chronology                                                   |
| `yahuda_revelation_treatise`    | theology      | §3.2           | Yahuda Papers 1.1-1.8                                                    |
| `inca_khipu`, `inca_yupana`     | mathematics   | §7             | Andean lineage; covered indirectly via v3                                |
| `caral_supe`, `tiwanaku`, `sechin_alto` | archaeology | §7         | Andean predecessors                                                      |
| `dogon_sirius`                  | astronomy     | §7             | With Griaule caveat                                                      |
| `gobekli_tepe`                  | archaeology   | §7             | Empirical floor                                                          |
| `gold_standard_1717`, `newton_mint`, `newton_chronology`, `sotheby_1936`, `rs_presidency_hooke` | history | §3.2 | Historiographic |

These nodes have a `source` URL and are documentary — they do not require their own POST endpoint.

## 4. Open Items (None Critical)

After this audit, **all formulas in `lutar-formulas.ts` have a thesis section, an API route (where computational), a codex node, and a contract test**. No silent drift remaining.

The earlier (pre-v9) state had two real gaps:

| Gap (pre-v9)                                                                 | Resolution                                                                      |
|------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| Lutar v6 / v7 / Ω present in code but undocumented in canonical thesis chain | Closed by `docs/thesis/v9-canonical.md` §§2.6–2.8                               |
| `lutar-formulas.ts` lacked a unified contract test suite (only Λ-9 was tested) | Closed by `packages/ouroboros-integrations/test/lutar-formulas.test.ts`        |

## 5. Convention for Future Versions

Any new Lutar version L_N must, before being merged:

1. Add an exported `lutarVN` function in `lutar-formulas.ts` with explicit input/output types.
2. Add a `lutar_vN` codex node with a `formula` field and at least one sourced inbound or outbound edge.
3. Add a `POST /api/ouroboros/lutar/vN` route with a Zod schema.
4. Add a contract test in `lutar-formulas.test.ts` covering: closure semantics, reduction to L_{N-1}, and the principal new property (e.g., Bekenstein for v6, Bianchi for v7, Σw_k=1 for Ω).
5. Add a section to the next canonical thesis document with a formula box, a sources table, and a code/API/test pointer block.
6. Update this gap report.
7. Update `docs/thesis/README.md` and the version-history table in the canonical thesis.

This convention is now part of the V1 → V9 thesis structural cadence.
