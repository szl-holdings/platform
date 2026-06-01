# arXiv Submission Process — PURIQ Preprint (cs.AI)

This document records the staging bundle and the exact steps to submit the PURIQ
preprint to arXiv. The agent has prepared and verified the submission bundle; the
final upload and the **endorsement** are founder actions (arXiv requires a logged-in
account and, for first-time `cs.AI` submitters, an endorsement).

## Submission bundle (verified)

Located in `arxiv_staging/`:

| File | Role |
|------|------|
| `main.tex` | Top-level source (arXiv AutoTeX entry point). |
| `main.bbl` | Pre-built bibliography — shipped so arXiv does **not** run BibTeX. |
| `bibliography.bib` | BibTeX source, included for completeness only. |
| `00README.XXX` | arXiv control file (classification + build notes). |

**Verification performed:** the bundle compiles with `pdflatex main.tex` ×2 using
only the shipped `main.bbl` (no BibTeX run), producing an **8-page** PDF with
**0 undefined citations** and **0 undefined references**. This mirrors arXiv's
AutoTeX behavior.

## Classification

- **Primary:** `cs.AI` — Artificial Intelligence
- **Cross-list (suggested):** `cs.LO` — Logic in Computer Science; `cs.CR` —
  Cryptography and Security

## License

Submit under **CC-BY-4.0** to match the repository and `.zenodo.json`.

## Step-by-step (founder actions)

1. **Log in** at https://arxiv.org with the SZL Holdings / author account.
2. **Start a new submission** → upload the four files from `arxiv_staging/`
   (or a single `.tar.gz` of that directory).
   ```bash
   cd arxiv_staging && tar czf ../puriq_arxiv_submission.tar.gz main.tex main.bbl bibliography.bib 00README.XXX
   ```
3. Set **primary category** `cs.AI`, add cross-lists `cs.LO`, `cs.CR`.
4. Set **license** to CC-BY-4.0.
5. Paste the **title** and **abstract** (copy verbatim from `main.tex`).
6. Verify the AutoTeX preview renders 8 pages with no errors, then **submit**.

## Endorsement (first-time cs.AI submitters)

arXiv requires an endorsement to post to `cs.AI` if the author has not previously
submitted to a related archive from a recognized institutional email.

1. After starting the submission, arXiv shows an **endorsement code** and a request
   URL of the form `https://arxiv.org/auth/endorse?x=XXXXXX`.
2. Ask a colleague who is an established arXiv author **in `cs.AI`, `cs.LO`, or
   `cs.CR`** to visit that URL and confirm the endorsement. Endorsers must meet
   arXiv's submission-count threshold in the relevant archive.
3. Alternatively, submitting from a recognized academic/institutional email address
   can auto-qualify and bypass the manual endorsement request.
4. Once endorsed, return to the pending submission and complete it.

> The endorsement request is a one-time gate per archive; subsequent PURIQ/Ouroboros
> submissions from the same account will not require it again.

## Cross-references to set after posting

- Add the arXiv identifier to the GitHub `README.md` and `CITATION.cff`.
- In `.zenodo.json`, add a `related_identifiers` entry
  `{"relation": "isIdenticalTo", "identifier": "arXiv:XXXX.XXXXX", "scheme": "arxiv"}`
  so the Zenodo record and the arXiv posting are linked.

---

Author: Stephen P. Lutar Jr. (Yachay).
Co-authored-by: Perplexity Computer Agent.
