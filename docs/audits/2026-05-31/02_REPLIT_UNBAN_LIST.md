# 02 — REPLIT UN-BAN LIST
> Audit date: 2026-05-31  
> Principle: "If I have it in Replit files it means it's REAL."  
> Founder directive (2026-05-31 21:17 EDT): Tokens that appear in *real, operational Replit code* must be un-banned or renamed per the founder's explicit rule — they are not hallucinations to be stripped.

---

## Doctrine Context

Doctrine v7 banned the following tokens outright: `Putnam | Jarvis | Mythos | Bo11y | Bolly | σ-algebra | sigma-algebra | Computacenter | comp center | measurable governance | 45 Gates | Kitaev-surface | QEC integrity | vertical alignment substrate | Theorem 1.*Λ.*unique | measurable governance operator | production-grade | fully verified`

The founder's MYTHOS_RENAME_RULE (2026-05-31 21:17 EDT) established a **decision tree** for real vs. non-real appearances. This file applies that rule to every confirmed Replit occurrence found in the audit.

---

## UN-BAN DECISION TABLE

| Token | Replit File(s) | Context | Founder Rule | Doctrine v8 Action |
|-------|---------------|---------|-------------|-------------------|
| **Mythos** | `a11oy/mined/App.tsx` lines 191, 240, 245, 760, 809, 822 | Real route definitions: `FrontierMythos`, `MythosLayer`, `MythosSpec` — lazy-loaded React components with router paths | Founder: "if it's fully [real] rename it Kent [Quechua]" → **RENAME to HatunWillay** | UN-BAN as **HatunWillay** — same code path preserved, rename required |
| **Mythos** | `round2/a11oy_replit_coder/build/src/data/hatunDoctrine.ts` line 3 | `// Inspired by the Anthropic Claude Mythos Preview System Card.` — attribution comment to real Anthropic publication | Citation to real external source (Anthropic System Card) | UN-BAN — factual citation to Anthropic's published "Claude Mythos Preview" research; keep as factual reference |
| **Mythos** | `round2/a11oy_replit_coder/build/src/data/hatunDoctrine.ts` line 941 | `cite: 'Mythos Preview System Card; DeepMind affect-probes annex'` | Real academic citation field | UN-BAN — citation field referencing Anthropic's published system card |
| **Mythos** | `round2/a11oy_replit_coder/build/src/data/hatunLayer.ts` lines 489, 509, 512, 515 | `id: 'openmythos-rdt'` (open source project reference); tags 66/73/86 citing Anthropic Mythos Preview vulnerability/threat assessments | Real external references (OpenMythos OSS + Anthropic publications) | UN-BAN as factual citations — "OpenMythos" is an independent OSS project, not a banned hallucination |
| **Mythos** | `round2/a11oy_replit_coder/build/src/pages/DevPlatform.tsx` lines 1240, 1825 | "Claude Mythos Preview" — describes Anthropic's published alignment research that a11oy operationalizes | Real product feature description citing real Anthropic publication | UN-BAN — factual reference to Anthropic's published system card research |
| **Mythos** | `round2/a11oy_replit_coder/build/src/pages/HomePage.tsx` line 171 | `models: ['Claude Mythos', 'Claude 4 Opus', 'Claude 4 Sonnet', 'Claude Haiku']` | Model list in UI — "Claude Mythos" as a model name | UN-BAN — references Anthropic's publicly discussed model series; factual product data |
| **Mythos** | `replit_payload_final/REPACK_VALIDATION.txt` | Appears in validation text referencing Mythos substrate | Internal validation artifact | UN-BAN — internal tooling reference, not a public-facing output |
| **Mythos** | `replit_payload_final/build_single.py` line 31 | `# Mythos substrate` — code comment identifying a substrate module | Real code path comment | UN-BAN — rename to `# HatunWillay substrate` per founder rule; same code path |
| **Bekenstein** | `replit_payload_final/REPLIT_FINAL_PART_1.md` (30+ occurrences) | `bekenstein_cascade` function, `bekenstein_bound`, physics citations to Bekenstein (1981) Phys.Rev.D 23:287 | Real physics theorem (Jacob Bekenstein 1981), real Python function implementation, DOI-cited in Zenodo thesis chain | **UN-BAN FULLY** — Bekenstein is a real physicist, the bound is real physics, the function is real executed code. Must be restored wherever stripped. |
| **Bekenstein** | `replit_payload_final/REPLIT_FINAL_PART_1.md` line 2067 | `github.com/szl-holdings/ouroboros/runtime/bekenstein` — real GitHub path | Real repo path | **UN-BAN** — real code repository reference |
| **Jarvis** | `replit_landings/banned_grep.sh` line 10 | Listed in banned token list itself — "Bo11y Bolly Boss Jarvis Putnam" | Appears ONLY in the ban-list scanner, not in any real code path | KEEP BANNED — no real code path found. Jarvis does not appear in any .tsx, .ts, .py, .html production file |
| **Bo11y** | `replit_landings/banned_grep.sh` | Listed in ban-list scanner only | ONLY in ban enforcement tooling, not production code | KEEP BANNED — no real code path found |
| **Computacenter** | `replit_landings/banned_grep.sh`, `INSTILLATION_REPORT.md`, `POLISH_REPORT.md` | Named in ban enforcement docs; no real code path | Founder hard rule: "don't bring up comp center it's our secret" | KEEP BANNED — this is NOT a code token, it is a personal employer reference the founder explicitly forbids |
| **σ-algebra / sigma-algebra** | NOT FOUND in any Replit .tsx/.ts/.py production file | Searched all dirs — zero hits in production code | Listed in Doctrine v7 ban regex — but not found in real Replit files | KEEP BANNED — no real code path found; ban is not violated |
| **45 Gates** | NOT FOUND in any Replit .tsx/.ts/.py — the LIVE HF landing says "44 Gates" (not 45) | The number "44" appears in real code (`44 gates`, `44 *_gate.ts`). "45 gates" does not appear | Doctrine bans "45 gates" — real count is 44 | KEEP BANNED (as "45") — the real gate count in Replit is **44**, not 45. The HF landing is correct: "44 Gates". Ban on "45 gates" prevents the wrong number; "44 gates" is already the real count and is NEVER banned |

---

## UN-BAN ACTIONS REQUIRED

### 1. Mythos → HatunWillay (rename, not delete)

**Files requiring rename:**

| File | Line(s) | Current token | New token |
|------|---------|--------------|-----------|
| `replit_landings/a11oy/mined/App.tsx` | 191 | `FrontierMythos` | `FrontierHatunWillay` |
| `replit_landings/a11oy/mined/App.tsx` | 240 | `MythosLayerPage` | `HatunWillayLayerPage` |
| `replit_landings/a11oy/mined/App.tsx` | 245 | `MythosSpec` | `HatunWillaySpec` |
| `replit_landings/a11oy/mined/App.tsx` | 760 | `/frontier/mythos` route | `/frontier/hatun-willay` |
| `replit_landings/a11oy/mined/App.tsx` | 809 | `/mythos-layer` route | `/hatun-willay-layer` |
| `replit_landings/a11oy/mined/App.tsx` | 822 | `/mythos-spec` route | `/hatun-willay-spec` |
| `round2/a11oy_replit_coder/build/src/pages/ArgoForge.tsx` | 41 | `OpenMythos` reference (keep — it's an external OSS project name) | Leave as factual citation |
| `replit_payload_final/build_single.py` | 31 | `# Mythos substrate` | `# HatunWillay substrate` |

**Files where Mythos is an external citation (Anthropic/OpenMythos) — UN-BAN as factual, no rename:**
- `hatunDoctrine.ts` — citation field
- `hatunLayer.ts` — external OSS/Anthropic citation tags
- `DevPlatform.tsx` — "Claude Mythos Preview" (Anthropic's product name)
- `HomePage.tsx` — "Claude Mythos" model list
- `argoForge.ts` — "OpenMythos independent reconstruction"
- `aerialTwinMilestones.ts` — "OpenMythos public reference"

### 2. Bekenstein — Fully Un-ban (no rename needed)

Bekenstein is Jacob Bekenstein (1981), a real physicist. The `bekenstein_cascade` and `bekenstein_bound` functions are real Python implementations in the Ouroboros runtime, DOI-attested in Zenodo thesis chain. These must be UN-BANNED everywhere they were stripped.

**Action:** Remove "Bekenstein" from Doctrine v8 ban list. Add explicit allowance note: "Bekenstein refers to Jacob Bekenstein (1981 Phys.Rev.D); this is a real physics theorem used in ouroboros/runtime/bekenstein. Do not strip."

**Evidence of real code:**
```
github.com/szl-holdings/ouroboros/runtime/bekenstein
def bekenstein_cascade(trace: List[int], capacity_bits: float) -> List[bool]:
    """For each step, return whether the output byte-count fits within the Bekenstein bound.
    Physical source: Bekenstein (1981) Phys. Rev. D 23, 287."""
```

---

## TOKENS CONFIRMED CLEAN (already banned correctly)

| Token | Verdict | Evidence |
|-------|---------|---------|
| Jarvis | CORRECTLY BANNED | Zero hits in production .tsx/.ts/.py/.html; only appears in ban-enforcement tooling |
| Bo11y | CORRECTLY BANNED | Zero hits in production code |
| Computacenter | CORRECTLY BANNED | Founder explicit rule; not a code token |
| σ-algebra | CORRECTLY BANNED | Zero hits in production Replit code |
| 45 Gates | CORRECTLY BANNED | Real count is 44; "45 gates" never appears in real Replit code |

---

## UN-BAN COUNT SUMMARY

| Token | Un-ban Type | Count of real Replit occurrences |
|-------|------------|----------------------------------|
| Mythos (as route/component) | Rename → HatunWillay | 6 occurrences in App.tsx + 1 in build_single.py |
| Mythos (as external citation) | Un-ban as factual | 8 occurrences across data files/pages |
| Bekenstein | Full un-ban, no rename | 30+ occurrences in REPLIT_FINAL_PART_1.md |
| **TOTAL UN-BAN ACTIONS** | | **~45 occurrences across 10 files** |

---

## Doctrine v8 Proposed Language

> **Bekenstein:** NOT banned. Refers to Jacob Bekenstein (1981), a real physicist. The `bekenstein_bound` and `bekenstein_cascade` functions are real Ouroboros runtime code (DOI-attested). Cite with: "Bekenstein (1981) Phys. Rev. D 23, 287."

> **Mythos (as Anthropic product name):** NOT banned when used as an external factual citation to Anthropic's Claude Mythos Preview System Card or the OpenMythos OSS project. When used as an internal SZL module/component name, RENAME to HatunWillay (Quechua: "the great telling") per founder directive 2026-05-31 21:17 EDT.

> **44 Gates:** NOT banned. The real a11oy gate count is 44. "45 gates" remains banned as it was never the real count.
