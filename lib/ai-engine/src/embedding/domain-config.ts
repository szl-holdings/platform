import type { EmbeddingProviderType } from './provider.js';

export type EmbeddingDomain =
  | 'legal'
  | 'maritime'
  | 'security'
  | 'real-estate'
  | 'finance'
  | 'aiops'
  | 'consulting'
  | 'personal'
  | 'general';

export interface DomainEmbeddingConfig {
  domain: EmbeddingDomain;
  model: string;
  hfModel: string;
  dimensions: number;
  preferredProvider: EmbeddingProviderType;
  description: string;
}

const RAG_DB_DIMENSIONS = 1536;

function parseDimensions(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_CONFIGS: Record<EmbeddingDomain, DomainEmbeddingConfig> = {
  legal: {
    domain: 'legal',
    model: process.env.EMBED_MODEL_LEGAL || 'text-embedding-3-small',
    hfModel: process.env.HF_EMBED_MODEL_LEGAL || 'BAAI/bge-m3',
    dimensions: parseDimensions('EMBED_DIM_LEGAL', RAG_DB_DIMENSIONS),
    preferredProvider: 'replit-proxy',
    description: 'Legal document and contract text — PRISM Counsel',
  },
  maritime: {
    domain: 'maritime',
    model: process.env.EMBED_MODEL_MARITIME || 'text-embedding-3-small',
    hfModel: process.env.HF_EMBED_MODEL_MARITIME || 'BAAI/bge-m3',
    dimensions: parseDimensions('EMBED_DIM_MARITIME', RAG_DB_DIMENSIONS),
    preferredProvider: 'replit-proxy',
    description: 'Maritime, vessel, and shipping terminology — Vessels',
  },
  security: {
    domain: 'security',
    model: process.env.EMBED_MODEL_SECURITY || 'text-embedding-3-small',
    hfModel: process.env.HF_EMBED_MODEL_SECURITY || 'BAAI/bge-m3',
    dimensions: parseDimensions('EMBED_DIM_SECURITY', RAG_DB_DIMENSIONS),
    preferredProvider: 'replit-proxy',
    description: 'Security indicators, threat intelligence, and SOC analysis — Aegis',
  },
  'real-estate': {
    domain: 'real-estate',
    model: process.env.EMBED_MODEL_REAL_ESTATE || 'text-embedding-3-small',
    hfModel: process.env.HF_EMBED_MODEL_REAL_ESTATE || 'BAAI/bge-m3',
    dimensions: parseDimensions('EMBED_DIM_REAL_ESTATE', RAG_DB_DIMENSIONS),
    preferredProvider: 'replit-proxy',
    description: 'Real estate listings, property data, and market analysis — Terra',
  },
  finance: {
    domain: 'finance',
    model: process.env.EMBED_MODEL_FINANCE || 'text-embedding-3-small',
    hfModel: process.env.HF_EMBED_MODEL_FINANCE || 'BAAI/bge-m3',
    dimensions: parseDimensions('EMBED_DIM_FINANCE', RAG_DB_DIMENSIONS),
    preferredProvider: 'replit-proxy',
    description: 'Financial reports, portfolio data, and executive intelligence — SZL Holdings',
  },
  aiops: {
    domain: 'aiops',
    model: process.env.EMBED_MODEL_AIOPS || 'text-embedding-3-small',
    hfModel: process.env.HF_EMBED_MODEL_AIOPS || 'BAAI/bge-m3',
    dimensions: parseDimensions('EMBED_DIM_AIOPS', RAG_DB_DIMENSIONS),
    preferredProvider: 'replit-proxy',
    description: 'IT operations, infrastructure alerts, and AIOps signals — Lyte',
  },
  consulting: {
    domain: 'consulting',
    model: process.env.EMBED_MODEL_CONSULTING || 'text-embedding-3-small',
    hfModel: process.env.HF_EMBED_MODEL_CONSULTING || 'BAAI/bge-m3',
    dimensions: parseDimensions('EMBED_DIM_CONSULTING', RAG_DB_DIMENSIONS),
    preferredProvider: 'replit-proxy',
    description: 'Consulting engagements and client documentation — Carlota Jo',
  },
  personal: {
    domain: 'personal',
    model: process.env.EMBED_MODEL_PERSONAL || 'text-embedding-3-small',
    hfModel: process.env.HF_EMBED_MODEL_PERSONAL || 'BAAI/bge-m3',
    dimensions: parseDimensions('EMBED_DIM_PERSONAL', RAG_DB_DIMENSIONS),
    preferredProvider: 'replit-proxy',
    description: 'Personal notes, calendar context, and briefs — Stephen',
  },
  general: {
    domain: 'general',
    model: process.env.EMBED_MODEL_GENERAL || 'text-embedding-3-small',
    hfModel: process.env.HF_EMBED_MODEL || 'BAAI/bge-m3',
    dimensions: parseDimensions('EMBED_DIM_GENERAL', RAG_DB_DIMENSIONS),
    preferredProvider: 'replit-proxy',
    description: 'General-purpose embedding for cross-domain content',
  },
};

export { RAG_DB_DIMENSIONS };

export function getDomainModelConfig(domain: EmbeddingDomain): DomainEmbeddingConfig {
  return DEFAULT_CONFIGS[domain] ?? DEFAULT_CONFIGS.general!;
}

export function inferDomain(appOrDomain: string): EmbeddingDomain {
  const normalized = appOrDomain.toLowerCase();
  if (
    normalized.includes('prism') ||
    normalized.includes('legal') ||
    normalized.includes('counsel')
  )
    return 'legal';
  if (
    normalized.includes('vessel') ||
    normalized.includes('maritime') ||
    normalized.includes('fleet')
  )
    return 'maritime';
  if (
    normalized.includes('aegis') ||
    normalized.includes('security') ||
    normalized.includes('soc') ||
    normalized.includes('firestorm')
  )
    return 'security';
  if (
    normalized.includes('terra') ||
    normalized.includes('real-estate') ||
    normalized.includes('realestate') ||
    normalized.includes('property')
  )
    return 'real-estate';
  if (
    normalized.includes('szl') ||
    normalized.includes('holdings') ||
    normalized.includes('finance')
  )
    return 'finance';
  if (normalized.includes('lyte') || normalized.includes('aiops') || normalized.includes('ops'))
    return 'aiops';
  if (normalized.includes('carlota') || normalized.includes('consulting')) return 'consulting';
  if (normalized.includes('stephen') || normalized.includes('personal')) return 'personal';
  return 'general';
}

export function getAllDomainConfigs(): DomainEmbeddingConfig[] {
  return Object.values(DEFAULT_CONFIGS);
}
