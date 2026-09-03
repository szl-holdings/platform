# SZL Vertical Operational Contract v1

This contract separates **a vertical pack that can render a demonstration** from
**a vertical runtime that is operational against current, sourced evidence**.

The existing `services/verticals/*/signals.py` collectors are deterministic
source fixtures. They are useful for UI, recommendation, and governance tests;
they are not proof that FEMA, SEC, FRED, CourtListener, CISA, NVD, EPSS,
OpenTelemetry, Prometheus, Stripe, Linear, Notion, calendars, SIEM, or any other
named system was queried.

## Canonical vertical identity

`vessels` remains an import-compatible package id inside this monorepo.
The canonical product is **Killinchu**, and Vessels is its maritime domain:

```text
canonical vertical: killinchu
legacy registry/package id: vessels
domains: counter_uas + vessels + maritime_domain_awareness
canonical runtime repository: szl-holdings/killinchu
```

No new standalone Vessels product should be created.

## Operational means all gates pass

A vertical is computed as `OPERATIONAL` only when all of the following are
present in one request/deployment manifest:

1. At least one current upstream observation labelled `LIVE`, `MIXED`,
   `CACHED`, or `OBSERVED`.
2. HTTPS source URL, authority, fetch timestamp, provenance, and honest record
   counts for every current source.
3. No sample record promoted to `LIVE`; mixed payloads use `MIXED`.
4. Formula bindings with measured input counts and proof posture.
5. No open conjecture presented as a theorem.
6. No full Yuyay-13 score unless all 13 axes are measured.
7. Second Brain contract `szl.brain.navigator-context/v1`, handles-only content
   access, evidence digests, and lexical-overlap scores never labelled
   correctness.
8. Mandatory Anatomy organs:
   `EYES_EARS`, `IMMUNE`, `BRAIN`, `SKELETON`, `HEART`, `HANDS`, `MEMORY`.
9. Human approval, rollback path, and public automation authority `NONE`.
10. Evidence digest and honest receipt state; no signature fabricated.
11. Exact-source deployment SHA, deployment receipt, byte match, and live route
    probes.

The computed states are:

| State | Meaning |
|---|---|
| `INVALID` | A truth, schema, formula, Anatomy, Second Brain, or governance invariant failed |
| `UNAVAILABLE` | No defensible current or sample evidence is attached |
| `SAMPLE_ONLY` | Only deterministic/replay evidence exists |
| `IMPLEMENTED_UNVERIFIED` | Current evidence exists, but exact-source deployment verification is incomplete |
| `DEPLOYED_DEGRADED` | Deployment is verified but a mandatory organ or Second Brain is degraded |
| `OPERATIONAL` | Every gate above passes |

## Evidence states

| State | Rule |
|---|---|
| `LIVE` | Current upstream response with provenance and at least one live record |
| `MIXED` | Current records coexist with explicitly labelled sample records |
| `CACHED` | Previously live response remains inside a declared TTL |
| `OBSERVED` | Sourced point-in-time observation without a continuous-live claim |
| `HISTORICAL_SAMPLE` | Real historical row used for replay |
| `SAMPLE` | Synthetic or bundled demonstration data |
| `MODELED` | Derived result; never promoted to observation |
| `UNAVAILABLE` | No defensible result; no fabricated zero or clean state |

## Real-data source boundaries

The catalog in `source_catalog.py` is a plan, not evidence. Runtime adapters must
fetch these sources and emit operational manifests.

### Platform / Lyte / infrastructure

Use authorized GitHub and Hugging Face metadata, OTLP/OpenTelemetry telemetry,
and a configured Prometheus-compatible backend. There is deliberately no public
default Prometheus or OTLP endpoint. Hosts must be allowlisted and account data
must remain scoped to authorized connectors.

### Finance

Use SEC EDGAR submissions/XBRL for public-company filings and FRED for economic
context. Both are evidence about public filings or macroeconomic series—not
SZL's private books, ARR, pipeline, cash, runway, or billing. Private finance
requires an authorized billing/accounting/CRM connector.

### Terra

Use OpenFEMA for relevant public disaster datasets, NWS for current alerts, and
Census/FRED for aggregate community and economic context. Those sources do not
prove parcel ownership, liens, appraisal, title, zoning, insurance, or a current
parcel-specific flood determination. Property diligence requires authorized
jurisdictional or licensed sources.

### Killinchu / Vessels

The Killinchu repository already contains the real AIS redundancy chain:

```text
AISStream (credentialed)
  -> Fintraffic Digitraffic (no key, bounded coverage)
  -> Norwegian Coastal Administration (no key, bounded coverage)
  -> optional Marinesia
  -> explicit SAMPLE/replay
```

It also contains a public UN Security Council 1718 designated-vessel source.
AIS is cooperative broadcast data and can be stale, spoofed, or incomplete.
An exact sanctions non-match is not regulatory clearance. Beneficial ownership
remains unavailable until an authenticated, runtime-bound, independently
sourced graph exists.

### Sentra Cyber

Use CISA KEV for authoritative known-exploited-vulnerability prioritization,
NVD 2.0 for CVE/CPE enrichment, and FIRST EPSS for a daily modeled exploitation
probability. These public sources do not prove that an SZL/customer asset is
present, vulnerable, reachable, exploited, or materially impacted. Local
exposure and incidents require authorized asset, scanner, SIEM, XDR, and
incident connectors.

### PRISM Counsel

Use CourtListener REST v4 for legal search/case/citation evidence, GovInfo for
official federal publications, and the Federal Register API for rules/notices.
Public legal sources do not establish a client's complete matter file,
jurisdiction-specific deadline, service date, privilege state, obligation, or
approval. Matter truth requires counsel-controlled DMS, calendar, contract, and
discovery sources.

### Scientific and graph packs

SZL Mechanics and SZL PINN produce computed/modelled evidence and receipts.
They cannot be promoted to physical measurements or certified engineering
results. Constellation Graph inherits every edge's source truth state; graph
inference cannot become observation.

## Formula application

Every vertical binds formulas by role, not by marketing:

- `lambda_aggregate`: measured operational proxies only.
- `lambda_bounded`: aggregate bound guard.
- `khipu_merkle_root`: receipt/evidence integrity.
- `dsse_envelope`: only when a real signing path is present.
- science-specific conformal intervals: uncertainty bands, not correctness.
- outcome-graph consistency: graph contract checks, not causality proof.

The source-tree snapshot sets measured input counts to zero because a blueprint
is not runtime evidence. Request handlers must populate the measured counts and
leave unmeasured axes null.

## Commands

Audit every canonical blueprint:

```bash
python -m services.verticals.audit_operational
```

Audit the Killinchu/Vessels identity:

```bash
python -m services.verticals.audit_operational --vertical vessels
python -m services.verticals.audit_operational --vertical killinchu
```

A source-tree audit passes when its declarations are structurally honest. It
does **not** require every vertical to be operational.

`--require-operational` is reserved for a runtime/deployment manifest carrying
current observations and exact-source deployment evidence. It is expected to
fail against the source-tree snapshot.

## Promotion workflow

```text
Audit source
  -> implement authorized adapter
  -> emit source timestamp/provenance/counts
  -> bind formulas to measured inputs
  -> retrieve Second Brain handles/evidence
  -> compute Anatomy organ states
  -> emit human-locked recommendation + rollback
  -> test
  -> PR
  -> protected merge
  -> exact-source deploy
  -> byte attestation
  -> live route probes
  -> operational manifest
```

No README, repository topic, Space card, screenshot, or successful build alone
satisfies this contract.
