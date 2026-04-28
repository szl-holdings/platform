import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BookMarked,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  ExternalLink,
  FlaskConical,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Target,
  Zap,
} from 'lucide-react';
import * as React from 'react';

interface Citation {
  id: string;
  title: string;
  url: string;
  sourceType: 'web' | 'academic' | 'government' | 'internal' | 'api';
  trustScore: number;
  retrievedAt: string;
  relevanceScore: number;
  snippet: string;
}

interface ResearchFinding {
  id: string;
  claim: string;
  citations: Citation[];
  confidence: number;
  contradictions?: { position: string; source: string }[];
  addedAt: string;
}

interface ResearchSpace {
  id: string;
  name: string;
  query: string;
  status: 'idle' | 'running' | 'complete';
  findings: ResearchFinding[];
  createdAt: string;
  lastRunAt?: string;
}

type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  domains: string[];
  estimatedSources: number;
};

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'competitor-analysis',
    name: 'Competitor Analysis',
    description: 'Map competitor positioning, capabilities, and market share',
    domains: ['web', 'academic', 'internal'],
    estimatedSources: 12,
  },
  {
    id: 'market-sizing',
    name: 'Market Sizing',
    description: 'TAM/SAM/SOM analysis with citation-backed estimates',
    domains: ['academic', 'government', 'api'],
    estimatedSources: 8,
  },
  {
    id: 'due-diligence',
    name: 'Due Diligence Checklist',
    description: 'Systematic company / asset review framework',
    domains: ['web', 'government', 'internal'],
    estimatedSources: 15,
  },
  {
    id: 'technology-audit',
    name: 'Technology Audit',
    description: 'Assess technology stack, risks, and opportunities',
    domains: ['web', 'academic', 'internal'],
    estimatedSources: 10,
  },
];

const SOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  web: Globe,
  academic: BookOpen,
  government: Shield2,
  internal: Database,
  api: Zap,
};

function Shield2({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function trustColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

function trustLabel(score: number): string {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

function sourceTypeColor(type: string): string {
  const map: Record<string, string> = {
    web: 'border-blue-500/20 text-blue-400',
    academic: 'border-purple-500/20 text-purple-400',
    government: 'border-emerald-500/20 text-emerald-400',
    internal: 'border-amber-500/20 text-amber-400',
    api: 'border-cyan-500/20 text-cyan-400',
  };
  return map[type] || 'border-white/10 text-slate-400';
}

function generateDemoFindings(query: string): ResearchFinding[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'f1',
      claim: `Primary market for "${query}" shows 23% YoY growth with strong institutional adoption in Q4 2025`,
      confidence: 87,
      addedAt: now,
      citations: [
        {
          id: 'c1',
          title: 'Global Market Intelligence Report 2025',
          url: 'https://example.com/report-2025',
          sourceType: 'academic',
          trustScore: 91,
          retrievedAt: now,
          relevanceScore: 94,
          snippet:
            '...market expansion accelerated in H2 2025 driven by regulatory clarity and institutional capital flows...',
        },
        {
          id: 'c2',
          title: 'Industry Growth Tracker — Q4 2025',
          url: 'https://example.com/tracker',
          sourceType: 'government',
          trustScore: 95,
          retrievedAt: now,
          relevanceScore: 88,
          snippet:
            '...verified annual growth rate of 23.4% across primary market segments, outpacing consensus estimates...',
        },
      ],
    },
    {
      id: 'f2',
      claim:
        'Three major competitors identified, with Company A holding 38% market share and scaling AI capabilities',
      confidence: 78,
      addedAt: now,
      contradictions: [
        {
          position: 'Company A holds 38% market share per Q3 filings',
          source: 'SEC Filing Q3 2025',
        },
        {
          position: 'Company A market share estimated at 31% per independent analysis',
          source: 'Third-party Market Survey 2025',
        },
      ],
      citations: [
        {
          id: 'c3',
          title: 'Competitive Landscape Analysis',
          url: 'https://example.com/competitive',
          sourceType: 'web',
          trustScore: 62,
          retrievedAt: now,
          relevanceScore: 82,
          snippet:
            "...Company A's AI-first strategy positions them as market leader with significant moat in enterprise...",
        },
        {
          id: 'c4',
          title: 'SEC Filing Q3 2025 — Company A',
          url: 'https://sec.gov/example',
          sourceType: 'government',
          trustScore: 98,
          retrievedAt: now,
          relevanceScore: 75,
          snippet: '...total addressable market share as reported in quarterly filing...',
        },
      ],
    },
    {
      id: 'f3',
      claim:
        'Regulatory environment tightening in 3 key jurisdictions with new compliance requirements effective Q2 2026',
      confidence: 94,
      addedAt: now,
      citations: [
        {
          id: 'c5',
          title: 'Regulatory Update — EU Digital Frameworks 2026',
          url: 'https://eu.example/regs',
          sourceType: 'government',
          trustScore: 97,
          retrievedAt: now,
          relevanceScore: 96,
          snippet:
            '...new compliance mandates take effect April 2026, requiring firms to demonstrate...',
        },
      ],
    },
  ];
}

export default function ResearchMode() {
  const [spaces, setSpaces] = React.useState<ResearchSpace[]>([
    {
      id: 'demo-1',
      name: 'Market Intelligence — AI Infrastructure',
      query: 'AI infrastructure market sizing competitive landscape 2025',
      status: 'complete',
      findings: generateDemoFindings('AI infrastructure market'),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      lastRunAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);
  const [activeSpaceId, setActiveSpaceId] = React.useState<string>('demo-1');
  const [newQuery, setNewQuery] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);
  const [expandedFindings, setExpandedFindings] = React.useState<Set<string>>(new Set(['f1']));
  const [_selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
  const [showTemplates, setShowTemplates] = React.useState(false);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  const runResearch = async (spaceId: string) => {
    setIsRunning(true);
    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...s, status: 'running' as const } : s)),
    );
    await new Promise((r) => setTimeout(r, 2500));
    const space = spaces.find((s) => s.id === spaceId);
    if (space) {
      const findings = generateDemoFindings(space.query);
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === spaceId
            ? { ...s, status: 'complete' as const, findings, lastRunAt: new Date().toISOString() }
            : s,
        ),
      );
    }
    setIsRunning(false);
  };

  const createSpace = () => {
    if (!newQuery.trim()) return;
    const id = `space-${Date.now()}`;
    const space: ResearchSpace = {
      id,
      name: newName.trim() || newQuery.slice(0, 40),
      query: newQuery.trim(),
      status: 'idle',
      findings: [],
      createdAt: new Date().toISOString(),
    };
    setSpaces((prev) => [...prev, space]);
    setActiveSpaceId(id);
    setNewQuery('');
    setNewName('');
    setIsCreating(false);
    runResearch(id);
  };

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyTemplate = (tpl: WorkflowTemplate) => {
    setNewName(tpl.name);
    setNewQuery(
      `Comprehensive ${tpl.name.toLowerCase()} research covering ${tpl.domains.join(', ')} sources`,
    );
    setSelectedTemplate(tpl.id);
    setShowTemplates(false);
    setIsCreating(true);
  };

  return (
    <div className="flex h-full">
      <aside
        className="w-56 shrink-0 border-r flex flex-col"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,10,16,0.6)' }}
      >
        <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] uppercase tracking-widest font-medium"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Research Spaces
            </span>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5 mb-2"
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Space name..."
                className="w-full text-xs px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30"
              />
              <textarea
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                placeholder="Research question..."
                className="w-full text-xs px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30 resize-none h-16"
              />
              <div className="flex gap-1">
                <button
                  onClick={createSpace}
                  disabled={!newQuery.trim()}
                  className="flex-1 text-xs py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 transition-colors"
                >
                  Launch
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs px-2 py-1 rounded border border-white/10 text-slate-500 hover:border-white/20 transition-colors"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {spaces.map((space) => (
            <button
              key={space.id}
              onClick={() => setActiveSpaceId(space.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${activeSpaceId === space.id ? 'text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              style={{
                background: activeSpaceId === space.id ? 'rgba(75,139,219,0.08)' : undefined,
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${space.status === 'complete' ? 'bg-emerald-400' : space.status === 'running' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}
                />
                <span className="font-medium truncate">{space.name}</span>
              </div>
              <div className="text-[10px] opacity-60">{space.findings.length} findings</div>
            </button>
          ))}
        </nav>
        <div className="p-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full text-[10px] px-2 py-1.5 rounded border border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20 transition-colors flex items-center gap-1.5"
          >
            <FlaskConical className="w-3 h-3" />
            <span>Workflow Templates</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {showTemplates ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-blue-400" /> Research Workflow Templates
                </h2>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  ✕ Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WORKFLOW_TEMPLATES.map((tpl) => (
                  <motion.div
                    key={tpl.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-white/8 bg-[#0d1117] rounded-xl hover:border-blue-400/20 transition-all cursor-pointer"
                    onClick={() => applyTemplate(tpl)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white text-sm">{tpl.name}</h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {tpl.estimatedSources} sources
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{tpl.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.domains.map((d) => (
                        <span
                          key={d}
                          className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-slate-400 capitalize"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : activeSpace ? (
          <>
            <div
              className="shrink-0 border-b px-5 py-3 flex items-center justify-between"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div>
                <h2 className="text-sm font-bold text-white">{activeSpace.name}</h2>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-lg truncate">
                  {activeSpace.query}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {activeSpace.lastRunAt && (
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last run:{' '}
                    {new Date(activeSpace.lastRunAt).toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={() => runResearch(activeSpace.id)}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                >
                  {isRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  {isRunning ? 'Researching…' : 'Re-run'}
                </button>
              </div>
            </div>

            {activeSpace.status === 'running' && (
              <div
                className="shrink-0 px-5 py-3 border-b"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(75,139,219,0.04)',
                }}
              >
                <div className="flex items-center gap-3 text-xs text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    Querying web search, knowledge base, and API data sources in parallel…
                  </span>
                </div>
                <div className="mt-2 flex gap-4">
                  {['Web Search', 'Internal KB', 'API Sources', 'Academic'].map((src, i) => (
                    <div key={src} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Loader2
                        className="w-3 h-3 animate-spin text-blue-400"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                      {src}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {activeSpace.findings.length === 0 && activeSpace.status !== 'running' && (
                  <div className="text-center py-16">
                    <Search className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      No findings yet. Run research to populate this space.
                    </p>
                  </div>
                )}

                {activeSpace.findings.map((finding, fi) => (
                  <motion.div
                    key={finding.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: fi * 0.08 }}
                  >
                    <div className="border border-white/8 bg-[#0d1117] rounded-xl overflow-hidden">
                      <div
                        className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-white/2 transition-colors"
                        onClick={() => toggleFinding(finding.id)}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ background: `rgba(75,139,219,0.15)`, color: '#4B8BDB' }}
                          >
                            {fi + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium leading-snug">
                            {finding.claim}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1 text-[10px]">
                              <Target className="w-3 h-3 text-blue-400" />
                              <span className="text-slate-400">
                                Confidence:{' '}
                                <span className="text-white font-medium">
                                  {finding.confidence}%
                                </span>
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-600">
                              {finding.citations.length} source
                              {finding.citations.length !== 1 ? 's' : ''}
                            </span>
                            {finding.contradictions && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Contradiction detected</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-slate-600">
                          {expandedFindings.has(finding.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedFindings.has(finding.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {finding.contradictions && (
                              <div className="mx-4 mb-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-2">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Sources Disagree —
                                  Contradiction Detected
                                </div>
                                {finding.contradictions.map((c, ci) => (
                                  <div key={ci} className="flex items-start gap-2 mb-1.5">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                                      Position {ci + 1}
                                    </span>
                                    <div>
                                      <p className="text-xs text-slate-300">{c.position}</p>
                                      <p className="text-[10px] text-slate-600">
                                        Source: {c.source}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="px-4 pb-4 space-y-2">
                              <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5">
                                Citations
                              </p>
                              {finding.citations.map((citation) => {
                                const SourceIcon = SOURCE_ICONS[citation.sourceType] || Globe;
                                return (
                                  <div
                                    key={citation.id}
                                    className="p-3 rounded-lg border border-white/8 bg-white/2"
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <div className="flex items-center gap-2">
                                        <SourceIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <a
                                          href={citation.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                          {citation.title} <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span
                                          className={`text-[10px] px-1.5 py-0.5 rounded border ${sourceTypeColor(citation.sourceType)}`}
                                        >
                                          {citation.sourceType}
                                        </span>
                                        <span
                                          className={`text-[10px] font-medium ${trustColor(citation.trustScore)}`}
                                        >
                                          Trust: {trustLabel(citation.trustScore)}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                      "{citation.snippet}"
                                    </p>
                                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-700">
                                      <span>Relevance: {citation.relevanceScore}%</span>
                                      <span>
                                        Retrieved:{' '}
                                        {new Date(citation.retrievedAt).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {activeSpace.findings.length > 0 && (
              <div
                className="shrink-0 border-t px-5 py-3 flex items-center justify-between"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span>{activeSpace.findings.length} findings</span>
                  <span>
                    {activeSpace.findings.reduce((n, f) => n + f.citations.length, 0)} citations
                  </span>
                  <span>
                    {activeSpace.findings.filter((f) => f.contradictions).length} contradictions
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:border-white/20 hover:text-white transition-colors">
                    <Save className="w-3.5 h-3.5" /> Export
                  </button>
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                    <BookMarked className="w-3.5 h-3.5" /> Save as Artifact
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 text-sm mb-1">Select a research space</p>
              <p className="text-slate-600 text-xs">or create a new one to begin investigating</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
