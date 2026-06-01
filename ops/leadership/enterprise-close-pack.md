# Enterprise Close Pack — SZL Holdings

**Phase:** E · **Audience:** Founder, enterprise prospects · **Last reviewed:** 2026-04-16

---

## Purpose

The Enterprise Close Pack is the curated set of artifacts an enterprise buyer needs to complete their internal procurement, security, and compliance review. It exists so that when a buyer asks "what do you have for [security questionnaire / DPA / pen test summary / architecture diagram]", the founder can answer with a single curated bundle instead of scrambling.

This pack is updated quarterly. Every artifact has an owner and a refresh date.

---

## Pack Contents (The Curated Bundle)

### Tier 1 — Universal (Sent to every enterprise prospect)

| Artifact | Source | Refresh Cadence |
|----------|--------|-----------------|
| Executive overview (2-page) | `docs/buyer/executive-overview.md` | Quarterly |
| Solution brief | `docs/buyer/solution-brief.md` | Quarterly |
| Security summary for buyers | `docs/buyer/security-summary.md` | Quarterly |
| Trust center page | `docs/trust/trust-center.md` | Quarterly |
| Deployment options | `docs/buyer/deployment-options.md` | Quarterly |
| Use cases | `docs/buyer/use-cases.md` | Quarterly |
| Canonical demo flow | `docs/buyer/canonical-demo.md` | Quarterly |

### Tier 2 — On Request (Sent under NDA)

| Artifact | Source | Refresh Cadence |
|----------|--------|-----------------|
| Readiness gaps (honest) | `docs/investor/readiness-gaps.md` | Quarterly |
| Product readiness assessment | `docs/investor/product-readiness.md` | Quarterly |
| Security posture (full) | Trust center / security exhibit | Quarterly |
| Privacy boundaries | Trust center | Quarterly |
| Architecture diagram | Internal architecture overview | Quarterly |
| API documentation (OpenAPI 3.1) | `apps/api-server` OpenAPI export | On change |
| Security questionnaire response (CAIQ Lite) | Internal — maintained current | Quarterly |
| Penetration test summary | Pen test report (when complete) | Annually post-pen test |
| Incident response runbook (redacted) | `docs/internal/ops/incident-response-runbook.md` | Quarterly |
| Backup & restore procedures | `docs/internal/security/backup-restore.md` | Quarterly |

### Tier 3 — Negotiated (Sent during contract phase)

| Artifact | Source | Refresh Cadence |
|----------|--------|-----------------|
| Master Service Agreement (MSA) | Legal — current template | As needed |
| Data Processing Agreement (DPA) | Legal — current template | As needed |
| Statement of Work (SOW) template | Per-engagement | Per engagement |
| Service Level Agreement (SLA) options | Pricing exhibit | Quarterly |
| Pricing exhibit (sealed, contract-specific) | Per engagement | Per engagement |
| Mutual NDA template | Legal — current template | As needed |

---

## Pack Delivery Sequence

### Pre-discovery
- No pack yet. Founder is qualifying.

### Post-discovery (interest confirmed)
- Send Tier 1 (universal artifacts) by email after the discovery call
- Schedule the demo

### Post-demo (technical due diligence beginning)
- Sign mutual NDA (Tier 3)
- Send Tier 2 (on-request) bundle
- Offer to schedule a security architecture review call

### During joint diagnosis
- Walk through specific Tier 2 artifacts the buyer's security/compliance team has flagged
- Respond to their security questionnaire (use CAIQ Lite as base; customize as needed)

### Pre-contract
- Negotiate Tier 3 artifacts (MSA, DPA, SLA)
- Final pricing exhibit specific to the engagement

---

## Enterprise Buyer Personas and Their Asks

### Procurement
**Wants:** Pricing transparency, contract template, payment terms, vendor onboarding form  
**Pack response:** Tier 3 (MSA, DPA, pricing exhibit) + completed vendor onboarding

### Security
**Wants:** Security questionnaire, pen test summary, architecture diagram, audit logs, incident response  
**Pack response:** Tier 2 (security summary, posture, IR runbook) + Tier 3 (DPA)

### Compliance / Legal
**Wants:** DPA, data residency options, GDPR posture, breach notification terms, audit log access  
**Pack response:** Tier 2 (privacy, deployment options) + Tier 3 (DPA, MSA)

### IT / Infra
**Wants:** Deployment options, integration documentation, API specs, uptime history, network requirements  
**Pack response:** Tier 1 (deployment options) + Tier 2 (architecture, API)

### Economic decision-maker (CFO, COO, BU head)
**Wants:** ROI case, references, pricing, timeline, risk register  
**Pack response:** Tier 1 (executive overview, use cases) + reference call + pricing exhibit

---

## Pack Maintenance

### Quarterly review (founder + ops)
- Confirm every Tier 1 artifact is current
- Refresh dates on every artifact
- Update security questionnaire base
- Confirm pen test summary is current (or schedule one)
- Confirm contract templates reflect any commercial / legal changes

### On change (immediate)
- API change → refresh API documentation
- Architecture change → refresh architecture diagram
- Security incident → refresh IR runbook + post-incident review
- New compliance certification → add to trust center, security summary, and pack

### Owner accountability
- Founder owns Tier 1 freshness
- Founder + outside counsel owns Tier 3 templates
- Founder owns Tier 2 (with input from security advisor when one is engaged)

---

## What NOT to Include in the Pack

- Speculative roadmap commitments
- Investor materials (those go to investors, not buyers)
- Internal-only documents (lessons memos, internal post-mortems)
- Comparisons to specific competitors (positioning is in `competitive-positioning.md`, not in buyer pack)
- Pricing for buyers other than the recipient

---

## Pack Distribution

### Format
- PDF preferred for portability
- Markdown source maintained in repo for version control
- Pack assembled into a single zip on request, with a one-page README index

### Channel
- Sent via email with each artifact attached, or
- Hosted in a buyer-specific data room (Google Drive folder, Notion page, or DataSite for enterprise)
- Tier 3 artifacts always sent under NDA

### Tracking
- Founder logs every pack delivery in the CRM (or simple spreadsheet)
- Note which artifacts the buyer engages with (asks questions about)
- Use that signal to refine the pack over time

---

## Anti-Patterns

- **Sending the entire pack at first contact.** Overwhelms the buyer; they engage with nothing.
- **Outdated pen test summary.** A 2-year-old pen test is worse than no pen test.
- **Tier 3 without NDA.** Don't send commercial templates before NDA is signed.
- **Bespoke security questionnaire from scratch every time.** Maintain a base response; customize.
- **Promising what isn't in the pack.** "I can get you that" with no plan = lost trust.

---

*The Enterprise Close Pack turns "we'd love to buy but we need 30 things from your security team" into "here is the bundle, and here is the call to walk through it." That conversion is worth 4-8 weeks of cycle time per enterprise deal.*
