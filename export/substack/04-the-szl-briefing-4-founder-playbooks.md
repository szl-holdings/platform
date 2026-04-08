# The SZL Briefing #4 — Founder Playbooks

This week something different: operating notes from building SZL Holdings. What I have learned, what I would do differently, and the architectural decisions that made everything else possible.

---

## Founder Operating Notes: Building 16 Applications as One Person

The most common reaction when people learn I built 16 applications solo: "That is impossible."

The second most common reaction: "How?"

This newsletter answers the second question.

### The Architecture Decision

The single most important decision I made was to build infrastructure before products. Before writing a line of product code, I spent three months building:

- A shared PostgreSQL schema with domain-prefixed tables
- A unified authentication system with role-based access control
- A design system with platform-specific theming
- An execution engine (Alloy) for workflow orchestration
- A deployment pipeline that could serve any number of web and mobile apps

This felt unproductive at the time. I had no product. No users. No revenue. Just infrastructure. But it meant that when I started building products, the foundation was proven and every platform I added took less time than the one before.

### The Compounding Effect

Lyte (business observability) took 6 weeks. Vessels (maritime intelligence) took 5 weeks. Aegis (unified defense) took 5 weeks. Terra (real estate intelligence) took 4 weeks. PRISM Counsel (legal matter command) took 4 weeks.

Each platform was faster because each platform contributed patterns back to the shared architecture. Signal normalization built for Lyte was reused in Vessels. Compliance monitoring built for Vessels was reused in Aegis. Distress detection built for Terra informed risk scoring in Lyte.

By the time I was building platform four or five, approximately 60-70% of the codebase was shared. I was writing only the domain-specific intelligence layer.

### What I Got Wrong

**Starting content creation late.** I spent 15 months building before publishing a single word about what I was building. The products were real, but nobody knew they existed. If I did it again, I would start writing on Medium and Substack from month one.

**Underestimating mobile.** I initially planned web-only. Adding 8 mobile apps via Expo React Native was the right decision, but it came late. Mobile should have been part of the architecture from the beginning.

**Perfectionism on launch.** I spent too long polishing before publishing. Every day of polish is a day of not being in the market. Ship when it works, polish while it runs.

### What I Got Right

**One monorepo, one schema, one execution engine.** Every time I have second-guessed this decision, I have come back to it. The coherence and compounding effects of shared architecture justify every tradeoff.

**Domain specificity over generalization.** Each platform solves a specific problem for a specific audience. No platform tries to be everything to everyone. This produces better products and clearer positioning.

**Building in public (eventually).** When I finally started sharing the work — the numbers, the architecture, the operating philosophy — the response was immediate and enthusiastic. People are hungry for proof of real building in a landscape dominated by vaporware.

### The Numbers

- 16 live applications (8 web, 8 mobile)
- 446 database tables
- 1,618+ REST API endpoints
- 1 TypeScript monorepo
- 1 developer
- 18 months

The architecture made the numbers possible. The numbers validate the architecture.

---

*This is The SZL Briefing. If you find it useful, share it with someone building something real.*

*— Stephen Lutar, Founder & CEO, SZL Holdings*