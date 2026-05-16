# §06 — Warhacker event-day brief

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Event:** Defense Unicorns Warhacker
**Duration on stage / at booth:** 30 minutes
**One-pager — print and bring.**

---

## What SZL will demo, in order

### 1. (3 min) Install UDS and verify the install
Run the install command from the canonical install page
(`docs.defenseunicorns.com/cli/getting-started/installation/`, see
`_sources/uds-cli-install.html`). No SZL code in the loop yet — just
proves the operator workflow.

### 2. (5 min) The hand-off chip: `/code` → `/chat` on A11oy
Open A11oy locally. Issue a governed task via the `/code` CLI
(`tools/a11oy-code/`). The CLI writes a hash-chained line to
`~/.a11oy-code/proof.jsonl` for the request, and a second line for the
response. Then open `/chat` and ask A11oy to *replay the last `/code`
session* — it walks the same proof ledger and reproduces the answer
byte-identically, because the Λ-9 evaluator is deterministic against a
frozen registry (the 5× replay invariant, TH2). Andrew sees the proof
ledger growing in real time on screen.

### 3. (8 min) Sentra posture API — live read
Open Sentra (`artifacts/sentra`) in the preview. Hit
`GET /api/sentra/posture` from a terminal. Show the response: financial
exposure, open incidents, critical alerts, compromised assets, 7-day
trend, top CVE findings, and insurance posture (carrier, policy ID,
coverage limit, pass/fail clause). Then I open an incident in the UI;
the posture endpoint immediately recomputes financial exposure using
the payload-anchored exposure model (`base_unsegmented_ot_usd +
open_incidents * per_open_incident_usd + compromised * per_compromised_asset_usd`).

### 4. (6 min) Amaru replay-bound sync
Trigger a small Amaru sync against a public read-only source. Show the
append-only delta log on disk, then run the sync a second time — the
hash-chained delta-log entries match byte-for-byte, demonstrating
convergence. Then I tamper with one log line and re-run verify; Amaru
flags the chain break with the exact byte offset.

### 5. (5 min) Proof ledger Andrew can verify himself
Hand Andrew a USB stick (or a download link) with the proof ledger
captured during steps 2–4. He runs a 4-line verification script (also
on the stick) that walks the chain, checks the Ed25519 + ML-DSA-65
hybrid signatures, and prints `OK chain=clean entries=N signer=did:plat:szl-a11oy-prod`.
The signer DID matches the one in the proposed Fix A attestation
manifest.

### 6. (3 min) The two fixes — verbal walk-through
Hold up the two §05 PR descriptions printed on a single sheet. Confirm
target repos, days-to-PR, license posture. Ask: *if these land, do
they unblock anything you've been waiting on?*

## What SZL will NOT do at the event

- No claims about Defense Unicorns roadmap, customers, or contracts.
- No screenshots of UDS internals SZL has not licensed.
- No sales pitch. This is an engineering working session.

## Asks of Andrew
- 30 minutes of his focused attention for the run-through above.
- A thumbs-up (or a specific "fix this first") on the two §05 PRs.
- An introduction to the right `uds-cli` and `pepr` maintainers if the
  PRs are welcome.

## Hand-off artifacts on the day
- This proposal directory on a USB stick: `docs/proposals/defense-unicorns/`.
- The proof ledger captured during the demo.
- A single-page printed copy of §00 (executive summary).
