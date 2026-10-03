# Owner-source public-surface alignment — Proof Packet

- **workcell_id:** `WC-PLATFORM-OWNER-SURFACE-ALIGNMENT-20261003`
- **task_reference:** platform Truth Drift run `37104408373`; signed predecessor
  `95df4684fcaa20e77c8b3414dec2d00337e68341`
- **agent:** Codex BuildWarden repair lane
- **objective:** Advance the five residual public-surface contracts only where current immutable
  owner source and fresh live observations jointly establish the route, metadata, and evidence
  boundary, without changing an owning repository or relaxing the fail-closed verifier.
- **plan_summary:** Refresh the current A11oy and A11oy.net heads through read-only Git transport;
  inspect the exact handler, page, and manifest blobs; compare static-source bytes with live
  responses where possible; advance ownership and route contracts; add bounded HTML identity,
  canonical, content-type, redirect-target, and evidence-boundary validation; regenerate the
  manifest; and require a fresh full live sweep before signing.
- **patch_summary:** The stable residual IDs now describe their owner-backed states. A11oy.net
  chat and code are documentation gateways reached through approved slash-canonicalization
  redirects. The A11oy.net manifest retains exact lower-case owner identity. Killinchu is the
  reachable on-origin mixed page owned by A11oy, and the historical Command ID now records the
  reachable A11oy Command Center. The verifier still uses a closed target allowlist and manual
  redirects, and now also reads bounded UTF-8 HTML, requires `text/html`, and verifies exact
  titles, canonical URLs, and fail-closed boundary markers. Generated evidence and its summary
  were regenerated from the reviewed registry. During the final full sweep, Killinchu's exact
  source-binding receipt advanced; the strict body contract and negative fixture were forward-pinned
  to the new current-main/runtime/attestation tuple without relaxing any key or field assertion.
- **test_results:**
  - `pnpm typecheck` — exit `1` before script dispatch because `pnpm` is absent from this host
    path. The typecheck result is **UNAVAILABLE**; no host or repository policy was bypassed.
  - `git ls-remote https://github.com/szl-holdings/a11oy.git refs/heads/main` and the equivalent
    A11oy.net query — exit `0`; **MEASURED** owner heads are recorded below.
  - GitHub GraphQL commit-signature readback — exit `0`; **MEASURED**: the current A11oy,
    A11oy.net, and Killinchu revisions recorded below reported `VALID`, `isValid: true`, with signer
    `web-flow`.
  - immutable `git rev-parse <revision>:<path>` checks — exit `0`; **MEASURED**: the relevant
    A11oy handler and page blobs are byte-identical at current owner main and its deployed parent.
  - bounded manual-redirect live probes for the five advanced surfaces — exit `0`;
    **MEASURED**: the observed status, target, content type, title, canonical URL, and manifest
    identity matched the contracts. A11oy.net chat, code, and manifest live bytes matched their
    immutable source blobs exactly.
  - fresh A11oy product-origin and Hugging Face build-info reads plus the product-origin Series-A
    status read — exit `0`; **MEASURED**: both build-info responses reported `OBSERVED` deployed
    revision `5f1bf4deb34e799caa544eb55678b057b9c058f9`, and Series-A reported that revision with
    `state: OBSERVED`, `terminal: true`, no critical failures, `signature_status: SIGNED`, and
    `mount_verified: true`. Current signed main
    `c215cad6f91d8a6fa547034c5e8b40cfeb9dea20` is its direct successor; the contract-relevant
    handler and page blobs are identical at both revisions.
  - fresh Killinchu build-info read and `gh run view 37117261412 -R szl-holdings/killinchu` — exit
    `0`; **MEASURED**: runtime and signed current main both resolved to
    `dee16139923017abd8277a9bd8c143f8d7869630`, the exact receipt was GitHub-OIDC-attested, and the
    source-bound publication workflow completed successfully.
  - `gh run view 37117538618 -R szl-holdings/killinchu` — exit `0`; **MEASURED**: the current
    Public Source Fabric witness for `dee16139923017abd8277a9bd8c143f8d7869630` completed
    successfully. Failed older run `37117290325` was inspected with `--log-failed`; it correctly
    rejected stale `workflow_head=b2325a072f777abb550b193bcc88e26a6580c1a0` after current main
    advanced, so it is supersession evidence rather than a current-head failure.
  - `corepack pnpm exec tsx --test tools/truth/public-surfaces.test.ts` — exit `0`;
    **MEASURED**: the focused positive and negative contract cases passed, including rejected
    unapproved redirects, identity changes, canonical changes, missing evidence boundaries,
    wrong content types, malformed locations, oversized bodies, and manifest identity drift.
  - initial `corepack pnpm exec biome check tools/truth/public-surfaces.ts
    tools/truth/public-surfaces.test.ts` — exit `1`; the formatter required a local helper to use
    its single-line form. The formatting issue was corrected without changing behavior.
  - repeated scoped Biome check — exit `0`; two pre-existing warnings remain for literal GitHub
    expression fixtures, and no lint or formatting error remains in the scoped files.
  - `corepack pnpm exec tsx tools/truth/generate-public-surfaces.ts --check` — exit `0`;
    **MEASURED**: generated evidence matches the reviewed registry.
  - `corepack pnpm surfaces:check` — exit `0`; **MEASURED**: the complete configured live surface
    sweep passed with body validation enabled for the advanced routes.
  - `corepack pnpm surfaces:freshness` — exit `0`; **MEASURED**: the complete live sweep passed
    with the fresh-observation requirement enabled.
  - `TRUTH_ALLOWLIST_BASE_SHA=95df4684fcaa20e77c8b3414dec2d00337e68341 corepack pnpm
    claims:drift` — exit `0`; **MEASURED**: no claims drift was introduced across the stacked
    local successors. An exact-head run against the direct predecessor follows after commit.
  - `git diff --check` — exit `0`; **MEASURED**: no whitespace errors.
- **screenshot_refs:** `N/A` — this patch changes the platform registry and verifier, not the UI
  source, rendered layout, styling, or interaction of any owning product surface.
- **verification_notes:** A11oy.net live chat, code, and manifest byte hashes exactly matched the
  immutable blobs at `26266110d7006baf7918d7cfbdd81a266c4e6d9f`. A11oy product-origin and Hugging
  Face build-info report deployed revision `5f1bf4deb34e799caa544eb55678b057b9c058f9`, and the fresh
  Series-A status binds that revision to an OBSERVED terminal record with no critical failures,
  SIGNED status, and verified storage mount. Current signed main
  `c215cad6f91d8a6fa547034c5e8b40cfeb9dea20` is its direct successor and changes only the Atelier
  router and its test; the route assembly and both served page blobs are identical at current main
  and the deployed parent. This establishes the owner-backed route contract, not current-main
  deployment parity, byte-for-byte attestation of the whole deployment, or runtime authorization.
  The full live sweep is green locally; hosted exact-head CI, protected merge, and post-merge
  observation remain separate evidence states.
- **public_claim_check:** **MEASURED** — every availability and identity advance is backed by an
  immutable owner blob and a fresh live observation. Documentation handoffs remain labeled
  documentation, mixed pages retain their modeled and blocked boundaries, and reachability is
  not presented as authorization, aggregate health, deployment parity, or certification.
- **security_check:** **MEASURED** — the fixed HTTPS allowlist, credential/IP/port rejection,
  manual redirect handling, final-target comparison, bounded response read, UTF-8 requirement,
  timeout, retry bound, concurrency bound, API contracts, and metadata contracts remain active.
  The patch adds HTML content-type, title, canonical, and evidence-boundary rejection paths and
  adds no secret, token, credential, permission, writer, or deployment action. The independently
  running owner publication workflows were observed only through read-only endpoints and GitHub
  status reads.
- **known_gaps_update:** The five live mismatches from run `37104408373` are reconciled in the
  local platform registry and the complete local live/freshness checks pass. Fresh A11oy
  build-info and Series-A readbacks bind deployed source `5f1bf4d...`; current main advanced one
  route-neutral commit to `c215cad...`, so current-main deployment parity and byte-for-byte
  whole-runtime attestation remain **UNAVAILABLE**. A11oy publication run `37117027541` remained
  in progress after its exact-source deployment step succeeded, so neither runtime/source
  convergence nor the successful deploy job is presented as terminal workflow completion.
  Killinchu run `37117261412` completed successfully with its
  matched receipt, and current-source witness run `37117538618` completed successfully. The failed
  rerun of older witness `37117290325` correctly refused a superseded workflow head. GitHub REST
  identity and branch-protection reads were **UNAVAILABLE** due rate limiting. Git transport
  supplied the exact heads and GraphQL supplied commit-signature status, but no branch-protection
  claim is made. No owner repository was edited.
- **proof_level:** `4` — Full Proof for a public evidence-contract advance; screenshots are not
  applicable because no UI implementation changed.
- **recorded_at:** `2026-10-03T10:52:13Z`
- **recorded_by:** Codex BuildWarden repair lane

## Exact source and live binding

### Platform

- signed task predecessor: `95df4684fcaa20e77c8b3414dec2d00337e68341`
- first owner-surface successor and direct parent of this evidence refresh:
  `1015df64fac509515d2a1bfba81a3e75b5389ed8`
- protected root beneath the stacked successors: `f2f8df6f89056e9104587674ccec0855dd5b177a`
- fresh full-sweep observation: `2026-10-03T10:52:13Z`

### A11oy owner source

- current `main`: `c215cad6f91d8a6fa547034c5e8b40cfeb9dea20`
- GitHub commit signature: `VALID`; `isValid: true`; signer `web-flow`
- product-origin and Hugging Face build-info revision during verification:
  `5f1bf4deb34e799caa544eb55678b057b9c058f9`
- product-origin Series-A status: source revision
  `5f1bf4deb34e799caa544eb55678b057b9c058f9`; `state: OBSERVED`; `terminal: true`; no critical
  failures; `signature_status: SIGNED`; `storage.mount_verified: true`
- `a11oy_command_center.py` blob at current main and deployed parent:
  `966678c2e98be63ae8a0d05f35171ce3b85ad86c`
- `serve.py` blob at current main and deployed parent:
  `fbec31903ecb9571d350f48a171de8c7d496d13a`
- `pages/killinchu.html` blob at current main and deployed parent:
  `1d1a3cd0e811b9320f6ea479b891bc9a7c7df62d`
- `pages/command-center.html` blob at current main and deployed parent:
  `be43ed4fd491d8dd31849e5c800a6a5a5d7c40c6`
- current-main delta from deployed parent: `routers/atelier_grok.py` and
  `tests/test_atelier_grok_cpu_lab.py` only
- publication run `37117027541` for deployed parent `5f1bf4d...`: **IN_PROGRESS** after the
  exact-source deployment job succeeded; terminal workflow completion is not claimed

### A11oy.net owner source and live byte parity

- current `main`: `26266110d7006baf7918d7cfbdd81a266c4e6d9f`
- GitHub commit signature: `VALID`; `isValid: true`; signer `web-flow`
- live `/.well-known/szl-source.json` source revision:
  `26266110d7006baf7918d7cfbdd81a266c4e6d9f`
- `chat/index.html` live/source SHA-256:
  `3b638de6ad163f046c484d02a6d55fb45b7933c9781a88763a36a67da63f07c6`
- `code/index.html` live/source SHA-256:
  `eadeb34c1d5c942aa972cf0cf4720fc088dc6bcadc0b78b14d59443a8e2a353a`
- `manifest.webmanifest` live/source SHA-256:
  `ece8fdbb56069ccc67b785b977ae67efcd01234427c793732a1e526d6f174c6b`

### Killinchu owner source and release receipt

- current `main` and live build-info revision:
  `dee16139923017abd8277a9bd8c143f8d7869630`
- GitHub commit signature: `VALID`; `isValid: true`; signer `web-flow`
- release receipt state: `GITHUB_OIDC_ATTESTED`; `receipt_minted: true`
- deployment-manifest SHA-256:
  `050a62e33e51c297a72e64824e7f719843bf21285277008c730e1adf451c6ebe`
- GitHub attestation ID: `52400480`
- exact-source publication run `37117261412`: `SUCCESS`
- current-source witness run `37117538618`: `SUCCESS`
- superseded witness run `37117290325`: expected fail-closed rejection of immutable workflow head
  `b2325a072f777abb550b193bcc88e26a6580c1a0` after current main advanced

## Authority boundary

This packet records immutable owner-source inspection, bounded public reads, local verifier
execution, and a signed-source candidate. Publication of the candidate is a separate Git transport
event; this packet does not claim a pull request, hosted CI, merge, deployment by this platform
commit, byte-for-byte whole-runtime attestation, branch-protection status, or independent witness.
Those remain separate future evidence states.
