import {
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Download,
  Layers,
  Loader,
  Plus,
  RefreshCw,
  RotateCw,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface SkillEntry {
  name: string;
  category: string;
  description: string;
}

interface MemoryEntry {
  id: string;
  type: string;
  content: string;
  tags: string[];
}

interface IngestJobLocal {
  id: string;
  repoName: string;
  repoUrl: string;
  status: 'queued' | 'cloning' | 'parsing' | 'extracting' | 'indexing' | 'done' | 'failed';
  progress: number;
  log: string[];
  skillsGenerated: number;
  memoriesGenerated: number;
  patternsFound: string[];
  skills: SkillEntry[];
  memories: MemoryEntry[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

const FAKE_REPOS = [
  {
    url: 'https://github.com/anthropics/claude-code',
    name: 'claude-code',
    org: 'anthropics',
    skills: [
      { name: 'code_review_agent', category: 'Engineering', description: 'Reviews code diffs for quality, correctness, and maintainability issues.' },
      { name: 'test_generator', category: 'Engineering', description: 'Generates unit and integration test stubs from function signatures.' },
      { name: 'refactor_planner', category: 'Engineering', description: 'Plans safe refactoring sequences with rollback checkpoints.' },
    ],
    memories: [
      { id: 'mem-cc-1', type: 'pattern', content: 'Claude Code uses a tool-call loop with explicit step logging at each agent action.', tags: ['agent-loop', 'observability'] },
      { id: 'mem-cc-2', type: 'convention', content: 'All file edits are preceded by a read-to-confirm step to avoid clobbering unseen changes.', tags: ['safety', 'file-ops'] },
    ],
    patterns: ['Tool-Call Loop', 'Explicit Step Logging', 'Read-Before-Edit'],
  },
  {
    url: 'https://github.com/anthropics/anthropic-cookbook',
    name: 'anthropic-cookbook',
    org: 'anthropics',
    skills: [
      { name: 'prompt_caching', category: 'LLM', description: 'Implements prompt caching patterns to reduce latency and cost on repeated context.' },
      { name: 'structured_output', category: 'LLM', description: 'Extracts typed JSON from Claude using tool_use and schema validation.' },
      { name: 'vision_analyst', category: 'Multimodal', description: 'Analyzes images and documents using Claude vision capabilities.' },
    ],
    memories: [
      { id: 'mem-cb-1', type: 'pattern', content: 'Cookbook patterns use system prompt prefill for consistent output formatting.', tags: ['prompt-engineering', 'output-format'] },
      { id: 'mem-cb-2', type: 'technique', content: 'Extended thinking (budget_tokens) improves accuracy on complex multi-step reasoning tasks.', tags: ['extended-thinking', 'accuracy'] },
    ],
    patterns: ['Prompt Caching', 'Structured Output', 'Tool-Use Schema', 'Vision Pipeline'],
  },
  {
    url: 'https://github.com/grapeot/WhatTheFuck',
    name: 'WhatTheFuck',
    org: 'grapeot',
    skills: [
      { name: 'error_explainer', category: 'DevOps', description: 'Explains cryptic shell errors in plain language with actionable fixes.' },
      { name: 'command_suggester', category: 'DevOps', description: 'Suggests the correct shell command given a natural language description.' },
    ],
    memories: [
      { id: 'mem-wtf-1', type: 'pattern', content: 'Error explanation pipeline: capture stderr → classify → explain → suggest fix → optionally execute.', tags: ['error-handling', 'devops'] },
    ],
    patterns: ['Error Classification', 'Fix Suggestion Loop'],
  },
  {
    url: 'https://github.com/Doriandarko/claude-engineer',
    name: 'claude-engineer',
    org: 'Doriandarko',
    skills: [
      { name: 'file_system_agent', category: 'Engineering', description: 'Manages file system operations (create, read, update, delete) with safety guards.' },
      { name: 'code_execution_agent', category: 'Engineering', description: 'Executes Python code in a sandboxed environment and returns output.' },
      { name: 'dependency_installer', category: 'Engineering', description: 'Installs and validates Python package dependencies automatically.' },
    ],
    memories: [
      { id: 'mem-ce-1', type: 'architecture', content: 'Claude Engineer uses an autonomous loop with tool calls for file ops, web search, and code execution.', tags: ['autonomous-agent', 'tool-use'] },
      { id: 'mem-ce-2', type: 'safety', content: 'File deletion always requires explicit user confirmation before executing.', tags: ['safety', 'human-in-loop'] },
    ],
    patterns: ['Autonomous Agent Loop', 'Sandboxed Execution', 'Confirmation Gate'],
  },
  {
    url: 'https://github.com/RafalWilinski/claude-squad',
    name: 'claude-squad',
    org: 'RafalWilinski',
    skills: [
      { name: 'multi_agent_coordinator', category: 'Orchestration', description: 'Coordinates multiple Claude instances working in parallel on sub-tasks.' },
      { name: 'task_splitter', category: 'Orchestration', description: 'Splits a complex task into parallelizable sub-tasks with dependency tracking.' },
      { name: 'result_merger', category: 'Orchestration', description: 'Merges results from parallel agent runs with deduplication and conflict resolution.' },
    ],
    memories: [
      { id: 'mem-cs-1', type: 'architecture', content: 'Claude Squad spins up isolated agent instances per sub-task, each with its own context window.', tags: ['multi-agent', 'parallelism'] },
    ],
    patterns: ['Multi-Agent Parallelism', 'Task Decomposition', 'Result Merging'],
  },
];

const STAGE_LABELS: Record<IngestJobLocal['status'], string> = {
  queued: 'Queued',
  cloning: 'Cloning repo',
  parsing: 'Parsing files',
  extracting: 'Extracting skills & memory',
  indexing: 'Indexing to library',
  done: 'Done',
  failed: 'Failed',
};

const STAGE_COLORS: Record<IngestJobLocal['status'], string> = {
  queued: '#8896aa',
  cloning: 'var(--gi-accent-blue)',
  parsing: 'var(--gi-accent-violet)',
  extracting: 'var(--gi-accent-amber)',
  indexing: 'var(--gi-accent-teal)',
  done: 'var(--gi-accent-green)',
  failed: 'var(--gi-accent-red)',
};

const STAGES: IngestJobLocal['status'][] = ['queued', 'cloning', 'parsing', 'extracting', 'indexing', 'done'];
const STAGE_LOG: Record<string, string[]> = {
  cloning: ['Authenticating with GitHub…', 'git clone --depth=1 in progress…', 'Received {size} MB in {files} files.'],
  parsing: ['Scanning file tree for source files…', 'Identified {files} .ts/.tsx/.py files.', 'Parsing AST for exported symbols…'],
  extracting: ['Running skill extractor on {files} files…', 'Found {skills} candidate skill patterns.', 'Running memory extractor on documentation…', 'Extracted {memories} memory entries.'],
  indexing: ['Writing {skills} skills to library…', 'Writing {memories} memory entries…', 'Updating pattern atlas with {patterns} patterns…', 'Indexing complete.'],
};

function generateId(): string {
  return 'ingest_' + Math.random().toString(36).slice(2, 10);
}

async function runIngestSimulation(
  job: IngestJobLocal,
  repoMeta: typeof FAKE_REPOS[0],
  onUpdate: (updater: (j: IngestJobLocal) => IngestJobLocal) => void,
) {
  for (let si = 1; si < STAGES.length - 1; si++) {
    const stage = STAGES[si];
    const logs = STAGE_LOG[stage] ?? [];

    onUpdate((j) => ({ ...j, status: stage, progress: (si / (STAGES.length - 2)) * 80 }));

    for (const log of logs) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
      const filled = log
        .replace('{size}', String((Math.random() * 8 + 1).toFixed(1)))
        .replace('{files}', String(Math.floor(Math.random() * 80 + 20)))
        .replace('{skills}', String(repoMeta.skills.length))
        .replace('{memories}', String(repoMeta.memories.length))
        .replace('{patterns}', String(repoMeta.patterns.length));
      onUpdate((j) => ({ ...j, log: [...j.log, filled] }));
    }
  }

  await new Promise((r) => setTimeout(r, 300));
  onUpdate((j) => ({
    ...j,
    status: 'done',
    progress: 100,
    log: [...j.log, `✓ Ingest complete — ${repoMeta.skills.length} skills, ${repoMeta.memories.length} memories, ${repoMeta.patterns.length} patterns.`],
    skillsGenerated: repoMeta.skills.length,
    memoriesGenerated: repoMeta.memories.length,
    patternsFound: repoMeta.patterns,
    skills: repoMeta.skills,
    memories: repoMeta.memories,
    completedAt: new Date().toISOString(),
  }));
}

export default function Ingest() {
  const [jobs, setJobs] = useState<IngestJobLocal[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const runningRef = useRef<Set<string>>(new Set());

  function updateJob(id: string, updater: (j: IngestJobLocal) => IngestJobLocal) {
    setJobs((prev) => prev.map((j) => (j.id === id ? updater(j) : j)));
  }

  const handleIngest = useCallback(
    async (url?: string) => {
      const finalUrl = (url ?? newUrl).trim();
      if (!finalUrl) return;

      const repoMeta = FAKE_REPOS.find((r) => r.url === finalUrl) ?? {
        url: finalUrl,
        name: finalUrl.split('/').pop() ?? 'repo',
        org: finalUrl.split('/').slice(-2, -1)[0] ?? 'unknown',
        skills: [
          { name: 'general_assistant', category: 'General', description: 'General-purpose assistant skill extracted from repo.' },
        ],
        memories: [
          { id: 'mem-gen-1', type: 'pattern', content: `Key patterns extracted from ${finalUrl.split('/').pop()}.`, tags: ['extracted'] },
        ],
        patterns: ['Extracted Pattern'],
      };

      const job: IngestJobLocal = {
        id: generateId(),
        repoName: repoMeta.name,
        repoUrl: finalUrl,
        status: 'queued',
        progress: 0,
        log: [`Queued ingest for ${finalUrl}`],
        skillsGenerated: 0,
        memoriesGenerated: 0,
        patternsFound: [],
        skills: [],
        memories: [],
        createdAt: new Date().toISOString(),
      };

      setJobs((prev) => [job, ...prev]);
      setNewUrl('');
      setSubmitting(false);

      if (runningRef.current.has(finalUrl)) return;
      runningRef.current.add(finalUrl);

      await runIngestSimulation(job, repoMeta, (updater) => updateJob(job.id, updater));
      runningRef.current.delete(finalUrl);
    },
    [newUrl],
  );

  const activeJobs = jobs.filter((j) => j.status !== 'done' && j.status !== 'failed');
  const completedJobs = jobs.filter((j) => j.status === 'done' || j.status === 'failed');
  const alreadyIngested = new Set(jobs.map((j) => j.repoUrl));

  return (
    <div className="min-h-full bg-praxis-bg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-5 h-5 text-praxis-cyan" />
          <div>
            <h1 className="text-lg font-semibold">Repo Ingest</h1>
            <p className="text-xs text-muted-foreground">Fetch → Parse → Extract → Index · Skills Library powered by public repos</p>
          </div>
        </div>

        <div className="bg-praxis-surface border border-praxis-cyan/20 rounded-xl p-5 mb-6">
          <h2 className="text-xs font-mono text-praxis-cyan uppercase tracking-widest mb-3">Ingest New Repository</h2>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSubmitting(true); handleIngest(); } }}
                className="w-full bg-praxis-bg border border-praxis rounded-lg pl-9 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:border-praxis-cyan/50 placeholder:text-muted-foreground/30"
              />
            </div>
            <button
              onClick={() => { setSubmitting(true); handleIngest(); }}
              disabled={submitting || !newUrl.trim()}
              className="px-4 py-2 rounded-lg bg-praxis-cyan/10 border border-praxis-cyan/30 text-praxis-cyan text-sm font-medium hover:bg-praxis-cyan/20 disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ingest
            </button>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground/50 mb-2">Seed the library with these repos:</p>
            <div className="flex flex-wrap gap-2">
              {FAKE_REPOS.map((repo) => {
                const ingested = alreadyIngested.has(repo.url);
                return (
                  <button
                    key={repo.url}
                    onClick={() => { if (!ingested) { setSubmitting(true); handleIngest(repo.url); } }}
                    disabled={ingested || submitting}
                    className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors flex items-center gap-1 ${ingested ? 'border-praxis-green/30 text-praxis-green/60 cursor-default' : 'border-praxis text-muted-foreground/60 hover:text-muted-foreground hover:border-praxis-cyan/20'}`}
                  >
                    {ingested && <CheckCircle className="w-2.5 h-2.5" />}
                    {repo.org}/{repo.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {activeJobs.length > 0 && (
          <section className="mb-6">
            <h2 className="text-[10px] font-mono text-praxis-cyan uppercase tracking-widest mb-3">Active Jobs</h2>
            <div className="space-y-2">
              {activeJobs.map((job) => (
                <JobCard key={job.id} job={job} expanded={expanded === job.id} onExpand={() => setExpanded((e) => (e === job.id ? null : job.id))} />
              ))}
            </div>
          </section>
        )}

        {completedJobs.length > 0 && (
          <section>
            <h2 className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-3">Completed Jobs</h2>
            <div className="space-y-2">
              {completedJobs.map((job) => (
                <JobCard key={job.id} job={job} expanded={expanded === job.id} onExpand={() => setExpanded((e) => (e === job.id ? null : job.id))} />
              ))}
            </div>
          </section>
        )}

        {jobs.length === 0 && (
          <div className="text-center py-16 text-muted-foreground/40">
            <Download className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No ingest jobs yet.</p>
            <p className="text-xs mt-1">Pick a repo above or enter a GitHub URL to start ingesting skills.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const color = value === 100 ? 'var(--gi-accent-green)' : 'var(--gi-accent-blue)';
  return (
    <div className="h-1 rounded-full bg-praxis-bg overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

function JobCard({ job, expanded, onExpand }: { job: IngestJobLocal; expanded: boolean; onExpand: () => void }) {
  const statusColor = STAGE_COLORS[job.status];
  const isActive = job.status !== 'done' && job.status !== 'failed';
  const isSpinning = ['cloning', 'parsing', 'extracting', 'indexing'].includes(job.status);

  return (
    <div className={`rounded-lg border bg-praxis-surface overflow-hidden transition-all ${job.status === 'done' ? 'border-praxis-green/20' : job.status === 'failed' ? 'border-praxis-red/20' : 'border-praxis-cyan/20'}`}>
      <button onClick={onExpand} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />}
        {job.status === 'done' ? (
          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-praxis-green" />
        ) : job.status === 'failed' ? (
          <XCircle className="w-3.5 h-3.5 shrink-0 text-praxis-red" />
        ) : job.status === 'queued' ? (
          <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: statusColor }} />
        ) : (
          <Loader className={`w-3.5 h-3.5 shrink-0 ${isSpinning ? 'animate-spin' : ''}`} style={{ color: statusColor }} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold truncate">{job.repoName}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: statusColor, backgroundColor: `${statusColor}15` }}>{STAGE_LABELS[job.status]}</span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/50 truncate">{job.repoUrl}</div>
          {isActive && <div className="mt-1.5"><ProgressBar value={job.progress} /></div>}
        </div>
        {job.skillsGenerated > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-[10px] font-mono text-praxis-green flex items-center gap-1"><Layers className="w-3 h-3" />+{job.skillsGenerated} skills</div>
            {job.memoriesGenerated > 0 && <div className="text-[10px] font-mono text-praxis-cyan flex items-center gap-1"><Brain className="w-3 h-3" />+{job.memoriesGenerated} mem</div>}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-praxis pt-3 space-y-3">
          {job.patternsFound.length > 0 && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">Patterns Found</label>
              <div className="flex flex-wrap gap-1.5">
                {job.patternsFound.map((p) => (
                  <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-praxis-bg border border-praxis text-muted-foreground/60">{p}</span>
                ))}
              </div>
            </div>
          )}

          {job.skills.length > 0 && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-2 block">Skills Extracted</label>
              <div className="space-y-1.5">
                {job.skills.map((s) => (
                  <div key={s.name} className="bg-praxis-bg rounded-lg px-3 py-2 flex items-start gap-2">
                    <Zap className="w-3 h-3 text-praxis-green mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-mono font-semibold text-praxis-green">{s.name}</div>
                      <div className="text-[9px] text-muted-foreground/50">{s.category} · {s.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {job.memories.length > 0 && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-2 block">Memory Entries</label>
              <div className="space-y-1.5">
                {job.memories.map((m) => (
                  <div key={m.id} className="bg-praxis-bg rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Brain className="w-3 h-3 text-praxis-cyan shrink-0" />
                      <span className="text-[9px] font-mono text-praxis-cyan">{m.type}</span>
                      {m.tags.map((t) => <span key={t} className="text-[8px] font-mono px-1 rounded bg-praxis-cyan/10 text-praxis-cyan/70">{t}</span>)}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60">{m.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {job.log.length > 0 && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">Log</label>
              <div className="bg-praxis-bg rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                {job.log.map((entry, i) => (
                  <div key={i} className="text-[10px] font-mono text-muted-foreground/70">
                    <span className="text-muted-foreground/30 mr-2">{String(i + 1).padStart(2, '0')}</span>
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/40">
            <span>Started: {new Date(job.createdAt).toLocaleString()}</span>
            {job.completedAt && <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
