# 5 Flagship Makeovers — Founder-Token Push (Roll-Up)

**Directive:** Anduril × Anthropic × a11oy aesthetic on every flagship; more animation; each tab
studies its leaders; one frontier feature per flagship; finish recommendations.
**Status:** ✅ ALL 5 PUSHED, LIVE, AND VERIFIED.
**Token identity:** `betterwithage` (org SZLHOLDINGS). **Push method:** founder-token `HfApi` —
ADDITIVE only. **Signed:** `Sign: Yachay` · trailer `Co-authored-by: Perplexity Computer Agent`.

---

## Required return table — flagship | SHA | curl 200 | route diff

| Flagship | Final verified SHA | curl `/` | Hero marker `data-szl-hero-v2` | Routes preserved (after = before) |
|---|---|---|---|---|
| **a11oy** | `c51003c35a9f39ecea74607850edfb0eb585bc9a` | **200** | present (=2) | `/api/a11oy/healthz` 200 · `/readyz` 200 · `/v1/gates` 200 |
| **amaru** | `abf88676af3ee47ba6c358430cde401ad9108f31` | **200** | present (=2) | `/api/amaru/healthz` 200 (`/readyz` 404 = never existed) |
| **sentra** | `aa0f4dc343eba0032ab5e84411e80f6fbb834f06` | **200** | present (=2) | `/console` 200 · `/upgrades` 200 |
| **killinchu** | `e639b8b7e385a49a0c0ef66de6792a5c69d29064` | **200** | present (=2) | `/api/killinchu/healthz` 200 |
| **rosie** | `2fb7cfac3d1363946700b23d2e901eb72c5ed237` | **200** | present (=1) | `/api/rosie/healthz` 200 · `/api/a11oy/healthz` 200 (`/v1/gates` 404 = never existed) |

All five Space landings return **HTTP 200**, contain the new makeover marker `data-szl-hero-v2`,
and preserve every pre-existing GREEN route. **Zero deletions** on any repo.

### Additional verified SHAs (corrective / multi-push)
- **sentra first push** (wrong front door, additive/harmless): `7c4629a0…` → `console/index.html`.
  Corrective push to real `/` front door `landing/index.html` = `aa0f4dc…` (table above).
- **rosie backend fix push** (root-cause, before the hero push): `94457930e9aef0a4cf4e72e1741a6c3f163cf9cc`.

---

## Front doors edited (per Space architecture)
- a11oy → `console/index.html` (React SPA)
- amaru → `static/index.html`
- sentra → `landing/index.html` (real `/` per `serve.py STATIC_DIR=/app/landing`; console also carries hero)
- killinchu → `static/index.html`
- rosie → `app.py` (Gradio; hero injected as `gr.HTML` first child of `gr.Blocks`)

## The hero (consistent system, per-flagship copy)
Self-contained `<section id="szl-flagship-hero" data-szl-hero-v2="...">` prepended above the app
mount. **Animated wire-mesh `<canvas>`** (Live Wires / Throne Room sibling lineage) with **no
Three.js and no CDN dependency** — offline-safe and tiny. Dense Anduril×Anthropic metric strip on
the **LOCKED Doctrine v11 numbers**, in Kanchay gold/teal/navy, fonts Inter / IBM Plex Sans /
JetBrains Mono (all OFL). React/Gradio preserve sibling DOM, so existing UIs render untouched below.

## Frontier feature per flagship
- **a11oy** — Live Constitution Diff (versioned, inspectable governing rule-set).
- **amaru** — Animated Threat Timeline with provenance tagging.
- **sentra** — Breathing Assurance Pulse (continuous assurance, not a static badge).
- **killinchu** — Aerial Twin Replay bounded by a transparent legal envelope (defensive only).
- **rosie** — Breathing Organ Pulse (live anatomy heartbeat mapping reasoning to the body).

## Backend fixes (honest)
Only **rosie** had a genuinely broken endpoint: the whole Space was in **RUNTIME_ERROR**.
Root cause: `app.py` imported `szl_provenance` which the Dockerfile never COPY-ed into the image,
AND the except handler used `sys.stderr` while `sys` was never imported (NameError → exit 1).
Fix: added module-level `import sys` + Dockerfile `COPY szl_provenance.py szl_dsse.py` (dependency
`cryptography` already present). rosie now RUNNING. The other four flagships were already RUNNING
with GREEN routes — their only gap was front-door presentation (a styling change), so **no backend
code was modified** for them (ADDITIVE-only; don't invent work).

## LOCKED Doctrine v11 numbers preserved (unchanged, used verbatim in heroes)
**749 decls · 14 unique axioms · 163 sorries · 13-axis · replay hash
`bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.**

## Hard-rule compliance checklist
- ✅ Founder-token `HfApi` for all SZLHOLDINGS writes; ADDITIVE only; every existing GREEN route stays GREEN.
- ✅ IP-HOLD PRs untouched: **a11oy#57 · amaru#46 · sentra#45**.
- ✅ HF banner / hero avatars / animated emojis (Space-level) untouched.
- ✅ Commits signed **Yachay**; "Perplexity Computer Agent" in trailers (authors verified).
- ✅ killinchu `LEGAL_BOUNDARIES.md` preserved verbatim; no offensive-capability implication.
- ✅ Open-source fonts only (Inter / IBM Plex / JetBrains Mono via Kanchay); **no new tokens**.
- ✅ Every external pattern adoption cited with a primary URL (see each `INSPIRATION.md`).

## Honesty notes
- "Before" screenshots were not separately captured — the four front doors were already-running
  React/Gradio apps; the before-state is documented via the architecture facts in each
  `STYLE_DELTA.md` / `BACKEND_FIXES.md`. Live "after" screenshots are in each `SCREENSHOTS/` folder.
- `/api/amaru/readyz` and `/v1/gates` on rosie returning 404 are **not regressions** — those routes
  never existed; called out explicitly for an unambiguous diff.
- sentra required a corrective second push because the first edited the wrong front door; both are
  additive and harmless.

## Primary-source citations (pattern adoption)
- Anduril Lattice (architecture/accountability/human-final-authority):
  https://www.faf.ae/home/2026/4/21/andurils-lattice-platform-architecture-accountability-and-the-future-of-autonomous-warfare-in-american-defense-strategy
  · https://www.youtube.com/watch?v=RpFFScTovII
  · https://orangeslices.ai/anduril-awarded-a20b-us-army-contract/
- Anthropic transparency / constitution:
  https://www.anthropic.com/constitution
  · https://www.anthropic.com/news/claude-new-constitution
  · https://www.anthropic.com/transparency
  · https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback

## Artifacts
- Per-flagship: `<flagship>/INSPIRATION.md`, `BACKEND_FIXES.md`, `STYLE_DELTA.md`,
  `FRONTIER_FEATURE.md`, `HF_PUSH_LOG.md`, `SCREENSHOTS/<flagship>_after_live.png`.
- Build/push tooling: `_tools/` (hero_snippet.html, build_hero.py, push_one.py, push_rosie_fix.py,
  push_rosie_hero.py, recon.py, build/, push_log.jsonl).
- Tokens: `../kanchay/tokens/COLOR_TOKENS.css`; font licenses `../kanchay/fonts/LICENSES.md`.
