# Frequently Asked Questions — SZL Holdings

## General

**What is SZL Holdings?**
SZL Holdings is a governed decision infrastructure company operating eight domain vertical platforms: Lyte (business observability), Alloy (execution fabric), Aegis (defense/SOC), Sentra (cyber resilience), Terra (real estate), Vessels (maritime), Counsel (legal matter command), and Carlota Jo (advisory).

**Is SZL a single product or multiple products?**
SZL is a product family. Each vertical (Lyte, Terra, Vessels, Aegis, Sentra, Counsel, Carlota Jo) is a standalone product, but they all share a common operating spine: evidence-backed AI, policy governance, human-in-the-loop approval, and immutable audit trails.

**What stage is the platform?**
The platform is in functional alpha, approaching beta. All products are deployed and operational with real data integrations. See our live-vs-roadmap summary for current capabilities.

## Technical

**What technology stack does SZL use?**
TypeScript throughout. React + Vite for web, Expo for mobile, Express for API, PostgreSQL for database, Drizzle ORM for queries, GitHub Actions for CI/CD.

**How many API endpoints exist?**
2,816 API endpoints across 357 route files covering all product domains.

**How is data stored?**
PostgreSQL with 798 database tables across all domains. Each product has its own table prefix (alloy_*, terra_*, vessels_*, etc.).

## Security

**Is my data secure?**
Yes. We use HTTPS/TLS for all communications, auth middleware on all admin endpoints, CodeQL security scanning, and automated dependency review. See our Trust Center for full details.

**Do you support SSO?**
We support authentication via Replit Auth (OpenID Connect with PKCE) and have SCIM 2.0 endpoints for enterprise provisioning.

**Where is data hosted?**
On Replit's managed infrastructure (US-based). Database is managed PostgreSQL with automated backups.

## Products

**Can I use just one product (e.g., only Terra)?**
Yes. Each product is designed to work independently, though they benefit from the shared Alloy execution fabric.

**Do you have a mobile app?**
Yes. The platform has a unified Expo (React Native) mobile command app (APEX) covering all domain workspaces on iOS and Android.

**How does AI governance work?**
All AI decisions operate in "propose-only" mode. The AI retrieves evidence, checks policy gates, and proposes actions — but a human must approve before execution. Every decision is logged to an immutable audit trail.

## Getting Started

**How do I request a demo?**
Visit /demo or /contact to request a guided demonstration.

**How do I report a bug?**
Visit /help and select "Report a Bug" or email support@szlholdings.com.

**Where can I find documentation?**
Right here at /docs. Also check /help for troubleshooting and /trust for security information.
