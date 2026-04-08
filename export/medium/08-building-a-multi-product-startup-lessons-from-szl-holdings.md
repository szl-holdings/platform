# Building a Multi-Product Startup: Lessons from SZL Holdings

The conventional wisdom says: build one product, nail product-market fit, scale it, then maybe — maybe — build a second product five years later with the proceeds.

I built sixteen in eighteen months.

This is not a humble brag. It is an architectural argument. The reason most companies cannot build multiple products simultaneously is not because it is inherently impossible — it is because their architecture does not support it.

## The Conventional Model Is Broken

The conventional single-product model makes an implicit assumption: that each product requires a fundamentally independent technology stack, team, and infrastructure. Under that assumption, building multiple products simultaneously is indeed irresponsible — it means spreading thin across independent efforts.

But what if the assumption is wrong?

What if the infrastructure for product A and product B is 80% identical? What if the authentication system, the database schema patterns, the design system, the deployment pipeline, the execution engine, and the observability layer are all shared?

Under that model, building product B after product A is not doubling the effort — it is adding 20% marginal effort on top of a foundation that already works.

## The SZL Architecture

SZL Holdings runs on a single pnpm monorepo. Every platform — Lyte, Vessels, Aegis, Terra, PRISM Counsel, Carlota Jo — shares:

- **One database** — 446 tables in a shared PostgreSQL schema
- **One authentication system** — Replit Auth with role-based access control
- **One design system** — Premium dark-mode components with platform-specific theming
- **One execution engine** — Alloy, which handles workflow orchestration, signal processing, and governed automation
- **One API layer** — 1,618 REST endpoints served from a single Express API server

When I build a new platform, I do not start from scratch. I start from a proven foundation and add the domain-specific layer on top.

## Five Lessons from Building Multi-Product

**1. Share the boring parts, differentiate the interesting parts.**

Authentication is not a differentiator. Database access patterns are not a differentiator. Deployment pipelines are not a differentiator. Build these once, share them everywhere, and spend your creative energy on the domain-specific intelligence that actually matters to your users.

**2. One schema is better than many schemas.**

The conventional microservices wisdom says each service should own its data. For a multi-product company, this creates data silos that require expensive integration to bridge. A single shared schema with clear domain boundaries gives you integration for free.

**3. The design system is a product.**

Most companies treat their design system as an internal tool. At SZL, the design system is a product — it is the visual foundation that makes every platform feel like part of the same family while allowing each platform to have its own identity. This matters because it means adding a new platform is a theming exercise, not a design exercise.

**4. The execution engine is the moat.**

Every platform in the SZL ecosystem runs on Alloy — our execution fabric that handles signal normalization, approval routing, and governed automation. Alloy is the connective tissue that makes the portfolio more than the sum of its parts. Signals from one platform can trigger workflows in another. Compliance patterns in one domain inform governance policies in another.

**5. Solo building is an advantage, not a limitation.**

One person holding the entire architecture in their head produces more coherent systems than a team that holds pieces of it. There is no communication overhead. There are no alignment meetings. There are no merge conflicts between teams with different architectural opinions.

This advantage has limits — it does not scale to hundreds of engineers. But for the first version of a multi-product company, it produces remarkably coherent architecture that would be nearly impossible to achieve with a team.

---

*Stephen Lutar is the Founder & CEO of SZL Holdings. [szlholdings.com](https://szlholdings.com)*
