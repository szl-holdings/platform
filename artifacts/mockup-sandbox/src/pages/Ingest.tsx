import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Github,
  Loader,
  Plus,
  RefreshCw,
  RotateCw,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { nexusApi } from '../lib/api';
import type { IngestJob } from '../lib/types';

const SEED_REPOS = [
  'https://github.com/anthropics/claude-code',
  'https://github.com/anthropics/anthropic-cookbook',
  'https://github.com/grapeot/WhatTheFuck',
  'https://github.com/heshengtao/comfyui-claude',
  'https://github.com/RafalWilinski/claude-squad',
  'https://github.com/Doriandarko/claude-engineer',
  'https://github.com/anthropics/courses',
  'https://github.com/heshengtao/comfyui_LLM_party',
  'https://github.com/disler/multi-agent-postgres-data-analytics',
  'https://github.com/g1ibby/claude-mcp-tools',
];

const STATUS_META: Record<
  IngestJob['status'],
  {
    color: string;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }
> = {
  queued: { color: '#8896aa', label: 'Queued', icon: Clock },
  fetching: { color: '#00d4ff', label: 'Fetching', icon: Download },
  adapting: { color: '#a855f7', label: 'Adapting', icon: RefreshCw },
  publishing: { color: '#ffb700', label: 'Publishing', icon: RefreshCw },
  done: { color: '#00ff88', label: 'Done', icon: CheckCircle },
  failed: { color: '#ff4455', label: 'Failed', icon: XCircle },
};

export default function Ingest() {
  const [jobs, setJobs] = useState<IngestJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchJobs() {
    try {
      const data = await nexusApi.listIngestJobs();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ingest jobs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
    pollRef.current = setInterval(fetchJobs, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleIngest(url?: string) {
    const finalUrl = url ?? newUrl;
    if (!finalUrl.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await nexusApi.startIngest(finalUrl.trim());
      setNewUrl('');
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start ingest');
    } finally {
      setSubmitting(false);
    }
  }

  const activeJobs = jobs.filter((j) => j.status !== 'done' && j.status !== 'failed');
  const completedJobs = jobs.filter((j) => j.status === 'done' || j.status === 'failed');

  return (
    <div className="min-h-full bg-nexus-bg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-5 h-5 text-nexus-cyan" />
          <div>
            <h1 className="text-lg font-semibold">Repo Ingest</h1>
            <p className="text-xs text-muted-foreground">
              Fetch → Adapt → Publish · Skills Library powered by public repos
            </p>
          </div>
          <button
            onClick={fetchJobs}
            className="ml-auto p-2 rounded-lg border border-nexus text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-nexus-surface border border-[#00d4ff]/20 rounded-xl p-5 mb-6">
          <h2 className="text-xs font-mono text-nexus-cyan uppercase tracking-widest mb-3">
            Ingest New Repository
          </h2>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleIngest();
                }}
                className="w-full bg-nexus-bg border border-nexus rounded-lg pl-9 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#00d4ff]/50 placeholder:text-muted-foreground/30"
              />
            </div>
            <button
              onClick={() => handleIngest()}
              disabled={submitting || !newUrl.trim()}
              className="px-4 py-2 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-nexus-cyan text-sm font-medium hover:bg-[#00d4ff]/20 disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Ingest
            </button>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground/50 mb-2">
              Seed the library with these repos:
            </p>
            <div className="flex flex-wrap gap-2">
              {SEED_REPOS.map((repo) => {
                const name = repo.split('/').slice(-2).join('/');
                const alreadyIngested = jobs.some(
                  (j) => j.repoUrl === repo || j.repoName === name.split('/')[1],
                );
                return (
                  <button
                    key={repo}
                    onClick={() => handleIngest(repo)}
                    disabled={alreadyIngested || submitting}
                    className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
                      alreadyIngested
                        ? 'border-[#00ff88]/30 text-nexus-green/60 cursor-default'
                        : 'border-nexus text-muted-foreground/60 hover:text-muted-foreground hover:border-[#00d4ff]/20'
                    }`}
                  >
                    {alreadyIngested && <CheckCircle className="w-2.5 h-2.5" />}
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-[#ff4455]/10 border border-[#ff4455]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-nexus-red shrink-0" />
            <p className="text-xs text-nexus-red">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground/40" />
          </div>
        ) : (
          <>
            {activeJobs.length > 0 && (
              <section className="mb-6">
                <h2 className="text-[10px] font-mono text-nexus-cyan uppercase tracking-widest mb-3">
                  Active Jobs
                </h2>
                <div className="space-y-2">
                  {activeJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      expanded={expanded === job.id}
                      onExpand={() => setExpanded((e) => (e === job.id ? null : job.id))}
                      onRetry={async (id) => {
                        setError(null);
                        try {
                          await nexusApi.retryIngest(id);
                          await fetchJobs();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Retry failed');
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {completedJobs.length > 0 && (
              <section>
                <h2 className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-3">
                  Completed Jobs
                </h2>
                <div className="space-y-2">
                  {completedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      expanded={expanded === job.id}
                      onExpand={() => setExpanded((e) => (e === job.id ? null : job.id))}
                      onRetry={async (id) => {
                        setError(null);
                        try {
                          await nexusApi.retryIngest(id);
                          await fetchJobs();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Retry failed');
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {jobs.length === 0 && (
              <div className="text-center py-16 text-muted-foreground/40">
                <Download className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No ingest jobs yet.</p>
                <p className="text-xs mt-1">
                  Enter a GitHub repo URL above to start ingesting skills.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function JobCard({
  job,
  expanded,
  onExpand,
  onRetry,
}: {
  job: IngestJob;
  expanded: boolean;
  onExpand: () => void;
  onRetry: (id: string) => Promise<void>;
}) {
  const meta = STATUS_META[job.status];
  const StatusIcon = meta.icon;
  const isActive = job.status !== 'done' && job.status !== 'failed';
  const [retrying, setRetrying] = useState(false);

  return (
    <div
      className={`rounded-lg border bg-nexus-surface overflow-hidden transition-all ${
        job.status === 'done'
          ? 'border-[#00ff88]/20'
          : job.status === 'failed'
            ? 'border-[#ff4455]/20'
            : 'border-[#00d4ff]/20'
      }`}
    >
      <button onClick={onExpand} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
        )}
        <StatusIcon
          className={`w-3.5 h-3.5 shrink-0 ${isActive && job.status !== 'queued' ? 'animate-spin' : ''}`}
          style={{ color: meta.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold truncate">{job.repoName}</span>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: meta.color, backgroundColor: `${meta.color}15` }}
            >
              {meta.label}
            </span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/50 truncate">
            {job.repoUrl}
          </div>
        </div>
        {job.skillsGenerated > 0 && (
          <div className="text-[10px] font-mono text-nexus-green shrink-0">
            +{job.skillsGenerated} skills
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-nexus pt-3 space-y-3">
          {job.patternsFound.length > 0 && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">
                Patterns Found
              </label>
              <div className="flex flex-wrap gap-1.5">
                {job.patternsFound.map((p) => (
                  <span
                    key={p}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-nexus-bg border border-nexus text-muted-foreground/60"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {job.log.length > 0 && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">
                Log
              </label>
              <div className="bg-nexus-bg rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                {job.log.map((entry, i) => (
                  <div key={i} className="text-[10px] font-mono text-muted-foreground/70">
                    <span className="text-muted-foreground/30 mr-2">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}
          {job.error && (
            <div className="bg-[#ff4455]/05 border border-[#ff4455]/20 rounded-lg p-3">
              <p className="text-xs text-nexus-red font-mono">{job.error}</p>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-4 text-[10px] font-mono text-muted-foreground/40">
              <span>Started: {new Date(job.createdAt).toLocaleString()}</span>
              {job.completedAt && (
                <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
              )}
            </div>
            {job.status === 'failed' && (
              <button
                onClick={async () => {
                  setRetrying(true);
                  try {
                    await onRetry(job.id);
                  } finally {
                    setRetrying(false);
                  }
                }}
                disabled={retrying}
                className="text-[10px] font-mono px-2 py-1 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-nexus-cyan hover:bg-[#00d4ff]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0"
              >
                {retrying ? (
                  <Loader className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCw className="w-3 h-3" />
                )}
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
