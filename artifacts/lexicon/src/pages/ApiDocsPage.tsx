import { useState } from 'react';
import { Code2, Copy, Check, ExternalLink } from 'lucide-react';

const BASE_API = '/api/lexicon/v1';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  params?: { name: string; type: string; description: string; required?: boolean }[];
  response?: string;
  example?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: `${BASE_API}/licenses`,
    description: 'Returns the full list of all cataloged licenses.',
    params: [
      { name: 'category', type: 'string', description: 'Filter by category (e.g., permissive, copyleft, data)', required: false },
      { name: 'family', type: 'string', description: 'Filter by license family (e.g., MIT, Apache, Creative Commons)', required: false },
      { name: 'onHuggingFace', type: 'boolean', description: 'If true, return only licenses on Hugging Face', required: false },
      { name: 'q', type: 'string', description: 'Full-text search query', required: false },
    ],
    response: '{ licenses: License[], total: number }',
    example: `curl "${BASE_API}/licenses?category=permissive"`,
  },
  {
    method: 'GET',
    path: `${BASE_API}/licenses/:id`,
    description: 'Returns a single license by its identifier (e.g., mit, apache-2.0).',
    params: [
      { name: 'id', type: 'string (path)', description: 'License identifier', required: true },
    ],
    response: '{ license: License }',
    example: `curl "${BASE_API}/licenses/apache-2.0"`,
  },
  {
    method: 'GET',
    path: `${BASE_API}/compatibility`,
    description: 'Returns the full compatibility matrix for the key license set.',
    response: '{ matrix: Record<string, Record<string, { status, note }>> }',
    example: `curl "${BASE_API}/compatibility"`,
  },
  {
    method: 'GET',
    path: `${BASE_API}/compatibility/:a/:b`,
    description: 'Returns the compatibility status between two specific licenses.',
    params: [
      { name: 'a', type: 'string (path)', description: 'First license identifier', required: true },
      { name: 'b', type: 'string (path)', description: 'Second license identifier', required: true },
    ],
    response: '{ a: string, b: string, status: "compatible" | "incompatible" | "partial" | "unknown", note: string }',
    example: `curl "${BASE_API}/compatibility/mit/gpl-3.0"`,
  },
  {
    method: 'GET',
    path: `${BASE_API}/families`,
    description: 'Returns all license family trees.',
    response: '{ families: FamilyTree[] }',
    example: `curl "${BASE_API}/families"`,
  },
  {
    method: 'GET',
    path: `${BASE_API}/families/:id`,
    description: 'Returns a single family tree by ID (e.g., gpl, bsd, creative-commons).',
    params: [
      { name: 'id', type: 'string (path)', description: 'Family tree identifier', required: true },
    ],
    response: '{ family: FamilyTree }',
    example: `curl "${BASE_API}/families/creative-commons"`,
  },
  {
    method: 'GET',
    path: `${BASE_API}/stats`,
    description: 'Returns catalog statistics: total licenses, by-category counts, HF vs. non-HF.',
    response: '{ total: number, onHuggingFace: number, beyondHF: number, byCategory: Record<string, number>, byFamily: Record<string, number> }',
    example: `curl "${BASE_API}/stats"`,
  },
];

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fade-in">
      <div className="mb-10 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-lexicon-text mb-4 flex items-center gap-3">
          <div className="bg-lexicon-blue/10 p-2 rounded-lg border border-lexicon-blue/20">
            <Code2 size={28} className="text-lexicon-blue" />
          </div>
          Public JSON API
        </h1>
        <p className="text-lexicon-text-muted text-lg leading-relaxed">
          LEXICON exposes all its data via a free, unauthenticated JSON API. Use it to build tooling, populate HF model cards, or integrate license data into your workflows.
        </p>
      </div>

      {/* Base URL */}
      <div className="mb-10 bg-[#050810] border border-lexicon-border rounded-xl p-5 md:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div>
          <div className="text-xs font-bold text-lexicon-text-muted uppercase tracking-widest mb-2">Base URL</div>
          <code className="font-mono text-base md:text-lg font-bold text-lexicon-blue">
            {typeof window !== 'undefined' ? window.location.origin : 'https://example.com'}{BASE_API}
          </code>
        </div>
        <button 
          onClick={() => copy(`${typeof window !== 'undefined' ? window.location.origin : ''}${BASE_API}`, 'base')} 
          className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border transition-all focus:outline-none
            ${copied === 'base' ? 'bg-lexicon-green/10 border-lexicon-green/50 text-lexicon-green' : 'bg-lexicon-surface border-lexicon-border hover:bg-lexicon-surface-raised hover:border-lexicon-text-muted text-lexicon-text-muted'}`}
          aria-label="Copy Base URL"
          data-testid="button-copy-base-url"
        >
          {copied === 'base' ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>

      {/* Notes */}
      <div className="mb-10 p-5 md:p-6 bg-lexicon-blue/5 border border-lexicon-blue/20 rounded-xl">
        <p className="text-sm text-lexicon-text-muted leading-relaxed">
          <strong className="text-lexicon-blue uppercase tracking-wider font-bold mr-2 text-xs">Global Headers:</strong> 
          All responses are JSON, UTF-8 encoded. No authentication required. CORS is open.
          All timestamps are ISO 8601. <br className="hidden md:block" />
          <strong className="text-lexicon-blue uppercase tracking-wider font-bold mr-2 text-xs mt-2 md:mt-0 inline-block md:inline">Rate limits:</strong> 
          100 req/min per IP for courtesy. Data is embedded from the canonical license corpus — identical to the UI.
        </p>
      </div>

      {/* Endpoints */}
      <div className="flex flex-col gap-8">
        {ENDPOINTS.map((ep, idx) => (
          <div 
            key={`${ep.method}-${ep.path}`} 
            className={`bg-lexicon-surface-raised border border-lexicon-border rounded-2xl overflow-hidden shadow-sm animate-slide-in stagger-${(idx % 5) + 1} transition-all hover:border-lexicon-border-hover`}
          >
            <div className="px-6 py-5 border-b border-lexicon-border bg-lexicon-surface flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <span className={`font-mono text-sm font-extrabold px-3 py-1.5 rounded-md shadow-sm shrink-0
                  ${ep.method === 'GET' ? 'bg-lexicon-green/10 text-lexicon-green border border-lexicon-green/20' : 'bg-lexicon-blue/10 text-lexicon-blue border border-lexicon-blue/20'}`}>
                  {ep.method}
                </span>
                <code className="font-mono text-base font-bold text-lexicon-text break-all">{ep.path}</code>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-lexicon-text-muted mb-8 leading-relaxed text-[15px]">{ep.description}</p>

              {ep.params && ep.params.length > 0 && (
                <div className="mb-8">
                  <div className="text-xs font-bold text-lexicon-text uppercase tracking-widest mb-4">Query / Path Parameters</div>
                  <div className="overflow-x-auto rounded-lg border border-lexicon-border">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-lexicon-surface border-b border-lexicon-border">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-lexicon-text-muted w-[140px]">Name</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-lexicon-text-muted w-[100px]">Type</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-lexicon-text-muted">Description</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-lexicon-text-muted w-[100px]">Required</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lexicon-border bg-black/10">
                        {ep.params.map((p) => (
                          <tr key={p.name} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3"><code className="font-mono text-lexicon-blue font-bold text-[13px]">{p.name}</code></td>
                            <td className="px-4 py-3 text-lexicon-text-muted text-[13px]">{p.type}</td>
                            <td className="px-4 py-3 text-lexicon-text-muted text-[13px]">{p.description}</td>
                            <td className="px-4 py-3">
                              {p.required 
                                ? <span className="text-xs font-bold px-2 py-1 bg-lexicon-amber/10 text-lexicon-amber rounded">Yes</span> 
                                : <span className="text-lexicon-text-muted text-xs">No</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {ep.response && (
                <div className="mb-6">
                  <div className="text-xs font-bold text-lexicon-text uppercase tracking-widest mb-3">Response Shape</div>
                  <div className="bg-[#050810] border border-lexicon-border rounded-lg p-4 font-mono text-[13px] text-lexicon-purple overflow-x-auto shadow-inner">
                    <code>{ep.response}</code>
                  </div>
                </div>
              )}

              {ep.example && (
                <div>
                  <div className="text-xs font-bold text-lexicon-text uppercase tracking-widest mb-3">Example cURL</div>
                  <div className="bg-[#050810] border border-lexicon-border rounded-lg p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 group transition-colors hover:border-lexicon-blue/30 shadow-inner">
                    <code className="font-mono text-[13px] text-lexicon-green break-all leading-relaxed flex-1">
                      <span className="text-lexicon-text-muted opacity-50 select-none mr-2">$</span>
                      {ep.example}
                    </code>
                    <button 
                      onClick={() => copy(ep.example!, ep.path)} 
                      className={`shrink-0 w-8 h-8 flex items-center justify-center rounded border transition-all focus:outline-none
                        ${copied === ep.path ? 'bg-lexicon-green/10 border-lexicon-green/50 text-lexicon-green' : 'bg-lexicon-surface border-lexicon-border hover:bg-lexicon-surface-raised hover:text-lexicon-text text-lexicon-text-muted'}`}
                      aria-label="Copy example"
                      data-testid={`button-copy-example-${ep.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
                    >
                      {copied === ep.path ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* OpenAPI link */}
      <div className="mt-12 p-6 md:p-8 bg-lexicon-blue/5 border border-lexicon-blue/20 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6 shadow-[0_0_30px_rgba(79,142,247,0.05)]">
        <div>
          <div className="text-lg font-bold text-lexicon-text mb-2">OpenAPI 3.0 Specification</div>
          <div className="text-sm text-lexicon-text-muted">A full machine-readable spec is available for generating SDKs and types.</div>
        </div>
        <a 
          href="/api/lexicon/v1/openapi.json" 
          target="_blank" 
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-2 px-6 py-3 bg-lexicon-blue hover:bg-lexicon-blue-dim text-lexicon-surface font-bold text-sm rounded-lg transition-colors shadow-lg shadow-lexicon-blue/20"
          data-testid="link-openapi-spec"
        >
          View spec <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
