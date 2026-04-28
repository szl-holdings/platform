import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart2,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  Clock,
  Code2,
  Copy,
  Download,
  FileText,
  History,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Send,
  Zap,
} from 'lucide-react';
import * as React from 'react';

function PresentationIcon2({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M2 3h20v14H2z" />
      <path d="M12 17v4m-4 0h8" />
    </svg>
  );
}

type ArtifactType =
  | 'document'
  | 'brief'
  | 'proposal'
  | 'executive-summary'
  | 'slide-deck'
  | 'spreadsheet'
  | 'sop'
  | 'faq'
  | 'meeting-summary'
  | 'action-tracker';

type ArtifactStatus = 'draft' | 'review' | 'approved' | 'published' | 'rejected';

interface ArtifactVersion {
  version: number;
  content: string;
  savedAt: string;
  summary: string;
}

interface StudioArtifact {
  id: string;
  title: string;
  type: ArtifactType;
  status: ArtifactStatus;
  content: string;
  format: 'markdown' | 'json';
  versions: ArtifactVersion[];
  createdAt: string;
  updatedAt: string;
  linkedEvidence?: string[];
  approvalNote?: string;
}

const ARTIFACT_TYPES: {
  id: ArtifactType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    id: 'document',
    label: 'Document',
    icon: FileText,
    description: 'Long-form documents and reports',
  },
  { id: 'brief', label: 'Brief', icon: BookOpen, description: '1–2 page executive briefings' },
  {
    id: 'proposal',
    label: 'Proposal',
    icon: Layers,
    description: 'Business proposals and pitches',
  },
  {
    id: 'executive-summary',
    label: 'Exec Summary',
    icon: Zap,
    description: 'Concise strategic summaries',
  },
  {
    id: 'slide-deck',
    label: 'Slide Deck',
    icon: PresentationIcon2,
    description: 'Structured slide presentations',
  },
  {
    id: 'spreadsheet',
    label: 'Spreadsheet',
    icon: BarChart2,
    description: 'Tabular data and analysis',
  },
  { id: 'sop', label: 'SOP', icon: ClipboardList, description: 'Standard operating procedures' },
  { id: 'faq', label: 'FAQ', icon: BookOpen, description: 'Frequently asked questions' },
  {
    id: 'meeting-summary',
    label: 'Meeting Notes',
    icon: FileText,
    description: 'Meeting summaries and decisions',
  },
  {
    id: 'action-tracker',
    label: 'Action Tracker',
    icon: CheckCircle,
    description: 'Task and action tracking',
  },
];

const TEMPLATES: Record<ArtifactType, string> = {
  document:
    "# Document Title\n\n## Executive Summary\n\nProvide a brief overview of the document's purpose and key findings.\n\n## Background\n\nContext and background information.\n\n## Analysis\n\nDetailed analysis and findings.\n\n## Recommendations\n\n1. Recommendation one\n2. Recommendation two\n3. Recommendation three\n\n## Next Steps\n\nImmediate actions and timeline.",
  brief:
    '# Brief — [Topic]\n\n**Date:** [Date] | **Author:** [Author] | **Classification:** Internal\n\n## Situation\n\nOne-paragraph summary of the current situation.\n\n## Key Findings\n\n- Finding 1\n- Finding 2\n- Finding 3\n\n## Recommended Action\n\nClear, single recommended course of action.\n\n## Decision Required By\n\n[Date]',
  proposal:
    '# Proposal — [Project Name]\n\n## Opportunity Overview\n\nDescribe the opportunity and why it matters.\n\n## Proposed Solution\n\nDetailed description of what is being proposed.\n\n## Investment Required\n\n| Component | Cost | Timeline |\n|-----------|------|----------|\n| Phase 1 | $X | Q1 |\n| Phase 2 | $X | Q2 |\n\n## Expected Returns\n\nProjected ROI and success metrics.\n\n## Risks & Mitigations\n\nKey risks and how they will be addressed.',
  'executive-summary':
    '# Executive Summary — [Topic]\n\n## Bottom Line Up Front\n\n**[One sentence summary of the most important point]**\n\n## Context\n\nBrief context in 2–3 sentences.\n\n## What We Found\n\n1. **Key finding 1** — supporting detail\n2. **Key finding 2** — supporting detail\n3. **Key finding 3** — supporting detail\n\n## What We Recommend\n\nSingle clear recommendation.\n\n## What We Need\n\nSpecific ask or decision required.',
  'slide-deck':
    '```json\n{\n  "title": "Presentation Title",\n  "slides": [\n    {\n      "type": "title",\n      "heading": "Presentation Title",\n      "subheading": "Subtitle or date"\n    },\n    {\n      "type": "content",\n      "heading": "Key Points",\n      "bullets": ["Point 1", "Point 2", "Point 3"]\n    },\n    {\n      "type": "data",\n      "heading": "Supporting Data",\n      "chart": { "type": "bar", "data": [] }\n    },\n    {\n      "type": "closing",\n      "heading": "Next Steps",\n      "bullets": ["Action 1", "Action 2"]\n    }\n  ]\n}\n```',
  spreadsheet:
    '# Spreadsheet Report — [Title]\n\n## Summary Metrics\n\n| Metric | Value | Change | Status |\n|--------|-------|--------|--------|\n| Revenue | $0 | +0% | 🟢 |\n| Costs | $0 | -0% | 🟢 |\n| EBITDA | $0 | +0% | 🟢 |\n\n## Detailed Breakdown\n\n| Category | Q1 | Q2 | Q3 | Q4 | Total |\n|----------|----|----|----|----|-------|\n| Item 1 | | | | | |\n| Item 2 | | | | | |\n\n## Notes\n\nFormulas and assumptions used in this report.',
  sop: '# Standard Operating Procedure — [Process Name]\n\n**Version:** 1.0 | **Effective Date:** [Date] | **Owner:** [Role]\n\n## Purpose\n\nBrief description of why this procedure exists.\n\n## Scope\n\nWho this applies to and when.\n\n## Procedure\n\n### Step 1: [Step Name]\n\n1. Action 1\n2. Action 2\n\n### Step 2: [Step Name]\n\n1. Action 1\n2. Action 2\n\n## Exceptions\n\nHow to handle edge cases.\n\n## Review Schedule\n\nThis SOP should be reviewed [quarterly/annually].',
  faq: '# Frequently Asked Questions — [Topic]\n\n## General Questions\n\n**Q: What is [topic]?**\n\nA: [Answer]\n\n**Q: How does [feature] work?**\n\nA: [Answer]\n\n## Technical Questions\n\n**Q: [Technical question]?**\n\nA: [Answer]\n\n## Support\n\n**Q: Who do I contact for help?**\n\nA: Contact [team/person] at [contact info].',
  'meeting-summary':
    '# Meeting Summary — [Meeting Name]\n\n**Date:** [Date] | **Facilitator:** [Name] | **Attendees:** [Names]\n\n## Agenda Items Covered\n\n1. Item 1\n2. Item 2\n\n## Key Decisions Made\n\n- Decision 1 — rationale\n- Decision 2 — rationale\n\n## Action Items\n\n| Action | Owner | Due Date | Status |\n|--------|-------|----------|--------|\n| | | | Pending |\n\n## Next Meeting\n\n**Date:** [Date] | **Agenda:** [Topics]',
  'action-tracker':
    '# Action Tracker — [Project/Initiative]\n\n**Last Updated:** [Date] | **Owner:** [Name]\n\n## Active Actions\n\n| # | Action | Owner | Priority | Due Date | Status | Notes |\n|---|--------|-------|----------|----------|--------|---------|\n| 1 | | | High | | In Progress | |\n| 2 | | | Medium | | Pending | |\n\n## Completed Actions\n\n| # | Action | Owner | Completed | Outcome |\n|---|--------|-------|-----------|-------|\n| | | | | |\n\n## Blocked / Escalated\n\n| # | Action | Blocked By | Escalated To |\n|---|--------|------------|--------------|',
};

const DEMO_ARTIFACTS: StudioArtifact[] = [];

const statusColors: Record<ArtifactStatus, string> = {
  draft: 'border-slate-500/20 text-slate-400',
  review: 'border-amber-500/20 text-amber-400',
  approved: 'border-emerald-500/20 text-emerald-400',
  published: 'border-blue-500/20 text-blue-400',
  rejected: 'border-rose-500/20 text-rose-400',
};

const statusIcons: Record<ArtifactStatus, React.ComponentType<{ className?: string }>> = {
  draft: FileText,
  review: Clock,
  approved: CheckCircle,
  published: Send,
  rejected: AlertCircle,
};

export default function ArtifactStudio() {
  const [artifacts, setArtifacts] = React.useState<StudioArtifact[]>(DEMO_ARTIFACTS);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createType, setCreateType] = React.useState<ArtifactType>('brief');
  const [createTitle, setCreateTitle] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showVersions, setShowVersions] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<'markdown' | 'json' | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [editingContent, setEditingContent] = React.useState<string | null>(null);

  const activeArtifact = artifacts.find((a) => a.id === activeId);
  const displayContent = editingContent !== null ? editingContent : activeArtifact?.content || '';

  const createArtifact = async () => {
    if (!createTitle.trim()) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1800));
    const id = `art-${Date.now()}`;
    const content = TEMPLATES[createType];
    const newArt: StudioArtifact = {
      id,
      title: createTitle,
      type: createType,
      status: 'draft',
      content: content.replace(/\[.*?\]/g, '…'),
      format: createType === 'slide-deck' ? 'json' : 'markdown',
      versions: [
        { version: 1, content, savedAt: new Date().toISOString(), summary: 'Initial generation' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setArtifacts((prev) => [newArt, ...prev]);
    setActiveId(id);
    setEditingContent(null);
    setIsCreating(false);
    setCreateTitle('');
    setIsGenerating(false);
  };

  const saveVersion = () => {
    if (!activeArtifact || editingContent === null) return;
    const newVersion: ArtifactVersion = {
      version: activeArtifact.versions.length + 1,
      content: editingContent,
      savedAt: new Date().toISOString(),
      summary: `Manual edit v${activeArtifact.versions.length + 1}`,
    };
    setArtifacts((prev) =>
      prev.map((a) =>
        a.id === activeId
          ? {
              ...a,
              content: editingContent,
              versions: [...a.versions, newVersion],
              updatedAt: new Date().toISOString(),
            }
          : a,
      ),
    );
    setEditingContent(null);
  };

  const submitForReview = () => {
    setArtifacts((prev) => prev.map((a) => (a.id === activeId ? { ...a, status: 'review' } : a)));
  };

  const approve = () => {
    setArtifacts((prev) => prev.map((a) => (a.id === activeId ? { ...a, status: 'approved' } : a)));
  };

  const copyContent = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerate = async () => {
    if (!activeArtifact) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsGenerating(false);
  };

  return (
    <div className="flex h-full">
      <aside
        className="w-60 shrink-0 border-r flex flex-col"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,10,16,0.6)' }}
      >
        <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[10px] uppercase tracking-widest font-medium"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Artifact Studio
            </span>
            <button
              onClick={() => setIsCreating(true)}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {artifacts.map((art) => {
            const TypeIcon = ARTIFACT_TYPES.find((t) => t.id === art.type)?.icon || FileText;
            const StatusIcon = statusIcons[art.status];
            return (
              <button
                key={art.id}
                onClick={() => {
                  setActiveId(art.id);
                  setEditingContent(null);
                  setShowVersions(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${activeId === art.id ? 'text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                style={{ background: activeId === art.id ? 'rgba(75,139,219,0.08)' : undefined }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <TypeIcon className="w-3 h-3 shrink-0" />
                  <span className="font-medium truncate">{art.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusIcon className="w-2.5 h-2.5" />
                  <span className="text-[10px] capitalize opacity-70">{art.status}</span>
                  <span className="text-[10px] opacity-40 ml-auto">v{art.versions.length}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] uppercase tracking-widest text-slate-700 mb-1.5 px-1">
            Artifact Types
          </div>
          <div className="flex flex-wrap gap-1 px-1">
            {ARTIFACT_TYPES.slice(0, 6).map((t) => (
              <span
                key={t.id}
                className="text-[9px] px-1.5 py-0.5 rounded border border-white/6 text-slate-600"
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#0d1117] border border-white/10 rounded-xl p-6 w-full max-w-lg"
              >
                <h3 className="text-base font-bold text-white mb-4">Create New Artifact</h3>
                <div className="mb-4">
                  <label className="text-xs text-slate-500 mb-1.5 block">Artifact Type</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                    {ARTIFACT_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setCreateType(t.id)}
                        className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${createType === t.id ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-white/8 text-slate-400 hover:border-white/15'}`}
                      >
                        <div className="flex items-center gap-2">
                          <t.icon className="w-3.5 h-3.5 shrink-0" />
                          <div>
                            <div className="font-medium">{t.label}</div>
                            <div className="text-[10px] opacity-70">{t.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-slate-500 mb-1.5 block">Title</label>
                  <input
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createArtifact()}
                    placeholder="Artifact title…"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={createArtifact}
                    disabled={!createTitle.trim() || isGenerating}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 transition-colors text-sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> Generate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:border-white/20 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeArtifact ? (
          <>
            <div
              className="shrink-0 border-b px-5 py-2 flex items-center justify-between gap-3"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border capitalize shrink-0 ${statusColors[activeArtifact.status]}`}
                >
                  {activeArtifact.status}
                </span>
                <h2 className="text-sm font-semibold text-white truncate">
                  {activeArtifact.title}
                </h2>
                <span className="text-[10px] text-slate-600 shrink-0">
                  v{activeArtifact.versions.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowVersions(!showVersions)}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20 transition-colors"
                >
                  <History className="w-3 h-3" /> History
                </button>
                <button
                  onClick={copyContent}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-white/10 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={regenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-white/10 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Regen
                </button>
                {activeArtifact.status === 'draft' && (
                  <button
                    onClick={submitForReview}
                    className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    <Send className="w-3 h-3" /> Submit for Review
                  </button>
                )}
                {activeArtifact.status === 'review' && (
                  <button
                    onClick={approve}
                    className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                )}
                <div className="relative">
                  <button
                    onClick={() => setExportFormat(exportFormat ? null : 'markdown')}
                    className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Export <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                  {exportFormat && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-[#0d1117] border border-white/10 rounded-lg overflow-hidden z-10">
                      {(['markdown', 'json', 'pdf'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setExportFormat(null)}
                          className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                        >
                          {fmt === 'json' ? (
                            <Code2 className="w-3 h-3" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          {fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showVersions && (
              <div
                className="shrink-0 border-b px-5 py-3"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {activeArtifact.versions.map((v) => (
                    <div
                      key={v.version}
                      className="shrink-0 p-2 border border-white/8 rounded-lg text-[10px] min-w-[120px]"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-white">v{v.version}</span>
                        <button className="text-blue-400 hover:underline">Restore</button>
                      </div>
                      <div className="text-slate-500">{v.summary}</div>
                      <div className="text-slate-700 mt-0.5">
                        {new Date(v.savedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeArtifact.linkedEvidence && activeArtifact.linkedEvidence.length > 0 && (
              <div
                className="shrink-0 px-5 py-2 border-b flex items-center gap-2"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <span className="text-[10px] text-slate-600">Evidence:</span>
                {activeArtifact.linkedEvidence.map((e) => (
                  <span
                    key={e}
                    className="text-[10px] px-2 py-0.5 rounded border border-blue-500/15 text-blue-500/70"
                  >
                    {e}
                  </span>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              <textarea
                value={displayContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full h-full min-h-[500px] bg-white/2 border border-white/8 rounded-xl p-4 text-sm text-slate-200 font-mono resize-none outline-none focus:border-blue-500/20 leading-relaxed"
                placeholder="Artifact content…"
              />
            </div>

            {editingContent !== null && (
              <div
                className="shrink-0 border-t px-5 py-2 flex items-center justify-between"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <span className="text-[11px] text-slate-600">Unsaved changes</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingContent(null)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-500 hover:border-white/20 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={saveVersion}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Version
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-10 h-10 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">Select an artifact or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
