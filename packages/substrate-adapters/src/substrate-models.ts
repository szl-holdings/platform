export interface SubstrateModelSpec {
  id: string;
  name: string;
  family: string;
  parameterCount: string;
  contextLength: number;
  modalities: ('text' | 'image' | 'audio')[];
  minVramGb: number;
  recommendedVramGb: number;
  supportsSsdOffload: boolean;
  tags: string[];
}

export const SUBSTRATE_MODEL_CATALOG: SubstrateModelSpec[] = [
  {
    id: 'llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    family: 'llama',
    parameterCount: '70B',
    contextLength: 131072,
    modalities: ['text'],
    minVramGb: 8,
    recommendedVramGb: 24,
    supportsSsdOffload: true,
    tags: ['reasoning', 'generation', 'planning'],
  },
  {
    id: 'llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    family: 'llama',
    parameterCount: '8B',
    contextLength: 131072,
    modalities: ['text'],
    minVramGb: 6,
    recommendedVramGb: 8,
    supportsSsdOffload: false,
    tags: ['triage', 'classification', 'extraction', 'summarization'],
  },
  {
    id: 'qwen3-next-80b',
    name: 'Qwen3-Next 80B',
    family: 'qwen',
    parameterCount: '80B',
    contextLength: 131072,
    modalities: ['text'],
    minVramGb: 8,
    recommendedVramGb: 24,
    supportsSsdOffload: true,
    tags: ['reasoning', 'generation', 'planning'],
  },
  {
    id: 'gemma3-12b',
    name: 'Gemma3 12B',
    family: 'gemma',
    parameterCount: '12B',
    contextLength: 32768,
    modalities: ['text', 'image'],
    minVramGb: 8,
    recommendedVramGb: 12,
    supportsSsdOffload: false,
    tags: ['reasoning', 'generation', 'summarization'],
  },
  {
    id: 'gpt-oss-20b',
    name: 'GPT-OSS 20B',
    family: 'gpt-oss',
    parameterCount: '20B',
    contextLength: 65536,
    modalities: ['text'],
    minVramGb: 8,
    recommendedVramGb: 16,
    supportsSsdOffload: true,
    tags: ['reasoning', 'generation', 'triage'],
  },
  {
    id: 'voxtral-small-24b',
    name: 'Voxtral Small 24B',
    family: 'voxtral',
    parameterCount: '24B',
    contextLength: 32768,
    modalities: ['text', 'audio'],
    minVramGb: 8,
    recommendedVramGb: 16,
    supportsSsdOffload: true,
    tags: ['generation', 'summarization'],
  },
];

export function getModelSpec(modelId: string): SubstrateModelSpec | undefined {
  return SUBSTRATE_MODEL_CATALOG.find((m) => m.id === modelId);
}

export function getModelsByModality(modality: 'text' | 'image' | 'audio'): SubstrateModelSpec[] {
  return SUBSTRATE_MODEL_CATALOG.filter((m) => m.modalities.includes(modality));
}

export function getModelsByTag(tag: string): SubstrateModelSpec[] {
  return SUBSTRATE_MODEL_CATALOG.filter((m) => m.tags.includes(tag));
}
