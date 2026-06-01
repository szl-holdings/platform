# Aegis — Product Definition

## What is Aegis?

Aegis is a cyber-resilience command platform built for enterprise security operations teams. It provides operators, analysts, and executives with a unified surface for detecting, investigating, coordinating, and responding to threats — with every action governed by zero-trust policy at the platform layer.

Aegis is not a SIEM. It is the command layer above your detection stack: it coordinates across signal sources, structures analyst decisions, enforces approval gates, and surfaces executive-grade posture intelligence.

## Core Doctrine

**Verified, not assumed.** Every user action, automated response, and data access is identity-aware, tenant-scoped, and permission-class-gated. Trust is never inherited from the network or session position.

**Structured decisions, not noise.** Aegis forces precision. Alerts become investigations. Investigations yield structured decision objects with confidence scores, evidence, assumptions, and alternatives — not free-form notes.

**Governed automation.** No automation executes without a policy class. Every automated response action carries a gate: propose_only, approval_required, approved_execute, or blocked_by_policy. Automation deference is a product feature, not an afterthought.

**Resilience, not just response.** Aegis tracks time-to-resolve, escalation paths, SLA compliance, and control status — giving the organization visibility into whether it is becoming more resilient over time, not just whether the current incident is managed.

## Product Boundaries

Aegis does not:
- Replace your SIEM, EDR, or vulnerability scanner
- Store raw event logs or telemetry
- Provide network monitoring or packet capture
- Offer endpoint management

Aegis does:
- Ingest, correlate, and surface signals from those systems
- Structure the analyst workflow from triage to close
- Gate automated actions with policy and approval
- Deliver posture intelligence to executives and the board

## Architecture Pillars

### 1. Identity-Aware Operations
Every action carries an operator identity. Tenant context is resolved from session, not assumed from URL. Role classes gate tool access. Org-scoped escalations are enforced at the routing layer.

### 2. Structured Decision Objects
Investigations produce decisions, not tickets. Decision objects include: confidence score, evidence references, key assumptions, alternative hypotheses, approval state, and a tamper-evident audit chain.

### 3. Policy-Gated Automation
Response automation operates in explicit policy modes:
- **propose_only** — system proposes action; human must initiate
- **approval_required** — system queues action; named approver must confirm
- **approved_execute** — pre-approved playbook step; executes with audit log
- **blocked_by_policy** — action class is prohibited in current environment/tenant

### 4. Environment-Bounded Trust
Production, pilot, and demo environments are hard-labeled. Source trust levels and connector trust scores are surfaced on every data element, not buried in metadata.

### 5. Data Governance at the Surface
Every data record carries: sensitivity label, tenant label, environment label, retention class, and export restriction. These are not access-control lists — they are visible signals on every row operators touch.

## Product Lines

### Defense Workspace
Security operations: incident triage, investigation management, alert correlation, threat intelligence, vulnerability tracking, compliance posture.

### Command Workspace
Managed operations: client management, SLA tracking, NOC operations, service desk, device inventory, technician dispatch.

### Labs Workspace
Intelligence: research projects, model registry, experiment tracking, prediction pipelines, AI cortex agents.

## Deployment Contexts

- **Production** — live tenant data, full policy enforcement, all automation gates active
- **Pilot** — scoped tenant, limited automation, proposal-only mode default
- **Demo** — synthetic data, no automation gates enforced, watermarked exports

## Version

Aegis Phase 1 — Command Surfaces & Zero-Trust Product Foundation
