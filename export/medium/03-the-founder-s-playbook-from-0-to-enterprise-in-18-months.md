# The Founder's Playbook: From 0 to Enterprise in 18 Months

In early 2023, SZL Holdings was a name on a piece of paper. Today it is a portfolio of 16 live applications across five industries, running on one TypeScript monorepo with 446 database tables and 1,618 API endpoints.

No outside engineers. No venture capital. No vaporware.

This is not a story about hustle culture or grinding harder than the next person. It is a story about architecture — and what happens when you get the foundation right before you start building on top of it.

## The First 90 Days: Build the Backbone

Most founders start with their product. I started with the backbone.

Before writing a single line of product code, I spent three months building the infrastructure that would support everything: a shared database schema, a common authentication layer, a design system, a deployment pipeline, and an execution engine (Alloy) that would handle workflow orchestration across every future platform.

This felt wrong at the time. Three months of infrastructure with nothing to show a customer. No landing page. No demo. No traction metrics to tweet about.

It was the best investment I have made.

## Months 4–8: The First Three Platforms

With the backbone in place, the first platform — Lyte, our business observability system — came together in six weeks instead of six months. The infrastructure was already there. The design system was already there. The authentication was already there. I was writing product code from day one, not plumbing.

Vessels (maritime intelligence) followed two months later. Aegis (unified defense) followed two months after that.

The pattern was clear: each platform took roughly 40% less time than the one before it. Not because I was cutting corners, but because each platform contributed reusable patterns back to the shared architecture. Signal normalization built for Lyte was immediately useful in Vessels. Compliance monitoring built for Vessels was immediately useful in Aegis.

## Months 9–14: Compounding Effects

By month nine, the compounding effects were undeniable. Adding a new platform was no longer a greenfield project — it was a configuration exercise on top of proven infrastructure.

Terra (real estate intelligence) took five weeks. PRISM Counsel (legal matter command) took four weeks. Mobile companion apps for each platform took two to three weeks each.

The insight that most people miss about single-founder companies is that the constraint is not talent or time — it is context switching. When one person holds the entire architecture in their head, there is no communication overhead. There are no merge conflicts between teams. There are no alignment meetings. There is just building.

## Months 15–18: The Full Ecosystem

By month fifteen, the portfolio had reached critical mass. Sixteen applications. A shared database with 446 tables representing every operational domain. An API surface of 1,618 endpoints that could serve any client — web, mobile, or machine.

The last three months were about polish: premium executive views, carousel content for social distribution, a social media distribution OS to manage content across platforms, and the commercial packaging that would present all of this to the market.

## What I Would Do Differently

Very little. The decision to build infrastructure first was vindicated repeatedly. The decision to use a single monorepo was vindicated repeatedly. The decision to share one database schema was vindicated repeatedly.

The one thing I would change: I would have started writing publicly sooner. The products speak for themselves, but the world does not know they exist until you tell them.

## The Takeaway

If you are a technical founder considering a multi-product approach, the playbook is simple:

1. Build the backbone first. It will feel unproductive. It is the most productive thing you will do.
2. Share everything that can be shared. Schema. Auth. Design. Deployment.
3. Let each product compound the architecture. If a new product does not make the existing ones better, it is the wrong product.
4. Do not hire until the architecture forces you to. One mind holding the whole system produces better architecture than ten minds holding pieces of it.

The numbers are the proof: 16 applications, 446 tables, 1,618 endpoints. Built by one person in eighteen months. Not because of genius — because of architecture.

---

*Stephen Lutar is the Founder & CEO of SZL Holdings. [szlholdings.com](https://szlholdings.com)*
