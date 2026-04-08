# LinkedIn Post: Architecture Deep Dive

---

**Why I chose a monorepo for 16 applications — and what happened next.**

Most founders choose microservices when they hit scale. I went the opposite direction.

SZL Holdings runs 16 applications from a single TypeScript monorepo. Same database. Same auth. Same design system. Same deployment pipeline.

Here is what that decision actually means in practice:

**1. Compound velocity**
When I add a feature to the shared library, every platform benefits. A single security patch propagates to all 16 apps in one commit.

**2. Schema coherence**
446 tables in one PostgreSQL instance with Drizzle ORM. Every platform queries the same source of truth. No eventual consistency headaches. No data syncing nightmares.

**3. Design consistency**
One design system means every platform looks and feels like it belongs to the same family. Users who touch multiple products do not have to relearn the interface.

**4. Deployment simplicity**
One CI/CD pipeline. One environment configuration. One set of secrets to manage. The operational overhead of 16 apps is barely more than one.

The tradeoff? Memory pressure. Build complexity. Test surface area.

But for a solo founder, the benefits are not even close. The monorepo is the only reason one person can maintain this many production systems simultaneously.

The architectural decision you make at the beginning compounds — in both directions. Choose wisely.

---

More technical writing on architecture and operations: szlholdings.substack.com

#SoftwareArchitecture #Monorepo #TypeScript #pnpm #DrizzleORM #PostgreSQL #TechFounder #EngineeringLeadership
