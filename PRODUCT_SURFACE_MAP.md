# Product Surface Map — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026

---

## Platform Hierarchy

```
SZL Holdings Platform
│
├── PLATFORM LAYER (shared governance infrastructure)
│   ├── Lyte ─────────── Command surface for operators
│   ├── Alloy ────────── Execution fabric (workflows, approvals, audit)
│   ├── CORTEX ───────── Unified mobile command (all domains)
│   └── Command Portal ─ Ecosystem-wide 8-domain dashboard
│
├── PRIMITIVES (invisible to users, visible in every interaction)
│   ├── Outcome Graph ── Decision lifecycle tracking
│   ├── Proof Chain ──── Immutable audit trail
│   ├── Covenant Policy ─ Permission and approval gates
│   ├── Monte Carlo ──── Probabilistic risk simulation
│   └── Workflow Engine ─ Durable process orchestration
│
├── DOMAIN PACKS (domain-specific intelligence modules)
│   ├── Aegis ─────────── Security & defense intelligence
│   ├── Vessels ──────── Maritime fleet command
│   ├── Terra ─────────── Real estate intelligence
│   ├── PRISM Counsel ── Legal matter command
│   ├── Carlota Jo ───── Premium advisory
│   └── IMPERIUM ──────── Cloud sovereignty
│
└── CORPORATE
    ├── SZL Holdings ──── Marketing, trust center, investor hub
    └── Stephen Lutar ── Founder portfolio
```

---

## Surface-to-Primitive Mapping

Which primitives each product surface uses:

| Surface | Outcome Graph | Proof Chain | Covenant Policy | Monte Carlo | Workflow Engine |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Lyte** | ● | ● | ● | ● | ● |
| **Alloy** | ● | ● | ● | | ● |
| **CORTEX** | ● | ● | ● | ● | |
| **Command Portal** | ● | | | | |
| **Aegis** | ● | ● | ● | ● | ● |
| **Vessels** | ● | ● | ● | ● | ● |
| **Terra** | ● | | | ● | |
| **PRISM Counsel** | ● | ● | ● | ● | ● |
| **Carlota Jo** | | ● | ● | | |
| **IMPERIUM** | | | ● | | |

---

## Surface Details

### Lyte — Operator Command Surface

The primary interface for operators. Everything converges here.

| Module | Purpose | Primitives Used |
|--------|---------|----------------|
| PRISM Dashboard | 5-pillar operational overview (People, Revenue, Infrastructure, Security, Market) | Outcome Graph |
| Signal Timeline | Chronological feed of correlated business signals | Proof Chain |
| Action Queue | Pending decisions with simulation context and approval status | All 5 |
| Approvals Center | Human-in-the-loop approval queue across all domains | Covenant Policy, Proof Chain |
| AIOps | AI-assisted operations management | Outcome Graph, Workflow Engine |
| MSP/RMM | Managed services tooling | Workflow Engine |

### Alloy — Execution Fabric

The governance layer. Users don't "use Alloy" directly — they use Lyte, and Alloy enforces the rules.

| Module | Purpose | Primitives Used |
|--------|---------|----------------|
| Factory Floor | Visual workflow canvas | Workflow Engine |
| Signal Feed | Normalized signal stream from all sources | Proof Chain |
| Governance Audit | Immutable audit log of all actions | Proof Chain, Covenant Policy |
| Connector Mesh | Integration management | Workflow Engine |
| Policy Manager | Policy creation and enforcement | Covenant Policy |

### Domain Pack: Aegis

| Module | Purpose | Primitives Used |
|--------|---------|----------------|
| SOC Dashboard | Security operations command | Outcome Graph |
| MITRE ATT&CK | Threat detection mapping | Proof Chain |
| SOAR Playbooks | Automated response with approval gates | Covenant Policy, Workflow Engine |
| Sentinel AI | Threat analysis agent | Outcome Graph, Proof Chain |
| Citadel Crisis Response | Incident management | All 5 |

### Domain Pack: Vessels

| Module | Purpose | Primitives Used |
|--------|---------|----------------|
| Fleet Map | Real-time AIS vessel tracking | |
| Voyage P&L | Voyage economics with simulation | Monte Carlo |
| Dark Vessel Detection | AIS anomaly alerting | Proof Chain, Covenant Policy |
| Sanctions Screening | Compliance verification | Covenant Policy, Proof Chain |
| Helmsman AI | Maritime intelligence agent | Outcome Graph |
| Exception Center | Risk-based workflow queue | Workflow Engine |

### Domain Pack: Terra

| Module | Purpose | Primitives Used |
|--------|---------|----------------|
| Distress Pipeline | NYC public records monitoring | |
| Ownership Graph | Entity relationship mapping | |
| Deal Pipeline | Investment tracking | Monte Carlo |
| Market Signals | Real-time market intelligence | Outcome Graph |
| Lead Scoring | AI-assisted prospect ranking | Outcome Graph |

### Domain Pack: PRISM Counsel

| Module | Purpose | Primitives Used |
|--------|---------|----------------|
| Matter Management | Case lifecycle tracking | Workflow Engine |
| Copilot Workbench | AI-assisted legal analysis | Outcome Graph, Proof Chain |
| Proof Chain Viewer | Audit trail visualization | Proof Chain |
| Court Integration | Filing and deadline management | Workflow Engine |
| Settlement Forecast | Probabilistic outcome modeling | Monte Carlo |
| NY No-Fault | Specialized litigation module | All 5 |

### Domain Pack: Carlota Jo

| Module | Purpose | Primitives Used |
|--------|---------|----------------|
| Client Portal | Secure client communication | Proof Chain |
| Service Catalog | Advisory service management | |
| Booking System | Appointment scheduling | |
| Document Delivery | Secure document sharing | Proof Chain, Covenant Policy |

---

## Mobile Surface: CORTEX

CORTEX mirrors the platform hierarchy in a mobile-native form:

| Workspace | Maps To | Key Interactions |
|-----------|---------|-----------------|
| Lyte | Lyte Command Center | Signal feed, action cards, approvals |
| Aegis | Aegis domain pack | Alert triage, incident response |
| Vessels | Vessels domain pack | Fleet map, vessel alerts |
| Terra | Terra domain pack | Property alerts, deal updates |
| PRISM Counsel | PRISM Counsel pack | Matter updates, deadline alerts |
| Carlota Jo | Carlota Jo pack | Client messages, booking updates |
| Command | Command Portal | Cross-domain health overview |
| SZL Holdings | SZL Holdings | Portfolio status, notifications |

Cross-domain badge counts on the workspace switcher show active signals per domain.

---

## Related Documents

| Document | Path |
|----------|------|
| Navigation strategy | [NAVIGATION_STRATEGY.md](NAVIGATION_STRATEGY.md) |
| Product surfaces (detailed) | [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) |
| Platform primitives | [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) |
| Route inventory | [ROUTE_INVENTORY.md](ROUTE_INVENTORY.md) |
