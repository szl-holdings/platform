# Aegis — Investor Pitch Deck / Security Platform: Demo Script

**Duration:** 6–8 minutes  
**Persona:** Diana Reyes (CISO)  
**URL:** `/aegis/`  
**Pre-requisite:** Demo seed loaded; signed into platform

---

## Pre-Demo Checklist

- [ ] SOC overview shows active incident count and analyst workload metrics
- [ ] Threat intelligence page shows MITRE ATT&CK coverage
- [ ] At least one tabletop scenario visible in Phantom Tabletop
- [ ] Trust Positioning page accessible

---

## Step 1 — Landing / Trust Positioning (1 min)

**URL:** `/aegis/`

> "Aegis is the security intelligence layer. The landing page establishes the governance posture — no secrets in source code, all credentials from the secrets vault, zero hardcoded values."

Click **Trust Positioning**.

> "This isn't a compliance checklist — it's a live readout of the platform's security posture. Every item here is verified by the platform at startup, not asserted by a human."

---

## Step 2 — SOC Overview (2 min)

**URL:** `/aegis/soc-overview`

> "The SOC overview is the analyst command center. Incident count, mean detection time, analyst workload — all live from the database."

Point to the workload distribution chart.

> "This shows how cases are distributed across the analyst team. The system auto-assigns based on specialization and current queue depth — not a manual dispatcher."

---

## Step 3 — Threat Intelligence (2 min)

**URL:** `/aegis/threat-intelligence`

> "MITRE ATT&CK coverage is the gold standard for measuring detection depth. Aegis maps every active detection rule to the ATT&CK matrix."

Point to the coverage heat map.

> "The green cells are covered. The red cells are detection gaps. The system generates a prioritized gap-closure roadmap automatically — not a spreadsheet, a live decision queue."

---

## Step 4 — Phantom Tabletop (2 min)

**URL:** `/aegis/phantom-tabletop`

> "Phantom Tabletop is the AI-powered red team simulator. You describe a threat scenario and the system generates a realistic attack path, tests your current control set against it, and outputs a gap analysis."

Type a scenario: "Ransomware via spear-phishing targeting finance team."

> "The AI doesn't just generate a generic playbook. It maps the scenario to the specific controls Aegis has registered for this org — and shows exactly where the coverage gaps are."

Point to the mitigation assessment output.

> "Each recommended mitigation links to a specific control in the governance catalog. Approve it here, and it creates a task in the approval queue."

---

## Step 5 — Compliance & Governance (1 min)

**URL:** `/aegis/compliance`

> "Compliance posture across SOC 2, ISO 27001, and NIST CSF — derived from the same control database. When a control is verified, the compliance posture updates automatically."

---

## Avoidance Guide

- Do NOT demo **SOAR Actions** as live automation — the SOAR webhook is stub; no external SOAR credential configured
- Do NOT present CISO Dashboard KPIs as live aggregations — they are seeded
- The 8 new security modules (DLP, CSPM, ZTNA, etc.) have UI complete but API not fully wired — show the tabbed UI briefly without drilling into data

---

## Questions to Anticipate

**"What SIEM does this connect to?"**  
> "Aegis supports ingestion from Splunk, Elastic, Microsoft Sentinel, and custom webhooks. The integration adapters are built — we're provisioning credentials with the first enterprise customer's SIEM."

**"How does this compare to CrowdStrike?"**  
> "Aegis is a governance layer on top of your existing detection tools, not a replacement. It consumes signals from CrowdStrike, normalizes them against MITRE ATT&CK, and routes them through a governed approval workflow. You keep your tools; you get attribution and accountability."
