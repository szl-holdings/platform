import { Router, type IRouter } from "express";
import { incaMockProvider, createProvider, type DataProvider, type IncaModel } from "@workspace/services";
import { sendSuccess } from "../lib/api-response";

const router: IRouter = Router();

const liveProvider: DataProvider<IncaModel> = {
  mode: "live",
  async getAll() { return []; },
  async getById() { return null; },
  async search() { return []; },
};

const provider = createProvider("inca", incaMockProvider, liveProvider);

router.get("/inca/health", (_req, res) => {
  res.json({
    service: "inca",
    status: "ok",
    providerMode: provider.mode,
    timestamp: new Date().toISOString(),
  });
});

router.get("/inca/provider/models", async (_req, res) => {
  const data = await provider.getAll();
  res.json({
    data,
    meta: { page: 1, limit: 25, total: data.length },
  });
});

router.get("/inca/provider/models/:id", async (req, res) => {
  const model = await provider.getById(req.params.id);
  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }
  res.json({ data: model });
});

router.get("/inca/search", async (req, res) => {
  const query = (req.query.q as string) || "";
  const results = await provider.search(query);
  res.json({
    data: results,
    meta: { page: 1, limit: 25, total: results.length },
  });
});

const projects = [
  { id: "proj-001", name: "NeuralSense NLP Engine", description: "Advanced natural language processing pipeline for multi-lingual sentiment analysis and entity extraction across enterprise communication channels.", status: "deployed", domain: "NLP", accuracy: 94.7, loss: 0.082, inferenceTime: 12, startDate: "2025-06-15", lastUpdated: "2026-03-20", progress: 100, experimentIds: ["exp-001", "exp-002", "exp-003"], modelIds: ["mod-001"], team: [{ name: "Dr. Elena Vasquez", role: "Lead Researcher", avatar: "EV" }, { name: "Marcus Chen", role: "ML Engineer", avatar: "MC" }, { name: "Priya Sharma", role: "Data Scientist", avatar: "PS" }] },
  { id: "proj-002", name: "Cortex Vision System", description: "Real-time object detection and scene understanding for autonomous drone navigation in complex urban environments.", status: "testing", domain: "Computer Vision", accuracy: 91.2, loss: 0.124, inferenceTime: 28, startDate: "2025-09-01", lastUpdated: "2026-03-22", progress: 78, experimentIds: ["exp-004", "exp-005", "exp-006"], modelIds: ["mod-002"], team: [{ name: "Dr. James Park", role: "Principal Scientist", avatar: "JP" }, { name: "Sarah Mitchell", role: "CV Engineer", avatar: "SM" }, { name: "Raj Patel", role: "Robotics Lead", avatar: "RP" }, { name: "Lisa Wang", role: "ML Engineer", avatar: "LW" }] },
  { id: "proj-003", name: "SynapseRec Engine", description: "Context-aware recommendation system using deep collaborative filtering and transformer attention.", status: "development", domain: "Recommendation Systems", accuracy: 87.3, loss: 0.198, inferenceTime: 45, startDate: "2025-11-10", lastUpdated: "2026-03-18", progress: 52, experimentIds: ["exp-007", "exp-008"], modelIds: ["mod-003"], team: [{ name: "Dr. Anna Kowalski", role: "Research Lead", avatar: "AK" }, { name: "David Okonjo", role: "Backend Engineer", avatar: "DO" }] },
  { id: "proj-004", name: "Sentinel Anomaly Detector", description: "Unsupervised anomaly detection for network traffic analysis, identifying zero-day threats.", status: "deployed", domain: "Anomaly Detection", accuracy: 96.1, loss: 0.053, inferenceTime: 8, startDate: "2025-04-20", lastUpdated: "2026-03-24", progress: 100, experimentIds: ["exp-009", "exp-010", "exp-011"], modelIds: ["mod-004"], team: [{ name: "Dr. Omar Hassan", role: "Security AI Lead", avatar: "OH" }, { name: "Yuki Tanaka", role: "ML Engineer", avatar: "YT" }, { name: "Chris Adler", role: "DevOps Engineer", avatar: "CA" }] },
  { id: "proj-005", name: "GenSynth Generative Studio", description: "Multi-modal generative AI for creative content synthesis.", status: "research", domain: "Generative AI", accuracy: 78.4, loss: 0.312, inferenceTime: 120, startDate: "2026-01-08", lastUpdated: "2026-03-25", progress: 25, experimentIds: ["exp-012", "exp-013"], modelIds: ["mod-005"], team: [{ name: "Dr. Maya Rodriguez", role: "Creative AI Lead", avatar: "MR" }, { name: "Alex Kim", role: "Research Scientist", avatar: "AK2" }] },
  { id: "proj-006", name: "CogniGraph Knowledge Engine", description: "Knowledge graph construction and reasoning system.", status: "development", domain: "Knowledge Graphs", accuracy: 89.6, loss: 0.145, inferenceTime: 35, startDate: "2025-08-15", lastUpdated: "2026-03-21", progress: 60, experimentIds: ["exp-014", "exp-015"], modelIds: ["mod-006"], team: [{ name: "Dr. Fiona Campbell", role: "Graph AI Lead", avatar: "FC" }, { name: "Tobias Mueller", role: "NLP Engineer", avatar: "TM" }, { name: "Nina Ivanova", role: "Data Engineer", avatar: "NI" }] },
  { id: "proj-007", name: "TemporalNet Forecaster", description: "Time-series forecasting with attention-augmented temporal convolutional networks.", status: "testing", domain: "Time Series", accuracy: 92.8, loss: 0.097, inferenceTime: 18, startDate: "2025-10-05", lastUpdated: "2026-03-23", progress: 85, experimentIds: ["exp-016", "exp-017", "exp-018"], modelIds: ["mod-007"], team: [{ name: "Dr. Leo Zhang", role: "Quantitative Lead", avatar: "LZ" }, { name: "Emma Larsson", role: "ML Engineer", avatar: "EL" }] },
  { id: "proj-008", name: "BioSeq Protein Predictor", description: "Protein structure and function prediction using graph neural networks.", status: "research", domain: "Computational Biology", accuracy: 82.1, loss: 0.245, inferenceTime: 90, startDate: "2026-02-01", lastUpdated: "2026-03-26", progress: 18, experimentIds: ["exp-019", "exp-020", "exp-021"], modelIds: ["mod-008"], team: [{ name: "Dr. Aisha Nkemelu", role: "BioAI Lead", avatar: "AN" }, { name: "Patrick Sullivan", role: "Bioinformatics Eng", avatar: "PS2" }, { name: "Hannah Lee", role: "Research Scientist", avatar: "HL" }] },
  { id: "proj-009", name: "VoxAgent Dialogue System", description: "End-to-end conversational AI with dynamic persona adaptation.", status: "development", domain: "Conversational AI", accuracy: 85.9, loss: 0.176, inferenceTime: 55, startDate: "2025-12-01", lastUpdated: "2026-03-19", progress: 40, experimentIds: ["exp-022", "exp-023"], modelIds: [], team: [{ name: "Dr. Ryan Torres", role: "Dialogue Systems Lead", avatar: "RT" }, { name: "Mia Johnson", role: "NLU Engineer", avatar: "MJ" }] },
  { id: "proj-010", name: "EdgeOptimizer Compiler", description: "Neural network optimization and quantization toolkit for edge devices.", status: "testing", domain: "MLOps", accuracy: 93.4, loss: 0.089, inferenceTime: 5, startDate: "2025-07-22", lastUpdated: "2026-03-24", progress: 72, experimentIds: ["exp-024", "exp-025"], modelIds: [], team: [{ name: "Kai Hoffman", role: "Compiler Engineer", avatar: "KH" }, { name: "Zara Osei", role: "Hardware ML Lead", avatar: "ZO" }] },
];

const experiments = [
  { id: "exp-001", projectId: "proj-001", name: "BERT Fine-tuning v3", hypothesis: "Fine-tuning BERT-large with domain-specific corpora will improve sentiment classification F1 by 5-8%.", results: "Achieved 6.2% improvement in F1 score.", status: "completed", hyperparameters: { learningRate: 2e-5, batchSize: 32, epochs: 20 }, startDate: "2025-08-10", endDate: "2025-08-18", duration: "8d 4h" },
  { id: "exp-002", projectId: "proj-001", name: "Entity Extraction Transformer", hypothesis: "A custom transformer with CRF head will outperform spaCy NER by 10%+.", results: "12.4% improvement in entity F1.", status: "completed", hyperparameters: { learningRate: 3e-5, batchSize: 16, epochs: 15 }, startDate: "2025-09-01", endDate: "2025-09-12", duration: "11d 2h" },
  { id: "exp-003", projectId: "proj-001", name: "Multilingual Distillation", hypothesis: "Knowledge distillation will retain 95%+ accuracy.", results: "Student model retained 96.8% of teacher accuracy.", status: "completed", hyperparameters: { learningRate: 5e-5, batchSize: 64, epochs: 12 }, startDate: "2025-11-05", endDate: "2025-11-14", duration: "9d 6h" },
  { id: "exp-004", projectId: "proj-002", name: "YOLOv8 Urban Detection", hypothesis: "YOLOv8-X with custom anchors will achieve >90% mAP@0.5.", results: "Achieved 91.2% mAP@0.5.", status: "completed", hyperparameters: { learningRate: 1e-3, batchSize: 8, epochs: 25 }, startDate: "2025-10-15", endDate: "2025-11-10", duration: "26d 8h" },
  { id: "exp-005", projectId: "proj-002", name: "Scene Segmentation ViT", hypothesis: "Vision transformer with hierarchical attention will improve scene segmentation IoU by 8%.", results: "7.6% IoU improvement.", status: "completed", hyperparameters: { learningRate: 5e-4, batchSize: 4, epochs: 18 }, startDate: "2025-12-01", endDate: "2025-12-22", duration: "21d 5h" },
  { id: "exp-006", projectId: "proj-002", name: "Depth Estimation Fusion", hypothesis: "Fusing monocular depth with LiDAR will reduce depth error by 15%.", results: "Preliminary 11% error reduction at epoch 12.", status: "running", hyperparameters: { learningRate: 2e-4, batchSize: 2, epochs: 30 }, startDate: "2026-03-10", endDate: null, duration: "16d (running)" },
  { id: "exp-007", projectId: "proj-003", name: "Attention-Based CF", hypothesis: "Self-attention over user-item interaction graphs will capture higher-order collaborative signals.", results: "NDCG@10 improved by 4.8%.", status: "completed", hyperparameters: { learningRate: 1e-3, batchSize: 256, epochs: 10 }, startDate: "2026-01-05", endDate: "2026-01-12", duration: "7d 3h" },
  { id: "exp-008", projectId: "proj-003", name: "Context-Aware Embeddings", hypothesis: "Session-aware embeddings with temporal decay will improve recommendation freshness by 20%.", results: "Freshness improved 18.5%.", status: "completed", hyperparameters: { learningRate: 5e-4, batchSize: 128, epochs: 8 }, startDate: "2026-02-01", endDate: "2026-02-07", duration: "6d 10h" },
  { id: "exp-009", projectId: "proj-004", name: "Autoencoder Baseline", hypothesis: "VAE will establish strong baseline with <2% FPR.", results: "Achieved 1.8% FPR with 94.3% detection rate.", status: "completed", hyperparameters: { learningRate: 1e-3, batchSize: 512, epochs: 15 }, startDate: "2025-05-15", endDate: "2025-05-28", duration: "13d 1h" },
  { id: "exp-010", projectId: "proj-004", name: "GNN Threat Graphs", hypothesis: "GNN over network flow graphs will detect lateral movement with 95%+ recall.", results: "96.1% recall achieved.", status: "completed", hyperparameters: { learningRate: 5e-4, batchSize: 32, epochs: 20 }, startDate: "2025-07-01", endDate: "2025-07-22", duration: "21d 7h" },
  { id: "exp-011", projectId: "proj-004", name: "Streaming Anomaly v2", hypothesis: "Online learning approach will adapt to concept drift within 30-minute windows.", results: "Adaptation window achieved at 22 minutes.", status: "completed", hyperparameters: { batchSize: 64, epochs: 10, windowSize: 1800 }, startDate: "2025-09-10", endDate: "2025-09-18", duration: "8d 5h" },
  { id: "exp-012", projectId: "proj-005", name: "Diffusion Text-to-Image", hypothesis: "Latent diffusion with CLIP guidance will generate images with FID < 15.", results: "Current FID at 18.4.", status: "running", hyperparameters: { learningRate: 1e-4, batchSize: 4, epochs: 50 }, startDate: "2026-02-15", endDate: null, duration: "39d (running)" },
  { id: "exp-013", projectId: "proj-005", name: "Audio Style Transfer", hypothesis: "Mel-spectrogram manipulation via neural style transfer will enable real-time audio morphing.", results: "Queued for GPU allocation.", status: "queued", hyperparameters: { learningRate: 3e-4, batchSize: 8, epochs: 30 }, startDate: "2026-03-28", endDate: null, duration: "Queued" },
  { id: "exp-014", projectId: "proj-006", name: "Triple Extraction REBEL", hypothesis: "REBEL-based triple extraction with domain fine-tuning will achieve >85% relation F1.", results: "Relation F1 at 87.2%.", status: "completed", hyperparameters: { learningRate: 2e-5, batchSize: 16, epochs: 12 }, startDate: "2025-10-20", endDate: "2025-11-05", duration: "16d 3h" },
  { id: "exp-015", projectId: "proj-006", name: "Graph Reasoning Engine", hypothesis: "TransE + RotatE ensemble will improve link prediction MRR by 12%.", results: "MRR improvement of 10.8%.", status: "completed", hyperparameters: { learningRate: 1e-3, batchSize: 512, epochs: 15 }, startDate: "2026-01-15", endDate: "2026-02-02", duration: "18d 7h" },
  { id: "exp-016", projectId: "proj-007", name: "TCN Baseline", hypothesis: "TCN will outperform LSTM baselines on multi-step forecasting.", results: "TCN reduces RMSE by 8.5% vs LSTM.", status: "completed", hyperparameters: { learningRate: 5e-4, batchSize: 64, epochs: 12 }, startDate: "2025-11-15", endDate: "2025-11-28", duration: "13d 2h" },
  { id: "exp-017", projectId: "proj-007", name: "Attention Augmentation", hypothesis: "Sparse attention on TCN will capture long-range dependencies.", results: "15% improvement on 30-day forecasting.", status: "completed", hyperparameters: { learningRate: 3e-4, batchSize: 32, epochs: 15 }, startDate: "2026-01-10", endDate: "2026-01-28", duration: "18d 9h" },
  { id: "exp-018", projectId: "proj-007", name: "Multi-Asset Ensemble", hypothesis: "Cross-asset correlation features will improve portfolio-level prediction.", results: "Preliminary 3.2% improvement.", status: "running", hyperparameters: { learningRate: 2e-4, batchSize: 16, epochs: 20 }, startDate: "2026-03-05", endDate: null, duration: "21d (running)" },
  { id: "exp-019", projectId: "proj-008", name: "ESM-2 Fine-tuning", hypothesis: "Fine-tuning ESM-2 will improve structure prediction TM-score.", results: "Preliminary TM-score of 0.82.", status: "running", hyperparameters: { learningRate: 1e-5, batchSize: 2, epochs: 20 }, startDate: "2026-03-01", endDate: null, duration: "25d (running)" },
  { id: "exp-020", projectId: "proj-008", name: "GNN Binding Prediction", hypothesis: "GNN on molecular graphs will predict binding affinity with R² > 0.75.", results: "Queued after ESM-2 experiment.", status: "queued", hyperparameters: { learningRate: 5e-4, batchSize: 32, epochs: 25 }, startDate: "2026-04-01", endDate: null, duration: "Queued" },
  { id: "exp-021", projectId: "proj-008", name: "Contact Map Prediction", hypothesis: "Residue-level contact prediction will achieve >80% long-range precision.", results: "Data preprocessing pipeline being validated.", status: "queued", hyperparameters: { learningRate: 3e-4, batchSize: 8, epochs: 30 }, startDate: "2026-04-15", endDate: null, duration: "Queued" },
  { id: "exp-022", projectId: "proj-009", name: "Persona-Adaptive LLM", hypothesis: "Fine-tuning with persona-specific instruction data will enable dynamic tone adaptation.", results: "Persona consistency improved 22%.", status: "completed", hyperparameters: { learningRate: 2e-5, batchSize: 4, epochs: 10 }, startDate: "2026-01-20", endDate: "2026-02-05", duration: "16d 11h" },
  { id: "exp-023", projectId: "proj-009", name: "RAG Knowledge Grounding", hypothesis: "RAG with dense passage retrieval will reduce hallucination rate to <5%.", results: "Hallucination rate at 6.2%.", status: "completed", hyperparameters: { learningRate: 1e-4, batchSize: 8, epochs: 8 }, startDate: "2026-02-10", endDate: "2026-02-22", duration: "12d 5h" },
  { id: "exp-024", projectId: "proj-010", name: "INT8 Quantization Study", hypothesis: "Post-training INT8 quantization will retain 99% accuracy.", results: "99.2% accuracy retention. 2.8x speedup.", status: "completed", hyperparameters: { calibrationSamples: 1000, quantizationScheme: "symmetric" }, startDate: "2025-09-01", endDate: "2025-09-08", duration: "7d 2h" },
  { id: "exp-025", projectId: "proj-010", name: "Neural Architecture Search", hypothesis: "NAS with hardware-aware constraints will find architectures 40% faster.", results: "Found architecture 35% faster.", status: "completed", hyperparameters: { searchSpace: "mobile-v3", maxLatency: "10ms" }, startDate: "2025-10-10", endDate: "2025-11-05", duration: "26d 4h" },
];

const incaModels = [
  { id: "mod-001", name: "NeuralSense-v3", architecture: "BERT-Large + CRF", version: "3.2.1", projectId: "proj-001", accuracy: 94.7, speed: 88, cost: 72, robustness: 91, interpretability: 78, parameters: "340M", trainingData: "4.2M labeled sentences", status: "production", lastTrained: "2026-02-15", performanceHistory: [{ date: "2025-08", accuracy: 88.5, latency: 18 }, { date: "2025-10", accuracy: 91.2, latency: 15 }, { date: "2025-12", accuracy: 93.1, latency: 13 }, { date: "2026-02", accuracy: 94.7, latency: 12 }] },
  { id: "mod-002", name: "CortexVision-X", architecture: "YOLOv8-X + ViT Hybrid", version: "2.0.4", projectId: "proj-002", accuracy: 91.2, speed: 75, cost: 65, robustness: 82, interpretability: 60, parameters: "98M", trainingData: "850K annotated frames", status: "staging", lastTrained: "2026-03-01", performanceHistory: [{ date: "2025-11", accuracy: 84.3, latency: 42 }, { date: "2026-01", accuracy: 88.7, latency: 34 }, { date: "2026-02", accuracy: 90.1, latency: 30 }, { date: "2026-03", accuracy: 91.2, latency: 28 }] },
  { id: "mod-003", name: "SynapseRec-ATT", architecture: "Self-Attention CF + Temporal", version: "1.4.0", projectId: "proj-003", accuracy: 87.3, speed: 82, cost: 85, robustness: 76, interpretability: 70, parameters: "45M", trainingData: "12M user interactions", status: "staging", lastTrained: "2026-02-20", performanceHistory: [{ date: "2026-01", accuracy: 82.1, latency: 55 }, { date: "2026-02", accuracy: 85.6, latency: 48 }, { date: "2026-03", accuracy: 87.3, latency: 45 }] },
  { id: "mod-004", name: "Sentinel-GNN", architecture: "GAT + Online VAE", version: "4.1.0", projectId: "proj-004", accuracy: 96.1, speed: 95, cost: 80, robustness: 94, interpretability: 65, parameters: "28M", trainingData: "2.1B network flow records", status: "production", lastTrained: "2026-03-10", performanceHistory: [{ date: "2025-06", accuracy: 90.2, latency: 12 }, { date: "2025-09", accuracy: 93.5, latency: 10 }, { date: "2025-12", accuracy: 95.0, latency: 9 }, { date: "2026-03", accuracy: 96.1, latency: 8 }] },
  { id: "mod-005", name: "GenSynth-Diffusion", architecture: "Latent Diffusion + CLIP", version: "0.8.2", projectId: "proj-005", accuracy: 78.4, speed: 35, cost: 40, robustness: 55, interpretability: 45, parameters: "1.2B", trainingData: "15M image-text pairs", status: "training", lastTrained: "2026-03-25", performanceHistory: [{ date: "2026-02", accuracy: 65.0, latency: 180 }, { date: "2026-03", accuracy: 78.4, latency: 120 }] },
  { id: "mod-006", name: "CogniGraph-RE", architecture: "REBEL + TransE/RotatE Ensemble", version: "2.1.0", projectId: "proj-006", accuracy: 89.6, speed: 78, cost: 75, robustness: 83, interpretability: 88, parameters: "180M", trainingData: "3.5M document triples", status: "staging", lastTrained: "2026-02-28", performanceHistory: [{ date: "2025-10", accuracy: 80.4, latency: 50 }, { date: "2025-12", accuracy: 85.1, latency: 42 }, { date: "2026-01", accuracy: 87.8, latency: 38 }, { date: "2026-02", accuracy: 89.6, latency: 35 }] },
  { id: "mod-007", name: "TemporalNet-SA", architecture: "TCN + Sparse Attention", version: "1.7.3", projectId: "proj-007", accuracy: 92.8, speed: 90, cost: 88, robustness: 86, interpretability: 82, parameters: "15M", trainingData: "5 years daily market data", status: "staging", lastTrained: "2026-03-15", performanceHistory: [{ date: "2025-12", accuracy: 85.2, latency: 25 }, { date: "2026-01", accuracy: 89.4, latency: 20 }, { date: "2026-02", accuracy: 91.5, latency: 18 }, { date: "2026-03", accuracy: 92.8, latency: 18 }] },
  { id: "mod-008", name: "BioSeq-ESM", architecture: "ESM-2 650M + GNN Head", version: "0.3.1", projectId: "proj-008", accuracy: 82.1, speed: 45, cost: 35, robustness: 68, interpretability: 55, parameters: "650M", trainingData: "UniRef90 + proprietary protein DB", status: "training", lastTrained: "2026-03-26", performanceHistory: [{ date: "2026-03", accuracy: 82.1, latency: 90 }] },
];

const insights = [
  { id: "ins-001", category: "success", title: "Sentinel achieves production-grade accuracy", description: "Sentinel Anomaly Detector has reached 96.1% detection accuracy with <2% false positive rate.", sourceExperiment: "GNN Threat Graphs", confidence: 97, date: "2026-03-24", impact: "high" },
  { id: "ins-002", category: "success", title: "NeuralSense multilingual distillation success", description: "Knowledge distillation reduced model size by 75% while retaining 96.8% of accuracy.", sourceExperiment: "Multilingual Distillation", confidence: 95, date: "2026-02-14", impact: "high" },
  { id: "ins-003", category: "warning", title: "GenSynth inference latency exceeds target", description: "Current diffusion model requires 120ms per generation step — 2.4x above the 50ms production target.", sourceExperiment: "Diffusion Text-to-Image", confidence: 88, date: "2026-03-20", impact: "high" },
  { id: "ins-004", category: "trend", title: "Transformer architectures dominating across domains", description: "5 of 8 active projects now use transformer-based architectures.", sourceExperiment: "Multiple", confidence: 92, date: "2026-03-15", impact: "medium" },
  { id: "ins-005", category: "discovery", title: "Cross-domain transfer learning breakthrough", description: "NeuralSense embeddings transfer effectively to CogniGraph entity extraction, reducing training time by 40%.", sourceExperiment: "Triple Extraction REBEL", confidence: 85, date: "2026-01-28", impact: "high" },
  { id: "ins-006", category: "warning", title: "Cold-start problem persists in SynapseRec", description: "Recommendation quality degrades significantly for new users with <5 interactions.", sourceExperiment: "Context-Aware Embeddings", confidence: 90, date: "2026-02-10", impact: "medium" },
  { id: "ins-007", category: "success", title: "TemporalNet outperforms LSTM baselines consistently", description: "TCN + sparse attention shows 15% improvement on 30-day forecasting with interpretable weights.", sourceExperiment: "Attention Augmentation", confidence: 93, date: "2026-02-28", impact: "high" },
  { id: "ins-008", category: "trend", title: "Model quantization becoming essential for deployment", description: "EdgeOptimizer results show INT8 quantization achieves 99.2% accuracy retention with 2.8x speedup.", sourceExperiment: "INT8 Quantization Study", confidence: 96, date: "2026-01-15", impact: "medium" },
  { id: "ins-009", category: "discovery", title: "GNN architectures reveal hidden network patterns", description: "Sentinel's GNN uncovered previously unknown attack correlation patterns in network traffic.", sourceExperiment: "GNN Threat Graphs", confidence: 89, date: "2025-08-15", impact: "high" },
  { id: "ins-010", category: "warning", title: "GPU resource contention increasing", description: "3 experiments queued due to GPU allocation constraints. Need to evaluate cloud burst capacity.", sourceExperiment: "Multiple", confidence: 94, date: "2026-03-25", impact: "medium" },
  { id: "ins-011", category: "trend", title: "Protein structure prediction converging on GNN+LM approach", description: "BioSeq's ESM-2 + GNN combination mirrors state-of-art trends.", sourceExperiment: "ESM-2 Fine-tuning", confidence: 78, date: "2026-03-18", impact: "medium" },
  { id: "ins-012", category: "success", title: "RAG reduces hallucination rate below 7%", description: "VoxAgent's RAG system achieved 6.2% hallucination rate, approaching the <5% target.", sourceExperiment: "RAG Knowledge Grounding", confidence: 87, date: "2026-02-25", impact: "medium" },
  { id: "ins-013", category: "discovery", title: "Sparse attention enables interpretable forecasting", description: "TemporalNet's sparse attention patterns reveal which historical time points most influence predictions.", sourceExperiment: "Attention Augmentation", confidence: 91, date: "2026-02-02", impact: "medium" },
  { id: "ins-014", category: "warning", title: "CortexVision small object detection gap", description: "Small object detection (<32x32 pixels) remains at 67.3%. Needs >85% for safety certification.", sourceExperiment: "YOLOv8 Urban Detection", confidence: 92, date: "2026-03-05", impact: "high" },
  { id: "ins-015", category: "trend", title: "Online learning adoption growing for streaming data", description: "Sentinel's success with online learning is driving interest in similar approaches.", sourceExperiment: "Streaming Anomaly v2", confidence: 86, date: "2026-03-12", impact: "medium" },
  { id: "ins-016", category: "discovery", title: "NAS finds compact architectures rivaling manual design", description: "EdgeOptimizer's NAS discovered models 35% faster to train with comparable accuracy.", sourceExperiment: "Neural Architecture Search", confidence: 83, date: "2025-11-10", impact: "medium" },
];

router.get("/inca/dashboard", async (_req, res) => {
  const activeProjects = projects.length;
  const runningExperiments = experiments.filter((e) => e.status === "running").length;
  const deployedModels = incaModels.filter((m) => m.status === "production").length;
  const totalInsights = insights.length;
  const avgAccuracy = projects.reduce((s, p) => s + p.accuracy, 0) / projects.length;
  const healthScore = 82;
  sendSuccess(res, { activeProjects, runningExperiments, deployedModels, totalInsights, avgAccuracy: Number(avgAccuracy.toFixed(1)), healthScore });
});

router.get("/inca/projects", async (_req, res) => {
  sendSuccess(res, projects);
});

router.get("/inca/projects/:id", async (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  sendSuccess(res, project);
});

router.get("/inca/projects/:id/experiments", async (req, res) => {
  const projectExperiments = experiments.filter((e) => e.projectId === req.params.id);
  sendSuccess(res, projectExperiments);
});

router.get("/inca/projects/:id/models", async (req, res) => {
  const projectModels = incaModels.filter((m) => m.projectId === req.params.id);
  sendSuccess(res, projectModels);
});

router.get("/inca/experiments", async (_req, res) => {
  sendSuccess(res, experiments);
});

router.get("/inca/models", async (_req, res) => {
  sendSuccess(res, incaModels);
});

router.get("/inca/insights", async (_req, res) => {
  sendSuccess(res, insights);
});

export default router;
