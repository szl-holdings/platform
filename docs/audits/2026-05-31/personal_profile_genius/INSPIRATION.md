# INSPIRATION — Personal Profile Genius Design

**Phase 0 deep research.** Goal: find the most *original* personal profiles in software, extract the singular idea behind each, and identify a frontier not yet occupied. Signed: Yachay.

---

## The precedents (what makes each one singular)

### 1. Bartosz Ciechanowski — `ciechanow.ski`
- **The one idea:** essays are *not read, they are operated.* Every paragraph is followed by a live WebGL widget you drag — airfoils, gears, sound waves, the internal combustion engine — and the prose explains the thing you are touching ([ciechanow.ski](https://ciechanow.ski), [Airfoil](https://ciechanow.ski/airfoil/)).
- **Steal:** the widget *is* the argument. No decorative animation — every interactive element teaches the exact sentence next to it.
- **Gap:** Bartosz explains *the physical world.* Nobody has done this for *their own body of formal work* — your own theorems and formulas as the operable widgets.

### 2. Andy Matuschak — `notes.andymatuschak.org`
- **The one idea:** **stacked notes.** Click a link and the note opens as a new column to the right instead of replacing the page; you build a horizontal scroll of your own reading path ([About these notes](https://notes.andymatuschak.org/About_these_notes), [Evergreen notes](https://notes.andymatuschak.org/z5E5QawiXCMbtNtupvxeoEX)).
- **Steal:** the reader composes their own trail; the navigation is the content.
- **Gap:** Matuschak's notes are prose. Nobody stacks *executable artifacts* (a proof, a calculator, a receipt) side by side.

### 3. Maggie Appleton — `maggieappleton.com/garden`
- **The one idea:** the **digital garden** with explicit *growth states* — seedling / budding / evergreen — surfaced to the reader, so a page openly declares how finished it is ([The Garden of Maggie Appleton](https://maggieappleton.com/garden/), [Digital Gardening](https://maggieappleton.com/nontechnical-gardening)).
- **Steal:** honesty about done-ness. A thought can be public *and* admittedly half-formed.
- **Gap:** garden "ripeness" is hand-set by the author. Nobody derives ripeness from a *machine check* (Lean: proved vs. `sorry`).

### 4. Devine Lu Linvega — `wiki.xxiivv.com` / 100 Rabbits
- **The one idea:** the whole site is **one hand-drawn interconnected system** — a nautical "Horizon" diagram, custom typeface, every tool (Orca, Marabu, Uxn) is its own self-hosted universe, no external dependencies, fully sovereign ([XXIIVV wiki](https://wiki.xxiivv.com/site/devine_lu_linvega.html), [Hundred Rabbits](https://en.wikipedia.org/wiki/Hundred_Rabbits)).
- **Steal:** sovereignty as aesthetic — no third-party CDNs, no trackers, the artist owns every byte. Matches the SZL "sovereignty" requirement exactly.
- **Gap:** XXIIVV is a static wiki. Nobody has made a sovereign site that is *provenanced* — where the site itself emits a receipt for your visit.

### 5. Stephen Wolfram — `writings.stephenwolfram.com`
- **The one idea:** the **15,000-word "personal infrastructure"** post — radical transparency about *how the thinker works*, the actual machinery of cognition exposed ([via Simon Willison](https://simonwillison.net/tags/productivity/)).
- **Steal:** show the workshop, not the trophy.
- **Gap:** Wolfram describes his process in prose. Nobody renders the *live* process — today's actual commit, today's actual thought, machine-pulled.

### 6. Others surveyed (briefer)
- **Simon Willison** (`simonwillison.net`): the *daily-firehose* TIL/blog — relentless small public increments. Steal: a "Today" surface that proves you shipped *today*.
- **Edward Tufte**: density-with-clarity; the page is a data graphic. Steal: sparkline-grade information density, no chartjunk.
- **Andrej Karpathy / John Carmack**: thinking happens in public, in the open, in raw form (tweets, repos). Steal: rawness is credibility.

---

## Synthesis — the unoccupied frontier

Every precedent occupies **one** of these axes:

| Axis | Owner | What they proved |
|---|---|---|
| Operable widgets teach the prose | Ciechanowski | interaction = argument |
| Reader composes their own trail | Matuschak | navigation = content |
| Honest growth-state of an idea | Appleton | done-ness is data |
| Total sovereignty, no third parties | Linvega | own every byte |
| Expose the machinery of thinking | Wolfram | workshop > trophy |
| Prove you shipped *today* | Willison | recency = credibility |

**Nobody has combined all six AND made the artifacts the founder's own *formally-verified* work, AND made the page itself provenanced (it mints a receipt for your visit), AND derived an idea's "ripeness" from a machine proof-check rather than the author's self-assessment.**

That is the gap the personal profile will occupy: a **Living Notebook** where
1. every widget is one of *Stephen's own* artifacts and it actually computes/checks (Ciechanowski applied to oneself),
2. ideas carry a **proof-state ripeness** badge derived from Lean (`proved` vs `sorry`) — Appleton's garden, but machine-graded,
3. the "Today" entry is machine-pulled from the latest commit (Wolfram's machinery, made live; Willison's recency),
4. the page is **sovereign** (self-hosted fonts, zero trackers — Linvega) and **provenanced** (every visit mints a Khipu receipt — a thing literally no personal site does),
5. and the reader can **stack** artifacts side-by-side to compose a derivation trail (Matuschak).

This is *not* the org card. The org card is a ledger of an empire (Spaces, datasets, scorecards). The Living Notebook is the **interior of one mind**: its formulas you can rearrange, its proofs you can re-check, its thought from this morning, and a receipt proving you were here.
