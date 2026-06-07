# Buyer Use Cases

The SZL Holdings platform addresses operational intelligence failures across five buyer profiles. Each represents a distinct problem pattern and a specific platform entry point.

---

## Use Case 1 — Chief Operating Officer

**Problem:** Operational risk is invisible until it escalates. The COO sees aggregated metrics, not the execution gaps, ownership drift, or bottlenecks compounding beneath them. By the time a problem surfaces, it's already consequential.

**Platform answer:** Lyte's PRISM framework surfaces operational risk across People, Revenue, Infrastructure, Security, and Market dimensions in real time. The signal timeline shows emerging issues before they compound. The Ownership Map identifies accountability gaps. The Priority Action Queue routes next steps to the right owner.

**Entry point:** Lyte command center — PRISM dashboard + signal timeline.

---

## Use Case 2 — Chief Information Security Officer / SOC Leader

**Problem:** The security operations team is buried in alert volume with no unified view of threat priority, asset context, or escalation status. SOAR tools require brittle playbook maintenance. Threat intelligence is siloed from operational response.

**Platform answer:** Aegis consolidates SOC command, managed operations, and threat intelligence into one surface. SOAR playbook engine with MITRE ATT&CK v14 coverage. STIX/TAXII protocol layer. XDR console. AI-assisted triage (Sentinel agent) with human approval gates before any escalation action.

**Entry point:** Aegis defense workspace — SOC command + SOAR playbooks.

---

## Use Case 3 — Maritime Operations Director

**Problem:** Fleet visibility is fragmented across AIS data, voyage management systems, and manual reports. Sanctions exposure, dark vessel activity, and route anomalies require time-intensive analysis that doesn't scale.

**Platform answer:** Vessels provides unified fleet command with real-time AIS tracking, automated sanctions screening, dark activity detection, route anomaly alerts, and voyage economics modeling. Exception-based workflows route flagged vessels to the appropriate analyst.

**Entry point:** Vessels fleet map + exception center.

---

## Use Case 4 — Real Estate Investment / Operations Team

**Problem:** Distressed property identification is slow and reactive. Ownership structure is opaque. Deal pipeline management is disconnected from market intelligence.

**Platform answer:** Terra surfaces distress signals from public data pipelines (NYC property data, liens, violations, ownership filings). Ownership graph analysis surfaces beneficial ownership patterns. Alloy manages the deal pipeline with structured workflows for underwriting and broker engagement.

**Entry point:** Terra distress signal feed + ownership graph.

---

## Use Case 5 — Enterprise Buyer (Procurement / IT)

**Problem:** AI-assisted software purchases require demonstrated security posture, compliance readiness, integration capability, and audit accountability. Vendors that cannot substantiate these claims during evaluation create procurement risk.

**Platform answer:** The platform is built with enterprise procurement requirements in mind. OIDC/PKCE authentication, 11-role RBAC, SCIM 2.0 provisioning, multi-tenancy, immutable audit trail, TLS 1.3, and SOC 2 roadmap. Integration stubs for 40+ connectors. OpenAPI spec for technical review.

**Entry point:** Trust Center + Security Posture + Architecture documentation.

---

## Common Patterns Across Buyers

| Pattern | Platform Response |
|---------|------------------|
| Alert fatigue | Signal normalization + priority routing (Alloy) |
| Accountability gaps | Ownership Map + attribution on every action |
| AI without oversight | Human-in-the-loop gates on all consequential actions |
| Compliance documentation | Immutable audit trail + compliance templates |
| Integration complexity | 40+ connector stubs + OpenAPI spec |

---

## Evaluation Path

| Step | Action |
|------|--------|
| 1 | Review this wiki and the main README |
| 2 | Request demo access for your primary use case |
| 3 | Schedule a technical review session |
| 4 | Request the security and compliance documentation package |
| 5 | Design partner engagement or pilot negotiation |

**Contact:** [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)

---

## Further Reference

- [Use Cases doc](../../docs/buyer/use-cases.md)
- [Executive Overview](../../docs/buyer/executive-overview.md)
- [Solution Brief](../../docs/buyer/solution-brief.md)
- [[Trust-Center]]
- [[Screenshots-and-Demos]]
