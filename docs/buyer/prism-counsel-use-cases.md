# Prism Counsel — Use Cases

> **DEPRECATED:** PRISM Counsel has been retired. Legal capabilities are now available in the **Aegis legal workspace** (`/aegis/`). This document is preserved for historical reference only.

**Audience:** Attorneys, Legal Operations, Department Heads  
**Date:** April 2026

---

## Overview

These are the primary use cases that Prism Counsel addresses for plaintiff-side NY insurance litigation practices. Each use case describes the problem, how Prism Counsel addresses it, and what the outcome looks like.

---

## Use Case 1: Pre-Mediation Readiness Check

**The problem:**  
The mediation is in 10 days. The attorney needs to know: Is the demand packet complete? Are medical records current? Is the chronology source-grounded? What is the insurer's likely posture? What is missing?

Currently this takes 2-3 hours of manual assembly from case management, email, SharePoint, and the attorney's own notes.

**How Prism Counsel addresses it:**  
The Copilot Workbench (`matter` mode) accepts: "What is missing before mediation?" The system assembles the Matter Twin context — evidence completeness, outstanding records, pending approvals, open approval items, pressure scores — and returns a structured readiness checklist grounded in source data.

The attorney can see:
- Which medical records are outstanding
- Which pressure dimensions are elevated
- Whether any proof chain entries are pending review
- Whether the settlement range is within estimated mediation zone
- What the forecasted settlement friction score is

**Output:** Reviewed, attorney-approved mediation prep checklist. Source-grounded. Export-safe after attorney sign-off.

**Time saved:** 2+ hours per matter per mediation cycle.

---

## Use Case 2: Carrier Communication Monitoring

**The problem:**  
The carrier hasn't responded in 18 days. Is this normal? Is this a silence window that needs to be documented? Has the adjuster changed?

Tracking carrier response cadence across a portfolio of 60 active matters manually is impractical.

**How Prism Counsel addresses it:**  
The Pressure Graph tracks the `insurer` and `communication` dimensions continuously. The `insurer_response_latency` forecast computes days since last inbound carrier communication and flags anomalies above threshold.

When a silence window exceeds the configured threshold (default: 14 days), an alert is generated. The Copilot Workbench (`communications` mode) can explain: "Carrier has not responded in 18 days. Last communication was [date]. This exceeds the 14-day threshold. Two prior matters with this carrier showed a hardening posture following similar silence windows."

The attorney can decide whether to send a follow-up demand and document the silence window for potential bad-faith record.

**Output:** Documented silence window with source references. Follow-up communication drafted by Copilot, reviewed by attorney, approved for send.

---

## Use Case 3: New Document Ingestion and Classification

**The problem:**  
20 pages of medical records arrive from the treating physician. They need to be extracted, classified, indexed, privilege-checked, and added to the matter chronology. This takes 45-60 minutes manually.

**How Prism Counsel addresses it:**  
Documents are uploaded (or synced from SharePoint via M365 connector). The extraction pipeline:
1. Azure Document Intelligence extracts text, fields, and tables
2. Classification lane identifies document type and privilege state
3. Embedding lane generates semantic vectors for retrieval
4. Proof chain entry created with extraction confidence
5. If confidence < 0.6, manual review item is created
6. Matter Twin snapshot triggered — evidence dimension updated
7. Chronology gaps checked — new facts compared against existing timeline

Attorney is notified if extraction reveals contradictions with existing chronology or missing evidence flags change.

**Output:** Documents processed, classified, indexed. Contradictions and gaps surfaced for review. Matter Twin updated.

**Time saved:** 30-45 minutes per document batch.

---

## Use Case 4: Settlement Strategy Briefing

**The problem:**  
The partner wants a settlement position briefing before the negotiation call. It needs to include: current demand readiness, insurer posture assessment, forecast trajectory, leverage points, and a recommended settlement approach.

This would take an hour to assemble from existing sources.

**How Prism Counsel addresses it:**  
The Copilot Workbench (`strategy` mode) produces a structured briefing grounded in the matter's current state:

- Pressure profile across all 12 dimensions
- Data product scores: Insurer Pressure Index, Settlement Friction Map, AI Defensibility Index
- Forecast trajectory for offer movement likelihood and settlement friction
- Worldline context: venue velocity, incident contextual signals
- Identified leverage points and readiness gaps
- Recommended settlement approach with confidence range

Every claim in the briefing is grounded in source data. The briefing cannot be exported until reviewed and approved by the attorney.

**Output:** Partner-ready settlement briefing. Source-grounded. Review-audited. Export-safe after attorney sign-off.

---

## Use Case 5: Deadline Portfolio Monitoring

**The problem:**  
With 80 active matters, a paralegal needs to know: which deadlines are due in the next 10 business days? Which are overdue? Which SOLs are approaching?

**How Prism Counsel addresses it:**  
The Matter Twin tracks all deadlines across all matters. The `deadline` pressure dimension is scored per matter. The Copilot Workbench accepts portfolio-level queries.

The forecast `approval_lag_risk` flags matters where pending approvals are approaching deadline pressure.

Dashboard view shows: overdue count, due-within-7-days count, SOL watch list, assigned paralegal for each.

**Output:** Deadline triage view with risk flags. Matters sorted by proximity and severity. One-click drill-down to matter context.

---

## Use Case 6: Coverage Dispute Analysis

**The problem:**  
The carrier is denying coverage under a specific policy provision. The attorney needs to understand: Is this a legitimate coverage position? How does it compare to similar dispute patterns? What is the likely trajectory?

**How Prism Counsel addresses it:**  
The `coverage` pressure dimension is computed based on policy data and claims status. The Copilot (`communications` mode) can analyze the denial letter, extract the stated basis for denial, and compare it against the policy terms on file.

The `strategy` mode can produce a coverage analysis grounded in the claim file and the denial language, with confidence scoring on each analytical conclusion.

All outputs are marked `requiresReview: true` — attorney sign-off required before any response is drafted for external use.

**Output:** Coverage dispute analysis with source citations. Review-gated. Attorney reviews and adjusts before any external action.

---

## Use Case 7: Lien Negotiation Preparation

**The problem:**  
The matter is approaching settlement but has three active Medicare and Medicaid liens. The attorney needs to understand: What is the lien exposure? What is the likely recovery timeline drag? What is the recommended negotiation approach?

**How Prism Counsel addresses it:**  
The `recovery_lien_drag_risk` forecast computes lien exposure and timeline drag based on active liens. The Worldline engine enriches with CMS MSP recovery context.

The Copilot (`strategy` mode) can produce a lien negotiation prep note with exposure estimates, recommended negotiation sequence, and timeline impact assessment.

**Output:** Lien negotiation prep note. Source-grounded with lien data and worldline enrichment. Review-gated.

---

## Use Case 8: Ops Monitoring for Legal Operations Staff

**The problem:**  
The M365 connector stopped syncing 6 hours ago. No one noticed. Three matters have unprocessed documents.

**How Prism Counsel addresses it:**  
The Copilot (`ops` mode) shows connector health, sync lag, document processing queue depth, and alert status. Ops staff with the `operator` role can access connector diagnostics without seeing matter content.

If sync lag exceeds 4 hours, an alert is generated to the ops team.

**Output:** Ops dashboard with connector health, sync lag, job queue depth, and alert history. Drill-down into individual connector sync runs.

---

*See also:*
- *[Executive Overview](prism-counsel-executive-overview.md)*
- *[Solution Brief](prism-counsel-solution-brief.md)*
- *[M365 Companion Overview](prism-counsel-m365-companion.md)*
