# Cyber evidence workcell — 2026-10-02

Source: `szl-holdings/platform` `f2f8df6f89056e9104587674ccec0855dd5b177a`.
Request: execute the cybersecurity and cross-lane plan in the linked Codex Cloud task.

## Plan before patch

1. Repair `platform/agents/readiness/readiness-security/executor.py` so a missing
   repo inventory, failed GitHub read, absent current-head run, or unverified
   release signature cannot produce a GREEN security verdict. Preserve the
   read-only and signed-receipt boundaries. Add regression tests and update its
   README with the exact output contract.
2. Correct the A11oy cyber pages in `artifacts/a11oy/src/pages/` that label
   seeded security checks, agents, or certifications as LIVE or attested. Keep
   source-backed examples identifiable as DEMO and show missing runtime evidence
   as UNAVAILABLE. Do not assert an external effect or certification.
3. Add a cross-lane evidence register in `docs/operations/` for the six Series-A
   buyer lanes, with current source state, proof boundaries, owners and
   measurable gates. Include a responsibility map, 30/60/90-day sequence, and
   KPI definitions that do not invent observations.
4. Block tool-mesh security operations that currently fabricate a completed
   scan, delivered escalation, or passing compliance score. Preserve the
   separate pending-approval containment path and calendar listing.

Success criteria: local regression tests cover missing/failed inputs and
current-head binding; no cyber page shows synthetic operational counts as live;
the register distinguishes source, CI, merge, publication, deployment, and
outside witness. `pnpm typecheck` baseline is unavailable in the existing
checkout because `node_modules` is absent and `turbo` cannot be found. Any
subsequent verification will record its actual result.

## Proof Packet and disposition

| Field | Record |
|---|---|
| `workcell_id` | `CYBER-EVIDENCE-2026-10-02` |
| `agent` | Codex, with scoped implementation and read-only review agents |
| `objective` | Execute the linked cybersecurity and cross-lane request in the canonical Platform source, correcting false operational claims and giving each lane an evidence-gated execution path. |
| `plan_summary` | Repair security readiness, qualify the three A11oy cyber pages, block unsupported tool-mesh effects, then create the six-lane register and proof. |
| `recorded_at` | 2026-10-02T22:32:07Z |
| `recorded_by` | Codex |
| `proof_level` | Level 4, **local source presentation**. Hosted exact-head CI, protected merge, provider publication, deployment, and outside witness are not established by this packet. |

### Patch summary

- `platform/agents/readiness/readiness-security/` now reads the public repo
  inventory rather than falling back to a static list. Workflow files and
  successful runs must match the observed default-branch head and a 30-day
  time window. Missing, stale, malformed, rate-limited, or unverified inputs
  produce `HOLD`; observed missing or failed controls produce `RED`. A release
  `.sig`/`.crt` asset pair remains `UNVERIFIED` without cryptographic cosign
  validation. GitHub Actions rejects an unsigned emitted receipt.
- The A11oy `cyber-resilience`, `security-agents`, and `security-compliance`
  pages show `DEMO`, `UNAVAILABLE`, or `UNVERIFIED` instead of synthetic live
  counts, fabricated agent activity/proof, or asserted certifications. Their
  phone layouts retain readable status and evidence text. The compliance page
  no longer links to older routes with contradictory operational claims.
- `packages/tool-mesh/src/tools/security-tools.ts` disables unsupported threat
  scan, alert escalation, compliance assessment, and vulnerability report
  manifests. Direct handler calls validate input, then reject with
  `SECURITY_OPERATION_UNAVAILABLE`
  before database access. No scan completion, alert delivery, or compliance
  pass rate is produced. Active scan and escalation are approval-required if
  a future connector enables them. Incident containment's pending gate and
  read-only calendar listing are unchanged.
- The [six-lane execution register](CROSS_LANE_EVIDENCE_REGISTER_20261002.md)
  records source state, owner, first operational witness, 30/60/90-day gates,
  and KPI definitions without invented measurements. The read-only
  `scripts/qa/verify-cross-lane-source.mjs` checks the exact committed
  six-lane source digest and emits `UNKNOWN` for unmeasured external gates.

Signed local source commits before this proof successor: `cb363691a71f877e294f6e3a50f8a1f18764f300`
(truth-qualified UI), `5c6baf13d3b669b1eb83e1300b428def54b66825`
(security readiness), `8b559430e66ba1f2f8fec71fbf8d0fed3db31ac0`
(phone presentation), `bfcb03a4846535dc39fdb361ba3e9ac8477a8131` (tool-mesh block), and
`02b63169036301558f2d4bb91e296bc0a57a6ee1` (repeatable capture command).
The capture source is the last of these, and A11oy source bytes are unchanged
between the phone-layout and capture commits.

### Tests and verification

| Command/check | Result and limit |
|---|---|
| `corepack pnpm --filter @workspace/a11oy typecheck` | Exit 0 after the UI edits. |
| `corepack pnpm --filter @workspace/a11oy test:series-a` | Exit 0, 24/24 tests. These test the source scenario contract, not production behavior. |
| `corepack pnpm --filter @workspace/a11oy build` | Exit 0 after the phone-layout fix, 3,344 modules transformed. |
| `python -B -m unittest discover -s platform/agents/readiness/readiness-security -p 'test_*.py' -q` | Exit 0, 17/17 focused tests, including stale/numeric doctrine, wrong-head, rate-limit, unsigned receipt, and 30-day run age. |
| `python -B -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py' -q` | Exit 0, 68/68 shared library tests. |
| From `packages/tool-mesh`: `node node_modules/vitest/vitest.mjs run src/tool-mesh.test.ts --maxWorkers=1` | Exit 0, 35/35 before and 40/40 after the patch. Gateway rejects all three unsupported operations and direct handlers throw. |
| From `packages/tool-mesh`: `node node_modules/vitest/vitest.mjs run --maxWorkers=1` | Exit 0, 112/112 across five files after the first patch. A later successor that blocks vulnerability reports passed 115/115. |
| `node node_modules/@biomejs/biome/bin/biome check packages/tool-mesh/src/tools/security-tools.ts packages/tool-mesh/src/tool-mesh.test.ts` | The first run found formatting/import order issues and exited 1; after those fixes it exited 0 with seven pre-existing non-null assertion warnings. |
| `node node_modules/typescript/bin/tsc -p packages/tool-mesh/tsconfig.json --noEmit` | **Unavailable as a clean pass:** both before and after the patch exited 1 with the same eight `TS6305` missing referenced declaration errors. A full dependency build remains an independent gate. |
| `node --check scripts/qa/capture-cyber-evidence-20261002.mjs` | Exit 0. |
| `node --test scripts/qa/verify-cross-lane-source.test.mjs` | Exit 0, 4/4 source identity and fail-closed tests. `node scripts/qa/verify-cross-lane-source.mjs` emitted `VERIFIED_LOCAL_SOURCE`; no runtime readiness was asserted. |
| `SOURCE_REVISION=02b63169036301558f2d4bb91e296bc0a57a6ee1` capture command | Exit 0: 15/15 route and viewport states returned HTTP 200 with expected heading/text, no page or console errors, and no horizontal overflow. |
| Playwright phone selector click on `/a11oy/security-agents` | Exit 0: selecting Detection Engineering Agent changed the button's `aria-pressed` state and rendered its modeled detail. |
| `git diff --check` and screenshot SHA-256 read-back | Exit 0 and 15/15 digests match the sidecar. |
| `node node_modules/@commitlint/cli/cli.js --from f2f8df6f89056e9104587674ccec0855dd5b177a --to 02b63169036301558f2d4bb91e296bc0a57a6ee1 --verbose` | Exit 0: all five source and capture commits passed with zero warnings. |

The pre-existing checkout lacked `node_modules`, so the baseline root
`pnpm typecheck` could not start. An offline filtered install missed a cached
tarball; the subsequent online filtered install succeeded with the frozen
lockfile and ignored lifecycle scripts. The scoped A11oy checks above ran
after hydration. No entire-workspace typecheck, full security scan, or live
provider read-back is claimed.

### Screenshots and source presentation

The 15 images in `docs/assets/screenshots/current/` cover each changed cyber
route at phone (390×844), portrait (768×1024), desktop (1440×1100), Full HD
(1920×1080), and ultrawide (2560×1440). Exact filenames, route, viewport,
capture time, source revision, command, and SHA-256 are in the
[screenshot catalog](../../audit/screenshot-catalog.md) and
[machine sidecar](../../audit/cyber-evidence-screenshots-2026-10-02.json).
The capture ran the built application locally from the declared source. It
shows page presentation, not a deployed security service or live control.

An initial phone capture exposed wrapped `DEMO` badges and an unreadable
framework table. Those images were rejected and replaced after the responsive
fix; only the refreshed, digest-bound images are in the catalog.

### Public claim, security, and known-gap checks

The three changed pages no longer present seeded measures as live results,
and the tool-mesh paths cannot report scan completion, alert delivery, or a
passing compliance score without a real adapter. The source review found
other security routes with older operational language; this workcell does not
promote them as evidence. The changed-file review introduced no credentials,
secrets, or `.env` values; hosted secret scanning remains a separate check.

The [known gaps register](known-gaps.md) records the remaining cosign
verification, connector/tenant binding, stale neighboring copy, package
TypeScript declarations, hosted CI, deployment, and outside-witness gates.
`packages/tool-mesh` vulnerability-report is also blocked until a source can
actually honor tenant, asset, and CVE filters. The hosted check run at
`df984acc8b6fe00dfbc993a81a78d175d2b2b3af` failed its dependency and
Grype gates on high-severity `node-forge`
[`GHSA-86w9-cpqp-85rv`](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
(no patched version published), and its unit suite and Runtime Audit on a pre-existing
Atelier cross-process filesystem race. This read-back is a held gate, not a
security or runtime pass. No external SIEM, EDR, customer asset, incident,
operator assignment, approval, or containment action was observed or executed.
