# Glossary

Platform-specific terminology for the SZL Holdings ecosystem. Terms are defined precisely to reduce ambiguity in technical and commercial conversations.

---

## Platform Terms

**Alloy**
The execution fabric of the SZL Holdings platform. Handles signal normalization, workflow orchestration, approval gates, human-in-the-loop enforcement, and immutable audit trail. Every AI-assisted action in any domain pack runs through Alloy.

**Compass**
The general operational intelligence AI agent for the Lyte domain. Produces structured recommendations for workflow prioritization, risk escalation, and ownership assignments.

**Dark activity** (Vessels)
Vessel behavior indicating AIS transponder suppression — typically associated with sanctions evasion, illegal fishing, smuggling, or other prohibited activities. Detected by gap analysis in AIS signal history correlated with satellite tracking.

**Domain pack**
An application built on the Lyte + Alloy platform foundation for a specific industry vertical. Current domain packs: Aegis (security), Vessels (maritime), Terra (real estate), Carlota Jo (premium advisory).

**Helmsman**
The maritime intelligence AI agent for the Vessels domain. Analyzes fleet telemetry, route patterns, sanctions exposure, and voyage economics to produce recommendations for fleet operators.

**Human-in-the-loop (HITL)**
A mandatory approval gate requiring explicit human confirmation before a consequential action is executed. Enforced at the Alloy workflow layer — AI agents cannot bypass this by design.

**Lyte**
The business observability command surface. Surfaces operational risk, bottlenecks, ownership gaps, and execution priorities across the PRISM framework.

**PRISM**
Lyte's five-dimension operational framework: **P**eople, **R**evenue, **I**nfrastructure, **S**ecurity, **M**arket. Each dimension has dedicated signal categories, risk indicators, and action types.

**Sentinel**
The security and threat analysis AI agent for the Aegis domain. Analyzes threat intelligence feeds, correlates IOCs with ATT&CK patterns, and produces triage recommendations for SOC analysts.

**Signal**
A discrete observable event or data point that may indicate a risk, anomaly, opportunity, or required action. Signals are the input unit to the platform. They are normalized, correlated, and routed by Alloy.

**SZL Holdings**
The parent company and corporate platform. Builds and operates Lyte, Alloy, and all domain packs.

---

## Technical Terms

**AIS** (Automatic Identification System)
Maritime vessel tracking system broadcasting position, speed, heading, and vessel identity. Used by Vessels for fleet monitoring and anomaly detection.

**Drizzle ORM**
TypeScript-first SQL query builder and ORM used for all database access in the platform. Schema is type-safe; all queries are statically validated.

**MITRE ATT&CK**
A globally recognized knowledge base of adversary tactics and techniques used in the Aegis platform for threat mapping and coverage gap analysis. Aegis covers ATT&CK v14.

**OIDC/PKCE**
OpenID Connect with Proof Key for Code Exchange — the authentication protocol used by the platform. No passwords are stored in SZL systems. IdPs authenticate users; the platform establishes session context.

**pnpm**
The package manager used for the monorepo. Handles workspace dependencies and cross-package references via TypeScript project references.

**RBAC**
Role-Based Access Control — the authorization model. 11 roles with organization-scoped tenant isolation. Every API route and WebSocket channel is access-controlled.

**SCIM 2.0**
System for Cross-domain Identity Management — the protocol used for automated user provisioning and deprovisioning from enterprise IdPs (Azure AD).

**SOAR** (Security Orchestration, Automation, and Response)
Capability in Aegis for automated playbook execution in response to security events. Human-in-the-loop gates are enforced on all consequential SOAR actions.

**STIX/TAXII**
Structured Threat Information Expression / Trusted Automated eXchange of Intelligence Information — protocols for sharing threat intelligence data. Supported in Aegis.

**XDR** (Extended Detection and Response)
Integrated security detection and response across endpoint, network, cloud, and identity signals. Aegis includes an XDR console.

---

## Further Reference

- [[Architecture]] — System and component architecture
- [[Platform-Overview]] — Platform overview and product summary
- [[FAQ]] — Common questions answered
