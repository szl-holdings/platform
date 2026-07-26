# Public Repository Portfolio Strategy

> SZL Holdings GitHub Organization · April 2026
>
> **SUPERSEDED:** This April 2026 single-repository strategy is retained only
> as historical context. The current founder-gated Series A estate proposal is
> [`docs/CONSOLIDATION.md`](../CONSOLIDATION.md). That newer plan takes
> precedence and remains **NOT APPLIED** until its recorded founder decisions
> are explicitly approved.

---

## Current State

The organization currently has one public repository: `szl-holdings-platform`. This is intentional for the Series A phase — a single well-maintained repository is stronger than multiple fragmented or partially-maintained public repos.

---

## Strategy: Single Flagship Repository

### Rationale

| Consideration | Position |
|---------------|----------|
| Investor signal | One comprehensive, well-documented, green-CI repo signals focus and discipline |
| Maintenance burden | Multiple public repos require multiple CI/CD pipelines and documentation upkeep |
| Security surface | Fewer public repos = smaller public attack surface |
| Discovery | A single pinned repo on the org profile is clearer than a scattered portfolio |

**Recommendation:** Maintain a single public flagship repository during Series A. Do not create additional public repos unless there is a clear strategic reason.

---

## Org Profile (`.github/profile/README.md`)

The org profile at `https://github.com/szl-holdings` is the organization's "landing page" on GitHub. It should:

1. State the mission clearly (first 2 sentences)
2. Show the platform architecture at a glance
3. Include live CI/CodeQL badges
4. Link to the flagship repo and investor/evaluator resources
5. Have a clear CTA (contact email or website)

Current org profile quality: **Good** — review and refresh quarterly.

---

## Future Repository Portfolio Options

### Option A: Documentation Repository (Low value)
Create `szl-holdings/platform-docs` as a separate public docs site. **Not recommended** — documentation is already in the platform repo and is a trust signal.

### Option B: Open-Source a Library (Medium value)
If SZL Holdings creates a genuinely useful open-source library (e.g., a React component library or a typed API client), publishing it under an open-source license could drive:
- Community trust and visibility
- Engineering employer brand
- Inbound developer interest

**Timing:** Post-Series-A, after core platform is GA.

### Option C: Demo / Showcase Repository (Low value)
A minimal demo that shows the platform in action without the full codebase. **Not recommended** — the full repo already serves this purpose better.

---

## Pinned Repositories

On the org profile, pin:
1. `szl-holdings-platform` — with the description set correctly and a social preview image

When additional public repos exist, pin up to 6 using the org profile customization UI.

---

## Social Proof Strategy

See `docs/github/SOCIAL_PROOF_PLAN.md` for the full social proof roadmap.

---

*SZL Holdings GitHub Organization · April 2026*
