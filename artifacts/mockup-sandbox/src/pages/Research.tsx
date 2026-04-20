import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  FlaskConical,
  Link,
  Loader,
  Send,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { nexusApi } from '../lib/api';
import type { AgentLane, Citation, ResearchRun } from '../lib/types';

const LANE_META: Record<string, { color: string; role: string; icon: string }> = {
  gatherer: { color: '#00d4ff', role: 'Evidence Discovery', icon: '🔍' },
  'peer-reviewer': { color: '#a855f7', role: 'Assumption Challenge', icon: '🔬' },
  drafter: { color: '#ffb700', role: 'Synthesis', icon: '✍️' },
  verifier: { color: '#00ff88', role: 'Citation Verification', icon: '✅' },
};

const EXAMPLES = [
  'What are the key risks in commercial real estate financing heading into 2025?',
  'Summarize the current state of maritime sanctions compliance and enforcement trends.',
  'What AI governance frameworks are emerging in the defense & intelligence sector?',
];

function LaneCard({ lane }: { lane: AgentLane }) {
  const [open, setOpen] = useState(true);
  const meta = LANE_META[lane.id] ?? { color: '#00d4ff', role: 'Agent', icon: '🤖' };

  const statusClass =
    lane.status === 'running'
      ? 'lane-active'
      : lane.status === 'done'
        ? 'lane-done'
        : lane.status === 'error'
          ? 'lane-error'
          : 'lane-idle';

  return (
    <div
      className={`rounded-lg bg-nexus-surface border border-nexus ${statusClass} transition-all`}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-base">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: meta.color }}>
              {lane.name}
            </span>
            {lane.status === 'running' && (
              <Loader className="w-3 h-3 animate-spin" style={{ color: meta.color }} />
            )}
            {lane.status === 'done' && <CheckCircle className="w-3 h-3 text-nexus-green" />}
            {lane.status === 'error' && <XCircle className="w-3 h-3 text-nexus-red" />}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">{meta.role}</div>
        </div>
        {lane.status !== 'idle' && (
          <div className="flex items-center gap-2 text-[10px] font-mono mr-2">
            {lane.durationMs !== undefined && (
              <span className="text-muted-foreground/60">{lane.durationMs}ms</span>
            )}
            {lane.confidence !== undefined && (
              <span
                className={
                  lane.confidence >= 0.7
                    ? 'text-nexus-green'
                    : lane.confidence >= 0.4
                      ? 'text-[#ffb700]'
                      : 'text-nexus-red'
                }
                title="Confidence score"
              >
                {(lane.confidence * 100).toFixed(0)}%
              </span>
            )}
            {lane.citationsVerified !== undefined && lane.citationsVerified > 0 && (
              <span className="text-nexus-green">✓{lane.citationsVerified}</span>
            )}
            {lane.citationsKilled !== undefined && lane.citationsKilled > 0 && (
              <span className="text-nexus-red">✗{lane.citationsKilled}</span>
            )}
          </div>
        )}
        {open ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2">
          {lane.log.length > 0 && (
            <div className="bg-[#060b12] rounded p-2 space-y-1 max-h-32 overflow-y-auto">
              {lane.log.map((entry, i) => (
                <div
                  key={i}
                  className="text-[10px] font-mono text-muted-foreground/70 leading-relaxed"
                >
                  <span className="text-muted-foreground/30 mr-2">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {entry}
                </div>
              ))}
            </div>
          )}
          {lane.sources && lane.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lane.sources.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00d4ff]/10 text-nexus-cyan hover:bg-[#00d4ff]/20 transition-colors"
                >
                  <Link className="w-2.5 h-2.5" />
                  {new URL(src).hostname.replace('www.', '')}
                </a>
              ))}
            </div>
          )}
          {lane.output && (
            <div className="text-[11px] text-muted-foreground leading-relaxed border-t border-nexus pt-2">
              {lane.output}
            </div>
          )}
          {lane.status === 'idle' && lane.log.length === 0 && (
            <p className="text-[10px] text-muted-foreground/40 font-mono">Waiting to start…</p>
          )}
        </div>
      )}
    </div>
  );
}

function CitationTable({ citations }: { citations: Citation[] }) {
  return (
    <div className="bg-nexus-surface border border-nexus rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-nexus flex items-center gap-2">
        <Link className="w-3.5 h-3.5 text-nexus-cyan" />
        <span className="text-xs font-semibold">Citation Verification</span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          {citations.filter((c) => c.status === 'verified').length} verified ·{' '}
          {citations.filter((c) => c.status === 'killed').length} killed
        </span>
      </div>
      <div className="divide-y divide-nexus max-h-48 overflow-y-auto">
        {citations.map((c, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2">
            {c.status === 'verified' ? (
              <CheckCircle className="w-3.5 h-3.5 text-nexus-green shrink-0" />
            ) : c.status === 'killed' ? (
              <XCircle className="w-3.5 h-3.5 text-nexus-red shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium truncate">{c.title || c.url}</div>
              <div className="text-[9px] font-mono text-muted-foreground/60 truncate">{c.url}</div>
              {c.reason && <div className="text-[9px] text-nexus-red/80">{c.reason}</div>}
            </div>
            {c.status === 'verified' && (
              <a href={c.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 text-muted-foreground/40 hover:text-nexus-cyan" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Research() {
  const [query, setQuery] = useState('');
  const [currentRun, setCurrentRun] = useState<ResearchRun | null>(null);
  const [history, setHistory] = useState<ResearchRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    nexusApi
      .listResearch()
      .then(setHistory)
      .catch(() => {});
    return () => {
      eventSourceRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function connectSSE(runId: string) {
    const url = nexusApi.researchStreamUrl(runId);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('update', (ev) => {
      try {
        const data = JSON.parse(ev.data) as ResearchRun;
        setCurrentRun(data);
        if (data.status === 'completed' || data.status === 'failed') {
          es.close();
          setLoading(false);
          nexusApi
            .listResearch()
            .then(setHistory)
            .catch(() => {});
        }
      } catch {
        // ignore parse errors
      }
    });

    es.onerror = () => {
      es.close();
      startPolling(runId);
    };
  }

  function startPolling(runId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const run = await nexusApi.getResearch(runId);
        setCurrentRun(run);
        if (run.status === 'completed' || run.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setLoading(false);
          nexusApi
            .listResearch()
            .then(setHistory)
            .catch(() => {});
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setLoading(false);
      }
    }, 1500);
  }

  async function handleSubmit(q?: string) {
    const finalQuery = q ?? query;
    if (!finalQuery.trim()) return;
    setError(null);
    setLoading(true);
    setCurrentRun(null);
    eventSourceRef.current?.close();
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const { id } = await nexusApi.startResearch(finalQuery.trim());
      const run = await nexusApi.getResearch(id);
      setCurrentRun(run);
      connectSSE(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start research');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-nexus-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FlaskConical className="w-5 h-5 text-nexus-cyan" />
          <div>
            <h1 className="text-lg font-semibold">Parallel Research Swarm</h1>
            <p className="text-xs text-muted-foreground">
              Feynman-style · 4 concurrent agents · Verifier kills dead links
            </p>
          </div>
        </div>

        <div className="bg-nexus-surface border border-[#00d4ff]/20 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <textarea
              className="flex-1 bg-nexus-bg border border-nexus rounded-lg px-3 py-2.5 text-sm font-mono resize-none focus:outline-none focus:border-[#00d4ff]/50 text-foreground placeholder:text-muted-foreground/40"
              rows={2}
              placeholder="Enter your research query…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !query.trim()}
              className="px-4 py-2 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-nexus-cyan text-sm font-medium hover:bg-[#00d4ff]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Run
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] text-muted-foreground/50 self-center">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  handleSubmit(ex);
                }}
                className="text-[10px] px-2 py-1 rounded bg-nexus-bg border border-nexus text-muted-foreground/60 hover:text-muted-foreground hover:border-[#00d4ff]/20 transition-colors text-left max-w-xs truncate"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-[#ff4455]/10 border border-[#ff4455]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-nexus-red shrink-0" />
            <p className="text-xs text-nexus-red">{error}</p>
          </div>
        )}

        {currentRun && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Active Run</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {currentRun.id}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    currentRun.status === 'completed'
                      ? 'bg-[#00ff88]/10 text-nexus-green'
                      : currentRun.status === 'running'
                        ? 'bg-[#00d4ff]/10 text-nexus-cyan'
                        : currentRun.status === 'failed'
                          ? 'bg-[#ff4455]/10 text-nexus-red'
                          : 'bg-nexus-surface text-muted-foreground'
                  }`}
                >
                  {currentRun.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="bg-nexus-surface border border-nexus rounded-lg px-4 py-2 text-sm font-mono text-nexus-cyan">
              {currentRun.query}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentRun.lanes.map((lane) => (
                <LaneCard key={lane.id} lane={lane} />
              ))}
            </div>

            {currentRun.citations && currentRun.citations.length > 0 && (
              <CitationTable citations={currentRun.citations} />
            )}

            {currentRun.finalBrief && (
              <div className="bg-nexus-surface border border-[#00ff88]/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-nexus-green" />
                  <h3 className="text-sm font-semibold text-nexus-green">
                    Verified Research Brief
                  </h3>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {currentRun.finalBrief}
                </div>
              </div>
            )}
          </div>
        )}

        {!currentRun && history.length > 0 && (
          <div>
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
              Recent Runs
            </h2>
            <div className="space-y-2">
              {history.slice(0, 5).map((run) => (
                <button
                  key={run.id}
                  className="w-full text-left bg-nexus-surface border border-nexus rounded-lg px-4 py-3 hover:border-[#00d4ff]/20 transition-colors"
                  onClick={async () => {
                    const r = await nexusApi.getResearch(run.id);
                    setCurrentRun(r);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground/50">{run.id}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        run.status === 'completed'
                          ? 'text-nexus-green'
                          : run.status === 'failed'
                            ? 'text-nexus-red'
                            : 'text-nexus-cyan'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{run.query}</p>
                  {run.citations && (
                    <div className="flex gap-3 mt-1 text-[10px] font-mono text-muted-foreground/50">
                      <span className="text-nexus-green">
                        ✓{run.citations.filter((c) => c.status === 'verified').length} verified
                      </span>
                      <span className="text-nexus-red">
                        ✗{run.citations.filter((c) => c.status === 'killed').length} killed
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {!currentRun && history.length === 0 && !loading && (
          <div className="text-center py-16 text-muted-foreground/40">
            <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Run your first research query above.</p>
            <p className="text-xs mt-1">Four agents will execute in parallel in real time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
