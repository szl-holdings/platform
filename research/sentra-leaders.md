# Leaders in the Sentra Field — Research Brief

  > Source: live web search, 2026-05-01.
  > Goal: distill architectural patterns worth stealing for Sentra
  > (cyber resilience / SOC), then "make it our own" via A11oy governance.

  ---

  ## Landscape

  | Player | Class | Open source? | Standout pattern |
  |---|---|---|---|
  | **CrowdStrike Falcon** | Cloud-native EDR + threat graph | no | Real-time threat graph correlating endpoints + cloud + identity |
  | **Microsoft Sentinel** | Cloud-native SIEM + SOAR | no (KQL is open) | KQL analytic rules, scheduled queries, Logic Apps playbooks |
  | **Splunk SOAR (Phantom)** | SOAR | no | Visual playbook builder, 350+ "apps" for actions |
  | **Wiz** | CNAPP / cloud security graph | no | Unified graph across IaaS, IAM, code → toxic-combination prioritization |
  | **Panther** | Detection-as-code SIEM | yes (panther-labs/panther-analysis) | Sigma-compatible rules in code; security data lake |
  | **Tines** | No-code SOAR | no | Story-builder workflow engine, formula language for transforms |
  | **Chronicle (Google)** | Cloud SIEM | no | UDM normalization, retro-hunt over a year of data |
  | **Elastic Security** | SIEM + EDR | yes | EQL/KQL detection rules, Fleet-based agent management |

  ---

  ## Patterns worth stealing

  ### 1. Detection-as-code with Sigma (from Panther + community)
  - Sigma is the open YAML standard for detection rules — vendor-neutral.
  - Panther's killer move: detections are Python files in a git repo,
    testable, reviewable, versioned. The SIEM is dumb; the rules are smart.
  - **Take it**: ship Sentra detection rules as Sigma YAML in
    `artifacts/api-server/src/sentra/detections/*.yaml`, evaluated server-
    side over a normalized event stream. Each rule emits an alert that
    carries its provenance back to the YAML file + git ref.

  ### 2. Threat graph (from CrowdStrike + Wiz)
  - The competitive moat is the GRAPH: assets ↔ identities ↔ events ↔
    vulnerabilities, queryable as one structure. Wiz calls these "toxic
    combinations" — public asset + critical CVE + admin role.
  - **Take it**: derive a tenant-scoped asset/event/finding graph from
    `sentra_alerts` + `sentra_incidents` + Conduit-ingested asset feeds,
    surface "toxic combinations" via a graph-traversal endpoint.

  ### 3. UDM-style normalization (from Chronicle)
  - Chronicle's edge: every event from every source gets mapped to a
    Unified Data Model with consistent fields (`principal.user`,
    `target.host`, `metadata.event_type`). Detections work across all
    sources because they run on UDM.
  - **Take it**: define a `sentra_event` UDM v1 with: principal, target,
    network, file, action, severity, source_class. SIEM ingest webhook
    normalizes to this on the way in.

  ### 4. Story-builder workflow engine (from Tines + Splunk SOAR)
  - Tines models a playbook as a DAG of typed actions; each action has
    a deterministic input/output contract; formulas transform between them.
  - We already have an aegis SOAR builder. The pattern to add: every
    playbook step's IO is captured into proof_chain — the SOC analyst
    can replay any incident response with full attribution.

  ### 5. Detection rules with confidence + tiering (from MS Sentinel)
  - Sentinel rules carry severity AND confidence; high-conf high-sev
    auto-creates incidents, low-conf creates "events" that need analyst
    promotion.
  - **Take it**: detection rule schema gets `confidence` 0-100 and a
    `tier` (advisory | high-trust | guarded). High-trust auto-promotes,
    guarded routes through Guardian approval (same engine as Self-Model
    strategies).

  ### 6. Adversary tradecraft mapping (from CrowdStrike + MITRE ATT&CK)
  - Every detection should map to MITRE ATT&CK technique IDs so SOCs can
    reason about coverage, not just rules.
  - We already have `mitre_stage` on incidents. Extend to detections
    themselves and surface a coverage matrix.

  ---

  ## Where we beat the field

  1. **Cognitive feedback loop.** No SOC platform today has its detection
     tuning driven by an external AI cognition's reflexivity signals.
     With the engine, false-positive spikes emit signals → Self-Model
     proposes a confidence-floor adjustment → Guardian approves → rules
     auto-tune. That's a moat.

  2. **Proof-chain native.** Tines logs runs; Sentinel logs runs; nobody
     produces a *cryptographically chained* evidence record of every
     detection-to-response decision. We do.

  3. **Cross-product asset graph.** A Sentra-Conduit fusion gives us asset
     inventory from Conduit's data sync side feeding Sentra's threat graph.
     Vendors solve one or the other; we can solve both.

  ---

  ## What we will build (Sentra track)

  1. Detection-as-code: a Sigma-style rule loader that reads YAML files,
     evaluates against `sentra_event` UDM, emits alerts with rule
     provenance.
  2. UDM normalization on the SIEM webhook ingest path.
  3. Tenant-scoped asset+event+finding graph endpoint
     `GET /api/sentra/graph` returning toxic-combination findings.
  4. Detection runs emit `cognitive-reflexive` signals (detection.fp_spike,
     detection.coverage_gap, detection.true_positive_confirmed).
  5. Sentra landing page surfacing detection coverage + reflexive tuning
     activity, A11oy-governed.

  ---

  ## References (live URLs from search)

  - [Threat Graph | Falcon Platform | CrowdStrike](https://www.crowdstrike.com/en-us/platform/threat-graph/)
- [What Is CrowdStrike Falcon? A Complete Guide | Osmicro Networks](https://osmicro.com.au/insights/what-is-crowdstrike-falcon-the-ultimate-guide/)
- [Stop Cloud Breaches With Threat Graph Cloud-Powered Analytics](https://www.crowdstrike.com/en-us/blog/stopping-cloud-breaches-with-threat-graph/)
- [Building Custom KQL Analytics Rules in Sentinel – AzureTracks](https://azuretracks.com/2025/01/building-custom-kql-analytics-rules-in-sentinel/)
- [What Is Microsoft Sentinel? Architecture, Detection, and Security Operations Explained](https://wizardcyber.com/learning-hub/learning-post/what-is-microsoft-sentinel/)
- [SOC – Testing Microsoft Sentinel Analytic Rules At Scale](https://northwave-cybersecurity.com/threat-intel-research/soc-testing-microsoft-sentinel-analytic-rules-at-scale)
- [Sigma Rules: Your Guide to Threat Detection’s Open Standard - Panther | The Security Monitoring Platform for the Cloud](https://panther.com/blog/your-guide-to-the-sigma-rules-open-standard-for-threat-detection)
- [Detections | Panther Docs](https://docs.panther.com/detections)
- [Rules and Scheduled Rules | Panther Docs](https://docs.panther.com/detections/rules)
- [Essential Guide to No-Code Automation for Security Teams | Tines](https://www.tines.com/playbooks/no-code-automation-for-security-teams/)
- [Tines | Intelligent workflow platform](https://www.tines.com/)
- [Break away from legacy SOAR | Tines](https://www.tines.com/soar/)
- [Wiz Security Graph: How It Works, Benefits, Use Cases | Wiz](https://www.wiz.io/lp/wiz-security-graph)
- [Identify and prioritize security risks with Wiz Security Graph and Google Cloud | Cloud Architecture Center | Google Cloud Documentation](https://docs.cloud.google.com/architecture/partners/id-prioritize-security-risks-with-wiz)
- [At Wizdom 2025, Wiz Presents a Broader Vision of Cloud Security - Futurum](https://futurumgroup.com/insights/at-wizdom-2025-wiz-presents-a-broader-vision-of-cloud-security/)
