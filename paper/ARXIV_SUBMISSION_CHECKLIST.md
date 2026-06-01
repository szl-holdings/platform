# Track E-01 — arXiv Submission Plan: "The Ouroboros Thesis v3"

**Document ID:** ARXIV-E-01
**Audience:** Stephen as the corresponding author
**Status:** Manuscript v3 exists at `replit_payload/paper/ouroboros-thesis-v3.md`. This document closes the gap between manuscript and posted preprint.

---

## 1. Why arXiv now

Three reasons, in order of business value:

1. **Citation surface.** A preprint with a stable arXiv ID becomes a citable artifact. NYSTEC reviewers, prime contractors, and academic collaborators can reference it. Without it, the thesis is just a blog post.
2. **Priority date.** Posting establishes a public, dated technical disclosure — useful if any of the methods later become patentable or contested.
3. **Distribution.** arXiv pushes preprints to Google Scholar, Semantic Scholar, ConnectedPapers, and a few hundred mailing lists. Free distribution to the precise audience that values the work.

## 2. arXiv mechanics

### 2.1 Account

- Author: Stephen P. Lutar Jr.
- Affiliation: SZL Holdings · United States
- Email: inquiries@szlholdings.com
- ORCID: register if not yet; required for several arXiv categories.
- Endorsement: as a first-time submitter to most categories, an endorsement may be needed. Track-specific notes in §4.

### 2.2 Categories

Primary: **cs.LG** (Machine Learning).
Secondary cross-listings (in priority order):
- cs.AI (Artificial Intelligence) — for the agent-fabric framing
- cs.CR (Cryptography and Security) — for the evidence-ledger / replay-attestation argument
- cs.SE (Software Engineering) — for the runtime-engineering claims

### 2.3 License

Use **arXiv perpetual non-exclusive** by default. If we plan to submit to a venue that requires CC-BY, choose CC-BY 4.0 here.

### 2.4 Required artifacts

- LaTeX source `.tex` (we will compile the markdown to LaTeX; see §3)
- Bibliography `.bib`
- Figures as PDF (vector) or PNG ≥ 300 DPI
- Compiled PDF preview for sanity check

## 3. Manuscript prep checklist

- [ ] Convert `ouroboros-thesis-v3.md` to LaTeX using `pandoc` with the arXiv-friendly template:

  ```bash
  pandoc ouroboros-thesis-v3.md \
    --from markdown \
    --to latex \
    --standalone \
    --bibliography references.bib \
    --citeproc \
    --template arxiv-template.tex \
    -o ouroboros-thesis-v3.tex
  ```

- [ ] Add proper `\documentclass{article}` (single-column, 11pt) and the standard arXiv-friendly preamble (no proprietary class files).
- [ ] Verify all references in the bibliography resolve. **No fake references.** (The v2 paper had this problem; v3 must not.)
- [ ] Verify all equations render correctly. The previously-broken equation in v2 must be fixed in v3 — re-check.
- [ ] Add the abstract: ≤ 1920 characters (arXiv hard limit) and ≤ 250 words (good practice).
- [ ] Add an "Author contributions" section (single author for v3 — state explicitly).
- [ ] Add an "Ethics and safety" subsection if relevant — cite `A11OY-03-bias-testing-methodology.md` for the public-facing bias methodology.
- [ ] Add an "Availability" section listing:
  - Public replay endpoint: `https://szlholdings.com/replay-attestation`
  - Source: `https://github.com/szl-holdings/ouroboros`
  - Reference implementation: list packages
- [ ] Add ORCID and email to the author block.
- [ ] Add the date line (use the actual submission day).
- [ ] Run `chktex` for LaTeX issues and fix.
- [ ] Run `pdflatex` twice + `bibtex` + `pdflatex` once more; confirm clean compile.
- [ ] Visual review of the compiled PDF.
- [ ] Spelling pass (`aspell` or equivalent).

## 4. Endorsement

If this is your first cs.LG submission and you don't have a co-author with category-history, you'll need an endorser:

- Reach out to a peer who has prior arXiv submissions in cs.LG/cs.AI.
- Send them a one-paragraph synopsis + the abstract.
- They submit the endorsement through arXiv.
- Endorsement is per category, not per paper; once endorsed, future submissions to the same category don't need re-endorsement.

## 5. Submission steps

1. Log in to arXiv.
2. Click "Start new submission."
3. Choose article type: **New submission** → category **cs.LG**.
4. Paste the abstract.
5. Upload `.tex` source + `.bib` + figures (zip).
6. Verify the auto-compile succeeds. If it fails, the platform shows a log; address and resubmit.
7. Set cross-listings: cs.AI, cs.CR, cs.SE.
8. Add the title, author, ORCID, comments (e.g., "12 pages, 3 figures").
9. Submit. arXiv assigns an identifier in the form `arXiv:2604.NNNNN` (or `2605.NNNNN` depending on month).

## 6. Day-of-publication checklist

- [ ] Tweet/X post linking the preprint with one sentence + the abstract image
- [ ] LinkedIn post — founder voice — ~200 words, with the link and one anchor takeaway
- [ ] Email NYSTEC contact with the link
- [ ] Add the arXiv link to `/governance` and `/research`
- [ ] Add the link to the GitHub repo's `README.md`
- [ ] Open a `notify-listees` issue on the repo to track who has been told
- [ ] Cross-post to Hacker News during a weekday morning slot (US time)

## 7. Post-publication

- arXiv allows **revisions** (`v2`, `v3`, etc.). Treat the first post as the publication and reserve revisions for substantive corrections.
- **Withdrawal** is possible but discouraged; arXiv leaves a tombstone if you withdraw.
- **Citations** to `arXiv:NNNN.NNNNN` should be tracked via Semantic Scholar Author API and reported to the team monthly.

## 8. arXiv risks and how to mitigate

- **Rejection or "moderation hold."** arXiv occasionally holds submissions for review. Mitigation: avoid overclaim language; use precise technical wording; cite every claim.
- **Comments and feedback can be hostile.** Have a one-paragraph, calm response template ready that thanks the commenter, addresses the substantive point, and links to the relevant section of the paper or a running issue on the public repo.
- **Press misreads.** If a reporter contacts about the preprint, the founder responds — not with hype, but with the same regulated-monitoring vocabulary used on the site.

## 9. Manuscript revisions specific to v3

The v3 manuscript already addresses the v2 issues (broken equation, fake references, adaptive depth not implemented). Before submission, run the following final-pass checks:

- [ ] Every equation references real notation defined elsewhere
- [ ] Every cited reference resolves to a real paper or technical report
- [ ] The "adaptive depth allocator" section maps to the actual `EntropyDepthAllocator` source in `packages/cognitive-runtime`
- [ ] The empirical section reports honestly — including failure modes and limitations
- [ ] The methodology subsection cross-references `A11OY-03-bias-testing-methodology.md` so the public preprint and the public compliance doc agree
- [ ] The replay claim cross-references `https://szlholdings.com/replay-attestation` so a curious reader can verify the system works the way the paper says

## 10. Acceptance criteria

- arXiv ID assigned (`arXiv:NNNN.NNNNN`).
- Preprint PDF compiles cleanly from public source.
- Linked on `/governance`, `/research`, repo README, social channels.
- One email sent to NYSTEC contact and to first 5 design-partner candidates with the link and a one-sentence ask.
