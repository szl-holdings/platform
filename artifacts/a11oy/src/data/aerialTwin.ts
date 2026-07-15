// AERIAL TWIN — Site-specific wireless digital-twin doctrine.
//
// Distillation of the public NVIDIA Aerial Digital Twin overview into a static
// doctrine surface for A11oy. Grounded in the public open-source leaders
// (Sionna / Sionna RT, OpenAirInterface, srsRAN, O-RAN Software Community,
// GNU Radio). Bound to the SZL verticals that can harness site-specific RF
// physics: Vessels (maritime), Terra (real estate), TENAX (cyber).
//
// All inputs are public documentation, official open-source repositories, or
// first-principle reconstructions. No leaked spectrum captures, no scraped
// proprietary scenes, no live emission. Adoption requires a TENAX approval
// workflow per the Glasswing doctrine.

export const AERIAL_TWIN_VERSION = '0.1.0-seed';

export const AERIAL_TWIN_TAGLINE =
  'Site-specific RF physics in a hash-linked twin. Defensive only, evidence-bound, public-input only.';

// ---------------------------------------------------------------------------
// 1. PRIMITIVES — what an Aerial-class digital twin is made of.
// ---------------------------------------------------------------------------

export type PrimitiveId =
  | 'differentiable-ray-tracing'
  | 'scene-mesh'
  | 'channel-impulse-response'
  | 'ru-du-cu-emulation'
  | 'ric-closed-loop'
  | 'ai-ran-inference';

export interface Primitive {
  id: PrimitiveId;
  name: string;
  oneLine: string;
  detail: string;
  groundedIn: string;
}

export const PRIMITIVES: readonly Primitive[] = [
  {
    id: 'differentiable-ray-tracing',
    name: 'Differentiable ray tracing',
    oneLine:
      'Trace radio rays through a 3D scene with gradients that flow back to scene parameters. The twin becomes trainable.',
    detail:
      'Radio propagation is modelled as rays interacting with surfaces (reflection, diffraction, scattering). Because the trace is differentiable, ML models for beam prediction, channel estimation, and codebook design can be trained directly against site-specific physics rather than statistical approximations.',
    groundedIn:
      'NVIDIA Sionna RT (Apache-2.0) — open-source, GPU-accelerated, JAX/TensorFlow backends.',
  },
  {
    id: 'scene-mesh',
    name: 'Site-specific scene mesh',
    oneLine:
      'Real geography, buildings, and material properties expressed as an OpenUSD scene. The twin matches the world.',
    detail:
      'Each scene is a triangle mesh with per-surface electromagnetic material properties (relative permittivity, conductivity). Sourced from public OSM / lidar / cadastral data plus material catalogues; never from scraped proprietary scans.',
    groundedIn:
      'OpenUSD (Apache-2.0), public Sionna scene catalogue, OSM Buildings, ITU-R material recommendations.',
  },
  {
    id: 'channel-impulse-response',
    name: 'Channel impulse response generation',
    oneLine:
      'For any (transmitter, receiver) pair in the scene, the twin yields a per-tap CIR. Feeds every downstream radio model.',
    detail:
      'CIRs are synthesised by tracing rays per subcarrier, then summing complex-amplitude contributions. Output is a (tx, rx, time, frequency) tensor consumable by physical-layer simulators or ML training pipelines.',
    groundedIn: 'Sionna PHY layer; 3GPP TR 38.901 statistical baseline for sanity comparison.',
  },
  {
    id: 'ru-du-cu-emulation',
    name: 'End-to-end RU / DU / CU emulation',
    oneLine:
      'Radio Unit + Distributed Unit + Centralised Unit run as software stacks against the twin\u2019s CIRs. Test the whole RAN before touching real spectrum.',
    detail:
      'Open RAN splits the base station into RU (radio), DU (real-time PHY/MAC), and CU (RRC/PDCP). Wiring an open-source DU/CU (OpenAirInterface or srsRAN) to the twin\u2019s CIR feed produces a closed software-only test bed.',
    groundedIn:
      'OpenAirInterface (Apache-2.0); srsRAN Project (AGPL-3.0); O-RAN Alliance specifications.',
  },
  {
    id: 'ric-closed-loop',
    name: 'RIC closed-loop integration',
    oneLine:
      'xApps and rApps see the twin via E2/A1/O1 the same way they see real RAN. Train the controller in twin, ship the policy to production.',
    detail:
      'The RAN Intelligent Controller (Near-RT and Non-RT) consumes E2 telemetry and emits policy. Pointing the RIC at a twin lets ML xApps train safely; once approved, the same xApp can be promoted against the real network.',
    groundedIn: 'O-RAN Software Community (Apache-2.0): ric-plt, dms, smo subprojects.',
  },
  {
    id: 'ai-ran-inference',
    name: 'AI-RAN inference path',
    oneLine:
      'CUDA-accelerated PHY layer where ML models replace classical signal-processing blocks. The twin produces the training data; the runtime serves inference.',
    detail:
      'Frontier work in beam management, channel decoding, and link adaptation replaces hand-tuned blocks with neural networks. The twin is the only practical source of site-specific labelled data at scale.',
    groundedIn:
      'NVIDIA Aerial CUDA-Accelerated RAN public material; Sionna PHY layer for ML-friendly differentiable blocks.',
  },
];

// ---------------------------------------------------------------------------
// 2. OPEN-SOURCE LEADERS — the GitHub anchors we ground on.
// ---------------------------------------------------------------------------

export type LeaderLicense = 'Apache-2.0' | 'MIT' | 'AGPL-3.0' | 'GPL-3.0' | 'BSD-3-Clause';

export type LeaderId =
  | 'sionna'
  | 'sionna-rt'
  | 'openairinterface'
  | 'srsran'
  | 'o-ran-sc'
  | 'gnu-radio';

export interface OpenSourceLeader {
  id: LeaderId;
  name: string;
  org: string;
  url: string;
  license: LeaderLicense;
  oneLine: string;
  primitive: PrimitiveId;
  distillation: string;
}

export const OPEN_SOURCE_LEADERS: readonly OpenSourceLeader[] = [
  {
    id: 'sionna',
    name: 'Sionna',
    org: 'NVlabs',
    url: 'https://github.com/NVlabs/sionna',
    license: 'Apache-2.0',
    oneLine:
      'GPU-accelerated, fully differentiable PHY-layer simulator. The reference open implementation of an AI-friendly radio stack.',
    primitive: 'channel-impulse-response',
    distillation:
      'Studied with-knowledge-of for the differentiable PHY blocks (LDPC decoders, channel estimators, MIMO detectors). Reimplemented patterns drive the A11oy radio-eval harness.',
  },
  {
    id: 'sionna-rt',
    name: 'Sionna RT',
    org: 'NVlabs',
    url: 'https://github.com/NVlabs/sionna-rt',
    license: 'Apache-2.0',
    oneLine:
      'Differentiable ray tracer for radio propagation. The kernel that turns a 3D scene into trainable channel data.',
    primitive: 'differentiable-ray-tracing',
    distillation:
      'The ray-trace + per-surface gradient flow is the keystone primitive. TENAX wraps it as a sandboxed twin engine; A11oy planner submits jobs against it.',
  },
  {
    id: 'openairinterface',
    name: 'OpenAirInterface 5G',
    org: 'OAI Software Alliance',
    url: 'https://gitlab.eurecom.fr/oai/openairinterface5g',
    license: 'Apache-2.0',
    oneLine:
      'Open-source 5G NR stack: gNB (RU/DU/CU), UE, core. The default software RAN we wire to the twin.',
    primitive: 'ru-du-cu-emulation',
    distillation:
      'Used as the open RAN reference behind the twin\u2019s CIR feed. Adoption pattern: pin a tagged release, vendor any patches via the Hephaestus provenance gate.',
  },
  {
    id: 'srsran',
    name: 'srsRAN Project',
    org: 'Software Radio Systems',
    url: 'https://github.com/srsran/srsRAN_Project',
    license: 'AGPL-3.0',
    oneLine:
      'Production-grade open 5G RAN. Alternative DU/CU when AGPL is acceptable to the customer.',
    primitive: 'ru-du-cu-emulation',
    distillation:
      'Studied for its disciplined real-time PHY/MAC design. AGPL means it lives behind a clean network-service boundary, never linked into closed-source binaries.',
  },
  {
    id: 'o-ran-sc',
    name: 'O-RAN Software Community',
    org: 'O-RAN Alliance / Linux Foundation',
    url: 'https://github.com/o-ran-sc',
    license: 'Apache-2.0',
    oneLine:
      'Reference implementations of the RIC (Near-RT, Non-RT), SMO, and E2/A1/O1 interfaces. The control plane the twin plugs into.',
    primitive: 'ric-closed-loop',
    distillation:
      'The xApp / rApp registration model is mirrored in the A11oy capability registry. Every twin-trained xApp passes a Mirror Eval gate before promotion.',
  },
  {
    id: 'gnu-radio',
    name: 'GNU Radio',
    org: 'GNU Radio Project',
    url: 'https://github.com/gnuradio/gnuradio',
    license: 'GPL-3.0',
    oneLine:
      'Software-defined radio toolkit. The reference for signal-processing flowgraphs and the bridge to USRP / SDR hardware in lab settings.',
    primitive: 'ai-ran-inference',
    distillation:
      'GPL-3.0 means lab-only use behind a service boundary. Used to validate the twin\u2019s CIR output against captured real-world signals on owned hardware.',
  },
];

// ---------------------------------------------------------------------------
// 3. VERTICAL BINDINGS — which SZL products harness the twin and how.
// ---------------------------------------------------------------------------

export type VerticalId = 'vessels' | 'terra' | 'tenax';

export interface VerticalBinding {
  id: VerticalId;
  vertical: string;
  context: string;
  useCases: readonly string[];
  twinOutput: string;
  guardrail: string;
}

export const VERTICAL_BINDINGS: readonly VerticalBinding[] = [
  {
    id: 'vessels',
    vertical: 'Vessels \u2014 Maritime Intelligence',
    context:
      'Vessels already carries port asset registries, AIS feeds, and weather/sea-state context. A site-specific RF twin layered on top turns coastal connectivity into a first-class operations surface.',
    useCases: [
      'Port 5G coverage planning across berths, cranes, and approach lanes.',
      'Vessel-to-shore link budget under sea state, rain, and ducting conditions.',
      'Defensive RF anomaly modelling: GPS spoofing and AIS jamming scenarios run in twin only.',
      'Shore-station beam-forming optimisation against scheduled vessel arrivals.',
    ],
    twinOutput:
      'Per-berth coverage heatmap, per-route link-budget timeline, per-anomaly playback record bound to the Vessels asset registry.',
    guardrail:
      'Twin reads cadastral / hydrographic data only. No live transmission, no scraped vessel-side captures. RF anomaly playback is sandboxed and approval-gated.',
  },
  {
    id: 'terra',
    vertical: 'Terra \u2014 Real Estate Intelligence',
    context:
      'Terra holds the building, parcel, and material context for every property in scope. A site-specific RF twin gives owners and tenants a defensible coverage attestation per asset.',
    useCases: [
      'In-building 5G / WiFi coverage prediction before installation.',
      'mmWave shadowing analysis for class-A office and data-centre tenants.',
      'IoT placement optimisation (BLE, LoRaWAN, Zigbee) against the building mesh.',
      'Pre-leasing connectivity attestation as a marketing artefact.',
    ],
    twinOutput:
      'Per-floor coverage map, per-tenant connectivity score with confidence interval, attestation PDF bound to the Terra parcel ID and the scene hash.',
    guardrail:
      'Scene meshes derived from public cadastral data plus owner-provided floor plans. Owner-provided geometry never re-shared across tenants.',
  },
  {
    id: 'tenax',
    vertical: 'TENAX \u2014 Cyber Resilience Command (ex-Sentra \u2014 organ retired 2026-07)',
    context:
      'TENAX already operates the EDR mesh, SIEM connectors, and Approval Queue. A site-specific RF twin lets TENAX reason about the RF surface as a first-class asset class.',
    useCases: [
      'Rogue base station detection: compare twin-predicted signal envelope to real-world spectrum captures.',
      'IMSI catcher fingerprinting in a known scene context.',
      'Defensive jamming-resilience scoring per critical site.',
      'RF threat-emulation library run inside the twin for tabletop exercises.',
    ],
    twinOutput:
      'RF risk score per site, anomaly playback timeline, twin-vs-reality delta report committed to the Cerberus evidence vault.',
    guardrail:
      'Twin never emits. Spectrum captures are licensed or owner-owned only; never sourced from third-party scraping. All RF threat scenarios are sandboxed in twin.',
  },
];

// ---------------------------------------------------------------------------
// 4. INNOVATION SEEDS — what we add that is not in the upstream brief.
// ---------------------------------------------------------------------------

export type SeedStatus = 'observed' | 'distilled' | 'adoptable' | 'piloted';

export interface InnovationSeed {
  id: string;
  name: string;
  oneLine: string;
  novelty: string;
  status: SeedStatus;
  module: string;
}

export const INNOVATION_SEEDS: readonly InnovationSeed[] = [
  {
    id: 'federated-rf-ledger',
    name: 'Federated RF episode ledger',
    oneLine:
      'Tenants opt in to share aggregated channel statistics, never raw captures. Contributions earn Defender Credits.',
    novelty:
      'The upstream brief is single-tenant. Our federated layer pools CIR distributions across consenting customers without ever moving raw spectrum or scene geometry off-tenant.',
    status: 'distilled',
    module: 'A11oy Federation + Defender Credits',
  },
  {
    id: 'evidence-bound-xapp-registry',
    name: 'Evidence-bound xApp registry',
    oneLine:
      'Every RIC xApp is registered with a hash-linked manifest, training-data lineage, and a Mirror Eval pass before promotion.',
    novelty:
      'Standard O-RAN SC ships the registration mechanic. We add the Cerberus-anchored manifest and the gated promotion path so a twin-trained xApp cannot quietly land in production.',
    status: 'adoptable',
    module: 'A11oy Capability Registry + Cerberus + Mirror Eval',
  },
  {
    id: 'planner-over-ran-graph',
    name: 'A11oy planner over the RAN policy graph',
    oneLine:
      'Natural-language ops directives decompose into typed RIC actions. Same Hatun Layer pattern as the patch loop.',
    novelty:
      'Brings the A11oy planner discipline (typed plans, Constitution admission, dual-key approval) to a domain where most automation today is bash and Helm.',
    status: 'distilled',
    module: 'A11oy Planner + TENAX Policy Engine',
  },
  {
    id: 'defensive-rf-redteam',
    name: 'Defensive RF red-team in twin',
    oneLine:
      'Jamming, spoofing, and rogue-cell scenarios run in the twin only. Outcomes feed the TENAX Risk Engine.',
    novelty:
      'The frontier red-teaming pattern from the Hatun Layer transposed onto the RF surface. No live spectrum is ever touched.',
    status: 'observed',
    module: 'TENAX Sandbox + Adversarial Resilience',
  },
  {
    id: 'coverage-attestation',
    name: 'Site-specific coverage attestation',
    oneLine:
      'Combine Terra / Vessels asset registry + twin output + TENAX risk engine into a signed coverage report.',
    novelty:
      'Cross-product surface that turns a transient simulation result into a durable, signed artefact bound to a parcel or vessel ID.',
    status: 'adoptable',
    module: 'Terra + Vessels + Cerberus Evidence Vault',
  },
];

// ---------------------------------------------------------------------------
// 5. PHASED ROADMAP
// ---------------------------------------------------------------------------

export type RoadmapPhase = '0\u20136' | '7\u201312' | '13\u201324';

export interface RoadmapMilestone {
  id: string;
  phase: RoadmapPhase;
  title: string;
  detail: string;
  module: string;
}

export const ROADMAP: readonly RoadmapMilestone[] = [
  {
    id: 'phase1-doctrine',
    phase: '0\u20136',
    title: 'Aerial Twin doctrine surface live in A11oy',
    detail:
      'This page \u2014 typed primitives, OSS leader catalogue, vertical bindings, innovation seeds, and the guardrail stack \u2014 published and Constitution-bound.',
    module: 'A11oy Doctrine Surface',
  },
  {
    id: 'phase1-sionna-eval',
    phase: '0\u20136',
    title: 'Sionna RT evaluation harness',
    detail:
      'Stand up a sandboxed twin engine wrapping Sionna RT against a single public scene catalogue entry. Output CIRs reproducible across runs.',
    module: 'A11oy Mirror Eval + TENAX Sandbox',
  },
  {
    id: 'phase1-vessels-port',
    phase: '0\u20136',
    title: 'Vessels port-coverage demo',
    detail:
      'One reference port with a public mesh. Coverage heatmap and link-budget timeline rendered in the Vessels surface, signed and bound to the asset registry.',
    module: 'Vessels + Aerial Twin Engine',
  },
  {
    id: 'phase2-terra-building',
    phase: '7\u201312',
    title: 'Terra in-building twin',
    detail:
      'Single-floor mmWave coverage twin for a reference asset, with owner-provided geometry and a signed pre-leasing attestation.',
    module: 'Terra + Aerial Twin Engine + Cerberus',
  },
  {
    id: 'phase2-tenax-anomaly',
    phase: '7\u201312',
    title: 'TENAX RF anomaly classifier',
    detail:
      'Train an anomaly classifier on twin-vs-reality deltas. Promote via Mirror Eval. Findings flow into the existing Approval Queue.',
    module: 'TENAX Risk Engine + Silver RL Planner',
  },
  {
    id: 'phase2-federated-ledger',
    phase: '7\u201312',
    title: 'Federated RF episode ledger v1',
    detail:
      'Aggregated CIR statistics pooled across consenting tenants. Raw geometry and captures stay on-tenant. Contributions earn Defender Credits.',
    module: 'A11oy Federation + Defender Credits',
  },
  {
    id: 'phase3-ric-binding',
    phase: '13\u201324',
    title: 'O-RAN SC RIC binding',
    detail:
      'Twin and real RAN expose the same E2/A1/O1 interface to A11oy-managed xApps. Promotion path is twin \u2192 staging \u2192 prod with dual-key approval.',
    module: 'A11oy Capability Registry + O-RAN SC',
  },
  {
    id: 'phase3-ai-ran',
    phase: '13\u201324',
    title: 'AI-RAN inference path',
    detail:
      'Twin-trained ML blocks (beam prediction, channel estimation) served via a CUDA-accelerated runtime behind the connector firewall.',
    module: 'A11oy Model Router + TENAX Connector Firewall',
  },
  {
    id: 'phase3-attestation-soc2',
    phase: '13\u201324',
    title: 'Coverage attestation as SOC2 artefact',
    detail:
      'Signed coverage attestations cross-referenced into the SOC2 Type II control surface as evidence of connectivity controls.',
    module: 'TENAX Compliance Engine + Cerberus',
  },
];

// ---------------------------------------------------------------------------
// 6. GUARDRAILS — defensive rails specific to the RF / twin surface.
// ---------------------------------------------------------------------------

export interface Guardrail {
  layer: string;
  control: string;
  enforcedBy: string;
}

export const GUARDRAILS: readonly Guardrail[] = [
  {
    layer: 'Inputs',
    control:
      'Public cadastral / lidar / OSM data plus owner-provided geometry only. No scraped proprietary scenes.',
    enforcedBy: 'A11oy ingestion gate + Hephaestus provenance attestation per scene.',
  },
  {
    layer: 'Emission',
    control:
      'The twin reads. The twin never transmits. No active probing of real spectrum from any twin path.',
    enforcedBy:
      'TENAX connector firewall + capability compartment that strips egress to RF hardware.',
  },
  {
    layer: 'Tenant scope',
    control:
      'Owner-provided geometry and tenant-specific captures stay on-tenant. Federated layer pools statistics only.',
    enforcedBy: 'A11oy federation contract + Cerberus per-tenant evidence partition.',
  },
  {
    layer: 'Closed-loop approval',
    control:
      'Any RIC xApp promotion against real spectrum requires dual-key approval and a 24h staging soak.',
    enforcedBy: 'TENAX Approval Queue + Constitution rule engine.',
  },
  {
    layer: 'Provenance',
    control:
      'Scene hash, ruleset version, tool versions, and operator identity captured per twin episode.',
    enforcedBy: 'Hephaestus provenance gate + Cerberus append-only ledger.',
  },
];

// ---------------------------------------------------------------------------
// 7. CITATIONS
// ---------------------------------------------------------------------------

export const AERIAL_TWIN_CITATIONS: ReadonlyArray<{ tag: string; source: string }> = [
  {
    tag: 'NVIDIA-Aerial-DT',
    source:
      'NVIDIA Aerial Digital Twin overview \u2014 docs.nvidia.com/aerial/aerial-dt/text/overview.html.',
  },
  {
    tag: 'Sionna',
    source:
      'Sionna \u2014 An Open-Source Library for Next-Generation Physical-Layer Research, NVlabs (Apache-2.0).',
  },
  {
    tag: 'Sionna-RT',
    source:
      'Sionna RT \u2014 Differentiable ray tracer for radio propagation, NVlabs (Apache-2.0).',
  },
  { tag: 'OAI', source: 'OpenAirInterface 5G \u2014 OAI Software Alliance (Apache-2.0).' },
  { tag: 'srsRAN', source: 'srsRAN Project \u2014 Software Radio Systems (AGPL-3.0).' },
  {
    tag: 'O-RAN-SC',
    source: 'O-RAN Software Community \u2014 Linux Foundation / O-RAN Alliance (Apache-2.0).',
  },
  { tag: 'GNURadio', source: 'GNU Radio \u2014 Software-defined radio toolkit (GPL-3.0).' },
  {
    tag: '3GPP-38901',
    source: '3GPP TR 38.901 \u2014 Study on channel model for frequencies from 0.5 to 100 GHz.',
  },
  {
    tag: 'OpenUSD',
    source: 'OpenUSD \u2014 Universal Scene Description, Pixar / AOUSD (Apache-2.0).',
  },
  {
    tag: 'ITU-R-P-2040',
    source:
      'ITU-R P.2040 \u2014 Effects of building materials and structures on radiowave propagation.',
  },
];
