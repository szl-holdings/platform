export type ProjectStatus = "research" | "development" | "testing" | "deployed";
export type InsightCategory = "success" | "warning" | "trend" | "discovery";

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  domain: string;
  team: TeamMember[];
  accuracy: number;
  loss: number;
  inferenceTime: number;
  startDate: string;
  lastUpdated: string;
  experimentIds: string[];
  modelIds: string[];
  progress: number;
}

export interface ExperimentMetric {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
  valAccuracy: number;
}

export interface Experiment {
  id: string;
  projectId: string;
  name: string;
  hypothesis: string;
  results: string;
  status: "running" | "completed" | "failed" | "queued";
  metrics: ExperimentMetric[];
  hyperparameters: Record<string, string | number | boolean>;
  startDate: string;
  endDate: string | null;
  duration: string;
}

export interface Model {
  id: string;
  name: string;
  architecture: string;
  version: string;
  projectId: string;
  accuracy: number;
  speed: number;
  cost: number;
  robustness: number;
  interpretability: number;
  parameters: string;
  trainingData: string;
  status: "production" | "staging" | "archived" | "training";
  lastTrained: string;
  performanceHistory: { date: string; accuracy: number; latency: number }[];
}

export interface Insight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  sourceExperiment: string;
  confidence: number;
  date: string;
  impact: "high" | "medium" | "low";
}

export const projects: Project[] = [
  {
    id: "proj-001",
    name: "TITAN LLM Foundation",
    description: "Large language model research program exploring transformer scaling laws, mixture-of-experts architectures, and RLHF alignment. Targets MMLU 90+ and HumanEval 85+ benchmarks. Aligned with US National AI Initiative goals for safe, trustworthy AI.",
    status: "deployed",
    domain: "Large Language Models",
    team: [
      { name: "Dr. Elena Vasquez", role: "Lead Researcher — Alignment", avatar: "EV" },
      { name: "Marcus Chen", role: "Distributed Systems Engineer", avatar: "MC" },
      { name: "Priya Sharma", role: "RLHF Specialist", avatar: "PS" },
      { name: "Dr. James Okonkwo", role: "Scaling Laws Researcher", avatar: "JO" },
    ],
    accuracy: 91.8,
    loss: 0.067,
    inferenceTime: 42,
    startDate: "2025-03-15",
    lastUpdated: "2026-03-26",
    experimentIds: ["exp-001", "exp-002", "exp-003"],
    modelIds: ["mod-001"],
    progress: 100,
  },
  {
    id: "proj-002",
    name: "AEGIS Autonomous Navigation",
    description: "Autonomous systems perception and planning for unstructured environments — inspired by SpaceX Starship landing autonomy and Tesla FSD architecture. Combines LiDAR-camera fusion with world model prediction for real-time decision-making at 30Hz.",
    status: "testing",
    domain: "Autonomous Systems",
    team: [
      { name: "Dr. Sarah Mitchell", role: "Principal Scientist — Perception", avatar: "SM" },
      { name: "Raj Patel", role: "Robotics & Planning Lead", avatar: "RP" },
      { name: "Lisa Wang", role: "Sensor Fusion Engineer", avatar: "LW" },
      { name: "Kai Hoffman", role: "Sim-to-Real Transfer", avatar: "KH" },
    ],
    accuracy: 94.3,
    loss: 0.089,
    inferenceTime: 33,
    startDate: "2025-06-01",
    lastUpdated: "2026-03-24",
    experimentIds: ["exp-004", "exp-005", "exp-006"],
    modelIds: ["mod-002"],
    progress: 82,
  },
  {
    id: "proj-003",
    name: "HELIX Drug Discovery Engine",
    description: "AI-accelerated drug discovery combining protein structure prediction (AlphaFold-class), molecular generation with diffusion models, and binding affinity scoring using GNNs on molecular graphs. Partnership with NIH NCATS translational science program.",
    status: "development",
    domain: "Drug Discovery",
    team: [
      { name: "Dr. Aisha Nkemelu", role: "Computational Biology Lead", avatar: "AN" },
      { name: "Patrick Sullivan", role: "Molecular Dynamics Engineer", avatar: "PS2" },
      { name: "Dr. Hannah Lee", role: "Protein Folding Specialist", avatar: "HL" },
    ],
    accuracy: 84.7,
    loss: 0.198,
    inferenceTime: 85,
    startDate: "2025-09-10",
    lastUpdated: "2026-03-25",
    experimentIds: ["exp-007", "exp-008", "exp-009"],
    modelIds: ["mod-003"],
    progress: 55,
  },
  {
    id: "proj-004",
    name: "SENTINEL Cyber Threat Intelligence",
    description: "Zero-day threat detection and adversarial network analysis using graph neural networks over network flow telemetry. Real-time streaming anomaly detection with <25ms latency. Supports CISA's Joint Cyber Defense Collaborative threat-sharing framework.",
    status: "deployed",
    domain: "Cybersecurity AI",
    team: [
      { name: "Dr. Omar Hassan", role: "Adversarial ML Lead", avatar: "OH" },
      { name: "Yuki Tanaka", role: "Threat Intelligence Engineer", avatar: "YT" },
      { name: "Chris Adler", role: "MLSecOps Engineer", avatar: "CA" },
    ],
    accuracy: 97.2,
    loss: 0.041,
    inferenceTime: 6,
    startDate: "2025-01-20",
    lastUpdated: "2026-03-27",
    experimentIds: ["exp-010", "exp-011", "exp-012"],
    modelIds: ["mod-004"],
    progress: 100,
  },
  {
    id: "proj-005",
    name: "GAIA Climate Modeling System",
    description: "High-resolution climate simulation using neural operators (FourCastNet-class) for 6-hour to 10-day weather forecasting at 0.25° resolution. Evaluating against ERA5 reanalysis and ECMWF IFS baselines. Contributes to NASA Earth Science AI initiative.",
    status: "research",
    domain: "Climate Science",
    team: [
      { name: "Dr. Maya Rodriguez", role: "Climate ML Lead", avatar: "MR" },
      { name: "Alex Kim", role: "Neural Operator Researcher", avatar: "AK" },
      { name: "Dr. Leo Zhang", role: "Atmospheric Science Advisor", avatar: "LZ" },
    ],
    accuracy: 79.6,
    loss: 0.287,
    inferenceTime: 180,
    startDate: "2026-01-08",
    lastUpdated: "2026-03-26",
    experimentIds: ["exp-013", "exp-014"],
    modelIds: ["mod-005"],
    progress: 28,
  },
  {
    id: "proj-006",
    name: "NEXUS Multimodal Reasoning",
    description: "Vision-language model with chain-of-thought reasoning across text, images, and structured data. Targets MMMU 75+ and MathVista 65+ benchmarks. Architecture inspired by Flamingo/Gemini cross-attention approaches with constitutional AI safety guardrails.",
    status: "development",
    domain: "Multimodal AI",
    team: [
      { name: "Dr. Fiona Campbell", role: "Multimodal Research Lead", avatar: "FC" },
      { name: "Tobias Mueller", role: "Vision-Language Engineer", avatar: "TM" },
      { name: "Nina Ivanova", role: "Safety & Alignment Researcher", avatar: "NI" },
    ],
    accuracy: 88.2,
    loss: 0.156,
    inferenceTime: 65,
    startDate: "2025-08-15",
    lastUpdated: "2026-03-23",
    experimentIds: ["exp-015", "exp-016"],
    modelIds: ["mod-006"],
    progress: 62,
  },
  {
    id: "proj-007",
    name: "QUBIT Reinforcement Learning",
    description: "Multi-agent reinforcement learning for robotic manipulation and strategic planning. Uses PPO and decision transformer architectures with sim-to-real transfer. Performance benchmarked against Meta-World, RLBench, and MuJoCo continuous control suites.",
    status: "testing",
    domain: "Reinforcement Learning",
    team: [
      { name: "Dr. Ryan Torres", role: "RL Systems Lead", avatar: "RT" },
      { name: "Emma Larsson", role: "Robotics Simulation Engineer", avatar: "EL" },
    ],
    accuracy: 92.1,
    loss: 0.102,
    inferenceTime: 15,
    startDate: "2025-10-05",
    lastUpdated: "2026-03-22",
    experimentIds: ["exp-017", "exp-018", "exp-019"],
    modelIds: ["mod-007"],
    progress: 78,
  },
  {
    id: "proj-008",
    name: "CORTEX Computer Vision",
    description: "State-of-the-art object detection and segmentation for satellite imagery analysis and defense ISR applications. Combines DINOv2 self-supervised features with Segment Anything architecture. Evaluated on DOTA, xView, and custom orbital imagery datasets.",
    status: "testing",
    domain: "Computer Vision",
    team: [
      { name: "Dr. James Park", role: "Principal Scientist — Vision", avatar: "JP" },
      { name: "Zara Osei", role: "Remote Sensing ML Lead", avatar: "ZO" },
      { name: "Mia Johnson", role: "Geospatial Data Engineer", avatar: "MJ" },
    ],
    accuracy: 93.8,
    loss: 0.084,
    inferenceTime: 22,
    startDate: "2025-07-22",
    lastUpdated: "2026-03-24",
    experimentIds: ["exp-020", "exp-021"],
    modelIds: ["mod-008"],
    progress: 75,
  },
  {
    id: "proj-009",
    name: "ORACLE Knowledge Graph",
    description: "Enterprise knowledge graph construction using relation extraction transformers and neuro-symbolic reasoning. Integrates with EU AI Act compliance workflows for explainable decision-making. Targets 90%+ relation F1 on TACRED and DocRED benchmarks.",
    status: "development",
    domain: "Knowledge Engineering",
    team: [
      { name: "Dr. Anna Kowalski", role: "Knowledge Systems Lead", avatar: "AK2" },
      { name: "David Okonjo", role: "Graph Database Engineer", avatar: "DO" },
    ],
    accuracy: 86.4,
    loss: 0.172,
    inferenceTime: 48,
    startDate: "2025-11-01",
    lastUpdated: "2026-03-20",
    experimentIds: ["exp-022", "exp-023"],
    modelIds: ["mod-009"],
    progress: 45,
  },
  {
    id: "proj-010",
    name: "FORGE Edge Deployment",
    description: "Neural network compression and optimization for edge/on-device inference — quantization (GPTQ, AWQ), pruning, and neural architecture search targeting NVIDIA Jetson, Apple Neural Engine, and Qualcomm Hexagon DSP. Supports China's New Generation AI Plan edge-AI compute goals.",
    status: "deployed",
    domain: "MLOps & Edge AI",
    team: [
      { name: "Dr. Leo Zhang", role: "Quantization Research Lead", avatar: "LZ2" },
      { name: "Zara Osei", role: "Hardware ML Architect", avatar: "ZO2" },
    ],
    accuracy: 94.8,
    loss: 0.072,
    inferenceTime: 3,
    startDate: "2025-04-10",
    lastUpdated: "2026-03-21",
    experimentIds: ["exp-024", "exp-025"],
    modelIds: ["mod-010"],
    progress: 100,
  },
];

export const experiments: Experiment[] = [
  {
    id: "exp-001", projectId: "proj-001", name: "RLHF PPO Alignment — 13B",
    hypothesis: "Proximal Policy Optimization with reward model trained on 100K human preference comparisons will improve MMLU score from 82 to 88+ on the 13B parameter model.",
    results: "MMLU improved from 82.1 to 89.4. TruthfulQA score increased 18%. Constitutional AI guardrails reduced harmful outputs by 94%. Training stable across 3 PPO iterations.",
    status: "completed",
    metrics: Array.from({ length: 20 }, (_, i) => ({ epoch: i + 1, loss: 0.85 - (0.75 * (1 - Math.exp(-i / 5))), accuracy: 65 + 26.8 * (1 - Math.exp(-i / 4)), valLoss: 0.9 - (0.72 * (1 - Math.exp(-i / 6))), valAccuracy: 63 + 25.4 * (1 - Math.exp(-i / 5)) })),
    hyperparameters: { learningRate: 1.41e-5, batchSize: 64, epochs: 20, ppoClipRange: 0.2, klPenalty: 0.02, rewardModelSize: "6B" },
    startDate: "2025-08-10", endDate: "2025-09-02", duration: "23d 8h",
  },
  {
    id: "exp-002", projectId: "proj-001", name: "MoE Scaling — 70B Sparse",
    hypothesis: "Mixture-of-Experts with 8 experts (top-2 routing) will achieve GPT-4-class performance on MMLU at 70B total params with only 12B active per token.",
    results: "MMLU 91.8 achieved (target was 90+). Expert load balancing loss critical — without it, 3 experts captured 80% of tokens. HumanEval 87.2. Inference cost 3.1x lower than dense equivalent.",
    status: "completed",
    metrics: Array.from({ length: 25 }, (_, i) => ({ epoch: i + 1, loss: 1.2 - (1.05 * (1 - Math.exp(-i / 6))), accuracy: 58 + 33.8 * (1 - Math.exp(-i / 5.5)), valLoss: 1.3 - (1.0 * (1 - Math.exp(-i / 7))), valAccuracy: 56 + 32 * (1 - Math.exp(-i / 6)) })),
    hyperparameters: { learningRate: 3e-5, batchSize: 512, epochs: 25, numExperts: 8, topK: 2, loadBalanceLoss: 0.01, totalParams: "70B", activeParams: "12B" },
    startDate: "2025-10-01", endDate: "2025-11-18", duration: "48d 12h",
  },
  {
    id: "exp-003", projectId: "proj-001", name: "DPO vs PPO Ablation",
    hypothesis: "Direct Preference Optimization will match PPO alignment quality while eliminating the reward model, reducing training compute by 40%.",
    results: "DPO achieves 96% of PPO alignment scores with 45% less compute. However, DPO shows slight degradation on out-of-distribution prompts. Recommend hybrid approach for production.",
    status: "completed",
    metrics: Array.from({ length: 12 }, (_, i) => ({ epoch: i + 1, loss: 0.7 - (0.58 * (1 - Math.exp(-i / 3))), accuracy: 70 + 22.1 * (1 - Math.exp(-i / 3)), valLoss: 0.75 - (0.55 * (1 - Math.exp(-i / 4))), valAccuracy: 68 + 20.8 * (1 - Math.exp(-i / 3.5)) })),
    hyperparameters: { learningRate: 5e-7, batchSize: 32, epochs: 12, beta: 0.1, referenceModelFreeze: true, labelSmoothing: 0.01 },
    startDate: "2026-01-05", endDate: "2026-01-20", duration: "15d 6h",
  },
  {
    id: "exp-004", projectId: "proj-002", name: "BEVFormer World Model",
    hypothesis: "Bird's-eye-view transformer with temporal aggregation will achieve nuScenes detection mAP >68% for 3D object detection from camera-only input at 30Hz.",
    results: "nuScenes mAP 69.4% achieved. Temporal fusion over 8 frames provides 7.2% improvement over single-frame. Runs at 28Hz on NVIDIA Orin — meets real-time constraint.",
    status: "completed",
    metrics: Array.from({ length: 30 }, (_, i) => ({ epoch: i + 1, loss: 1.4 - (1.2 * (1 - Math.exp(-i / 7))), accuracy: 48 + 46.3 * (1 - Math.exp(-i / 6)), valLoss: 1.5 - (1.15 * (1 - Math.exp(-i / 8))), valAccuracy: 45 + 44 * (1 - Math.exp(-i / 7)) })),
    hyperparameters: { learningRate: 2e-4, batchSize: 4, epochs: 30, numCameras: 6, bevResolution: "200x200", temporalFrames: 8, backbone: "ResNet-101" },
    startDate: "2025-09-15", endDate: "2025-11-02", duration: "48d 14h",
  },
  {
    id: "exp-005", projectId: "proj-002", name: "Occupancy Network Prediction",
    hypothesis: "3D occupancy prediction network will enable planning module to anticipate occluded obstacles 2 seconds ahead with >85% IoU.",
    results: "87.1% IoU on visible regions, 72.4% on occluded regions. Occupancy prediction enables 340ms earlier brake initiation in simulation. Safety margin improved 23%.",
    status: "completed",
    metrics: Array.from({ length: 20 }, (_, i) => ({ epoch: i + 1, loss: 1.1 - (0.9 * (1 - Math.exp(-i / 5))), accuracy: 55 + 37.1 * (1 - Math.exp(-i / 4.5)), valLoss: 1.2 - (0.85 * (1 - Math.exp(-i / 6))), valAccuracy: 52 + 35 * (1 - Math.exp(-i / 5)) })),
    hyperparameters: { learningRate: 1e-4, batchSize: 2, epochs: 20, voxelSize: "0.4m", predictionHorizon: "2.0s", occupancyGrid: "256x256x32" },
    startDate: "2025-12-10", endDate: "2026-01-15", duration: "36d 8h",
  },
  {
    id: "exp-006", projectId: "proj-002", name: "LiDAR-Camera Late Fusion v2",
    hypothesis: "Attention-based late fusion of LiDAR point clouds and camera features will reduce depth estimation RMSE by 18% vs camera-only.",
    results: "Running on 8xA100 cluster. Epoch 15/40 — depth RMSE reduced 14.2% so far. Point cloud transformer attention patterns learning spatial correspondence.",
    status: "running",
    metrics: Array.from({ length: 15 }, (_, i) => ({ epoch: i + 1, loss: 0.95 - (0.62 * (1 - Math.exp(-i / 5))), accuracy: 62 + 28 * (1 - Math.exp(-i / 4)), valLoss: 1.0 - (0.58 * (1 - Math.exp(-i / 6))), valAccuracy: 59 + 26 * (1 - Math.exp(-i / 5)) })),
    hyperparameters: { learningRate: 2e-4, batchSize: 2, epochs: 40, fusionMethod: "cross-attention", pointCloudEncoder: "PointPillars", imageEncoder: "EfficientNet-B5" },
    startDate: "2026-03-10", endDate: null, duration: "18d (running)",
  },
  {
    id: "exp-007", projectId: "proj-003", name: "ESM-2 Protein Embedding Transfer",
    hypothesis: "Fine-tuning Meta ESM-2 (650M params) on proprietary structural biology dataset will improve protein structure TM-score from 0.78 to 0.85+ on CASP15 targets.",
    results: "TM-score 0.83 achieved at epoch 12. Strong performance on CASP15 free-modeling targets not in AlphaFold training set. GDT-TS 82.4 on novel folds.",
    status: "running",
    metrics: Array.from({ length: 12 }, (_, i) => ({ epoch: i + 1, loss: 1.3 - (0.8 * (1 - Math.exp(-i / 4))), accuracy: 52 + 32.7 * (1 - Math.exp(-i / 3.5)), valLoss: 1.4 - (0.75 * (1 - Math.exp(-i / 5))), valAccuracy: 49 + 30 * (1 - Math.exp(-i / 4)) })),
    hyperparameters: { learningRate: 1e-5, batchSize: 2, epochs: 20, modelSize: "650M", maxSeqLen: 1024, lossFunction: "FAPE + pLDDT" },
    startDate: "2026-02-15", endDate: null, duration: "41d (running)",
  },
  {
    id: "exp-008", projectId: "proj-003", name: "Diffusion Molecular Generation",
    hypothesis: "3D equivariant diffusion model (EDM) will generate drug-like molecules with QED > 0.7 and valid binding poses for SARS-CoV-2 Mpro target.",
    results: "76.8% of generated molecules pass Lipinski filters. Average QED 0.72. Docking scores competitive with virtual screening baseline on Mpro. Synthesizability (SA score) needs improvement.",
    status: "completed",
    metrics: Array.from({ length: 15 }, (_, i) => ({ epoch: i + 1, loss: 1.5 - (1.1 * (1 - Math.exp(-i / 4.5))), accuracy: 42 + 42.7 * (1 - Math.exp(-i / 4)), valLoss: 1.6 - (1.0 * (1 - Math.exp(-i / 5.5))), valAccuracy: 39 + 40 * (1 - Math.exp(-i / 4.5)) })),
    hyperparameters: { learningRate: 1e-4, batchSize: 64, epochs: 15, diffusionSteps: 1000, noiseSchedule: "cosine", equivariance: "SE(3)", atomFeatures: 128 },
    startDate: "2025-11-20", endDate: "2025-12-18", duration: "28d 4h",
  },
  {
    id: "exp-009", projectId: "proj-003", name: "GNN Binding Affinity Scoring",
    hypothesis: "Message-passing GNN on molecular interaction graphs will predict binding affinity with Pearson R > 0.80 on PDBbind v2020 core set.",
    results: "Queued for GPU allocation. Will use ESM-2 protein embeddings as node features once exp-007 completes.",
    status: "queued",
    metrics: [],
    hyperparameters: { learningRate: 5e-4, batchSize: 32, epochs: 25, gnnLayers: 6, readout: "attention-weighted", edgeFeatures: "distance+angle" },
    startDate: "2026-04-01", endDate: null, duration: "Queued",
  },
  {
    id: "exp-010", projectId: "proj-004", name: "GNN Lateral Movement Detection",
    hypothesis: "Graph attention network over network flow graphs will detect lateral movement attack chains with 97%+ recall and <1% false positive rate.",
    results: "97.2% recall achieved with 0.8% FPR. GNN captures multi-hop attack patterns across subnets. Attention weights highlight critical network paths — useful for SOC analysts.",
    status: "completed",
    metrics: Array.from({ length: 20 }, (_, i) => ({ epoch: i + 1, loss: 0.7 - (0.62 * (1 - Math.exp(-i / 5))), accuracy: 75 + 22.2 * (1 - Math.exp(-i / 4)), valLoss: 0.75 - (0.58 * (1 - Math.exp(-i / 6))), valAccuracy: 73 + 21 * (1 - Math.exp(-i / 5)) })),
    hyperparameters: { learningRate: 5e-4, batchSize: 128, epochs: 20, gatLayers: 4, heads: 8, aggregation: "multi-head-attention", dropout: 0.15 },
    startDate: "2025-04-01", endDate: "2025-05-12", duration: "41d 7h",
  },
  {
    id: "exp-011", projectId: "proj-004", name: "Online VAE Concept Drift",
    hypothesis: "Variational autoencoder with online learning will adapt to concept drift in network traffic within 15-minute windows while maintaining 96%+ detection rate.",
    results: "Adaptation window 11 minutes — exceeds target. Detection rate 97.1% sustained through 3 simulated drift events. Catastrophic forgetting mitigated via elastic weight consolidation.",
    status: "completed",
    metrics: Array.from({ length: 12 }, (_, i) => ({ epoch: i + 1, loss: 0.4 - (0.33 * (1 - Math.exp(-i / 3))), accuracy: 85 + 12.2 * (1 - Math.exp(-i / 2.5)), valLoss: 0.45 - (0.3 * (1 - Math.exp(-i / 4))), valAccuracy: 83 + 11 * (1 - Math.exp(-i / 3)) })),
    hyperparameters: { learningRate: "cosine-decay", batchSize: 256, epochs: 12, latentDim: 128, ewcLambda: 5000, windowSize: 900, updateFreq: 30 },
    startDate: "2025-07-10", endDate: "2025-07-28", duration: "18d 5h",
  },
  {
    id: "exp-012", projectId: "proj-004", name: "Adversarial Robustness Hardening",
    hypothesis: "Adversarial training with PGD attacks (epsilon=0.3) will improve model robustness to evasion attacks without >2% accuracy degradation.",
    results: "Robust accuracy improved from 71% to 89% under PGD-20. Clean accuracy dropped only 1.4%. Model now resistant to known evasion techniques cataloged in MITRE ATT&CK.",
    status: "completed",
    metrics: Array.from({ length: 10 }, (_, i) => ({ epoch: i + 1, loss: 0.55 - (0.4 * (1 - Math.exp(-i / 3))), accuracy: 80 + 17.2 * (1 - Math.exp(-i / 2.5)), valLoss: 0.6 - (0.37 * (1 - Math.exp(-i / 3.5))), valAccuracy: 78 + 15.5 * (1 - Math.exp(-i / 3)) })),
    hyperparameters: { learningRate: 1e-4, batchSize: 64, epochs: 10, pgdSteps: 20, pgdEpsilon: 0.3, pgdStepSize: 0.01, adversarialRatio: 0.5 },
    startDate: "2025-10-05", endDate: "2025-10-22", duration: "17d 3h",
  },
  {
    id: "exp-013", projectId: "proj-005", name: "FourCastNet Precipitation Forecast",
    hypothesis: "Adaptive Fourier Neural Operator (AFNO) trained on ERA5 reanalysis will achieve RMSE < 3.2 K for 5-day T850 forecast, competitive with ECMWF IFS.",
    results: "Running on TPU v4 pod. Current T850 RMSE 3.45 K at day 5 — approaching target. Precipitation forecast ACC 0.82 at 3-day lead. GPU-hours: 2,400 so far.",
    status: "running",
    metrics: Array.from({ length: 8 }, (_, i) => ({ epoch: i + 1, loss: 1.8 - (1.2 * (1 - Math.exp(-i / 4))), accuracy: 40 + 39.6 * (1 - Math.exp(-i / 3.5)), valLoss: 1.9 - (1.1 * (1 - Math.exp(-i / 5))), valAccuracy: 38 + 37 * (1 - Math.exp(-i / 4)) })),
    hyperparameters: { learningRate: 5e-4, batchSize: 1, epochs: 30, resolution: "0.25deg", afnoModes: 64, patchSize: 8, pressureLevels: 13 },
    startDate: "2026-02-20", endDate: null, duration: "36d (running)",
  },
  {
    id: "exp-014", projectId: "proj-005", name: "Graph Neural Weather — Mesh",
    hypothesis: "Multi-scale graph neural network on icosahedral mesh (GraphCast-style) will outperform AFNO on extreme weather events.",
    results: "Queued behind FourCastNet experiment. Icosahedral mesh preprocessing complete (6 resolution levels, 12 edges per node). Awaiting TPU allocation.",
    status: "queued",
    metrics: [],
    hyperparameters: { learningRate: 1e-4, batchSize: 1, epochs: 20, meshLevels: 6, messagePassingSteps: 16, encoderLayers: 4, processorLayers: 16 },
    startDate: "2026-04-10", endDate: null, duration: "Queued",
  },
  {
    id: "exp-015", projectId: "proj-006", name: "Cross-Attention VLM Training",
    hypothesis: "Perceiver-style cross-attention between frozen vision encoder (DINOv2 ViT-G) and 13B language model will achieve MMMU 72+ with only 2B trainable parameters.",
    results: "MMMU 74.3 achieved — exceeds target. Visual question answering accuracy 78.9%. Key insight: gradient checkpointing essential for fitting cross-attention in 80GB A100 memory.",
    status: "completed",
    metrics: Array.from({ length: 15 }, (_, i) => ({ epoch: i + 1, loss: 0.95 - (0.78 * (1 - Math.exp(-i / 4))), accuracy: 55 + 33.3 * (1 - Math.exp(-i / 3.5)), valLoss: 1.0 - (0.74 * (1 - Math.exp(-i / 5))), valAccuracy: 53 + 31 * (1 - Math.exp(-i / 4)) })),
    hyperparameters: { learningRate: 2e-5, batchSize: 8, epochs: 15, visionEncoder: "DINOv2-ViT-G", crossAttentionLayers: 32, trainableParams: "2.1B", totalParams: "15B" },
    startDate: "2025-11-10", endDate: "2025-12-20", duration: "40d 14h",
  },
  {
    id: "exp-016", projectId: "proj-006", name: "Constitutional AI Safety Layer",
    hypothesis: "Constitutional AI self-critique loop with 16 safety principles will reduce harmful multimodal outputs by 95% without >3% capability degradation on MMMU.",
    results: "Harmful output reduction: 97.2%. MMMU degradation: 1.8% (74.3 → 72.9). Safety layer adds 12ms latency. Passes EU AI Act Article 15 risk-assessment requirements for high-risk AI systems.",
    status: "completed",
    metrics: Array.from({ length: 8 }, (_, i) => ({ epoch: i + 1, loss: 0.6 - (0.42 * (1 - Math.exp(-i / 2.5))), accuracy: 72 + 16.2 * (1 - Math.exp(-i / 2.5)), valLoss: 0.65 - (0.38 * (1 - Math.exp(-i / 3))), valAccuracy: 70 + 15 * (1 - Math.exp(-i / 3)) })),
    hyperparameters: { learningRate: 1e-6, batchSize: 16, epochs: 8, safetyPrinciples: 16, critiqueIterations: 3, penaltyWeight: 0.15 },
    startDate: "2026-01-15", endDate: "2026-02-05", duration: "21d 3h",
  },
  {
    id: "exp-017", projectId: "proj-007", name: "PPO Multi-Agent Coordination",
    hypothesis: "Independent PPO with shared critic will achieve 85%+ success rate on cooperative multi-agent manipulation tasks in Meta-World MT10 benchmark.",
    results: "87.3% success rate on MT10. Shared critic provides 12% improvement over fully independent learning. Communication protocol emerges naturally between agents.",
    status: "completed",
    metrics: Array.from({ length: 15 }, (_, i) => ({ epoch: i + 1, loss: 0.8 - (0.62 * (1 - Math.exp(-i / 4))), accuracy: 60 + 32.1 * (1 - Math.exp(-i / 3.5)), valLoss: 0.85 - (0.58 * (1 - Math.exp(-i / 5))), valAccuracy: 57 + 30 * (1 - Math.exp(-i / 4)) })),
    hyperparameters: { learningRate: 3e-4, batchSize: 2048, epochs: 15, clipRange: 0.2, entropyCoef: 0.01, numAgents: 4, sharedCritic: true, gammma: 0.99 },
    startDate: "2025-11-20", endDate: "2025-12-28", duration: "38d 6h",
  },
  {
    id: "exp-018", projectId: "proj-007", name: "Decision Transformer Planning",
    hypothesis: "Offline RL via Decision Transformer on expert demonstrations will match online PPO performance with 10x fewer environment interactions.",
    results: "Achieves 94% of online PPO performance with 12x fewer interactions. Excellent for real-robot deployment where interactions are expensive. Sequence length 20 (context window) is optimal.",
    status: "completed",
    metrics: Array.from({ length: 12 }, (_, i) => ({ epoch: i + 1, loss: 0.5 - (0.38 * (1 - Math.exp(-i / 3.5))), accuracy: 72 + 20.1 * (1 - Math.exp(-i / 3)), valLoss: 0.55 - (0.35 * (1 - Math.exp(-i / 4))), valAccuracy: 70 + 18.5 * (1 - Math.exp(-i / 3.5)) })),
    hyperparameters: { learningRate: 1e-4, batchSize: 256, epochs: 12, contextLength: 20, nLayer: 6, nHead: 8, embedDim: 256, returnConditioning: 0.9 },
    startDate: "2026-01-10", endDate: "2026-01-30", duration: "20d 8h",
  },
  {
    id: "exp-019", projectId: "proj-007", name: "Sim-to-Real Domain Randomization",
    hypothesis: "Domain randomization with 50+ visual and physics perturbations will close sim-to-real gap to <8% success rate difference.",
    results: "Running sim-to-real transfer experiments. 45 randomization parameters active. Current sim-to-real gap: 9.2% — approaching target. Physical robot trials scheduled.",
    status: "running",
    metrics: Array.from({ length: 6 }, (_, i) => ({ epoch: i + 1, loss: 0.7 - (0.35 * (1 - Math.exp(-i / 3))), accuracy: 65 + 15 * (1 - Math.exp(-i / 2.5)), valLoss: 0.75 - (0.32 * (1 - Math.exp(-i / 3.5))), valAccuracy: 62 + 13 * (1 - Math.exp(-i / 3)) })),
    hyperparameters: { learningRate: 1e-4, batchSize: 512, epochs: 20, numRandomizations: 50, textureRandomize: true, physicsRandomize: true, lightingVariations: 12 },
    startDate: "2026-03-05", endDate: null, duration: "23d (running)",
  },
  {
    id: "exp-020", projectId: "proj-008", name: "DINOv2 SAM Satellite Detection",
    hypothesis: "DINOv2 self-supervised features combined with Segment Anything decoder will achieve 82+ mAP on DOTA v2 rotated object detection without labeled pretraining.",
    results: "mAP 84.1 on DOTA v2. Self-supervised features transfer remarkably well to satellite imagery. Rotated bbox regression benefits from oriented deformable attention.",
    status: "completed",
    metrics: Array.from({ length: 18 }, (_, i) => ({ epoch: i + 1, loss: 1.0 - (0.82 * (1 - Math.exp(-i / 5))), accuracy: 55 + 38.8 * (1 - Math.exp(-i / 4.5)), valLoss: 1.1 - (0.78 * (1 - Math.exp(-i / 6))), valAccuracy: 52 + 36 * (1 - Math.exp(-i / 5)) })),
    hyperparameters: { learningRate: 1e-4, batchSize: 4, epochs: 18, backbone: "DINOv2-ViT-L", decoder: "SAM-adapted", rotatedBbox: true, deformableAttention: true },
    startDate: "2025-10-01", endDate: "2025-11-08", duration: "38d 10h",
  },
  {
    id: "exp-021", projectId: "proj-008", name: "Change Detection Temporal Pairs",
    hypothesis: "Siamese network with temporal difference module will detect construction and terrain changes between satellite image pairs with IoU > 75%.",
    results: "IoU 78.3% on LEVIR-CD benchmark. False positive rate 4.2%. Performs well on urban construction change but struggles with seasonal vegetation variation.",
    status: "completed",
    metrics: Array.from({ length: 12 }, (_, i) => ({ epoch: i + 1, loss: 0.8 - (0.6 * (1 - Math.exp(-i / 3.5))), accuracy: 62 + 31.3 * (1 - Math.exp(-i / 3)), valLoss: 0.85 - (0.55 * (1 - Math.exp(-i / 4))), valAccuracy: 59 + 29 * (1 - Math.exp(-i / 3.5)) })),
    hyperparameters: { learningRate: 2e-4, batchSize: 8, epochs: 12, backbone: "ResNet-50", temporalModule: "difference+attention", inputPairs: "bi-temporal" },
    startDate: "2026-01-20", endDate: "2026-02-12", duration: "23d 5h",
  },
  {
    id: "exp-022", projectId: "proj-009", name: "REBEL Relation Extraction v2",
    hypothesis: "REBEL-based relation extraction with domain-specific fine-tuning will achieve >88% F1 on TACRED and >85% on DocRED cross-sentence relations.",
    results: "TACRED F1: 89.1%. DocRED F1: 86.4%. Custom ontology mapping improves domain-specific relation coverage by 34%. EU AI Act explainability requirements met via attention visualization.",
    status: "completed",
    metrics: Array.from({ length: 12 }, (_, i) => ({ epoch: i + 1, loss: 0.8 - (0.65 * (1 - Math.exp(-i / 4))), accuracy: 62 + 24.4 * (1 - Math.exp(-i / 3.5)), valLoss: 0.85 - (0.6 * (1 - Math.exp(-i / 5))), valAccuracy: 60 + 22 * (1 - Math.exp(-i / 4)) })),
    hyperparameters: { learningRate: 2e-5, batchSize: 16, epochs: 12, maxTriplesPerSent: 8, threshold: 0.55, ontologySize: 247 },
    startDate: "2025-12-01", endDate: "2025-12-20", duration: "19d 7h",
  },
  {
    id: "exp-023", projectId: "proj-009", name: "Neuro-Symbolic Graph Reasoning",
    hypothesis: "Combining TransE embeddings with symbolic logic rules will improve link prediction MRR by 15% on FB15k-237 while maintaining provable reasoning chains.",
    results: "MRR improvement 13.2% over TransE alone. Symbolic rules capture 89% of compositional reasoning patterns. Provenance chains satisfy EU AI Act transparency requirements.",
    status: "completed",
    metrics: Array.from({ length: 10 }, (_, i) => ({ epoch: i + 1, loss: 0.9 - (0.68 * (1 - Math.exp(-i / 3.5))), accuracy: 55 + 31.4 * (1 - Math.exp(-i / 3)), valLoss: 0.95 - (0.63 * (1 - Math.exp(-i / 4))), valAccuracy: 53 + 29 * (1 - Math.exp(-i / 3.5)) })),
    hyperparameters: { learningRate: 1e-3, batchSize: 512, epochs: 10, embeddingDim: 256, numRules: 150, ruleConfidence: 0.8, margin: 6.0 },
    startDate: "2026-02-01", endDate: "2026-02-18", duration: "17d 4h",
  },
  {
    id: "exp-024", projectId: "proj-010", name: "GPTQ 4-bit Quantization — 70B",
    hypothesis: "GPTQ 4-bit quantization with calibration on 128 samples will retain 99%+ of MMLU accuracy on the TITAN-70B model while enabling single-GPU inference.",
    results: "99.1% MMLU retention (91.8 → 91.0). Perplexity increase only 0.12. Fits in single 80GB A100 (vs 4xA100 for FP16). Inference throughput 3.8x improvement.",
    status: "completed",
    metrics: Array.from({ length: 5 }, (_, i) => ({ epoch: i + 1, loss: 0.12 - (0.06 * (1 - Math.exp(-i / 2))), accuracy: 93 + 1.8 * (1 - Math.exp(-i / 1.5)), valLoss: 0.15 - (0.055 * (1 - Math.exp(-i / 2.5))), valAccuracy: 92.5 + 1.5 * (1 - Math.exp(-i / 2)) })),
    hyperparameters: { calibrationSamples: 128, bitsPerWeight: 4, groupSize: 128, quantScheme: "GPTQ", actOrder: true, dampingPercent: 0.01 },
    startDate: "2026-01-08", endDate: "2026-01-12", duration: "4d 6h",
  },
  {
    id: "exp-025", projectId: "proj-010", name: "AWQ Activation-Aware Pruning",
    hypothesis: "Activation-Aware Weight Quantization will outperform GPTQ on downstream tasks due to better preservation of salient weight channels.",
    results: "AWQ achieves 99.4% MMLU retention vs GPTQ's 99.1%. Particularly strong on reasoning tasks (GSM8K 98.7% retention). AWQ + speculative decoding achieves 5.2x throughput.",
    status: "completed",
    metrics: Array.from({ length: 5 }, (_, i) => ({ epoch: i + 1, loss: 0.1 - (0.05 * (1 - Math.exp(-i / 2))), accuracy: 94 + 0.8 * (1 - Math.exp(-i / 1.5)), valLoss: 0.13 - (0.045 * (1 - Math.exp(-i / 2.5))), valAccuracy: 93.8 + 0.6 * (1 - Math.exp(-i / 2)) })),
    hyperparameters: { calibrationSamples: 128, bitsPerWeight: 4, groupSize: 128, quantScheme: "AWQ", salientChannelPercent: 1, speculativeDecoding: true },
    startDate: "2026-02-01", endDate: "2026-02-05", duration: "4d 2h",
  },
];

export const models: Model[] = [
  {
    id: "mod-001", name: "TITAN-70B-MoE", architecture: "Transformer MoE (8 experts, top-2)", version: "3.1.0",
    projectId: "proj-001", accuracy: 91.8, speed: 78, cost: 55, robustness: 89, interpretability: 72,
    parameters: "70B (12B active)", trainingData: "4.2T tokens — RedPajama + curated instruction data", status: "production", lastTrained: "2026-02-28",
    performanceHistory: [
      { date: "2025-06", accuracy: 78.2, latency: 85 }, { date: "2025-09", accuracy: 84.5, latency: 62 },
      { date: "2025-12", accuracy: 89.1, latency: 48 }, { date: "2026-02", accuracy: 91.8, latency: 42 },
    ],
  },
  {
    id: "mod-002", name: "AEGIS-Perception-v2", architecture: "BEVFormer + OccNet + PointPillars Fusion", version: "2.4.1",
    projectId: "proj-002", accuracy: 94.3, speed: 82, cost: 60, robustness: 88, interpretability: 65,
    parameters: "185M", trainingData: "1.2M annotated driving scenes (nuScenes + proprietary)", status: "staging", lastTrained: "2026-03-15",
    performanceHistory: [
      { date: "2025-09", accuracy: 82.1, latency: 52 }, { date: "2025-12", accuracy: 88.7, latency: 40 },
      { date: "2026-01", accuracy: 91.5, latency: 36 }, { date: "2026-03", accuracy: 94.3, latency: 33 },
    ],
  },
  {
    id: "mod-003", name: "HELIX-Fold-v1", architecture: "ESM-2 650M + SE(3)-Equivariant GNN", version: "0.9.2",
    projectId: "proj-003", accuracy: 84.7, speed: 42, cost: 38, robustness: 71, interpretability: 58,
    parameters: "720M", trainingData: "UniRef90 + PDB structures + proprietary assay data", status: "training", lastTrained: "2026-03-26",
    performanceHistory: [
      { date: "2026-01", accuracy: 72.3, latency: 120 }, { date: "2026-02", accuracy: 79.8, latency: 95 },
      { date: "2026-03", accuracy: 84.7, latency: 85 },
    ],
  },
  {
    id: "mod-004", name: "SENTINEL-GAT-v4", architecture: "Graph Attention Network + Online VAE + EWC", version: "4.2.0",
    projectId: "proj-004", accuracy: 97.2, speed: 96, cost: 82, robustness: 95, interpretability: 68,
    parameters: "34M", trainingData: "3.8B network flow records (CICIDS + proprietary SOC data)", status: "production", lastTrained: "2026-03-20",
    performanceHistory: [
      { date: "2025-04", accuracy: 89.5, latency: 14 }, { date: "2025-08", accuracy: 93.2, latency: 10 },
      { date: "2025-12", accuracy: 95.8, latency: 8 }, { date: "2026-03", accuracy: 97.2, latency: 6 },
    ],
  },
  {
    id: "mod-005", name: "GAIA-AFNO-v0", architecture: "Adaptive Fourier Neural Operator (FourCastNet-class)", version: "0.4.1",
    projectId: "proj-005", accuracy: 79.6, speed: 28, cost: 25, robustness: 62, interpretability: 45,
    parameters: "450M", trainingData: "ERA5 reanalysis 1979-2023 (0.25° resolution, 13 pressure levels)", status: "training", lastTrained: "2026-03-25",
    performanceHistory: [
      { date: "2026-02", accuracy: 65.4, latency: 250 }, { date: "2026-03", accuracy: 79.6, latency: 180 },
    ],
  },
  {
    id: "mod-006", name: "NEXUS-VLM-15B", architecture: "DINOv2-ViT-G + 13B LM (Perceiver Cross-Attention)", version: "1.2.0",
    projectId: "proj-006", accuracy: 88.2, speed: 65, cost: 48, robustness: 80, interpretability: 75,
    parameters: "15B (2.1B trainable)", trainingData: "LAION-5B subset + curated VQA/MMMU datasets", status: "staging", lastTrained: "2026-03-01",
    performanceHistory: [
      { date: "2025-11", accuracy: 72.1, latency: 95 }, { date: "2026-01", accuracy: 82.5, latency: 78 },
      { date: "2026-02", accuracy: 86.9, latency: 68 }, { date: "2026-03", accuracy: 88.2, latency: 65 },
    ],
  },
  {
    id: "mod-007", name: "QUBIT-MARL-v1", architecture: "PPO + Decision Transformer + Shared Critic", version: "1.3.0",
    projectId: "proj-007", accuracy: 92.1, speed: 90, cost: 85, robustness: 84, interpretability: 78,
    parameters: "18M (per agent)", trainingData: "500M environment steps (Meta-World + MuJoCo + Isaac Sim)", status: "staging", lastTrained: "2026-03-10",
    performanceHistory: [
      { date: "2025-12", accuracy: 78.4, latency: 22 }, { date: "2026-01", accuracy: 85.6, latency: 18 },
      { date: "2026-02", accuracy: 89.8, latency: 16 }, { date: "2026-03", accuracy: 92.1, latency: 15 },
    ],
  },
  {
    id: "mod-008", name: "CORTEX-SAT-v2", architecture: "DINOv2-ViT-L + SAM Decoder + Oriented RCNN", version: "2.1.0",
    projectId: "proj-008", accuracy: 93.8, speed: 80, cost: 70, robustness: 86, interpretability: 62,
    parameters: "380M", trainingData: "DOTA v2 + xView + 200K proprietary satellite tiles", status: "staging", lastTrained: "2026-03-18",
    performanceHistory: [
      { date: "2025-10", accuracy: 79.2, latency: 38 }, { date: "2025-12", accuracy: 86.5, latency: 30 },
      { date: "2026-02", accuracy: 91.3, latency: 25 }, { date: "2026-03", accuracy: 93.8, latency: 22 },
    ],
  },
  {
    id: "mod-009", name: "ORACLE-KG-v2", architecture: "REBEL + TransE/RotatE + Symbolic Rules", version: "2.0.1",
    projectId: "proj-009", accuracy: 86.4, speed: 75, cost: 80, robustness: 79, interpretability: 92,
    parameters: "210M", trainingData: "4.8M document triples + FB15k-237 + domain ontologies", status: "staging", lastTrained: "2026-03-05",
    performanceHistory: [
      { date: "2025-12", accuracy: 76.2, latency: 62 }, { date: "2026-01", accuracy: 81.5, latency: 55 },
      { date: "2026-02", accuracy: 84.8, latency: 50 }, { date: "2026-03", accuracy: 86.4, latency: 48 },
    ],
  },
  {
    id: "mod-010", name: "FORGE-Quant-Engine", architecture: "GPTQ/AWQ 4-bit + Speculative Decoding", version: "3.0.0",
    projectId: "proj-010", accuracy: 94.8, speed: 97, cost: 95, robustness: 91, interpretability: 70,
    parameters: "N/A (compression toolkit)", trainingData: "Calibration: 128-sample RedPajama subset per model", status: "production", lastTrained: "2026-02-15",
    performanceHistory: [
      { date: "2025-06", accuracy: 88.0, latency: 8 }, { date: "2025-09", accuracy: 91.2, latency: 5 },
      { date: "2025-12", accuracy: 93.5, latency: 4 }, { date: "2026-02", accuracy: 94.8, latency: 3 },
    ],
  },
];

export const insights: Insight[] = [
  {
    id: "ins-001", category: "success", title: "TITAN-70B MoE surpasses MMLU 90 threshold",
    description: "Mixture-of-Experts architecture with top-2 routing achieves MMLU 91.8 — entering GPT-4-class performance territory. Expert load balancing loss was critical: without it, 3 of 8 experts captured 80% of tokens. HumanEval 87.2 confirms strong code generation capability. Inference cost 3.1x lower than equivalent dense model.",
    sourceExperiment: "MoE Scaling — 70B Sparse", confidence: 97, date: "2026-03-26", impact: "high",
  },
  {
    id: "ins-002", category: "discovery", title: "DPO nearly matches PPO alignment at 45% less compute",
    description: "Direct Preference Optimization achieves 96% of PPO alignment quality while eliminating the reward model entirely. This validates Rafailov et al.'s theoretical framework. However, slight degradation on out-of-distribution prompts suggests a hybrid DPO+PPO pipeline for production safety-critical deployments.",
    sourceExperiment: "DPO vs PPO Ablation", confidence: 93, date: "2026-01-25", impact: "high",
  },
  {
    id: "ins-003", category: "success", title: "SENTINEL achieves 97.2% threat detection with sub-1% FPR",
    description: "Graph attention network detects lateral movement attack chains with 97.2% recall and 0.8% false positive rate — exceeding CISA benchmark requirements. Online VAE adaptation handles concept drift in 11 minutes. Adversarial hardening brings robust accuracy to 89% under PGD-20 attacks. SOC analysts report 3x faster threat triage using attention-highlighted network paths.",
    sourceExperiment: "GNN Lateral Movement Detection", confidence: 98, date: "2026-03-27", impact: "high",
  },
  {
    id: "ins-004", category: "trend", title: "Transformer scaling laws validated across all research tracks",
    description: "Consistent with Chinchilla/Kaplan scaling laws: 7 of 10 projects show log-linear accuracy improvements with compute. TITAN LLM follows predicted scaling curve within 2% error. NEXUS VLM shows cross-modal scaling — vision-language performance scales predictably with both vision encoder size and language model parameters.",
    sourceExperiment: "Multiple", confidence: 94, date: "2026-03-15", impact: "high",
  },
  {
    id: "ins-005", category: "warning", title: "GAIA climate model approaching but not meeting ECMWF IFS baseline",
    description: "FourCastNet-class AFNO achieves T850 RMSE 3.45 K at day-5 forecast vs target 3.2 K. Precipitation forecast ACC 0.82 at 3-day lead is promising but ECMWF's IFS achieves 0.89. GraphCast-style mesh approach queued as potential improvement path. NASA Earth Science partnership requires meeting IFS parity by Q3 2026.",
    sourceExperiment: "FourCastNet Precipitation Forecast", confidence: 86, date: "2026-03-20", impact: "high",
  },
  {
    id: "ins-006", category: "discovery", title: "Constitutional AI satisfies EU AI Act Article 15 requirements",
    description: "NEXUS VLM's constitutional AI safety layer reduces harmful multimodal outputs by 97.2% with only 1.8% capability degradation. Provenance chains from neuro-symbolic reasoning and attention visualization satisfy EU AI Act transparency requirements for high-risk AI systems. This positions INCA's models for EU market deployment.",
    sourceExperiment: "Constitutional AI Safety Layer", confidence: 91, date: "2026-02-10", impact: "high",
  },
  {
    id: "ins-007", category: "success", title: "AEGIS autonomous perception exceeds nuScenes state-of-art",
    description: "BEVFormer world model achieves 69.4% mAP on nuScenes 3D detection from camera-only input at 28Hz. Temporal fusion over 8 frames provides 7.2% improvement. Occupancy prediction enables 340ms earlier brake initiation — a 23% safety margin improvement. Performance on par with SpaceX Starship-class landing autonomy requirements.",
    sourceExperiment: "BEVFormer World Model", confidence: 95, date: "2026-03-24", impact: "high",
  },
  {
    id: "ins-008", category: "trend", title: "4-bit quantization achieving <1% accuracy loss across model families",
    description: "FORGE toolkit demonstrates GPTQ and AWQ 4-bit quantization retains 99.1-99.4% of full-precision accuracy. AWQ's activation-aware approach shows particular strength on reasoning tasks (GSM8K 98.7% retention). Combined with speculative decoding, 5.2x throughput improvement enables single-GPU inference for 70B models. Aligns with China's New Generation AI Plan emphasis on efficient edge deployment.",
    sourceExperiment: "AWQ Activation-Aware Pruning", confidence: 96, date: "2026-02-08", impact: "medium",
  },
  {
    id: "ins-009", category: "warning", title: "Sim-to-real gap in QUBIT RL system at 9.2% — above 8% target",
    description: "Domain randomization with 50+ perturbations reduces sim-to-real gap but hasn't reached the <8% target for physical robot deployment. Visual domain gap is the primary factor. Recommend integrating real-world data augmentation (CycleGAN) into the training pipeline. Physical robot trials scheduled for Q2 2026.",
    sourceExperiment: "Sim-to-Real Domain Randomization", confidence: 82, date: "2026-03-22", impact: "medium",
  },
  {
    id: "ins-010", category: "discovery", title: "Self-supervised DINOv2 features transfer remarkably to satellite imagery",
    description: "CORTEX satellite detection achieves 84.1 mAP on DOTA v2 using DINOv2 self-supervised features — outperforming ImageNet-supervised baselines by 6.3%. This challenges the assumption that domain-specific pretraining is necessary for remote sensing. Potential to accelerate NASA and NRO Earth observation AI programs.",
    sourceExperiment: "DINOv2 SAM Satellite Detection", confidence: 90, date: "2026-03-18", impact: "high",
  },
  {
    id: "ins-011", category: "trend", title: "RLHF → DPO → Constitutional AI: alignment paradigm shift",
    description: "Research trajectory across TITAN and NEXUS projects shows clear evolution: RLHF provides strongest alignment but highest compute cost, DPO offers 96% quality at 45% less compute, and Constitutional AI adds safety layers with minimal capability degradation. Industry is converging on hybrid approaches — matching trends at Anthropic, DeepMind, and OpenAI.",
    sourceExperiment: "Multiple", confidence: 88, date: "2026-03-12", impact: "medium",
  },
  {
    id: "ins-012", category: "success", title: "HELIX diffusion model generates valid drug candidates",
    description: "3D equivariant diffusion generates molecules where 76.8% pass Lipinski drug-likeness filters with average QED 0.72. Docking scores against SARS-CoV-2 Mpro target competitive with traditional virtual screening. NIH NCATS partnership validates translational potential. Synthesizability scoring (SA score) identified as next optimization priority.",
    sourceExperiment: "Diffusion Molecular Generation", confidence: 87, date: "2025-12-22", impact: "medium",
  },
  {
    id: "ins-013", category: "warning", title: "GPU resource contention — 4 experiments competing for A100 allocation",
    description: "HELIX protein folding, GAIA climate model, and QUBIT sim-to-real experiments competing for A100/H100 GPU time. Two experiments queued. Current utilization at 94%. US NAIRR (National AI Research Resource) access application submitted for supplemental compute. Cloud burst capacity evaluation in progress.",
    sourceExperiment: "Multiple", confidence: 95, date: "2026-03-25", impact: "medium",
  },
  {
    id: "ins-014", category: "discovery", title: "Decision Transformer achieves 94% of online RL with 12x fewer interactions",
    description: "Offline RL via Decision Transformer matches 94% of online PPO performance with 12x fewer environment interactions. Critical for real-robot deployment where physical interactions are expensive and risky. Sequence-modeling approach to RL validates the transformer-everywhere thesis — attention mechanisms generalize across modalities.",
    sourceExperiment: "Decision Transformer Planning", confidence: 89, date: "2026-02-02", impact: "medium",
  },
  {
    id: "ins-015", category: "trend", title: "Neuro-symbolic AI gaining traction for compliance and explainability",
    description: "ORACLE knowledge graph's hybrid neural-symbolic approach satisfies EU AI Act transparency requirements. Symbolic reasoning chains provide human-auditable decision provenance. This positions INCA for government and enterprise contracts requiring explainable AI — a growing market driven by EU AI Act, US Executive Order 14110, and China's AI governance framework.",
    sourceExperiment: "Neuro-Symbolic Graph Reasoning", confidence: 92, date: "2026-03-05", impact: "medium",
  },
  {
    id: "ins-016", category: "success", title: "Cross-modal attention patterns reveal universal representation learning",
    description: "NEXUS VLM's cross-attention layers learn spatial-semantic correspondences that transfer to ORACLE's knowledge extraction pipeline. Pre-trained visual features improve relation extraction F1 by 4.2% — suggesting universal multimodal representations emerge at scale. This mirrors findings from DeepMind's Gemini and OpenAI's GPT-4V research.",
    sourceExperiment: "Cross-Attention VLM Training", confidence: 85, date: "2026-01-28", impact: "medium",
  },
];

export function getProjectsByStatus(status: ProjectStatus): Project[] {
  return projects.filter((p) => p.status === status);
}

export function getExperimentsForProject(projectId: string): Experiment[] {
  return experiments.filter((e) => e.projectId === projectId);
}

export function getModelsForProject(projectId: string): Model[] {
  return models.filter((m) => m.projectId === projectId);
}

export function getResearchHealthScore(): number {
  const deployed = projects.filter((p) => p.status === "deployed").length;
  const avgAccuracy = projects.reduce((sum, p) => sum + p.accuracy, 0) / projects.length;
  const completedExperiments = experiments.filter((e) => e.status === "completed").length;
  const totalExperiments = experiments.length;
  const completionRate = completedExperiments / totalExperiments;
  return Math.round((deployed / projects.length) * 25 + (avgAccuracy / 100) * 35 + completionRate * 25 + 15);
}
