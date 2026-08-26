# PR #668 Series A product view — proof packet

- `workcell_id`: `P0-SERIES-A-PRODUCT-WIRING-20260811`
- `agent`: Codex
- `objective`: Publish the truth-qualified `/a11oy/start` product view on the
  current protected-main base, repair screenshot provenance so hosted identity
  fails closed, and record fresh exact-source visual evidence without carrying
  predecessor workflow, proof, truth-count, or screenshot artifacts.
- `plan_summary`: Reconstruct the bounded product delta from protected main;
  validate its route, types, contracts, and build; repair capture provenance in
  a forward-only commit; capture the real built application from that exact
  clean source at five viewports; inspect every PNG; then promote only the fresh
  PNGs, raw metadata, catalog record, and this packet in one evidence-only
  commit. Recapture the resulting PR head and record byte equivalence in the PR
  discussion without changing source again.
- `patch_summary`:
  - the product commit changes the intended 15 product, route, type, test, and
    capture-script paths from protected base
    `7383a30fffeb44c7e8a3fa2c27e176ee450607fd`;
  - repair commit `11e6d637ab6f15934a63458ab146c75e8813aaec`,
    tree `1b35c727a64c5f19b2d52d9774afbe1c8eec3efa`, changes only
    `artifacts/a11oy/test/series-a-contract.test.mjs` and
    `scripts/qa/capture-series-a-proof.mjs`;
  - the repair requires validated GitHub runtime metadata for hosted authority,
    labels local captures `LOCAL_NON_AUTHORITATIVE`, and verifies the checkout
    SHA, tree, branch, and tracked cleanliness before and after capture;
  - this evidence-only delta adds five fresh PNGs and their raw metadata, appends
    the complete catalog identity, and adds this packet. It does not add a
    workflow, predecessor image, task file, truth/count record, known-gap edit,
    application source change, or public-copy change.
- `test_results`:
  - repository-pinned pnpm `10.26.1` frozen install: PASS; lockfile unchanged;
  - `node --test artifacts/a11oy/test/series-a-contract.test.mjs`: PASS, 10/10;
  - A11oy runtime Vitest suite: PASS, 37/37;
  - A11oy runtime native Node suite: PASS, 47/47;
  - A11oy and A11oy runtime TypeScript checks: PASS;
  - Biome and Oxlint on the two provenance-repair paths: PASS;
  - capture-script Node syntax and Git whitespace checks: PASS;
  - A11oy production build: PASS, 3,343 modules transformed and a
    `SeriesAView` chunk emitted;
  - local exact-source capture: PASS, 5/5 viewports; HTTP 200, six tabs
    exercised, scroll origin restored, no horizontal overflow, no console or
    page errors, and no undeclared API requests;
  - same-source repeat capture: PASS; all five PNGs are byte-identical to the
    promoted files;
  - original-resolution visual inspection: PASS at 320, 390, 768, 1366, and
    1728 CSS-pixel widths; no visual defect observed.
- `screenshot_refs`:
  - [`a11oy-series-a-320-2026-08-26.png`](../docs/assets/screenshots/current/a11oy-series-a-320-2026-08-26.png) — `/a11oy/start`, `320x900`;
  - [`a11oy-series-a-390-2026-08-26.png`](../docs/assets/screenshots/current/a11oy-series-a-390-2026-08-26.png) — `/a11oy/start`, `390x900`;
  - [`a11oy-series-a-768-2026-08-26.png`](../docs/assets/screenshots/current/a11oy-series-a-768-2026-08-26.png) — `/a11oy/start`, `768x1024`;
  - [`a11oy-series-a-1366-2026-08-26.png`](../docs/assets/screenshots/current/a11oy-series-a-1366-2026-08-26.png) — `/a11oy/start`, `1366x900`;
  - [`a11oy-series-a-1728-2026-08-26.png`](../docs/assets/screenshots/current/a11oy-series-a-1728-2026-08-26.png) — `/a11oy/start`, `1728x1000`;
  - [raw capture metadata](../docs/assets/screenshots/current/a11oy-series-a-capture-metadata-2026-08-26.json.txt) and [catalog entries](screenshot-catalog.md#pr-668-series-a-product-view-evidence--2026-08-26).
- `verification_notes`: The captures were produced at source commit
  `11e6d637ab6f15934a63458ab146c75e8813aaec` and tree
  `1b35c727a64c5f19b2d52d9774afbe1c8eec3efa` from a tracked-clean checkout.
  Metadata records Linux x64, Node `v24.19.0`, Chrome for Testing
  `148.0.7778.96`, route `/a11oy/start`, exact viewport and document sizes,
  timestamps, assertions, and PNG digests. The exact browser archive was
  118,673,688 bytes with SHA-256
  `88817c574c1838a39f88fda0bbd043b4481fd385fb10e92c323e230844d636ce`;
  archive integrity and runtime version were verified. Vite preview could not
  enumerate sandbox network interfaces (`uv_interface_addresses`), so the
  already-built production bytes were served on `127.0.0.1` by a loopback-only
  Python `ThreadingHTTPServer` adapter that mapped the configured `/a11oy/`
  base and SPA fallback. The capture remains explicitly local and
  non-authoritative for hosted gates.
- `public_claim_check`: PASS. The evidence records only source-observed
  prototype/demo/unavailable states. It does not claim a deployment, customer,
  revenue, compliance status, production mutation, live connector, or external
  service parity.
- `security_check`: PASS. No token, credential, `.env` value, workflow, or
  executable source is added by the evidence delta. The metadata contains no
  GitHub run identity because local mode is fail-closed and non-authoritative.
- `known_gaps_update`: None. The evidence delta introduces or closes no product
  gap; hosted checks and fresh review are completion gates rather than a
  product-state change.
- `proof_level`: 4 — full proof for a public-facing route change. This is not a
  release claim or Level 5 release packet.
- `identity_boundary`: The evidence commit cannot embed its own commit SHA
  without self-reference. Its parent is the exact captured source. After this
  packet is committed, the exact GitHub evidence head must be reconstructed and
  recaptured. All five PNGs must be byte-identical to the committed files; that
  final-head receipt belongs in PR discussion, with no later source mutation.
- `recorded_at`: `2026-08-26T16:05:52Z`
- `recorded_by`: Codex
