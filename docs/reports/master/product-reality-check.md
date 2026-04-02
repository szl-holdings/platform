# SZL Holdings — Product Reality Check

## Lyte Command Center

| Capability | Claim | Reality | Gap |
|-----------|-------|---------|-----|
| Signal intake | Active | Real — signals can be created, listed, filtered | Minor |
| Event prioritization | Active | Seeded data demonstrates the pattern | Needs live data integration |
| Command inbox | Active | UI exists with action queue | Real |
| Approval center | Active | Schema + UI components exist | Limited workflow integration |
| Ownership map | Active | Page exists | Seeded data |
| Escalation center | Active | Page exists | Seeded data |
| Alloy intelligence | Active | AI inference with decision objects | Real (propose_only) |
| Readiness module | Active | Assessment CRUD working | Real |
| Audit trail | Active | Audit logging for all AI decisions | Real |
| PRISM dashboard | Active | Visualization of signal context | Real |
| Observability | Active | Service health, APM pages | Real |

**Overall**: Lyte is the most complete product. Core workflow (signal → decision → action → audit) is real but relies on seeded data for demonstration.

## Alloy (Execution Fabric)

| Capability | Claim | Reality | Gap |
|-----------|-------|---------|-----|
| Decision objects | Active | 9 validated schemas | Real |
| Evidence retrieval | Active | Hybrid search + reranking | Real |
| Policy-gated execution | Active | 9 tools, propose_only default | Real |
| Approval gates | Active | Schema supports it | UI integration partial |
| Immutable audit | Active | All decisions logged | Real |
| Eval harness | Active | 25+ golden test scenarios | Real |
| Multi-model routing | Active | HuggingFace primary, fallbacks configured | Real |

**Overall**: Alloy engine layer is genuine and well-structured. The gap is in deep UI integration — some Lyte pages still show raw text instead of decision cards.

## Aegis (Firestorm)

| Capability | Claim | Reality | Gap |
|-----------|-------|---------|-----|
| SOC dashboard | Active | Comprehensive alert/incident views | Seeded data |
| Threat intelligence | Active | STIX/TAXII, MITRE ATT&CK pages | Decorative without live feeds |
| XDR console | Active | Page exists | Decorative |
| Forensics | Active | Timeline page exists | Decorative |
| Cases | Active | Case management UI | Seeded data |
| Sentinel integration | Active | Dashboard page exists | Not connected |
| MSP operations | Active | 10+ operations pages | Seeded data |

**Overall**: Aegis has the most pages (60+ routes) but many are presentational. Core SOC dashboard, incident management, and risk scoring are functional with seeded data. Advanced features (SOAR, forensics, XDR) are decorative.

## Terra

| Capability | Claim | Reality | Gap |
|-----------|-------|---------|-----|
| Portfolio view | Active | Property list + detail | Real with seeded data |
| Market intelligence | Active | Live data from Census, HUD, FEMA APIs | Real |
| Distress engine | Active | Detection + scoring | Real with seeded data |
| Deal pipeline | Active | CRUD operations | Real |
| Property map | Active | Mapbox integration | Real |
| Climate risk | Active | FEMA NRI integration | Real |
| Document engine | Active | Document management | Real |

**Overall**: Terra has strong live data integrations (Census, HUD, FEMA, NYC open data). Core real estate workflows are functional.

## Vessels

| Capability | Claim | Reality | Gap |
|-----------|-------|---------|-----|
| Fleet dashboard | Active | Vessel list + overview | Real with seeded data |
| Vessel detail | Active | Comprehensive vessel page | Real |
| Exception center | Active | Alert/exception management | Real with seeded data |
| Route planning | Active | Route visualization | Seeded data |
| Sanctions screening | Active | Page exists | Decorative without live feed |
| Dark vessel detection | Active | Page exists | Decorative |
| Maritime map | Active | Mapbox integration | Real |
| Commodity flow | Active | Page exists | Seeded data |

**Overall**: Core fleet management and exception handling are real. Maritime-specific intelligence features (sanctions, dark vessel) are presentational.

## Carlota Jo

| Capability | Claim | Reality | Gap |
|-----------|-------|---------|-----|
| Service presentation | Active | Clean advisory brand | Real |
| Booking flow | Active | Appointment booking | Real |
| Client portal | Active | Document + session management | Real |
| ROI calculator | Active | Interactive tool | Real |
| AI advisory | Active | Domain agent chat | Real |

**Overall**: Carlota Jo is a well-defined advisory brand. Booking and client portal features are genuine.

## SZL Holdings

| Capability | Claim | Reality | Gap |
|-----------|-------|---------|-----|
| Portfolio overview | Active | Product hierarchy visualization | Real |
| Investor relations | Active | Comprehensive investor pages | Real |
| Trust center | Active | Security + trust documentation | Real |
| Capital readiness | Active | Artifacts, packets, diligence | Real |
| Ecosystem map | Active | Interactive visualization | Real |

**Overall**: Strong parent company shell. Investor-facing content is comprehensive and truthful.
