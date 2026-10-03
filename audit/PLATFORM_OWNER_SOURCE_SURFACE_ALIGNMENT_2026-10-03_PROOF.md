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
  were regenerated from the reviewed registry.
- **test_results:**
  - `pnpm typecheck` — exit `1` before script dispatch because `pnpm` is absent from this host
    path. The typecheck result is **UNAVAILABLE**; no host or repository policy was bypassed.
  - `git ls-remote https://github.com/szl-holdings/a11oy.git refs/heads/main` and the equivalent
    A11oy.net query — exit `0`; **MEASURED** owner heads are recorded below.
  - GitHub GraphQL commit-signature readback — exit `0`; **MEASURED**: both current owner heads
    reported `VALID`, `isValid: true`, with signer `web-flow`.
  - immutable `git rev-parse <revision>:<path>` checks — exit `0`; **MEASURED**: the relevant
    A11oy handler and page blobs are identical between the live build revision and current main.
  - bounded manual-redirect live probes for the five advanced surfaces — exit `0`;
    **MEASURED**: the observed status, target, content type, title, canonical URL, and manifest
    identity matched the contracts. A11oy.net chat, code, and manifest live bytes matched their
    immutable source blobs exactly.
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
  - `TRUTH_ALLOWLIST_BASE_SHA=f2f8df6f89056e9104587674ccec0855dd5b177a corepack pnpm
    claims:drift` — exit `0`; **MEASURED**: no claims drift was introduced across the stacked
    local successors. An exact-head run against the direct predecessor follows after commit.
  - `git diff --check` — exit `0`; **MEASURED**: no whitespace errors.
- **screenshot_refs:** `N/A` — this patch changes the platform registry and verifier, not the UI
  source, rendered layout, styling, or interaction of any owning product surface.
- **verification_notes:** A11oy.net live chat, code, and manifest byte hashes exactly matched the
  immutable blobs at `16c28a9cbf98e9f7037027a7448cb4e69cb51b0d`. A11oy live build-info reported
  `bd4befe8e0511488a52fba99f50343964964b5eb` while current main was
  `263e5a3cbfda3dbb4d3c3dc8820968cecbed3d3e`; the route assembly and both served page blobs are
  identical at those revisions. The platform therefore verifies the owner-backed route contract
  without claiming whole-deployment source parity. The full live sweep is green locally; hosted
  exact-head CI, protected merge, and post-merge observation remain separate evidence states.
- **public_claim_check:** **MEASURED** — every availability and identity advance is backed by an
  immutable owner blob and a fresh live observation. Documentation handoffs remain labeled
  documentation, mixed pages retain their modeled and blocked boundaries, and reachability is
  not presented as authorization, aggregate health, deployment parity, or certification.
- **security_check:** **MEASURED** — the fixed HTTPS allowlist, credential/IP/port rejection,
  manual redirect handling, final-target comparison, bounded response read, UTF-8 requirement,
  timeout, retry bound, concurrency bound, API contracts, and metadata contracts remain active.
  The patch adds HTML content-type, title, canonical, and evidence-boundary rejection paths and
  adds no secret, token, credential, permission, writer, or deployment action.
- **known_gaps_update:** The five live mismatches from run `37104408373` are reconciled in the
  local platform registry and the complete local live/freshness checks pass. A11oy main is ahead
  of the observed deployed build, although the relevant route blobs are identical; whole-runtime
  source parity remains **UNAVAILABLE**. GitHub REST identity and branch-protection reads were
  **UNAVAILABLE** due rate limiting. Git transport supplied the exact heads and GraphQL supplied
  commit-signature status, but no branch-protection claim is made. No owner repository was edited.
- **proof_level:** `4` — Full Proof for a public evidence-contract advance; screenshots are not
  applicable because no UI implementation changed.
- **recorded_at:** `2026-10-03T10:31:04Z`
- **recorded_by:** Codex BuildWarden repair lane

## Exact source and live binding

### Platform

- direct signed predecessor: `95df4684fcaa20e77c8b3414dec2d00337e68341`
- protected root beneath the stacked successors: `f2f8df6f89056e9104587674ccec0855dd5b177a`
- fresh full-sweep observation: `2026-10-03T10:27:28Z`

### A11oy owner source

- current `main`: `263e5a3cbfda3dbb4d3c3dc8820968cecbed3d3e`
- GitHub commit signature: `VALID`; `isValid: true`; signer `web-flow`
- live build-info revision during verification: `bd4befe8e0511488a52fba99f50343964964b5eb`
- `a11oy_command_center.py` blob at both revisions:
  `966678c2e98be63ae8a0d05f35171ce3b85ad86c`
- `serve.py` blob at both revisions: `fbec31903ecb9571d350f48a171de8c7d496d13a`
- `pages/killinchu.html` blob at both revisions:
  `1d1a3cd0e811b9320f6ea479b891bc9a7c7df62d`
- `pages/command-center.html` blob at both revisions:
  `be43ed4fd491d8dd31849e5c800a6a5a5d7c40c6`

### A11oy.net owner source and live byte parity

- current `main`: `16c28a9cbf98e9f7037027a7448cb4e69cb51b0d`
- GitHub commit signature: `VALID`; `isValid: true`; signer `web-flow`
- `chat/index.html` live/source SHA-256:
  `3b638de6ad163f046c484d02a6d55fb45b7933c9781a88763a36a67da63f07c6`
- `code/index.html` live/source SHA-256:
  `eadeb34c1d5c942aa972cf0cf4720fc088dc6bcadc0b78b14d59443a8e2a353a`
- `manifest.webmanifest` live/source SHA-256:
  `ece8fdbb56069ccc67b785b977ae67efcd01234427c793732a1e526d6f174c6b`

## Authority boundary

This packet records immutable owner-source inspection, bounded public reads, local verifier
execution, and a signed-source candidate only. It does not claim a push, pull request, hosted CI,
merge, deployment by this platform commit, whole-runtime source parity, branch-protection status,
or independent witness. Those remain separate future evidence states.
