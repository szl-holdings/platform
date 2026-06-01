# WAYRA_SOURCES_CATALOG — every stream the empire's lungs breathe

**Layer:** PURIQ → WAYRA (Doctrine v13, 4th edge organ). **Author:** Yachay, under CTO
authority. **Date:** 2026-06-01. Every source below is an **official API, an RSS/Atom
feed, or a robots-respecting public endpoint** — see `LEGAL_COMPLIANCE.md` for the
boundary. Every source URL is cited. RECEIVE-ONLY from PUBLIC sources (HARD RULE).

**Khipu receipt schema (every ingested item, all categories):** the canonical
`IngestEvent` (`wayra/core/normalize.py`) → persisted in SQLite `events` table and
chained in the SHA3-256 `receipts` table (`wayra/core/khipu_emit.py`):

```
IngestEvent {
  source, source_detail, timestamp, ingested_at, title, url, content_hash (sha3-256),
  raw, parsed_summary, license, yuyay_score, novelty_score, wayra_factor,
  organ_routing[], decision (accept|review|drop)
}
Receipt { seq, organ="wayra", ns, action="ingest:<decision>", content_hash,
          payload_digest (sha3-256), ts, prev, digest (sha3-256), signature="DSSE_PLACEHOLDER",
          chain_verified }
```

---

## 1 — HF HUB WATCHER (top model orgs)

Watches the top open-weight / frontier model orgs for new and newly-modified uploads.

| Attribute | Value |
|---|---|
| **API** | Official `huggingface_hub.HfApi.list_models(author=…, sort="last_modified", cardData=True, full=True)` over [https://huggingface.co/api/models](https://huggingface.co/api/models) |
| **Auth** | Read token (HF_TOKEN), `whoami` confirms `betterwithage` ∈ org `SZLHOLDINGS` |
| **License/ToS** | HF Hub API ToS; read-only model **metadata** (id, last_modified, card license, pipeline, downloads). Weights are NEVER baked — only flagged for a11oy router admission |
| **Ingest mechanism** | API poll (delta by `last_modified`) |
| **Refresh cadence** | hourly |
| **Expected volume** | ~50 orgs × 2 newest = ~100 candidates/poll; mostly duplicates after first run |
| **Khipu receipt** | `source="hf_hub"`, `source_detail=<org>`, dedup identity `[hf_hub, model_id, last_modified]` |
| **Downstream organ** | **a11oy** (model router); accepted GREEN/AMBER models get a Yuyay-gated quick benchmark via `/v1/router` before router-admission |

**Top model orgs watched** (sourced from `puriq/llms/OPEN_LLM_LANDSCAPE_2026.md` + HF Hub authors):
`meta-llama, Qwen, deepseek-ai, mistralai, google, microsoft, 01-ai, CohereForAI,
stabilityai, tiiuae, HuggingFaceH4, allenai, nvidia, ibm-granite, internlm, THUDM,
bigcode, facebook, openai-community, EleutherAI, BAAI, Salesforce, togethercomputer,
NousResearch, teknium, upstage, openchat, WizardLMTeam, cognitivecomputations, ai2,
apple, amazon, Snowflake, databricks, xai-org, moonshotai, zai-org, perplexity-ai,
ServiceNow-AI, LiquidAI, arcee-ai, jinaai, Alibaba-NLP, sentence-transformers, laion,
OpenGVLab, Skywork, rinna, openbmb, kyutai` (50).
Canonical org pages, e.g. [huggingface.co/Qwen](https://huggingface.co/Qwen),
[huggingface.co/deepseek-ai](https://huggingface.co/deepseek-ai),
[huggingface.co/meta-llama](https://huggingface.co/meta-llama).

---

## 2 — GITHUB RELEASES (top leader repos)

Polls the public per-repo Atom release feed `https://github.com/{owner}/{repo}/releases.atom`.

| Attribute | Value |
|---|---|
| **Feed** | `releases.atom` per repo (official GitHub feed, no auth, robots-friendly) |
| **License/ToS** | GitHub ToS public-feed read; we ingest **release notes metadata** (title + notes), not source code |
| **Ingest mechanism** | RSS/Atom poll |
| **Refresh cadence** | hourly |
| **Expected volume** | 30 repos × 2 newest = ~60 candidates/poll |
| **Khipu receipt** | `source="github_releases"`, `source_detail="<owner>/<repo>"`, dedup identity `[github_releases, entry_id]` |
| **Downstream organ** | per-repo routing → **a11oy / sentra / killinchu / amaru** |

**Leader repos watched** (URLs):
[defenseunicorns/uds-core](https://github.com/defenseunicorns/uds-core/releases.atom),
[zarf-dev/zarf](https://github.com/zarf-dev/zarf/releases.atom),
[defenseunicorns/pepr](https://github.com/defenseunicorns/pepr/releases.atom),
[ArduPilot/ardupilot](https://github.com/ArduPilot/ardupilot/releases.atom),
[PX4/PX4-Autopilot](https://github.com/PX4/PX4-Autopilot/releases.atom),
[sigstore/cosign](https://github.com/sigstore/cosign/releases.atom),
[sigstore/sigstore](https://github.com/sigstore/sigstore/releases.atom),
[in-toto/in-toto](https://github.com/in-toto/in-toto/releases.atom),
[slsa-framework/slsa](https://github.com/slsa-framework/slsa/releases.atom),
[slsa-framework/slsa-github-generator](https://github.com/slsa-framework/slsa-github-generator/releases.atom),
[anthropics/anthropic-cookbook](https://github.com/anthropics/anthropic-cookbook) (MIT),
[openai/openai-cookbook](https://github.com/openai/openai-cookbook) (MIT),
plus the cloud-native / supply-chain leaders: kubernetes, kustomize, helm,
opentelemetry-collector, cilium, istio, argo-cd, flux2, runc, containerd, spire, opa,
kyverno, trivy, syft, grype, llama.cpp, vllm.

> **NVIDIA/NIM** is a **private** repo — we do **not** track the private repo. We track
> the **public NIM release notes / model-card mirror** at
> [build.nvidia.com](https://build.nvidia.com/) and the public
> [NVIDIA/* HF org](https://huggingface.co/nvidia) instead (LEGAL boundary).

**IETF tools / datatracker** release-style updates are watched in §6 (Standards).

---

## 3 — arXiv FIREHOSE (daily new papers)

Subscribes to arXiv's official per-category RSS feeds; reads **abstracts only**.

| Attribute | Value |
|---|---|
| **Feed** | `https://rss.arxiv.org/rss/{category}` (official arXiv RSS). OAI-PMH also available at [export.arxiv.org/oai2](http://export.arxiv.org/oai2) for backfill |
| **License/ToS** | arXiv "abstracts only" posture honored — we never fetch full PDFs; abstracts are CC-licensed metadata |
| **Ingest mechanism** | RSS poll (OAI-PMH for catch-up) |
| **Refresh cadence** | daily |
| **Expected volume** | 6 categories × ~10–50 new/day = ~60–300/day, Yuyay-gated, capped at 50/day |
| **Khipu receipt** | `source="arxiv"`, `source_detail=<category>`, dedup identity `[arxiv, oai_guid]` |
| **Downstream organ** | cs.AI/cs.LO → **puriq/a11oy**; cs.CR → **sentra**; cs.RO/eess.SY → **killinchu** |

**Categories:** [cs.AI](https://rss.arxiv.org/rss/cs.AI), [cs.LG](https://rss.arxiv.org/rss/cs.LG),
[cs.CR](https://rss.arxiv.org/rss/cs.CR), [cs.LO](https://rss.arxiv.org/rss/cs.LO),
[cs.RO](https://rss.arxiv.org/rss/cs.RO), [eess.SY](https://rss.arxiv.org/rss/eess.SY).

---

## 4 — ZENODO + bioRxiv + OpenReview (daily new deposits)

| Source | URL / API | Mechanism | Cadence | Downstream |
|---|---|---|---|---|
| **Zenodo** | OAI-PMH [zenodo.org/oai2d](https://zenodo.org/oai2d) + REST [developers.zenodo.org](https://developers.zenodo.org/) (search by community: AI-safety, formal-verification) | OAI-PMH / API poll | daily | puriq, amaru |
| **bioRxiv** | API [api.biorxiv.org](https://api.biorxiv.org/) (`/details/biorxiv/<from>/<to>`) | API poll | daily | (advisory; low weight) |
| **OpenReview** | API [docs.openreview.net](https://docs.openreview.net/) (`/getting-started/using-the-api`) — venue notes for ICLR/NeurIPS/safety workshops | API poll | daily | puriq, a11oy |

License/ToS: all three publish open APIs; Zenodo records carry per-deposit licenses
(we record `license` per item). Khipu receipt: `source ∈ {zenodo, biorxiv, openreview}`,
dedup identity `[source, record_doi_or_id]`. Volume: tens/day, Yuyay-gated.
*(Catalogued; the live adapter ships HF/GitHub/arXiv/standards/drone first per the
verification bar; Zenodo/bioRxiv/OpenReview reuse the OAI-PMH + JSON-API code path of
the arXiv + USASpending adapters and are next in the ingest rotation.)*

---

## 5 — DRONE OSINT FIREHOSE

RECEIVE-ONLY monitoring of PUBLIC drone-leader moves. We never bake code into their
systems and never touch a non-public source.

| Source | URL / API | License/ToS | Mechanism | Cadence | Downstream |
|---|---|---|---|---|---|
| **SAM.gov solicitations** | [sam.gov](https://sam.gov/) Get Opportunities Public API [open.gsa.gov/api/get-opportunities-public-api](https://open.gsa.gov/api/get-opportunities-public-api/) | US-gov public; API key (free) | API poll | daily | killinchu, sentra |
| **USASpending.gov awards** | [api.usaspending.gov](https://api.usaspending.gov/) `/api/v2/search/spending_by_award/` | US-gov public domain; no auth | API POST poll | daily | killinchu, sentra |
| **FCC IBFS** | [fcc.gov/general/ibfs](https://www.fcc.gov/general/ibfs) public query / [opendata.fcc.gov](https://opendata.fcc.gov/) | public; query | weekly | killinchu |
| **FAA Remote-ID / UAS** | FAA public datasets [faa.gov/uas](https://www.faa.gov/uas) + [adsbexchange.com](https://www.adsbexchange.com/) public metadata (where publicly available) | public broadcast metadata only | weekly | killinchu |
| **Anduril press** | [anduril.com/feed.xml](https://www.anduril.com/feed.xml) | public newsroom RSS | RSS poll | daily | killinchu, sentra |
| **Shield AI press** | [shield.ai/feed/](https://shield.ai/feed/) | public newsroom RSS | RSS poll | daily | killinchu |
| **Skydio press** | [skydio.com/blog/rss.xml](https://www.skydio.com/blog/rss.xml) | public newsroom RSS | RSS poll | daily | killinchu |
| **AeroVironment press** | [avinc.com](https://www.avinc.com/rss/press-releases) | public newsroom RSS | RSS poll | daily | killinchu |
| **Saronic** | [saronic.com/news](https://www.saronic.com/news) (RSS where published) | public newsroom | RSS/poll | daily | killinchu, vessels |
| **Bellingcat** | [bellingcat.com/feed/](https://www.bellingcat.com/feed/) public OSINT reports | CC-licensed public reports | RSS poll | daily | killinchu, sentra |

Khipu receipt: `source="drone_osint"`, `source_detail ∈ {"press:<vendor>", "USASpending:<kw>", …}`,
dedup identity `[drone_osint, item_id_or_url]`. USASpending keyword searches:
`"counter-UAS"`, `"unmanned aircraft system"`, `"drone autonomy"`.

> **Boundary (HARD RULE):** *"baked into all the drone companies — fully wired in"* is
> realized as **monitoring their PUBLIC moves only**. WAYRA does **not** install code in
> any third party's product. See `LEGAL_COMPLIANCE.md` ❌-list.

---

## 6 — STANDARDS WATCHER

| Source | URL | License/ToS | Mechanism | Cadence | Downstream |
|---|---|---|---|---|---|
| **IETF SCITT WG** | [datatracker.ietf.org/wg/scitt/](https://datatracker.ietf.org/wg/scitt/) Atom | public | Atom poll | daily | sentra, amaru |
| **IETF COSE / OAUTH WG** | [datatracker.ietf.org/wg/cose/](https://datatracker.ietf.org/wg/cose/), [/wg/oauth/](https://datatracker.ietf.org/wg/oauth/) | public | Atom poll | daily | sentra |
| **IETF new RFCs** | [rfc-editor.org/rfcrss.xml](https://www.rfc-editor.org/rfcrss.xml) | public | RSS poll | daily | sentra, a11oy |
| **IETF datatracker (general)** | [datatracker.ietf.org](https://datatracker.ietf.org/) document-changes feed | public | Atom poll | daily | sentra, amaru |
| **SLSA / in-toto** | tracked via §2 GitHub release atoms ([slsa-framework/slsa](https://github.com/slsa-framework/slsa), [in-toto/in-toto](https://github.com/in-toto/in-toto)) | OSS public | Atom poll | hourly | sentra, amaru |
| **W3C TR / news** | [w3.org/blog/news/feed/](https://www.w3.org/blog/news/feed/) + [w3.org/TR/](https://www.w3.org/TR/) | public | RSS poll | daily | a11oy |
| **ASTM F38 (UAS)** | [astm.org/committee/f38](https://www.astm.org/get-involved/technical-committees/committee-f38) — public docs only | public docs only | manual/where-public | quarterly | killinchu |
| **NATO STANAG (UAS)** | [nso.nato.int](https://nso.nato.int/) public STANAG editor pages where publicly accessible | public-only | where-public | quarterly | killinchu |

Khipu receipt: `source="standards"`, `source_detail=<feed name>`, dedup identity
`[standards, item_id_or_url]`. ASTM/NATO member-only material is **never** ingested.

---

## 7 — NEWS + THREAT INTEL

| Source | URL | License/ToS | Mechanism | Cadence | Downstream |
|---|---|---|---|---|---|
| **Defense News** | [defensenews.com … rss](https://www.defensenews.com/arc/outboundfeeds/rss/) | public RSS | RSS poll | daily | killinchu, sentra |
| **Defense News (unmanned)** | [defensenews.com/…/category/unmanned/?outputType=xml](https://www.defensenews.com/arc/outboundfeeds/rss/category/unmanned/?outputType=xml) | public RSS | RSS poll | daily | killinchu |
| **Aviation Week** | [aviationweek.com](https://aviationweek.com/rss.xml) (public RSS where available) | public RSS / abstracts | RSS poll | daily | killinchu |
| **CSIS Missile Defense Project** | [missilethreat.csis.org/feed/](https://missilethreat.csis.org/feed/) | public RSS | RSS poll | weekly | sentra, killinchu |
| **RUSI** | [rusi.org](https://www.rusi.org/) Whitehall reports (public abstracts) | abstracts only | RSS/poll | weekly | sentra |
| **INSS** | [inss.org.il](https://www.inss.org.il/) Strategic Survey (public) | abstracts only | RSS/poll | monthly | sentra |
| **MDAA** | [missiledefenseadvocacy.org](https://missiledefenseadvocacy.org/) quarterly updates (public) | public | poll | quarterly | sentra |
| **Janes** | [janes.com](https://www.janes.com/) — **where public only** | paywalled → abstracts only | abstracts only | as-public | sentra |

> **Paywall posture (HARD RULE):** Janes / Aviation Week / RUSI premium content is
> **summarized from public abstracts only** — never the paywalled body. See LEGAL ❌-list.

Khipu receipt: `source="news"`, `source_detail=<outlet>`, dedup identity `[news, url]`.

---

## 8 — PATENT WATCHER

| Source | URL / API | License/ToS | Mechanism | Cadence | Downstream |
|---|---|---|---|---|---|
| **USPTO PatentsView** | [patentsview.org/query/api](https://search.patentsview.org/api/v1/) (modern PAIR-equivalent) | US-gov public; no auth | API poll | weekly | killinchu, sentra, puriq |
| **USPTO Open Data (PEDS/PAIR)** | [ped.uspto.gov](https://ped.uspto.gov/) / [developer.uspto.gov](https://developer.uspto.gov/) | public | API poll | weekly | killinchu |
| **Google Patents** | [patents.google.com](https://patents.google.com/) scholar alerts (RSS where offered) | public; abstracts | alert/poll | weekly | killinchu, puriq |

**Query set:** `drone autonomy`, `counter-UAS`, `AI safety alignment`, `formal
verification neural`, `swarm coordination`, `GPS-denied navigation`.
Khipu receipt: `source="patents"`, `source_detail=<query>`, dedup identity
`[patents, patent_number]`.

---

## 9 — SUMMARY: WIRED-LIVE vs CATALOGUED

| Category | Adapter | Live in `szl_wayra` | Verified live this run |
|---|---|---|---|
| HF Hub Watcher | `hf_hub_watcher.py` | ✅ | ✅ (24 events) |
| GitHub Releases | `github_releases.py` | ✅ | ✅ (20 events) |
| arXiv firehose | `arxiv_firehose.py` | ✅ | ✅ (24 events) |
| Standards watcher | `standards_watcher.py` | ✅ | ✅ (6 events) |
| Drone OSINT | `drone_osint.py` | ✅ | ✅ (12 events) |
| Zenodo/bioRxiv/OpenReview | (OAI-PMH path) | catalogued | next rotation |
| News + threat intel | (RSS path, reuse feedparse) | catalogued | next rotation |
| Patent watcher | (PatentsView API path) | catalogued | next rotation |

Every catalogued-not-yet-live source reuses an already-shipped code path (RSS via
`feedparse.py`, OAI-PMH/JSON via the arXiv/USASpending pattern), so wiring it is a
config addition, not new machinery. All five live adapters were exercised against real
endpoints and against canned payloads in the pytest suite.

— Yachay, under CTO authority, 2026-06-01. Every source URL cited above. RECEIVE-ONLY.
