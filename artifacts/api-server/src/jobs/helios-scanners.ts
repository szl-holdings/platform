/**
 * Frontier Intelligence scanner jobs
 *
 * Pulls real external signals into the Frontier Intelligence live store:
 *   - arXiv cs.AI / cs.LG Atom feed (no auth required)
 *   - HuggingFace public model hub (no auth required)
 *   - NVD CVE JSON API (no auth for the unauthenticated tier; rate-limited
 *     to 5 req/30s, which is well within the scanner's 6h cadence)
 *   - Vendor RSS feeds (Anthropic, OpenAI, NVIDIA developer blog) — public,
 *     no auth, fetched and parsed as RSS 2.0
 *
 * All sources are public, anonymous endpoints. Each fetch is wrapped in
 * an AbortController timeout and any failure is logged + recorded against
 * the scanner (status: degraded) without throwing — the live store always
 * retains the seeded baseline so the UI is never blank.
 *
 * Scheduling is on by default and can be disabled by setting
 * `HELIOS_SCANNERS_ENABLED=false` (e.g. in CI environments without
 * network egress). When enabled, the runner kicks off shortly after boot
 * and repeats every `HELIOS_SCANNERS_INTERVAL_MS` (default 6h).
 */

import { logger } from '../lib/logger';
import { getScanner, ingestSignals, recordScannerError } from '../routes/helios/live-store';
import type { Signal } from '../routes/helios/types';

const ARXIV_URL =
  'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=10';
const HF_URL = 'https://huggingface.co/api/models?sort=createdAt&direction=-1&limit=10';

const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': 'szl-frontier-intelligence/1.0 (+https://szl.holdings)',
        Accept: 'application/json, application/atom+xml, */*',
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

// ── arXiv ────────────────────────────────────────────────────────────────────

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  link: string;
  published: string;
  categories: string[];
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseArxivAtom(xml: string): ArxivEntry[] {
  const entries: ArxivEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const idMatch = /<id>([\s\S]*?)<\/id>/.exec(block);
    const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(block);
    const summaryMatch = /<summary>([\s\S]*?)<\/summary>/.exec(block);
    const publishedMatch = /<published>([\s\S]*?)<\/published>/.exec(block);
    const linkMatch = /<link[^>]*rel="alternate"[^>]*href="([^"]+)"/.exec(block);
    const categoryMatches = Array.from(block.matchAll(/<category[^>]*term="([^"]+)"/g));
    if (!idMatch || !titleMatch) continue;
    entries.push({
      id: idMatch[1].trim(),
      title: decodeXmlEntities(titleMatch[1].replace(/\s+/g, ' ').trim()),
      summary: decodeXmlEntities((summaryMatch?.[1] ?? '').replace(/\s+/g, ' ').trim()),
      link: (linkMatch?.[1] ?? idMatch[1]).trim(),
      published: (publishedMatch?.[1] ?? new Date().toISOString()).trim(),
      categories: categoryMatches.map(m => m[1]),
    });
  }
  return entries;
}

function arxivToSignal(entry: ArxivEntry): Signal {
  const shortId = entry.id.split('/').pop() ?? entry.id;
  const isLg = entry.categories.includes('cs.LG');
  return {
    id: `sig-arxiv-${shortId.replace(/[^a-z0-9.-]/gi, '')}`,
    kind: 'capability',
    scanner: 'arxiv',
    title: entry.title,
    summary: entry.summary.slice(0, 600),
    soWhat:
      'Newly-released frontier research — review for portfolio-agent capability gaps or evaluation opportunities before competitors operationalise it.',
    sourceUrl: entry.link,
    sourceName: isLg ? 'arXiv cs.LG' : 'arXiv cs.AI',
    confidence: 0.7,
    impactScore: 0.65,
    entities: entry.categories,
    claims: [entry.summary.slice(0, 240)].filter(c => c.length > 0),
    affectedAgents: [],
    createdAt: entry.published || new Date().toISOString(),
  };
}

export async function runArxivScanner(): Promise<{ added: number; skipped?: boolean }> {
  if (getScanner('scanner-arxiv')?.enabled === false) {
    return { added: 0, skipped: true };
  }
  try {
    const res = await fetchWithTimeout(ARXIV_URL);
    if (!res.ok) throw new Error(`arxiv HTTP ${res.status}`);
    const xml = await res.text();
    const entries = parseArxivAtom(xml);
    if (entries.length === 0) throw new Error('arxiv returned 0 entries');
    const fresh = entries.map(arxivToSignal);
    const { added } = ingestSignals('scanner-arxiv', fresh);
    logger.info({ scanner: 'scanner-arxiv', fetched: entries.length, added }, '[helios-scanners] arxiv ingest ok');
    return { added };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    recordScannerError('scanner-arxiv', msg);
    logger.warn({ scanner: 'scanner-arxiv', err: msg }, '[helios-scanners] arxiv fetch failed');
    return { added: 0 };
  }
}

// ── HuggingFace ──────────────────────────────────────────────────────────────

interface HfModel {
  id: string;
  modelId?: string;
  downloads?: number;
  likes?: number;
  createdAt?: string;
  pipeline_tag?: string;
  tags?: string[];
}

function hfToSignal(model: HfModel): Signal {
  const id = model.modelId ?? model.id;
  const downloads = model.downloads ?? 0;
  const likes = model.likes ?? 0;
  // Lightweight popularity → impact heuristic. Fresh models are usually
  // small; clamp into the 0.55–0.92 band.
  const impact = Math.min(0.92, 0.55 + Math.log10(1 + downloads + likes * 10) / 8);
  const tags = (model.tags ?? []).filter(t => !t.startsWith('license:')).slice(0, 6);
  return {
    id: `sig-hf-${id.replace(/[^a-z0-9.-]/gi, '-')}`,
    kind: 'capability',
    scanner: 'github',
    title: `HuggingFace model release: ${id}`,
    summary: `Newly-published model on HuggingFace${model.pipeline_tag ? ` (${model.pipeline_tag})` : ''}. ${downloads.toLocaleString()} downloads · ${likes.toLocaleString()} likes since release.`,
    soWhat:
      'Track open-weights model releases — evaluate for fit against portfolio inference pipelines and routing tables before community adoption hardens.',
    sourceUrl: `https://huggingface.co/${id}`,
    sourceName: 'HuggingFace Model Hub',
    confidence: 0.75,
    impactScore: Math.round(impact * 100) / 100,
    entities: [id, ...(model.pipeline_tag ? [model.pipeline_tag] : []), ...tags],
    claims: [
      `${downloads.toLocaleString()} downloads since release on HuggingFace.`,
      ...(model.pipeline_tag ? [`Pipeline tag: ${model.pipeline_tag}`] : []),
    ],
    affectedAgents: [],
    createdAt: model.createdAt ?? new Date().toISOString(),
  };
}

export async function runHuggingFaceScanner(): Promise<{ added: number; skipped?: boolean }> {
  if (getScanner('scanner-github')?.enabled === false) {
    return { added: 0, skipped: true };
  }
  try {
    const res = await fetchWithTimeout(HF_URL);
    if (!res.ok) throw new Error(`huggingface HTTP ${res.status}`);
    const data = (await res.json()) as HfModel[];
    if (!Array.isArray(data) || data.length === 0) throw new Error('huggingface returned 0 models');
    const fresh = data.map(hfToSignal);
    const { added } = ingestSignals('scanner-github', fresh);
    logger.info({ scanner: 'scanner-github', fetched: data.length, added }, '[helios-scanners] huggingface ingest ok');
    return { added };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    recordScannerError('scanner-github', msg);
    logger.warn({ scanner: 'scanner-github', err: msg }, '[helios-scanners] huggingface fetch failed');
    return { added: 0 };
  }
}

// ── NVD CVE feed ─────────────────────────────────────────────────────────────
// NVD JSON API 2.0 — public, no auth required for the rate-limited tier
// (5 req / 30s, well within our 6h cadence). Docs:
//   https://services.nvd.nist.gov/rest/json/cves/2.0
// We pull the most recent 10 CVEs and surface AI / ML / LLM-relevant ones
// as `threat` signals. Non-relevant CVEs still count for impact heuristics
// but are filtered out of the ingest payload.

const NVD_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=20';
const NVD_KEYWORDS = [
  'llm', 'language model', 'prompt injection', 'ai/ml', 'machine learning',
  'pytorch', 'tensorflow', 'huggingface', 'langchain', 'vllm', 'ollama',
  'mlflow', 'transformers', 'opensearch', 'vector database', 'embedding',
  'inference server', 'model server', 'rag pipeline', 'jupyter',
];

interface NvdCveItem {
  cve: {
    id: string;
    published: string;
    descriptions?: Array<{ lang: string; value: string }>;
    metrics?: {
      cvssMetricV31?: Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>;
      cvssMetricV30?: Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>;
    };
    references?: Array<{ url: string }>;
  };
}

interface NvdResponse {
  vulnerabilities?: NvdCveItem[];
}

function nvdDescription(item: NvdCveItem): string {
  const en = item.cve.descriptions?.find(d => d.lang === 'en');
  return (en?.value ?? '').replace(/\s+/g, ' ').trim();
}

function nvdCvssScore(item: NvdCveItem): { score: number; severity: string } {
  const m =
    item.cve.metrics?.cvssMetricV31?.[0]?.cvssData ??
    item.cve.metrics?.cvssMetricV30?.[0]?.cvssData;
  return { score: m?.baseScore ?? 0, severity: (m?.baseSeverity ?? 'UNKNOWN').toUpperCase() };
}

function nvdIsAiRelevant(item: NvdCveItem): boolean {
  const desc = nvdDescription(item).toLowerCase();
  return NVD_KEYWORDS.some(k => desc.includes(k));
}

function nvdToSignal(item: NvdCveItem): Signal {
  const { score, severity } = nvdCvssScore(item);
  const desc = nvdDescription(item);
  const nvdLink = `https://nvd.nist.gov/vuln/detail/${item.cve.id}`;
  // CVSS 0-10 → impact 0.55-0.95 band, leaving headroom for "world-stops" CVEs.
  const impact = Math.min(0.95, 0.55 + (score / 10) * 0.4);
  return {
    id: `sig-cve-${item.cve.id.toLowerCase()}`,
    kind: 'threat',
    scanner: 'cve',
    title: `${item.cve.id} (${severity}, CVSS ${score.toFixed(1)})`,
    summary: desc.slice(0, 600),
    soWhat:
      'AI/ML-relevant CVE — review portfolio exposure (model serving, vector DBs, RAG pipelines) and confirm patch posture before downstream impact lands.',
    sourceUrl: item.cve.references?.[0]?.url ?? nvdLink,
    sourceName: 'NIST NVD',
    confidence: 0.95,
    impactScore: Math.round(impact * 100) / 100,
    entities: [item.cve.id, severity],
    claims: [`CVSS base score ${score.toFixed(1)} (${severity})`, desc.slice(0, 240)].filter(c => c.length > 0),
    affectedAgents: [],
    createdAt: item.cve.published || new Date().toISOString(),
  };
}

export async function runNvdCveScanner(): Promise<{ added: number; skipped?: boolean }> {
  if (getScanner('scanner-cve')?.enabled === false) {
    return { added: 0, skipped: true };
  }
  try {
    const res = await fetchWithTimeout(NVD_URL);
    if (!res.ok) throw new Error(`nvd HTTP ${res.status}`);
    const data = (await res.json()) as NvdResponse;
    const items = Array.isArray(data.vulnerabilities) ? data.vulnerabilities : [];
    if (items.length === 0) throw new Error('nvd returned 0 vulnerabilities');
    const relevant = items.filter(nvdIsAiRelevant);
    const fresh = relevant.map(nvdToSignal);
    const { added } = fresh.length > 0
      ? ingestSignals('scanner-cve', fresh)
      : { added: 0 };
    logger.info(
      { scanner: 'scanner-cve', fetched: items.length, aiRelevant: relevant.length, added },
      '[helios-scanners] nvd-cve ingest ok',
    );
    return { added };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    recordScannerError('scanner-cve', msg);
    logger.warn({ scanner: 'scanner-cve', err: msg }, '[helios-scanners] nvd-cve fetch failed');
    return { added: 0 };
  }
}

// ── Vendor RSS feeds ─────────────────────────────────────────────────────────
// Pulls public RSS 2.0 feeds from Anthropic, OpenAI, and the NVIDIA developer
// blog. All three are anonymous public endpoints. We extract the most recent
// 5 items per feed and emit them as `vendor` signals.

interface VendorSource {
  name: string;
  url: string;
}

const VENDOR_FEEDS: readonly VendorSource[] = [
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news/rss.xml' },
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' },
  { name: 'NVIDIA Developer Blog', url: 'https://developer.nvidia.com/blog/feed/' },
];

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const pick = (tag: string): string => {
      const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`).exec(block);
      if (cdata) return cdata[1].trim();
      const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
      return plain ? decodeXmlEntities(plain[1].replace(/\s+/g, ' ').trim()) : '';
    };
    const title = pick('title');
    const link = pick('link');
    if (!title || !link) continue;
    items.push({
      title,
      link,
      description: pick('description').replace(/<[^>]+>/g, '').slice(0, 600),
      pubDate: pick('pubDate') || new Date().toISOString(),
    });
  }
  return items;
}

function vendorToSignal(source: VendorSource, item: RssItem): Signal {
  const slug = item.link.replace(/^https?:\/\//, '').replace(/[^a-z0-9.-]/gi, '-').slice(0, 80);
  return {
    id: `sig-vendor-${slug}`,
    kind: 'vendor',
    scanner: 'vendor',
    title: `${source.name}: ${item.title}`,
    summary: item.description,
    soWhat:
      'Vendor product / capability announcement — assess portfolio-agent integration impact, pricing/SLA shifts, and competitive timing before the next planning cycle.',
    sourceUrl: item.link,
    sourceName: source.name,
    confidence: 0.85,
    impactScore: 0.7,
    entities: [source.name],
    claims: [item.title],
    affectedAgents: [],
    createdAt: (() => {
      const t = Date.parse(item.pubDate);
      return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
    })(),
  };
}

export async function runVendorRssScanner(): Promise<{ added: number; skipped?: boolean }> {
  if (getScanner('scanner-vendor')?.enabled === false) {
    return { added: 0, skipped: true };
  }
  const results = await Promise.allSettled(
    VENDOR_FEEDS.map(async (source) => {
      const res = await fetchWithTimeout(source.url);
      if (!res.ok) throw new Error(`${source.name} HTTP ${res.status}`);
      const xml = await res.text();
      const items = parseRss(xml).slice(0, 5);
      if (items.length === 0) throw new Error(`${source.name} returned 0 items`);
      return items.map(item => vendorToSignal(source, item));
    }),
  );
  const fresh: Signal[] = [];
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') fresh.push(...r.value);
    else errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
  }
  if (fresh.length === 0) {
    const msg = errors.length > 0 ? errors.join('; ') : 'no vendor items parsed';
    recordScannerError('scanner-vendor', msg);
    logger.warn({ scanner: 'scanner-vendor', err: msg }, '[helios-scanners] vendor-rss all feeds failed');
    return { added: 0 };
  }
  const { added } = ingestSignals('scanner-vendor', fresh);
  logger.info(
    { scanner: 'scanner-vendor', fetched: fresh.length, added, partialFailures: errors.length },
    '[helios-scanners] vendor-rss ingest ok',
  );
  return { added };
}

// Exported for tests so they can drive the parser directly.
export const __test_internals = { parseArxivAtom, parseRss, nvdToSignal, nvdIsAiRelevant, vendorToSignal };

// ── Orchestration ────────────────────────────────────────────────────────────

export async function runHeliosScannersOnce(): Promise<void> {
  await Promise.allSettled([
    runArxivScanner(),
    runHuggingFaceScanner(),
    runNvdCveScanner(),
    runVendorRssScanner(),
  ]);
}

let _interval: NodeJS.Timeout | null = null;
let _kickoff: NodeJS.Timeout | null = null;

export function startHeliosScanners(): void {
  if (_interval) return;
  const intervalMs = Number(process.env.HELIOS_SCANNERS_INTERVAL_MS) || 6 * 60 * 60 * 1000;
  // Delay first run so it doesn't contend with boot work.
  _kickoff = setTimeout(() => {
    void runHeliosScannersOnce();
  }, 45_000);
  _kickoff.unref();
  _interval = setInterval(() => {
    void runHeliosScannersOnce();
  }, intervalMs);
  _interval.unref();
  logger.info({ intervalMs }, '[helios-scanners] scheduled (arxiv + huggingface + nvd-cve + vendor-rss)');
}

export function stopHeliosScanners(): void {
  if (_kickoff) { clearTimeout(_kickoff); _kickoff = null; }
  if (_interval) { clearInterval(_interval); _interval = null; }
}
