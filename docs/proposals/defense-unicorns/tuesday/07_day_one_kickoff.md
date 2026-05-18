# Day-1 kickoff — the moment Andrew says yes

**For:** SZL Holdings ↔ Defense Unicorns
**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Scope:** the first 48 hours after Andrew greenlights Option A.

The point of this doc is that we don't lose a day to logistics. When the reply
lands, we already know which boxes have to be ticked and who is on point for
each.

---

## What we need from Defense Unicorns (the four asks made concrete)

1. **Reference cluster handle.**
   - A cluster ID and `uds-cli` context name we can target.
   - Confirmation that `uds-cli bundle deploy` is permitted on it.
   - Owner / on-call contact for the cluster.

2. **Keycloak realm access.**
   - Realm name and admin client credentials (delivered via 1Password share or
     equivalent — never email).
   - Confirmation that we can register the `a11oy-uds` OIDC client + a
     service-account client for the agent identity registry.

3. **Mission App target for the Week-3 demo.**
   - One Mission App we are allowed to drive from a governed agent during the
     demo. Bland-but-real is best (e.g. a search-index refresh, a routine
     report-pull, a non-destructive workflow trigger).
   - The single endpoint we'll call and the expected payload shape.

4. **A 30-minute review window at the end of Week 3.**
   - Calendar hold for Andrew + one operator from his side.
   - Conference bridge + screen-share permissions confirmed.

A short ack email back to Andrew with these four bullets — and nothing else —
is the right first response.

---

## What we deliver in the first 48 hours

| Hour | Owner | Deliverable |
|------|-------|-------------|
| H+0  | Stephen | Acknowledge Andrew's email; restate the four asks above; propose a 20-min kickoff slot in the next 24h. |
| H+4  | Stephen | Internal kickoff: confirm Week-1 owners (cluster, identity, observability). |
| H+8  | Stephen | Push the `a11oy-uds-bundle/` Zarf bundle skeleton to a working branch. |
| H+24 | Stephen | Once cluster handle lands: `uds-cli bundle deploy` rehearsal against a local kind cluster with the same UDS profile. |
| H+30 | Stephen | First green CI run on the bundle build pipeline (`a11oy-uds-bundle-publish`). |
| H+36 | Stephen | Keycloak client config dry-run against a throwaway realm; SSO round-trip captured in a screen recording. |
| H+48 | Stephen | "Day-2 status" email to Andrew: one screenshot of the SSO round-trip on the reference cluster + the Week-1 burn-down. |

If any of the four asks slips past H+24, we do **not** silently absorb the
delay — the H+48 status email names it explicitly and re-baselines the
Week-3 demo date.

---

## What we have pre-staged so Day-1 is push-button

These are already in the repo and re-runnable today, so Day-1 is not about
*building* them, it's about *pointing them at the reference cluster*.

- **Zarf packages** (`docs/proposals/defense-unicorns/szl-holdings/`)
  - a11oy, sentra, amaru — each ships with `zarf.yaml` + component manifests.
- **UDS bundle** (`#5028`, merged)
  - Top-level `uds-bundle.yaml` referencing the three Zarf packages.
  - Attestations sidecar wired via `uds-cli #5026`.
- **Λ-9 admission module** (`pepr #5027`, merged)
  - Helm-installable Pepr capability. Default floors: 0.90 / 0.95 / 0.95.
- **OPA gateway pack**
  - `platform/agent-gateway/tests/gateway-opa-live.test.ts` — 3 tests, pinned
    OPA v0.69.0. Already passing locally.
- **The /uds live page** in the a11oy app
  - Public, no auth. The single link to share if Andrew wants to forward the
    package internally before the demo.

---

## Risks named on Day-1 (so they don't surface as surprises later)

- **License surface.** AGPL ↔ Apache managed by dual-licensed upstream PRs.
  If Defense Unicorns' counsel needs a license-clarity memo before deploy,
  we send it within H+24.
- **Doctrine drift.** Λ floors are payload-anchored; any change is a replay
  event and shows up in the proof ledger. The Week-3 demo includes a
  deliberate replay so this is visible, not a black box.
- **Scope creep.** Option C is explicitly gated on the Week-3 review going
  well. We do not start C work on Day-1.

---

## The shape of "yes"

A green light from Andrew probably arrives as one of three patterns:

1. **"Yes, do A."** → execute this doc verbatim.
2. **"Yes to A, but I want to talk about C scope first."** → execute this doc
   verbatim *and* propose a 45-min C-scoping conversation for Week 2.
3. **"Not yet — different shape."** → recalibration agenda in
   `09_followup_responses.md`.

In all three cases, the first reply is acknowledgement + the four asks.
