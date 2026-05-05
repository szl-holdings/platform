import { parseRss, type RssItem } from './rss.js';
import type { ArtifactKind, FrontierArtifact, FrontierProvider } from './types.js';

export type SourceFormat = 'json' | 'rss' | 'html';

export interface SourceDescriptor {
  provider: FrontierProvider;
  name: string;
  kind: ArtifactKind;
  endpoint: string;
  authEnv?: string;
  ratePerHour: number;
  costPerCallUsd: number;
  format: SourceFormat;
  parser: SourceParser;
  /**
   * Optional fallback endpoint(s) used when the primary endpoint returns
   * no usable data. The discovery → fallback chain lets the worker keep
   * pulling provider news even if a JSON API requires auth that isn't
   * configured (e.g. fall back to public RSS).
   */
  fallbacks?: SourceDescriptor[];
}

export type SourceParser = (raw: unknown, source: SourceDescriptor) => FrontierArtifact[];

const nowIso = () => new Date().toISOString();

function makeArtifact(
  partial: Omit<FrontierArtifact, 'id' | 'discoveredAt'>,
): FrontierArtifact {
  const id = `${partial.provider}:${partial.kind}:${partial.externalId}`;
  return { ...partial, id, discoveredAt: nowIso() };
}

const parseAnthropicModels: SourceParser = (raw, source) => {
  if (!raw || typeof raw !== 'object') return [];
  const data = (raw as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.map((m) => {
    const model = m as Record<string, unknown>;
    const externalId = String(model.id ?? 'unknown');
    return makeArtifact({
      provider: source.provider,
      kind: 'model',
      externalId,
      title: `Anthropic ${externalId}`,
      url: `https://docs.anthropic.com/en/docs/about-claude/models#${externalId}`,
      summary: typeof model.display_name === 'string' ? model.display_name : externalId,
      publishedAt: typeof model.created_at === 'string' ? model.created_at : undefined,
      tags: ['anthropic', 'claude', 'frontier'],
      raw: model,
    });
  });
};

const parseOpenAIModels: SourceParser = (raw, source) => {
  if (!raw || typeof raw !== 'object') return [];
  const data = (raw as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.map((m) => {
    const model = m as Record<string, unknown>;
    const externalId = String(model.id ?? 'unknown');
    return makeArtifact({
      provider: source.provider,
      kind: 'model',
      externalId,
      title: `OpenAI ${externalId}`,
      url: `https://platform.openai.com/docs/models/${externalId}`,
      summary: `OpenAI model ${externalId}`,
      publishedAt:
        typeof model.created === 'number'
          ? new Date(model.created * 1000).toISOString()
          : undefined,
      tags: ['openai', 'frontier'],
      raw: model,
    });
  });
};

const parseGoogleModels: SourceParser = (raw, source) => {
  if (!raw || typeof raw !== 'object') return [];
  const models = (raw as { models?: unknown }).models;
  if (!Array.isArray(models)) return [];
  return models.map((m) => {
    const model = m as Record<string, unknown>;
    const externalId = String(model.name ?? 'unknown').replace(/^models\//, '');
    return makeArtifact({
      provider: source.provider,
      kind: 'model',
      externalId,
      title: `Google ${externalId}`,
      url: `https://ai.google.dev/models/${externalId}`,
      summary: typeof model.description === 'string' ? model.description : externalId,
      tags: ['google', 'gemini', 'vertex', 'frontier'],
      raw: model,
    });
  });
};

const parseNvidiaCatalog: SourceParser = (raw, source) => {
  if (!raw || typeof raw !== 'object') return [];
  const items = (raw as { models?: unknown; data?: unknown }).models ?? (raw as { data?: unknown }).data;
  if (!Array.isArray(items)) return [];
  return items.map((m) => {
    const model = m as Record<string, unknown>;
    const externalId = String(model.id ?? model.name ?? 'unknown');
    return makeArtifact({
      provider: source.provider,
      kind: 'tool',
      externalId,
      title: `NVIDIA NIM ${externalId}`,
      url: `https://build.nvidia.com/${externalId}`,
      summary: typeof model.description === 'string' ? model.description : externalId,
      tags: ['nvidia', 'nim', 'inference', 'frontier'],
      raw: model,
    });
  });
};

const parseHuggingFaceTrending: SourceParser = (raw, source) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((m) => {
    const model = m as Record<string, unknown>;
    const externalId = String(model.id ?? model.modelId ?? 'unknown');
    const tags = Array.isArray(model.tags) ? model.tags.filter((t): t is string => typeof t === 'string') : [];
    return makeArtifact({
      provider: source.provider,
      kind: source.kind,
      externalId,
      title: externalId,
      url: `https://huggingface.co/${externalId}`,
      summary: `HF ${source.kind} • ${tags.slice(0, 4).join(', ')}`,
      publishedAt: typeof model.lastModified === 'string' ? model.lastModified : undefined,
      tags: ['huggingface', source.kind, ...tags.slice(0, 6)],
      raw: model,
    });
  });
};

const parseHuggingFacePapers: SourceParser = (raw, source) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => {
    const item = p as Record<string, unknown>;
    const paper = (item.paper ?? item) as Record<string, unknown>;
    const externalId = String(paper.id ?? paper.arxiv_id ?? 'unknown');
    return makeArtifact({
      provider: source.provider,
      kind: 'paper',
      externalId,
      title: typeof paper.title === 'string' ? paper.title : externalId,
      url: `https://huggingface.co/papers/${externalId}`,
      summary: typeof paper.summary === 'string' ? paper.summary.slice(0, 400) : undefined,
      publishedAt: typeof paper.publishedAt === 'string' ? paper.publishedAt : undefined,
      tags: ['huggingface', 'paper', 'arxiv'],
      raw: paper,
    });
  });
};

/**
 * Generic RSS-feed parser that emits artifacts of the source's declared kind
 * (typically `doctrine` for blog/research posts and `tool` for changelog
 * entries). Handles Atom + RSS2 transparently via {@link parseRss}.
 */
function makeRssParser(): SourceParser {
  return (raw, source) => {
    if (typeof raw !== 'string') return [];
    const items = parseRss(raw);
    return items.map((it: RssItem) => {
      const externalId = it.guid ?? it.link;
      return makeArtifact({
        provider: source.provider,
        kind: source.kind,
        externalId,
        title: it.title,
        url: it.link,
        summary: it.description?.slice(0, 500),
        publishedAt: it.pubDate,
        tags: [source.provider, source.kind, source.name],
        raw: { feedItem: it },
      });
    });
  };
}

const rssParser = makeRssParser();

// Public RSS fallback for Anthropic news — used by both `anthropic.models`
// (when the auth'd JSON API isn't reachable) and as its own scheduled source.
const anthropicNewsFallback: SourceDescriptor = {
  provider: 'anthropic',
  name: 'anthropic.news.fallback',
  kind: 'doctrine',
  endpoint: 'https://www.anthropic.com/news/rss.xml',
  ratePerHour: 12,
  costPerCallUsd: 0.001,
  format: 'rss',
  parser: rssParser,
};

export const FRONTIER_SOURCES: SourceDescriptor[] = [
  // ── Anthropic ──
  {
    provider: 'anthropic',
    name: 'anthropic.models',
    kind: 'model',
    endpoint: 'https://api.anthropic.com/v1/models',
    authEnv: 'AI_INTEGRATIONS_ANTHROPIC_API_KEY',
    ratePerHour: 60,
    costPerCallUsd: 0.01,
    format: 'json',
    parser: parseAnthropicModels,
    // Discovery → fallback chain: if the authed JSON API has no key configured
    // (or is rate-limited), fall back to the public news RSS so we still see
    // "Anthropic announced X" events.
    fallbacks: [anthropicNewsFallback],
  },
  {
    provider: 'anthropic',
    name: 'anthropic.news',
    kind: 'doctrine',
    endpoint: 'https://www.anthropic.com/news/rss.xml',
    ratePerHour: 12,
    costPerCallUsd: 0.001,
    format: 'rss',
    parser: rssParser,
  },
  {
    provider: 'anthropic',
    name: 'anthropic.research',
    kind: 'paper',
    endpoint: 'https://www.anthropic.com/research/rss.xml',
    ratePerHour: 12,
    costPerCallUsd: 0.001,
    format: 'rss',
    parser: rssParser,
  },

  // ── OpenAI ──
  {
    provider: 'openai',
    name: 'openai.models',
    kind: 'model',
    endpoint: 'https://api.openai.com/v1/models',
    authEnv: 'AI_INTEGRATIONS_OPENAI_API_KEY',
    ratePerHour: 60,
    costPerCallUsd: 0.01,
    format: 'json',
    parser: parseOpenAIModels,
  },
  {
    provider: 'openai',
    name: 'openai.changelog',
    kind: 'tool',
    endpoint: 'https://platform.openai.com/docs/changelog/rss.xml',
    ratePerHour: 12,
    costPerCallUsd: 0.001,
    format: 'rss',
    parser: rssParser,
  },
  {
    provider: 'openai',
    name: 'openai.research',
    kind: 'paper',
    endpoint: 'https://openai.com/research/rss.xml',
    ratePerHour: 12,
    costPerCallUsd: 0.001,
    format: 'rss',
    parser: rssParser,
  },
  {
    provider: 'openai',
    name: 'openai.blog',
    kind: 'doctrine',
    endpoint: 'https://openai.com/blog/rss.xml',
    ratePerHour: 12,
    costPerCallUsd: 0.001,
    format: 'rss',
    parser: rssParser,
  },

  // ── Google ──
  {
    provider: 'google',
    name: 'google.gemini.models',
    kind: 'model',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    authEnv: 'AI_INTEGRATIONS_GEMINI_API_KEY',
    ratePerHour: 60,
    costPerCallUsd: 0.01,
    format: 'json',
    parser: parseGoogleModels,
  },
  {
    provider: 'google',
    name: 'google.cloud.releases',
    kind: 'tool',
    endpoint: 'https://cloud.google.com/feeds/aiplatform-release-notes.xml',
    ratePerHour: 12,
    costPerCallUsd: 0.001,
    format: 'rss',
    parser: rssParser,
  },
  {
    provider: 'google',
    name: 'google.research.blog',
    kind: 'paper',
    endpoint: 'https://blog.research.google/feeds/posts/default?alt=rss',
    ratePerHour: 12,
    costPerCallUsd: 0.001,
    format: 'rss',
    parser: rssParser,
  },

  // ── NVIDIA ──
  {
    provider: 'nvidia',
    name: 'nvidia.nim.catalog',
    kind: 'tool',
    endpoint: 'https://api.nvcf.nvidia.com/v2/nvcf/functions',
    authEnv: 'NVIDIA_API_KEY',
    ratePerHour: 30,
    costPerCallUsd: 0.01,
    format: 'json',
    parser: parseNvidiaCatalog,
  },
  {
    provider: 'nvidia',
    name: 'nvidia.developer.blog',
    kind: 'doctrine',
    endpoint: 'https://developer.nvidia.com/blog/feed',
    ratePerHour: 12,
    costPerCallUsd: 0.001,
    format: 'rss',
    parser: rssParser,
  },
  {
    provider: 'nvidia',
    name: 'nvidia.research',
    kind: 'paper',
    endpoint: 'https://research.nvidia.com/publications/rss',
    ratePerHour: 12,
    costPerCallUsd: 0.001,
    format: 'rss',
    parser: rssParser,
  },
  {
    provider: 'nvidia',
    name: 'nvidia.ngc.releases',
    kind: 'tool',
    endpoint: 'https://docs.nvidia.com/deeplearning/triton-inference-server/release-notes/rss.xml',
    ratePerHour: 12,
    costPerCallUsd: 0.001,
    format: 'rss',
    parser: rssParser,
  },

  // ── HuggingFace ──
  {
    provider: 'huggingface',
    name: 'hf.trending.models',
    kind: 'model',
    endpoint: 'https://huggingface.co/api/models?sort=trending&limit=20',
    authEnv: 'HUGGINGFACE_API_KEY',
    ratePerHour: 30,
    costPerCallUsd: 0.005,
    format: 'json',
    parser: parseHuggingFaceTrending,
  },
  {
    provider: 'huggingface',
    name: 'hf.trending.datasets',
    kind: 'dataset',
    endpoint: 'https://huggingface.co/api/datasets?sort=trending&limit=20',
    authEnv: 'HUGGINGFACE_API_KEY',
    ratePerHour: 30,
    costPerCallUsd: 0.005,
    format: 'json',
    parser: parseHuggingFaceTrending,
  },
  {
    provider: 'huggingface',
    name: 'hf.daily.papers',
    kind: 'paper',
    endpoint: 'https://huggingface.co/api/daily_papers',
    authEnv: 'HUGGINGFACE_API_KEY',
    ratePerHour: 12,
    costPerCallUsd: 0.005,
    format: 'json',
    parser: parseHuggingFacePapers,
  },
];

export function getSource(name: string): SourceDescriptor | undefined {
  return FRONTIER_SOURCES.find((s) => s.name === name);
}

export function listSources(): SourceDescriptor[] {
  return FRONTIER_SOURCES.slice();
}
