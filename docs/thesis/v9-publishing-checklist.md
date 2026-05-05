# Ouroboros Thesis v9 — Publishing Checklist

**Operator-driven.** Nothing in this list runs automatically. Each step is a deliberate human action by Stephen Lutar (or a delegate with explicit authorization).

---

## Pre-flight

- [ ] **Read the canonical end-to-end.** `docs/thesis/v9-canonical.md`. Confirm every formula box matches the code in `packages/ouroboros-integrations/src/lutar-formulas.ts`.
- [ ] **Run the live API verification block** (canonical §8): `pnpm --filter @workspace/api-server dev`, then exercise each endpoint listed in §9. Capture output JSON for the proof bundle.
- [ ] **Run the formula contract suite**: `pnpm --filter @workspace/ouroboros-integrations test`. All green.
- [ ] **Run the guardrails suite**: `pnpm --filter @workspace/ouroboros-guardrails test`. All green.
- [ ] **Confirm gap report is at zero open rows**: `docs/audits/formula-thesis-gaps.md` §4.
- [ ] **Sanity-check the A11oy `/thesis` surface in the preview pane.** Anchors resolve to formula endpoints. Mobile breakpoint OK.

## Repository

- [ ] **Tag the platform monorepo**: `v9.0.0-unified-operational`. Annotated tag with v9 release notes (copy from `v9-canonical.md` §11 file index + version-history table).
- [ ] **Mirror the canonical** into `szl-holdings/ouroboros-thesis` GitHub repo. Use the GitHub integration; preserve the same file path layout (`docs/thesis/`).
- [ ] **Update `szl-holdings/ouroboros-thesis` README** to point at v9 as current canonical.
- [ ] **Cut a GitHub release** on `szl-holdings/ouroboros-thesis` named `v9.0.0 — UNIFIED-OPERATIONAL` with the one-pager as release body.
- [ ] **Confirm pristine pass**: secret scanning, push protection, dependabot alerts and security updates, and branch protection still ON across all org repos. (Cross-checks the queued "GitHub org pristine pass — Fortune 500 / Series A polish" task.)

## DOI / Zenodo

- [ ] **Mint a Zenodo DOI** for v9 from the GitHub release. Use the SZL Holdings ORCID (0009-0001-0110-4173) as the author identifier.
- [ ] **Backlink the Zenodo record** from `docs/thesis/README.md` and from `replit.md` Platform Status section once minted.
- [ ] **Update the prior canonicals' headers** with a "superseded by v9 (DOI ...)" note, but leave their text intact for provenance.

## A11oy surfaces

- [ ] **Verify the `/thesis` deep-links** point at the live `/api/ouroboros/lutar/v{N}` endpoints in production.
- [ ] **Add a thesis tile to the A11oy hub landing page** (single small card, gold `#c9b787` accent, links `/thesis`).
- [ ] **Confirm the codex receipts surface** (`/codex-receipts`) includes the new edges.

## Long-form / derivatives

- [ ] **Review the essay** (`docs/thesis/v9-essay.md`). Optional one-pass copy edit.
- [ ] **Review the one-pager** (`docs/thesis/v9-onepager.md`). Print-ready.
- [ ] **Review the social cards** (`docs/thesis/v9-social-cards.md`). Pick which platforms to publish on.

## External publication (operator's call, in order)

The order below is a recommendation, not a requirement. Skip any platform freely.

- [ ] **arXiv preprint** under physics.gen-ph or cs.AI (cross-list). Use canonical as paper body; gap report and essay as supplementary materials.
- [ ] **Zenodo deposit** (if not already minted via GitHub release path above).
- [ ] **LinkedIn long-form post** (copy from `v9-social-cards.md`).
- [ ] **X thread** (8 posts ready in `v9-social-cards.md`).
- [ ] **Bluesky single post**.
- [ ] **Mastodon federated post**.
- [ ] **Internal Slack notification** (`v9-social-cards.md` final block).

## Post-publication

- [ ] **Watch the codex traversal endpoint** for inbound external traffic. Treat as the first signal of external readership.
- [ ] **Open a tracking issue** in `szl-holdings/ouroboros-thesis` for any reader-flagged corrections. Acknowledge within 72h.
- [ ] **Open the v10 changelog stub** at `docs/thesis/v10-canonical.md` ONLY when a real new term is warranted (HUFT-class physical insight or new prisca lineage with comparable empirical weight). Do not pre-cut a v10.
- [ ] **Archive this checklist** under `docs/thesis/published/v9-checklist-completed.md` once everything above is checked, with the publication date and the Zenodo DOI.

---

*Operator: Stephen P. Lutar — SZL Holdings — ORCID 0009-0001-0110-4173*
