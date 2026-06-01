# WHAT NOBODY HAS DONE

*A one-page narrative on what is genuinely original in The Provenanced Notebook, measured against
the best precedents in software. Signed: Yachay.*

---

## The claim

Every great personal site in software owns exactly **one** idea. Nobody had combined them — and
nobody had added the move that makes this site impossible to copy: **the page is a node in the very
chain it describes.** Reading it is a provenanced act.

## The six precedents, and the one move each made

- **Bartosz Ciechanowski** ([ciechanow.ski](https://ciechanow.ski)) proved *the widget is the
  argument* — you operate an airfoil, you don't read about it. But his widgets explain **the
  physical world**.
- **Andy Matuschak** ([notes.andymatuschak.org](https://notes.andymatuschak.org/About_these_notes))
  proved *navigation is content* — stacked notes let the reader compose their own trail. But his
  artifacts are **prose**.
- **Maggie Appleton** ([maggieappleton.com/garden](https://maggieappleton.com/garden/)) proved
  *done-ness is data* — seedling/budding/evergreen ripeness shown openly. But ripeness is
  **author-asserted**.
- **Devine Lu Linvega** ([wiki.xxiivv.com](https://wiki.xxiivv.com/site/devine_lu_linvega.html))
  proved *sovereignty is an aesthetic* — own every byte, no third parties. But the site is a
  **static** wiki.
- **Stephen Wolfram** ([via Simon Willison](https://simonwillison.net/tags/productivity/)) proved
  *the workshop beats the trophy* — expose the machinery of thinking. But he describes it in
  **prose**.
- **Simon Willison** ([simonwillison.net](https://simonwillison.net)) proved *recency is
  credibility* — relentless daily public increments. But "today" is **hand-published**.

## What this notebook does that none of them did

1. **Ciechanowski, turned inward.** The operable widgets are not the physical world — they are
   *Stephen's own formally-verified work*. The PURIQ master formula is a live calculator; move a
   slider and the agentic decision score recomputes, and breaking the Khipu chain forces the score
   to literal zero — the page *demonstrates* the theorem (provenance is necessary) instead of
   asserting it. The drag-to-derive bench composes ancient primitives (Noether, Shannon, Khipu, Λ,
   Bekenstein, Yuyay-13) into a brand-new named law in rendered LaTeX, then hands the obligation to
   a Lean kernel. **Nobody has made their own theorems the operable widgets.**

2. **Appleton's ripeness, but machine-graded.** An idea's state is not the author saying "this feels
   evergreen." It is **proved** vs **sorry**, pulled from the doctrine's locked counts (749 / 14 /
   163) and re-derived live by a `lutar-lean`-lite kernel running in a Web Worker — add a `sorry`
   and watch the badge flip from PROVED to SORRY in real CPU time. **Nobody has let a proof-checker,
   not the ego, grade the ripeness of a thought.**

3. **Wolfram's machinery + Willison's recency, made live and honest.** "Today" is not hand-written;
   it is machine-pulled from the latest GitHub commit plus this-morning's thought. The workshop is
   shown *running*, not described.

4. **The move no personal site on Earth makes: the page provenances itself.** Every load mints an
   anonymous Khipu receipt — `SHA-256(ephemeral salt | page | minute)` computed entirely in your
   browser, never stored, never transmitted — and tells you *"you are receipt #N in the chain."*
   The site is therefore an instance of the exact doctrine it documents: even reading about the work
   is a receipt-emitting, auditable act. It is also, by the same construction, perfectly
   privacy-preserving — there is no analytics, no cookie, no tracker, and nothing to leak. **A
   personal site that is simultaneously a live demo of its author's thesis and a GDPR-safe artifact
   is, as far as the Phase-0 survey found, unprecedented.**

5. **Linvega-grade sovereignty as the substrate for all of it.** Self-hosted fonts, self-hosted
   KaTeX, self-hosted Three.js, no runtime CDN, no third party — so the four moves above run with
   zero external trust. The sovereignty is not decoration; it is what lets the receipt claim ("never
   left this device") be *true*.

## In one sentence
Others built sites that *teach*, that *link*, that *grow*, that *own their bytes*, that *expose the
maker*, or that *prove recency* — this is the first that does all six **and is itself a verifiable,
self-provenancing node in the chain it describes**, where the author's own proofs are the widgets
and a machine, not the author, decides what is finished.

— Yachay
