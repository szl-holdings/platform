/**
 * Frontier Intelligence scanner jobs
 *
 * Pulls real external signals into the Frontier Intelligence live store:
 *   - arXiv cs.AI / cs.LG Atom feed (no auth required)
 *   - HuggingFace public model hub (no auth required)
 *
 * Both sources are public, anonymous endpoints. Each fetch is wrapped in
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

// ── Orchestration ────────────────────────────────────────────────────────────

export async function runHeliosScannersOnce(): Promise<void> {
  await Promise.allSettled([runArxivScanner(), runHuggingFaceScanner()]);
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
  logger.info({ intervalMs }, '[helios-scanners] scheduled (arxiv + huggingface)');
}

export function stopHeliosScanners(): void {
  if (_kickoff) { clearTimeout(_kickoff); _kickoff = null; }
  if (_interval) { clearInterval(_interval); _interval = null; }
}
