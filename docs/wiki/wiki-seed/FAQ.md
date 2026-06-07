# FAQ

Answers to common questions from technical reviewers, enterprise buyers, and investors. Questions are drawn from recurring themes in evaluation conversations.

---

## General

**Q: Is this an open-source project?**

No. This is a proprietary platform. The repository is a curated public mirror for evaluation, technical review, and transparency purposes. Contributions are by invitation only.

**Q: What is the difference between Lyte and Alloy?**

Lyte is the command surface — what operators see: signals, risk, ownership gaps, priority actions. Alloy is the execution fabric beneath it — what governs how actions are routed, approved, executed, and audited. Lyte needs Alloy. Domain packs (Aegis, Vessels, Terra) also run on Alloy.

**Q: Is the platform production-ready?**

The architecture, authentication, authorization, audit trail, and data layers are production-grade. The platform is at functional alpha stage — interfaces are complete, data pipelines are seeded, and core workflows are functional. It is not yet in active customer production deployment. See [[Deployment-Model]] and the [Product Readiness doc](../../docs/investor/product-readiness.md).

---

## Technical

**Q: Why TypeScript everywhere?**

Type safety eliminates a class of runtime errors that are particularly dangerous in a platform where AI agents route consequential actions. Strict TypeScript across the entire monorepo means API contracts are verifiable at build time, not just at runtime.

**Q: How does the AI layer work?**

AI agents (Compass, Sentinel, Helmsman) produce structured recommendations with source citations and confidence scores. Recommendations are routed through Alloy, which classifies them as auto-executable (policy-approved) or requiring human approval. The AI engine does not have direct access to execution primitives. See [[Architecture]] for the full model.

**Q: What is the database architecture?**

PostgreSQL 16 with Drizzle ORM. 120+ tables with domain-isolated schemas. Shared auth/user tables. Domain-specific operational tables. Immutable audit tables (append-only). All queries include org_id scoping for multi-tenancy.

**Q: What integrations are supported?**

The platform has 40+ connector integration stubs ready for activation. These include CRM, ERP, SIEM, communication, identity, and domain-specific data sources. Full integration list available in the enterprise evaluation package.

**Q: How is the monorepo organized?**

pnpm workspace with 16 artifacts (7 web, 7 mobile, 1 API server, 1 design system) and shared libraries in `lib/`. See [[Architecture]] for the full structure.

---

## Security & Trust

**Q: Can AI agents execute actions without human approval?**

Only within the bounds of explicitly defined policies. The default posture is human approval required for consequential actions. Auto-execute policies are configurable per org, per action type, and per role. The enforcement is at the Alloy workflow layer, not the UI. An AI agent cannot bypass this by any means available to it.

**Q: What does the audit trail capture?**

Every action, approval decision, AI recommendation, data access event, and authentication event generates an immutable audit record with actor identity, role, timestamp, and outcome. Audit records cannot be modified or deleted.

**Q: How is multi-tenant data isolation enforced?**

At the database query layer. Every query includes an org_id WHERE clause. This is enforced by the Drizzle ORM query builder patterns used across all domain services — not just by route-level authorization checks.

**Q: Is SOC 2 certification in progress?**

SOC 2 Type II is on the Phase 3 roadmap. The architecture is designed to comply — audit trail, access controls, and data handling meet SOC 2 requirements. Formal audit process requires production deployment and revenue activation first.

---

## Commercial

**Q: What is the pricing model?**

Not published at this stage. The platform will use a SaaS subscription model with enterprise licensing for Aegis. Contact [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com) for enterprise pricing discussions.

**Q: What does a design partner engagement look like?**

Design partner agreements provide early access to platform capabilities in exchange for structured feedback, use-case validation, and reference potential. Engagements are customized. Contact [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com).

**Q: Is investment available?**

SZL Holdings is at pre-revenue, pre-funding stage. The founder is open to investor conversations for the right partner. See [[Investor-Overview]] and contact [stephen@szlholdings.com](mailto:stephen@szlholdings.com).

---

## Further Reference

- [[Platform-Overview]]
- [[Architecture]]
- [[Trust-Center]]
- [[Security-Posture]]
