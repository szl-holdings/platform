# Trust Narrative — Final

**Owner:** Stephen Lutar · **Audience:** All buyer-facing communication (sales, marketing, exec sponsors)

This is the canonical buyer-facing trust narrative. Every other piece of customer-facing copy — pitch deck, one-pager, proposal, demo voiceover — must be compatible with what is below. If something contradicts this document, this document wins.

## The one-line version

**"Every recommendation has a receipt. Every action has a policy. Every override has a name."**

That is the entire trust story compressed to fourteen words. It is what we put in the pitch, what we put on the home page, and what we say first on every demo.

## The three-paragraph version

> Most AI tools today are agents in search of accountability. They generate recommendations, take actions, and leave behind a trail of dashboards instead of a trail of decisions. When something goes wrong — and in production, something always goes wrong — there is no record of *what was decided*, *by whom*, *against which policy*, *with what evidence*. The buyer is left with a vendor logo and a hope.
>
> We took a different starting point. We built the loop *first*, and the AI fits inside it. Every signal carries provenance. Every recommendation carries a receipt with scoring factors and alternatives considered. Every gated decision passes through a named approver with a measured SLA. Every action becomes an immutable audit row tied back to the originating signal. Override is not a backdoor — it is a first-class, attributed event recorded with the same rigor as the decision it overrides.
>
> The result is governance that is *operational*, not aspirational. It does not live in a policy document or a quarterly review — it lives in the runtime, on every screen, on every action. If you can see the recommendation, you can see the receipt. If you can see the receipt, you can see the policy. If you can see the policy, you can see who was accountable. That is what we mean by **Governed Decision Infrastructure**.

## The proof points (each tied to a screen)

1. **Provenance is loud, not legalese.** Every signal source is visible on the row, not buried in an inspector. *(Demo: `/operations/signals`)*
2. **Receipts are first-class.** Every recommendation opens to scoring factors, evidence rows, and alternatives considered. *(Demo: `/operations/decision-receipts`)*
3. **Policy gates are visible chains.** Approval is not a checkbox; it is a chain of named approvers with SLAs and override paths. *(Demo: `/operations/approvals-center`)*
4. **Actions are tiered, owned, and traceable.** The action queue carries the decision ID and signal ID forward; provenance never restarts. *(Demo: `/operations/action-queue`)*
5. **Audit is the system of record.** The audit log is immutable, queryable, and one click from any operator surface. *(Demo: `/operations/trust-audit`)*

## What we will not say

- We will not say "AI-powered." We will say "governed."
- We will not say "trust is built in." We will say "trust is the product."
- We will not say "explainable AI." We will say "recommendations with receipts."
- We will not say "human in the loop." We will say "policy-gated execution."
- We will not promise zero false positives. We will promise that every false positive is **named, dated, and overridable on record**.

## What we will lean into

- **The truth-pass rule:** *Every claim is enforced at a specific layer through a specific mechanism; bypass requires explicit, attributed override record.* This is the underlying contract we offer.
- **The compounding argument:** Every receipt makes the next decision more governable. Time is on our side; vendors who shipped agents first cannot retrofit this.
- **The boring-on-purpose framing:** Our trust story is not exciting. It is structural. Buyers who want excitement should buy a copilot. Buyers who want a system of record should buy us.

## How to use this document

- **Sales:** Open with the one-liner. Use the three-paragraph version on the second meeting. Cite the proof points only when in front of a screen.
- **Marketing:** The home page hero must be compatible with the one-liner. Long-form content must be compatible with the three-paragraph version.
- **Executive sponsors:** When asked "what makes you different from \[vendor X\]?", answer with the truth-pass rule. Then go to the receipt screen.

## Companion docs

- `productized-governance.md` — the structural argument.
- `trust-in-workflow.md` — how this shows up in the product.
- `no-commodity-ai-language.md` — the language discipline.
