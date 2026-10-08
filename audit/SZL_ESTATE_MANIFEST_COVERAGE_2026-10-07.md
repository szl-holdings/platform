# SZL estate manifest coverage — 2026-10-07

**Disposition: metadata coverage completed; production qualification remains HOLD.**

GitHub observation (UTC): `2026-10-08T02:26:45.495585+00:00`. Hugging Face observation (UTC): `2026-10-08T02:26:38.374Z`. Report date uses the client America/New_York calendar.

## Plan and evidence boundary

Read-only plan: enumerate the authorized GitHub organization using every pagination page; resolve every active repository default-branch commit and recursive file tree; enumerate public Hugging Face models, datasets and Spaces through pagination and fetch each asset detail. Record filenames, immutable revisions and reported card/runtime metadata. No dependency installation, code execution, model downloads, vulnerability reproduction, external mutations or competitor copying were performed. This report adds documentation only; root validation runs supply application checks. No UI changed, so screenshots do not apply.

Raw authenticated coverage, including private identifiers, is local-only at `/tmp/estate-metadata/github.json`; raw public HF metadata is `/tmp/estate-metadata/hf.json`. The sanitized JSON appendix retains public revision metadata as a durable snapshot; private coverage appears only as aggregate counts. Raw temporary files contain additional local-only metadata.

## Coverage and limits

| Observation | Result |
| --- | --- |
| GitHub repository enumeration | 140 unique repositories; 12 private and 128 public |
| Active default-branch/tree inspection | 111/111 resolved; 0 inaccessible; 0 truncated |
| Private active coverage | 12 inspected; 0 inaccessible; identifiers withheld |
| Archived scope | 29 metadata-only; contents not inspected |
| Active repositories without recognized root manifest | 22 |
| Active repositories without root LICENSE/COPYING/NOTICE filename | 5 |
| Active repositories without .github/workflows YAML filename | 2 |
| Public Hugging Face assets | 119; 47 models, 37 datasets, 35 Spaces |
| HF detail requests/revisions | 119/119 successful; 119 revision IDs |
| HF reported license/card metadata | 117 licenses; 118 cards |
| Spaces reported runtime stage | 35/35 RUNNING |

A missing root filename does not prove absence of nested manifests, applicable upstream licensing, external CI or an intentional documentation-only repository. A license field does not establish distribution/training rights. RUNNING is the provider-reported container stage, not a successful application transaction, model-quality result or availability guarantee. GitHub metadata uses authorized identity; Hugging Face uses unauthenticated public APIs, so private HF completeness is unknown. A supplemental public collection/Kernel pass is recorded below; private-resource completeness remains unknown.

## Concrete remaining work

1. Review the repositories flagged below for applicable license text and actual dependency manifests, including nested monorepo packages; filename presence is insufficient for legal or supply-chain approval.
2. Obtain exact-revision build, dependency/SBOM, secret-scan and test receipts for each active repository. Only Platform has separate substantial implementation validation in this session; this inventory does not extend those results to 110 other active repositories.
3. Review every HF asset lacking license/card metadata for intended ownership, provenance, redistribution and training rights. Examine model/dataset content and evaluation receipts before admission; this pass downloaded metadata only.
4. Qualify all 35 Spaces with bounded functional and authentication/readiness tests and their backing immutable source revisions. Provider RUNNING state alone does not close publication readiness.
5. Establish authorized private-HF enumeration for models, datasets, Spaces, Kernels and collections; qualify Kernel content/build metadata and review archived content separately if redistribution or reactivation is planned.
6. Preserve a durable reviewed metadata receipt if these inventories become release gates. Remote default branches and runtime stages may change after observation.

## Public GitHub active repository coverage

The [structured public inventory](SZL_ESTATE_MANIFEST_COVERAGE_2026-10-07.json) retains every public repository observation, exact revision, root manifest and licensing filename, and workflow filename. All active public repository trees were complete. CI filename presence does not establish execution or success. Private identifiers are excluded; aggregate private coverage is retained.

## Public repository review flags

These are filename-based review queues, not confirmed defects. Private queue entries are withheld.

**No recognized root dependency manifest:** `.github`, `szl-trust`, `lutar-lean`, `khipu-consensus`, `szl-doctrine`, `szl-holdings.github.io`, `szl-quant-witness`, `a11oy-net`, `szl-drift`, `szl-evidence-litellm`, `szl-constellation`, `szl-runbook-catalog`, `ayllu-hf-space`, `szl-skills`, `registry-mirror`, `szlholdings.com`.

**No root licensing filename:** `szlholdings.com`.

**No workflow YAML filename:** `szl-microscopy-pilot`.

## Hugging Face public asset metadata

The same [JSON appendix](SZL_ESTATE_MANIFEST_COVERAGE_2026-10-07.json) retains public asset identifiers, repository revisions, reported licenses, gated/private flags, SDK and runtime metadata. Missing fields remain null. Reported metadata does not establish rights or operational readiness.

## Verification receipt

GitHub pagination emitted 140 unique rows; all 111 active default-branch commit/tree requests succeeded and returned `truncated=false`. HF catalog pagination returned 119 unique asset type/ID identities, and all 119 individual detail requests succeeded. Raw record counts and required revision fields were checked locally. No inaccessible resource was counted as absent. Application typecheck/build/tests remain owned by the root release work and are not implied by this documentation-only audit.

## Supplemental public collections and Kernels

Observed UTC: `2026-10-08T02:32:15.159248+00:00`. These calls were read-only and unauthenticated. The official [huggingface_hub client source](https://github.com/huggingface/huggingface_hub/blob/main/src/huggingface_hub/hf_api.py) documents owner-filtered `list_collections`, paginated collection retrieval, and `kernel_info` under `/api/kernels/{repo_id}`. Its source warns that collection listings contain at most four items per collection; all seven detail endpoints were fetched to avoid that truncation. The generic Hub Kernel documentation URL `/docs/hub/kernels` returned 404; that does not establish absence of Kernel APIs.

| Query | HTTP/result | Pagination/completeness boundary |
| --- | --- | --- |
| `/api/collections?owner=SZLHOLDINGS&limit=100` | 200; 7 public collections | No next Link header; all 7 detail requests succeeded |
| `/api/collections/{slug}` for every listed collection | 7 × 200; 97 membership entries | Detail items replace truncated listing items; membership is not distinct-asset count |
| `/api/models?author=SZLHOLDINGS&filter=kernel&full=true&limit=100` | 200; 13 kernel-tag-filtered model repos | No next Link header; tag-filter discovery is narrower than Kernel catalog |
| `/api/kernels?author=SZLHOLDINGS&limit=100` | 200; 14 public Kernel catalog entries | No next Link header; every returned ID has SZLHOLDINGS namespace |
| `/api/kernels/{repo_id}` for every catalog entry | 14 × 200; 14 revision SHAs | All 14 names overlap public model catalog; do not add these to 119 as new unique assets |

The Kernel catalog includes `SZLHOLDINGS/szl-maskmod`, which the `filter=kernel` model query omitted. This proves the model-tag filter alone is insufficient coverage. Kernel detail responses omitted `cardData.license` for all 14; `license:*` tags and overlapping model card license fields are recorded separately in the JSON appendix. Those metadata declarations do not establish compatible code/binary rights or successful Kernel builds. Collection IDs are mutable slugs, and `lastUpdated` is a timestamp rather than an immutable Git revision. Collection memberships may change and do not bind their members to release revisions.

### Collection and Kernel metadata

The [JSON appendix](SZL_ESTATE_MANIFEST_COVERAGE_2026-10-07.json) retains collection slugs, reported update timestamps and public membership identifiers, plus Kernel revision SHAs and separately labeled Kernel-detail and model-card licensing metadata. Collection timestamps are mutable observations rather than Git revisions.

Supplemental raw metadata remains local-only at `/tmp/estate-metadata/collections.json`, `/tmp/estate-metadata/kernel-models.json`, and `/tmp/estate-metadata/kernels-endpoint.json`. Public metadata coverage now includes all observed collection and Kernel catalog pages. Private enumeration, signed build provenance, compiled binaries, hardware compatibility, legal rights and runtime correctness remain unqualified.

**Aggregate correction:** initial HF list responses exposed 71 license fields and 72 cards; individual detail responses enriched the final 119-asset inventory to **117 reported license fields and 118 cards**. The coverage summary above uses the final individual detail values.
