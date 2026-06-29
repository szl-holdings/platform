# Forge ⇄ Perplexity Alignment Delta — read-only audit

**Date:** 2026-06-08
**Auditor:** Forge (Replit side)
**Method:** read-only. Pulled `szl-holdings/platform` → `replit-sync/` payload (23 files),
probed live HF Spaces + a-11-oy.com, compared GitHub↔HF on core files, grepped live HTML
for honesty/doctrine + codename markers. **No app, repo, or Space was modified.**
Safe to run while Perplexity's Amaru build is in flight.

---

## 1. Live surfaces — ALL UP (HTTP 200)

| Surface | URL | Status |
|---|---|---|
| a11oy console | https://szlholdings-a11oy.hf.space/console | 200 (≈912 KB) |
| a11oy root / landing | https://szlholdings-a11oy.hf.space/ | 200 (≈140 KB) |
| a-11-oy.com (custom domain) | https://a-11-oy.com/ | 200 — byte-for-byte the a11oy root |
| killinchu elite | https://szlholdings-killinchu.hf.space/elite | 200 (≈743 KB) |
| anatomy | https://szlholdings-anatomy.static.hf.space | 200 |

HF org **SZLHOLDINGS**: 5 Spaces (README, a11oy, killinchu, anatomy, **cathedral**), 28
datasets. GitHub **szl-holdings**: 28 repos, all pushed 2026-06-08.

---

## 2. HEADLINE: the 2026-06-06 gap audit is SUPERSEDED

`PLATFORM_REPLIT_GAP_AUDIT.md` (dated 06-06) lists 7 build gaps. Perplexity's **06-08
build closed essentially all of them.** Verified against the *now-live* consoles:

| Gap (06-06) | Target | Live now? | Evidence (grep on live HTML) |
|---|---|---|---|
| GAP-1 Vessels/Fleet commercial surface | killinchu | ✅ LIVE | `Fleet`×128, `Vessels`×91, `CII`×22, `Port-State`×8, `Briefings`×12, `Voyage Risk`×2 |
| GAP-2 Governed-Decision view | a11oy | ✅ LIVE | `Governed Decision`×33 |
| GAP-3 Eval Arena / leaderboard | a11oy | ✅ LIVE | `Eval Arena`×4, `Arena`×23 |
| GAP-4 Calibrated prediction intervals | a11oy | ✅ LIVE | `Prediction Interval`×9, `80%`/`95%` bands present |
| GAP-5 Vertical-pack / Ecosystem grid | a11oy | ✅ LIVE | `Ecosystem`×7, `Vertical Pack`×1 |
| GAP-6/7 cascade demo + vessel ops logs | both | ✅ folded into Fleet | `predictive-maintenance`, `ai-briefings` keys present in killinchu |

**Implication for Forge: do NOT rebuild these.** They are shipped. The "build-ready gap
list" is now a *verification* checklist, not a work order. Re-verify any gap against the
live console before building — the audit predates the build by 2 days.

---

## 3. Genuine drift to fix (small, low-risk)

1. **HF `HONEST_DISCLOSURE.md` is one line behind GitHub (real drift).**
   - GitHub: `Λ = Conjecture 1 · SLSA L1 honest · L2 build-attested (Rekor) · L3+ roadmap`
   - HF live: `Λ = Conjecture 1 · SLSA L1 honest` (missing the canonical attested-L2 + roadmap-L3 line)
   - Direction is *safe* (HF under-states, never over-claims) but it breaks the
     "HF byte-identical to GitHub" rule. **Fix = re-push the one file to the a11oy Space.**
2. **`STATUS.md` is stale (doc only).** a11oy `STATUS.md` dated 2026-06-02 shows
   `749/14/163 @ c7c0ba17`; canonical `PROVEN_STATE_CANONICAL.md` (06-08) is
   `main @ 880c803e`, Wave19/20/21 merged. Locked-proven (5) and Λ=Conjecture 1 are
   consistent — only the dated summary numbers lag. **Fix = refresh STATUS.md.**

### Not drift (verified benign)
- **README.md GitHub≠HF is EXPECTED:** the HF copy carries the required Space-card YAML
  frontmatter (`sdk: docker`, `app_port: 7860`, …). Exclude README from byte-identical checks.
- **Dockerfile, STATUS.md: byte-identical** GitHub↔HF. ✅

---

## 4. Honesty doctrine — holds on the live UI ✅ (one source-level nit)

- a-11-oy.com landing: `Conjecture` present, replay hash `c7c0ba17` present, **zero**
  user-visible codenames (`amaru`/`rosie`/`sentra`/`jarvis`/`killinchu` all = 0).
- a11oy console uses the honest role names: `Provenance`×45, `Operator`×9, `Policy`×15,
  `Trust Anchor` present. `Λ` shown as Conjecture (×82).
- **Source-level nit (low priority):** the shipped client JS contains a config object with
  raw codename *keys* mapping to internal alt-codenames —
  `amaru:'YACHAY', sentra:'CHAPAQ', rosie:'Companion'`. Not rendered in the UI, but visible
  to anyone reading page source. Doctrine bans user-visible codenames; object keys in
  client JS are a hygiene gap, not a visible-UI violation. Also note YACHAY/CHAPAQ are
  *additional* codenames not on the manifest's banned list — worth a one-line confirm with
  Perplexity on which naming layer is canonical.

---

## 5. Minor / informational

- **HF models:** org overview reports `numModels: 3` but the models API
  (`author=SZLHOLDINGS`) returns an empty list — likely private/gated. Confirm visibility.
- **"cathedral" Space** exists in the org but is not named in the manifest's CURRENT LIVE
  STATE. Either add it to the manifest or confirm it's intentional/scratch.
- **Amaru:** manifest says "in progress at payload time"; the live console already shows a
  substantial Provenance/Trust-Anchor surface. Treat as **in-flight (Perplexity-owned)** —
  do not touch until Perplexity signals done, to avoid collision.

---

## 6. Recommended Forge actions (after Perplexity signals Amaru done)

Ordered by safety. None require rebuilding shipped features.

1. **Re-sync HF `HONEST_DISCLOSURE.md` ← GitHub** (1 line). Restores byte-identical. LOW risk.
2. **Refresh a11oy `STATUS.md`** to canonical 06-08 numbers. LOW risk, doc-only.
3. **Confirm with Perplexity:** canonical naming for YACHAY/CHAPAQ vs amaru/sentra; whether
   to scrub raw codename keys from client JS; "cathedral" Space intent; HF models visibility.
4. **Hold all writes to the a11oy Space until Amaru build is confirmed complete** (collision avoidance).

**Verdict:** GitHub↔HF↔live are *substantially* aligned and the live build is AHEAD of the
06-06 gap audit. The real remaining work is small drift-resync + a confirm pass with
Perplexity — not a rebuild. "Make it all real" is largely already real; Forge's value here is
keeping the mirror honest and byte-identical, not re-shipping closed gaps.
