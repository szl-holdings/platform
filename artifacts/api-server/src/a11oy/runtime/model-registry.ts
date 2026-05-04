export type ModelCapability = 'embeddings' | 'retrieval' | 'ocr' | 'geospatial' | 'eval_grading' | 'reasoning' | 'classification' | 'summarization';
export type LicenseStatus = 'approved' | 'pending_review' | 'rejected' | 'unknown';

export interface ModelRegistryEntry {
  id: string;
  provider: string;
  modelId: string;
  capability: ModelCapability;
  license: string;
  licenseStatus: LicenseStatus;
  sensitivityAllowance: 'public' | 'internal' | 'confidential' | 'restricted';
  envGate: string | null;
  productionApproved: boolean;
  description: string;
  addedAt: string;
}

export interface HfGateResult {
  allowed: boolean;
  failedConditions: string[];
  conditions: Record<string, boolean>;
}

const registry = new Map<string, ModelRegistryEntry>();

const SEED_MODELS: ModelRegistryEntry[] = [
  {
    id: 'model-bge-large',
    provider: 'huggingface',
    modelId: 'BAAI/bge-large-en-v1.5',
    capability: 'embeddings',
    license: 'MIT',
    licenseStatus: 'approved',
    sensitivityAllowance: 'internal',
    envGate: 'SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL',
    productionApproved: false,
    description: 'BGE-large-en-v1.5 embeddings model for semantic search and RAG pipelines.',
    addedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  },
  {
    id: 'model-bge-m3',
    provider: 'huggingface',
    modelId: 'BAAI/bge-m3',
    capability: 'embeddings',
    license: 'MIT',
    licenseStatus: 'approved',
    sensitivityAllowance: 'internal',
    envGate: 'SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL',
    productionApproved: false,
    description: 'BGE-M3 multilingual embeddings for cross-language retrieval.',
    addedAt: new Date(Date.now() - 28 * 86_400_000).toISOString(),
  },
  {
    id: 'model-bart-summarize',
    provider: 'huggingface',
    modelId: 'facebook/bart-large-cnn',
    capability: 'summarization',
    license: 'MIT',
    licenseStatus: 'approved',
    sensitivityAllowance: 'public',
    envGate: null,
    productionApproved: false,
    description: 'BART-large-CNN for document summarization across legal and maritime domains.',
    addedAt: new Date(Date.now() - 25 * 86_400_000).toISOString(),
  },
  {
    id: 'model-legal-bert',
    provider: 'huggingface',
    modelId: 'nlpaueb/legal-bert-base-uncased',
    capability: 'classification',
    license: 'CC-BY-SA-4.0',
    licenseStatus: 'approved',
    sensitivityAllowance: 'confidential',
    envGate: null,
    productionApproved: false,
    description: 'Legal-BERT for contract clause classification and legal NLP tasks.',
    addedAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
  },
  {
    id: 'model-qwen3-8b',
    provider: 'huggingface',
    modelId: 'Qwen/Qwen3-8B',
    capability: 'reasoning',
    license: 'Apache-2.0',
    licenseStatus: 'approved',
    sensitivityAllowance: 'internal',
    envGate: null,
    productionApproved: false,
    description: 'Qwen3-8B for governed reasoning tasks via HF Inference API.',
    addedAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
  },
  {
    id: 'model-tesseract-ocr',
    provider: 'local',
    modelId: 'tesseract-ocr-v5',
    capability: 'ocr',
    license: 'Apache-2.0',
    licenseStatus: 'approved',
    sensitivityAllowance: 'restricted',
    envGate: null,
    productionApproved: true,
    description: 'Tesseract OCR engine for document digitization in substrate workers.',
    addedAt: new Date(Date.now() - 60 * 86_400_000).toISOString(),
  },
  {
    id: 'model-gpt-4o',
    provider: 'openai',
    modelId: 'gpt-4o',
    capability: 'reasoning',
    license: 'Proprietary',
    licenseStatus: 'approved',
    sensitivityAllowance: 'internal',
    envGate: null,
    productionApproved: true,
    description: 'GPT-4o for primary deep reasoning, board packets, and proof reconstruction.',
    addedAt: new Date(Date.now() - 90 * 86_400_000).toISOString(),
  },
  {
    id: 'model-deepseek-r1',
    provider: 'deepseek',
    modelId: 'deepseek-reasoner',
    capability: 'classification',
    license: 'Proprietary',
    licenseStatus: 'approved',
    sensitivityAllowance: 'internal',
    envGate: null,
    productionApproved: true,
    description: 'DeepSeek R1 for cost-efficient triage, classification, and document analysis.',
    addedAt: new Date(Date.now() - 75 * 86_400_000).toISOString(),
  },
  {
    id: 'model-eval-judge',
    provider: 'internal',
    modelId: 'a11oy-eval-judge-v2',
    capability: 'eval_grading',
    license: 'Internal',
    licenseStatus: 'approved',
    sensitivityAllowance: 'restricted',
    envGate: null,
    productionApproved: true,
    description: 'Deterministic MirrorEval 2.0 judge — 14-dimension scoring.',
    addedAt: new Date(Date.now() - 120 * 86_400_000).toISOString(),
  },
  {
    id: 'model-geospatial-rf',
    provider: 'local',
    modelId: 'szl-geospatial-rf-v1',
    capability: 'geospatial',
    license: 'Internal',
    licenseStatus: 'approved',
    sensitivityAllowance: 'restricted',
    envGate: null,
    productionApproved: true,
    description: 'Random-forest geospatial risk model for AIS correlation and anomaly detection.',
    addedAt: new Date(Date.now() - 100 * 86_400_000).toISOString(),
  },
];

function seedRegistry(): void {
  for (const entry of SEED_MODELS) {
    if (!registry.has(entry.id)) {
      registry.set(entry.id, entry);
    }
  }
}

seedRegistry();

export function getModelEntry(id: string): ModelRegistryEntry | undefined {
  return registry.get(id);
}

export function listModelEntries(opts?: { provider?: string; capability?: string }): ModelRegistryEntry[] {
  let entries = Array.from(registry.values());
  if (opts?.provider) entries = entries.filter(e => e.provider === opts.provider);
  if (opts?.capability) entries = entries.filter(e => e.capability === opts.capability);
  return entries.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export function checkHfLiveRoutingGate(modelId: string): HfGateResult {
  const entry = Array.from(registry.values()).find(e => e.modelId === modelId || e.id === modelId);
  const isHfProvider = entry?.provider === 'huggingface';

  const conditions: Record<string, boolean> = {
    registry_record_exists: !!entry && isHfProvider,
    license_approved: isHfProvider && entry?.licenseStatus === 'approved',
    sensitivity_match: isHfProvider && entry ? ['public', 'internal'].includes(entry.sensitivityAllowance) : false,
    hf_live_inference_enabled: process.env.HF_ENABLE_LIVE_INFERENCE === '1',
    hf_production_approved: process.env.HF_PRODUCTION_APPROVED === '1',
  };

  const failedConditions = Object.entries(conditions)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return {
    allowed: failedConditions.length === 0,
    failedConditions,
    conditions,
  };
}

export function getRegistrySummary(): {
  totalModels: number;
  byProvider: Record<string, number>;
  byCapability: Record<string, number>;
  productionApproved: number;
  hfModels: number;
  hfLiveRoutable: number;
} {
  const entries = Array.from(registry.values());
  const byProvider: Record<string, number> = {};
  const byCapability: Record<string, number> = {};

  for (const e of entries) {
    byProvider[e.provider] = (byProvider[e.provider] ?? 0) + 1;
    byCapability[e.capability] = (byCapability[e.capability] ?? 0) + 1;
  }

  const hfModels = entries.filter(e => e.provider === 'huggingface');
  const hfLiveRoutable = hfModels.filter(e => {
    const gate = checkHfLiveRoutingGate(e.modelId);
    return gate.allowed;
  }).length;

  return {
    totalModels: entries.length,
    byProvider,
    byCapability,
    productionApproved: entries.filter(e => e.productionApproved).length,
    hfModels: hfModels.length,
    hfLiveRoutable,
  };
}
