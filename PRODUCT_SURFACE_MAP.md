# Product Surface Map — SZL Holdings

**Version:** 2.0 · **Last updated:** April 2026

---

## Platform Hierarchy

```
SZL Holdings Platform
│
├── PLATFORM LAYER (shared governance infrastructure)
│   ├── Command ────────── Unified ops command (strategy, operations, infrastructure)
│   ├── Alloy ────────────── Execution fabric (workflows, approvals, audit)
│   ├── CORTEX ───────────── Unified mobile command (all domains)
│   └── SZL Holdings ─────── Corporate, marketing, trust center, investor hub
│
├── PRIMITIVES (invisible to users, visible in every interaction)
│   ├── Outcome Graph ────── Decision lifecycle tracking
│   ├── Proof Chain ──────── Immutable audit trail
│   ├── Covenant Policy ──── Permission and approval gates
│   ├── Monte Carlo ──────── Probabilistic risk simulation
│   └── Workflow Engine ──── Durable process orchestration
│
└── DOMAIN PACKS (domain-specific intelligence modules)
    ├── Aegis ────────────── Security & defense intelligence
    ├── Vessels ──────────── Maritime fleet command
    ├── Terra ────────────── Real estate intelligence
    └── Carlota Jo ──────── Premium advisory
```

---

## Surface-to-Primitive Mapping

Which primitives each product surface uses:

| Surface | Outcome Graph | Proof Chain | Covenant Policy | Monte Carlo | Workflow Engine |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Command** | ● | ● | ● | ● | ● |
| **Alloy** | ● | ● | ● | | ● |
| **CORTEX** | ● | ● | ● | ● | |
| **SZL Holdings** | | | | | |
| **Aegis** | ● | ● | ● | ● | ● |
| **Vessels** | ● | ● | ● | ● | ● |
| **Terra** | ● | | | ● | |
| **Carlota Jo** | | ● | ● | | |

---

## Flagship Decision Loop

The Governed Decision Loop is the canonical end-to-end workflow that demonstrates the complete governed intelligence platform in a single, walkable sequence. It lives at `/command/operations/governed-decision-loop`.

**Scenario domain:** Vessels (maritime fleet ETA compliance)
**Entry point:** Executive Command home page → "Governed Decision Loop" card → "Full View"
**Sidebar navigation:** Core → Decision Loop

The loop traverses all nine steps and activates all five primitives in sequence:

| Step | Label | Primitive(s) Activated |
|------|-------|----------------------|
| 1 | Signal | — (raw ingest) |
| 2 | Context | Proof Chain (enrichment provenance) |
| 3 | Recommendation | Proof Chain (model attribution, confidence) |
| 4 | Simulation | Monte Carlo (10,000-iteration scenario analysis) |
| 5 | Policy Gate | Covenant Policy (automated compliance evaluation) |
| 6 | Approval | Covenant Policy + Workflow Engine (human-in-the-loop chain) |
| 7 | Execution | Workflow Engine (governed action execution) |
| 8 | Proof Chain | Proof Chain (immutable provenance record sealed) |
| 9 | Outcome | Outcome Graph (result captured, learning loop closed) |

See `DEMO_GUIDE.md` → "Flagship Loop — Step-by-Step Walkthrough" for the full demo script.

---

## Surface Details

### Command — Unified Operations Surface

The primary interface for operators. Everything converges here. Absorbs the former Lyte Command Center and IMPERIUM surfaces.

| Module | Purpose | Primitives Used |
|--------|---------|----------------|
| Strategy Dashboard | 5-pillar operational overview (People, Revenue, Infrastructure, Security, Market) | Outcome Graph |
| Signal Timeline | Chronological feed of correlated business signals | Proof Chain |
| Action Queue | Pending decisions with simulation context and approval status | All 5 |
| Approvals Center | Human-in-the-loop approval queue across all domains | Covenant Policy, Proof Chain |
| Operations | AI-assisted operations management | Outcome Graph, Workflow Engine |
| Infrastructure | Cloud sovereignty and platform infrastructure | Workflow Engine |
| **Governed Decision Loop** | **Flagship end-to-end loop: Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome** | **All 5** |
| Decision Receipts | Immutable record of past governed decisions | Proof Chain, Outcome Graph |
| Outcome Loop | Aggregate outcome graph and learning loop view | Outcome Graph |

### Alloy — Execution Fabric

The governance layer. Users don't "use Alloy" directly — they use Command, and Alloy enforces the rules.

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

### Domain Pack: Carlota Jo

| Module | Purpose | Primitives Used |
|--------|---------|----------------|
| Client Portal | Secure client communication | Proof Chain |
| Service Catalog | Advisory service management | |
| Booking System | Appointment scheduling | |
| Document Delivery | Secure document sharing | Proof Chain, Covenant Policy |

---

## Mobile Surface: CORTEX

CORTEX mirrors the platform hierarchy in a mobile-native form (implemented in `artifacts/szl-holdings-mobile`):

| Workspace | Maps To | Key Interactions |
|-----------|---------|-----------------|
| Command | Command unified ops | Signal feed, action cards, approvals |
| Aegis | Aegis domain pack | Alert triage, incident response |
| Vessels | Vessels domain pack | Fleet map, vessel alerts |
| Terra | Terra domain pack | Property alerts, deal updates |
| Carlota Jo | Carlota Jo pack | Client messages, booking updates |
| SZL Holdings | SZL Holdings | Portfolio status, notifications |

Cross-domain badge counts on the workspace switcher show active signals per domain.

---

## Archived Surfaces

The following surfaces have been deprecated and their code removed. See `ops/frontier/disposition-matrix.md` for full details.

| Surface | Disposition |
|---------|-------------|
| Lyte Command Center | Merged into Command |
| Firestorm | Superseded by Aegis |
| IMPERIUM | Merged into Command (infrastructure mode) |
| PRISM Counsel | Deprecated (task #579) |
| Stephen Site | Content moved to `/founder` route in SZL Holdings |

---

## Related Documents

| Document | Path |
|----------|------|
| Navigation strategy | [NAVIGATION_STRATEGY.md](NAVIGATION_STRATEGY.md) |
| Route inventory | [ROUTE_INVENTORY.md](ROUTE_INVENTORY.md) |
| Design system notes | [DESIGN_SYSTEM_NOTES.md](DESIGN_SYSTEM_NOTES.md) |
| Platform primitives | [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) |
| Brand guidelines | [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) |
