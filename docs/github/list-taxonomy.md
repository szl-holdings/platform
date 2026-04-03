# GitHub List Taxonomy — SZL Holdings

**Version:** 1.0  
**Owner:** Stephen Lutar  
**Last Updated:** April 2026

---

## Overview

SZL Holdings maintains 8 canonical GitHub Lists. These are not suggestions — they are the only lists that should exist. If a repo doesn't fit one of these lists, it probably shouldn't be starred.

Each list has a defined purpose, inclusion/exclusion criteria, a target repo count range, and a quality bar.

---

## List 1: Design/UI

**Slug:** `design-ui`  
**Purpose:** Visual systems, animation, design tokens, layout patterns, and UI engineering references that raise the quality bar across SZL's six product surfaces.

**Include:**
- Production-grade component systems with strong visual identity
- Animation and motion libraries with real usage in shipped products
- Design token systems and theming architectures
- High-quality open-source product UI (not demos — actual shipped interfaces)
- README/docs with strong visual presentation (design as signal, not just code)

**Exclude:**
- CSS frameworks being maintained by single developers
- Tutorial projects showing "how to build X"
- Component libraries without documentation
- Repos primarily used for Figma integration (document separately)
- Purely cosmetic repos with no architectural learning value

**Target count:** 25–45 repos  
**Quality bar:** Must be something you'd show to a senior designer or front-end architect without embarrassment.

---

## List 2: AI/Agents/RAG

**Slug:** `ai-agents-rag`  
**Purpose:** LLM orchestration, agent frameworks, retrieval-augmented generation, tool use, memory systems, and AI workflow primitives — the reference layer for Alloy and AI integration across all SZL products.

**Include:**
- Production-tested agent orchestration frameworks
- RAG pipeline implementations with real retrieval logic (not toy demos)
- LLM tool-use and function-calling patterns
- Embedding and vector store integrations at scale
- Observability for LLM-based systems
- Evals frameworks used in real deployments

**Exclude:**
- "Build your own ChatGPT" tutorial repos
- Single-model wrappers without orchestration logic
- Repos that haven't been updated in 12+ months (AI field moves fast)
- AI art generation and image model repos (not relevant to SZL domain)

**Target count:** 30–50 repos  
**Quality bar:** Must represent a pattern or framework you would genuinely consider using in Alloy or an AI integration in one of the six products.

---

## List 3: Observability

**Slug:** `observability`  
**Purpose:** Logging, distributed tracing, metrics collection, APM tooling, dashboards, and alerting — the benchmarks for Lyte's core observability product surface.

**Include:**
- OpenTelemetry implementations and instrumentation examples
- Distributed tracing frameworks (Jaeger, Tempo, Zipkin — but reference implementations, not just docs)
- Log aggregation patterns at production scale
- Metrics and alerting architecture examples
- Real dashboards from real systems (Grafana setups, etc.)
- Business observability patterns (not just infra — Lyte covers business metrics)

**Exclude:**
- Single-service logging utilities without broader observability intent
- Vendor-specific SDKs without architectural learning value
- Demo dashboards with synthetic data

**Target count:** 20–35 repos  
**Quality bar:** Must teach something about how production observability systems are built, not just how to use a library.

---

## List 4: Security/Trust

**Slug:** `security-trust`  
**Purpose:** Authentication, authorization, RBAC, secrets management, compliance patterns, audit trails, and security architecture references — informs Aegis and the security posture across all SZL products.

**Include:**
- Auth0, Clerk, Supabase Auth — but implementation patterns, not just SDKs
- RBAC and policy engine implementations (OPA, Casbin, etc.)
- Secrets management at scale (Vault patterns, etc.)
- Audit logging and compliance trail architecture
- Zero-trust architecture examples
- Security headers, CSP, and hardening patterns in real applications
- Threat modeling frameworks and templates

**Exclude:**
- CVE trackers and vulnerability databases (not architectural)
- Pen testing tools (out of scope for product reference)
- Security scanner outputs
- Single-purpose JWT libraries without surrounding security architecture

**Target count:** 20–35 repos  
**Quality bar:** Must represent how a production system handles trust — not just a security utility.

---

## List 5: Infra/DevOps

**Slug:** `infra-devops`  
**Purpose:** CI/CD pipeline patterns, infrastructure-as-code, deployment architectures, container orchestration, and platform engineering — informs SZL's deployment and operations layer.

**Include:**
- Real IaC patterns (Terraform, Pulumi, CDK) from shipped systems
- CI/CD pipelines with non-trivial logic (monorepo builds, matrix testing, etc.)
- Docker and container orchestration at production scale
- Database migration and deployment patterns
- Secrets injection and environment management in real pipelines
- Azure-specific deployment patterns (SZL runs on Azure)

**Exclude:**
- "Getting started with Docker" tutorials
- Generic DevOps checklists without implementation
- Kubernetes configs that are scaffolds without real complexity
- GCP/AWS-only patterns without Azure relevance

**Target count:** 20–35 repos  
**Quality bar:** Must show how a real team ships software with appropriate controls.

---

## List 6: Docs/README

**Slug:** `docs-readme`  
**Purpose:** Documentation excellence — README patterns, API documentation systems, wiki structures, changelog formats, and writing quality that informs SZL's own public documentation.

**Include:**
- Exceptional README files (not just pretty — structurally excellent)
- API documentation systems with good developer experience
- Architecture decision record (ADR) implementations
- Changelog and release note formats worth copying
- Docs-as-code patterns (Docusaurus, Starlight, etc.) with real usage
- Technical writing guides and frameworks for developer docs

**Exclude:**
- README generators and templates without accompanying great output
- Docs repos for products SZL doesn't reference
- Any repo starred purely for its social following

**Target count:** 15–25 repos  
**Quality bar:** Must be something you'd share with a writer or technical communicator as an example of doing it right.

---

## List 7: Component Libraries

**Slug:** `component-libraries`  
**Purpose:** Shared UI component systems — headless components, accessible primitives, design system implementations — that inform SZL's front-end architecture across web and mobile surfaces.

**Include:**
- Headless UI libraries with strong accessibility (Radix, Headless UI, etc.)
- React component libraries with real production usage and active maintenance
- React Native / Expo component systems
- Design system implementations from organizations with credible design culture
- Component API design patterns worth studying (not just visual output)

**Exclude:**
- Abandoned component libraries (last commit > 18 months)
- Single-component repos without a broader system
- jQuery or non-modern-framework component repos
- Repos from products using deprecated styling approaches as primary pattern

**Target count:** 20–30 repos  
**Quality bar:** Must inform how a component API is designed or how a design system is structured — not just "this looks good."

---

## List 8: Competitive/Reference

**Slug:** `competitive-reference`  
**Purpose:** Direct competitors, category leaders, and adjacent products in each of SZL's six domain areas — a persistent competitive intelligence layer.

**Product-to-category mapping:**
- **Lyte** → Business observability, BI tooling, operational dashboards
- **Alloy** → AI workflow orchestration, enterprise AI platforms
- **Aegis** → Security operations, SOC tooling, threat intelligence
- **Vessels** → Fleet management, maritime tech, logistics intelligence
- **Terra** → Real estate intelligence, property data platforms
- **Carlota Jo** → Executive advisory platforms, professional services tech

**Include:**
- One or two canonical repos per competitor or category leader (public repos where available)
- Reference implementations showing how category leaders architect their systems
- Open-source tools from companies in adjacent markets whose architecture is instructive

**Exclude:**
- More than two repos from any single organization (avoids flood)
- Marketing repos, landing page repos, and no-code competitors
- Repos from companies that are 10+ years removed from SZL's current market position

**Target count:** 25–40 repos  
**Quality bar:** Must create competitive awareness or architectural context. If you can't explain in one sentence why this repo is in Competitive/Reference, it doesn't belong.

---

## Naming Standards

| Field | Standard |
|-------|----------|
| Slug | Lowercase, hyphenated, matches list above |
| Display name | Title case, matches list name above |
| Description | One sentence maximum, focused on purpose not content |
| Visibility | All lists are private unless explicitly made public |

---

## Cross-List Assignment

A repo may belong to only one list. When a repo spans categories (e.g., a UI component library with strong observability instrumentation), assign it to the list representing its primary value. The goal is retrieval clarity, not taxonomic perfection.

If you genuinely cannot decide between two lists, default to the one you'd look in first when trying to find it.
