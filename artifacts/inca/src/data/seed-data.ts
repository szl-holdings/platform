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
  hyperparameters: Record<string, string | number>;
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
    name: "NeuralSense NLP Engine",
    description: "Advanced natural language processing pipeline for multi-lingual sentiment analysis and entity extraction across enterprise communication channels.",
    status: "deployed",
    domain: "NLP",
    team: [
      { name: "Dr. Elena Vasquez", role: "Lead Researcher", avatar: "EV" },
      { name: "Marcus Chen", role: "ML Engineer", avatar: "MC" },
      { name: "Priya Sharma", role: "Data Scientist", avatar: "PS" },
    ],
    accuracy: 94.7,
    loss: 0.082,
    inferenceTime: 12,
    startDate: "2025-06-15",
    lastUpdated: "2026-03-20",
    experimentIds: ["exp-001", "exp-002", "exp-003"],
    modelIds: ["mod-001"],
    progress: 100,
  },
  {
    id: "proj-002",
    name: "Cortex Vision System",
    description: "Real-time object detection and scene understanding for autonomous drone navigation in complex urban environments.",
    status: "testing",
    domain: "Computer Vision",
    team: [
      { name: "Dr. James Park", role: "Principal Scientist", avatar: "JP" },
      { name: "Sarah Mitchell", role: "CV Engineer", avatar: "SM" },
      { name: "Raj Patel", role: "Robotics Lead", avatar: "RP" },
      { name: "Lisa Wang", role: "ML Engineer", avatar: "LW" },
    ],
    accuracy: 91.2,
    loss: 0.124,
    inferenceTime: 28,
    startDate: "2025-09-01",
    lastUpdated: "2026-03-22",
    experimentIds: ["exp-004", "exp-005", "exp-006"],
    modelIds: ["mod-002"],
    progress: 78,
  },
  {
    id: "proj-003",
    name: "SynapseRec Engine",
    description: "Context-aware recommendation system using deep collaborative filtering and transformer attention for personalized content discovery.",
    status: "development",
    domain: "Recommendation Systems",
    team: [
      { name: "Dr. Anna Kowalski", role: "Research Lead", avatar: "AK" },
      { name: "David Okonjo", role: "Backend Engineer", avatar: "DO" },
    ],
    accuracy: 87.3,
    loss: 0.198,
    inferenceTime: 45,
    startDate: "2025-11-10",
    lastUpdated: "2026-03-18",
    experimentIds: ["exp-007", "exp-008"],
    modelIds: ["mod-003"],
    progress: 52,
  },
  {
    id: "proj-004",
    name: "Sentinel Anomaly Detector",
    description: "Unsupervised anomaly detection for network traffic analysis, identifying zero-day threats and anomalous behavioral patterns in real-time streams.",
    status: "deployed",
    domain: "Anomaly Detection",
    team: [
      { name: "Dr. Omar Hassan", role: "Security AI Lead", avatar: "OH" },
      { name: "Yuki Tanaka", role: "ML Engineer", avatar: "YT" },
      { name: "Chris Adler", role: "DevOps Engineer", avatar: "CA" },
    ],
    accuracy: 96.1,
    loss: 0.053,
    inferenceTime: 8,
    startDate: "2025-04-20",
    lastUpdated: "2026-03-24",
    experimentIds: ["exp-009", "exp-010", "exp-011"],
    modelIds: ["mod-004"],
    progress: 100,
  },
  {
    id: "proj-005",
    name: "GenSynth Generative Studio",
    description: "Multi-modal generative AI for creative content synthesis — combining text, image, and audio generation with controllable style transfer.",
    status: "research",
    domain: "Generative AI",
    team: [
      { name: "Dr. Maya Rodriguez", role: "Creative AI Lead", avatar: "MR" },
      { name: "Alex Kim", role: "Research Scientist", avatar: "AK2" },
    ],
    accuracy: 78.4,
    loss: 0.312,
    inferenceTime: 120,
    startDate: "2026-01-08",
    lastUpdated: "2026-03-25",
    experimentIds: ["exp-012", "exp-013"],
    modelIds: ["mod-005"],
    progress: 25,
  },
  {
    id: "proj-006",
    name: "CogniGraph Knowledge Engine",
    description: "Knowledge graph construction and reasoning system that extracts, links, and infers relationships from unstructured documents at scale.",
    status: "development",
    domain: "Knowledge Graphs",
    team: [
      { name: "Dr. Fiona Campbell", role: "Graph AI Lead", avatar: "FC" },
      { name: "Tobias Mueller", role: "NLP Engineer", avatar: "TM" },
      { name: "Nina Ivanova", role: "Data Engineer", avatar: "NI" },
    ],
    accuracy: 89.6,
    loss: 0.145,
    inferenceTime: 35,
    startDate: "2025-08-15",
    lastUpdated: "2026-03-21",
    experimentIds: ["exp-014", "exp-015"],
    modelIds: ["mod-006"],
    progress: 60,
  },
  {
    id: "proj-007",
    name: "TemporalNet Forecaster",
    description: "Time-series forecasting with attention-augmented temporal convolutional networks for financial market and supply chain prediction.",
    status: "testing",
    domain: "Time Series",
    team: [
      { name: "Dr. Leo Zhang", role: "Quantitative Lead", avatar: "LZ" },
      { name: "Emma Larsson", role: "ML Engineer", avatar: "EL" },
    ],
    accuracy: 92.8,
    loss: 0.097,
    inferenceTime: 18,
    startDate: "2025-10-05",
    lastUpdated: "2026-03-23",
    experimentIds: ["exp-016", "exp-017", "exp-018"],
    modelIds: ["mod-007"],
    progress: 85,
  },
  {
    id: "proj-008",
    name: "BioSeq Protein Predictor",
    description: "Protein structure and function prediction using graph neural networks and evolutionary scale modeling for drug discovery acceleration.",
    status: "research",
    domain: "Computational Biology",
    team: [
      { name: "Dr. Aisha Nkemelu", role: "BioAI Lead", avatar: "AN" },
      { name: "Patrick Sullivan", role: "Bioinformatics Eng", avatar: "PS2" },
      { name: "Hannah Lee", role: "Research Scientist", avatar: "HL" },
    ],
    accuracy: 82.1,
    loss: 0.245,
    inferenceTime: 90,
    startDate: "2026-02-01",
    lastUpdated: "2026-03-26",
    experimentIds: ["exp-019", "exp-020", "exp-021"],
    modelIds: ["mod-008"],
    progress: 18,
  },
  {
    id: "proj-009",
    name: "VoxAgent Dialogue System",
    description: "End-to-end conversational AI with dynamic persona adaptation, multi-turn reasoning, and grounded knowledge retrieval for customer support.",
    status: "development",
    domain: "Conversational AI",
    team: [
      { name: "Dr. Ryan Torres", role: "Dialogue Systems Lead", avatar: "RT" },
      { name: "Mia Johnson", role: "NLU Engineer", avatar: "MJ" },
    ],
    accuracy: 85.9,
    loss: 0.176,
    inferenceTime: 55,
    startDate: "2025-12-01",
    lastUpdated: "2026-03-19",
    experimentIds: ["exp-022", "exp-023"],
    modelIds: [],
    progress: 40,
  },
  {
    id: "proj-010",
    name: "EdgeOptimizer Compiler",
    description: "Neural network optimization and quantization toolkit for deploying large models on edge devices with minimal accuracy degradation.",
    status: "testing",
    domain: "MLOps",
    team: [
      { name: "Kai Hoffman", role: "Compiler Engineer", avatar: "KH" },
      { name: "Zara Osei", role: "Hardware ML Lead", avatar: "ZO" },
    ],
    accuracy: 93.4,
    loss: 0.089,
    inferenceTime: 5,
    startDate: "2025-07-22",
    lastUpdated: "2026-03-24",
    experimentIds: ["exp-024", "exp-025"],
    modelIds: [],
    progress: 72,
  },
];

export const experiments: Experiment[] = [
  {
    id: "exp-001", projectId: "proj-001", name: "BERT Fine-tuning v3",
    hypothesis: "Fine-tuning BERT-large with domain-specific corpora will improve sentiment classification F1 by 5-8%.",
    results: "Achieved 6.2% improvement in F1 score. Multi-lingual performance improved significantly with cross-lingual transfer.",
    status: "completed",
    metrics: Array.from({ length: 20 }, (_, i) => ({ epoch: i + 1, loss: 0.8 - (0.72 * (1 - Math.exp(-i / 5))), accuracy: 65 + 29.7 * (1 - Math.exp(-i / 4)), valLoss: 0.85 - (0.7 * (1 - Math.exp(-i / 6))), valAccuracy: 63 + 28.5 * (1 - Math.exp(-i / 5)) })),
    hyperparameters: { learningRate: 2e-5, batchSize: 32, epochs: 20, warmupSteps: 500, dropout: 0.1 },
    startDate: "2025-08-10", endDate: "2025-08-18", duration: "8d 4h",
  },
  {
    id: "exp-002", projectId: "proj-001", name: "Entity Extraction Transformer",
    hypothesis: "A custom transformer with CRF head will outperform spaCy NER by 10%+ on domain entities.",
    results: "12.4% improvement in entity F1. Custom architecture particularly strong on nested entities.",
    status: "completed",
    metrics: Array.from({ length: 15 }, (_, i) => ({ epoch: i + 1, loss: 0.9 - (0.78 * (1 - Math.exp(-i / 4))), accuracy: 60 + 34 * (1 - Math.exp(-i / 3.5)), valLoss: 0.95 - (0.75 * (1 - Math.exp(-i / 5))), valAccuracy: 58 + 32 * (1 - Math.exp(-i / 4)) })),
    hyperparameters: { learningRate: 3e-5, batchSize: 16, epochs: 15, hiddenDim: 768, crf: true },
    startDate: "2025-09-01", endDate: "2025-09-12", duration: "11d 2h",
  },
  {
    id: "exp-003", projectId: "proj-001", name: "Multilingual Distillation",
    hypothesis: "Knowledge distillation from large multi-lingual model to compact student will retain 95%+ accuracy.",
    results: "Student model retained 96.8% of teacher accuracy at 1/4 the size. Inference speedup of 3.2x.",
    status: "completed",
    metrics: Array.from({ length: 12 }, (_, i) => ({ epoch: i + 1, loss: 0.7 - (0.6 * (1 - Math.exp(-i / 3))), accuracy: 70 + 24.7 * (1 - Math.exp(-i / 3)), valLoss: 0.75 - (0.58 * (1 - Math.exp(-i / 4))), valAccuracy: 68 + 23 * (1 - Math.exp(-i / 3.5)) })),
    hyperparameters: { learningRate: 5e-5, batchSize: 64, epochs: 12, temperature: 4, alpha: 0.7 },
    startDate: "2025-11-05", endDate: "2025-11-14", duration: "9d 6h",
  },
  {
    id: "exp-004", projectId: "proj-002", name: "YOLOv8 Urban Detection",
    hypothesis: "YOLOv8-X with custom anchor boxes optimized for urban objects will achieve >90% mAP@0.5.",
    results: "Achieved 91.2% mAP@0.5 on urban benchmark. Small object detection still challenging.",
    status: "completed",
    metrics: Array.from({ length: 25 }, (_, i) => ({ epoch: i + 1, loss: 1.2 - (1.05 * (1 - Math.exp(-i / 6))), accuracy: 55 + 36.2 * (1 - Math.exp(-i / 5)), valLoss: 1.3 - (1.0 * (1 - Math.exp(-i / 7))), valAccuracy: 52 + 34.5 * (1 - Math.exp(-i / 6)) })),
    hyperparameters: { learningRate: 1e-3, batchSize: 8, epochs: 25, imgSize: 1280, augmentation: "mosaic" },
    startDate: "2025-10-15", endDate: "2025-11-10", duration: "26d 8h",
  },
  {
    id: "exp-005", projectId: "proj-002", name: "Scene Segmentation ViT",
    hypothesis: "Vision transformer with hierarchical attention will improve scene segmentation IoU by 8%.",
    results: "7.6% IoU improvement. Attention maps reveal strong understanding of spatial hierarchies.",
    status: "completed",
    metrics: Array.from({ length: 18 }, (_, i) => ({ epoch: i + 1, loss: 1.0 - (0.85 * (1 - Math.exp(-i / 5))), accuracy: 58 + 33 * (1 - Math.exp(-i / 4.5)), valLoss: 1.1 - (0.82 * (1 - Math.exp(-i / 6))), valAccuracy: 55 + 31 * (1 - Math.exp(-i / 5)) })),
    hyperparameters: { learningRate: 5e-4, batchSize: 4, epochs: 18, patchSize: 16, heads: 12 },
    startDate: "2025-12-01", endDate: "2025-12-22", duration: "21d 5h",
  },
  {
    id: "exp-006", projectId: "proj-002", name: "Depth Estimation Fusion",
    hypothesis: "Fusing monocular depth with LiDAR sparse points will reduce depth error by 15%.",
    results: "Running on 4x A100 cluster. Preliminary results show 11% error reduction at epoch 12.",
    status: "running",
    metrics: Array.from({ length: 12 }, (_, i) => ({ epoch: i + 1, loss: 0.95 - (0.65 * (1 - Math.exp(-i / 5))), accuracy: 62 + 25 * (1 - Math.exp(-i / 4)), valLoss: 1.0 - (0.6 * (1 - Math.exp(-i / 6))), valAccuracy: 59 + 23 * (1 - Math.exp(-i / 5)) })),
    hyperparameters: { learningRate: 2e-4, batchSize: 2, epochs: 30, fusionMethod: "late-concat", backbone: "EfficientNet-B5" },
    startDate: "2026-03-10", endDate: null, duration: "16d (running)",
  },
  {
    id: "exp-007", projectId: "proj-003", name: "Attention-Based CF",
    hypothesis: "Self-attention over user-item interaction graphs will capture higher-order collaborative signals.",
    results: "NDCG@10 improved by 4.8% over baseline. Cold-start still an issue.",
    status: "completed",
    metrics: Array.from({ length: 10 }, (_, i) => ({ epoch: i + 1, loss: 0.6 - (0.42 * (1 - Math.exp(-i / 3))), accuracy: 72 + 15.3 * (1 - Math.exp(-i / 3)), valLoss: 0.65 - (0.38 * (1 - Math.exp(-i / 4))), valAccuracy: 70 + 14 * (1 - Math.exp(-i / 3.5)) })),
    hyperparameters: { learningRate: 1e-3, batchSize: 256, epochs: 10, embeddingDim: 128, numHeads: 8 },
    startDate: "2026-01-05", endDate: "2026-01-12", duration: "7d 3h",
  },
  {
    id: "exp-008", projectId: "proj-003", name: "Context-Aware Embeddings",
    hypothesis: "Session-aware embeddings with temporal decay will improve recommendation freshness by 20%.",
    results: "Freshness improved 18.5%. User engagement increased in A/B test cohort.",
    status: "completed",
    metrics: Array.from({ length: 8 }, (_, i) => ({ epoch: i + 1, loss: 0.55 - (0.35 * (1 - Math.exp(-i / 2.5))), accuracy: 75 + 12.3 * (1 - Math.exp(-i / 2.5)), valLoss: 0.6 - (0.32 * (1 - Math.exp(-i / 3))), valAccuracy: 73 + 11 * (1 - Math.exp(-i / 3)) })),
    hyperparameters: { learningRate: 5e-4, batchSize: 128, epochs: 8, temporalDecay: 0.95, contextWindow: 50 },
    startDate: "2026-02-01", endDate: "2026-02-07", duration: "6d 10h",
  },
  {
    id: "exp-009", projectId: "proj-004", name: "Autoencoder Baseline",
    hypothesis: "Variational autoencoder will establish a strong baseline for network anomaly detection with <2% FPR.",
    results: "Achieved 1.8% FPR with 94.3% detection rate. Latent space reveals clear anomaly clusters.",
    status: "completed",
    metrics: Array.from({ length: 15 }, (_, i) => ({ epoch: i + 1, loss: 0.5 - (0.42 * (1 - Math.exp(-i / 4))), accuracy: 80 + 16.1 * (1 - Math.exp(-i / 3.5)), valLoss: 0.55 - (0.4 * (1 - Math.exp(-i / 5))), valAccuracy: 78 + 15 * (1 - Math.exp(-i / 4)) })),
    hyperparameters: { learningRate: 1e-3, batchSize: 512, epochs: 15, latentDim: 64, beta: 0.5 },
    startDate: "2025-05-15", endDate: "2025-05-28", duration: "13d 1h",
  },
  {
    id: "exp-010", projectId: "proj-004", name: "GNN Threat Graphs",
    hypothesis: "Graph neural network over network flow graphs will detect lateral movement with 95%+ recall.",
    results: "96.1% recall achieved. GNN captures multi-hop attack patterns effectively.",
    status: "completed",
    metrics: Array.from({ length: 20 }, (_, i) => ({ epoch: i + 1, loss: 0.7 - (0.62 * (1 - Math.exp(-i / 5))), accuracy: 75 + 21.1 * (1 - Math.exp(-i / 4)), valLoss: 0.75 - (0.58 * (1 - Math.exp(-i / 6))), valAccuracy: 73 + 20 * (1 - Math.exp(-i / 5)) })),
    hyperparameters: { learningRate: 5e-4, batchSize: 32, epochs: 20, layers: 4, aggregation: "mean" },
    startDate: "2025-07-01", endDate: "2025-07-22", duration: "21d 7h",
  },
  {
    id: "exp-011", projectId: "proj-004", name: "Streaming Anomaly v2",
    hypothesis: "Online learning approach will adapt to concept drift in network traffic within 30-minute windows.",
    results: "Adaptation window achieved at 22 minutes. Real-time performance meets production requirements.",
    status: "completed",
    metrics: Array.from({ length: 10 }, (_, i) => ({ epoch: i + 1, loss: 0.4 - (0.33 * (1 - Math.exp(-i / 3))), accuracy: 85 + 11.1 * (1 - Math.exp(-i / 2.5)), valLoss: 0.45 - (0.3 * (1 - Math.exp(-i / 4))), valAccuracy: 83 + 10 * (1 - Math.exp(-i / 3)) })),
    hyperparameters: { learningRate: "adaptive", batchSize: 64, epochs: 10, windowSize: 1800, updateFreq: 30 },
    startDate: "2025-09-10", endDate: "2025-09-18", duration: "8d 5h",
  },
  {
    id: "exp-012", projectId: "proj-005", name: "Diffusion Text-to-Image",
    hypothesis: "Latent diffusion with CLIP guidance will generate domain-specific images with FID < 15.",
    results: "Current FID at 18.4. Quality improves with more denoising steps but inference time increases.",
    status: "running",
    metrics: Array.from({ length: 8 }, (_, i) => ({ epoch: i + 1, loss: 1.5 - (1.0 * (1 - Math.exp(-i / 4))), accuracy: 45 + 33.4 * (1 - Math.exp(-i / 3.5)), valLoss: 1.6 - (0.9 * (1 - Math.exp(-i / 5))), valAccuracy: 42 + 30 * (1 - Math.exp(-i / 4)) })),
    hyperparameters: { learningRate: 1e-4, batchSize: 4, epochs: 50, denoisingSteps: 50, guidanceScale: 7.5 },
    startDate: "2026-02-15", endDate: null, duration: "39d (running)",
  },
  {
    id: "exp-013", projectId: "proj-005", name: "Audio Style Transfer",
    hypothesis: "Mel-spectrogram manipulation via neural style transfer will enable real-time audio morphing.",
    results: "Queued for GPU allocation. Expected to run on next available A100 batch.",
    status: "queued",
    metrics: [],
    hyperparameters: { learningRate: 3e-4, batchSize: 8, epochs: 30, fftSize: 2048, hopLength: 512 },
    startDate: "2026-03-28", endDate: null, duration: "Queued",
  },
  {
    id: "exp-014", projectId: "proj-006", name: "Triple Extraction REBEL",
    hypothesis: "REBEL-based triple extraction with domain fine-tuning will achieve >85% relation F1.",
    results: "Relation F1 at 87.2%. Works well on structured documents, weaker on informal text.",
    status: "completed",
    metrics: Array.from({ length: 12 }, (_, i) => ({ epoch: i + 1, loss: 0.8 - (0.65 * (1 - Math.exp(-i / 4))), accuracy: 62 + 25.2 * (1 - Math.exp(-i / 3.5)), valLoss: 0.85 - (0.6 * (1 - Math.exp(-i / 5))), valAccuracy: 60 + 23 * (1 - Math.exp(-i / 4)) })),
    hyperparameters: { learningRate: 2e-5, batchSize: 16, epochs: 12, maxTriplesPerSent: 5, threshold: 0.6 },
    startDate: "2025-10-20", endDate: "2025-11-05", duration: "16d 3h",
  },
  {
    id: "exp-015", projectId: "proj-006", name: "Graph Reasoning Engine",
    hypothesis: "TransE + RotatE ensemble will improve link prediction MRR by 12%.",
    results: "MRR improvement of 10.8%. Ensemble approach shows diminishing returns above 3 models.",
    status: "completed",
    metrics: Array.from({ length: 15 }, (_, i) => ({ epoch: i + 1, loss: 0.9 - (0.72 * (1 - Math.exp(-i / 4.5))), accuracy: 55 + 34.6 * (1 - Math.exp(-i / 4)), valLoss: 0.95 - (0.68 * (1 - Math.exp(-i / 5.5))), valAccuracy: 53 + 32 * (1 - Math.exp(-i / 4.5)) })),
    hyperparameters: { learningRate: 1e-3, batchSize: 512, epochs: 15, embeddingDim: 256, margin: 6.0 },
    startDate: "2026-01-15", endDate: "2026-02-02", duration: "18d 7h",
  },
  {
    id: "exp-016", projectId: "proj-007", name: "TCN Baseline",
    hypothesis: "Temporal convolutional network will outperform LSTM baselines on multi-step forecasting.",
    results: "TCN reduces RMSE by 8.5% vs LSTM. Parallelizable training cuts time by 60%.",
    status: "completed",
    metrics: Array.from({ length: 12 }, (_, i) => ({ epoch: i + 1, loss: 0.6 - (0.48 * (1 - Math.exp(-i / 3.5))), accuracy: 70 + 22.8 * (1 - Math.exp(-i / 3)), valLoss: 0.65 - (0.44 * (1 - Math.exp(-i / 4))), valAccuracy: 68 + 21 * (1 - Math.exp(-i / 3.5)) })),
    hyperparameters: { learningRate: 5e-4, batchSize: 64, epochs: 12, kernelSize: 7, dilationBase: 2 },
    startDate: "2025-11-15", endDate: "2025-11-28", duration: "13d 2h",
  },
  {
    id: "exp-017", projectId: "proj-007", name: "Attention Augmentation",
    hypothesis: "Adding sparse attention to TCN will capture long-range dependencies in financial data.",
    results: "15% improvement on 30-day forecasting horizon. Attention weights are interpretable.",
    status: "completed",
    metrics: Array.from({ length: 15 }, (_, i) => ({ epoch: i + 1, loss: 0.5 - (0.4 * (1 - Math.exp(-i / 4))), accuracy: 75 + 17.8 * (1 - Math.exp(-i / 3.5)), valLoss: 0.55 - (0.37 * (1 - Math.exp(-i / 5))), valAccuracy: 73 + 16 * (1 - Math.exp(-i / 4)) })),
    hyperparameters: { learningRate: 3e-4, batchSize: 32, epochs: 15, attentionHeads: 4, sparseK: 32 },
    startDate: "2026-01-10", endDate: "2026-01-28", duration: "18d 9h",
  },
  {
    id: "exp-018", projectId: "proj-007", name: "Multi-Asset Ensemble",
    hypothesis: "Cross-asset correlation features will improve portfolio-level prediction accuracy.",
    results: "Testing phase. Preliminary results show 3.2% improvement with correlation features.",
    status: "running",
    metrics: Array.from({ length: 6 }, (_, i) => ({ epoch: i + 1, loss: 0.45 - (0.25 * (1 - Math.exp(-i / 3))), accuracy: 78 + 10 * (1 - Math.exp(-i / 2.5)), valLoss: 0.5 - (0.22 * (1 - Math.exp(-i / 3.5))), valAccuracy: 76 + 9 * (1 - Math.exp(-i / 3)) })),
    hyperparameters: { learningRate: 2e-4, batchSize: 16, epochs: 20, numAssets: 50, correlationWindow: 60 },
    startDate: "2026-03-05", endDate: null, duration: "21d (running)",
  },
  {
    id: "exp-019", projectId: "proj-008", name: "ESM-2 Fine-tuning",
    hypothesis: "Fine-tuning ESM-2 on proprietary protein dataset will improve structure prediction TM-score.",
    results: "Preliminary TM-score of 0.82. Model shows strong performance on protein families not in AlphaFold.",
    status: "running",
    metrics: Array.from({ length: 5 }, (_, i) => ({ epoch: i + 1, loss: 1.2 - (0.6 * (1 - Math.exp(-i / 3))), accuracy: 50 + 32.1 * (1 - Math.exp(-i / 3)), valLoss: 1.3 - (0.55 * (1 - Math.exp(-i / 3.5))), valAccuracy: 48 + 30 * (1 - Math.exp(-i / 3.5)) })),
    hyperparameters: { learningRate: 1e-5, batchSize: 2, epochs: 20, modelSize: "650M", cropSize: 1024 },
    startDate: "2026-03-01", endDate: null, duration: "25d (running)",
  },
  {
    id: "exp-020", projectId: "proj-008", name: "GNN Binding Prediction",
    hypothesis: "Graph neural network on molecular graphs will predict binding affinity with R² > 0.75.",
    results: "Queued after ESM-2 experiment. Will use ESM embeddings as node features.",
    status: "queued",
    metrics: [],
    hyperparameters: { learningRate: 5e-4, batchSize: 32, epochs: 25, gnnLayers: 6, readout: "attention" },
    startDate: "2026-04-01", endDate: null, duration: "Queued",
  },
  {
    id: "exp-021", projectId: "proj-008", name: "Contact Map Prediction",
    hypothesis: "Residue-level contact prediction with coevolution features will achieve >80% long-range precision.",
    results: "Early exploration. Data preprocessing pipeline is being validated.",
    status: "queued",
    metrics: [],
    hyperparameters: { learningRate: 3e-4, batchSize: 8, epochs: 30, msaDepth: 512, contactThreshold: 8.0 },
    startDate: "2026-04-15", endDate: null, duration: "Queued",
  },
  {
    id: "exp-022", projectId: "proj-009", name: "Persona-Adaptive LLM",
    hypothesis: "Fine-tuning with persona-specific instruction data will enable dynamic tone adaptation.",
    results: "Persona consistency improved 22% in human evaluation. Tone switching latency under 50ms.",
    status: "completed",
    metrics: Array.from({ length: 10 }, (_, i) => ({ epoch: i + 1, loss: 0.9 - (0.7 * (1 - Math.exp(-i / 3))), accuracy: 60 + 25.9 * (1 - Math.exp(-i / 3)), valLoss: 0.95 - (0.65 * (1 - Math.exp(-i / 4))), valAccuracy: 58 + 24 * (1 - Math.exp(-i / 3.5)) })),
    hyperparameters: { learningRate: 2e-5, batchSize: 4, epochs: 10, loraRank: 16, numPersonas: 8 },
    startDate: "2026-01-20", endDate: "2026-02-05", duration: "16d 11h",
  },
  {
    id: "exp-023", projectId: "proj-009", name: "RAG Knowledge Grounding",
    hypothesis: "Retrieval augmented generation with dense passage retrieval will reduce hallucination rate to <5%.",
    results: "Hallucination rate at 6.2% — close to target. Retrieval latency needs optimization.",
    status: "completed",
    metrics: Array.from({ length: 8 }, (_, i) => ({ epoch: i + 1, loss: 0.7 - (0.5 * (1 - Math.exp(-i / 2.5))), accuracy: 68 + 17.9 * (1 - Math.exp(-i / 2.5)), valLoss: 0.75 - (0.45 * (1 - Math.exp(-i / 3))), valAccuracy: 65 + 16 * (1 - Math.exp(-i / 3)) })),
    hyperparameters: { learningRate: 1e-4, batchSize: 8, epochs: 8, topK: 5, chunkSize: 512 },
    startDate: "2026-02-10", endDate: "2026-02-22", duration: "12d 5h",
  },
  {
    id: "exp-024", projectId: "proj-010", name: "INT8 Quantization Study",
    hypothesis: "Post-training INT8 quantization with calibration will retain 99% accuracy.",
    results: "99.2% accuracy retention achieved. 2.8x inference speedup on edge hardware.",
    status: "completed",
    metrics: Array.from({ length: 5 }, (_, i) => ({ epoch: i + 1, loss: 0.15 - (0.08 * (1 - Math.exp(-i / 2))), accuracy: 92 + 1.4 * (1 - Math.exp(-i / 1.5)), valLoss: 0.18 - (0.07 * (1 - Math.exp(-i / 2.5))), valAccuracy: 91.5 + 1.2 * (1 - Math.exp(-i / 2)) })),
    hyperparameters: { calibrationSamples: 1000, quantizationScheme: "symmetric", granularity: "per-channel" },
    startDate: "2025-09-01", endDate: "2025-09-08", duration: "7d 2h",
  },
  {
    id: "exp-025", projectId: "proj-010", name: "Neural Architecture Search",
    hypothesis: "NAS with hardware-aware constraints will find architectures 40% faster than manual design.",
    results: "Found architecture 35% faster with comparable accuracy. Search cost is still high.",
    status: "completed",
    metrics: Array.from({ length: 10 }, (_, i) => ({ epoch: i + 1, loss: 0.4 - (0.3 * (1 - Math.exp(-i / 3))), accuracy: 82 + 11.4 * (1 - Math.exp(-i / 3)), valLoss: 0.45 - (0.28 * (1 - Math.exp(-i / 4))), valAccuracy: 80 + 10 * (1 - Math.exp(-i / 3.5)) })),
    hyperparameters: { searchSpace: "mobile-v3", maxLatency: "10ms", searchAlgorithm: "evolutionary", population: 100 },
    startDate: "2025-10-10", endDate: "2025-11-05", duration: "26d 4h",
  },
];

export const models: Model[] = [
  {
    id: "mod-001", name: "NeuralSense-v3", architecture: "BERT-Large + CRF", version: "3.2.1",
    projectId: "proj-001", accuracy: 94.7, speed: 88, cost: 72, robustness: 91, interpretability: 78,
    parameters: "340M", trainingData: "4.2M labeled sentences", status: "production", lastTrained: "2026-02-15",
    performanceHistory: [
      { date: "2025-08", accuracy: 88.5, latency: 18 }, { date: "2025-10", accuracy: 91.2, latency: 15 },
      { date: "2025-12", accuracy: 93.1, latency: 13 }, { date: "2026-02", accuracy: 94.7, latency: 12 },
    ],
  },
  {
    id: "mod-002", name: "CortexVision-X", architecture: "YOLOv8-X + ViT Hybrid", version: "2.0.4",
    projectId: "proj-002", accuracy: 91.2, speed: 75, cost: 65, robustness: 82, interpretability: 60,
    parameters: "98M", trainingData: "850K annotated frames", status: "staging", lastTrained: "2026-03-01",
    performanceHistory: [
      { date: "2025-11", accuracy: 84.3, latency: 42 }, { date: "2026-01", accuracy: 88.7, latency: 34 },
      { date: "2026-02", accuracy: 90.1, latency: 30 }, { date: "2026-03", accuracy: 91.2, latency: 28 },
    ],
  },
  {
    id: "mod-003", name: "SynapseRec-ATT", architecture: "Self-Attention CF + Temporal", version: "1.4.0",
    projectId: "proj-003", accuracy: 87.3, speed: 82, cost: 85, robustness: 76, interpretability: 70,
    parameters: "45M", trainingData: "12M user interactions", status: "staging", lastTrained: "2026-02-20",
    performanceHistory: [
      { date: "2026-01", accuracy: 82.1, latency: 55 }, { date: "2026-02", accuracy: 85.6, latency: 48 },
      { date: "2026-03", accuracy: 87.3, latency: 45 },
    ],
  },
  {
    id: "mod-004", name: "Sentinel-GNN", architecture: "GAT + Online VAE", version: "4.1.0",
    projectId: "proj-004", accuracy: 96.1, speed: 95, cost: 80, robustness: 94, interpretability: 65,
    parameters: "28M", trainingData: "2.1B network flow records", status: "production", lastTrained: "2026-03-10",
    performanceHistory: [
      { date: "2025-06", accuracy: 90.2, latency: 12 }, { date: "2025-09", accuracy: 93.5, latency: 10 },
      { date: "2025-12", accuracy: 95.0, latency: 9 }, { date: "2026-03", accuracy: 96.1, latency: 8 },
    ],
  },
  {
    id: "mod-005", name: "GenSynth-Diffusion", architecture: "Latent Diffusion + CLIP", version: "0.8.2",
    projectId: "proj-005", accuracy: 78.4, speed: 35, cost: 40, robustness: 55, interpretability: 45,
    parameters: "1.2B", trainingData: "15M image-text pairs", status: "training", lastTrained: "2026-03-25",
    performanceHistory: [
      { date: "2026-02", accuracy: 65.0, latency: 180 }, { date: "2026-03", accuracy: 78.4, latency: 120 },
    ],
  },
  {
    id: "mod-006", name: "CogniGraph-RE", architecture: "REBEL + TransE/RotatE Ensemble", version: "2.1.0",
    projectId: "proj-006", accuracy: 89.6, speed: 78, cost: 75, robustness: 83, interpretability: 88,
    parameters: "180M", trainingData: "3.5M document triples", status: "staging", lastTrained: "2026-02-28",
    performanceHistory: [
      { date: "2025-10", accuracy: 80.4, latency: 50 }, { date: "2025-12", accuracy: 85.1, latency: 42 },
      { date: "2026-01", accuracy: 87.8, latency: 38 }, { date: "2026-02", accuracy: 89.6, latency: 35 },
    ],
  },
  {
    id: "mod-007", name: "TemporalNet-SA", architecture: "TCN + Sparse Attention", version: "1.7.3",
    projectId: "proj-007", accuracy: 92.8, speed: 90, cost: 88, robustness: 86, interpretability: 82,
    parameters: "15M", trainingData: "5 years daily market data (500+ assets)", status: "staging", lastTrained: "2026-03-15",
    performanceHistory: [
      { date: "2025-12", accuracy: 85.2, latency: 25 }, { date: "2026-01", accuracy: 89.4, latency: 20 },
      { date: "2026-02", accuracy: 91.5, latency: 18 }, { date: "2026-03", accuracy: 92.8, latency: 18 },
    ],
  },
  {
    id: "mod-008", name: "BioSeq-ESM", architecture: "ESM-2 650M + GNN Head", version: "0.3.1",
    projectId: "proj-008", accuracy: 82.1, speed: 45, cost: 35, robustness: 68, interpretability: 55,
    parameters: "650M", trainingData: "UniRef90 + proprietary protein DB", status: "training", lastTrained: "2026-03-26",
    performanceHistory: [
      { date: "2026-03", accuracy: 82.1, latency: 90 },
    ],
  },
];

export const insights: Insight[] = [
  {
    id: "ins-001", category: "success", title: "Sentinel achieves production-grade accuracy",
    description: "Sentinel Anomaly Detector has reached 96.1% detection accuracy with <2% false positive rate, exceeding all production deployment thresholds. The GNN approach proved critical for capturing lateral movement patterns.",
    sourceExperiment: "GNN Threat Graphs", confidence: 97, date: "2026-03-24", impact: "high",
  },
  {
    id: "ins-002", category: "success", title: "NeuralSense multilingual distillation success",
    description: "Knowledge distillation reduced model size by 75% while retaining 96.8% of accuracy. This enables deployment on edge devices and reduces inference costs by 68%.",
    sourceExperiment: "Multilingual Distillation", confidence: 95, date: "2026-02-14", impact: "high",
  },
  {
    id: "ins-003", category: "warning", title: "GenSynth inference latency exceeds target",
    description: "Current diffusion model requires 120ms per generation step — 2.4x above the 50ms production target. Optimization through step reduction or distillation needed before deployment.",
    sourceExperiment: "Diffusion Text-to-Image", confidence: 88, date: "2026-03-20", impact: "high",
  },
  {
    id: "ins-004", category: "trend", title: "Transformer architectures dominating across domains",
    description: "5 of 8 active projects now use transformer-based architectures. Attention mechanisms show consistent improvements of 8-15% over RNN/CNN baselines across NLP, vision, and time series tasks.",
    sourceExperiment: "Multiple", confidence: 92, date: "2026-03-15", impact: "medium",
  },
  {
    id: "ins-005", category: "discovery", title: "Cross-domain transfer learning breakthrough",
    description: "NeuralSense embeddings transfer effectively to CogniGraph entity extraction, reducing training time by 40%. Suggests shared representations across NLP sub-tasks are more universal than expected.",
    sourceExperiment: "Triple Extraction REBEL", confidence: 85, date: "2026-01-28", impact: "high",
  },
  {
    id: "ins-006", category: "warning", title: "Cold-start problem persists in SynapseRec",
    description: "Recommendation quality degrades significantly for new users with <5 interactions. Context-aware embeddings partially mitigate but don't solve the fundamental cold-start challenge.",
    sourceExperiment: "Context-Aware Embeddings", confidence: 90, date: "2026-02-10", impact: "medium",
  },
  {
    id: "ins-007", category: "success", title: "TemporalNet outperforms LSTM baselines consistently",
    description: "TCN + sparse attention architecture shows 15% improvement on 30-day forecasting with interpretable attention weights. Financial team confirms operational value.",
    sourceExperiment: "Attention Augmentation", confidence: 93, date: "2026-02-28", impact: "high",
  },
  {
    id: "ins-008", category: "trend", title: "Model quantization becoming essential for deployment",
    description: "EdgeOptimizer results show INT8 quantization achieves 99.2% accuracy retention with 2.8x speedup. Trend towards deploying quantized models is accelerating across all production deployments.",
    sourceExperiment: "INT8 Quantization Study", confidence: 96, date: "2026-01-15", impact: "medium",
  },
  {
    id: "ins-009", category: "discovery", title: "GNN architectures reveal hidden network patterns",
    description: "Sentinel's graph neural network uncovered previously unknown attack correlation patterns in network traffic. Security team identified 3 novel attack vectors from attention analysis.",
    sourceExperiment: "GNN Threat Graphs", confidence: 89, date: "2025-08-15", impact: "high",
  },
  {
    id: "ins-010", category: "warning", title: "GPU resource contention increasing",
    description: "3 experiments currently queued due to GPU allocation constraints. BioSeq and GenSynth projects competing for A100 time. Need to evaluate cloud burst capacity.",
    sourceExperiment: "Multiple", confidence: 94, date: "2026-03-25", impact: "medium",
  },
  {
    id: "ins-011", category: "trend", title: "Protein structure prediction converging on GNN+LM approach",
    description: "BioSeq's combination of ESM-2 language model features with graph neural networks mirrors state-of-art trends. Preliminary results suggest competitive performance with AlphaFold on novel proteins.",
    sourceExperiment: "ESM-2 Fine-tuning", confidence: 78, date: "2026-03-18", impact: "medium",
  },
  {
    id: "ins-012", category: "success", title: "RAG reduces hallucination rate below 7%",
    description: "VoxAgent's retrieval-augmented generation system achieved 6.2% hallucination rate, approaching the <5% production target. Dense passage retrieval significantly improves factual grounding.",
    sourceExperiment: "RAG Knowledge Grounding", confidence: 87, date: "2026-02-25", impact: "medium",
  },
  {
    id: "ins-013", category: "discovery", title: "Sparse attention enables interpretable forecasting",
    description: "TemporalNet's sparse attention patterns reveal which historical time points most influence predictions, enabling human analysts to validate model reasoning and build trust.",
    sourceExperiment: "Attention Augmentation", confidence: 91, date: "2026-02-02", impact: "medium",
  },
  {
    id: "ins-014", category: "warning", title: "CortexVision small object detection gap",
    description: "Despite 91.2% overall mAP, small object detection (< 32x32 pixels) remains at 67.3%. Urban drone navigation requires improvement to >85% for safety certification.",
    sourceExperiment: "YOLOv8 Urban Detection", confidence: 92, date: "2026-03-05", impact: "high",
  },
  {
    id: "ins-015", category: "trend", title: "Online learning adoption growing for streaming data",
    description: "Sentinel's success with online learning (22-min adaptation window) is driving interest in similar approaches for TemporalNet and SynapseRec. Real-time adaptation is becoming a key differentiator.",
    sourceExperiment: "Streaming Anomaly v2", confidence: 86, date: "2026-03-12", impact: "medium",
  },
  {
    id: "ins-016", category: "discovery", title: "NAS finds compact architectures rivaling manual design",
    description: "EdgeOptimizer's neural architecture search discovered models 35% faster to train with comparable accuracy. Hardware-aware constraints produced architectures naturally suited to edge deployment.",
    sourceExperiment: "Neural Architecture Search", confidence: 83, date: "2025-11-10", impact: "medium",
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
