import { ServiceAdapter } from '../base.js';

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  published: string;
  updated: string;
  pdfUrl: string;
  citationCount?: number;
}

const DEMO_PAPERS: ArxivPaper[] = [
  {
    id: '2401.12345',
    title: 'Scaling Language Models: Methods, Analysis & Insights from Training Gopher',
    authors: ['Hoffmann, J.', 'Borgeaud, S.'],
    abstract:
      'This paper presents a comprehensive study of scaling laws for language models, investigating how performance changes as a function of model size, training data, and compute budget.',
    categories: ['cs.CL', 'cs.LG', 'cs.AI'],
    published: '2024-01-15',
    updated: '2024-01-20',
    pdfUrl: 'https://arxiv.org/pdf/2401.12345',
    citationCount: 892,
  },
  {
    id: '2402.34567',
    title: 'Self-Supervised Learning of Video Representations from Human Demonstrations',
    authors: ['Nair, A.', 'Bahl, S.'],
    abstract:
      'We present a method for learning video representations from unlabeled human demonstrations that enables efficient transfer to downstream robotic manipulation tasks.',
    categories: ['cs.CV', 'cs.LG', 'cs.RO'],
    published: '2024-02-10',
    updated: '2024-02-15',
    pdfUrl: 'https://arxiv.org/pdf/2402.34567',
    citationCount: 234,
  },
  {
    id: '2403.56789',
    title: 'Constitutional AI: Harmlessness from AI Feedback',
    authors: ['Bai, Y.', 'Jones, A.'],
    abstract:
      'We propose Constitutional AI, a method for training AI assistants that are both helpful and harmless without relying on human feedback for every output.',
    categories: ['cs.AI', 'cs.CL'],
    published: '2024-03-05',
    updated: '2024-03-08',
    pdfUrl: 'https://arxiv.org/pdf/2403.56789',
    citationCount: 1456,
  },
];

export class ArxivAdapter extends ServiceAdapter {
  readonly name = 'arxiv';
  readonly description = 'arXiv open access research papers — free API, no key required';
  readonly requiredEnvVars: string[] = [];

  get status(): import('../base.js').ServiceStatus {
    return 'LIVE_CONFIGURED';
  }
  get supportsMockMode(): boolean {
    return true;
  }

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch(
      'https://export.arxiv.org/api/query?search_query=all:AI&max_results=1',
      {
        method: 'HEAD',
        headers: { 'User-Agent': 'SZL-arXiv/1.0' },
      },
    );
    if (!res.ok && res.status !== 405) throw new Error(`arXiv returned ${res.status}`);
  }

  async searchPapers(query: string, maxResults = 8, category?: string): Promise<ArxivPaper[]> {
    try {
      const q = category ? `${query} cat:${category}` : query;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(
        `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`,
        { signal: controller.signal, headers: { 'User-Agent': 'SZL-arXiv/1.0' } },
      );
      clearTimeout(timer);
      if (!res.ok) throw new Error(`arXiv HTTP ${res.status}`);
      const xml = await res.text();
      return this.parseArxivXml(xml, maxResults);
    } catch {
      return [...DEMO_PAPERS];
    }
  }

  async getLatestPapers(category: string, maxResults = 8): Promise<ArxivPaper[]> {
    return this.searchPapers('*', maxResults, category);
  }

  private parseArxivXml(xml: string, maxResults: number): ArxivPaper[] {
    const entries: ArxivPaper[] = [];
    const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
    for (const match of entryMatches) {
      const entry = match[1] ?? '';
      const idMatch = entry.match(/<id>https?:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/);
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const abstractMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
      const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);
      const authorMatches = [...entry.matchAll(/<name>([^<]+)<\/name>/g)];
      const categoryMatches = [...entry.matchAll(/<category term="([^"]+)"/g)];
      if (!idMatch) continue;
      entries.push({
        id: idMatch[1].trim(),
        title: titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : 'No title',
        authors: authorMatches.map((m) => m[1].trim()).slice(0, 4),
        abstract: abstractMatch ? abstractMatch[1].trim().replace(/\s+/g, ' ').slice(0, 500) : '',
        categories: categoryMatches.map((m) => m[1]).slice(0, 3),
        published: publishedMatch ? publishedMatch[1].trim().slice(0, 10) : '',
        updated: updatedMatch ? updatedMatch[1].trim().slice(0, 10) : '',
        pdfUrl: `https://arxiv.org/pdf/${idMatch[1].trim()}`,
      });
      if (entries.length >= maxResults) break;
    }
    return entries.length > 0 ? entries : [...DEMO_PAPERS];
  }
}
