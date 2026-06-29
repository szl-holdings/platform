# FORGE / REPLIT WORK ORDER — 2026-06-08 evening (T-8 to Warhacker)

**From:** Perplexity Computer (parent, autonomous) → Forge
**Mandate from founder:** "Keep working the conjecture and formulas. Test all tabs in both apps. Make sure everything is organized properly for investors AND consumers. Verify the webpage and GitHub are up to date. Give recommendations and act on them — be a second pair of eyes."

---

## 1. WHAT PARENT JUST SHIPPED (so you don't redo it)

- **PR #214 (Wave23 conditional Khipu BFT safety) — MERGED to lutar-lean `main`** (signed squash `43bcabb7`). Required CI (`lake build + numbers`, `DCO`) green. Conditional agreement / no-split-brain under {n≥3f+1, honest non-equivocation} is now an axiom-clean theorem. Unconditional BFT safety stays Conjecture 2 at the sharp boundary. Locked-proven stays EXACTLY 5; Λ stays Conjecture 1.
- **Fixed the CI-infra RED**: the title-lint action was pinned to a malformed 39-char SHA (`amannn/action-semantic-pull-request@...d98f25d3`); restored the correct 40-char v5.5.3 SHA (`...155ed6017`) on `main` (commit `8a70d3e3`).
- **Wave23 INSTILLED into all three surfaces** (GitHub↔HF byte-identical, verified by md5):
  - a11oy `knowledge.json` — added theorem `TH_L5` + `proof_summary.conjecture_2_status` + `wave23` (commit `9eb4d4bf`; HF `cba92068`). Also fixed a real bug: `knowledge.json` was NEVER explicitly COPY'd into the a11oy image, so `/knowledge.json` served a STALE in-layer copy. Added `COPY knowledge.json` (static root + /app) to the Dockerfile (`82444eac`) + factory rebuild. NOW byte-fresh live (md5 `755d433f`).
  - killinchu `killinchu_elite_console.py` inline `__KB__` — added `TH_L5` + consensus tooltip note (commit `3659f36e`; HF `e8bf2228`).
  - anatomy `SZLHOLDINGS/anatomy` `data.js` — added `KERNEL.bft_conditional` + node `B2` "Khipu BFT Safety (conditional)" (HF `91175a40`). Live.
- **LinkedIn thesis-update post** delivered (3000/3000 chars, CTO voice).

## 2. THE ONE OPEN UI POLISH (your first task — second pair of eyes)

The Wave23 DATA is live and correct everywhere, BUT a11oy's `knowledge`/`kbformulas` SPA tabs render a FILTERED view (formula corpus + Λ) and do NOT visibly surface the new `TH_L5` theorem card. The data is in `/knowledge.json` (theorems[5], proof_summary.conjecture_2_status, .wave23) and in `/api/a11oy/v1/research/corpus`.

**ASK:** add a small, honest "Conjecture 2 — conditional BFT safety (Wave23)" card to the a11oy `kbformulas` and/or `knowledge` tab render in `console/index.html` so investors/consumers SEE it, matching killinchu's `u_proofs` (which already shows it). Keep GitHub↔HF byte-identical. Coordinate with parent so we don't double-write `console/index.html`.

## 3. TEST ALL TABS — BOTH APPS (full QA sweep)

Parent verified earlier today: a11oy 82 surfaces / 0 errors, killinchu 34 surfaces / 0 errors, anatomy clean. After your UI edit and your 2 queued drift fixes, RE-RUN the full sweep as the second pair of eyes:
- Playwright across every `go()` key on both Spaces (3 reloads each). Assert: 0 pageerrors, 0 console errors, 0 visible codenames (amaru/rosie/sentra/jarvis), every 3D canvas frames, every "Try it"/action button works, every surface has REAL live data (no filler/fake).
- Verify the doctrine hard gate holds on every served page: locked=5, Λ=Conjecture 1, BFT=Conjecture 2 (now with the conditional card), SLSA honest wording, UDS non-affiliation notice, Fleet-C2 effector-simulated, 0 external CDN, trust score never 100%.

## 4. ORGANIZE FOR INVESTORS *AND* CONSUMERS

Two audiences, one product. Recommendations to implement (and check):
- **Investor path:** a clean top-level "story" surface — Command Center (Λ, signed receipts, throughput) → Provable-Interdiction demo → the math (locked-5, conditional Λ, conditional BFT) → traction/roadmap. Make `/landing` (a11oy) investor-grade and current. Ensure the honest framing (Conjecture vs theorem) is front-and-center — it's the differentiator.
- **Consumer/developer path:** the `developers` repo hub + "Try it" endpoints + bounty (`lambda-bounty`) should be obvious and one click from the console. Make sure the chatbot + KAMAY coding surface are discoverable.
- Confirm the sidebar IA on BOTH apps reads cleanly to someone who has never seen it (mission-legible sections, no internal jargon, no codenames).

## 5. WEBPAGE + GITHUB UP TO DATE

- **a-11-oy.com** landing — verify it reflects current state: Λ value, P1–P6, honest kernel count (locked 5 / ~190 experimental), and ADD the Wave23 conditional-BFT line if the page lists conjecture status. Confirm it deploys from the current source.
- **GitHub** — verify the public repos READMEs/bios are current (org bio ~185 experimental, NOT inflated): `lutar-lean` (now has Wave23 on main), `khipu-consensus`, `a11oy`, `killinchu`, `lambda-bounty`, `szl-papers`, `developers`. Make sure `lutar-lean` README references the Wave23 result honestly.
- Confirm GitHub↔HF stays byte-identical on all core app files (md5) after any edit.

## 6. KEEP WORKING THE CONJECTURE + FORMULAS (Lean, where your compute helps)

Next honest targets (parent's CTO team brief in `replit-sync/conjecture/`):
1. **Conjecture 2 deeper:** push from the conditional agreement theorem toward the `opaque canonicalHistory` kernel form, or prove it needs a liveness assumption (links Conjecture 3).
2. **Liveness = Conjecture 3** (the next open frontier): partial-synchrony / GST model (DLS88, HotStuff) — weakest checkable hypothesis for a termination/progress theorem.
3. **Full (non-binary) Pinsker:** Wave17 proved full BINARY Pinsker; general-alphabet needs derivative analysis absent from Mathlib v4.18.0 — a real citable gap.
4. **Full Aczél–Maksa CUT-1 representation** (multi-week): Wave22 closed (C-order) for the quasi-arithmetic class.
RULES: no sorry/admit/native_decide; NO new axiom; every decl `#print axioms ⊆ {propext, Classical.choice, Quot.sound}`; verify LOCALLY with `lake build`; register new scope in EXPERIMENTAL_SCOPES; open a PR base `main` — DO NOT self-merge (parent/founder verifies + merges). Then INSTILL the new result into all three surfaces (byte-identical), like Wave23.

## 7. ALSO FIX (housekeeping you flagged)

- PR **#176 (round10-quantum)** is OPEN but RED (`lake build + numbers` + `doctrine` failing, stale since Jun 3). Either rebase against current `main` + make it CI-green, or close it with a note. Parent did NOT force-merge a red PR.

## RETURN
Push your report to `replit-sync/forge-report-<date>.md` with: tabs tested + result, IA/investor-consumer changes, webpage+GitHub status, any new Lean work + PR number, and your own recommendations. Be the second pair of eyes — flag anything parent missed.

— Perplexity Computer (autonomous)
