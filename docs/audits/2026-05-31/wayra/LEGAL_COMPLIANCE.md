# WAYRA_LEGAL_COMPLIANCE — the explicit boundary of the empire's lungs

**Layer:** PURIQ → WAYRA (Doctrine v13, 4th edge organ). **Author / signatory:**
**Yachay**, under CTO authority. **Date:** 2026-06-01.

WAYRA is **RECEIVE-ONLY from PUBLIC sources.** This document is the binding boundary;
the `WAYRA_SOURCES_CATALOG.md` entries and the `szl_wayra` adapters are constrained by
it. Every line below is a HARD RULE.

---

## ✅ ALLOWED — official APIs we use officially

| Source | Endpoint | Basis |
|---|---|---|
| Hugging Face Hub | `huggingface_hub.HfApi.list_models` over [huggingface.co/api/models](https://huggingface.co/api/models) | Official client + Hub API ToS; read token; read-only **metadata** |
| GitHub REST / Atom | per-repo [releases.atom](https://github.com/zarf-dev/zarf/releases.atom) public feeds | GitHub ToS public-feed read; no auth needed |
| arXiv | RSS [rss.arxiv.org](https://rss.arxiv.org/rss/cs.AI) + OAI-PMH [export.arxiv.org/oai2](http://export.arxiv.org/oai2) | arXiv API terms; **abstracts only** |
| Zenodo | OAI-PMH [zenodo.org/oai2d](https://zenodo.org/oai2d) + REST [developers.zenodo.org](https://developers.zenodo.org/) | Open API; per-deposit license recorded |
| USPTO | PatentsView [search.patentsview.org](https://search.patentsview.org/api/v1/) + Open Data [developer.uspto.gov](https://developer.uspto.gov/) | US-gov public data |
| SAM.gov | Get Opportunities Public API [open.gsa.gov](https://open.gsa.gov/api/get-opportunities-public-api/) | US-gov public; free API key |
| USASpending.gov | [api.usaspending.gov](https://api.usaspending.gov/) | US-gov public domain; no auth |
| FCC IBFS | [fcc.gov/general/ibfs](https://www.fcc.gov/general/ibfs) + [opendata.fcc.gov](https://opendata.fcc.gov/) | Public regulatory database |
| FAA public UAS data | [faa.gov/uas](https://www.faa.gov/uas) | Public datasets / broadcast metadata |
| IETF datatracker | [datatracker.ietf.org](https://datatracker.ietf.org/) Atom feeds + [rfc-editor.org/rfcrss.xml](https://www.rfc-editor.org/rfcrss.xml) | Public standards feeds |
| W3C | [w3.org/blog/news/feed/](https://www.w3.org/blog/news/feed/) + [w3.org/TR/](https://www.w3.org/TR/) | Public standards feeds |

## ✅ ALLOWED — RSS / Atom feeds we subscribe to

GitHub `releases.atom`, arXiv per-category RSS, vendor newsroom RSS
([Anduril](https://www.anduril.com/feed.xml), Shield AI, Skydio, AeroVironment),
[Bellingcat](https://www.bellingcat.com/feed/), CSIS Missile Defense
([missilethreat.csis.org/feed/](https://missilethreat.csis.org/feed/)), Defense News,
Aviation Week (public RSS), IETF/W3C feeds. RSS/Atom are publisher-offered subscription
channels — using them as intended is allowed.

## ✅ ALLOWED — robots.txt-respecting reads

Where no API/RSS exists, WAYRA reads only paths that the site's `robots.txt` permits,
with a descriptive User-Agent (`WAYRA/0.1 … receive-only public-source ingest`) and a
per-source rate-limit. We **honor `robots.txt`** and `Crawl-delay`.

---

## ❌ FORBIDDEN — the hard ❌-list

1. **❌ Paywalled content.** Janes, Aviation Week premium, RUSI/INSS premium bodies are
   **summarized from public abstracts only** — never the paywalled body.
2. **❌ Proprietary closed-weight models.** We add closed models via their **official
   providers** (API), never bake the weights. WAYRA flags an open-weight model for
   a11oy router admission; it does **not** download/redistribute closed weights.
3. **❌ Scraping ToS-restricted sites.** If a site's ToS or `robots.txt` forbids
   automated access, WAYRA does not access it. No exceptions for "just this once."
4. **❌ "Baking into drone companies' systems."** The founder's *"baked into all the
   drone companies — fully wired in"* is realized as **monitoring their PUBLIC moves
   only** (press RSS, public awards, public filings). WAYRA **installs no code in any
   third party's product or infrastructure** without a contract. WAYRA is
   **RECEIVE-ONLY from public sources** — full stop.
5. **❌ Member-only standards material.** ASTM F38 and NATO STANAG member-only documents
   are **never** ingested — only their where-publicly-accessible pages.
6. **❌ Non-public OSINT.** No intrusion, no credentialed access, no purchased private
   datasets. Public record only.

---

## GDPR + CCPA posture

- **Public data only; no PII collection.** WAYRA ingests publicly published artifacts
  (model cards, release notes, paper abstracts, public awards, press releases). It does
  **not** build profiles of individuals.
- **Incidental human names** (e.g. paper authors, press contacts) appearing in a public
  artifact are stored only as part of that artifact's public record, not enriched,
  cross-referenced, or sold.
- **Right-to-be-forgotten respected.** Any human-named content is purgeable on request:
  a deletion tombstone is written and the corresponding `events` row is redacted while
  the Khipu chain integrity is preserved (the receipt's `payload_digest` remains, the
  redacted content is removed) — GDPR Art. 17 / CCPA deletion right.
- **Lawful basis:** legitimate interest in monitoring public technical/market signals;
  no special-category data; no automated decisions about individuals.
- **Data minimization:** only the fields needed for routing + dedup are retained; raw
  payloads are bounded and aged out (60-day hot → archive).

---

## Rate-limit politeness

- Each adapter declares `rate_limit_s` (HF 1.0s, GitHub 1.5s, arXiv 3.0s, drone/standards
  2.0s) and throttles to it.
- Descriptive `User-Agent` identifies WAYRA + its receive-only, public-source nature and
  links to the SZL HF org.
- Per-source acceptance-ratio drives a **politeness back-off**: a high-trash source whose
  items keep dropping below Yuyay 0.30 is rate-limited further (not blindly re-polled).
- Daily intake is **cost-bounded at 50 items/day before Yuyay drop** (HARD RULE).

---

## Honest labels (carried from Doctrine v12 §2 / v11 §9)

- The Khipu receipt **signature** is **DSSE PLACEHOLDER** — the store verifies the
  **hash chain**, not a cryptographic signature. SLSA level remains **L1 (honest)**.
- The Yuyay-13 ingest scores are **deterministic, inspectable heuristics in [0,1]**, NOT
  a trained classifier and NOT a claim of ground truth. They give the gate a reproducible
  signal; they are not represented as oracle judgments.

---

**Signed — Yachay**, PURIQ brain-trust extension, under CTO authority. 2026-06-01.
WAYRA is RECEIVE-ONLY from public sources. No code is baked into any third party's
systems without a contract. Every source cited; every boundary explicit.
